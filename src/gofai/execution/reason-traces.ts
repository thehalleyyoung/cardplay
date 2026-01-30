/**
 * @file Reason Traces (Step 327)
 * @module gofai/execution/reason-traces
 * 
 * Implements Step 327: Implement "reason traces": for each diff item, link back
 * to the plan opcode and the goal it served.
 * 
 * This module provides complete provenance tracking from user intention through
 * to actual project changes. Every change can be traced back to:
 * - Which natural language goal it serves
 * - Which plan opcode caused it
 * - Why that opcode was chosen
 * - What alternatives were considered
 * 
 * Design principles:
 * - Complete chain: utterance → goal → lever → opcode → diff change
 * - Bidirectional: navigate from changes to goals and vice versa
 * - Explainable: Each link has human-readable justification
 * - Debuggable: Full audit trail for troubleshooting
 * - Efficient: Indexed for fast lookup
 * 
 * Use cases:
 * - "Why did this event change?": Show which goal caused it
 * - "What did this goal affect?": Show all resulting changes
 * - "Why was this opcode chosen?": Show planning rationale
 * - Bug investigation: Trace unexpected changes to root cause
 * - User education: Help users understand system behavior
 * 
 * @see gofai_goalB.md Step 327
 * @see gofai_goalB.md Step 328 (explanation generator)
 * @see gofai_goalB.md Step 265 (plan provenance)
 * @see docs/gofai/provenance.md
 */

import type {
  EditPackage,
  CPLIntent,
  CPLPlan,
  PlanOpcode,
  Goal,
  LeverMapping,
} from './edit-package.js';
import type { CanonicalDiff } from './diff-model.js';

// ============================================================================
// Trace Types
// ============================================================================

/**
 * Complete reason trace for a diff change.
 * 
 * Links a specific change back through the planning and parsing pipeline
 * to the original user utterance.
 */
export interface ReasonTrace {
  /** Unique trace ID */
  readonly id: string;
  
  /** The change being explained */
  readonly change: ChangeReference;
  
  /** Opcode that caused this change */
  readonly opcode: OpcodeReference;
  
  /** Goal(s) this opcode served */
  readonly goals: readonly GoalReference[];
  
  /** Planning rationale */
  readonly rationale: PlanningRationale;
  
  /** Original utterance */
  readonly utterance: string;
  
  /** Complete chain (for display) */
  readonly chain: TraceChain;
}

/**
 * Reference to a change in a diff.
 */
export interface ChangeReference {
  /** Change ID (if available) */
  readonly id?: string;
  
  /** Entity type changed */
  readonly entityType: 'event' | 'track' | 'card' | 'section' | 'routing';
  
  /** Entity ID */
  readonly entityId: string;
  
  /** Change type */
  readonly changeType: 'added' | 'removed' | 'modified';
  
  /** What changed (for modifications) */
  readonly property?: string;
  
  /** Human-readable description */
  readonly description: string;
}

/**
 * Reference to a plan opcode.
 */
export interface OpcodeReference {
  /** Opcode ID */
  readonly id: string;
  
  /** Opcode type */
  readonly type: string;
  
  /** Opcode explanation */
  readonly explanation: string;
  
  /** Opcode parameters (summary) */
  readonly parameters: Record<string, unknown>;
  
  /** Scope */
  readonly scope: string;
}

/**
 * Reference to a goal.
 */
export interface GoalReference {
  /** Goal ID */
  readonly id: string;
  
  /** Goal type */
  readonly type: string;
  
  /** Human-readable goal description */
  readonly description: string;
  
  /** Original lexemes that expressed this goal */
  readonly lexemes?: readonly string[];
}

/**
 * Planning rationale for an opcode.
 */
export interface PlanningRationale {
  /** Why was this opcode chosen? */
  readonly choiceReason: string;
  
  /** What levers were considered? */
  readonly leversConsidered: readonly string[];
  
  /** What alternatives were rejected? */
  readonly alternatives?: readonly Alternative[];
  
  /** Cost factors */
  readonly costFactors: readonly CostFactor[];
  
  /** Constraint satisfaction */
  readonly constraintSatisfaction: readonly ConstraintSatisfaction[];
}

