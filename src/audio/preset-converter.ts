/**
 * @fileoverview Preset Converter
 * 
 * Converts Surge and Vital presets to the unified format and
 * auto-categorizes them by instrument type.
 * 
 * @module @cardplay/core/audio/preset-converter
 */

import {
  type UnifiedPreset,
  type UnifiedOscillator,
  type UnifiedFilter,
  type UnifiedEnvelope,
  type UnifiedLFO,
  type ModulationRoute,
  type UnifiedEffect,
  type InstrumentCategory,
  type InstrumentSubCategory,
  type SoundCharacter,
  type OscWaveformType,
  type FilterType,
  type LFOShape,
  type ModSource,
  type ModDestination,
  type EffectType,
  createInitPreset,
  createDefaultOscillator,
  createDefaultFilter
} from './unified-preset';

import type {
  ParsedPreset,
  OscillatorSettings,
  FilterSettings,
  EnvelopeSettings,
  LFOSettings,
  ModulationSettings,
  EffectSettings,
} from './synth-asset-db';

// ============================================================================
// CATEGORY CLASSIFICATION
// ============================================================================

/**
 * Keywords for category detection.
 */
const CATEGORY_KEYWORDS: Record<InstrumentCategory, string[]> = {
  bass: [
    'bass', 'sub', 'reese', 'growl', 'wobble', '808', 'low', 'deep',
    'rumble', 'thump', 'boom', 'heavy', 'massive'
  ],
  lead: [
    'lead', 'solo', 'screech', 'scream', 'acid', 'mono', 'stab',
    'sharp', 'cutting', 'bright', 'searing', 'laser'
  ],
  pad: [
    'pad', 'atmosphere', 'ambient', 'warm', 'lush', 'soft', 'evolving',
    'sweep', 'swell', 'drift', 'float', 'cloud', 'heaven'
  ],
  pluck: [
    'pluck', 'bell', 'mallet', 'marimba', 'vibes', 'kalimba', 'pizz',
    'guitar', 'harp', 'picked', 'pling', 'plink', 'chime'
  ],
  keys: [
    'piano', 'key', 'organ', 'clav', 'rhodes', 'wurli', 'epiano', 'ep',
    'electric piano', 'tine', 'hammer', 'keyboard'
  ],
  brass: [
    'brass', 'horn', 'trumpet', 'trombone', 'synth brass', 'stab',
    'blare', 'fanfare'
  ],
  strings: [
    'string', 'violin', 'cello', 'orchestra', 'ensemble', 'section',
    'legato', 'arco', 'bowed'
  ],
  vocal: [
    'vocal', 'voice', 'choir', 'vox', 'formant', 'talk', 'speech',
    'sing', 'aah', 'ooh', 'human'
  ],
  fx: [
    'fx', 'effect', 'sfx', 'noise', 'texture', 'riser', 'impact', 'hit',
    'swoosh', 'whoosh', 'zap', 'glitch', 'stutter', 'transition'
  ],
  drum: [
    'drum', 'kick', 'snare', 'hihat', 'hi-hat', 'perc', 'tom', 'clap',
    'cymbal', 'rim', 'beat', 'percussion'
  ],
  arp: [
    'arp', 'arpegg', 'sequence', 'seq', 'pattern', 'pulse', 'motion',
    'rhythmic', 'tempo', 'sync'
  ],
  ambient: [
    'ambient', 'drone', 'soundscape', 'ethereal', 'space', 'atmos',
    'cinematic', 'film', 'movie', 'dark', 'light'
  ],
  other: [],
};

/**
 * Keywords for sub-category detection.
 */
