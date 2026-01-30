/**
 * @file Explanation Generator (Step 328)
 * @module gofai/execution/explanation-generator
 * 
 * Implements Step 328: Implement "explanation generator": produce before/after
 * summaries and satisfy-constraint reports.
 * 
 * This module generates comprehensive explanations of what an edit did, why it
 * did it, and how it satisfied (or failed) constraints. Explanations are:
 * - Human-readable: Use musical terms, not technical jargon
 * - Complete: Cover all aspects of the edit
 * - Verifiable: Link to concrete evidence in diffs
 * - Educational: Help users understand system behavior
 * - Shareable: Can be exported for collaboration
 * 
 * Explanation types:
 * - Before/after summary: What changed overall
 * - Goal satisfaction: How each goal was achieved
 * - Constraint report: Which constraints passed/failed
 * - Rationale: Why specific decisions were made
 * - Technical report: Full details for power users
 * 
 * Integration:
 * - Uses diff-rendering.ts for change summaries
 * - Uses reason-traces.ts for provenance chains
 * - Uses constraint-checkers.ts for verification
 * - Consumed by UI for display and export
 * 
 * @see gofai_goalB.md Step 328
 * @see gofai_goalB.md Step 327 (reason traces)
 * @see gofai_goalB.md Step 326 (diff rendering)
 * @see docs/gofai/explanations.md
 */

import type { EditPackage, Goal, Constraint } from './edit-package.js';
import type { CanonicalDiff } from './diff-model.js';
import { renderDiff, type DiffRendering } from './diff-rendering.js';
import { buildReasonTraces, type ReasonTraceMap } from './reason-traces.js';
import type { ConstraintVerification } from './edit-package.js';

// ============================================================================
// Explanation Types
// ============================================================================

/**
 * Complete explanation of an edit package.
 * 
 * Provides multiple views of what happened and why, suitable for
 * different audiences and use cases.
 */
export interface EditExplanation {
  /** Unique explanation ID */
  readonly id: string;
  
  /** Edit package being explained */
  readonly editPackageId: string;
  
  /** Summary (one paragraph) */
  readonly summary: string;
  
  /** Before/after comparison */
  readonly beforeAfter: BeforeAfterSummary;
  
  /** Goal satisfaction report */
  readonly goalSatisfaction: GoalSatisfactionReport;
  
  /** Constraint verification report */
  readonly constraintReport: ConstraintReport;
  
  /** Planning rationale */
  readonly rationale: RationaleReport;
  
  /** Complete trace map */
  readonly traces: ReasonTraceMap;
  
  /** Rendered diff */
  readonly diff: DiffRendering;
  
  /** Technical details */
  readonly technical: TechnicalReport;
  
  /** Shareable export */
  readonly exportable: ExportableExplanation;
}

/**
 * Before/after summary.
 */
export interface BeforeAfterSummary {
  /** What the project was like before */
  readonly before: ProjectDescription;
  
  /** What the project is like after */
  readonly after: ProjectDescription;
  
  /** What changed (summary) */
  readonly changes: readonly string[];
  
  /** Visual comparison */
  readonly visual: string;
}

/**
 * Description of project state.
 */
export interface ProjectDescription {
  /** Overall description */
  readonly summary: string;
  
  /** Key characteristics */
  readonly characteristics: readonly Characteristic[];
  
  /** Section summaries */
  readonly sections: readonly SectionDescription[];
  
  /** Layer summaries */
  readonly layers: readonly LayerDescription[];
}

/**
 * A characteristic of the project.
 */
export interface Characteristic {
  /** Characteristic name */
  readonly name: string;
  
  /** Value */
  readonly value: string;
  
  /** Category */
  readonly category: 'structure' | 'arrangement' | 'production' | 'content';
}

/**
 * Description of a section.
 */
export interface SectionDescription {
  /** Section name */
  readonly name: string;
  
  /** Description */
  readonly description: string;
  
