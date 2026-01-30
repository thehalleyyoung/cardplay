/**
 * GOFAI Canon — Domain Nouns: Rhythm and Tempo (Batch 1)
 *
 * Comprehensive vocabulary for rhythm, timing, and tempo concepts.
 * This batch covers the first 600 entries of rhythm/tempo domain nouns.
 *
 * Part of Phase 1 extensibility work to ensure GOFAI has broad coverage
 * of musical vocabulary that can bind to project entities and actions.
 *
 * @module gofai/canon/domain-nouns-rhythm-tempo-batch1
 */

import type { DomainNoun, DomainNounCategory } from './types';

// =============================================================================
// Rhythm Patterns and Structures
// =============================================================================

/**
 * Basic rhythm pattern nouns.
 * These describe fundamental rhythmic structures and patterns.
 */
export const RHYTHM_PATTERN_NOUNS: readonly DomainNoun[] = [
  // Core rhythm concepts
  { id: 'rhythm', category: 'rhythm', canonical: 'rhythm', synonyms: ['rhythmic pattern', 'rhythm pattern', 'beat pattern'] },
  { id: 'beat', category: 'rhythm', canonical: 'beat', synonyms: ['pulse', 'steady beat', 'basic beat'] },
  { id: 'groove', category: 'rhythm', canonical: 'groove', synonyms: ['feel', 'rhythmic feel', 'pocket'] },
  { id: 'pulse', category: 'rhythm', canonical: 'pulse', synonyms: ['rhythmic pulse', 'steady pulse', 'underlying beat'] },
  { id: 'meter', category: 'rhythm', canonical: 'meter', synonyms: ['time signature', 'metric structure'] },
  
  // Time divisions
  { id: 'subdivision', category: 'rhythm', canonical: 'subdivision', synonyms: ['rhythmic subdivision', 'beat division'] },
  { id: 'eighth_note', category: 'rhythm', canonical: 'eighth note', synonyms: ['8th note', 'quaver', 'eighths'] },
  { id: 'sixteenth_note', category: 'rhythm', canonical: 'sixteenth note', synonyms: ['16th note', 'semiquaver', 'sixteenths'] },
  { id: 'quarter_note', category: 'rhythm', canonical: 'quarter note', synonyms: ['4th note', 'crotchet', 'quarters'] },
  { id: 'half_note', category: 'rhythm', canonical: 'half note', synonyms: ['2nd note', 'minim', 'halves'] },
  { id: 'whole_note', category: 'rhythm', canonical: 'whole note', synonyms: ['semibreve', 'wholes'] },
  { id: 'thirty_second_note', category: 'rhythm', canonical: 'thirty-second note', synonyms: ['32nd note', 'demisemiquaver'] },
  { id: 'sixty_fourth_note', category: 'rhythm', canonical: 'sixty-fourth note', synonyms: ['64th note', 'hemidemisemiquaver'] },
  
  // Tuplets
  { id: 'triplet', category: 'rhythm', canonical: 'triplet', synonyms: ['triple', 'triplet feel', 'three against two'] },
  { id: 'quintuplet', category: 'rhythm', canonical: 'quintuplet', synonyms: ['five-tuplet', 'five against four'] },
  { id: 'septuplet', category: 'rhythm', canonical: 'septuplet', synonyms: ['seven-tuplet'] },
  { id: 'sextuplet', category: 'rhythm', canonical: 'sextuplet', synonyms: ['six-tuplet', 'double triplet'] },
  
  // Dotted notes
  { id: 'dotted_note', category: 'rhythm', canonical: 'dotted note', synonyms: ['dotted rhythm', 'dot'] },
  { id: 'dotted_eighth', category: 'rhythm', canonical: 'dotted eighth', synonyms: ['dotted 8th', 'dotted quaver'] },
  { id: 'dotted_quarter', category: 'rhythm', canonical: 'dotted quarter', synonyms: ['dotted 4th', 'dotted crotchet'] },
  { id: 'dotted_half', category: 'rhythm', canonical: 'dotted half', synonyms: ['dotted 2nd', 'dotted minim'] },
  
  // Swing and shuffle
  { id: 'swing', category: 'rhythm', canonical: 'swing', synonyms: ['swing feel', 'swung eighths', 'shuffle'] },
  { id: 'swing_eighths', category: 'rhythm', canonical: 'swing eighths', synonyms: ['swung 8ths', 'shuffle eighths'] },
  { id: 'swing_sixteenths', category: 'rhythm', canonical: 'swing sixteenths', synonyms: ['swung 16ths'] },
  { id: 'straight_eighths', category: 'rhythm', canonical: 'straight eighths', synonyms: ['even eighths', 'straight 8ths'] },
  { id: 'shuffle_feel', category: 'rhythm', canonical: 'shuffle', synonyms: ['shuffle pattern', 'shuffled'] },
  
  // Syncopation
  { id: 'syncopation', category: 'rhythm', canonical: 'syncopation', synonyms: ['syncopated rhythm', 'off-beat accent'] },
  { id: 'offbeat', category: 'rhythm', canonical: 'offbeat', synonyms: ['off-beat', 'upbeat', 'weak beat'] },
  { id: 'upbeat', category: 'rhythm', canonical: 'upbeat', synonyms: ['anacrusis', 'pick-up', 'pickup beat'] },
  { id: 'downbeat', category: 'rhythm', canonical: 'downbeat', synonyms: ['strong beat', 'beat one', 'the one'] },
  { id: 'backbeat', category: 'rhythm', canonical: 'backbeat', synonyms: ['snare beat', 'two and four', '2 and 4'] },
  
  // Polyrhythm
  { id: 'polyrhythm', category: 'rhythm', canonical: 'polyrhythm', synonyms: ['cross-rhythm', 'multiple rhythms'] },
  { id: 'hemiola', category: 'rhythm', canonical: 'hemiola', synonyms: ['three against two', '3 over 2'] },
  { id: 'polymeter', category: 'rhythm', canonical: 'polymeter', synonyms: ['multiple meters', 'metric shift'] },
  { id: 'cross_rhythm', category: 'rhythm', canonical: 'cross-rhythm', synonyms: ['conflicting rhythm'] },
  
  // Drum patterns
  { id: 'drum_pattern', category: 'rhythm', canonical: 'drum pattern', synonyms: ['drum groove', 'beat'] },
  { id: 'four_on_floor', category: 'rhythm', canonical: 'four on the floor', synonyms: ['four-on-floor', 'four to the floor', '4/4 kick'] },
  { id: 'boom_bap', category: 'rhythm', canonical: 'boom bap', synonyms: ['boom-bap', 'hip hop beat', 'boom clap'] },
  { id: 'breakbeat', category: 'rhythm', canonical: 'breakbeat', synonyms: ['break beat', 'amen break', 'drum break'] },
  { id: 'two_step', category: 'rhythm', canonical: 'two-step', synonyms: ['2-step', 'two step', 'uk garage beat'] },
  { id: 'trap_hi_hats', category: 'rhythm', canonical: 'trap hi-hats', synonyms: ['trap hats', 'rapid hats', 'trap rolls'] },
  
  // Latin rhythms
  { id: 'clave', category: 'rhythm', canonical: 'clave', synonyms: ['clave pattern', 'rhythmic clave'] },
  { id: 'son_clave', category: 'rhythm', canonical: 'son clave', synonyms: ['3-2 clave', 'son'] },
  { id: 'rumba_clave', category: 'rhythm', canonical: 'rumba clave', synonyms: ['rumba pattern'] },
  { id: 'bossa_nova', category: 'rhythm', canonical: 'bossa nova', synonyms: ['bossa', 'bossa pattern'] },
  { id: 'samba', category: 'rhythm', canonical: 'samba', synonyms: ['samba pattern', 'brazilian rhythm'] },
  { id: 'tresillo', category: 'rhythm', canonical: 'tresillo', synonyms: ['habanera', '3+3+2 pattern'] },
  { id: 'montuno', category: 'rhythm', canonical: 'montuno', synonyms: ['montuno pattern'] },
  
  // African rhythms
  { id: 'afrobeat', category: 'rhythm', canonical: 'afrobeat', synonyms: ['afro beat', 'fela pattern'] },
  { id: 'highlife', category: 'rhythm', canonical: 'highlife', synonyms: ['highlife pattern'] },
  { id: 'soukous', category: 'rhythm', canonical: 'soukous', synonyms: ['soukous pattern', 'congolese rhythm'] },
  { id: 'west_african', category: 'rhythm', canonical: 'west african', synonyms: ['west african rhythm'] },
  
  // Middle Eastern rhythms
  { id: 'maqsum', category: 'rhythm', canonical: 'maqsum', synonyms: ['baladi', 'middle eastern rhythm'] },
  { id: 'saidi', category: 'rhythm', canonical: 'saidi', synonyms: ['saidi pattern'] },
  { id: 'ayoub', category: 'rhythm', canonical: 'ayoub', synonyms: ['zaffa'] },
  
  // Indian rhythms
  { id: 'tabla_pattern', category: 'rhythm', canonical: 'tabla pattern', synonyms: ['tabla rhythm', 'tabla bols'] },
  { id: 'tihai', category: 'rhythm', canonical: 'tihai', synonyms: ['rhythmic cadence'] },
  
  // Time signature variations
  { id: 'common_time', category: 'rhythm', canonical: 'common time', synonyms: ['4/4 time', 'four four'] },
  { id: 'cut_time', category: 'rhythm', canonical: 'cut time', synonyms: ['2/2 time', 'alla breve'] },
  { id: 'waltz_time', category: 'rhythm', canonical: 'waltz time', synonyms: ['3/4 time', 'three four'] },
  { id: 'six_eight', category: 'rhythm', canonical: '6/8 time', synonyms: ['six eight', 'compound duple'] },
  { id: 'five_four', category: 'rhythm', canonical: '5/4 time', synonyms: ['five four', 'take five time'] },
  { id: 'seven_eight', category: 'rhythm', canonical: '7/8 time', synonyms: ['seven eight', 'odd meter'] },
  { id: 'nine_eight', category: 'rhythm', canonical: '9/8 time', synonyms: ['nine eight', 'compound triple'] },
  { id: 'twelve_eight', category: 'rhythm', canonical: '12/8 time', synonyms: ['twelve eight', 'compound quadruple'] },
  
  // Rhythmic techniques
  { id: 'quantization', category: 'rhythm', canonical: 'quantization', synonyms: ['grid alignment', 'timing correction'] },
  { id: 'humanization', category: 'rhythm', canonical: 'humanization', synonyms: ['timing variation', 'groove humanize'] },
  { id: 'microtiming', category: 'rhythm', canonical: 'microtiming', synonyms: ['subtle timing', 'groove offset'] },
  { id: 'timing_offset', category: 'rhythm', canonical: 'timing offset', synonyms: ['groove shift', 'push pull'] },
  { id: 'push', category: 'rhythm', canonical: 'push', synonyms: ['rushing', 'ahead of beat'] },
  { id: 'pull', category: 'rhythm', canonical: 'pull', synonyms: ['dragging', 'behind beat', 'laid back'] },
  { id: 'laid_back_timing', category: 'rhythm', canonical: 'laid back', synonyms: ['relaxed timing', 'behind the beat'] },
];

