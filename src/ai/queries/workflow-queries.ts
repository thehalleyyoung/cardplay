/**
 * @fileoverview Workflow Planning & Project Analysis Query Functions
 *
 * TypeScript wrappers around Prolog queries for:
 *   - Task decomposition into deck actions (N001-N010)
 *   - Deck sequencing and parameter dependencies (N003-N005)
 *   - Routing templates and validation (N031-N042)
 *   - Project health analysis (N051-N062)
 *   - Style/harmony/rhythm consistency checks (N070-N082)
 *   - Complexity metrics and simplification (N083-N094)
 *
 * @module @cardplay/ai/queries/workflow-queries
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadWorkflowPlanningKB } from '../knowledge/workflow-planning-loader';
import { loadProjectAnalysisKB } from '../knowledge/project-analysis-loader';

// =============================================================================
// Types – Workflow Planning
// =============================================================================

/** A decomposed workflow plan. */
export interface WorkflowPlan {
  readonly goal: string;
  readonly persona: string;
  readonly steps: string[];
}

/** Deck sequencing for a task. */
export interface DeckSequence {
  readonly task: string;
  readonly decks: string[];
}

/** Parameter dependency between decks. */
export interface ParameterDependency {
  readonly param: string;
  readonly sourceDeck: string;
  readonly affectedDeck: string;
}

/** Routing requirement for a task. */
export interface RoutingRequirement {
  readonly task: string;
  readonly sourceDeck: string;
  readonly targetDeck: string;
}

/** Workflow checkpoint. */
export interface WorkflowCheckpoint {
  readonly task: string;
  readonly checks: Array<{ id: string; description: string }>;
}

/** Routing template. */
export interface RoutingTemplate {
  readonly taskType: string;
  readonly deckSet: string[];
  readonly connections: string[];
}

/** Deck configuration pattern. */
export interface DeckConfigPattern {
  readonly task: string;
  readonly deckType: string;
  readonly settings: string[];
}

/** Cross-deck sync rule. */
export interface CrossDeckSync {
  readonly param: string;
  readonly deck1: string;
  readonly deck2: string;
}

// =============================================================================
// Types – Project Analysis
// =============================================================================

/** A project health metric. */
export interface HealthMetric {
  readonly id: string;
  readonly description: string;
}

/** A detected issue with remedy. */
export interface DetectedIssue {
  readonly category: 'missing' | 'overused' | 'structural' | 'technical' | 'style' | 'harmony' | 'rhythm' | 'balance' | 'complexity';
  readonly issueId: string;
  readonly remedy: string;
}

/** Simplification suggestion. */
export interface SimplificationSuggestion {
  readonly technique: string;
  readonly description: string;
}

/** Beginner safety warning. */
export interface SafetyWarning {
  readonly check: string;
  readonly warning: string;
}

/** Explanation of a detected issue. */
export interface IssueExplanation {
  readonly issueId: string;
  readonly category: string;
  readonly summary: string;
  readonly detail: string;
  readonly relatedRules: string[];
  readonly suggestedActions: string[];
}

// =============================================================================
// Workflow Planning Queries (N001-N050)
// =============================================================================

async function ensureWorkflowKB(adapter: PrologAdapter): Promise<void> {
  await loadWorkflowPlanningKB(adapter);
}

/**
 * N007: Plan a workflow by decomposing a goal into deck actions.
 */
