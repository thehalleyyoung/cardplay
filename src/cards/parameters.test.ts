/**
 * @fileoverview Parameter System Tests.
 * 
 * @module @cardplay/core/cards/parameters.test
 */

import { describe, it, expect } from 'vitest';
import {
  // Curve functions
  applyCurve,
  invertCurve,
  // Float parameter
  createFloatParameter,
  setFloatValue,
  getFloatNormalized,
  setFloatNormalized,
  // Int parameter
  createIntParameter,
  setIntValue,
  getIntNormalized,
  setIntNormalized,
  // Enum parameter
  createEnumParameter,
  setEnumValue,
  getEnumByIndex,
  getEnumIndex,
  // String parameter
  createStringParameter,
  setStringValue,
  validateStringValue,
  // Bool parameter
  createBoolParameter,
  setBoolValue,
  toggleBool,
  // Array parameter
  createArrayParameter,
  addArrayElement,
  removeArrayElement,
  updateArrayElement,
  // Type guards
  isFloatParameter,
  isIntParameter,
  isEnumParameter,
  isStringParameter,
  isBoolParameter,
  isArrayParameter,
  // Registry
  createParameterRegistry,
  registerParameter,
  registerParameters,
  getParameter,
  getCardParameters,
  getGroupParameters,
  getParameterByCc,
  getAutomatableParameters,
  getModulatableParameters,
  // Utilities
  resetParameter,
  getNormalizedValue,
  setNormalizedValue,
  interpolateParameter,
  randomizeParameter,
  mutateParameter,
  cloneParameter,
  serializeParameter,
  extractParameterValues,
  applyParameterValues,
} from './parameters';

// ============================================================================
// CURVE TESTS
// ============================================================================

describe('Parameter Curves', () => {
  describe('applyCurve', () => {
    it('should apply linear curve (identity)', () => {
      expect(applyCurve(0, 'linear')).toBe(0);
      expect(applyCurve(0.5, 'linear')).toBe(0.5);
      expect(applyCurve(1, 'linear')).toBe(1);
    });

    it('should apply logarithmic curve', () => {
      expect(applyCurve(0, 'logarithmic')).toBe(0);
      expect(applyCurve(1, 'logarithmic')).toBe(1);
      expect(applyCurve(0.5, 'logarithmic')).toBeGreaterThan(0.5);
    });

    it('should apply exponential curve', () => {
      expect(applyCurve(0, 'exponential')).toBe(0);
      expect(applyCurve(1, 'exponential')).toBe(1);
      expect(applyCurve(0.5, 'exponential')).toBeLessThan(0.5);
    });

    it('should apply squared curve', () => {
      expect(applyCurve(0, 'squared')).toBe(0);
      expect(applyCurve(1, 'squared')).toBe(1);
      expect(applyCurve(0.5, 'squared')).toBe(0.25);
    });

    it('should apply cubed curve', () => {
      expect(applyCurve(0, 'cubed')).toBe(0);
      expect(applyCurve(1, 'cubed')).toBe(1);
      expect(applyCurve(0.5, 'cubed')).toBe(0.125);
    });

    it('should apply s-curve', () => {
      expect(applyCurve(0, 's-curve')).toBe(0);
      expect(applyCurve(1, 's-curve')).toBe(1);
      expect(applyCurve(0.5, 's-curve')).toBe(0.5);
    });

    it('should clamp input to [0,1]', () => {
      expect(applyCurve(-0.5, 'linear')).toBe(0);
      expect(applyCurve(1.5, 'linear')).toBe(1);
    });
  });

  describe('invertCurve', () => {
    it('should invert linear curve', () => {
      expect(invertCurve(0, 'linear')).toBe(0);
      expect(invertCurve(0.5, 'linear')).toBe(0.5);
      expect(invertCurve(1, 'linear')).toBe(1);
    });

    it('should approximately invert exponential curve', () => {
      const original = 0.7;
      const curved = applyCurve(original, 'exponential');
      const inverted = invertCurve(curved, 'exponential');
      expect(inverted).toBeCloseTo(original, 1);
    });
  });
});

// ============================================================================
// FLOAT PARAMETER TESTS
// ============================================================================

