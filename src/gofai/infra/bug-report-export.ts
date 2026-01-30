/**
 * @file Bug Report Export
 * @module gofai/infra/bug-report-export
 * 
 * Implements Step 349: Add a bug-report export: include utterance, CPL, plan, diff,
 * and provenance traces without including audio/IP data.
 * 
 * This module provides functionality to create detailed bug reports that help
 * diagnose GOFAI issues without exposing sensitive user data like audio content
 * or proprietary musical ideas.
 * 
 * A bug report includes:
 * 1. System information (versions, environment)
 * 2. Utterance and CPL compilation
 * 3. Plan and execution details
 * 4. Diff summaries (not raw audio)
 * 5. Provenance traces
 * 6. Anonymized project state (structure only, no note data)
 * 
 * Explicitly excluded:
 * - Audio buffers
 * - MIDI note pitches and timing (only counts/ranges)
 * - User identifiers
 * - File paths that might expose user identity
 * - Any proprietary content
 * 
 * @see gofai_goalB.md Step 349
 */

// ============================================================================
// Imports
// ============================================================================

import type {
  EditPackage,
  CPLIntent,
  CPLPlan,
  ExecutionDiff,
  Diagnostic,
} from '../execution/edit-package.js';

import type {
  DiscourseState,
  DiscourseReferent,
  EditHistoryReferent,
} from '../pragmatics/discourse-model.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for bug report generation.
 */
export interface BugReportConfig {
  /** Include full discourse state? */
  readonly includeDiscourseState: boolean;

  /** Include edit history? */
  readonly includeEditHistory: boolean;

  /** Maximum number of prior edits to include */
  readonly maxPriorEdits: number;

  /** Include anonymized project statistics? */
  readonly includeProjectStats: boolean;

  /** Include performance metrics? */
  readonly includePerformanceMetrics: boolean;

  /** Anonymize all IDs and names? */
  readonly anonymize: boolean;
}

/**
 * Default configuration.
 */
export const DEFAULT_BUG_REPORT_CONFIG: BugReportConfig = {
  includeDiscourseState: true,
  includeEditHistory: true,
  maxPriorEdits: 5,
  includeProjectStats: true,
  includePerformanceMetrics: true,
  anonymize: true,
};

/**
 * A complete bug report.
 */
export interface BugReport {
  /** Report metadata */
  readonly metadata: BugReportMetadata;

  /** System information */
  readonly system: SystemInfo;

  /** The failing operation (if applicable) */
  readonly failingOperation: FailingOperation | undefined;

  /** Recent edit history */
  readonly recentEdits: readonly AnonymizedEditSummary[];

  /** Current discourse state summary */
  readonly discourseStateSummary: DiscourseStateSummary | undefined;

  /** Anonymized project statistics */
  readonly projectStats: ProjectStats | undefined;

  /** Performance metrics */
  readonly performanceMetrics: PerformanceMetrics | undefined;

  /** Diagnostics and errors */
  readonly diagnostics: readonly Diagnostic[];
}

/**
 * Report metadata.
 */
export interface BugReportMetadata {
  /** When the report was generated */
  readonly timestamp: number;

  /** Report format version */
  readonly version: string;

  /** Report ID (random, for tracking) */
  readonly reportId: string;

  /** User-provided description (optional) */
  readonly description: string | undefined;

  /** Category of issue */
  readonly category: BugReportCategory;
}

/**
 * Categories of bug reports.
 */
export type BugReportCategory =
  | 'parsing_failure'
  | 'ambiguity_unresolved'
  | 'planning_failure'
  | 'execution_failure'
  | 'constraint_violation'
  | 'unexpected_result'
  | 'performance_issue'
  | 'crash'
  | 'other';

/**
 * System information.
 */
export interface SystemInfo {
  /** GOFAI compiler version */
  readonly gofaiVersion: string;

  /** CardPlay version */
  readonly cardplayVersion: string;

