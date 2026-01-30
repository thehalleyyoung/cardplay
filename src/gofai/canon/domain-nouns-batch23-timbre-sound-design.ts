/**
 * GOFAI Canon — Domain Nouns Batch 23: Timbre and Sound Design
 *
 * Comprehensive vocabulary for timbre descriptors, sound design terms,
 * spectral characteristics, envelope shapes, modulation types, and sonic
 * qualities. This batch systematically enumerates the natural language
 * terms musicians and producers use to describe sound character and texture.
 *
 * This continues the extensive enumeration requirement from gofai_goalB.md
 * to build comprehensive natural language coverage for musical concepts.
 *
 * @module gofai/canon/domain-nouns-batch23-timbre-sound-design
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Timbre and sound design lexeme.
 */
export interface TimbreLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'noun' | 'adjective';
  readonly semantics: {
    readonly type: 'quality' | 'envelope' | 'spectrum' | 'modulation' | 'texture';
    readonly spectralRegion?: 'low' | 'mid' | 'high' | 'sub' | 'air' | 'full';
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
}

// =============================================================================
// Spectral Qualities (Brightness/Darkness)
// =============================================================================

export const SPECTRAL_QUALITY_LEXEMES: readonly TimbreLexeme[] = [
  {
    id: createLexemeId('timbre', 'bright'),
    lemma: 'bright',
    variants: ['brighter', 'brightness', 'brilliant', 'shiny', 'sparkly'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'high',
      affects: ['timbre', 'frequency', 'presence', 'clarity']
    },
    description: 'Emphasis on high-frequency content',
    examples: [
      'make it brighter',
      'add brightness',
      'brighten the tone'
    ],
    musicalContext: ['mixing', 'production', 'EQ', 'synthesis']
  },
  {
    id: createLexemeId('timbre', 'dark'),
    lemma: 'dark',
    variants: ['darker', 'darkness', 'dull', 'muted', 'mellow'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'low',
      affects: ['timbre', 'frequency', 'warmth', 'depth']
    },
    description: 'Reduced high-frequency content',
    examples: [
      'make it darker',
      'darken the tone',
      'reduce brightness'
    ],
    musicalContext: ['mixing', 'production', 'EQ', 'synthesis']
  },
  {
    id: createLexemeId('timbre', 'warm'),
    lemma: 'warm',
    variants: ['warmer', 'warmth', 'rich', 'full', 'rounded'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'mid',
      affects: ['timbre', 'body', 'presence', 'character']
    },
    description: 'Pleasant low-mid emphasis with smooth high end',
    examples: [
      'make it warmer',
      'add warmth',
      'warm up the sound'
    ],
    musicalContext: ['mixing', 'production', 'analog', 'vintage']
  },
  {
    id: createLexemeId('timbre', 'cold'),
    lemma: 'cold',
    variants: ['colder', 'clinical', 'sterile', 'harsh', 'digital'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'high',
      affects: ['timbre', 'character', 'presence']
    },
    description: 'Clean, possibly harsh high frequencies without warmth',
    examples: [
      'make it colder',
      'clinical sound',
      'sterile character'
    ],
    musicalContext: ['electronic', 'digital', 'production']
  },
  {
    id: createLexemeId('timbre', 'crisp'),
    lemma: 'crisp',
    variants: ['crisper', 'crispness', 'clear', 'defined', 'articulate'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'high',
      affects: ['timbre', 'definition', 'clarity', 'attack']
    },
    description: 'Clear high-frequency detail with good transients',
    examples: [
      'make it crisper',
      'add crispness',
      'crisp attack'
    ],
    musicalContext: ['mixing', 'percussion', 'production']
  },
  {
    id: createLexemeId('timbre', 'muddy'),
    lemma: 'muddy',
    variants: ['muddiness', 'unclear', 'boomy', 'woofy', 'boxy'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'low',
      affects: ['timbre', 'clarity', 'definition']
    },
    description: 'Excessive low-mid buildup obscuring detail',
    examples: [
      'reduce muddiness',
      'clean up the mud',
      'de-mud the mix'
    ],
    musicalContext: ['mixing', 'problem-solving', 'EQ']
  },
  {
    id: createLexemeId('timbre', 'thin'),
    lemma: 'thin',
    variants: ['thinner', 'thinness', 'weak', 'lacking body', 'anemic'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'mid',
      affects: ['timbre', 'body', 'weight', 'presence']
    },
    description: 'Lacking body and fullness',
    examples: [
      'too thin',
      'lacks body',
      'add thickness'
    ],
    musicalContext: ['mixing', 'problem-solving', 'EQ']
  },
  {
    id: createLexemeId('timbre', 'full'),
    lemma: 'full',
    variants: ['fuller', 'fullness', 'thick', 'rich', 'substantial'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'full',
      affects: ['timbre', 'body', 'weight', 'presence']
    },
    description: 'Well-balanced across frequency spectrum',
    examples: [
      'make it fuller',
      'add fullness',
      'thicken the sound'
    ],
    musicalContext: ['mixing', 'production', 'synthesis']
  },
  {
    id: createLexemeId('timbre', 'airy'),
    lemma: 'airy',
    variants: ['air', 'breathy', 'open', 'spacious', 'ethereal'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'air',
      affects: ['timbre', 'space', 'dimension', 'clarity']
    },
    description: 'Emphasis on ultra-high frequencies (8kHz+)',
    examples: [
      'add air',
      'make it airier',
      'open up the top end'
    ],
    musicalContext: ['mixing', 'vocals', 'mastering']
  },
  {
    id: createLexemeId('timbre', 'boxy'),
    lemma: 'boxy',
    variants: ['boxiness', 'nasal', 'honky', 'resonant'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      spectralRegion: 'mid',
      affects: ['timbre', 'resonance', 'character']
    },
    description: 'Unpleasant mid-range resonance (500Hz-1kHz)',
    examples: [
      'reduce boxiness',
      'de-box the sound',
      'cut nasal frequencies'
    ],
    musicalContext: ['mixing', 'problem-solving', 'EQ']
  }
];

