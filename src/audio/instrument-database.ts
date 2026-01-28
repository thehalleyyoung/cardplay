// =============================================================================
// WAVETABLE INSTRUMENT - UNIFIED DATABASE ACCESS
// =============================================================================

import Database from 'better-sqlite3';
import * as path from 'path';
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
  createInitPreset,
  createDefaultOscillator,
  createDefaultFilter,
  createDefaultEnvelope,
  createDefaultLFO,
  FilterType,
  LFOShape
} from './unified-preset';

// =============================================================================
// DATABASE TYPES
// =============================================================================

export interface CategoryInfo {
  id: InstrumentCategory;
  name: string;
  description?: string;
  displayOrder: number;
  presetCount?: number;
}

export interface SubcategoryInfo {
  id: string;
  categoryId: InstrumentCategory;
  name: string;
  displayOrder: number;
  presetCount?: number;
}

export interface WavetableRecord {
  id: string;
  name: string;
  soundCategory: string;
  originalSource: 'surge' | 'vital';
  originalCategory: string;
  path: string;
  frameCount: number;
  frameSize: number;
  sampleRate: number;
  isThirdParty: boolean;
  contributor?: string;
  sha256: string;
  fileSize: number;
}

export interface PresetRecord {
  id: string;
  name: string;
  categoryId: InstrumentCategory;
  subcategoryId: string;
  originalSource: 'surge' | 'vital';
  originalCategory: string;
  path: string;
  author?: string;
  description?: string;
  tags: string[];
  
  // Unified preset data
  oscillators: any[];
  filters: any[];
  envelopes: any[];
  lfos: any[];
  modulations: any[];
  effects: any[];
  
  masterVolume: number;
  polyphony: number;
  portamento: number;
  
  sha256: string;
  fileSize: number;
}

// =============================================================================
// INSTRUMENT DATABASE CLASS
// =============================================================================

export class InstrumentDatabase {
  private db: Database.Database;
  private wavetableCache = new Map<string, Float32Array[]>();
  
  // Prepared statements
  private stmtGetCategories: Database.Statement;
  private stmtGetSubcategories: Database.Statement;
  private stmtGetWavetableById: Database.Statement;
  private stmtGetWavetableByName: Database.Statement;
  private stmtGetWavetablesByCategory: Database.Statement;
  private stmtGetPresetById: Database.Statement;
  private stmtGetPresetsByCategory: Database.Statement;
  private stmtGetPresetsBySubcategory: Database.Statement;
  private stmtSearchPresets: Database.Statement;
  private stmtGetPresetWavetables: Database.Statement;
  private stmtGetWavetableData: Database.Statement;
  
  constructor(dbPath?: string) {
    const defaultPath = path.join(__dirname, '../../assets/synth-instruments.db');
    this.db = new Database(dbPath || defaultPath, { readonly: true });
    
    // Initialize prepared statements
    this.stmtGetCategories = this.db.prepare(`
      SELECT c.*, COUNT(p.id) as preset_count 
      FROM categories c 
      LEFT JOIN presets p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order
    `);
    
    this.stmtGetSubcategories = this.db.prepare(`
      SELECT s.*, COUNT(p.id) as preset_count
      FROM subcategories s
      LEFT JOIN presets p ON p.subcategory_id = s.id
      WHERE s.category_id = ?
      GROUP BY s.id
      ORDER BY s.display_order
    `);
    
    this.stmtGetWavetableById = this.db.prepare(`
      SELECT id, name, sound_category, original_source, original_category,
             path, frame_count, frame_size, sample_rate, is_third_party,
             contributor, sha256, file_size
      FROM wavetables WHERE id = ?
    `);
    
    this.stmtGetWavetableByName = this.db.prepare(`
      SELECT id, name, sound_category, original_source, original_category,
             path, frame_count, frame_size, sample_rate, is_third_party,
             contributor, sha256, file_size
      FROM wavetables WHERE name = ? COLLATE NOCASE
    `);
    
    this.stmtGetWavetablesByCategory = this.db.prepare(`
      SELECT id, name, sound_category, original_source, original_category,
             path, frame_count, frame_size, sample_rate, is_third_party,
             contributor, sha256, file_size
      FROM wavetables WHERE sound_category = ?
      ORDER BY name
    `);
    
    this.stmtGetPresetById = this.db.prepare(`
      SELECT * FROM presets WHERE id = ?
    `);
    
    this.stmtGetPresetsByCategory = this.db.prepare(`
      SELECT * FROM presets WHERE category_id = ? ORDER BY name
    `);
    
    this.stmtGetPresetsBySubcategory = this.db.prepare(`
      SELECT * FROM presets WHERE subcategory_id = ? ORDER BY name
    `);
    
    this.stmtSearchPresets = this.db.prepare(`
      SELECT * FROM presets 
      WHERE name LIKE ? OR original_category LIKE ?
      ORDER BY name
      LIMIT ?
    `);
    
    this.stmtGetPresetWavetables = this.db.prepare(`
      SELECT wavetable_name, oscillator_index
      FROM preset_wavetables WHERE preset_id = ?
      ORDER BY oscillator_index
    `);
    
    this.stmtGetWavetableData = this.db.prepare(`
      SELECT data_b64 FROM wavetables WHERE id = ?
    `);
  }
  
