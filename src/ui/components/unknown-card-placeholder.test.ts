/**
 * Tests for unknown card placeholder.
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  parseCardId,
  createUnknownCardInfo,
  createUnknownCardPlaceholder,
  createInlineUnknownCardPlaceholder,
  loadCardWithPlaceholder,
  isUnknownCardInfo,
} from './unknown-card-placeholder';

describe('unknown-card-placeholder', () => {
  describe('parseCardId', () => {
    it('parses namespaced ID', () => {
      const result = parseCardId('my-pack:synth');
      expect(result).toEqual({
        namespace: 'my-pack',
        name: 'synth',
      });
    });

    it('handles non-namespaced ID', () => {
      const result = parseCardId('builtin-card');
      expect(result).toEqual({
        namespace: undefined,
        name: 'builtin-card',
      });
    });

    it('handles multiple colons (first colon is namespace separator)', () => {
      const result = parseCardId('pack:category:name');
      expect(result).toEqual({
        namespace: 'pack',
        name: 'category:name',
      });
    });
  });

  describe('createUnknownCardInfo', () => {
    it('creates basic info', () => {
      const info = createUnknownCardInfo('test:card');
      expect(info.id).toBe('test:card');
      expect(info.namespace).toBe('test');
    });

    it('includes context and reason', () => {
      const info = createUnknownCardInfo('test:card', 'deck-template', 'pack-missing');
      expect(info.context).toBe('deck-template');
      expect(info.reason).toBe('pack-missing');
    });

    it('generates suggestions for missing pack', () => {
      const info = createUnknownCardInfo('test:card', undefined, 'pack-missing');
      expect(info.suggestions).toBeDefined();
      expect(info.suggestions!.length).toBeGreaterThan(0);
      expect(info.suggestions![0]).toContain('test');
    });

    it('generates suggestions for invalid ID', () => {
      const info = createUnknownCardInfo('badcard', undefined, 'invalid-id');
      expect(info.suggestions).toBeDefined();
      expect(info.suggestions!.some(s => s.includes('namespaced'))).toBe(true);
    });

    it('generates suggestions for not-registered', () => {
      const info = createUnknownCardInfo('test:card', undefined, 'not-registered');
      expect(info.suggestions).toBeDefined();
      expect(info.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('createUnknownCardPlaceholder', () => {
    it('creates a DOM element', () => {
      const info = createUnknownCardInfo('test:card', 'deck', 'pack-missing');
      const element = createUnknownCardPlaceholder(info);
      
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toBe('unknown-card-placeholder');
      expect(element.getAttribute('data-card-id')).toBe('test:card');
    });

    it('includes card ID in content', () => {
      const info = createUnknownCardInfo('test:card');
      const element = createUnknownCardPlaceholder(info);
      
      expect(element.textContent).toContain('test:card');
    });

    it('includes reason when provided', () => {
      const info = createUnknownCardInfo('test:card', undefined, 'pack-missing');
      const element = createUnknownCardPlaceholder(info);
      
      expect(element.textContent).toContain('pack');
    });

    it('includes context when provided', () => {
      const info = createUnknownCardInfo('test:card', 'deck-template');
      const element = createUnknownCardPlaceholder(info);
      
      expect(element.textContent).toContain('deck-template');
    });

    it('includes details when provided', () => {
      const info = createUnknownCardInfo('test:card', undefined, undefined, 'Custom error message');
      const element = createUnknownCardPlaceholder(info);
      
      expect(element.textContent).toContain('Custom error message');
    });

    it('includes suggestions when provided', () => {
      const info = createUnknownCardInfo('test:card', undefined, 'pack-missing');
      const element = createUnknownCardPlaceholder(info);
      
      expect(element.textContent).toContain('Suggestions');
      expect(element.querySelector('ul')).toBeDefined();
    });
  });

  describe('createInlineUnknownCardPlaceholder', () => {
    it('creates a compact DOM element', () => {
      const info = createUnknownCardInfo('test:card', undefined, 'pack-missing');
      const element = createInlineUnknownCardPlaceholder(info);
      
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toBe('unknown-card-inline');
      expect(element.getAttribute('data-card-id')).toBe('test:card');
    });

    it('includes card ID in content', () => {
      const info = createUnknownCardInfo('test:card');
      const element = createInlineUnknownCardPlaceholder(info);
      
      expect(element.textContent).toContain('test:card');
    });

    it('includes reason in title', () => {
      const info = createUnknownCardInfo('test:card', undefined, 'pack-missing');
      const element = createInlineUnknownCardPlaceholder(info);
      
      expect(element.title).toContain('pack-missing');
    });
  });

  describe('loadCardWithPlaceholder', () => {
    it('returns card on successful load', async () => {
      const mockCard = { id: 'test:card', name: 'Test Card' };
      const loader = async () => mockCard;
      
      const result = await loadCardWithPlaceholder('test:card', loader);
      expect(result).toBe(mockCard);
    });

    it('returns unknown card info on load failure', async () => {
      const loader = async () => {
        throw new Error('Card not found');
      };
      
      const result = await loadCardWithPlaceholder('test:card', loader, 'test-context');
      expect(isUnknownCardInfo(result)).toBe(true);
      if (isUnknownCardInfo(result)) {
        expect(result.id).toBe('test:card');
        expect(result.context).toBe('test-context');
        expect(result.reason).toBe('not-registered');
      }
    });

    it('categorizes different error types', async () => {
      const loader = async () => {
        throw new Error('Something went wrong');
      };
      
      const result = await loadCardWithPlaceholder('test:card', loader);
      expect(isUnknownCardInfo(result)).toBe(true);
      if (isUnknownCardInfo(result)) {
        expect(result.reason).toBe('load-error');
      }
    });
  });

  describe('isUnknownCardInfo', () => {
    it('returns true for unknown card info', () => {
      const info = createUnknownCardInfo('test:card');
      expect(isUnknownCardInfo(info)).toBe(true);
    });

    it('returns false for non-objects', () => {
      expect(isUnknownCardInfo(null)).toBe(false);
      expect(isUnknownCardInfo(undefined)).toBe(false);
      expect(isUnknownCardInfo('string')).toBe(false);
      expect(isUnknownCardInfo(123)).toBe(false);
    });

    it('returns false for objects without id', () => {
      expect(isUnknownCardInfo({})).toBe(false);
      expect(isUnknownCardInfo({ name: 'test' })).toBe(false);
    });

    it('returns false for objects with non-string id', () => {
      expect(isUnknownCardInfo({ id: 123 })).toBe(false);
    });
  });
});
