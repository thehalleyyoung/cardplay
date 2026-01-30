#!/usr/bin/env tsx
/**
 * Validate Card IDs Script
 * 
 * This script validates that all builtin card IDs conform to the canon
 * namespacing rules:
 * - Builtin cards should use simple, stable IDs from BUILTIN_CARD_IDS
 * - Extension cards must use namespaced IDs (namespace:name)
 * - No ambiguous middle-ground IDs
 * 
 * Usage: npm run validate:card-ids
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  validateCardId,
  isBuiltinCardId,
  isNamespacedCardId,
  BUILTIN_CARD_IDS,
  type CardIdValidationResult
} from '../src/canon/card-id.js';

interface CardIdUsage {
  id: string;
  file: string;
  line: number;
  context: string;
  validation: CardIdValidationResult;
}

/**
 * Extract card IDs from TypeScript files
 */
function extractCardIds(filePath: string): CardIdUsage[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const cardIds: CardIdUsage[] = [];
  
  // Match patterns like: id: 'cardname',
  //                      id: "cardname",
  //                      'id': 'cardname',
  const idPatterns = [
    /\bid:\s*['"]([^'"]+)['"]/g,
    /['"]id['"]\s*:\s*['"]([^'"]+)['"]/g,
  ];
  
  lines.forEach((line, lineIndex) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    for (const pattern of idPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const id = match[1];
        
        // Filter out obvious non-card IDs
        if (id.length < 2 || id.length > 100) continue;
        if (/^[a-z]$/.test(id)) continue; // single letter
        if (/^\d+$/.test(id)) continue; // just numbers
        if (id.startsWith('test') && filePath.includes('.test.')) continue;
        
        // Heuristic: likely a card ID if it appears in certain contexts
        const contextLower = line.toLowerCase();
        const isLikelyCardId = 
          contextLower.includes('card') ||
          contextLower.includes('meta') ||
          contextLower.includes('signature') ||
          filePath.includes('/cards/');
        
        if (isLikelyCardId) {
          const validation = validateCardId(id);
          cardIds.push({
            id,
            file: path.relative(process.cwd(), filePath),
            line: lineIndex + 1,
            context: line.trim().substring(0, 80),
            validation,
          });
        }
      }
    }
  });
  
  return cardIds;
}

/**
 * Recursively find TypeScript files
 */
function findTsFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'testing') {
        findTsFiles(fullPath, files);
      }
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Main validation logic
 */
async function main() {
  console.log('🔍 Validating Card IDs...\n');
  
  // Find all TypeScript files in src/cards
  const cardsDir = path.join(process.cwd(), 'src', 'cards');
  const files = findTsFiles(cardsDir);
  
  console.log(`📁 Scanning ${files.length} files...\n`);
  
  const allUsages: CardIdUsage[] = [];
  for (const file of files) {
    const usages = extractCardIds(file);
    allUsages.push(...usages);
  }
  
  // Deduplicate by ID
  const uniqueIds = new Map<string, CardIdUsage>();
  for (const usage of allUsages) {
    if (!uniqueIds.has(usage.id)) {
      uniqueIds.set(usage.id, usage);
    }
  }
  
  console.log(`📊 Found ${uniqueIds.size} unique card IDs\n`);
  console.log(`✅ ${BUILTIN_CARD_IDS.length} builtin IDs defined in canon\n`);
  
  // Categorize IDs
  const builtinIds: CardIdUsage[] = [];
  const namespacedIds: CardIdUsage[] = [];
  const ambiguousIds: CardIdUsage[] = [];
  const invalidIds: CardIdUsage[] = [];
  
  for (const usage of uniqueIds.values()) {
    if (!usage.validation.valid) {
      invalidIds.push(usage);
    } else if (usage.validation.isBuiltin) {
      builtinIds.push(usage);
    } else if (usage.validation.isNamespaced) {
      namespacedIds.push(usage);
    } else {
      ambiguousIds.push(usage);
    }
  }
  
  // Report findings
  console.log('═'.repeat(60));
  console.log('📋 VALIDATION RESULTS');
  console.log('═'.repeat(60));
  console.log();
  
  if (builtinIds.length > 0) {
    console.log(`✅ Builtin Card IDs (${builtinIds.length}):`);
    builtinIds.slice(0, 20).forEach(usage => {
      console.log(`   ${usage.id.padEnd(30)} ${usage.file}:${usage.line}`);
    });
    if (builtinIds.length > 20) {
      console.log(`   ... and ${builtinIds.length - 20} more`);
    }
    console.log();
  }
  
  if (namespacedIds.length > 0) {
    console.log(`✅ Namespaced Card IDs (${namespacedIds.length}):`);
    namespacedIds.slice(0, 20).forEach(usage => {
      console.log(`   ${usage.id.padEnd(30)} ${usage.file}:${usage.line}`);
    });
    if (namespacedIds.length > 20) {
      console.log(`   ... and ${namespacedIds.length - 20} more`);
    }
    console.log();
  }
  
  if (ambiguousIds.length > 0) {
    console.log(`⚠️  Ambiguous Card IDs (${ambiguousIds.length}) - should be builtin or namespaced:`);
    ambiguousIds.forEach(usage => {
      console.log(`   ${usage.id.padEnd(30)} ${usage.file}:${usage.line}`);
      usage.validation.warnings.forEach(w => console.log(`      → ${w}`));
    });
    console.log();
  }
  
  if (invalidIds.length > 0) {
    console.log(`❌ Invalid Card IDs (${invalidIds.length}):`);
    invalidIds.forEach(usage => {
      console.log(`   ${usage.id.padEnd(30)} ${usage.file}:${usage.line}`);
      usage.validation.errors.forEach(e => console.log(`      ✗ ${e}`));
    });
    console.log();
  }
  
  // Check for undefined builtins
  const implementedBuiltins = new Set(
    builtinIds.map(u => u.id).filter(id => isBuiltinCardId(id))
  );
  const unimplementedBuiltins = BUILTIN_CARD_IDS.filter(
    id => !implementedBuiltins.has(id)
  );
  
  if (unimplementedBuiltins.length > 0) {
    console.log(`📝 Builtin IDs not yet implemented (${unimplementedBuiltins.length}):`);
    unimplementedBuiltins.forEach(id => {
      console.log(`   ${id}`);
    });
    console.log();
  }
  
  // Summary
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total IDs found:          ${uniqueIds.size}`);
  console.log(`  ✅ Builtin IDs:         ${builtinIds.length}`);
  console.log(`  ✅ Namespaced IDs:      ${namespacedIds.length}`);
  console.log(`  ⚠️  Ambiguous IDs:       ${ambiguousIds.length}`);
  console.log(`  ❌ Invalid IDs:         ${invalidIds.length}`);
  console.log(`  📝 Unimplemented:       ${unimplementedBuiltins.length}`);
  console.log();
  
  // Exit code
  const hasIssues = invalidIds.length > 0 || ambiguousIds.length > 0;
  if (hasIssues) {
    console.log('❌ Validation failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('✅ All card IDs are valid!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
