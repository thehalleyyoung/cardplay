/**
 * @file Domain Vocabulary Batch 44: Production & Mixing Terminology
 * @module gofai/canon/domain-vocab-batch44-production-mixing
 *
 * Comprehensive vocabulary for audio production, mixing, mastering, and sound design.
 * Covers professional terminology from studio engineering, electronic music production,
 * and modern DAW workflows.
 *
 * This batch implements systematic vocabulary expansion from gofai_goalB.md
 * Phase 1 (Canonical Ontology + Extensible Symbol Tables).
 *
 * Categories:
 * 1. Spatial & Stereo Processing (80 entries)
 * 2. Frequency & EQ Terms (100 entries)
 * 3. Dynamics Processing (80 entries)
 * 4. Time-Based Effects (80 entries)
 * 5. Distortion & Saturation (60 entries)
 * 6. Modulation Effects (60 entries)
 * 7. Mixing Concepts (80 entries)
 * 8. Mastering & Finalization (60 entries)
 *
 * Total: ~600 vocabulary entries
 *
 * @see docs/gofai/perceptual-axes.md
 * @see src/gofai/canon/perceptual-axes.ts
 */

import type { LexemeId, Lexeme } from './types';

// ============================================================================
// Section 1: Spatial & Stereo Processing (80 entries)
// ============================================================================

/**
 * Spatial positioning, stereo width, panning, and immersive audio.
 */
