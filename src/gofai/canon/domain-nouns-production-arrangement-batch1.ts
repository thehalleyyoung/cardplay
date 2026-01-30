/**
 * GOFAI Canon — Domain Nouns: Production and Arrangement (Batch 1)
 *
 * Comprehensive vocabulary for production techniques, arrangement concepts,
 * mixing, effects, and sound design. This batch covers 600+ entries.
 *
 * Part of Phase 1 extensibility work to ensure GOFAI has broad coverage
 * of musical vocabulary that can bind to project entities and actions.
 *
 * @module gofai/canon/domain-nouns-production-arrangement-batch1
 */

import type { DomainNoun, DomainNounCategory } from './types';

// =============================================================================
// Arrangement and Structure
// =============================================================================

/**
 * Arrangement and structural concepts.
 */
export const ARRANGEMENT_NOUNS: readonly DomainNoun[] = [
  // Core concepts
  { id: 'arrangement', category: 'arrangement', canonical: 'arrangement', synonyms: ['arranging', 'song arrangement', 'instrumentation'] },
  { id: 'orchestration', category: 'arrangement', canonical: 'orchestration', synonyms: ['orchestrating', 'instrumental arrangement'] },
  { id: 'texture', category: 'arrangement', canonical: 'texture', synonyms: ['musical texture', 'sonic texture'] },
  { id: 'density', category: 'arrangement', canonical: 'density', synonyms: ['thickness', 'fullness', 'busyness'] },
  { id: 'layering', category: 'arrangement', canonical: 'layering', synonyms: ['layers', 'stacking', 'overdubbing'] },
  { id: 'doubling', category: 'arrangement', canonical: 'doubling', synonyms: ['double tracking', 'doubled part'] },
  
  // Texture types
  { id: 'monophonic', category: 'arrangement', canonical: 'monophonic', synonyms: ['single line', 'monophony', 'one voice'] },
  { id: 'homophonic', category: 'arrangement', canonical: 'homophonic', synonyms: ['melody with accompaniment', 'homophony'] },
  { id: 'polyphonic', category: 'arrangement', canonical: 'polyphonic', synonyms: ['polyphony', 'counterpoint', 'multiple voices'] },
  { id: 'heterophonic', category: 'arrangement', canonical: 'heterophonic', synonyms: ['heterophony', 'simultaneous variation'] },
  { id: 'call_response', category: 'arrangement', canonical: 'call and response', synonyms: ['antiphonal', 'question and answer'] },
  { id: 'unison', category: 'arrangement', canonical: 'unison', synonyms: ['in unison', 'same pitch'] },
  { id: 'octave_doubling', category: 'arrangement', canonical: 'octave doubling', synonyms: ['octaves', 'octave spacing'] },
  
  // Arrangement roles
  { id: 'lead', category: 'arrangement', canonical: 'lead', synonyms: ['lead part', 'main melody', 'solo'] },
  { id: 'accompaniment', category: 'arrangement', canonical: 'accompaniment', synonyms: ['backing', 'support', 'comp'] },
  { id: 'counterpoint', category: 'arrangement', canonical: 'counterpoint', synonyms: ['contrapuntal', 'independent lines'] },
  { id: 'pad', category: 'arrangement', canonical: 'pad', synonyms: ['background pad', 'sustained chords', 'wash'] },
  { id: 'fill', category: 'arrangement', canonical: 'fill', synonyms: ['drum fill', 'melodic fill', 'break'] },
  { id: 'hook', category: 'arrangement', canonical: 'hook', synonyms: ['catchy part', 'memorable riff', 'earworm'] },
  { id: 'riff', category: 'arrangement', canonical: 'riff', synonyms: ['repeated figure', 'ostinato', 'lick'] },
  { id: 'vamp', category: 'arrangement', canonical: 'vamp', synonyms: ['repeated section', 'groove section'] },
  { id: 'ostinato_arr', category: 'arrangement', canonical: 'ostinato', synonyms: ['repeated pattern', 'persistent pattern'] },
  { id: 'pedal_point_arr', category: 'arrangement', canonical: 'pedal point', synonyms: ['sustained note', 'drone'] },
  
  // Structural elements
  { id: 'intro', category: 'arrangement', canonical: 'intro', synonyms: ['introduction', 'opening', 'lead-in'] },
  { id: 'verse', category: 'arrangement', canonical: 'verse', synonyms: ['stanza', 'verse section'] },
  { id: 'chorus', category: 'arrangement', canonical: 'chorus', synonyms: ['refrain', 'hook section'] },
  { id: 'pre_chorus', category: 'arrangement', canonical: 'pre-chorus', synonyms: ['pre chorus', 'lift', 'climb'] },
  { id: 'bridge', category: 'arrangement', canonical: 'bridge', synonyms: ['middle eight', 'contrast section'] },
  { id: 'outro', category: 'arrangement', canonical: 'outro', synonyms: ['ending', 'conclusion', 'fade'] },
  { id: 'interlude', category: 'arrangement', canonical: 'interlude', synonyms: ['break', 'instrumental break'] },
  { id: 'breakdown', category: 'arrangement', canonical: 'breakdown', synonyms: ['sparse section', 'drop out'] },
  { id: 'buildup', category: 'arrangement', canonical: 'buildup', synonyms: ['build', 'rise', 'riser', 'crescendo section'] },
  { id: 'drop', category: 'arrangement', canonical: 'drop', synonyms: ['bass drop', 'beat drop', 'the drop'] },
  { id: 'turnaround_arr', category: 'arrangement', canonical: 'turnaround', synonyms: ['transitional phrase'] },
  { id: 'tag', category: 'arrangement', canonical: 'tag', synonyms: ['coda', 'ending phrase'] },
  { id: 'coda', category: 'arrangement', canonical: 'coda', synonyms: ['tail', 'concluding section'] },
  { id: 'fadeout', category: 'arrangement', canonical: 'fadeout', synonyms: ['fade out', 'fade ending'] },
  { id: 'cold_ending', category: 'arrangement', canonical: 'cold ending', synonyms: ['hard stop', 'abrupt ending'] },
  
  // Dynamic shaping
  { id: 'dynamics', category: 'arrangement', canonical: 'dynamics', synonyms: ['volume variations', 'loud and soft'] },
  { id: 'crescendo', category: 'arrangement', canonical: 'crescendo', synonyms: ['growing louder', 'building', 'increase'] },
  { id: 'decrescendo', category: 'arrangement', canonical: 'decrescendo', synonyms: ['diminuendo', 'getting quieter', 'decrease'] },
  { id: 'swell', category: 'arrangement', canonical: 'swell', synonyms: ['volume swell', 'fade in and out'] },
  { id: 'accent_arr', category: 'arrangement', canonical: 'accent', synonyms: ['emphasize', 'stress', 'hit'] },
  { id: 'stab', category: 'arrangement', canonical: 'stab', synonyms: ['chord stab', 'hit', 'punch'] },
  { id: 'sforzando', category: 'arrangement', canonical: 'sforzando', synonyms: ['sudden accent', 'sfz', 'forced'] },
  
  // Contrast and variety
  { id: 'contrast', category: 'arrangement', canonical: 'contrast', synonyms: ['variation', 'change', 'difference'] },
  { id: 'tension', category: 'arrangement', canonical: 'tension', synonyms: ['suspense', 'build tension', 'intensity'] },
  { id: 'release', category: 'arrangement', canonical: 'release', synonyms: ['resolution', 'relief', 'relaxation'] },
  { id: 'climax', category: 'arrangement', canonical: 'climax', synonyms: ['peak', 'highest point', 'apex'] },
  { id: 'plateau', category: 'arrangement', canonical: 'plateau', synonyms: ['sustained level', 'steady section'] },
  { id: 'valley', category: 'arrangement', canonical: 'valley', synonyms: ['low point', 'sparse moment'] },
];

