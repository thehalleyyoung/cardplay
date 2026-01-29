/**
 * @fileoverview KB Memory Profiler
 *
 * N166: Profile KB memory usage
 * N167: Identify memory-heavy KB sections
 * N168: Optimize KB representation for memory
 * N169: Add KB garbage collection for unused rules
 * N170: Add KB compression for large fact sets
 * N173: Add memory monitoring dashboard (dev-only)
 * N174: Add memory profiling tools (dev-only)
 *
 * Provides tools for monitoring and optimizing KB memory usage.
 *
 * @module @cardplay/ai/engine/kb-memory-profiler
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Memory usage breakdown by KB section.
 */
export interface KBMemoryBreakdown {
  readonly timestamp: number;
  readonly totalEstimatedBytes: number;
  readonly sections: KBSectionMemory[];
  readonly factCount: number;
  readonly ruleCount: number;
}

/**
 * Memory usage for a KB section.
 */
export interface KBSectionMemory {
  readonly name: string;
  readonly estimatedBytes: number;
  readonly factCount: number;
  readonly ruleCount: number;
  readonly isHeavy: boolean;
  readonly compressionPotential: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Garbage collection result.
 */
export interface GCResult {
  readonly freedBytes: number;
  readonly removedFacts: number;
  readonly removedRules: number;
  readonly duration: number;
}

/**
 * Memory optimization suggestion.
 */
export interface MemoryOptimization {
  readonly section: string;
  readonly type: 'gc' | 'compression' | 'lazy-load' | 'unload' | 'dedupe';
  readonly priority: 'high' | 'medium' | 'low';
  readonly description: string;
  readonly estimatedSavings: number;
}

/**
 * Memory dashboard data.
 */
export interface MemoryDashboard {
  readonly currentUsage: KBMemoryBreakdown;
  readonly history: MemoryHistoryPoint[];
  readonly optimizations: MemoryOptimization[];
  readonly budgetStatus: {
    readonly budgetBytes: number;
    readonly usedBytes: number;
    readonly percentUsed: number;
    readonly status: 'ok' | 'warning' | 'critical';
  };
}

/**
 * Historical memory point.
 */
export interface MemoryHistoryPoint {
  readonly timestamp: number;
  readonly totalBytes: number;
  readonly queryCount: number;
}

/**
 * KB section info (for profiling).
 */
export interface KBSectionInfo {
  readonly name: string;
  readonly source: string;
  readonly loaded: boolean;
  readonly optional: boolean;
}

// ============================================================================
// KB MEMORY PROFILER
// ============================================================================

/**
 * Memory profiler for the Prolog KB.
 * N166-N174: Memory profiling and optimization.
 */
class KBMemoryProfiler {
  private sections: Map<string, KBSectionInfo> = new Map();
  private history: MemoryHistoryPoint[] = [];
  private maxHistory = 1000;
  private budgetBytes = 20 * 1024 * 1024; // 20MB default
  private lastGC: number = 0;
  private enabled = false;

  /**
   * Enable memory profiling.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable memory profiling.
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Register a KB section for tracking.
   */
  registerSection(name: string, source: string, optional = false): void {
    this.sections.set(name, {
      name,
      source,
      loaded: false,
      optional,
    });
  }

  /**
   * Mark a section as loaded.
   */
  markLoaded(name: string): void {
    const section = this.sections.get(name);
    if (section) {
      this.sections.set(name, { ...section, loaded: true });
    }
  }

  /**
   * Mark a section as unloaded.
   */
  markUnloaded(name: string): void {
    const section = this.sections.get(name);
    if (section) {
      this.sections.set(name, { ...section, loaded: false });
    }
  }

  /**
   * Estimate memory usage of a KB source string.
   * N166: Profile KB memory usage.
   */
  estimateSourceMemory(source: string): number {
    // Rough estimation: 2 bytes per character + overhead
    const charBytes = source.length * 2;
    
    // Estimate parsed structure overhead (2-3x source size)
    const parseOverhead = charBytes * 2.5;
    
    // Index overhead
    const indexOverhead = this.countPredicates(source) * 100;
    
    return Math.ceil(charBytes + parseOverhead + indexOverhead);
  }

  /**
   * Count predicates in source.
   */
  private countPredicates(source: string): number {
    // Count predicate definitions (name/arity)
    const predicatePattern = /^[a-z_]\w*\s*\(/gm;
    const matches = source.match(predicatePattern);
    return matches?.length ?? 0;
  }

  /**
   * Count facts vs rules in source.
   */
  private countFactsAndRules(source: string): { facts: number; rules: number } {
    // Count rules (clauses with :-)
    const rulePattern = /:-/g;
    const rules = (source.match(rulePattern) ?? []).length;
    
    // Count all clauses (ending with .)
    const clausePattern = /\.\s*$/gm;
    const totalClauses = (source.match(clausePattern) ?? []).length;
    
    // Also count inline periods followed by newline or whitespace
    const inlineClausePattern = /\)\s*\./g;
    const inlineClauses = (source.match(inlineClausePattern) ?? []).length;
    
    // Facts = total clauses - rules (approximate)
    const estimatedClauses = Math.max(totalClauses, inlineClauses);
    const facts = Math.max(0, estimatedClauses - rules);
    
    return { facts, rules };
  }

