/**
 * @fileoverview Registry V2 Reports
 * 
 * Generates health reports, coverage matrices, and statistics for registry state.
 * 
 * References:
 * - docs/registry-api.md
 * - docs/adapter-cost-model.md (aspirational)
 * 
 * @module registry/v2/reports
 */

import type { RegistrySnapshot, RegistryEntryType } from './types';
import { calculateRiskLevel, RiskLevel } from './policy';
import { validateSnapshot } from './validate';

/**
 * Health report for a registry snapshot.
 */
export interface HealthReport {
  /** Overall health status */
  status: 'healthy' | 'warning' | 'error';
  
  /** Summary statistics */
  summary: {
    /** Total entries by type */
    byType: Record<RegistryEntryType, number>;
    /** Total entries */
    total: number;
    /** Active entries */
    active: number;
    /** Builtin entries */
    builtin: number;
    /** Third-party entries */
    thirdParty: number;
  };
  
  /** Risk analysis */
  risk: {
    /** Count by risk level */
    byLevel: Record<RiskLevel, number>;
    /** High/critical risk entries */
    highRisk: Array<{ id: string; type: RegistryEntryType; risk: RiskLevel }>;
  };
  
  /** Validation issues */
  validation: {
    /** Error count */
    errors: number;
    /** Warning count */
    warnings: number;
    /** All validation messages */
    messages: Array<{ id: string; severity: string; message: string }>;
  };
  
  /** Trust/signature analysis */
  trust: {
    /** Verified entries */
    verified: number;
    /** Unverified entries */
    unverified: number;
    /** Unverified high-risk entries */
    unverifiedHighRisk: number;
  };
  
  /** Pack analysis */
  packs: {
    /** Unique packs */
    count: number;
    /** Pack IDs and entry counts */
    byPack: Record<string, number>;
  };
}

/**
 * Generates a health report for a registry snapshot.
 */
export function generateHealthReport(snapshot: RegistrySnapshot): HealthReport {
  const byType: Record<string, number> = {};
  let total = 0;
  let active = 0;
  let builtin = 0;
  let thirdParty = 0;
  
  const riskByLevel: Record<RiskLevel, number> = {
    [RiskLevel.SAFE]: 0,
    [RiskLevel.LOW]: 0,
    [RiskLevel.MEDIUM]: 0,
    [RiskLevel.HIGH]: 0,
    [RiskLevel.CRITICAL]: 0,
  };
  const highRisk: Array<{ id: string; type: RegistryEntryType; risk: RiskLevel }> = [];
  
  let verified = 0;
  let unverified = 0;
  let unverifiedHighRisk = 0;
  
  const byPack: Record<string, number> = {};
  
  // Collect statistics
  for (const [entryType, entries] of Object.entries(snapshot.entries)) {
    const type = entryType as RegistryEntryType;
    byType[type] = entries.length;
    total += entries.length;
    
    for (const entry of entries) {
      // Active/builtin counts
      if (entry.provenance.active) active++;
      if (entry.provenance.builtin) {
        builtin++;
      } else {
        thirdParty++;
      }
      
      // Risk analysis
      const capabilities = entry.provenance?.requiredCapabilities ?? [];
      const risk = calculateRiskLevel(capabilities);
      riskByLevel[risk]++;
      
      if (risk === RiskLevel.HIGH || risk === RiskLevel.CRITICAL) {
        if (entry.provenance) {
          highRisk.push({ id: entry.provenance.id, type, risk });
        
          if (!entry.provenance.trust?.verified && !entry.provenance.builtin) {
            unverifiedHighRisk++;
          }
        }
      }
      
      // Trust analysis
      if (entry.provenance?.trust?.verified) {
        verified++;
      } else if (!entry.provenance.builtin) {
        unverified++;
      }
      
      // Pack analysis
      const packId = entry.provenance.source.packId;
      byPack[packId] = (byPack[packId] ?? 0) + 1;
    }
  }
  
  // Validation
  const validationResult = validateSnapshot(snapshot);
  const validationMessages = validationResult.messages.map(m => ({
    id: m.field ?? 'unknown',
    severity: m.severity,
    message: m.message,
  }));
  const errors = validationResult.messages.filter(m => m.severity === 'error').length;
  const warnings = validationResult.messages.filter(m => m.severity === 'warning').length;
  
  // Overall status
  let status: 'healthy' | 'warning' | 'error';
  if (errors > 0 || unverifiedHighRisk > 0) {
    status = 'error';
  } else if (warnings > 0 || unverified > 0) {
    status = 'warning';
  } else {
    status = 'healthy';
  }
  
  return {
    status,
    summary: {
      byType: byType as Record<RegistryEntryType, number>,
      total,
      active,
      builtin,
      thirdParty,
    },
    risk: {
      byLevel: riskByLevel as Record<RiskLevel, number>,
      highRisk,
    },
    validation: {
      errors,
      warnings,
      messages: validationMessages,
    },
    trust: {
      verified,
      unverified,
      unverifiedHighRisk,
    },
    packs: {
      count: Object.keys(byPack).length,
      byPack,
    },
  };
}

