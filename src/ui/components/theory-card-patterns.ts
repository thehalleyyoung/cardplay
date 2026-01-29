/**
 * @fileoverview Theory Card UI Patterns for Branch C
 * 
 * Provides reusable UI patterns and types for theory cards:
 * - Spec Inspector (C073)
 * - Constraint Toggles (C074)
 * - Apply Recommendation flow (C082)
 * - "Why?" explanation flow (C083)
 * 
 * These patterns are designed to work with MusicSpec and Prolog explanations.
 * 
 * @module @cardplay/ui/components/theory-card-patterns
 */

import type {
  MusicSpec,
  MusicConstraint,
} from '../../ai/theory/music-spec';

// ============================================================================
// C073: SPEC INSPECTOR PANEL
// ============================================================================

/**
 * A single fact displayed in the spec inspector.
 */
export interface InspectorFact {
  /** Prolog predicate name (e.g., 'constraint', 'current_spec') */
  readonly predicate: string;
  
  /** Arguments as strings */
  readonly args: readonly string[];
  
  /** Human-readable explanation */
  readonly humanReadable: string;
  
  /** Source: 'user' | 'derived' | 'default' */
  readonly source: 'user' | 'derived' | 'default';
  
  /** Whether this fact is currently active */
  readonly active: boolean;
}

/**
 * A goal in the spec inspector.
 */
export interface InspectorGoal {
  /** Prolog goal string */
  readonly goal: string;
  
  /** Status: 'pending' | 'succeeded' | 'failed' */
  readonly status: 'pending' | 'succeeded' | 'failed';
  
  /** Time taken in ms (if completed) */
  readonly timeMs?: number;
  
  /** Number of solutions found */
  readonly solutionCount?: number;
}

/**
 * Props for the SpecInspector component.
 */
export interface SpecInspectorProps {
  /** Current MusicSpec */
  readonly spec: MusicSpec;
  
  /** Active Prolog facts */
  readonly facts: readonly InspectorFact[];
  
  /** Recent goals */
  readonly goals: readonly InspectorGoal[];
  
  /** Filter by predicate name */
  readonly predicateFilter?: string;
  
  /** Filter by source */
  readonly sourceFilter?: 'user' | 'derived' | 'default' | 'all';
  
  /** Callback when a fact is selected */
  readonly onFactSelect?: (fact: InspectorFact) => void;
  
  /** Callback to re-run a goal */
  readonly onGoalRerun?: (goal: InspectorGoal) => void;
  
  /** Whether to show raw Prolog syntax */
  readonly showRawProlog?: boolean;
}

/**
 * State for the SpecInspector component.
 */
export interface SpecInspectorState {
  readonly expandedSections: readonly string[];
  readonly selectedFact: InspectorFact | null;
  readonly selectedGoal: InspectorGoal | null;
  readonly filterText: string;
}

/**
 * Format a fact for display.
 */
export function formatInspectorFact(fact: InspectorFact, raw: boolean): string {
  if (raw) {
    return `${fact.predicate}(${fact.args.join(', ')}).`;
  }
  return fact.humanReadable;
}

/**
 * Group facts by predicate for organized display.
 */
export function groupFactsByPredicate(
  facts: readonly InspectorFact[]
): Map<string, readonly InspectorFact[]> {
  const groups = new Map<string, InspectorFact[]>();
  for (const fact of facts) {
    const existing = groups.get(fact.predicate) ?? [];
    groups.set(fact.predicate, [...existing, fact]);
  }
  return groups;
}

// ============================================================================
// C074: CONSTRAINT TOGGLES
// ============================================================================

/**
 * A toggleable constraint in the UI.
 */
export interface ConstraintToggle {
  /** The constraint */
  readonly constraint: MusicConstraint;
  
  /** Unique ID for this toggle */
  readonly id: string;
  
  /** Display label */
  readonly label: string;
  
  /** Description/tooltip */
  readonly description: string;
  
  /** Whether currently enabled */
  readonly enabled: boolean;
  
  /** Whether it's a hard or soft constraint */
  readonly isHard: boolean;
  
  /** Category for grouping (e.g., 'key', 'style', 'culture') */
  readonly category: string;
  
  /** Weight if soft constraint */
  readonly weight?: number;
}

/**
 * Props for the ConstraintToggles component.
 */
export interface ConstraintTogglesProps {
  /** Current constraints as toggles */
  readonly toggles: readonly ConstraintToggle[];
  
  /** Callback when a toggle is changed */
  readonly onToggleChange: (id: string, enabled: boolean) => void;
  
  /** Callback when a toggle weight is changed */
  readonly onWeightChange?: (id: string, weight: number) => void;
  
  /** Callback to add a new constraint */
  readonly onAddConstraint?: (category: string) => void;
  
  /** Callback to remove a constraint */
  readonly onRemoveConstraint?: (id: string) => void;
  
