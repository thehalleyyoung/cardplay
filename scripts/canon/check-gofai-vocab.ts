#!/usr/bin/env npx tsx
/**
 * @fileoverview GOFAI Canon Vocabulary Check Script
 * 
 * Validates all GOFAI vocabulary tables (lexemes, axes, opcodes, constraints, etc.)
 * for consistency, completeness, and adherence to namespacing rules.
 * 
 * This implements Step 053 from gofai_goalB.md:
 * "Build a 'canon check' script for GOFAI (like existing canon checks) that 
 * validates all vocab tables and IDs."
 * 
 * Run: npx tsx scripts/canon/check-gofai-vocab.ts
 * 
 * @module @cardplay/scripts/canon/check-gofai-vocab
 * @see gofai_goalB.md Step 053
 */

import { validateAllVocabularies, logValidationResults } from '../../src/gofai/canon/check.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Additional Cross-Vocabulary Checks
// ============================================================================

interface CrossCheckResult {
  passed: boolean;
  category: string;
  message: string;
  details?: string[];
}

/**
 * Check that all vocabulary files are properly exported from canon/index.ts
 */
function checkCanonIndexExports(): CrossCheckResult {
  const canonIndexPath = path.resolve(__dirname, '../../src/gofai/canon/index.ts');
  
  if (!fs.existsSync(canonIndexPath)) {
    return {
      passed: false,
      category: 'Canon Index',
      message: 'Canon index file not found at expected location',
    };
  }

  const indexContent = fs.readFileSync(canonIndexPath, 'utf-8');
  
  const requiredExports = [
    'lexemes',
    'perceptual-axes',
    'section-vocabulary',
    'layer-vocabulary',
    'units',
    'edit-opcodes',
    'constraint-types',
    'check',
  ];

  const missingExports: string[] = [];
  
  for (const module of requiredExports) {
    // Check for various export patterns
    const patterns = [
      new RegExp(`export \\* from ['"]\\.\/${module}['"]`),
      new RegExp(`export \\* as \\w+ from ['"]\\.\/${module}['"]`),
      new RegExp(`export \\{[^}]+\\} from ['"]\\.\/${module}['"]`),
    ];
    
    if (!patterns.some(pattern => pattern.test(indexContent))) {
      missingExports.push(module);
    }
  }

  if (missingExports.length > 0) {
    return {
      passed: false,
      category: 'Canon Index',
      message: `Missing exports in canon/index.ts`,
      details: missingExports,
    };
  }

  return {
    passed: true,
    category: 'Canon Index',
    message: 'All required modules are exported from canon/index.ts',
  };
}

/**
 * Check that vocabulary batch files follow naming conventions
 */
function checkVocabularyBatchNaming(): CrossCheckResult {
  const canonDir = path.resolve(__dirname, '../../src/gofai/canon');
  const files = fs.readdirSync(canonDir);
  
  const batchFiles = files.filter(f => /batch\d+/.test(f));
  const issues: string[] = [];
  
  for (const file of batchFiles) {
    // Check naming pattern: should be domain-vocab-batch##.ts or similar
    if (!file.match(/^[a-z-]+-batch\d+(-part\d+)?\.ts$/)) {
      issues.push(`File "${file}" doesn't follow batch naming convention (domain-name-batch##.ts)`);
    }
    
    // Check that batch numbers are reasonable (not too sparse)
    const match = file.match(/batch(\d+)/);
    if (match) {
      const batchNum = parseInt(match[1], 10);
      if (batchNum > 200) {
        issues.push(`File "${file}" has unusually high batch number ${batchNum}`);
      }
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      category: 'Vocabulary Batches',
      message: 'Batch file naming issues found',
      details: issues,
    };
  }

  return {
    passed: true,
    category: 'Vocabulary Batches',
    message: `All ${batchFiles.length} batch files follow naming conventions`,
  };
}

/**
 * Check for duplicate domain-noun or domain-verb files
 */
function checkForDuplicateVocabFiles(): CrossCheckResult {
  const canonDir = path.resolve(__dirname, '../../src/gofai/canon');
  const files = fs.readdirSync(canonDir);
  
  const categoryFiles = new Map<string, string[]>();
  
  for (const file of files) {
    // Extract category prefix (domain-nouns, domain-verbs, etc.)
    const match = file.match(/^(domain-[a-z]+)(-batch\d+)?\.ts$/);
    if (match) {
      const category = match[1];
      if (!categoryFiles.has(category)) {
        categoryFiles.set(category, []);
      }
      categoryFiles.get(category)!.push(file);
    }
  }

  const issues: string[] = [];
  
  for (const [category, fileList] of categoryFiles.entries()) {
    if (fileList.length > 15) {
      issues.push(`Category "${category}" has ${fileList.length} files - consider consolidation`);
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      category: 'Vocabulary Organization',
      message: 'Potential organization issues found',
      details: issues,
    };
  }

  return {
    passed: true,
    category: 'Vocabulary Organization',
    message: 'Vocabulary files are well-organized',
  };
}

/**
 * Check that all vocabulary files have corresponding tests
 */
