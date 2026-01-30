/**
 * Automatic Track Coloring System
 * 
 * Implements M281: Add automatic track coloring by instrument type.
 * Provides consistent visual organization for projects.
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Instrument category for coloring */
export type InstrumentCategory =
  | 'drums'
  | 'percussion'
  | 'bass'
  | 'synth'
  | 'keys'
  | 'guitar'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'vocals'
  | 'fx'
  | 'ambient'
  | 'aux'
  | 'master'
  | 'other';

/** Color scheme definition */
export interface ColorScheme {
  id: string;
  name: string;
  colors: Record<InstrumentCategory, string>;
}

/** Track info for coloring */
export interface TrackInfo {
  id: string;
  name: string;
  instrumentType?: InstrumentCategory;
  plugins?: string[];
  samplePath?: string;
}

/** Coloring result */
export interface ColoringResult {
  trackId: string;
  detectedCategory: InstrumentCategory;
  assignedColor: string;
  confidence: number; // 0-1
}

// --------------------------------------------------------------------------
// Built-in color schemes
// --------------------------------------------------------------------------

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      drums: '#ff4444',
      percussion: '#ff6644',
      bass: '#44ff44',
      synth: '#4488ff',
      keys: '#44ccff',
      guitar: '#ffaa44',
      strings: '#aa44ff',
      brass: '#ffcc44',
      woodwinds: '#88ff44',
      vocals: '#ff44ff',
      fx: '#888888',
      ambient: '#44ffcc',
      aux: '#666666',
      master: '#ffffff',
      other: '#aaaaaa',
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: {
      drums: '#cc3333',
      percussion: '#dd5533',
      bass: '#996633',
      synth: '#dd6644',
      keys: '#cc8844',
      guitar: '#bb7744',
      strings: '#aa5555',
      brass: '#ddaa33',
      woodwinds: '#aaaa44',
      vocals: '#dd4466',
      fx: '#887766',
      ambient: '#99aa88',
      aux: '#776655',
      master: '#eeeedd',
      other: '#999988',
    },
  },
  {
    id: 'cool',
    name: 'Cool',
    colors: {
      drums: '#3366cc',
      percussion: '#4477bb',
      bass: '#226688',
      synth: '#5588dd',
      keys: '#6699cc',
      guitar: '#4488aa',
      strings: '#6666aa',
      brass: '#7788bb',
      woodwinds: '#55aa99',
      vocals: '#8866ff',
      fx: '#666666',
      ambient: '#4488cc',
      aux: '#445566',
      master: '#cce8ff',
      other: '#888899',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      drums: '#ff0000',
      percussion: '#ff8800',
      bass: '#00ff00',
      synth: '#0088ff',
      keys: '#00ffff',
      guitar: '#ffff00',
      strings: '#ff00ff',
      brass: '#ff8844',
      woodwinds: '#88ff00',
      vocals: '#cc55cc',
      fx: '#111111',
      ambient: '#338833',
      aux: '#222222',
      master: '#eeeeee',
      other: '#333333',
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: {
      drums: '#ffaaaa',
      percussion: '#ffccaa',
      bass: '#aaffaa',
      synth: '#aaccff',
      keys: '#aaeeff',
      guitar: '#ffddaa',
      strings: '#ddaaff',
      brass: '#ffeeaa',
      woodwinds: '#ccffaa',
      vocals: '#eeccee',
      fx: '#cccccc',
      ambient: '#cceeee',
      aux: '#bbbbbb',
      master: '#ffffff',
      other: '#dddddd',
    },
  },
];

// --------------------------------------------------------------------------
// Keyword detection
// --------------------------------------------------------------------------

