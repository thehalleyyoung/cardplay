/**
 * @fileoverview Preset System Tests.
 * 
 * @module @cardplay/core/cards/presets.test
 */

import { describe, it, expect } from 'vitest';
import {
  // Preset creation
  createPreset,
  createPresetFromParameters,
  updatePreset,
  derivePreset,
  // PresetBank
  createPresetBank,
  addPreset,
  removePreset,
  loadPreset,
  getCurrentPreset,
  getEffectiveValue,
  setParameterValue,
  revertToPreset,
  diffFromPreset,
  saveAsPreset,
  applyPresetToParameters,
  // Preset operations
  getPresetsByCategory,
  getFactoryPresets,
  getUserPresets,
  searchPresets,
  getCategories,
  // Morphing
  morphPresets,
  createMorphedPreset,
  // Layers
  blendPresets,
  // Randomization
  randomizePreset,
  mutatePreset,
  // Import/Export
  exportPreset,
  exportPresetToJson,
  validatePresetExport,
  importPreset,
  importPresetFromJson,
  // Comparison
  comparePresets,
  presetSimilarity,
  // Curried presets
  curryPreset,
  applyCurriedPreset,
  applyCurriedPresetWithParams,
  stackOnCurriedPreset,
  curryPresetWithPattern,
  CurryPatterns,
  createPresetSlot,
  extractSlotFromPreset,
  createCompositePreset,
  updateCompositeSlot,
  compositeToPreset,
} from './presets';
import {
  createFloatParameter,
  createIntParameter,
  createBoolParameter,
  createEnumParameter,
  type Parameter,
} from './parameters';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createTestParams(): Parameter[] {
  return [
    createFloatParameter({ id: 'volume', name: 'Volume', default: 0.8, group: 'mix' }),
    createFloatParameter({ id: 'pan', name: 'Pan', min: -1, max: 1, default: 0, group: 'mix' }),
    createFloatParameter({ id: 'cutoff', name: 'Cutoff', default: 0.5, group: 'filter' }),
    createFloatParameter({ id: 'resonance', name: 'Resonance', default: 0.2, group: 'filter' }),
    createIntParameter({ id: 'octave', name: 'Octave', min: -2, max: 2, default: 0, group: 'pitch' }),
    createBoolParameter({ id: 'bypass', name: 'Bypass', default: false, group: 'routing' }),
    createEnumParameter({
      id: 'waveform',
      name: 'Waveform',
      options: ['sine', 'saw', 'square'],
      default: 'saw',
      group: 'oscillator',
    }),
  ];
}

function createTestPreset(id: string, name: string, isFactory: boolean = false): ReturnType<typeof createPreset> {
  return createPreset({
    id,
    name,
    category: isFactory ? 'factory' : 'user',
    author: isFactory ? 'Factory' : 'User',
    tags: ['test'],
    params: {
      volume: 0.7,
      pan: 0,
      cutoff: 0.6,
      resonance: 0.3,
      octave: 0,
      bypass: false,
      waveform: 'saw',
    },
    isFactory,
  });
}

// ============================================================================
// PRESET CREATION TESTS
// ============================================================================

