#!/usr/bin/env npx ts-node
/**
 * @fileoverview Code Terminology Lint Script
 * 
 * Forbids exporting ambiguous core nouns (`Card`, `Deck`, `Stack`, `Track`, 
 * `PortType`, `HostAction`) outside canonical modules unless explicitly 
 * suffixed/prefixed.
 * 
 * Run: npx ts-node scripts/canon/code-terminology-lint.ts
 * 
 * @module @cardplay/scripts/canon/code-terminology-lint
 * @see to_fix_repo_plan_500.md Change 008
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// AMBIGUOUS NOUNS
// ============================================================================

// These nouns should not be exported as bare names except from their canonical modules
interface AmbiguousNoun {
  name: string;
  canonicalModules: string[];  // Files that MAY export this bare name
  suggestedPrefixes: string[]; // Suggested prefixes for non-canonical uses
}

const AMBIGUOUS_NOUNS: AmbiguousNoun[] = [
  {
    name: 'Card',
    canonicalModules: ['src/cards/card.ts'],
    suggestedPrefixes: ['Core', 'Audio', 'Theory', 'UI', 'Visual'],
  },
  {
    name: 'Deck',
    canonicalModules: ['src/boards/types.ts'],
    suggestedPrefixes: ['Board', 'UI', 'Slot'],
  },
  {
    name: 'Stack',
    canonicalModules: ['src/cards/stack.ts'],
    suggestedPrefixes: ['Card', 'UI', 'Layout'],
  },
  {
    name: 'Track',
    canonicalModules: ['src/tracks/types.ts'],
    suggestedPrefixes: ['Arrangement', 'Freeze', 'Audio', 'MIDI'],
  },
  {
    name: 'PortType',
    canonicalModules: ['src/cards/card.ts', 'src/canon/port-types.ts'],
    suggestedPrefixes: ['Core', 'UI', 'Visual', 'Surface'],
  },
  {
    name: 'HostAction',
    canonicalModules: ['src/ai/theory/host-actions.ts'],
    suggestedPrefixes: ['Prolog', 'Advisor', 'Extension'],
  },
  {
    name: 'CardDefinition',
    canonicalModules: ['src/cards/card-visuals.ts'],
    suggestedPrefixes: ['Editor', 'Visual', 'UI'],
  },
  {
    name: 'CardState',
    canonicalModules: [],  // No canonical bare export
    suggestedPrefixes: ['Audio', 'UI', 'Module', 'Surface'],
  },
  {
    name: 'CardCategory',
    canonicalModules: ['src/cards/card.ts'],
    suggestedPrefixes: ['Core', 'Audio', 'UI'],
  },
];

// ============================================================================
// SCANNING
// ============================================================================

interface Violation {
  file: string;
  line: number;
  noun: string;
  exportType: 'interface' | 'type' | 'class' | 'const' | 'function' | 're-export';
  suggestion: string;
}

function normalizePathForComparison(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function isCanonicalModule(filePath: string, canonicalModules: string[]): boolean {
  const normalized = normalizePathForComparison(filePath);
  return canonicalModules.some(cm => normalized.endsWith(cm));
}

function scanFileForViolations(filePath: string, rootDir: string): Violation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];
  const relativePath = path.relative(rootDir, filePath);

  for (const noun of AMBIGUOUS_NOUNS) {
    // Skip if this is a canonical module for this noun
    if (isCanonicalModule(relativePath, noun.canonicalModules)) {
      continue;
    }

    // Check for bare exports
    const patterns = [
      { regex: new RegExp(`export\\s+interface\\s+${noun.name}\\b(?![A-Za-z])`, 'g'), type: 'interface' as const },
      { regex: new RegExp(`export\\s+type\\s+${noun.name}\\s*=`, 'g'), type: 'type' as const },
      { regex: new RegExp(`export\\s+class\\s+${noun.name}\\b(?![A-Za-z])`, 'g'), type: 'class' as const },
      { regex: new RegExp(`export\\s+const\\s+${noun.name}\\b(?![A-Za-z])`, 'g'), type: 'const' as const },
      { regex: new RegExp(`export\\s+function\\s+${noun.name}\\b(?![A-Za-z])`, 'g'), type: 'function' as const },
      { regex: new RegExp(`export\\s*\\{[^}]*\\b${noun.name}\\b(?!\\s+as)[^}]*\\}`, 'g'), type: 're-export' as const },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { regex, type } of patterns) {
        regex.lastIndex = 0;
        if (regex.test(line)) {
          violations.push({
            file: relativePath,
            line: i + 1,
            noun: noun.name,
            exportType: type,
            suggestion: `Consider: ${noun.suggestedPrefixes.map(p => p + noun.name).join(', ')}`,
          });
        }
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
        // Skip node_modules, dist, hidden directories
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
        violations.push(...scanFileForViolations(fullPath, rootDir));
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
  console.log('Code Terminology Lint');
  console.log('='.repeat(60));
  console.log();

  if (!fs.existsSync(srcDir)) {
    console.error(`ERROR: ${srcDir} not found`);
    process.exit(1);
  }

  const violations = scanDirectory(srcDir, rootDir);

  if (violations.length === 0) {
    console.log('✓ No ambiguous bare noun exports found!');
    process.exit(0);
  }

  // Group by noun
  const byNoun = new Map<string, Violation[]>();
  for (const v of violations) {
    const existing = byNoun.get(v.noun) || [];
    existing.push(v);
    byNoun.set(v.noun, existing);
  }

  console.log(`Found ${violations.length} ambiguous bare noun exports:`);
  console.log();

  for (const [noun, nounViolations] of byNoun) {
    console.log(`${noun} (${nounViolations.length} occurrences):`);
    console.log('-'.repeat(40));
    
    for (const v of nounViolations.slice(0, 10)) {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`    ${v.exportType} export`);
      console.log(`    ${v.suggestion}`);
    }
    
    if (nounViolations.length > 10) {
      console.log(`  ... and ${nounViolations.length - 10} more`);
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log(`Total: ${violations.length} violations`);
  console.log('These exports may cause confusion for LLM code generation.');
  console.log('Consider renaming or aliasing with appropriate prefixes.');
  // Don't fail - this is informational during migration
  process.exit(0);
}

main();
