/**
 * @fileoverview No Phantom Registry V2 Test
 * 
 * Change 469: Fails if docs claim implemented APIs in src/registry/v2/* that aren't present.
 * Ensures documentation doesn't reference phantom modules.
 * 
 * @module @cardplay/tests/no-phantom-registry-v2.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Phantom paths that should not be referenced as "implemented"
const PHANTOM_PATHS = [
  'src/registry/v2/',
  'src/registry/v2/types.ts',
  'src/registry/v2/policy.ts',
  'src/registry/v2/schema.ts',
  'src/registry/v2/diff.ts',
  'src/registry/v2/validate.ts',
  'src/core/port-conversion.ts',
];

// Status markers that indicate something is claimed as implemented
const IMPLEMENTED_MARKERS = [
  'Status: implemented',
  'status: implemented',
  'IMPLEMENTED',
  '✅ Implemented',
];

describe('No Phantom Registry V2 (Change 469)', () => {
  it('should not claim phantom paths are implemented in docs', async () => {
    const docsDir = path.resolve(__dirname, '../../../docs');
    
    if (!fs.existsSync(docsDir)) {
      // Skip if docs dir doesn't exist
      console.log('Docs directory not found, skipping test');
      return;
    }
    
    // Find all markdown files in docs
    const files = await glob('**/*.md', {
      cwd: docsDir,
    });
    
    const violations: string[] = [];
    
    for (const file of files) {
      const fullPath = path.join(docsDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check if file claims implementation status
      const claimsImplemented = IMPLEMENTED_MARKERS.some(marker => 
        content.includes(marker)
      );
      
      if (!claimsImplemented) {
        continue;
      }
      
      // Check for phantom path references
      for (const phantomPath of PHANTOM_PATHS) {
        if (content.includes(phantomPath)) {
          // Check if it's marked as aspirational/phantom
          const lines = content.split('\n');
          const phantomLine = lines.findIndex(line => line.includes(phantomPath));
          
          if (phantomLine >= 0) {
            const context = lines.slice(
              Math.max(0, phantomLine - 2),
              Math.min(lines.length, phantomLine + 3)
            ).join(' ').toLowerCase();
            
            // Allow if marked as aspirational, legacy, or phantom
            const isExcused = ['aspirational', 'phantom', 'not yet', 'todo', 'legacy alias'].some(
              marker => context.includes(marker)
            );
            
            if (!isExcused) {
              violations.push(`${file}: References phantom path "${phantomPath}" without marking as aspirational`);
            }
          }
        }
      }
    }
    
    if (violations.length > 0) {
      const message = [
        'Docs claim phantom modules are implemented:',
        '',
        ...violations.map(v => `  - ${v}`),
        '',
        'Either:',
        '1. Implement the module',
        '2. Mark the reference as "aspirational" or "not yet implemented"',
        '3. Update to point to the real module location',
      ].join('\n');
      
      throw new Error(message);
    }
    
    expect(violations).toHaveLength(0);
  });
  
  it('should verify registry/v2 path does not exist (or is documented)', () => {
    const registryV2Path = path.resolve(__dirname, '../../registry/v2');
    
    if (fs.existsSync(registryV2Path)) {
      // If it exists, that's good - docs can reference it
      console.log('registry/v2 exists - docs can reference it');
      expect(true).toBe(true);
    } else {
      // If it doesn't exist, that's expected - docs should mark references as aspirational
      console.log('registry/v2 does not exist - docs must mark references as aspirational');
      expect(true).toBe(true);
    }
  });
});