describe('FloatParameter', () => {
  describe('createFloatParameter', () => {
    it('should create with default options', () => {
      const param = createFloatParameter({ id: 'volume', name: 'Volume' });
      expect(param.type).toBe('float');
      expect(param.id).toBe('volume');
      expect(param.name).toBe('Volume');
      expect(param.min).toBe(0);
      expect(param.max).toBe(1);
      expect(param.value).toBe(0);
      expect(param.default).toBe(0);
      expect(param.step).toBe(0.01);
      expect(param.curve).toBe('linear');
      expect(param.precision).toBe(2);
      expect(param.automatable).toBe(true);
      expect(param.modulatable).toBe(true);
    });

    it('should create with custom options', () => {
      const param = createFloatParameter({
        id: 'frequency',
        name: 'Frequency',
        min: 20,
        max: 20000,
        default: 440,
        step: 1,
        curve: 'logarithmic',
        precision: 0,
        unit: 'Hz',
        ccNumber: 74,
        group: 'filter',
      });
      expect(param.min).toBe(20);
      expect(param.max).toBe(20000);
      expect(param.value).toBe(440);
      expect(param.curve).toBe('logarithmic');
      expect(param.unit).toBe('Hz');
      expect(param.ccNumber).toBe(74);
      expect(param.group).toBe('filter');
    });

    it('should clamp default to range', () => {
      const param = createFloatParameter({
        id: 'test',
        name: 'Test',
        min: 0,
        max: 1,
        default: 1.5,
      });
      expect(param.value).toBe(1);
    });
  });

  describe('setFloatValue', () => {
    it('should update value within range', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', max: 1 });
      const updated = setFloatValue(param, 0.5);
      expect(updated.value).toBe(0.5);
      expect(updated).not.toBe(param);
    });

    it('should clamp value to range', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', min: 0, max: 1 });
      expect(setFloatValue(param, -0.5).value).toBe(0);
      expect(setFloatValue(param, 1.5).value).toBe(1);
    });

    it('should return same object if value unchanged', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', default: 0.5 });
      const updated = setFloatValue(param, 0.5);
      expect(updated).toBe(param);
    });
  });

  describe('getFloatNormalized / setFloatNormalized', () => {
    it('should normalize value to [0,1]', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', min: 100, max: 200, default: 150 });
      expect(getFloatNormalized(param)).toBe(0.5);
    });

    it('should set from normalized value', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', min: 100, max: 200 });
      const updated = setFloatNormalized(param, 0.5);
      expect(updated.value).toBe(150);
    });
  });
});

// ============================================================================
// INT PARAMETER TESTS
// ============================================================================

describe('IntParameter', () => {
  describe('createIntParameter', () => {
    it('should create with default options', () => {
      const param = createIntParameter({ id: 'octave', name: 'Octave' });
      expect(param.type).toBe('int');
      expect(param.min).toBe(0);
      expect(param.max).toBe(127);
      expect(param.step).toBe(1);
    });

    it('should round values', () => {
      const param = createIntParameter({ id: 'test', name: 'Test', default: 5.7 });
      expect(param.value).toBe(6);
      expect(param.default).toBe(6);
    });
  });

  describe('setIntValue', () => {
    it('should round and clamp value', () => {
      const param = createIntParameter({ id: 'test', name: 'Test', min: 0, max: 10 });
      expect(setIntValue(param, 5.7).value).toBe(6);
      expect(setIntValue(param, -5).value).toBe(0);
      expect(setIntValue(param, 15).value).toBe(10);
    });
  });
});

// ============================================================================
// ENUM PARAMETER TESTS
// ============================================================================