// =============================================================================
// Tempo and Speed
// =============================================================================

/**
 * Tempo-related nouns.
 * These describe speed, tempo markings, and tempo changes.
 */
export const TEMPO_NOUNS: readonly DomainNoun[] = [
  // Basic tempo concepts
  { id: 'tempo', category: 'tempo', canonical: 'tempo', synonyms: ['speed', 'pace', 'bpm'] },
  { id: 'bpm', category: 'tempo', canonical: 'BPM', synonyms: ['beats per minute', 'tempo'] },
  { id: 'speed', category: 'tempo', canonical: 'speed', synonyms: ['pace', 'rate'] },
  
  // Tempo ranges
  { id: 'slow_tempo', category: 'tempo', canonical: 'slow tempo', synonyms: ['slow', 'slowly', 'slow speed'] },
  { id: 'medium_tempo', category: 'tempo', canonical: 'medium tempo', synonyms: ['moderate tempo', 'medium speed'] },
  { id: 'fast_tempo', category: 'tempo', canonical: 'fast tempo', synonyms: ['fast', 'quickly', 'fast speed', 'up-tempo'] },
  { id: 'very_fast', category: 'tempo', canonical: 'very fast', synonyms: ['extremely fast', 'rapid'] },
  { id: 'very_slow', category: 'tempo', canonical: 'very slow', synonyms: ['extremely slow', 'glacial'] },
  
  // Italian tempo markings (traditional)
  { id: 'largo', category: 'tempo', canonical: 'largo', synonyms: ['very slow', 'broadly'] },
  { id: 'larghetto', category: 'tempo', canonical: 'larghetto', synonyms: ['somewhat slow'] },
  { id: 'adagio', category: 'tempo', canonical: 'adagio', synonyms: ['slow', 'at ease'] },
  { id: 'adagietto', category: 'tempo', canonical: 'adagietto', synonyms: ['somewhat slow'] },
  { id: 'andante', category: 'tempo', canonical: 'andante', synonyms: ['walking pace', 'moderate'] },
  { id: 'andantino', category: 'tempo', canonical: 'andantino', synonyms: ['slightly faster than andante'] },
  { id: 'moderato', category: 'tempo', canonical: 'moderato', synonyms: ['moderate', 'moderately'] },
  { id: 'allegretto', category: 'tempo', canonical: 'allegretto', synonyms: ['moderately fast'] },
  { id: 'allegro', category: 'tempo', canonical: 'allegro', synonyms: ['fast', 'lively', 'cheerful'] },
  { id: 'vivace', category: 'tempo', canonical: 'vivace', synonyms: ['lively', 'vivacious'] },
  { id: 'presto', category: 'tempo', canonical: 'presto', synonyms: ['very fast', 'quickly'] },
  { id: 'prestissimo', category: 'tempo', canonical: 'prestissimo', synonyms: ['as fast as possible', 'extremely fast'] },
  
  // Tempo modifiers
  { id: 'molto', category: 'tempo', canonical: 'molto', synonyms: ['very', 'much'] },
  { id: 'piu', category: 'tempo', canonical: 'più', synonyms: ['more', 'plus'] },
  { id: 'meno', category: 'tempo', canonical: 'meno', synonyms: ['less', 'minus'] },
  { id: 'assai', category: 'tempo', canonical: 'assai', synonyms: ['quite', 'rather'] },
  { id: 'ma_non_troppo', category: 'tempo', canonical: 'ma non troppo', synonyms: ['but not too much'] },
  { id: 'quasi', category: 'tempo', canonical: 'quasi', synonyms: ['almost', 'as if'] },
  
  // Tempo changes
  { id: 'accelerando', category: 'tempo', canonical: 'accelerando', synonyms: ['accel', 'speed up', 'speeding up'] },
  { id: 'ritardando', category: 'tempo', canonical: 'ritardando', synonyms: ['rit', 'ritard', 'slow down', 'slowing down'] },
  { id: 'rallentando', category: 'tempo', canonical: 'rallentando', synonyms: ['rall', 'gradually slower'] },
  { id: 'ritenuto', category: 'tempo', canonical: 'ritenuto', synonyms: ['riten', 'held back', 'suddenly slower'] },
  { id: 'tempo_rubato', category: 'tempo', canonical: 'tempo rubato', synonyms: ['rubato', 'stolen time', 'flexible tempo'] },
  { id: 'a_tempo', category: 'tempo', canonical: 'a tempo', synonyms: ['return to tempo', 'back to tempo'] },
  { id: 'tempo_primo', category: 'tempo', canonical: 'tempo primo', synonyms: ['return to first tempo'] },
  
  // Modern tempo terms
  { id: 'downtempo', category: 'tempo', canonical: 'downtempo', synonyms: ['down tempo', 'chill tempo', 'slow electronic'] },
  { id: 'midtempo', category: 'tempo', canonical: 'midtempo', synonyms: ['mid tempo', 'medium pace'] },
  { id: 'uptempo', category: 'tempo', canonical: 'uptempo', synonyms: ['up tempo', 'fast pace'] },
  { id: 'double_time', category: 'tempo', canonical: 'double time', synonyms: ['double-time', 'twice as fast', '2x tempo'] },
  { id: 'half_time', category: 'tempo', canonical: 'half time', synonyms: ['half-time', 'half speed', 'halftime', '0.5x tempo'] },
  { id: 'time_stretch', category: 'tempo', canonical: 'time stretch', synonyms: ['tempo change', 'speed change'] },
  
  // Genre-specific tempo ranges
  { id: 'ballad_tempo', category: 'tempo', canonical: 'ballad tempo', synonyms: ['slow ballad', 'ballad speed'] },
  { id: 'hip_hop_tempo', category: 'tempo', canonical: 'hip hop tempo', synonyms: ['rap tempo', '80-100 bpm'] },
  { id: 'house_tempo', category: 'tempo', canonical: 'house tempo', synonyms: ['120-130 bpm', 'dance tempo'] },
  { id: 'techno_tempo', category: 'tempo', canonical: 'techno tempo', synonyms: ['130-150 bpm', 'fast dance'] },
  { id: 'dnb_tempo', category: 'tempo', canonical: 'drum and bass tempo', synonyms: ['dnb tempo', '160-180 bpm', 'jungle tempo'] },
  { id: 'dubstep_tempo', category: 'tempo', canonical: 'dubstep tempo', synonyms: ['140 bpm', 'half time dnb'] },
  { id: 'reggaeton_tempo', category: 'tempo', canonical: 'reggaeton tempo', synonyms: ['dembow tempo', '90-100 bpm'] },
];

