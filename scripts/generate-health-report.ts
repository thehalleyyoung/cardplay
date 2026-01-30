#!/usr/bin/env ts-node
/**
 * generate-health-report.ts
 * Generates cardplay/docs/canon/health-report.md listing mismatches found by lints
 * 
 * Change 041 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const OUTPUT_PATH = path.join(__dirname, '../docs/canon/health-report.md');

interface LintResult {
  name: string;
  passed: boolean;
  output: string;
}

const LINTS = [
  { name: 'Status Headers', script: 'scripts/check-doc-status-headers.ts' },
  { name: 'Doc Headers', script: 'scripts/check-doc-headers.ts' },
  { name: 'Prolog Examples', script: 'scripts/check-prolog-examples.ts' },
  { name: 'Public Exports', script: 'scripts/verify-public-exports.ts' },
];

function runLint(scriptPath: string): LintResult {
  const fullPath = path.join(__dirname, '..', scriptPath);
  const name = path.basename(scriptPath, '.ts');
  
  if (!fs.existsSync(fullPath)) {
    return {
      name,
      passed: false,
      output: `Script not found: ${scriptPath}`
    };
  }
  
  try {
    const output = execSync(`npx ts-node ${fullPath}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    return {
      name,
      passed: true,
      output: output.trim()
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      output: error.stdout?.trim() || error.message
    };
  }
}

function generateReport(results: LintResult[]): string {
  const timestamp = new Date().toISOString();
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  let report = `# Canon Health Report

**Generated:** ${timestamp}  
**Status:** ${passedCount}/${totalCount} checks passed

---

## Summary

`;

  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    const status = result.passed ? 'PASS' : 'FAIL';
    report += `- ${icon} **${result.name}**: ${status}\n`;
  }

  report += `\n---\n\n## Detailed Results\n\n`;

  for (const result of results) {
    report += `### ${result.name}\n\n`;
    report += `**Status:** ${result.passed ? 'PASS ✓' : 'FAIL ✗'}\n\n`;
    
    if (result.output) {
      report += '```\n';
      report += result.output;
      report += '\n```\n\n';
    }
  }

  report += `---\n\n*This report is automatically generated. Do not edit manually.*\n`;

  return report;
}

function main(): void {
  console.log('Generating canon health report...\n');
  
  const results: LintResult[] = [];
  
  for (const lint of LINTS) {
    console.log(`Running ${lint.name}...`);
    const result = runLint(lint.script);
    results.push({ ...result, name: lint.name });
  }
  
  const report = generateReport(results);
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_PATH, report, 'utf-8');
  
  console.log(`\n✓ Health report written to: ${path.relative(process.cwd(), OUTPUT_PATH)}\n`);
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  if (passedCount < totalCount) {
    console.log(`⚠ ${totalCount - passedCount} check(s) failed\n`);
    process.exit(1);
  }
  
  console.log('✓ All checks passed\n');
  process.exit(0);
}

main();