// =============================================================================
// Textural Qualities
// =============================================================================

export const TEXTURAL_QUALITY_LEXEMES: readonly TimbreLexeme[] = [
  {
    id: createLexemeId('timbre', 'smooth'),
    lemma: 'smooth',
    variants: ['smoother', 'smoothness', 'silky', 'polished', 'refined'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'grain', 'character']
    },
    description: 'Absence of harsh edges or graininess',
    examples: [
      'make it smoother',
      'smooth out the sound',
      'silky texture'
    ],
    musicalContext: ['production', 'synthesis', 'mixing']
  },
  {
    id: createLexemeId('timbre', 'rough'),
    lemma: 'rough',
    variants: ['rougher', 'roughness', 'raw', 'coarse', 'edgy'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'grain', 'aggression']
    },
    description: 'Grainy, distorted, or aggressive character',
    examples: [
      'make it rougher',
      'add roughness',
      'raw texture'
    ],
    musicalContext: ['rock', 'distortion', 'lo-fi']
  },
  {
    id: createLexemeId('timbre', 'gritty'),
    lemma: 'gritty',
    variants: ['grittier', 'grittiness', 'dirty', 'grainy', 'sandy'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'grain', 'character', 'saturation']
    },
    description: 'Textured with slight distortion or noise',
    examples: [
      'add grittiness',
      'make it grittier',
      'gritty character'
    ],
    musicalContext: ['lo-fi', 'vintage', 'hip-hop']
  },
  {
    id: createLexemeId('timbre', 'clean'),
    lemma: 'clean',
    variants: ['cleaner', 'pristine', 'pure', 'clear', 'transparent'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'clarity', 'definition']
    },
    description: 'Free from distortion, noise, or coloration',
    examples: [
      'keep it clean',
      'clean sound',
      'pristine quality'
    ],
    musicalContext: ['hi-fi', 'classical', 'production']
  },
  {
    id: createLexemeId('timbre', 'distorted'),
    lemma: 'distorted',
    variants: ['distortion', 'overdriven', 'saturated', 'crushed', 'clipped'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'harmonics', 'aggression']
    },
    description: 'Intentional harmonic saturation or clipping',
    examples: [
      'add distortion',
      'distort the signal',
      'saturate it'
    ],
    musicalContext: ['rock', 'metal', 'electronic', 'lo-fi']
  },
  {
    id: createLexemeId('timbre', 'fuzzy'),
    lemma: 'fuzzy',
    variants: ['fuzz', 'fuzzier', 'fuzzy tone', 'fuzzed'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'harmonics', 'saturation']
    },
    description: 'Heavy square-wave-like distortion',
    examples: [
      'add fuzz',
      'make it fuzzier',
      'fuzzy guitar tone'
    ],
    musicalContext: ['rock', 'psychedelic', 'guitar']
  },
  {
    id: createLexemeId('timbre', 'crunchy'),
    lemma: 'crunchy',
    variants: ['crunch', 'crunchier', 'crunchiness', 'crunched'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'harmonics', 'aggression']
    },
    description: 'Mid-range distortion with bite',
    examples: [
      'add crunch',
      'crunchy tone',
      'make it crunchier'
    ],
    musicalContext: ['rock', 'metal', 'guitar']
  },
  {
    id: createLexemeId('timbre', 'glassy'),
    lemma: 'glassy',
    variants: ['glass', 'glassier', 'glass-like', 'crystalline'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'clarity', 'brittleness']
    },
    description: 'Clear, bright, sometimes brittle high frequencies',
    examples: [
      'glassy tone',
      'add glass quality',
      'crystalline sound'
    ],
    musicalContext: ['electronic', 'synthesis', 'ambient']
  },
  {
    id: createLexemeId('timbre', 'hollow'),
    lemma: 'hollow',
    variants: ['hollower', 'hollowness', 'scooped', 'thin-bodied'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'body', 'midrange']
    },
    description: 'Lacking midrange content',
    examples: [
      'sounds hollow',
      'scooped mids',
      'hollow character'
    ],
    musicalContext: ['EQ', 'metal', 'problem-solving']
  },
  {
    id: createLexemeId('timbre', 'dense'),
    lemma: 'dense',
    variants: ['denser', 'density', 'compact', 'thick', 'heavy'],
    category: 'adjective',
    semantics: {
      type: 'texture',
      affects: ['timbre', 'weight', 'complexity']
    },
    description: 'Rich in harmonic content and layering',
    examples: [
      'make it denser',
      'add density',
      'thick sound'
    ],
    musicalContext: ['production', 'synthesis', 'layering']
  }
];

