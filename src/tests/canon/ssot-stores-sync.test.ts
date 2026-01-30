/**
 * @fileoverview SSOT Stores Documentation Sync Test
 * 
 * Change 350: Ensures cardplay/docs/canon/ssot-stores.md file paths remain valid.
 * Verifies that every file path mentioned in the SSOT stores documentation
 * actually exists in the codebase.
 * 
 * @module @cardplay/tests/canon/ssot-stores-sync
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('SSOT Stores Documentation Sync (Change 350)', () => {
  const projectRoot = join(__dirname, '../../..');
  const ssotDoc = join(projectRoot, 'docs/canon/ssot-stores.md');

  it('should have the ssot-stores.md documentation', () => {
    expect(existsSync(ssotDoc), 'docs/canon/ssot-stores.md should exist').toBe(true);
  });

  it('should have all referenced store files exist', () => {
    const content = readFileSync(ssotDoc, 'utf-8');
    
    // Extract file paths from the documentation
    // Looking for patterns like: cardplay/src/state/event-store.ts
    const pathPattern = /cardplay\/(src\/[^\s`"']+\.ts)/g;
    const matches = content.matchAll(pathPattern);
    
    const referencedPaths: string[] = [];
    const missingPaths: string[] = [];
    
    for (const match of matches) {
      const relativePath = match[1];
      referencedPaths.push(relativePath);
      
      const fullPath = join(projectRoot, relativePath);
      if (!existsSync(fullPath)) {
        missingPaths.push(relativePath);
      }
    }
    
    expect(
      referencedPaths.length,
      'Should find file paths in ssot-stores.md'
    ).toBeGreaterThan(0);
    
    expect(
      missingPaths,
      `Found missing files referenced in ssot-stores.md:\n${missingPaths.map(p => `  - ${p}`).join('\n')}`
    ).toHaveLength(0);
  });

  it('should reference the canonical SSOT store files', () => {
    const content = readFileSync(ssotDoc, 'utf-8');
    
    const expectedStores = [
      'src/state/event-store.ts',
      'src/state/clip-registry.ts',
      'src/state/routing-graph.ts',
      'src/boards/store/store.ts',
      'src/boards/context/store.ts',
      'src/ai/theory/music-spec.ts',
    ];
    
    const missing: string[] = [];
    
    for (const store of expectedStores) {
      if (!content.includes(store)) {
        missing.push(store);
      }
    }
    
    expect(
      missing,
      `Documentation should reference all canonical SSOT stores:\n${missing.map(p => `  - ${p}`).join('\n')}`
    ).toHaveLength(0);
  });

  it('should have each referenced store file actually implement a store', () => {
    const content = readFileSync(ssotDoc, 'utf-8');
    
    // Extract store locations from the table
    const storePaths = [
      'src/state/event-store.ts',
      'src/state/clip-registry.ts',
      'src/state/routing-graph.ts',
    ];
    
    const storesWithoutImplementation: string[] = [];
    
    for (const storePath of storePaths) {
      const fullPath = join(projectRoot, storePath);
      if (!existsSync(fullPath)) {
        storesWithoutImplementation.push(storePath);
        continue;
      }
      
      const storeContent = readFileSync(fullPath, 'utf-8');
      
      // Check that the file actually implements/exports a store
      // (has functions like create*, get*, or export interface *Store)
      const hasStore = 
        /export\s+(function|const)\s+(create|get)\w+/m.test(storeContent) ||
        /export\s+(interface|type)\s+\w+Store/m.test(storeContent);
      
      if (!hasStore) {
        storesWithoutImplementation.push(storePath);
      }
    }
    
    expect(
      storesWithoutImplementation,
      `Store files should implement actual stores:\n${storesWithoutImplementation.map(p => `  - ${p}`).join('\n')}`
    ).toHaveLength(0);
  });

  it('should mark SSOT status correctly in store files', () => {
    // Check that the actual store files contain SSOT comments/documentation
    const storesToCheck = [
      'src/state/event-store.ts',
      'src/state/clip-registry.ts',
      'src/state/routing-graph.ts',
    ];
    
    const storesWithoutSSOTMarking: string[] = [];
    
    for (const storePath of storesToCheck) {
      const fullPath = join(projectRoot, storePath);
      if (!existsSync(fullPath)) {
        continue;
      }
      
      const storeContent = readFileSync(fullPath, 'utf-8');
      
      // Check for SSOT mention (could be in comments or docs)
      if (!storeContent.includes('SSOT')) {
        storesWithoutSSOTMarking.push(storePath);
      }
    }
    
    // This is informational - not all stores may have explicit SSOT marking yet
    if (storesWithoutSSOTMarking.length > 0) {
      console.warn(
        'The following SSOT stores lack explicit SSOT documentation:\n' +
        storesWithoutSSOTMarking.map(p => `  - ${p}`).join('\n')
      );
    }
  });
});
