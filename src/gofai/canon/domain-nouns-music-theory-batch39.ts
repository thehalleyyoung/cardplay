/**
 * GOFAI Canon — Domain Nouns Batch 39: Music Theory Comprehensive
 *
 * Exhaustive coverage of music theory terminology including:
 * - Chord types (triads, seventh chords, extensions, alterations)
 * - Scale types (modes, pentatonics, exotic scales, synthetic scales)
 * - Harmonic functions and progressions
 * - Intervals and interval qualities
 * - Voice leading concepts
 * - Cadence types
 * - Modulation techniques
 * - Harmonic analysis terms
 *
 * This batch provides deep theory vocabulary for sophisticated harmonic
 * reasoning and transformation capabilities.
 *
 * Following gofai_goalB.md Step 002-004: comprehensive domain coverage
 * with stable IDs and rich semantic grounding.
 *
 * @module gofai/canon/domain-nouns-music-theory-batch39
 */

import type { Lexeme } from './types';
import { createLexemeId } from './types';

// =============================================================================
// Chord Types: Triads
// =============================================================================

export const TRIAD_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'major_triad'),
    lemma: 'major triad',
    variants: ['major triad', 'major chord', 'major', 'maj'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Major triad (root, major third, perfect fifth)',
    examples: [
      'use a major triad',
      'make it a major chord',
      'change to major',
    ],
  },

  {
    id: createLexemeId('noun', 'minor_triad'),
    lemma: 'minor triad',
    variants: ['minor triad', 'minor chord', 'minor', 'min', 'm'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Minor triad (root, minor third, perfect fifth)',
    examples: [
      'use a minor triad',
      'make it minor',
      'switch to minor chord',
    ],
  },

  {
    id: createLexemeId('noun', 'diminished_triad'),
    lemma: 'diminished triad',
    variants: ['diminished triad', 'diminished chord', 'diminished', 'dim', 'º'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Diminished triad (root, minor third, diminished fifth)',
    examples: [
      'use a diminished triad',
      'make it diminished',
      'add a diminished chord',
    ],
  },

  {
    id: createLexemeId('noun', 'augmented_triad'),
    lemma: 'augmented triad',
    variants: ['augmented triad', 'augmented chord', 'augmented', 'aug', '+'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Augmented triad (root, major third, augmented fifth)',
    examples: [
      'use an augmented triad',
      'make it augmented',
      'add an augmented chord',
    ],
  },

  {
    id: createLexemeId('noun', 'suspended_chord'),
    lemma: 'suspended chord',
    variants: ['suspended chord', 'sus chord', 'sus2', 'sus4', 'suspended'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Suspended chord (replaces third with second or fourth)',
    examples: [
      'use a suspended chord',
      'make it sus4',
      'add a sus2 chord',
    ],
  },
];

// =============================================================================
// Chord Types: Seventh Chords
// =============================================================================

export const SEVENTH_CHORD_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'major_seventh'),
    lemma: 'major seventh',
    variants: ['major seventh', 'maj7', 'M7', 'major 7th', 'major seven'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'extension',
    },
    description: 'Major seventh chord (major triad + major seventh)',
    examples: [
      'use a major seventh',
      'make it maj7',
      'add major seventh chords',
    ],
  },

  {
    id: createLexemeId('noun', 'minor_seventh'),
    lemma: 'minor seventh',
    variants: ['minor seventh', 'min7', 'm7', 'minor 7th', 'minor seven'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'extension',
    },
    description: 'Minor seventh chord (minor triad + minor seventh)',
    examples: [
      'use a minor seventh',
      'make it m7',
      'add minor seventh chords',
    ],
  },

  {
    id: createLexemeId('noun', 'dominant_seventh'),
    lemma: 'dominant seventh',
    variants: ['dominant seventh', '7', 'dom7', 'dominant 7th', 'seventh'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'function',
    },
    description: 'Dominant seventh chord (major triad + minor seventh)',
    examples: [
      'use a dominant seventh',
      'make it a 7 chord',
      'add dominant sevenths',
    ],
  },

  {
    id: createLexemeId('noun', 'half_diminished_seventh'),
    lemma: 'half diminished seventh',
    variants: ['half diminished seventh', 'half-diminished', 'm7b5', 'ø7', 'minor seven flat five'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Half-diminished seventh chord (diminished triad + minor seventh)',
    examples: [
      'use a half-diminished seventh',
      'make it m7b5',
      'add half-diminished chords',
    ],
  },

  {
    id: createLexemeId('noun', 'fully_diminished_seventh'),
    lemma: 'fully diminished seventh',
    variants: ['fully diminished seventh', 'diminished seventh', 'dim7', 'º7', 'fully dim'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Fully diminished seventh chord (diminished triad + diminished seventh)',
    examples: [
      'use a diminished seventh',
      'make it dim7',
      'add diminished seventh chords',
    ],
  },

  {
    id: createLexemeId('noun', 'major_minor_seventh'),
    lemma: 'major-minor seventh',
    variants: ['major-minor seventh', 'minor-major seventh', 'mM7', 'm(maj7)', 'minor major 7'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'quality',
    },
    description: 'Minor-major seventh chord (minor triad + major seventh)',
    examples: [
      'use a minor-major seventh',
      'make it mM7',
      'add minor-major chords',
    ],
  },
];

// =============================================================================
// Chord Extensions
// =============================================================================

export const CHORD_EXTENSION_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'ninth_chord'),
    lemma: 'ninth chord',
    variants: ['ninth chord', '9', 'add9', 'major ninth', 'minor ninth', 'ninth'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'extension',
    },
    description: 'Chord with added ninth',
    examples: [
      'add a ninth',
      'use ninth chords',
      'extend with ninths',
    ],
  },

  {
    id: createLexemeId('noun', 'eleventh_chord'),
    lemma: 'eleventh chord',
    variants: ['eleventh chord', '11', 'add11', 'eleventh', '11th chord'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'extension',
    },
    description: 'Chord with added eleventh',
    examples: [
      'add an eleventh',
      'use eleventh chords',
      'extend with elevenths',
    ],
  },

  {
    id: createLexemeId('noun', 'thirteenth_chord'),
    lemma: 'thirteenth chord',
    variants: ['thirteenth chord', '13', 'add13', 'thirteenth', '13th chord'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'extension',
    },
    description: 'Chord with added thirteenth',
    examples: [
      'add a thirteenth',
      'use thirteenth chords',
      'extend with thirteenths',
    ],
  },

  {
    id: createLexemeId('noun', 'altered_chord'),
    lemma: 'altered chord',
    variants: ['altered chord', 'alt chord', '7alt', 'altered dominant', 'super-locrian'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'alteration',
    },
    description: 'Chord with altered fifths and ninths',
    examples: [
      'use altered chords',
      'make it an alt chord',
      'add altered dominants',
    ],
  },

  {
    id: createLexemeId('noun', 'sharp_eleven'),
    lemma: 'sharp eleven',
    variants: ['sharp eleven', '#11', 'sharp 11', 'raised eleven', 'lydian chord'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'alteration',
    },
    description: 'Chord with sharp eleven',
    examples: [
      'add a sharp eleven',
      'use #11 chords',
      'add lydian color',
    ],
  },

  {
    id: createLexemeId('noun', 'flat_nine'),
    lemma: 'flat nine',
    variants: ['flat nine', 'b9', 'flat 9', 'minor nine', 'lowered ninth'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'chord',
      aspect: 'alteration',
    },
    description: 'Chord with flat nine',
    examples: [
      'add a flat nine',
      'use b9 chords',
      'add tension with flat ninths',
    ],
  },
];

