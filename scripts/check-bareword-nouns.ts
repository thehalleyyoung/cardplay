#!/usr/bin/env ts-node
/**
 * check-bareword-nouns.ts
 * Flags "deck/card/stack" usage in docs without qualifiers per cardplay/docs/canon/nouns.md
 * 
 * Change 043 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const DOCS_ROOT = path.join(__dirname, '../docs');

// Barewords to check (excluding code blocks and specific contexts)
const BAREWORDS = ['card', 'deck', 'stack', 'track'];

// Qualified forms that are OK
const QUALIFIED_PATTERNS = [
  /\b(?:board|audio|theory|core|UI|editor|slot-grid|arrangement|freeze|transport|pattern|piano-roll|notation|session|mixer|routing|instruments|samples|effects|harmony|generators|ai-advisor|track-groups|mix-bus|reference-track|spectrum-analyzer|waveform-editor|sample-manager|dsp-chain|modulation-matrix|automation|properties|phrases|arranger)\s+(?:card|deck|stack|track)\b/i,
  /\b(?:card|deck|stack|track)\s+(?:system|type|id|definition|instance|factory|component|surface|module|model)\b/i,
  /\bCardPlay\b/,
];

interface BarewordViolation {
  file: string;
  line: number;
  word: string;
  context: string;
}

function isQualified(text: string): boolean {
  return QUALIFIED_PATTERNS.some(pattern => pattern.test(text));
}

async function checkBarewords(): Promise<BarewordViolation[]> {
  const violations: BarewordViolation[] = [];
  
  // Find all markdown files
  const allDocs = await glob('**/*.md', { cwd: DOCS_ROOT, absolute: true });
  
  for (const file of allDocs) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Track code blocks
      if (line.match(/^```/)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      // Skip code blocks and inline code
      if (inCodeBlock) {
        continue;
      }
      
      // Check for barewords
      for (const word of BAREWORDS) {
        const regex = new RegExp(`\\b${word}s?\\b`, 'gi');
        const matches = line.matchAll(regex);
        
        for (const match of matches) {
          // Get surrounding context
          const startIdx = Math.max(0, match.index! - 30);
          const endIdx = Math.min(line.length, match.index! + word.length + 30);
          const context = line.slice(startIdx, endIdx);
          
          // Skip if qualified
          if (isQualified(context)) {
            continue;
          }
          
          // Skip inline code
          if (line.includes('`') && isBetweenBackticks(line, match.index!)) {
            continue;
          }
          
          violations.push({
            file: path.relative(DOCS_ROOT, file),
            line: lineNum,
            word: match[0],
            context: context.trim()
          });
        }
      }
    }
  }
  
  return violations;
}

function isBetweenBackticks(line: string, pos: number): boolean {
  let backtickCount = 0;
  for (let i = 0; i < pos; i++) {
    if (line[i] === '`') {
      backtickCount++;
    }
  }
  return backtickCount % 2 === 1;
}

async function main(): Promise<void> {
  console.log('Checking for bareword nouns in docs...\n');
  
  const violations = await checkBarewords();
  
  if (violations.length > 0) {
    console.log('ℹ Bareword noun usage found:\n');
    
    // Group by file
    const byFile = new Map<string, BarewordViolation[]>();
    for (const v of violations) {
      if (!byFile.has(v.file)) {
        byFile.set(v.file, []);
      }
      byFile.get(v.file)!.push(v);
    }
    
    for (const [file, fileViolations] of byFile) {
      console.log(`  ${file}:`);
      for (const v of fileViolations.slice(0, 5)) { // Limit to 5 per file
        console.log(`    Line ${v.line}: "${v.word}" in context: ...${v.context}...`);
      }
      if (fileViolations.length > 5) {
        console.log(`    ... and ${fileViolations.length - 5} more\n`);
      } else {
        console.log();
      }
    }
    
    console.log(`Found ${violations.length} potential bareword usage(s)`);
    console.log('(This is informational - consider adding qualifiers)\n');
    
    // Don't fail - this is informational only
    process.exit(0);
  }
  
  console.log('✓ No bareword noun issues found\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
