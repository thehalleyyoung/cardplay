/**
 * @fileoverview Synth Asset Database Access Layer
 * 
 * Provides TypeScript access to the SQLite database of synth wavetables
 * and presets downloaded from Surge and Vital.
 * 
 * @module @cardplay/core/audio/synth-asset-db
 */

import Database from 'better-sqlite3';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw wavetable record from database.
 */
export interface WavetableRecord {
  id: string;
  name: string;
  source: 'surge' | 'vital';
  category: string;
  path: string;
  frame_count: number;
  frame_size: number;
  sample_rate: number;
  bit_depth: number;
  is_third_party: number; // SQLite stores as 0/1
  contributor: string | null;
  /** Base64-encoded Float32Array of all samples */
  data_b64: string | null;
  sha256: string | null;
  file_size: number;
  created_at: string;
}

/**
 * Parsed wavetable with decoded data.
 */
export interface ParsedWavetable {
  id: string;
  name: string;
  source: 'surge' | 'vital';
  category: string;
  path: string;
  frameCount: number;
  frameSize: number;
  sampleRate: number;
  bitDepth: number;
  isThirdParty: boolean;
  contributor: string | null;
  /** Decoded waveform data */
  data: Float32Array | null;
  sha256: string | null;
  fileSize: number;
}

/**
 * Oscillator settings from a preset.
 */
export interface OscillatorSettings {
  index: number;
  osc_type: number;
  osc_type_name: string;
  wavetable_name: string | null;
  wavetable_position: number;
  level: number;
  pan: number;
  tune_semitones: number;
  tune_cents: number;
  unison_voices: number;
  unison_detune: number;
  unison_blend: number;
  phase: number;
  phase_randomize: number;
  distortion: number;
  fm_depth: number;
  extra_params: Record<string, unknown>;
}

/**
 * Filter settings from a preset.
 */
export interface FilterSettings {
  index: number;
  filter_type: number;
  filter_type_name: string;
  cutoff: number;
  resonance: number;
  drive: number;
  mix: number;
  keytrack: number;
  env_depth: number;
  extra_params: Record<string, unknown>;
}

/**
 * Envelope settings.
 */
export interface EnvelopeSettings {
  name: string;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attack_curve: number;
  decay_curve: number;
  release_curve: number;
}

/**
 * LFO settings.
 */
export interface LFOSettings {
  index: number;
  waveform: number;
  waveform_name: string;
  rate: number;
  sync: boolean;
  sync_rate: string;
  depth: number;
  phase: number;
  delay: number;
  fade_in: number;
}

/**
 * Modulation routing.
 */
export interface ModulationSettings {
  source: string;
  destination: string;
  amount: number;
  bipolar: boolean;
}

/**
 * Effect settings.
 */
export interface EffectSettings {
  effect_type: string;
  enabled: boolean;
  mix: number;
  params: Record<string, unknown>;
}

/**
 * Raw preset record from database.
 */
export interface PresetRecord {
  id: string;
  name: string;
  source: string;
  category: string;
  path: string;
  author: string | null;
  description: string | null;
  tags: string;
  oscillators: string;
  filters: string;
  envelopes: string;
  lfos: string;
  modulations: string;
  effects: string;
  master_volume: number;
  master_tune: number;
  polyphony: number;
  portamento: number;
  raw_data: string | null;
  sha256: string | null;
  file_size: number;
  created_at: string;
}

/**
 * Parsed preset with decoded JSON fields.
 */
export interface ParsedPreset {
  id: string;
  name: string;
  source: 'surge' | 'vital';
  category: string;
  path: string;
  author: string | null;
  description: string | null;
  tags: string[];
  oscillators: OscillatorSettings[];
  filters: FilterSettings[];
  envelopes: EnvelopeSettings[];
  lfos: LFOSettings[];
  modulations: ModulationSettings[];
  effects: EffectSettings[];
  masterVolume: number;
  masterTune: number;
  polyphony: number;
  portamento: number;
  rawData: string | null;
  sha256: string | null;
  fileSize: number;
}

/**
 * Database statistics.
 */