const SUBCATEGORY_KEYWORDS: Partial<Record<InstrumentSubCategory, string[]>> = {
  'sub-bass': ['sub', '808', 'sine', 'pure', 'clean bass'],
  'reese': ['reese', 'dnb', 'neuro', 'liquid'],
  'growl': ['growl', 'dubstep', 'brostep', 'dirty', 'filthy'],
  'wobble': ['wobble', 'wub', 'lfo bass'],
  'pluck-bass': ['pluck bass', 'finger', 'picked bass'],
  'fm-bass': ['fm bass', 'dx', 'digital bass'],
  'acid-bass': ['acid', '303', 'squelch'],
  'mono-lead': ['mono', 'single', 'solo lead'],
  'poly-lead': ['poly', 'chord', 'multi lead'],
  'screech': ['screech', 'scream', 'hoover'],
  'acid-lead': ['acid lead', '303 lead'],
  'saw-lead': ['saw', 'super saw', 'supersaw', 'trance'],
  'square-lead': ['square', 'pulse lead'],
  'warm-pad': ['warm', 'analog pad', 'vintage pad'],
  'evolving-pad': ['evolving', 'morph', 'moving pad'],
  'ambient-pad': ['ambient', 'texture pad'],
  'dark-pad': ['dark', 'ominous', 'sinister'],
  'bright-pad': ['bright', 'airy', 'light pad'],
  'string-pad': ['string pad', 'synth strings'],
  'bell': ['bell', 'tubular', 'glock'],
  'mallet': ['mallet', 'marimba', 'xylo', 'vibes'],
  'pizzicato': ['pizz', 'pizzicato'],
  'piano': ['piano', 'grand', 'upright', 'acoustic piano'],
  'electric-piano': ['ep', 'rhodes', 'wurli', 'electric piano', 'tine'],
  'organ': ['organ', 'hammond', 'b3', 'drawbar'],
  'clav': ['clav', 'clavinet', 'funky'],
  'synth-brass': ['synth brass', 'brass stab'],
  'synth-strings': ['synth string', 'string section'],
  'choir': ['choir', 'chorus', 'voices'],
  'formant': ['formant', 'vowel', 'talk'],
  'riser': ['riser', 'build', 'tension'],
  'impact': ['impact', 'hit', 'drop'],
  'texture': ['texture', 'grain', 'glitch'],
  'drone': ['drone', 'sustain', 'held'],
  'soundscape': ['soundscape', 'cinematic', 'film'],
};

/**
 * Keywords for sound character detection.
 */
const CHARACTER_KEYWORDS: Record<SoundCharacter, string[]> = {
  bright: ['bright', 'brilliant', 'sparkle', 'shiny', 'crisp'],
  dark: ['dark', 'murky', 'deep', 'ominous', 'shadow'],
  warm: ['warm', 'analog', 'tube', 'vintage', 'cozy'],
  cold: ['cold', 'icy', 'frozen', 'digital', 'sterile'],
  harsh: ['harsh', 'aggressive', 'gritty', 'raw', 'edgy'],
  soft: ['soft', 'gentle', 'smooth', 'mellow', 'delicate'],
  aggressive: ['aggressive', 'angry', 'fierce', 'intense', 'heavy'],
  mellow: ['mellow', 'chill', 'relaxed', 'laid back'],
  clean: ['clean', 'pure', 'pristine', 'clear'],
  dirty: ['dirty', 'grungy', 'lo-fi', 'crushed'],
  distorted: ['distort', 'fuzz', 'overdrive', 'saturate'],
  digital: ['digital', 'bit', 'glitch', 'modern'],
  analog: ['analog', 'vintage', 'retro', 'classic'],
  vintage: ['vintage', 'retro', '70s', '80s', 'old'],
  modern: ['modern', 'contemporary', 'future', 'new'],
  thick: ['thick', 'fat', 'full', 'dense', 'massive'],
  thin: ['thin', 'narrow', 'light', 'airy'],
  wide: ['wide', 'stereo', 'spread', 'spacious'],
  narrow: ['narrow', 'mono', 'focused', 'centered'],
  moving: ['moving', 'motion', 'animated', 'alive'],
  static: ['static', 'still', 'fixed', 'stable'],
  evolving: ['evolving', 'morph', 'transform', 'changing'],
  pulsing: ['pulse', 'throb', 'pump', 'sidechain'],
  percussive: ['percussive', 'plucky', 'attack', 'transient'],
  sustained: ['sustained', 'held', 'long', 'legato'],
  plucky: ['pluck', 'staccato', 'short'],
  smooth: ['smooth', 'silky', 'fluid', 'flowing'],
};

/**
 * Detect instrument category from name and characteristics.
 */