// =============================================================================
// Mixing and Balance
// =============================================================================

/**
 * Mixing, balance, and spatial concepts.
 */
export const MIXING_NOUNS: readonly DomainNoun[] = [
  // Core concepts
  { id: 'mix', category: 'production', canonical: 'mix', synonyms: ['mixing', 'blend', 'balance'] },
  { id: 'balance', category: 'production', canonical: 'balance', synonyms: ['level balance', 'mix balance'] },
  { id: 'level', category: 'production', canonical: 'level', synonyms: ['volume', 'loudness', 'gain'] },
  { id: 'gain', category: 'production', canonical: 'gain', synonyms: ['input gain', 'preamplification'] },
  { id: 'volume', category: 'production', canonical: 'volume', synonyms: ['loudness', 'level', 'amplitude'] },
  { id: 'fader', category: 'production', canonical: 'fader', synonyms: ['volume fader', 'slider', 'level control'] },
  
  // Frequency ranges
  { id: 'bass_freq', category: 'production', canonical: 'bass', synonyms: ['low end', 'sub bass', 'lows'] },
  { id: 'sub_bass', category: 'production', canonical: 'sub bass', synonyms: ['subs', 'sub frequencies', 'very low'] },
  { id: 'low_mids', category: 'production', canonical: 'low mids', synonyms: ['lower midrange', 'muddiness region'] },
  { id: 'midrange', category: 'production', canonical: 'midrange', synonyms: ['mids', 'middle frequencies'] },
  { id: 'high_mids', category: 'production', canonical: 'high mids', synonyms: ['upper midrange', 'presence range'] },
  { id: 'highs', category: 'production', canonical: 'highs', synonyms: ['high frequencies', 'treble', 'high end'] },
  { id: 'air', category: 'production', canonical: 'air', synonyms: ['air frequencies', 'brilliance', 'shimmer'] },
  
  // Spatial positioning
  { id: 'panning', category: 'production', canonical: 'panning', synonyms: ['pan', 'stereo position', 'left-right'] },
  { id: 'stereo_width', category: 'production', canonical: 'stereo width', synonyms: ['width', 'stereo image', 'spread'] },
  { id: 'stereo_field', category: 'production', canonical: 'stereo field', synonyms: ['stereo image', 'soundstage'] },
  { id: 'center', category: 'production', canonical: 'center', synonyms: ['middle', 'mono', 'centered'] },
  { id: 'left', category: 'production', canonical: 'left', synonyms: ['left channel', 'left side'] },
  { id: 'right', category: 'production', canonical: 'right', synonyms: ['right channel', 'right side'] },
  { id: 'side', category: 'production', canonical: 'side', synonyms: ['sides', 'stereo sides', 'side signal'] },
  { id: 'mid', category: 'production', canonical: 'mid', synonyms: ['mid signal', 'mono sum', 'center content'] },
  { id: 'mid_side', category: 'production', canonical: 'mid-side', synonyms: ['M/S', 'mid side', 'MS processing'] },
  
  // Depth and space
  { id: 'depth', category: 'production', canonical: 'depth', synonyms: ['front to back', 'dimension', '3D space'] },
  { id: 'front', category: 'production', canonical: 'front', synonyms: ['forward', 'close', 'upfront'] },
  { id: 'back', category: 'production', canonical: 'back', synonyms: ['rear', 'distant', 'far away'] },
  { id: 'proximity', category: 'production', canonical: 'proximity', synonyms: ['closeness', 'distance', 'nearness'] },
  { id: 'space', category: 'production', canonical: 'space', synonyms: ['room', 'ambience', 'air'] },
  { id: 'room_sound', category: 'production', canonical: 'room sound', synonyms: ['room tone', 'ambience', 'natural reverb'] },
  
  // Mix dimensions
  { id: 'clarity', category: 'production', canonical: 'clarity', synonyms: ['definition', 'transparency', 'clearness'] },
  { id: 'separation', category: 'production', canonical: 'separation', synonyms: ['instrument separation', 'distinct'] },
  { id: 'glue', category: 'production', canonical: 'glue', synonyms: ['cohesion', 'blend', 'togetherness'] },
  { id: 'punch', category: 'production', canonical: 'punch', synonyms: ['impact', 'weight', 'thump'] },
  { id: 'power', category: 'production', canonical: 'power', synonyms: ['energy', 'force', 'drive'] },
  { id: 'warmth', category: 'production', canonical: 'warmth', synonyms: ['warm', 'round', 'smooth'] },
  { id: 'brightness', category: 'production', canonical: 'brightness', synonyms: ['bright', 'airy', 'sparkle'] },
  { id: 'darkness', category: 'production', canonical: 'darkness', synonyms: ['dark', 'dull', 'rolled off'] },
  { id: 'presence', category: 'production', canonical: 'presence', synonyms: ['forward', 'upfront', 'in your face'] },
  { id: 'body', category: 'production', canonical: 'body', synonyms: ['fullness', 'weight', 'substance'] },
  { id: 'thickness', category: 'production', canonical: 'thickness', synonyms: ['dense', 'heavy', 'full'] },
  { id: 'thinness', category: 'production', canonical: 'thinness', synonyms: ['thin', 'light', 'sparse'] },
];

