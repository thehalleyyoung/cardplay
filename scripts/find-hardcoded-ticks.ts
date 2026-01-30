#!/usr/bin/env ts-node
/**
 * find-hardcoded-ticks.ts
 * Flags comments/calculations assuming PPQ ≠ 960
 * 
 * Change 013 from to_fix_repo_plan_500.md
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const PPQ = 960;
const SUSPICIOUS_PATTERNS = [
  /PPQ\s*[=:]\s*(?!960)\d+/gi,  // PPQ = something other than 960
  /ppq\s*[=:]\s*(?!960)\d+/gi,  // ppq = something other than 960
  /\b480\s*(ticks?|PPQ)/gi,      // Common legacy PPQ value
  /\b192\s*(ticks?|PPQ)/gi,      // Another common legacy PPQ
  /\b96\s*(ticks?|PPQ)/gi,       // Quarter note at PPQ=96
  /quarter.*\b(?!240)\d+\s*ticks?/gi,  // Quarter note not 240 ticks
  /sixteenth.*\b(?!60)\d+\s*ticks?/gi, // Sixteenth note not 60 ticks
  /eighth.*\b(?!120)\d+\s*ticks?/gi,   // Eighth note not 120 ticks
];

const EXPECTED_VALUES = [
  { pattern: /\bquarter\b.*\b240\b/i, desc: 'quarter note = 240 ticks' },
  { pattern: /\bsixteenth\b.*\b60\b/i, desc: 'sixteenth note = 60 ticks' },
  { pattern: /\beighth\b.*\b120\b/i, desc: 'eighth note = 120 ticks' },
  { pattern: /\bhalf\b.*\b480\b/i, desc: 'half note = 480 ticks' },
];

interface Issue {
  file: string;
  line: number;
  content: string;
  reason: string;
}

const issues: Issue[] = [];
let filesScanned = 0;

function scanFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(line)) {
          issues.push({
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            reason: `Potentially incorrect PPQ assumption (expecting PPQ=${PPQ})`,
          });
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
console.log(`Scanning for hardcoded tick assumptions (PPQ=${PPQ})...\n`);

scanDirectory(srcDir);

if (issues.length === 0) {
  console.log(`✓ No suspicious tick calculations found in ${filesScanned} files.`);
  process.exit(0);
} else {
  console.log(`✗ Found ${issues.length} potential issues in ${filesScanned} files:\n`);
  
  issues.forEach(issue => {
    console.log(`${issue.file}:${issue.line}`);
    console.log(`  ${issue.content}`);
    console.log(`  → ${issue.reason}\n`);
  });
  
  process.exit(1);
}
