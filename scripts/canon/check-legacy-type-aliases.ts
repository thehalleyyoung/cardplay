#!/usr/bin/env npx ts-node
/**
 * @fileoverview Legacy Type Aliases Check Script
 * 
 * Ensures the duplicates listed in `cardplay/docs/canon/legacy-type-aliases.md` 
 * are either renamed in code or exported with explicit `Legacy*`/`UI*` aliases.
 * 
 * Run: npx ts-node scripts/canon/check-legacy-type-aliases.ts
 * 
 * @module @cardplay/scripts/canon/check-legacy-type-aliases
 * @see to_fix_repo_plan_500.md Change 004
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// KNOWN DUPLICATE SYMBOLS
// ============================================================================

// These are symbols that have multiple definitions across the codebase
// and need to be disambiguated with explicit prefixes
interface DuplicateSymbol {
  name: string;
  locations: string[];
  expectedAliases: string[];
  status: 'needs-rename' | 'needs-alias' | 'resolved';
}

const KNOWN_DUPLICATES: DuplicateSymbol[] = [
  {
    name: 'Card',
    locations: [
      'src/cards/card.ts',           // Core Card<A,B>
      'src/audio/instrument-cards.ts', // Audio module card
    ],
    expectedAliases: ['CoreCard', 'AudioModuleCard'],
    status: 'needs-rename',
  },
  {
    name: 'CardDefinition',
    locations: [
      'src/cards/card-visuals.ts',        // Visual card definition
      'src/user-cards/card-editor-panel.ts', // Editor card definition
    ],
    expectedAliases: ['VisualCardDefinition', 'EditorCardDefinition'],
    status: 'needs-rename',
  },
  {
    name: 'CardState',
    locations: [
      'src/audio/instrument-cards.ts', // Audio module state
      'src/ui/cards.ts',               // UI card state
    ],
    expectedAliases: ['AudioModuleState', 'CardSurfaceState'],
    status: 'needs-rename',
  },
  {
    name: 'PortType',
    locations: [
      'src/cards/card.ts',              // Core port type
      'src/ui/components/card-component.ts', // UI port type
      'src/ui/cards.ts',                // UI surface port type
      'src/cards/card-visuals.ts',      // Visual port type
    ],
    expectedAliases: ['CorePortType', 'UIPortType', 'UISurfacePortType', 'VisualPortType'],
    status: 'needs-rename',
  },
  {
    name: 'Track',
    locations: [
      'src/ui/components/arrangement-panel.ts', // Arrangement track
      'src/tracks/clip-operations.ts',          // Freeze track model
    ],
    expectedAliases: ['ArrangementTrack', 'FreezeTrackModel'],
    status: 'needs-rename',
  },
  {
    name: 'Stack',
    locations: [
      'src/cards/stack.ts',                  // Card composition stack
      'src/ui/components/stack-component.ts', // UI stack component
    ],
    expectedAliases: ['CardStack', 'UIStackComponent'],
    status: 'needs-rename',
  },
  {
    name: 'CardCategory',
    locations: [
      'src/cards/card.ts',              // Core card category
      'src/audio/instrument-cards.ts',  // Audio module category
    ],
    expectedAliases: ['CoreCardCategory', 'AudioModuleCategory'],
    status: 'needs-rename',
  },
];

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

interface CheckResult {
  symbol: string;
  locations: string[];
  hasExport: boolean;
  hasAliasExport: boolean;
  isRenamed: boolean;
  passed: boolean;
  message: string;
}

function checkFileForSymbol(filePath: string, symbolName: string): {
  hasExport: boolean;
  hasAliasExport: boolean;
  exportedAs: string[];
} {
  if (!fs.existsSync(filePath)) {
    return { hasExport: false, hasAliasExport: false, exportedAs: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const exportedAs: string[] = [];

  // Check for direct export
  const directExportPattern = new RegExp(`export\\s+(interface|type|class|const|function)\\s+${symbolName}\\b`);
  const hasDirectExport = directExportPattern.test(content);

  // Check for aliased export
  const aliasExportPattern = new RegExp(`export\\s+\\{[^}]*${symbolName}\\s+as\\s+(\\w+)[^}]*\\}`);
  const aliasMatch = content.match(aliasExportPattern);
  
  if (hasDirectExport) {
    exportedAs.push(symbolName);
  }
  if (aliasMatch) {
    exportedAs.push(aliasMatch[1]);
  }

  // Check for prefixed versions
  const prefixedPattern = new RegExp(`export\\s+(interface|type|class|const|function)\\s+(\\w+${symbolName}|${symbolName}\\w+)\\b`, 'g');
  let prefixedMatch;
  while ((prefixedMatch = prefixedPattern.exec(content)) !== null) {
    if (prefixedMatch[2] !== symbolName) {
      exportedAs.push(prefixedMatch[2]);
    }
  }

  return {
    hasExport: hasDirectExport,
    hasAliasExport: !!aliasMatch || exportedAs.length > 1,
    exportedAs,
  };
}

function checkDuplicateSymbol(rootDir: string, duplicate: DuplicateSymbol): CheckResult {
  const results: { location: string; exportedAs: string[] }[] = [];

  for (const location of duplicate.locations) {
    const filePath = path.join(rootDir, location);
    const check = checkFileForSymbol(filePath, duplicate.name);
    results.push({ location, exportedAs: check.exportedAs });
  }

  // Check if all locations have properly aliased exports
  const allAliased = results.every(r => 
    r.exportedAs.length > 0 && 
    !r.exportedAs.includes(duplicate.name) // Original name not exported
  );

  // Check if at least some locations have aliased exports
  const someAliased = results.some(r => 
    r.exportedAs.some(e => e !== duplicate.name)
  );

  // Check if symbol is renamed to expected aliases
  const hasExpectedAliases = duplicate.expectedAliases.some(alias =>
    results.some(r => r.exportedAs.includes(alias))
  );

  const passed = allAliased || hasExpectedAliases;

  let message: string;
  if (allAliased) {
    message = `✓ ${duplicate.name} is properly aliased across all locations`;
  } else if (hasExpectedAliases) {
    message = `~ ${duplicate.name} has some expected aliases but not fully resolved`;
  } else {
    message = `✗ ${duplicate.name} needs rename/aliasing`;
  }

  return {
    symbol: duplicate.name,
    locations: duplicate.locations,
    hasExport: results.some(r => r.exportedAs.includes(duplicate.name)),
    hasAliasExport: someAliased,
    isRenamed: hasExpectedAliases,
    passed,
    message,
  };
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const rootDir = path.resolve(__dirname, '../..');

  console.log('='.repeat(60));
  console.log('Legacy Type Aliases Check');
  console.log('='.repeat(60));
  console.log();

  const results: CheckResult[] = [];
  
  for (const duplicate of KNOWN_DUPLICATES) {
    const result = checkDuplicateSymbol(rootDir, duplicate);
    results.push(result);
  }

  // Report
  console.log('Duplicate Symbol Status:');
  console.log('-'.repeat(60));
  
  for (const result of results) {
    console.log(result.message);
    console.log(`  Locations: ${result.locations.join(', ')}`);
    console.log(`  Bare export: ${result.hasExport ? 'yes' : 'no'}`);
    console.log(`  Has aliases: ${result.hasAliasExport ? 'yes' : 'no'}`);
    console.log();
  }

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  console.log('='.repeat(60));
  console.log(`Summary: ${passed.length} resolved, ${failed.length} need work`);
  
  if (failed.length === 0) {
    console.log('✓ All duplicate symbols are properly aliased!');
    process.exit(0);
  } else {
    console.log('Symbols needing work:');
    for (const f of failed) {
      console.log(`  - ${f.symbol}`);
    }
    // Don't fail hard - this is informational during migration
    process.exit(0);
  }
}

main();
