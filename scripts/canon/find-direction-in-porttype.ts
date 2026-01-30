#!/usr/bin/env npx ts-node
/**
 * @fileoverview Find Direction in PortType Script
 * 
 * Flags `audio_in`/`midi_out`-style port types outside UI CSS classnames.
 * Direction should be separate from type per canon.
 * 
 * Run: npx ts-node scripts/canon/find-direction-in-porttype.ts
 * 
 * @module @cardplay/scripts/canon/find-direction-in-porttype
 * @see to_fix_repo_plan_500.md Change 014
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// PATTERNS
// ============================================================================

// Direction-encoded port type patterns
const DIRECTION_PORT_PATTERNS = [
  /['"`]audio_(?:in|out)['"`]/g,
  /['"`]midi_(?:in|out)['"`]/g,
  /['"`]notes_(?:in|out)['"`]/g,
  /['"`]control_(?:in|out)['"`]/g,
  /['"`]trigger_(?:in|out)['"`]/g,
  /['"`]gate_(?:in|out)['"`]/g,
  /['"`]clock_(?:in|out)['"`]/g,
  /['"`]transport_(?:in|out)['"`]/g,
  // Also catch without quotes in type definitions
  /\|\s*['"`]?\w+_(?:in|out)['"`]?/g,
];

// Allowed contexts (CSS, class names, comments)
const ALLOWED_CONTEXTS = [
  /class(?:Name)?[=:]\s*[`'"]/i,  // className or class assignment
  /\.card-port-/i,                 // CSS class prefix
  /css|style|class/i,              // CSS-related context
  /\/\/.*direction/i,              // Comment about direction
  /\/\*.*direction.*\*\//i,        // Block comment about direction
];

// ============================================================================
// SCANNING
// ============================================================================

interface Occurrence {
  file: string;
  line: number;
  match: string;
  context: string;
  isAllowed: boolean;
}

function isAllowedContext(line: string): boolean {
  return ALLOWED_CONTEXTS.some(pattern => pattern.test(line));
}

function scanFile(filePath: string, rootDir: string): Occurrence[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const occurrences: Occurrence[] = [];
  const relativePath = path.relative(rootDir, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of DIRECTION_PORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        const isAllowed = isAllowedContext(line);
        
        occurrences.push({
          file: relativePath,
          line: i + 1,
          match: match[0],
          context: line.trim().substring(0, 100),
          isAllowed,
        });
      }
    }
  }

  return occurrences;
}

function scanDirectory(dir: string, rootDir: string): Occurrence[] {
  const occurrences: Occurrence[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        occurrences.push(...scanFile(fullPath, rootDir));
      }
    }
  }

  walk(dir);
  return occurrences;
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const rootDir = path.resolve(__dirname, '../..');
  const srcDir = path.join(rootDir, 'src');

  console.log('='.repeat(60));
  console.log('Find Direction in PortType');
  console.log('='.repeat(60));
  console.log();
  console.log('Canon: Port direction should be separate from port type.');
  console.log('       Use { direction: "in", type: "audio" } not "audio_in"');
  console.log();

  if (!fs.existsSync(srcDir)) {
    console.error(`ERROR: ${srcDir} not found`);
    process.exit(1);
  }

  const occurrences = scanDirectory(srcDir, rootDir);

  const violations = occurrences.filter(o => !o.isAllowed);
  const allowed = occurrences.filter(o => o.isAllowed);

  console.log(`Found ${occurrences.length} direction-encoded port types:`);
  console.log(`  ${allowed.length} in allowed contexts (CSS/styles)`);
  console.log(`  ${violations.length} in code (need migration)`);
  console.log();

  if (violations.length > 0) {
    console.log('Violations (need to separate direction from type):');
    console.log('-'.repeat(60));
    
    for (const v of violations.slice(0, 20)) {
      console.log(`${v.file}:${v.line}`);
      console.log(`  Match: ${v.match}`);
      console.log(`  Context: ${v.context}`);
      console.log();
    }
    
    if (violations.length > 20) {
      console.log(`... and ${violations.length - 20} more violations`);
    }
  }

  if (allowed.length > 0) {
    console.log();
    console.log('Allowed occurrences (CSS/style context):');
    for (const a of allowed.slice(0, 5)) {
      console.log(`  ${a.file}:${a.line} - ${a.match}`);
    }
    if (allowed.length > 5) {
      console.log(`  ... and ${allowed.length - 5} more`);
    }
  }

  console.log();
  console.log('='.repeat(60));
  
  if (violations.length === 0) {
    console.log('✓ No direction-encoded port types in code!');
    process.exit(0);
  } else {
    console.log(`✗ Found ${violations.length} violations`);
    console.log('  Migrate to: { direction: "in"|"out", type: PortType }');
    // Don't fail hard - informational during migration
    process.exit(0);
  }
}

main();