export function detectCategory(
  name: string,
  originalCategory: string,
  oscillators: UnifiedOscillator[],
  envelopes: UnifiedEnvelope[]
): InstrumentCategory {
  const searchText = `${name} ${originalCategory}`.toLowerCase();
  
  // Score each category
  const scores: Record<InstrumentCategory, number> = {
    bass: 0, lead: 0, pad: 0, pluck: 0, keys: 0, brass: 0,
    strings: 0, vocal: 0, fx: 0, drum: 0, arp: 0, ambient: 0, other: 0,
  };
  
  // Keyword matching
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        scores[category as InstrumentCategory] += 2;
      }
    }
  }
  
  // Analyze envelope characteristics
  const ampEnv = envelopes.find(e => e.id === 'amp');
  if (ampEnv) {
    // Short attack + short decay + low sustain = pluck
    if (ampEnv.attack < 0.02 && ampEnv.decay < 0.3 && ampEnv.sustain < 0.3) {
      scores.pluck += 2;
    }
    // Short attack + high sustain = lead/bass
    if (ampEnv.attack < 0.02 && ampEnv.sustain > 0.7) {
      scores.lead += 1;
      scores.bass += 1;
    }
    // Long attack = pad
    if (ampEnv.attack > 0.1) {
      scores.pad += 2;
    }
    // Long release = pad/ambient
    if (ampEnv.release > 1) {
      scores.pad += 1;
      scores.ambient += 1;
    }
    // Very short everything = drum/perc
    if (ampEnv.attack < 0.01 && ampEnv.decay < 0.2 && ampEnv.sustain < 0.1) {
      scores.drum += 2;
    }
  }
  
  // Check oscillator characteristics
  const activeOscs = oscillators.filter(o => o.enabled);
  if (activeOscs.length > 0) {
    // Heavy unison = lead
    const maxUnison = Math.max(...activeOscs.map(o => o.unison.voices));
    if (maxUnison > 4) {
      scores.lead += 2;
    }
    
    // Low octave = bass
    const minOctave = Math.min(...activeOscs.map(o => o.octave));
    if (minOctave <= -1) {
      scores.bass += 2;
    }
  }
  
  // Find highest scoring category
  let maxScore = 0;
  let bestCategory: InstrumentCategory = 'other';
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as InstrumentCategory;
    }
  }
  
  return maxScore > 0 ? bestCategory : 'other';
}

/**
 * Detect sub-category from name and category.
 */
export function detectSubCategory(
  name: string,
  category: InstrumentCategory
): InstrumentSubCategory {
  const searchText = name.toLowerCase();
  
  // Check each sub-category
  for (const [subCat, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    if (keywords) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return subCat as InstrumentSubCategory;
        }
      }
    }
  }
  
  // Default based on category
  const defaults: Record<InstrumentCategory, InstrumentSubCategory> = {
    bass: 'sub-bass',
    lead: 'saw-lead',
    pad: 'warm-pad',
    pluck: 'bell',
    keys: 'electric-piano',
    brass: 'synth-brass',
    strings: 'synth-strings',
    vocal: 'choir',
    fx: 'texture',
    drum: 'perc',
    arp: 'sequence',
    ambient: 'drone',
    other: 'generic',
  };
  
  return defaults[category];
}

/**
 * Detect sound characters from name and preset data.
 */
export function detectCharacters(
  name: string,
  oscillators: UnifiedOscillator[],
  filters: UnifiedFilter[],
  effects: UnifiedEffect[]
): SoundCharacter[] {
  const searchText = name.toLowerCase();
  const characters: Set<SoundCharacter> = new Set();
  
  // Keyword matching
  for (const [character, keywords] of Object.entries(CHARACTER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        characters.add(character as SoundCharacter);
      }
    }
  }
  
  // Analyze filters
  const activeFilters = filters.filter(f => f.enabled);
  for (const filter of activeFilters) {
    if (filter.cutoffNormalized && filter.cutoff < 0.3) {
      characters.add('dark');
    }
    if (filter.cutoffNormalized && filter.cutoff > 0.8) {
      characters.add('bright');
    }
    if (filter.resonance > 0.5) {
      characters.add('harsh');
    }
    if (filter.drive > 0.3) {
      characters.add('dirty');
    }
  }
  
  // Analyze oscillators
  const activeOscs = oscillators.filter(o => o.enabled);
  for (const osc of activeOscs) {
    if (osc.unison.voices > 2 && osc.unison.spread > 0.5) {
      characters.add('wide');
    }
    if (osc.distortion > 0.3) {
      characters.add('distorted');
    }
  }
  
  // Analyze effects
  const activeEffects = effects.filter(e => e.enabled);
  for (const effect of activeEffects) {
    if (effect.type === 'distortion' && effect.mix > 0.3) {
      characters.add('distorted');
    }
    if (effect.type === 'reverb' && effect.mix > 0.5) {
      characters.add('wide');
    }
    if (effect.type === 'delay') {
      characters.add('evolving');
    }
  }
  
  return Array.from(characters);
}