// =============================================================================
// Envelope and Dynamic Qualities
// =============================================================================

export const ENVELOPE_QUALITY_LEXEMES: readonly TimbreLexeme[] = [
  {
    id: createLexemeId('timbre', 'punchy'),
    lemma: 'punchy',
    variants: ['punch', 'punchier', 'punchiness', 'impactful'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['attack', 'impact', 'transient', 'dynamics']
    },
    description: 'Strong, well-defined transient attack',
    examples: [
      'make it punchier',
      'add punch',
      'punchy sound'
    ],
    musicalContext: ['drums', 'mixing', 'compression']
  },
  {
    id: createLexemeId('timbre', 'soft'),
    lemma: 'soft',
    variants: ['softer', 'softness', 'gentle', 'delicate', 'subtle'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['attack', 'dynamics', 'presence']
    },
    description: 'Gentle attack and lower dynamic intensity',
    examples: [
      'make it softer',
      'gentle attack',
      'delicate sound'
    ],
    musicalContext: ['mixing', 'dynamics', 'ballad']
  },
  {
    id: createLexemeId('timbre', 'snappy'),
    lemma: 'snappy',
    variants: ['snap', 'snappier', 'snappiness', 'quick'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['attack', 'transient', 'articulation']
    },
    description: 'Very fast attack with immediate impact',
    examples: [
      'make it snappier',
      'add snap',
      'snappy attack'
    ],
    musicalContext: ['drums', 'percussion', 'transient design']
  },
  {
    id: createLexemeId('timbre', 'sustained'),
    lemma: 'sustained',
    variants: ['sustain', 'sustaining', 'held', 'long'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['sustain', 'duration', 'decay']
    },
    description: 'Extended sustain phase',
    examples: [
      'more sustained',
      'longer sustain',
      'hold the notes'
    ],
    musicalContext: ['synthesis', 'guitar', 'sustain']
  },
  {
    id: createLexemeId('timbre', 'plucky'),
    lemma: 'plucky',
    variants: ['pluck', 'plucked', 'pizzicato-like', 'short'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['attack', 'decay', 'articulation']
    },
    description: 'Fast attack with quick decay (plucked string character)',
    examples: [
      'plucky sound',
      'make it pluckier',
      'plucked quality'
    ],
    musicalContext: ['synthesis', 'strings', 'electronic']
  },
  {
    id: createLexemeId('timbre', 'swelling'),
    lemma: 'swelling',
    variants: ['swell', 'swells', 'slow-attack', 'fading-in'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['attack', 'dynamics', 'fade']
    },
    description: 'Gradual volume increase (slow attack)',
    examples: [
      'add swells',
      'swelling pads',
      'slow attack'
    ],
    musicalContext: ['ambient', 'pads', 'strings']
  },
  {
    id: createLexemeId('timbre', 'percussive'),
    lemma: 'percussive',
    variants: ['percussion-like', 'struck', 'impulsive', 'transient'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['attack', 'transient', 'decay']
    },
    description: 'Sharp attack with relatively short decay',
    examples: [
      'more percussive',
      'percussive quality',
      'struck sound'
    ],
    musicalContext: ['synthesis', 'percussion', 'transient']
  },
  {
    id: createLexemeId('timbre', 'legato'),
    lemma: 'legato',
    variants: ['smooth', 'connected', 'flowing', 'continuous'],
    category: 'adjective',
    semantics: {
      type: 'envelope',
      affects: ['phrasing', 'articulation', 'connection']
    },
    description: 'Smooth connection between notes',
    examples: [
      'play legato',
      'smooth phrasing',
      'connected notes'
    ],
    musicalContext: ['performance', 'articulation', 'classical']
  }
];