/**
 * Formats a health report as human-readable text.
 */
export function formatHealthReport(report: HealthReport): string {
  const lines: string[] = [];
  
  lines.push('# Registry Health Report');
  lines.push('');
  lines.push(`Status: ${report.status.toUpperCase()}`);
  lines.push('');
  
  lines.push('## Summary');
  lines.push(`Total entries: ${report.summary.total}`);
  lines.push(`Active: ${report.summary.active}`);
  lines.push(`Builtin: ${report.summary.builtin}`);
  lines.push(`Third-party: ${report.summary.thirdParty}`);
  lines.push('');
  
  lines.push('### By Type');
  for (const [type, count] of Object.entries(report.summary.byType)) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push('');
  
  lines.push('## Risk Analysis');
  for (const [level, count] of Object.entries(report.risk.byLevel)) {
    lines.push(`  ${level}: ${count}`);
  }
  if (report.risk.highRisk.length > 0) {
    lines.push('');
    lines.push('### High-Risk Entries');
    for (const entry of report.risk.highRisk) {
      lines.push(`  - ${entry.id} (${entry.type}): ${entry.risk}`);
    }
  }
  lines.push('');
  
  lines.push('## Trust');
  lines.push(`Verified: ${report.trust.verified}`);
  lines.push(`Unverified: ${report.trust.unverified}`);
  if (report.trust.unverifiedHighRisk > 0) {
    lines.push(`⚠️  Unverified high-risk: ${report.trust.unverifiedHighRisk}`);
  }
  lines.push('');
  
  lines.push('## Validation');
  lines.push(`Errors: ${report.validation.errors}`);
  lines.push(`Warnings: ${report.validation.warnings}`);
  if (report.validation.messages.length > 0) {
    lines.push('');
    for (const msg of report.validation.messages) {
      const icon = msg.severity === 'error' ? '❌' : '⚠️';
      lines.push(`  ${icon} ${msg.id}: ${msg.message}`);
    }
  }
  lines.push('');
  
  lines.push('## Packs');
  lines.push(`Total packs: ${report.packs.count}`);
  for (const [packId, count] of Object.entries(report.packs.byPack)) {
    lines.push(`  ${packId}: ${count} entries`);
  }
  
  return lines.join('\n');
}

/**
 * Coverage matrix for compatibility testing (aspirational).
 * 
 * This would track which combinations of port types, adapters,
 * and cards have been tested and validated.
 */
export interface CoverageMatrix {
  /** Port type pairs that have been tested */
  portTypePairs: Array<{ from: string; to: string; tested: boolean; adapter?: string }>;
  
  /** Card combinations tested */
  cardCombinations: Array<{ cards: string[]; tested: boolean }>;
  
  /** Overall coverage percentage */
  coverage: number;
}

/**
 * Generates a coverage matrix (placeholder/aspirational).
 */
export function generateCoverageMatrix(_snapshot: RegistrySnapshot): CoverageMatrix {
  // This is aspirational - would require test result data
  return {
    portTypePairs: [],
    cardCombinations: [],
    coverage: 0,
  };
}
