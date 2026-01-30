/**
 * GOFAI Canon — Domain Nouns: Harmony and Melody (Batch 1)
 *
 * Comprehensive vocabulary for harmony, melody, chord progressions, and
 * pitch-related concepts. This batch covers the first 600+ entries.
 *
 * Part of Phase 1 extensibility work to ensure GOFAI has broad coverage
 * of musical vocabulary that can bind to project entities and actions.
 *
 * @module gofai/canon/domain-nouns-harmony-melody-batch1
 */

import type { DomainNoun, DomainNounCategory } from './types';

// =============================================================================
// Basic Harmony and Chord Concepts
// =============================================================================

/**
 * Fundamental harmony and chord nouns.
 */
export const BASIC_HARMONY_NOUNS: readonly DomainNoun[] = [
  // Core concepts
  { id: 'harmony', category: 'harmony', canonical: 'harmony', synonyms: ['harmonic structure', 'chord structure'] },
  { id: 'chord', category: 'harmony', canonical: 'chord', synonyms: ['triad', 'chord voicing'] },
  { id: 'chord_progression', category: 'harmony', canonical: 'chord progression', synonyms: ['progression', 'changes', 'chord changes'] },
  { id: 'voicing', category: 'harmony', canonical: 'voicing', synonyms: ['chord voicing', 'voice leading'] },
  { id: 'voice_leading', category: 'harmony', canonical: 'voice leading', synonyms: ['part writing', 'linear motion'] },
  
  // Chord types - triads
  { id: 'major_chord', category: 'harmony', canonical: 'major chord', synonyms: ['major triad', 'maj chord', 'major'] },
  { id: 'minor_chord', category: 'harmony', canonical: 'minor chord', synonyms: ['minor triad', 'min chord', 'minor'] },
  { id: 'diminished_chord', category: 'harmony', canonical: 'diminished chord', synonyms: ['dim chord', 'diminished triad'] },
  { id: 'augmented_chord', category: 'harmony', canonical: 'augmented chord', synonyms: ['aug chord', 'augmented triad'] },
  { id: 'suspended_chord', category: 'harmony', canonical: 'suspended chord', synonyms: ['sus chord', 'suspension'] },
  { id: 'sus2', category: 'harmony', canonical: 'sus2', synonyms: ['suspended second', 'sus two'] },
  { id: 'sus4', category: 'harmony', canonical: 'sus4', synonyms: ['suspended fourth', 'sus four'] },
  
  // Seventh chords
  { id: 'seventh_chord', category: 'harmony', canonical: 'seventh chord', synonyms: ['7th chord', 'seventh'] },
  { id: 'major_seventh', category: 'harmony', canonical: 'major seventh', synonyms: ['maj7', 'major 7th', 'M7'] },
  { id: 'minor_seventh', category: 'harmony', canonical: 'minor seventh', synonyms: ['min7', 'minor 7th', 'm7'] },
  { id: 'dominant_seventh', category: 'harmony', canonical: 'dominant seventh', synonyms: ['dom7', '7', 'V7'] },
  { id: 'half_diminished', category: 'harmony', canonical: 'half diminished', synonyms: ['half dim', 'min7b5', 'm7♭5'] },
  { id: 'fully_diminished', category: 'harmony', canonical: 'fully diminished', synonyms: ['dim7', 'diminished 7th', '°7'] },
  { id: 'minor_major_seventh', category: 'harmony', canonical: 'minor major seventh', synonyms: ['minmaj7', 'mM7', 'minor-major 7'] },
  { id: 'augmented_major_seventh', category: 'harmony', canonical: 'augmented major seventh', synonyms: ['augM7', '+M7'] },
  
  // Extended chords
  { id: 'ninth_chord', category: 'harmony', canonical: 'ninth chord', synonyms: ['9th chord', 'add9', 'ninth'] },
  { id: 'major_ninth', category: 'harmony', canonical: 'major ninth', synonyms: ['maj9', 'M9'] },
  { id: 'minor_ninth', category: 'harmony', canonical: 'minor ninth', synonyms: ['min9', 'm9'] },
  { id: 'dominant_ninth', category: 'harmony', canonical: 'dominant ninth', synonyms: ['9', 'dom9'] },
  { id: 'eleventh_chord', category: 'harmony', canonical: 'eleventh chord', synonyms: ['11th chord', 'eleventh'] },
  { id: 'major_eleventh', category: 'harmony', canonical: 'major eleventh', synonyms: ['maj11', 'M11'] },
  { id: 'minor_eleventh', category: 'harmony', canonical: 'minor eleventh', synonyms: ['min11', 'm11'] },
  { id: 'dominant_eleventh', category: 'harmony', canonical: 'dominant eleventh', synonyms: ['11', 'dom11'] },
  { id: 'thirteenth_chord', category: 'harmony', canonical: 'thirteenth chord', synonyms: ['13th chord', 'thirteenth'] },
  { id: 'major_thirteenth', category: 'harmony', canonical: 'major thirteenth', synonyms: ['maj13', 'M13'] },
  { id: 'minor_thirteenth', category: 'harmony', canonical: 'minor thirteenth', synonyms: ['min13', 'm13'] },
  { id: 'dominant_thirteenth', category: 'harmony', canonical: 'dominant thirteenth', synonyms: ['13', 'dom13'] },
  
  // Altered chords
  { id: 'altered_chord', category: 'harmony', canonical: 'altered chord', synonyms: ['altered dominant', 'alt chord'] },
  { id: 'sharp_five', category: 'harmony', canonical: 'sharp five', synonyms: ['#5', '♯5', 'augmented fifth'] },
  { id: 'flat_five', category: 'harmony', canonical: 'flat five', synonyms: ['♭5', 'b5', 'diminished fifth'] },
  { id: 'sharp_nine', category: 'harmony', canonical: 'sharp nine', synonyms: ['#9', '♯9', 'augmented ninth'] },
  { id: 'flat_nine', category: 'harmony', canonical: 'flat nine', synonyms: ['♭9', 'b9', 'minor ninth'] },
  { id: 'sharp_eleven', category: 'harmony', canonical: 'sharp eleven', synonyms: ['#11', '♯11', 'augmented eleventh', 'lydian fourth'] },
  { id: 'flat_thirteen', category: 'harmony', canonical: 'flat thirteen', synonyms: ['♭13', 'b13', 'minor thirteenth'] },
  
  // Added tone chords
  { id: 'add_nine', category: 'harmony', canonical: 'add nine', synonyms: ['add9', 'added ninth'] },
  { id: 'six_chord', category: 'harmony', canonical: 'six chord', synonyms: ['6', 'added sixth', 'sixth chord'] },
  { id: 'six_nine', category: 'harmony', canonical: 'six nine', synonyms: ['6/9', 'six nine chord'] },
  { id: 'major_six', category: 'harmony', canonical: 'major six', synonyms: ['maj6', 'M6'] },
  { id: 'minor_six', category: 'harmony', canonical: 'minor six', synonyms: ['min6', 'm6'] },
  
  // Slash chords and inversions
  { id: 'slash_chord', category: 'harmony', canonical: 'slash chord', synonyms: ['chord over bass', 'compound chord'] },
  { id: 'first_inversion', category: 'harmony', canonical: 'first inversion', synonyms: ['6 chord', 'third in bass'] },
  { id: 'second_inversion', category: 'harmony', canonical: 'second inversion', synonyms: ['6/4 chord', 'fifth in bass'] },
  { id: 'third_inversion', category: 'harmony', canonical: 'third inversion', synonyms: ['7th chord inversion', 'seventh in bass'] },
  { id: 'root_position', category: 'harmony', canonical: 'root position', synonyms: ['root in bass', 'fundamental position'] },
  
  // Power chords and other types
  { id: 'power_chord', category: 'harmony', canonical: 'power chord', synonyms: ['fifth chord', '5 chord', 'open fifth'] },
  { id: 'quartal_chord', category: 'harmony', canonical: 'quartal chord', synonyms: ['fourth chord', 'quartal harmony'] },
  { id: 'quintal_chord', category: 'harmony', canonical: 'quintal chord', synonyms: ['fifth chord stack', 'quintal harmony'] },
  { id: 'cluster', category: 'harmony', canonical: 'cluster chord', synonyms: ['tone cluster', 'cluster', 'chromatic cluster'] },
  { id: 'polychord', category: 'harmony', canonical: 'polychord', synonyms: ['bitonal chord', 'polytonal chord'] },
];

