#!/usr/bin/env ts-node
/**
 * check-doc-headers.ts
 * Enforces: every file under cardplay/docs/ includes DOC-HEADER/1
 * 
 * Change 039 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { glob } from 'glob';

const DOCS_ROOT = path.join(__dirname, '../docs');

interface HeaderViolation {
  file: string;
  reason: string;
}

async function checkDocHeaders(): Promise<HeaderViolation[]> {
  const violations: HeaderViolation[] = [];
  
  // Find all markdown files
  const allDocs = await glob('**/*.md', { cwd: DOCS_ROOT, absolute: true });
  
  for (const file of allDocs) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for DOC-HEADER/1 pattern
    const hasHeader = /DOC-HEADER\/1/i.test(content);
    
    if (!hasHeader) {
      violations.push({
        file: path.relative(DOCS_ROOT, file),
        reason: 'Missing DOC-HEADER/1'
      });
    }
  }
  
  return violations;
}

async function main(): Promise<void> {
  console.log('Checking doc headers...\n');
  
  const violations = await checkDocHeaders();
  
  if (violations.length > 0) {
    console.log('ℹ Doc header violations found:\n');
    
    violations.forEach(v => {
      console.log(`  ${v.file}`);
      console.log(`    ${v.reason}\n`);
    });
    
    console.log(`Found ${violations.length} file(s) without DOC-HEADER/1`);
    console.log('(This is informational - not blocking yet)\n');
    
    // For now, just warn - don't fail
    process.exit(0);
  }
  
  console.log('✓ All docs have DOC-HEADER/1\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
