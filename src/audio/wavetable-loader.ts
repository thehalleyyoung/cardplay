/**
 * @fileoverview Wavetable Instrument Loader
 * 
 * Provides comprehensive loading of wavetable presets from the database
 * into the WavetableInstrument. Supports:
 * - Loading presets from SynthAssetDatabase (raw Surge/Vital formats)
 * - Loading presets from InstrumentDatabase (unified format)
 * - Automatic wavetable resolution and loading
 * - Preset conversion and normalization
 * - Batch loading for performance
 * 
 * @module @cardplay/core/audio/wavetable-loader
 */

import {
  SynthAssetDatabase,
  ParsedPreset,
  OscillatorSettings,
  FilterSettings,
  EnvelopeSettings,
  LFOSettings,
  ModulationSettings,
  EffectSettings,
  getPresetWavetables,
} from './synth-asset-db';

import {
  UnifiedPreset,
  UnifiedOscillator,
  UnifiedFilter,
  UnifiedEnvelope,
  UnifiedLFO,
  UnifiedEffect,
  ModulationRoute,
  InstrumentCategory,
  InstrumentSubCategory,
  SoundCharacter,
  createInitPreset,
  createDefaultOscillator,
  createDefaultFilter,
  createDefaultEnvelope,
  createDefaultLFO,
  FilterType,
  LFOShape,
  ModSource,
  ModDestination,
} from './unified-preset';

import { WavetableInstrument } from './wavetable-synth';
import { InstrumentDatabase, getInstrumentDatabase } from './instrument-database';

// ============================================================================
// TYPES
// ============================================================================

/** Wavetable source selection */
export type WavetableSource = 'surge' | 'vital' | 'any';

/** Load options for presets */
export interface PresetLoadOptions {
  /** Whether to load wavetables automatically */
  loadWavetables?: boolean;
  /** Cache wavetables for reuse */
  cacheWavetables?: boolean;
  /** Normalize levels after loading */
  normalizeLevels?: boolean;
  /** Use smooth transitions when changing presets */
  smoothTransition?: boolean;
  /** Transition time in seconds */
  transitionTime?: number;
}

/** Default load options */
export const DEFAULT_LOAD_OPTIONS: PresetLoadOptions = {
  loadWavetables: true,
  cacheWavetables: true,
  normalizeLevels: false,
  smoothTransition: false,
  transitionTime: 0.5,
};

/** Wavetable load result */
export interface WavetableLoadResult {
  success: boolean;
  wavetableId: string;
  wavetableName: string;
  frameCount: number;
  frameSize: number;
  oscillatorIndex: number;
  error?: string;
}

/** Preset load result */
export interface PresetLoadResult {
  success: boolean;
  presetId: string;
  presetName: string;
  wavetableResults: WavetableLoadResult[];
  warnings: string[];
  error?: string;
}

/** Browser preset info */
export interface PresetBrowserInfo {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  author?: string;
  tags: string[];
  source: 'surge' | 'vital';
  hasWavetable: boolean;
  wavetableNames: string[];
}

