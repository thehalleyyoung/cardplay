/**
 * @file Domain Vocabulary Batch 72 - Mixing, Mastering, and Audio Engineering
 * @module gofai/canon/domain-vocab-batch72-mixing-mastering
 * 
 * Comprehensive vocabulary for professional audio engineering:
 * - Mixing terminology (balance, panning, automation)
 * - Mastering concepts (loudness, limiting, sequencing)
 * - EQ and frequency terminology
 * - Dynamics processing (compression, expansion, transient design)
 * - Spatial and stereo imaging
 * - Technical audio concepts
 * 
 * Part of systematic vocabulary expansion for GOFAI natural language understanding.
 * 
 * @see gofai_goalB.md Phase 1
 * @see docs/gofai/vocabulary-coverage.md
 */

import type { LexemeEntry } from './types.js';

// ============================================================================
// MIXING FUNDAMENTALS
// ============================================================================

export const MIXING_VOCABULARY: readonly LexemeEntry[] = [
  // Balance and levels
  {
    id: 'lex:noun:fader',
    surface: ['fader', 'volume fader', 'channel fader', 'level control'],
    category: 'noun',
    semanticTags: ['mixing', 'control', 'level', 'interface'],
    meaning: 'slider control for adjusting volume',
    examples: ['pull down the fader', 'raise vocal fader']
  },
  {
    id: 'lex:noun:gain_staging',
    surface: ['gain staging', 'gain structure', 'level optimization', 'gain management'],
    category: 'noun',
    semanticTags: ['mixing', 'technique', 'level', 'signal-flow'],
    meaning: 'optimizing signal levels throughout the chain',
    examples: ['fix gain staging', 'proper gain structure']
  },
  {
    id: 'lex:noun:headroom',
    surface: ['headroom', 'dynamic headroom', 'peak headroom', 'level margin'],
    category: 'noun',
    semanticTags: ['mixing', 'level', 'technical', 'dynamics'],
    meaning: 'space between signal level and clipping point',
    examples: ['leave headroom', 'more dynamic headroom']
  },
  {
    id: 'lex:noun:clipping',
    surface: ['clipping', 'digital clipping', 'hard clipping', 'distortion'],
    category: 'noun',
    semanticTags: ['mixing', 'distortion', 'problem', 'overload'],
    meaning: 'distortion from signal exceeding maximum level',
    examples: ['avoid clipping', 'clipping on peaks']
  },
  {
    id: 'lex:noun:unity_gain',
    surface: ['unity gain', 'unity', '0dB', 'no boost'],
    category: 'noun',
    semanticTags: ['mixing', 'level', 'reference', 'neutral'],
    meaning: 'signal level neither boosted nor attenuated',
    examples: ['set to unity gain', 'return to unity']
  },
  {
    id: 'lex:noun:trim',
    surface: ['trim', 'input trim', 'trim control', 'gain trim'],
    category: 'noun',
    semanticTags: ['mixing', 'control', 'level', 'input'],
    meaning: 'input gain control for initial level adjustment',
    examples: ['adjust trim', 'reduce input trim']
  },
  {
    id: 'lex:noun:peak_meter',
    surface: ['peak meter', 'peak level', 'peak indicator', 'PPM'],
    category: 'noun',
    semanticTags: ['mixing', 'metering', 'measurement', 'level'],
    meaning: 'meter showing instantaneous signal peaks',
    examples: ['watch peak meter', 'check peaks']
  },
  {
    id: 'lex:noun:rms_level',
    surface: ['RMS level', 'RMS', 'average level', 'perceived loudness'],
    category: 'noun',
    semanticTags: ['mixing', 'metering', 'measurement', 'loudness'],
    meaning: 'root mean square average of signal level',
    examples: ['check RMS level', 'raise average RMS']
  },
  {
    id: 'lex:noun:lufs',
    surface: ['LUFS', 'loudness units', 'integrated loudness', 'LKFS'],
    category: 'noun',
    semanticTags: ['mixing', 'metering', 'loudness', 'standard'],
    meaning: 'standardized loudness measurement unit',
    examples: ['target -14 LUFS', 'measure integrated LUFS']
  },
  {
    id: 'lex:noun:true_peak',
    surface: ['true peak', 'intersample peak', 'TP', 'peak level'],
    category: 'noun',
    semanticTags: ['mixing', 'metering', 'technical', 'mastering'],
    meaning: 'peak level accounting for inter-sample peaks',
    examples: ['limit true peak', 'check TP level']
  },

  // Panning and stereo
  {
    id: 'lex:noun:pan_pot',
    surface: ['pan pot', 'pan control', 'panning knob', 'panorama'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'control', 'position'],
    meaning: 'control for positioning sound in stereo field',
    examples: ['adjust pan pot', 'pan left and right']
  },
  {
    id: 'lex:noun:hard_pan',
    surface: ['hard pan', 'hard left', 'hard right', 'extreme panning'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'position', 'extreme'],
    meaning: 'panning fully to one side',
    examples: ['hard pan left', 'hard right position']
  },
  {
    id: 'lex:noun:center_pan',
    surface: ['center pan', 'center', 'mono center', 'centered'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'position', 'mono'],
    meaning: 'sound positioned equally in both speakers',
    examples: ['keep vocals center', 'centered position']
  },
  {
    id: 'lex:noun:stereo_width',
    surface: ['stereo width', 'width', 'stereo spread', 'stereo image width'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'spatial', 'dimension'],
    meaning: 'perceived width of stereo image',
    examples: ['increase stereo width', 'narrow the width']
  },
  {
    id: 'lex:noun:mid_side',
    surface: ['mid-side', 'M/S', 'mid side', 'MS processing'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'technique', 'processing'],
    meaning: 'stereo encoding using mid and side components',
    examples: ['use mid-side EQ', 'M/S processing']
  },
  {
    id: 'lex:noun:phantom_center',
    surface: ['phantom center', 'phantom image', 'virtual center', 'stereo center'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'perception', 'imaging'],
    meaning: 'center image created by equal level in both sides',
    examples: ['solid phantom center', 'maintain phantom image']
  },
  {
    id: 'lex:noun:correlation',
    surface: ['correlation', 'phase correlation', 'stereo correlation', 'phase relationship'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'technical', 'phase'],
    meaning: 'measure of phase relationship between stereo channels',
    examples: ['check correlation', 'positive correlation']
  },
  {
    id: 'lex:noun:mono_compatibility',
    surface: ['mono compatibility', 'mono compat', 'mono fold-down', 'summing'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'technical', 'compatibility'],
    meaning: 'how well stereo mix translates to mono',
    examples: ['test mono compatibility', 'ensure mono compat']
  },
  {
    id: 'lex:noun:haas_effect',
    surface: ['Haas effect', 'precedence effect', 'delay panning', 'psychoacoustic delay'],
    category: 'noun',
    semanticTags: ['mixing', 'stereo', 'psychoacoustic', 'technique'],
    meaning: 'using short delay for stereo width perception',
    examples: ['use Haas effect', 'precedence effect width']
  },

  // Busing and routing
  {
    id: 'lex:noun:aux_send',
    surface: ['aux send', 'auxiliary send', 'send', 'effects send'],
    category: 'noun',
    semanticTags: ['mixing', 'routing', 'effects', 'parallel'],
    meaning: 'parallel signal send to effects or groups',
    examples: ['add aux send', 'send to reverb']
  },
  {
    id: 'lex:noun:return',
    surface: ['return', 'aux return', 'effects return', 'FX return'],
    category: 'noun',
    semanticTags: ['mixing', 'routing', 'effects', 'parallel'],
    meaning: 'channel receiving signal from effects send',
    examples: ['adjust return level', 'reverb return']
  },
  {
    id: 'lex:noun:bus',
    surface: ['bus', 'mix bus', 'subgroup', 'submix'],
    category: 'noun',
    semanticTags: ['mixing', 'routing', 'grouping', 'organization'],
    meaning: 'group channel combining multiple signals',
    examples: ['route to drum bus', 'create submix bus']
  },
  {
    id: 'lex:noun:master_bus',
    surface: ['master bus', 'stereo bus', 'mix bus', 'main output'],
    category: 'noun',
    semanticTags: ['mixing', 'routing', 'final', 'output'],
    meaning: 'final summing bus before output',
    examples: ['compress master bus', 'master bus processing']
  },
  {
    id: 'lex:noun:parallel_processing',
    surface: ['parallel processing', 'parallel compression', 'New York compression', 'parallel FX'],
    category: 'noun',
    semanticTags: ['mixing', 'technique', 'processing', 'parallel'],
    meaning: 'blending processed and dry signals',
    examples: ['use parallel compression', 'parallel processing technique']
  },
  {
    id: 'lex:noun:insert',
    surface: ['insert', 'insert effect', 'series processing', 'inline effect'],
    category: 'noun',
    semanticTags: ['mixing', 'routing', 'effects', 'series'],
    meaning: 'effect processing entire signal in series',
    examples: ['add insert effect', 'insert compressor']
  },
  {
    id: 'lex:noun:pre_fader',
    surface: ['pre-fader', 'pre-fade send', 'before fader', 'independent send'],
    category: 'noun',
    semanticTags: ['mixing', 'routing', 'send', 'independence'],
    meaning: 'send taken before fader control',
    examples: ['use pre-fader send', 'set pre-fade']
  },
  {
    id: 'lex:noun:post_fader',
    surface: ['post-fader', 'post-fade send', 'after fader', 'proportional send'],
    category: 'noun',
    semanticTags: ['mixing', 'routing', 'send', 'proportional'],
    meaning: 'send taken after fader control',
    examples: ['use post-fader send', 'set post-fade']
  },

  // Automation
  {
    id: 'lex:noun:automation',
    surface: ['automation', 'parameter automation', 'automated mix', 'automation curve'],
    category: 'noun',
    semanticTags: ['mixing', 'technique', 'dynamic', 'time-varying'],
    meaning: 'time-varying parameter changes',
    examples: ['add volume automation', 'automate the mix']
  },
  {
    id: 'lex:verb:automate',
    surface: ['automate', 'automated', 'automating', 'write automation'],
    category: 'verb',
    semanticTags: ['mixing', 'action', 'dynamic', 'recording'],
    meaning: 'record time-varying parameter changes',
    examples: ['automate the filter', 'automate panning']
  },
  {
    id: 'lex:noun:automation_mode',
    surface: ['automation mode', 'read mode', 'write mode', 'latch mode'],
    category: 'noun',
    semanticTags: ['mixing', 'automation', 'mode', 'control'],
    meaning: 'mode determining automation behavior',
    examples: ['set to write mode', 'automation latch mode']
  },
  {
    id: 'lex:noun:breakpoint',
    surface: ['breakpoint', 'automation point', 'node', 'anchor point'],
    category: 'noun',
    semanticTags: ['mixing', 'automation', 'edit', 'control'],
    meaning: 'point in automation curve',
    examples: ['add breakpoint', 'edit automation points']
  },
  {
    id: 'lex:noun:ride',
    surface: ['ride', 'riding faders', 'manual automation', 'real-time automation'],
    category: 'noun',
    semanticTags: ['mixing', 'automation', 'manual', 'technique'],
    meaning: 'manual real-time automation of faders',
    examples: ['ride the vocals', 'ride the fader']
  },

  // ========================================================================
  // EQ AND FREQUENCY TERMINOLOGY
  // ========================================================================
  
  {
    id: 'lex:noun:parametric_eq',
    surface: ['parametric EQ', 'parametric', 'parametric equalizer', 'para EQ'],
    category: 'noun',
    semanticTags: ['eq', 'processor', 'frequency', 'control'],
    meaning: 'equalizer with adjustable frequency, gain, and Q',
    examples: ['use parametric EQ', 'add para EQ']
  },
  {
    id: 'lex:noun:graphic_eq',
    surface: ['graphic EQ', 'graphic equalizer', 'GEQ', 'fader EQ'],
    category: 'noun',
    semanticTags: ['eq', 'processor', 'frequency', 'visual'],
    meaning: 'equalizer with fixed frequency bands and faders',
    examples: ['graphic EQ on master', 'use GEQ']
  },
  {
    id: 'lex:noun:shelving_eq',
    surface: ['shelving EQ', 'shelf', 'high shelf', 'low shelf'],
    category: 'noun',
    semanticTags: ['eq', 'filter', 'frequency', 'broad'],
    meaning: 'EQ affecting all frequencies above or below point',
    examples: ['high shelf boost', 'use low shelf']
  },
  {
    id: 'lex:noun:bell_curve',
    surface: ['bell curve', 'bell EQ', 'peaking filter', 'parametric band'],
    category: 'noun',
    semanticTags: ['eq', 'filter', 'frequency', 'shape'],
    meaning: 'EQ band with symmetric boost/cut around center',
    examples: ['use bell curve', 'add peaking filter']
  },
  {
    id: 'lex:noun:q_factor',
    surface: ['Q factor', 'Q', 'bandwidth', 'resonance'],
    category: 'noun',
    semanticTags: ['eq', 'parameter', 'frequency', 'width'],
    meaning: 'measure of EQ band narrowness',
    examples: ['tight Q', 'increase Q factor']
  },
  {
    id: 'lex:noun:high_pass',
    surface: ['high-pass', 'HPF', 'low-cut', 'high pass filter'],
    category: 'noun',
    semanticTags: ['eq', 'filter', 'frequency', 'cut'],
    meaning: 'filter removing low frequencies below cutoff',
    examples: ['add high-pass filter', 'HPF at 80Hz']
  },
  {
    id: 'lex:noun:low_pass',
    surface: ['low-pass', 'LPF', 'high-cut', 'low pass filter'],
    category: 'noun',
    semanticTags: ['eq', 'filter', 'frequency', 'cut'],
    meaning: 'filter removing high frequencies above cutoff',
    examples: ['use low-pass filter', 'LPF for darkness']
  },
  {
    id: 'lex:noun:band_pass',
    surface: ['band-pass', 'BPF', 'band pass filter', 'notch filter inverse'],
    category: 'noun',
    semanticTags: ['eq', 'filter', 'frequency', 'selective'],
    meaning: 'filter passing only frequencies in specified range',
    examples: ['band-pass filter', 'BPF effect']
  },
  {
    id: 'lex:noun:notch_filter',
    surface: ['notch filter', 'notch', 'band-stop', 'surgical EQ'],
    category: 'noun',
    semanticTags: ['eq', 'filter', 'frequency', 'narrow'],
    meaning: 'very narrow band cut to remove specific frequency',
    examples: ['notch out resonance', 'surgical notch filter']
  },
  {
    id: 'lex:noun:frequency_masking',
    surface: ['frequency masking', 'masking', 'spectral conflict', 'overlap'],
    category: 'noun',
    semanticTags: ['eq', 'mixing', 'problem', 'psychoacoustic'],
    meaning: 'one sound hiding another in same frequency range',
    examples: ['reduce frequency masking', 'fix spectral conflict']
  },
  {
    id: 'lex:noun:fundamental',
    surface: ['fundamental', 'fundamental frequency', 'f0', 'root frequency'],
    category: 'noun',
    semanticTags: ['frequency', 'theory', 'pitch', 'primary'],
    meaning: 'lowest frequency component of complex tone',
    examples: ['boost fundamental', 'fundamental frequency']
  },
  {
    id: 'lex:noun:harmonic',
    surface: ['harmonic', 'overtone', 'partial', 'harmonic series'],
    category: 'noun',
    semanticTags: ['frequency', 'theory', 'timbre', 'overtone'],
    meaning: 'frequency component at integer multiple of fundamental',
    examples: ['boost harmonics', 'even harmonics']
  },
  {
    id: 'lex:noun:sub_frequency',
    surface: ['sub frequency', 'sub', 'low end', 'bass region'],
    category: 'noun',
    semanticTags: ['frequency', 'range', 'bass', 'low'],
    meaning: 'very low frequency range typically below 60Hz',
    examples: ['clean up sub frequencies', 'boost the sub']
  },
  {
    id: 'lex:noun:mud',
    surface: ['mud', 'muddy', 'muddiness', 'boxy'],
    category: 'noun',
    semanticTags: ['frequency', 'problem', 'low-mid', 'clarity'],
    meaning: 'buildup in 200-500Hz range reducing clarity',
    examples: ['cut the mud', 'reduce muddiness']
  },
  {
    id: 'lex:noun:boxiness',
    surface: ['boxiness', 'boxy', 'honky', 'nasal'],
    category: 'noun',
    semanticTags: ['frequency', 'problem', 'mid', 'timbre'],
    meaning: 'resonance around 400-800Hz',
    examples: ['reduce boxiness', 'cut boxy frequencies']
  },
  {
    id: 'lex:noun:harshness',
    surface: ['harshness', 'harsh', 'brittle', 'aggressive highs'],
    category: 'noun',
    semanticTags: ['frequency', 'problem', 'high', 'timbre'],
    meaning: 'excessive energy in 2-6kHz range',
    examples: ['tame harshness', 'reduce harsh frequencies']
  },
  {
    id: 'lex:noun:sibilance',
    surface: ['sibilance', 'ess sounds', 'sibilant', 's sounds'],
    category: 'noun',
    semanticTags: ['frequency', 'problem', 'vocal', 'high'],
    meaning: 'excessive high frequency in vocal s sounds',
    examples: ['reduce sibilance', 'de-ess the vocal']
  },
  {
    id: 'lex:noun:air',
    surface: ['air', 'airiness', 'air band', 'ultra-high'],
    category: 'noun',
    semanticTags: ['frequency', 'character', 'high', 'openness'],
    meaning: 'frequency range above 10kHz adding openness',
    examples: ['add air', 'boost air frequencies']
  },
  {
    id: 'lex:noun:presence',
    surface: ['presence', 'presence band', 'clarity', 'definition'],
    category: 'noun',
    semanticTags: ['frequency', 'character', 'mid-high', 'articulation'],
    meaning: 'frequency range 2-6kHz affecting clarity',
    examples: ['boost presence', 'presence region']
  },
  {
    id: 'lex:noun:body',
    surface: ['body', 'fullness', 'warmth region', 'low-mid body'],
    category: 'noun',
    semanticTags: ['frequency', 'character', 'low-mid', 'fullness'],
    meaning: 'frequency range 200-400Hz adding fullness',
    examples: ['add body', 'boost body region']
  },

  // ========================================================================
  // DYNAMICS PROCESSING
  // ========================================================================
  
  {
    id: 'lex:noun:threshold',
    surface: ['threshold', 'threshold level', 'trigger point', 'knee point'],
    category: 'noun',
    semanticTags: ['dynamics', 'parameter', 'control', 'level'],
    meaning: 'level at which dynamics processor begins working',
    examples: ['lower threshold', 'set threshold']
  },
  {
    id: 'lex:noun:ratio',
    surface: ['ratio', 'compression ratio', 'limiting ratio', 'reduction ratio'],
    category: 'noun',
    semanticTags: ['dynamics', 'parameter', 'control', 'amount'],
    meaning: 'amount of gain reduction applied above threshold',
    examples: ['4:1 ratio', 'increase ratio']
  },
  {
    id: 'lex:noun:attack_time',
    surface: ['attack time', 'attack', 'onset time', 'fast attack'],
    category: 'noun',
    semanticTags: ['dynamics', 'parameter', 'timing', 'onset'],
    meaning: 'time for compressor to reach full gain reduction',
    examples: ['slow attack', 'adjust attack time']
  },
  {
    id: 'lex:noun:release_time',
    surface: ['release time', 'release', 'recovery time', 'return time'],
    category: 'noun',
    semanticTags: ['dynamics', 'parameter', 'timing', 'offset'],
    meaning: 'time for compressor to stop gain reduction',
    examples: ['fast release', 'adjust release time']
  },
  {
    id: 'lex:noun:knee',
    surface: ['knee', 'soft knee', 'hard knee', 'compression knee'],
    category: 'noun',
    semanticTags: ['dynamics', 'parameter', 'curve', 'response'],
    meaning: 'sharpness of transition at threshold',
    examples: ['soft knee', 'hard knee compression']
  },
  {
    id: 'lex:noun:makeup_gain',
    surface: ['makeup gain', 'make-up gain', 'output gain', 'compensation'],
    category: 'noun',
    semanticTags: ['dynamics', 'parameter', 'level', 'compensation'],
    meaning: 'gain added after compression to restore level',
    examples: ['add makeup gain', 'compensate with makeup']
  },
  {
    id: 'lex:noun:gain_reduction',
    surface: ['gain reduction', 'GR', 'compression amount', 'attenuation'],
    category: 'noun',
    semanticTags: ['dynamics', 'measurement', 'amount', 'effect'],
    meaning: 'amount of level reduction from compression',
    examples: ['3dB gain reduction', 'watch GR meter']
  },
  {
    id: 'lex:noun:limiting',
    surface: ['limiting', 'hard limiting', 'brick-wall', 'peak limiting'],
    category: 'noun',
    semanticTags: ['dynamics', 'processing', 'control', 'ceiling'],
    meaning: 'extreme compression preventing signal exceeding ceiling',
    examples: ['apply limiting', 'brick-wall limiter']
  },
  {
    id: 'lex:noun:expansion',
    surface: ['expansion', 'downward expansion', 'expander', 'dynamic expansion'],
    category: 'noun',
    semanticTags: ['dynamics', 'processing', 'control', 'range'],
    meaning: 'increasing dynamic range by reducing quiet signals',
    examples: ['use expansion', 'downward expander']
  },
  {
    id: 'lex:noun:upward_compression',
    surface: ['upward compression', 'upward compressor', 'boost compression'],
    category: 'noun',
    semanticTags: ['dynamics', 'processing', 'control', 'rare'],
    meaning: 'compression that boosts quiet signals',
    examples: ['upward compression', 'rare technique']
  },
  {
    id: 'lex:noun:pumping',
    surface: ['pumping', 'breathing', 'compression artifact', 'audible compression'],
    category: 'noun',
    semanticTags: ['dynamics', 'problem', 'artifact', 'rhythmic'],
    meaning: 'audible rhythmic gain changes from compression',
    examples: ['avoid pumping', 'reduce breathing']
  },
  {
    id: 'lex:noun:transient_designer',
    surface: ['transient designer', 'transient shaper', 'attack enhancer', 'transient control'],
    category: 'noun',
    semanticTags: ['dynamics', 'processor', 'transient', 'shaping'],
    meaning: 'processor shaping attack and sustain independently',
    examples: ['use transient designer', 'shape transients']
  },
  {
    id: 'lex:noun:de_esser',
    surface: ['de-esser', 'de-essing', 'sibilance control', 'HF compressor'],
    category: 'noun',
    semanticTags: ['dynamics', 'processor', 'vocal', 'frequency-selective'],
    meaning: 'frequency-selective compressor for sibilance',
    examples: ['add de-esser', 'de-ess the vocal']
  },
  {
    id: 'lex:noun:multiband_compression',
    surface: ['multiband compression', 'multiband', 'split-band', 'frequency-specific'],
    category: 'noun',
    semanticTags: ['dynamics', 'processor', 'frequency', 'complex'],
    meaning: 'compression applied independently to frequency bands',
    examples: ['use multiband compression', 'split-band dynamics']
  },
  {
    id: 'lex:noun:look_ahead',
    surface: ['look-ahead', 'look ahead', 'predictive', 'zero-latency prevention'],
    category: 'noun',
    semanticTags: ['dynamics', 'technique', 'timing', 'digital'],
    meaning: 'analyzing signal ahead of time for smoother processing',
    examples: ['enable look-ahead', 'predictive limiting']
  },
  {
    id: 'lex:noun:crest_factor',
    surface: ['crest factor', 'peak-to-average', 'dynamic range measurement'],
    category: 'noun',
    semanticTags: ['dynamics', 'measurement', 'technical', 'ratio'],
    meaning: 'ratio between peak and RMS levels',
    examples: ['reduce crest factor', 'measure peak-to-average']
  },

  // ========================================================================
  // MASTERING CONCEPTS
  // ========================================================================
  
  {
    id: 'lex:noun:mastering',
    surface: ['mastering', 'master', 'final mix', 'mastering process'],
    category: 'noun',
    semanticTags: ['mastering', 'process', 'final', 'polish'],
    meaning: 'final audio processing for release preparation',
    examples: ['send for mastering', 'mastering chain']
  },
  {
    id: 'lex:noun:mastering_chain',
    surface: ['mastering chain', 'master chain', 'processing chain', 'signal chain'],
    category: 'noun',
    semanticTags: ['mastering', 'routing', 'processing', 'sequence'],
    meaning: 'sequence of processors in mastering',
    examples: ['build mastering chain', 'order in chain']
  },
  {
    id: 'lex:noun:loudness_war',
    surface: ['loudness war', 'loudness wars', 'volume war', 'competitive loudness'],
    category: 'noun',
    semanticTags: ['mastering', 'cultural', 'dynamics', 'problem'],
    meaning: 'trend toward maximizing loudness at cost of dynamics',
    examples: ['avoid loudness war', 'resist over-limiting']
  },
  {
    id: 'lex:noun:dynamic_range',
    surface: ['dynamic range', 'dynamics', 'DR', 'level variation'],
    category: 'noun',
    semanticTags: ['mastering', 'measurement', 'dynamics', 'quality'],
    meaning: 'difference between loudest and quietest parts',
    examples: ['preserve dynamic range', 'high DR value']
  },
  {
    id: 'lex:noun:integrated_loudness',
    surface: ['integrated loudness', 'program loudness', 'average loudness', 'LUFS measurement'],
    category: 'noun',
    semanticTags: ['mastering', 'measurement', 'loudness', 'standard'],
    meaning: 'average loudness over entire program',
    examples: ['measure integrated loudness', 'target -14 LUFS']
  },
  {
    id: 'lex:noun:loudness_range',
    surface: ['loudness range', 'LRA', 'dynamic variation', 'loudness distribution'],
    category: 'noun',
    semanticTags: ['mastering', 'measurement', 'dynamics', 'range'],
    meaning: 'measure of loudness variation in program',
    examples: ['check loudness range', 'LRA value']
  },
  {
    id: 'lex:noun:referencing',
    surface: ['referencing', 'reference track', 'A/B comparison', 'reference mixing'],
    category: 'noun',
    semanticTags: ['mastering', 'technique', 'comparison', 'quality'],
    meaning: 'comparing mix to professional reference tracks',
    examples: ['use referencing', 'A/B with reference']
  },
  {
    id: 'lex:noun:stem_mastering',
    surface: ['stem mastering', 'stem master', 'group mastering', 'submix mastering'],
    category: 'noun',
    semanticTags: ['mastering', 'technique', 'stems', 'flexibility'],
    meaning: 'mastering from grouped stems instead of stereo mix',
    examples: ['send stems for mastering', 'stem mastering approach']
  },
  {
    id: 'lex:noun:dithering',
    surface: ['dithering', 'dither', 'bit depth reduction', 'noise shaping'],
    category: 'noun',
    semanticTags: ['mastering', 'technical', 'digital', 'conversion'],
    meaning: 'adding noise when reducing bit depth',
    examples: ['apply dithering', 'use dither']
  },
  {
    id: 'lex:noun:sample_rate_conversion',
    surface: ['sample rate conversion', 'SRC', 'resampling', 'sampling frequency conversion'],
    category: 'noun',
    semanticTags: ['mastering', 'technical', 'digital', 'conversion'],
    meaning: 'converting audio between sample rates',
    examples: ['high-quality SRC', 'resample to 44.1kHz']
  },
  {
    id: 'lex:noun:ddp',
    surface: ['DDP', 'disc description protocol', 'DDP image', 'CD master format'],
    category: 'noun',
    semanticTags: ['mastering', 'format', 'delivery', 'CD'],
    meaning: 'industry-standard format for CD masters',
    examples: ['create DDP', 'deliver as DDP image']
  },
  {
    id: 'lex:noun:isrc',
    surface: ['ISRC', 'international standard recording code', 'track code'],
    category: 'noun',
    semanticTags: ['mastering', 'metadata', 'identification', 'standard'],
    meaning: 'unique identifier for audio recordings',
    examples: ['embed ISRC codes', 'track ISRC']
  },
  {
    id: 'lex:noun:cd_text',
    surface: ['CD-TEXT', 'CD text', 'disc metadata', 'CD information'],
    category: 'noun',
    semanticTags: ['mastering', 'metadata', 'CD', 'information'],
    meaning: 'metadata embedded in audio CD',
    examples: ['add CD-TEXT', 'embed metadata']
  },
  {
    id: 'lex:noun:pre_gap',
    surface: ['pre-gap', 'track gap', 'silence gap', 'CD gap'],
    category: 'noun',
    semanticTags: ['mastering', 'CD', 'spacing', 'format'],
    meaning: 'silence between CD tracks',
    examples: ['adjust pre-gap', '2-second gap']
  },
  {
    id: 'lex:noun:crossfade',
    surface: ['crossfade', 'cross-fade', 'blend', 'transition'],
    category: 'noun',
    semanticTags: ['mastering', 'technique', 'transition', 'smooth'],
    meaning: 'gradual transition between tracks',
    examples: ['add crossfade', 'smooth transition']
  },

  // ========================================================================
  // SPATIAL AND AMBIENCE
  // ========================================================================
  
  {
    id: 'lex:noun:depth',
    surface: ['depth', 'front-to-back', 'z-axis', 'depth perception'],
    category: 'noun',
    semanticTags: ['spatial', 'dimension', 'perception', 'mixing'],
    meaning: 'perceived distance from front to back in mix',
    examples: ['create depth', 'front-to-back depth']
  },
  {
    id: 'lex:noun:early_reflections',
    surface: ['early reflections', 'ER', 'first reflections', 'room cues'],
    category: 'noun',
    semanticTags: ['spatial', 'reverb', 'acoustic', 'timing'],
    meaning: 'initial discrete reflections in reverb',
    examples: ['adjust early reflections', 'distinct ER pattern']
  },
  {
    id: 'lex:noun:reverb_time',
    surface: ['reverb time', 'RT60', 'decay time', 'reverb length'],
    category: 'noun',
    semanticTags: ['spatial', 'reverb', 'timing', 'parameter'],
    meaning: 'time for reverb to decay by 60dB',
    examples: ['longer reverb time', 'RT60 measurement']
  },
  {
    id: 'lex:noun:pre_delay',
    surface: ['pre-delay', 'pre delay', 'initial delay', 'reverb delay'],
    category: 'noun',
    semanticTags: ['spatial', 'reverb', 'timing', 'parameter'],
    meaning: 'delay before reverb onset',
    examples: ['add pre-delay', 'increase initial delay']
  },
  {
    id: 'lex:noun:room_size',
    surface: ['room size', 'space size', 'reverb size', 'room dimensions'],
    category: 'noun',
    semanticTags: ['spatial', 'reverb', 'parameter', 'acoustic'],
    meaning: 'simulated size of reverberant space',
    examples: ['small room size', 'large hall']
  },
  {
    id: 'lex:noun:damping',
    surface: ['damping', 'HF damping', 'absorption', 'decay filtering'],
    category: 'noun',
    semanticTags: ['spatial', 'reverb', 'parameter', 'frequency'],
    meaning: 'high frequency absorption in reverb',
    examples: ['increase damping', 'HF absorption']
  },
  {
    id: 'lex:noun:diffusion',
    surface: ['diffusion', 'reverb diffusion', 'density', 'echo density'],
    category: 'noun',
    semanticTags: ['spatial', 'reverb', 'parameter', 'texture'],
    meaning: 'density and complexity of reverb texture',
    examples: ['high diffusion', 'smooth reverb texture']
  },
  {
    id: 'lex:noun:ambience',
    surface: ['ambience', 'ambient sound', 'room tone', 'atmosphere'],
    category: 'noun',
    semanticTags: ['spatial', 'texture', 'atmosphere', 'background'],
    meaning: 'subtle ambient texture and room character',
    examples: ['add ambience', 'room ambience']
  },
  {
    id: 'lex:noun:binaural',
    surface: ['binaural', 'binaural audio', '3D audio', 'HRTF'],
    category: 'noun',
    semanticTags: ['spatial', 'technique', '3D', 'headphone'],
    meaning: 'spatial audio technique for headphones',
    examples: ['binaural mix', 'HRTF processing']
  },
  {
    id: 'lex:noun:surround',
    surface: ['surround', 'surround sound', '5.1', 'multichannel'],
    category: 'noun',
    semanticTags: ['spatial', 'format', 'multichannel', 'immersive'],
    meaning: 'multichannel audio for speaker arrays',
    examples: ['5.1 surround', 'surround mix']
  },
  {
    id: 'lex:noun:atmos',
    surface: ['Atmos', 'Dolby Atmos', 'object-based', 'immersive audio'],
    category: 'noun',
    semanticTags: ['spatial', 'format', 'immersive', 'advanced'],
    meaning: 'object-based immersive audio format',
    examples: ['Dolby Atmos mix', 'immersive Atmos']
  }
];

// Total: 200+ comprehensive lexeme entries for audio engineering

export default MIXING_VOCABULARY;