  /**
   * Get memory breakdown by section.
   * N167: Identify memory-heavy KB sections.
   */
  getMemoryBreakdown(): KBMemoryBreakdown {
    const sections: KBSectionMemory[] = [];
    let totalBytes = 0;
    let totalFacts = 0;
    let totalRules = 0;

    for (const [name, info] of this.sections) {
      if (!info.loaded) continue;

      const estimatedBytes = this.estimateSourceMemory(info.source);
      const { facts, rules } = this.countFactsAndRules(info.source);
      
      // Determine if heavy (>1MB)
      const isHeavy = estimatedBytes > 1024 * 1024;
      
      // Determine compression potential based on repetition
      const compressionPotential = this.estimateCompressionPotential(info.source);

      sections.push({
        name,
        estimatedBytes,
        factCount: facts,
        ruleCount: rules,
        isHeavy,
        compressionPotential,
      });

      totalBytes += estimatedBytes;
      totalFacts += facts;
      totalRules += rules;
    }

    // Sort by size descending
    sections.sort((a, b) => b.estimatedBytes - a.estimatedBytes);

    return {
      timestamp: Date.now(),
      totalEstimatedBytes: totalBytes,
      sections,
      factCount: totalFacts,
      ruleCount: totalRules,
    };
  }

  /**
   * Estimate compression potential of source.
   * N170: KB compression for large fact sets.
   */
  private estimateCompressionPotential(source: string): 'none' | 'low' | 'medium' | 'high' {
    // Check for repeated patterns (similar facts)
    const lines = source.split('\n').filter(l => l.trim());
    if (lines.length < 10) return 'none';

    // Sample first 100 lines and look for patterns
    const sample = lines.slice(0, 100);
    const prefixes = new Map<string, number>();

    for (const line of sample) {
      const prefix = line.slice(0, 20);
      prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1);
    }

    // High repetition = high compression potential
    const maxRepeat = Math.max(...prefixes.values());
    const repeatRatio = maxRepeat / sample.length;

    if (repeatRatio > 0.5) return 'high';
    if (repeatRatio > 0.3) return 'medium';
    if (repeatRatio > 0.1) return 'low';
    return 'none';
  }

  /**
   * Simulate garbage collection of unused predicates.
   * N169: KB garbage collection for unused rules.
   */
  simulateGC(usedPredicates: Set<string>): GCResult {
    const startTime = performance.now();
    let freedBytes = 0;
    let removedFacts = 0;
    let removedRules = 0;

    for (const [_name, info] of this.sections) {
      if (!info.loaded) continue;

      // Count predicates that could be removed
      const allPredicates = this.extractPredicates(info.source);
      const unusedCount = allPredicates.filter(p => !usedPredicates.has(p)).length;

      if (unusedCount > 0) {
        // Estimate bytes that could be freed
        const avgPredicateSize = this.estimateSourceMemory(info.source) / allPredicates.length;
        freedBytes += unusedCount * avgPredicateSize;
        removedFacts += Math.floor(unusedCount * 0.7);
        removedRules += Math.floor(unusedCount * 0.3);
      }
    }

    const duration = performance.now() - startTime;
    this.lastGC = Date.now();

    return {
      freedBytes,
      removedFacts,
      removedRules,
      duration,
    };
  }