  // ===========================================================================
  // CATEGORY QUERIES
  // ===========================================================================
  
  getCategories(): CategoryInfo[] {
    const rows = this.stmtGetCategories.all() as any[];
    return rows.map(row => ({
      id: row.id as InstrumentCategory,
      name: row.name,
      description: row.description,
      displayOrder: row.display_order,
      presetCount: row.preset_count
    }));
  }
  
  getSubcategories(categoryId: InstrumentCategory): SubcategoryInfo[] {
    const rows = this.stmtGetSubcategories.all(categoryId) as any[];
    return rows.map(row => ({
      id: row.id,
      categoryId: row.category_id as InstrumentCategory,
      name: row.name,
      displayOrder: row.display_order,
      presetCount: row.preset_count
    }));
  }
  
  // ===========================================================================
  // WAVETABLE QUERIES
  // ===========================================================================
  
  getWavetableById(id: string): WavetableRecord | null {
    const row = this.stmtGetWavetableById.get(id) as any;
    return row ? this.parseWavetableRow(row) : null;
  }
  
  getWavetableByName(name: string): WavetableRecord | null {
    const row = this.stmtGetWavetableByName.get(name) as any;
    return row ? this.parseWavetableRow(row) : null;
  }
  
  getWavetablesByCategory(soundCategory: string): WavetableRecord[] {
    const rows = this.stmtGetWavetablesByCategory.all(soundCategory) as any[];
    return rows.map(row => this.parseWavetableRow(row));
  }
  