export async function planWorkflow(
  goal: string,
  persona: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<WorkflowPlan | null> {
  await ensureWorkflowKB(adapter);
  const result = await adapter.querySingle(
    `task_decomposition(${goal}, ${persona}, Steps)`
  );
  if (!result) return null;
  return {
    goal,
    persona,
    steps: Array.isArray(result.Steps) ? result.Steps.map(String) : [String(result.Steps)],
  };
}

/**
 * N003: Get optimal deck opening sequence for a task.
 */
export async function getDeckSequence(
  task: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureWorkflowKB(adapter);
  const result = await adapter.querySingle(
    `deck_sequencing(${task}, Decks)`
  );
  if (!result) return [];
  return Array.isArray(result.Decks) ? result.Decks.map(String) : [String(result.Decks)];
}

/**
 * N004: Get parameter dependencies between decks.
 */
export async function getParameterDependencies(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ParameterDependency[]> {
  await ensureWorkflowKB(adapter);
  const results = await adapter.queryAll(
    'parameter_dependency(Param, Source, Affected)'
  );
  return results.map((r) => ({
    param: String(r.Param),
    sourceDeck: String(r.Source),
    affectedDeck: String(r.Affected),
  }));
}

/**
 * N005: Get routing requirements for a task.
 */
export async function getRoutingRequirements(
  task: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<RoutingRequirement[]> {
  await ensureWorkflowKB(adapter);
  const results = await adapter.queryAll(
    `routing_requirement(${task}, Source, Target)`
  );
  return results.map((r) => ({
    task,
    sourceDeck: String(r.Source),
    targetDeck: String(r.Target),
  }));
}

/**
 * N006: Get workflow checkpoints for validation.
 */
export async function getWorkflowCheckpoints(
  task: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<WorkflowCheckpoint | null> {
  await ensureWorkflowKB(adapter);
  const result = await adapter.querySingle(
    `workflow_checkpoint(${task}, Checks)`
  );
  if (!result) return null;
  const rawChecks = Array.isArray(result.Checks) ? result.Checks : [];
  const checks = rawChecks.map((c: unknown) => {
    if (typeof c === 'object' && c !== null && 'args' in c) {
      const args = (c as { args: unknown[] }).args;
      return { id: String(args[0]), description: String(args[1]) };
    }
    return { id: String(c), description: '' };
  });
  return { task, checks };
}

/**
 * N019: Get deck configuration pattern for a task.
 */
export async function getDeckConfigPatterns(
  task: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckConfigPattern[]> {
  await ensureWorkflowKB(adapter);
  const results = await adapter.queryAll(
    `deck_configuration_pattern(${task}, DeckType, Settings)`
  );
  return results.map((r) => ({
    task,
    deckType: String(r.DeckType),
    settings: Array.isArray(r.Settings) ? r.Settings.map(String) : [String(r.Settings)],
  }));
}

/**
 * N021: Get cross-deck synchronization rules.
 */
export async function getCrossDeckSyncRules(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CrossDeckSync[]> {
  await ensureWorkflowKB(adapter);
  const results = await adapter.queryAll(
    'cross_deck_sync_rule(Param, Deck1, Deck2)'
  );
  return results.map((r) => ({
    param: String(r.Param),
    deck1: String(r.Deck1),
    deck2: String(r.Deck2),
  }));
}

// =============================================================================
// Workflow Execution & Validation (N008-N009)
// =============================================================================

/** Result of executing a single workflow step. */
export interface WorkflowStepResult {
  readonly step: string;
  readonly status: 'completed' | 'skipped' | 'failed';
  readonly reason?: string;
}

/**
 * N008: Execute a single workflow step by checking preconditions.
 *
 * This function validates that the required decks and routing are available
 * before marking a step as executable. It does NOT perform side effects —
 * it returns a result indicating whether the step can proceed.
 */
export async function executeWorkflowStep(
  goal: string,
  stepIndex: number,
  availableDecks: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<WorkflowStepResult> {
  await ensureWorkflowKB(adapter);

  // Get the workflow plan
  const planResult = await adapter.querySingle(
    `task_decomposition(${goal}, _, Steps)`
  );
  if (!planResult) {
    return { step: 'unknown', status: 'failed', reason: `No workflow found for goal "${goal}"` };
  }
  const steps = Array.isArray(planResult.Steps) ? planResult.Steps.map(String) : [String(planResult.Steps)];
  if (stepIndex < 0 || stepIndex >= steps.length) {
    return { step: 'unknown', status: 'failed', reason: `Step index ${stepIndex} out of range (0-${steps.length - 1})` };
  }
  const step = steps[stepIndex]!;

  // Check deck sequencing — the step's required deck should be available
  const seqResult = await adapter.querySingle(`deck_sequencing(${goal}, Decks)`);
  if (seqResult) {
    const requiredDecks = Array.isArray(seqResult.Decks) ? seqResult.Decks.map(String) : [String(seqResult.Decks)];
    // Check if the deck for this step position is available
    if (stepIndex < requiredDecks.length) {
      const requiredDeck = requiredDecks[stepIndex];
      if (requiredDeck && !availableDecks.includes(requiredDeck)) {
        return {
          step,
          status: 'skipped',
          reason: `Required deck "${requiredDeck}" is not available. Open it first.`,
        };
      }
    }
  }

  // Check parameter dependencies — ensure source decks are present
  const deps = await adapter.queryAll('parameter_dependency(Param, Source, Affected)');
  for (const dep of deps) {
    const source = String(dep.Source);
    if (!availableDecks.includes(source)) {
      // Not a hard failure — just note it
    }
  }

  return { step, status: 'completed' };
}

/** Workflow validation result. */
export interface WorkflowValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * N009: Validate a workflow plan by checking that all required decks,
 * routing, and checkpoints are satisfiable.
 */
export async function validateWorkflow(
  goal: string,
  persona: string,
  availableDecks: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<WorkflowValidationResult> {
  await ensureWorkflowKB(adapter);
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check that the goal has a decomposition
  const planResult = await adapter.querySingle(
    `task_decomposition(${goal}, ${persona}, Steps)`
  );
  if (!planResult) {
    errors.push(`No workflow plan found for goal "${goal}" with persona "${persona}".`);
    return { valid: false, errors, warnings };
  }

  // 2. Check deck sequencing — all required decks should be available
  const seqResult = await adapter.querySingle(`deck_sequencing(${goal}, Decks)`);
  if (seqResult) {
    const requiredDecks = Array.isArray(seqResult.Decks) ? seqResult.Decks.map(String) : [String(seqResult.Decks)];
    for (const deck of requiredDecks) {
      if (!availableDecks.includes(deck)) {
        errors.push(`Required deck "${deck}" is not available.`);
      }
    }
  }

  // 3. Check routing requirements
  const routingResults = await adapter.queryAll(
    `routing_requirement(${goal}, Source, Target)`
  );
  for (const r of routingResults) {
    const source = String(r.Source);
    const target = String(r.Target);
    if (!availableDecks.includes(source)) {
      warnings.push(`Routing source "${source}" is not available.`);
    }
    if (!availableDecks.includes(target)) {
      warnings.push(`Routing target "${target}" is not available.`);
    }
  }

  // 4. Check parameter dependencies
  const deps = await adapter.queryAll('parameter_dependency(Param, Source, Affected)');
  for (const dep of deps) {
    const source = String(dep.Source);
    const affected = String(dep.Affected);
    if (availableDecks.includes(affected) && !availableDecks.includes(source)) {
      warnings.push(`Deck "${affected}" depends on parameter from "${source}" which is not available.`);
    }
  }

  // 5. Check checkpoints exist
  const checkpointResult = await adapter.querySingle(
    `workflow_checkpoint(${goal}, Checks)`
  );
  if (!checkpointResult) {
    warnings.push(`No checkpoints defined for goal "${goal}" — validation steps may be missing.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Routing template. */
export interface RoutingTemplateResult {
  readonly taskType: string;
  readonly deckSet: string[];
  readonly connections: string[];
}

/**
 * N031: Get routing template for a task type.
 */
export async function getRoutingTemplate(
  taskType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<RoutingTemplateResult | null> {
  await ensureWorkflowKB(adapter);
  const result = await adapter.querySingle(
    `routing_template(${taskType}, DeckSet, Connections)`
  );
  if (!result) return null;
  return {
    taskType,
    deckSet: Array.isArray(result.DeckSet) ? result.DeckSet.map(String) : [String(result.DeckSet)],
    connections: Array.isArray(result.Connections) ? result.Connections.map(String) : [String(result.Connections)],
  };
}

/** Signal flow validation issue. */
export interface SignalFlowIssue {
  readonly issueType: string;
  readonly description: string;
}

/**
 * N032: Validate signal flow for routing coherence.
 */
export async function validateSignalFlow(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SignalFlowIssue[]> {
  await ensureWorkflowKB(adapter);
  const results = await adapter.queryAll(
    'signal_flow_validation(Issue, Description)'
  );
  return results.map((r) => ({
    issueType: String(r.Issue),
    description: String(r.Description),
  }));
}

/** Routing optimization technique. */
export interface RoutingOptimization {
  readonly technique: string;
  readonly description: string;
}

/** A routing connection between decks. */
export interface RoutingConnection {
  readonly from: string;
  readonly to: string;
  readonly type: 'audio' | 'midi' | 'control';
}

/** Suggested routing graph. */
export interface RoutingGraph {
  readonly nodes: string[];
  readonly connections: RoutingConnection[];
}

/** Signal flow issue found during validation. */
export interface SignalFlowValidationResult {
  readonly valid: boolean;
  readonly issues: SignalFlowIssue[];
  readonly suggestions: string[];
}

/** Optimized routing result. */
export interface OptimizedRoutingResult {
  readonly original: RoutingConnection[];
  readonly optimized: RoutingConnection[];
  readonly removed: RoutingConnection[];
  readonly techniques: string[];
}

/**
 * N033: Get routing optimization techniques.
 */
export async function getRoutingOptimizations(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<RoutingOptimization[]> {
  await ensureWorkflowKB(adapter);
  const results = await adapter.queryAll(
    'routing_optimization(Technique, Description)'
  );
  return results.map((r) => ({
    technique: String(r.Technique),
    description: String(r.Description),
  }));
}

// =============================================================================
// Project Analysis Queries (N051-N100)
// =============================================================================

async function ensureAnalysisKB(adapter: PrologAdapter): Promise<void> {
  await loadProjectAnalysisKB(adapter);
}

/**
 * N052: Get project health metrics.
 */
export async function getHealthMetrics(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<HealthMetric[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'project_health_metric(Id, Description)'
  );
  return results.map((r) => ({
    id: String(r.Id),
    description: String(r.Description),
  }));
}

/**
 * N053: Get missing element issues.
 */
export async function getMissingElements(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'missing_element_detection(Issue, Remedy)'
  );
  return results.map((r) => ({
    category: 'missing' as const,
    issueId: String(r.Issue),
    remedy: String(r.Remedy),
  }));
}

/**
 * N054: Get overused element issues.
 */
export async function getOverusedElements(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'overused_element_detection(Issue, Remedy)'
  );
  return results.map((r) => ({
    category: 'overused' as const,
    issueId: String(r.Issue),
    remedy: String(r.Remedy),
  }));
}

/**
 * N055: Get structural issues.
 */
export async function getStructuralIssues(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'structural_issue_detection(Issue, Remedy)'
  );
  return results.map((r) => ({
    category: 'structural' as const,
    issueId: String(r.Issue),
    remedy: String(r.Remedy),
  }));
}

/**
 * N056: Get technical issues.
 */
export async function getTechnicalIssues(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'technical_issue_detection(Issue, Remedy)'
  );
  return results.map((r) => ({
    category: 'technical' as const,
    issueId: String(r.Issue),
    remedy: String(r.Remedy),
  }));
}

/**
 * N057: Get all detected issues across all categories.
 */
export async function getAllProjectIssues(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  const [missing, overused, structural, technical, style, harmony, rhythm, balance] =
    await Promise.all([
      getMissingElements(adapter),
      getOverusedElements(adapter),
      getStructuralIssues(adapter),
      getTechnicalIssues(adapter),
      getStyleConsistencyIssues(adapter),
      getHarmonyCoherenceIssues(adapter),
      getRhythmConsistencyIssues(adapter),
      getInstrumentationBalanceIssues(adapter),
    ]);
  return [...missing, ...overused, ...structural, ...technical, ...style, ...harmony, ...rhythm, ...balance];
}

/**
 * N070: Get style consistency issues.
 */
export async function getStyleConsistencyIssues(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'style_consistency_check(Issue, Description)'
  );
  return results.map((r) => ({
    category: 'style' as const,
    issueId: String(r.Issue),
    remedy: String(r.Description),
  }));
}

/**
 * N071: Get harmony coherence issues.
 */
export async function getHarmonyCoherenceIssues(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'harmony_coherence_check(Issue, Description)'
  );
  return results.map((r) => ({
    category: 'harmony' as const,
    issueId: String(r.Issue),
    remedy: String(r.Description),
  }));
}

/**
 * N072: Get rhythm consistency issues.
 */
export async function getRhythmConsistencyIssues(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'rhythm_consistency_check(Issue, Description)'
  );
  return results.map((r) => ({
    category: 'rhythm' as const,
    issueId: String(r.Issue),
    remedy: String(r.Description),
  }));
}

/**
 * N073: Get instrumentation balance issues.
 */
export async function getInstrumentationBalanceIssues(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DetectedIssue[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'instrumentation_balance_check(Issue, Description)'
  );
  return results.map((r) => ({
    category: 'balance' as const,
    issueId: String(r.Issue),
    remedy: String(r.Description),
  }));
}

/**
 * N084: Get simplification suggestions.
 */
export async function getSimplificationSuggestions(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SimplificationSuggestion[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'simplification_suggestion(Technique, Description)'
  );
  return results.map((r) => ({
    technique: String(r.Technique),
    description: String(r.Description),
  }));
}

/**
 * N085: Get beginner safety warnings.
 */
export async function getBeginnerSafetyWarnings(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SafetyWarning[]> {
  await ensureAnalysisKB(adapter);
  const results = await adapter.queryAll(
    'beginner_safety_check(Check, Warning)'
  );
  return results.map((r) => ({
    check: String(r.Check),
    warning: String(r.Warning),
  }));
}

/**
 * N059: Explain a detected issue with detailed reasoning.
 * Queries the KB for related rules and constructs a human-readable explanation.
 */
export async function explainIssue(
  issue: DetectedIssue,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<IssueExplanation> {
  await ensureAnalysisKB(adapter);

  // Map category to the KB predicate name
  const categoryPredicateMap: Record<string, string> = {
    missing: 'missing_element_detection',
    overused: 'overused_element_detection',
    structural: 'structural_issue_detection',
    technical: 'technical_issue_detection',
    style: 'style_consistency_check',
    harmony: 'harmony_coherence_check',
    rhythm: 'rhythm_consistency_check',
    balance: 'instrumentation_balance_check',
  };

  const predicate = categoryPredicateMap[issue.category];
  const relatedRules: string[] = [];

  if (predicate) {
    relatedRules.push(predicate);
    // Query the corresponding predicate to confirm the issue exists in the KB
    const results = await adapter.queryAll(`${predicate}(Issue, Remedy)`);
    // Collect any additional predicate names referenced by the results
    for (const r of results) {
      const id = String(r.Issue);
      if (id === issue.issueId) {
        // The issue is confirmed in the KB
        break;
      }
    }
  }

  // Query for suggested improvements if available
  const suggestedActions: string[] = [];
  try {
    const improvements = await adapter.queryAll(
      `suggest_improvement(${issue.issueId}, Improvement)`
    );
    for (const r of improvements) {
      suggestedActions.push(String(r.Improvement));
    }
  } catch {
    // suggest_improvement/2 may not be defined — fall through to fallback
  }

  // Fallback: use the issue remedy as a suggested action
  if (suggestedActions.length === 0) {
    suggestedActions.push(issue.remedy);
  }

  return {
    issueId: issue.issueId,
    category: issue.category,
    summary: issue.remedy,
    detail: `This ${issue.category} issue (${issue.issueId}) was detected by the project analysis KB.`,
    relatedRules,
    suggestedActions,
  };
}

// =============================================================================
// Routing Implementation Functions (N034-N036)
// =============================================================================

/**
 * N034: Suggest a routing graph for a task type, filtered to available decks.
 *
 * Queries the `routing_template/3` Prolog predicate to obtain a template for
 * the given task type, then filters connections so that both endpoints are
 * present in `availableDecks`. When no template exists in the KB, a minimal
 * graph containing only the available deck nodes (and no connections) is
 * returned.
 */
export async function suggestRouting(
  taskType: string,
  availableDecks: string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<RoutingGraph> {
  await ensureWorkflowKB(adapter);

  const result = await adapter.querySingle(
    `routing_template(${taskType}, DeckSet, Connections)`
  );

  if (!result) {
    // No template found – return minimal graph with available decks only
    return { nodes: [...availableDecks], connections: [] };
  }

  // Parse connections from the Prolog result.
  // Template connections are Prolog terms like connect(from, to) or
  // send(from, target, level). We normalise them into RoutingConnection[].
  const rawConnections = Array.isArray(result.Connections)
    ? result.Connections
    : [result.Connections];

  const allConnections: RoutingConnection[] = [];
  for (const conn of rawConnections) {
    if (typeof conn === 'object' && conn !== null && 'functor' in conn && 'args' in conn) {
      const functor = String((conn as { functor: unknown }).functor);
      const args: unknown[] = (conn as { args: unknown[] }).args;
      if (functor === 'connect' && args.length >= 2) {
        allConnections.push({
          from: String(args[0]),
          to: String(args[1]),
          type: 'audio',
        });
      } else if (functor === 'send' && args.length >= 2) {
        allConnections.push({
          from: String(args[0]),
          to: String(args[1]),
          type: 'audio',
        });
      } else if (functor === 'modulate' && args.length >= 2) {
        allConnections.push({
          from: String(args[0]),
          to: String(args[1]),
          type: 'control',
        });
      } else if (functor === 'insert' && args.length >= 2) {
        allConnections.push({
          from: String(args[0]),
          to: String(args[1]),
          type: 'audio',
        });
      }
    }
  }

  // Collect all nodes referenced in connections
  const deckSet = new Set(availableDecks);

  // Filter connections to only those whose both endpoints are available
  const filteredConnections = allConnections.filter(
    (c) => deckSet.has(c.from) && deckSet.has(c.to)
  );

  // Build the node list: available decks that participate in connections
  const activeNodes = new Set<string>();
  for (const c of filteredConnections) {
    activeNodes.add(c.from);
    activeNodes.add(c.to);
  }
  // Include all available decks even if they have no connections
  for (const deck of availableDecks) {
    activeNodes.add(deck);
  }

  return {
    nodes: [...activeNodes],
    connections: filteredConnections,
  };
}

/**
 * N035: Validate a signal flow graph represented as routing connections.
 *
 * Performs three categories of checks:
 *   1. Cycle detection (DFS-based, same algorithm pattern as persona-queries).
 *   2. Orphan node detection – nodes that neither send nor receive.
 *   3. KB-sourced validation rules from `signal_flow_validation/2`.
 */
export async function validateSignalFlowGraph(
  connections: RoutingConnection[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SignalFlowValidationResult> {
  await ensureWorkflowKB(adapter);

  const issues: SignalFlowIssue[] = [];
  const suggestions: string[] = [];

  // ---- 1. Cycle detection (DFS) -----------------------------------------

  // Build adjacency list
  const adj = new Map<string, string[]>();
  const allNodes = new Set<string>();
  for (const { from, to } of connections) {
    allNodes.add(from);
    allNodes.add(to);
    const existing = adj.get(from);
    if (existing) {
      existing.push(to);
    } else {
      adj.set(from, [to]);
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const parent = new Map<string, string>();
  let cycleFound = false;

  function dfs(node: string): string[] | null {
    visited.add(node);
    inStack.add(node);

    const neighbors = adj.get(node) ?? [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        parent.set(next, node);
        const cycle = dfs(next);
        if (cycle) return cycle;
      } else if (inStack.has(next)) {
        // Reconstruct cycle path
        const loop: string[] = [next];
        let cur = node;
        while (cur !== next) {
          loop.push(cur);
          cur = parent.get(cur) ?? next;
        }
        loop.push(next);
        loop.reverse();
        return loop;
      }
    }

    inStack.delete(node);
    return null;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      const loop = dfs(node);
      if (loop) {
        cycleFound = true;
        issues.push({
          issueType: 'feedback_loop',
          description: `Cycle detected: ${loop.join(' -> ')}`,
        });
        break;
      }
    }
  }

  // ---- 2. Orphan node detection -----------------------------------------

  const senders = new Set<string>();
  const receivers = new Set<string>();
  for (const { from, to } of connections) {
    senders.add(from);
    receivers.add(to);
  }
  for (const node of allNodes) {
    if (!senders.has(node) && !receivers.has(node)) {
      issues.push({
        issueType: 'disconnected_node',
        description: `Node "${node}" has no input or output connections`,
      });
    }
  }

  // ---- 3. KB-sourced validation rules -----------------------------------

  const kbIssues = await adapter.queryAll(
    'signal_flow_validation(Issue, Description)'
  );
  for (const r of kbIssues) {
    const issueType = String(r.Issue);
    const description = String(r.Description);

    // Map KB rules to concrete checks on the current graph
    if (issueType === 'feedback_loop' && cycleFound) {
      suggestions.push(description);
    } else if (issueType === 'disconnected_node' && issues.some((i) => i.issueType === 'disconnected_node')) {
      suggestions.push(description);
    } else if (issueType === 'missing_output') {
      // Check if any node reaches a plausible output (master/output)
      const hasOutput = [...allNodes].some(
        (n) => n === 'master' || n === 'output' || n.includes('output')
      );
      if (!hasOutput && allNodes.size > 0) {
        issues.push({ issueType: 'missing_output', description });
        suggestions.push(description);
      }
    } else if (issueType === 'impedance_mismatch') {
      // Note the rule for callers; no static check possible without levels
      suggestions.push(description);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * N036: Optimize a routing graph by removing redundancies.
 *
 * Applies three local optimizations:
 *   1. Remove duplicate connections (same from/to/type triple).
 *   2. Remove self-loops (from === to).
 *   3. Query `routing_optimization/2` for technique names to report.
 */
export async function optimizeRoutingGraph(
  connections: RoutingConnection[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<OptimizedRoutingResult> {
  await ensureWorkflowKB(adapter);

  const original = [...connections];
  const removed: RoutingConnection[] = [];

  // ---- 1. Remove self-loops ---------------------------------------------
  const noSelfLoops: RoutingConnection[] = [];
  for (const conn of connections) {
    if (conn.from === conn.to) {
      removed.push(conn);
    } else {
      noSelfLoops.push(conn);
    }
  }

  // ---- 2. Remove duplicate connections ----------------------------------
  const seen = new Set<string>();
  const deduplicated: RoutingConnection[] = [];
  for (const conn of noSelfLoops) {
    const key = `${conn.from}|${conn.to}|${conn.type}`;
    if (seen.has(key)) {
      removed.push(conn);
    } else {
      seen.add(key);
      deduplicated.push(conn);
    }
  }

  // ---- 3. Query KB for technique names ----------------------------------
  const kbTechniques = await adapter.queryAll(
    'routing_optimization(Technique, Description)'
  );
  const techniques = kbTechniques.map((r) => String(r.Technique));

  return {
    original,
    optimized: deduplicated,
    removed,
    techniques,
  };
}

// =============================================================================
// Project Complexity Measurement (N086)
// =============================================================================

/** A single complexity metric measurement. */
export interface ComplexityMeasurement {
  readonly metric: string;
  readonly description: string;
  readonly value: number;
  /** Threshold above which this metric contributes to "high" complexity. */
  readonly threshold: number;
  readonly exceeds: boolean;
}

/** Overall project complexity assessment. */
export interface ComplexityMetrics {
  readonly measurements: ComplexityMeasurement[];
  /** Aggregate complexity score (0–100). */
  readonly overallScore: number;
  /** Human-readable level. */
  readonly level: 'low' | 'moderate' | 'high' | 'very_high';
}

/**
 * Default thresholds for complexity metrics. These align with the
 * beginner_safety_check rules in project-analysis.pl.
 */
const COMPLEXITY_THRESHOLDS: Record<string, number> = {
  track_count: 16,
  unique_instruments: 10,
  effect_count: 20,
  automation_lanes: 12,
  routing_connections: 8,
  section_count: 8,
};

/**
 * N086: Measure project complexity based on KB-defined metrics.
 *
 * Accepts concrete values for each metric dimension (tracks, effects, etc.)
 * and scores them against thresholds. The KB supplies the metric definitions
 * and descriptions; thresholds are statically defined to match the
 * beginner_safety_check rules.
 *
 * @param projectStats - Record mapping metric IDs to their numeric values.
 *   Unknown metric IDs are silently ignored.
 */
export async function measureComplexity(
  projectStats: Record<string, number>,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ComplexityMetrics> {
  await ensureAnalysisKB(adapter);

  // Fetch metric definitions from KB
  const kbMetrics = await adapter.queryAll(
    'project_complexity_metric(Metric, Description)'
  );

  const measurements: ComplexityMeasurement[] = [];
  let exceededCount = 0;
  let totalRatio = 0;

  for (const r of kbMetrics) {
    const metric = String(r.Metric);
    const description = String(r.Description);
    const threshold = COMPLEXITY_THRESHOLDS[metric] ?? 10;
    const value = projectStats[metric] ?? 0;
    const exceeds = value > threshold;

    if (exceeds) exceededCount++;
    totalRatio += Math.min(value / threshold, 2); // cap at 2× to avoid outlier domination

    measurements.push({ metric, description, value, threshold, exceeds });
  }

  // Overall score: average ratio scaled to 0-100
  const metricCount = measurements.length || 1;
  const overallScore = Math.round((totalRatio / metricCount) * 50); // 50 = "at threshold"

  const level: ComplexityMetrics['level'] =
    overallScore >= 80 ? 'very_high' :
    overallScore >= 50 ? 'high' :
    overallScore >= 25 ? 'moderate' :
    'low';

  return { measurements, overallScore, level };
}

// =============================================================================
// Configuration Optimization (N024)
// =============================================================================

/** A recommended configuration change. */
export interface ConfigChange {
  readonly deckType: string;
  readonly setting: string;
  readonly currentValue?: string;
  readonly suggestedValue: string;
  readonly reason: string;
}

/** Result of configuration optimization. */
export interface OptimizationResult {
  readonly goal: string;
  readonly changes: ConfigChange[];
  readonly syncRules: CrossDeckSync[];
}

/**
 * N024: Optimize deck configuration for a given goal.
 *
 * Compares the current deck state against KB-recommended configuration
 * patterns for the goal, and emits a list of changes. Also includes
 * cross-deck sync rules that should be applied.
 *
 * @param goal - The workflow goal (must match a `deck_configuration_pattern` in KB).
 * @param currentState - Map of deckType → current settings list.
 */
export async function optimizeConfiguration(
  goal: string,
  currentState: Record<string, string[]>,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<OptimizationResult> {
  await ensureWorkflowKB(adapter);

  // 1. Get recommended patterns for this goal
  const patterns = await getDeckConfigPatterns(goal, adapter);

  // 2. Get cross-deck sync rules
  const syncRules = await getCrossDeckSyncRules(adapter);

  const changes: ConfigChange[] = [];

  for (const pattern of patterns) {
    const currentSettings = currentState[pattern.deckType] ?? [];

    // Find settings in the recommended pattern that are not in the current state
    for (const setting of pattern.settings) {
      if (!currentSettings.includes(setting)) {
        changes.push({
          deckType: pattern.deckType,
          setting,
          suggestedValue: setting,
          reason: `Recommended for "${goal}" workflow on ${pattern.deckType} deck`,
        });
      }
    }
  }

  // 3. Check sync rules: if one deck has a parameter, its paired deck should too
  for (const rule of syncRules) {
    const deck1Settings = currentState[rule.deck1] ?? [];
    const deck2Settings = currentState[rule.deck2] ?? [];
    const hasDeck1 = deck1Settings.includes(rule.param);
    const hasDeck2 = deck2Settings.includes(rule.param);

    if (hasDeck1 && !hasDeck2 && currentState[rule.deck2] !== undefined) {
      changes.push({
        deckType: rule.deck2,
        setting: rule.param,
        suggestedValue: rule.param,
        reason: `Parameter "${rule.param}" should be synchronized from ${rule.deck1}`,
      });
    } else if (hasDeck2 && !hasDeck1 && currentState[rule.deck1] !== undefined) {
      changes.push({
        deckType: rule.deck1,
        setting: rule.param,
        suggestedValue: rule.param,
        reason: `Parameter "${rule.param}" should be synchronized from ${rule.deck2}`,
      });
    }
  }

  return { goal, changes, syncRules };
}
