#!/usr/bin/env npx ts-node
/**
 * @fileoverview Port Vocabulary Check Script
 * 
 * Ensures `cardplay/docs/canon/port-vocabulary.md` matches `PortTypes` 
 * and `cardplay/src/boards/gating/validate-connection.ts`.
 * 
 * Run: npx ts-node scripts/canon/check-port-vocabulary.ts
 * 
 * @module @cardplay/scripts/canon/check-port-vocabulary
 * @see to_fix_repo_plan_500.md Change 002
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CANONICAL PORT VOCABULARY
// ============================================================================

// Canonical port types from code
const CANONICAL_PORT_TYPES = [
  'audio',
  'midi',
  'notes',
  'control',
  'trigger',
  'gate',
  'clock',
  'transport',
] as const;

// Canonical compatibility pairs (source → target)
// These should match validate-connection.ts
const CANONICAL_COMPATIBILITY_PAIRS: [string, string][] = [
  ['audio', 'audio'],
  ['midi', 'midi'],
  ['notes', 'midi'],  // notes can connect to midi (with adapter)
  ['notes', 'notes'],
  ['control', 'control'],
  ['trigger', 'trigger'],
  ['trigger', 'gate'],  // trigger is compatible with gate
  ['gate', 'gate'],
  ['gate', 'trigger'],  // gate is compatible with trigger
  ['clock', 'clock'],
  ['clock', 'transport'],  // clock is compatible with transport
  ['transport', 'transport'],
  ['transport', 'clock'],  // transport is compatible with clock
];

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

interface CheckResult {
  passed: boolean;
  category: string;
  message: string;
  details?: string[];
}

function extractPortTypesFromDoc(content: string): string[] {
  const portTypesBlock = content.match(/const PortTypes = \{[\s\S]*?\} as const/);
  if (!portTypesBlock) return [];
  
  const values: string[] = [];
  const literalPattern = /'([^']+)'/g;
  let match;
  while ((match = literalPattern.exec(portTypesBlock[0])) !== null) {
    values.push(match[1]);
  }
  return values;
}

function extractCompatibilityFromDoc(content: string): [string, string][] {
  const pairs: [string, string][] = [];
  
  // Look for compatibility section
  const compatSection = content.match(/## Port Compatibility[\s\S]*?(?=##|$)/);
  if (!compatSection) return pairs;

  // Extract pairs like `audio` ↔ `audio` or `notes` → `midi`
  const bidirectionalPattern = /`(\w+)`\s*↔\s*`(\w+)`/g;
  const unidirectionalPattern = /`(\w+)`\s*→\s*`(\w+)`/g;
  const compatiblePattern = /`(\w+)`\s*↔\s*`(\w+)`\s*\(compatible\)/g;

  let match;
  
  // Bidirectional pairs
  while ((match = bidirectionalPattern.exec(compatSection[0])) !== null) {
    pairs.push([match[1], match[2]]);
    if (match[1] !== match[2]) {
      pairs.push([match[2], match[1]]);
    }
  }
  
  // Unidirectional pairs
  while ((match = unidirectionalPattern.exec(compatSection[0])) !== null) {
    pairs.push([match[1], match[2]]);
  }

  return pairs;
}

function checkPortTypes(docContent: string): CheckResult {
  const docTypes = extractPortTypesFromDoc(docContent);
  
  if (docTypes.length === 0) {
    return {
      passed: false,
      category: 'Port Types',
      message: 'Could not find PortTypes definition in doc',
    };
  }

  const missingInDoc = CANONICAL_PORT_TYPES.filter(t => !docTypes.includes(t));
  const extraInDoc = docTypes.filter(t => !CANONICAL_PORT_TYPES.includes(t as any));

  if (missingInDoc.length === 0 && extraInDoc.length === 0) {
    return {
      passed: true,
      category: 'Port Types',
      message: `✓ Port types match (${CANONICAL_PORT_TYPES.length} types)`,
    };
  }

  const details: string[] = [];
  if (missingInDoc.length) {
    details.push(`Missing in doc: ${missingInDoc.join(', ')}`);
  }
  if (extraInDoc.length) {
    details.push(`Extra in doc: ${extraInDoc.join(', ')}`);
  }

  return {
    passed: false,
    category: 'Port Types',
    message: 'Port types mismatch',
    details,
  };
}

function checkCompatibility(docContent: string): CheckResult {
  const docPairs = extractCompatibilityFromDoc(docContent);
  
  if (docPairs.length === 0) {
    return {
      passed: false,
      category: 'Compatibility',
      message: 'Could not find compatibility pairs in doc',
    };
  }

  const pairKey = (p: [string, string]) => `${p[0]}→${p[1]}`;
  const docPairSet = new Set(docPairs.map(pairKey));
  const canonPairSet = new Set(CANONICAL_COMPATIBILITY_PAIRS.map(pairKey));

  const missingInDoc = CANONICAL_COMPATIBILITY_PAIRS.filter(p => !docPairSet.has(pairKey(p)));
  const extraInDoc = docPairs.filter(p => !canonPairSet.has(pairKey(p)));

  if (missingInDoc.length === 0 && extraInDoc.length === 0) {
    return {
      passed: true,
      category: 'Compatibility',
      message: `✓ Compatibility pairs match (${CANONICAL_COMPATIBILITY_PAIRS.length} pairs)`,
    };
  }

  const details: string[] = [];
  if (missingInDoc.length) {
    details.push(`Missing in doc: ${missingInDoc.map(pairKey).join(', ')}`);
  }
  if (extraInDoc.length) {
    details.push(`Extra in doc: ${extraInDoc.map(pairKey).join(', ')}`);
  }

  return {
    passed: false,
    category: 'Compatibility',
    message: 'Compatibility pairs mismatch',
    details,
  };
}

function checkDirectionSeparation(docContent: string): CheckResult {
  // Check that doc mentions direction is separate from type
  const hasDirectionSection = docContent.includes('## Direction') || 
                               docContent.includes('Port direction is separate');
  
  // Check for anti-patterns (but allow mentions in "avoid" context)
  // Look for uses that aren't in "avoid" or "don't" context
  const lines = docContent.split('\n');
  const badUsages = lines.filter(line => {
    const hasDirectionType = /`(audio_in|audio_out|midi_in|midi_out)`/.test(line);
    const isAvoidContext = /avoid|don't|deprecated/i.test(line);
    return hasDirectionType && !isAvoidContext;
  });

  if (hasDirectionSection && badUsages.length === 0) {
    return {
      passed: true,
      category: 'Direction Separation',
      message: '✓ Doc correctly separates direction from type',
    };
  }

  const details: string[] = [];
  if (!hasDirectionSection) {
    details.push('Missing direction separation guidance');
  }
  if (badUsages.length > 0) {
    details.push(`Found direction-encoded port types outside "avoid" context:\n  ${badUsages.join('\n  ')}`);
  }

  return {
    passed: badUsages.length === 0,
    category: 'Direction Separation',
    message: badUsages.length > 0 ? 'Doc contains direction-encoded port types' : 'Missing direction guidance',
    details,
  };
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const rootDir = path.resolve(__dirname, '../..');
  const portVocabPath = path.join(rootDir, 'docs/canon/port-vocabulary.md');

  console.log('='.repeat(60));
  console.log('Port Vocabulary Check');
  console.log('='.repeat(60));
  console.log();

  if (!fs.existsSync(portVocabPath)) {
    console.error(`ERROR: ${portVocabPath} not found`);
    process.exit(1);
  }

  const content = fs.readFileSync(portVocabPath, 'utf-8');
  
  const results: CheckResult[] = [
    checkPortTypes(content),
    checkCompatibility(content),
    checkDirectionSeparation(content),
  ];

  let allPassed = true;
  for (const result of results) {
    console.log(result.passed ? result.message : `✗ ${result.category}: ${result.message}`);
    if (result.details) {
      for (const detail of result.details) {
        console.log(`  ${detail}`);
      }
    }
    if (!result.passed) allPassed = false;
  }

  console.log();
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('All port vocabulary checks passed!');
    process.exit(0);
  } else {
    console.log('Port vocabulary checks FAILED');
    process.exit(1);
  }
}

main();