/** Browser wavetable info */
export interface WavetableBrowserInfo {
  id: string;
  name: string;
  category: string;
  source: 'surge' | 'vital';
  frameCount: number;
  frameSize: number;
  isThirdParty: boolean;
  contributor?: string;
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/** Map raw category to unified category */
const CATEGORY_MAP: Record<string, InstrumentCategory> = {
  // Surge categories
  'bass': 'bass',
  'basses': 'bass',
  'lead': 'lead',
  'leads': 'lead',
  'pad': 'pad',
  'pads': 'pad',
  'key': 'keys',
  'keys': 'keys',
  'keyboard': 'keys',
  'pluck': 'pluck',
  'plucks': 'pluck',
  'arp': 'arp',
  'arps': 'arp',
  'arpeggio': 'arp',
  'sequence': 'arp',
  'sequences': 'arp',
  'seq': 'arp',
  'fx': 'fx',
  'sfx': 'fx',
  'effect': 'fx',
  'effects': 'fx',
  'percussion': 'drum',
  'perc': 'drum',
  'drum': 'drum',
  'drums': 'drum',
  'string': 'strings',
  'strings': 'strings',
  'brass': 'brass',
  'wind': 'brass',
  'woodwind': 'brass',
  'vocal': 'vocal',
  'voice': 'vocal',
  'choir': 'vocal',
  'organ': 'keys',
  'bell': 'pluck',
  'bells': 'pluck',
  'mallet': 'pluck',
  'init': 'other',
  'template': 'other',
  // Vital categories
  'synth': 'lead',
  'sub': 'bass',
  'ambient': 'ambient',
  'texture': 'fx',
  'atmosphere': 'ambient',
  'noise': 'fx',
};

/** Map raw category to subcategory */
const SUBCATEGORY_MAP: Record<string, InstrumentSubCategory> = {
  'analog': 'generic',
  'digital': 'generic',
  'hybrid': 'generic',
  'warm': 'warm-pad',
  'bright': 'bright-pad',
  'dark': 'dark-pad',
  'soft': 'generic',
  'hard': 'generic',
  'clean': 'generic',
  'dirty': 'generic',
  'mono': 'mono-lead',
  'poly': 'poly-lead',
  'short': 'generic',
  'long': 'generic',
  'evolving': 'evolving-pad',
  'static': 'generic',
  'rhythmic': 'sequence',
};

/** Detect category from preset data */
function detectCategory(preset: ParsedPreset): InstrumentCategory {
  const cat = preset.category.toLowerCase();
  
  // Direct mapping
  if (CATEGORY_MAP[cat]) {
    return CATEGORY_MAP[cat];
  }
  
  // Check for keywords in name
  const nameLower = preset.name.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (nameLower.includes(key)) {
      return value;
    }
  }
  
  // Check tags
  for (const tag of preset.tags) {
    const tagLower = tag.toLowerCase();
    if (CATEGORY_MAP[tagLower]) {
      return CATEGORY_MAP[tagLower];
    }
  }
  
  return 'other';
}

/** Detect subcategory from preset data */
function detectSubcategory(preset: ParsedPreset): InstrumentSubCategory {
  const nameLower = preset.name.toLowerCase();
  const catLower = preset.category.toLowerCase();
  
  for (const [key, value] of Object.entries(SUBCATEGORY_MAP)) {
    if (nameLower.includes(key) || catLower.includes(key)) {
      return value;
    }
  }
  
  for (const tag of preset.tags) {
    const tagLower = tag.toLowerCase();
    if (SUBCATEGORY_MAP[tagLower]) {
      return SUBCATEGORY_MAP[tagLower] as InstrumentSubCategory;
    }
  }
  
  return 'generic';
}

/** Detect sound characters from preset data */
function detectCharacters(preset: ParsedPreset): SoundCharacter[] {
  const characters: Set<SoundCharacter> = new Set();
  const nameLower = preset.name.toLowerCase();
  
  // Check for character keywords
  const characterKeywords: Record<string, SoundCharacter[]> = {
    'warm': ['warm'],
    'bright': ['bright'],
    'dark': ['dark'],
    'soft': ['soft'],
    'hard': ['aggressive'],
    'clean': ['clean'],
    'dirty': ['dirty'],
    'analog': ['analog', 'warm'],
    'digital': ['digital', 'clean'],
    'thick': ['thick'],
    'thin': ['thin'],
    'fat': ['thick'],
    'punchy': ['aggressive'],
    'aggressive': ['aggressive'],
    'ambient': ['evolving', 'wide'],
    'evolving': ['evolving'],
    'static': ['static'],
    'wide': ['wide'],
    'stereo': ['wide'],
    'metallic': ['bright'],
    'organic': ['warm'],
    'synthetic': ['digital'],
    'vintage': ['vintage', 'analog', 'warm'],
    'modern': ['modern', 'digital'],
    'classic': ['vintage'],
    'experimental': ['moving'],
    'lo-fi': ['vintage'],
    'lofi': ['vintage'],
    'hi-fi': ['modern', 'clean'],
    'saturated': ['dirty'],
    'distorted': ['distorted', 'aggressive'],
  };
  
  for (const [keyword, chars] of Object.entries(characterKeywords)) {
    if (nameLower.includes(keyword)) {
      chars.forEach(c => characters.add(c));
    }
  }
  
  // Analyze oscillator settings
  for (const osc of preset.oscillators) {
    if (osc.unison_voices > 4) {
      characters.add('thick');
      characters.add('wide');
    }
    if (osc.distortion > 0.3) {
      characters.add('dirty');
    }
  }
  
  // Analyze filter settings
  for (const filter of preset.filters) {
    if (filter.cutoff < 500) {
      characters.add('dark');
    }
    if (filter.cutoff > 8000) {
      characters.add('bright');
    }
    if (filter.resonance > 0.7) {
      characters.add('aggressive');
    }
  }
  
  return Array.from(characters);
}