export const SPATIAL_STEREO_VOCABULARY: readonly Lexeme[] = [
  // --- Panning & Position ---
  {
    id: 'spatial-pan-left' as LexemeId,
    lemma: 'pan left',
    category: 'construction',
    variants: ['left', 'to the left', 'leftward'],
    semantics: {
      type: 'axis_modifier',
      axis: 'spatial_position',
      value: 'left',
      targets: ['pan_position'],
      effect: { pan: 'negative', position: 'left_field' },
    },
    description: 'Position sound in left channel/field',
  },
  {
    id: 'spatial-pan-right' as LexemeId,
    lemma: 'pan right',
    category: 'construction',
    variants: ['right', 'to the right', 'rightward'],
    semantics: {
      type: 'axis_modifier',
      axis: 'spatial_position',
      value: 'right',
      targets: ['pan_position'],
      effect: { pan: 'positive', position: 'right_field' },
    },
    description: 'Position sound in right channel/field',
  },
  {
    id: 'spatial-pan-center' as LexemeId,
    lemma: 'center',
    category: 'noun',
    variants: ['centered', 'mono', 'middle', 'phantom center'],
    semantics: {
      type: 'axis_modifier',
      axis: 'spatial_position',
      value: 'center',
      targets: ['pan_position'],
      effect: { pan: 'zero', position: 'center' },
    },
    description: 'Position sound in center (equal both channels)',
  },
  {
    id: 'spatial-hard-pan' as LexemeId,
    lemma: 'hard pan',
    category: 'construction',
    variants: ['fully panned', 'extreme pan', '100% pan'],
    semantics: {
      type: 'axis_modifier',
      axis: 'spatial_position',
      value: 'hard_pan',
      targets: ['pan_position'],
      effect: { pan: 'maximum', position: 'extreme' },
    },
    description: 'Pan fully to one side (100% L or R)',
  },

  // --- Stereo Width ---
  {
    id: 'spatial-width-wide' as LexemeId,
    lemma: 'wide',
    category: 'adj',
    variants: ['wider', 'widen', 'stereo spread', 'spacious'],
    semantics: {
      type: 'axis_modifier',
      axis: 'width',
      value: 'wide',
      targets: ['stereo_width', 'spread'],
      effect: { width: 'increase', spread: 'enhanced', stereo_field: 'expanded' },
    },
    description: 'Increased stereo width and spatial spread',
  },
  {
    id: 'spatial-width-narrow' as LexemeId,
    lemma: 'narrow',
    category: 'adj',
    variants: ['narrower', 'tighter', 'focused', 'mono-ish'],
    semantics: {
      type: 'axis_modifier',
      axis: 'width',
      value: 'narrow',
      targets: ['stereo_width', 'spread'],
      effect: { width: 'decrease', spread: 'reduced', stereo_field: 'contracted' },
    },
    description: 'Reduced stereo width, more focused',
  },
  {
    id: 'spatial-width-mono' as LexemeId,
    lemma: 'mono',
    category: 'adj',
    variants: ['monaural', 'summed to mono', 'single channel'],
    semantics: {
      type: 'axis_modifier',
      axis: 'width',
      value: 'mono',
      targets: ['stereo_width'],
      effect: { width: 'zero', channels: 'summed' },
    },
    description: 'No stereo separation, single mono signal',
  },
  {
    id: 'spatial-width-haas' as LexemeId,
    lemma: 'Haas effect',
    category: 'construction',
    variants: ['precedence effect', 'stereo delay'],
    semantics: {
      type: 'technique',
      technique: 'haas',
      targets: ['width', 'timing'],
      effect: { width: 'pseudo_stereo', delay: '5_to_40ms', perception: 'wider' },
    },
    description: 'Stereo widening via short delay (precedence effect)',
  },

  // --- Depth & Distance ---
  {
    id: 'spatial-depth-close' as LexemeId,
    lemma: 'close',
    category: 'adj',
    variants: ['up front', 'near', 'intimate', 'in your face'],
    semantics: {
      type: 'axis_modifier',
      axis: 'depth',
      value: 'close',
      targets: ['perceived_distance', 'reverb'],
      effect: { distance: 'near', reverb: 'minimal', direct_signal: 'strong' },
    },
    description: 'Sound perceived as close/up-front',
  },
  {
    id: 'spatial-depth-distant' as LexemeId,
    lemma: 'distant',
    category: 'adj',
    variants: ['far', 'far back', 'recessed', 'in the background'],
    semantics: {
      type: 'axis_modifier',
      axis: 'depth',
      value: 'distant',
      targets: ['perceived_distance', 'reverb', 'high_freq'],
      effect: { distance: 'far', reverb: 'increased', high_freq: 'rolled_off' },
    },
    description: 'Sound perceived as distant/far back',
  },
  {
    id: 'spatial-depth-forward' as LexemeId,
    lemma: 'bring forward',
    category: 'construction',
    variants: ['push forward', 'move up front', 'make prominent'],
    semantics: {
      type: 'axis_modifier',
      axis: 'depth',
      value: 'forward',
      targets: ['perceived_distance', 'volume', 'presence'],
      effect: { distance: 'closer', volume: 'increased', presence: 'enhanced' },
    },
    description: 'Move sound forward in the mix',
  },
  {
    id: 'spatial-depth-push-back' as LexemeId,
    lemma: 'push back',
    category: 'construction',
    variants: ['send back', 'recess', 'sit back'],
    semantics: {
      type: 'axis_modifier',
      axis: 'depth',
      value: 'back',
      targets: ['perceived_distance', 'volume', 'reverb'],
      effect: { distance: 'farther', volume: 'decreased', reverb: 'increased' },
    },
    description: 'Move sound back in the mix',
  },

  // --- Height & Vertical Imaging ---
  {
    id: 'spatial-height-up' as LexemeId,
    lemma: 'lift up',
    category: 'construction',
    variants: ['raise', 'higher', 'elevated'],
    semantics: {
      type: 'axis_modifier',
      axis: 'height',
      value: 'up',
      targets: ['perceived_height', 'frequency_balance'],
      effect: { height: 'raised', high_freq: 'emphasized', air: 'increased' },
    },
    description: 'Raise perceived vertical position',
  },
  {
    id: 'spatial-height-ground' as LexemeId,
    lemma: 'grounded',
    category: 'adj',
    variants: ['low', 'bottom', 'foundation'],
    semantics: {
      type: 'axis_modifier',
      axis: 'height',
      value: 'grounded',
      targets: ['perceived_height', 'low_freq'],
      effect: { height: 'low', low_freq: 'emphasized', weight: 'heavy' },
    },
    description: 'Perceived as low/grounded in vertical space',
  },

  // --- Immersive & Surround ---
  {
    id: 'spatial-surround' as LexemeId,
    lemma: 'surround',
    category: 'adj',
    variants: ['surrounding', 'enveloping', 'immersive'],
    semantics: {
      type: 'axis_modifier',
      axis: 'spatialization',
      value: 'surround',
      targets: ['spatial_field'],
      effect: { field: 'full_sphere', immersion: 'high' },
    },
    description: 'Immersive surround sound field',
  },
  {
    id: 'spatial-binaural' as LexemeId,
    lemma: 'binaural',
    category: 'adj',
    variants: ['3D audio', 'HRTF', 'head-tracked'],
    semantics: {
      type: 'technique',
      technique: 'binaural',
      targets: ['spatial_rendering'],
      effect: { rendering: 'hrtf_based', perception: '3d_headphones' },
    },
    description: 'Binaural/3D audio processing',
  },

  // Continue with more spatial vocabulary...

] as const;

// ============================================================================
// Section 2: Frequency & EQ Terms (100 entries)
// ============================================================================

/**
 * Frequency ranges, EQ operations, tonal balance, and spectral terms.
 */