describe('EnumParameter', () => {
  describe('createEnumParameter', () => {
    it('should create with options', () => {
      const param = createEnumParameter({
        id: 'waveform',
        name: 'Waveform',
        options: ['sine', 'saw', 'square'] as const,
        labels: ['Sine', 'Sawtooth', 'Square'],
      });
      expect(param.type).toBe('enum');
      expect(param.options).toEqual(['sine', 'saw', 'square']);
      expect(param.labels).toEqual(['Sine', 'Sawtooth', 'Square']);
      expect(param.value).toBe('sine');
      expect(param.modulatable).toBe(false); // Enums not modulatable by default
    });

    it('should use options as labels if none provided', () => {
      const param = createEnumParameter({
        id: 'mode',
        name: 'Mode',
        options: ['a', 'b', 'c'],
      });
      expect(param.labels).toEqual(['a', 'b', 'c']);
    });
  });

  describe('setEnumValue', () => {
    it('should update to valid option', () => {
      const param = createEnumParameter({
        id: 'test',
        name: 'Test',
        options: ['a', 'b', 'c'],
      });
      const updated = setEnumValue(param, 'b');
      expect(updated.value).toBe('b');
    });

    it('should reject invalid option', () => {
      const param = createEnumParameter({
        id: 'test',
        name: 'Test',
        options: ['a', 'b', 'c'],
      });
      const updated = setEnumValue(param, 'd');
      expect(updated).toBe(param);
    });
  });

  describe('getEnumByIndex / getEnumIndex', () => {
    it('should get option by index', () => {
      const param = createEnumParameter({
        id: 'test',
        name: 'Test',
        options: ['a', 'b', 'c'],
      });
      expect(getEnumByIndex(param, 1)).toBe('b');
      expect(getEnumByIndex(param, -1)).toBe('a');
      expect(getEnumByIndex(param, 10)).toBe('c');
    });

    it('should get index of current value', () => {
      const param = createEnumParameter({
        id: 'test',
        name: 'Test',
        options: ['a', 'b', 'c'],
        default: 'b',
      });
      expect(getEnumIndex(param)).toBe(1);
    });
  });
});

// ============================================================================
// STRING PARAMETER TESTS
// ============================================================================

describe('StringParameter', () => {
  describe('createStringParameter', () => {
    it('should create with defaults', () => {
      const param = createStringParameter({ id: 'name', name: 'Name' });
      expect(param.type).toBe('string');
      expect(param.maxLength).toBe(256);
      expect(param.automatable).toBe(false);
      expect(param.modulatable).toBe(false);
    });

    it('should support file path mode', () => {
      const param = createStringParameter({
        id: 'sample',
        name: 'Sample',
        isPath: true,
        extensions: ['.wav', '.mp3'],
      });
      expect(param.isPath).toBe(true);
      expect(param.extensions).toEqual(['.wav', '.mp3']);
    });
  });

  describe('setStringValue', () => {
    it('should truncate to maxLength', () => {
      const param = createStringParameter({ id: 'test', name: 'Test', maxLength: 5 });
      const updated = setStringValue(param, 'hello world');
      expect(updated.value).toBe('hello');
    });

    it('should validate against pattern', () => {
      const param = createStringParameter({
        id: 'test',
        name: 'Test',
        pattern: '^[a-z]+$',
      });
      expect(setStringValue(param, 'abc').value).toBe('abc');
      expect(setStringValue(param, 'ABC')).toBe(param); // Rejected
    });
  });

  describe('validateStringValue', () => {
    it('should validate length', () => {
      const param = createStringParameter({ id: 'test', name: 'Test', maxLength: 5 });
      expect(validateStringValue(param, 'hi')).toBe(true);
      expect(validateStringValue(param, 'hello world')).toBe(false);
    });
  });
});

// ============================================================================
// BOOL PARAMETER TESTS
// ============================================================================

describe('BoolParameter', () => {
  describe('createBoolParameter', () => {
    it('should create with defaults', () => {
      const param = createBoolParameter({ id: 'bypass', name: 'Bypass' });
      expect(param.type).toBe('bool');
      expect(param.value).toBe(false);
      expect(param.automatable).toBe(true);
      expect(param.modulatable).toBe(true);
    });

    it('should support custom labels', () => {
      const param = createBoolParameter({
        id: 'enabled',
        name: 'Enabled',
        onLabel: 'ON',
        offLabel: 'OFF',
      });
      expect(param.onLabel).toBe('ON');
      expect(param.offLabel).toBe('OFF');
    });
  });

  describe('setBoolValue / toggleBool', () => {
    it('should update value', () => {
      const param = createBoolParameter({ id: 'test', name: 'Test' });
      expect(setBoolValue(param, true).value).toBe(true);
    });

    it('should toggle value', () => {
      const param = createBoolParameter({ id: 'test', name: 'Test', default: false });
      expect(toggleBool(param).value).toBe(true);
      expect(toggleBool(toggleBool(param)).value).toBe(false);
    });
  });
});