  /** Key features */
  readonly features: readonly string[];
}

/**
 * Description of a layer.
 */
export interface LayerDescription {
  /** Layer name */
  readonly name: string;
  
  /** Role */
  readonly role: string;
  
  /** Description */
  readonly description: string;
}

/**
 * Goal satisfaction report.
 */
export interface GoalSatisfactionReport {
  /** Total goals */
  readonly totalGoals: number;
  
  /** Fully satisfied goals */
  readonly fullySatisfied: number;
  
  /** Partially satisfied goals */
  readonly partiallySatisfied: number;
  
  /** Unsatisfied goals */
  readonly unsatisfied: number;
  
  /** Per-goal details */
  readonly goals: readonly GoalSatisfaction[];
  
  /** Overall assessment */
  readonly assessment: string;
}

/**
 * Satisfaction status for a single goal.
 */
export interface GoalSatisfaction {
  /** Goal being assessed */
  readonly goal: Goal;
  
  /** Goal description */
  readonly description: string;
  
  /** Satisfaction level */
  readonly level: 'full' | 'partial' | 'none';
  
  /** Explanation */
  readonly explanation: string;
  
  /** Changes that addressed this goal */
  readonly changes: readonly string[];
  
  /** Evidence */
  readonly evidence: readonly Evidence[];
}

/**
 * Evidence for goal satisfaction.
 */
export interface Evidence {
  /** Evidence type */
  readonly type: 'change' | 'measurement' | 'constraint';
  
  /** Description */
  readonly description: string;
  
  /** Reference to concrete data */
  readonly ref: string;
}

/**
 * Constraint verification report.
 */
export interface ConstraintReport {
  /** Total constraints */
  readonly totalConstraints: number;
  
  /** Passed constraints */
  readonly passed: number;
  
  /** Failed constraints */
  readonly failed: number;
  
  /** Warnings */
  readonly warnings: number;
  
  /** Per-constraint details */
  readonly constraints: readonly ConstraintVerificationDetail[];
  
  /** Overall status */
  readonly status: 'pass' | 'fail' | 'warning';
  
  /** Summary */
  readonly summary: string;
}

/**
 * Detailed verification for a constraint.
 */
export interface ConstraintVerificationDetail {
  /** Constraint being checked */
  readonly constraint: Constraint;
  
  /** Constraint description */
  readonly description: string;
  
  /** Verification result */
  readonly verification: ConstraintVerification;
  
  /** Explanation */
  readonly explanation: string;
  
  /** If failed, what violated it */
  readonly violations?: readonly ViolationDetail[];
}

/**
 * Detail about a constraint violation.
 */
export interface ViolationDetail {
  /** What violated the constraint */
  readonly what: string;
  
  /** Where it happened */
  readonly where: string;
  
  /** Why it's a violation */
  readonly why: string;
  
  /** Counterexample */
  readonly counterexample: string;
}

/**
 * Planning rationale report.
 */
export interface RationaleReport {
  /** Overall strategy */
  readonly strategy: string;
  
  /** Key decisions */
  readonly decisions: readonly Decision[];
  
  /** Alternatives considered */
  readonly alternatives: readonly AlternativeOption[];
  
  /** Tradeoffs */
  readonly tradeoffs: readonly Tradeoff[];
}

/**
 * A planning decision.
 */
export interface Decision {
  /** What was decided */
  readonly what: string;
  
  /** Why it was chosen */
  readonly why: string;
  
  /** Cost */
  readonly cost: number;
  
  /** Benefit */
  readonly benefit: string;
}

/**
 * An alternative that was considered.
 */
export interface AlternativeOption {
  /** Description */
  readonly description: string;
  
  /** Why it was rejected */
  readonly rejection: string;
  
  /** Its cost */
  readonly cost: number;
}

/**
 * A tradeoff in planning.
 */
export interface Tradeoff {
  /** What was traded */
  readonly tradeoff: string;
  