// ============================================================================
// FILTER TYPE MAPPING
// ============================================================================

const FILTER_TYPE_MAP: Record<string, FilterType> = {
  // Surge filter types
  'lp12': 'lp12',
  'lp24': 'lp24',
  'lp48': 'lp48',
  'hp12': 'hp12',
  'hp24': 'hp24',
  'hp48': 'hp48',
  'bp12': 'bp12',
  'bp24': 'bp24',
  'notch': 'notch',
  'peak': 'peak',
  'comb': 'comb',
  'ladder': 'ladder',
  'diode': 'diode',
  'svf': 'svf',
  'formant': 'formant',
  'phaser': 'phaser',
  // Numeric mappings (Surge)
  '0': 'lp12',
  '1': 'lp24',
  '2': 'hp12',
  '3': 'hp24',
  '4': 'bp12',
  '5': 'bp24',
  '6': 'notch',
  // Common aliases
  'lowpass': 'lp24',
  'highpass': 'hp24',
  'bandpass': 'bp24',
  'low': 'lp24',
  'high': 'hp24',
  'band': 'bp24',
};

function mapFilterType(type: string | number): FilterType {
  const key = String(type).toLowerCase();
  return FILTER_TYPE_MAP[key] || 'lp24';
}

// ============================================================================
// LFO SHAPE MAPPING
// ============================================================================

const LFO_SHAPE_MAP: Record<string, LFOShape> = {
  'sine': 'sine',
  'triangle': 'triangle',
  'tri': 'triangle',
  'saw': 'saw-up',
  'saw-up': 'saw-up',
  'saw-down': 'saw-down',
  'sawtooth': 'saw-up',
  'square': 'square',
  'pulse': 'pulse',
  'random': 'random',
  'noise': 'random',
  'sample-hold': 'sample-hold',
  'sample_hold': 'sample-hold',
  's&h': 'sample-hold',
  'sh': 'sample-hold',
  // Numeric mappings (Surge)
  '0': 'sine',
  '1': 'triangle',
  '2': 'square',
  '3': 'saw-up',
  '4': 'saw-down',
  '5': 'sample-hold',
  '6': 'random',
};

function mapLfoShape(shape: string | number): LFOShape {
  const key = String(shape).toLowerCase();
  return LFO_SHAPE_MAP[key] || 'sine';
}

// ============================================================================
// PRESET CONVERSION
// ============================================================================

/**
 * Convert ParsedPreset from SynthAssetDatabase to UnifiedPreset
 */
export function convertParsedPresetToUnified(preset: ParsedPreset): UnifiedPreset {
  const unified = createInitPreset();
  
  // Basic info
  unified.name = preset.name;
  unified.author = preset.author || null;
  unified.description = preset.description || null;
  unified.category = detectCategory(preset);
  unified.subCategory = detectSubcategory(preset);
  unified.characters = detectCharacters(preset);
  unified.tags = preset.tags;
  
  // Source info
  unified.source = preset.source;
  unified.originalPath = preset.path;
  unified.id = preset.id;
  
  // Oscillators
  unified.oscillators = preset.oscillators.map((osc, idx) => 
    convertOscillator(osc, idx)
  );
  
  // Ensure at least one oscillator
  while (unified.oscillators.length < 1) {
    unified.oscillators.push(createDefaultOscillator(unified.oscillators.length));
  }
  
  // Filters
  unified.filters = preset.filters.map((flt, idx) =>
    convertFilter(flt, idx)
  );
  
  // Ensure at least one filter
  while (unified.filters.length < 1) {
    unified.filters.push(createDefaultFilter(unified.filters.length));
  }
  
  // Envelopes
  const envTypes = ['amp', 'filter', 'mod1', 'mod2', 'mod3', 'mod4'] as const;
  unified.envelopes = preset.envelopes.map((env, idx) =>
    convertEnvelope(env, envTypes[idx] || 'mod1')
  );
  
  // Ensure amp and filter envelopes
  while (unified.envelopes.length < 2) {
    unified.envelopes.push(createDefaultEnvelope(envTypes[unified.envelopes.length] || 'mod1'));
  }
  
  // LFOs
  unified.lfos = preset.lfos.map((lfo, idx) =>
    convertLfo(lfo, idx)
  );
  
  // Ensure at least one LFO
  while (unified.lfos.length < 1) {
    unified.lfos.push(createDefaultLFO(unified.lfos.length));
  }
  
  // Modulations
  unified.modulations = preset.modulations.map(convertModulation);
  
  // Effects
  unified.effects = preset.effects.map(convertEffect);
  
  // Master settings
  unified.masterVolume = preset.masterVolume;
  unified.masterPitch = preset.masterTune ?? 0;
  unified.polyphony = preset.polyphony;
  unified.portamento = preset.portamento;
  
  return unified;
}

