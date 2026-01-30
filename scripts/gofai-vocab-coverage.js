#!/usr/bin/env node
/**
 * GOFAI Vocabulary Coverage Report CLI
 *
 * Run this script to generate a vocabulary coverage report
 * showing which cards/boards/decks have language bindings.
 *
 * Usage:
 *   node scripts/gofai-vocab-coverage.js
 *   npm run gofai:vocab-coverage
 */

const { generateVocabCoverageReport, logCoverageReport } = require('../src/gofai/infra/vocab-coverage-report');

console.log('Generating GOFAI vocabulary coverage report...\n');

try {
  const report = generateVocabCoverageReport();
  logCoverageReport(report);

  // Exit with error code if coverage is critically low
  if (report.stats.overallScore < 30) {
    console.error('\n❌ CRITICAL: Overall coverage score is below 30%');
    process.exit(1);
  } else if (report.stats.overallScore < 50) {
    console.warn('\n⚠️  WARNING: Overall coverage score is below 50%');
    process.exit(0);
  } else {
    console.log('\n✅ Coverage check passed');
    process.exit(0);
  }
} catch (err) {
  console.error('Error generating coverage report:', err);
  process.exit(1);
}
