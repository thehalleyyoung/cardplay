/**
 * Bundle Size Monitoring
 * 
 * Tracks and reports bundle sizes to ensure they stay within budget.
 */

export interface BundleSizeBudget {
  /** Module name */
  name: string;
  
  /** Max size in bytes */
  maxSize: number;
  
  /** Warning threshold (percentage of max) */
  warningThreshold: number;
}

export interface BundleReport {
  /** Module name */
  name: string;
  
  /** Actual size in bytes */
  size: number;
  
  /** Budget (if defined) */
  budget?: BundleSizeBudget;
  
  /** Is over budget */
  overBudget: boolean;
  
  /** Is near budget (warning) */
  nearBudget: boolean;
  
  /** Percentage of budget used */
  budgetUsage?: number;
}

/**
 * Default bundle size budgets (in bytes)
 */
export const DEFAULT_BUDGETS: BundleSizeBudget[] = [
  // Core bundles
  { name: 'main', maxSize: 500 * 1024, warningThreshold: 0.9 }, // 500KB
  { name: 'vendor', maxSize: 300 * 1024, warningThreshold: 0.9 }, // 300KB
  { name: 'ui', maxSize: 200 * 1024, warningThreshold: 0.9 }, // 200KB
  
  // Optional features (lazy loaded)
  { name: 'ai', maxSize: 400 * 1024, warningThreshold: 0.9 }, // 400KB (Prolog)
  { name: 'notation', maxSize: 150 * 1024, warningThreshold: 0.9 }, // 150KB
  { name: 'export', maxSize: 100 * 1024, warningThreshold: 0.9 }, // 100KB
  { name: 'community', maxSize: 80 * 1024, warningThreshold: 0.9 }, // 80KB
];

/**
 * Bundle size monitor
 */
export class BundleSizeMonitor {
  private budgets: Map<string, BundleSizeBudget>;

  constructor(budgets: BundleSizeBudget[] = DEFAULT_BUDGETS) {
    this.budgets = new Map(budgets.map(b => [b.name, b]));
  }

  /**
   * Check bundle size against budget
   */
  check(name: string, size: number): BundleReport {
    const budget = this.budgets.get(name);
    
    const report: BundleReport = {
      name,
      size,
      overBudget: false,
      nearBudget: false,
      ...(budget ? { budget } : {}),
    };

    if (budget) {
      report.budgetUsage = (size / budget.maxSize) * 100;
      report.overBudget = size > budget.maxSize;
      report.nearBudget = size > budget.maxSize * budget.warningThreshold;
    }

    return report;
  }

  /**
   * Generate full report for all modules
   */
  generateReport(sizes: Map<string, number>): BundleReport[] {
    const reports: BundleReport[] = [];

    for (const [name, size] of sizes) {
      reports.push(this.check(name, size));
    }

    return reports;
  }

  /**
   * Get human-readable report
   */
  formatReport(reports: BundleReport[]): string {
    let output = 'Bundle Size Report:\n\n';

    for (const report of reports) {
      const sizeKB = (report.size / 1024).toFixed(1);
      const status = report.overBudget ? '❌ OVER' : report.nearBudget ? '⚠️  WARN' : '✅ OK';
      
      output += `${status} ${report.name}: ${sizeKB} KB`;
      
      if (report.budget) {
        const budgetKB = (report.budget.maxSize / 1024).toFixed(1);
        output += ` / ${budgetKB} KB (${report.budgetUsage?.toFixed(1)}%)`;
      }
      
      output += '\n';
    }

    return output;
  }

  /**
   * Add or update budget
   */
  setBudget(budget: BundleSizeBudget): void {
    this.budgets.set(budget.name, budget);
  }
}

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Analyze bundle composition
 */
export interface BundleComposition {
  /** Total size */
  total: number;
  
  /** Size by module */
  modules: Map<string, number>;
  
  /** Largest modules */
  largest: Array<{ name: string; size: number; percentage: number }>;
}

export function analyzeBundleComposition(sizes: Map<string, number>): BundleComposition {
  const total = Array.from(sizes.values()).reduce((sum, size) => sum + size, 0);
  
  const largest = Array.from(sizes.entries())
    .map(([name, size]) => ({
      name,
      size,
      percentage: (size / total) * 100,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  return {
    total,
    modules: new Map(sizes),
    largest,
  };
}