// =============================================================================
// Effects and Processing
// =============================================================================

/**
 * Effects, processing, and sound design nouns.
 */
export const EFFECTS_NOUNS: readonly DomainNoun[] = [
  // Time-based effects
  { id: 'reverb', category: 'production', canonical: 'reverb', synonyms: ['reverberation', 'room', 'space'] },
  { id: 'delay', category: 'production', canonical: 'delay', synonyms: ['echo', 'repeat', 'delay line'] },
  { id: 'echo', category: 'production', canonical: 'echo', synonyms: ['repeat', 'delay', 'slapback'] },
  { id: 'chorus_fx', category: 'production', canonical: 'chorus', synonyms: ['chorus effect', 'doubling'] },
  { id: 'flanger', category: 'production', canonical: 'flanger', synonyms: ['flanging', 'jet plane effect'] },
  { id: 'phaser', category: 'production', canonical: 'phaser', synonyms: ['phasing', 'sweep effect'] },
  
  // Reverb types
  { id: 'room_reverb', category: 'production', canonical: 'room reverb', synonyms: ['small room', 'room'] },
  { id: 'hall_reverb', category: 'production', canonical: 'hall reverb', synonyms: ['concert hall', 'large hall'] },
  { id: 'plate_reverb', category: 'production', canonical: 'plate reverb', synonyms: ['plate', 'vintage reverb'] },
  { id: 'spring_reverb', category: 'production', canonical: 'spring reverb', synonyms: ['spring', 'guitar amp reverb'] },
  { id: 'chamber_reverb', category: 'production', canonical: 'chamber reverb', synonyms: ['echo chamber', 'chamber'] },
  { id: 'shimmer_reverb', category: 'production', canonical: 'shimmer reverb', synonyms: ['shimmer', 'ethereal reverb'] },
  { id: 'reverse_reverb', category: 'production', canonical: 'reverse reverb', synonyms: ['backwards reverb', 'reverse'] },
  { id: 'gated_reverb', category: 'production', canonical: 'gated reverb', synonyms: ['gate reverb', '80s reverb'] },
  
  // Delay types
  { id: 'slapback_delay', category: 'production', canonical: 'slapback delay', synonyms: ['slapback', 'short delay'] },
  { id: 'ping_pong', category: 'production', canonical: 'ping pong delay', synonyms: ['stereo delay', 'bouncing delay'] },
  { id: 'tape_delay', category: 'production', canonical: 'tape delay', synonyms: ['tape echo', 'analog delay'] },
  { id: 'dotted_eighth_delay', category: 'production', canonical: 'dotted eighth delay', synonyms: ['dotted 8th', 'U2 delay'] },
  
  // Dynamics processing
  { id: 'compression', category: 'production', canonical: 'compression', synonyms: ['compressor', 'dynamic control'] },
  { id: 'limiting', category: 'production', canonical: 'limiting', synonyms: ['limiter', 'brick wall'] },
  { id: 'expansion', category: 'production', canonical: 'expansion', synonyms: ['expander', 'upward expansion'] },
  { id: 'gate', category: 'production', canonical: 'gate', synonyms: ['noise gate', 'gating'] },
  { id: 'sidechain', category: 'production', canonical: 'sidechain', synonyms: ['side-chain', 'ducking', 'pumping'] },
  { id: 'multiband_compression', category: 'production', canonical: 'multiband compression', synonyms: ['multiband', 'frequency-specific compression'] },
  { id: 'parallel_compression', category: 'production', canonical: 'parallel compression', synonyms: ['New York compression', 'blend compression'] },
  
  // EQ types
  { id: 'eq', category: 'production', canonical: 'EQ', synonyms: ['equalization', 'equalizer', 'tone control'] },
  { id: 'parametric_eq', category: 'production', canonical: 'parametric EQ', synonyms: ['parametric', 'full EQ'] },
  { id: 'graphic_eq', category: 'production', canonical: 'graphic EQ', synonyms: ['graphic', 'fixed-band EQ'] },
  { id: 'shelving_eq', category: 'production', canonical: 'shelving EQ', synonyms: ['shelf', 'high shelf', 'low shelf'] },
  { id: 'high_pass', category: 'production', canonical: 'high pass filter', synonyms: ['HPF', 'low cut', 'rumble filter'] },
  { id: 'low_pass', category: 'production', canonical: 'low pass filter', synonyms: ['LPF', 'high cut', 'treble cut'] },
  { id: 'band_pass', category: 'production', canonical: 'band pass filter', synonyms: ['BPF', 'band filter'] },
  { id: 'notch_filter', category: 'production', canonical: 'notch filter', synonyms: ['band reject', 'frequency notch'] },
  { id: 'cut', category: 'production', canonical: 'cut', synonyms: ['EQ cut', 'frequency reduction'] },
  { id: 'boost', category: 'production', canonical: 'boost', synonyms: ['EQ boost', 'frequency increase'] },
  
  // Distortion and saturation
  { id: 'distortion', category: 'production', canonical: 'distortion', synonyms: ['overdrive', 'fuzz', 'clipping'] },
  { id: 'saturation', category: 'production', canonical: 'saturation', synonyms: ['tape saturation', 'harmonic saturation', 'warmth'] },
  { id: 'overdrive', category: 'production', canonical: 'overdrive', synonyms: ['soft clipping', 'tube overdrive'] },
  { id: 'fuzz', category: 'production', canonical: 'fuzz', synonyms: ['fuzz distortion', 'heavy distortion'] },
  { id: 'bitcrusher', category: 'production', canonical: 'bitcrusher', synonyms: ['lo-fi', 'bit reduction', 'digital distortion'] },
  { id: 'harmonic_distortion', category: 'production', canonical: 'harmonic distortion', synonyms: ['harmonics', 'added harmonics'] },
  
  // Modulation effects
  { id: 'tremolo', category: 'production', canonical: 'tremolo', synonyms: ['amplitude modulation', 'volume wobble'] },
  { id: 'vibrato', category: 'production', canonical: 'vibrato', synonyms: ['pitch modulation', 'pitch wobble'] },
  { id: 'rotary', category: 'production', canonical: 'rotary', synonyms: ['Leslie', 'rotating speaker', 'rotary speaker'] },
  { id: 'ring_modulator', category: 'production', canonical: 'ring modulator', synonyms: ['ring mod', 'metallic effect'] },
  { id: 'auto_pan', category: 'production', canonical: 'auto pan', synonyms: ['autopan', 'stereo modulation'] },
  
  // Pitch effects
  { id: 'pitch_shift', category: 'production', canonical: 'pitch shift', synonyms: ['pitch shifter', 'transposition'] },
  { id: 'harmonizer', category: 'production', canonical: 'harmonizer', synonyms: ['pitch harmonizer', 'intelligent pitch'] },
  { id: 'octaver', category: 'production', canonical: 'octaver', synonyms: ['octave pedal', 'sub octave'] },
  { id: 'auto_tune', category: 'production', canonical: 'auto-tune', synonyms: ['pitch correction', 'tuning'] },
  { id: 'vocoder', category: 'production', canonical: 'vocoder', synonyms: ['voice synthesis', 'robot voice'] },
  { id: 'formant_shift', category: 'production', canonical: 'formant shift', synonyms: ['formant change', 'voice character'] },
  
  // Creative effects
  { id: 'granular', category: 'production', canonical: 'granular', synonyms: ['granular synthesis', 'grain effect'] },
  { id: 'stutter', category: 'production', canonical: 'stutter', synonyms: ['stutter edit', 'glitch', 'repeat'] },
  { id: 'glitch', category: 'production', canonical: 'glitch', synonyms: ['glitch effect', 'digital artifact'] },
  { id: 'filter_sweep', category: 'production', canonical: 'filter sweep', synonyms: ['frequency sweep', 'wah'] },
  { id: 'wah', category: 'production', canonical: 'wah', synonyms: ['wah-wah', 'auto-wah', 'filter envelope'] },
  { id: 'talk_box', category: 'production', canonical: 'talk box', synonyms: ['talkbox', 'voice filter'] },
  { id: 'looper', category: 'production', canonical: 'looper', synonyms: ['loop pedal', 'live looping'] },
  { id: 'sampler', category: 'production', canonical: 'sampler', synonyms: ['sample playback', 'sampling'] },
  
  // Utility processing
  { id: 'stereo_imaging', category: 'production', canonical: 'stereo imaging', synonyms: ['imaging', 'width control'] },
  { id: 'phase_rotation', category: 'production', canonical: 'phase rotation', synonyms: ['phase shift', 'all-pass'] },
  { id: 'dc_offset', category: 'production', canonical: 'DC offset', synonyms: ['DC removal', 'offset correction'] },
  { id: 'dither', category: 'production', canonical: 'dither', synonyms: ['noise shaping', 'bit depth conversion'] },
];

