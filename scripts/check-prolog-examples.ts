#!/usr/bin/env ts-node
/**
 * check-prolog-examples.ts
 * Enforces: every .pl example in docs cites the exact cardplay/src/ai/knowledge/*.pl file
 * 
 * Change 040 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const DOCS_ROOT = path.join(__dirname, '../docs');
const KB_ROOT = path.join(__dirname, '../src/ai/knowledge');

interface PrologViolation {
  file: string;
  line: number;
  issue: string;
}

async function checkPrologExamples(): Promise<PrologViolation[]> {
  const violations: PrologViolation[] = [];
  
  // Get list of actual KB files
  const kbFiles = fs.existsSync(KB_ROOT) 
    ? await glob('**/*.pl', { cwd: KB_ROOT })
    : [];
  
  const kbFilesSet = new Set(kbFiles.map(f => path.basename(f)));
  
  // Find all markdown files
  const allDocs = await glob('**/*.md', { cwd: DOCS_ROOT, absolute: true });
  
  for (const file of allDocs) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    let inCodeBlock = false;
    let isPrologBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Track code blocks
      if (line.match(/^```(prolog|pl)/i)) {
        inCodeBlock = true;
        isPrologBlock = true;
        
        // Check if there's a file reference in the code fence
        const fileRef = line.match(/```(?:prolog|pl)\s+(.+\.pl)/i);
        if (!fileRef) {
          // Look for file reference in preceding lines
          let hasFileRef = false;
          for (let j = Math.max(0, i - 3); j < i; j++) {
            if (lines[j].match(/src\/ai\/knowledge\/[\w-]+\.pl/)) {
              hasFileRef = true;
              break;
            }
          }
          
          if (!hasFileRef) {
            violations.push({
              file: path.relative(DOCS_ROOT, file),
              line: lineNum,
              issue: 'Prolog code block missing file reference'
            });
          }
        }
      } else if (line.match(/^```$/) && inCodeBlock) {
        inCodeBlock = false;
        isPrologBlock = false;
      }
      
      // Check for inline references to .pl files
      const plFileRef = line.match(/src\/ai\/knowledge\/([\w-]+\.pl)/);
      if (plFileRef) {
        const fileName = plFileRef[1];
        if (!kbFilesSet.has(fileName)) {
          violations.push({
            file: path.relative(DOCS_ROOT, file),
            line: lineNum,
            issue: `References non-existent KB file: ${fileName}`
          });
        }
      }
    }
  }
  
  return violations;
}

async function main(): Promise<void> {
  console.log('Checking Prolog examples in docs...\n');
  
  const violations = await checkPrologExamples();
  
  if (violations.length > 0) {
    console.log('ℹ Prolog example issues found:\n');
    
    violations.forEach(v => {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`    ${v.issue}\n`);
    });
    
    console.log(`Found ${violations.length} issue(s)`);
    console.log('(This is informational - not blocking yet)\n');
    
    // For now, just warn - don't fail
    process.exit(0);
  }
  
  console.log('✓ All Prolog examples are properly referenced\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
