#!/usr/bin/env tsx

/**
 * check-ssot-references.ts
 * 
 * Ensures SSOT claims in docs reference the canonical store files
 * named in cardplay/docs/canon/ssot-stores.md
 * 
 * Change 048 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const SSOT_DOC = path.join(ROOT, 'docs', 'canon', 'ssot-stores.md');

// Known canonical SSOT stores from docs/canon/ssot-stores.md
const CANONICAL_SSOT_STORES = {
  'SharedEventStore': 'src/state/event-store.ts',
  'ClipRegistry': 'src/state/clip-registry.ts',
  'RoutingGraphStore': 'src/state/routing-graph.ts',
  'BoardStateStore': 'src/boards/store/store.ts',
  'BoardContextStore': 'src/boards/context/store.ts',
  'MusicSpec': 'src/ai/theory/music-spec.ts',
};

interface Issue {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

function checkSSOTReferences(): Issue[] {
  const issues: Issue[] = [];
  
  // Verify SSOT doc exists
  if (!fs.existsSync(SSOT_DOC)) {
    issues.push({
      file: SSOT_DOC,
      line: 0,
      message: 'SSOT canonical doc (ssot-stores.md) not found',
      severity: 'error',
    });
    return issues;
  }
  
  // Verify all canonical store files exist
  for (const [storeName, filePath] of Object.entries(CANONICAL_SSOT_STORES)) {
    const fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      issues.push({
        file: filePath,
        line: 0,
        message: `Canonical SSOT store "${storeName}" file not found`,
        severity: 'error',
      });
    }
  }
  
  // Scan docs for SSOT mentions
  function scanDir(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        checkFile(fullPath);
      }
    }
  }
  
  function checkFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Look for SSOT claims
      if (/SSOT|single source of truth/i.test(line)) {
        // Check if it mentions a canonical store
        let foundStore = false;
        for (const storeName of Object.keys(CANONICAL_SSOT_STORES)) {
          if (line.includes(storeName)) {
            foundStore = true;
            break;
          }
        }
        
        // Warn if SSOT claim doesn't mention a canonical store
        if (!foundStore && !line.includes('ssot-stores.md')) {
          issues.push({
            file: path.relative(ROOT, filePath),
            line: lineNum,
            message: 'SSOT claim should reference a canonical store from ssot-stores.md',
            severity: 'warning',
          });
        }
      }
    }
  }
  
  scanDir(DOCS_DIR);
  
  return issues;
}

function main() {
  console.log('Checking SSOT references in docs...\n');
  
  const issues = checkSSOTReferences();
  
  if (issues.length === 0) {
    console.log('✅ All SSOT references are valid\n');
    process.exit(0);
  }
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    for (const error of errors) {
      console.log(`  ${error.file}:${error.line} - ${error.message}`);
    }
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    for (const warning of warnings) {
      console.log(`  ${warning.file}:${warning.line} - ${warning.message}`);
    }
    console.log('');
  }
  
  console.log(`Total: ${errors.length} errors, ${warnings.length} warnings\n`);
  
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