/**
 * An alternative opcode that was considered but rejected.
 */
export interface Alternative {
  /** Alternative opcode type */
  readonly opcodeType: string;
  
  /** Why it was rejected */
  readonly rejectionReason: string;
  
  /** Its cost score */
  readonly cost: number;
}

/**
 * A cost factor in the decision.
 */
export interface CostFactor {
  /** Factor name */
  readonly name: string;
  
  /** Factor value */
  readonly value: number;
  
  /** Explanation */
  readonly explanation: string;
}

/**
 * Constraint satisfaction information.
 */
export interface ConstraintSatisfaction {
  /** Constraint ID */
  readonly constraintId: string;
  
  /** Was it satisfied? */
  readonly satisfied: boolean;
  
  /** Explanation */
  readonly explanation: string;
}

/**
 * Complete trace chain for display.
 */
export interface TraceChain {
  /** Original utterance */
  readonly utterance: string;
  
  /** Parsed goals */
  readonly goals: readonly string[];
  
  /** Chosen levers */
  readonly levers: readonly string[];
  
  /** Selected opcodes */
  readonly opcodes: readonly string[];
  
  /** Resulting changes */
  readonly changes: readonly string[];
  
  /** Visual representation */
  readonly visual: string;
}

// ============================================================================
// Trace Building
// ============================================================================

/**
 * Build reason traces for all changes in an edit package.
 * 
 * Creates a complete provenance map linking every change to its cause.
 */
export function buildReasonTraces(pkg: EditPackage): ReasonTraceMap {
  const traces = new Map<string, ReasonTrace>();
  
  // For each diff change, build its trace
  const changes = extractChangesFromDiff(pkg.diff);
  
  for (const change of changes) {
    const trace = buildTraceForChange(change, pkg);
    if (trace) {
      traces.set(trace.id, trace);
    }
  }
  
  return new ReasonTraceMap(traces, pkg);
}

/**
 * Build a reason trace for a single change.
 */
function buildTraceForChange(
  change: any,
  pkg: EditPackage
): ReasonTrace | null {
  // Find which opcode caused this change
  const opcode = findCausingOpcode(change, pkg);
  if (!opcode) {
    return null;
  }
  
  // Find which goals this opcode served
  const goals = findServedGoals(opcode, pkg.intent);
  
  // Build planning rationale
  const rationale = buildRationale(opcode, pkg.plan);
  
  // Build complete chain
  const chain = buildChain(change, opcode, goals, pkg);
  
  return {
    id: generateTraceId(change, opcode),
    change: buildChangeReference(change),
    opcode: buildOpcodeReference(opcode),
    goals: goals.map(g => buildGoalReference(g, pkg.intent)),
    rationale,
    utterance: pkg.intent.provenance.utterance,
    chain,
  };
}

/**
 * Find which opcode caused a change.
 */
function findCausingOpcode(change: any, pkg: EditPackage): PlanOpcode | null {
  // If change has explicit causedByOpcodeId, use that
  if (change.causedByOpcodeId) {
    return pkg.plan.opcodes.find(op => op.id === change.causedByOpcodeId) || null;
  }
  
  // Otherwise, infer from change type and scope
  for (const opcode of pkg.plan.opcodes) {
    if (opcodeCouldCauseChange(opcode, change)) {
      return opcode;
    }
  }
  
  return null;
}

/**
 * Check if an opcode could have caused a change.
 */
function opcodeCouldCauseChange(opcode: PlanOpcode, change: any): boolean {
  // Match by entity type
  const opcodeTypeStr = String(opcode.type);
  
  if (change.entityType === 'event' && opcodeTypeStr.includes('event')) {
    return true;
  }
  
  if (change.entityType === 'track' && opcodeTypeStr.includes('track')) {
    return true;
  }
  
  if (change.entityType === 'card' && opcodeTypeStr.includes('card')) {
    return true;
  }
  
  if (change.entityType === 'section' && opcodeTypeStr.includes('section')) {
    return true;
  }
  
  // Match by scope
  const scope = opcode.scope as any;
  if (scope && scope.type === 'layer' && change.trackId) {
    return true;
  }
  
  return false;
}