describe('Preset Creation', () => {
  describe('createPreset', () => {
    it('should create preset with required fields', () => {
      const preset = createPreset({
        id: 'test-preset',
        name: 'Test Preset',
        params: { volume: 0.8 },
      });
      
      expect(preset.id).toBe('test-preset');
      expect(preset.name).toBe('Test Preset');
      expect(preset.params.volume).toBe(0.8);
      expect(preset.isFactory).toBe(false);
      expect(preset.category).toBe('user');
      expect(preset.author).toBe('User');
      expect(preset.version).toBe(1);
      expect(preset.createdAt).toBeGreaterThan(0);
      expect(preset.modifiedAt).toBe(preset.createdAt);
    });

    it('should create factory preset', () => {
      const preset = createPreset({
        id: 'factory-1',
        name: 'Factory Preset',
        params: {},
        isFactory: true,
        author: 'Cardplay',
        category: 'bass',
      });
      
      expect(preset.isFactory).toBe(true);
      expect(preset.author).toBe('Cardplay');
      expect(preset.category).toBe('bass');
    });

    it('should freeze preset object', () => {
      const preset = createPreset({
        id: 'test',
        name: 'Test',
        params: { a: 1 },
      });
      
      expect(Object.isFrozen(preset)).toBe(true);
      expect(Object.isFrozen(preset.params)).toBe(true);
    });
  });

  describe('createPresetFromParameters', () => {
    it('should create preset from parameter values', () => {
      const params = createTestParams();
      const preset = createPresetFromParameters('from-params', 'From Params', params);
      
      expect(preset.params.volume).toBe(0.8);
      expect(preset.params.cutoff).toBe(0.5);
      expect(preset.params.waveform).toBe('saw');
    });
  });

  describe('updatePreset', () => {
    it('should update non-factory preset', () => {
      const preset = createTestPreset('user-1', 'User Preset', false);
      const updated = updatePreset(preset, { name: 'Updated Name' });
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.version).toBe(2);
      expect(updated.modifiedAt).toBeGreaterThanOrEqual(preset.createdAt);
    });

    it('should throw when updating factory preset', () => {
      const preset = createTestPreset('factory-1', 'Factory', true);
      expect(() => updatePreset(preset, { name: 'New Name' })).toThrow('Cannot modify factory preset');
    });
  });

  describe('derivePreset', () => {
    it('should create derived preset with overrides', () => {
      const parent = createTestPreset('parent', 'Parent');
      const derived = derivePreset(parent, 'derived', 'Derived', { volume: 0.9, cutoff: 0.8 });
      
      expect(derived.parentPresetId).toBe('parent');
      expect(derived.params.volume).toBe(0.9);
      expect(derived.params.cutoff).toBe(0.8);
      expect(derived.params.resonance).toBe(0.3); // Inherited
    });
  });
});

// ============================================================================
// PRESET BANK TESTS
// ============================================================================

