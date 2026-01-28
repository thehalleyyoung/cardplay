/**
 * @fileoverview Sampler Preset & Library System
 * 
 * Implements comprehensive preset management including:
 * - Preset format (.csp - CardPlay Sampler Preset)
 * - Preset browser and organization
 * - Factory presets
 * - User preset management
 * - Preset morphing and interpolation
 * - Library management and indexing
 * 
 * @module @cardplay/core/audio/sampler-preset
 */

// ============================================================================
// PRESET FORMAT TYPES
// ============================================================================

/** Sampler preset file format version */
export const PRESET_FORMAT_VERSION = '1.0.0';

/** Preset file extension */
export const PRESET_FILE_EXTENSION = '.csp';

/** Multi-sample file extension */
export const MULTISAMPLE_FILE_EXTENSION = '.csm';

/** Preset category */
export type PresetCategory =
  | 'keys'
  | 'piano'
  | 'organ'
  | 'guitar'
  | 'bass'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'synth'
  | 'pad'
  | 'lead'
  | 'pluck'
  | 'percussion'
  | 'drums'
  | 'fx'
  | 'vocal'
  | 'ethnic'
  | 'orchestral'
  | 'texture'
  | 'other';

/** Preset tag */
export type PresetTag =
  | 'acoustic'
  | 'electric'
  | 'analog'
  | 'digital'
  | 'vintage'
  | 'modern'
  | 'warm'
  | 'bright'
  | 'dark'
  | 'soft'
  | 'aggressive'
  | 'ambient'
  | 'atmospheric'
  | 'percussive'
  | 'sustained'
  | 'evolving'
  | 'simple'
  | 'complex'
  | 'layered'
  | 'mono'
  | 'stereo'
  | 'loop'
  | 'oneshot'
  | 'velocity'
  | 'roundrobin';

/** Sample reference in preset */
export interface PresetSampleReference {
  /** Unique sample ID */
  id: string;
  /** Original file path (relative to preset or absolute) */
  path: string;
  /** Sample checksum for verification */
  checksum?: string;
  /** Embedded sample data (base64) - for self-contained presets */
  embedded?: string;
  /** Sample metadata cache */
  metadata?: {
    sampleRate: number;
    channels: number;
    bitDepth: number;
    duration: number;
    loopStart?: number;
    loopEnd?: number;
    rootKey?: number;
  };
}

/** Zone configuration in preset */
export interface PresetZone {
  id: string;
  name: string;
  sampleId: string;
  keyRangeLow: number;
  keyRangeHigh: number;
  velocityRangeLow: number;
  velocityRangeHigh: number;
  rootKey: number;
  fineTune: number;
  gain: number;
  pan: number;
  playMode: 'normal' | 'reverse' | 'pingpong' | 'loop' | 'loop_release';
  loopStart?: number;
  loopEnd?: number;
  loopCrossfade?: number;
  startOffset?: number;
  endOffset?: number;
  pitchKeytrack: number;
  velocityToVolume: number;
  velocityToFilter: number;
  group: number;
  output: number;
  triggerMode: 'attack' | 'release' | 'first' | 'legato';
  exclusiveGroup?: number;
}

/** Envelope configuration in preset */
export interface PresetEnvelope {
  delay: number;
  attack: number;
  hold: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve: number;
  decayCurve: number;
  releaseCurve: number;
}

/** LFO configuration in preset */
export interface PresetLfo {
  enabled: boolean;
  waveform: 'sine' | 'triangle' | 'saw' | 'square' | 'random' | 'sample_hold';
  rate: number;
  tempoSync: boolean;
  syncDivision: string;
  delay: number;
  fade: number;
  phase: number;
  bipolar: boolean;
}

/** Filter configuration in preset */
export interface PresetFilter {
  enabled: boolean;
  type: string;
  cutoff: number;
  resonance: number;
  drive: number;
  keytrack: number;
  envDepth: number;
  lfoDepth: number;
}