// =============================================================================
// Modulation and Movement
// =============================================================================

export const MODULATION_QUALITY_LEXEMES: readonly TimbreLexeme[] = [
  {
    id: createLexemeId('timbre', 'vibrato'),
    lemma: 'vibrato',
    variants: ['with vibrato', 'vibrato effect', 'pitch wobble'],
    category: 'noun',
    semantics: {
      type: 'modulation',
      affects: ['pitch', 'expression', 'movement']
    },
    description: 'Periodic pitch modulation',
    examples: [
      'add vibrato',
      'play with vibrato',
      'vibrato depth'
    ],
    musicalContext: ['strings', 'vocals', 'synthesis']
  },
  {
    id: createLexemeId('timbre', 'tremolo'),
    lemma: 'tremolo',
    variants: ['with tremolo', 'tremolo effect', 'amplitude wobble'],
    category: 'noun',
    semantics: {
      type: 'modulation',
      affects: ['amplitude', 'movement', 'dynamics']
    },
    description: 'Periodic amplitude modulation',
    examples: [
      'add tremolo',
      'tremolo effect',
      'tremolo depth'
    ],
    musicalContext: ['guitar', 'synthesis', 'effects']
  },
  {
    id: createLexemeId('timbre', 'chorus'),
    lemma: 'chorus',
    variants: ['chorus effect', 'chorused', 'ensemble effect'],
    category: 'noun',
    semantics: {
      type: 'modulation',
      affects: ['width', 'thickness', 'movement']
    },
    description: 'Pitch and time modulation creating ensemble effect',
    examples: [
      'add chorus',
      'chorus effect',
      'chorused sound'
    ],
    musicalContext: ['guitar', 'synthesis', 'production']
  },
  {
    id: createLexemeId('timbre', 'phaser'),
    lemma: 'phaser',
    variants: ['phasing', 'phase effect', 'swept', 'swooshy'],
    category: 'noun',
    semantics: {
      type: 'modulation',
      affects: ['spectrum', 'movement', 'sweep']
    },
    description: 'Notch filter sweep creating jet-like effect',
    examples: [
      'add phaser',
      'phasing effect',
      'swept sound'
    ],
    musicalContext: ['psychedelic', 'electronic', 'effects']
  },
  {
    id: createLexemeId('timbre', 'flanger'),
    lemma: 'flanger',
    variants: ['flanging', 'flange effect', 'jet-plane', 'metallic sweep'],
    category: 'noun',
    semantics: {
      type: 'modulation',
      affects: ['spectrum', 'movement', 'metallic']
    },
    description: 'Short delay modulation creating comb-filter sweep',
    examples: [
      'add flanger',
      'flanging effect',
      'jet-plane sound'
    ],
    musicalContext: ['psychedelic', 'electronic', 'guitar']
  },
  {
    id: createLexemeId('timbre', 'ring-modulation'),
    lemma: 'ring modulation',
    variants: ['ring mod', 'bell-like', 'metallic modulation', 'inharmonic'],
    category: 'noun',
    semantics: {
      type: 'modulation',
      affects: ['harmonics', 'timbre', 'metallic']
    },
    description: 'Frequency multiplication creating bell-like tones',
    examples: [
      'add ring modulation',
      'ring mod effect',
      'metallic sound'
    ],
    musicalContext: ['electronic', 'experimental', 'synthesis']
  },
  {
    id: createLexemeId('timbre', 'shimmer'),
    lemma: 'shimmer',
    variants: ['shimmering', 'shimmery', 'sparkling', 'glittering'],
    category: 'adjective',
    semantics: {
      type: 'modulation',
      affects: ['movement', 'brightness', 'texture']
    },
    description: 'Subtle high-frequency modulation or movement',
    examples: [
      'add shimmer',
      'shimmering sound',
      'sparkling texture'
    ],
    musicalContext: ['ambient', 'reverb', 'production']
  },
  {
    id: createLexemeId('timbre', 'warble'),
    lemma: 'warble',
    variants: ['warbling', 'wobble', 'wavering', 'unsteady'],
    category: 'noun',
    semantics: {
      type: 'modulation',
      affects: ['pitch', 'stability', 'movement']
    },
    description: 'Irregular pitch variation',
    examples: [
      'add warble',
      'warbling effect',
      'pitch wobble'
    ],
    musicalContext: ['tape', 'lo-fi', 'vintage']
  }
];