export interface DatabaseStats {
  totalWavetables: number;
  totalPresets: number;
  surgeWavetables: number;
  vitalWavetables: number;
  surgePresets: number;
  vitalPresets: number;
  wavetableCategories: number;
  presetCategories: number;
  lastUpdated: string | null;
}

// ============================================================================
// DATABASE CLASS
// ============================================================================

/**
 * Synth asset database access class.
 * 
 * @example
 * ```typescript
 * const db = new SynthAssetDatabase('./synth-assets.db');
 * 
 * // Get all Surge wavetables
 * const surgeWavetables = db.getWavetablesBySource('surge');
 * 
 * // Search for pads
 * const padPresets = db.searchPresets('pad');
 * 
 * // Get wavetable data for playback
 * const wt = db.getWavetableById('abc123');
 * if (wt) {
 *   const data = db.getWavetableData(wt.id);
 *   // Use data in wavetable oscillator
 * }
 * 
 * db.close();
 * ```
 */
export class SynthAssetDatabase {
  private db: Database.Database;
  private statements: {
    getAllWavetables: Database.Statement;
    getWavetableById: Database.Statement;
    getWavetablesBySource: Database.Statement;
    getWavetablesByCategory: Database.Statement;
    searchWavetables: Database.Statement;
    getWavetableCategories: Database.Statement;
    getAllPresets: Database.Statement;
    getPresetById: Database.Statement;
    getPresetsBySource: Database.Statement;
    getPresetsByCategory: Database.Statement;
    getPresetsByAuthor: Database.Statement;
    searchPresets: Database.Statement;
    getPresetCategories: Database.Statement;
    getPresetAuthors: Database.Statement;
    getPresetsUsingWavetable: Database.Statement;
    getMetadata: Database.Statement;
    countWavetables: Database.Statement;
    countPresets: Database.Statement;
    countWavetablesBySource: Database.Statement;
    countPresetsBySource: Database.Statement;
    countWavetableCategories: Database.Statement;
    countPresetCategories: Database.Statement;
  };
  