/** Modulation routing in preset */
export interface PresetModulation {
  source: string;
  destination: string;
  amount: number;
  curve: number;
}

/** Effect slot in preset */
export interface PresetEffect {
  type: string;
  enabled: boolean;
  mix: number;
  params: Record<string, number>;
}

/** Voice settings in preset */
export interface PresetVoiceSettings {
  polyphony: number;
  voiceMode: 'poly' | 'mono' | 'legato' | 'unison';
  unisonVoices: number;
  unisonDetune: number;
  unisonSpread: number;
  portamentoTime: number;
  portamentoMode: 'always' | 'legato' | 'off';
  pitchBendRange: number;
  velocityCurve: number;
}

/** Main preset data structure */
export interface SamplerPreset {
  /** Format version */
  version: string;
  
  /** Preset metadata */
  metadata: {
    name: string;
    author: string;
    description: string;
    category: PresetCategory;
    tags: PresetTag[];
    rating?: number;
    dateCreated: string;
    dateModified: string;
    previewNote?: number;
    previewVelocity?: number;
  };
  
  /** Sample references */
  samples: PresetSampleReference[];
  
  /** Zone configurations */
  zones: PresetZone[];
  
  /** Amp envelope */
  ampEnvelope: PresetEnvelope;
  
  /** Filter envelope */
  filterEnvelope: PresetEnvelope;
  
  /** Pitch envelope */
  pitchEnvelope: PresetEnvelope;
  
  /** Modulation envelopes */
  modEnvelopes: PresetEnvelope[];
  
  /** LFO configurations */
  lfos: PresetLfo[];
  
  /** Filter configurations */
  filter1: PresetFilter;
  filter2: PresetFilter;
  filterRouting: 'serial' | 'parallel' | 'morph';
  filterMorphPosition: number;
  
  /** Modulation matrix */
  modulations: PresetModulation[];
  
  /** Effects chain */
  effects: PresetEffect[];
  
  /** Voice settings */
  voiceSettings: PresetVoiceSettings;
  
  /** Master output */
  masterOutput: {
    volume: number;
    pan: number;
    width: number;
  };
  
  /** Custom data (for extensions) */
  custom?: Record<string, unknown>;
}

// ============================================================================
// DEFAULT PRESET VALUES
// ============================================================================

/** Default envelope */
export const DEFAULT_PRESET_ENVELOPE: PresetEnvelope = {
  delay: 0,
  attack: 0.005,
  hold: 0,
  decay: 0.5,
  sustain: 0.7,
  release: 0.3,
  attackCurve: 0,
  decayCurve: 0,
  releaseCurve: 0,
};

/** Default LFO */
export const DEFAULT_PRESET_LFO: PresetLfo = {
  enabled: false,
  waveform: 'sine',
  rate: 1,
  tempoSync: false,
  syncDivision: '1/4',
  delay: 0,
  fade: 0,
  phase: 0,
  bipolar: true,
};

/** Default filter */
export const DEFAULT_PRESET_FILTER: PresetFilter = {
  enabled: true,
  type: 'lp24',
  cutoff: 10000,
  resonance: 0,
  drive: 0,
  keytrack: 0,
  envDepth: 0,
  lfoDepth: 0,
};

/** Default voice settings */
export const DEFAULT_VOICE_SETTINGS: PresetVoiceSettings = {
  polyphony: 64,
  voiceMode: 'poly',
  unisonVoices: 1,
  unisonDetune: 0.1,
  unisonSpread: 0.5,
  portamentoTime: 0,
  portamentoMode: 'off',
  pitchBendRange: 2,
  velocityCurve: 1,
};

// ============================================================================
// PRESET MANAGER
// ============================================================================

/** Preset manager options */
export interface PresetManagerOptions {
  userPresetsPath?: string;
  factoryPresetsPath?: string;
  maxRecentPresets?: number;
  autoSaveInterval?: number;
}