function convertOscillator(osc: OscillatorSettings, index: number): UnifiedOscillator {
  const defaultOsc = createDefaultOscillator(index);
  
  return {
    ...defaultOsc,
    enabled: true,
    wavetableId: osc.wavetable_name || null,
    wavetablePosition: osc.wavetable_position ?? 0.5,
    semitone: osc.tune_semitones ?? 0,
    cents: osc.tune_cents ?? 0,
    pan: osc.pan ?? 0,
    level: osc.level ?? 0.7,
    phase: osc.phase ?? 0,
    phaseRandom: osc.phase_randomize ?? 0,
    unison: {
      voices: osc.unison_voices ?? 1,
      detune: (osc.unison_detune ?? 0.1) * 100, // Convert to cents
      blend: osc.unison_blend ?? 0.5,
      spread: 1.0,
    },
    fmDepth: osc.fm_depth ?? 0,
    distortion: osc.distortion ?? 0,
  };
}

function convertFilter(flt: FilterSettings, index: number): UnifiedFilter {
  const defaultFlt = createDefaultFilter(index);
  
  return {
    ...defaultFlt,
    enabled: true,
    filterType: mapFilterType(flt.filter_type_name || flt.filter_type),
    cutoff: flt.cutoff ?? 1000,
    resonance: flt.resonance ?? 0,
    keytrack: flt.keytrack ?? 0,
    drive: flt.drive ?? 0,
    mix: flt.mix ?? 1,
    envDepth: flt.env_depth ?? 0,
  };
}

function convertEnvelope(env: EnvelopeSettings, type: 'amp' | 'filter' | 'mod1' | 'mod2' | 'mod3' | 'mod4'): UnifiedEnvelope {
  const defaultEnv = createDefaultEnvelope(type);
  
  return {
    ...defaultEnv,
    attack: env.attack ?? 0.01,
    attackCurve: env.attack_curve ?? 0,
    decay: env.decay ?? 0.2,
    decayCurve: env.decay_curve ?? 0,
    sustain: env.sustain ?? 0.8,
    release: env.release ?? 0.3,
    releaseCurve: env.release_curve ?? 0,
  };
}

function convertLfo(lfo: LFOSettings, index: number): UnifiedLFO {
  const defaultLfo = createDefaultLFO(index);
  
  return {
    ...defaultLfo,
    enabled: true,
    shape: mapLfoShape(lfo.waveform_name || lfo.waveform),
    rateHz: lfo.rate ?? 1,
    tempoSync: lfo.sync ?? false,
    tempoDivision: lfo.sync_rate || '1/4',
    phase: lfo.phase ?? 0,
    delay: lfo.delay ?? 0,
    fadeIn: lfo.fade_in ?? 0,
    triggerMode: 'free',
  };
}

