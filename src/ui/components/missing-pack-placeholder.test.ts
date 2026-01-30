/**
 * @fileoverview Tests for Missing Pack Placeholder
 */

import { describe, it, expect } from 'vitest';
import {
  createMissingPackInfo,
  createMissingPackPlaceholder,
  createInlineMissingPackPlaceholder,
  getPackOrPlaceholder,
} from './missing-pack-placeholder';
import { PackNotFoundError } from '../../extensions/errors';

describe('createMissingPackInfo', () => {
  it('creates basic info for a missing pack', () => {
    const info = createMissingPackInfo('test:pack');
    
    expect(info.packId).toBe('test:pack');
    expect(info.suggestedAction).toContain('Install');
  });

  it('includes error if provided', () => {
    const error = new PackNotFoundError('test:pack');
    const info = createMissingPackInfo('test:pack', error);
    
    expect(info.error).toBe(error);
  });

  it('includes context information', () => {
    const info = createMissingPackInfo('test:pack', undefined, {
      referencedBy: 'my-board',
      expectedProvenance: 'https://example.com/packs',
    });
    
    expect(info.referencedBy).toBe('my-board');
    expect(info.expectedProvenance).toBe('https://example.com/packs');
  });

  it('suggests bug report for built-in packs', () => {
    const info = createMissingPackInfo('builtin-pack');
    
    expect(info.suggestedAction).toContain('bug');
  });
});

describe('createMissingPackPlaceholder', () => {
  it('creates a DOM element with pack information', () => {
    const info = createMissingPackInfo('test:pack');
    const element = createMissingPackPlaceholder(info);
    
    expect(element.tagName).toBe('DIV');
    expect(element.className).toBe('missing-pack-placeholder');
    expect(element.getAttribute('data-pack-id')).toBe('test:pack');
    expect(element.textContent).toContain('Missing Pack');
    expect(element.textContent).toContain('test:pack');
  });

  it('includes error message when present', () => {
    const error = new PackNotFoundError('test:pack');
    const info = createMissingPackInfo('test:pack', error);
    const element = createMissingPackPlaceholder(info);
    
    expect(element.textContent).toContain('not found');
  });

  it('includes provenance when present', () => {
    const info = createMissingPackInfo('test:pack', undefined, {
      expectedProvenance: 'https://example.com',
    });
    const element = createMissingPackPlaceholder(info);
    
    expect(element.textContent).toContain('Expected source');
    expect(element.textContent).toContain('example.com');
  });

  it('includes referenced-by when present', () => {
    const info = createMissingPackInfo('test:pack', undefined, {
      referencedBy: 'my-board',
    });
    const element = createMissingPackPlaceholder(info);
    
    expect(element.textContent).toContain('Used by');
    expect(element.textContent).toContain('my-board');
  });
});

describe('createInlineMissingPackPlaceholder', () => {
  it('creates a compact inline element', () => {
    const element = createInlineMissingPackPlaceholder('test:pack');
    
    expect(element.tagName).toBe('SPAN');
    expect(element.className).toBe('missing-pack-placeholder--inline');
    expect(element.getAttribute('data-pack-id')).toBe('test:pack');
    expect(element.textContent).toContain('test:pack');
  });

  it('includes warning icon', () => {
    const element = createInlineMissingPackPlaceholder('test:pack');
    expect(element.textContent).toContain('⚠️');
  });
});

describe('getPackOrPlaceholder', () => {
  it('returns value when pack is found', () => {
    const result = getPackOrPlaceholder(
      'test:pack',
      () => ({ name: 'Test Pack' })
    );
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ name: 'Test Pack' });
    }
  });

  it('returns placeholder when pack is not found', () => {
    const result = getPackOrPlaceholder(
      'test:pack',
      () => undefined
    );
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.placeholder).toBeInstanceOf(HTMLElement);
      expect(result.info.packId).toBe('test:pack');
    }
  });

  it('returns placeholder when getter throws', () => {
    const result = getPackOrPlaceholder(
      'test:pack',
      () => {
        throw new Error('Pack load failed');
      }
    );
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.placeholder).toBeInstanceOf(HTMLElement);
      expect(result.info.packId).toBe('test:pack');
    }
  });

  it('includes context in placeholder', () => {
    const result = getPackOrPlaceholder(
      'test:pack',
      () => undefined,
      {
        referencedBy: 'my-board',
        expectedProvenance: 'https://example.com',
      }
    );
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.info.referencedBy).toBe('my-board');
      expect(result.info.expectedProvenance).toBe('https://example.com');
    }
  });
});
