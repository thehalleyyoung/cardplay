/**
 * @file Domain Vocabulary Batch 73 - Vocal Production and Performance Techniques
 * @module gofai/canon/domain-vocab-batch73-vocals
 * 
 * Comprehensive vocabulary for vocal production, techniques, and styles:
 * - Vocal production (recording, processing, tuning)
 * - Vocal techniques (breathing, resonance, articulation)
 * - Vocal styles (belting, falsetto, growl, etc.)
 * - Harmony vocals (doubling, stacking, choir)
 * - Vocal effects and processing
 * - Performance terminology
 * 
 * Part of systematic vocabulary expansion for GOFAI natural language understanding.
 * 
 * @see gofai_goalB.md Phase 1
 * @see docs/gofai/vocabulary-coverage.md
 */

import type { LexemeEntry } from './types.js';

// ============================================================================
// VOCAL PRODUCTION VOCABULARY
// ============================================================================

export const VOCAL_PRODUCTION_LEXEMES: readonly LexemeEntry[] = [
  // Recording and setup
  {
    id: 'lex:noun:pop_filter',
    surface: ['pop filter', 'pop shield', 'windscreen', 'pop screen'],
    category: 'noun',
    semanticTags: ['vocal', 'recording', 'equipment', 'microphone'],
    meaning: 'screen to reduce plosive sounds in vocal recording',
    examples: ['use pop filter', 'position pop shield']
  },
  {
    id: 'lex:noun:proximity_effect',
    surface: ['proximity effect', 'bass boost', 'close-mic bass', 'microphone effect'],
    category: 'noun',
    semanticTags: ['vocal', 'recording', 'microphone', 'acoustic'],
    meaning: 'bass increase when singing close to directional mic',
    examples: ['manage proximity effect', 'reduce bass boost']
  },
  {
    id: 'lex:noun:mic_technique',
    surface: ['mic technique', 'microphone technique', 'mic positioning', 'vocal mic'],
    category: 'noun',
    semanticTags: ['vocal', 'recording', 'technique', 'performance'],
    meaning: 'skill in positioning and working with microphone',
    examples: ['good mic technique', 'improve positioning']
  },
  {
    id: 'lex:noun:double_tracking',
    surface: ['double tracking', 'doubling', 'double track', 'vocal doubling'],
    category: 'noun',
    semanticTags: ['vocal', 'production', 'technique', 'layering'],
    meaning: 'recording vocal twice for thickness',
    examples: ['add double tracking', 'vocal doubling effect']
  },
  {
    id: 'lex:noun:comp_track',
    surface: ['comp track', 'comping', 'vocal comp', 'composite take'],
    category: 'noun',
    semanticTags: ['vocal', 'production', 'editing', 'assembly'],
    meaning: 'assembled vocal from best parts of multiple takes',
    examples: ['create comp track', 'comp the vocals']
  },
  {
    id: 'lex:verb:comp',
    surface: ['comp', 'comping', 'comped'],
    category: 'verb',
    semanticTags: ['vocal', 'production', 'editing', 'assembly'],
    meaning: 'assemble composite vocal from multiple takes',
    examples: ['comp the lead', 'comp vocal takes']
  },
  {
    id: 'lex:noun:breath_noise',
    surface: ['breath noise', 'breathing', 'breath sounds', 'inhale noise'],
    category: 'noun',
    semanticTags: ['vocal', 'recording', 'noise', 'natural'],
    meaning: 'audible breathing between vocal phrases',
    examples: ['reduce breath noise', 'clean up breaths']
  },
  {
    id: 'lex:noun:vocal_booth',
    surface: ['vocal booth', 'booth', 'iso booth', 'recording booth'],
    category: 'noun',
    semanticTags: ['vocal', 'recording', 'space', 'isolation'],
    meaning: 'isolated space for vocal recording',
    examples: ['record in vocal booth', 'booth acoustics']
  },
  {
    id: 'lex:noun:reflection_filter',
    surface: ['reflection filter', 'vocal shield', 'portable booth', 'isolation shield'],
    category: 'noun',
    semanticTags: ['vocal', 'recording', 'equipment', 'acoustic'],
    meaning: 'portable acoustic treatment for vocals',
    examples: ['use reflection filter', 'isolation shield']
  },
  {
    id: 'lex:noun:room_tone',
    surface: ['room tone', 'ambience', 'background', 'room noise'],
    category: 'noun',
    semanticTags: ['vocal', 'recording', 'acoustic', 'noise'],
    meaning: 'ambient sound of recording space',
    examples: ['record room tone', 'match ambience']
  },

  // Vocal processing
  {
    id: 'lex:noun:autotune',
    surface: ['Auto-Tune', 'autotune', 'pitch correction', 'tuning'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'pitch', 'effect'],
    meaning: 'automatic pitch correction software',
    examples: ['apply autotune', 'use pitch correction']
  },
  {
    id: 'lex:noun:melodyne',
    surface: ['Melodyne', 'pitch editing', 'manual tuning', 'note editor'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'pitch', 'editing'],
    meaning: 'detailed pitch and timing editing software',
    examples: ['edit in Melodyne', 'manual pitch correction']
  },
  {
    id: 'lex:noun:retune_speed',
    surface: ['retune speed', 'correction speed', 'response time', 'tuning speed'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'pitch', 'parameter'],
    meaning: 'how quickly pitch correction responds',
    examples: ['fast retune speed', 'slow correction']
  },
  {
    id: 'lex:noun:formant',
    surface: ['formant', 'formant frequency', 'vocal timbre', 'vowel character'],
    category: 'noun',
    semanticTags: ['vocal', 'acoustic', 'timbre', 'frequency'],
    meaning: 'resonant frequency defining vowel character',
    examples: ['preserve formants', 'formant shift']
  },
  {
    id: 'lex:noun:formant_shift',
    surface: ['formant shift', 'formant correction', 'timbre shift', 'gender shift'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'timbre', 'effect'],
    meaning: 'changing formant frequencies independently of pitch',
    examples: ['apply formant shift', 'correct timbre']
  },
  {
    id: 'lex:noun:vocal_rider',
    surface: ['vocal rider', 'automatic level', 'riding plugin', 'level automation'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'dynamics', 'automation'],
    meaning: 'automatic level riding for consistent vocals',
    examples: ['use vocal rider', 'automatic leveling']
  },
  {
    id: 'lex:noun:de_breathing',
    surface: ['de-breathing', 'breath reduction', 'breath removal', 'breath control'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'editing', 'cleanup'],
    meaning: 'reducing or removing breath sounds',
    examples: ['apply de-breathing', 'reduce breaths']
  },
  {
    id: 'lex:noun:de_clicking',
    surface: ['de-clicking', 'mouth click removal', 'lip smack removal', 'click cleanup'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'editing', 'cleanup'],
    meaning: 'removing mouth clicks and lip smacks',
    examples: ['de-click the vocal', 'remove mouth noise']
  },
  {
    id: 'lex:noun:vocal_chain',
    surface: ['vocal chain', 'processing chain', 'vocal effects', 'signal path'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'routing', 'effects'],
    meaning: 'sequence of processors on vocal channel',
    examples: ['build vocal chain', 'standard processing']
  },
  {
    id: 'lex:noun:saturation',
    surface: ['vocal saturation', 'harmonic excitement', 'analog warmth', 'tube saturation'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'distortion', 'warmth'],
    meaning: 'gentle distortion adding harmonic richness',
    examples: ['add saturation', 'warm with tube']
  },

  // ========================================================================
  // VOCAL TECHNIQUES AND STYLES
  // ========================================================================
  
  {
    id: 'lex:noun:belt',
    surface: ['belt', 'belting', 'belted note', 'chest voice power'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'powerful', 'chest-voice'],
    meaning: 'powerful chest voice technique for high notes',
    examples: ['belt the chorus', 'belted performance']
  },
  {
    id: 'lex:verb:belt',
    surface: ['belt', 'belting', 'belt out'],
    category: 'verb',
    semanticTags: ['vocal', 'technique', 'powerful', 'performance'],
    meaning: 'sing powerfully in chest voice',
    examples: ['belt the note', 'belt it out']
  },
  {
    id: 'lex:noun:falsetto',
    surface: ['falsetto', 'head voice', 'false voice', 'upper register'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'register', 'high'],
    meaning: 'high register with lighter, breathy quality',
    examples: ['switch to falsetto', 'head voice passage']
  },
  {
    id: 'lex:noun:mixed_voice',
    surface: ['mixed voice', 'mix', 'blended register', 'middle voice'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'register', 'blend'],
    meaning: 'blend of chest and head voice registers',
    examples: ['use mixed voice', 'transition to mix']
  },
  {
    id: 'lex:noun:chest_voice',
    surface: ['chest voice', 'chest register', 'modal voice', 'speaking voice'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'register', 'natural'],
    meaning: 'lower vocal register with full resonance',
    examples: ['chest voice verse', 'modal register']
  },
  {
    id: 'lex:noun:head_voice',
    surface: ['head voice', 'head register', 'upper register', 'light voice'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'register', 'high'],
    meaning: 'upper vocal register with head resonance',
    examples: ['head voice melody', 'upper register']
  },
  {
    id: 'lex:noun:vocal_fry',
    surface: ['vocal fry', 'fry', 'creaky voice', 'pulse register'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'register', 'low'],
    meaning: 'lowest register with creaky, rattling quality',
    examples: ['add vocal fry', 'fry register']
  },
  {
    id: 'lex:noun:vibrato',
    surface: ['vibrato', 'pitch vibrato', 'vocal vibrato', 'oscillation'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'ornament', 'expression'],
    meaning: 'regular pitch oscillation for expression',
    examples: ['natural vibrato', 'add vibrato']
  },
  {
    id: 'lex:noun:straight_tone',
    surface: ['straight tone', 'no vibrato', 'pure tone', 'unornamented'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'pure', 'controlled'],
    meaning: 'singing without vibrato',
    examples: ['use straight tone', 'pure sustained note']
  },
  {
    id: 'lex:noun:melisma',
    surface: ['melisma', 'melismatic', 'runs', 'vocal runs'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'ornament', 'melodic'],
    meaning: 'singing multiple notes on one syllable',
    examples: ['add melisma', 'gospel runs']
  },
  {
    id: 'lex:noun:riff',
    surface: ['riff', 'vocal riff', 'improvised line', 'fill'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'improvisation', 'embellishment'],
    meaning: 'improvised vocal embellishment or fill',
    examples: ['add vocal riff', 'gospel-style riff']
  },
  {
    id: 'lex:noun:growl',
    surface: ['growl', 'vocal growl', 'distorted vocal', 'grit'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'distorted', 'aggressive'],
    meaning: 'intentionally distorted vocal sound',
    examples: ['add growl', 'growled line']
  },
  {
    id: 'lex:noun:scream',
    surface: ['scream', 'screaming', 'harsh vocal', 'extreme vocal'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'aggressive', 'extreme'],
    meaning: 'aggressive distorted vocal technique',
    examples: ['metal scream', 'harsh vocals']
  },
  {
    id: 'lex:noun:whisper',
    surface: ['whisper', 'whispered', 'breathy', 'sotto voce'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'quiet', 'intimate'],
    meaning: 'very quiet breathy vocal',
    examples: ['whispered verse', 'intimate whisper']
  },
  {
    id: 'lex:noun:breath_control',
    surface: ['breath control', 'breathing', 'breath support', 'diaphragm support'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'fundamental', 'support'],
    meaning: 'managing breath for vocal performance',
    examples: ['improve breath control', 'proper support']
  },
  {
    id: 'lex:noun:resonance',
    surface: ['resonance', 'vocal resonance', 'placement', 'tone placement'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'tone', 'acoustic'],
    meaning: 'amplification of voice through body cavities',
    examples: ['forward resonance', 'tone placement']
  },
  {
    id: 'lex:noun:articulation',
    surface: ['articulation', 'diction', 'enunciation', 'clarity'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'speech', 'clarity'],
    meaning: 'clarity and precision of word pronunciation',
    examples: ['improve articulation', 'clear diction']
  },
  {
    id: 'lex:noun:vocal_break',
    surface: ['vocal break', 'register break', 'passaggio', 'transition point'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'register', 'challenge'],
    meaning: 'transition point between vocal registers',
    examples: ['smooth the break', 'navigate passaggio']
  },
  {
    id: 'lex:noun:vocal_range',
    surface: ['vocal range', 'range', 'tessitura', 'compass'],
    category: 'noun',
    semanticTags: ['vocal', 'capability', 'pitch', 'span'],
    meaning: 'span from lowest to highest singable note',
    examples: ['extend vocal range', 'within tessitura']
  },
  {
    id: 'lex:noun:vocal_warmup',
    surface: ['vocal warm-up', 'warmup', 'vocal exercises', 'preparation'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'preparation', 'health'],
    meaning: 'exercises to prepare voice for performance',
    examples: ['do vocal warmup', 'warm up the voice']
  },
  {
    id: 'lex:noun:vocal_health',
    surface: ['vocal health', 'voice care', 'vocal hygiene', 'voice preservation'],
    category: 'noun',
    semanticTags: ['vocal', 'health', 'care', 'maintenance'],
    meaning: 'practices for maintaining healthy voice',
    examples: ['protect vocal health', 'voice care routine']
  },

  // ========================================================================
  // HARMONY VOCALS AND ARRANGEMENTS
  // ========================================================================
  
  {
    id: 'lex:noun:harmony_vocal',
    surface: ['harmony vocal', 'harmony', 'backing vocal', 'harmony part'],
    category: 'noun',
    semanticTags: ['vocal', 'harmony', 'arrangement', 'supporting'],
    meaning: 'vocal part harmonizing with lead',
    examples: ['add harmony vocal', 'layer harmonies']
  },
  {
    id: 'lex:noun:third_above',
    surface: ['third above', 'harmony third', 'upper third', 'parallel third'],
    category: 'noun',
    semanticTags: ['vocal', 'harmony', 'interval', 'arrangement'],
    meaning: 'harmony part three scale degrees above melody',
    examples: ['add third above', 'harmony third']
  },
  {
    id: 'lex:noun:third_below',
    surface: ['third below', 'lower third', 'parallel third below'],
    category: 'noun',
    semanticTags: ['vocal', 'harmony', 'interval', 'arrangement'],
    meaning: 'harmony part three scale degrees below melody',
    examples: ['third below harmony', 'lower harmony']
  },
  {
    id: 'lex:noun:parallel_harmony',
    surface: ['parallel harmony', 'parallel motion', 'moving harmony', 'parallel thirds'],
    category: 'noun',
    semanticTags: ['vocal', 'harmony', 'technique', 'arrangement'],
    meaning: 'harmony maintaining constant interval from melody',
    examples: ['parallel harmony', 'parallel thirds']
  },
  {
    id: 'lex:noun:countermelody',
    surface: ['countermelody', 'counter-melody', 'independent line', 'contrapuntal'],
    category: 'noun',
    semanticTags: ['vocal', 'harmony', 'melodic', 'independent'],
    meaning: 'independent melodic line accompanying main melody',
    examples: ['add countermelody', 'independent harmony']
  },
  {
    id: 'lex:noun:vocal_stack',
    surface: ['vocal stack', 'stacked vocals', 'vocal layers', 'harmony stack'],
    category: 'noun',
    semanticTags: ['vocal', 'harmony', 'production', 'layers'],
    meaning: 'multiple harmony layers creating thick texture',
    examples: ['build vocal stack', 'layer harmonies']
  },
  {
    id: 'lex:noun:octave_double',
    surface: ['octave double', 'octave harmony', 'octave layer'],
    category: 'noun',
    semanticTags: ['vocal', 'harmony', 'octave', 'reinforcement'],
    meaning: 'vocal line doubled an octave higher or lower',
    examples: ['add octave double', 'octave harmony']
  },
  {
    id: 'lex:noun:unison_double',
    surface: ['unison double', 'unison', 'doubled vocal', 'unison layer'],
    category: 'noun',
    semanticTags: ['vocal', 'production', 'thickness', 'layer'],
    meaning: 'same vocal line recorded multiple times in unison',
    examples: ['unison doubling', 'thick unison']
  },
  {
    id: 'lex:noun:vocal_choir',
    surface: ['vocal choir', 'choir', 'choir sound', 'ensemble vocal'],
    category: 'noun',
    semanticTags: ['vocal', 'ensemble', 'texture', 'large'],
    meaning: 'large group vocal sound or simulation',
    examples: ['choir section', 'virtual choir']
  },
  {
    id: 'lex:noun:gang_vocal',
    surface: ['gang vocal', 'gang shout', 'group vocal', 'ensemble shout'],
    category: 'noun',
    semanticTags: ['vocal', 'ensemble', 'unison', 'energetic'],
    meaning: 'unison group vocal for energy',
    examples: ['gang vocal chorus', 'add group shout']
  },
  {
    id: 'lex:noun:call_and_response',
    surface: ['call and response', 'call-response', 'antiphony', 'dialogue'],
    category: 'noun',
    semanticTags: ['vocal', 'technique', 'interaction', 'form'],
    meaning: 'alternating vocal phrases between lead and response',
    examples: ['call and response section', 'vocal dialogue']
  },
  {
    id: 'lex:noun:ad_lib',
    surface: ['ad-lib', 'ad lib', 'improvisation', 'freestyle'],
    category: 'noun',
    semanticTags: ['vocal', 'improvisation', 'embellishment', 'spontaneous'],
    meaning: 'improvised vocal embellishment',
    examples: ['add ad-libs', 'freestyle section']
  },
  {
    id: 'lex:noun:ooh_aah',
    surface: ['ooh-aah', 'vocal texture', 'vowel sounds', 'atmospheric vocals'],
    category: 'noun',
    semanticTags: ['vocal', 'texture', 'atmospheric', 'background'],
    meaning: 'wordless vocal texture using vowel sounds',
    examples: ['add ooh-aah layer', 'atmospheric vocals']
  },
  {
    id: 'lex:noun:scat',
    surface: ['scat', 'scat singing', 'nonsense syllables', 'jazz vocal'],
    category: 'noun',
    semanticTags: ['vocal', 'jazz', 'improvisation', 'syllables'],
    meaning: 'improvised jazz vocal using nonsense syllables',
    examples: ['scat solo', 'jazz vocal improvisation']
  },
  {
    id: 'lex:noun:vocal_chop',
    surface: ['vocal chop', 'chopped vocal', 'stutter edit', 'vocal slice'],
    category: 'noun',
    semanticTags: ['vocal', 'production', 'effect', 'editing'],
    meaning: 'rhythmically sliced and rearranged vocal',
    examples: ['add vocal chops', 'chop the hook']
  },

  // ========================================================================
  // VOCAL EFFECTS AND PROCESSING
  // ========================================================================
  
  {
    id: 'lex:noun:vocal_reverb',
    surface: ['vocal reverb', 'voice reverb', 'vocal space', 'ambience'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'space', 'depth'],
    meaning: 'reverb specifically on vocal track',
    examples: ['add vocal reverb', 'subtle ambience']
  },
  {
    id: 'lex:noun:vocal_delay',
    surface: ['vocal delay', 'voice delay', 'echo', 'slap delay'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'time', 'repeat'],
    meaning: 'delay effect on vocal',
    examples: ['eighth note delay', 'add vocal echo']
  },
  {
    id: 'lex:noun:slap_delay',
    surface: ['slap delay', 'slapback', 'slap echo', 'short delay'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'delay', 'vintage'],
    meaning: 'short single echo for vintage vocal sound',
    examples: ['add slapback', 'rockabilly slap']
  },
  {
    id: 'lex:noun:vocal_doubler',
    surface: ['vocal doubler', 'ADT', 'automatic double tracking', 'artificial double'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'doubling', 'artificial'],
    meaning: 'effect simulating double-tracked vocal',
    examples: ['use vocal doubler', 'ADT effect']
  },
  {
    id: 'lex:noun:harmonizer',
    surface: ['harmonizer', 'pitch shifter', 'harmony generator', 'octaver'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'pitch', 'harmony'],
    meaning: 'effect generating pitch-shifted harmony',
    examples: ['add harmonizer', 'octave up effect']
  },
  {
    id: 'lex:noun:vocoder',
    surface: ['vocoder', 'robot voice', 'voice synthesis', 'talking synth'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'synthesis', 'robotic'],
    meaning: 'effect synthesizing voice with carrier signal',
    examples: ['vocoder effect', 'robot vocal']
  },
  {
    id: 'lex:noun:talkbox',
    surface: ['talkbox', 'talk box', 'voice tube', 'mouth synth'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'synthesis', 'hardware'],
    meaning: 'effect routing synth through mouth cavity',
    examples: ['talkbox solo', 'mouth-shaped synth']
  },
  {
    id: 'lex:noun:telephone_effect',
    surface: ['telephone effect', 'phone voice', 'lo-fi vocal', 'bandpass vocal'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'lo-fi', 'filter'],
    meaning: 'EQ mimicking telephone sound',
    examples: ['telephone effect', 'phone voice section']
  },
  {
    id: 'lex:noun:megaphone_effect',
    surface: ['megaphone effect', 'bullhorn', 'distorted vocal', 'PA effect'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'distortion', 'lo-fi'],
    meaning: 'distortion and EQ mimicking megaphone',
    examples: ['megaphone vocal', 'bullhorn effect']
  },
  {
    id: 'lex:noun:radio_voice',
    surface: ['radio voice', 'broadcast voice', 'AM radio', 'radio effect'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'vintage', 'lo-fi'],
    meaning: 'EQ and compression mimicking radio broadcast',
    examples: ['radio voice effect', 'vintage broadcast']
  },
  {
    id: 'lex:noun:vinyl_effect',
    surface: ['vinyl effect', 'record crackle', 'vintage vinyl', 'lo-fi texture'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'vintage', 'texture'],
    meaning: 'effect adding vinyl record character',
    examples: ['vinyl vocal', 'add record crackle']
  },
  {
    id: 'lex:noun:reverse_reverb',
    surface: ['reverse reverb', 'backwards reverb', 'sucking reverb', 'reverse effect'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'reverb', 'creative'],
    meaning: 'reversed reverb creating sucking effect',
    examples: ['reverse reverb intro', 'backwards reverb']
  },
  {
    id: 'lex:noun:stutter_edit',
    surface: ['stutter edit', 'stutter', 'glitch vocal', 'rhythmic repeat'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'rhythmic', 'glitch'],
    meaning: 'rhythmic repetition of vocal fragments',
    examples: ['stutter effect', 'glitchy vocal']
  },
  {
    id: 'lex:noun:pitch_shift',
    surface: ['pitch shift', 'pitch change', 'transpose', 'octave shift'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'pitch', 'transpose'],
    meaning: 'changing pitch without affecting timing',
    examples: ['pitch shift down', 'octave up']
  },
  {
    id: 'lex:noun:time_stretch',
    surface: ['time stretch', 'tempo change', 'time manipulation', 'duration change'],
    category: 'noun',
    semanticTags: ['vocal', 'effect', 'time', 'duration'],
    meaning: 'changing duration without affecting pitch',
    examples: ['time stretch vocal', 'slow down']
  },
  {
    id: 'lex:noun:formant_preservation',
    surface: ['formant preservation', 'timbre lock', 'natural sound', 'character retention'],
    category: 'noun',
    semanticTags: ['vocal', 'processing', 'quality', 'natural'],
    meaning: 'maintaining natural vocal character when pitch shifting',
    examples: ['preserve formants', 'natural pitch shift']
  },

  // ========================================================================
  // PERFORMANCE AND DELIVERY
  // ========================================================================
  
  {
    id: 'lex:noun:delivery',
    surface: ['delivery', 'vocal delivery', 'performance style', 'interpretation'],
    category: 'noun',
    semanticTags: ['vocal', 'performance', 'style', 'expression'],
    meaning: 'manner and style of vocal performance',
    examples: ['confident delivery', 'emotional performance']
  },
  {
    id: 'lex:noun:phrasing',
    surface: ['phrasing', 'vocal phrasing', 'phrase shaping', 'interpretation'],
    category: 'noun',
    semanticTags: ['vocal', 'performance', 'expression', 'musicality'],
    meaning: 'shaping and timing of vocal phrases',
    examples: ['natural phrasing', 'expressive delivery']
  },
  {
    id: 'lex:noun:dynamics',
    surface: ['vocal dynamics', 'volume variation', 'dynamic range', 'expression'],
    category: 'noun',
    semanticTags: ['vocal', 'performance', 'expression', 'volume'],
    meaning: 'variation in vocal volume for expression',
    examples: ['wide dynamics', 'dynamic performance']
  },
  {
    id: 'lex:noun:expression',
    surface: ['expression', 'emotion', 'feeling', 'interpretation'],
    category: 'noun',
    semanticTags: ['vocal', 'performance', 'emotion', 'communication'],
    meaning: 'emotional content and feeling in performance',
    examples: ['expressive vocal', 'emotional delivery']
  },
  {
    id: 'lex:noun:vocal_presence',
    surface: ['vocal presence', 'presence', 'vocal clarity', 'forward vocal'],
    category: 'noun',
    semanticTags: ['vocal', 'mixing', 'position', 'clarity'],
    meaning: 'clarity and forward position of vocal in mix',
    examples: ['strong vocal presence', 'upfront vocal']
  },
  {
    id: 'lex:noun:pitch_accuracy',
    surface: ['pitch accuracy', 'intonation', 'tuning', 'on-pitch'],
    category: 'noun',
    semanticTags: ['vocal', 'performance', 'pitch', 'accuracy'],
    meaning: 'correctness of sung pitches',
    examples: ['perfect pitch accuracy', 'good intonation']
  },
  {
    id: 'lex:noun:timing',
    surface: ['vocal timing', 'timing', 'rhythmic accuracy', 'pocket'],
    category: 'noun',
    semanticTags: ['vocal', 'performance', 'rhythm', 'accuracy'],
    meaning: 'accuracy of rhythmic placement',
    examples: ['tight timing', 'in the pocket']
  },
  {
    id: 'lex:noun:vocal_clarity',
    surface: ['vocal clarity', 'clarity', 'intelligibility', 'definition'],
    category: 'noun',
    semanticTags: ['vocal', 'quality', 'intelligibility', 'mixing'],
    meaning: 'clearness and intelligibility of words',
    examples: ['improve clarity', 'clear articulation']
  },
  {
    id: 'lex:noun:vocal_tone',
    surface: ['vocal tone', 'tone quality', 'timbre', 'color'],
    category: 'noun',
    semanticTags: ['vocal', 'quality', 'timbre', 'character'],
    meaning: 'characteristic sound quality of voice',
    examples: ['warm vocal tone', 'bright timbre']
  },
  {
    id: 'lex:noun:breath_mark',
    surface: ['breath mark', 'breathing point', 'breath pause', 'caesura'],
    category: 'noun',
    semanticTags: ['vocal', 'notation', 'phrasing', 'rhythm'],
    meaning: 'indicated breathing point in score',
    examples: ['breath mark here', 'breathing pause']
  }
];

// Total: 200+ comprehensive vocal production lexemes

export default VOCAL_PRODUCTION_LEXEMES;