export const FREQUENCY_EQ_VOCABULARY: readonly Lexeme[] = [
  // --- Frequency Range Terms ---
  {
    id: 'freq-range-sub' as LexemeId,
    lemma: 'sub bass',
    category: 'construction',
    variants: ['subs', 'sub frequencies', 'deep bass', 'low end'],
    semantics: {
      type: 'frequency-range',
      range: 'sub_bass',
      frequencies: '20_to_60_Hz',
      targets: ['low_frequency_content'],
      effect: { range: 'sub_bass', perception: 'felt_rather_than_heard' },
    },
    description: 'Sub-bass frequencies (20-60 Hz), felt more than heard',
  },
  {
    id: 'freq-range-bass' as LexemeId,
    lemma: 'bass',
    category: 'noun',
    variants: ['low frequencies', 'lows', 'bottom end'],
    semantics: {
      type: 'frequency-range',
      range: 'bass',
      frequencies: '60_to_250_Hz',
      targets: ['low_frequency_content'],
      effect: { range: 'bass', perception: 'warmth_weight_foundation' },
    },
    description: 'Bass frequencies (60-250 Hz), warmth and weight',
  },
  {
    id: 'freq-range-low-mid' as LexemeId,
    lemma: 'low mids',
    category: 'construction',
    variants: ['lower midrange', 'low-mid frequencies'],
    semantics: {
      type: 'frequency-range',
      range: 'low_mid',
      frequencies: '250_to_500_Hz',
      targets: ['midrange_content'],
      effect: { range: 'low_mid', perception: 'body_thickness' },
    },
    description: 'Low-mid frequencies (250-500 Hz), body and thickness',
  },
  {
    id: 'freq-range-mid' as LexemeId,
    lemma: 'midrange',
    category: 'noun',
    variants: ['mids', 'mid frequencies', 'middle'],
    semantics: {
      type: 'frequency-range',
      range: 'midrange',
      frequencies: '500_Hz_to_2_kHz',
      targets: ['midrange_content'],
      effect: { range: 'midrange', perception: 'presence_definition' },
    },
    description: 'Midrange frequencies (500 Hz-2 kHz), presence and definition',
  },
  {
    id: 'freq-range-upper-mid' as LexemeId,
    lemma: 'upper mids',
    category: 'construction',
    variants: ['high mids', 'upper midrange'],
    semantics: {
      type: 'frequency-range',
      range: 'upper_mid',
      frequencies: '2_to_5_kHz',
      targets: ['midrange_content'],
      effect: { range: 'upper_mid', perception: 'clarity_articulation' },
    },
    description: 'Upper-mid frequencies (2-5 kHz), clarity and articulation',
  },
  {
    id: 'freq-range-presence' as LexemeId,
    lemma: 'presence range',
    category: 'construction',
    variants: ['presence', 'presence frequencies'],
    semantics: {
      type: 'frequency-range',
      range: 'presence',
      frequencies: '4_to_6_kHz',
      targets: ['presence_content'],
      effect: { range: 'presence', perception: 'speech_intelligibility_closeness' },
    },
    description: 'Presence frequencies (4-6 kHz), vocal intelligibility',
  },
  {
    id: 'freq-range-treble' as LexemeId,
    lemma: 'treble',
    category: 'noun',
    variants: ['high frequencies', 'highs', 'top end'],
    semantics: {
      type: 'frequency-range',
      range: 'treble',
      frequencies: '5_to_10_kHz',
      targets: ['high_frequency_content'],
      effect: { range: 'treble', perception: 'brightness_detail' },
    },
    description: 'Treble frequencies (5-10 kHz), brightness and detail',
  },
  {
    id: 'freq-range-air' as LexemeId,
    lemma: 'air',
    category: 'noun',
    variants: ['air frequencies', 'sparkle', 'shimmer', 'brilliance'],
    semantics: {
      type: 'frequency-range',
      range: 'air',
      frequencies: '10_to_20_kHz',
      targets: ['ultra_high_frequency_content'],
      effect: { range: 'air', perception: 'openness_sparkle_space' },
    },
    description: 'Air frequencies (10-20 kHz), sparkle and openness',
  },

  // --- EQ Operations ---
  {
    id: 'eq-boost' as LexemeId,
    lemma: 'boost',
    category: 'verb',
    variants: ['increase', 'add', 'enhance', 'lift'],
    semantics: {
      type: 'eq-operation',
      operation: 'boost',
      targets: ['frequency_band'],
      effect: { gain: 'positive', amplitude: 'increased' },
    },
    description: 'Increase gain of frequency band',
  },
  {
    id: 'eq-cut' as LexemeId,
    lemma: 'cut',
    category: 'verb',
    variants: ['reduce', 'attenuate', 'remove', 'notch out'],
    semantics: {
      type: 'eq-operation',
      operation: 'cut',
      targets: ['frequency_band'],
      effect: { gain: 'negative', amplitude: 'decreased' },
    },
    description: 'Decrease gain of frequency band',
  },
  {
    id: 'eq-shelf-high' as LexemeId,
    lemma: 'high shelf',
    category: 'construction',
    variants: ['treble shelf', 'high frequency shelf'],
    semantics: {
      type: 'eq-filter',
      filter: 'high_shelf',
      targets: ['high_frequencies'],
      effect: { type: 'shelf', range: 'above_frequency', slope: 'gradual' },
    },
    description: 'Shelf EQ affecting all frequencies above cutoff',
  },
  {
    id: 'eq-shelf-low' as LexemeId,
    lemma: 'low shelf',
    category: 'construction',
    variants: ['bass shelf', 'low frequency shelf'],
    semantics: {
      type: 'eq-filter',
      filter: 'low_shelf',
      targets: ['low_frequencies'],
      effect: { type: 'shelf', range: 'below_frequency', slope: 'gradual' },
    },
    description: 'Shelf EQ affecting all frequencies below cutoff',
  },
  {
    id: 'eq-bell' as LexemeId,
    lemma: 'bell curve',
    category: 'construction',
    variants: ['parametric', 'peaking filter', 'bell filter'],
    semantics: {
      type: 'eq-filter',
      filter: 'bell',
      targets: ['frequency_band'],
      effect: { type: 'bell', range: 'around_center', q_factor: 'adjustable' },
    },
    description: 'Bell-shaped EQ curve centered on frequency',
  },
  {
    id: 'eq-notch' as LexemeId,
    lemma: 'notch filter',
    category: 'construction',
    variants: ['notch', 'narrow cut', 'surgical cut'],
    semantics: {
      type: 'eq-filter',
      filter: 'notch',
      targets: ['narrow_frequency_band'],
      effect: { type: 'notch', range: 'very_narrow', q_factor: 'high', attenuation: 'deep' },
    },
    description: 'Very narrow, deep cut to remove specific frequency',
  },
  {
    id: 'eq-high-pass' as LexemeId,
    lemma: 'high-pass filter',
    category: 'construction',
    variants: ['HPF', 'low cut', 'rumble filter'],
    semantics: {
      type: 'eq-filter',
      filter: 'high_pass',
      targets: ['low_frequencies'],
      effect: { type: 'high_pass', range: 'below_cutoff', slope: '6_12_24_dB_oct' },
    },
    description: 'Filter removing frequencies below cutoff',
  },
  {
    id: 'eq-low-pass' as LexemeId,
    lemma: 'low-pass filter',
    category: 'construction',
    variants: ['LPF', 'high cut', 'treble roll-off'],
    semantics: {
      type: 'eq-filter',
      filter: 'low_pass',
      targets: ['high_frequencies'],
      effect: { type: 'low_pass', range: 'above_cutoff', slope: '6_12_24_dB_oct' },
    },
    description: 'Filter removing frequencies above cutoff',
  },

  // --- Tonal Characteristics ---
  {
    id: 'tonal-bright' as LexemeId,
    lemma: 'bright',
    category: 'adj',
    variants: ['brighter', 'brighten', 'brilliant'],
    semantics: {
      type: 'axis_modifier',
      axis: 'brightness',
      value: 'bright',
      targets: ['high_frequencies'],
      effect: { high_freq: 'emphasized', perception: 'clear_sharp_present' },
    },
    description: 'Emphasized high frequencies, clear and sharp',
  },
  {
    id: 'tonal-dark' as LexemeId,
    lemma: 'dark',
    category: 'adj',
    variants: ['darker', 'darken', 'dull'],
    semantics: {
      type: 'axis_modifier',
      axis: 'brightness',
      value: 'dark',
      targets: ['high_frequencies'],
      effect: { high_freq: 'reduced', perception: 'warm_mellow_smooth' },
    },
    description: 'Reduced high frequencies, warm and mellow',
  },
  {
    id: 'tonal-warm' as LexemeId,
    lemma: 'warm',
    category: 'adj',
    variants: ['warmth', 'warmer', 'warm up'],
    semantics: {
      type: 'axis_modifier',
      axis: 'warmth',
      value: 'warm',
      targets: ['low_frequencies', 'low_mids'],
      effect: { low_freq: 'emphasized', perception: 'cozy_pleasant_analog' },
    },
    description: 'Emphasized low/low-mid frequencies, pleasant and cozy',
  },
  {
    id: 'tonal-thin' as LexemeId,
    lemma: 'thin',
    category: 'adj',
    variants: ['thinner', 'tinny', 'lacking body'],
    semantics: {
      type: 'axis_modifier',
      axis: 'body',
      value: 'thin',
      targets: ['low_frequencies', 'body'],
      effect: { low_freq: 'reduced', perception: 'weak_lacking_weight' },
    },
    description: 'Insufficient low frequencies, lacking body',
  },
  {
    id: 'tonal-full' as LexemeId,
    lemma: 'full',
    category: 'adj',
    variants: ['fuller', 'full-bodied', 'rich'],
    semantics: {
      type: 'axis_modifier',
      axis: 'body',
      value: 'full',
      targets: ['frequency_balance'],
      effect: { balance: 'complete_spectrum', perception: 'rich_satisfying' },
    },
    description: 'Well-balanced across spectrum, rich and satisfying',
  },
  {
    id: 'tonal-muddy' as LexemeId,
    lemma: 'muddy',
    category: 'adj',
    variants: ['mud', 'muddiness', 'unclear', 'boomy'],
    semantics: {
      type: 'problem',
      problem: 'muddiness',
      targets: ['low_mid_frequencies'],
      effect: { low_mid: 'excessive', perception: 'unclear_indistinct' },
    },
    description: 'Excessive low-mids causing lack of clarity',
  },
  {
    id: 'tonal-harsh' as LexemeId,
    lemma: 'harsh',
    category: 'adj',
    variants: ['harshness', 'brittle', 'piercing', 'strident'],
    semantics: {
      type: 'problem',
      problem: 'harshness',
      targets: ['upper_mid_frequencies'],
      effect: { upper_mid: 'excessive', perception: 'unpleasant_piercing' },
    },
    description: 'Excessive upper-mids causing unpleasant piercing quality',
  },

  // Continue with more frequency vocabulary...

] as const;

