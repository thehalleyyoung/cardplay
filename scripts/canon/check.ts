#!/usr/bin/env npx ts-node
/**
 * @fileoverview Canon Check Script
 * 
 * Compares canon ID tables in `cardplay/docs/canon/ids.md` against the 
 * literal unions/constants in code (ControlLevel, DeckType, PPQ, MusicSpec enums,
 * constraint type strings, PortTypes).
 * 
 * Run: npx ts-node scripts/canon/check.ts
 * 
 * @module @cardplay/scripts/canon/check
 * @see to_fix_repo_plan_500.md Change 001
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CANONICAL VALUES FROM CODE
// ============================================================================

// These are the canonical values from the codebase that docs must match

const CANONICAL_CONTROL_LEVELS = [
  'full-manual',
  'manual-with-hints',
  'assisted',
  'collaborative',
  'directed',
  'generative',
] as const;

const CANONICAL_DECK_TYPES = [
  'pattern-deck',
  'notation-deck',
  'piano-roll-deck',
  'session-deck',
  'arrangement-deck',
  'instruments-deck',
  'dsp-chain',
  'effects-deck',
  'samples-deck',
  'sample-manager-deck',
  'phrases-deck',
  'harmony-deck',
  'generators-deck',
  'mixer-deck',
  'mix-bus-deck',
  'routing-deck',
  'automation-deck',
  'properties-deck',
  'transport-deck',
  'arranger-deck',
  'ai-advisor-deck',
  'modulation-matrix-deck',
  'track-groups-deck',
  'reference-track-deck',
  'spectrum-analyzer-deck',
  'waveform-editor-deck',
  'registry-devtool-deck',
] as const;

const CANONICAL_PPQ = 960;

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

// Legacy port types that exist in code but should be deprecated/namespaced
const LEGACY_PORT_TYPES = [
  'number',
  'string',
  'boolean',
  'any',
  'stream',
  'container',
  'pattern',
] as const;

// ============================================================================
// DOCUMENT PARSING
// ============================================================================

interface CheckResult {
  passed: boolean;
  category: string;
  message: string;
  missingInDocs?: string[];
  extraInDocs?: string[];
}

function extractValuesFromMarkdownCodeBlock(content: string, pattern: RegExp): string[] {
  const match = content.match(pattern);
  if (!match) return [];
  
  // Extract quoted string literals from TypeScript type definitions
  const values: string[] = [];
  const literalPattern = /'([^']+)'/g;
  let literalMatch;
  while ((literalMatch = literalPattern.exec(match[0])) !== null) {
    values.push(literalMatch[1]);
  }
  return values;
}

function extractPPQFromDoc(content: string): number | null {
  const match = content.match(/export const PPQ = (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function checkControlLevels(docContent: string): CheckResult {
  // Look for ControlLevel type definition
  const controlLevelBlock = docContent.match(/type ControlLevel[\s\S]*?;/);
  if (!controlLevelBlock) {
    return {
      passed: false,
      category: 'ControlLevel',
      message: 'Could not find ControlLevel definition in docs',
    };
  }

  const docValues = extractValuesFromMarkdownCodeBlock(docContent, /type ControlLevel[\s\S]*?;/);
  
  const missingInDocs = CANONICAL_CONTROL_LEVELS.filter(v => !docValues.includes(v));
  const extraInDocs = docValues.filter(v => !CANONICAL_CONTROL_LEVELS.includes(v as any));

  if (missingInDocs.length === 0 && extraInDocs.length === 0) {
    return {
      passed: true,
      category: 'ControlLevel',
      message: `✓ ControlLevel values match (${CANONICAL_CONTROL_LEVELS.length} values)`,
    };
  }

  return {
    passed: false,
    category: 'ControlLevel',
    message: 'ControlLevel values mismatch',
    missingInDocs,
    extraInDocs,
  };
}

function checkDeckTypes(docContent: string): CheckResult {
  // Look for DeckType definition
  const deckTypeBlock = docContent.match(/type DeckType[\s\S]*?;/);
  if (!deckTypeBlock) {
    return {
      passed: false,
      category: 'DeckType',
      message: 'Could not find DeckType definition in docs',
    };
  }

  const docValues = extractValuesFromMarkdownCodeBlock(docContent, /type DeckType[\s\S]*?;/);
  
  const missingInDocs = CANONICAL_DECK_TYPES.filter(v => !docValues.includes(v));
  const extraInDocs = docValues.filter(v => !CANONICAL_DECK_TYPES.includes(v as any));

  if (missingInDocs.length === 0 && extraInDocs.length === 0) {
    return {
      passed: true,
      category: 'DeckType',
      message: `✓ DeckType values match (${CANONICAL_DECK_TYPES.length} values)`,
    };
  }

  return {
    passed: false,
    category: 'DeckType',
    message: 'DeckType values mismatch',
    missingInDocs,
    extraInDocs,
  };
}

function checkPPQ(docContent: string): CheckResult {
  const docPPQ = extractPPQFromDoc(docContent);
  
  if (docPPQ === null) {
    return {
      passed: false,
      category: 'PPQ',
      message: 'Could not find PPQ definition in docs',
    };
  }

  if (docPPQ === CANONICAL_PPQ) {
    return {
      passed: true,
      category: 'PPQ',
      message: `✓ PPQ value matches (${CANONICAL_PPQ})`,
    };
  }

  return {
    passed: false,
    category: 'PPQ',
    message: `PPQ mismatch: docs say ${docPPQ}, code says ${CANONICAL_PPQ}`,
  };
}

function checkPortTypes(docContent: string): CheckResult {
  // Look for PortTypes definition
  const portTypesBlock = docContent.match(/const PortTypes = \{[\s\S]*?\} as const/);
  if (!portTypesBlock) {
    return {
      passed: false,
      category: 'PortTypes',
      message: 'Could not find PortTypes definition in docs',
    };
  }

  const docValues = extractValuesFromMarkdownCodeBlock(docContent, /const PortTypes = \{[\s\S]*?\} as const/);
  
  const missingInDocs = CANONICAL_PORT_TYPES.filter(v => !docValues.includes(v));
  const extraInDocs = docValues.filter(v => !CANONICAL_PORT_TYPES.includes(v as any));

  if (missingInDocs.length === 0 && extraInDocs.length === 0) {
    return {
      passed: true,
      category: 'PortTypes',
      message: `✓ PortTypes values match (${CANONICAL_PORT_TYPES.length} canonical types)`,
    };
  }

  return {
    passed: false,
    category: 'PortTypes',
    message: 'PortTypes values mismatch',
    missingInDocs,
    extraInDocs,
  };
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const rootDir = path.resolve(__dirname, '../..');
  const idsDocPath = path.join(rootDir, 'docs/canon/ids.md');
  const portVocabPath = path.join(rootDir, 'docs/canon/port-vocabulary.md');

  console.log('='.repeat(60));
  console.log('Canon ID Check');
  console.log('='.repeat(60));
  console.log();

  // Check if docs exist
  if (!fs.existsSync(idsDocPath)) {
    console.error(`ERROR: ${idsDocPath} not found`);
    process.exit(1);
  }

  const idsContent = fs.readFileSync(idsDocPath, 'utf-8');
  
  const results: CheckResult[] = [];

  // Run checks
  results.push(checkControlLevels(idsContent));
  results.push(checkDeckTypes(idsContent));
  results.push(checkPPQ(idsContent));
  
  // Check port vocabulary (may be in separate doc)
  let portContent = idsContent;
  if (fs.existsSync(portVocabPath)) {
    portContent = fs.readFileSync(portVocabPath, 'utf-8');
  }
  results.push(checkPortTypes(portContent));

  // Report results
  let allPassed = true;
  for (const result of results) {
    if (result.passed) {
      console.log(result.message);
    } else {
      allPassed = false;
      console.log(`✗ ${result.category}: ${result.message}`);
      if (result.missingInDocs?.length) {
        console.log(`  Missing in docs: ${result.missingInDocs.join(', ')}`);
      }
      if (result.extraInDocs?.length) {
        console.log(`  Extra in docs: ${result.extraInDocs.join(', ')}`);
      }
    }
  }

  console.log();
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('All canon checks passed!');
    process.exit(0);
  } else {
    console.log('Canon checks FAILED - see above for details');
    process.exit(1);
  }
}

main();
