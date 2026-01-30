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
      vocals: '#8866bb',
      fx: '#667788',
      ambient: '#55aaaa',
      other: '#778899',
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
      vocals: '#ff00aa',
      fx: '#666666',
      ambient: '#00ffaa',
      other: '#888888',
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
      vocals: '#ffaaee',
      fx: '#cccccc',
      ambient: '#aaffdd',
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
  bass: ['bass', 'sub', 'low', 'reese', 'wobble', 'dub', 'synbass', 'acid'],
  synth: ['synth', 'pad', 'lead', 'arp', 'pluck', 'stab', 'saw', 'square', 'analog', 'digital', 'fm'],
  keys: ['piano', 'key', 'rhodes', 'wurli', 'organ', 'clav', 'electric piano', 'epiano', 'ep'],
  guitar: ['guitar', 'gtr', 'acoustic', 'electric', 'strat', 'tele', 'les paul', 'nylon', 'steel', 'distort'],
  strings: ['string', 'violin', 'viola', 'cello', 'contrabass', 'orchestra', 'ensemble', 'pizz', 'legato', 'tremolo'],
  brass: ['brass', 'trumpet', 'trombone', 'horn', 'tuba', 'sax', 'saxophone', 'section'],
  woodwinds: ['flute', 'clarinet', 'oboe', 'bassoon', 'piccolo', 'recorder', 'wind', 'reed'],
  vocals: ['vocal', 'voice', 'vox', 'sing', 'choir', 'harmony', 'lead vocal', 'backing', 'adlib', 'acapella'],
  fx: ['fx', 'effect', 'sfx', 'riser', 'sweep', 'noise', 'impact', 'whoosh', 'transition', 'foley'],
  ambient: ['ambient', 'atmosphere', 'texture', 'drone', 'pad', 'field', 'nature', 'environmental'],
  other: [],
};

/** Plugin keywords for category detection */
export const PLUGIN_KEYWORDS: Record<InstrumentCategory, string[]> = {
  drums: ['addictive drums', 'superior drummer', 'ezdrummer', 'battery', 'maschine', 'ultrabeat'],
  percussion: ['percussion', 'latin', 'world'],
  bass: ['trilian', 'monark', 'diva', 'massive'],
  synth: ['serum', 'massive', 'sylenth', 'omnisphere', 'vital', 'phase plant', 'pigments'],
  keys: ['keyscape', 'noire', 'una corda', 'grandeur', 'b3'],
  guitar: ['guitar rig', 'amplitube', 'helix', 'archetype'],
  strings: ['spitfire', 'css', 'berlin strings', 'orchestral'],
  brass: ['cinebrass', 'berlin brass', 'sample modeling'],
  woodwinds: ['cinewinds', 'berlin woodwinds', 'sample modeling'],
  vocals: ['vocaloid', 'synth v', 'exhale'],
  fx: ['soundtoys', 'effectrix', 'glitch'],
  ambient: ['omnisphere', 'alchemy', 'pigments'],
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
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [InstrumentCategory, string[]][]) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        // Higher confidence for longer matches
        const confidence = Math.min(0.9, 0.5 + (keyword.length / 20));
        return { category, confidence };
      }
    }
  }
  
  return { category: 'other', confidence: 0.1 };
}

/**
 * Detect instrument category from plugin names
 */
export function detectCategoryFromPlugins(plugins: string[]): { category: InstrumentCategory; confidence: number } {
  const pluginsLower = plugins.map(p => p.toLowerCase());
  
  for (const [category, keywords] of Object.entries(PLUGIN_KEYWORDS) as [InstrumentCategory, string[]][]) {
    for (const keyword of keywords) {
      if (pluginsLower.some(p => p.includes(keyword))) {
        return { category, confidence: 0.8 };
      }
    }
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
  
  const results: Array<{ category: InstrumentCategory; confidence: number }> = [];
  
  // Check name
  results.push(detectCategoryFromName(track.name));
  
  // Check plugins
  if (track.plugins && track.plugins.length > 0) {
    results.push(detectCategoryFromPlugins(track.plugins));
  }
  
  // Check sample path
  if (track.samplePath) {
    results.push(detectCategoryFromSamplePath(track.samplePath));
  }
  
  // Return highest confidence result (excluding 'other' if possible)
  const validResults = results.filter(r => r.category !== 'other' || r.confidence > 0.5);
  if (validResults.length === 0) {
    return { category: 'other', confidence: 0.1 };
  }
  
  validResults.sort((a, b) => b.confidence - a.confidence);
  const firstResult = validResults[0];
  return firstResult ?? { category: 'other', confidence: 0.1 };
}

// --------------------------------------------------------------------------
// Track Coloring Store
// --------------------------------------------------------------------------

export class TrackColoringStore {
  private scheme: ColorScheme;
  private trackColors: Map<string, ColoringResult> = new Map();
  private customColors: Map<string, string> = new Map();
  private autoColorEnabled: boolean = true;
  
  constructor(schemeId: string = 'default') {
    const foundScheme = COLOR_SCHEMES.find(s => s.id === schemeId);
    this.scheme = foundScheme ?? COLOR_SCHEMES[0]!;
  }
  
  /**
   * Get current color scheme
   */
  getScheme(): ColorScheme {
    return { ...this.scheme };
  }
  
  /**
   * Set color scheme
   */
  setScheme(schemeId: string): boolean {
    const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
    if (scheme) {
      this.scheme = scheme;
      // Recolor all tracks
      this.recolorAll();
      return true;
    }
    return false;
  }
  
  /**
   * Get available schemes
   */
  getAvailableSchemes(): ColorScheme[] {
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
    }
  }
  
  /**
   * Clear custom color for a track
   */
  clearCustomColor(trackId: string): void {
    this.customColors.delete(trackId);
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