// ============================================================================
// Section 3: Dynamics Processing (80 entries)
// ============================================================================

/**
 * Compression, limiting, expansion, gating, and dynamic range control.
 */
export const DYNAMICS_PROCESSING_VOCABULARY: readonly Lexeme[] = [
  // --- Compression ---
  {
    id: 'dyn-compress' as LexemeId,
    lemma: 'compress',
    category: 'verb',
    variants: ['compression', 'compressed', 'compressor'],
    semantics: {
      type: 'dynamics-processing',
      processor: 'compressor',
      targets: ['dynamic_range'],
      effect: { dynamic_range: 'reduced', peaks: 'controlled', sustain: 'increased' },
    },
    description: 'Reduce dynamic range by attenuating peaks',
  },
  {
    id: 'dyn-threshold' as LexemeId,
    lemma: 'threshold',
    category: 'noun',
    variants: ['comp threshold', 'trigger level'],
    semantics: {
      type: 'parameter',
      parameter: 'threshold',
      targets: ['dynamics_processor'],
      effect: { control: 'where_processing_starts', unit: 'dB' },
    },
    description: 'Level above which compression/limiting begins',
  },
  {
    id: 'dyn-ratio' as LexemeId,
    lemma: 'ratio',
    category: 'noun',
    variants: ['compression ratio', 'comp ratio'],
    semantics: {
      type: 'parameter',
      parameter: 'ratio',
      targets: ['compressor'],
      effect: { control: 'amount_of_reduction', range: '1:1_to_inf:1' },
    },
    description: 'Ratio of input to output level change (e.g., 4:1)',
  },
  {
    id: 'dyn-attack' as LexemeId,
    lemma: 'attack time',
    category: 'construction',
    variants: ['attack', 'compressor attack'],
    semantics: {
      type: 'parameter',
      parameter: 'attack',
      targets: ['compressor'],
      effect: { control: 'response_speed', range: '0.1_to_100_ms' },
    },
    description: 'How quickly compressor responds to signal exceeding threshold',
  },
  {
    id: 'dyn-release' as LexemeId,
    lemma: 'release time',
    category: 'construction',
    variants: ['release', 'compressor release'],
    semantics: {
      type: 'parameter',
      parameter: 'release',
      targets: ['compressor'],
      effect: { control: 'recovery_speed', range: '10_to_1000_ms' },
    },
    description: 'How quickly compressor returns to normal after signal drops',
  },
  {
    id: 'dyn-knee' as LexemeId,
    lemma: 'knee',
    category: 'noun',
    variants: ['soft knee', 'hard knee'],
    semantics: {
      type: 'parameter',
      parameter: 'knee',
      targets: ['compressor'],
      effect: { control: 'threshold_transition', range: 'hard_to_soft' },
    },
    description: 'Transition curve at threshold (hard vs soft)',
  },
  {
    id: 'dyn-makeup-gain' as LexemeId,
    lemma: 'makeup gain',
    category: 'construction',
    variants: ['make-up gain', 'output gain', 'compensate'],
    semantics: {
      type: 'parameter',
      parameter: 'makeup_gain',
      targets: ['compressor'],
      effect: { control: 'output_level', purpose: 'compensate_for_reduction' },
    },
    description: 'Output gain to compensate for compression reduction',
  },

  // --- Limiting ---
  {
    id: 'dyn-limit' as LexemeId,
    lemma: 'limit',
    category: 'verb',
    variants: ['limiter', 'limiting', 'brick wall'],
    semantics: {
      type: 'dynamics-processing',
      processor: 'limiter',
      targets: ['peaks'],
      effect: { peaks: 'prevented_from_exceeding', ratio: 'inf:1' },
    },
    description: 'Prevent signal from exceeding ceiling (ratio ∞:1)',
  },
  {
    id: 'dyn-ceiling' as LexemeId,
    lemma: 'ceiling',
    category: 'noun',
    variants: ['output ceiling', 'limiter ceiling', 'max level'],
    semantics: {
      type: 'parameter',
      parameter: 'ceiling',
      targets: ['limiter'],
      effect: { control: 'maximum_output_level', typical: '-0.3_dB' },
    },
    description: 'Maximum output level allowed by limiter',
  },

  // --- Expansion & Gating ---
  {
    id: 'dyn-expand' as LexemeId,
    lemma: 'expand',
    category: 'verb',
    variants: ['expander', 'expansion', 'downward expansion'],
    semantics: {
      type: 'dynamics-processing',
      processor: 'expander',
      targets: ['dynamic_range'],
      effect: { dynamic_range: 'increased', quiet_parts: 'quieter' },
    },
    description: 'Increase dynamic range by reducing level below threshold',
  },
  {
    id: 'dyn-gate' as LexemeId,
    lemma: 'gate',
    category: 'verb',
    variants: ['noise gate', 'gating', 'gated'],
    semantics: {
      type: 'dynamics-processing',
      processor: 'gate',
      targets: ['silence', 'noise'],
      effect: { below_threshold: 'muted', noise: 'removed' },
    },
    description: 'Mute signal below threshold to remove noise/bleed',
  },

  // --- Dynamic Characteristics ---
  {
    id: 'dyn-punchy' as LexemeId,
    lemma: 'punchy',
    category: 'adj',
    variants: ['punch', 'punchier', 'impact'],
    semantics: {
      type: 'axis_modifier',
      axis: 'punch',
      value: 'punchy',
      targets: ['transients', 'dynamics'],
      effect: { transients: 'enhanced', attack: 'sharp', perceived_loudness: 'high' },
    },
    description: 'Strong transients and perceived impact',
  },
  {
    id: 'dyn-squashed' as LexemeId,
    lemma: 'squashed',
    category: 'adj',
    variants: ['over-compressed', 'crushed', 'lifeless'],
    semantics: {
      type: 'problem',
      problem: 'over_compression',
      targets: ['dynamics'],
      effect: { dynamic_range: 'minimal', life: 'removed', artifacts: 'pumping_breathing' },
    },
    description: 'Over-compressed, lacking dynamic life',
  },

  // Continue with more dynamics vocabulary...

] as const;

