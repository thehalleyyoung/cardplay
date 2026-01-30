/**
 * Sample Pack System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSamplePackRegistry, resetSamplePackRegistry } from './registry';
import { registerBuiltinSamplePacks } from './register';
import { installSamplePack } from './install';
import type { SamplePack } from './types';

describe('Sample Pack Registry', () => {
  beforeEach(() => {
    resetSamplePackRegistry();
  });

  it('should register built-in sample packs', () => {
    registerBuiltinSamplePacks();
    const registry = getSamplePackRegistry();
    const packs = registry.getAllPacks();
    
    expect(packs.length).toBeGreaterThan(0);
    expect(packs.some(p => p.id === 'builtin-lofi-drums')).toBe(true);
    expect(packs.some(p => p.id === 'builtin-synth-oneshots')).toBe(true);
    expect(packs.some(p => p.id === 'builtin-orchestral')).toBe(true);
  });

  it('should get pack by ID', () => {
    registerBuiltinSamplePacks();
    const registry = getSamplePackRegistry();
    
    const pack = registry.getPack('builtin-lofi-drums');
    expect(pack).toBeDefined();
    expect(pack?.name).toBe('Lofi Drums');
  });

  it('should search packs by text', () => {
    registerBuiltinSamplePacks();
    const registry = getSamplePackRegistry();
    
    const results = registry.search('lofi');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('builtin-lofi-drums');
  });

  it('should filter by category', () => {
    registerBuiltinSamplePacks();
    const registry = getSamplePackRegistry();
    
    const drumPacks = registry.filterByCategory('drums');
    expect(drumPacks.every(p => p.category === 'drums')).toBe(true);
  });

  it('should filter by difficulty', () => {
    registerBuiltinSamplePacks();
    const registry = getSamplePackRegistry();
    
    const beginnerPacks = registry.filterByDifficulty('beginner');
    expect(beginnerPacks.every(p => p.difficulty === 'beginner')).toBe(true);
  });

  it('should filter by tags', () => {
    registerBuiltinSamplePacks();
    const registry = getSamplePackRegistry();
    
    const results = registry.filterByTags(['lofi']);
    expect(results.some(p => p.tags.includes('lofi'))).toBe(true);
  });

  it('should reject duplicate registrations', () => {
    const registry = getSamplePackRegistry();
    const testPack: SamplePack = {
      id: 'test-pack',
      name: 'Test Pack',
      description: 'Test',
      category: 'drums',
      difficulty: 'beginner',
      tags: ['test'],
      version: '1.0.0',
      samples: [],
      totalSize: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    registry.register(testPack);
    expect(() => registry.register(testPack)).toThrow();
  });
});

describe('Sample Pack Installation', () => {
  beforeEach(() => {
    resetSamplePackRegistry();
    registerBuiltinSamplePacks();
  });

  it('should install a sample pack', async () => {
    const registry = getSamplePackRegistry();
    const pack = registry.getPack('builtin-lofi-drums');
    expect(pack).toBeDefined();

    const result = await installSamplePack(pack!);
    
    expect(result.success).toBe(true);
    expect(result.installedSamples.length).toBe(pack!.samples.length);
    expect(result.errors.length).toBe(0);
    expect(registry.isInstalled(pack!.id)).toBe(true);
  });

  it('should track installation history', async () => {
    const registry = getSamplePackRegistry();
    const pack = registry.getPack('builtin-lofi-drums');
    
    await installSamplePack(pack!);
    
    const installations = registry.getInstallations();
    expect(installations.length).toBe(1);
    expect(installations[0].packId).toBe(pack!.id);
    expect(installations[0].installedSamples.length).toBeGreaterThan(0);
  });

  it('should prevent duplicate installations', async () => {
    const registry = getSamplePackRegistry();
    const pack = registry.getPack('builtin-synth-oneshots');
    
    await installSamplePack(pack!);
    const result = await installSamplePack(pack!);
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('already installed');
  });

  it('should report progress during installation', async () => {
    const registry = getSamplePackRegistry();
    const pack = registry.getPack('builtin-orchestral');
    
    const progressUpdates: Array<{progress: number; message: string}> = [];
    
    await installSamplePack(pack!, {
      onProgress: (progress, message) => {
        progressUpdates.push({ progress, message });
      },
    });
    
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
  });
});
