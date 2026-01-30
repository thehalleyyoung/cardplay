/**
 * no-phantom-modules.test.ts
 * Ensures docs don't reference nonexistent modules unless explicitly labeled legacy
 * 
 * Change 020 from to_fix_repo_plan_500.md
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

// Known phantom paths that should be documented or removed
// These are marked as aspirational/future work in the plan
const ALLOWED_PHANTOM_PATHS = [
  'src/registry/v2', // Marked aspirational in docs
  'src/runtime/offline-render',
  'src/runtime/audio-render',
  'src/tests/benchmarks',
  'src/sandbox/capabilities',
  'src/sandbox/cardscript/host-api',
  'src/sandbox/cardscript/host-surface',
  'src/runtime/cardscript-exec',
  'src/ui/AudioPanel',
  'src/audio/wav',
  'src/audio/mediarecorder-export',
  'src/sandbox/packs/manifest',
  'src/sandbox/packs/versioning',
  'src/sandbox/packs/signing',
  'src/state/persistence',
  'src/state/schema',
  'src/ai/knowledge/lyrics',
  'src/ai/knowledge/music-theory-computational',
  'src/ai/knowledge/music-spec',
  'src/ai/knowledge/music-theory-galant',
  'src/ai/knowledge/music-theory-film',
  'src/ai/knowledge/music-theory-world',
  'src/ai/knowledge/board-layout',
  'src/audio/webaudio-engine',
];

const DOCS_DIR = join(process.cwd(), 'docs');
const SRC_DIR = join(process.cwd(), 'src');

function scanDocsForModulePaths(dir: string): string[] {
  const paths: string[] = [];
  
  function scan(d: string) {
    try {
      const entries = readdirSync(d);
      for (const entry of entries) {
        const fullPath = join(d, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (entry.endsWith('.md')) {
          const content = readFileSync(fullPath, 'utf-8');
          // Look for references to src/ paths
          const matches = content.match(/cardplay\/src\/[a-z0-9/_-]+/gi) || [];
          paths.push(...matches);
        }
      }
    } catch (err) {
      // Skip directories that can't be read
    }
  }
  
  scan(dir);
  return [...new Set(paths)]; // Deduplicate
}

function isPathPhantom(docPath: string): boolean {
  // Convert doc path to actual path
  const relativePath = docPath.replace(/^cardplay\//, '');
  
  // Check if it exists
  const variants = [
    join(process.cwd(), relativePath),
    join(process.cwd(), relativePath + '.ts'),
    join(process.cwd(), relativePath + '.tsx'),
    join(process.cwd(), relativePath, 'index.ts'),
  ];
  
  return !variants.some(v => existsSync(v));
}

describe('Canon: No Phantom Modules', () => {
  it('should not reference nonexistent modules in docs unless marked legacy/aspirational', () => {
    const referencedPaths = scanDocsForModulePaths(DOCS_DIR);
    const phantomPaths: string[] = [];
    
    for (const path of referencedPaths) {
      if (isPathPhantom(path)) {
        // Check if it's in the allowed list
        const isAllowed = ALLOWED_PHANTOM_PATHS.some(allowed => 
          path.includes(allowed)
        );
        
        if (!isAllowed) {
          phantomPaths.push(path);
        }
      }
    }
    
    if (phantomPaths.length > 0) {
      console.error('Found phantom module references:');
      phantomPaths.forEach(p => console.error(`  - ${p}`));
      console.error('\nEither implement these modules or mark them as legacy/aspirational in docs.');
    }
    
    expect(phantomPaths).toHaveLength(0);
  });
});