  /** Gain */
  readonly gain: string;
  
  /** Cost */
  readonly cost: string;
}

/**
 * Technical report.
 */
export interface TechnicalReport {
  /** Package metadata */
  readonly metadata: Record<string, unknown>;
  
  /** CPL JSON */
  readonly cpl: string;
  
  /** Plan JSON */
  readonly plan: string;
  
  /** Diff JSON */
  readonly diff: string;
  
  /** Provenance chain */
  readonly provenance: string;
}

/**
 * Exportable explanation (for sharing).
 */
export interface ExportableExplanation {
  /** Format version */
  readonly version: string;
  
  /** Markdown report */
  readonly markdown: string;
  
  /** Plain text report */
  readonly plainText: string;
  
  /** JSON data */
  readonly json: string;
  
  /** HTML report */
  readonly html: string;
}

// ============================================================================
// Main Explanation Generator
// ============================================================================

/**
 * Generate complete explanation for an edit package.
 */
export function generateExplanation(pkg: EditPackage): EditExplanation {
  // Build components
  const traces = buildReasonTraces(pkg);
  const diff = renderDiff(pkg.diff);
  const summary = generateSummary(pkg, diff);
  const beforeAfter = generateBeforeAfter(pkg, diff);
  const goalSatisfaction = generateGoalSatisfaction(pkg, traces);
  const constraintReport = generateConstraintReport(pkg);
  const rationale = generateRationale(pkg);
  const technical = generateTechnical(pkg);
  
  const explanation: EditExplanation = {
    id: `explanation:${pkg.id}`,
    editPackageId: pkg.id,
    summary,
    beforeAfter,
    goalSatisfaction,
    constraintReport,
    rationale,
    traces,
    diff,
    technical,
    exportable: {
      version: '1.0.0',
      markdown: '',
      plainText: '',
      json: '',
      html: '',
    },
  };
  
  // Generate exportable formats
  const exportable = generateExportable(explanation);
  
  return {
    ...explanation,
    exportable,
  };
}

/**
 * Generate one-paragraph summary.
 */
function generateSummary(pkg: EditPackage, diff: DiffRendering): string {
  const parts: string[] = [];
  
  // Start with utterance
  parts.push(`You asked: "${pkg.intent.provenance.utterance}".`);
  
  // What changed
  parts.push(diff.oneLine + '.');
  
  // Constraint status
  const passed = pkg.diff.verifications.filter(v => v.passed).length;
  const failed = pkg.diff.verifications.filter(v => !v.passed).length;
  
  if (failed === 0) {
    parts.push('All constraints were satisfied.');
  } else {
    parts.push(`${passed} constraints passed, ${failed} failed.`);
  }
  
  return parts.join(' ');
}

/**
 * Generate before/after summary.
 */
function generateBeforeAfter(pkg: EditPackage, diff: DiffRendering): BeforeAfterSummary {
  const before = describeProjectState(pkg.diff.before, 'before');
  const after = describeProjectState(pkg.diff.after, 'after');
  const changes = diff.bySection.flatMap(s => s.changes);
  const visual = buildBeforeAfterVisual(before, after, changes);
  
  return {
    before,
    after,
    changes,
    visual,
  };
}

/**
 * Describe project state.
 */
function describeProjectState(snapshot: any, when: 'before' | 'after'): ProjectDescription {
  const characteristics = extractCharacteristics(snapshot);
  const sections = describeSections(snapshot);
  const layers = describeLayers(snapshot);
  
  const summary = summarizeProjectState(characteristics, sections, layers);
  
  return {
    summary,
    characteristics,
    sections,
    layers,
  };
}

/**
 * Extract characteristics from snapshot.
 */