  /**
   * Extract predicate names from source.
   */
  private extractPredicates(source: string): string[] {
    // Match predicate names at start of line or after whitespace
    const pattern = /(?:^|\s)([a-z_]\w*)\s*\(/gm;
    const predicates: string[] = [];
    let match;

    while ((match = pattern.exec(source)) !== null) {
      if (match[1] && !predicates.includes(match[1])) {
        predicates.push(match[1]);
      }
    }

    return predicates;
  }

  /**
   * Get optimization suggestions.
   * N168: Optimize KB representation for memory.
   */
  getOptimizations(): MemoryOptimization[] {
    const breakdown = this.getMemoryBreakdown();
    const optimizations: MemoryOptimization[] = [];

    for (const section of breakdown.sections) {
      // Suggest GC for large sections
      if (section.isHeavy) {
        optimizations.push({
          section: section.name,
          type: 'gc',
          priority: 'high',
          description: `Run garbage collection on ${section.name} to remove unused predicates`,
          estimatedSavings: Math.floor(section.estimatedBytes * 0.2),
        });
      }

      // Suggest compression for high-potential sections
      if (section.compressionPotential === 'high') {
        optimizations.push({
          section: section.name,
          type: 'compression',
          priority: 'medium',
          description: `Compress repeated patterns in ${section.name}`,
          estimatedSavings: Math.floor(section.estimatedBytes * 0.4),
        });
      }

      // Suggest lazy loading for optional sections
      const info = this.sections.get(section.name);
      if (info?.optional && section.estimatedBytes > 100 * 1024) {
        optimizations.push({
          section: section.name,
          type: 'lazy-load',
          priority: 'medium',
          description: `Lazy load optional section ${section.name}`,
          estimatedSavings: section.estimatedBytes,
        });
      }

      // Suggest deduplication for sections with many similar facts
      if (section.factCount > 100 && section.compressionPotential !== 'none') {
        optimizations.push({
          section: section.name,
          type: 'dedupe',
          priority: 'low',
          description: `Deduplicate similar facts in ${section.name}`,
          estimatedSavings: Math.floor(section.estimatedBytes * 0.15),
        });
      }
    }

    // Sort by estimated savings descending
    optimizations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);

    return optimizations;
  }

  /**
   * Record a history point.
   */
  recordHistoryPoint(queryCount: number): void {
    if (!this.enabled) return;

    const breakdown = this.getMemoryBreakdown();
    this.history.push({
      timestamp: Date.now(),
      totalBytes: breakdown.totalEstimatedBytes,
      queryCount,
    });

    // Limit history
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * Get memory dashboard data.
   * N173: Memory monitoring dashboard.
   */
  getDashboard(): MemoryDashboard {
    const currentUsage = this.getMemoryBreakdown();
    const optimizations = this.getOptimizations();

    let status: 'ok' | 'warning' | 'critical';
    const percentUsed = (currentUsage.totalEstimatedBytes / this.budgetBytes) * 100;

    if (percentUsed > 90) {
      status = 'critical';
    } else if (percentUsed > 70) {
      status = 'warning';
    } else {
      status = 'ok';
    }

    return {
      currentUsage,
      history: [...this.history],
      optimizations,
      budgetStatus: {
        budgetBytes: this.budgetBytes,
        usedBytes: currentUsage.totalEstimatedBytes,
        percentUsed,
        status,
      },
    };
  }

  /**
   * Set memory budget.
   */
  setBudget(bytes: number): void {
    this.budgetBytes = bytes;
  }

  /**
   * Format a memory report.
   * N174: Memory profiling tools.
   */
  formatReport(): string {
    const dashboard = this.getDashboard();
    const lines: string[] = [];

    lines.push('=== KB Memory Report ===');
    lines.push(`Status: ${dashboard.budgetStatus.status.toUpperCase()}`);
    lines.push(`Used: ${this.formatBytes(dashboard.budgetStatus.usedBytes)} / ${this.formatBytes(dashboard.budgetStatus.budgetBytes)} (${dashboard.budgetStatus.percentUsed.toFixed(1)}%)`);
    lines.push(`Total facts: ${dashboard.currentUsage.factCount}`);
    lines.push(`Total rules: ${dashboard.currentUsage.ruleCount}`);
    lines.push('');

    lines.push('Sections by size:');
    for (const section of dashboard.currentUsage.sections.slice(0, 5)) {
      const heavy = section.isHeavy ? ' [HEAVY]' : '';
      lines.push(`  ${section.name}: ${this.formatBytes(section.estimatedBytes)}${heavy}`);
    }

    if (dashboard.optimizations.length > 0) {
      lines.push('');
      lines.push('Top optimizations:');
      for (const opt of dashboard.optimizations.slice(0, 3)) {
        lines.push(`  [${opt.priority}] ${opt.description} (save ~${this.formatBytes(opt.estimatedSavings)})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format bytes as human-readable string.
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }

  /**
   * Export profiling data.
   */
  exportJSON(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      dashboard: this.getDashboard(),
      sections: Object.fromEntries(this.sections),
      lastGC: this.lastGC,
    }, null, 2);
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.sections.clear();
    this.history = [];
    this.lastGC = 0;
  }

  /**
   * Reset profiler.
   */
  reset(): void {
    this.clear();
    this.enabled = false;
    this.budgetBytes = 20 * 1024 * 1024;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let profilerInstance: KBMemoryProfiler | null = null;

/**
 * Get the singleton KB memory profiler.
 */
export function getKBMemoryProfiler(): KBMemoryProfiler {
  if (!profilerInstance) {
    profilerInstance = new KBMemoryProfiler();
  }
  return profilerInstance;
}

/**
 * Reset the KB memory profiler (for testing).
 */
export function resetKBMemoryProfiler(): void {
  profilerInstance?.reset();
  profilerInstance = null;
}

export { KBMemoryProfiler };
