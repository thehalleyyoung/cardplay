/**
 * GOFAI Canon Check Script
 *
 * Validates all GOFAI canon vocabularies for internal consistency.
 * This enforces Step 100 [Infra] from gofai_goalB.md:
 * "Define the 'GOFAI docs SSOT rule': canonical vocab lives in code; docs are generated or validated from that code."
 *
 * Usage: npm run gofai:canon-check
 */

import { validateAllVocabularies } from '../src/gofai/canon/check.js';

async function main(): Promise<void> {
  console.log('🔍 Running GOFAI Canon Validation...\n');

  const result = validateAllVocabularies();

  console.log(`\n📊 Validation Summary:`);
  console.log(`   Items Checked: ${result.itemsChecked}`);
  console.log(`   Duration: ${result.duration}ms`);

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      console.log(`   [${warning.category}] ${warning.message}`);
      if (warning.itemId) {
        console.log(`      Item: ${warning.itemId}`);
      }
    }
  }

  if (result.errors.length > 0) {
    console.log(`\n❌ Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      console.log(`   [${error.category}] ${error.message}`);
      if (error.itemId) {
        console.log(`      Item: ${error.itemId}`);
      }
      if (error.fieldPath) {
        console.log(`      Field: ${error.fieldPath}`);
      }
    }
    console.log('\n❌ Canon validation failed!\n');
    process.exit(1);
  }

  console.log('\n✅ Canon validation passed!\n');
}

main().catch((err) => {
  console.error('Fatal error during canon check:', err);
  process.exit(1);
});