function extractCharacteristics(snapshot: any): Characteristic[] {
  const chars: Characteristic[] = [];
  
  // Structure
  chars.push({
    name: 'Sections',
    value: `${snapshot.sections.length}`,
    category: 'structure',
  });
  
  // Arrangement
  chars.push({
    name: 'Tracks',
    value: `${snapshot.tracks.length}`,
    category: 'arrangement',
  });
  
  // Content
  chars.push({
    name: 'Events',
    value: `${snapshot.events.length}`,
    category: 'content',
  });
  
  // Production
  chars.push({
    name: 'Cards',
    value: `${snapshot.cards.length}`,
    category: 'production',
  });
  
  return chars;
}

/**
 * Describe sections.
 */
function describeSections(snapshot: any): SectionDescription[] {
  return snapshot.sections.map((section: any) => ({
    name: section.name || section.id,
    description: `${section.type || 'Section'} from bar ${Math.floor(section.startTick / 1920)} to ${Math.floor(section.endTick / 1920)}`,
    features: [],
  }));
}

/**
 * Describe layers.
 */
function describeLayers(snapshot: any): LayerDescription[] {
  return snapshot.tracks.map((track: any) => ({
    name: track.name || track.id,
    role: inferRole(track),
    description: `${inferRole(track)} layer`,
  }));
}

/**
 * Infer role from track.
 */
function inferRole(track: any): string {
  const name = (track.name || '').toLowerCase();
  
  if (name.includes('drum')) return 'drums';
  if (name.includes('bass')) return 'bass';
  if (name.includes('lead') || name.includes('melody')) return 'melody';
  if (name.includes('chord') || name.includes('harmony')) return 'harmony';
  if (name.includes('pad')) return 'pad';
  
  return 'other';
}

/**
 * Summarize project state.
 */
function summarizeProjectState(
  chars: readonly Characteristic[],
  sections: readonly SectionDescription[],
  layers: readonly LayerDescription[]
): string {
  const parts: string[] = [];
  
  parts.push(`Project with ${sections.length} sections`);
  parts.push(`${layers.length} tracks`);
  
  const eventCount = chars.find(c => c.name === 'Events')?.value;
  if (eventCount) {
    parts.push(`${eventCount} events`);
  }
  
  return parts.join(', ');
}

/**
 * Build before/after visual.
 */
function buildBeforeAfterVisual(
  before: ProjectDescription,
  after: ProjectDescription,
  changes: readonly string[]
): string {
  const lines: string[] = [
    'Before → After',
    '─'.repeat(60),
    '',
    `${before.summary}`,
    '  ↓',
    `${changes.length} changes`,
    '  ↓',
    `${after.summary}`,
  ];
  
  return lines.join('\n');
}

/**
 * Generate goal satisfaction report.
 */
function generateGoalSatisfaction(pkg: EditPackage, traces: ReasonTraceMap): GoalSatisfactionReport {
  const goals: GoalSatisfaction[] = [];
  
  for (const goal of pkg.intent.goals) {
    const satisfaction = assessGoalSatisfaction(goal, pkg, traces);
    goals.push(satisfaction);
  }
  
  const fullySatisfied = goals.filter(g => g.level === 'full').length;
  const partiallySatisfied = goals.filter(g => g.level === 'partial').length;
  const unsatisfied = goals.filter(g => g.level === 'none').length;
  
  const assessment = generateSatisfactionAssessment(fullySatisfied, partiallySatisfied, unsatisfied);
  
  return {
    totalGoals: goals.length,
    fullySatisfied,
    partiallySatisfied,
    unsatisfied,
    goals,
    assessment,
  };
}

/**
 * Assess satisfaction for a goal.
 */
function assessGoalSatisfaction(
  goal: Goal,
  pkg: EditPackage,
  traces: ReasonTraceMap
): GoalSatisfaction {
  const changes = traces.getChangesForGoal(goal.id);
  const description = describeGoalFromPkg(goal);
  
  // Simple heuristic: if there are changes, goal is satisfied
  const level: 'full' | 'partial' | 'none' = changes.length > 0 ? 'full' : 'none';
  
  const explanation = level === 'full'
    ? `Goal achieved through ${changes.length} changes`
    : 'Goal was not addressed';
  
  const evidence: Evidence[] = changes.map(change => ({
    type: 'change' as const,
    description: change.description,
    ref: change.entityId,
  }));
  
  return {
    goal,
    description,
    level,
    explanation,
    changes: changes.map(c => c.description),
    evidence,
  };
}