// ============================================================================
// ARRAY PARAMETER TESTS
// ============================================================================

describe('ArrayParameter', () => {
  const createTestTemplate = () => createFloatParameter({ id: 'item', name: 'Item' });

  describe('createArrayParameter', () => {
    it('should create empty array by default', () => {
      const param = createArrayParameter({
        id: 'items',
        name: 'Items',
        template: createTestTemplate,
      });
      expect(param.type).toBe('array');
      expect(param.value).toEqual([]);
      expect(param.minLength).toBe(0);
      expect(param.maxLength).toBe(128);
    });
  });

  describe('addArrayElement', () => {
    it('should add element from template', () => {
      const param = createArrayParameter({
        id: 'items',
        name: 'Items',
        template: createTestTemplate,
      });
      const updated = addArrayElement(param);
      expect(updated.value.length).toBe(1);
      expect(updated.value[0].type).toBe('float');
    });

    it('should respect maxLength', () => {
      const param = createArrayParameter({
        id: 'items',
        name: 'Items',
        template: createTestTemplate,
        maxLength: 2,
        default: [createTestTemplate(), createTestTemplate()],
      });
      const updated = addArrayElement(param);
      expect(updated).toBe(param);
    });
  });

  describe('removeArrayElement', () => {
    it('should remove element by index', () => {
      const items = [
        createFloatParameter({ id: 'a', name: 'A' }),
        createFloatParameter({ id: 'b', name: 'B' }),
        createFloatParameter({ id: 'c', name: 'C' }),
      ];
      const param = createArrayParameter({
        id: 'items',
        name: 'Items',
        template: createTestTemplate,
        default: items,
      });
      const updated = removeArrayElement(param, 1);
      expect(updated.value.length).toBe(2);
      expect(updated.value[0].id).toBe('a');
      expect(updated.value[1].id).toBe('c');
    });

    it('should respect minLength', () => {
      const param = createArrayParameter({
        id: 'items',
        name: 'Items',
        template: createTestTemplate,
        minLength: 1,
        default: [createTestTemplate()],
      });
      const updated = removeArrayElement(param, 0);
      expect(updated).toBe(param);
    });
  });

  describe('updateArrayElement', () => {
    it('should update element at index', () => {
      const param = createArrayParameter({
        id: 'items',
        name: 'Items',
        template: createTestTemplate,
        default: [createTestTemplate()],
      });
      const newElement = createFloatParameter({ id: 'new', name: 'New' });
      const updated = updateArrayElement(param, 0, newElement);
      expect(updated.value[0].id).toBe('new');
    });
  });
});

// ============================================================================
// TYPE GUARD TESTS
// ============================================================================

describe('Type Guards', () => {
  it('should identify FloatParameter', () => {
    const param = createFloatParameter({ id: 'test', name: 'Test' });
    expect(isFloatParameter(param)).toBe(true);
    expect(isIntParameter(param)).toBe(false);
  });

  it('should identify IntParameter', () => {
    const param = createIntParameter({ id: 'test', name: 'Test' });
    expect(isIntParameter(param)).toBe(true);
    expect(isFloatParameter(param)).toBe(false);
  });

  it('should identify EnumParameter', () => {
    const param = createEnumParameter({ id: 'test', name: 'Test', options: ['a'] });
    expect(isEnumParameter(param)).toBe(true);
  });

  it('should identify StringParameter', () => {
    const param = createStringParameter({ id: 'test', name: 'Test' });
    expect(isStringParameter(param)).toBe(true);
  });

  it('should identify BoolParameter', () => {
    const param = createBoolParameter({ id: 'test', name: 'Test' });
    expect(isBoolParameter(param)).toBe(true);
  });

  it('should identify ArrayParameter', () => {
    const param = createArrayParameter({
      id: 'test',
      name: 'Test',
      template: () => createFloatParameter({ id: 'item', name: 'Item' }),
    });
    expect(isArrayParameter(param)).toBe(true);
  });
});

// ============================================================================
// PARAMETER REGISTRY TESTS
// ============================================================================

