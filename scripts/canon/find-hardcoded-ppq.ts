#!/usr/bin/env npx ts-node
/**
 * @fileoverview Find Hardcoded PPQ Script
 * 
 * Fails if any file defines `PPQ` locally (e.g., `const PPQ = 480`).
 * PPQ should only be imported from `src/types/primitives.ts`.
 * 
 * Run: npx ts-node scripts/canon/find-hardcoded-ppq.ts
 * 
 * @module @cardplay/scripts/canon/find-hardcoded-ppq
 * @see to_fix_repo_plan_500.md Change 012
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CANONICAL PPQ
// ============================================================================

const CANONICAL_PPQ = 960;
const CANONICAL_PPQ_FILE = 'src/types/primitives.ts';

// Common incorrect PPQ values
const INCORRECT_PPQ_VALUES = [96, 120, 192, 240, 384, 480];

// ============================================================================
// SCANNING
// ============================================================================

interface Violation {
  file: string;
  line: number;
  type: 'local-definition' | 'wrong-value' | 'hardcoded-calculation';
  content: string;
  suggestion: string;
}

function isCanonicalFile(filePath: string): boolean {
  return filePath.endsWith(CANONICAL_PPQ_FILE) || 
         filePath.includes('primitives.ts');
}

function scanFile(filePath: string, rootDir: string): Violation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];
  const relativePath = path.relative(rootDir, filePath);

  // Skip the canonical file
  if (isCanonicalFile(relativePath)) {
    return violations;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for local PPQ definitions
    const ppqDefPattern = /(?:const|let|var)\s+PPQ\s*=\s*(\d+)/;
    const ppqDefMatch = line.match(ppqDefPattern);
    
    if (ppqDefMatch) {
      const value = parseInt(ppqDefMatch[1], 10);
      violations.push({
        file: relativePath,
        line: i + 1,
        type: value !== CANONICAL_PPQ ? 'wrong-value' : 'local-definition',
        content: line.trim(),
        suggestion: value !== CANONICAL_PPQ 
          ? `PPQ should be ${CANONICAL_PPQ}, not ${value}. Import from '${CANONICAL_PPQ_FILE}'`
          : `Import PPQ from '${CANONICAL_PPQ_FILE}' instead of redefining`,
      });
    }

    // Check for hardcoded incorrect PPQ values in comments or calculations
    for (const wrongPpq of INCORRECT_PPQ_VALUES) {
      // Look for patterns like "PPQ = 480" or "ppq: 480" or "/ 480" (division by wrong PPQ)
      const wrongValuePattern = new RegExp(`(?:ppq|PPQ|ticks?PerQuarter)\\s*[=:]\\s*${wrongPpq}\\b`, 'i');
      if (wrongValuePattern.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          type: 'wrong-value',
          content: line.trim(),
          suggestion: `Uses PPQ=${wrongPpq} but canonical is ${CANONICAL_PPQ}`,
        });
      }

      // Look for calculations assuming wrong PPQ
      // e.g., "/ 480" for quarter note calculations
      const calcPattern = new RegExp(`[*/]\\s*${wrongPpq}\\b`);
      if (calcPattern.test(line) && (line.includes('tick') || line.includes('beat') || line.includes('quarter'))) {
        violations.push({
          file: relativePath,
          line: i + 1,
          type: 'hardcoded-calculation',
          content: line.trim(),
          suggestion: `Calculation may assume PPQ=${wrongPpq}. Use imported PPQ constant.`,
        });
      }
    }

    // Check for hardcoded tick values that assume wrong PPQ
    // e.g., "const quarterNote = 480" should be "const quarterNote = PPQ"
    const hardcodedTickPattern = /(?:quarterNote|quarter_note|QUARTER_NOTE)\s*=\s*(\d+)/;
    const hardcodedTickMatch = line.match(hardcodedTickPattern);
    if (hardcodedTickMatch) {
      const value = parseInt(hardcodedTickMatch[1], 10);
      if (value !== CANONICAL_PPQ) {
        violations.push({
          file: relativePath,
          line: i + 1,
          type: 'hardcoded-calculation',
          content: line.trim(),
          suggestion: `Quarter note should be PPQ (${CANONICAL_PPQ}), not ${value}`,
        });
      }
    }
  }

  return violations;
}

function scanDirectory(dir: string, rootDir: string): Violation[] {
  const violations: Violation[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        violations.push(...scanFile(fullPath, rootDir));
      }
    }
  }

  walk(dir);
  return violations;
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const rootDir = path.resolve(__dirname, '../..');
  const srcDir = path.join(rootDir, 'src');

  console.log('='.repeat(60));
  console.log('Find Hardcoded PPQ');
  console.log('='.repeat(60));
  console.log();
  console.log(`Canonical PPQ: ${CANONICAL_PPQ} (from ${CANONICAL_PPQ_FILE})`);
  console.log();

  if (!fs.existsSync(srcDir)) {
    console.error(`ERROR: ${srcDir} not found`);
    process.exit(1);
  }

  const violations = scanDirectory(srcDir, rootDir);

  if (violations.length === 0) {
    console.log('✓ No hardcoded PPQ violations found!');
    process.exit(0);
  }

  // Group by type
  const byType = new Map<string, Violation[]>();
  for (const v of violations) {
    const existing = byType.get(v.type) || [];
    existing.push(v);
    byType.set(v.type, existing);
  }

  console.log(`Found ${violations.length} PPQ violations:`);
  console.log();

  for (const [type, typeViolations] of byType) {
    console.log(`${type} (${typeViolations.length}):`);
    console.log('-'.repeat(40));
    
    for (const v of typeViolations.slice(0, 10)) {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`    ${v.content.substring(0, 80)}`);
      console.log(`    → ${v.suggestion}`);
    }
    
    if (typeViolations.length > 10) {
      console.log(`  ... and ${typeViolations.length - 10} more`);
    }
    console.log();
  }

  console.log('='.repeat(60));
  
  const hasLocalDefs = byType.has('local-definition') || byType.has('wrong-value');
  if (hasLocalDefs) {
    console.log('✗ Found local PPQ definitions - these should be imports');
    process.exit(1);
  } else {
    console.log('~ Found hardcoded calculations but no local definitions');
    console.log('  Consider using PPQ constant for maintainability');
    process.exit(0);
  }
}

main();