  /**
   * Create a new database connection.
   * @param dbPath - Path to SQLite database file
   * @param options - Database options
   */
  constructor(dbPath: string, options?: { readonly?: boolean }) {
    this.db = new Database(dbPath, { readonly: options?.readonly ?? true });
    
    // Prepare all statements for better performance
    this.statements = {
      getAllWavetables: this.db.prepare(
        'SELECT * FROM wavetables ORDER BY source, category, name'
      ),
      getWavetableById: this.db.prepare(
        'SELECT * FROM wavetables WHERE id = ?'
      ),
      getWavetablesBySource: this.db.prepare(
        'SELECT * FROM wavetables WHERE source = ? ORDER BY category, name'
      ),
      getWavetablesByCategory: this.db.prepare(
        'SELECT * FROM wavetables WHERE category = ? ORDER BY name'
      ),
      searchWavetables: this.db.prepare(
        'SELECT * FROM wavetables WHERE name LIKE ? OR category LIKE ? ORDER BY name'
      ),
      getWavetableCategories: this.db.prepare(
        'SELECT DISTINCT category FROM wavetables ORDER BY category'
      ),
      getAllPresets: this.db.prepare(
        'SELECT * FROM presets ORDER BY source, category, name'
      ),
      getPresetById: this.db.prepare(
        'SELECT * FROM presets WHERE id = ?'
      ),
      getPresetsBySource: this.db.prepare(
        'SELECT * FROM presets WHERE source = ? ORDER BY category, name'
      ),
      getPresetsByCategory: this.db.prepare(
        'SELECT * FROM presets WHERE category = ? ORDER BY name'
      ),
      getPresetsByAuthor: this.db.prepare(
        'SELECT * FROM presets WHERE author = ? ORDER BY name'
      ),
      searchPresets: this.db.prepare(
        'SELECT * FROM presets WHERE name LIKE ? OR category LIKE ? OR author LIKE ? ORDER BY name'
      ),
      getPresetCategories: this.db.prepare(
        'SELECT DISTINCT category FROM presets ORDER BY category'
      ),
      getPresetAuthors: this.db.prepare(
        'SELECT DISTINCT author FROM presets WHERE author IS NOT NULL ORDER BY author'
      ),
      getPresetsUsingWavetable: this.db.prepare(
        'SELECT * FROM presets WHERE oscillators LIKE ? ORDER BY name'
      ),
      getMetadata: this.db.prepare(
        'SELECT value FROM metadata WHERE key = ?'
      ),
      countWavetables: this.db.prepare(
        'SELECT COUNT(*) as count FROM wavetables'
      ),
      countPresets: this.db.prepare(
        'SELECT COUNT(*) as count FROM presets'
      ),
      countWavetablesBySource: this.db.prepare(
        'SELECT COUNT(*) as count FROM wavetables WHERE source = ?'
      ),
      countPresetsBySource: this.db.prepare(
        'SELECT COUNT(*) as count FROM presets WHERE source = ?'
      ),
      countWavetableCategories: this.db.prepare(
        'SELECT COUNT(DISTINCT category) as count FROM wavetables'
      ),
      countPresetCategories: this.db.prepare(
        'SELECT COUNT(DISTINCT category) as count FROM presets'
      ),
    };
  }
  
  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }
  
  // ==========================================================================
  // WAVETABLE QUERIES
  // ==========================================================================
  
  /**
   * Get all wavetables.
   */
  getAllWavetables(): WavetableRecord[] {
    return this.statements.getAllWavetables.all() as WavetableRecord[];
  }
  
  /**
   * Get a wavetable by ID.
   */
  getWavetableById(id: string): WavetableRecord | undefined {
    return this.statements.getWavetableById.get(id) as WavetableRecord | undefined;
  }
  
  /**
   * Get wavetables by source (surge or vital).
   */
  getWavetablesBySource(source: 'surge' | 'vital'): WavetableRecord[] {
    return this.statements.getWavetablesBySource.all(source) as WavetableRecord[];
  }
  
  /**
   * Get wavetables by category.
   */
  getWavetablesByCategory(category: string): WavetableRecord[] {
    return this.statements.getWavetablesByCategory.all(category) as WavetableRecord[];
  }
  
  /**
   * Search wavetables by name or category.
   */
  searchWavetables(query: string): WavetableRecord[] {
    const pattern = `%${query}%`;
    return this.statements.searchWavetables.all(pattern, pattern) as WavetableRecord[];
  }
  
  /**
   * Get all unique wavetable categories.
   */
  getWavetableCategories(): string[] {
    const rows = this.statements.getWavetableCategories.all() as { category: string }[];
    return rows.map(r => r.category);
  }
  
  /**
   * Decode wavetable data from a record.
   */
  getWavetableData(id: string): Float32Array | null {
    const wt = this.getWavetableById(id);
    if (!wt?.data_b64) return null;
    return decodeWavetableData(wt.data_b64);
  }
  
  /**
   * Get a parsed wavetable with decoded data.
   */
  getParsedWavetable(id: string): ParsedWavetable | null {
    const record = this.getWavetableById(id);
    if (!record) return null;
    return parseWavetableRecord(record);
  }
  
  /**
   * Get all parsed wavetables (without data for performance).
   */
  getAllParsedWavetables(includeData = false): ParsedWavetable[] {
    const records = this.getAllWavetables();
    return records.map(r => parseWavetableRecord(r, includeData));
  }
  
  // ==========================================================================
  // PRESET QUERIES
  // ==========================================================================
  
  /**
   * Get all presets.
   */
  getAllPresets(): PresetRecord[] {
    return this.statements.getAllPresets.all() as PresetRecord[];
  }
  
  /**
   * Get a preset by ID.
   */
  getPresetById(id: string): PresetRecord | undefined {
    return this.statements.getPresetById.get(id) as PresetRecord | undefined;
  }
  
  /**
   * Get presets by source (surge or vital).
   */
  getPresetsBySource(source: 'surge' | 'vital'): PresetRecord[] {
    return this.statements.getPresetsBySource.all(source) as PresetRecord[];
  }
  
  /**
   * Get presets by category.
   */
  getPresetsByCategory(category: string): PresetRecord[] {
    return this.statements.getPresetsByCategory.all(category) as PresetRecord[];
  }
  
  /**
   * Get presets by author.
   */
  getPresetsByAuthor(author: string): PresetRecord[] {
    return this.statements.getPresetsByAuthor.all(author) as PresetRecord[];
  }
  
  /**
   * Search presets by name, category, or author.
   */
  searchPresets(query: string): PresetRecord[] {
    const pattern = `%${query}%`;
    return this.statements.searchPresets.all(pattern, pattern, pattern) as PresetRecord[];
  }
  
  /**
   * Get all unique preset categories.
   */
  getPresetCategories(): string[] {
    const rows = this.statements.getPresetCategories.all() as { category: string }[];
    return rows.map(r => r.category);
  }
  
  /**
   * Get all unique preset authors.
   */
  getPresetAuthors(): string[] {
    const rows = this.statements.getPresetAuthors.all() as { author: string }[];
    return rows.map(r => r.author);
  }
  
  /**
   * Find presets using a specific wavetable.
   */
  getPresetsUsingWavetable(wavetableName: string): PresetRecord[] {
    return this.statements.getPresetsUsingWavetable.all(
      `%"wavetable_name":"${wavetableName}"%`
    ) as PresetRecord[];
  }
  
  /**
   * Get a parsed preset with decoded JSON fields.
   */
  getParsedPreset(id: string): ParsedPreset | null {
    const record = this.getPresetById(id);
    if (!record) return null;
    return parsePresetRecord(record);
  }
  
  /**
   * Get all parsed presets.
   */
  getAllParsedPresets(): ParsedPreset[] {
    const records = this.getAllPresets();
    return records.map(parsePresetRecord);
  }
  
  /**
   * Search parsed presets.
   */
  searchParsedPresets(query: string): ParsedPreset[] {
    const records = this.searchPresets(query);
    return records.map(parsePresetRecord);
  }
  
  // ==========================================================================
  // STATISTICS
  // ==========================================================================
  
  /**
   * Get database statistics.
   */
  getStats(): DatabaseStats {
    const totalWavetables = (this.statements.countWavetables.get() as { count: number }).count;
    const totalPresets = (this.statements.countPresets.get() as { count: number }).count;
    const surgeWavetables = (this.statements.countWavetablesBySource.get('surge') as { count: number }).count;
    const vitalWavetables = (this.statements.countWavetablesBySource.get('vital') as { count: number }).count;
    const surgePresets = (this.statements.countPresetsBySource.get('surge') as { count: number }).count;
    const vitalPresets = (this.statements.countPresetsBySource.get('vital') as { count: number }).count;
    const wavetableCategories = (this.statements.countWavetableCategories.get() as { count: number }).count;
    const presetCategories = (this.statements.countPresetCategories.get() as { count: number }).count;
    
    const lastUpdatedRow = this.statements.getMetadata.get('last_updated') as { value: string } | undefined;
    const lastUpdated = lastUpdatedRow?.value ?? null;
    
    return {
      totalWavetables,
      totalPresets,
      surgeWavetables,
      vitalWavetables,
      surgePresets,
      vitalPresets,
      wavetableCategories,
      presetCategories,
      lastUpdated,
    };
  }
  
  /**
   * Get metadata value.
   */
  getMetadata(key: string): string | null {
    const row = this.statements.getMetadata.get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Decode base64 wavetable data to Float32Array.
 */
export function decodeWavetableData(data_b64: string): Float32Array {
  const buffer = Buffer.from(data_b64, 'base64');
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}

/**
 * Extract a single frame from wavetable data.
 */
export function extractWavetableFrame(
  data: Float32Array,
  frameIndex: number,
  frameSize: number
): Float32Array {
  const start = frameIndex * frameSize;
  return data.slice(start, start + frameSize);
}

/**
 * Get wavetable frame at fractional position (with linear interpolation).
 */
export function interpolateWavetableFrame(
  data: Float32Array,
  position: number,
  frameCount: number,
  frameSize: number
): Float32Array {
  const pos = Math.max(0, Math.min(1, position)) * (frameCount - 1);
  const frame0 = Math.floor(pos);
  const frame1 = Math.min(frame0 + 1, frameCount - 1);
  const frac = pos - frame0;
  
  const f0 = extractWavetableFrame(data, frame0, frameSize);
  const f1 = extractWavetableFrame(data, frame1, frameSize);
  
  const result = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    result[i] = f0[i]! * (1 - frac) + f1[i]! * frac;
  }
  
  return result;
}

