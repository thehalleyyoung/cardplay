#!/usr/bin/env npx ts-node
/**
 * @fileoverview Find Legacy IDs Script
 * 
 * Reports occurrences of legacy IDs (e.g., `pattern-editor`, `notation-score`, 
 * `piano-roll`) in code and classifies them as DeckId vs DeckType vs featureId.
 * 
 * Run: npx ts-node scripts/canon/find-legacy-ids.ts
 * 
 * @module @cardplay/scripts/canon/find-legacy-ids
 * @see to_fix_repo_plan_500.md Change 011
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// LEGACY ID MAPPINGS
// ============================================================================

interface LegacyId {
  legacy: string;
  canonical: string;
  type: 'DeckType' | 'DeckId' | 'featureId' | 'ambiguous';
}

const LEGACY_IDS: LegacyId[] = [
  // DeckType legacy aliases
  { legacy: 'pattern-editor', canonical: 'pattern-deck', type: 'DeckType' },
  { legacy: 'notation-score', canonical: 'notation-deck', type: 'DeckType' },
  { legacy: 'piano-roll', canonical: 'piano-roll-deck', type: 'DeckType' },
  { legacy: 'session', canonical: 'session-deck', type: 'DeckType' },
  { legacy: 'arrangement', canonical: 'arrangement-deck', type: 'DeckType' },
  { legacy: 'mixer', canonical: 'mixer-deck', type: 'DeckType' },
  { legacy: 'timeline', canonical: 'arrangement-deck', type: 'DeckType' },
  { legacy: 'harmony', canonical: 'harmony-deck', type: 'DeckType' },
  { legacy: 'generators', canonical: 'generators-deck', type: 'DeckType' },
  { legacy: 'transport', canonical: 'transport-deck', type: 'DeckType' },
  { legacy: 'properties', canonical: 'properties-deck', type: 'DeckType' },
  { legacy: 'routing', canonical: 'routing-deck', type: 'DeckType' },
  { legacy: 'automation', canonical: 'automation-deck', type: 'DeckType' },
  { legacy: 'effects', canonical: 'effects-deck', type: 'DeckType' },
  { legacy: 'samples', canonical: 'samples-deck', type: 'DeckType' },
  { legacy: 'phrases', canonical: 'phrases-deck', type: 'DeckType' },
  { legacy: 'instruments', canonical: 'instruments-deck', type: 'DeckType' },
];

// ============================================================================
// OCCURRENCE TRACKING
// ============================================================================

interface Occurrence {
  file: string;
  line: number;
  column: number;
  legacy: string;
  canonical: string;
  type: string;
  context: string;
  likelyUsage: 'DeckType' | 'DeckId' | 'featureId' | 'UI-label' | 'test' | 'unknown';
}

function classifyUsage(context: string, filePath: string): Occurrence['likelyUsage'] {
  const lowerContext = context.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  
  // Test files
  if (lowerPath.includes('.test.') || lowerPath.includes('__tests__')) {
    return 'test';
  }
  
  // UI labels, titles, display names
  if (lowerContext.includes('title') || lowerContext.includes('label') || 
      lowerContext.includes('name') || lowerContext.includes('display')) {
    return 'UI-label';
  }
  
  // Type annotations
  if (lowerContext.includes('decktype') || lowerContext.includes(': deck')) {
    return 'DeckType';
  }
  
  // Instance IDs
  if (lowerContext.includes('deckid') || lowerContext.includes('.id') ||
      lowerContext.includes('id:') || lowerContext.includes('id =')) {
    return 'DeckId';
  }
  
  // Feature checks
  if (lowerContext.includes('feature') || lowerContext.includes('enabled') ||
      lowerContext.includes('available')) {
    return 'featureId';
  }
  
  return 'unknown';
}

function scanFile(filePath: string, rootDir: string): Occurrence[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const occurrences: Occurrence[] = [];
  const relativePath = path.relative(rootDir, filePath);

  for (const legacyId of LEGACY_IDS) {
    // Match as string literal or identifier
    const patterns = [
      new RegExp(`['"\`]${legacyId.legacy}['"\`]`, 'g'),  // String literal
      new RegExp(`\\b${legacyId.legacy}\\b`, 'g'),         // Identifier/word
    ];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;
        
        while ((match = pattern.exec(line)) !== null) {
          // Skip if it's part of the canonical name
          if (line.includes(legacyId.canonical)) {
            continue;
          }
          
          // Skip comments that are explanatory
          if (line.trim().startsWith('//') && line.includes('legacy')) {
            continue;
          }
          
          const contextStart = Math.max(0, match.index - 30);
          const contextEnd = Math.min(line.length, match.index + legacyId.legacy.length + 30);
          const context = line.substring(contextStart, contextEnd);
          
          occurrences.push({
            file: relativePath,
            line: lineNum + 1,
            column: match.index + 1,
            legacy: legacyId.legacy,
            canonical: legacyId.canonical,
            type: legacyId.type,
            context: context.trim(),
            likelyUsage: classifyUsage(line, relativePath),
          });
        }
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
  console.log('Find Legacy IDs');
  console.log('='.repeat(60));
  console.log();

  if (!fs.existsSync(srcDir)) {
    console.error(`ERROR: ${srcDir} not found`);
    process.exit(1);
  }

  const occurrences = scanDirectory(srcDir, rootDir);

  if (occurrences.length === 0) {
    console.log('✓ No legacy IDs found!');
    process.exit(0);
  }

  // Group by legacy ID
  const byLegacy = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const existing = byLegacy.get(o.legacy) || [];
    existing.push(o);
    byLegacy.set(o.legacy, existing);
  }

  // Summary by usage type
  const byUsage = new Map<string, number>();
  for (const o of occurrences) {
    byUsage.set(o.likelyUsage, (byUsage.get(o.likelyUsage) || 0) + 1);
  }

  console.log(`Found ${occurrences.length} legacy ID occurrences:`);
  console.log();

  console.log('By usage type:');
  for (const [usage, count] of byUsage) {
    console.log(`  ${usage}: ${count}`);
  }
  console.log();

  console.log('By legacy ID:');
  console.log('-'.repeat(60));
  
  for (const [legacy, occ] of byLegacy) {
    const canonical = occ[0].canonical;
    console.log(`\n"${legacy}" → "${canonical}" (${occ.length} occurrences)`);
    
    for (const o of occ.slice(0, 5)) {
      console.log(`  ${o.file}:${o.line} [${o.likelyUsage}]`);
      console.log(`    ...${o.context}...`);
    }
    
    if (occ.length > 5) {
      console.log(`  ... and ${occ.length - 5} more`);
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Migration guidance:');
  console.log('  DeckType usage: Update to canonical DeckType values');
  console.log('  DeckId usage: Consider using branded DeckId type');
  console.log('  featureId usage: Migrate to feature: namespace');
  console.log('  UI-label usage: May keep as display text, consider i18n');
  console.log('  test usage: Update to canonical values in test fixtures');
  
  process.exit(0);
}

main();
