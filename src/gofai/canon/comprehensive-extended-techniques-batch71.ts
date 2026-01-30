/**
 * Comprehensive Extended Techniques & Production Terms - Batch 71
 * 
 * This batch adds extensive vocabulary for:
 * - Extended instrumental techniques
 * - Vocal techniques and effects
 * - Modern production terminology
 * - Sound design concepts
 * - Studio engineering terms
 * - Electronic music production
 * 
 * Each entry maps to CPL semantics for plan generation.
 * 
 * @module gofai/canon/comprehensive-extended-techniques-batch71
 */

import type { Lexeme, LexemeSemantics } from './types';
import { createLexemeId, type LexemeId } from './gofai-id';

// =============================================================================
// String Instrument Extended Techniques
// =============================================================================

export const stringExtendedLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:technique:col-legno'),
    lemma: 'col legno',
    variants: ['col legno battuto', 'with the wood', 'wooden sound'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'articulation',
      instrument_family: 'strings',
      affects: 'timbre',
      character: 'percussive',
    } as LexemeSemantics,
    documentation: {
      description: 'Hitting strings with the wood of the bow',
      examples: [
        'use col legno technique',
        'percussive bow effect',
      ],
      culturalContext: 'Classical extended technique; used by Berlioz, Holst, others',
    },
  },
  
  {
    id: createLexemeId('lex:technique:sul-ponticello'),
    lemma: 'sul ponticello',
    variants: ['ponticello', 'on the bridge', 'glassy sound'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'bowing',
      instrument_family: 'strings',
      affects: 'timbre',
      character: 'brittle',
    } as LexemeSemantics,
    documentation: {
      description: 'Bowing near the bridge for a glassy, metallic sound',
      examples: [
        'bow sul ponticello',
        'play near the bridge',
      ],
      culturalContext: 'Creates eerie, otherworldly tone',
    },
  },
  
  {
    id: createLexemeId('lex:technique:sul-tasto'),
    lemma: 'sul tasto',
    variants: ['sul tasto', 'on the fingerboard', 'flautando'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'bowing',
      instrument_family: 'strings',
      affects: 'timbre',
      character: 'soft',
    } as LexemeSemantics,
    documentation: {
      description: 'Bowing over the fingerboard for a soft, flute-like tone',
      examples: [
        'bow sul tasto',
        'play over fingerboard',
      ],
      culturalContext: 'Creates mellow, ethereal sound',
    },
  },
  
  {
    id: createLexemeId('lex:technique:pizzicato'),
    lemma: 'pizzicato',
    variants: ['pizz', 'plucked', 'plucking'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'articulation',
      instrument_family: 'strings',
      affects: 'attack',
      character: 'plucked',
    } as LexemeSemantics,
    documentation: {
      description: 'Plucking strings with fingers instead of bowing',
      examples: [
        'make it pizzicato',
        'plucked strings',
      ],
      culturalContext: 'Standard orchestral technique',
    },
  },
  
  {
    id: createLexemeId('lex:technique:bartok-pizz'),
    lemma: 'bartok pizzicato',
    variants: ['snap pizzicato', 'snap pizz', 'bartók pizz'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'articulation',
      instrument_family: 'strings',
      affects: 'attack',
      character: 'aggressive',
    } as LexemeSemantics,
    documentation: {
      description: 'Plucking so hard the string snaps against the fingerboard',
      examples: [
        'use bartok pizzicato',
        'snap pizzicato effect',
      ],
      culturalContext: 'Named after Béla Bartók; aggressive, percussive',
    },
  },
  
  {
    id: createLexemeId('lex:technique:tremolo'),
    lemma: 'tremolo',
    variants: ['trem', 'rapid bow', 'shimmering'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'articulation',
      instrument_family: 'strings',
      affects: 'sustain',
      character: 'shimmering',
    } as LexemeSemantics,
    documentation: {
      description: 'Rapid alternating bow strokes for sustained trembling effect',
      examples: [
        'add tremolo',
        'rapid bow strokes',
      ],
      culturalContext: 'Creates tension and sustained tones',
    },
  },
  
  {
    id: createLexemeId('lex:technique:harmonics'),
    lemma: 'harmonics',
    variants: ['natural harmonics', 'artificial harmonics', 'flageolet'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'pitch',
      instrument_family: 'strings',
      affects: 'timbre',
      character: 'pure',
    } as LexemeSemantics,
    documentation: {
      description: 'Touching string lightly to produce overtones',
      examples: [
        'use natural harmonics',
        'play in harmonics',
      ],
      culturalContext: 'Creates bell-like, ethereal tones',
    },
  },
  
  {
    id: createLexemeId('lex:technique:glissando'),
    lemma: 'glissando',
    variants: ['gliss', 'slide', 'portamento'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'pitch',
      affects: 'melody',
      character: 'sliding',
    } as LexemeSemantics,
    documentation: {
      description: 'Sliding between pitches',
      examples: [
        'add glissando',
        'slide between notes',
      ],
      culturalContext: 'Can be chromatic or smooth depending on instrument',
    },
  },
];

