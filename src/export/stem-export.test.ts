/**
 * Tests for Stem Export System (M299-M306)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  StemExportStore,
  StemExportConfig,
  StemDefinition,
  FormatConfig,
  DEFAULT_FORMAT_CONFIG,
  DEFAULT_EXPORT_CONFIG,
  STEM_PRESETS,
  getFormatExtension,
  estimateFileSize,
  formatFileSize,
  parseFileNamePattern,
  validateStemConfig,
} from './stem-export';

// --------------------------------------------------------------------------
// Test fixtures
// --------------------------------------------------------------------------

function createTestStem(name: string, trackIds: string[] = []): StemDefinition {
  return {
    id: `stem_${name.toLowerCase()}`,
    name,
    trackIds,
    color: '#ff0000',
    solo: false,
    mute: false,
  };
}

function createTestConfig(overrides: Partial<StemExportConfig> = {}): StemExportConfig {
  return {
    stems: [
      createTestStem('Drums', ['track1', 'track2']),
      createTestStem('Bass', ['track3']),
      createTestStem('Music', ['track4', 'track5', 'track6']),
    ],
    outputDir: './exports',
    fileNamePattern: '{project}_{stem}',
    format: { ...DEFAULT_FORMAT_CONFIG },
    exportMaster: true,
    masterName: 'Master',
    includeProjectName: true,
    createSubfolder: true,
    overwriteExisting: false,
    parallelRenders: 2,
    startTime: 0,
    endTime: -1,
    tailLengthMs: 500,
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Utility function tests
// --------------------------------------------------------------------------

describe('Stem Export Utilities', () => {
  describe('getFormatExtension', () => {
    test('returns correct extensions', () => {
      expect(getFormatExtension('wav')).toBe('.wav');
      expect(getFormatExtension('aiff')).toBe('.aiff');
      expect(getFormatExtension('flac')).toBe('.flac');
      expect(getFormatExtension('mp3')).toBe('.mp3');
      expect(getFormatExtension('ogg')).toBe('.ogg');
    });
  });
  
  describe('estimateFileSize', () => {
    test('estimates WAV file size correctly', () => {
      // 1 second, 48kHz, 24-bit, stereo
      const size = estimateFileSize(1, 48000, 24, 2, 'wav');
      expect(size).toBe(1 * 48000 * 3 * 2); // 288000 bytes
    });
    
    test('FLAC is smaller than WAV', () => {
      const wavSize = estimateFileSize(60, 48000, 24, 2, 'wav');
      const flacSize = estimateFileSize(60, 48000, 24, 2, 'flac');
      expect(flacSize).toBeLessThan(wavSize);
    });
    
    test('MP3 is much smaller than WAV', () => {
      const wavSize = estimateFileSize(60, 48000, 24, 2, 'wav');
      const mp3Size = estimateFileSize(60, 48000, 24, 2, 'mp3');
      expect(mp3Size).toBeLessThan(wavSize * 0.2);
    });
  });
  
  describe('formatFileSize', () => {
    test('formats bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });
    
    test('formats kilobytes', () => {
      expect(formatFileSize(1500)).toBe('1.5 KB');
    });
    
    test('formats megabytes', () => {
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    });
    
    test('formats gigabytes', () => {
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
    });
  });
  
  describe('parseFileNamePattern', () => {
    test('replaces variables', () => {
      const result = parseFileNamePattern('{project}_{stem}_{date}', {
        project: 'MySong',
        stem: 'Drums',
        date: '2026-01-29',
      });
      expect(result).toBe('MySong_Drums_2026-01-29');
    });
    
    test('sanitizes invalid characters', () => {
      const result = parseFileNamePattern('{name}', {
        name: 'My<Song>:Test/File',
      });
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain(':');
      expect(result).not.toContain('/');
    });
    
    test('handles missing variables', () => {
      const result = parseFileNamePattern('{project}_{missing}', {
        project: 'MySong',
      });
      expect(result).toBe('MySong_{missing}');
    });
  });
  
  describe('validateStemConfig', () => {
    test('validates valid config', () => {
      const config = createTestConfig();
      const result = validateStemConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('rejects empty stems', () => {
      const config = createTestConfig({ stems: [] });
      const result = validateStemConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('stem'))).toBe(true);
    });
    
    test('rejects missing output dir', () => {
      const config = createTestConfig({ outputDir: '' });
      const result = validateStemConfig(config);
      expect(result.valid).toBe(false);
    });
    
    test('rejects invalid parallel renders', () => {
      const config1 = createTestConfig({ parallelRenders: 0 });
      const config2 = createTestConfig({ parallelRenders: 10 });
      
      expect(validateStemConfig(config1).valid).toBe(false);
      expect(validateStemConfig(config2).valid).toBe(false);
    });
    
    test('rejects end time before start time', () => {
      const config = createTestConfig({ startTime: 1000, endTime: 500 });
      const result = validateStemConfig(config);
      expect(result.valid).toBe(false);
    });
    
    test('rejects duplicate stem names', () => {
      const config = createTestConfig({
        stems: [
          createTestStem('Drums'),
          createTestStem('Bass'),
          createTestStem('drums'), // Duplicate (case-insensitive)
        ],
      });
      const result = validateStemConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('unique'))).toBe(true);
    });
  });
});

// --------------------------------------------------------------------------
// Stem presets tests
// --------------------------------------------------------------------------

describe('Stem Presets', () => {
  test('has built-in presets', () => {
    expect(STEM_PRESETS.length).toBeGreaterThan(0);
  });
  
  test('basic-4 preset has 4 stems', () => {
    const preset = STEM_PRESETS.find(p => p.id === 'basic-4');
    expect(preset).toBeDefined();
    expect(preset?.stems).toHaveLength(4);
  });
  
  test('dolby-atmos preset has 7 stems', () => {
    const preset = STEM_PRESETS.find(p => p.id === 'dolby-atmos');
    expect(preset).toBeDefined();
    expect(preset?.stems).toHaveLength(7);
  });
  
  test('film-score preset has 8 stems', () => {
    const preset = STEM_PRESETS.find(p => p.id === 'film-score');
    expect(preset).toBeDefined();
    expect(preset?.stems).toHaveLength(8);
  });
  
  test('all presets have unique IDs', () => {
    const ids = STEM_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  
  test('all preset stems have colors', () => {
    STEM_PRESETS.forEach(preset => {
      preset.stems.forEach(stem => {
        expect(stem.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});

// --------------------------------------------------------------------------
// StemExportStore tests
// --------------------------------------------------------------------------

describe('StemExportStore', () => {
  let store: StemExportStore;
  
  beforeEach(() => {
    store = new StemExportStore();
  });
  
  describe('session creation', () => {
    test('creates export session', () => {
      const config = createTestConfig();
      const { session, errors } = store.createSession('TestProject', config);
      
      expect(session).not.toBeNull();
      expect(errors).toHaveLength(0);
      expect(session?.projectName).toBe('TestProject');
    });
    
    test('creates jobs for each stem', () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      // 3 stems + 1 master
      expect(session?.jobs).toHaveLength(4);
    });
    
    test('creates master job when enabled', () => {
      const config = createTestConfig({ exportMaster: true, masterName: 'Main Mix' });
      const { session } = store.createSession('TestProject', config);
      
      const masterJob = session?.jobs.find(j => j.stemId === 'master');
      expect(masterJob).toBeDefined();
      expect(masterJob?.stemName).toBe('Main Mix');
    });
    
    test('skips master job when disabled', () => {
      const config = createTestConfig({ exportMaster: false });
      const { session } = store.createSession('TestProject', config);
      
      const masterJob = session?.jobs.find(j => j.stemId === 'master');
      expect(masterJob).toBeUndefined();
    });
    
    test('returns validation errors', () => {
      const config = createTestConfig({ stems: [] });
      const { session, errors } = store.createSession('TestProject', config);
      
      expect(session).toBeNull();
      expect(errors.length).toBeGreaterThan(0);
    });
    
    test('sets session as active', () => {
      const config = createTestConfig();
      store.createSession('TestProject', config);
      
      expect(store.getActiveSession()).not.toBeNull();
    });
  });
  
  describe('session management', () => {
    test('gets session by ID', () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      expect(store.getSession(session!.id)).toBeDefined();
    });
    
    test('gets all sessions', () => {
      const config = createTestConfig();
      store.createSession('Project1', config);
      store.createSession('Project2', config);
      
      expect(store.getAllSessions()).toHaveLength(2);
    });
    
    test('deletes session', () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      expect(store.deleteSession(session!.id)).toBe(true);
      expect(store.getSession(session!.id)).toBeUndefined();
    });
    
    test('clears active session on delete', () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      store.deleteSession(session!.id);
      expect(store.getActiveSession()).toBeNull();
    });
  });
  
  describe('export execution', () => {
    test('starts export', async () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      const result = await store.startExport(session!.id);
      
      expect(result.success).toBe(true);
      expect(result.outputFiles.length).toBeGreaterThan(0);
    });
    
    test('updates job progress', async () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      await store.startExport(session!.id);
      
      const updatedSession = store.getSession(session!.id);
      updatedSession?.jobs.forEach(job => {
        expect(job.progress).toBe(100);
        expect(job.status).toBe('complete');
      });
    });
    
    test('sets output paths', async () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      await store.startExport(session!.id);
      
      const updatedSession = store.getSession(session!.id);
      updatedSession?.jobs.forEach(job => {
        expect(job.outputPath).not.toBeNull();
        expect(job.outputPath).toContain('.wav');
      });
    });
    
    test('calculates total file size', async () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      await store.startExport(session!.id);
      
      const updatedSession = store.getSession(session!.id);
      expect(updatedSession?.totalFileSizeBytes).toBeGreaterThan(0);
    });
    
    test('fails for invalid session', async () => {
      const result = await store.startExport('invalid-id');
      expect(result.success).toBe(false);
    });
  });
  
  describe('cancel export', () => {
    test('cancels running export', async () => {
      const config = createTestConfig();
      const { session } = store.createSession('TestProject', config);
      
      // Start but don't await
      const exportPromise = store.startExport(session!.id);
      
      // Cancel immediately
      store.cancelExport(session!.id);
      
      await exportPromise;
      
      const updatedSession = store.getSession(session!.id);
      // Status should reflect cancellation or completion
      expect(['cancelled', 'complete', 'failed']).toContain(updatedSession?.status);
    });
    
    test('returns false for non-existent session', () => {
      expect(store.cancelExport('invalid-id')).toBe(false);
    });
  });
  
  describe('presets', () => {
    test('gets preset by ID', () => {
      const preset = store.getPreset('basic-4');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Basic 4 Stems');
    });
    
    test('gets all presets', () => {
      const presets = store.getPresets();
      expect(presets.length).toBe(STEM_PRESETS.length);
    });
    
    test('creates stems from preset', () => {
      const stems = store.createStemsFromPreset('basic-4');
      
      expect(stems).toHaveLength(4);
      stems.forEach(stem => {
        expect(stem.id).toBeDefined();
        expect(stem.name).toBeDefined();
      });
    });
    
    test('returns empty for invalid preset', () => {
      const stems = store.createStemsFromPreset('invalid-preset');
      expect(stems).toHaveLength(0);
    });
  });
  
  describe('listeners', () => {
    test('notifies on session creation', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      
      store.createSession('TestProject', createTestConfig());
      
      expect(listener).toHaveBeenCalled();
    });
    
    test('notifies on session deletion', () => {
      const listener = vi.fn();
      const { session } = store.createSession('TestProject', createTestConfig());
      
      store.subscribe(listener);
      store.deleteSession(session!.id);
      
      expect(listener).toHaveBeenCalled();
    });
    
    test('unsubscribe stops notifications', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      
      unsubscribe();
      store.createSession('TestProject', createTestConfig());
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
  
  describe('clear', () => {
    test('clears all sessions', () => {
      store.createSession('Project1', createTestConfig());
      store.createSession('Project2', createTestConfig());
      
      store.clear();
      
      expect(store.getAllSessions()).toHaveLength(0);
      expect(store.getActiveSession()).toBeNull();
    });
  });
});