// =============================================================================
// Rhythmic Articulation and Feel
// =============================================================================

/**
 * Rhythmic articulation and feel nouns.
 * These describe how rhythms are played and felt.
 */
export const RHYTHM_ARTICULATION_NOUNS: readonly DomainNoun[] = [
  // Articulation types
  { id: 'staccato', category: 'rhythm', canonical: 'staccato', synonyms: ['short', 'detached', 'crisp'] },
  { id: 'legato', category: 'rhythm', canonical: 'legato', synonyms: ['smooth', 'connected', 'flowing'] },
  { id: 'marcato', category: 'rhythm', canonical: 'marcato', synonyms: ['marked', 'accented', 'emphasized'] },
  { id: 'tenuto', category: 'rhythm', canonical: 'tenuto', synonyms: ['held', 'sustained'] },
  { id: 'accent', category: 'rhythm', canonical: 'accent', synonyms: ['emphasis', 'stress', 'accentuation'] },
  { id: 'ghost_note', category: 'rhythm', canonical: 'ghost note', synonyms: ['ghost', 'subtle note', 'grace note'] },
  { id: 'flam', category: 'rhythm', canonical: 'flam', synonyms: ['drum flam', 'grace note flam'] },
  { id: 'drag', category: 'rhythm', canonical: 'drag', synonyms: ['drum drag', 'double stroke'] },
  { id: 'roll', category: 'rhythm', canonical: 'roll', synonyms: ['drum roll', 'sustained roll'] },
  
  // Feel and pocket
  { id: 'pocket', category: 'rhythm', canonical: 'pocket', synonyms: ['groove pocket', 'rhythmic pocket', 'in the pocket'] },
  { id: 'tight', category: 'rhythm', canonical: 'tight', synonyms: ['tight timing', 'locked in', 'precise'] },
  { id: 'loose', category: 'rhythm', canonical: 'loose', synonyms: ['loose timing', 'relaxed', 'free'] },
  { id: 'bouncy', category: 'rhythm', canonical: 'bouncy', synonyms: ['bounce', 'springy', 'elastic'] },
  { id: 'driving', category: 'rhythm', canonical: 'driving', synonyms: ['propulsive', 'forward motion'] },
  { id: 'shuffle_feel', category: 'rhythm', canonical: 'shuffle feel', synonyms: ['shuffled', 'swung'] },
  { id: 'straight_feel', category: 'rhythm', canonical: 'straight feel', synonyms: ['even', 'metronomic'] },
  
  // Density and texture
  { id: 'sparse', category: 'rhythm', canonical: 'sparse', synonyms: ['minimal rhythm', 'few notes'] },
  { id: 'dense', category: 'rhythm', canonical: 'dense', synonyms: ['busy rhythm', 'many notes', 'active'] },
  { id: 'busy', category: 'rhythm', canonical: 'busy', synonyms: ['active', 'lots of notes'] },
  { id: 'minimal', category: 'rhythm', canonical: 'minimal', synonyms: ['sparse', 'reduced', 'simple'] },
  { id: 'complex', category: 'rhythm', canonical: 'complex', synonyms: ['intricate', 'complicated', 'dense'] },
  
  // Energy
  { id: 'energetic', category: 'rhythm', canonical: 'energetic', synonyms: ['high energy', 'vigorous'] },
  { id: 'laid_back', category: 'rhythm', canonical: 'laid back', synonyms: ['relaxed', 'chill', 'easy'] },
  { id: 'aggressive', category: 'rhythm', canonical: 'aggressive', synonyms: ['intense', 'forceful', 'hard'] },
  { id: 'gentle', category: 'rhythm', canonical: 'gentle', synonyms: ['soft', 'delicate', 'light'] },
];

