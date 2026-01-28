/**
 * @fileoverview Freesound Integration Module
 * 
 * Provides integration with Freesound.org API for:
 * - Searching sounds by instrument, key, tempo, tags
 * - Browser panel with preview and download
 * - Auto-mapping samples across keyboard
 * - Attribution tracking and compliance
 * - Local caching of downloaded samples
 * 
 * @module @cardplay/core/audio/freesound-integration
 */

// ============================================================================
// FREESOUND TYPES
// ============================================================================

/** Freesound license types */
export type FreesoundLicense =
  | 'cc0'           // Public Domain
  | 'cc-by'         // Attribution
  | 'cc-by-nc'      // Attribution Non-Commercial
  | 'cc-by-sa'      // Attribution Share-Alike
  | 'cc-by-nd'      // Attribution No-Derivatives
  | 'cc-by-nc-sa'   // Attribution Non-Commercial Share-Alike
  | 'cc-by-nc-nd'   // Attribution Non-Commercial No-Derivatives
  | 'sampling+'     // Sampling Plus
  | 'unknown';

/** Sound metadata */
export interface FreesoundMetadata {
  id: number;
  name: string;
  description: string;
  tags: string[];
  license: FreesoundLicense;
  username: string;
  
  // Audio properties
  duration: number;      // seconds
  samplerate: number;
  bitdepth: number;
  channels: number;
  filesize: number;      // bytes
  
  // Musical properties
  key?: string;          // e.g., 'C major'
  bpm?: number;
  
  // Analysis
  lowlevel?: {
    average_loudness: number;
    spectral_centroid: { mean: number };
    spectral_complexity: { mean: number };
    pitch: { mean: number };
    pitch_salience: { mean: number };
  };
  
  // URLs
  previewUrl: string;     // mp3 preview
  downloadUrl: string;    // original file
  pageUrl: string;        // freesound page
  
  // Ratings
  avgRating: number;
  numRatings: number;
  numDownloads: number;
}

/** Search filters */
export interface FreesoundSearchFilters {
  query?: string;
  
  // Tags
  tags?: string[];
  tagsAll?: boolean;      // require all tags
  
  // Duration
  minDuration?: number;   // seconds
  maxDuration?: number;
  
  // Audio
  minSamplerate?: number;
  maxSamplerate?: number;
  channels?: 'mono' | 'stereo' | 'any';
  
  // Musical
  key?: string;
  bpm?: number;
  bpmRange?: number;      // ± tolerance
  
  // License
  licenses?: FreesoundLicense[];
  
  // Sorting
  sort?: 'score' | 'duration_desc' | 'duration_asc' | 'created_desc' | 'created_asc' | 'downloads_desc' | 'rating_desc';
  
  // Pagination
  page?: number;
  pageSize?: number;      // max 150
  
  // Analysis
  minAvgLoudness?: number;
  maxAvgLoudness?: number;
  
  // Instrument detection (custom)
  instrumentType?: 'piano' | 'guitar' | 'strings' | 'brass' | 'woodwind' | 'synth' | 'drums' | 'percussion' | 'vocal' | 'bass' | 'other';
}

/** Search result */
export interface FreesoundSearchResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: FreesoundMetadata[];
}

/** Download status */
export interface DownloadStatus {
  soundId: number;
  name: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;      // 0-1
  error?: string;
  localPath?: string;
}

/** Attribution entry */
export interface Attribution {
  soundId: number;
  soundName: string;
  username: string;
  license: FreesoundLicense;
  url: string;
  downloadDate: number;
  usedInPreset?: string;
}

// ============================================================================
// FREESOUND CLIENT
// ============================================================================

/**
 * Freesound API client
 */
export class FreesoundClient {
  private apiKey: string;
  private baseUrl = 'https://freesound.org/apiv2';
  private accessToken: string | null = null;
  