/**
 * Parse a wavetable record into a more usable format.
 */
export function parseWavetableRecord(
  record: WavetableRecord,
  includeData = true
): ParsedWavetable {
  return {
    id: record.id,
    name: record.name,
    source: record.source as 'surge' | 'vital',
    category: record.category,
    path: record.path,
    frameCount: record.frame_count,
    frameSize: record.frame_size,
    sampleRate: record.sample_rate,
    bitDepth: record.bit_depth,
    isThirdParty: Boolean(record.is_third_party),
    contributor: record.contributor,
    data: includeData && record.data_b64 ? decodeWavetableData(record.data_b64) : null,
    sha256: record.sha256,
    fileSize: record.file_size,
  };
}

/**
 * Parse a preset record into a more usable format.
 */
export function parsePresetRecord(record: PresetRecord): ParsedPreset {
  return {
    id: record.id,
    name: record.name,
    source: record.source as 'surge' | 'vital',
    category: record.category,
    path: record.path,
    author: record.author,
    description: record.description,
    tags: safeJsonParse(record.tags, []),
    oscillators: safeJsonParse(record.oscillators, []),
    filters: safeJsonParse(record.filters, []),
    envelopes: safeJsonParse(record.envelopes, []),
    lfos: safeJsonParse(record.lfos, []),
    modulations: safeJsonParse(record.modulations, []),
    effects: safeJsonParse(record.effects, []),
    masterVolume: record.master_volume,
    masterTune: record.master_tune,
    polyphony: record.polyphony,
    portamento: record.portamento,
    rawData: record.raw_data,
    sha256: record.sha256,
    fileSize: record.file_size,
  };
}