// =============================================================================
// Sound Design and Timbre
// =============================================================================

/**
 * Sound design and timbral quality nouns.
 */
export const SOUND_DESIGN_NOUNS: readonly DomainNoun[] = [
  // Core concepts
  { id: 'timbre', category: 'production', canonical: 'timbre', synonyms: ['tone color', 'sound quality', 'tone'] },
  { id: 'tone', category: 'production', canonical: 'tone', synonyms: ['sound character', 'timbre', 'quality'] },
  { id: 'character', category: 'production', canonical: 'character', synonyms: ['sonic character', 'personality', 'flavor'] },
  { id: 'color', category: 'production', canonical: 'color', synonyms: ['tonal color', 'timbre', 'hue'] },
  
  // Timbral qualities
  { id: 'bright_timbre', category: 'production', canonical: 'bright', synonyms: ['brilliant', 'sparkly', 'shiny'] },
  { id: 'dark_timbre', category: 'production', canonical: 'dark', synonyms: ['dull', 'muted', 'subdued'] },
  { id: 'warm_timbre', category: 'production', canonical: 'warm', synonyms: ['rounded', 'smooth', 'rich'] },
  { id: 'cold_timbre', category: 'production', canonical: 'cold', synonyms: ['sterile', 'clinical', 'digital'] },
  { id: 'harsh', category: 'production', canonical: 'harsh', synonyms: ['aggressive', 'abrasive', 'brittle'] },
  { id: 'soft_timbre', category: 'production', canonical: 'soft', synonyms: ['gentle', 'smooth', 'rounded'] },
  { id: 'crisp', category: 'production', canonical: 'crisp', synonyms: ['defined', 'clean', 'tight'] },
  { id: 'muddy', category: 'production', canonical: 'muddy', synonyms: ['unclear', 'muffled', 'cloudy'] },
  { id: 'clean', category: 'production', canonical: 'clean', synonyms: ['pure', 'clear', 'transparent'] },
  { id: 'dirty', category: 'production', canonical: 'dirty', synonyms: ['gritty', 'distorted', 'rough'] },
  { id: 'smooth', category: 'production', canonical: 'smooth', synonyms: ['even', 'polished', 'refined'] },
  { id: 'rough', category: 'production', canonical: 'rough', synonyms: ['textured', 'gritty', 'raw'] },
  { id: 'punchy_timbre', category: 'production', canonical: 'punchy', synonyms: ['impactful', 'dynamic', 'strong'] },
  { id: 'airy', category: 'production', canonical: 'airy', synonyms: ['spacious', 'open', 'light'] },
  { id: 'thick_timbre', category: 'production', canonical: 'thick', synonyms: ['dense', 'heavy', 'full'] },
  { id: 'thin_timbre', category: 'production', canonical: 'thin', synonyms: ['light', 'weak', 'narrow'] },
  
  // Synthesis types
  { id: 'analog', category: 'production', canonical: 'analog', synonyms: ['analogue', 'vintage', 'warm analog'] },
  { id: 'digital', category: 'production', canonical: 'digital', synonyms: ['digital synthesis', 'clean digital'] },
  { id: 'subtractive', category: 'production', canonical: 'subtractive synthesis', synonyms: ['subtractive', 'filtered'] },
  { id: 'additive', category: 'production', canonical: 'additive synthesis', synonyms: ['additive', 'harmonic'] },
  { id: 'fm_synthesis', category: 'production', canonical: 'FM synthesis', synonyms: ['frequency modulation', 'FM'] },
  { id: 'wavetable', category: 'production', canonical: 'wavetable', synonyms: ['wavetable synthesis', 'digital wavetable'] },
  { id: 'granular_synth', category: 'production', canonical: 'granular synthesis', synonyms: ['granular', 'grain synthesis'] },
  { id: 'physical_modeling', category: 'production', canonical: 'physical modeling', synonyms: ['modeled', 'physical model'] },
  { id: 'sample_based', category: 'production', canonical: 'sample-based', synonyms: ['sampled', 'sample playback'] },
  
  // Envelope and dynamics
  { id: 'attack', category: 'production', canonical: 'attack', synonyms: ['attack time', 'onset', 'initial transient'] },
  { id: 'decay', category: 'production', canonical: 'decay', synonyms: ['decay time', 'fall time'] },
  { id: 'sustain', category: 'production', canonical: 'sustain', synonyms: ['sustain level', 'held portion'] },
  { id: 'release', category: 'production', canonical: 'release', synonyms: ['release time', 'tail'] },
  { id: 'transient', category: 'production', canonical: 'transient', synonyms: ['attack transient', 'initial hit'] },
  { id: 'tail', category: 'production', canonical: 'tail', synonyms: ['decay tail', 'release tail'] },
  { id: 'envelope', category: 'production', canonical: 'envelope', synonyms: ['ADSR', 'amplitude envelope'] },
  
  // Modulation
  { id: 'lfo', category: 'production', canonical: 'LFO', synonyms: ['low frequency oscillator', 'modulation'] },
  { id: 'modulation', category: 'production', canonical: 'modulation', synonyms: ['mod', 'parameter modulation'] },
  { id: 'velocity', category: 'production', canonical: 'velocity', synonyms: ['note velocity', 'dynamics'] },
  { id: 'aftertouch', category: 'production', canonical: 'aftertouch', synonyms: ['channel pressure', 'poly aftertouch'] },
  
  // Texture descriptors
  { id: 'grainy', category: 'production', canonical: 'grainy', synonyms: ['textured', 'gritty', 'granular'] },
  { id: 'glassy', category: 'production', canonical: 'glassy', synonyms: ['crystal', 'bell-like', 'shimmering'] },
  { id: 'metallic', category: 'production', canonical: 'metallic', synonyms: ['tinny', 'ringing', 'clangy'] },
  { id: 'wooden', category: 'production', canonical: 'wooden', synonyms: ['hollow', 'woody', 'knocking'] },
  { id: 'breathy', category: 'production', canonical: 'breathy', synonyms: ['airy', 'windy', 'noise'] },
  { id: 'nasal', category: 'production', canonical: 'nasal', synonyms: ['honky', 'mid-heavy'] },
  { id: 'boxy', category: 'production', canonical: 'boxy', synonyms: ['resonant', 'hollow', 'midrangey'] },
];