/** Preset search options */
export interface PresetSearchOptions {
  query?: string;
  categories?: PresetCategory[];
  tags?: PresetTag[];
  author?: string;
  favorites?: boolean;
  rating?: number;
  sortBy?: 'name' | 'date' | 'rating' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/** Preset search result */
export interface PresetSearchResult {
  id: string;
  name: string;
  path: string;
  category: PresetCategory;
  tags: PresetTag[];
  author: string;
  rating?: number;
  dateModified: string;
  isFavorite: boolean;
  isFactory: boolean;
}

/**
 * Sampler Preset Manager
 */
export class SamplerPresetManager {
  private options: Required<PresetManagerOptions>;
  private presetIndex: Map<string, PresetSearchResult> = new Map();
  private recentPresets: string[] = [];
  private favoritePresets: Set<string> = new Set();
  private currentPreset: SamplerPreset | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _currentPresetPath: string | null = null; // TODO: implement getCurrentPresetPath()
  private isDirty = false;
  
  constructor(options?: PresetManagerOptions) {
    this.options = {
      userPresetsPath: 'user/presets',
      factoryPresetsPath: 'factory/presets',
      maxRecentPresets: 20,
      autoSaveInterval: 60000,
      ...options,
    };
    
    // Mark intentionally unused members (for future implementation)
    void this._currentPresetPath;
  }
  
  /**
   * Initialize preset manager
   */
  async initialize(): Promise<void> {
    // Load preset index
    await this.rebuildIndex();
    
    // Load user preferences (favorites, recent)
    await this.loadUserPreferences();
  }
  
  /**
   * Rebuild preset index
   */
  async rebuildIndex(): Promise<void> {
    this.presetIndex.clear();
    
    // In a real implementation, this would scan the file system
    // For now, we'll add factory presets programmatically
    const factoryPresets = this.getFactoryPresets();
    
    for (const preset of factoryPresets) {
      const id = this.generatePresetId(preset.metadata.name);
      this.presetIndex.set(id, {
        id,
        name: preset.metadata.name,
        path: `${this.options.factoryPresetsPath}/${preset.metadata.name}${PRESET_FILE_EXTENSION}`,
        category: preset.metadata.category,
        tags: preset.metadata.tags,
        author: preset.metadata.author,
        ...(preset.metadata.rating !== undefined && { rating: preset.metadata.rating }),
        dateModified: preset.metadata.dateModified,
        isFavorite: this.favoritePresets.has(id),
        isFactory: true,
      });
    }
  }
  
  /**
   * Generate preset ID from name
   */
  private generatePresetId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-') + 
           '-' + Date.now().toString(36);
  }
  
  /**
   * Load user preferences
   */
  private async loadUserPreferences(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    // For now, initialize empty
    this.recentPresets = [];
    this.favoritePresets = new Set();
  }
  