/**
 * Describe goal from package.
 */
function describeGoalFromPkg(goal: Goal): string {
  switch (goal.type) {
    case 'axis-change':
      const data = goal.data as any;
      return `Adjust ${data.axis || 'unknown'} ${data.direction || ''} ${data.amount || ''}`;
    case 'action':
      return `Perform ${(goal.data as any).action || 'action'}`;
    case 'structure':
      return `Change structure: ${(goal.data as any).operation || 'unknown'}`;
    default:
      return goal.type;
  }
}

/**
 * Generate satisfaction assessment.
 */
function generateSatisfactionAssessment(full: number, partial: number, none: number): string {
  const total = full + partial + none;
  
  if (total === 0) {
    return 'No goals were specified';
  }
  
  if (full === total) {
    return 'All goals were fully satisfied';
  }
  
  if (none === total) {
    return 'No goals were satisfied';
  }
  
  return `${full} of ${total} goals fully satisfied, ${partial} partially, ${none} not addressed`;
}

/**
 * Generate constraint report.
 */
function generateConstraintReport(pkg: EditPackage): ConstraintReport {
  const verifications = pkg.diff.verifications;
  
  const passed = verifications.filter(v => v.passed).length;
  const failed = verifications.filter(v => !v.passed).length;
  const warnings = 0; // TODO: Extract warnings
  
  const constraints: ConstraintVerificationDetail[] = [];
  
  for (const constraint of pkg.intent.constraints) {
    const verification = verifications.find(v => v.constraintId === constraint.id);
    if (verification) {
      constraints.push(buildConstraintDetail(constraint, verification));
    }
  }
  
  const status: 'pass' | 'fail' | 'warning' = failed > 0 ? 'fail' : (warnings > 0 ? 'warning' : 'pass');
  const summary = generateConstraintSummary(passed, failed, warnings);
  
  return {
    totalConstraints: verifications.length,
    passed,
    failed,
    warnings,
    constraints,
    status,
    summary,
  };
}

/**
 * Build constraint detail.
 */
function buildConstraintDetail(
  constraint: Constraint,
  verification: ConstraintVerification
): ConstraintVerificationDetail {
  const description = describeConstraint(constraint);
  const explanation = verification.passed
    ? 'Constraint satisfied'
    : verification.violation?.message || 'Constraint violated';
  
  const violations = verification.violation
    ? buildViolationDetails(verification.violation)
    : undefined;
  
  return {
    constraint,
    description,
    verification,
    explanation,
    violations,
  };
}

/**
 * Describe a constraint.
 */
function describeConstraint(constraint: Constraint): string {
  switch (constraint.type) {
    case 'preserve':
      return `Preserve ${(constraint.data as any).what || 'unknown'}`;
    case 'only-change':
      return `Only change ${(constraint.data as any).scope || 'specified scope'}`;
    case 'within-range':
      return `Keep within range: ${(constraint.data as any).range || 'unknown'}`;
    default:
      return constraint.type;
  }
}

/**
 * Build violation details.
 */
function buildViolationDetails(violation: any): ViolationDetail[] {
  return [{
    what: violation.message,
    where: 'Unknown location',
    why: 'Constraint was not satisfied',
    counterexample: JSON.stringify(violation.counterexample),
  }];
}

/**
 * Generate constraint summary.
 */
function generateConstraintSummary(passed: number, failed: number, warnings: number): string {
  if (failed === 0 && warnings === 0) {
    return `All ${passed} constraints satisfied`;
  }
  
  if (failed > 0) {
    return `${failed} constraint${failed !== 1 ? 's' : ''} violated (${passed} passed)`;
  }
  
  return `${warnings} warning${warnings !== 1 ? 's' : ''} (${passed} passed)`;
}

