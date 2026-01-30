/**
 * @fileoverview Extension System Tests
 * 
 * Tests for extension validation, registry, and lifecycle management.
 * 
 * @module @cardplay/extensions/__tests__/extensions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateExtensionManifest, isCompatibleVersion } from '../validate';
import { ExtensionRegistry } from '../registry';
import type { ExtensionManifest } from '../types';

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('Extension Validation', () => {
  describe('validateExtensionManifest', () => {
    it('accepts valid manifest', () => {
      const manifest: ExtensionManifest = {
        id: 'com.example.test',
        name: 'Test Extension',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test extension',
        category: 'generator',
        tags: ['test'],
        license: 'MIT',
        cardplayVersion: '>=1.0.0',
        permissions: ['ui-extension'],
        entryPoint: 'index.js'
      };

      const result = validateExtensionManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing required fields', () => {
      const manifest = {
        name: 'Test Extension'
        // Missing many required fields
      };

      const result = validateExtensionManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid extension ID format', () => {
      const manifest = {
        id: 'invalid-id', // Should be reverse DNS
        name: 'Test Extension',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test extension',
        category: 'generator',
        tags: [],
        license: 'MIT',
        cardplayVersion: '>=1.0.0',
        permissions: [],
        entryPoint: 'index.js'
      };

      const result = validateExtensionManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_ID')).toBe(true);
    });

    it('warns about dangerous permissions', () => {
      const manifest: ExtensionManifest = {
        id: 'com.example.test',
        name: 'Test Extension',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test extension',
        category: 'generator',
        tags: [],
        license: 'MIT',
        cardplayVersion: '>=1.0.0',
        permissions: ['network', 'file-system'],
        entryPoint: 'index.js'
      };

      const result = validateExtensionManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'NETWORK_PERMISSION')).toBe(true);
      expect(result.warnings.some(w => w.code === 'FILE_SYSTEM_PERMISSION')).toBe(true);
    });
  });

  describe('isCompatibleVersion', () => {
    it('accepts compatible versions', () => {
      expect(isCompatibleVersion('1.0.0', '1.0.0')).toBe(true);
      expect(isCompatibleVersion('1.0.0', '1.1.0')).toBe(true);
      expect(isCompatibleVersion('1.0.0', '1.2.5')).toBe(true);
    });

    it('rejects incompatible versions', () => {
      expect(isCompatibleVersion('2.0.0', '1.9.9')).toBe(false);
      expect(isCompatibleVersion('1.5.0', '1.4.9')).toBe(false);
      expect(isCompatibleVersion('2.0.0', '1.0.0')).toBe(false);
    });
  });
});

// ============================================================================
// REGISTRY TESTS
// ============================================================================

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = new ExtensionRegistry('1.0.0');
  });

  const createTestManifest = (id: string): ExtensionManifest => ({
    id,
    name: `Test Extension ${id}`,
    version: '1.0.0',
    author: 'Test Author',
    description: 'A test extension',
    category: 'generator',
    tags: ['test'],
    license: 'MIT',
    cardplayVersion: '>=1.0.0',
    permissions: ['ui-extension'],
    entryPoint: 'index.js'
  });

  describe('installExtension', () => {
    it('installs valid extension', async () => {
      const manifest = createTestManifest('com.example.test1');
      const result = await registry.installExtension(manifest, '/path/to/extension');

      expect(result.success).toBe(true);
      expect(registry.getExtension(manifest.id)).toBeDefined();
    });

    it('rejects invalid manifest', async () => {
      const manifest = { invalid: 'manifest' } as any;
      const result = await registry.installExtension(manifest, '/path/to/extension');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('searchExtensions', () => {
    it('searches by name', async () => {
      const manifest1: ExtensionManifest = {
        ...createTestManifest('com.example.drums'),
        name: 'Drum Machine'
      };
      const manifest2: ExtensionManifest = {
        ...createTestManifest('com.example.synth'),
        name: 'Synthesizer'
      };

      await registry.installExtension(manifest1, '/path/to/extension1');
      await registry.installExtension(manifest2, '/path/to/extension2');

      const results = registry.searchExtensions('drum');

      expect(results).toHaveLength(1);
      expect(results[0].manifest.name).toContain('Drum');
    });
  });
});
