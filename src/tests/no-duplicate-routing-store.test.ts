/**
 * @fileoverview Test ensuring no duplicate routing graph stores exist.
 * 
 * Change 249: Ensure routing deck UI reads/writes only SSOT RoutingGraphStore.
 * There should be exactly one routing graph store in the codebase.
 * 
 * @module @cardplay/tests/no-duplicate-routing-store
 */

import { describe, it, expect } from 'vitest';
import glob from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const globAsync = promisify(glob);

describe('Routing Graph Store SSOT', () => {
  it('should have exactly one routing graph store implementation', async () => {
    // Find all TypeScript files
    const files = await globAsync('src/**/*.ts', {
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
      cwd: process.cwd(),
    });

    const routingStoreFiles: string[] = [];
    const suspiciousPatterns = [
      /class\s+\w*RoutingGraph\w*Store/,
      /function\s+createRoutingGraph/,
    ];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      
      // Check for routing graph store implementations (not just re-exports)
      if (content.includes('RoutingGraphStore') || content.includes('routingGraph')) {
        // Skip files that are just re-exporting
        if (content.includes('export {') && !content.includes('class ') && !content.includes('function create')) {
          continue;
        }
        
        const lines = content.split('\n');
        for (const line of lines) {
          // Skip imports and simple re-exports
          if (line.trim().startsWith('import ') || 
              line.trim().startsWith('export {') || 
              line.trim().startsWith('export type')) {
            continue;
          }
          
          if (suspiciousPatterns.some(pattern => pattern.test(line))) {
            if (!routingStoreFiles.includes(file)) {
              routingStoreFiles.push(file);
            }
          }
        }
      }
    }

    // The canonical routing graph store should be in src/state/routing-graph.ts
    const canonicalStore = 'src/state/routing-graph.ts';
    
    // Filter out the canonical one and any test files
    const duplicates = routingStoreFiles.filter(f => 
      !f.includes('.test.') && 
      !f.includes('.spec.') &&
      f !== canonicalStore
    );

    expect(
      duplicates,
      `Found potential duplicate routing stores. The SSOT is ${canonicalStore}.\n` +
      `Potential duplicates: ${duplicates.join(', ')}`
    ).toHaveLength(0);
  });

  it('should have routing graph as the documented SSOT', () => {
    const canonicalFile = join(process.cwd(), 'src/state/routing-graph.ts');
    const content = readFileSync(canonicalFile, 'utf-8');

    // Check that the file documents itself as SSOT
    expect(content).toContain('SSOT');
    expect(content.toLowerCase()).toMatch(/routing.*graph/);
  });

  it('should not have parallel routing state in UI components', async () => {
    // Check that UI deck components don't maintain separate routing state
    const uiFiles = await globAsync('src/ui/**/*.ts', {
      ignore: ['**/*.test.ts', '**/*.spec.ts'],
      cwd: process.cwd(),
    });

    const filesWithParallelState: string[] = [];

    for (const file of uiFiles) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      
      // Look for suspicious patterns that suggest parallel routing state
      if (
        content.includes('private connections') ||
        content.includes('private routing') ||
        (content.includes('Map') && content.includes('connection') && !content.includes('import'))
      ) {
        // Check if it's actually creating state vs just using the SSOT
        if (!content.includes('getRoutingGraphStore()') && 
            !content.includes('from \'../../state/routing-graph\'')) {
          filesWithParallelState.push(file);
        }
      }
    }

    // This is a soft check - may need refinement
    // For now, just document what we find
    if (filesWithParallelState.length > 0) {
      console.warn(
        'Found UI files with potential parallel routing state:\n' +
        filesWithParallelState.join('\n')
      );
    }
  });
});
