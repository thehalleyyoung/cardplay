/**
 * Test Quality Scoring for Cardplay
 * 
 * Evaluates test suite quality based on multiple metrics.
 */

export type QualityMetrics = {
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  testCount: number;
  propertyTests: number;
  fuzzTests: number;
  snapshotTests: number;
  performanceBenchmarks: number;
  testDuration: number;
  failureRate: number;
  regressionTests: number;
};

export type QualityScore = {
  total: number;
  breakdown: {
    coverage: number;
    testDiversity: number;
    testSpeed: number;
    testReliability: number;
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  suggestions: string[];
};

/**
 * Calculates a quality score for the test suite.
 */
export function calculateQualityScore(metrics: QualityMetrics): QualityScore {
  const coverageScore = calculateCoverageScore(metrics.coverage);
  const diversityScore = calculateDiversityScore(metrics);
  const speedScore = calculateSpeedScore(metrics);
  const reliabilityScore = calculateReliabilityScore(metrics);
  
  const total = (
    coverageScore * 0.4 +
    diversityScore * 0.3 +
    speedScore * 0.15 +
    reliabilityScore * 0.15
  );
  
  const grade = getGrade(total);
  const suggestions = generateSuggestions(metrics, {
    coverage: coverageScore,
    testDiversity: diversityScore,
    testSpeed: speedScore,
    testReliability: reliabilityScore
  });
  
  return {
    total,
    breakdown: {
      coverage: coverageScore,
      testDiversity: diversityScore,
      testSpeed: speedScore,
      testReliability: reliabilityScore
    },
    grade,
    suggestions
  };
}

function calculateCoverageScore(coverage: QualityMetrics['coverage']): number {
  const avg = (coverage.lines + coverage.statements + coverage.functions + coverage.branches) / 4;
  return Math.min(100, avg);
}

function calculateDiversityScore(metrics: QualityMetrics): number {
  const hasProperty = metrics.propertyTests > 0 ? 25 : 0;
  const hasFuzz = metrics.fuzzTests > 0 ? 25 : 0;
  const hasSnapshot = metrics.snapshotTests > 0 ? 25 : 0;
  const hasBenchmark = metrics.performanceBenchmarks > 0 ? 25 : 0;
  
  return hasProperty + hasFuzz + hasSnapshot + hasBenchmark;
}

function calculateSpeedScore(metrics: QualityMetrics): number {
  if (metrics.testCount === 0) return 0;
  
  const avgDuration = metrics.testDuration / metrics.testCount;
  
  if (avgDuration < 10) return 100;
  if (avgDuration < 50) return 80;
  if (avgDuration < 100) return 60;
  if (avgDuration < 200) return 40;
  return 20;
}

function calculateReliabilityScore(metrics: QualityMetrics): number {
  if (metrics.testCount === 0) return 0;
  
  const successRate = 1 - metrics.failureRate;
  const regressionCoverage = Math.min(1, metrics.regressionTests / (metrics.testCount * 0.1));
  
  return (successRate * 0.7 + regressionCoverage * 0.3) * 100;
}

function getGrade(score: number): QualityScore['grade'] {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateSuggestions(metrics: QualityMetrics, breakdown: QualityScore['breakdown']): string[] {
  const suggestions: string[] = [];
  
  if (breakdown.coverage < 80) {
    suggestions.push('Increase test coverage to at least 80% across all metrics');
    if (metrics.coverage.branches < 70) {
      suggestions.push('Focus on branch coverage - add tests for edge cases and conditionals');
    }
    if (metrics.coverage.functions < 80) {
      suggestions.push('Ensure all public functions have test coverage');
    }
  }
  
  if (breakdown.testDiversity < 75) {
    if (metrics.propertyTests === 0) {
      suggestions.push('Add property-based tests to verify universal properties');
    }
    if (metrics.fuzzTests === 0) {
      suggestions.push('Add fuzz tests to discover edge cases automatically');
    }
    if (metrics.snapshotTests === 0) {
      suggestions.push('Add snapshot tests for complex output validation');
    }
    if (metrics.performanceBenchmarks === 0) {
      suggestions.push('Add performance benchmarks for critical paths');
    }
  }
  
  if (breakdown.testSpeed < 70) {
    suggestions.push('Optimize slow tests - consider mocking, parallelization, or test data reduction');
  }
  
  if (breakdown.testReliability < 80) {
    if (metrics.failureRate > 0.01) {
      suggestions.push('Investigate and fix flaky tests to improve reliability');
    }
    if (metrics.regressionTests < metrics.testCount * 0.1) {
      suggestions.push('Add regression tests for previously fixed bugs');
    }
  }
  
  if (metrics.testCount < 50) {
    suggestions.push('Expand test suite - aim for comprehensive coverage of all features');
  }
  
  return suggestions;
}

/**
 * Generates a quality report badge SVG.
 */
export function generateQualityBadge(score: QualityScore): string {
  const colors = {
    'A+': '#4c1',
    'A': '#97ca00',
    'B': '#dfb317',
    'C': '#fe7d37',
    'D': '#e05d44',
    'F': '#e05d44'
  };
  
  const color = colors[score.grade];
  const text = score.grade;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="92" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h53v20H0z"/>
    <path fill="${color}" d="M53 0h39v20H53z"/>
    <path fill="url(#b)" d="M0 0h92v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="26.5" y="15" fill="#010101" fill-opacity=".3">quality</text>
    <text x="26.5" y="14">quality</text>
    <text x="71.5" y="15" fill="#010101" fill-opacity=".3">${text}</text>
    <text x="71.5" y="14">${text}</text>
  </g>
</svg>`;
}

/**
 * Generates a detailed quality report.
 */
export function generateQualityReport(metrics: QualityMetrics, score: QualityScore): string {
  const lines: string[] = [];
  
  lines.push('==========================================');
  lines.push('  Cardplay Test Quality Report');
  lines.push('==========================================');
  lines.push('');
  lines.push(`Overall Grade: ${score.grade} (${score.total.toFixed(1)}/100)`);
  lines.push('');
  lines.push('Score Breakdown:');
  lines.push(`  Coverage:       ${score.breakdown.coverage.toFixed(1)}/100`);
  lines.push(`  Test Diversity: ${score.breakdown.testDiversity.toFixed(1)}/100`);
  lines.push(`  Test Speed:     ${score.breakdown.testSpeed.toFixed(1)}/100`);
  lines.push(`  Reliability:    ${score.breakdown.testReliability.toFixed(1)}/100`);
  lines.push('');
  lines.push('Test Metrics:');
  lines.push(`  Total Tests:          ${metrics.testCount}`);
  lines.push(`  Property Tests:       ${metrics.propertyTests}`);
  lines.push(`  Fuzz Tests:           ${metrics.fuzzTests}`);
  lines.push(`  Snapshot Tests:       ${metrics.snapshotTests}`);
  lines.push(`  Performance Tests:    ${metrics.performanceBenchmarks}`);
  lines.push(`  Regression Tests:     ${metrics.regressionTests}`);
  lines.push(`  Average Duration:     ${(metrics.testDuration / Math.max(1, metrics.testCount)).toFixed(1)}ms`);
  lines.push(`  Failure Rate:         ${(metrics.failureRate * 100).toFixed(2)}%`);
  lines.push('');
  
  if (score.suggestions.length > 0) {
    lines.push('Suggestions for Improvement:');
    score.suggestions.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s}`);
    });
    lines.push('');
  }
  
  lines.push('==========================================');
  
  return lines.join('\n');
}