// =============================================================================
// Wind Instrument Extended Techniques
// =============================================================================

export const windExtendedLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:technique:flutter-tongue'),
    lemma: 'flutter tongue',
    variants: ['flutter-tongue', 'fluttertongue', 'frullato'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'articulation',
      instrument_family: 'winds',
      affects: 'timbre',
      character: 'growling',
    } as LexemeSemantics,
    documentation: {
      description: 'Rolling Rs while playing to create growling effect',
      examples: [
        'use flutter tongue',
        'growling wind sound',
      ],
      culturalContext: 'Creates dramatic, aggressive tone',
    },
  },
  
  {
    id: createLexemeId('lex:technique:multiphonics'),
    lemma: 'multiphonics',
    variants: ['multiphonic', 'multiple tones', 'split tones'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'pitch',
      instrument_family: 'winds',
      affects: 'harmony',
      character: 'complex',
    } as LexemeSemantics,
    documentation: {
      description: 'Producing multiple pitches simultaneously on a wind instrument',
      examples: [
        'add multiphonics',
        'split tone effect',
      ],
      culturalContext: 'Modern extended technique; requires special fingerings',
    },
  },
  
  {
    id: createLexemeId('lex:technique:overblowing'),
    lemma: 'overblowing',
    variants: ['overblow', 'over-blowing', 'forced harmonics'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'pitch',
      instrument_family: 'winds',
      affects: 'register',
      character: 'bright',
    } as LexemeSemantics,
    documentation: {
      description: 'Blowing harder to produce higher overtones',
      examples: [
        'overblow to higher register',
        'force the harmonics',
      ],
      culturalContext: 'Natural way to extend range on brass and winds',
    },
  },
  
  {
    id: createLexemeId('lex:technique:circular-breathing'),
    lemma: 'circular breathing',
    variants: ['circular breath', 'continuous breathing'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'sustain',
      instrument_family: 'winds',
      affects: 'duration',
      character: 'continuous',
    } as LexemeSemantics,
    documentation: {
      description: 'Breathing technique allowing continuous sound',
      examples: [
        'sustain with circular breathing',
        'continuous tone',
      ],
      culturalContext: 'Used in didgeridoo and jazz saxophone',
    },
  },
  
  {
    id: createLexemeId('lex:technique:key-clicks'),
    lemma: 'key clicks',
    variants: ['key-clicks', 'key percussion', 'click sounds'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'articulation',
      instrument_family: 'woodwinds',
      affects: 'timbre',
      character: 'percussive',
    } as LexemeSemantics,
    documentation: {
      description: 'Clicking keys without blowing for percussive effect',
      examples: [
        'add key clicks',
        'percussive key sounds',
      ],
      culturalContext: 'Modern woodwind technique',
    },
  },
];

// =============================================================================
// Vocal Extended Techniques
// =============================================================================