// ============================================================================
// SURGE CONVERSION
// ============================================================================

/**
 * Map Surge oscillator type to unified type.
 */
function mapSurgeOscType(oscType: number): OscWaveformType {
  const mapping: Record<number, OscWaveformType> = {
    0: 'classic',    // Classic
    1: 'classic',    // Sine
    2: 'wavetable',  // Wavetable
    3: 'noise',      // SH Noise
    4: 'sample',     // Audio Input
    5: 'fm',         // FM3
    6: 'fm',         // FM2
    7: 'wavetable',  // Window
    8: 'wavetable',  // Modern
    9: 'wavetable',  // String
    10: 'wavetable', // Twist
    11: 'wavetable', // Alias
    12: 'fm',        // Phase Mod
  };
  return mapping[oscType] ?? 'wavetable';
}

/**
 * Map Surge filter type to unified type.
 */
function mapSurgeFilterType(filterType: number): FilterType {
  const mapping: Record<number, FilterType> = {
    0: 'off',
    1: 'lp12',
    2: 'lp24',
    3: 'lp24',       // LP Legacy
    4: 'hp12',
    5: 'hp24',
    6: 'bp12',
    7: 'bp24',
    8: 'notch',
    9: 'notch',
    10: 'comb',
    11: 'comb',
    12: 'svf',       // S&H
    13: 'ladder',    // Vintage Ladder
    14: 'svf',       // OB-Xd 12
    15: 'svf',       // OB-Xd 24
    16: 'ladder',    // K35 LP
    17: 'ladder',    // K35 HP
    18: 'diode',     // Diode Ladder
    19: 'lp24',      // Cutoff Warp LP
    20: 'hp24',      // Cutoff Warp HP
    21: 'bp24',      // Cutoff Warp BP
    22: 'notch',     // Cutoff Warp N
    23: 'lp24',      // Resonance Warp LP
    24: 'hp24',      // Resonance Warp HP
    25: 'bp24',      // Resonance Warp BP
    26: 'notch',     // Resonance Warp N
    27: 'svf',       // Tri-Pole
  };
  return mapping[filterType] ?? 'lp24';
}

/**
 * Map Surge LFO shape to unified shape.
 */
function mapSurgeLFOShape(shape: number): LFOShape {
  const mapping: Record<number, LFOShape> = {
    0: 'sine',
    1: 'triangle',
    2: 'square',
    3: 'saw-up',
    4: 'random',
    5: 'sample-hold',
    6: 'custom',     // Envelope
    7: 'custom',     // Step Seq
    8: 'custom',     // MSEG
    9: 'custom',     // Function
  };
  return mapping[shape] ?? 'sine';
}

/**
 * Convert Surge oscillator settings.
 */
function convertSurgeOscillator(osc: OscillatorSettings, index: number): UnifiedOscillator {
  const base = createDefaultOscillator(index);
  
  return {
    ...base,
    enabled: osc.level > 0.01,
    waveformType: mapSurgeOscType(osc.osc_type),
    wavetableId: osc.wavetable_name || null,
    wavetablePosition: osc.wavetable_position,
    octave: Math.round(osc.tune_semitones / 12),
    semitone: Math.round(osc.tune_semitones % 12),
    cents: osc.tune_cents,
    level: osc.level,
    pan: osc.pan,
    phase: osc.phase,
    phaseRandom: osc.phase_randomize,
    unison: {
      voices: osc.unison_voices,
      detune: osc.unison_detune * 100, // Convert to cents
      spread: 0.5, // Default
      blend: osc.unison_blend,
    },
    distortion: osc.distortion,
    fmDepth: osc.fm_depth,
  };
}

/**
 * Convert Surge filter settings.
 */
function convertSurgeFilter(filter: FilterSettings, index: number): UnifiedFilter {
  const base = createDefaultFilter(index);
  
  // Surge cutoff is typically in a different scale
  // Normalize to 0-1 where needed
  const cutoffNorm = Math.max(0, Math.min(1, filter.cutoff / 20000));
  
  return {
    ...base,
    enabled: filter.filter_type !== 0,
    filterType: mapSurgeFilterType(filter.filter_type),
    cutoff: cutoffNorm,
    cutoffNormalized: true,
    resonance: filter.resonance,
    drive: filter.drive,
    keytrack: filter.keytrack,
    envDepth: filter.env_depth,
    mix: filter.mix,
  };
}