/**
 * Find goals that an opcode served.
 */
function findServedGoals(opcode: PlanOpcode, intent: CPLIntent): Goal[] {
  const goalIds = opcode.servesGoals || [];
  return intent.goals.filter(g => goalIds.includes(g.id));
}

/**
 * Build planning rationale for an opcode.
 */
function buildRationale(opcode: PlanOpcode, plan: CPLPlan): PlanningRationale {
  // Extract from plan provenance
  const leverMapping = plan.provenance.leverMappings.find(lm => 
    lm.opcodeIds.includes(opcode.id)
  );
  
  return {
    choiceReason: leverMapping?.reasoning || opcode.explanation,
    leversConsidered: leverMapping?.leverIds || [],
    alternatives: [], // TODO: Extract from planning logs
    costFactors: [
      {
        name: 'opcode-cost',
        value: opcode.cost,
        explanation: `Base cost of ${opcode.type}`,
      },
    ],
    constraintSatisfaction: [], // TODO: Extract from validation
  };
}

/**
 * Build a complete trace chain.
 */
function buildChain(
  change: any,
  opcode: PlanOpcode,
  goals: Goal[],
  pkg: EditPackage
): TraceChain {
  const utterance = pkg.intent.provenance.utterance;
  const goalDescriptions = goals.map(g => describeGoal(g));
  const leverMapping = pkg.plan.provenance.leverMappings.find(lm =>
    lm.opcodeIds.includes(opcode.id)
  );
  const levers = leverMapping?.leverIds || [];
  const opcodes = [opcode.explanation];
  const changes = [change.description || describeChange(change)];
  
  // Build visual representation
  const visual = buildVisualChain(utterance, goalDescriptions, levers, opcodes, changes);
  
  return {
    utterance,
    goals: goalDescriptions,
    levers,
    opcodes,
    changes,
    visual,
  };
}

/**
 * Describe a goal in natural language.
 */
function describeGoal(goal: Goal): string {
  switch (goal.type) {
    case 'axis-change':
      const data = goal.data as any;
      return `${data.axis || 'unknown'} ${data.direction || 'change'} ${data.amount || ''}`;
    case 'action':
      return `${(goal.data as any).action || 'action'}`;
    case 'structure':
      return `${(goal.data as any).operation || 'structural change'}`;
    default:
      return goal.type;
  }
}

/**
 * Describe a change in natural language.
 */
function describeChange(change: any): string {
  const parts: string[] = [];
  
  parts.push(`${change.changeType} ${change.entityType}`);
  
  if (change.entityId) {
    parts.push(change.entityId);
  }
  
  if (change.property) {
    parts.push(`(${change.property})`);
  }
  
  return parts.join(' ');
}

/**
 * Build visual representation of trace chain.
 */
function buildVisualChain(
  utterance: string,
  goals: readonly string[],
  levers: readonly string[],
  opcodes: readonly string[],
  changes: readonly string[]
): string {
  const lines: string[] = [
    `Utterance: "${utterance}"`,
    '  ↓',
    `Goals: ${goals.join(', ')}`,
    '  ↓',
    `Levers: ${levers.join(', ')}`,
    '  ↓',
    `Opcodes: ${opcodes.join(', ')}`,
    '  ↓',
    `Changes: ${changes.join(', ')}`,
  ];
  
  return lines.join('\n');
}

/**
 * Generate trace ID.
 */
function generateTraceId(change: any, opcode: PlanOpcode): string {
  return `trace:${change.entityId}:${opcode.id}`;
}

/**
 * Build change reference.
 */
function buildChangeReference(change: any): ChangeReference {
  return {
    entityType: change.entityType,
    entityId: change.entityId,
    changeType: change.type || change.changeType,
    property: change.path,
    description: change.description || describeChange(change),
  };
}

/**
 * Build opcode reference.
 */
function buildOpcodeReference(opcode: PlanOpcode): OpcodeReference {
  return {
    id: opcode.id,
    type: String(opcode.type),
    explanation: opcode.explanation,
    parameters: opcode.parameters,
    scope: String((opcode.scope as any)?.type || 'unknown'),
  };
}

