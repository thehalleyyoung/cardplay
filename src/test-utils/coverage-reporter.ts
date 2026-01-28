/**
 * Test Coverage Reporter for Cardplay
 * 
 * Generates and analyzes test coverage reports.
 * Integrates with vitest coverage provider.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export type CoverageMetrics = {
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
};

export type FileCoverage = {
  path: string;
  metrics: CoverageMetrics;
};

export type CoverageReport = {
  total: CoverageMetrics;
  files: FileCoverage[];
  timestamp: string;
  thresholds?: CoverageThresholds;
  passed: boolean;
};

export type CoverageThresholds = {
  lines?: number;
  statements?: number;
  functions?: number;
  branches?: number;
};

/**
 * Parses coverage JSON output from vitest/v8.
 */
export function parseCoverageJson(jsonPath: string): CoverageReport | null {
  if (!existsSync(jsonPath)) {
    console.warn(`Coverage JSON not found: ${jsonPath}`);
    return null;
  }
  
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    
    const files: FileCoverage[] = [];
    let totalLines = 0, coveredLines = 0;
    let totalStatements = 0, coveredStatements = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalBranches = 0, coveredBranches = 0;
    
    for (const [path, fileData] of Object.entries(data as Record<string, any>)) {
      if (path.includes('node_modules') || path.includes('.test.')) continue;
      
      const linesCov = fileData.lines || { total: 0, covered: 0, pct: 0 };
      const stmtsCov = fileData.statements || { total: 0, covered: 0, pct: 0 };
      const funcsCov = fileData.functions || { total: 0, covered: 0, pct: 0 };
      const branchesCov = fileData.branches || { total: 0, covered: 0, pct: 0 };
      
      files.push({
        path,
        metrics: {
          lines: linesCov,
          statements: stmtsCov,
          functions: funcsCov,
          branches: branchesCov
        }
      });
      
      totalLines += linesCov.total;
      coveredLines += linesCov.covered;
      totalStatements += stmtsCov.total;
      coveredStatements += stmtsCov.covered;
      totalFunctions += funcsCov.total;
      coveredFunctions += funcsCov.covered;
      totalBranches += branchesCov.total;
      coveredBranches += branchesCov.covered;
    }
    
    const total: CoverageMetrics = {
      lines: { total: totalLines, covered: coveredLines, pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0 },
      statements: { total: totalStatements, covered: coveredStatements, pct: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0 },
      functions: { total: totalFunctions, covered: coveredFunctions, pct: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0 },
      branches: { total: totalBranches, covered: coveredBranches, pct: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0 }
    };
    
    return {
      total,
      files,
      timestamp: new Date().toISOString(),
      passed: true
    };
  } catch (error) {
    console.error('Failed to parse coverage JSON:', error);
    return null;
  }
}

/**
 * Checks if coverage meets specified thresholds.
 */
export function checkThresholds(report: CoverageReport, thresholds: CoverageThresholds): boolean {
  let passed = true;
  
  if (thresholds.lines !== undefined && report.total.lines.pct < thresholds.lines) {
    console.error(`❌ Line coverage ${report.total.lines.pct.toFixed(2)}% below threshold ${thresholds.lines}%`);
    passed = false;
  }
  
  if (thresholds.statements !== undefined && report.total.statements.pct < thresholds.statements) {
    console.error(`❌ Statement coverage ${report.total.statements.pct.toFixed(2)}% below threshold ${thresholds.statements}%`);
    passed = false;
  }
  
  if (thresholds.functions !== undefined && report.total.functions.pct < thresholds.functions) {
    console.error(`❌ Function coverage ${report.total.functions.pct.toFixed(2)}% below threshold ${thresholds.functions}%`);
    passed = false;
  }
  
  if (thresholds.branches !== undefined && report.total.branches.pct < thresholds.branches) {
    console.error(`❌ Branch coverage ${report.total.branches.pct.toFixed(2)}% below threshold ${thresholds.branches}%`);
    passed = false;
  }
  
  report.thresholds = thresholds;
  report.passed = passed;
  
  return passed;
}

/**
 * Generates a human-readable coverage summary.
 */