// =============================================================================
// Rhythm Section and Roles
// =============================================================================

/**
 * Rhythm section instrument roles and patterns.
 */
export const RHYTHM_SECTION_NOUNS: readonly DomainNoun[] = [
  // Rhythm section roles
  { id: 'rhythm_section', category: 'rhythm', canonical: 'rhythm section', synonyms: ['backline', 'rhythm instruments'] },
  { id: 'timekeeper', category: 'rhythm', canonical: 'timekeeper', synonyms: ['keeper of time', 'time'] },
  { id: 'metronome', category: 'rhythm', canonical: 'metronome', synonyms: ['click', 'click track', 'metro'] },
  { id: 'click_track', category: 'rhythm', canonical: 'click track', synonyms: ['click', 'metronome track'] },
  
  // Drum kit components and patterns
  { id: 'kick_pattern', category: 'rhythm', canonical: 'kick pattern', synonyms: ['kick drum pattern', 'bass drum pattern'] },
  { id: 'snare_pattern', category: 'rhythm', canonical: 'snare pattern', synonyms: ['snare drum pattern'] },
  { id: 'hat_pattern', category: 'rhythm', canonical: 'hi-hat pattern', synonyms: ['hat pattern', 'hihat pattern'] },
  { id: 'ride_pattern', category: 'rhythm', canonical: 'ride cymbal pattern', synonyms: ['ride pattern'] },
  { id: 'tom_pattern', category: 'rhythm', canonical: 'tom pattern', synonyms: ['tom-tom pattern', 'toms pattern'] },
  { id: 'cymbal_pattern', category: 'rhythm', canonical: 'cymbal pattern', synonyms: ['crash pattern'] },
  
  // Percussion patterns
  { id: 'shaker_pattern', category: 'rhythm', canonical: 'shaker pattern', synonyms: ['shaker rhythm'] },
  { id: 'tambourine_pattern', category: 'rhythm', canonical: 'tambourine pattern', synonyms: ['tamb pattern'] },
  { id: 'conga_pattern', category: 'rhythm', canonical: 'conga pattern', synonyms: ['conga rhythm'] },
  { id: 'bongo_pattern', category: 'rhythm', canonical: 'bongo pattern', synonyms: ['bongo rhythm'] },
  { id: 'cowbell_pattern', category: 'rhythm', canonical: 'cowbell pattern', synonyms: ['cowbell rhythm', 'more cowbell'] },
  
  // Bass patterns
  { id: 'bass_line', category: 'rhythm', canonical: 'bass line', synonyms: ['bassline', 'bass part', 'bass pattern'] },
  { id: 'walking_bass', category: 'rhythm', canonical: 'walking bass', synonyms: ['walking bassline', 'walking bass line'] },
  { id: 'pedal_tone', category: 'rhythm', canonical: 'pedal tone', synonyms: ['pedal point', 'sustained bass'] },
  { id: 'ostinato', category: 'rhythm', canonical: 'ostinato', synonyms: ['repeated pattern', 'rhythmic ostinato'] },
  
  // Guitar rhythm patterns
  { id: 'strum_pattern', category: 'rhythm', canonical: 'strum pattern', synonyms: ['strumming pattern', 'guitar strum'] },
  { id: 'picking_pattern', category: 'rhythm', canonical: 'picking pattern', synonyms: ['fingerpicking pattern', 'arpeggiated pattern'] },
  { id: 'chop', category: 'rhythm', canonical: 'chop', synonyms: ['guitar chop', 'percussive strum', 'muted strum'] },
  { id: 'ska_upstroke', category: 'rhythm', canonical: 'ska upstroke', synonyms: ['upstroke pattern', 'reggae upstroke'] },
  
  // Piano/keyboard rhythm
  { id: 'comp', category: 'rhythm', canonical: 'comping', synonyms: ['comps', 'accompanying', 'rhythmic chords'] },
  { id: 'montuno_piano', category: 'rhythm', canonical: 'montuno', synonyms: ['piano montuno', 'latin piano pattern'] },
  { id: 'stride', category: 'rhythm', canonical: 'stride', synonyms: ['stride piano', 'stride rhythm'] },
  { id: 'boogie_woogie', category: 'rhythm', canonical: 'boogie woogie', synonyms: ['boogie', 'boogie bass'] },
];