function convertModulation(mod: ModulationSettings): ModulationRoute {
  // Map source strings to ModSource type
  const sourceMap: Record<string, ModSource> = {
    'env_amp': 'env_amp',
    'env_filter': 'env_filter',
    'env1': 'env_amp',
    'env2': 'env_filter',
    'env3': 'env_mod1',
    'env4': 'env_mod2',
    'lfo1': 'lfo_1',
    'lfo2': 'lfo_2',
    'lfo3': 'lfo_3',
    'lfo4': 'lfo_4',
    'velocity': 'velocity',
    'keytrack': 'keytrack',
    'aftertouch': 'aftertouch',
    'mod_wheel': 'mod_wheel',
    'pitch_bend': 'pitch_bend',
    'macro1': 'macro_1',
    'macro2': 'macro_2',
    'macro3': 'macro_3',
    'macro4': 'macro_4',
  };
  
  // Map destination strings to ModDestination type
  const destMap: Record<string, ModDestination> = {
    'osc1_level': 'osc1_level',
    'osc1_pitch': 'osc1_pitch',
    'osc1_wavetable': 'osc1_wavetable',
    'osc1_pan': 'osc1_pan',
    'osc2_level': 'osc2_level',
    'osc2_pitch': 'osc2_pitch',
    'osc2_wavetable': 'osc2_wavetable',
    'osc2_pan': 'osc2_pan',
    'filter1_cutoff': 'filter1_cutoff',
    'filter1_resonance': 'filter1_resonance',
    'filter2_cutoff': 'filter2_cutoff',
    'filter2_resonance': 'filter2_resonance',
    'cutoff': 'filter1_cutoff',
    'resonance': 'filter1_resonance',
    'volume': 'master_volume',
    'pan': 'master_pan',
    'pitch': 'master_pitch',
  };
  
  const source = sourceMap[mod.source.toLowerCase()] || 'env_amp';
  const destination = destMap[mod.destination.toLowerCase()] || 'osc1_level';
  
  return {
    source,
    destination,
    amount: mod.amount,
    bipolar: mod.bipolar,
  };
}

function convertEffect(fx: EffectSettings): UnifiedEffect {
  return {
    type: fx.effect_type as any,
    enabled: fx.enabled,
    mix: fx.mix,
    params: fx.params as Record<string, number>,
  };
}

// ============================================================================
// WAVETABLE INSTRUMENT LOADER
// ============================================================================

/**
 * Loader for WavetableInstrument that integrates with the preset database
 */
export class WavetableInstrumentLoader {
  private instrument: WavetableInstrument;
  private synthDb: SynthAssetDatabase | null = null;
  private instrumentDb: InstrumentDatabase | null = null;
  private wavetableCache: Map<string, Float32Array[]> = new Map();
  private options: PresetLoadOptions;
  
  constructor(instrument: WavetableInstrument, options?: Partial<PresetLoadOptions>) {
    this.instrument = instrument;
    this.options = { ...DEFAULT_LOAD_OPTIONS, ...options };
  }
  
  // ==========================================================================
  // DATABASE CONNECTION
  // ==========================================================================
  
  /**
   * Connect to SynthAssetDatabase (raw Surge/Vital presets)
   */
  connectSynthDatabase(dbPath: string): void {
    this.synthDb = new SynthAssetDatabase(dbPath);
  }
  
  /**
   * Connect to InstrumentDatabase (unified presets)
   */
  connectInstrumentDatabase(dbPath?: string): void {
    this.instrumentDb = dbPath 
      ? new InstrumentDatabase(dbPath)
      : getInstrumentDatabase();
    this.instrument.connectDatabase(this.instrumentDb);
  }
  
  /**
   * Disconnect databases
   */
  disconnect(): void {
    if (this.synthDb) {
      this.synthDb.close();
      this.synthDb = null;
    }
    this.instrument.disconnectDatabase();
    this.instrumentDb = null;
  }
  
  // ==========================================================================
  // PRESET LOADING FROM SYNTH DATABASE
  // ==========================================================================
  
  /**
   * Load a preset from SynthAssetDatabase by ID
   */
  loadPresetFromSynthDb(presetId: string, options?: Partial<PresetLoadOptions>): PresetLoadResult {
    const opts = { ...this.options, ...options };
    const result: PresetLoadResult = {
      success: false,
      presetId,
      presetName: '',
      wavetableResults: [],
      warnings: [],
    };
    
    if (!this.synthDb) {
      result.error = 'SynthAssetDatabase not connected';
      return result;
    }
    
    // Get parsed preset
    const parsedPreset = this.synthDb.getParsedPreset(presetId);
    if (!parsedPreset) {
      result.error = `Preset not found: ${presetId}`;
      return result;
    }
    
    result.presetName = parsedPreset.name;
    
    // Convert to unified format
    const unifiedPreset = convertParsedPresetToUnified(parsedPreset);
    
    // Load preset into instrument
    this.instrument.loadPreset(unifiedPreset);
    
    // Load wavetables if enabled
    if (opts.loadWavetables) {
      for (let oscIdx = 0; oscIdx < parsedPreset.oscillators.length; oscIdx++) {
        const osc = parsedPreset.oscillators[oscIdx];
        if (osc?.wavetable_name) {
          const wtResult = this.loadWavetableByName(osc.wavetable_name, oscIdx, opts);
          result.wavetableResults.push(wtResult);
          
          if (!wtResult.success) {
            result.warnings.push(`Failed to load wavetable "${osc.wavetable_name}" for oscillator ${oscIdx + 1}`);
          }
        }
      }
    }
    
    result.success = true;
    return result;
  }
  
