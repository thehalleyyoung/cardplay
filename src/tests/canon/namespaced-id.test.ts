/**
 * @fileoverview Namespaced ID Tests
 * 
 * Tests for <namespace>:<name> parsing/validation.
 * 
 * @module @cardplay/tests/canon/namespaced-id
 * @see to_fix_repo_plan_500.md Change 019
 */

import { describe, it, expect } from 'vitest';
import {
  isNamespacedId,
  isValidNamespace,
  isValidName,
  parseNamespacedId,
  parseNamespacedIdStrict,
  formatNamespacedId,
  extractName,
  extractNamespace,
  classifyId,
  validateExtensionId,
} from '../../canon/namespaced-id';

describe('Namespaced ID', () => {
  describe('isNamespacedId', () => {
    it('should accept valid namespaced IDs', () => {
      expect(isNamespacedId('carnatic:raga')).toBe(true);
      expect(isNamespacedId('vendor:custom_card')).toBe(true);
      expect(isNamespacedId('user:my_preset')).toBe(true);
      expect(isNamespacedId('my-pack:my-card')).toBe(true);
      expect(isNamespacedId('a:b')).toBe(true);
    });

    it('should reject non-namespaced IDs', () => {
      expect(isNamespacedId('my-card')).toBe(false);
      expect(isNamespacedId('pattern-deck')).toBe(false);
      expect(isNamespacedId('audio')).toBe(false);
    });

    it('should reject invalid formats', () => {
      expect(isNamespacedId('')).toBe(false);
      expect(isNamespacedId(':')).toBe(false);
      expect(isNamespacedId(':name')).toBe(false);
      expect(isNamespacedId('namespace:')).toBe(false);
      expect(isNamespacedId('name::space')).toBe(false);
      expect(isNamespacedId('has space:name')).toBe(false);
      expect(isNamespacedId('123:invalid')).toBe(false);
    });
  });

  describe('isValidNamespace', () => {
    it('should accept valid namespaces', () => {
      expect(isValidNamespace('carnatic')).toBe(true);
      expect(isValidNamespace('my-vendor')).toBe(true);
      expect(isValidNamespace('user123')).toBe(true);
      expect(isValidNamespace('my_pack')).toBe(true);
    });

    it('should reject invalid namespaces', () => {
      expect(isValidNamespace('')).toBe(false);
      expect(isValidNamespace('123abc')).toBe(false);
      expect(isValidNamespace('has space')).toBe(false);
      expect(isValidNamespace('has:colon')).toBe(false);
    });
  });

  describe('parseNamespacedId', () => {
    it('should parse valid namespaced IDs', () => {
      const result = parseNamespacedId('carnatic:raga');
      expect(result).toEqual({
        namespace: 'carnatic',
        name: 'raga',
        fullId: 'carnatic:raga',
      });
    });

    it('should return null for non-namespaced IDs', () => {
      expect(parseNamespacedId('my-card')).toBeNull();
      expect(parseNamespacedId('')).toBeNull();
    });

    it('should handle complex names', () => {
      const result = parseNamespacedId('vendor:complex-card-name_v2');
      expect(result).toEqual({
        namespace: 'vendor',
        name: 'complex-card-name_v2',
        fullId: 'vendor:complex-card-name_v2',
      });
    });
  });

  describe('parseNamespacedIdStrict', () => {
    it('should parse valid IDs', () => {
      const result = parseNamespacedIdStrict('vendor:card');
      expect(result.namespace).toBe('vendor');
      expect(result.name).toBe('card');
    });

    it('should throw for invalid IDs', () => {
      expect(() => parseNamespacedIdStrict('my-card')).toThrow();
      expect(() => parseNamespacedIdStrict('')).toThrow();
    });
  });

  describe('formatNamespacedId', () => {
    it('should format valid namespace and name', () => {
      expect(formatNamespacedId('carnatic', 'raga')).toBe('carnatic:raga');
      expect(formatNamespacedId('vendor', 'my-card')).toBe('vendor:my-card');
    });

    it('should throw for invalid namespace', () => {
      expect(() => formatNamespacedId('123invalid', 'name')).toThrow();
      expect(() => formatNamespacedId('', 'name')).toThrow();
    });

    it('should throw for invalid name', () => {
      expect(() => formatNamespacedId('namespace', '123')).toThrow();
      expect(() => formatNamespacedId('namespace', '')).toThrow();
    });
  });

  describe('extractName', () => {
    it('should extract name from namespaced ID', () => {
      expect(extractName('carnatic:raga')).toBe('raga');
      expect(extractName('vendor:my-card')).toBe('my-card');
    });

    it('should return whole ID if not namespaced', () => {
      expect(extractName('my-card')).toBe('my-card');
      expect(extractName('pattern-deck')).toBe('pattern-deck');
    });
  });

  describe('extractNamespace', () => {
    it('should extract namespace from namespaced ID', () => {
      expect(extractNamespace('carnatic:raga')).toBe('carnatic');
      expect(extractNamespace('vendor:my-card')).toBe('vendor');
    });

    it('should return null if not namespaced', () => {
      expect(extractNamespace('my-card')).toBeNull();
      expect(extractNamespace('pattern-deck')).toBeNull();
    });
  });

  describe('classifyId', () => {
    it('should classify namespaced IDs', () => {
      const result = classifyId('vendor:my-card');
      expect(result.isNamespaced).toBe(true);
      expect(result.isBuiltin).toBe(false);
      expect(result.namespace).toBe('vendor');
      expect(result.name).toBe('my-card');
    });

    it('should classify non-namespaced IDs as builtin', () => {
      const result = classifyId('pattern-deck');
      expect(result.isNamespaced).toBe(false);
      expect(result.isBuiltin).toBe(true);
      expect(result.namespace).toBeNull();
      expect(result.name).toBe('pattern-deck');
    });
  });

  describe('validateExtensionId', () => {
    it('should accept namespaced extension IDs', () => {
      const result = validateExtensionId('vendor:my-card', false);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-namespaced extension IDs', () => {
      const result = validateExtensionId('my-card', false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be namespaced');
    });

    it('should accept any ID for builtins', () => {
      const result = validateExtensionId('pattern-deck', true);
      expect(result.valid).toBe(true);
    });
  });
});