/**
 * Convert Surge envelope settings.
 */
function convertSurgeEnvelope(env: EnvelopeSettings): UnifiedEnvelope {
  const id = env.name.includes('amp') ? 'amp' :
             env.name.includes('filter') ? 'filter' :
             env.name.includes('1') ? 'mod1' :
             env.name.includes('2') ? 'mod2' : 'mod1';
             
  return {
    id,
    enabled: true,
    attack: env.attack,
    decay: env.decay,
    sustain: env.sustain,
    release: env.release,
    attackCurve: env.attack_curve,
    decayCurve: env.decay_curve,
    releaseCurve: env.release_curve,
    hold: 0,
    delay: 0,
  };
}

/**
 * Convert Surge LFO settings.
 */
function convertSurgeLFO(lfo: LFOSettings): UnifiedLFO {
  return {
    index: lfo.index,
    enabled: true,
    shape: mapSurgeLFOShape(lfo.waveform),
    customWaveform: null,
    rateHz: lfo.rate,
    tempoSync: lfo.sync,
    tempoDivision: lfo.sync_rate,
    phase: lfo.phase,
    pulseWidth: 0.5,
    smooth: 0,
    triggerMode: 'free',
    delay: lfo.delay,
    fadeIn: lfo.fade_in,
    oneShot: false,
  };
}

/**
 * Convert Surge modulation to unified format.
 */
function convertSurgeModulation(mod: ModulationSettings): ModulationRoute | null {
  // Map Surge source names to unified
  const sourceMap: Record<string, ModSource> = {
    'velocity': 'velocity',
    'keytrack': 'keytrack',
    'aftertouch': 'aftertouch',
    'modwheel': 'mod_wheel',
    'pitchbend': 'pitch_bend',
    'lfo1': 'lfo_1',
    'lfo2': 'lfo_2',
    'lfo3': 'lfo_3',
    'lfo4': 'lfo_4',
    'lfo5': 'lfo_5',
    'lfo6': 'lfo_6',
    'aeg': 'env_amp',
    'feg': 'env_filter',
    'slfo1': 'lfo_1',
    'slfo2': 'lfo_2',
  };
  
  // Map destination patterns
  const destPatterns: Array<[RegExp, ModDestination]> = [
    [/osc_?1.*pitch/i, 'osc1_pitch'],
    [/osc_?1.*level/i, 'osc1_level'],
    [/osc_?2.*pitch/i, 'osc2_pitch'],
    [/osc_?2.*level/i, 'osc2_level'],
    [/filter_?1.*cutoff/i, 'filter1_cutoff'],
    [/filter_?1.*res/i, 'filter1_resonance'],
    [/filter_?2.*cutoff/i, 'filter2_cutoff'],
    [/filter_?2.*res/i, 'filter2_resonance'],
    [/volume|amp|level/i, 'master_volume'],
  ];
  
  const srcLower = mod.source.toLowerCase();
  let source: ModSource | null = null;
  
  for (const [key, val] of Object.entries(sourceMap)) {
    if (srcLower.includes(key)) {
      source = val;
      break;
    }
  }
  
  if (!source) return null;
  
  const destLower = mod.destination.toLowerCase();
  let destination: ModDestination | null = null;
  
  for (const [pattern, dest] of destPatterns) {
    if (pattern.test(destLower)) {
      destination = dest;
      break;
    }
  }
  
  if (!destination) return null;
  
  return {
    source,
    destination,
    amount: mod.amount,
    bipolar: mod.bipolar,
  };
}

/**
 * Convert Surge effect to unified format.
 */
function convertSurgeEffect(effect: EffectSettings): UnifiedEffect {
  const typeMap: Record<string, EffectType> = {
    'off': 'none',
    'delay': 'delay',
    'reverb': 'reverb',
    'chorus': 'chorus',
    'flanger': 'flanger',
    'phaser': 'phaser',
    'eq': 'eq',
    'distortion': 'distortion',
    'conditioner': 'compressor',
    'freqshift': 'none',
    'ringmod': 'none',
    'vocoder': 'filter-fx',
    'rotary': 'chorus',
    'combulator': 'filter-fx',
    'nimbus': 'reverb',
    'treemonster': 'distortion',
  };
  
  return {
    type: typeMap[effect.effect_type.toLowerCase()] ?? 'none',
    enabled: effect.enabled,
    mix: effect.mix,
    params: typeof effect.params === 'string' ? 
      JSON.parse(effect.params) : effect.params,
  };
}