/**
 * Build goal reference.
 */
function buildGoalReference(goal: Goal, intent: CPLIntent): GoalReference {
  // Find lexemes that contributed to this goal
  const lexemes = findLexemesForGoal(goal, intent);
  
  return {
    id: goal.id,
    type: goal.type,
    description: describeGoal(goal),
    lexemes,
  };
}

/**
 * Find lexemes that contributed to a goal.
 */
function findLexemesForGoal(goal: Goal, intent: CPLIntent): string[] {
  // Extract from provenance lexical mappings
  const mappings = intent.provenance.lexicalMappings || [];
  
  // TODO: Implement proper goal-to-lexeme tracking
  // For now, return empty array
  return [];
}

/**
 * Extract all changes from a diff.
 */
function extractChangesFromDiff(diff: CanonicalDiff): any[] {
  const changes: any[] = [];
  
  // Extract from all change lists
  for (const added of diff.events.added) {
    changes.push({
      entityType: 'event',
      entityId: added.id,
      changeType: 'added',
      type: 'added',
      ...added,
    });
  }
  
  for (const modified of diff.events.modified) {
    changes.push({
      entityType: 'event',
      entityId: modified.id,
      changeType: 'modified',
      type: 'modified',
      ...modified,
    });
  }
  
  for (const removed of diff.events.removed) {
    changes.push({
      entityType: 'event',
      entityId: removed.id,
      changeType: 'removed',
      type: 'removed',
      ...removed,
    });
  }
  
  // Similar for other entity types...
  for (const modified of diff.tracks.modified) {
    changes.push({
      entityType: 'track',
      entityId: modified.id,
      changeType: 'modified',
      type: 'modified',
      ...modified,
    });
  }
  
  for (const modified of diff.cards.modified) {
    changes.push({
      entityType: 'card',
      entityId: modified.id,
      changeType: 'modified',
      type: 'modified',
      ...modified,
    });
  }
  
  return changes;
}

// ============================================================================
// Reason Trace Map
// ============================================================================

/**
 * Collection of reason traces with efficient lookup.
 */
export class ReasonTraceMap {
  private readonly traces: Map<string, ReasonTrace>;
  private readonly changeIndex: Map<string, string[]>;
  private readonly opcodeIndex: Map<string, string[]>;
  private readonly goalIndex: Map<string, string[]>;
  private readonly pkg: EditPackage;
  
  constructor(traces: Map<string, ReasonTrace>, pkg: EditPackage) {
    this.traces = traces;
    this.pkg = pkg;
    
    // Build indexes
    this.changeIndex = new Map();
    this.opcodeIndex = new Map();
    this.goalIndex = new Map();
    
    for (const [id, trace] of traces.entries()) {
      // Index by change
      const changeKey = `${trace.change.entityType}:${trace.change.entityId}`;
      if (!this.changeIndex.has(changeKey)) {
        this.changeIndex.set(changeKey, []);
      }
      this.changeIndex.get(changeKey)!.push(id);
      
      // Index by opcode
      if (!this.opcodeIndex.has(trace.opcode.id)) {
        this.opcodeIndex.set(trace.opcode.id, []);
      }
      this.opcodeIndex.get(trace.opcode.id)!.push(id);
      
      // Index by goals
      for (const goal of trace.goals) {
        if (!this.goalIndex.has(goal.id)) {
          this.goalIndex.set(goal.id, []);
        }
        this.goalIndex.get(goal.id)!.push(id);
      }
    }
  }
  
  /**
   * Get trace by ID.
   */
  getTrace(id: string): ReasonTrace | undefined {
    return this.traces.get(id);
  }
  
  /**
   * Get all traces.
   */
  getAllTraces(): readonly ReasonTrace[] {
    return Array.from(this.traces.values());
  }
  
  /**
   * Find traces for a specific change.
   */
  getTracesForChange(entityType: string, entityId: string): readonly ReasonTrace[] {
    const key = `${entityType}:${entityId}`;
    const traceIds = this.changeIndex.get(key) || [];
    return traceIds.map(id => this.traces.get(id)!).filter(Boolean);
  }
  