describe('PresetBank', () => {
  describe('createPresetBank', () => {
    it('should create empty bank', () => {
      const bank = createPresetBank('synth');
      
      expect(bank.cardId).toBe('synth');
      expect(bank.presets.size).toBe(0);
      expect(bank.currentPresetId).toBeNull();
      expect(bank.isModified).toBe(false);
    });

    it('should create bank with factory presets', () => {
      const factoryPresets = [
        createTestPreset('factory-1', 'Bass', true),
        createTestPreset('factory-2', 'Lead', true),
      ];
      const bank = createPresetBank('synth', factoryPresets);
      
      expect(bank.presets.size).toBe(2);
      expect(bank.categories.get('factory')).toBe(2);
    });
  });

  describe('addPreset / removePreset', () => {
    it('should add user preset', () => {
      let bank = createPresetBank('synth');
      const preset = createTestPreset('user-1', 'User Preset');
      bank = addPreset(bank, preset);
      
      expect(bank.presets.has('user-1')).toBe(true);
      expect(bank.categories.get('user')).toBe(1);
    });

    it('should remove user preset', () => {
      let bank = createPresetBank('synth');
      bank = addPreset(bank, createTestPreset('user-1', 'User'));
      bank = removePreset(bank, 'user-1');
      
      expect(bank.presets.has('user-1')).toBe(false);
    });

    it('should not remove factory preset', () => {
      const factory = createTestPreset('factory-1', 'Factory', true);
      let bank = createPresetBank('synth', [factory]);
      bank = removePreset(bank, 'factory-1');
      
      expect(bank.presets.has('factory-1')).toBe(true);
    });
  });

  describe('loadPreset / getCurrentPreset', () => {
    it('should load preset', () => {
      const factory = createTestPreset('factory-1', 'Factory', true);
      let bank = createPresetBank('synth', [factory]);
      bank = loadPreset(bank, 'factory-1');
      
      expect(bank.currentPresetId).toBe('factory-1');
      expect(getCurrentPreset(bank)).toBe(factory);
    });

    it('should ignore loading non-existent preset', () => {
      const bank = createPresetBank('synth');
      const loaded = loadPreset(bank, 'nonexistent');
      
      expect(loaded.currentPresetId).toBeNull();
    });

    it('should clear overrides when loading', () => {
      let bank = createPresetBank('synth', [createTestPreset('p1', 'P1', true)]);
      bank = loadPreset(bank, 'p1');
      bank = setParameterValue(bank, 'volume', 0.9);
      expect(bank.isModified).toBe(true);
      
      bank = loadPreset(bank, 'p1');
      expect(bank.isModified).toBe(false);
      expect(Object.keys(bank.overrides).length).toBe(0);
    });
  });

  describe('getEffectiveValue / setParameterValue', () => {
    it('should get value from preset', () => {
      const preset = createTestPreset('p1', 'P1', true);
      let bank = createPresetBank('synth', [preset]);
      bank = loadPreset(bank, 'p1');
      
      expect(getEffectiveValue(bank, 'volume', 0)).toBe(0.7);
    });

    it('should get overridden value', () => {
      let bank = createPresetBank('synth', [createTestPreset('p1', 'P1', true)]);
      bank = loadPreset(bank, 'p1');
      bank = setParameterValue(bank, 'volume', 0.9);
      
      expect(getEffectiveValue(bank, 'volume', 0)).toBe(0.9);
      expect(bank.isModified).toBe(true);
    });

    it('should remove override when setting to preset value', () => {
      let bank = createPresetBank('synth', [createTestPreset('p1', 'P1', true)]);
      bank = loadPreset(bank, 'p1');
      bank = setParameterValue(bank, 'volume', 0.9);
      bank = setParameterValue(bank, 'volume', 0.7); // Back to preset value
      
      expect('volume' in bank.overrides).toBe(false);
      expect(bank.isModified).toBe(false);
    });
  });

  describe('revertToPreset / diffFromPreset', () => {
    it('should revert all overrides', () => {
      let bank = createPresetBank('synth', [createTestPreset('p1', 'P1', true)]);
      bank = loadPreset(bank, 'p1');
      bank = setParameterValue(bank, 'volume', 0.9);
      bank = setParameterValue(bank, 'cutoff', 0.8);
      
      bank = revertToPreset(bank);
      
      expect(bank.isModified).toBe(false);
      expect(Object.keys(bank.overrides).length).toBe(0);
    });

    it('should show diff from preset', () => {
      let bank = createPresetBank('synth', [createTestPreset('p1', 'P1', true)]);
      bank = loadPreset(bank, 'p1');
      bank = setParameterValue(bank, 'volume', 0.9);
      
      const diff = diffFromPreset(bank);
      
      expect(diff.volume).toEqual({ preset: 0.7, current: 0.9 });
    });
  });

  describe('saveAsPreset', () => {
    it('should save current state as new preset', () => {
      let bank = createPresetBank('synth', [createTestPreset('p1', 'P1', true)]);
      bank = loadPreset(bank, 'p1');
      bank = setParameterValue(bank, 'volume', 0.9);
      
      const { bank: newBank, preset } = saveAsPreset(bank, 'user-1', 'My Preset');
      
      expect(preset.params.volume).toBe(0.9);
      expect(preset.parentPresetId).toBe('p1');
      expect(newBank.currentPresetId).toBe('user-1');
      expect(newBank.isModified).toBe(false);
    });
  });

  describe('applyPresetToParameters', () => {
    it('should apply preset values to parameters', () => {
      const params = createTestParams();
      let bank = createPresetBank('synth', [createTestPreset('p1', 'P1', true)]);
      bank = loadPreset(bank, 'p1');
      
      const applied = applyPresetToParameters(bank, params);
      
      expect((applied[0] as ReturnType<typeof createFloatParameter>).value).toBe(0.7); // volume from preset
    });
  });
});

// ============================================================================
// PRESET OPERATIONS TESTS
// ============================================================================