  /** Group by category */
  readonly groupByCategory?: boolean;
  
  /** Allow drag-and-drop reordering */
  readonly allowReorder?: boolean;
}

/**
 * Create a toggle from a constraint.
 */
export function constraintToToggle(
  constraint: MusicConstraint,
  enabled: boolean = true
): ConstraintToggle {
  const id = `${constraint.type}_${JSON.stringify(constraint).slice(0, 20)}`;
  const label = formatConstraintLabel(constraint);
  const description = formatConstraintDescription(constraint);
  
  const base = {
    constraint,
    id,
    label,
    description,
    enabled,
    isHard: constraint.hard,
    category: constraint.type,
  };
  
  // Only include weight if it's defined
  if (constraint.weight !== undefined) {
    return {
      ...base,
      weight: constraint.weight,
    };
  }
  
  return base;
}

/**
 * Format a constraint as a short label.
 */
function formatConstraintLabel(constraint: MusicConstraint): string {
  switch (constraint.type) {
    case 'key':
      return `Key: ${constraint.root} ${constraint.mode}`;
    case 'tempo':
      return `Tempo: ${constraint.bpm} BPM`;
    case 'meter':
      return `Meter: ${constraint.numerator}/${constraint.denominator}`;
    case 'style':
      return `Style: ${constraint.style}`;
    case 'culture':
      return `Culture: ${constraint.culture}`;
    case 'schema':
      return `Schema: ${constraint.schema}`;
    default:
      return constraint.type;
  }
}

/**
 * Format a constraint as a description.
 */
function formatConstraintDescription(constraint: MusicConstraint): string {
  const hardSoft = constraint.hard ? 'Required' : `Preferred (weight: ${constraint.weight ?? 1})`;
  return `${formatConstraintLabel(constraint)} - ${hardSoft}`;
}

/**
 * Group toggles by category.
 */
export function groupTogglesByCategory(
  toggles: readonly ConstraintToggle[]
): Map<string, readonly ConstraintToggle[]> {
  const groups = new Map<string, ConstraintToggle[]>();
  for (const toggle of toggles) {
    const existing = groups.get(toggle.category) ?? [];
    groups.set(toggle.category, [...existing, toggle]);
  }
  return groups;
}

// ============================================================================
// C082: APPLY RECOMMENDATION FLOW
// ============================================================================

/**
 * A recommendation that can be previewed and applied.
 */
export interface Recommendation<T = unknown> {
  /** Unique ID */
  readonly id: string;
  
  /** Display title */
  readonly title: string;
  
  /** Detailed explanation */
  readonly explanation: string;
  
  /** The recommended value */
  readonly value: T;
  
  /** Confidence (0-100) */
  readonly confidence: number;
  
  /** Reasons from Prolog */
  readonly reasons: readonly string[];
  
  /** Impact preview description */
  readonly impactPreview: string;
  
  /** Category of recommendation */
  readonly category: 'key' | 'mode' | 'tempo' | 'style' | 'constraint' | 'other';
}

/**
 * State for the apply recommendation flow.
 */
export interface ApplyRecommendationState {
  /** Current step in the flow */
  readonly step: 'browse' | 'preview' | 'confirm' | 'applied';
  
  /** Selected recommendation */
  readonly selected: Recommendation | null;
  
  /** Preview data (what will change) */
  readonly previewDiff?: {
    before: unknown;
    after: unknown;
    changes: readonly string[];
  };
  
  /** Whether applying is in progress */
  readonly applying: boolean;
  
  /** Error if apply failed */
  readonly error?: string;
}

/**
 * Props for the ApplyRecommendation component.
 */
export interface ApplyRecommendationProps {
  /** Available recommendations */
  readonly recommendations: readonly Recommendation[];
  
  /** Current state */
  readonly state: ApplyRecommendationState;
  
  /** Callback when a recommendation is selected for preview */
  readonly onSelect: (recommendation: Recommendation) => void;
  
  /** Callback to accept and apply the selected recommendation */
  readonly onAccept: () => void;
  
  /** Callback to cancel/go back */
  readonly onCancel: () => void;
  
  /** Callback to dismiss after apply */
  readonly onDismiss: () => void;
}

/**
 * Create initial state for apply recommendation flow.
 */
export function createApplyRecommendationState(): ApplyRecommendationState {
  return {
    step: 'browse',
    selected: null,
    applying: false,
  };
}

// ============================================================================
// C083: "WHY?" EXPLANATION FLOW
// ============================================================================

/**
 * A node in the explanation tree.
 */
export interface ExplanationNode {
  /** Goal that was attempted */
  readonly goal: string;
  
  /** Human-readable explanation */
  readonly explanation: string;
  
  /** Whether the goal succeeded */
  readonly succeeded: boolean;
  
  /** Child nodes (sub-goals) */
  readonly children: readonly ExplanationNode[];
  