// =============================================================================
// Scale Types: Diatonic Modes
// =============================================================================

export const DIATONIC_MODE_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'ionian_mode'),
    lemma: 'ionian mode',
    variants: ['ionian', 'ionian mode', 'major scale', 'major mode'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'First mode of major scale (major scale)',
    examples: [
      'use ionian mode',
      'play in ionian',
      'major scale pattern',
    ],
  },

  {
    id: createLexemeId('noun', 'dorian_mode'),
    lemma: 'dorian mode',
    variants: ['dorian', 'dorian mode', 'dorian minor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Second mode of major scale (minor with raised sixth)',
    examples: [
      'use dorian mode',
      'play in dorian',
      'dorian flavor',
    ],
  },

  {
    id: createLexemeId('noun', 'phrygian_mode'),
    lemma: 'phrygian mode',
    variants: ['phrygian', 'phrygian mode', 'phrygian minor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Third mode of major scale (minor with flat second)',
    examples: [
      'use phrygian mode',
      'play in phrygian',
      'phrygian sound',
    ],
  },

  {
    id: createLexemeId('noun', 'lydian_mode'),
    lemma: 'lydian mode',
    variants: ['lydian', 'lydian mode', 'lydian major'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Fourth mode of major scale (major with raised fourth)',
    examples: [
      'use lydian mode',
      'play in lydian',
      'lydian brightness',
    ],
  },

  {
    id: createLexemeId('noun', 'mixolydian_mode'),
    lemma: 'mixolydian mode',
    variants: ['mixolydian', 'mixolydian mode', 'dominant mode'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Fifth mode of major scale (major with flat seventh)',
    examples: [
      'use mixolydian mode',
      'play in mixolydian',
      'dominant sound',
    ],
  },

  {
    id: createLexemeId('noun', 'aeolian_mode'),
    lemma: 'aeolian mode',
    variants: ['aeolian', 'aeolian mode', 'natural minor', 'minor scale'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Sixth mode of major scale (natural minor scale)',
    examples: [
      'use aeolian mode',
      'play in natural minor',
      'aeolian sound',
    ],
  },

  {
    id: createLexemeId('noun', 'locrian_mode'),
    lemma: 'locrian mode',
    variants: ['locrian', 'locrian mode', 'half-diminished mode'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Seventh mode of major scale (diminished scale)',
    examples: [
      'use locrian mode',
      'play in locrian',
      'locrian tension',
    ],
  },
];

// =============================================================================
// Scale Types: Melodic and Harmonic Minor
// =============================================================================

export const MINOR_SCALE_VARIANT_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'harmonic_minor'),
    lemma: 'harmonic minor',
    variants: ['harmonic minor', 'harmonic minor scale', 'minor with raised seventh'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'variant',
    },
    description: 'Natural minor with raised seventh',
    examples: [
      'use harmonic minor',
      'play harmonic minor scale',
      'add harmonic minor flavor',
    ],
  },

  {
    id: createLexemeId('noun', 'melodic_minor'),
    lemma: 'melodic minor',
    variants: ['melodic minor', 'melodic minor scale', 'jazz minor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'variant',
    },
    description: 'Natural minor with raised sixth and seventh',
    examples: [
      'use melodic minor',
      'play melodic minor scale',
      'jazz minor sound',
    ],
  },

  {
    id: createLexemeId('noun', 'phrygian_dominant'),
    lemma: 'phrygian dominant',
    variants: ['phrygian dominant', 'spanish phrygian', 'freygish', 'fifth mode harmonic minor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Fifth mode of harmonic minor (major with flat second)',
    examples: [
      'use phrygian dominant',
      'play spanish phrygian',
      'add middle eastern flavor',
    ],
  },

  {
    id: createLexemeId('noun', 'lydian_augmented'),
    lemma: 'lydian augmented',
    variants: ['lydian augmented', 'lydian #5', 'third mode melodic minor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Third mode of melodic minor',
    examples: [
      'use lydian augmented',
      'play lydian #5',
      'add bright augmented sound',
    ],
  },

  {
    id: createLexemeId('noun', 'super_locrian'),
    lemma: 'super locrian',
    variants: ['super locrian', 'altered scale', 'diminished whole tone', 'seventh mode melodic minor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'mode',
    },
    description: 'Seventh mode of melodic minor (altered scale)',
    examples: [
      'use super locrian',
      'play altered scale',
      'add tension with super locrian',
    ],
  },
];

// =============================================================================
// Scale Types: Pentatonic and Blues
// =============================================================================

export const PENTATONIC_BLUES_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'major_pentatonic'),
    lemma: 'major pentatonic',
    variants: ['major pentatonic', 'pentatonic major', 'five-note major scale'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'pentatonic',
    },
    description: 'Five-note major scale without half-steps',
    examples: [
      'use major pentatonic',
      'play pentatonic major scale',
      'add pentatonic flavor',
    ],
  },

  {
    id: createLexemeId('noun', 'minor_pentatonic'),
    lemma: 'minor pentatonic',
    variants: ['minor pentatonic', 'pentatonic minor', 'five-note minor scale'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'pentatonic',
    },
    description: 'Five-note minor scale without half-steps',
    examples: [
      'use minor pentatonic',
      'play pentatonic minor scale',
      'add blues rock flavor',
    ],
  },

  {
    id: createLexemeId('noun', 'blues_scale'),
    lemma: 'blues scale',
    variants: ['blues scale', 'blues', 'blue notes', 'blues pentatonic'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'blues',
    },
    description: 'Minor pentatonic with added flat five',
    examples: [
      'use blues scale',
      'play blues notes',
      'add blues feel',
    ],
  },

  {
    id: createLexemeId('noun', 'hexatonic_scale'),
    lemma: 'hexatonic scale',
    variants: ['hexatonic', 'six-note scale', 'augmented scale', 'prometheus scale'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'synthetic',
    },
    description: 'Six-note symmetrical scale',
    examples: [
      'use hexatonic scale',
      'play augmented hexatonic',
      'add symmetrical sound',
    ],
  },
];

// =============================================================================
// Scale Types: Symmetrical and Synthetic
// =============================================================================

export const SYNTHETIC_SCALE_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'whole_tone_scale'),
    lemma: 'whole tone scale',
    variants: ['whole tone', 'whole-tone scale', 'augmented scale', 'six-tone scale'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'symmetrical',
    },
    description: 'Scale composed entirely of whole steps',
    examples: [
      'use whole tone scale',
      'play whole tone',
      'add dreamy ambiguity',
    ],
  },

  {
    id: createLexemeId('noun', 'diminished_scale'),
    lemma: 'diminished scale',
    variants: ['diminished scale', 'octatonic scale', 'half-whole scale', 'whole-half scale'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'symmetrical',
    },
    description: 'Alternating half and whole steps',
    examples: [
      'use diminished scale',
      'play octatonic',
      'add symmetrical tension',
    ],
  },

  {
    id: createLexemeId('noun', 'chromatic_scale'),
    lemma: 'chromatic scale',
    variants: ['chromatic', 'chromatic scale', 'twelve-tone scale', 'all notes'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'chromatic',
    },
    description: 'All twelve pitches in sequential half steps',
    examples: [
      'use chromatic scale',
      'play chromatically',
      'add chromatic passing tones',
    ],
  },

  {
    id: createLexemeId('noun', 'bebop_scale'),
    lemma: 'bebop scale',
    variants: ['bebop scale', 'bebop', 'jazz bebop scale', 'bebop dominant'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'scale',
      aspect: 'jazz',
    },
    description: 'Major or dominant scale with added chromatic passing tone',
    examples: [
      'use bebop scale',
      'play bebop lines',
      'add jazz bebop flavor',
    ],
  },
];

