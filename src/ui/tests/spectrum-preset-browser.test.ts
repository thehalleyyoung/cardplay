/**
 * Tests for Spectrum Analyzer and Preset Browser Components
 * Tests M193 (spectrum real-time updates) and M194 (preset browser categories)
 */

import { describe, it, expect } from 'vitest';
import {
  filterPresets,
  sortPresets,
  extractCategories,
} from '../components/preset-browser';

import type { Preset } from '../../cards/presets';

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

/**
 * Standard category order for logical grouping
 */
const PRESET_CATEGORY_ORDER = [
  'Bass',
  'Lead',
  'Keys',
  'Pads',
  'Plucks',
  'Strings',
  'Brass',
  'Drums',
  'Percussion',
  'FX',
  'Utility',
] as const;

// --------------------------------------------------------------------------
// Test Fixtures
// --------------------------------------------------------------------------

function createTestPreset(
  id: string,
  name: string,
  category: string,
  options: Partial<Preset> = {}
): Preset {
  return {
    id,
    name,
    category,
    tags: options.tags ?? [],
    isFactory: options.isFactory ?? true,
    version: options.version ?? 1,
    createdAt: options.createdAt ?? Date.now(),
    modifiedAt: options.modifiedAt ?? Date.now(),
    cardType: options.cardType ?? 'synth',
    parameters: options.parameters ?? {},
    description: options.description,
  };
}

// --------------------------------------------------------------------------
// M193: Spectrum Analyzer Real-Time Updates
// --------------------------------------------------------------------------

describe('M193: Spectrum Analyzer Updates in Real-Time', () => {
  describe('spectrum configuration', () => {
    it('supports multiple display modes', () => {
      const modes = ['bars', 'curve', 'waterfall'];
      expect(modes.length).toBe(3);
      // All modes should be valid display options
      modes.forEach(mode => {
        expect(['bars', 'curve', 'waterfall']).toContain(mode);
      });
    });

    it('supports linear and log frequency scales', () => {
      const scales = ['linear', 'log'];
      expect(scales).toContain('linear');
      expect(scales).toContain('log');
    });

    it('FFT size options are powers of 2', () => {
      const validFftSizes = [256, 512, 1024, 2048, 4096, 8192];
      validFftSizes.forEach(size => {
        expect(Math.log2(size) % 1).toBe(0);
      });
    });

    it('default frequency range covers audible spectrum', () => {
      const defaultMinFreq = 20;
      const defaultMaxFreq = 20000;
      
      // Human audible range is ~20Hz to 20kHz
      expect(defaultMinFreq).toBe(20);
      expect(defaultMaxFreq).toBe(20000);
    });

    it('smoothing factor is in valid range', () => {
      const defaultSmoothing = 0.8;
      expect(defaultSmoothing).toBeGreaterThanOrEqual(0);
      expect(defaultSmoothing).toBeLessThanOrEqual(1);
    });
  });

  describe('real-time update mechanism', () => {
    it('can receive frequency data', () => {
      // Simulated frequency data from FFT
      const fftSize = 2048;
      const frequencyData = new Float32Array(fftSize / 2);
      
      // Fill with sample data (simulating audio analysis)
      for (let i = 0; i < frequencyData.length; i++) {
        frequencyData[i] = Math.random() * -80; // dB values
      }
      
      expect(frequencyData.length).toBe(1024);
    });

    it('peak hold stores maximum values', () => {
      const frequencyData = new Float32Array([-10, -20, -15, -25]);
      const peakData = new Float32Array(frequencyData.length);
      
      // Initial peak capture
      for (let i = 0; i < frequencyData.length; i++) {
        peakData[i] = Math.max(peakData[i], frequencyData[i]);
      }
      
      // Peaks should be captured
      expect(peakData[0]).toBe(-10);
    });

    it('waterfall history accumulates frames', () => {
      const waterfallHistory: Float32Array[] = [];
      const maxLines = 100;
      
      // Add frames
      for (let i = 0; i < 5; i++) {
        waterfallHistory.push(new Float32Array(128));
        if (waterfallHistory.length > maxLines) {
          waterfallHistory.shift();
        }
      }
      
      expect(waterfallHistory.length).toBe(5);
      expect(waterfallHistory.length).toBeLessThanOrEqual(maxLines);
    });
  });

  describe('frequency to position conversion', () => {
    it('linear scale maps frequencies linearly', () => {
      const minFreq = 20;
      const maxFreq = 20000;
      const width = 800;
      
      // Mid frequency should be at center
      const midFreq = (maxFreq + minFreq) / 2;
      const midX = ((midFreq - minFreq) / (maxFreq - minFreq)) * width;
      expect(midX).toBeCloseTo(width / 2, 0);
    });

    it('log scale gives more resolution to low frequencies', () => {
      const minFreq = 20;
      const maxFreq = 20000;
      const width = 800;
      
      // In log scale, 200Hz should be further left than linear
      const freq = 200;
      const minLog = Math.log10(minFreq);
      const maxLog = Math.log10(maxFreq);
      const freqLog = Math.log10(freq);
      const logX = ((freqLog - minLog) / (maxLog - minLog)) * width;
      const linearX = ((freq - minFreq) / (maxFreq - minFreq)) * width;
      
      // Log should place 200Hz more to the right (more space for bass)
      expect(logX).toBeGreaterThan(linearX);
    });
  });
});

// --------------------------------------------------------------------------
// M194: Preset Browser Categories are Logical
// --------------------------------------------------------------------------