  /** Prolog clause that matched (if succeeded) */
  readonly matchedClause?: string;
  
  /** Depth in tree (for indentation) */
  readonly depth: number;
}

/**
 * Full explanation tree for a query result.
 */
export interface ExplanationTree {
  /** Root goal */
  readonly rootGoal: string;
  
  /** Root node of the tree */
  readonly root: ExplanationNode;
  
  /** Total nodes in tree */
  readonly nodeCount: number;
  
  /** Summary of why the result was reached */
  readonly summary: string;
}

/**
 * Props for the WhyExplanation component.
 */
export interface WhyExplanationProps {
  /** The explanation tree */
  readonly tree: ExplanationTree;
  
  /** Initially expanded depth (default: 1) */
  readonly initialExpandedDepth?: number;
  
  /** Callback when a node is clicked */
  readonly onNodeClick?: (node: ExplanationNode) => void;
  
  /** Show raw Prolog goals */
  readonly showRawGoals?: boolean;
  
  /** Highlight search term */
  readonly highlightTerm?: string;
}

/**
 * State for the WhyExplanation component.
 */
export interface WhyExplanationState {
  /** Set of expanded node indices (by path) */
  readonly expandedNodes: Set<string>;
  
  /** Currently selected node */
  readonly selectedNode: ExplanationNode | null;
  
  /** Search filter */
  readonly searchFilter: string;
}

/**
 * Create an explanation node.
 */
export function createExplanationNode(
  goal: string,
  explanation: string,
  succeeded: boolean,
  children: readonly ExplanationNode[] = [],
  depth: number = 0
): ExplanationNode {
  return {
    goal,
    explanation,
    succeeded,
    children,
    depth,
  };
}

/**
 * Build an explanation tree from Prolog explain/2 output.
 */
export function buildExplanationTree(
  rootGoal: string,
  explanations: readonly { goal: string; reason: string; parent?: string }[]
): ExplanationTree {
  // Build nodes
  const nodeMap = new Map<string, ExplanationNode>();
  const childrenMap = new Map<string, ExplanationNode[]>();
  
  for (const exp of explanations) {
    const node = createExplanationNode(exp.goal, exp.reason, true, [], 0);
    nodeMap.set(exp.goal, node);
    
    if (exp.parent) {
      const children = childrenMap.get(exp.parent) ?? [];
      children.push(node);
      childrenMap.set(exp.parent, children);
    }
  }
  
  // Build tree structure
  function buildNode(goal: string, depth: number): ExplanationNode {
    const base = nodeMap.get(goal) ?? createExplanationNode(goal, goal, true, [], depth);
    const children = (childrenMap.get(goal) ?? []).map(c => buildNode(c.goal, depth + 1));
    return { ...base, children, depth };
  }
  
  const root = buildNode(rootGoal, 0);
  
  // Count nodes
  function countNodes(node: ExplanationNode): number {
    return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
  }
  
  return {
    rootGoal,
    root,
    nodeCount: countNodes(root),
    summary: `${explanations.length} reasoning steps`,
  };
}

/**
 * Format an explanation tree as indented text.
 */
export function formatExplanationTree(tree: ExplanationTree): string {
  const lines: string[] = [];
  
  function formatNode(node: ExplanationNode): void {
    const indent = '  '.repeat(node.depth);
    const icon = node.succeeded ? '✓' : '✗';
    lines.push(`${indent}${icon} ${node.explanation}`);
    for (const child of node.children) {
      formatNode(child);
    }
  }
  
  formatNode(tree.root);
  return lines.join('\n');
}

// ============================================================================
// C069: STATEFUL SESSION MODE
// ============================================================================

/**
 * Session mode for interactive exploration.
 */
export type SessionMode = 'stateless' | 'stateful';

/**
 * Props for managing session mode.
 */
export interface SessionModeProps {
  /** Current mode */
  readonly mode: SessionMode;
  
  /** Callback to change mode */
  readonly onModeChange: (mode: SessionMode) => void;
  
  /** Whether to warn on mode change */
  readonly warnOnChange?: boolean;
  
  /** Current session facts count (for stateful mode) */
  readonly factCount?: number;
  
  /** Callback to clear session facts */
  readonly onClearSession?: () => void;
}

/**
 * Stateful session context.
 */
export interface StatefulSessionContext {
  /** Session ID */
  readonly sessionId: string;
  
  /** Facts asserted in this session */
  readonly facts: readonly InspectorFact[];
  
  /** Queries run in this session */
  readonly queryHistory: readonly InspectorGoal[];
  
  /** Whether session is "dirty" (has unsaved changes) */
  readonly dirty: boolean;
}

/**
 * Create a new stateful session context.
 */
export function createStatefulSession(): StatefulSessionContext {
  return {
    sessionId: `session_${Date.now()}`,
    facts: [],
    queryHistory: [],
    dirty: false,
  };
}