  /**
   * Load a wavetable by name from SynthAssetDatabase
   */
  loadWavetableByName(
    name: string, 
    oscIndex: number,
    options?: Partial<PresetLoadOptions>
  ): WavetableLoadResult {
    const opts = { ...this.options, ...options };
    const result: WavetableLoadResult = {
      success: false,
      wavetableId: '',
      wavetableName: name,
      frameCount: 0,
      frameSize: 0,
      oscillatorIndex: oscIndex,
    };
    
    if (!this.synthDb) {
      result.error = 'SynthAssetDatabase not connected';
      return result;
    }
    
    // Search for wavetable by name
    const wavetables = this.synthDb.searchWavetables(name);
    if (wavetables.length === 0) {
      result.error = `Wavetable not found: ${name}`;
      return result;
    }
    
    // Use exact match if available, otherwise first result
    const wt = wavetables.find(w => w.name.toLowerCase() === name.toLowerCase()) || wavetables[0];
    if (!wt) {
      result.error = `Wavetable not found: ${name}`;
      return result;
    }
    
    result.wavetableId = wt.id;
    result.wavetableName = wt.name;
    result.frameCount = wt.frame_count;
    result.frameSize = wt.frame_size;
    
    // Check cache
    let frames: Float32Array[] | undefined;
    if (opts.cacheWavetables && this.wavetableCache.has(wt.id)) {
      frames = this.wavetableCache.get(wt.id)!;
    } else {
      // Load wavetable data
      const data = this.synthDb.getWavetableData(wt.id);
      if (!data) {
        result.error = `Failed to load wavetable data: ${name}`;
        return result;
      }
      
      // Split into frames
      frames = [];
      for (let i = 0; i < wt.frame_count; i++) {
        const start = i * wt.frame_size;
        frames.push(data.slice(start, start + wt.frame_size));
      }
      
      // Cache if enabled
      if (opts.cacheWavetables) {
        this.wavetableCache.set(wt.id, frames);
      }
    }
    
    // Set wavetable on instrument
    this.instrument.setWavetable(oscIndex, frames);
    
    result.success = true;
    return result;
  }
  
  /**
   * Load a wavetable by ID from SynthAssetDatabase
   */
  loadWavetableById(
    wavetableId: string,
    oscIndex: number,
    options?: Partial<PresetLoadOptions>
  ): WavetableLoadResult {
    const opts = { ...this.options, ...options };
    const result: WavetableLoadResult = {
      success: false,
      wavetableId,
      wavetableName: '',
      frameCount: 0,
      frameSize: 0,
      oscillatorIndex: oscIndex,
    };
    
    if (!this.synthDb) {
      result.error = 'SynthAssetDatabase not connected';
      return result;
    }
    
    const wt = this.synthDb.getWavetableById(wavetableId);
    if (!wt) {
      result.error = `Wavetable not found: ${wavetableId}`;
      return result;
    }
    
    result.wavetableName = wt.name;
    result.frameCount = wt.frame_count;
    result.frameSize = wt.frame_size;
    
    // Check cache
    let frames: Float32Array[] | undefined;
    if (opts.cacheWavetables && this.wavetableCache.has(wavetableId)) {
      frames = this.wavetableCache.get(wavetableId)!;
    } else {
      const data = this.synthDb.getWavetableData(wavetableId);
      if (!data) {
        result.error = `Failed to load wavetable data: ${wt.name}`;
        return result;
      }
      
      frames = [];
      for (let i = 0; i < wt.frame_count; i++) {
        const start = i * wt.frame_size;
        frames.push(data.slice(start, start + wt.frame_size));
      }
      
      if (opts.cacheWavetables) {
        this.wavetableCache.set(wavetableId, frames);
      }
    }
    
    this.instrument.setWavetable(oscIndex, frames);
    
    result.success = true;
    return result;
  }
  
  // ==========================================================================
  // PRESET LOADING FROM INSTRUMENT DATABASE
  // ==========================================================================
  