// =============================================================================
// Timing and Synchronization
// =============================================================================

/**
 * Timing, synchronization, and rhythmic coordination nouns.
 */
export const TIMING_NOUNS: readonly DomainNoun[] = [
  // Basic timing concepts
  { id: 'timing', category: 'rhythm', canonical: 'timing', synonyms: ['time', 'temporal placement'] },
  { id: 'synchronization', category: 'rhythm', canonical: 'synchronization', synonyms: ['sync', 'in sync', 'together'] },
  { id: 'lock', category: 'rhythm', canonical: 'lock', synonyms: ['locked in', 'tight sync', 'tight timing'] },
  { id: 'phase', category: 'rhythm', canonical: 'phase', synonyms: ['timing phase', 'rhythmic phase'] },
  { id: 'latency', category: 'rhythm', canonical: 'latency', synonyms: ['delay', 'lag', 'timing delay'] },
  
  // Grid and quantization
  { id: 'grid', category: 'rhythm', canonical: 'grid', synonyms: ['timing grid', 'rhythmic grid', 'beat grid'] },
  { id: 'snap', category: 'rhythm', canonical: 'snap to grid', synonyms: ['grid snap', 'snap'] },
  { id: 'quantize_strength', category: 'rhythm', canonical: 'quantize strength', synonyms: ['quantization amount', 'quant strength'] },
  { id: 'humanize_amount', category: 'rhythm', canonical: 'humanize amount', synonyms: ['timing variation', 'groove amount'] },
  
  // Timing relationships
  { id: 'on_beat', category: 'rhythm', canonical: 'on the beat', synonyms: ['on beat', 'on grid'] },
  { id: 'off_beat', category: 'rhythm', canonical: 'off the beat', synonyms: ['off beat', 'between beats'] },
  { id: 'ahead', category: 'rhythm', canonical: 'ahead of the beat', synonyms: ['rushing', 'early', 'pushed'] },
  { id: 'behind', category: 'rhythm', canonical: 'behind the beat', synonyms: ['dragging', 'late', 'pulled'] },
  { id: 'simultaneous', category: 'rhythm', canonical: 'simultaneous', synonyms: ['at the same time', 'together'] },
  { id: 'staggered', category: 'rhythm', canonical: 'staggered', synonyms: ['offset', 'not together', 'displaced'] },
  
  // Rhythmic layers
  { id: 'composite_rhythm', category: 'rhythm', canonical: 'composite rhythm', synonyms: ['combined rhythm', 'total rhythm'] },
  { id: 'rhythmic_layer', category: 'rhythm', canonical: 'rhythmic layer', synonyms: ['rhythm layer', 'rhythmic voice'] },
  { id: 'rhythmic_density', category: 'rhythm', canonical: 'rhythmic density', synonyms: ['note density', 'event density'] },
  { id: 'attack_density', category: 'rhythm', canonical: 'attack density', synonyms: ['onset density', 'note onsets'] },
];