describe('Preset Operations', () => {
  describe('getPresetsByCategory', () => {
    it('should filter by category', () => {
      const presets = [
        createPreset({ id: 'bass-1', name: 'Bass 1', category: 'bass', params: {} }),
        createPreset({ id: 'lead-1', name: 'Lead 1', category: 'lead', params: {} }),
        createPreset({ id: 'bass-2', name: 'Bass 2', category: 'bass', params: {} }),
      ];
      const bank = createPresetBank('synth', presets);
      
      const bassPresets = getPresetsByCategory(bank, 'bass');
      expect(bassPresets.length).toBe(2);
    });
  });

  describe('getFactoryPresets / getUserPresets', () => {
    it('should separate factory and user presets', () => {
      let bank = createPresetBank('synth', [createTestPreset('f1', 'Factory', true)]);
      bank = addPreset(bank, createTestPreset('u1', 'User', false));
      
      expect(getFactoryPresets(bank).length).toBe(1);
      expect(getUserPresets(bank).length).toBe(1);
    });
  });

  describe('searchPresets', () => {
    it('should search by name', () => {
      const presets = [
        createPreset({ id: 'p1', name: 'Warm Bass', params: {}, tags: [] }),
        createPreset({ id: 'p2', name: 'Cold Lead', params: {}, tags: [] }),
      ];
      const bank = createPresetBank('synth', presets);
      
      expect(searchPresets(bank, 'warm').length).toBe(1);
      expect(searchPresets(bank, 'bass').length).toBe(1);
    });

    it('should search by tags', () => {
      const presets = [
        createPreset({ id: 'p1', name: 'P1', params: {}, tags: ['analog', 'warm'] }),
        createPreset({ id: 'p2', name: 'P2', params: {}, tags: ['digital'] }),
      ];
      const bank = createPresetBank('synth', presets);
      
      expect(searchPresets(bank, 'analog').length).toBe(1);
    });
  });

  describe('getCategories', () => {
    it('should list all categories', () => {
      const presets = [
        createPreset({ id: 'p1', name: 'P1', category: 'bass', params: {} }),
        createPreset({ id: 'p2', name: 'P2', category: 'lead', params: {} }),
      ];
      const bank = createPresetBank('synth', presets);
      
      const categories = getCategories(bank);
      expect(categories).toContain('bass');
      expect(categories).toContain('lead');
    });
  });
});

// ============================================================================
// MORPHING TESTS
// ============================================================================

describe('Preset Morphing', () => {
  describe('morphPresets', () => {
    it('should interpolate numeric values', () => {
      const presetA = createPreset({ id: 'a', name: 'A', params: { volume: 0, cutoff: 0 } });
      const presetB = createPreset({ id: 'b', name: 'B', params: { volume: 1, cutoff: 1 } });
      const params = createTestParams();
      
      const morphed = morphPresets(presetA, presetB, 0.5, params);
      
      expect(morphed.volume).toBe(0.5);
      expect(morphed.cutoff).toBe(0.5);
    });

    it('should switch non-numeric at midpoint', () => {
      const presetA = createPreset({ id: 'a', name: 'A', params: { waveform: 'sine' } });
      const presetB = createPreset({ id: 'b', name: 'B', params: { waveform: 'square' } });
      const params = createTestParams();
      
      expect(morphPresets(presetA, presetB, 0.4, params).waveform).toBe('sine');
      expect(morphPresets(presetA, presetB, 0.6, params).waveform).toBe('square');
    });
  });

  describe('createMorphedPreset', () => {
    it('should create preset from morph', () => {
      const presetA = createPreset({ id: 'a', name: 'A', params: { volume: 0 } });
      const presetB = createPreset({ id: 'b', name: 'B', params: { volume: 1 } });
      const params = createTestParams();
      
      const morphed = createMorphedPreset(presetA, presetB, 0.5, params, 'morphed', 'Morphed');
      
      expect(morphed.id).toBe('morphed');
      expect(morphed.category).toBe('morphed');
      expect(morphed.params.volume).toBe(0.5);
    });
  });
});

// ============================================================================
// LAYER TESTS
// ============================================================================