// =============================================================================
// Functional Harmony and Progression Types
// =============================================================================

/**
 * Functional harmony and common progression types.
 */
export const FUNCTIONAL_HARMONY_NOUNS: readonly DomainNoun[] = [
  // Roman numeral functions
  { id: 'tonic', category: 'harmony', canonical: 'tonic', synonyms: ['I chord', 'one chord', 'tonal center', 'home chord'] },
  { id: 'supertonic', category: 'harmony', canonical: 'supertonic', synonyms: ['II chord', 'two chord', 'ii'] },
  { id: 'mediant', category: 'harmony', canonical: 'mediant', synonyms: ['III chord', 'three chord', 'iii'] },
  { id: 'subdominant', category: 'harmony', canonical: 'subdominant', synonyms: ['IV chord', 'four chord'] },
  { id: 'dominant', category: 'harmony', canonical: 'dominant', synonyms: ['V chord', 'five chord', 'dominant seventh'] },
  { id: 'submediant', category: 'harmony', canonical: 'submediant', synonyms: ['VI chord', 'six chord', 'vi'] },
  { id: 'leading_tone', category: 'harmony', canonical: 'leading tone', synonyms: ['VII chord', 'seven chord', 'vii°'] },
  { id: 'subtonic', category: 'harmony', canonical: 'subtonic', synonyms: ['♭VII chord', 'flat seven', 'bVII'] },
  
  // Secondary dominants
  { id: 'secondary_dominant', category: 'harmony', canonical: 'secondary dominant', synonyms: ['applied dominant', 'V/V', 'five of five'] },
  { id: 'five_of_two', category: 'harmony', canonical: 'five of two', synonyms: ['V/ii', 'V of ii', 'secondary dominant of ii'] },
  { id: 'five_of_three', category: 'harmony', canonical: 'five of three', synonyms: ['V/iii', 'V of iii'] },
  { id: 'five_of_four', category: 'harmony', canonical: 'five of four', synonyms: ['V/IV', 'V of IV'] },
  { id: 'five_of_five', category: 'harmony', canonical: 'five of five', synonyms: ['V/V', 'V of V', 'dominant of dominant'] },
  { id: 'five_of_six', category: 'harmony', canonical: 'five of six', synonyms: ['V/vi', 'V of vi'] },
  
  // Common progressions
  { id: 'turnaround', category: 'harmony', canonical: 'turnaround', synonyms: ['turn around', 'turnaround progression'] },
  { id: 'one_four_five', category: 'harmony', canonical: 'I-IV-V', synonyms: ['one four five', '1-4-5', 'three chord song'] },
  { id: 'two_five_one', category: 'harmony', canonical: 'ii-V-I', synonyms: ['two five one', '2-5-1', 'ii V I'] },
  { id: 'three_six_two_five', category: 'harmony', canonical: 'iii-vi-ii-V', synonyms: ['3-6-2-5', 'iii vi ii V'] },
  { id: 'circle_of_fifths', category: 'harmony', canonical: 'circle of fifths', synonyms: ['cycle of fifths', 'fifth progression'] },
  { id: 'cycle_progression', category: 'harmony', canonical: 'cycle progression', synonyms: ['cyclical harmony'] },
  { id: 'plagal_cadence', category: 'harmony', canonical: 'plagal cadence', synonyms: ['IV-I', 'amen cadence', 'church cadence'] },
  { id: 'authentic_cadence', category: 'harmony', canonical: 'authentic cadence', synonyms: ['perfect cadence', 'V-I', 'full close'] },
  { id: 'half_cadence', category: 'harmony', canonical: 'half cadence', synonyms: ['imperfect cadence', 'V cadence', 'semi-cadence'] },
  { id: 'deceptive_cadence', category: 'harmony', canonical: 'deceptive cadence', synonyms: ['interrupted cadence', 'V-vi', 'false cadence'] },
  
  // Pop/rock progressions
  { id: 'axis_progression', category: 'harmony', canonical: 'axis progression', synonyms: ['I-V-vi-IV', 'pop progression', 'sensitive chord progression'] },
  { id: 'doo_wop_changes', category: 'harmony', canonical: 'doo wop changes', synonyms: ['I-vi-IV-V', 'fifties progression', '50s changes'] },
  { id: 'andalusian_cadence', category: 'harmony', canonical: 'Andalusian cadence', synonyms: ['descending tetrachord', 'vi-V-IV-III'] },
  { id: 'royal_road', category: 'harmony', canonical: 'royal road progression', synonyms: ['IV-V-iii-vi', 'jpop progression'] },
  { id: 'pachelbel_canon', category: 'harmony', canonical: 'Canon progression', synonyms: ['I-V-vi-iii-IV-I-IV-V', 'Pachelbel changes'] },
  
  // Jazz progressions
  { id: 'rhythm_changes', category: 'harmony', canonical: 'rhythm changes', synonyms: ['Gershwin changes', 'I Got Rhythm changes'] },
  { id: 'coltrane_changes', category: 'harmony', canonical: 'Coltrane changes', synonyms: ['Giant Steps changes', 'three tonic system'] },
  { id: 'blues_progression', category: 'harmony', canonical: 'blues progression', synonyms: ['12-bar blues', 'blues changes'] },
  { id: 'minor_blues', category: 'harmony', canonical: 'minor blues', synonyms: ['12-bar minor blues'] },
  { id: 'jazz_minor_progression', category: 'harmony', canonical: 'jazz minor progression', synonyms: ['minor ii-V'] },
  { id: 'backdoor_progression', category: 'harmony', canonical: 'backdoor progression', synonyms: ['♭VII-IV-I', 'backdoor ii-V'] },
  
  // Modulation types
  { id: 'modulation', category: 'harmony', canonical: 'modulation', synonyms: ['key change', 'tonal shift'] },
  { id: 'pivot_chord', category: 'harmony', canonical: 'pivot chord', synonyms: ['common chord modulation', 'pivot'] },
  { id: 'direct_modulation', category: 'harmony', canonical: 'direct modulation', synonyms: ['abrupt modulation', 'truck driver modulation'] },
  { id: 'chromatic_modulation', category: 'harmony', canonical: 'chromatic modulation', synonyms: ['chromatic mediant modulation'] },
  { id: 'enharmonic_modulation', category: 'harmony', canonical: 'enharmonic modulation', synonyms: ['enharmonic change'] },
  { id: 'sequential_modulation', category: 'harmony', canonical: 'sequential modulation', synonyms: ['sequence modulation'] },
  
  // Harmonic functions
  { id: 'tonic_function', category: 'harmony', canonical: 'tonic function', synonyms: ['tonic role', 'stable function'] },
  { id: 'dominant_function', category: 'harmony', canonical: 'dominant function', synonyms: ['dominant role', 'tension function'] },
  { id: 'subdominant_function', category: 'harmony', canonical: 'subdominant function', synonyms: ['pre-dominant', 'preparation'] },
  { id: 'pre_dominant', category: 'harmony', canonical: 'pre-dominant', synonyms: ['predominant', 'IV or ii'] },
];