// =============================================================================
// Harmonic Functions
// =============================================================================

export const HARMONIC_FUNCTION_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'tonic'),
    lemma: 'tonic',
    variants: ['tonic', 'tonic chord', 'I chord', 'home chord', 'resolution'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'function',
      aspect: 'stability',
    },
    description: 'Home chord, center of tonality',
    examples: [
      'resolve to tonic',
      'use tonic function',
      'end on the I chord',
    ],
  },

  {
    id: createLexemeId('noun', 'dominant'),
    lemma: 'dominant',
    variants: ['dominant', 'dominant chord', 'V chord', 'fifth chord'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'function',
      aspect: 'tension',
    },
    description: 'Fifth scale degree chord, creates tension',
    examples: [
      'add dominant function',
      'use V chord',
      'create dominant tension',
    ],
  },

  {
    id: createLexemeId('noun', 'subdominant'),
    lemma: 'subdominant',
    variants: ['subdominant', 'subdominant chord', 'IV chord', 'fourth chord', 'pre-dominant'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'function',
      aspect: 'motion',
    },
    description: 'Fourth scale degree chord, moves toward dominant',
    examples: [
      'add subdominant',
      'use IV chord',
      'create pre-dominant motion',
    ],
  },

  {
    id: createLexemeId('noun', 'mediant'),
    lemma: 'mediant',
    variants: ['mediant', 'mediant chord', 'III chord', 'third chord'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'function',
      aspect: 'color',
    },
    description: 'Third scale degree chord',
    examples: [
      'use mediant chord',
      'add III chord',
      'mediant substitution',
    ],
  },

  {
    id: createLexemeId('noun', 'submediant'),
    lemma: 'submediant',
    variants: ['submediant', 'submediant chord', 'VI chord', 'sixth chord', 'relative major', 'relative minor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'function',
      aspect: 'color',
    },
    description: 'Sixth scale degree chord, relative major/minor',
    examples: [
      'use submediant',
      'add VI chord',
      'shift to relative minor',
    ],
  },

  {
    id: createLexemeId('noun', 'leading_tone'),
    lemma: 'leading tone',
    variants: ['leading tone', 'leading-tone chord', 'VII chord', 'vii°', 'diminished seventh'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'function',
      aspect: 'resolution',
    },
    description: 'Seventh scale degree chord, strong pull to tonic',
    examples: [
      'use leading-tone chord',
      'add VII°',
      'create leading-tone motion',
    ],
  },
];

