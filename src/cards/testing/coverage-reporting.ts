/**
 * Coverage Reporting & CI/CD Integration
 * Phase 6.6: Card Testing & Quality (Item 1973, 1974)
 */

import type { TestSuiteResult } from './card-test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Coverage data for a card
 */
export interface CoverageData {
  cardId: string;
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

/**
 * Test report generator
 */
export class CoverageReporter {
  async generateReport(results: TestSuiteResult[], outputPath: string): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      totalCards: results.length,
      totalTests: results.reduce((sum, r) => sum + r.totalTests, 0),
      totalPassed: results.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
      overallSuccessRate: 0,
      cards: results.map(r => ({
        cardId: r.cardId,
        cardName: r.cardName,
        tests: r.totalTests,
        passed: r.passed,
        failed: r.failed,
        duration: r.duration,
        qualityScore: r.qualityScore,
        coverage: r.coverage
      }))
    };

    const totalTests = report.totalPassed + report.totalFailed;
    report.overallSuccessRate = totalTests > 0 ? (report.totalPassed / totalTests) * 100 : 0;

    if (typeof window === 'undefined') {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    }
  }

  async generateHTMLReport(results: TestSuiteResult[], outputPath: string): Promise<void> {
    const html = this.generateHTML(results);
    
    if (typeof window === 'undefined') {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, html);
    }
  }

  private generateHTML(results: TestSuiteResult[]): string {
    const totalTests = results.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Card Test Coverage Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat { background: #ecf0f1; padding: 20px; border-radius: 8px; flex: 1; }
    .stat h3 { margin: 0 0 10px 0; color: #2c3e50; }
    .stat .value { font-size: 32px; font-weight: bold; color: #3498db; }
    .passed { color: #27ae60; }
    .failed { color: #e74c3c; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background: #34495e; color: white; }
    tr:hover { background: #f5f5f5; }
    .progress-bar { width: 100%; height: 20px; background: #ecf0f1; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); }
  </style>
</head>
<body>
  <div class="header">
    <h1>Card Test Coverage Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="stats">
    <div class="stat">
      <h3>Total Tests</h3>
      <div class="value">${totalTests}</div>
    </div>
    <div class="stat">
      <h3>Passed</h3>
      <div class="value passed">${totalPassed}</div>
    </div>
    <div class="stat">
      <h3>Failed</h3>
      <div class="value failed">${totalFailed}</div>
    </div>
    <div class="stat">
      <h3>Success Rate</h3>
      <div class="value">${successRate}%</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${successRate}%"></div>
      </div>
    </div>
  </div>

  <h2>Card Results</h2>
  <table>
    <thead>
      <tr>
        <th>Card Name</th>
        <th>Tests</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Duration (ms)</th>
        <th>Quality Score</th>
        <th>Coverage</th>
      </tr>
    </thead>
    <tbody>
      ${results.map(r => `
        <tr>
          <td>${r.cardName}</td>
          <td>${r.totalTests}</td>
          <td class="passed">${r.passed}</td>
          <td class="failed">${r.failed}</td>
          <td>${r.duration.toFixed(2)}</td>
          <td>${r.qualityScore ? r.qualityScore.toFixed(1) + '%' : 'N/A'}</td>
          <td>${r.coverage ? r.coverage.lines.toFixed(1) + '%' : 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }
}

/**
 * CI/CD integration helpers
 */
export class CICDIntegration {
  async exportForGitHub(results: TestSuiteResult[], outputPath: string): Promise<void> {
    const summary = {
      success: results.every(r => r.failed === 0),
      totalCards: results.length,
      totalTests: results.reduce((sum, r) => sum + r.totalTests, 0),
      passed: results.reduce((sum, r) => sum + r.passed, 0),
      failed: results.reduce((sum, r) => sum + r.failed, 0),
      results: results.map(r => ({
        name: r.cardName,
        status: r.failed === 0 ? 'success' : 'failure',
        tests: r.totalTests,
        passed: r.passed,
        failed: r.failed,
        duration: r.duration
      }))
    };

    if (typeof window === 'undefined') {
      fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    }
  }

  async exportJUnitXML(results: TestSuiteResult[], outputPath: string): Promise<void> {
    const xml = this.generateJUnitXML(results);
    
    if (typeof window === 'undefined') {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, xml);
    }
  }

  private generateJUnitXML(results: TestSuiteResult[]): string {
    const totalTests = results.reduce((sum, r) => sum + r.totalTests, 0);
    const totalFailures = results.reduce((sum, r) => sum + r.failed, 0);
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0) / 1000;

    const testsuites = results.map(suite => {
      const tests = suite.results.map(test => `
    <testcase name="${this.escapeXML(test.testName)}" 
              classname="${this.escapeXML(suite.cardName)}" 
              time="${(test.duration || 0) / 1000}">
      ${test.passed ? '' : `<failure message="${this.escapeXML(test.error?.message || 'Test failed')}">${this.escapeXML(test.error?.stack || '')}</failure>`}
    </testcase>`).join('');

      return `
  <testsuite name="${this.escapeXML(suite.cardName)}" 
             tests="${suite.totalTests}" 
             failures="${suite.failed}" 
             time="${suite.duration / 1000}">
    ${tests}
  </testsuite>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${totalTests}" failures="${totalFailures}" time="${totalTime}">
${testsuites}
</testsuites>`;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Badge generator for README
 */
export function generateCoverageBadge(coveragePercentage: number): string {
  const color = coveragePercentage >= 90 ? 'brightgreen' :
                coveragePercentage >= 75 ? 'green' :
                coveragePercentage >= 60 ? 'yellow' :
                coveragePercentage >= 40 ? 'orange' : 'red';
  
  return `https://img.shields.io/badge/coverage-${coveragePercentage.toFixed(0)}%25-${color}`;
}

export function generateQualityBadge(qualityScore: number): string {
  const color = qualityScore >= 90 ? 'brightgreen' :
                qualityScore >= 75 ? 'green' :
                qualityScore >= 60 ? 'yellow' :
                qualityScore >= 40 ? 'orange' : 'red';
  
  return `https://img.shields.io/badge/quality-${qualityScore.toFixed(0)}%25-${color}`;
}

export function createCoverageReporter(): CoverageReporter {
  return new CoverageReporter();
}

export function createCICDIntegration(): CICDIntegration {
  return new CICDIntegration();
}