// =============================================================================
// Spatial and Dimensional Qualities
// =============================================================================

export const SPATIAL_QUALITY_LEXEMES: readonly TimbreLexeme[] = [
  {
    id: createLexemeId('timbre', 'wide'),
    lemma: 'wide',
    variants: ['wider', 'width', 'broad', 'expansive', 'panoramic'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      affects: ['stereo', 'space', 'dimension']
    },
    description: 'Extended stereo field',
    examples: [
      'make it wider',
      'add width',
      'broaden the sound'
    ],
    musicalContext: ['mixing', 'stereo', 'production']
  },
  {
    id: createLexemeId('timbre', 'narrow'),
    lemma: 'narrow',
    variants: ['narrower', 'narrow-width', 'centered', 'mono-like'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      affects: ['stereo', 'space', 'focus']
    },
    description: 'Reduced stereo field',
    examples: [
      'make it narrower',
      'reduce width',
      'center the sound'
    ],
    musicalContext: ['mixing', 'stereo', 'focus']
  },
  {
    id: createLexemeId('timbre', 'close'),
    lemma: 'close',
    variants: ['closer', 'intimate', 'near', 'upfront', 'present'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      affects: ['depth', 'presence', 'intimacy']
    },
    description: 'Forward in the mix with detail',
    examples: [
      'bring it closer',
      'intimate sound',
      'upfront presence'
    ],
    musicalContext: ['mixing', 'depth', 'vocals']
  },
  {
    id: createLexemeId('timbre', 'distant'),
    lemma: 'distant',
    variants: ['far', 'farther', 'remote', 'receded', 'background'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      affects: ['depth', 'space', 'reverb']
    },
    description: 'Back in the mix with reduced detail',
    examples: [
      'push it back',
      'distant sound',
      'recede into background'
    ],
    musicalContext: ['mixing', 'depth', 'ambience']
  },
  {
    id: createLexemeId('timbre', 'spacious'),
    lemma: 'spacious',
    variants: ['space', 'roomy', 'open', 'airy', 'dimensional'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      affects: ['space', 'reverb', 'dimension', 'air']
    },
    description: 'Sense of acoustic space and dimension',
    examples: [
      'add space',
      'make it spacious',
      'open up the sound'
    ],
    musicalContext: ['reverb', 'mixing', 'ambient']
  },
  {
    id: createLexemeId('timbre', 'dry'),
    lemma: 'dry',
    variants: ['drier', 'dryness', 'dead', 'close-miked', 'direct'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      affects: ['space', 'reverb', 'intimacy']
    },
    description: 'Minimal reverb or ambience',
    examples: [
      'make it drier',
      'remove reverb',
      'dry sound'
    ],
    musicalContext: ['mixing', 'reverb', 'close-mic']
  },
  {
    id: createLexemeId('timbre', 'wet'),
    lemma: 'wet',
    variants: ['wetter', 'wetness', 'reverberant', 'ambient', 'processed'],
    category: 'adjective',
    semantics: {
      type: 'quality',
      affects: ['space', 'reverb', 'ambience']
    },
    description: 'Prominent reverb or effects',
    examples: [
      'make it wetter',
      'add reverb',
      'wet sound'
    ],
    musicalContext: ['mixing', 'reverb', 'effects']
  }
];

// =============================================================================
// Combined Export
// =============================================================================

/**
 * All timbre and sound design lexemes for Batch 23.
 */
export const BATCH_23_TIMBRE_SOUND_DESIGN: readonly TimbreLexeme[] = [
  ...SPECTRAL_QUALITY_LEXEMES,
  ...TEXTURAL_QUALITY_LEXEMES,
  ...ENVELOPE_QUALITY_LEXEMES,
  ...MODULATION_QUALITY_LEXEMES,
  ...SPATIAL_QUALITY_LEXEMES
];

/**
 * Count of lexemes in this batch.
 */
export const BATCH_23_COUNT = BATCH_23_TIMBRE_SOUND_DESIGN.length;

/**
 * Categories covered in this batch.
 */
export const BATCH_23_CATEGORIES = [
  'spectral-qualities',
  'textural-qualities',
  'envelope-qualities',
  'modulation-qualities',
  'spatial-qualities'
] as const;