// =============================================================================
// Cadence Types
// =============================================================================

export const CADENCE_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'perfect_cadence'),
    lemma: 'perfect cadence',
    variants: ['perfect cadence', 'authentic cadence', 'V-I', 'PAC', 'full cadence'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'cadence',
      aspect: 'conclusive',
    },
    description: 'Dominant to tonic cadence, conclusive ending',
    examples: [
      'use perfect cadence',
      'end with authentic cadence',
      'create V-I resolution',
    ],
  },

  {
    id: createLexemeId('noun', 'plagal_cadence'),
    lemma: 'plagal cadence',
    variants: ['plagal cadence', 'IV-I', 'amen cadence', 'subdominant cadence'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'cadence',
      aspect: 'conclusive',
    },
    description: 'Subdominant to tonic cadence',
    examples: [
      'use plagal cadence',
      'add amen cadence',
      'create IV-I resolution',
    ],
  },

  {
    id: createLexemeId('noun', 'half_cadence'),
    lemma: 'half cadence',
    variants: ['half cadence', 'imperfect cadence', 'HC', 'ending on V', 'semi-cadence'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'cadence',
      aspect: 'inconclusive',
    },
    description: 'Cadence ending on dominant, creates anticipation',
    examples: [
      'use half cadence',
      'end on dominant',
      'create tension with HC',
    ],
  },

  {
    id: createLexemeId('noun', 'deceptive_cadence'),
    lemma: 'deceptive cadence',
    variants: ['deceptive cadence', 'interrupted cadence', 'V-vi', 'false cadence', 'surprise resolution'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'cadence',
      aspect: 'surprise',
    },
    description: 'Dominant resolves to unexpected chord (usually vi)',
    examples: [
      'use deceptive cadence',
      'surprise with V-vi',
      'interrupt the resolution',
    ],
  },

  {
    id: createLexemeId('noun', 'picardy_third'),
    lemma: 'picardy third',
    variants: ['picardy third', 'tierce de picardie', 'major ending', 'raised third'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'cadence',
      aspect: 'alteration',
    },
    description: 'Minor key piece ending on major tonic chord',
    examples: [
      'use picardy third',
      'end on major tonic',
      'add raised third at cadence',
    ],
  },
];