  // Rate limiting
  private lastRequestTime = 0;
  private minRequestInterval = 200; // ms between requests
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Set OAuth access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }
  
  /**
   * Search sounds
   */
  async search(filters: FreesoundSearchFilters): Promise<FreesoundSearchResult> {
    const params = this.buildSearchParams(filters);
    const url = `${this.baseUrl}/search/text/?${params}`;
    
    const response = await this.makeRequest(url);
    return this.parseSearchResult(response);
  }
  
  /**
   * Get sound details
   */
  async getSound(id: number): Promise<FreesoundMetadata> {
    const url = `${this.baseUrl}/sounds/${id}/?token=${this.apiKey}`;
    const response = await this.makeRequest(url);
    return this.parseSoundMetadata(response);
  }
  
  /**
   * Get similar sounds
   */
  async getSimilarSounds(id: number, maxResults = 10): Promise<FreesoundMetadata[]> {
    const url = `${this.baseUrl}/sounds/${id}/similar/?token=${this.apiKey}&page_size=${maxResults}`;
    const response = await this.makeRequest(url);
    const result = this.parseSearchResult(response);
    return result.results;
  }
  
  /**
   * Download sound preview (mp3)
   */
  async downloadPreview(sound: FreesoundMetadata): Promise<ArrayBuffer> {
    const response = await fetch(sound.previewUrl);
    if (!response.ok) {
      throw new Error(`Failed to download preview: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }
  
  /**
   * Download original sound file (requires OAuth)
   */
  async downloadOriginal(sound: FreesoundMetadata): Promise<ArrayBuffer> {
    if (!this.accessToken) {
      throw new Error('OAuth access token required for original downloads');
    }
    
    const response = await fetch(sound.downloadUrl, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download original: ${response.statusText}`);
    }
    
    return response.arrayBuffer();
  }
  
  /**
   * Get analysis data
   */
  async getAnalysis(id: number): Promise<any> {
    const url = `${this.baseUrl}/sounds/${id}/analysis/?token=${this.apiKey}`;
    return this.makeRequest(url);
  }
  
  /**
   * Search by content similarity (requires analysis)
   */
  async searchByContent(
    targetDescriptor: string,
    filters?: FreesoundSearchFilters
  ): Promise<FreesoundSearchResult> {
    const params = new URLSearchParams();
    params.set('token', this.apiKey);
    params.set('target', targetDescriptor);
    
    if (filters?.pageSize) {
      params.set('page_size', String(filters.pageSize));
    }
    if (filters?.page) {
      params.set('page', String(filters.page));
    }
    
    const url = `${this.baseUrl}/search/content/?${params}`;
    const response = await this.makeRequest(url);
    return this.parseSearchResult(response);
  }
  
  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================
  
  private buildSearchParams(filters: FreesoundSearchFilters): string {
    const params = new URLSearchParams();
    params.set('token', this.apiKey);
    params.set('fields', 'id,name,description,tags,license,username,duration,samplerate,bitdepth,channels,filesize,previews,download,url,avg_rating,num_ratings,num_downloads,ac_analysis');
    
    // Query
    if (filters.query) {
      params.set('query', filters.query);
    }
    
    // Build filter string
    const filterParts: string[] = [];
    
    if (filters.tags && filters.tags.length > 0) {
      const tagFilter = filters.tagsAll
        ? filters.tags.map(t => `tag:${t}`).join(' ')
        : `tag:(${filters.tags.join(' OR ')})`;
      filterParts.push(tagFilter);
    }
    
    if (filters.minDuration !== undefined) {
      filterParts.push(`duration:[${filters.minDuration} TO *]`);
    }
    if (filters.maxDuration !== undefined) {
      filterParts.push(`duration:[* TO ${filters.maxDuration}]`);
    }
    
    if (filters.minSamplerate !== undefined) {
      filterParts.push(`samplerate:[${filters.minSamplerate} TO *]`);
    }
    
    if (filters.channels === 'mono') {
      filterParts.push('channels:1');
    } else if (filters.channels === 'stereo') {
      filterParts.push('channels:2');
    }
    
    if (filters.licenses && filters.licenses.length > 0) {
      const licenseMap: Record<FreesoundLicense, string> = {
        'cc0': 'Creative Commons 0',
        'cc-by': 'Attribution',
        'cc-by-nc': 'Attribution Noncommercial',
        'cc-by-sa': 'Attribution Share Alike',
        'cc-by-nd': 'Attribution No Derivatives',
        'cc-by-nc-sa': 'Attribution Noncommercial Share Alike',
        'cc-by-nc-nd': 'Attribution Noncommercial No Derivatives',
        'sampling+': 'Sampling+',
        'unknown': '',
      };
      const licenseFilters = filters.licenses
        .map(l => licenseMap[l])
        .filter(l => l)
        .map(l => `license:"${l}"`);
      if (licenseFilters.length > 0) {
        filterParts.push(`(${licenseFilters.join(' OR ')})`);
      }
    }
    
    if (filterParts.length > 0) {
      params.set('filter', filterParts.join(' '));
    }
    
    // Sort
    if (filters.sort) {
      params.set('sort', filters.sort);
    }
    
    // Pagination
    params.set('page_size', String(filters.pageSize ?? 15));
    if (filters.page) {
      params.set('page', String(filters.page));
    }
    
    return params.toString();
  }
  
  private async makeRequest(url: string): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private parseSearchResult(data: any): FreesoundSearchResult {
    return {
      count: data.count ?? 0,
      next: data.next ?? null,
      previous: data.previous ?? null,
      results: (data.results ?? []).map((r: any) => this.parseSoundMetadata(r)),
    };
  }
  
  private parseSoundMetadata(data: any): FreesoundMetadata {
    const previews = data.previews ?? {};
    
    return {
      id: data.id,
      name: data.name ?? 'Untitled',
      description: data.description ?? '',
      tags: data.tags ?? [],
      license: this.parseLicense(data.license),
      username: data.username ?? 'Unknown',
      duration: data.duration ?? 0,
      samplerate: data.samplerate ?? 44100,
      bitdepth: data.bitdepth ?? 16,
      channels: data.channels ?? 1,
      filesize: data.filesize ?? 0,
      key: data.ac_analysis?.key ?? undefined,
      bpm: data.ac_analysis?.bpm ?? undefined,
      lowlevel: data.ac_analysis?.lowlevel,
      previewUrl: previews['preview-hq-mp3'] ?? previews['preview-lq-mp3'] ?? '',
      downloadUrl: data.download ?? '',
      pageUrl: data.url ?? `https://freesound.org/s/${data.id}`,
      avgRating: data.avg_rating ?? 0,
      numRatings: data.num_ratings ?? 0,
      numDownloads: data.num_downloads ?? 0,
    };
  }
  
  private parseLicense(license: string): FreesoundLicense {
    if (!license) return 'unknown';
    
    const lower = license.toLowerCase();
    if (lower.includes('cc0') || lower.includes('public domain')) return 'cc0';
    if (lower.includes('noncommercial') && lower.includes('share alike')) return 'cc-by-nc-sa';
    if (lower.includes('noncommercial') && lower.includes('no deriv')) return 'cc-by-nc-nd';
    if (lower.includes('noncommercial')) return 'cc-by-nc';
    if (lower.includes('share alike')) return 'cc-by-sa';
    if (lower.includes('no deriv')) return 'cc-by-nd';
    if (lower.includes('attribution')) return 'cc-by';
    if (lower.includes('sampling+')) return 'sampling+';
    
    return 'unknown';
  }
}