/** Keywords for detecting instrument categories */
export const CATEGORY_KEYWORDS: Record<InstrumentCategory, string[]> = {
  drums: ['drum', 'kick', 'snare', 'hat', 'hihat', 'hi-hat', 'tom', 'cymbal', 'crash', 'ride', 'kit', 'beat', '808', '909', 'breakbeat'],
  percussion: ['perc', 'conga', 'bongo', 'shaker', 'tambourine', 'clap', 'snap', 'rim', 'cowbell', 'triangle', 'wood', 'maracas'],
  bass: ['bass guitar', 'synbass', 'bass', 'sub', 'low', 'reese', 'wobble', 'dub', 'acid'],
  synth: ['synth lead', 'synth pad', 'synth bass', 'moog bass', 'moog', 'synth', 'pad', 'lead', 'arp', 'pluck', 'stab', 'saw', 'square', 'analog', 'digital', 'fm'],
  keys: ['electric piano', 'piano', 'key', 'rhodes', 'wurli', 'organ', 'clav', 'epiano', 'ep'],
  guitar: ['electric guitar', 'acoustic guitar', 'guitar', 'gtr', 'acoustic', 'electric', 'strat', 'tele', 'les paul', 'nylon', 'steel', 'distort'],
  strings: ['cello section', 'orchestral', 'string', 'violin', 'viola', 'cello', 'contrabass', 'orchestra', 'ensemble', 'pizz', 'legato', 'tremolo'],
  brass: ['brass section', 'horn section', 'brass', 'trumpet', 'trombone', 'horn', 'tuba'],
  woodwinds: ['flute', 'clarinet', 'oboe', 'bassoon', 'piccolo', 'recorder', 'wind', 'reed', 'sax', 'saxophone'],
  vocals: ['lead vocal', 'backing vocal', 'vocal', 'voice', 'vox', 'sing', 'choir', 'harmony', 'backing', 'adlib', 'acapella'],
  fx: ['sound effects', 'ambient fx', 'fx', 'effect', 'sfx', 'riser', 'sweep', 'noise', 'impact', 'whoosh', 'transition', 'foley'],
  ambient: ['ambient', 'atmosphere', 'texture', 'drone', 'pad', 'field', 'nature', 'environmental'],
  aux: ['reverb send', 'delay send', 'drum bus', 'aux', 'bus', 'send', 'return'],
  master: ['stereo out', 'main out', 'mix bus', 'master'],
  other: [],
};

/** Plugin keywords for category detection */
export const PLUGIN_KEYWORDS: Record<InstrumentCategory, string[]> = {
  drums: ['addictive drums', 'superior drummer', 'ezdrummer', 'bfd', 'battery', 'maschine', 'ultrabeat'],
  percussion: ['percussion', 'latin', 'world'],
  bass: ['trilian', 'modo bass', 'monark', 'diva'],
  synth: ['serum', 'massive', 'sylenth', 'omnisphere', 'vital', 'phase plant', 'pigments'],
  keys: ['keyscape', 'pianoteq', 'b3', 'noire', 'una corda', 'grandeur'],
  guitar: ['guitar rig', 'amp room', 'amplitube', 'helix', 'archetype'],
  strings: ['spitfire', 'css', 'berlin strings', 'orchestral'],
  brass: ['cinebrass', 'berlin brass', 'sample modeling'],
  woodwinds: ['cinewinds', 'berlin woodwinds', 'sample modeling'],
  vocals: ['auto-tune', 'melodyne', 'vocaloid', 'synth v', 'exhale'],
  fx: ['soundtoys', 'effectrix', 'glitch'],
  ambient: ['omnisphere', 'alchemy', 'pigments'],
  aux: [],
  master: [],
  other: [],
};

// --------------------------------------------------------------------------
// Detection functions
// --------------------------------------------------------------------------

/**
 * Detect instrument category from track name
 */
export function detectCategoryFromName(name: string): { category: InstrumentCategory; confidence: number } {
  const nameLower = name.toLowerCase();
  
  // Find all matching categories with their best keyword match
  let bestMatch: { category: InstrumentCategory; confidence: number; keywordLength: number } | null = null;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [InstrumentCategory, string[]][]) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        // Higher confidence for longer matches
        const confidence = Math.min(0.9, 0.5 + (keyword.length / 20));
        
        // Keep the match with the longest keyword (most specific)
        if (!bestMatch || keyword.length > bestMatch.keywordLength) {
          bestMatch = { category, confidence, keywordLength: keyword.length };
        }
      }
    }
  }
  
  if (bestMatch) {
    return { category: bestMatch.category, confidence: bestMatch.confidence };
  }
  
  return { category: 'other', confidence: 0.1 };
}

/**
 * Detect instrument category from plugin names
 */
export function detectCategoryFromPlugins(plugins: string[]): { category: InstrumentCategory; confidence: number } {
  const pluginsLower = plugins.map(p => p.toLowerCase());
  
  // Find all matching categories with their best keyword match
  let bestMatch: { category: InstrumentCategory; confidence: number; keywordLength: number } | null = null;
  
  for (const [category, keywords] of Object.entries(PLUGIN_KEYWORDS) as [InstrumentCategory, string[]][]) {
    for (const keyword of keywords) {
      if (pluginsLower.some(p => p.includes(keyword))) {
        const confidence = 0.8;
        
        // Keep the match with the longest keyword (most specific)
        if (!bestMatch || keyword.length > bestMatch.keywordLength) {
          bestMatch = { category, confidence, keywordLength: keyword.length };
        }
      }
    }
  }
  
  if (bestMatch) {
    return { category: bestMatch.category, confidence: bestMatch.confidence };
  }
  
  return { category: 'other', confidence: 0.1 };
}

