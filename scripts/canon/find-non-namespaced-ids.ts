#!/usr/bin/env npx ts-node
/**
 * @fileoverview Find Non-Namespaced IDs Script
 * 
 * Flags extension-facing IDs missing `<namespace>:` prefix for:
 * - cards, constraints, packs, templates, port types, actions
 * 
 * Run: npx ts-node scripts/canon/find-non-namespaced-ids.ts
 * 
 * @module @cardplay/scripts/canon/find-non-namespaced-ids
 * @see to_fix_repo_plan_500.md Change 015
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// BUILTIN IDS (don't need namespacing)
// ============================================================================

// These are blessed builtin IDs that don't require namespacing
const BUILTIN_CARD_IDS = new Set([
  'key-signature', 'mode-selection', 'scale-suggestion', 'chord-voicing',
  'harmonic-function', 'cadence-pattern', 'voice-leading', 'phrase-generator',
  'rhythm-pattern', 'melody-generator', 'bass-line', 'accompaniment',
  // Add more as needed
]);

const BUILTIN_CONSTRAINT_TYPES = new Set([
  'key', 'mode', 'time_signature', 'tempo', 'chord', 'progression',
  'voice_range', 'dynamics', 'instrumentation', 'structure', 'style',
  'genre', 'culture', 'rhythm', 'melody', 'harmony', 'form',
  // Add more as needed
]);

const BUILTIN_PORT_TYPES = new Set([
  'audio', 'midi', 'notes', 'control', 'trigger', 'gate', 'clock', 'transport',
]);

const BUILTIN_DECK_TYPES = new Set([
  'pattern-deck', 'notation-deck', 'piano-roll-deck', 'session-deck',
  'arrangement-deck', 'instruments-deck', 'dsp-chain', 'effects-deck',
  'samples-deck', 'sample-manager-deck', 'phrases-deck', 'harmony-deck',
  'generators-deck', 'mixer-deck', 'mix-bus-deck', 'routing-deck',
  'automation-deck', 'properties-deck', 'transport-deck', 'arranger-deck',
  'ai-advisor-deck', 'modulation-matrix-deck', 'track-groups-deck',
  'reference-track-deck', 'spectrum-analyzer-deck', 'waveform-editor-deck',
]);

// ============================================================================
// DETECTION
// ============================================================================

interface NonNamespacedId {
  file: string;
  line: number;
  idType: 'card' | 'constraint' | 'port' | 'template' | 'action' | 'pack';
  id: string;
  context: string;
  isBuiltin: boolean;
}

// Check if an ID is namespaced (contains colon separator)
function isNamespaced(id: string): boolean {
  return id.includes(':');
}

// Check if ID is a known builtin
function isBuiltin(id: string, idType: string): boolean {
  switch (idType) {
    case 'card': return BUILTIN_CARD_IDS.has(id);
    case 'constraint': return BUILTIN_CONSTRAINT_TYPES.has(id);
    case 'port': return BUILTIN_PORT_TYPES.has(id);
    default: return false;
  }
}

function scanFile(filePath: string, rootDir: string): NonNamespacedId[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results: NonNamespacedId[] = [];
  const relativePath = path.relative(rootDir, filePath);

  // Skip test files and docs
  if (relativePath.includes('.test.') || relativePath.includes('__tests__')) {
    return results;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Card ID patterns
    const cardIdPatterns = [
      /cardId[=:]\s*['"`]([^'"`]+)['"`]/gi,
      /id:\s*['"`]([^'"`]+)['"`].*card/gi,
      /registerCard\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ];

    for (const pattern of cardIdPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const id = match[1];
        if (!isNamespaced(id) && !isBuiltin(id, 'card')) {
          results.push({
            file: relativePath,
            line: i + 1,
            idType: 'card',
            id,
            context: line.trim().substring(0, 80),
            isBuiltin: false,
          });
        }
      }
    }

    // Constraint type patterns
    const constraintPatterns = [
      /type:\s*['"`]([^'"`]+)['"`].*constraint/gi,
      /constraintType[=:]\s*['"`]([^'"`]+)['"`]/gi,
    ];

    for (const pattern of constraintPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const id = match[1];
        if (!isNamespaced(id) && !isBuiltin(id, 'constraint')) {
          results.push({
            file: relativePath,
            line: i + 1,
            idType: 'constraint',
            id,
            context: line.trim().substring(0, 80),
            isBuiltin: false,
          });
        }
      }
    }

    // Port type registration patterns  
    const portPatterns = [
      /registerPortType\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ];

    for (const pattern of portPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const id = match[1];
        if (!isNamespaced(id) && !isBuiltin(id, 'port')) {
          results.push({
            file: relativePath,
            line: i + 1,
            idType: 'port',
            id,
            context: line.trim().substring(0, 80),
            isBuiltin: false,
          });
        }
      }
    }

    // Pack/template patterns
    const packPatterns = [
      /packId[=:]\s*['"`]([^'"`]+)['"`]/gi,
      /templateId[=:]\s*['"`]([^'"`]+)['"`]/gi,
    ];

    for (const pattern of packPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const id = match[1];
        if (!isNamespaced(id)) {
          const idType = line.includes('pack') ? 'pack' : 'template';
          results.push({
            file: relativePath,
            line: i + 1,
            idType: idType as any,
            id,
            context: line.trim().substring(0, 80),
            isBuiltin: false,
          });
        }
      }
    }
  }

  return results;
}

function scanDirectory(dir: string, rootDir: string): NonNamespacedId[] {
  const results: NonNamespacedId[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        results.push(...scanFile(fullPath, rootDir));
      }
    }
  }

  walk(dir);
  return results;
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const rootDir = path.resolve(__dirname, '../..');
  const srcDir = path.join(rootDir, 'src');

  console.log('='.repeat(60));
  console.log('Find Non-Namespaced IDs');
  console.log('='.repeat(60));
  console.log();
  console.log('Extension-facing IDs should use format: <namespace>:<name>');
  console.log('Builtin IDs are exempt from this requirement.');
  console.log();

  if (!fs.existsSync(srcDir)) {
    console.error(`ERROR: ${srcDir} not found`);
    process.exit(1);
  }

  const results = scanDirectory(srcDir, rootDir);

  if (results.length === 0) {
    console.log('✓ No non-namespaced extension IDs found!');
    process.exit(0);
  }

  // Group by type
  const byType = new Map<string, NonNamespacedId[]>();
  for (const r of results) {
    const existing = byType.get(r.idType) || [];
    existing.push(r);
    byType.set(r.idType, existing);
  }

  console.log(`Found ${results.length} non-namespaced IDs:`);
  console.log();

  for (const [idType, items] of byType) {
    console.log(`${idType} IDs (${items.length}):`);
    console.log('-'.repeat(40));
    
    for (const item of items.slice(0, 10)) {
      console.log(`  ${item.file}:${item.line}`);
      console.log(`    ID: "${item.id}"`);
      console.log(`    Suggest: "mypack:${item.id}"`);
    }
    
    if (items.length > 10) {
      console.log(`  ... and ${items.length - 10} more`);
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log('To fix: Add namespace prefix to extension IDs');
  console.log('  Example: "my-card" → "mypack:my-card"');
  process.exit(0);
}

main();
