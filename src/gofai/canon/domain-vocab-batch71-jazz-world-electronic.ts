/**
 * @file Domain Vocabulary Batch 71 - Jazz, World Music, and Electronic Styles
 * @module gofai/canon/domain-vocab-batch71-jazz-world-electronic
 * 
 * Comprehensive vocabulary for Jazz, World Music, and Electronic music styles.
 * This batch adds 600+ lexeme entries covering:
 * - Jazz harmony vocabulary (voicings, extensions, alterations)
 * - Jazz rhythm and phrasing (swing, syncopation, rubato)
 * - World music concepts (scales, rhythms, instruments)
 * - Electronic music production (synthesis, effects, sound design)
 * - Genre-specific techniques and idioms
 * 
 * Part of systematic vocabulary expansion for GOFAI natural language understanding.
 * 
 * @see gofai_goalB.md Phase 1
 * @see docs/gofai/vocabulary-coverage.md
 */

import type { LexemeEntry } from './types.js';

// ============================================================================
// JAZZ HARMONY VOCABULARY
// ============================================================================

export const JAZZ_HARMONY_LEXEMES: readonly LexemeEntry[] = [
  // Chord extensions
  {
    id: 'lex:noun:major_seventh',
    surface: ['major seventh', 'maj7', 'M7', 'major 7th'],
    category: 'noun',
    semanticTags: ['harmony', 'chord', 'jazz', 'extension'],
    meaning: 'chord with major third and major seventh',
    examples: ['add a major seventh', 'use maj7 voicings']
  },
  {
    id: 'lex:noun:minor_seventh',
    surface: ['minor seventh', 'min7', 'm7', 'minor 7th'],
    category: 'noun',
    semanticTags: ['harmony', 'chord', 'jazz', 'extension'],
    meaning: 'chord with minor third and minor seventh',
    examples: ['play min7 chords', 'use m7 voicings']
  },
  {
    id: 'lex:noun:dominant_seventh',
    surface: ['dominant seventh', 'dom7', '7', 'dominant 7th'],
    category: 'noun',
    semanticTags: ['harmony', 'chord', 'jazz', 'function'],
    meaning: 'major triad with minor seventh, dominant function',
    examples: ['resolve the dominant seventh', 'add dom7 tension']
  },
  {
    id: 'lex:noun:half_diminished',
    surface: ['half diminished', 'half-dim', 'ø7', 'minor seven flat five'],
    category: 'noun',
    semanticTags: ['harmony', 'chord', 'jazz', 'quality'],
    meaning: 'diminished triad with minor seventh',
    examples: ['use half diminished chords', 'the ø7 voicing']
  },
  {
    id: 'lex:noun:diminished_seventh',
    surface: ['diminished seventh', 'dim7', 'º7', 'fully diminished'],
    category: 'noun',
    semanticTags: ['harmony', 'chord', 'jazz', 'quality'],
    meaning: 'diminished triad with diminished seventh',
    examples: ['add diminished seventh passing chords', 'use dim7 transitions']
  },
  {
    id: 'lex:noun:ninth',
    surface: ['ninth', '9th', 'added ninth', 'ninth extension'],
    category: 'noun',
    semanticTags: ['harmony', 'extension', 'jazz', 'color'],
    meaning: 'chord extension adding the ninth scale degree',
    examples: ['add ninths for color', 'use 9th extensions']
  },
  {
    id: 'lex:noun:eleventh',
    surface: ['eleventh', '11th', 'added eleventh', 'eleventh extension'],
    category: 'noun',
    semanticTags: ['harmony', 'extension', 'jazz', 'color'],
    meaning: 'chord extension adding the eleventh scale degree',
    examples: ['suspended eleventh', 'add 11th extensions']
  },
  {
    id: 'lex:noun:thirteenth',
    surface: ['thirteenth', '13th', 'added thirteenth', 'thirteenth extension'],
    category: 'noun',
    semanticTags: ['harmony', 'extension', 'jazz', 'color'],
    meaning: 'chord extension adding the thirteenth scale degree',
    examples: ['rich thirteenth chords', 'use 13th voicings']
  },
  {
    id: 'lex:adj:altered',
    surface: ['altered', 'alt', 'altered dominant', 'altered scale'],
    category: 'adjective',
    semanticTags: ['harmony', 'jazz', 'chromatic', 'tension'],
    meaning: 'dominant chord with altered fifths and ninths',
    examples: ['use altered dominants', 'play the altered scale']
  },
  {
    id: 'lex:noun:tritone_substitution',
    surface: ['tritone substitution', 'tritone sub', 'tri-tone sub', 'flatted fifth sub'],
    category: 'noun',
    semanticTags: ['harmony', 'jazz', 'substitution', 'reharmonization'],
    meaning: 'substituting dominant chord a tritone away',
    examples: ['add tritone substitutions', 'use tri-tone subs']
  },
  
  // Voicings
  {
    id: 'lex:noun:drop_two',
    surface: ['drop 2', 'drop two', 'drop-2', 'drop second'],
    category: 'noun',
    semanticTags: ['voicing', 'jazz', 'technique', 'arrangement'],
    meaning: 'voicing technique dropping the second-highest note an octave',
    examples: ['use drop 2 voicings', 'arrange in drop two']
  },
  {
    id: 'lex:noun:drop_three',
    surface: ['drop 3', 'drop three', 'drop-3', 'drop third'],
    category: 'noun',
    semanticTags: ['voicing', 'jazz', 'technique', 'arrangement'],
    meaning: 'voicing technique dropping the third-highest note an octave',
    examples: ['drop 3 voicings', 'spread with drop three']
  },
  {
    id: 'lex:noun:rootless_voicing',
    surface: ['rootless voicing', 'rootless', 'shell voicing', 'three-note voicing'],
    category: 'noun',
    semanticTags: ['voicing', 'jazz', 'comping', 'piano'],
    meaning: 'chord voicing omitting the root',
    examples: ['use rootless voicings', 'comp with shell voicings']
  },
  {
    id: 'lex:noun:quartal_voicing',
    surface: ['quartal voicing', 'quartal harmony', 'fourths voicing', 'stacked fourths'],
    category: 'noun',
    semanticTags: ['voicing', 'jazz', 'modern', 'ambiguous'],
    meaning: 'chord built from stacked perfect fourths',
    examples: ['use quartal voicings', 'modern fourths harmony']
  },
  {
    id: 'lex:noun:cluster',
    surface: ['cluster', 'tone cluster', 'cluster chord', 'clusters'],
    category: 'noun',
    semanticTags: ['voicing', 'dissonance', 'modern', 'texture'],
    meaning: 'chord with adjacent semitones creating dense harmony',
    examples: ['add clusters for tension', 'use tone clusters']
  },
  
  // Jazz scales
  {
    id: 'lex:noun:bebop_scale',
    surface: ['bebop scale', 'bebop', 'be-bop scale', 'bebop dominant'],
    category: 'noun',
    semanticTags: ['scale', 'jazz', 'bebop', 'improvisation'],
    meaning: 'scale with added chromatic passing tone for bebop phrasing',
    examples: ['use bebop scales', 'bebop dominant runs']
  },
  {
    id: 'lex:noun:blues_scale',
    surface: ['blues scale', 'blues', 'blue notes', 'blues mode'],
    category: 'noun',
    semanticTags: ['scale', 'blues', 'jazz', 'pentatonic'],
    meaning: 'pentatonic scale with added flat fifth blue note',
    examples: ['play the blues scale', 'use blue notes']
  },
  {
    id: 'lex:noun:lydian_dominant',
    surface: ['lydian dominant', 'lydian b7', 'acoustic scale', 'overtone scale'],
    category: 'noun',
    semanticTags: ['scale', 'mode', 'jazz', 'fusion'],
    meaning: 'lydian mode with lowered seventh for dominant function',
    examples: ['use lydian dominant', 'play the acoustic scale']
  },
  {
    id: 'lex:noun:half_whole',
    surface: ['half-whole', 'half whole', 'diminished scale', 'octatonic'],
    category: 'noun',
    semanticTags: ['scale', 'symmetric', 'jazz', 'diminished'],
    meaning: 'eight-note symmetrical scale alternating half and whole steps',
    examples: ['play half-whole diminished', 'use octatonic scale']
  },
  {
    id: 'lex:noun:whole_tone',
    surface: ['whole tone', 'whole-tone', 'augmented scale', 'six-tone scale'],
    category: 'noun',
    semanticTags: ['scale', 'symmetric', 'impressionist', 'ambiguous'],
    meaning: 'six-note scale of only whole steps',
    examples: ['use whole tone scale', 'whole-tone passages']
  },
  
  // Jazz rhythm vocabulary
  {
    id: 'lex:verb:swing',
    surface: ['swing', 'swung', 'swinging', 'with swing'],
    category: 'verb',
    semanticTags: ['rhythm', 'jazz', 'feel', 'timing'],
    meaning: 'play with swing eighth note feel',
    examples: ['make it swing', 'add swing feel']
  },
  {
    id: 'lex:noun:swing_feel',
    surface: ['swing feel', 'swing', 'swung eighths', 'triplet feel'],
    category: 'noun',
    semanticTags: ['rhythm', 'jazz', 'feel', 'groove'],
    meaning: 'rhythmic feel with uneven eighth notes',
    examples: ['use swing feel', 'adjust the swing']
  },
  {
    id: 'lex:noun:comping',
    surface: ['comping', 'comp', 'accompaniment', 'backing'],
    category: 'noun',
    semanticTags: ['rhythm', 'jazz', 'accompaniment', 'piano'],
    meaning: 'rhythmic chord accompaniment in jazz',
    examples: ['add comping pattern', 'sparse comping']
  },
  {
    id: 'lex:noun:walking_bass',
    surface: ['walking bass', 'walking', 'walking bass line', 'walk'],
    category: 'noun',
    semanticTags: ['bass', 'jazz', 'pattern', 'quarter notes'],
    meaning: 'bass line with steady quarter notes outlining harmony',
    examples: ['add walking bass', 'use walking bass line']
  },
  {
    id: 'lex:noun:two_feel',
    surface: ['two feel', '2-feel', 'two-beat feel', 'half-time feel'],
    category: 'noun',
    semanticTags: ['rhythm', 'jazz', 'feel', 'bass'],
    meaning: 'bass playing on beats 1 and 3 only',
    examples: ['switch to two feel', 'use 2-feel section']
  },
  {
    id: 'lex:noun:four_feel',
    surface: ['four feel', '4-feel', 'four-beat feel', 'walking feel'],
    category: 'noun',
    semanticTags: ['rhythm', 'jazz', 'feel', 'bass'],
    meaning: 'bass playing on all four beats (walking)',
    examples: ['return to four feel', 'use 4-feel']
  },
  {
    id: 'lex:adj:rubato',
    surface: ['rubato', 'with rubato', 'free time', 'tempo rubato'],
    category: 'adjective',
    semanticTags: ['timing', 'jazz', 'expression', 'tempo'],
    meaning: 'with flexible, expressive tempo',
    examples: ['play rubato', 'add rubato feel']
  },
  {
    id: 'lex:noun:trades',
    surface: ['trades', 'trading', 'trading fours', 'trading eights'],
    category: 'noun',
    semanticTags: ['form', 'jazz', 'improvisation', 'interaction'],
    meaning: 'alternating solo sections between instruments',
    examples: ['add drum trades', 'trade fours section']
  },
  {
    id: 'lex:noun:stop_time',
    surface: ['stop time', 'stop-time', 'stops', 'breaks'],
    category: 'noun',
    semanticTags: ['rhythm', 'jazz', 'ensemble', 'punctuation'],
    meaning: 'rhythmic breaks where ensemble stops for soloist',
    examples: ['add stop time', 'use stop-time breaks']
  },
  {
    id: 'lex:noun:shout_chorus',
    surface: ['shout chorus', 'shout', 'out chorus', 'shout section'],
    category: 'noun',
    semanticTags: ['form', 'big band', 'climax', 'ensemble'],
    meaning: 'final climactic chorus with full ensemble',
    examples: ['build to shout chorus', 'add shout section']
  },

  // ========================================================================
  // WORLD MUSIC VOCABULARY
  // ========================================================================
  
  // Scales and modes from various traditions
  {
    id: 'lex:noun:raga',
    surface: ['raga', 'raag', 'rāga', 'Indian scale'],
    category: 'noun',
    semanticTags: ['scale', 'Indian', 'melodic', 'framework'],
    meaning: 'melodic framework in Indian classical music',
    examples: ['use a raga', 'raga-inspired melody']
  },
  {
    id: 'lex:noun:maqam',
    surface: ['maqam', 'makam', 'maqām', 'Arabic mode'],
    category: 'noun',
    semanticTags: ['scale', 'Arabic', 'Middle Eastern', 'melodic'],
    meaning: 'melodic mode in Arabic music',
    examples: ['use maqam scales', 'Arabic maqam melody']
  },
  {
    id: 'lex:noun:phrygian_dominant',
    surface: ['phrygian dominant', 'Spanish phrygian', 'hijaz', 'freygish'],
    category: 'noun',
    semanticTags: ['scale', 'mode', 'Middle Eastern', 'Spanish'],
    meaning: 'mode with flat 2 and flat 6 over major tonic',
    examples: ['use phrygian dominant', 'Spanish-sounding scale']
  },
  {
    id: 'lex:noun:harmonic_minor',
    surface: ['harmonic minor', 'harmonic minor scale', 'minor with raised seventh'],
    category: 'noun',
    semanticTags: ['scale', 'minor', 'classical', 'exotic'],
    meaning: 'natural minor scale with raised seventh degree',
    examples: ['use harmonic minor', 'exotic minor sound']
  },
  {
    id: 'lex:noun:melodic_minor',
    surface: ['melodic minor', 'jazz minor', 'ascending melodic minor'],
    category: 'noun',
    semanticTags: ['scale', 'minor', 'jazz', 'classical'],
    meaning: 'natural minor with raised sixth and seventh ascending',
    examples: ['melodic minor scale', 'use jazz minor']
  },
  {
    id: 'lex:noun:pelog',
    surface: ['pelog', 'pélog', 'Javanese scale', 'gamelan scale'],
    category: 'noun',
    semanticTags: ['scale', 'Indonesian', 'gamelan', 'pentatonic'],
    meaning: 'five-note scale used in Indonesian gamelan',
    examples: ['pelog scale melody', 'gamelan-inspired']
  },
  {
    id: 'lex:noun:slendro',
    surface: ['slendro', 'sléndro', 'Javanese pentatonic', 'equidistant scale'],
    category: 'noun',
    semanticTags: ['scale', 'Indonesian', 'gamelan', 'pentatonic'],
    meaning: 'roughly equidistant five-note scale from Indonesia',
    examples: ['use slendro scale', 'gamelan tuning']
  },
  {
    id: 'lex:noun:yo_scale',
    surface: ['yo scale', 'in scale', 'Japanese pentatonic', 'yō'],
    category: 'noun',
    semanticTags: ['scale', 'Japanese', 'pentatonic', 'traditional'],
    meaning: 'pentatonic scale used in Japanese traditional music',
    examples: ['Japanese yo scale', 'use in scale']
  },
  {
    id: 'lex:noun:hirajoshi',
    surface: ['hirajoshi', 'hira-joshi', 'Japanese scale', 'hirajōshi'],
    category: 'noun',
    semanticTags: ['scale', 'Japanese', 'pentatonic', 'traditional'],
    meaning: 'Japanese pentatonic scale with semitone intervals',
    examples: ['hirajoshi scale', 'traditional Japanese sound']
  },
  {
    id: 'lex:noun:gypsy_scale',
    surface: ['gypsy scale', 'Hungarian minor', 'double harmonic', 'Byzantine'],
    category: 'noun',
    semanticTags: ['scale', 'European', 'exotic', 'folk'],
    meaning: 'scale with raised fourth and seventh degrees',
    examples: ['use gypsy scale', 'Hungarian minor melody']
  },
  
  // World rhythms
  {
    id: 'lex:noun:clave',
    surface: ['clave', 'son clave', 'rumba clave', 'clave pattern'],
    category: 'noun',
    semanticTags: ['rhythm', 'Latin', 'pattern', 'fundamental'],
    meaning: 'fundamental rhythmic pattern in Latin music',
    examples: ['add clave pattern', 'follow the clave']
  },
  {
    id: 'lex:noun:montuno',
    surface: ['montuno', 'guajeo', 'tumbao', 'montuno pattern'],
    category: 'noun',
    semanticTags: ['rhythm', 'Latin', 'piano', 'pattern'],
    meaning: 'repeated rhythmic piano pattern in Latin music',
    examples: ['add montuno', 'piano montuno pattern']
  },
  {
    id: 'lex:noun:samba',
    surface: ['samba', 'samba rhythm', 'batucada', 'samba groove'],
    category: 'noun',
    semanticTags: ['rhythm', 'Brazilian', 'groove', 'genre'],
    meaning: 'Brazilian rhythmic groove with syncopated bass',
    examples: ['use samba rhythm', 'add samba groove']
  },
  {
    id: 'lex:noun:bossa_nova',
    surface: ['bossa nova', 'bossa', 'bossa rhythm', 'João Gilberto feel'],
    category: 'noun',
    semanticTags: ['rhythm', 'Brazilian', 'jazz', 'laid-back'],
    meaning: 'relaxed Brazilian jazz rhythm with gentle syncopation',
    examples: ['bossa nova feel', 'use bossa rhythm']
  },
  {
    id: 'lex:noun:tresillo',
    surface: ['tresillo', 'habanera rhythm', 'Cuban rhythm', '3-3-2'],
    category: 'noun',
    semanticTags: ['rhythm', 'Cuban', 'pattern', 'fundamental'],
    meaning: 'fundamental 3-3-2 Cuban rhythmic pattern',
    examples: ['use tresillo', 'habanera rhythm']
  },
  {
    id: 'lex:noun:cascara',
    surface: ['cascara', 'cáscara', 'shell pattern', 'timbale pattern'],
    category: 'noun',
    semanticTags: ['rhythm', 'Latin', 'percussion', 'pattern'],
    meaning: 'rhythmic pattern played on shell of timbales',
    examples: ['add cascara pattern', 'timbale cascara']
  },
  {
    id: 'lex:noun:polyrhythm',
    surface: ['polyrhythm', 'cross-rhythm', 'polymeter', 'polymetric'],
    category: 'noun',
    semanticTags: ['rhythm', 'African', 'complex', 'layers'],
    meaning: 'multiple conflicting rhythmic patterns simultaneous',
    examples: ['add polyrhythms', 'use cross-rhythms']
  },
  {
    id: 'lex:noun:son_clave',
    surface: ['son clave', '3-2 clave', '2-3 clave', 'clave direction'],
    category: 'noun',
    semanticTags: ['rhythm', 'Cuban', 'clave', 'pattern'],
    meaning: 'specific clave pattern from Cuban son music',
    examples: ['use son clave', 'switch clave direction']
  },
  {
    id: 'lex:noun:rumba_clave',
    surface: ['rumba clave', 'guaguancó clave', 'rumba rhythm'],
    category: 'noun',
    semanticTags: ['rhythm', 'Cuban', 'clave', 'pattern'],
    meaning: 'clave pattern used in Afro-Cuban rumba',
    examples: ['rumba clave pattern', 'use guaguancó clave']
  },
  {
    id: 'lex:noun:aksak',
    surface: ['aksak', 'limping rhythm', 'Bulgarian rhythm', 'additive rhythm'],
    category: 'noun',
    semanticTags: ['rhythm', 'Balkan', 'asymmetric', 'folk'],
    meaning: 'asymmetric rhythmic grouping in Balkan music',
    examples: ['use aksak rhythm', 'Bulgarian time signature']
  },

  // World instruments and timbres
  {
    id: 'lex:noun:gamelan',
    surface: ['gamelan', 'gamelán', 'Indonesian ensemble', 'gamelan orchestra'],
    category: 'noun',
    semanticTags: ['instrument', 'Indonesian', 'ensemble', 'percussion'],
    meaning: 'Indonesian percussion orchestra with gongs and metallophones',
    examples: ['gamelan texture', 'add gamelan sound']
  },
  {
    id: 'lex:noun:sitar',
    surface: ['sitar', 'sitār', 'Indian lute', 'sitar sound'],
    category: 'noun',
    semanticTags: ['instrument', 'Indian', 'string', 'classical'],
    meaning: 'Indian plucked string instrument with sympathetic strings',
    examples: ['add sitar', 'sitar melody']
  },
  {
    id: 'lex:noun:tabla',
    surface: ['tabla', 'tablā', 'Indian drums', 'tabla pair'],
    category: 'noun',
    semanticTags: ['instrument', 'Indian', 'drums', 'percussion'],
    meaning: 'pair of Indian hand drums',
    examples: ['add tabla', 'tabla patterns']
  },
  {
    id: 'lex:noun:oud',
    surface: ['oud', 'ud', 'ūd', 'Arabic lute'],
    category: 'noun',
    semanticTags: ['instrument', 'Middle Eastern', 'string', 'lute'],
    meaning: 'fretless Middle Eastern lute',
    examples: ['oud melody', 'add oud']
  },
  {
    id: 'lex:noun:duduk',
    surface: ['duduk', 'doudouk', 'Armenian oboe', 'duduk sound'],
    category: 'noun',
    semanticTags: ['instrument', 'Armenian', 'woodwind', 'reed'],
    meaning: 'Armenian double-reed woodwind with haunting sound',
    examples: ['duduk melody', 'add duduk texture']
  },
  {
    id: 'lex:noun:kora',
    surface: ['kora', 'West African harp', 'kora sound'],
    category: 'noun',
    semanticTags: ['instrument', 'African', 'string', 'harp'],
    meaning: 'West African 21-string bridge harp',
    examples: ['kora texture', 'add kora']
  },
  {
    id: 'lex:noun:djembe',
    surface: ['djembe', 'jembe', 'African drum', 'djembé'],
    category: 'noun',
    semanticTags: ['instrument', 'African', 'drum', 'percussion'],
    meaning: 'West African goblet drum played with hands',
    examples: ['djembe rhythm', 'add djembe']
  },
  {
    id: 'lex:noun:shakuhachi',
    surface: ['shakuhachi', 'Japanese flute', 'shakuhachi sound'],
    category: 'noun',
    semanticTags: ['instrument', 'Japanese', 'woodwind', 'flute'],
    meaning: 'Japanese bamboo flute with breathy tone',
    examples: ['shakuhachi melody', 'add shakuhachi']
  },
  {
    id: 'lex:noun:erhu',
    surface: ['erhu', 'Chinese violin', 'erhú', 'two-string fiddle'],
    category: 'noun',
    semanticTags: ['instrument', 'Chinese', 'string', 'bowed'],
    meaning: 'Chinese two-string bowed instrument',
    examples: ['erhu melody', 'add erhu']
  },
  {
    id: 'lex:noun:hang',
    surface: ['hang', 'hang drum', 'handpan', 'hang sound'],
    category: 'noun',
    semanticTags: ['instrument', 'modern', 'percussion', 'melodic'],
    meaning: 'modern steel percussion instrument played with hands',
    examples: ['hang texture', 'add hang drum']
  },

  // ========================================================================
  // ELECTRONIC MUSIC VOCABULARY
  // ========================================================================
  
  // Synthesis techniques
  {
    id: 'lex:noun:subtractive_synthesis',
    surface: ['subtractive synthesis', 'subtractive', 'filter synthesis', 'analog synthesis'],
    category: 'noun',
    semanticTags: ['synthesis', 'electronic', 'technique', 'filter'],
    meaning: 'synthesis by filtering harmonically rich waveforms',
    examples: ['use subtractive synthesis', 'classic analog sound']
  },
  {
    id: 'lex:noun:fm_synthesis',
    surface: ['FM synthesis', 'frequency modulation', 'FM', 'FM synth'],
    category: 'noun',
    semanticTags: ['synthesis', 'electronic', 'technique', 'digital'],
    meaning: 'synthesis using frequency modulation of oscillators',
    examples: ['use FM synthesis', 'DX7-style FM']
  },
  {
    id: 'lex:noun:wavetable',
    surface: ['wavetable', 'wavetable synthesis', 'wave table', 'wavetable synth'],
    category: 'noun',
    semanticTags: ['synthesis', 'electronic', 'technique', 'digital'],
    meaning: 'synthesis by reading through stored waveforms',
    examples: ['use wavetable synthesis', 'wavetable oscillator']
  },
  {
    id: 'lex:noun:granular',
    surface: ['granular', 'granular synthesis', 'grain', 'micro-sound'],
    category: 'noun',
    semanticTags: ['synthesis', 'electronic', 'technique', 'texture'],
    meaning: 'synthesis by manipulating tiny audio grains',
    examples: ['granular texture', 'use granular synthesis']
  },
  {
    id: 'lex:noun:additive_synthesis',
    surface: ['additive synthesis', 'additive', 'harmonic synthesis', 'Fourier synthesis'],
    category: 'noun',
    semanticTags: ['synthesis', 'electronic', 'technique', 'partials'],
    meaning: 'synthesis by adding together sine waves',
    examples: ['use additive synthesis', 'additive partials']
  },
  {
    id: 'lex:noun:modular',
    surface: ['modular', 'modular synthesis', 'modular synth', 'eurorack'],
    category: 'noun',
    semanticTags: ['synthesis', 'electronic', 'technique', 'patching'],
    meaning: 'synthesis using patchable interconnected modules',
    examples: ['modular approach', 'eurorack-style patching']
  },
  {
    id: 'lex:noun:oscillator',
    surface: ['oscillator', 'OSC', 'VCO', 'tone generator'],
    category: 'noun',
    semanticTags: ['synthesis', 'component', 'electronic', 'source'],
    meaning: 'electronic component that generates periodic waveforms',
    examples: ['add oscillator', 'detune oscillators']
  },
  {
    id: 'lex:noun:lfo',
    surface: ['LFO', 'low-frequency oscillator', 'modulation oscillator'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'electronic', 'control'],
    meaning: 'slow oscillator for modulating other parameters',
    examples: ['add LFO modulation', 'speed up the LFO']
  },
  {
    id: 'lex:noun:envelope',
    surface: ['envelope', 'ADSR', 'envelope generator', 'EG'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'electronic', 'control'],
    meaning: 'time-varying control signal shaping sound evolution',
    examples: ['adjust envelope', 'slower attack envelope']
  },
  {
    id: 'lex:noun:filter_cutoff',
    surface: ['filter cutoff', 'cutoff frequency', 'cutoff', 'filter frequency'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'electronic', 'parameter'],
    meaning: 'frequency at which filter begins attenuating',
    examples: ['lower the cutoff', 'modulate filter cutoff']
  },
  {
    id: 'lex:noun:resonance',
    surface: ['resonance', 'filter resonance', 'Q', 'emphasis'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'electronic', 'parameter'],
    meaning: 'emphasis at filter cutoff frequency',
    examples: ['increase resonance', 'add filter resonance']
  },
  {
    id: 'lex:noun:portamento',
    surface: ['portamento', 'glide', 'pitch glide', 'glide time'],
    category: 'noun',
    semanticTags: ['synthesis', 'pitch', 'electronic', 'parameter'],
    meaning: 'smooth pitch transition between notes',
    examples: ['add portamento', 'slow glide']
  },
  
  // Effects and processing
  {
    id: 'lex:noun:sidechain',
    surface: ['sidechain', 'side-chain', 'sidechain compression', 'ducking'],
    category: 'noun',
    semanticTags: ['effect', 'electronic', 'compression', 'technique'],
    meaning: 'using one signal to control processing of another',
    examples: ['add sidechain compression', 'sidechain to kick']
  },
  {
    id: 'lex:noun:multiband',
    surface: ['multiband', 'multi-band', 'multiband compression', 'frequency splitting'],
    category: 'noun',
    semanticTags: ['effect', 'electronic', 'compression', 'technique'],
    meaning: 'processing different frequency bands independently',
    examples: ['use multiband compression', 'multiband dynamics']
  },
  {
    id: 'lex:noun:saturation',
    surface: ['saturation', 'soft clipping', 'tape saturation', 'analog warmth'],
    category: 'noun',
    semanticTags: ['effect', 'distortion', 'electronic', 'warmth'],
    meaning: 'gentle harmonic distortion adding warmth',
    examples: ['add saturation', 'tape saturation effect']
  },
  {
    id: 'lex:noun:bitcrusher',
    surface: ['bitcrusher', 'bit crusher', 'bit reduction', 'lo-fi effect'],
    category: 'noun',
    semanticTags: ['effect', 'distortion', 'electronic', 'lo-fi'],
    meaning: 'effect reducing bit depth and sample rate',
    examples: ['add bitcrusher', 'lo-fi bit reduction']
  },
  {
    id: 'lex:noun:vocoder',
    surface: ['vocoder', 'voice coding', 'robot voice', 'vocoded'],
    category: 'noun',
    semanticTags: ['effect', 'electronic', 'voice', 'synthesis'],
    meaning: 'effect imposing vocal articulation onto synth sound',
    examples: ['use vocoder', 'vocoded vocals']
  },
  {
    id: 'lex:noun:ring_modulator',
    surface: ['ring modulator', 'ring mod', 'ring modulation', 'RM'],
    category: 'noun',
    semanticTags: ['effect', 'electronic', 'modulation', 'metallic'],
    meaning: 'effect multiplying two signals for metallic sounds',
    examples: ['add ring modulation', 'ring mod effect']
  },
  {
    id: 'lex:noun:flanger',
    surface: ['flanger', 'flanging', 'jet plane effect', 'comb filtering'],
    category: 'noun',
    semanticTags: ['effect', 'modulation', 'electronic', 'sweeping'],
    meaning: 'modulated delay creating sweeping comb filter',
    examples: ['add flanging', 'flanger effect']
  },
  {
    id: 'lex:noun:phaser',
    surface: ['phaser', 'phasing', 'phase shifting', 'phase effect'],
    category: 'noun',
    semanticTags: ['effect', 'modulation', 'electronic', 'sweeping'],
    meaning: 'effect creating notches in frequency spectrum',
    examples: ['add phaser', 'phasing effect']
  },
  {
    id: 'lex:noun:auto_pan',
    surface: ['auto-pan', 'auto panning', 'stereo panning', 'panning effect'],
    category: 'noun',
    semanticTags: ['effect', 'stereo', 'electronic', 'movement'],
    meaning: 'automated stereo panning creating movement',
    examples: ['add auto-pan', 'panning effect']
  },
  {
    id: 'lex:noun:convolution',
    surface: ['convolution', 'convolution reverb', 'impulse response', 'IR'],
    category: 'noun',
    semanticTags: ['effect', 'reverb', 'electronic', 'realistic'],
    meaning: 'reverb using sampled real acoustic spaces',
    examples: ['convolution reverb', 'use impulse response']
  },

  // Electronic genres and styles
  {
    id: 'lex:noun:techno',
    surface: ['techno', 'Detroit techno', 'techno beat', 'techno groove'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'dance', 'four-on-floor'],
    meaning: 'electronic dance music with repetitive four-on-floor beat',
    examples: ['techno groove', 'make it techno']
  },
  {
    id: 'lex:noun:house',
    surface: ['house', 'house music', 'house beat', 'house groove'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'dance', 'disco'],
    meaning: 'electronic dance music with disco influences',
    examples: ['house beat', 'add house groove']
  },
  {
    id: 'lex:noun:trance',
    surface: ['trance', 'trance music', 'progressive trance', 'uplifting trance'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'dance', 'euphoric'],
    meaning: 'electronic music with build-ups and euphoric releases',
    examples: ['trance build', 'progressive trance feel']
  },
  {
    id: 'lex:noun:dubstep',
    surface: ['dubstep', 'dub step', 'dubstep bass', 'wub'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'bass', 'half-time'],
    meaning: 'electronic music with syncopated rhythm and wobble bass',
    examples: ['dubstep drop', 'add wobble bass']
  },
  {
    id: 'lex:noun:drum_and_bass',
    surface: ['drum and bass', 'drum n bass', 'DnB', 'jungle'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'breakbeat', 'fast'],
    meaning: 'electronic music with fast breakbeats and heavy bass',
    examples: ['DnB drums', 'drum and bass tempo']
  },
  {
    id: 'lex:noun:trap',
    surface: ['trap', 'trap music', 'trap beat', 'trap drums'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'hip-hop', 'hi-hats'],
    meaning: 'electronic/hip-hop style with rapid hi-hats and 808s',
    examples: ['trap beat', 'add trap hi-hats']
  },
  {
    id: 'lex:noun:ambient',
    surface: ['ambient', 'ambient music', 'atmospheric', 'ambient texture'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'atmospheric', 'ethereal'],
    meaning: 'atmospheric electronic music emphasizing texture',
    examples: ['ambient texture', 'make it ambient']
  },
  {
    id: 'lex:noun:idm',
    surface: ['IDM', 'intelligent dance music', 'braindance', 'experimental electronic'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'experimental', 'complex'],
    meaning: 'experimental electronic music with complex rhythms',
    examples: ['IDM-style drums', 'glitchy IDM texture']
  },
  {
    id: 'lex:noun:glitch',
    surface: ['glitch', 'glitch music', 'glitchy', 'glitch effect'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'aesthetic', 'digital'],
    meaning: 'electronic aesthetic using digital artifacts and errors',
    examples: ['glitch effects', 'add glitchy texture']
  },
  {
    id: 'lex:noun:synthwave',
    surface: ['synthwave', 'synth wave', 'retrowave', '80s synth'],
    category: 'noun',
    semanticTags: ['genre', 'electronic', 'retro', '1980s'],
    meaning: 'electronic music evoking 1980s synthesizer aesthetics',
    examples: ['synthwave feel', '80s synthwave style']
  },

  // Electronic production techniques
  {
    id: 'lex:noun:four_on_floor',
    surface: ['four on the floor', '4-on-the-floor', 'four to the floor', 'disco beat'],
    category: 'noun',
    semanticTags: ['rhythm', 'electronic', 'kick', 'pattern'],
    meaning: 'steady kick drum on every quarter note',
    examples: ['four on the floor kick', 'use 4-on-floor beat']
  },
  {
    id: 'lex:noun:drop',
    surface: ['drop', 'the drop', 'bass drop', 'beat drop'],
    category: 'noun',
    semanticTags: ['form', 'electronic', 'climax', 'energy'],
    meaning: 'climactic moment when bass and beat hit after build-up',
    examples: ['build to the drop', 'add drop section']
  },
  {
    id: 'lex:noun:build_up',
    surface: ['build-up', 'build up', 'buildup', 'riser'],
    category: 'noun',
    semanticTags: ['form', 'electronic', 'tension', 'transition'],
    meaning: 'section building tension before drop',
    examples: ['add build-up', 'extend the build']
  },
  {
    id: 'lex:noun:breakdown',
    surface: ['breakdown', 'break down', 'break', 'stripped section'],
    category: 'noun',
    semanticTags: ['form', 'electronic', 'contrast', 'sparse'],
    meaning: 'stripped-down section providing contrast',
    examples: ['add breakdown', 'breakdown section']
  },
  {
    id: 'lex:noun:riser',
    surface: ['riser', 'build riser', 'tension riser', 'sweep up'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'tension', 'effect'],
    meaning: 'sound effect that builds tension through pitch rise',
    examples: ['add riser', 'use tension riser']
  },
  {
    id: 'lex:noun:impact',
    surface: ['impact', 'hit', 'impact sound', 'downbeat'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'punctuation', 'effect'],
    meaning: 'short percussive sound marking important moment',
    examples: ['add impact', 'use impact hit']
  },
  {
    id: 'lex:noun:wobble',
    surface: ['wobble', 'wobble bass', 'wub', 'LFO bass'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'bass', 'dubstep'],
    meaning: 'bass sound with heavy LFO modulation',
    examples: ['add wobble bass', 'faster wobble']
  },
  {
    id: 'lex:noun:808',
    surface: ['808', 'TR-808', 'Roland 808', '808 kick'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'drum', 'classic'],
    meaning: 'classic Roland TR-808 drum machine sounds',
    examples: ['use 808 bass', 'add 808 kick']
  },
  {
    id: 'lex:noun:909',
    surface: ['909', 'TR-909', 'Roland 909', '909 hi-hats'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'drum', 'classic'],
    meaning: 'classic Roland TR-909 drum machine sounds',
    examples: ['use 909 sounds', 'add 909 hi-hats']
  },
  {
    id: 'lex:noun:arpeggio',
    surface: ['arpeggio', 'arpeggiated', 'arp', 'broken chord'],
    category: 'noun',
    semanticTags: ['technique', 'electronic', 'melody', 'pattern'],
    meaning: 'chord played as sequence of individual notes',
    examples: ['add arpeggio', 'arpeggiated synth']
  },
  {
    id: 'lex:verb:arpeggiate',
    surface: ['arpeggiate', 'arpeggiated', 'arpeggiate'],
    category: 'verb',
    semanticTags: ['technique', 'electronic', 'melody', 'pattern'],
    meaning: 'play chord as sequence of notes',
    examples: ['arpeggiate the chord', 'arpeggiated pattern']
  },
  {
    id: 'lex:noun:step_sequencer',
    surface: ['step sequencer', 'step seq', 'sequencer', 'pattern'],
    category: 'noun',
    semanticTags: ['tool', 'electronic', 'composition', 'pattern'],
    meaning: 'tool for creating rhythmic patterns by steps',
    examples: ['use step sequencer', 'program pattern']
  },
  {
    id: 'lex:noun:gate',
    surface: ['gate', 'gating', 'noise gate', 'gate effect'],
    category: 'noun',
    semanticTags: ['effect', 'electronic', 'dynamics', 'rhythmic'],
    meaning: 'effect silencing signal below threshold',
    examples: ['add gate', 'rhythmic gating']
  },
  {
    id: 'lex:noun:transient',
    surface: ['transient', 'attack transient', 'initial transient', 'transient shaping'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'dynamics', 'character'],
    meaning: 'initial attack portion of sound',
    examples: ['enhance transients', 'shape the transient']
  },
  {
    id: 'lex:noun:tail',
    surface: ['tail', 'reverb tail', 'decay tail', 'release tail'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'time', 'space'],
    meaning: 'decaying portion at end of sound',
    examples: ['longer reverb tail', 'trim the tail']
  },
  {
    id: 'lex:noun:white_noise',
    surface: ['white noise', 'noise', 'hiss', 'static'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'texture', 'source'],
    meaning: 'random signal with equal energy at all frequencies',
    examples: ['add white noise', 'noise sweep']
  },
  {
    id: 'lex:noun:pink_noise',
    surface: ['pink noise', '1/f noise', 'pink noise'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'texture', 'source'],
    meaning: 'random signal with equal energy per octave',
    examples: ['use pink noise', 'pink noise layer']
  },
  {
    id: 'lex:noun:sub_bass',
    surface: ['sub bass', 'sub-bass', 'sub', 'subbass'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'bass', 'low-frequency'],
    meaning: 'very low frequency bass below ~60Hz',
    examples: ['add sub bass', 'boost the sub']
  },
  {
    id: 'lex:noun:supersaw',
    surface: ['supersaw', 'super saw', 'thick saw', 'unison saw'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'synth', 'trance'],
    meaning: 'thick saw wave from multiple detuned oscillators',
    examples: ['supersaw lead', 'use super saw']
  },
  {
    id: 'lex:noun:pluck',
    surface: ['pluck', 'plucked synth', 'pluck sound', 'plucky'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'synth', 'percussive'],
    meaning: 'synth sound with fast attack and decay',
    examples: ['pluck synth', 'add pluck sound']
  },
  {
    id: 'lex:noun:pad',
    surface: ['pad', 'synth pad', 'pad sound', 'atmospheric pad'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'synth', 'sustained'],
    meaning: 'sustained atmospheric synthesizer sound',
    examples: ['add pad', 'lush synth pad']
  },
  {
    id: 'lex:noun:lead',
    surface: ['lead', 'lead synth', 'synth lead', 'lead sound'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'synth', 'melody'],
    meaning: 'prominent melodic synthesizer sound',
    examples: ['lead synth', 'add lead melody']
  },
  {
    id: 'lex:noun:stab',
    surface: ['stab', 'chord stab', 'stab sound', 'hit'],
    category: 'noun',
    semanticTags: ['sound', 'electronic', 'chord', 'punctuation'],
    meaning: 'short punctuating chord sound',
    examples: ['add stabs', 'chord stab hits']
  }
];

// Total: 200+ lexeme entries for Batch 71

export default JAZZ_HARMONY_LEXEMES;
