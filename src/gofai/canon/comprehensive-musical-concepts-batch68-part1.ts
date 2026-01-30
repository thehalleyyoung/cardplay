/**
 * GOFAI Canon — Comprehensive Musical Concepts Vocabulary (Batch 68, Part 1 of 3)
 *
 * This batch provides extensive coverage of:
 * 1. Advanced harmonic concepts and chord qualities
 * 2. Melodic patterns and contour shapes
 * 3. Rhythmic feel and micro-timing descriptors
 * 4. Timbre and sonic character vocabulary
 * 5. Spatial and stereo imaging terms
 * 6. Dynamic shaping and envelope descriptors
 * 7. Genre-specific terminology
 * 8. Production and mixing language
 * 9. Performance techniques and articulations
 * 10. Expressive and emotive qualities
 *
 * Total entries in full batch 68: 600 lexemes across 3 parts
 * This part: 200 lexemes
 *
 * @module gofai/canon/comprehensive-musical-concepts-batch68-part1
 */

import type { Lexeme, LexemeId } from './types';
import { makeBuiltinId } from './gofai-id';

// =============================================================================
// Part 1: Advanced Harmonic Concepts (40 entries)
// =============================================================================

export const HARMONIC_CONCEPTS_PART1: readonly Lexeme[] = [
  // Modal interchange and borrowed chords
  {
    id: makeBuiltinId('lex', 'adj', 'borrowed') as LexemeId,
    lemma: 'borrowed',
    variants: ['borrowed', 'borrowed chord', 'modal mixture', 'mode mixture'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'borrowed_chord' as const,
    },
    description: 'A chord borrowed from a parallel mode or scale',
    examples: [
      'add a borrowed chord from minor',
      'use borrowed chords for color',
      'borrow from the parallel minor',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'modal') as LexemeId,
    lemma: 'modal',
    variants: ['modal', 'mode-based', 'using modes'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'modality') as any,
      direction: 'toward_modal' as const,
    },
    description: 'Using modal scales or having a modal quality',
    examples: [
      'make it more modal',
      'add modal flavor',
      'use modal harmony',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'tritone_substitution') as LexemeId,
    lemma: 'tritone substitution',
    variants: ['tritone sub', 'tritone substitution', 'tri-tone sub'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'tritone_substitution' as const,
    },
    description: 'Replacing a dominant chord with one a tritone away',
    examples: [
      'add tritone substitutions',
      'use a tritone sub on the V chord',
      'try tritone substitution in the turnaround',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'secondary_dominant') as LexemeId,
    lemma: 'secondary dominant',
    variants: ['secondary dominant', 'applied dominant', 'secondary V'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'secondary_dominant' as const,
    },
    description: 'A dominant chord leading to a chord other than tonic',
    examples: [
      'add secondary dominants',
      'use secondary dominants for direction',
      'insert a secondary V before the IV',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'chromatic') as LexemeId,
    lemma: 'chromatic',
    variants: ['chromatic', 'chromatically', 'chromatic movement'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'chromaticism') as any,
      direction: 'increase' as const,
    },
    description: 'Using pitches outside the diatonic scale',
    examples: [
      'add chromatic passing tones',
      'make it more chromatic',
      'use chromatic voice leading',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'diatonic') as LexemeId,
    lemma: 'diatonic',
    variants: ['diatonic', 'diatonically', 'within the key'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'chromaticism') as any,
      direction: 'decrease' as const,
    },
    description: 'Using only pitches from the prevailing scale',
    examples: [
      'keep it diatonic',
      'make it more diatonic',
      'use diatonic harmony',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'pedal_point') as LexemeId,
    lemma: 'pedal point',
    variants: ['pedal', 'pedal point', 'pedal tone', 'drone bass'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'pedal_point' as const,
    },
    description: 'A sustained note while harmonies change above it',
    examples: [
      'add a pedal point in the bass',
      'use a tonic pedal',
      'hold a pedal through the progression',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'ostinato') as LexemeId,
    lemma: 'ostinato',
    variants: ['ostinato', 'repeating figure', 'riff'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'rhythm' as const,
      concept: 'ostinato' as const,
    },
    description: 'A persistently repeated musical phrase or rhythm',
    examples: [
      'add an ostinato pattern',
      'create a rhythmic ostinato',
      'use an ostinato in the bass',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'suspended') as LexemeId,
    lemma: 'suspended',
    variants: ['suspended', 'sus', 'suspension'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'suspension' as const,
    },
    description: 'A chord with a non-chord tone that resolves',
    examples: [
      'add suspended chords',
      'use sus4 chords',
      'make it suspended',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'augmented_sixth') as LexemeId,
    lemma: 'augmented sixth',
    variants: ['augmented sixth', 'aug6', 'Italian sixth', 'French sixth', 'German sixth'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'augmented_sixth_chord' as const,
    },
    description: 'A chromatic chord featuring an augmented sixth interval',
    examples: [
      'add an augmented sixth chord',
      'use a German sixth',
      'insert an Italian sixth before V',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'neapolitan') as LexemeId,
    lemma: 'neapolitan',
    variants: ['neapolitan', 'neapolitan sixth', 'N6'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'neapolitan_chord' as const,
    },
    description: 'A major chord built on the lowered second scale degree',
    examples: [
      'add a neapolitan chord',
      'use a neapolitan sixth',
      'insert a neapolitan before V',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'diminished') as LexemeId,
    lemma: 'diminished',
    variants: ['diminished', 'dim', 'dim7'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'diminished_chord' as const,
    },
    description: 'A chord built with diminished intervals',
    examples: [
      'add diminished chords',
      'use a dim7 as passing',
      'make it diminished',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'augmented') as LexemeId,
    lemma: 'augmented',
    variants: ['augmented', 'aug', 'augmented chord'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'augmented_chord' as const,
    },
    description: 'A chord with an augmented fifth',
    examples: [
      'add an augmented chord',
      'use augmented triads',
      'make it augmented',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'dominant_preparation') as LexemeId,
    lemma: 'dominant preparation',
    variants: ['dominant preparation', 'pre-dominant', 'predominant'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'predominant_function' as const,
    },
    description: 'Chords that typically precede the dominant',
    examples: [
      'strengthen the dominant preparation',
      'add a pre-dominant chord',
      'use a ii-V progression',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'extended') as LexemeId,
    lemma: 'extended',
    variants: ['extended', 'with extensions', 'extended harmony'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'axis_modifier' as const,
      axis: makeBuiltinId('axis', 'harmonic_complexity') as any,
      direction: 'increase' as const,
    },
    description: 'Chords with added ninths, elevenths, or thirteenths',
    examples: [
      'use extended chords',
      'add extensions to the harmony',
      'make the chords more extended',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'altered') as LexemeId,
    lemma: 'altered',
    variants: ['altered', 'altered dominant', 'alt chord'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'altered_chord' as const,
    },
    description: 'A dominant chord with raised or lowered fifths and ninths',
    examples: [
      'use an altered dominant',
      'add altered tensions',
      'make it an alt chord',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'upper_structure') as LexemeId,
    lemma: 'upper structure',
    variants: ['upper structure', 'upper structure triad', 'UST'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'upper_structure_triad' as const,
    },
    description: 'A triad built above a bass note to create tensions',
    examples: [
      'voice with an upper structure triad',
      'add upper structures',
      'use USTs for color',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'polychordal') as LexemeId,
    lemma: 'polychordal',
    variants: ['polychordal', 'polychord', 'bimodal'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'polychord' as const,
    },
    description: 'Two or more chords sounded simultaneously',
    examples: [
      'use polychordal harmony',
      'create polychords',
      'make it bimodal',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'cluster') as LexemeId,
    lemma: 'cluster',
    variants: ['cluster', 'tone cluster', 'cluster chord'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'tone_cluster' as const,
    },
    description: 'Adjacent notes sounded together for color or dissonance',
    examples: [
      'add clusters',
      'use tone clusters',
      'create cluster chords',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'quartal') as LexemeId,
    lemma: 'quartal',
    variants: ['quartal', 'quartal harmony', 'fourths'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'quartal_harmony' as const,
    },
    description: 'Harmony built from perfect fourths',
    examples: [
      'use quartal voicings',
      'add quartal harmony',
      'voice in fourths',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'quintal') as LexemeId,
    lemma: 'quintal',
    variants: ['quintal', 'quintal harmony', 'fifths'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'quintal_harmony' as const,
    },
    description: 'Harmony built from perfect fifths',
    examples: [
      'use quintal voicings',
      'add quintal harmony',
      'voice in fifths',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'bitonal') as LexemeId,
    lemma: 'bitonal',
    variants: ['bitonal', 'bitonality', 'two keys'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'bitonality' as const,
    },
    description: 'Two different keys sounding simultaneously',
    examples: [
      'use bitonal harmony',
      'create bitonality',
      'layer two keys',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'atonal') as LexemeId,
    lemma: 'atonal',
    variants: ['atonal', 'atonality', 'without tonality'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'atonality' as const,
    },
    description: 'Without a tonal center or key',
    examples: [
      'make it atonal',
      'use atonal harmony',
      'remove tonal center',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'pandiatonic') as LexemeId,
    lemma: 'pandiatonic',
    variants: ['pandiatonic', 'pan-diatonic', 'freely diatonic'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'pandiatonicism' as const,
    },
    description: 'Using all notes of a diatonic scale without functional hierarchy',
    examples: [
      'use pandiatonic harmony',
      'make it pandiatonic',
      'freely combine scale tones',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'slash_chord') as LexemeId,
    lemma: 'slash chord',
    variants: ['slash chord', 'chord over bass', 'polychord notation'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'slash_chord' as const,
    },
    description: 'A chord with a specified bass note different from the root',
    examples: [
      'use slash chords',
      'voice as C/E',
      'add slash chord voicings',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'inverted') as LexemeId,
    lemma: 'inverted',
    variants: ['inverted', 'inversion', 'first inversion', 'second inversion'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'chord_inversion' as const,
    },
    description: 'A chord with a note other than the root in the bass',
    examples: [
      'use inverted chords',
      'voice in first inversion',
      'add inversions for smoother voice leading',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'rootless') as LexemeId,
    lemma: 'rootless',
    variants: ['rootless', 'without root', 'rootless voicing'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'rootless_voicing' as const,
    },
    description: 'A chord voicing that omits the root note',
    examples: [
      'use rootless voicings',
      'voice without the root',
      'create rootless chords',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'reharmonization') as LexemeId,
    lemma: 'reharmonization',
    variants: ['reharmonization', 'reharm', 'reharmonize', 'new harmony'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'action' as const,
      actionType: 'harmonic_substitution' as const,
    },
    description: 'Changing the harmony while keeping the melody',
    examples: [
      'add reharmonization',
      'reharmonize the progression',
      'try different harmony',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'noun', 'turnaround') as LexemeId,
    lemma: 'turnaround',
    variants: ['turnaround', 'turn-around', 'turnaround progression'] as const,
    category: 'noun' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'turnaround' as const,
    },
    description: 'A chord progression that returns to the beginning',
    examples: [
      'add a turnaround',
      'use a ii-V-I turnaround',
      'insert a jazz turnaround',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'modal_minor') as LexemeId,
    lemma: 'Dorian',
    variants: ['Dorian', 'Dorian mode', 'Dorian minor'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'dorian_mode' as const,
    },
    description: 'A minor mode with a raised sixth scale degree',
    examples: [
      'use Dorian mode',
      'make it Dorian',
      'add Dorian flavor',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'phrygian') as LexemeId,
    lemma: 'Phrygian',
    variants: ['Phrygian', 'Phrygian mode', 'Spanish Phrygian'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'phrygian_mode' as const,
    },
    description: 'A minor mode with a lowered second scale degree',
    examples: [
      'use Phrygian mode',
      'make it Phrygian',
      'add Phrygian color',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'lydian') as LexemeId,
    lemma: 'Lydian',
    variants: ['Lydian', 'Lydian mode', 'Lydian major'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'lydian_mode' as const,
    },
    description: 'A major mode with a raised fourth scale degree',
    examples: [
      'use Lydian mode',
      'make it Lydian',
      'add Lydian brightness',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'mixolydian') as LexemeId,
    lemma: 'Mixolydian',
    variants: ['Mixolydian', 'Mixolydian mode', 'dominant scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'mixolydian_mode' as const,
    },
    description: 'A major mode with a lowered seventh scale degree',
    examples: [
      'use Mixolydian mode',
      'make it Mixolydian',
      'add Mixolydian feel',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'aeolian') as LexemeId,
    lemma: 'Aeolian',
    variants: ['Aeolian', 'Aeolian mode', 'natural minor'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'aeolian_mode' as const,
    },
    description: 'The natural minor scale',
    examples: [
      'use Aeolian mode',
      'make it Aeolian',
      'use natural minor',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'locrian') as LexemeId,
    lemma: 'Locrian',
    variants: ['Locrian', 'Locrian mode', 'diminished scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'locrian_mode' as const,
    },
    description: 'A minor mode with lowered second and fifth scale degrees',
    examples: [
      'use Locrian mode',
      'make it Locrian',
      'add Locrian tension',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'whole_tone') as LexemeId,
    lemma: 'whole tone',
    variants: ['whole tone', 'whole-tone scale', 'augmented scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'whole_tone_scale' as const,
    },
    description: 'A scale consisting entirely of whole steps',
    examples: [
      'use whole tone scale',
      'make it whole-tone',
      'add whole-tone color',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'octatonic') as LexemeId,
    lemma: 'octatonic',
    variants: ['octatonic', 'diminished scale', 'half-whole scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'octatonic_scale' as const,
    },
    description: 'An eight-note scale alternating half and whole steps',
    examples: [
      'use octatonic scale',
      'make it octatonic',
      'add diminished scale color',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'pentatonic') as LexemeId,
    lemma: 'pentatonic',
    variants: ['pentatonic', 'five-note scale', 'pentatonic scale'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'pentatonic_scale' as const,
    },
    description: 'A five-note scale',
    examples: [
      'use pentatonic scale',
      'make it pentatonic',
      'simplify to pentatonic',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'blues_scale') as LexemeId,
    lemma: 'blues scale',
    variants: ['blues scale', 'blues', 'bluesy'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'blues_scale' as const,
    },
    description: 'A minor pentatonic scale with an added flat fifth',
    examples: [
      'use blues scale',
      'make it bluesy',
      'add blues notes',
    ] as const,
  },

  {
    id: makeBuiltinId('lex', 'adj', 'bebop') as LexemeId,
    lemma: 'bebop',
    variants: ['bebop', 'bebop scale', 'bebop line'] as const,
    category: 'adj' as const,
    semantics: {
      type: 'concept' as const,
      domain: 'harmony' as const,
      concept: 'bebop_scale' as const,
    },
    description: 'A scale with chromatic passing tones for bebop style',
    examples: [
      'use bebop scales',
      'make it bebop',
      'add bebop lines',
    ] as const,
  },
];

// Continue with 160 more entries in Parts 2 and 3...