/**
 * Detect instrument category from sample path
 */
export function detectCategoryFromSamplePath(path: string): { category: InstrumentCategory; confidence: number } {
  const pathLower = path.toLowerCase();
  
  // Check folder structure hints
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [InstrumentCategory, string[]][]) {
    for (const keyword of keywords) {
      if (pathLower.includes(`/${keyword}/`) || pathLower.includes(`\\${keyword}\\`)) {
        return { category, confidence: 0.7 };
      }
      if (pathLower.includes(keyword)) {
        return { category, confidence: 0.5 };
      }
    }
  }
  
  return { category: 'other', confidence: 0.1 };
}

/**
 * Detect instrument category using all available info
 */
export function detectCategory(track: TrackInfo): { category: InstrumentCategory; confidence: number } {
  // If explicitly set, use it
  if (track.instrumentType) {
    return { category: track.instrumentType, confidence: 1.0 };
  }
  
  // Prioritize name detection
  const nameResult = detectCategoryFromName(track.name);
  if (nameResult.category !== 'other') {
    return nameResult;
  }
  
  // Fall back to plugin detection
  if (track.plugins && track.plugins.length > 0) {
    const pluginResult = detectCategoryFromPlugins(track.plugins);
    if (pluginResult.category !== 'other') {
      return pluginResult;
    }
  }
  
  // Fall back to sample path
  if (track.samplePath) {
    const sampleResult = detectCategoryFromSamplePath(track.samplePath);
    if (sampleResult.category !== 'other') {
      return sampleResult;
    }
  }
  
  return { category: 'other', confidence: 0.1 };
}

/**
 * Get color for a category from a color scheme
 */
export function getColorForCategory(category: InstrumentCategory, schemeId: string = 'default'): string {
  const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
  if (!scheme) {
    return COLOR_SCHEMES[0]!.colors[category];
  }
  return scheme.colors[category];
}

// --------------------------------------------------------------------------
// Track Coloring Store
// --------------------------------------------------------------------------

export class TrackColoringStore {
  private scheme: ColorScheme;
  private trackColors: Map<string, ColoringResult> = new Map();
  private customColors: Map<string, string> = new Map();
  private autoColorEnabled: boolean = true;
  private listeners: Array<(trackId: string, result: ColoringResult) => void> = [];
  
  constructor(schemeId: string = 'default') {
    const foundScheme = COLOR_SCHEMES.find(s => s.id === schemeId);
    this.scheme = foundScheme ?? COLOR_SCHEMES[0]!;
  }
  
  /**
   * Get current color scheme ID
   */
  getScheme(): string {
    return this.scheme.id;
  }
  
  /**
   * Get current color scheme object
   */
  getSchemeObject(): ColorScheme {
    return { ...this.scheme };
  }
  
  /**
   * Set color scheme
   */
  setScheme(schemeId: string): boolean {
    const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
    if (scheme) {
      this.scheme = scheme;
      // Recolor all tracks and notify
      this.recolorAll();
      // Notify all listeners about scheme change
      if (this.trackColors.size > 0) {
        for (const result of this.trackColors.values()) {
          this.notifyListeners(result.trackId, result);
        }
      } else {
        // Notify with sentinel when no tracks exist
        this.notifyListeners('', { trackId: '', detectedCategory: 'other', assignedColor: '', confidence: 0 });
      }
      return true;
    }
    return false;
  }
  
  /**
   * Get available schemes as IDs
   */
  getAvailableSchemes(): string[] {
    return COLOR_SCHEMES.map(s => s.id);
  }
  
  /**
   * Get available schemes as objects
   */
  getAvailableSchemeObjects(): ColorScheme[] {
    return [...COLOR_SCHEMES];
  }
  
  /**
   * Enable/disable auto coloring
   */
  setAutoColorEnabled(enabled: boolean): void {
    this.autoColorEnabled = enabled;
  }
  
  /**
   * Is auto coloring enabled
   */
  isAutoColorEnabled(): boolean {
    return this.autoColorEnabled;
  }
  