describe('Preset Layers', () => {
  describe('blendPresets', () => {
    it('should blend with weights', () => {
      const presetA = createPreset({ id: 'a', name: 'A', params: { volume: 0 } });
      const presetB = createPreset({ id: 'b', name: 'B', params: { volume: 1 } });
      const params = createTestParams();
      
      const blended = blendPresets([
        { preset: presetA, weight: 1 },
        { preset: presetB, weight: 3 },
      ], params);
      
      expect(blended.volume).toBe(0.75); // Weighted average
    });

    it('should return single preset if only one layer', () => {
      const preset = createPreset({ id: 'a', name: 'A', params: { volume: 0.5 } });
      const params = createTestParams();
      
      const blended = blendPresets([{ preset, weight: 1 }], params);
      
      expect(blended.volume).toBe(0.5);
    });
  });
});

// ============================================================================
// RANDOMIZATION TESTS
// ============================================================================

describe('Preset Randomization', () => {
  describe('randomizePreset', () => {
    it('should randomize automatable parameters', () => {
      const params = createTestParams();
      const randomized = randomizePreset(params);
      
      expect(typeof randomized.volume).toBe('number');
      expect(randomized.volume).toBeGreaterThanOrEqual(0);
      expect(randomized.volume).toBeLessThanOrEqual(1);
    });
  });

  describe('mutatePreset', () => {
    it('should mutate values within range', () => {
      const preset = createTestPreset('test', 'Test');
      const params = createTestParams();
      
      const mutated = mutatePreset(preset, params, 0.1);
      
      // Values should be close but potentially different
      expect(typeof mutated.volume).toBe('number');
    });
  });
});

// ============================================================================
// IMPORT/EXPORT TESTS
// ============================================================================

