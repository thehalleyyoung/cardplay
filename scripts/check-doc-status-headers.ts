#!/usr/bin/env ts-node
/**
 * check-doc-status-headers.ts
 * Enforces: only cardplay/docs/canon/** may claim "Status: implemented"
 * 
 * Change 038 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const DOCS_ROOT = path.join(__dirname, '../docs');
const CANON_ROOT = path.join(DOCS_ROOT, 'canon');

interface StatusViolation {
  file: string;
  line: number;
  status: string;
}

async function checkStatusHeaders(): Promise<StatusViolation[]> {
  const violations: StatusViolation[] = [];
  
  // Find all markdown files
  const allDocs = await glob('**/*.md', { cwd: DOCS_ROOT, absolute: true });
  
  for (const file of allDocs) {
    const isCanon = file.startsWith(CANON_ROOT);
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Look for Status: headers
      const statusMatch = line.match(/^[#*\s]*Status:\s*(\w+)/i);
      
      if (statusMatch) {
        const status = statusMatch[1].toLowerCase();
        
        // Only canon docs can claim "implemented"
        if (status === 'implemented' && !isCanon) {
          violations.push({
            file: path.relative(DOCS_ROOT, file),
            line: lineNum,
            status: statusMatch[1]
          });
        }
      }
    }
  }
  
  return violations;
}

async function main(): Promise<void> {
  console.log('Checking doc status headers...\n');
  
  const violations = await checkStatusHeaders();
  
  if (violations.length > 0) {
    console.log('✗ Status header violations found:\n');
    
    violations.forEach(v => {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`    Status: ${v.status} (only canon docs may claim "implemented")\n`);
    });
    
    console.log(`Found ${violations.length} violation(s)\n`);
    process.exit(1);
  }
  
  console.log('✓ All status headers are valid\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