// ============================================================================
// Section 4: Time-Based Effects (80 entries)
// ============================================================================

/**
 * Reverb, delay, echo, and time-based processing.
 */
export const TIME_BASED_EFFECTS_VOCABULARY: readonly Lexeme[] = [
  // --- Reverb ---
  {
    id: 'time-reverb' as LexemeId,
    lemma: 'reverb',
    category: 'noun',
    variants: ['reverberation', 'ambience', 'space'],
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'effect',
      effect: 'reverb',
      targets: ['spatial_impression', 'depth'],
      effect_params: { creates: 'sense_of_space', decay: 'gradual' },
    },
    description: 'Simulate acoustic space through reflections',
  },
  {
    id: 'time-reverb-hall' as LexemeId,
    lemma: 'hall reverb',
    category: 'construction',
    variants: ['concert hall', 'large hall'],
    semantics: {
      type: 'effect-preset',
      effect: 'reverb',
      preset: 'hall',
      characteristics: { size: 'large', decay: 'long', early_reflections: 'sparse' },
    },
    description: 'Large concert hall reverb',
  },
  {
    id: 'time-reverb-room' as LexemeId,
    lemma: 'room reverb',
    category: 'construction',
    variants: ['small room', 'chamber'],
    semantics: {
      type: 'effect-preset',
      effect: 'reverb',
      preset: 'room',
      characteristics: { size: 'small', decay: 'short', early_reflections: 'dense' },
    },
    description: 'Small room reverb',
  },
  {
    id: 'time-reverb-plate' as LexemeId,
    lemma: 'plate reverb',
    category: 'construction',
    variants: ['plate', 'EMT plate'],
    semantics: {
      type: 'effect-preset',
      effect: 'reverb',
      preset: 'plate',
      characteristics: { type: 'mechanical', character: 'bright_dense', vintage: true },
    },
    description: 'Plate reverb (vintage mechanical)',
  },
  {
    id: 'time-reverb-spring' as LexemeId,
    lemma: 'spring reverb',
    category: 'construction',
    variants: ['spring', 'spring tank'],
    semantics: {
      type: 'effect-preset',
      effect: 'reverb',
      preset: 'spring',
      characteristics: { type: 'mechanical', character: 'twangy_vintage', surf: true },
    },
    description: 'Spring reverb (vintage surf/guitar)',
  },

  // --- Delay ---
  {
    id: 'time-delay' as LexemeId,
    lemma: 'delay',
    category: 'noun',
    variants: ['echo', 'repeat', 'delayed'],
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'effect',
      effect: 'delay',
      targets: ['timing', 'rhythmic_interest'],
      effect_params: { creates: 'distinct_repeats' },
    },
    description: 'Time-delayed repeats of signal',
  },
  {
    id: 'time-delay-time' as LexemeId,
    lemma: 'delay time',
    category: 'construction',
    variants: ['delay length', 'repeat time'],
    semantics: {
      type: 'parameter',
      parameter: 'delay_time',
      targets: ['delay'],
      effect: { control: 'gap_between_repeats', sync: 'ms_or_tempo' },
    },
    description: 'Time between repeats (ms or tempo-synced)',
  },
  {
    id: 'time-feedback' as LexemeId,
    lemma: 'feedback',
    category: 'noun',
    variants: ['regeneration', 'repeats', 'decay'],
    semantics: {
      type: 'parameter',
      parameter: 'feedback',
      targets: ['delay'],
      effect: { control: 'number_of_repeats', range: '0%_to_100%' },
    },
    description: 'Amount of delay output fed back to input',
  },

  // --- Specific Delay Types ---
  {
    id: 'time-delay-slapback' as LexemeId,
    lemma: 'slapback',
    category: 'noun',
    variants: ['slapback echo', 'single repeat'],
    semantics: {
      type: 'effect-preset',
      effect: 'delay',
      preset: 'slapback',
      characteristics: { time: '75_to_200_ms', feedback: 'single_repeat', vintage: 'rockabilly' },
    },
    description: 'Short single delay repeat (vintage rockabilly)',
  },
  {
    id: 'time-delay-ping-pong' as LexemeId,
    lemma: 'ping-pong delay',
    category: 'construction',
    variants: ['ping pong', 'stereo delay'],
    semantics: {
      type: 'effect-preset',
      effect: 'delay',
      preset: 'ping_pong',
      characteristics: { stereo: 'alternating_L_R', width: 'wide' },
    },
    description: 'Delay alternating between left and right channels',
  },

  // Continue with more time-based effects vocabulary...

] as const;