/**
 * Convert a Surge preset to unified format.
 */
export function convertSurgePreset(preset: ParsedPreset): UnifiedPreset {
  const unified = createInitPreset();
  
  // Basic metadata
  unified.id = preset.id;
  unified.name = preset.name;
  unified.source = 'surge';
  unified.originalPath = preset.path;
  unified.author = preset.author;
  unified.description = preset.description;
  unified.tags = preset.tags;
  
  // Convert oscillators
  unified.oscillators = preset.oscillators.map((osc, i) => 
    convertSurgeOscillator(osc, i)
  );
  while (unified.oscillators.length < 3) {
    unified.oscillators.push(createDefaultOscillator(unified.oscillators.length));
  }
  
  // Convert filters
  unified.filters = preset.filters.map((f, i) => 
    convertSurgeFilter(f, i)
  );
  while (unified.filters.length < 2) {
    unified.filters.push(createDefaultFilter(unified.filters.length));
  }
  
  // Convert envelopes
  if (preset.envelopes.length > 0) {
    unified.envelopes = preset.envelopes.map(convertSurgeEnvelope);
  }
  
  // Convert LFOs
  if (preset.lfos.length > 0) {
    unified.lfos = preset.lfos.map(convertSurgeLFO);
  }
  
  // Convert modulations
  unified.modulations = preset.modulations
    .map(convertSurgeModulation)
    .filter((m): m is ModulationRoute => m !== null);
  
  // Convert effects
  unified.effects = preset.effects.map(convertSurgeEffect);
  
  // Global settings
  unified.masterVolume = preset.masterVolume;
  unified.masterPitch = preset.masterTune;
  unified.polyphony = preset.polyphony;
  unified.portamento = preset.portamento;
  
  // Auto-categorize
  unified.category = detectCategory(
    preset.name,
    preset.category,
    unified.oscillators,
    unified.envelopes
  );
  unified.subCategory = detectSubCategory(preset.name, unified.category);
  unified.characters = detectCharacters(
    preset.name,
    unified.oscillators,
    unified.filters,
    unified.effects
  );
  
  return unified;
}

// ============================================================================
// VITAL CONVERSION
// ============================================================================

/**
 * Map Vital filter model to unified type.
 */
function mapVitalFilterType(model: number): FilterType {
  const mapping: Record<number, FilterType> = {
    0: 'svf',        // Analog
    1: 'lp24',       // Dirty
    2: 'ladder',     // Ladder
    3: 'svf',        // Digital
    4: 'diode',      // Diode
    5: 'formant',    // Formant
    6: 'comb',       // Comb
    7: 'phaser',     // Phaser
  };
  return mapping[model] ?? 'lp24';
}

/**
 * Convert Vital oscillator settings.
 */
function convertVitalOscillator(osc: OscillatorSettings, index: number): UnifiedOscillator {
  const base = createDefaultOscillator(index);
  
  return {
    ...base,
    enabled: osc.level > 0.01,
    waveformType: 'wavetable', // Vital is always wavetable
    wavetableId: osc.wavetable_name || null,
    wavetablePosition: osc.wavetable_position,
    octave: Math.round(osc.tune_semitones / 12),
    semitone: Math.round(osc.tune_semitones % 12),
    cents: osc.tune_cents * 100, // Vital uses 0-1
    level: osc.level,
    pan: osc.pan,
    phase: osc.phase,
    phaseRandom: osc.phase_randomize,
    unison: {
      voices: osc.unison_voices,
      detune: osc.unison_detune * 100,
      spread: 0.5,
      blend: osc.unison_blend,
    },
    distortion: osc.distortion,
    distortionType: osc.distortion > 0 ? 'fold' : 'none',
    fmDepth: osc.fm_depth,
  };
}

/**
 * Convert Vital filter settings.
 */
function convertVitalFilter(filter: FilterSettings, index: number): UnifiedFilter {
  const base = createDefaultFilter(index);
  
  // Vital cutoff is in semitones from 8Hz
  // Convert to normalized 0-1
  const cutoffHz = 8 * Math.pow(2, filter.cutoff / 12);
  const cutoffNorm = Math.max(0, Math.min(1, cutoffHz / 20000));
  
  return {
    ...base,
    enabled: filter.filter_type !== 0,
    filterType: mapVitalFilterType(filter.filter_type),
    cutoff: cutoffNorm,
    cutoffNormalized: true,
    resonance: filter.resonance,
    drive: filter.drive,
    keytrack: filter.keytrack,
    mix: filter.mix,
  };
}