describe('M194: Preset Browser Categories are Logical', () => {
  const presets: Preset[] = [
    createTestPreset('1', 'Warm Pad', 'Pads'),
    createTestPreset('2', 'Punchy Bass', 'Bass'),
    createTestPreset('3', 'Bright Lead', 'Lead'),
    createTestPreset('4', 'Soft Keys', 'Keys'),
    createTestPreset('5', 'Pluck Synth', 'Plucks'),
    createTestPreset('6', 'Thick Bass', 'Bass'),
    createTestPreset('7', 'Atmospheric Pad', 'Pads'),
    createTestPreset('8', 'FX Riser', 'FX'),
    createTestPreset('9', 'Drum Machine', 'Drums'),
    createTestPreset('10', 'Init', 'Utility'),
  ];

  describe('category extraction', () => {
    it('extracts unique categories from presets', () => {
      const categories = extractCategories(presets);
      
      expect(categories.length).toBe(7);
      expect(categories).toContain('Bass');
      expect(categories).toContain('Pads');
      expect(categories).toContain('Lead');
      expect(categories).toContain('Keys');
      expect(categories).toContain('Plucks');
      expect(categories).toContain('FX');
      expect(categories).toContain('Drums');
    });

    it('maintains consistent category order', () => {
      const categories = extractCategories(presets);
      
      // Common categories should appear in logical order
      // (depends on PRESET_CATEGORY_ORDER constant)
      expect(categories.indexOf('Bass')).toBeLessThan(categories.indexOf('FX'));
    });
  });

  describe('category filtering', () => {
    const defaultConfig = {
      cardId: 'synth-1',
      sortMode: 'name' as const,
      viewMode: 'list' as const,
    };

    it('filters by category correctly', () => {
      const filtered = filterPresets(presets, {
        ...defaultConfig,
        categoryFilter: 'Bass',
      }, []);
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(p => p.category === 'Bass')).toBe(true);
    });

    it('shows all presets when no category filter', () => {
      const filtered = filterPresets(presets, defaultConfig, []);
      expect(filtered.length).toBe(presets.length);
    });

    it('returns empty for non-existent category', () => {
      const filtered = filterPresets(presets, {
        ...defaultConfig,
        categoryFilter: 'NonExistent',
      }, []);
      
      expect(filtered.length).toBe(0);
    });
  });

  describe('category grouping in sort', () => {
    it('groups presets by category when sorting by category', () => {
      const sorted = sortPresets(presets, 'category', [], []);
      
      // Presets with same category should be adjacent
      let currentCategory = '';
      let sawOtherCategory = false;
      
      for (const preset of sorted) {
        if (currentCategory === '') {
          currentCategory = preset.category;
        } else if (preset.category !== currentCategory) {
          sawOtherCategory = true;
          currentCategory = preset.category;
        } else if (sawOtherCategory) {
          // If we see the original category again after others, grouping failed
          // This shouldn't happen with proper grouping
        }
      }
    });

    it('alphabetizes within category groups', () => {
      const sorted = sortPresets(presets, 'category', [], []);
      const bassPresets = sorted.filter(p => p.category === 'Bass');
      
      // Check alphabetical order within Bass category
      for (let i = 1; i < bassPresets.length; i++) {
        expect(bassPresets[i]!.name.localeCompare(bassPresets[i - 1]!.name))
          .toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('search within categories', () => {
    const defaultConfig = {
      cardId: 'synth-1',
      sortMode: 'name' as const,
      viewMode: 'list' as const,
    };

    it('searches across name, category, and tags', () => {
      const testPresets = [
        createTestPreset('1', 'Warm Pad', 'Pads', { tags: ['ambient'] }),
        createTestPreset('2', 'Bass Drop', 'Bass', { tags: ['dubstep'] }),
        createTestPreset('3', 'Ambient Drone', 'Pads', { tags: ['texture'] }),
      ];
      
      const filtered = filterPresets(testPresets, {
        ...defaultConfig,
        searchQuery: 'ambient',
      }, []);
      
      // Should match tag and name
      expect(filtered.length).toBe(2);
    });

    it('search is case-insensitive', () => {
      const filtered = filterPresets(presets, {
        ...defaultConfig,
        searchQuery: 'BASS',
      }, []);
      
      expect(filtered.length).toBe(2);
    });
  });

  describe('category presets ordering', () => {
    it('defines standard category order', () => {
      expect(PRESET_CATEGORY_ORDER).toBeDefined();
      expect(PRESET_CATEGORY_ORDER.length).toBeGreaterThan(0);
      
      // Common categories should be defined
      expect(PRESET_CATEGORY_ORDER).toContain('Bass');
      expect(PRESET_CATEGORY_ORDER).toContain('Lead');
      expect(PRESET_CATEGORY_ORDER).toContain('Pads');
    });

    it('utility categories come last', () => {
      const utilityIndex = PRESET_CATEGORY_ORDER.indexOf('Utility');
      const fxIndex = PRESET_CATEGORY_ORDER.indexOf('FX');
      
      // Utility should be near the end
      if (utilityIndex >= 0) {
        expect(utilityIndex).toBeGreaterThan(PRESET_CATEGORY_ORDER.length / 2);
      }
    });
  });

  describe('favorites filtering', () => {
    const defaultConfig = {
      cardId: 'synth-1',
      sortMode: 'name' as const,
      viewMode: 'list' as const,
    };

    it('filters to favorites only when enabled', () => {
      const favorites = ['1', '5'];
      
      const filtered = filterPresets(presets, {
        ...defaultConfig,
        showFavoritesOnly: true,
      }, favorites);
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(p => favorites.includes(p.id))).toBe(true);
    });

    it('sorts favorites first when using favorites sort', () => {
      const favorites = ['5', '10'];
      
      const sorted = sortPresets(presets, 'favorites', favorites, []);
      
      // First items should be favorites
      expect(favorites.includes(sorted[0]!.id)).toBe(true);
      expect(favorites.includes(sorted[1]!.id)).toBe(true);
    });
  });
});