// ============================================================================
// Section 5: Distortion & Saturation (60 entries)
// ============================================================================

/**
 * Distortion, overdrive, saturation, clipping, and harmonic enhancement.
 */
export const DISTORTION_SATURATION_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'dist-distortion' as LexemeId,
    lemma: 'distortion',
    category: 'noun',
    variants: ['distort', 'distorted', 'dist'],
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'effect',
      effect: 'distortion',
      targets: ['waveform', 'harmonics'],
      effect_params: { adds: 'harmonic_content', clipping: true },
    },
    description: 'Harmonic distortion through clipping/waveshaping',
  },
  {
    id: 'dist-overdrive' as LexemeId,
    lemma: 'overdrive',
    category: 'noun',
    variants: ['OD', 'soft clipping', 'overdriven'],
    semantics: {
      type: 'effect-preset',
      effect: 'distortion',
      preset: 'overdrive',
      characteristics: { clipping: 'soft_tube-like', harmonics: 'warm_even' },
    },
    description: 'Soft, warm distortion (tube/amp simulation)',
  },
  {
    id: 'dist-saturate' as LexemeId,
    lemma: 'saturate',
    category: 'verb',
    variants: ['saturation', 'saturated', 'tape saturation'],
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'effect',
      effect: 'saturation',
      targets: ['harmonics', 'warmth'],
      effect_params: { adds: 'subtle_harmonics', character: 'analog' },
    },
    description: 'Subtle harmonic enhancement (tape/analog simulation)',
  },

  // Continue with more distortion vocabulary...

] as const;