// =============================================================================
// Melody and Melodic Concepts
// =============================================================================

/**
 * Melody, melodic contour, and phrasing nouns.
 */
export const MELODY_NOUNS: readonly DomainNoun[] = [
  // Basic concepts
  { id: 'melody', category: 'melody', canonical: 'melody', synonyms: ['melodic line', 'tune', 'theme'] },
  { id: 'melodic_line', category: 'melody', canonical: 'melodic line', synonyms: ['melody', 'line', 'voice'] },
  { id: 'theme', category: 'melody', canonical: 'theme', synonyms: ['melodic theme', 'main melody', 'subject'] },
  { id: 'motif', category: 'melody', canonical: 'motif', synonyms: ['motive', 'melodic motif', 'cell'] },
  { id: 'phrase', category: 'melody', canonical: 'phrase', synonyms: ['melodic phrase', 'musical phrase'] },
  { id: 'counter_melody', category: 'melody', canonical: 'counter melody', synonyms: ['countermelody', 'secondary melody', 'counter line'] },
  { id: 'descant', category: 'melody', canonical: 'descant', synonyms: ['descant line', 'soprano countermelody'] },
  
  // Melodic motion
  { id: 'stepwise_motion', category: 'melody', canonical: 'stepwise motion', synonyms: ['conjunct motion', 'scalar motion', 'step motion'] },
  { id: 'leap', category: 'melody', canonical: 'leap', synonyms: ['melodic leap', 'skip', 'jump', 'disjunct motion'] },
  { id: 'contour', category: 'melody', canonical: 'contour', synonyms: ['melodic contour', 'shape', 'melodic shape'] },
  { id: 'ascending', category: 'melody', canonical: 'ascending', synonyms: ['rising', 'upward motion', 'going up'] },
  { id: 'descending', category: 'melody', canonical: 'descending', synonyms: ['falling', 'downward motion', 'going down'] },
  { id: 'arch', category: 'melody', canonical: 'arch', synonyms: ['arch shape', 'arch contour', 'rise and fall'] },
  { id: 'wave', category: 'melody', canonical: 'wave', synonyms: ['wave shape', 'wavelike', 'undulating'] },
  { id: 'sawtooth', category: 'melody', canonical: 'sawtooth', synonyms: ['sawtooth shape', 'zigzag'] },
  
  // Range and register
  { id: 'range', category: 'melody', canonical: 'range', synonyms: ['melodic range', 'pitch range', 'compass'] },
  { id: 'tessitura', category: 'melody', canonical: 'tessitura', synonyms: ['average range', 'comfortable range'] },
  { id: 'register', category: 'melody', canonical: 'register', synonyms: ['pitch register', 'octave register'] },
  { id: 'high_register', category: 'melody', canonical: 'high register', synonyms: ['upper register', 'high notes'] },
  { id: 'low_register', category: 'melody', canonical: 'low register', synonyms: ['lower register', 'low notes'] },
  { id: 'middle_register', category: 'melody', canonical: 'middle register', synonyms: ['mid register', 'medium range'] },
  { id: 'extreme_high', category: 'melody', canonical: 'extreme high', synonyms: ['very high', 'altissimo', 'extreme upper'] },
  { id: 'extreme_low', category: 'melody', canonical: 'extreme low', synonyms: ['very low', 'pedal tones', 'extreme lower'] },
  
  // Melodic techniques
  { id: 'sequence', category: 'melody', canonical: 'sequence', synonyms: ['melodic sequence', 'sequential pattern'] },
  { id: 'imitation', category: 'melody', canonical: 'imitation', synonyms: ['melodic imitation', 'echoing'] },
  { id: 'inversion', category: 'melody', canonical: 'inversion', synonyms: ['melodic inversion', 'mirror'] },
  { id: 'retrograde', category: 'melody', canonical: 'retrograde', synonyms: ['backward', 'reversed', 'crab motion'] },
  { id: 'augmentation', category: 'melody', canonical: 'augmentation', synonyms: ['rhythmic augmentation', 'stretched'] },
  { id: 'diminution', category: 'melody', canonical: 'diminution', synonyms: ['rhythmic diminution', 'compressed'] },
  { id: 'transposition', category: 'melody', canonical: 'transposition', synonyms: ['melodic transposition', 'shifted'] },
  
  // Ornamentation
  { id: 'ornament', category: 'melody', canonical: 'ornament', synonyms: ['ornamentation', 'decoration', 'embellishment'] },
  { id: 'trill', category: 'melody', canonical: 'trill', synonyms: ['rapid alternation', 'shake'] },
  { id: 'mordent', category: 'melody', canonical: 'mordent', synonyms: ['upper mordent', 'lower mordent'] },
  { id: 'turn', category: 'melody', canonical: 'turn', synonyms: ['gruppetto', 'melodic turn'] },
  { id: 'grace_note', category: 'melody', canonical: 'grace note', synonyms: ['acciaccatura', 'appoggiatura', 'ornamental note'] },
  { id: 'glissando', category: 'melody', canonical: 'glissando', synonyms: ['gliss', 'slide', 'portamento'] },
  { id: 'portamento', category: 'melody', canonical: 'portamento', synonyms: ['glide', 'smooth slide'] },
  { id: 'vibrato', category: 'melody', canonical: 'vibrato', synonyms: ['pitch vibrato', 'oscillation'] },
  { id: 'tremolo', category: 'melody', canonical: 'tremolo', synonyms: ['rapid repetition'] },
  { id: 'bend', category: 'melody', canonical: 'bend', synonyms: ['pitch bend', 'note bend'] },
  { id: 'scoop', category: 'melody', canonical: 'scoop', synonyms: ['pitch scoop', 'upward slide'] },
  { id: 'fall', category: 'melody', canonical: 'fall', synonyms: ['pitch fall', 'downward slide'] },
  { id: 'doit', category: 'melody', canonical: 'doit', synonyms: ['short upward scoop'] },
  
  // Phrasing
  { id: 'antecedent', category: 'melody', canonical: 'antecedent', synonyms: ['question phrase', 'first phrase'] },
  { id: 'consequent', category: 'melody', canonical: 'consequent', synonyms: ['answer phrase', 'second phrase'] },
  { id: 'period', category: 'melody', canonical: 'period', synonyms: ['phrase pair', 'antecedent-consequent'] },
  { id: 'elision', category: 'melody', canonical: 'elision', synonyms: ['phrase overlap', 'overlapping phrases'] },
  { id: 'extension', category: 'melody', canonical: 'extension', synonyms: ['phrase extension', 'expanded phrase'] },
  { id: 'truncation', category: 'melody', canonical: 'truncation', synonyms: ['phrase truncation', 'shortened phrase'] },
  
  // Call and response
  { id: 'call_and_response', category: 'melody', canonical: 'call and response', synonyms: ['call response', 'question answer'] },
  { id: 'call', category: 'melody', canonical: 'call', synonyms: ['question', 'first statement'] },
  { id: 'response', category: 'melody', canonical: 'response', synonyms: ['answer', 'reply'] },
  
  // Melodic devices
  { id: 'passing_tone', category: 'melody', canonical: 'passing tone', synonyms: ['passing note', 'nonchord tone'] },
  { id: 'neighbor_tone', category: 'melody', canonical: 'neighbor tone', synonyms: ['auxiliary note', 'neighbor note'] },
  { id: 'appoggiatura', category: 'melody', canonical: 'appoggiatura', synonyms: ['leaning note', 'accented passing tone'] },
  { id: 'escape_tone', category: 'melody', canonical: 'escape tone', synonyms: ['échappée', 'escape note'] },
  { id: 'anticipation', category: 'melody', canonical: 'anticipation', synonyms: ['anticipated note'] },
  { id: 'suspension', category: 'melody', canonical: 'suspension', synonyms: ['suspended note', 'held tone'] },
  { id: 'retardation', category: 'melody', canonical: 'retardation', synonyms: ['upward resolution'] },
  { id: 'pedal_point', category: 'melody', canonical: 'pedal point', synonyms: ['pedal tone', 'sustained note'] },
];