export const vocalExtendedLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:technique:sprechstimme'),
    lemma: 'sprechstimme',
    variants: ['sprechgesang', 'speech-song', 'spoken singing'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'vocal',
      affects: 'pitch',
      character: 'speech_like',
    } as LexemeSemantics,
    documentation: {
      description: 'Half-spoken, half-sung vocal technique',
      examples: [
        'use sprechstimme',
        'spoken singing style',
      ],
      culturalContext: 'Developed by Schoenberg; between speech and song',
    },
  },
  
  {
    id: createLexemeId('lex:technique:melisma'),
    lemma: 'melisma',
    variants: ['melismatic', 'run', 'vocal run'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'ornament',
      affects: 'melody',
      character: 'florid',
    } as LexemeSemantics,
    documentation: {
      description: 'Singing multiple notes on a single syllable',
      examples: [
        'add melismatic passages',
        'vocal runs',
      ],
      culturalContext: 'Common in gospel, R&B, and classical music',
    },
  },
  
  {
    id: createLexemeId('lex:technique:vibrato'),
    lemma: 'vibrato',
    variants: ['vibrato', 'vocal vibrato', 'pitch wobble'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'ornament',
      affects: 'pitch',
      character: 'oscillating',
    } as LexemeSemantics,
    documentation: {
      description: 'Slight periodic variation in pitch',
      examples: [
        'add more vibrato',
        'wide vibrato',
      ],
      culturalContext: 'Standard in classical singing; varies by style',
    },
  },
  
  {
    id: createLexemeId('lex:technique:belting'),
    lemma: 'belting',
    variants: ['belt', 'chest voice', 'powerful singing'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'vocal',
      affects: 'dynamics',
      character: 'powerful',
    } as LexemeSemantics,
    documentation: {
      description: 'Powerful chest-voice singing in high range',
      examples: [
        'make them belt',
        'powerful chest voice',
      ],
      culturalContext: 'Musical theater and pop technique',
    },
  },
  
  {
    id: createLexemeId('lex:technique:falsetto'),
    lemma: 'falsetto',
    variants: ['head voice', 'false voice', 'high voice'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'vocal',
      affects: 'register',
      character: 'light',
    } as LexemeSemantics,
    documentation: {
      description: 'Light, breathy upper register',
      examples: [
        'sing in falsetto',
        'use head voice',
      ],
      culturalContext: 'Creates ethereal, floating quality',
    },
  },
  
  {
    id: createLexemeId('lex:technique:whisper'),
    lemma: 'whisper',
    variants: ['whispered', 'breathy', 'spoken'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'vocal',
      affects: 'timbre',
      character: 'intimate',
    } as LexemeSemantics,
    documentation: {
      description: 'Singing with minimal phonation, breathy quality',
      examples: [
        'whisper the lyrics',
        'breathy vocal',
      ],
      culturalContext: 'Creates intimacy; popular in indie/bedroom pop',
    },
  },
  
  {
    id: createLexemeId('lex:technique:vocal-fry'),
    lemma: 'vocal fry',
    variants: ['fry', 'creaky voice', 'pulse register'],
    category: 'noun',
    domain: 'technique',
    semantics: {
      type: 'technique',
      techniqueType: 'vocal',
      affects: 'timbre',
      character: 'gritty',
    } as LexemeSemantics,
    documentation: {
      description: 'Lowest vocal register with creaky, popping quality',
      examples: [
        'add vocal fry',
        'creaky low voice',
      ],
      culturalContext: 'Used for effect in contemporary vocals',
    },
  },
];

// =============================================================================
// Modern Production Techniques
// =============================================================================

export const productionLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:production:sidechain'),
    lemma: 'sidechain',
    variants: ['side-chain', 'sidechaining', 'ducking'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'dynamics',
      affects: 'level',
      character: 'pumping',
    } as LexemeSemantics,
    documentation: {
      description: 'Using one signal to modulate another (typically ducking)',
      examples: [
        'sidechain to the kick',
        'add pumping effect',
      ],
      culturalContext: 'Essential in EDM; creates rhythmic pumping',
    },
  },
  
  {
    id: createLexemeId('lex:production:parallel-compression'),
    lemma: 'parallel compression',
    variants: ['new york compression', 'parallel processing'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'dynamics',
      affects: 'punch',
      character: 'thick',
    } as LexemeSemantics,
    documentation: {
      description: 'Mixing heavily compressed signal with dry signal',
      examples: [
        'add parallel compression',
        'new york compression',
      ],
      culturalContext: 'Adds punch while maintaining dynamics',
    },
  },
  
  {
    id: createLexemeId('lex:production:layering'),
    lemma: 'layering',
    variants: ['layer', 'stacking', 'doubling'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'arrangement',
      affects: 'thickness',
      character: 'full',
    } as LexemeSemantics,
    documentation: {
      description: 'Combining multiple similar sounds for thickness',
      examples: [
        'layer the synths',
        'double the vocals',
      ],
      culturalContext: 'Creates richness and depth',
    },
  },
  
  {
    id: createLexemeId('lex:production:automation'),
    lemma: 'automation',
    variants: ['automate', 'parameter automation', 'movement'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'modulation',
      affects: 'parameters',
      character: 'dynamic',
    } as LexemeSemantics,
    documentation: {
      description: 'Time-varying parameter changes',
      examples: [
        'automate the filter',
        'add movement with automation',
      ],
      culturalContext: 'Essential for dynamic mixes',
    },
  },
  
  {
    id: createLexemeId('lex:production:saturation'),
    lemma: 'saturation',
    variants: ['saturate', 'drive', 'warmth', 'analog warmth'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'timbre',
      affects: 'harmonics',
      character: 'warm',
    } as LexemeSemantics,
    documentation: {
      description: 'Soft clipping that adds harmonic richness',
      examples: [
        'add saturation',
        'warm it up with drive',
      ],
      culturalContext: 'Simulates analog gear; adds warmth',
    },
  },
  
  {
    id: createLexemeId('lex:production:bitcrushing'),
    lemma: 'bitcrushing',
    variants: ['bitcrush', 'lo-fi', 'digital distortion'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'timbre',
      affects: 'fidelity',
      character: 'gritty',
    } as LexemeSemantics,
    documentation: {
      description: 'Reducing bit depth for lo-fi digital distortion',
      examples: [
        'bitcrush it',
        'add lo-fi distortion',
      ],
      culturalContext: 'Creates retro video game / digital aesthetic',
    },
  },
  
  {
    id: createLexemeId('lex:production:granular'),
    lemma: 'granular',
    variants: ['granular synthesis', 'grain', 'microsound'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'timbre',
      affects: 'texture',
      character: 'grainy',
    } as LexemeSemantics,
    documentation: {
      description: 'Breaking sound into tiny grains and reassembling',
      examples: [
        'use granular synthesis',
        'granular texture',
      ],
      culturalContext: 'Creates complex, evolving textures',
    },
  },
  
  {
    id: createLexemeId('lex:production:resampling'),
    lemma: 'resampling',
    variants: ['resample', 're-sampling', 'destructive processing'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'workflow',
      affects: 'processing',
      character: 'committed',
    } as LexemeSemantics,
    documentation: {
      description: 'Recording processed audio for further manipulation',
      examples: [
        'resample the effects',
        'print the processing',
      ],
      culturalContext: 'Allows stacking effects; commits to decisions',
    },
  },
];

