/**
 * GOFAI Ontology Drift Check Script
 *
 * Validates that documentation matches the canonical vocabulary in code.
 * This enforces Step 090 and Step 100 [Infra] from gofai_goalB.md:
 * "Write an 'ontology drift' lint that fails if docs and canon vocab disagree."
 *
 * Usage: npm run gofai:drift-check
 */

import { checkOntologyDrift } from '../src/gofai/canon/ontology-drift-lint.js';

async function main(): Promise<void> {
  console.log('🔍 Running GOFAI Ontology Drift Check...\n');

  const result = checkOntologyDrift();

  console.log(`\n📊 Drift Check Summary:`);
  console.log(`   Terms Checked: ${result.termsChecked}`);
  console.log(`   Files Checked: ${result.filesChecked}`);
  console.log(`   Duration: ${result.duration}ms`);

  if (result.driftWarnings.length > 0) {
    console.log(`\n⚠️  Drift Warnings (${result.driftWarnings.length}):`);
    for (const warning of result.driftWarnings) {
      console.log(`   [${warning.category}] ${warning.message}`);
      if (warning.term) {
        console.log(`      Term: ${warning.term}`);
      }
      if (warning.docPath) {
        console.log(`      Doc: ${warning.docPath}`);
      }
    }
  }

  if (result.driftErrors.length > 0) {
    console.log(`\n❌ Drift Errors (${result.driftErrors.length}):`);
    for (const error of result.driftErrors) {
      console.log(`   [${error.category}] ${error.message}`);
      if (error.term) {
        console.log(`      Term: ${error.term}`);
      }
      if (error.docPath) {
        console.log(`      Doc: ${error.docPath}`);
      }
    }
    console.log('\n❌ Ontology drift detected! Code and docs disagree.\n');
    console.log('To fix:');
    console.log('  1. Update the canonical source files in src/gofai/canon/');
    console.log('  2. Regenerate or update documentation to match');
    console.log('  3. Run this check again\n');
    process.exit(1);
  }

  console.log('\n✅ No ontology drift detected! Code and docs are in sync.\n');
}

main().catch((err) => {
  console.error('Fatal error during drift check:', err);
  process.exit(1);
});