  /**
   * Find traces for a specific opcode.
   */
  getTracesForOpcode(opcodeId: string): readonly ReasonTrace[] {
    const traceIds = this.opcodeIndex.get(opcodeId) || [];
    return traceIds.map(id => this.traces.get(id)!).filter(Boolean);
  }
  
  /**
   * Find traces for a specific goal.
   */
  getTracesForGoal(goalId: string): readonly ReasonTrace[] {
    const traceIds = this.goalIndex.get(goalId) || [];
    return traceIds.map(id => this.traces.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all changes caused by a goal.
   */
  getChangesForGoal(goalId: string): readonly ChangeReference[] {
    const traces = this.getTracesForGoal(goalId);
    return traces.map(t => t.change);
  }
  
  /**
   * Get all goals that caused a change.
   */
  getGoalsForChange(entityType: string, entityId: string): readonly GoalReference[] {
    const traces = this.getTracesForChange(entityType, entityId);
    const goals = new Map<string, GoalReference>();
    
    for (const trace of traces) {
      for (const goal of trace.goals) {
        goals.set(goal.id, goal);
      }
    }
    
    return Array.from(goals.values());
  }
  
  /**
   * Explain why a specific change happened.
   */
  explainChange(entityType: string, entityId: string): string {
    const traces = this.getTracesForChange(entityType, entityId);
    
    if (traces.length === 0) {
      return `No explanation available for ${entityType} ${entityId}`;
    }
    
    const trace = traces[0];
    const lines: string[] = [
      `This ${entityType} changed because:`,
      '',
      `You said: "${trace.utterance}"`,
      '',
      `Which led to goals:`,
      ...trace.goals.map(g => `  - ${g.description}`),
      '',
      `The system chose to:`,
      `  ${trace.opcode.explanation}`,
      '',
      `Rationale: ${trace.rationale.choiceReason}`,
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Explain what a goal affected.
   */
  explainGoal(goalId: string): string {
    const traces = this.getTracesForGoal(goalId);
    
    if (traces.length === 0) {
      return `No changes for goal ${goalId}`;
    }
    
    const lines: string[] = [
      `Goal "${traces[0].goals[0]?.description || goalId}" resulted in:`,
      '',
    ];
    
    const changeGroups = new Map<string, ChangeReference[]>();
    for (const trace of traces) {
      const type = trace.change.entityType;
      if (!changeGroups.has(type)) {
        changeGroups.set(type, []);
      }
      changeGroups.get(type)!.push(trace.change);
    }
    
    for (const [type, changes] of changeGroups.entries()) {
      lines.push(`${changes.length} ${type} change${changes.length !== 1 ? 's' : ''}:`);
      for (const change of changes.slice(0, 5)) {
        lines.push(`  - ${change.description}`);
      }
      if (changes.length > 5) {
        lines.push(`  ... and ${changes.length - 5} more`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Generate a complete explanation of the edit package.
   */
  explainPackage(): string {
    const lines: string[] = [
      `Edit Package Explanation`,
      '='.repeat(60),
      '',
      `Utterance: "${this.pkg.intent.provenance.utterance}"`,
      '',
      `Goals (${this.pkg.intent.goals.length}):`,
    ];
    
    for (const goal of this.pkg.intent.goals) {
      lines.push(`  ${goal.id}: ${describeGoal(goal)}`);
      
      const changes = this.getChangesForGoal(goal.id);
      if (changes.length > 0) {
        lines.push(`    → ${changes.length} changes`);
      }
    }
    
    lines.push('');
    lines.push(`Opcodes (${this.pkg.plan.opcodes.length}):`);
    
    for (const opcode of this.pkg.plan.opcodes) {
      const traces = this.getTracesForOpcode(opcode.id);
      lines.push(`  ${opcode.id}: ${opcode.explanation}`);
      lines.push(`    → ${traces.length} changes`);
    }
    
    return lines.join('\n');
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ReasonTrace,
  ChangeReference,
  OpcodeReference,
  GoalReference,
  PlanningRationale,
  Alternative,
  CostFactor,
  ConstraintSatisfaction,
  TraceChain,
};

export {
  buildReasonTraces,
  ReasonTraceMap,
};