// =============================================================================
// Voice Leading Concepts
// =============================================================================

export const VOICE_LEADING_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'contrary_motion'),
    lemma: 'contrary motion',
    variants: ['contrary motion', 'opposite motion', 'countermotion'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'voice_leading',
      aspect: 'motion',
    },
    description: 'Voices move in opposite directions',
    examples: [
      'use contrary motion',
      'voices move oppositely',
      'add counterpoint',
    ],
  },

  {
    id: createLexemeId('noun', 'parallel_motion'),
    lemma: 'parallel motion',
    variants: ['parallel motion', 'parallel voices', 'parallel movement'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'voice_leading',
      aspect: 'motion',
    },
    description: 'Voices move in same direction by same interval',
    examples: [
      'use parallel motion',
      'voices move together',
      'parallel fifths',
    ],
  },

  {
    id: createLexemeId('noun', 'oblique_motion'),
    lemma: 'oblique motion',
    variants: ['oblique motion', 'pedal point', 'sustained voice'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'voice_leading',
      aspect: 'motion',
    },
    description: 'One voice stays while others move',
    examples: [
      'use oblique motion',
      'sustain one voice',
      'add pedal point',
    ],
  },

  {
    id: createLexemeId('noun', 'stepwise_motion'),
    lemma: 'stepwise motion',
    variants: ['stepwise', 'conjunct motion', 'scalar motion', 'step motion'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'voice_leading',
      aspect: 'smoothness',
    },
    description: 'Voice moves by step (second)',
    examples: [
      'use stepwise motion',
      'move by steps',
      'create scalar lines',
    ],
  },

  {
    id: createLexemeId('noun', 'leap_motion'),
    lemma: 'leap motion',
    variants: ['leap', 'skip', 'disjunct motion', 'jump'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'harmony',
      domain: 'voice_leading',
      aspect: 'energy',
    },
    description: 'Voice moves by interval larger than second',
    examples: [
      'add leaps',
      'create disjunct motion',
      'voice skips intervals',
    ],
  },
];

// =============================================================================
// Export All Nouns
// =============================================================================

export const MUSIC_THEORY_NOUNS_BATCH_39: readonly Lexeme[] = [
  ...TRIAD_NOUNS,
  ...SEVENTH_CHORD_NOUNS,
  ...CHORD_EXTENSION_NOUNS,
  ...DIATONIC_MODE_NOUNS,
  ...MINOR_SCALE_VARIANT_NOUNS,
  ...PENTATONIC_BLUES_NOUNS,
  ...SYNTHETIC_SCALE_NOUNS,
  ...HARMONIC_FUNCTION_NOUNS,
  ...CADENCE_NOUNS,
  ...VOICE_LEADING_NOUNS,
];

/**
 * Total count of music theory nouns in this batch.
 */
export const BATCH_39_COUNT = MUSIC_THEORY_NOUNS_BATCH_39.length;