describe('ParameterRegistry', () => {
  describe('createParameterRegistry', () => {
    it('should create empty registry', () => {
      const registry = createParameterRegistry();
      expect(registry.parameters.size).toBe(0);
      expect(registry.byCard.size).toBe(0);
      expect(registry.byGroup.size).toBe(0);
      expect(registry.byCc.size).toBe(0);
    });
  });

  describe('registerParameter', () => {
    it('should register parameter with full ID', () => {
      let registry = createParameterRegistry();
      const param = createFloatParameter({ id: 'volume', name: 'Volume' });
      registry = registerParameter(registry, 'synth', param);
      
      expect(getParameter(registry, 'synth.volume')).toBe(param);
    });

    it('should index by card', () => {
      let registry = createParameterRegistry();
      const param = createFloatParameter({ id: 'volume', name: 'Volume' });
      registry = registerParameter(registry, 'synth', param);
      
      const cardParams = getCardParameters(registry, 'synth');
      expect(cardParams).toContain(param);
    });

    it('should index by group', () => {
      let registry = createParameterRegistry();
      const param = createFloatParameter({ id: 'cutoff', name: 'Cutoff', group: 'filter' });
      registry = registerParameter(registry, 'synth', param);
      
      const groupParams = getGroupParameters(registry, 'filter');
      expect(groupParams).toContain(param);
    });

    it('should index by CC', () => {
      let registry = createParameterRegistry();
      const param = createFloatParameter({ id: 'volume', name: 'Volume', ccNumber: 7 });
      registry = registerParameter(registry, 'synth', param);
      
      expect(getParameterByCc(registry, 7)).toBe(param);
    });
  });

  describe('registerParameters', () => {
    it('should register multiple parameters', () => {
      let registry = createParameterRegistry();
      const params = [
        createFloatParameter({ id: 'a', name: 'A' }),
        createFloatParameter({ id: 'b', name: 'B' }),
        createFloatParameter({ id: 'c', name: 'C' }),
      ];
      registry = registerParameters(registry, 'card', params);
      
      expect(getCardParameters(registry, 'card').length).toBe(3);
    });
  });

  describe('getAutomatableParameters', () => {
    it('should return only automatable parameters', () => {
      let registry = createParameterRegistry();
      registry = registerParameters(registry, 'card', [
        createFloatParameter({ id: 'a', name: 'A', automatable: true }),
        createStringParameter({ id: 'b', name: 'B' }), // Not automatable
      ]);
      
      const automatable = getAutomatableParameters(registry);
      expect(automatable.length).toBe(1);
      expect(automatable[0].id).toBe('a');
    });
  });

  describe('getModulatableParameters', () => {
    it('should return only modulatable parameters', () => {
      let registry = createParameterRegistry();
      registry = registerParameters(registry, 'card', [
        createFloatParameter({ id: 'a', name: 'A', modulatable: true }),
        createEnumParameter({ id: 'b', name: 'B', options: ['x'] }), // Not modulatable by default
      ]);
      
      const modulatable = getModulatableParameters(registry);
      expect(modulatable.length).toBe(1);
      expect(modulatable[0].id).toBe('a');
    });
  });
});

// ============================================================================
// PARAMETER UTILITY TESTS
// ============================================================================