function checkVocabularyTestCoverage(): CrossCheckResult {
  const canonDir = path.resolve(__dirname, '../../src/gofai/canon');
  const testDir = path.resolve(__dirname, '../../src/gofai/canon/__tests__');
  
  const vocabFiles = fs.readdirSync(canonDir)
    .filter(f => f.endsWith('.ts') && !f.includes('index') && !f.includes('check'));
  
  let testFiles: string[] = [];
  if (fs.existsSync(testDir)) {
    testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.ts'));
  }

  const criticalFiles = [
    'lexemes.ts',
    'perceptual-axes.ts',
    'constraint-types.ts',
    'edit-opcodes.ts',
    'goals-constraints-preferences.ts',
    'vocabulary-policy.ts',
  ];

  const missingTests: string[] = [];
  
  for (const file of criticalFiles) {
    const testFileName = file.replace('.ts', '.test.ts');
    if (!testFiles.includes(testFileName)) {
      missingTests.push(file);
    }
  }

  if (missingTests.length > 0) {
    return {
      passed: false,
      category: 'Test Coverage',
      message: 'Critical vocabulary files missing tests',
      details: missingTests,
    };
  }

  return {
    passed: true,
    category: 'Test Coverage',
    message: `All ${criticalFiles.length} critical vocabulary files have tests`,
  };
}

/**
 * Check that namespacing rules are followed in extension-related files
 */
function checkNamespacingCompliance(): CrossCheckResult {
  const extensionFiles = [
    'extension-semantics.ts',
    'vocabulary-policy.ts',
  ];

  const canonDir = path.resolve(__dirname, '../../src/gofai/canon');
  const issues: string[] = [];

  for (const file of extensionFiles) {
    const filePath = path.join(canonDir, file);
    
    if (!fs.existsSync(filePath)) {
      issues.push(`Required file "${file}" not found`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for namespace-related patterns
    const hasNamespaceType = /type.*Namespace/i.test(content) || /namespace.*:/i.test(content);
    const hasNamespaceValidation = /namespace/i.test(content);
    
    if (!hasNamespaceValidation) {
      issues.push(`File "${file}" may be missing namespace validation logic`);
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      category: 'Namespacing',
      message: 'Namespacing compliance issues found',
      details: issues,
    };
  }

  return {
    passed: true,
    category: 'Namespacing',
    message: 'Extension namespacing rules are properly defined',
  };
}

/**
 * Check for documentation completeness
 */
function checkDocumentationCompleteness(): CrossCheckResult {
  const docsGofaiDir = path.resolve(__dirname, '../../docs/gofai');
  
  if (!fs.existsSync(docsGofaiDir)) {
    return {
      passed: false,
      category: 'Documentation',
      message: 'GOFAI documentation directory not found at docs/gofai',
    };
  }

  const requiredDocs = [
    'index.md',
    'architecture.md',
    'vocabulary.md',
  ];

  const missingDocs: string[] = [];
  
  for (const doc of requiredDocs) {
    const docPath = path.join(docsGofaiDir, doc);
    if (!fs.existsSync(docPath)) {
      missingDocs.push(doc);
    }
  }

  if (missingDocs.length > 0) {
    return {
      passed: false,
      category: 'Documentation',
      message: 'Required documentation files missing',
      details: missingDocs,
    };
  }

  return {
    passed: true,
    category: 'Documentation',
    message: `All ${requiredDocs.length} required documentation files exist`,
  };
}

// ============================================================================
// Main Execution
// ============================================================================

function main(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('GOFAI CANON VOCABULARY VALIDATION');
  console.log('═'.repeat(70) + '\n');

  // Run core vocabulary validation
  console.log('Running core vocabulary validation...\n');
  const coreResult = validateAllVocabularies();
  logValidationResults(coreResult);

  // Run cross-vocabulary checks
  console.log('\n' + '─'.repeat(70));
  console.log('CROSS-VOCABULARY CHECKS');
  console.log('─'.repeat(70) + '\n');

  const crossChecks = [
    checkCanonIndexExports(),
    checkVocabularyBatchNaming(),
    checkForDuplicateVocabFiles(),
    checkVocabularyTestCoverage(),
    checkNamespacingCompliance(),
    checkDocumentationCompleteness(),
  ];

  let crossChecksPassed = 0;
  
  for (const check of crossChecks) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`${icon} ${check.category}: ${check.message}`);
    
    if (check.details && check.details.length > 0) {
      for (const detail of check.details) {
        console.log(`    - ${detail}`);
      }
    }
    
    if (check.passed) {
      crossChecksPassed++;
    }
  }

  // Final summary
  console.log('\n' + '═'.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(70));
  
  const allPassed = coreResult.valid && crossChecksPassed === crossChecks.length;
  
  console.log(`\nCore Vocabulary: ${coreResult.valid ? '✓ VALID' : '✗ INVALID'}`);
  console.log(`  - ${coreResult.totalItemsChecked} items checked`);
  console.log(`  - ${coreResult.totalErrors} errors`);
  console.log(`  - ${coreResult.totalWarnings} warnings`);
  console.log(`  - ${coreResult.totalDuration}ms duration`);
  
  console.log(`\nCross-Vocabulary Checks: ${crossChecksPassed}/${crossChecks.length} passed`);
  
  console.log(`\n${allPassed ? '✓' : '✗'} Overall Status: ${allPassed ? 'VALID' : 'INVALID'}`);
  console.log('═'.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