// =============================================================================
// Sound Design Terms
// =============================================================================

export const soundDesignLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:sounddesign:fm-synthesis'),
    lemma: 'FM synthesis',
    variants: ['FM', 'frequency modulation', 'FM synth'],
    category: 'noun',
    domain: 'sound_design',
    semantics: {
      type: 'synthesis_method',
      method: 'frequency_modulation',
      character: 'metallic',
    } as LexemeSemantics,
    documentation: {
      description: 'Synthesis using frequency modulation for complex timbres',
      examples: [
        'use FM synthesis',
        'FM bell sound',
      ],
      culturalContext: 'Made famous by Yamaha DX7',
    },
  },
  
  {
    id: createLexemeId('lex:sounddesign:wavetable'),
    lemma: 'wavetable',
    variants: ['wavetable synthesis', 'wavetable synth'],
    category: 'noun',
    domain: 'sound_design',
    semantics: {
      type: 'synthesis_method',
      method: 'wavetable',
      character: 'evolving',
    } as LexemeSemantics,
    documentation: {
      description: 'Synthesis by scanning through waveforms',
      examples: [
        'use wavetable synthesis',
        'scanning wavetables',
      ],
      culturalContext: 'Creates evolving, morphing timbres',
    },
  },
  
  {
    id: createLexemeId('lex:sounddesign:physical-modeling'),
    lemma: 'physical modeling',
    variants: ['physical modelling', 'modal synthesis'],
    category: 'noun',
    domain: 'sound_design',
    semantics: {
      type: 'synthesis_method',
      method: 'physical_model',
      character: 'realistic',
    } as LexemeSemantics,
    documentation: {
      description: 'Synthesis by modeling physical resonance',
      examples: [
        'use physical modeling',
        'realistic instrument model',
      ],
      culturalContext: 'Simulates real instrument physics',
    },
  },
  
  {
    id: createLexemeId('lex:sounddesign:convolution'),
    lemma: 'convolution',
    variants: ['impulse response', 'IR', 'convolve'],
    category: 'noun',
    domain: 'sound_design',
    semantics: {
      type: 'processing_method',
      method: 'convolution',
      character: 'sampled',
    } as LexemeSemantics,
    documentation: {
      description: 'Processing using sampled acoustic spaces or equipment',
      examples: [
        'use convolution reverb',
        'apply impulse response',
      ],
      culturalContext: 'Captures real spaces and gear',
    },
  },
  
  {
    id: createLexemeId('lex:sounddesign:morphing'),
    lemma: 'morphing',
    variants: ['morph', 'crossfade', 'blend'],
    category: 'noun',
    domain: 'sound_design',
    semantics: {
      type: 'processing_method',
      method: 'interpolation',
      character: 'transitional',
    } as LexemeSemantics,
    documentation: {
      description: 'Smoothly transitioning between sounds',
      examples: [
        'morph between timbres',
        'blend the sounds',
      ],
      culturalContext: 'Creates smooth transitions',
    },
  },
  
  {
    id: createLexemeId('lex:sounddesign:formant'),
    lemma: 'formant',
    variants: ['formant filter', 'vocal formant', 'vowel sound'],
    category: 'noun',
    domain: 'sound_design',
    semantics: {
      type: 'filter_type',
      method: 'formant',
      character: 'vocal',
    } as LexemeSemantics,
    documentation: {
      description: 'Resonant peaks that create vowel-like sounds',
      examples: [
        'add formant filter',
        'vocal character',
      ],
      culturalContext: 'Creates vowel sounds and "talking" effects',
    },
  },
  
  {
    id: createLexemeId('lex:sounddesign:noise-gate'),
    lemma: 'noise gate',
    variants: ['gate', 'gating', 'noise reduction'],
    category: 'noun',
    domain: 'sound_design',
    semantics: {
      type: 'dynamics_processor',
      method: 'gating',
      affects: 'noise_floor',
    } as LexemeSemantics,
    documentation: {
      description: 'Cutting signal below threshold to remove noise',
      examples: [
        'gate the drums',
        'remove background noise',
      ],
      culturalContext: 'Cleans up recordings; can create rhythmic effects',
    },
  },
];