// =============================================================================
// Mastering and Loudness
// =============================================================================

/**
 * Mastering, loudness, and finalization nouns.
 */
export const MASTERING_NOUNS: readonly DomainNoun[] = [
  // Core concepts
  { id: 'mastering', category: 'production', canonical: 'mastering', synonyms: ['master', 'final mix', 'finalization'] },
  { id: 'loudness', category: 'production', canonical: 'loudness', synonyms: ['perceived volume', 'RMS level'] },
  { id: 'headroom', category: 'production', canonical: 'headroom', synonyms: ['dynamic headroom', 'peak margin'] },
  { id: 'clipping', category: 'production', canonical: 'clipping', synonyms: ['digital clipping', 'overs', 'distortion'] },
  { id: 'peak_level', category: 'production', canonical: 'peak level', synonyms: ['peak', 'maximum level'] },
  { id: 'rms_level', category: 'production', canonical: 'RMS level', synonyms: ['RMS', 'average level'] },
  { id: 'lufs', category: 'production', canonical: 'LUFS', synonyms: ['loudness units', 'integrated loudness'] },
  { id: 'dynamic_range', category: 'production', canonical: 'dynamic range', synonyms: ['dynamics', 'loud-soft range'] },
  { id: 'crest_factor', category: 'production', canonical: 'crest factor', synonyms: ['peak-to-average ratio'] },
  
  // Mastering processes
  { id: 'loudness_maximization', category: 'production', canonical: 'loudness maximization', synonyms: ['maximizing', 'making it loud'] },
  { id: 'stereo_enhancement', category: 'production', canonical: 'stereo enhancement', synonyms: ['width enhancement', 'stereo widening'] },
  { id: 'mastering_eq', category: 'production', canonical: 'mastering EQ', synonyms: ['master EQ', 'final EQ'] },
  { id: 'mastering_compression', category: 'production', canonical: 'mastering compression', synonyms: ['master compression', 'bus compression'] },
  { id: 'brick_wall_limiting', category: 'production', canonical: 'brick wall limiting', synonyms: ['peak limiting', 'true peak limiting'] },
  
  // Reference and monitoring
  { id: 'reference_track', category: 'production', canonical: 'reference track', synonyms: ['reference', 'comparison'] },
  { id: 'ab_comparison', category: 'production', canonical: 'A/B comparison', synonyms: ['A/B', 'comparing', 'referencing'] },
  { id: 'mono_compatibility', category: 'production', canonical: 'mono compatibility', synonyms: ['mono check', 'phase compatibility'] },
  { id: 'translation', category: 'production', canonical: 'translation', synonyms: ['how it translates', 'playback systems'] },
];

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * All production and arrangement domain nouns from this batch.
 */
export const PRODUCTION_ARRANGEMENT_BATCH1_NOUNS: readonly DomainNoun[] = [
  ...ARRANGEMENT_NOUNS,
  ...MIXING_NOUNS,
  ...EFFECTS_NOUNS,
  ...SOUND_DESIGN_NOUNS,
  ...MASTERING_NOUNS,
];

/**
 * Lookup map for quick retrieval.
 */
export const PRODUCTION_ARRANGEMENT_BATCH1_MAP = new Map(
  PRODUCTION_ARRANGEMENT_BATCH1_NOUNS.map(noun => [noun.id, noun])
);

/**
 * Get a production/arrangement noun by ID.
 */
export function getProductionArrangementNoun(id: string): DomainNoun | undefined {
  return PRODUCTION_ARRANGEMENT_BATCH1_MAP.get(id);
}

/**
 * Find production/arrangement nouns by category.
 */
export function getProductionArrangementNounsByCategory(
  category: DomainNounCategory
): readonly DomainNoun[] {
  return PRODUCTION_ARRANGEMENT_BATCH1_NOUNS.filter(noun => noun.category === category);
}