/**
 * Convert Vital envelope settings.
 */
function convertVitalEnvelope(env: EnvelopeSettings): UnifiedEnvelope {
  // Vital envelopes: env_1 is typically amp, env_2 is filter
  const id = env.name === 'env_1' ? 'amp' :
             env.name === 'env_2' ? 'filter' :
             env.name === 'env_3' ? 'mod1' :
             env.name === 'env_4' ? 'mod2' : 'mod1';
             
  // Vital envelope times are in a different scale
  // Convert from Vital's representation
  const convertTime = (t: number): number => {
    // Vital uses a power curve for time
    return Math.pow(t, 2) * 10;
  };
  
  return {
    id,
    enabled: true,
    attack: convertTime(env.attack),
    decay: convertTime(env.decay),
    sustain: env.sustain,
    release: convertTime(env.release),
    attackCurve: env.attack_curve,
    decayCurve: env.decay_curve,
    releaseCurve: env.release_curve,
    hold: 0,
    delay: 0,
  };
}

/**
 * Convert Vital LFO settings.
 */
function convertVitalLFO(lfo: LFOSettings): UnifiedLFO {
  const shapeMap: Record<number, LFOShape> = {
    0: 'sine',
    1: 'triangle',
    2: 'saw-up',
    3: 'saw-down',
    4: 'square',
    5: 'random',
  };
  
  return {
    index: lfo.index,
    enabled: true,
    shape: shapeMap[lfo.waveform] ?? 'sine',
    customWaveform: null,
    rateHz: lfo.rate,
    tempoSync: lfo.sync,
    tempoDivision: lfo.sync_rate,
    phase: lfo.phase,
    pulseWidth: 0.5,
    smooth: 0,
    triggerMode: 'free',
    delay: lfo.delay,
    fadeIn: lfo.fade_in,
    oneShot: false,
  };
}

/**
 * Convert Vital modulation to unified format.
 */
function convertVitalModulation(mod: ModulationSettings): ModulationRoute | null {
  // Map Vital source names
  const sourceMap: Record<string, ModSource> = {
    'env_1': 'env_amp',
    'env_2': 'env_filter',
    'env_3': 'env_mod1',
    'env_4': 'env_mod2',
    'env_5': 'env_mod3',
    'env_6': 'env_mod4',
    'lfo_1': 'lfo_1',
    'lfo_2': 'lfo_2',
    'lfo_3': 'lfo_3',
    'lfo_4': 'lfo_4',
    'lfo_5': 'lfo_5',
    'lfo_6': 'lfo_6',
    'lfo_7': 'lfo_7',
    'lfo_8': 'lfo_8',
    'velocity': 'velocity',
    'note': 'keytrack',
    'aftertouch': 'aftertouch',
    'mod_wheel': 'mod_wheel',
    'pitch_wheel': 'pitch_bend',
    'random': 'random',
    'macro_control_1': 'macro_1',
    'macro_control_2': 'macro_2',
    'macro_control_3': 'macro_3',
    'macro_control_4': 'macro_4',
  };
  
  const destMap: Record<string, ModDestination> = {
    'osc_1_level': 'osc1_level',
    'osc_1_pan': 'osc1_pan',
    'osc_1_transpose': 'osc1_pitch',
    'osc_1_wave_frame': 'osc1_wavetable',
    'osc_2_level': 'osc2_level',
    'osc_2_pan': 'osc2_pan',
    'osc_2_transpose': 'osc2_pitch',
    'osc_2_wave_frame': 'osc2_wavetable',
    'osc_3_level': 'osc3_level',
    'osc_3_pan': 'osc3_pan',
    'osc_3_transpose': 'osc3_pitch',
    'osc_3_wave_frame': 'osc3_wavetable',
    'filter_1_cutoff': 'filter1_cutoff',
    'filter_1_resonance': 'filter1_resonance',
    'filter_2_cutoff': 'filter2_cutoff',
    'filter_2_resonance': 'filter2_resonance',
    'volume': 'master_volume',
  };
  
  const source = sourceMap[mod.source];
  const destination = destMap[mod.destination];
  
  if (!source || !destination) return null;
  
  return {
    source,
    destination,
    amount: mod.amount,
    bipolar: mod.bipolar,
  };
}