describe('Parameter Utilities', () => {
  describe('resetParameter', () => {
    it('should reset to default value', () => {
      const param = setFloatValue(
        createFloatParameter({ id: 'test', name: 'Test', default: 0.5 }),
        0.8
      );
      const reset = resetParameter(param);
      expect(reset.value).toBe(0.5);
    });

    it('should return same object if already at default', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', default: 0.5 });
      expect(resetParameter(param)).toBe(param);
    });
  });

  describe('getNormalizedValue', () => {
    it('should normalize float', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', min: 0, max: 100, default: 50 });
      expect(getNormalizedValue(param)).toBe(0.5);
    });

    it('should normalize int', () => {
      const param = createIntParameter({ id: 'test', name: 'Test', min: 0, max: 10, default: 5 });
      expect(getNormalizedValue(param)).toBe(0.5);
    });

    it('should normalize enum', () => {
      const param = createEnumParameter({
        id: 'test',
        name: 'Test',
        options: ['a', 'b', 'c'],
        default: 'b',
      });
      expect(getNormalizedValue(param)).toBe(0.5);
    });

    it('should normalize bool', () => {
      expect(getNormalizedValue(createBoolParameter({ id: 'test', name: 'Test', default: true }))).toBe(1);
      expect(getNormalizedValue(createBoolParameter({ id: 'test', name: 'Test', default: false }))).toBe(0);
    });
  });

  describe('setNormalizedValue', () => {
    it('should set float from normalized', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', min: 0, max: 100 });
      const updated = setNormalizedValue(param, 0.5);
      expect((updated as typeof param).value).toBe(50);
    });

    it('should set bool from normalized', () => {
      const param = createBoolParameter({ id: 'test', name: 'Test' });
      expect((setNormalizedValue(param, 0.6) as typeof param).value).toBe(true);
      expect((setNormalizedValue(param, 0.4) as typeof param).value).toBe(false);
    });
  });

  describe('interpolateParameter', () => {
    it('should interpolate between two values', () => {
      const from = createFloatParameter({ id: 'test', name: 'Test', default: 0 });
      const to = setFloatValue(createFloatParameter({ id: 'test', name: 'Test' }), 1);
      
      const mid = interpolateParameter(from, to, 0.5);
      expect((mid as typeof from).value).toBe(0.5);
    });
  });

  describe('randomizeParameter', () => {
    it('should randomize within range', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', min: 0, max: 1 });
      const randomized = randomizeParameter(param);
      expect((randomized as typeof param).value).toBeGreaterThanOrEqual(0);
      expect((randomized as typeof param).value).toBeLessThanOrEqual(1);
    });
  });

  describe('mutateParameter', () => {
    it('should mutate by small amount', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', min: 0, max: 1, default: 0.5 });
      const mutated = mutateParameter(param, 0.1);
      expect((mutated as typeof param).value).toBeGreaterThanOrEqual(0);
      expect((mutated as typeof param).value).toBeLessThanOrEqual(1);
      // Should be relatively close to original (within mutation range)
      expect(Math.abs((mutated as typeof param).value - 0.5)).toBeLessThanOrEqual(0.1);
    });
  });

  describe('cloneParameter', () => {
    it('should clone parameter', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', default: 0.5 });
      const cloned = cloneParameter(param);
      expect(cloned).toEqual(param);
      expect(cloned).not.toBe(param);
    });

    it('should clone with new value', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test', default: 0.5 });
      const cloned = cloneParameter(param, 0.8);
      expect(cloned.value).toBe(0.8);
    });
  });

  describe('serializeParameter', () => {
    it('should serialize parameter to plain object', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test' });
      const serialized = serializeParameter(param);
      expect(serialized).toHaveProperty('id', 'test');
      expect(serialized).toHaveProperty('type', 'float');
    });

    it('should exclude template from array parameters', () => {
      const param = createArrayParameter({
        id: 'items',
        name: 'Items',
        template: () => createFloatParameter({ id: 'item', name: 'Item' }),
      });
      const serialized = serializeParameter(param);
      expect(serialized).not.toHaveProperty('template');
    });
  });

  describe('extractParameterValues', () => {
    it('should extract values to plain object', () => {
      const params = [
        createFloatParameter({ id: 'a', name: 'A', default: 0.5 }),
        createIntParameter({ id: 'b', name: 'B', default: 10 }),
        createBoolParameter({ id: 'c', name: 'C', default: true }),
      ];
      const values = extractParameterValues(params);
      expect(values).toEqual({ a: 0.5, b: 10, c: true });
    });
  });

  describe('applyParameterValues', () => {
    it('should apply values from plain object', () => {
      const params = [
        createFloatParameter({ id: 'a', name: 'A' }),
        createIntParameter({ id: 'b', name: 'B' }),
      ];
      const updated = applyParameterValues(params, { a: 0.7, b: 5 });
      expect((updated[0] as ReturnType<typeof createFloatParameter>).value).toBe(0.7);
      expect((updated[1] as ReturnType<typeof createIntParameter>).value).toBe(5);
    });

    it('should ignore missing values', () => {
      const params = [createFloatParameter({ id: 'a', name: 'A', default: 0.5 })];
      const updated = applyParameterValues(params, {});
      expect((updated[0] as typeof params[0]).value).toBe(0.5);
    });
  });
});