// =============================================================================
// Dance and Movement-Related Rhythm
// =============================================================================

/**
 * Rhythm terms related to dance, movement, and physical feel.
 */
export const DANCE_RHYTHM_NOUNS: readonly DomainNoun[] = [
  // Dance styles
  { id: 'dance_beat', category: 'rhythm', canonical: 'dance beat', synonyms: ['danceable rhythm', 'club beat'] },
  { id: 'club_rhythm', category: 'rhythm', canonical: 'club rhythm', synonyms: ['club beat', 'dancefloor rhythm'] },
  { id: 'body_music', category: 'rhythm', canonical: 'body music', synonyms: ['body rhythm', 'physical groove'] },
  
  // Physical movement
  { id: 'head_nod', category: 'rhythm', canonical: 'head nod', synonyms: ['head bobbing', 'nod groove'] },
  { id: 'toe_tap', category: 'rhythm', canonical: 'toe tap', synonyms: ['foot tap', 'tap along'] },
  { id: 'bounce', category: 'rhythm', canonical: 'bounce', synonyms: ['rhythmic bounce', 'springy feel'] },
  { id: 'sway', category: 'rhythm', canonical: 'sway', synonyms: ['swaying rhythm', 'gentle motion'] },
  
  // Feel and motion
  { id: 'forward_motion', category: 'rhythm', canonical: 'forward motion', synonyms: ['momentum', 'propulsion', 'drive'] },
  { id: 'circular_motion', category: 'rhythm', canonical: 'circular motion', synonyms: ['cyclical rhythm', 'circular feel'] },
  { id: 'pulsing', category: 'rhythm', canonical: 'pulsing', synonyms: ['pulse feel', 'throbbing'] },
  { id: 'pumping', category: 'rhythm', canonical: 'pumping', synonyms: ['pump', 'driving pulse'] },
];

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * All rhythm and tempo domain nouns from this batch.
 */
