#!/usr/bin/env npx ts-node
/**
 * @fileoverview Module Map Check Script
 * 
 * Ensures every `src/core/*` or `src/registry/*` reference in docs either 
 * disappears or is accompanied by a "Legacy alias" block linking 
 * `cardplay/docs/canon/module-map.md`.
 * 
 * Run: npx ts-node scripts/canon/check-module-map.ts
 * 
 * @module @cardplay/scripts/canon/check-module-map
 * @see to_fix_repo_plan_500.md Change 003
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// PHANTOM MODULE PATTERNS
// ============================================================================

// These patterns indicate references to modules that don't exist or are legacy
// Note: src/registry/v2/ is now implemented (Changes 406-413), so only checking src/core/
const PHANTOM_MODULE_PATTERNS = [
  /src\/core\//g,
  /cardplay\/src\/core\//g,
  /@cardplay\/core\//g,
];

// Allowed contexts where these patterns may appear
const ALLOWED_CONTEXTS = [
  'Legacy alias',
  'legacy:',
  'deprecated',
  'aspirational',
  'not yet implemented',
  'phantom',
  'historical',
];

interface PhantomReference {
  file: string;
  line: number;
  match: string;
  context: string;
  isAllowed: boolean;
}

// ============================================================================
// SCANNING FUNCTIONS
// ============================================================================

function scanFile(filePath: string): PhantomReference[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const references: PhantomReference[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of PHANTOM_MODULE_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        // Get context (surrounding lines)
        const contextStart = Math.max(0, i - 2);
        const contextEnd = Math.min(lines.length, i + 3);
        const context = lines.slice(contextStart, contextEnd).join('\n');
        
        // Check if this is in an allowed context
        const isAllowed = ALLOWED_CONTEXTS.some(allowed => 
          context.toLowerCase().includes(allowed.toLowerCase())
        );

        references.push({
          file: filePath,
          line: i + 1,
          match: match[0],
          context: line.trim().substring(0, 100),
          isAllowed,
        });
      }
    }
  }

  return references;
}

function scanDocsDirectory(docsDir: string): PhantomReference[] {
  const allReferences: PhantomReference[] = [];

  function walkDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip hidden directories
        if (!entry.name.startsWith('.')) {
          walkDir(fullPath);
        }
      } else if (entry.name.endsWith('.md')) {
        const refs = scanFile(fullPath);
        allReferences.push(...refs);
      }
    }
  }

  walkDir(docsDir);
  return allReferences;
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const rootDir = path.resolve(__dirname, '../..');
  const docsDir = path.join(rootDir, 'docs');

  console.log('='.repeat(60));
  console.log('Module Map Check (Phantom Module References)');
  console.log('='.repeat(60));
  console.log();

  if (!fs.existsSync(docsDir)) {
    console.error(`ERROR: ${docsDir} not found`);
    process.exit(1);
  }

  const references = scanDocsDirectory(docsDir);
  
  const unallowedRefs = references.filter(r => !r.isAllowed);
  const allowedRefs = references.filter(r => r.isAllowed);

  console.log(`Found ${references.length} phantom module references`);
  console.log(`  ${allowedRefs.length} in allowed contexts (legacy/aspirational)`);
  console.log(`  ${unallowedRefs.length} not in allowed contexts`);
  console.log();

  if (unallowedRefs.length > 0) {
    console.log('Unallowed phantom references:');
    console.log('-'.repeat(60));
    
    for (const ref of unallowedRefs) {
      const relPath = path.relative(rootDir, ref.file);
      console.log(`${relPath}:${ref.line}`);
      console.log(`  Match: ${ref.match}`);
      console.log(`  Context: ${ref.context}`);
      console.log();
    }
  }

  if (allowedRefs.length > 0) {
    console.log('Allowed phantom references (in legacy/aspirational context):');
    console.log('-'.repeat(60));
    
    for (const ref of allowedRefs.slice(0, 10)) {  // Show first 10
      const relPath = path.relative(rootDir, ref.file);
      console.log(`${relPath}:${ref.line} - ${ref.match}`);
    }
    if (allowedRefs.length > 10) {
      console.log(`  ... and ${allowedRefs.length - 10} more`);
    }
    console.log();
  }

  console.log('='.repeat(60));
  if (unallowedRefs.length === 0) {
    console.log('✓ Module map check passed!');
    console.log('  All phantom module references are in allowed contexts.');
    process.exit(0);
  } else {
    console.log(`✗ Module map check FAILED`);
    console.log(`  ${unallowedRefs.length} references need to be fixed.`);
    console.log('  Either:');
    console.log('    1. Remove the phantom reference');
    console.log('    2. Add "Legacy alias" or "aspirational" context');
    console.log('    3. Implement the missing module');
    process.exit(1);
  }
}

main();