  /**
   * Load a preset from InstrumentDatabase by ID
   */
  loadPresetFromInstrumentDb(presetId: string): PresetLoadResult {
    const result: PresetLoadResult = {
      success: false,
      presetId,
      presetName: '',
      wavetableResults: [],
      warnings: [],
    };
    
    if (!this.instrumentDb) {
      result.error = 'InstrumentDatabase not connected';
      return result;
    }
    
    const success = this.instrument.loadPresetById(presetId);
    if (!success) {
      result.error = `Failed to load preset: ${presetId}`;
      return result;
    }
    
    const preset = this.instrument.getCurrentPreset();
    result.presetName = preset?.name || presetId;
    result.success = true;
    
    return result;
  }
  
  // ==========================================================================
  // BROWSING
  // ==========================================================================
  
  /**
   * Get all presets for browsing from SynthAssetDatabase
   */
  browsePresets(source?: WavetableSource): PresetBrowserInfo[] {
    if (!this.synthDb) return [];
    
    let presets: any[];
    if (source === 'surge') {
      presets = this.synthDb.getPresetsBySource('surge');
    } else if (source === 'vital') {
      presets = this.synthDb.getPresetsBySource('vital');
    } else {
      presets = this.synthDb.getAllPresets();
    }
    
    return presets.map(p => {
      const parsed = this.synthDb!.getParsedPreset(p.id);
      const wtNames = parsed ? getPresetWavetables(parsed) : [];
      
      const info: PresetBrowserInfo = {
        id: p.id,
        name: p.name,
        category: p.category,
        tags: parsed?.tags || [],
        source: p.source as 'surge' | 'vital',
        hasWavetable: wtNames.length > 0,
        wavetableNames: wtNames,
      };
      if (p.author) info.author = p.author;
      return info;
    });
  }
  
  /**
   * Get presets by category
   */
  browsePresetsByCategory(category: string): PresetBrowserInfo[] {
    if (!this.synthDb) return [];
    
    const presets = this.synthDb.getPresetsByCategory(category);
    return presets.map(p => {
      const parsed = this.synthDb!.getParsedPreset(p.id);
      const wtNames = parsed ? getPresetWavetables(parsed) : [];
      
      const info: PresetBrowserInfo = {
        id: p.id,
        name: p.name,
        category: p.category,
        tags: parsed?.tags || [],
        source: p.source as 'surge' | 'vital',
        hasWavetable: wtNames.length > 0,
        wavetableNames: wtNames,
      };
      if (p.author) info.author = p.author;
      return info;
    });
  }
  
  /**
   * Search presets
   */
  searchPresets(query: string): PresetBrowserInfo[] {
    if (!this.synthDb) return [];
    
    const presets = this.synthDb.searchPresets(query);
    return presets.map(p => {
      const parsed = this.synthDb!.getParsedPreset(p.id);
      const wtNames = parsed ? getPresetWavetables(parsed) : [];
      
      const info: PresetBrowserInfo = {
        id: p.id,
        name: p.name,
        category: p.category,
        tags: parsed?.tags || [],
        source: p.source as 'surge' | 'vital',
        hasWavetable: wtNames.length > 0,
        wavetableNames: wtNames,
      };
      if (p.author) info.author = p.author;
      return info;
    });
  }
  
  /**
   * Get all wavetables for browsing
   */
  browseWavetables(source?: WavetableSource): WavetableBrowserInfo[] {
    if (!this.synthDb) return [];
    
    let wavetables: any[];
    if (source === 'surge') {
      wavetables = this.synthDb.getWavetablesBySource('surge');
    } else if (source === 'vital') {
      wavetables = this.synthDb.getWavetablesBySource('vital');
    } else {
      wavetables = this.synthDb.getAllWavetables();
    }
    
    return wavetables.map(wt => {
      const info: WavetableBrowserInfo = {
        id: wt.id,
        name: wt.name,
        category: wt.category,
        source: wt.source as 'surge' | 'vital',
        frameCount: wt.frame_count,
        frameSize: wt.frame_size,
        isThirdParty: Boolean(wt.is_third_party),
      };
      if (wt.contributor) info.contributor = wt.contributor;
      return info;
    });
  }
  
