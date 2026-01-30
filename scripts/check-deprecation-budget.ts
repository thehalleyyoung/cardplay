#!/usr/bin/env node
/**
 * @fileoverview Deprecation Budget Policy Enforcer
 * 
 * Change 471: Enforce that new code does not add legacy aliases
 * without tests and doc updates.
 * 
 * This script checks:
 * 1. New @deprecated tags must have tests
 * 2. New legacy aliases must be documented
 * 3. Deprecation budget is not exceeded
 * 
 * Prevents accumulation of technical debt via legacy aliases.
 * 
 * @module @cardplay/scripts/check-deprecation-budget
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum allowed deprecated items without removal plan.
 */
const DEPRECATION_BUDGET = 50;

/**
 * Paths to check for deprecated code.
 */
const SOURCE_PATHS = [
  'src/**/*.ts',
  '!src/**/*.test.ts',
  '!src/**/*.bench.test.ts',
];

/**
 * Path to legacy aliases documentation.
 */
const LEGACY_ALIASES_DOC = 'docs/canon/legacy-type-aliases.md';

// ============================================================================
// TYPES
// ============================================================================

interface DeprecatedItem {
  readonly file: string;
  readonly lineNumber: number;
  readonly identifier: string;
  readonly reason?: string;
  readonly hasTest: boolean;
  readonly hasDocumentation: boolean;
}

interface BudgetReport {
  readonly totalDeprecated: number;
  readonly withTests: number;
  readonly withDocs: number;
  readonly violations: readonly DeprecatedItem[];
  readonly withinBudget: boolean;
}

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Find all @deprecated tags in source files.
 */
async function findDeprecatedItems(): Promise<readonly DeprecatedItem[]> {
  const allFiles: string[] = [];
  for (const pattern of SOURCE_PATHS) {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    allFiles.push(...files);
  }
  const items: DeprecatedItem[] = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match @deprecated tags
      const deprecatedMatch = /@deprecated\s*(.*)/.exec(line);
      if (deprecatedMatch) {
        // Extract identifier from next non-comment line
        let identifier = 'unknown';
        let reason = deprecatedMatch[1].trim() || undefined;
        
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.startsWith('*') && !nextLine.startsWith('//')) {
            // Try to extract identifier
            const exportMatch = /(?:export\s+)?(?:const|let|var|function|class|interface|type)\s+(\w+)/.exec(nextLine);
            if (exportMatch) {
              identifier = exportMatch[1];
            }
            break;
          }
        }

        items.push({
          file,
          lineNumber: i + 1,
          identifier,
          reason,
          hasTest: false, // Will be checked below
          hasDocumentation: false, // Will be checked below
        });
      }
    }
  }

  return items;
}

/**
 * Check if a deprecated item has tests.
 */
async function hasTests(item: DeprecatedItem): Promise<boolean> {
  const baseName = path.basename(item.file, '.ts');
  const testFile = item.file.replace(/\.ts$/, '.test.ts');
  
  if (!fs.existsSync(testFile)) {
    return false;
  }

  const testContent = fs.readFileSync(testFile, 'utf-8');
  
  // Check for test mentioning the deprecated identifier
  return testContent.includes(item.identifier);
}

/**
 * Check if a deprecated item is documented.
 */
function hasDocumentation(item: DeprecatedItem): boolean {
  if (!fs.existsSync(LEGACY_ALIASES_DOC)) {
    return false;
  }

  const docContent = fs.readFileSync(LEGACY_ALIASES_DOC, 'utf-8');
  
  // Check for identifier in docs
  return docContent.includes(item.identifier);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Generate deprecation budget report.
 */
async function generateReport(): Promise<BudgetReport> {
  const items = await findDeprecatedItems();
  
  // Check tests and documentation for each item
  const enrichedItems = await Promise.all(
    items.map(async item => ({
      ...item,
      hasTest: await hasTests(item),
      hasDocumentation: hasDocumentation(item),
    }))
  );

  // Find violations (deprecated items without tests or docs)
  const violations = enrichedItems.filter(
    item => !item.hasTest || !item.hasDocumentation
  );

  const withTests = enrichedItems.filter(item => item.hasTest).length;
  const withDocs = enrichedItems.filter(item => item.hasDocumentation).length;

  return {
    totalDeprecated: enrichedItems.length,
    withTests,
    withDocs,
    violations,
    withinBudget: enrichedItems.length <= DEPRECATION_BUDGET,
  };
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Print budget report.
 */
function printReport(report: BudgetReport): void {
  console.log('='.repeat(70));
  console.log('DEPRECATION BUDGET REPORT');
  console.log('='.repeat(70));
  console.log();
  
  console.log(`Total deprecated items: ${report.totalDeprecated}`);
  console.log(`Budget limit: ${DEPRECATION_BUDGET}`);
  console.log(`Budget status: ${report.withinBudget ? '✓ Within budget' : '✗ Over budget'}`);
  console.log();
  
  console.log(`Items with tests: ${report.withTests}/${report.totalDeprecated}`);
  console.log(`Items with docs: ${report.withDocs}/${report.totalDeprecated}`);
  console.log();

  if (report.violations.length > 0) {
    console.log('VIOLATIONS (deprecated items without tests or docs):');
    console.log('-'.repeat(70));
    
    for (const item of report.violations) {
      const relPath = path.relative(process.cwd(), item.file);
      console.log(`\n${relPath}:${item.lineNumber}`);
      console.log(`  Identifier: ${item.identifier}`);
      if (item.reason) {
        console.log(`  Reason: ${item.reason}`);
      }
      if (!item.hasTest) {
        console.log(`  ✗ Missing test coverage`);
      }
      if (!item.hasDocumentation) {
        console.log(`  ✗ Not documented in ${LEGACY_ALIASES_DOC}`);
      }
    }
    
    console.log();
    console.log('-'.repeat(70));
    console.log(`Total violations: ${report.violations.length}`);
  } else {
    console.log('✓ All deprecated items have proper tests and documentation');
  }
  
  console.log();
  console.log('='.repeat(70));
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const report = await generateReport();
  printReport(report);

  // Exit with error if violations or over budget
  const hasViolations = report.violations.length > 0;
  const overBudget = !report.withinBudget;

  if (hasViolations || overBudget) {
    console.log();
    console.log('POLICY ENFORCEMENT:');
    if (hasViolations) {
      console.log('  - All deprecated items must have tests');
      console.log('  - All deprecated items must be documented');
    }
    if (overBudget) {
      console.log('  - Deprecation budget exceeded');
      console.log('  - Remove old deprecated items before adding new ones');
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

export { generateReport, findDeprecatedItems };