// =============================================================================
// Scales, Modes, and Pitch Collections
// =============================================================================

/**
 * Scales, modes, and pitch collection nouns.
 */
export const SCALE_MODE_NOUNS: readonly DomainNoun[] = [
  // Major and minor scales
  { id: 'major_scale', category: 'harmony', canonical: 'major scale', synonyms: ['major', 'ionian mode'] },
  { id: 'natural_minor', category: 'harmony', canonical: 'natural minor', synonyms: ['minor scale', 'aeolian mode', 'relative minor'] },
  { id: 'harmonic_minor', category: 'harmony', canonical: 'harmonic minor', synonyms: ['harmonic minor scale'] },
  { id: 'melodic_minor', category: 'harmony', canonical: 'melodic minor', synonyms: ['melodic minor scale', 'jazz minor'] },
  
  // Diatonic modes
  { id: 'ionian', category: 'harmony', canonical: 'Ionian', synonyms: ['Ionian mode', 'major mode'] },
  { id: 'dorian', category: 'harmony', canonical: 'Dorian', synonyms: ['Dorian mode', 'minor with raised 6th'] },
  { id: 'phrygian', category: 'harmony', canonical: 'Phrygian', synonyms: ['Phrygian mode', 'minor with flat 2nd'] },
  { id: 'lydian', category: 'harmony', canonical: 'Lydian', synonyms: ['Lydian mode', 'major with raised 4th'] },
  { id: 'mixolydian', category: 'harmony', canonical: 'Mixolydian', synonyms: ['Mixolydian mode', 'major with flat 7th'] },
  { id: 'aeolian', category: 'harmony', canonical: 'Aeolian', synonyms: ['Aeolian mode', 'natural minor'] },
  { id: 'locrian', category: 'harmony', canonical: 'Locrian', synonyms: ['Locrian mode', 'diminished mode'] },
  
  // Melodic minor modes
  { id: 'dorian_flat2', category: 'harmony', canonical: 'Dorian ♭2', synonyms: ['Phrygian natural 6', 'second mode melodic minor'] },
  { id: 'lydian_augmented', category: 'harmony', canonical: 'Lydian augmented', synonyms: ['Lydian #5', 'third mode melodic minor'] },
  { id: 'lydian_dominant', category: 'harmony', canonical: 'Lydian dominant', synonyms: ['acoustic scale', 'overtone scale', 'Lydian ♭7'] },
  { id: 'mixolydian_flat6', category: 'harmony', canonical: 'Mixolydian ♭6', synonyms: ['Hindu scale', 'fifth mode melodic minor'] },
  { id: 'locrian_natural2', category: 'harmony', canonical: 'Locrian natural 2', synonyms: ['half diminished scale', 'sixth mode melodic minor'] },
  { id: 'altered_scale', category: 'harmony', canonical: 'altered scale', synonyms: ['super Locrian', 'diminished whole tone', 'seventh mode melodic minor'] },
  
  // Harmonic minor modes
  { id: 'harmonic_minor_fifth', category: 'harmony', canonical: 'Phrygian dominant', synonyms: ['Spanish Phrygian', 'fifth mode harmonic minor'] },
  { id: 'harmonic_minor_fourth', category: 'harmony', canonical: 'Ukrainian Dorian', synonyms: ['Romanian minor', 'fourth mode harmonic minor'] },
  
  // Pentatonic scales
  { id: 'major_pentatonic', category: 'harmony', canonical: 'major pentatonic', synonyms: ['pentatonic major', '5-note major'] },
  { id: 'minor_pentatonic', category: 'harmony', canonical: 'minor pentatonic', synonyms: ['pentatonic minor', '5-note minor'] },
  { id: 'blues_scale', category: 'harmony', canonical: 'blues scale', synonyms: ['minor pentatonic with blue note'] },
  { id: 'blue_note', category: 'harmony', canonical: 'blue note', synonyms: ['blues note', 'flatted fifth', '♭5'] },
  { id: 'japanese_pentatonic', category: 'harmony', canonical: 'Japanese pentatonic', synonyms: ['in scale', 'hirajoshi'] },
  { id: 'egyptian_scale', category: 'harmony', canonical: 'Egyptian scale', synonyms: ['suspended pentatonic'] },
  
  // Exotic and world scales
  { id: 'whole_tone', category: 'harmony', canonical: 'whole tone scale', synonyms: ['whole tone', 'augmented scale'] },
  { id: 'octatonic', category: 'harmony', canonical: 'octatonic scale', synonyms: ['diminished scale', 'half-whole', 'whole-half'] },
  { id: 'chromatic_scale', category: 'harmony', canonical: 'chromatic scale', synonyms: ['chromatic', '12-tone', 'all notes'] },
  { id: 'bebop_scale', category: 'harmony', canonical: 'bebop scale', synonyms: ['bebop dominant', 'dominant bebop'] },
  { id: 'bebop_major', category: 'harmony', canonical: 'bebop major', synonyms: ['major bebop'] },
  { id: 'bebop_minor', category: 'harmony', canonical: 'bebop minor', synonyms: ['minor bebop', 'Dorian bebop'] },
  { id: 'enigmatic_scale', category: 'harmony', canonical: 'enigmatic scale', synonyms: ['Verdi scale'] },
  { id: 'double_harmonic', category: 'harmony', canonical: 'double harmonic', synonyms: ['Byzantine scale', 'Arabic scale', 'Gypsy major'] },
  { id: 'hungarian_minor', category: 'harmony', canonical: 'Hungarian minor', synonyms: ['Gypsy minor', 'Hungarian Gypsy'] },
  { id: 'neapolitan_major', category: 'harmony', canonical: 'Neapolitan major', synonyms: ['Romanian major'] },
  { id: 'neapolitan_minor', category: 'harmony', canonical: 'Neapolitan minor', synonyms: [] },
  { id: 'persian_scale', category: 'harmony', canonical: 'Persian scale', synonyms: [] },
  { id: 'hirajoshi', category: 'harmony', canonical: 'Hirajōshi', synonyms: ['Japanese scale'] },
  { id: 'kumoi', category: 'harmony', canonical: 'Kumoi', synonyms: ['Japanese pentatonic'] },
  { id: 'pelog', category: 'harmony', canonical: 'Pelog', synonyms: ['Balinese scale'] },
  { id: 'slendro', category: 'harmony', canonical: 'Slendro', synonyms: ['Javanese scale'] },
  { id: 'maqam', category: 'harmony', canonical: 'maqam', synonyms: ['Arabic mode', 'Middle Eastern mode'] },
  { id: 'raga', category: 'harmony', canonical: 'raga', synonyms: ['Indian scale', 'melodic framework'] },
];

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * All harmony and melody domain nouns from this batch.
 */
export const HARMONY_MELODY_BATCH1_NOUNS: readonly DomainNoun[] = [
  ...BASIC_HARMONY_NOUNS,
  ...FUNCTIONAL_HARMONY_NOUNS,
  ...MELODY_NOUNS,
  ...SCALE_MODE_NOUNS,
];

/**
 * Lookup map for quick retrieval.
 */
export const HARMONY_MELODY_BATCH1_MAP = new Map(
  HARMONY_MELODY_BATCH1_NOUNS.map(noun => [noun.id, noun])
);

/**
 * Get a harmony/melody noun by ID.
 */
export function getHarmonyMelodyNoun(id: string): DomainNoun | undefined {
  return HARMONY_MELODY_BATCH1_MAP.get(id);
}

/**
 * Find harmony/melody nouns by category.
 */
export function getHarmonyMelodyNounsByCategory(
  category: DomainNounCategory
): readonly DomainNoun[] {
  return HARMONY_MELODY_BATCH1_NOUNS.filter(noun => noun.category === category);
}