export function generateCoverageSummary(report: CoverageReport): string {
  const lines: string[] = [];
  
  lines.push('==========================================');
  lines.push('  Cardplay Test Coverage Report');
  lines.push('==========================================');
  lines.push(`Generated: ${report.timestamp}`);
  lines.push('');
  lines.push('Overall Coverage:');
  lines.push(`  Lines:      ${report.total.lines.pct.toFixed(2)}% (${report.total.lines.covered}/${report.total.lines.total})`);
  lines.push(`  Statements: ${report.total.statements.pct.toFixed(2)}% (${report.total.statements.covered}/${report.total.statements.total})`);
  lines.push(`  Functions:  ${report.total.functions.pct.toFixed(2)}% (${report.total.functions.covered}/${report.total.functions.total})`);
  lines.push(`  Branches:   ${report.total.branches.pct.toFixed(2)}% (${report.total.branches.covered}/${report.total.branches.total})`);
  lines.push('');
  
  if (report.thresholds) {
    lines.push('Thresholds:');
    if (report.thresholds.lines) lines.push(`  Lines:      ${report.thresholds.lines}% ${report.total.lines.pct >= report.thresholds.lines ? '✓' : '✗'}`);
    if (report.thresholds.statements) lines.push(`  Statements: ${report.thresholds.statements}% ${report.total.statements.pct >= report.thresholds.statements ? '✓' : '✗'}`);
    if (report.thresholds.functions) lines.push(`  Functions:  ${report.thresholds.functions}% ${report.total.functions.pct >= report.thresholds.functions ? '✓' : '✗'}`);
    if (report.thresholds.branches) lines.push(`  Branches:   ${report.thresholds.branches}% ${report.total.branches.pct >= report.thresholds.branches ? '✓' : '✗'}`);
    lines.push('');
  }
  
  lines.push(`Status: ${report.passed ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push('==========================================');
  
  return lines.join('\n');
}

/**
 * Generates a coverage badge SVG.
 */
export function generateCoverageBadge(coverage: number, thresholds?: { low: number; medium: number; high: number }): string {
  const th = thresholds ?? { low: 50, medium: 70, high: 90 };
  let color = '#e05d44'; // red
  
  if (coverage >= th.high) color = '#4c1'; // bright green
  else if (coverage >= th.medium) color = '#97ca00'; // green
  else if (coverage >= th.low) color = '#dfb317'; // yellow
  
  const pct = coverage.toFixed(1);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="108" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h61v20H0z"/>
    <path fill="${color}" d="M61 0h47v20H61z"/>
    <path fill="url(#b)" d="M0 0h108v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="30.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
    <text x="30.5" y="14">coverage</text>
    <text x="83.5" y="15" fill="#010101" fill-opacity=".3">${pct}%</text>
    <text x="83.5" y="14">${pct}%</text>
  </g>
</svg>`;
}

/**
 * Writes coverage badge to file.
 */
export function writeCoverageBadge(outputPath: string, coverage: number): void {
  const svg = generateCoverageBadge(coverage);
  const dir = join(outputPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, svg, 'utf-8');
  console.log(`✓ Coverage badge written to ${outputPath}`);
}

/**
 * Compares two coverage reports to show improvements/regressions.
 */
export function compareCoverage(current: CoverageReport, previous: CoverageReport): string {
  const lines: string[] = [];
  
  lines.push('Coverage Comparison:');
  
  const lineDiff = current.total.lines.pct - previous.total.lines.pct;
  const stmtDiff = current.total.statements.pct - previous.total.statements.pct;
  const funcDiff = current.total.functions.pct - previous.total.functions.pct;
  const branchDiff = current.total.branches.pct - previous.total.branches.pct;
  
  const format = (diff: number) => {
    if (diff > 0) return `+${diff.toFixed(2)}%`;
    if (diff < 0) return `${diff.toFixed(2)}%`;
    return '±0.00%';
  };
  
  const indicator = (diff: number) => {
    if (diff > 0) return '↑';
    if (diff < 0) return '↓';
    return '→';
  };
  
  lines.push(`  Lines:      ${indicator(lineDiff)} ${format(lineDiff)}`);
  lines.push(`  Statements: ${indicator(stmtDiff)} ${format(stmtDiff)}`);
  lines.push(`  Functions:  ${indicator(funcDiff)} ${format(funcDiff)}`);
  lines.push(`  Branches:   ${indicator(branchDiff)} ${format(branchDiff)}`);
  
  return lines.join('\n');
}