  /** Platform */
  readonly platform: string;

  /** Browser/runtime */
  readonly runtime: string;

  /** Loaded extension namespaces */
  readonly loadedExtensions: readonly string[];

  /** Active board type */
  readonly activeBoardType: string | undefined;

  /** Lexicon size */
  readonly lexiconSize: number;

  /** Grammar rule count */
  readonly grammarRuleCount: number;
}

/**
 * Information about the failing operation.
 */
export interface FailingOperation {
  /** The utterance that failed */
  readonly utterance: string;

  /** CPL-Intent (if parsing succeeded) */
  readonly intent: AnonymizedCPLIntent | undefined;

  /** CPL-Plan (if planning succeeded) */
  readonly plan: AnonymizedCPLPlan | undefined;

  /** Execution diff (if execution attempted) */
  readonly diff: AnonymizedDiff | undefined;

  /** At which stage did it fail? */
  readonly failureStage: PipelineStage;

  /** Error message */
  readonly errorMessage: string;

  /** Error details */
  readonly errorDetails: Record<string, unknown> | undefined;

  /** Compilation traces */
  readonly traces: readonly CompilationTrace[];
}

/**
 * Pipeline stages.
 */
export type PipelineStage =
  | 'normalization'
  | 'tokenization'
  | 'parsing'
  | 'semantic_composition'
  | 'pragmatic_resolution'
  | 'typecheck'
  | 'planning'
  | 'execution'
  | 'diff_computation'
  | 'constraint_checking';

/**
 * A compilation trace entry.
 */
export interface CompilationTrace {
  readonly stage: PipelineStage;
  readonly timestamp: number;
  readonly message: string;
  readonly data: Record<string, unknown> | undefined;
}

/**
 * Anonymized CPL-Intent.
 */
export interface AnonymizedCPLIntent {
  readonly type: 'cpl:intent';
  readonly goalCount: number;
  readonly goalTypes: readonly string[];
  readonly constraintCount: number;
  readonly constraintTypes: readonly string[];
  readonly scopeType: string;
  readonly hasContext: boolean;
}

/**
 * Anonymized CPL-Plan.
 */
export interface AnonymizedCPLPlan {
  readonly type: 'cpl:plan';
  readonly opcodeCount: number;
  readonly opcodeTypes: readonly string[];
  readonly costScore: number;
  readonly satisfactionScore: number;
  readonly preconditionCount: number;
  readonly postconditionCount: number;
}

/**
 * Anonymized diff.
 */
export interface AnonymizedDiff {
  readonly changeCount: number;
  readonly changeTypes: Record<string, number>;
  readonly entityTypes: Record<string, number>;
  readonly constraintVerificationsPassed: number;
  readonly constraintVerificationsFailed: number;
}

/**
 * Anonymized edit summary.
 */
export interface AnonymizedEditSummary {
  readonly turnNumber: number;
  readonly axisTouched: string | undefined;
  readonly scopeType: string;
  readonly layerCount: number;
  readonly changeCount: number;
  readonly wasUndone: boolean;
  readonly executionStatus: string;
}

/**
 * Discourse state summary.
 */
export interface DiscourseStateSummary {
  readonly turnNumber: number;
  readonly referentCount: number;
  readonly referentTypes: Record<string, number>;
  readonly editHistorySize: number;
  readonly qudStackSize: number;
  readonly commonGroundSize: number;
  readonly hasActiveTopic: boolean;
}

/**
 * Project statistics (anonymized).
 */
export interface ProjectStats {
  readonly trackCount: number;
  readonly eventCount: number;
  readonly cardCount: number;
  readonly sectionCount: number;
  readonly durationBars: number;
  readonly eventKindDistribution: Record<string, number>;
  readonly cardTypeDistribution: Record<string, number>;
}

/**
 * Performance metrics.
 */