  /**
   * Color a single track
   */
  colorTrack(track: TrackInfo): ColoringResult {
    // Check for custom color override
    if (this.customColors.has(track.id)) {
      const result: ColoringResult = {
        trackId: track.id,
        detectedCategory: 'other',
        assignedColor: this.customColors.get(track.id)!,
        confidence: 1.0,
      };
      this.trackColors.set(track.id, result);
      this.notifyListeners(track.id, result);
      return result;
    }
    
    if (!this.autoColorEnabled) {
      const result: ColoringResult = {
        trackId: track.id,
        detectedCategory: 'other',
        assignedColor: this.scheme.colors.other,
        confidence: 0,
      };
      this.trackColors.set(track.id, result);
      this.notifyListeners(track.id, result);
      return result;
    }
    
    const { category, confidence } = detectCategory(track);
    const result: ColoringResult = {
      trackId: track.id,
      detectedCategory: category,
      assignedColor: this.scheme.colors[category],
      confidence,
    };
    
    this.trackColors.set(track.id, result);
    this.notifyListeners(track.id, result);
    return result;
  }
  
  /**
   * Color multiple tracks
   */
  colorTracks(tracks: TrackInfo[]): ColoringResult[] {
    return tracks.map(track => this.colorTrack(track));
  }
  
  /**
   * Get track color
   */
  getTrackColor(trackId: string): string | undefined {
    return this.trackColors.get(trackId)?.assignedColor;
  }
  
  /**
   * Get track coloring result
   */
  getTrackResult(trackId: string): ColoringResult | undefined {
    return this.trackColors.get(trackId);
  }
  
  /**
   * Get all coloring results
   */
  getAllResults(): ColoringResult[] {
    return Array.from(this.trackColors.values());
  }
  
  /**
   * Set custom color for a track
   */
  setCustomColor(trackId: string, color: string): void {
    this.customColors.set(trackId, color);
    
    // Update the coloring result
    const existing = this.trackColors.get(trackId);
    if (existing) {
      existing.assignedColor = color;
      existing.confidence = 1.0;
      this.notifyListeners(trackId, existing);
    }
  }
  
  /**
   * Clear custom color for a track
   */
  clearCustomColor(trackId: string): void {
    this.customColors.delete(trackId);
  }
  
  /**
   * Set custom color for a track (alias for setCustomColor)
   */
  setTrackColor(trackId: string, color: string): void {
    this.setCustomColor(trackId, color);
  }
  
  /**
   * Check if track has color override
   */
  hasOverride(trackId: string): boolean {
    return this.customColors.has(trackId);
  }
  
  /**
   * Clear color override for a track (alias for clearCustomColor)
   */
  clearOverride(trackId: string): void {
    this.clearCustomColor(trackId);
    
    // Recompute color from stored track info
    const existing = this.trackColors.get(trackId);
    if (existing) {
      // Recompute category color
      const categoryColor = this.scheme.colors[existing.detectedCategory];
      existing.assignedColor = categoryColor;
      this.notifyListeners(trackId, existing);
    }
  }
  
  /**
   * Subscribe to color changes
   */
  subscribe(callback: (trackId: string, result: ColoringResult) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all listeners of a color change
   */
  private notifyListeners(trackId: string, result: ColoringResult): void {
    for (const listener of this.listeners) {
      listener(trackId, result);
    }
  }
  
  /**
   * Get color for category
   */
  getCategoryColor(category: InstrumentCategory): string {
    return this.scheme.colors[category];
  }
  
  /**
   * Recolor all tracked tracks
   */
  private recolorAll(): void {
    // This would need access to track info, so in practice
    // the caller would need to re-submit tracks
    this.trackColors.clear();
  }
  
  /**
   * Clear all track colors
   */
  clear(): void {
    this.trackColors.clear();
    this.customColors.clear();
  }
  
  /**
   * Get statistics
   */
  getStatistics(): Record<InstrumentCategory, number> {
    const stats: Record<InstrumentCategory, number> = {
      drums: 0, percussion: 0, bass: 0, synth: 0, keys: 0,
      guitar: 0, strings: 0, brass: 0, woodwinds: 0, vocals: 0,
      fx: 0, ambient: 0, other: 0,
    };
    
    this.trackColors.forEach(result => {
      stats[result.detectedCategory]++;
    });
    
    return stats;
  }
}

// Singleton instance
export const trackColoringStore = new TrackColoringStore();