// ============================================================================
// SAMPLE AUTO-MAPPER
// ============================================================================

/** Key detection result */
export interface KeyDetection {
  note: number;           // MIDI note
  noteName: string;       // e.g., "C4"
  confidence: number;     // 0-1
  method: 'filename' | 'tags' | 'analysis' | 'manual';
}

/** Sample zone mapping */
export interface SampleZone {
  soundId: number;
  rootNote: number;
  lowNote: number;
  highNote: number;
  lowVelocity: number;
  highVelocity: number;
  tuning: number;         // cents
  gain: number;           // dB
}

/**
 * Auto-maps samples across keyboard
 */
export class SampleAutoMapper {
  // Note name to MIDI mapping
  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  private static readonly NOTE_ALIASES: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  };
  
  /**
   * Detect root note from sample metadata
   */
  detectRootNote(sound: FreesoundMetadata): KeyDetection {
    // Try filename first
    const filenameNote = this.parseNoteFromFilename(sound.name);
    if (filenameNote !== null) {
      return {
        note: filenameNote,
        noteName: this.midiToNoteName(filenameNote),
        confidence: 0.9,
        method: 'filename',
      };
    }
    
    // Try tags
    const tagNote = this.parseNoteFromTags(sound.tags);
    if (tagNote !== null) {
      return {
        note: tagNote,
        noteName: this.midiToNoteName(tagNote),
        confidence: 0.8,
        method: 'tags',
      };
    }
    
    // Try analysis data
    if (sound.lowlevel?.pitch?.mean) {
      const pitchHz = sound.lowlevel.pitch.mean;
      const midiNote = this.frequencyToMidi(pitchHz);
      const confidence = sound.lowlevel.pitch_salience?.mean ?? 0.5;
      
      return {
        note: midiNote,
        noteName: this.midiToNoteName(midiNote),
        confidence: confidence * 0.7,
        method: 'analysis',
      };
    }
    
    // Try key metadata
    if (sound.key) {
      const keyNote = this.parseKey(sound.key);
      if (keyNote !== null) {
        return {
          note: keyNote + 60, // Middle octave
          noteName: this.midiToNoteName(keyNote + 60),
          confidence: 0.6,
          method: 'tags',
        };
      }
    }
    
    // Default to C4
    return {
      note: 60,
      noteName: 'C4',
      confidence: 0.1,
      method: 'manual',
    };
  }
  
  /**
   * Auto-map a set of samples across the keyboard
   */
  autoMapSamples(sounds: FreesoundMetadata[]): SampleZone[] {
    if (sounds.length === 0) return [];
    
    // Detect root notes for all samples
    const detections = sounds.map(sound => ({
      sound,
      detection: this.detectRootNote(sound),
    }));
    
    // Sort by root note
    detections.sort((a, b) => a.detection.note - b.detection.note);
    
    // Create zones
    const zones: SampleZone[] = [];
    
    for (let i = 0; i < detections.length; i++) {
      const detection = detections[i];
      if (!detection) continue;
      const { sound, detection: det } = detection;
      
      // Calculate key range
      let lowNote: number;
      let highNote: number;
      
      if (i === 0) {
        lowNote = 0;
      } else {
        const prevDetection = detections[i - 1];
        const prevNote = prevDetection ? prevDetection.detection.note : 0;
        lowNote = Math.floor((det.note + prevNote) / 2) + 1;
      }
      
      if (i === detections.length - 1) {
        highNote = 127;
      } else {
        const nextDetection = detections[i + 1];
        const nextNote = nextDetection ? nextDetection.detection.note : 127;
        highNote = Math.floor((det.note + nextNote) / 2);
      }
      
      zones.push({
        soundId: sound.id,
        rootNote: det.note,
        lowNote,
        highNote,
        lowVelocity: 0,
        highVelocity: 127,
        tuning: 0,
        gain: 0,
      });
    }
    
    return zones;
  }
  
  /**
   * Create velocity layers from similar sounds
   */
  createVelocityLayers(sounds: FreesoundMetadata[]): SampleZone[] {
    if (sounds.length === 0) return [];
    
    const zones: SampleZone[] = [];
    const layerCount = sounds.length;
    const velocityStep = Math.floor(127 / layerCount);
    
    // Detect common root note
    const detections = sounds.map(s => this.detectRootNote(s));
    const avgNote = Math.round(detections.reduce((sum, d) => sum + d.note, 0) / layerCount);
    
    // Sort sounds by loudness (if available) or by order
    const sortedSounds = [...sounds].sort((a, b) => {
      const loudA = a.lowlevel?.average_loudness ?? 0;
      const loudB = b.lowlevel?.average_loudness ?? 0;
      return loudA - loudB;
    });
    
    for (let i = 0; i < layerCount; i++) {
      const sound = sortedSounds[i];
      if (!sound) continue;
      
      zones.push({
        soundId: sound.id,
        rootNote: avgNote,
        lowNote: 0,
        highNote: 127,
        lowVelocity: i * velocityStep,
        highVelocity: i === layerCount - 1 ? 127 : (i + 1) * velocityStep - 1,
        tuning: 0,
        gain: 0,
      });
    }
    
    return zones;
  }
  
  /**
   * Create round-robin zones
   */
  createRoundRobinZones(sounds: FreesoundMetadata[]): SampleZone[] {
    if (sounds.length === 0) return [];
    
    const firstSound = sounds[0];
    if (!firstSound) return [];
    
    const detection = this.detectRootNote(firstSound);
    
    return sounds.map((sound) => ({
      soundId: sound.id,
      rootNote: detection.note,
      lowNote: 0,
      highNote: 127,
      lowVelocity: 0,
      highVelocity: 127,
      tuning: 0,
      gain: 0,
      // Round-robin index would be tracked separately
    }));
  }
  
  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================
  
  private parseNoteFromFilename(filename: string): number | null {
    // Common patterns:
    // Piano_C4.wav, C4_piano.wav, c4.wav, C#4_sample.wav
    // piano-c-4.wav, sample_060.wav (MIDI number)
    
    // Pattern: note name with octave
    const noteRegex = /\b([A-Ga-g][#b]?)[-_]?(\d)\b/;
    const match = filename.match(noteRegex);
    
    if (match) {
      const noteName = match[1]?.toUpperCase();
      const octaveStr = match[2];
      if (!noteName || !octaveStr) return null;
      
      const octave = parseInt(octaveStr);
      
      // Handle aliases
      const finalNoteName = SampleAutoMapper.NOTE_ALIASES[noteName] ?? noteName;
      
      const noteIndex = SampleAutoMapper.NOTE_NAMES.indexOf(finalNoteName);
      if (noteIndex >= 0) {
        return (octave + 1) * 12 + noteIndex;
      }
    }
    
    // Pattern: MIDI note number
    const midiRegex = /_(\d{2,3})[\._]/;
    const midiMatch = filename.match(midiRegex);
    if (midiMatch && midiMatch[1]) {
      const midiNote = parseInt(midiMatch[1]);
      if (midiNote >= 0 && midiNote <= 127) {
        return midiNote;
      }
    }
    
    return null;
  }
  
  private parseNoteFromTags(tags: string[]): number | null {
    for (const tag of tags) {
      const lower = tag.toLowerCase();
      
      // Check for note names
      const noteRegex = /^([a-g][#b]?)(\d)$/;
      const match = lower.match(noteRegex);
      
      if (match) {
        const noteName = match[1]?.toUpperCase();
        const octaveStr = match[2];
        if (!noteName || !octaveStr) continue;
        
        const octave = parseInt(octaveStr);
        
        const finalNoteName = SampleAutoMapper.NOTE_ALIASES[noteName] ?? noteName;
        
        const noteIndex = SampleAutoMapper.NOTE_NAMES.indexOf(finalNoteName);
        if (noteIndex >= 0) {
          return (octave + 1) * 12 + noteIndex;
        }
      }
    }
    
    return null;
  }
  
  private parseKey(key: string): number | null {
    const keyRegex = /^([A-Ga-g][#b]?)/;
    const match = key.match(keyRegex);
    
    if (match && match[1]) {
      const noteName = match[1].toUpperCase();
      
      const finalNoteName = SampleAutoMapper.NOTE_ALIASES[noteName] ?? noteName;
      
      return SampleAutoMapper.NOTE_NAMES.indexOf(finalNoteName);
    }
    
    return null;
  }
  
  private frequencyToMidi(frequency: number): number {
    return Math.round(12 * Math.log2(frequency / 440) + 69);
  }
  
  private midiToNoteName(midi: number): string {
    const octave = Math.floor(midi / 12) - 1;
    const noteName = SampleAutoMapper.NOTE_NAMES[midi % 12];
    return `${noteName}${octave}`;
  }
}

// ============================================================================
// ATTRIBUTION MANAGER
// ============================================================================

/**
 * Manages attribution for downloaded sounds
 */
export class AttributionManager {
  private attributions: Map<number, Attribution> = new Map();
  private storageKey = 'freesound_attributions';
  
  constructor() {
    this.load();
  }
  
  /**
   * Add attribution for a downloaded sound
   */
  addAttribution(sound: FreesoundMetadata, presetName?: string): void {
    const attribution: Attribution = {
      soundId: sound.id,
      soundName: sound.name,
      username: sound.username,
      license: sound.license,
      url: sound.pageUrl,
      downloadDate: Date.now(),
    };
    
    if (presetName !== undefined) {
      attribution.usedInPreset = presetName;
    }
    
    this.attributions.set(sound.id, attribution);
    this.save();
  }
  
  /**
   * Get attribution for a sound
   */
  getAttribution(soundId: number): Attribution | undefined {
    return this.attributions.get(soundId);
  }
  
  /**
   * Get all attributions
   */
  getAllAttributions(): Attribution[] {
    return Array.from(this.attributions.values());
  }
  
  /**
   * Get attributions for a preset
   */
  getAttributionsForPreset(presetName: string): Attribution[] {
    return Array.from(this.attributions.values())
      .filter(a => a.usedInPreset === presetName);
  }
  
  /**
   * Generate attribution text
   */
  generateAttributionText(soundIds?: number[]): string {
    const attrs = soundIds
      ? soundIds.map(id => this.attributions.get(id)).filter((a): a is Attribution => a !== undefined)
      : this.getAllAttributions();
    
    if (attrs.length === 0) {
      return 'No attributions required.';
    }
    
    const lines = ['Sound Credits:', ''];
    
    for (const attr of attrs) {
      const licenseName = this.getLicenseName(attr.license);
      lines.push(`• "${attr.soundName}" by ${attr.username}`);
      lines.push(`  License: ${licenseName}`);
      lines.push(`  URL: ${attr.url}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Generate HTML attribution
   */
  generateAttributionHTML(soundIds?: number[]): string {
    const attrs = soundIds
      ? soundIds.map(id => this.attributions.get(id)).filter((a): a is Attribution => a !== undefined)
      : this.getAllAttributions();
    
    if (attrs.length === 0) {
      return '<p>No attributions required.</p>';
    }
    
    const items = attrs.map(attr => {
      const licenseName = this.getLicenseName(attr.license);
      return `
        <li>
          <a href="${attr.url}" target="_blank">"${attr.soundName}"</a> 
          by ${attr.username} 
          (${licenseName})
        </li>
      `;
    });
    
    return `
      <h4>Sound Credits</h4>
      <ul>${items.join('')}</ul>
    `;
  }
  
  /**
   * Check if license allows commercial use
   */
  allowsCommercialUse(soundId: number): boolean {
    const attr = this.attributions.get(soundId);
    if (!attr) return false;
    
    return !['cc-by-nc', 'cc-by-nc-sa', 'cc-by-nc-nd'].includes(attr.license);
  }
  
  /**
   * Check if license allows derivatives
   */
  allowsDerivatives(soundId: number): boolean {
    const attr = this.attributions.get(soundId);
    if (!attr) return false;
    
    return !['cc-by-nd', 'cc-by-nc-nd'].includes(attr.license);
  }
  
  /**
   * Remove attribution
   */
  removeAttribution(soundId: number): void {
    this.attributions.delete(soundId);
    this.save();
  }
  
  /**
   * Clear all attributions
   */
  clearAll(): void {
    this.attributions.clear();
    this.save();
  }
  
  /**
   * Export attributions as JSON
   */
  exportJSON(): string {
    return JSON.stringify(Array.from(this.attributions.values()), null, 2);
  }
  
  /**
   * Import attributions from JSON
   */
  importJSON(json: string): void {
    try {
      const data = JSON.parse(json) as Attribution[];
      for (const attr of data) {
        this.attributions.set(attr.soundId, attr);
      }
      this.save();
    } catch (error) {
      console.error('Failed to import attributions:', error);
    }
  }
  
  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================
  
  private getLicenseName(license: FreesoundLicense): string {
    const names: Record<FreesoundLicense, string> = {
      'cc0': 'CC0 1.0 (Public Domain)',
      'cc-by': 'CC BY 4.0',
      'cc-by-nc': 'CC BY-NC 4.0',
      'cc-by-sa': 'CC BY-SA 4.0',
      'cc-by-nd': 'CC BY-ND 4.0',
      'cc-by-nc-sa': 'CC BY-NC-SA 4.0',
      'cc-by-nc-nd': 'CC BY-NC-ND 4.0',
      'sampling+': 'Sampling Plus 1.0',
      'unknown': 'Unknown License',
    };
    return names[license] ?? 'Unknown License';
  }
  
  private save(): void {
    try {
      const data = Array.from(this.attributions.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save attributions:', error);
    }
  }
  
  private load(): void {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (json) {
        const data = JSON.parse(json) as Attribution[];
        for (const attr of data) {
          this.attributions.set(attr.soundId, attr);
        }
      }
    } catch (error) {
      console.warn('Failed to load attributions:', error);
    }
  }
}

// ============================================================================
// SAMPLE CACHE
// ============================================================================

/**
 * Local cache for downloaded samples
 */
export class SampleCache {
  private dbName = 'freesound_cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  
  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Samples store
        if (!db.objectStoreNames.contains('samples')) {
          const store = db.createObjectStore('samples', { keyPath: 'id' });
          store.createIndex('downloadDate', 'downloadDate', { unique: false });
        }
        
        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' });
        }
      };
    });
  }
  
  /**
   * Store sample data
   */
  async storeSample(
    id: number,
    data: ArrayBuffer,
    metadata: FreesoundMetadata
  ): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples', 'metadata'], 'readwrite');
      
      const samplesStore = transaction.objectStore('samples');
      const metadataStore = transaction.objectStore('metadata');
      
      samplesStore.put({
        id,
        data,
        downloadDate: Date.now(),
      });
      
      metadataStore.put(metadata);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
  
  /**
   * Get sample data
   */
  async getSample(id: number): Promise<ArrayBuffer | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('samples', 'readonly');
      const store = transaction.objectStore('samples');
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result?.data ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Get metadata
   */
  async getMetadata(id: number): Promise<FreesoundMetadata | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('metadata', 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Check if sample is cached
   */
  async hasSample(id: number): Promise<boolean> {
    const sample = await this.getSample(id);
    return sample !== null;
  }
  
  /**
   * Delete sample
   */
  async deleteSample(id: number): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples', 'metadata'], 'readwrite');
      
      transaction.objectStore('samples').delete(id);
      transaction.objectStore('metadata').delete(id);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
  
  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('samples', 'readonly');
      const store = transaction.objectStore('samples');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const totalSize = request.result.reduce((sum, item) => {
          return sum + (item.data?.byteLength ?? 0);
        }, 0);
        resolve(totalSize);
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples', 'metadata'], 'readwrite');
      
      transaction.objectStore('samples').clear();
      transaction.objectStore('metadata').clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// ============================================================================
// FREESOUND BROWSER
// ============================================================================

/**
 * Browser panel for searching and managing Freesound samples
 */
export class FreesoundBrowser {
  private client: FreesoundClient;
  private cache: SampleCache;
  private attributionManager: AttributionManager;
  private autoMapper: SampleAutoMapper;
  
  // Current state
  private searchResults: FreesoundMetadata[] = [];
  private selectedSounds: Set<number> = new Set();
  private downloads: Map<number, DownloadStatus> = new Map();
  
  // Audio preview
  private previewAudio: HTMLAudioElement | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _previewingSoundId: number | null = null; // TODO: implement stop previous preview
  
  constructor(apiKey: string) {
    this.client = new FreesoundClient(apiKey);
    this.cache = new SampleCache();
    this.attributionManager = new AttributionManager();
    this.autoMapper = new SampleAutoMapper();
    
    // Mark intentionally unused members (for future implementation)
    void this._previewingSoundId;
  }
  
  /**
   * Initialize browser
   */
  async initialize(): Promise<void> {
    await this.cache.initialize();
  }
  
  /**
   * Search for sounds
   */
  async search(filters: FreesoundSearchFilters): Promise<FreesoundSearchResult> {
    const result = await this.client.search(filters);
    this.searchResults = result.results;
    return result;
  }
  
  /**
   * Quick search presets
   */
  async searchInstrument(
    instrument: 'piano' | 'guitar' | 'strings' | 'brass' | 'drums' | 'synth',
    options?: {
      key?: string;
      singleShot?: boolean;
      looped?: boolean;
    }
  ): Promise<FreesoundSearchResult> {
    const instrumentTags: Record<string, string[]> = {
      piano: ['piano', 'acoustic-piano', 'grand-piano'],
      guitar: ['guitar', 'acoustic-guitar', 'electric-guitar'],
      strings: ['strings', 'violin', 'cello', 'viola', 'orchestral'],
      brass: ['brass', 'trumpet', 'trombone', 'horn', 'tuba'],
      drums: ['drums', 'drum-kit', 'percussion', 'kick', 'snare', 'hihat'],
      synth: ['synth', 'synthesizer', 'electronic', 'analog'],
    };
    
    const tags = instrumentTags[instrument] ?? [instrument];
    const firstTag = tags[0] ?? instrument;
    
    const filters: FreesoundSearchFilters = {
      query: instrument,
      tags: [firstTag],
      sort: 'rating_desc',
      minDuration: options?.looped ? 1 : 0.1,
      maxDuration: options?.singleShot ? 5 : 30,
    };
    
    if (options?.key) {
      filters.key = options.key;
    }
    
    return this.search(filters);
  }
  
  /**
   * Preview a sound
   */
  async preview(soundId: number): Promise<void> {
    // Stop current preview
    this.stopPreview();
    
    const sound = this.searchResults.find(s => s.id === soundId);
    if (!sound || !sound.previewUrl) return;
    
    this.previewAudio = new Audio(sound.previewUrl);
    this.previewAudio.play();
    this._previewingSoundId = soundId;
  }
  
  /**
   * Stop preview
   */
  stopPreview(): void {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
    this._previewingSoundId = null;
  }
  
  /**
   * Download a sound
   */
  async download(soundId: number, useCache = true): Promise<ArrayBuffer> {
    // Check cache first
    if (useCache) {
      const cached = await this.cache.getSample(soundId);
      if (cached) {
        return cached;
      }
    }
    
    // Update status
    const sound = this.searchResults.find(s => s.id === soundId) ?? await this.client.getSound(soundId);
    
    this.downloads.set(soundId, {
      soundId,
      name: sound.name,
      status: 'downloading',
      progress: 0,
    });
    
    try {
      // Download preview (original requires OAuth)
      const data = await this.client.downloadPreview(sound);
      
      // Store in cache
      await this.cache.storeSample(soundId, data, sound);
      
      // Add attribution
      this.attributionManager.addAttribution(sound);
      
      // Update status
      this.downloads.set(soundId, {
        soundId,
        name: sound.name,
        status: 'completed',
        progress: 1,
      });
      
      return data;
    } catch (error) {
      this.downloads.set(soundId, {
        soundId,
        name: sound.name,
        status: 'error',
        progress: 0,
        error: String(error),
      });
      throw error;
    }
  }
  
  /**
   * Download multiple sounds
   */
  async downloadMultiple(soundIds: number[]): Promise<Map<number, ArrayBuffer>> {
    const results = new Map<number, ArrayBuffer>();
    
    for (const id of soundIds) {
      try {
        const data = await this.download(id);
        results.set(id, data);
      } catch (error) {
        console.error(`Failed to download sound ${id}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Select/deselect sound
   */
  toggleSelection(soundId: number): void {
    if (this.selectedSounds.has(soundId)) {
      this.selectedSounds.delete(soundId);
    } else {
      this.selectedSounds.add(soundId);
    }
  }
  
  /**
   * Get selected sounds
   */
  getSelectedSounds(): FreesoundMetadata[] {
    return this.searchResults.filter(s => this.selectedSounds.has(s.id));
  }
  
  /**
   * Auto-map selected sounds
   */
  autoMapSelected(): SampleZone[] {
    const selected = this.getSelectedSounds();
    return this.autoMapper.autoMapSamples(selected);
  }
  
  /**
   * Create velocity layers from selected
   */
  createVelocityLayersFromSelected(): SampleZone[] {
    const selected = this.getSelectedSounds();
    return this.autoMapper.createVelocityLayers(selected);
  }
  
  /**
   * Get download status
   */
  getDownloadStatus(soundId: number): DownloadStatus | undefined {
    return this.downloads.get(soundId);
  }
  
  /**
   * Get all download statuses
   */
  getAllDownloadStatuses(): DownloadStatus[] {
    return Array.from(this.downloads.values());
  }
  
  /**
   * Get attribution manager
   */
  getAttributionManager(): AttributionManager {
    return this.attributionManager;
  }
  
  /**
   * Get cache
   */
  getCache(): SampleCache {
    return this.cache;
  }
  
  /**
   * Get client
   */
  getClient(): FreesoundClient {
    return this.client;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create Freesound browser
 */
export function createFreesoundBrowser(apiKey: string): FreesoundBrowser {
  return new FreesoundBrowser(apiKey);
}

/**
 * Create Freesound client
 */
export function createFreesoundClient(apiKey: string): FreesoundClient {
  return new FreesoundClient(apiKey);
}