/**
 * Convert Vital effect to unified format.
 */
function convertVitalEffect(effect: EffectSettings): UnifiedEffect {
  return {
    type: effect.effect_type as EffectType,
    enabled: effect.enabled,
    mix: effect.mix,
    params: typeof effect.params === 'string' ?
      JSON.parse(effect.params) : effect.params,
  };
}

/**
 * Convert a Vital preset to unified format.
 */
export function convertVitalPreset(preset: ParsedPreset): UnifiedPreset {
  const unified = createInitPreset();
  
  // Basic metadata
  unified.id = preset.id;
  unified.name = preset.name;
  unified.source = 'vital';
  unified.originalPath = preset.path;
  unified.author = preset.author;
  unified.description = preset.description;
  unified.tags = preset.tags;
  
  // Convert oscillators
  unified.oscillators = preset.oscillators.map((osc, i) => 
    convertVitalOscillator(osc, i)
  );
  while (unified.oscillators.length < 3) {
    unified.oscillators.push(createDefaultOscillator(unified.oscillators.length));
  }
  
  // Convert filters
  unified.filters = preset.filters.map((f, i) => 
    convertVitalFilter(f, i)
  );
  while (unified.filters.length < 2) {
    unified.filters.push(createDefaultFilter(unified.filters.length));
  }
  
  // Convert envelopes
  if (preset.envelopes.length > 0) {
    unified.envelopes = preset.envelopes.map(convertVitalEnvelope);
  }
  
  // Convert LFOs
  if (preset.lfos.length > 0) {
    unified.lfos = preset.lfos.map(convertVitalLFO);
  }
  
  // Convert modulations
  unified.modulations = preset.modulations
    .map(convertVitalModulation)
    .filter((m): m is ModulationRoute => m !== null);
  
  // Convert effects
  unified.effects = preset.effects.map(convertVitalEffect);
  
  // Global settings
  unified.masterVolume = preset.masterVolume;
  unified.masterPitch = preset.masterTune;
  unified.polyphony = preset.polyphony;
  unified.portamento = preset.portamento;
  
  // Auto-categorize
  unified.category = detectCategory(
    preset.name,
    preset.category,
    unified.oscillators,
    unified.envelopes
  );
  unified.subCategory = detectSubCategory(preset.name, unified.category);
  unified.characters = detectCharacters(
    preset.name,
    unified.oscillators,
    unified.filters,
    unified.effects
  );
  
  return unified;
}

// ============================================================================
// GENERIC CONVERSION
// ============================================================================

/**
 * Convert any parsed preset to unified format.
 */
export function convertPreset(preset: ParsedPreset): UnifiedPreset {
  if (preset.source === 'surge') {
    return convertSurgePreset(preset);
  } else if (preset.source === 'vital') {
    return convertVitalPreset(preset);
  } else {
    // Try to detect and convert
    return convertSurgePreset(preset);
  }
}

/**
 * Batch convert presets.
 */
export function convertPresets(presets: ParsedPreset[]): UnifiedPreset[] {
  return presets.map(convertPreset);
}

/**
 * Group presets by category.
 */
export function groupPresetsByCategory(
  presets: UnifiedPreset[]
): Map<InstrumentCategory, UnifiedPreset[]> {
  const groups = new Map<InstrumentCategory, UnifiedPreset[]>();
  
  for (const preset of presets) {
    const list = groups.get(preset.category) ?? [];
    list.push(preset);
    groups.set(preset.category, list);
  }
  
  return groups;
}

/**
 * Group presets by sub-category.
 */
export function groupPresetsBySubCategory(
  presets: UnifiedPreset[]
): Map<InstrumentSubCategory, UnifiedPreset[]> {
  const groups = new Map<InstrumentSubCategory, UnifiedPreset[]>();
  
  for (const preset of presets) {
    const list = groups.get(preset.subCategory) ?? [];
    list.push(preset);
    groups.set(preset.subCategory, list);
  }
  
  return groups;
}

/**
 * Filter presets by character.
 */
export function filterPresetsByCharacter(
  presets: UnifiedPreset[],
  characters: SoundCharacter[]
): UnifiedPreset[] {
  return presets.filter(preset =>
    characters.some(char => preset.characters.includes(char))
  );
}
