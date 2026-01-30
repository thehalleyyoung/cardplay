/**
 * @fileoverview Generate Registry Health Report
 * 
 * CLI script to generate and display registry health report.
 * Used for diagnostics and CI validation.
 * 
 * Usage:
 *   npm run registry:report
 *   node --loader ts-node/esm scripts/registry-report.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  deserializeSnapshot,
  createEmptySnapshot,
  generateHealthReport,
  formatHealthReport,
  type RegistrySnapshot,
} from '../src/registry/v2/index';

/**
 * Loads a registry snapshot from disk.
 * If no snapshot file exists, returns an empty snapshot.
 */
function loadSnapshot(path: string, cardplayVersion: string): RegistrySnapshot {
  if (!existsSync(path)) {
    console.warn(`No snapshot found at ${path}, using empty snapshot`);
    return createEmptySnapshot(cardplayVersion);
  }
  
  try {
    const json = readFileSync(path, 'utf-8');
    return deserializeSnapshot(json);
  } catch (error) {
    console.error(`Failed to load snapshot: ${error}`);
    return createEmptySnapshot(cardplayVersion);
  }
}

/**
 * Main entry point.
 */
function main() {
  // Get CardPlay version from package.json
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const cardplayVersion = packageJson.version;
  
  // Look for snapshot file
  const snapshotPath = join(process.cwd(), '.registry-snapshot.json');
  const snapshot = loadSnapshot(snapshotPath, cardplayVersion);
  
  // Generate report
  console.log('Generating registry health report...\n');
  const report = generateHealthReport(snapshot);
  
  // Format and display
  console.log(formatHealthReport(report));
  
  // Exit with error code if there are errors
  if (report.status === 'error') {
    console.error('\n❌ Registry has errors');
    process.exit(1);
  } else if (report.status === 'warning') {
    console.warn('\n⚠️  Registry has warnings');
    process.exit(0);
  } else {
    console.log('\n✅ Registry is healthy');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