export interface PerformanceMetrics {
  readonly parsingTimeMs: number | undefined;
  readonly planningTimeMs: number | undefined;
  readonly executionTimeMs: number | undefined;
  readonly totalTimeMs: number | undefined;
  readonly memoryUsageMb: number | undefined;
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Create a bug report from a failing edit package.
 * 
 * @param editPackage The edit package that failed or produced unexpected results
 * @param discourseState Current discourse state
 * @param systemInfo System information
 * @param config Report configuration
 * @param userDescription Optional user-provided description
 * @returns A complete bug report
 */
export function createBugReportFromFailedEdit(
  editPackage: EditPackage,
  discourseState: DiscourseState,
  systemInfo: SystemInfo,
  config: BugReportConfig = DEFAULT_BUG_REPORT_CONFIG,
  userDescription?: string
): BugReport {
  const reportId = generateReportId();
  const timestamp = Date.now();

  // Determine category
  const category = categorizeBugReport(editPackage);

  // Extract failing operation
  const failingOperation = extractFailingOperation(editPackage);

  // Extract recent edits
  const recentEdits = config.includeEditHistory
    ? extractRecentEdits(discourseState, config.maxPriorEdits, config.anonymize)
    : [];

  // Summarize discourse state
  const discourseStateSummary = config.includeDiscourseState
    ? summarizeDiscourseState(discourseState)
    : undefined;

  // Extract diagnostics
  const diagnostics = editPackage.diagnostics || [];

  return {
    metadata: {
      timestamp,
      version: '1.0.0',
      reportId,
      description: userDescription,
      category,
    },
    system: systemInfo,
    failingOperation,
    recentEdits,
    discourseStateSummary,
    projectStats: undefined, // Would need project state access
    performanceMetrics: extractPerformanceMetrics(editPackage),
    diagnostics,
  };
}

/**
 * Create a bug report from a compilation failure (before execution).
 * 
 * @param utterance The utterance that failed
 * @param failureStage At which stage did it fail
 * @param errorMessage Error message
 * @param errorDetails Additional error details
 * @param traces Compilation traces
 * @param discourseState Current discourse state
 * @param systemInfo System information
 * @param config Report configuration
 * @param userDescription Optional user-provided description
 * @returns A complete bug report
 */
export function createBugReportFromCompilationFailure(
  utterance: string,
  failureStage: PipelineStage,
  errorMessage: string,
  errorDetails: Record<string, unknown> | undefined,
  traces: readonly CompilationTrace[],
  discourseState: DiscourseState,
  systemInfo: SystemInfo,
  config: BugReportConfig = DEFAULT_BUG_REPORT_CONFIG,
  userDescription?: string
): BugReport {
  const reportId = generateReportId();
  const timestamp = Date.now();

  const category = categorizeCompilationFailure(failureStage);

  const failingOperation: FailingOperation = {
    utterance,
    intent: undefined,
    plan: undefined,
    diff: undefined,
    failureStage,
    errorMessage,
    errorDetails,
    traces: [...traces],
  };

  const recentEdits = config.includeEditHistory
    ? extractRecentEdits(discourseState, config.maxPriorEdits, config.anonymize)
    : [];

  const discourseStateSummary = config.includeDiscourseState
    ? summarizeDiscourseState(discourseState)
    : undefined;

  return {
    metadata: {
      timestamp,
      version: '1.0.0',
      reportId,
      description: userDescription,
      category,
    },
    system: systemInfo,
    failingOperation,
    recentEdits,
    discourseStateSummary,
    projectStats: undefined,
    performanceMetrics: undefined,
    diagnostics: [],
  };
}

/**
 * Serialize a bug report to JSON.
 * 
 * @param report The bug report
 * @returns JSON string
 */
export function serializeBugReport(report: BugReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Serialize a bug report to a format suitable for GitHub issues.
 * 
 * @param report The bug report
 * @returns Markdown-formatted text
 */
export function formatBugReportForGitHub(report: BugReport): string {
  const lines: string[] = [];

  lines.push(`# GOFAI Bug Report: ${report.metadata.reportId}`);
  lines.push(``);
  lines.push(`**Category:** ${report.metadata.category}`);
  lines.push(`**Generated:** ${new Date(report.metadata.timestamp).toISOString()}`);
  lines.push(``);

  if (report.metadata.description) {
    lines.push(`## User Description`);
    lines.push(``);
    lines.push(report.metadata.description);
    lines.push(``);
  }

  lines.push(`## System Information`);
  lines.push(``);
  lines.push(`- GOFAI Version: ${report.system.gofaiVersion}`);
  lines.push(`- CardPlay Version: ${report.system.cardplayVersion}`);
  lines.push(`- Platform: ${report.system.platform}`);
  lines.push(`- Runtime: ${report.system.runtime}`);
  lines.push(`- Active Board: ${report.system.activeBoardType || 'none'}`);
  lines.push(`- Loaded Extensions: ${report.system.loadedExtensions.join(', ') || 'none'}`);
  lines.push(``);

  if (report.failingOperation) {
    lines.push(`## Failing Operation`);
    lines.push(``);
    lines.push(`**Utterance:** "${report.failingOperation.utterance}"`);
    lines.push(`**Failure Stage:** ${report.failingOperation.failureStage}`);
    lines.push(`**Error:** ${report.failingOperation.errorMessage}`);
    lines.push(``);

    if (report.failingOperation.intent) {
      lines.push(`**CPL-Intent:**`);
      lines.push(`- Goals: ${report.failingOperation.intent.goalCount} (${report.failingOperation.intent.goalTypes.join(', ')})`);
      lines.push(`- Constraints: ${report.failingOperation.intent.constraintCount} (${report.failingOperation.intent.constraintTypes.join(', ')})`);
      lines.push(`- Scope: ${report.failingOperation.intent.scopeType}`);
      lines.push(``);
    }

    if (report.failingOperation.plan) {
      lines.push(`**CPL-Plan:**`);
      lines.push(`- Opcodes: ${report.failingOperation.plan.opcodeCount} (${report.failingOperation.plan.opcodeTypes.join(', ')})`);
      lines.push(`- Cost Score: ${report.failingOperation.plan.costScore}`);
      lines.push(`- Satisfaction Score: ${report.failingOperation.plan.satisfactionScore}`);
      lines.push(``);
    }

    if (report.failingOperation.diff) {
      lines.push(`**Execution Diff:**`);
      lines.push(`- Total Changes: ${report.failingOperation.diff.changeCount}`);
      lines.push(`- Constraints Passed: ${report.failingOperation.diff.constraintVerificationsPassed}`);
      lines.push(`- Constraints Failed: ${report.failingOperation.diff.constraintVerificationsFailed}`);
      lines.push(``);
    }

    if (report.failingOperation.traces.length > 0) {
      lines.push(`**Compilation Traces:**`);
      lines.push(``);
      for (const trace of report.failingOperation.traces) {
        lines.push(`- [${trace.stage}] ${trace.message}`);
      }
      lines.push(``);
    }
  }

  if (report.discourseStateSummary) {
    lines.push(`## Discourse State`);
    lines.push(``);
    lines.push(`- Turn: ${report.discourseStateSummary.turnNumber}`);
    lines.push(`- Referents: ${report.discourseStateSummary.referentCount}`);
    lines.push(`- Edit History: ${report.discourseStateSummary.editHistorySize} entries`);
    lines.push(`- QUD Stack: ${report.discourseStateSummary.qudStackSize}`);
    lines.push(`- Active Topic: ${report.discourseStateSummary.hasActiveTopic ? 'yes' : 'no'}`);
    lines.push(``);
  }

  if (report.recentEdits.length > 0) {
    lines.push(`## Recent Edits`);
    lines.push(``);
    for (const edit of report.recentEdits) {
      lines.push(`- Turn ${edit.turnNumber}: ${edit.scopeType}, ${edit.layerCount} layers, ${edit.changeCount} changes${edit.wasUndone ? ' [UNDONE]' : ''}`);
    }
    lines.push(``);
  }

  if (report.diagnostics.length > 0) {
    lines.push(`## Diagnostics`);
    lines.push(``);
    for (const diag of report.diagnostics) {
      lines.push(`- [${diag.severity.toUpperCase()}] ${diag.code}: ${diag.message}`);
    }
    lines.push(``);
  }

  if (report.performanceMetrics) {
    lines.push(`## Performance Metrics`);
    lines.push(``);
    if (report.performanceMetrics.parsingTimeMs !== undefined) {
      lines.push(`- Parsing: ${report.performanceMetrics.parsingTimeMs}ms`);
    }
    if (report.performanceMetrics.planningTimeMs !== undefined) {
      lines.push(`- Planning: ${report.performanceMetrics.planningTimeMs}ms`);
    }
    if (report.performanceMetrics.executionTimeMs !== undefined) {
      lines.push(`- Execution: ${report.performanceMetrics.executionTimeMs}ms`);
    }
    if (report.performanceMetrics.totalTimeMs !== undefined) {
      lines.push(`- Total: ${report.performanceMetrics.totalTimeMs}ms`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*This report was automatically generated and contains no user audio or proprietary content.*`);

  return lines.join('\n');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random report ID.
 */
function generateReportId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `gofai-bug-${timestamp}-${random}`;
}

/**
 * Categorize a bug report based on edit package status.
 */
function categorizeBugReport(editPackage: EditPackage): BugReportCategory {
  if (editPackage.status.type === 'failed') {
    return 'execution_failure';
  }

  const failedConstraints = editPackage.diff.verifications.filter(v => !v.passed);
  if (failedConstraints.length > 0) {
    return 'constraint_violation';
  }

  if (editPackage.status.type === 'partial') {
    return 'unexpected_result';
  }

  return 'other';
}

/**
 * Categorize a compilation failure.
 */
function categorizeCompilationFailure(stage: PipelineStage): BugReportCategory {
  switch (stage) {
    case 'parsing':
    case 'tokenization':
    case 'normalization':
      return 'parsing_failure';
    case 'semantic_composition':
    case 'pragmatic_resolution':
      return 'ambiguity_unresolved';
    case 'planning':
      return 'planning_failure';
    case 'execution':
      return 'execution_failure';
    case 'constraint_checking':
      return 'constraint_violation';
    default:
      return 'other';
  }
}

/**
 * Extract failing operation from edit package.
 */
function extractFailingOperation(editPackage: EditPackage): FailingOperation {
  const intent = anonymizeCPLIntent(editPackage.intent);
  const plan = anonymizeCPLPlan(editPackage.plan);
  const diff = anonymizeDiff(editPackage.diff);

  let failureStage: PipelineStage = 'execution';
  let errorMessage = 'Unknown error';

  if (editPackage.status.type === 'failed' || editPackage.status.type === 'rolledback') {
    errorMessage = editPackage.status.reason;
  } else if (editPackage.status.type === 'partial') {
    errorMessage = editPackage.status.reason;
  }

  return {
    utterance: editPackage.intent.provenance.utterance,
    intent,
    plan,
    diff,
    failureStage,
    errorMessage,
    errorDetails: undefined,
    traces: [],
  };
}

/**
 * Anonymize CPL-Intent.
 */
function anonymizeCPLIntent(intent: CPLIntent): AnonymizedCPLIntent {
  return {
    type: 'cpl:intent',
    goalCount: intent.goals.length,
    goalTypes: intent.goals.map(g => g.type),
    constraintCount: intent.constraints.length,
    constraintTypes: intent.constraints.map(c => c.type),
    scopeType: intent.scope.type,
    hasContext: intent.context !== undefined,
  };
}

/**
 * Anonymize CPL-Plan.
 */
function anonymizeCPLPlan(plan: CPLPlan): AnonymizedCPLPlan {
  // Extract namespaces from opcode types (but not the full IDs)
  const opcodeTypes = plan.opcodes.map(op => {
    const match = op.type.match(/^([^:]+):/);
    return match ? match[1] : 'unknown';
  });

  return {
    type: 'cpl:plan',
    opcodeCount: plan.opcodes.length,
    opcodeTypes,
    costScore: plan.costScore,
    satisfactionScore: plan.satisfactionScore,
    preconditionCount: plan.preconditions.length,
    postconditionCount: plan.postconditions.length,
  };
}

/**
 * Anonymize diff.
 */
function anonymizeDiff(diff: ExecutionDiff): AnonymizedDiff {
  const changeTypes: Record<string, number> = {};
  const entityTypes: Record<string, number> = {};

  for (const change of diff.changes) {
    changeTypes[change.type] = (changeTypes[change.type] || 0) + 1;
    entityTypes[change.entityType] = (entityTypes[change.entityType] || 0) + 1;
  }

  const passed = diff.verifications.filter(v => v.passed).length;
  const failed = diff.verifications.filter(v => !v.passed).length;

  return {
    changeCount: diff.changes.length,
    changeTypes,
    entityTypes,
    constraintVerificationsPassed: passed,
    constraintVerificationsFailed: failed,
  };
}

/**
 * Extract recent edits.
 */
function extractRecentEdits(
  discourseState: DiscourseState,
  maxCount: number,
  anonymize: boolean
): AnonymizedEditSummary[] {
  const recent = [...discourseState.editHistory]
    .sort((a, b) => b.turnNumber - a.turnNumber)
    .slice(0, maxCount);

  return recent.map(edit => ({
    turnNumber: edit.turnNumber,
    axisTouched: edit.axis,
    scopeType: 'unknown', // Would need to look up scope referent
    layerCount: edit.layersTouched.length,
    changeCount: 0, // Would need edit package
    wasUndone: edit.summary.startsWith('[UNDONE]'),
    executionStatus: edit.summary.startsWith('[UNDONE]') ? 'undone' : 'applied',
  }));
}

/**
 * Summarize discourse state.
 */
function summarizeDiscourseState(discourseState: DiscourseState): DiscourseStateSummary {
  const referentTypes: Record<string, number> = {};
  
  for (const ref of discourseState.referents) {
    referentTypes[ref.type] = (referentTypes[ref.type] || 0) + 1;
  }

  return {
    turnNumber: discourseState.currentTurn,
    referentCount: discourseState.referents.length,
    referentTypes,
    editHistorySize: discourseState.editHistory.length,
    qudStackSize: discourseState.qudStack.length,
    commonGroundSize: discourseState.commonGround.length,
    hasActiveTopic: discourseState.currentTopic !== undefined,
  };
}

/**
 * Extract performance metrics from edit package.
 */
function extractPerformanceMetrics(editPackage: EditPackage): PerformanceMetrics {
  const timestamps = editPackage.timestamps;

  return {
    parsingTimeMs: timestamps.planGenerated - timestamps.intentCreated,
    planningTimeMs: timestamps.executed - timestamps.planGenerated,
    executionTimeMs: timestamps.diffComputed - timestamps.executed,
    totalTimeMs: timestamps.diffComputed - timestamps.intentCreated,
    memoryUsageMb: undefined,
  };
}

// ============================================================================
// Export UI Component (for user-facing bug reporting)
// ============================================================================

/**
 * Props for BugReportDialog component.
 */
export interface BugReportDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (description: string, category: BugReportCategory) => void;
  readonly isSubmitting?: boolean;
}

/**
 * Bug report dialog component (React).
 * 
 * This would be implemented in a separate file, but the interface is defined here.
 */
export interface BugReportDialogComponent {
  (props: BugReportDialogProps): JSX.Element;
}