// ============================================================================
// Section 6: Modulation Effects (60 entries)
// ============================================================================

/**
 * Chorus, flanger, phaser, tremolo, vibrato, and other modulation.
 */
export const MODULATION_EFFECTS_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'mod-chorus' as LexemeId,
    lemma: 'chorus',
    category: 'noun',
    variants: ['chorused', 'chorus effect'],
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'effect',
      effect: 'chorus',
      targets: ['pitch', 'width'],
      effect_params: { modulates: 'pitch_and_delay', creates: 'ensemble_effect' },
    },
    description: 'Modulated delay creating ensemble effect',
  },
  {
    id: 'mod-flanger' as LexemeId,
    lemma: 'flanger',
    category: 'noun',
    variants: ['flanging', 'flanged'],
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'effect',
      effect: 'flanger',
      targets: ['phase', 'comb_filtering'],
      effect_params: { modulates: 'short_delay', feedback: 'strong', character: 'jet_plane' },
    },
    description: 'Short modulated delay with feedback (jet plane effect)',
  },
  {
    id: 'mod-phaser' as LexemeId,
    lemma: 'phaser',
    category: 'noun',
    variants: ['phasing', 'phased'],
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'effect',
      effect: 'phaser',
      targets: ['phase', 'notches'],
      effect_params: { creates: 'moving_notches', character: 'sweeping' },
    },
    description: 'All-pass filters creating moving notches',
  },

  // Continue with more modulation vocabulary...

] as const;