export const RHYTHM_TEMPO_BATCH1_NOUNS: readonly DomainNoun[] = [
  ...RHYTHM_PATTERN_NOUNS,
  ...TEMPO_NOUNS,
  ...RHYTHM_ARTICULATION_NOUNS,
  ...RHYTHM_SECTION_NOUNS,
  ...TIMING_NOUNS,
  ...DANCE_RHYTHM_NOUNS,
];

/**
 * Lookup map for quick retrieval by canonical ID.
 */
export const RHYTHM_TEMPO_BATCH1_MAP = new Map(
  RHYTHM_TEMPO_BATCH1_NOUNS.map(noun => [noun.id, noun])
);

/**
 * Get a rhythm/tempo noun by ID.
 */
export function getRhythmTempoNoun(id: string): DomainNoun | undefined {
  return RHYTHM_TEMPO_BATCH1_MAP.get(id);
}

/**
 * Get all synonyms for a rhythm/tempo concept.
 */
export function getRhythmTempoSynonyms(id: string): readonly string[] {
  const noun = RHYTHM_TEMPO_BATCH1_MAP.get(id);
  return noun ? [noun.canonical, ...noun.synonyms] : [];
}

/**
 * Find rhythm/tempo nouns by category.
 */
export function getRhythmTempoNounsByCategory(
  category: DomainNounCategory
): readonly DomainNoun[] {
  return RHYTHM_TEMPO_BATCH1_NOUNS.filter(noun => noun.category === category);
}