describe('Preset Import/Export', () => {
  describe('exportPreset / exportPresetToJson', () => {
    it('should export preset to JSON format', () => {
      const preset = createTestPreset('test', 'Test');
      const exported = exportPreset('synth', preset);
      
      expect(exported.version).toBe('1.0');
      expect(exported.cardId).toBe('synth');
      expect(exported.preset.id).toBe('test');
      expect(exported.preset.params).toEqual(preset.params);
    });

    it('should export to JSON string', () => {
      const preset = createTestPreset('test', 'Test');
      const json = exportPresetToJson('synth', preset);
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.preset.id).toBe('test');
    });
  });

  describe('validatePresetExport', () => {
    it('should validate correct format', () => {
      const preset = createTestPreset('test', 'Test');
      const exported = exportPreset('synth', preset);
      
      const result = validatePresetExport(exported, 'synth');
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid data', () => {
      const result = validatePresetExport(null);
      expect(result.valid).toBe(false);
    });

    it('should check card ID match', () => {
      const preset = createTestPreset('test', 'Test');
      const exported = exportPreset('synth', preset);
      
      const result = validatePresetExport(exported, 'different-card');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Card ID mismatch'))).toBe(true);
    });

    it('should warn about unknown parameters', () => {
      const exported = {
        version: '1.0',
        cardId: 'synth',
        preset: {
          id: 'test',
          name: 'Test',
          params: { unknownParam: 123 },
        },
      };
      
      const result = validatePresetExport(exported, 'synth', ['volume', 'pan']);
      
      expect(result.warnings.some(w => w.includes('unknownParam'))).toBe(true);
    });
  });

  describe('importPreset / importPresetFromJson', () => {
    it('should import valid preset', () => {
      const original = createTestPreset('test', 'Test');
      const exported = exportPreset('synth', original);
      
      const result = importPreset(exported, 'synth');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.preset.id).toBe('test');
        expect(result.preset.isFactory).toBe(false);
      }
    });

    it('should import from JSON string', () => {
      const original = createTestPreset('test', 'Test');
      const json = exportPresetToJson('synth', original);
      
      const result = importPresetFromJson(json, 'synth');
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const result = importPresetFromJson('not valid json');
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// COMPARISON TESTS
// ============================================================================

describe('Preset Comparison', () => {
  describe('comparePresets', () => {
    it('should find differences', () => {
      const presetA = createPreset({ id: 'a', name: 'A', params: { volume: 0.5, pan: 0 } });
      const presetB = createPreset({ id: 'b', name: 'B', params: { volume: 0.8, pan: 0 } });
      
      const diff = comparePresets(presetA, presetB);
      
      expect(diff.volume).toEqual({ a: 0.5, b: 0.8 });
      expect(diff.pan).toBeUndefined(); // Same value
    });
  });

  describe('presetSimilarity', () => {
    it('should return 1 for identical presets', () => {
      const preset = createTestPreset('test', 'Test');
      const params = createTestParams();
      
      const similarity = presetSimilarity(preset, preset, params);
      
      expect(similarity).toBe(1);
    });

    it('should return lower value for different presets', () => {
      const presetA = createPreset({ id: 'a', name: 'A', params: { volume: 0 } });
      const presetB = createPreset({ id: 'b', name: 'B', params: { volume: 1 } });
      const params = [createFloatParameter({ id: 'volume', name: 'Volume' })];
      
      const similarity = presetSimilarity(presetA, presetB, params);
      
      expect(similarity).toBe(0);
    });
  });
});

// ============================================================================
// CURRIED PRESET TESTS
// ============================================================================

describe('Curried Presets', () => {
  describe('curryPreset', () => {
    it('should create curried preset with excluded params', () => {
      const preset = createTestPreset('full', 'Full Band');
      const curried = curryPreset(preset, {
        excludedParams: ['volume', 'pan'],
        name: 'No Mix',
      });
      
      expect(curried.basePreset).toBe(preset);
      expect(curried.excludedParams).toContain('volume');
      expect(curried.excludedParams).toContain('pan');
      expect(curried.name).toBe('No Mix');
    });
  });

  describe('applyCurriedPreset', () => {
    it('should apply base preset with new values for excluded params', () => {
      const preset = createPreset({
        id: 'full',
        name: 'Full',
        params: { volume: 0.5, pan: 0, cutoff: 0.7 },
      });
      const curried = curryPreset(preset, {
        excludedParams: ['volume', 'pan'],
      });
      
      const applied = applyCurriedPreset(curried, { volume: 1, pan: 0.5 });
      
      expect(applied.volume).toBe(1); // New value
      expect(applied.pan).toBe(0.5); // New value
      expect(applied.cutoff).toBe(0.7); // From base preset
    });
  });

  describe('applyCurriedPresetWithParams', () => {
    it('should exclude by group', () => {
      const preset = createPreset({
        id: 'full',
        name: 'Full',
        params: { volume: 0.5, pan: 0, cutoff: 0.7 },
      });
      const params = createTestParams();
      const curried = curryPreset(preset, {
        excludedGroups: ['mix'], // volume and pan are in 'mix' group
      });
      
      const applied = applyCurriedPresetWithParams(curried, { volume: 1 }, params);
      
      expect(applied.volume).toBe(1);
      expect(applied.cutoff).toBe(0.7);
      expect(applied.pan).toBeUndefined(); // Excluded by group, no new value provided
    });
  });

  describe('stackOnCurriedPreset', () => {
    it('should create new preset from curried + new values', () => {
      const preset = createPreset({
        id: 'rhythm',
        name: 'Rhythm Section',
        params: { drums: 0.8, bass: 0.7, lead: 0 },
      });
      const curried = curryPreset(preset, {
        excludedParams: ['lead'],
        name: 'Rhythm Only',
      });
      
      const stacked = stackOnCurriedPreset(
        curried,
        { lead: 0.9 },
        'with-lead',
        'Rhythm + Lead'
      );
      
      expect(stacked.id).toBe('with-lead');
      expect(stacked.params.drums).toBe(0.8);
      expect(stacked.params.bass).toBe(0.7);
      expect(stacked.params.lead).toBe(0.9);
      expect(stacked.parentPresetId).toBe('rhythm');
    });
  });

  describe('curryPresetWithPattern', () => {
    it('should expand wildcard patterns', () => {
      const params = [
        createFloatParameter({ id: 'lead-volume', name: 'Lead Volume' }),
        createFloatParameter({ id: 'lead-pan', name: 'Lead Pan' }),
        createFloatParameter({ id: 'bass-volume', name: 'Bass Volume' }),
      ];
      const preset = createPreset({
        id: 'full',
        name: 'Full',
        params: { 'lead-volume': 0.8, 'lead-pan': 0, 'bass-volume': 0.7 },
      });
      
      const curried = curryPresetWithPattern(preset, ['lead-*'], params);
      
      expect(curried.excludedParams).toContain('lead-volume');
      expect(curried.excludedParams).toContain('lead-pan');
      expect(curried.excludedParams).not.toContain('bass-volume');
    });
  });

  describe('CurryPatterns', () => {
    it('should have predefined patterns', () => {
      expect(CurryPatterns.EXCEPT_LEAD).toContain('lead-volume');
      expect(CurryPatterns.EXCEPT_BASS).toContain('bass-volume');
      expect(CurryPatterns.EXCEPT_DRUMS).toContain('drums-kit');
    });
  });
});

// ============================================================================
// COMPOSITE PRESET TESTS
// ============================================================================

describe('Composite Presets', () => {
  describe('createPresetSlot', () => {
    it('should create slot with values', () => {
      const slot = createPresetSlot('lead', 'Lead Section', {
        paramIds: ['lead-volume', 'lead-pan'],
        values: { 'lead-volume': 0.8, 'lead-pan': 0 },
      });
      
      expect(slot.id).toBe('lead');
      expect(slot.values['lead-volume']).toBe(0.8);
    });
  });

  describe('extractSlotFromPreset', () => {
    it('should extract slot values by param IDs', () => {
      const preset = createPreset({
        id: 'full',
        name: 'Full',
        params: { volume: 0.8, pan: 0, cutoff: 0.5 },
      });
      const params = createTestParams();
      
      const extracted = extractSlotFromPreset(preset, {
        paramIds: ['volume', 'pan'],
      }, params);
      
      expect(extracted.volume).toBe(0.8);
      expect(extracted.pan).toBe(0);
      expect(extracted.cutoff).toBeUndefined();
    });

    it('should extract slot values by group', () => {
      const preset = createPreset({
        id: 'full',
        name: 'Full',
        params: { volume: 0.8, pan: 0, cutoff: 0.5 },
      });
      const params = createTestParams();
      
      const extracted = extractSlotFromPreset(preset, {
        groups: ['mix'],
      }, params);
      
      expect(extracted.volume).toBe(0.8);
      expect(extracted.pan).toBe(0);
      expect(extracted.cutoff).toBeUndefined();
    });
  });

  describe('createCompositePreset', () => {
    it('should merge slots', () => {
      const slots = [
        createPresetSlot('lead', 'Lead', { values: { lead: 0.8 } }),
        createPresetSlot('bass', 'Bass', { values: { bass: 0.7 } }),
      ];
      
      const composite = createCompositePreset('composite-1', 'Composite', slots);
      
      expect(composite.params.lead).toBe(0.8);
      expect(composite.params.bass).toBe(0.7);
    });
  });

  describe('updateCompositeSlot', () => {
    it('should update specific slot', () => {
      const slots = [
        createPresetSlot('lead', 'Lead', { values: { lead: 0.8 } }),
        createPresetSlot('bass', 'Bass', { values: { bass: 0.7 } }),
      ];
      const composite = createCompositePreset('c1', 'C', slots);
      
      const updated = updateCompositeSlot(composite, 'lead', { lead: 0.9 });
      
      expect(updated.params.lead).toBe(0.9);
      expect(updated.params.bass).toBe(0.7);
    });
  });

  describe('compositeToPreset', () => {
    it('should convert to regular preset', () => {
      const slots = [
        createPresetSlot('lead', 'Lead', { values: { lead: 0.8 }, sourcePresetId: 'lead-preset' }),
      ];
      const composite = createCompositePreset('c1', 'Composite', slots);
      
      const preset = compositeToPreset(composite);
      
      expect(preset.id).toBe('c1');
      expect(preset.params.lead).toBe(0.8);
      expect(preset.isFactory).toBe(false);
    });
  });
});