  /**
   * Get wavetables by category
   */
  browseWavetablesByCategory(category: string): WavetableBrowserInfo[] {
    if (!this.synthDb) return [];
    
    const wavetables = this.synthDb.getWavetablesByCategory(category);
    return wavetables.map(wt => {
      const info: WavetableBrowserInfo = {
        id: wt.id,
        name: wt.name,
        category: wt.category,
        source: wt.source as 'surge' | 'vital',
        frameCount: wt.frame_count,
        frameSize: wt.frame_size,
        isThirdParty: Boolean(wt.is_third_party),
      };
      if (wt.contributor) info.contributor = wt.contributor;
      return info;
    });
  }
  
  /**
   * Search wavetables
   */
  searchWavetables(query: string): WavetableBrowserInfo[] {
    if (!this.synthDb) return [];
    
    const wavetables = this.synthDb.searchWavetables(query);
    return wavetables.map(wt => {
      const info: WavetableBrowserInfo = {
        id: wt.id,
        name: wt.name,
        category: wt.category,
        source: wt.source as 'surge' | 'vital',
        frameCount: wt.frame_count,
        frameSize: wt.frame_size,
        isThirdParty: Boolean(wt.is_third_party),
      };
      if (wt.contributor) info.contributor = wt.contributor;
      return info;
    });
  }
  
  /**
   * Get preset categories
   */
  getPresetCategories(): string[] {
    if (!this.synthDb) return [];
    return this.synthDb.getPresetCategories();
  }
  
  /**
   * Get wavetable categories
   */
  getWavetableCategories(): string[] {
    if (!this.synthDb) return [];
    return this.synthDb.getWavetableCategories();
  }
  
  /**
   * Get database statistics
   */
  getStats(): { 
    totalWavetables: number; 
    totalPresets: number;
    cachedWavetables: number;
  } {
    const dbStats = this.synthDb?.getStats();
    return {
      totalWavetables: dbStats?.totalWavetables ?? 0,
      totalPresets: dbStats?.totalPresets ?? 0,
      cachedWavetables: this.wavetableCache.size,
    };
  }
  
  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================
  
  /**
   * Clear wavetable cache
   */
  clearCache(): void {
    this.wavetableCache.clear();
  }
  
  /**
   * Preload wavetables into cache
   */
  preloadWavetables(wavetableIds: string[]): void {
    if (!this.synthDb) return;
    
    for (const id of wavetableIds) {
      if (this.wavetableCache.has(id)) continue;
      
      const wt = this.synthDb.getWavetableById(id);
      if (!wt) continue;
      
      const data = this.synthDb.getWavetableData(id);
      if (!data) continue;
      
      const frames: Float32Array[] = [];
      for (let i = 0; i < wt.frame_count; i++) {
        const start = i * wt.frame_size;
        frames.push(data.slice(start, start + wt.frame_size));
      }
      
      this.wavetableCache.set(id, frames);
    }
  }
  
  /**
   * Get cache size in bytes
   */
  getCacheSize(): number {
    let size = 0;
    for (const frames of this.wavetableCache.values()) {
      for (const frame of frames) {
        size += frame.byteLength;
      }
    }
    return size;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a WavetableInstrumentLoader
 */
export function createWavetableLoader(
  instrument: WavetableInstrument,
  options?: Partial<PresetLoadOptions>
): WavetableInstrumentLoader {
  return new WavetableInstrumentLoader(instrument, options);
}

/**
 * Create a fully configured WavetableInstrument with loader
 */
export function createLoadedWavetableInstrument(
  sampleRate: number,
  synthDbPath: string,
  options?: {
    maxVoices?: number;
    loadOptions?: Partial<PresetLoadOptions>;
  }
): { instrument: WavetableInstrument; loader: WavetableInstrumentLoader } {
  const instrument = new WavetableInstrument(sampleRate, options?.maxVoices ?? 32);
  const loader = new WavetableInstrumentLoader(instrument, options?.loadOptions);
  loader.connectSynthDatabase(synthDbPath);
  return { instrument, loader };
}

/**
 * Quick load a preset by ID
 */
export async function quickLoadPreset(
  synthDbPath: string,
  presetId: string,
  sampleRate = 44100
): Promise<{ instrument: WavetableInstrument; result: PresetLoadResult }> {
  const { instrument, loader } = createLoadedWavetableInstrument(sampleRate, synthDbPath);
  const result = loader.loadPresetFromSynthDb(presetId);
  return { instrument, result };
}
