/**
 * @fileoverview No Hardcoded PPQ Test
 * 
 * Change 466: Fails if any file contains `const PPQ =` outside primitives.ts.
 * Ensures PPQ is imported from the canonical source.
 * 
 * @module @cardplay/tests/no-hardcoded-ppq.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('No Hardcoded PPQ (Change 466)', () => {
  it('should not have local PPQ definitions outside primitives.ts', async () => {
    const srcDir = path.resolve(__dirname, '../../');
    
    // Find all TypeScript files
    const files = await glob('**/*.ts', {
      cwd: srcDir,
      ignore: [
        '**/node_modules/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/primitives.ts', // This is the canonical source
        '**/canon/legacy-aliases.ts', // Allowed to document legacy
      ],
    });
    
    const violations: string[] = [];
    
    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check for local PPQ constant definitions
      const ppqPattern = /^\s*(export\s+)?(const|let|var)\s+PPQ\s*=\s*\d+/gm;
      const matches = content.match(ppqPattern);
      
      if (matches && matches.length > 0) {
        violations.push(`${file}: Found local PPQ definition`);
      }
    }
    
    if (violations.length > 0) {
      const message = [
        'Found hardcoded PPQ definitions outside primitives.ts:',
        '',
        ...violations.map(v => `  - ${v}`),
        '',
        'PPQ should be imported from src/types/primitives.ts:',
        '  import { PPQ } from "../types/primitives";',
      ].join('\n');
      
      throw new Error(message);
    }
    
    expect(violations).toHaveLength(0);
  });
  
  it('should use PPQ from primitives.ts in audio modules', async () => {
    // Verify key audio files import PPQ correctly
    const audioDir = path.resolve(__dirname, '../../audio');
    
    if (!fs.existsSync(audioDir)) {
      // Skip if audio dir doesn't exist in test environment
      return;
    }
    
    const renderPath = path.join(audioDir, 'render.ts');
    
    if (fs.existsSync(renderPath)) {
      const content = fs.readFileSync(renderPath, 'utf-8');
      
      // Should import PPQ, not define it
      const hasImport = content.includes("from '../types/primitives'") ||
                        content.includes('from "../types/primitives"') ||
                        content.includes("from '../../types/primitives'") ||
                        content.includes('from "../../types/primitives"');
      
      expect(
        hasImport || !content.includes('const PPQ'),
        'audio/render.ts should import PPQ from primitives.ts'
      ).toBe(true);
    }
  });
});