/**
 * Generate rationale report.
 */
function generateRationale(pkg: EditPackage): RationaleReport {
  const strategy = pkg.plan.provenance.strategy || 'default planning';
  const decisions = extractDecisions(pkg);
  const alternatives: AlternativeOption[] = []; // TODO: Extract from planning logs
  const tradeoffs: Tradeoff[] = []; // TODO: Extract tradeoffs
  
  return {
    strategy,
    decisions,
    alternatives,
    tradeoffs,
  };
}

/**
 * Extract decisions from package.
 */
function extractDecisions(pkg: EditPackage): Decision[] {
  return pkg.plan.opcodes.map(opcode => ({
    what: opcode.explanation,
    why: `To serve goals: ${opcode.servesGoals.join(', ')}`,
    cost: opcode.cost,
    benefit: 'Achieves goal',
  }));
}

/**
 * Generate technical report.
 */
function generateTechnical(pkg: EditPackage): TechnicalReport {
  return {
    metadata: {
      id: pkg.id,
      version: pkg.version,
      status: pkg.status.type,
      timestamps: pkg.timestamps,
    },
    cpl: JSON.stringify(pkg.intent, null, 2),
    plan: JSON.stringify(pkg.plan, null, 2),
    diff: JSON.stringify(pkg.diff, null, 2),
    provenance: JSON.stringify(pkg.provenance, null, 2),
  };
}

/**
 * Generate exportable formats.
 */
function generateExportable(explanation: EditExplanation): ExportableExplanation {
  const markdown = generateMarkdown(explanation);
  const plainText = generatePlainText(explanation);
  const json = generateJSON(explanation);
  const html = generateHTML(explanation);
  
  return {
    version: '1.0.0',
    markdown,
    plainText,
    json,
    html,
  };
}

/**
 * Generate markdown report.
 */
function generateMarkdown(explanation: EditExplanation): string {
  const lines: string[] = [
    `# Edit Explanation`,
    '',
    `## Summary`,
    explanation.summary,
    '',
    `## Changes`,
    explanation.diff.oneLine,
    '',
    `## Goal Satisfaction`,
    explanation.goalSatisfaction.assessment,
    '',
  ];
  
  for (const goal of explanation.goalSatisfaction.goals) {
    lines.push(`### ${goal.description}`);
    lines.push(`- Status: ${goal.level}`);
    lines.push(`- ${goal.explanation}`);
    lines.push('');
  }
  
  lines.push(`## Constraints`);
  lines.push(explanation.constraintReport.summary);
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Generate plain text report.
 */
function generatePlainText(explanation: EditExplanation): string {
  // Similar to markdown but without formatting
  return generateMarkdown(explanation).replace(/^#+ /gm, '').replace(/\*\*/g, '');
}

/**
 * Generate JSON export.
 */
function generateJSON(explanation: EditExplanation): string {
  // Exclude circular references
  const exportData = {
    id: explanation.id,
    summary: explanation.summary,
    beforeAfter: explanation.beforeAfter,
    goalSatisfaction: explanation.goalSatisfaction,
    constraintReport: explanation.constraintReport,
    rationale: explanation.rationale,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate HTML report.
 */
function generateHTML(explanation: EditExplanation): string {
  const markdown = generateMarkdown(explanation);
  
  // Simple markdown to HTML conversion
  const html = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>');
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>Edit Explanation</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { border-bottom: 2px solid #333; }
    h2 { border-bottom: 1px solid #666; margin-top: 30px; }
    h3 { margin-top: 20px; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  EditExplanation,
  BeforeAfterSummary,
  GoalSatisfactionReport,
  GoalSatisfaction,
  ConstraintReport,
  RationaleReport,
  TechnicalReport,
  ExportableExplanation,
};

export {
  generateExplanation,
};