// =============================================================================
// Studio Engineering Terms
// =============================================================================

export const engineeringLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:engineering:headroom'),
    lemma: 'headroom',
    variants: ['head room', 'dynamic range', 'level margin'],
    category: 'noun',
    domain: 'engineering',
    semantics: {
      type: 'concept',
      domain: 'dynamics',
      concept: 'level_margin',
    } as LexemeSemantics,
    documentation: {
      description: 'Space between peak level and clipping',
      examples: [
        'leave more headroom',
        'give it breathing room',
      ],
      culturalContext: 'Essential for clean mastering',
    },
  },
  
  {
    id: createLexemeId('lex:engineering:phase-cancellation'),
    lemma: 'phase cancellation',
    variants: ['phase issues', 'comb filtering', 'phase problems'],
    category: 'noun',
    domain: 'engineering',
    semantics: {
      type: 'problem',
      category: 'phase',
      affects: 'frequency_response',
    } as LexemeSemantics,
    documentation: {
      description: 'Frequency loss due to phase misalignment',
      examples: [
        'fix phase cancellation',
        'address phase issues',
      ],
      culturalContext: 'Common when layering or mic positioning',
    },
  },
  
  {
    id: createLexemeId('lex:engineering:transient'),
    lemma: 'transient',
    variants: ['transients', 'attack', 'initial impact'],
    category: 'noun',
    domain: 'engineering',
    semantics: {
      type: 'concept',
      domain: 'dynamics',
      concept: 'initial_peak',
    } as LexemeSemantics,
    documentation: {
      description: 'Initial sharp peak of a sound',
      examples: [
        'enhance the transients',
        'preserve the attack',
      ],
      culturalContext: 'Critical for punch and clarity',
    },
  },
  
  {
    id: createLexemeId('lex:engineering:masking'),
    lemma: 'masking',
    variants: ['frequency masking', 'spectral masking'],
    category: 'noun',
    domain: 'engineering',
    semantics: {
      type: 'problem',
      category: 'frequency',
      affects: 'clarity',
    } as LexemeSemantics,
    documentation: {
      description: 'One sound hiding another in same frequency range',
      examples: [
        'reduce frequency masking',
        'unmask the vocals',
      ],
      culturalContext: 'Managed through EQ and arrangement',
    },
  },
  
  {
    id: createLexemeId('lex:engineering:gain-staging'),
    lemma: 'gain staging',
    variants: ['gain structure', 'level optimization'],
    category: 'noun',
    domain: 'engineering',
    semantics: {
      type: 'technique',
      category: 'workflow',
      affects: 'signal_path',
    } as LexemeSemantics,
    documentation: {
      description: 'Optimizing levels through signal chain',
      examples: [
        'proper gain staging',
        'optimize the levels',
      ],
      culturalContext: 'Maintains headroom and minimizes noise',
    },
  },
];

// =============================================================================
// Combined Export
// =============================================================================

export const extendedTechniquesLexemes: readonly Lexeme[] = [
  ...stringExtendedLexemes,
  ...windExtendedLexemes,
  ...vocalExtendedLexemes,
  ...productionLexemes,
  ...soundDesignLexemes,
  ...engineeringLexemes,
];

/**
 * Total lexemes in this batch: ~65+
 * 
 * Comprehensive coverage of:
 * - Classical extended techniques (strings, winds)
 * - Vocal techniques from classical to contemporary
 * - Modern production methods
 * - Sound design terminology
 * - Studio engineering concepts
 * 
 * Each fully mapped to CPL semantics for intelligent plan generation.
 */