/**
 * Safely parse JSON with fallback.
 */
function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// PRESET ANALYSIS UTILITIES
// ============================================================================

/**
 * Get all wavetables referenced by a preset.
 */
export function getPresetWavetables(preset: ParsedPreset): string[] {
  const wavetables: string[] = [];
  
  for (const osc of preset.oscillators) {
    if (osc.wavetable_name) {
      wavetables.push(osc.wavetable_name);
    }
  }
  
  return [...new Set(wavetables)];
}

/**
 * Get all modulation sources used in a preset.
 */
export function getPresetModSources(preset: ParsedPreset): string[] {
  const sources = preset.modulations.map(m => m.source);
  return [...new Set(sources)];
}

/**
 * Get all modulation destinations used in a preset.
 */
export function getPresetModDestinations(preset: ParsedPreset): string[] {
  const destinations = preset.modulations.map(m => m.destination);
  return [...new Set(destinations)];
}

/**
 * Get enabled effects in a preset.
 */
export function getPresetEnabledEffects(preset: ParsedPreset): string[] {
  return preset.effects
    .filter(fx => fx.enabled)
    .map(fx => fx.effect_type);
}

/**
 * Check if preset uses a specific oscillator type.
 */
export function presetUsesOscType(preset: ParsedPreset, oscTypeName: string): boolean {
  return preset.oscillators.some(
    osc => osc.osc_type_name.toLowerCase() === oscTypeName.toLowerCase()
  );
}

/**
 * Check if preset uses a specific filter type.
 */
export function presetUsesFilterType(preset: ParsedPreset, filterTypeName: string): boolean {
  return preset.filters.some(
    f => f.filter_type_name.toLowerCase() === filterTypeName.toLowerCase()
  );
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new synth asset database connection.
 * 
 * @example
 * ```typescript
 * const db = createSynthAssetDatabase('./synth-assets.db');
 * const pads = db.searchParsedPresets('pad');
 * console.log(`Found ${pads.length} pad presets`);
 * db.close();
 * ```
 */
export function createSynthAssetDatabase(
  dbPath: string,
  options?: { readonly?: boolean }
): SynthAssetDatabase {
  return new SynthAssetDatabase(dbPath, options);
}