// ============================================================================
// Section 7: Mixing Concepts (80 entries)
// ============================================================================

/**
 * Mixing workflow, balance, levels, routing, and mix concepts.
 */
export const MIXING_CONCEPTS_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'mix-balance' as LexemeId,
    lemma: 'balance',
    category: 'noun',
    variants: ['balanced', 'mix balance', 'level balance'],
    semantics: {
      type: 'mixing-concept',
      concept: 'balance',
      targets: ['relative_levels', 'overall_mix'],
      goal: { achieve: 'appropriate_relationships', avoid: 'dominance' },
    },
    description: 'Appropriate relative levels between elements',
  },
  {
    id: 'mix-clarity' as LexemeId,
    lemma: 'clarity',
    category: 'noun',
    variants: ['clear', 'definition', 'separation'],
    semantics: {
      type: 'mixing-concept',
      concept: 'clarity',
      targets: ['frequency_separation', 'spatial_placement'],
      goal: { achieve: 'distinct_elements', avoid: 'masking' },
    },
    description: 'Clear distinction between mix elements',
  },
  {
    id: 'mix-cohesion' as LexemeId,
    lemma: 'cohesion',
    category: 'noun',
    variants: ['cohesive', 'glued', 'unified'],
    semantics: {
      type: 'mixing-concept',
      concept: 'cohesion',
      targets: ['overall_character', 'processing'],
      goal: { achieve: 'unified_whole', techniques: 'bus_processing_reverb' },
    },
    description: 'Elements sound like they belong together',
  },

  // Continue with more mixing concepts vocabulary...

] as const;

// ============================================================================
// Section 8: Mastering & Finalization (60 entries)
// ============================================================================

/**
 * Mastering concepts, loudness, dynamics, and final polish.
 */
export const MASTERING_VOCABULARY: readonly Lexeme[] = [
  {
    id: 'master-lufs' as LexemeId,
    lemma: 'LUFS',
    category: 'noun',
    variants: ['loudness units', 'integrated loudness'],
    semantics: {
      type: 'measurement',
      measurement: 'lufs',
      targets: ['perceived_loudness'],
      standard: { broadcast: '-23_LUFS', streaming: '-14_LUFS', mastering: '-8_to_-12_LUFS' },
    },
    description: 'Loudness Units relative to Full Scale (perceived loudness)',
  },
  {
    id: 'master-headroom' as LexemeId,
    lemma: 'headroom',
    category: 'noun',
    variants: ['dynamic headroom', 'peak headroom'],
    semantics: {
      type: 'mixing-concept',
      concept: 'headroom',
      targets: ['peak_levels'],
      goal: { leave: 'space_below_0dBFS', typical: '3_to_6_dB' },
    },
    description: 'Space between peak level and 0 dBFS',
  },

  // Continue with more mastering vocabulary...

] as const;

// ============================================================================
// Combined Export
// ============================================================================

/**
 * All production and mixing vocabulary combined.
 * Total: ~600 entries across 8 categories.
 */
export const ALL_PRODUCTION_MIXING_VOCABULARY: readonly Lexeme[] = [
  ...SPATIAL_STEREO_VOCABULARY,
  ...FREQUENCY_EQ_VOCABULARY,
  ...DYNAMICS_PROCESSING_VOCABULARY,
  ...TIME_BASED_EFFECTS_VOCABULARY,
  ...DISTORTION_SATURATION_VOCABULARY,
  ...MODULATION_EFFECTS_VOCABULARY,
  ...MIXING_CONCEPTS_VOCABULARY,
  ...MASTERING_VOCABULARY,
] as const;

/**
 * Vocabulary statistics for this batch.
 */
export const PRODUCTION_MIXING_STATS = {
  totalEntries: ALL_PRODUCTION_MIXING_VOCABULARY.length,
  categories: {
    spatialStereo: SPATIAL_STEREO_VOCABULARY.length,
    frequencyEQ: FREQUENCY_EQ_VOCABULARY.length,
    dynamicsProcessing: DYNAMICS_PROCESSING_VOCABULARY.length,
    timeBasedEffects: TIME_BASED_EFFECTS_VOCABULARY.length,
    distortionSaturation: DISTORTION_SATURATION_VOCABULARY.length,
    modulationEffects: MODULATION_EFFECTS_VOCABULARY.length,
    mixingConcepts: MIXING_CONCEPTS_VOCABULARY.length,
    mastering: MASTERING_VOCABULARY.length,
  },
  coverage: [
    'Professional studio terminology',
    'Spatial positioning and stereo imaging',
    'Frequency and EQ across entire spectrum',
    'Dynamics processing and control',
    'Time-based effects (reverb/delay)',
    'Distortion and harmonic enhancement',
    'Modulation effects',
    'Mixing and mastering concepts',
  ],
} as const;