  getAllWavetables(): WavetableRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, name, sound_category, original_source, original_category,
             path, frame_count, frame_size, sample_rate, is_third_party,
             contributor, sha256, file_size
      FROM wavetables ORDER BY name
    `);
    return (stmt.all() as any[]).map(row => this.parseWavetableRow(row));
  }
  
  getWavetableData(id: string): Float32Array[] | null {
    // Check cache first
    if (this.wavetableCache.has(id)) {
      return this.wavetableCache.get(id)!;
    }
    
    const row = this.stmtGetWavetableData.get(id) as any;
    if (!row?.data_b64) return null;
    
    const info = this.getWavetableById(id);
    if (!info) return null;
    
    // Decode base64 to Float32Array
    const buffer = Buffer.from(row.data_b64, 'base64');
    const totalSamples = info.frameCount * info.frameSize;
    const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, totalSamples);
    
    // Split into frames
    const frames: Float32Array[] = [];
    for (let i = 0; i < info.frameCount; i++) {
      const start = i * info.frameSize;
      frames.push(float32.slice(start, start + info.frameSize));
    }
    
    // Cache result
    this.wavetableCache.set(id, frames);
    
    return frames;
  }
  
  private parseWavetableRow(row: any): WavetableRecord {
    return {
      id: row.id,
      name: row.name,
      soundCategory: row.sound_category,
      originalSource: row.original_source,
      originalCategory: row.original_category || '',
      path: row.path || '',
      frameCount: row.frame_count,
      frameSize: row.frame_size,
      sampleRate: row.sample_rate || 44100,
      isThirdParty: Boolean(row.is_third_party),
      contributor: row.contributor,
      sha256: row.sha256 || '',
      fileSize: row.file_size || 0
    };
  }
  
  // ===========================================================================
  // PRESET QUERIES
  // ===========================================================================
  
  getPresetById(id: string): PresetRecord | null {
    const row = this.stmtGetPresetById.get(id) as any;
    return row ? this.parsePresetRow(row) : null;
  }
  
  getPresetsByCategory(categoryId: InstrumentCategory): PresetRecord[] {
    const rows = this.stmtGetPresetsByCategory.all(categoryId) as any[];
    return rows.map(row => this.parsePresetRow(row));
  }
  
  getPresetsBySubcategory(subcategoryId: string): PresetRecord[] {
    const rows = this.stmtGetPresetsBySubcategory.all(subcategoryId) as any[];
    return rows.map(row => this.parsePresetRow(row));
  }
  
  searchPresets(query: string, limit = 50): PresetRecord[] {
    const pattern = `%${query}%`;
    const rows = this.stmtSearchPresets.all(pattern, pattern, limit) as any[];
    return rows.map(row => this.parsePresetRow(row));
  }
  
  getAllPresets(): PresetRecord[] {
    const stmt = this.db.prepare('SELECT * FROM presets ORDER BY category_id, name');
    return (stmt.all() as any[]).map(row => this.parsePresetRow(row));
  }
  
  getPresetWavetableNames(presetId: string): { name: string; oscillatorIndex: number }[] {
    const rows = this.stmtGetPresetWavetables.all(presetId) as any[];
    return rows.map(row => ({
      name: row.wavetable_name,
      oscillatorIndex: row.oscillator_index
    }));
  }
  
  private parsePresetRow(row: any): PresetRecord {
    return {
      id: row.id,
      name: row.name,
      categoryId: row.category_id as InstrumentCategory,
      subcategoryId: row.subcategory_id || '',
      originalSource: row.original_source,
      originalCategory: row.original_category || '',
      path: row.path || '',
      author: row.author,
      description: row.description,
      tags: this.safeJsonParse(row.tags, []),
      oscillators: this.safeJsonParse(row.oscillators, []),
      filters: this.safeJsonParse(row.filters, []),
      envelopes: this.safeJsonParse(row.envelopes, []),
      lfos: this.safeJsonParse(row.lfos, []),
      modulations: this.safeJsonParse(row.modulations, []),
      effects: this.safeJsonParse(row.effects, []),
      masterVolume: row.master_volume ?? 1.0,
      polyphony: row.polyphony ?? 16,
      portamento: row.portamento ?? 0,
      sha256: row.sha256 || '',
      fileSize: row.file_size || 0
    };
  }
  
  private safeJsonParse<T>(str: string | null | undefined, defaultValue: T): T {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }
  
  // ===========================================================================
  // UNIFIED PRESET CONVERSION
  // ===========================================================================
  
  loadPresetAsUnified(presetId: string): UnifiedPreset | null {
    const record = this.getPresetById(presetId);
    if (!record) return null;
    
    const preset = createInitPreset();
    preset.name = record.name;
    preset.author = record.author ?? null;
    preset.description = record.description ?? null;
    preset.category = record.categoryId;
    preset.subCategory = record.subcategoryId as InstrumentSubCategory || 'generic';
    preset.tags = record.tags;
    
    // Map oscillators
    if (record.oscillators.length > 0) {
      preset.oscillators = record.oscillators.map((osc: any, idx: number): UnifiedOscillator => {
        const defaultOsc = createDefaultOscillator(idx);
        return {
          ...defaultOsc,
          enabled: osc.enabled ?? true,
          wavetableId: osc.wavetable_name ?? null,
          wavetablePosition: osc.morph_position ?? 0.5,
          semitone: osc.tune_semitones ?? 0,
          cents: osc.tune_cents ?? 0,
          pan: osc.pan ?? 0,
          level: osc.level ?? 0.7,
          phaseRandom: osc.retrigger ? 0 : 1,
          unison: {
            voices: osc.unison_voices ?? 1,
            detune: (osc.unison_detune ?? 0.1) * 100, // Convert to cents
            blend: osc.unison_blend ?? 0.5,
            spread: osc.unison_spread ?? 1
          }
        };
      });
    }
    
    // Map filters  
    if (record.filters.length > 0) {
      preset.filters = record.filters.map((flt: any, idx: number): UnifiedFilter => {
        const defaultFlt = createDefaultFilter(idx);
        return {
          ...defaultFlt,
          enabled: flt.enabled ?? true,
          filterType: this.mapFilterType(flt.type),
          cutoff: flt.cutoff ?? 1000,
          resonance: flt.resonance ?? 0,
          keytrack: flt.keytrack ?? 0,
          drive: flt.drive ?? 0,
          mix: flt.mix ?? 1
        };
      });
    }
    
    // Map envelopes
    if (record.envelopes.length > 0) {
      const envTypes = ['amp', 'filter', 'mod1', 'mod2', 'mod3', 'mod4'] as const;
      preset.envelopes = record.envelopes.map((env: any, idx: number): UnifiedEnvelope => {
        const defaultEnv = createDefaultEnvelope(envTypes[idx] || 'mod1');
        return {
          ...defaultEnv,
          attack: env.attack ?? 0.01,
          attackCurve: env.attack_curve ?? 0,
          decay: env.decay ?? 0.2,
          decayCurve: env.decay_curve ?? 0,
          sustain: env.sustain ?? 0.8,
          release: env.release ?? 0.3,
          releaseCurve: env.release_curve ?? 0
        };
      });
    }
    
    // Map LFOs
    if (record.lfos.length > 0) {
      preset.lfos = record.lfos.map((lfo: any, idx: number): UnifiedLFO => {
        const defaultLfo = createDefaultLFO(idx);
        return {
          ...defaultLfo,
          enabled: lfo.enabled ?? true,
          shape: this.mapLfoShape(lfo.shape),
          rateHz: lfo.rate ?? 1,
          tempoSync: lfo.sync ?? false,
          tempoDivision: lfo.sync_division ?? '1/4',
          phase: lfo.phase ?? 0,
          triggerMode: lfo.trigger_mode || 'free'
        };
      });
    }
    
    // Map modulations
    if (record.modulations.length > 0) {
      preset.modulations = record.modulations.map((mod: any): ModulationRoute => ({
        source: mod.source || 'env_amp',
        destination: mod.destination || 'osc1_level',
        amount: mod.amount ?? 0,
        bipolar: mod.bipolar ?? true
      }));
    }
    
    // Map effects
    if (record.effects.length > 0) {
      preset.effects = record.effects.map((fx: any): UnifiedEffect => ({
        type: fx.type || 'none',
        enabled: fx.enabled ?? true,
        mix: fx.mix ?? 0.5,
        params: fx.parameters || {}
      }));
    }
    
    preset.masterVolume = record.masterVolume;
    preset.polyphony = record.polyphony;
    preset.portamento = record.portamento;
    
    return preset;
  }
  
  private mapFilterType(type: string | undefined): FilterType {
    const typeMap: Record<string, FilterType> = {
      'lp': 'lp24',
      'lp12': 'lp12',
      'lp24': 'lp24',
      'lp48': 'lp48',
      'low': 'lp24',
      'lowpass': 'lp24',
      'hp': 'hp24',
      'hp12': 'hp12',
      'hp24': 'hp24',
      'hp48': 'hp48',
      'high': 'hp24',
      'highpass': 'hp24',
      'bp': 'bp24',
      'bp12': 'bp12',
      'bp24': 'bp24',
      'band': 'bp24',
      'bandpass': 'bp24',
      'notch': 'notch',
      'br': 'notch',
      'peak': 'peak',
      'comb': 'comb',
      'formant': 'formant',
      'ladder': 'ladder',
      'diode': 'diode',
      'svf': 'svf',
      'phaser': 'phaser'
    };
    return typeMap[(type || '').toLowerCase()] || 'lp24';
  }
  
  private mapLfoShape(shape: string | undefined): LFOShape {
    const shapeMap: Record<string, LFOShape> = {
      'sine': 'sine',
      'tri': 'triangle',
      'triangle': 'triangle',
      'saw': 'saw-up',
      'saw-up': 'saw-up',
      'saw-down': 'saw-down',
      'sawtooth': 'saw-up',
      'square': 'square',
      'pulse': 'pulse',
      'random': 'random',
      'noise': 'random',
      'sample_hold': 'sample-hold',
      'sample-hold': 'sample-hold',
      's&h': 'sample-hold',
      'sh': 'sample-hold'
    };
    return shapeMap[(shape || '').toLowerCase()] || 'sine';
  }
  
  // ===========================================================================
  // STATISTICS
  // ===========================================================================
  
  getStats(): {
    totalWavetables: number;
    totalPresets: number;
    presetsByCategory: { category: string; count: number }[];
    wavetablesByCategory: { category: string; count: number }[];
  } {
    const presetStats = this.db.prepare(`
      SELECT category_id, COUNT(*) as count 
      FROM presets GROUP BY category_id ORDER BY count DESC
    `).all() as any[];
    
    const wavetableStats = this.db.prepare(`
      SELECT sound_category, COUNT(*) as count
      FROM wavetables GROUP BY sound_category ORDER BY count DESC
    `).all() as any[];
    
    const totalWt = this.db.prepare('SELECT COUNT(*) as c FROM wavetables').get() as any;
    const totalPresets = this.db.prepare('SELECT COUNT(*) as c FROM presets').get() as any;
    
    return {
      totalWavetables: totalWt.c,
      totalPresets: totalPresets.c,
      presetsByCategory: presetStats.map(s => ({ category: s.category_id, count: s.count })),
      wavetablesByCategory: wavetableStats.map(s => ({ category: s.sound_category, count: s.count }))
    };
  }
  
  // ===========================================================================
  // CLEANUP
  // ===========================================================================
  
  clearCache(): void {
    this.wavetableCache.clear();
  }
  
  close(): void {
    this.db.close();
  }
}

// =============================================================================
// SINGLETON ACCESS
// =============================================================================

let _instance: InstrumentDatabase | null = null;

export function getInstrumentDatabase(dbPath?: string): InstrumentDatabase {
  if (!_instance) {
    _instance = new InstrumentDatabase(dbPath);
  }
  return _instance;
}

export function closeInstrumentDatabase(): void {
  if (_instance) {
    _instance.close();
    _instance = null;
  }
}