  /**
   * Search presets
   */
  searchPresets(options: PresetSearchOptions): PresetSearchResult[] {
    let results = Array.from(this.presetIndex.values());
    
    // Filter by query
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.author.toLowerCase().includes(query) ||
        p.tags.some(t => t.includes(query))
      );
    }
    
    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      results = results.filter(p => options.categories!.includes(p.category));
    }
    
    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(p => 
        options.tags!.some(t => p.tags.includes(t))
      );
    }
    
    // Filter by author
    if (options.author) {
      results = results.filter(p => 
        p.author.toLowerCase() === options.author!.toLowerCase()
      );
    }
    
    // Filter by favorites
    if (options.favorites) {
      results = results.filter(p => p.isFavorite);
    }
    
    // Filter by rating
    if (options.rating !== undefined) {
      results = results.filter(p => (p.rating ?? 0) >= options.rating!);
    }
    
    // Sort
    const sortBy = options.sortBy ?? 'name';
    const sortOrder = options.sortOrder ?? 'asc';
    
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime();
          break;
        case 'rating':
          comparison = (a.rating ?? 0) - (b.rating ?? 0);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Pagination
    if (options.offset !== undefined) {
      results = results.slice(options.offset);
    }
    if (options.limit !== undefined) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }
  
  /**
   * Load preset from file
   */
  async loadPreset(path: string): Promise<SamplerPreset> {
    // In a real implementation, this would read from the file system
    // For now, return a default preset or factory preset
    const factoryPresets = this.getFactoryPresets();
    const match = factoryPresets.find(p => 
      path.includes(p.metadata.name)
    );
    
    if (match) {
      this.currentPreset = match;
      this._currentPresetPath = path;
      this.isDirty = false;
      this.addToRecent(path);
      return match;
    }
    
    throw new Error(`Preset not found: ${path}`);
  }
  
  /**
   * Save preset to file
   */
  async savePreset(preset: SamplerPreset, path: string): Promise<void> {
    // Update metadata
    preset.metadata.dateModified = new Date().toISOString();
    
    // In a real implementation, this would write to the file system
    const json = JSON.stringify(preset, null, 2);
    
    // Update index
    const id = this.generatePresetId(preset.metadata.name);
    this.presetIndex.set(id, {
      id,
      name: preset.metadata.name,
      path,
      category: preset.metadata.category,
      tags: preset.metadata.tags,
      author: preset.metadata.author,
      ...(preset.metadata.rating !== undefined && { rating: preset.metadata.rating }),
      dateModified: preset.metadata.dateModified,
      isFavorite: this.favoritePresets.has(id),
      isFactory: false,
    });
    
    this.currentPreset = preset;
    this._currentPresetPath = path;
    this.isDirty = false;
    
    console.log(`Saved preset to ${path} (${json.length} bytes)`);
  }
  
  /**
   * Create new preset
   */
  createNewPreset(name: string): SamplerPreset {
    const now = new Date().toISOString();
    
    return {
      version: PRESET_FORMAT_VERSION,
      metadata: {
        name,
        author: '',
        description: '',
        category: 'other',
        tags: [],
        dateCreated: now,
        dateModified: now,
      },
      samples: [],
      zones: [],
      ampEnvelope: { ...DEFAULT_PRESET_ENVELOPE },
      filterEnvelope: { ...DEFAULT_PRESET_ENVELOPE },
      pitchEnvelope: { ...DEFAULT_PRESET_ENVELOPE, sustain: 0 },
      modEnvelopes: [{ ...DEFAULT_PRESET_ENVELOPE }],
      lfos: [
        { ...DEFAULT_PRESET_LFO },
        { ...DEFAULT_PRESET_LFO },
        { ...DEFAULT_PRESET_LFO },
        { ...DEFAULT_PRESET_LFO },
      ],
      filter1: { ...DEFAULT_PRESET_FILTER },
      filter2: { ...DEFAULT_PRESET_FILTER, enabled: false },
      filterRouting: 'serial',
      filterMorphPosition: 0.5,
      modulations: [],
      effects: [],
      voiceSettings: { ...DEFAULT_VOICE_SETTINGS },
      masterOutput: {
        volume: 0,
        pan: 0,
        width: 1,
      },
    };
  }
  
  /**
   * Add to recent presets
   */
  private addToRecent(path: string): void {
    // Remove if already exists
    const index = this.recentPresets.indexOf(path);
    if (index !== -1) {
      this.recentPresets.splice(index, 1);
    }
    
    // Add to front
    this.recentPresets.unshift(path);
    
    // Limit size
    if (this.recentPresets.length > this.options.maxRecentPresets) {
      this.recentPresets.pop();
    }
  }
  
  /**
   * Get recent presets
   */
  getRecentPresets(): PresetSearchResult[] {
    return this.recentPresets
      .map(path => {
        const result = Array.from(this.presetIndex.values())
          .find(p => p.path === path);
        return result;
      })
      .filter((r): r is PresetSearchResult => r !== undefined);
  }
  
  /**
   * Toggle favorite
   */
  toggleFavorite(id: string): boolean {
    if (this.favoritePresets.has(id)) {
      this.favoritePresets.delete(id);
      const preset = this.presetIndex.get(id);
      if (preset) preset.isFavorite = false;
      return false;
    } else {
      this.favoritePresets.add(id);
      const preset = this.presetIndex.get(id);
      if (preset) preset.isFavorite = true;
      return true;
    }
  }
  
  /**
   * Get favorite presets
   */
  getFavoritePresets(): PresetSearchResult[] {
    return Array.from(this.presetIndex.values())
      .filter(p => p.isFavorite);
  }
  
  /**
   * Get current preset
   */
  getCurrentPreset(): SamplerPreset | null {
    return this.currentPreset;
  }
  
  /**
   * Check if current preset is dirty
   */
  isPresetDirty(): boolean {
    return this.isDirty;
  }
  
  /**
   * Mark preset as dirty
   */
  markDirty(): void {
    this.isDirty = true;
  }
  
  /**
   * Get factory presets
   */
  private getFactoryPresets(): SamplerPreset[] {
    return [
      this.createFactoryPreset('Grand Piano', 'piano', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Electric Piano', 'keys', ['electric', 'vintage', 'warm']),
      this.createFactoryPreset('Rhodes Classic', 'keys', ['electric', 'vintage', 'warm']),
      this.createFactoryPreset('Wurlitzer', 'keys', ['electric', 'vintage', 'bright']),
      this.createFactoryPreset('Clavinet', 'keys', ['electric', 'vintage', 'percussive']),
      this.createFactoryPreset('Hammond B3', 'organ', ['electric', 'vintage', 'warm']),
      this.createFactoryPreset('Pipe Organ', 'organ', ['acoustic', 'sustained', 'complex']),
      this.createFactoryPreset('Acoustic Guitar', 'guitar', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Electric Guitar Clean', 'guitar', ['electric', 'bright', 'velocity']),
      this.createFactoryPreset('Electric Guitar Distorted', 'guitar', ['electric', 'aggressive', 'sustained']),
      this.createFactoryPreset('Electric Bass', 'bass', ['electric', 'warm', 'velocity']),
      this.createFactoryPreset('Upright Bass', 'bass', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Synth Bass', 'bass', ['analog', 'modern', 'warm']),
      this.createFactoryPreset('String Ensemble', 'strings', ['acoustic', 'warm', 'layered']),
      this.createFactoryPreset('Solo Violin', 'strings', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Solo Cello', 'strings', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Brass Section', 'brass', ['acoustic', 'bright', 'velocity']),
      this.createFactoryPreset('Solo Trumpet', 'brass', ['acoustic', 'bright', 'velocity']),
      this.createFactoryPreset('Trombone', 'brass', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Saxophone', 'woodwinds', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Flute', 'woodwinds', ['acoustic', 'bright', 'velocity']),
      this.createFactoryPreset('Clarinet', 'woodwinds', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Synth Pad', 'pad', ['analog', 'warm', 'sustained', 'evolving']),
      this.createFactoryPreset('Ambient Pad', 'pad', ['digital', 'atmospheric', 'evolving']),
      this.createFactoryPreset('String Pad', 'pad', ['analog', 'warm', 'sustained']),
      this.createFactoryPreset('Synth Lead', 'lead', ['analog', 'bright', 'mono']),
      this.createFactoryPreset('Pluck Lead', 'lead', ['digital', 'bright', 'percussive']),
      this.createFactoryPreset('Synth Pluck', 'pluck', ['digital', 'bright', 'percussive']),
      this.createFactoryPreset('Marimba', 'percussion', ['acoustic', 'bright', 'percussive']),
      this.createFactoryPreset('Vibraphone', 'percussion', ['acoustic', 'warm', 'sustained']),
      this.createFactoryPreset('Glockenspiel', 'percussion', ['acoustic', 'bright', 'percussive']),
      this.createFactoryPreset('Timpani', 'percussion', ['acoustic', 'warm', 'percussive']),
      this.createFactoryPreset('Acoustic Drum Kit', 'drums', ['acoustic', 'velocity', 'roundrobin']),
      this.createFactoryPreset('Electronic Drum Kit', 'drums', ['digital', 'modern', 'percussive']),
      this.createFactoryPreset('808 Kit', 'drums', ['analog', 'vintage', 'percussive']),
      this.createFactoryPreset('909 Kit', 'drums', ['analog', 'vintage', 'percussive']),
      this.createFactoryPreset('Cinematic FX', 'fx', ['atmospheric', 'evolving', 'complex']),
      this.createFactoryPreset('Risers', 'fx', ['digital', 'evolving', 'oneshot']),
      this.createFactoryPreset('Impacts', 'fx', ['digital', 'percussive', 'oneshot']),
      this.createFactoryPreset('Choir', 'vocal', ['acoustic', 'warm', 'layered']),
      this.createFactoryPreset('Solo Voice', 'vocal', ['acoustic', 'warm', 'velocity']),
      this.createFactoryPreset('Vocal Pad', 'vocal', ['digital', 'atmospheric', 'sustained']),
      this.createFactoryPreset('Sitar', 'ethnic', ['acoustic', 'bright', 'velocity']),
      this.createFactoryPreset('Koto', 'ethnic', ['acoustic', 'bright', 'velocity']),
      this.createFactoryPreset('Steel Drums', 'ethnic', ['acoustic', 'bright', 'percussive']),
      this.createFactoryPreset('Orchestra Full', 'orchestral', ['acoustic', 'complex', 'layered']),
      this.createFactoryPreset('Texture Dark', 'texture', ['digital', 'dark', 'evolving']),
      this.createFactoryPreset('Texture Light', 'texture', ['digital', 'bright', 'ambient']),
    ];
  }
  
  /**
   * Create a factory preset template
   */
  private createFactoryPreset(
    name: string,
    category: PresetCategory,
    tags: PresetTag[]
  ): SamplerPreset {
    const preset = this.createNewPreset(name);
    
    preset.metadata.author = 'CardPlay';
    preset.metadata.category = category;
    preset.metadata.tags = tags;
    preset.metadata.rating = 4;
    preset.metadata.description = `Factory ${category} preset: ${name}`;
    
    // Set appropriate envelope based on category
    if (['drums', 'percussion'].includes(category)) {
      preset.ampEnvelope = {
        ...DEFAULT_PRESET_ENVELOPE,
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1,
      };
    } else if (['pad', 'strings', 'texture'].includes(category)) {
      preset.ampEnvelope = {
        ...DEFAULT_PRESET_ENVELOPE,
        attack: 0.2,
        decay: 0.5,
        sustain: 0.8,
        release: 0.5,
      };
    } else if (['pluck', 'guitar'].includes(category)) {
      preset.ampEnvelope = {
        ...DEFAULT_PRESET_ENVELOPE,
        attack: 0.001,
        decay: 0.3,
        sustain: 0.3,
        release: 0.2,
      };
    }
    
    // Set filter based on characteristics
    if (tags.includes('warm') || tags.includes('dark')) {
      preset.filter1.cutoff = 6000;
    } else if (tags.includes('bright')) {
      preset.filter1.cutoff = 15000;
    }
    
    return preset;
  }
  
  /**
   * Get preset categories with counts
   */
  getCategoriesWithCounts(): Array<{ category: PresetCategory; count: number }> {
    const counts = new Map<PresetCategory, number>();
    
    for (const preset of this.presetIndex.values()) {
      counts.set(preset.category, (counts.get(preset.category) ?? 0) + 1);
    }
    
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Get all tags with counts
   */
  getTagsWithCounts(): Array<{ tag: PresetTag; count: number }> {
    const counts = new Map<PresetTag, number>();
    
    for (const preset of this.presetIndex.values()) {
      for (const tag of preset.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Get all authors
   */
  getAuthors(): string[] {
    const authors = new Set<string>();
    
    for (const preset of this.presetIndex.values()) {
      if (preset.author) {
        authors.add(preset.author);
      }
    }
    
    return Array.from(authors).sort();
  }
}

// ============================================================================
// PRESET MORPHING
// ============================================================================

/**
 * Morph between two presets
 */
export function morphPresets(
  preset1: SamplerPreset,
  preset2: SamplerPreset,
  amount: number
): Partial<SamplerPreset> {
  amount = Math.max(0, Math.min(1, amount));
  
  return {
    // Morph envelopes
    ampEnvelope: morphEnvelope(preset1.ampEnvelope, preset2.ampEnvelope, amount),
    filterEnvelope: morphEnvelope(preset1.filterEnvelope, preset2.filterEnvelope, amount),
    pitchEnvelope: morphEnvelope(preset1.pitchEnvelope, preset2.pitchEnvelope, amount),
    
    // Morph filters
    filter1: morphFilter(preset1.filter1, preset2.filter1, amount),
    filter2: morphFilter(preset1.filter2, preset2.filter2, amount),
    filterMorphPosition: lerp(preset1.filterMorphPosition, preset2.filterMorphPosition, amount),
    
    // Morph master output
    masterOutput: {
      volume: lerp(preset1.masterOutput.volume, preset2.masterOutput.volume, amount),
      pan: lerp(preset1.masterOutput.pan, preset2.masterOutput.pan, amount),
      width: lerp(preset1.masterOutput.width, preset2.masterOutput.width, amount),
    },
    
    // Voice settings
    voiceSettings: {
      ...preset1.voiceSettings,
      unisonDetune: lerp(
        preset1.voiceSettings.unisonDetune,
        preset2.voiceSettings.unisonDetune,
        amount
      ),
      portamentoTime: lerp(
        preset1.voiceSettings.portamentoTime,
        preset2.voiceSettings.portamentoTime,
        amount
      ),
    },
  };
}

/**
 * Morph between two envelopes
 */
function morphEnvelope(
  env1: PresetEnvelope,
  env2: PresetEnvelope,
  amount: number
): PresetEnvelope {
  return {
    delay: lerp(env1.delay, env2.delay, amount),
    attack: lerpExp(env1.attack, env2.attack, amount),
    hold: lerp(env1.hold, env2.hold, amount),
    decay: lerpExp(env1.decay, env2.decay, amount),
    sustain: lerp(env1.sustain, env2.sustain, amount),
    release: lerpExp(env1.release, env2.release, amount),
    attackCurve: lerp(env1.attackCurve, env2.attackCurve, amount),
    decayCurve: lerp(env1.decayCurve, env2.decayCurve, amount),
    releaseCurve: lerp(env1.releaseCurve, env2.releaseCurve, amount),
  };
}

/**
 * Morph between two filters
 */
function morphFilter(
  filter1: PresetFilter,
  filter2: PresetFilter,
  amount: number
): PresetFilter {
  return {
    enabled: amount < 0.5 ? filter1.enabled : filter2.enabled,
    type: amount < 0.5 ? filter1.type : filter2.type,
    cutoff: lerpExp(filter1.cutoff, filter2.cutoff, amount),
    resonance: lerp(filter1.resonance, filter2.resonance, amount),
    drive: lerp(filter1.drive, filter2.drive, amount),
    keytrack: lerp(filter1.keytrack, filter2.keytrack, amount),
    envDepth: lerp(filter1.envDepth, filter2.envDepth, amount),
    lfoDepth: lerp(filter1.lfoDepth, filter2.lfoDepth, amount),
  };
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Exponential interpolation (for times/frequencies)
 */
function lerpExp(a: number, b: number, t: number): number {
  if (a <= 0 || b <= 0) return lerp(a, b, t);
  return Math.exp(lerp(Math.log(a), Math.log(b), t));
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create preset manager
 */
export function createPresetManager(
  options?: PresetManagerOptions
): SamplerPresetManager {
  return new SamplerPresetManager(options);
}

/**
 * Create new preset
 */
export function createNewPreset(name: string): SamplerPreset {
  const manager = new SamplerPresetManager();
  return manager.createNewPreset(name);
}

/**
 * Validate preset format
 */
export function validatePreset(preset: unknown): preset is SamplerPreset {
  if (!preset || typeof preset !== 'object') return false;
  
  const p = preset as Partial<SamplerPreset>;
  
  return (
    typeof p.version === 'string' &&
    p.metadata !== undefined &&
    typeof p.metadata.name === 'string' &&
    Array.isArray(p.samples) &&
    Array.isArray(p.zones) &&
    p.ampEnvelope !== undefined &&
    p.voiceSettings !== undefined
  );
}

/**
 * Export preset to JSON
 */
export function exportPresetToJson(preset: SamplerPreset): string {
  return JSON.stringify(preset, null, 2);
}

/**
 * Import preset from JSON
 */
export function importPresetFromJson(json: string): SamplerPreset {
  const parsed = JSON.parse(json);
  
  if (!validatePreset(parsed)) {
    throw new Error('Invalid preset format');
  }
  
  return parsed;
}

/**
 * Clone preset
 */
export function clonePreset(preset: SamplerPreset): SamplerPreset {
  return JSON.parse(JSON.stringify(preset));
}

/**
 * Merge presets (combine zones from multiple presets)
 */
export function mergePresets(
  presets: SamplerPreset[],
  name: string
): SamplerPreset {
  if (presets.length === 0) {
    throw new Error('No presets to merge');
  }
  
  // Start with first preset as base (we've verified length > 0)
  const firstPreset = presets[0];
  if (!firstPreset) {
    throw new Error('First preset is undefined');
  }
  const merged = clonePreset(firstPreset);
  merged.metadata.name = name;
  merged.metadata.dateCreated = new Date().toISOString();
  merged.metadata.dateModified = new Date().toISOString();
  
  // Add samples and zones from other presets
  for (let i = 1; i < presets.length; i++) {
    const preset = presets[i];
    if (!preset) continue; // Skip undefined presets
    
    // Remap sample IDs to avoid conflicts
    const sampleIdMap = new Map<string, string>();
    
    for (const sample of preset.samples) {
      const newId = `${sample.id}_${i}`;
      sampleIdMap.set(sample.id, newId);
      merged.samples.push({ ...sample, id: newId });
    }
    
    // Add zones with remapped sample IDs
    for (const zone of preset.zones) {
      const newSampleId = sampleIdMap.get(zone.sampleId) ?? zone.sampleId;
      merged.zones.push({
        ...zone,
        id: `${zone.id}_${i}`,
        sampleId: newSampleId,
      });
    }
  }
  
  return merged;
}

/**
 * Split preset by key range
 */
export function splitPresetByKeyRange(
  preset: SamplerPreset,
  splitPoint: number
): [SamplerPreset, SamplerPreset] {
  const lower = clonePreset(preset);
  const upper = clonePreset(preset);
  
  lower.metadata.name = `${preset.metadata.name} (Low)`;
  upper.metadata.name = `${preset.metadata.name} (High)`;
  
  // Filter zones by key range
  lower.zones = lower.zones.filter(z => z.keyRangeLow < splitPoint);
  upper.zones = upper.zones.filter(z => z.keyRangeHigh >= splitPoint);
  
  // Adjust key ranges at split point
  for (const zone of lower.zones) {
    if (zone.keyRangeHigh >= splitPoint) {
      zone.keyRangeHigh = splitPoint - 1;
    }
  }
  
  for (const zone of upper.zones) {
    if (zone.keyRangeLow < splitPoint) {
      zone.keyRangeLow = splitPoint;
    }
  }
  
  // Remove unused samples
  const lowerSampleIds = new Set(lower.zones.map(z => z.sampleId));
  const upperSampleIds = new Set(upper.zones.map(z => z.sampleId));
  
  lower.samples = lower.samples.filter(s => lowerSampleIds.has(s.id));
  upper.samples = upper.samples.filter(s => upperSampleIds.has(s.id));
  
  return [lower, upper];
}
