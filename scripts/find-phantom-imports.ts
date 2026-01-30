#!/usr/bin/env ts-node
/**
 * find-phantom-imports.ts
 * Flags imports referring to nonexistent paths mentioned in docs
 * 
 * Change 016 from to_fix_repo_plan_500.md
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

// Known phantom paths from docs that don't exist
const KNOWN_PHANTOM_PATHS = [
  'src/registry/v2',
  'src/core/port-conversion',
  'src/core/card',
];

interface Issue {
  file: string;
  line: number;
  importPath: string;
  reason: string;
}

const issues: Issue[] = [];
let filesScanned = 0;

function scanFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      // Match import/from statements
      const importMatch = line.match(/(?:import|from)\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];
        
        // Check if it's a relative import starting with ./ or ../
        if (importPath.startsWith('.')) {
          const dir = filePath.substring(0, filePath.lastIndexOf('/'));
          const resolvedPath = join(dir, importPath);
          
          // Check if file exists (try with and without extensions)
          const variants = [
            resolvedPath,
            resolvedPath + '.ts',
            resolvedPath + '.tsx',
            resolvedPath + '.js',
            resolvedPath + '/index.ts',
            resolvedPath + '/index.js',
          ];
          
          if (!variants.some(v => existsSync(v))) {
            issues.push({
              file: filePath,
              line: idx + 1,
              importPath,
              reason: 'Import path does not exist',
            });
          }
        }
        
        // Check for known phantom paths in absolute imports
        for (const phantom of KNOWN_PHANTOM_PATHS) {
          if (importPath.includes(phantom)) {
            issues.push({
              file: filePath,
              line: idx + 1,
              importPath,
              reason: `References known phantom path: ${phantom}`,
            });
          }
        }
      }
    });
    
    filesScanned++;
  } catch (err) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir: string, extensions: string[] = ['.ts', '.tsx', '.js']): void {
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, coverage
        if (!['node_modules', 'dist', 'coverage', '.git'].includes(entry)) {
          scanDirectory(fullPath, extensions);
        }
      } else if (stat.isFile()) {
        const ext = entry.substring(entry.lastIndexOf('.'));
        if (extensions.includes(ext)) {
          scanFile(fullPath);
        }
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }
}

// Main execution
const srcDir = join(process.cwd(), 'src');
console.log('Scanning for phantom import paths...\n');

scanDirectory(srcDir);

if (issues.length === 0) {
  console.log(`✓ No phantom imports found in ${filesScanned} files.`);
  process.exit(0);
} else {
  console.log(`✗ Found ${issues.length} phantom imports in ${filesScanned} files:\n`);
  
  issues.forEach(issue => {
    console.log(`${issue.file}:${issue.line}`);
    console.log(`  Import: ${issue.importPath}`);
    console.log(`  → ${issue.reason}\n`);
  });
  
  process.exit(1);
}
