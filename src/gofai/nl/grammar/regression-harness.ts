/**
 * GOFAI NL Grammar — Regression Harness
 *
 * Provides a snapshot-based regression testing framework for the grammar
 * pipeline. The harness can:
 *
 * 1. **Snapshot parse forests** — capture the full structure of a parse
 *    (tree shape, ambiguities, rule IDs, priorities, semantic actions)
 *    as a deterministic, serializable representation.
 *
 * 2. **Detect ambiguity explosions** — compare successive snapshots and
 *    flag any unexpected increase in the number of parses or ambiguity
 *    points.
 *
 * 3. **Run golden-input suites** — execute a set of canonical inputs
 *    through the grammar and compare the resulting snapshots to known-
 *    good baselines.
 *
 * 4. **Paraphrase invariance** — verify that sets of paraphrased inputs
 *    produce structurally equivalent parse forests.
 *
 * 5. **Determinism checks** — parse the same input multiple times and
 *    verify that the snapshot is identical each time.
 *
 * ## Snapshot Format
 *
 * A snapshot is a plain JSON-serializable object capturing:
 * - Tree shape (node types, symbols, rule IDs)
 * - Ambiguity points (count, severity, alternatives)
 * - Semantic actions attached to AND-nodes
 * - Token spans and surface text
 * - Metadata (total nodes, max depth, etc.)
 *
 * IDs are normalized so that snapshots from different runs compare
 * equal when the parse structure is the same.
 *
 * @module gofai/nl/grammar/regression-harness
 * @see gofai_goalA.md Step 129
 */

// =============================================================================
// SNAPSHOT TYPES — deterministic, serializable parse representations
// =============================================================================

/**
 * A normalized snapshot of a parse forest.
 * IDs are replaced with sequential indices to ensure deterministic comparison.
 */
export interface ForestSnapshot {
  /** The type of the root node */
  readonly rootType: SnapshotNodeType;

  /** The root node snapshot */
  readonly root: SnapshotNode;

  /** Total number of distinct parse trees */
  readonly treeCount: number;

  /** The ambiguity snapshot */
  readonly ambiguities: readonly AmbiguitySnapshot[];

  /** Forest-level metadata */
  readonly metadata: SnapshotMetadata;

  /** The original source text */
  readonly source: string;

  /** Snapshot version (for forward compatibility) */
  readonly version: number;

  /** When this snapshot was taken (ISO 8601) */
  readonly timestamp: string;

  /** A hash of the structural content (ignoring timestamps and IDs) */
  readonly structuralHash: string;
}

/**
 * A normalized node in a forest snapshot.
 */
export type SnapshotNode =
  | SnapshotOrNode
  | SnapshotAndNode
  | SnapshotLeafNode;

export type SnapshotNodeType = 'or' | 'and' | 'leaf';

/**
 * Snapshot of an OR-node (ambiguity point).
 */
export interface SnapshotOrNode {
  readonly type: 'or';
  /** Sequential index (normalized ID) */
  readonly index: number;
  /** Non-terminal symbol */
  readonly symbol: string;
  /** Start offset in source */
  readonly start: number;
  /** End offset in source */
  readonly end: number;
  /** Alternative parses */
  readonly alternatives: readonly SnapshotAndNode[];
}

/**
 * Snapshot of an AND-node (single rule application).
 */
export interface SnapshotAndNode {
  readonly type: 'and';
  /** Sequential index (normalized ID) */
  readonly index: number;
  /** The grammar rule that was applied */
  readonly ruleId: string;
  /** Non-terminal symbol */
  readonly symbol: string;
  /** Child nodes */
  readonly children: readonly SnapshotNode[];
  /** Start offset in source */
  readonly start: number;
  /** End offset in source */
  readonly end: number;
  /** Priority value */
  readonly priority: number;
  /** Semantic action (if any) */
  readonly semanticAction: string | null;
}

/**
 * Snapshot of a leaf node (terminal token).
 */
export interface SnapshotLeafNode {
  readonly type: 'leaf';
  /** Sequential index (normalized ID) */
  readonly index: number;
  /** Token text */
  readonly text: string;
  /** Token category/type */
  readonly tokenType: string;
  /** Start offset in source */
  readonly start: number;
  /** End offset in source */
  readonly end: number;
}

/**
 * Snapshot of an ambiguity point.
 */
export interface AmbiguitySnapshot {
  /** Non-terminal symbol where ambiguity occurs */
  readonly symbol: string;
  /** Start offset */
  readonly start: number;
  /** End offset */
  readonly end: number;
  /** Ambiguous text */
  readonly text: string;
  /** Number of alternatives */
  readonly alternativeCount: number;
  /** Severity classification */
  readonly severity: 'low' | 'medium' | 'high';
  /** Alternative descriptions */
  readonly alternatives: readonly AlternativeSnapshot[];
}

/**
 * Snapshot of a single ambiguity alternative.
 */
export interface AlternativeSnapshot {
  readonly ruleId: string;
  readonly description: string;
  readonly priority: number;
}

/**
 * Forest-level metadata in a snapshot.
 */
export interface SnapshotMetadata {
  readonly totalNodes: number;
  readonly orNodeCount: number;
  readonly andNodeCount: number;
  readonly leafNodeCount: number;
  readonly maxDepth: number;
  readonly ambiguityCount: number;
}

// =============================================================================
// SNAPSHOT VERSION — for forward compatibility
// =============================================================================

/** Current snapshot format version */
export const SNAPSHOT_VERSION = 1;

// =============================================================================
// SNAPSHOT CREATION — capturing a parse forest as a snapshot
// =============================================================================

/**
 * State for sequential ID normalization during snapshot creation.
 */
interface NormalizationState {
  nextIndex: number;
}

/**
 * A minimal forest interface for snapshot creation.
 * This decouples the harness from the concrete parse-forest module
 * so it can be used in testing without importing the full parser.
 */
export interface ForestLike {
  readonly root: ForestNodeLike;
  readonly treeCount: number;
  readonly ambiguities: readonly AmbiguityLike[];
  readonly source: string;
  readonly metadata: {
    readonly totalNodes: number;
    readonly orNodeCount: number;
    readonly andNodeCount: number;
    readonly leafNodeCount: number;
    readonly maxDepth: number;
    readonly ambiguityCount: number;
  };
}

export interface ForestNodeLike {
  readonly type: 'or' | 'and' | 'leaf';
  readonly span: { readonly start: number; readonly end: number };
  // OR-node fields
  readonly symbol?: string;
  readonly alternatives?: readonly ForestNodeLike[];
  // AND-node fields
  readonly ruleId?: string;
  readonly children?: readonly ForestNodeLike[];
  readonly priority?: number;
  readonly semanticAction?: string;
  // Leaf-node fields
  readonly token?: { readonly text: string; readonly type: string };
}

export interface AmbiguityLike {
  readonly symbol: string;
  readonly span: { readonly start: number; readonly end: number };
  readonly text: string;
  readonly alternativeCount: number;
  readonly alternatives: readonly { readonly ruleId: string; readonly description: string; readonly priority: number }[];
  readonly severity: 'low' | 'medium' | 'high';
}

/**
 * Create a deterministic snapshot from a parse forest.
 *
 * Node IDs are replaced with sequential indices assigned in depth-first
 * order, ensuring that structurally identical forests produce identical
 * snapshots regardless of runtime-assigned IDs.
 */
export function createSnapshot(forest: ForestLike): ForestSnapshot {
  const state: NormalizationState = { nextIndex: 0 };
  const root = snapshotNode(forest.root, state);
  const ambiguities = forest.ambiguities.map(snapshotAmbiguity);
  const structuralHash = computeStructuralHash(root, ambiguities, forest.treeCount);

  return {
    rootType: forest.root.type,
    root,
    treeCount: forest.treeCount,
    ambiguities,
    metadata: { ...forest.metadata },
    source: forest.source,
    version: SNAPSHOT_VERSION,
    timestamp: new Date().toISOString(),
    structuralHash,
  };
}

/**
 * Normalize a single forest node into a snapshot node.
 */
function snapshotNode(node: ForestNodeLike, state: NormalizationState): SnapshotNode {
  const index = state.nextIndex++;

  switch (node.type) {
    case 'or':
      return {
        type: 'or',
        index,
        symbol: node.symbol ?? '<unknown>',
        start: node.span.start,
        end: node.span.end,
        alternatives: (node.alternatives ?? []).map(alt => {
          const snapped = snapshotNode(alt, state);
          if (snapped.type !== 'and') {
            // OR-node alternatives should be AND-nodes; wrap if needed
            const wrappedIndex = state.nextIndex++;
            return {
              type: 'and' as const,
              index: wrappedIndex,
              ruleId: '<wrapped>',
              symbol: node.symbol ?? '<unknown>',
              children: [snapped],
              start: snapped.start ?? node.span.start,
              end: snapped.end ?? node.span.end,
              priority: 0,
              semanticAction: null,
            };
          }
          return snapped;
        }),
      };

    case 'and':
      return {
        type: 'and',
        index,
        ruleId: node.ruleId ?? '<unknown>',
        symbol: node.symbol ?? '<unknown>',
        children: (node.children ?? []).map(child => snapshotNode(child, state)),
        start: node.span.start,
        end: node.span.end,
        priority: node.priority ?? 0,
        semanticAction: node.semanticAction ?? null,
      };

    case 'leaf':
      return {
        type: 'leaf',
        index,
        text: node.token?.text ?? '',
        tokenType: node.token?.type ?? 'unknown',
        start: node.span.start,
        end: node.span.end,
      };
  }
}

/**
 * Normalize an ambiguity point into a snapshot.
 */
function snapshotAmbiguity(amb: AmbiguityLike): AmbiguitySnapshot {
  return {
    symbol: amb.symbol,
    start: amb.span.start,
    end: amb.span.end,
    text: amb.text,
    alternativeCount: amb.alternativeCount,
    severity: amb.severity,
    alternatives: amb.alternatives.map(alt => ({
      ruleId: alt.ruleId,
      description: alt.description,
      priority: alt.priority,
    })),
  };
}

// =============================================================================
// STRUCTURAL HASHING — for fast equality comparison
// =============================================================================

/**
 * Compute a structural hash from the snapshot's content.
 * Uses a simple DJB2-like hash on the JSON-serialized structural data.
 */
function computeStructuralHash(
  root: SnapshotNode,
  ambiguities: readonly AmbiguitySnapshot[],
  treeCount: number,
): string {
  const data = JSON.stringify({ root: stripIndices(root), ambiguities, treeCount });
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash + data.charCodeAt(i)) & 0xFFFFFFFF;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Remove index fields from a snapshot node for hashing purposes.
 * Indices are sequential and depend on traversal order, not on structure.
 */
function stripIndices(node: SnapshotNode): Record<string, unknown> {
  switch (node.type) {
    case 'or':
      return {
        type: 'or',
        symbol: node.symbol,
        start: node.start,
        end: node.end,
        alternatives: node.alternatives.map(stripIndices),
      };
    case 'and':
      return {
        type: 'and',
        ruleId: node.ruleId,
        symbol: node.symbol,
        children: node.children.map(stripIndices),
        start: node.start,
        end: node.end,
        priority: node.priority,
        semanticAction: node.semanticAction,
      };
    case 'leaf':
      return {
        type: 'leaf',
        text: node.text,
        tokenType: node.tokenType,
        start: node.start,
        end: node.end,
      };
  }
}

// =============================================================================
// SNAPSHOT COMPARISON — detecting regressions
// =============================================================================

/**
 * Result of comparing two forest snapshots.
 */
export interface SnapshotComparison {
  /** Whether the snapshots are structurally identical */
  readonly equal: boolean;

  /** Structural hash match (fast check) */
  readonly hashMatch: boolean;

  /** Differences found (empty if equal) */
  readonly differences: readonly SnapshotDifference[];

  /** Summary statistics about what changed */
  readonly summary: ComparisonSummary;
}

/**
 * A single difference between two snapshots.
 */
export interface SnapshotDifference {
  /** Path to the difference (e.g., "root.alternatives[1].children[0]") */
  readonly path: string;

  /** Type of difference */
  readonly type: DifferenceType;

  /** Description of the difference */
  readonly description: string;

  /** The old value (if applicable) */
  readonly oldValue?: string;

  /** The new value (if applicable) */
  readonly newValue?: string;

  /** Severity of the difference */
  readonly severity: DifferenceSeverity;
}

export type DifferenceType =
  | 'tree_count_changed'
  | 'ambiguity_count_changed'
  | 'ambiguity_severity_changed'
  | 'node_type_changed'
  | 'symbol_changed'
  | 'rule_changed'
  | 'priority_changed'
  | 'semantic_action_changed'
  | 'children_count_changed'
  | 'span_changed'
  | 'token_changed'
  | 'new_ambiguity'
  | 'removed_ambiguity'
  | 'metadata_changed';

export type DifferenceSeverity = 'info' | 'warning' | 'error';

/**
 * Summary statistics about a comparison.
 */
export interface ComparisonSummary {
  /** Total number of differences */
  readonly totalDifferences: number;

  /** Counts by severity */
  readonly infoCount: number;
  readonly warningCount: number;
  readonly errorCount: number;

  /** Whether tree count changed */
  readonly treeCountChanged: boolean;
  readonly oldTreeCount: number;
  readonly newTreeCount: number;

  /** Whether ambiguity count changed */
  readonly ambiguityCountChanged: boolean;
  readonly oldAmbiguityCount: number;
  readonly newAmbiguityCount: number;

  /** Whether any ambiguity severity worsened */
  readonly ambiguitySeverityWorsened: boolean;

  /** Whether any semantic actions changed */
  readonly semanticActionsChanged: boolean;

  /** Whether any rule applications changed */
  readonly ruleApplicationsChanged: boolean;
}

/**
 * Compare two forest snapshots and produce a detailed diff.
 */
export function compareSnapshots(
  baseline: ForestSnapshot,
  current: ForestSnapshot,
): SnapshotComparison {
  const differences: SnapshotDifference[] = [];

  // Fast path: structural hashes match
  if (baseline.structuralHash === current.structuralHash) {
    return {
      equal: true,
      hashMatch: true,
      differences: [],
      summary: buildSummary([], baseline, current),
    };
  }

  // Compare tree counts
  if (baseline.treeCount !== current.treeCount) {
    differences.push({
      path: 'treeCount',
      type: 'tree_count_changed',
      description: `Tree count changed from ${baseline.treeCount} to ${current.treeCount}`,
      oldValue: String(baseline.treeCount),
      newValue: String(current.treeCount),
      severity: current.treeCount > baseline.treeCount ? 'warning' : 'info',
    });
  }

  // Compare metadata
  compareMetadata(baseline.metadata, current.metadata, differences);

  // Compare ambiguities
  compareAmbiguities(baseline.ambiguities, current.ambiguities, differences);

  // Compare tree structure (depth-first)
  compareNodes(baseline.root, current.root, 'root', differences);

  const equal = differences.length === 0;
  return {
    equal,
    hashMatch: false,
    differences,
    summary: buildSummary(differences, baseline, current),
  };
}

/**
 * Compare forest metadata.
 */
function compareMetadata(
  old_: SnapshotMetadata,
  new_: SnapshotMetadata,
  diffs: SnapshotDifference[],
): void {
  const keys: (keyof SnapshotMetadata)[] = [
    'totalNodes', 'orNodeCount', 'andNodeCount',
    'leafNodeCount', 'maxDepth', 'ambiguityCount',
  ];

  for (const key of keys) {
    if (old_[key] !== new_[key]) {
      diffs.push({
        path: `metadata.${key}`,
        type: 'metadata_changed',
        description: `${key} changed from ${old_[key]} to ${new_[key]}`,
        oldValue: String(old_[key]),
        newValue: String(new_[key]),
        severity: key === 'ambiguityCount' && new_[key] > old_[key] ? 'warning' : 'info',
      });
    }
  }
}

/**
 * Compare ambiguity lists.
 */
function compareAmbiguities(
  old_: readonly AmbiguitySnapshot[],
  new_: readonly AmbiguitySnapshot[],
  diffs: SnapshotDifference[],
): void {
  // Index by symbol+span for matching
  const oldByKey = new Map(old_.map(a => [ambiguityKey(a), a]));
  const newByKey = new Map(new_.map(a => [ambiguityKey(a), a]));

  // Find new ambiguities
  for (const [key, amb] of newByKey) {
    if (!oldByKey.has(key)) {
      diffs.push({
        path: `ambiguities[${key}]`,
        type: 'new_ambiguity',
        description: `New ambiguity: "${amb.text}" (${amb.symbol}) with ${amb.alternativeCount} alternatives`,
        newValue: `${amb.severity}: ${amb.alternativeCount} alternatives`,
        severity: amb.severity === 'high' ? 'error' : 'warning',
      });
    }
  }

  // Find removed ambiguities
  for (const [key, amb] of oldByKey) {
    if (!newByKey.has(key)) {
      diffs.push({
        path: `ambiguities[${key}]`,
        type: 'removed_ambiguity',
        description: `Ambiguity resolved: "${amb.text}" (${amb.symbol})`,
        oldValue: `${amb.severity}: ${amb.alternativeCount} alternatives`,
        severity: 'info',
      });
    }
  }

  // Find severity changes
  for (const [key, newAmb] of newByKey) {
    const oldAmb = oldByKey.get(key);
    if (!oldAmb) continue;

    if (oldAmb.severity !== newAmb.severity) {
      diffs.push({
        path: `ambiguities[${key}].severity`,
        type: 'ambiguity_severity_changed',
        description: `Ambiguity severity changed for "${newAmb.text}": ${oldAmb.severity} → ${newAmb.severity}`,
        oldValue: oldAmb.severity,
        newValue: newAmb.severity,
        severity: severityWorsened(oldAmb.severity, newAmb.severity) ? 'warning' : 'info',
      });
    }

    if (oldAmb.alternativeCount !== newAmb.alternativeCount) {
      diffs.push({
        path: `ambiguities[${key}].alternativeCount`,
        type: 'ambiguity_count_changed',
        description: `Alternative count changed for "${newAmb.text}": ${oldAmb.alternativeCount} → ${newAmb.alternativeCount}`,
        oldValue: String(oldAmb.alternativeCount),
        newValue: String(newAmb.alternativeCount),
        severity: newAmb.alternativeCount > oldAmb.alternativeCount ? 'warning' : 'info',
      });
    }
  }
}

function ambiguityKey(a: AmbiguitySnapshot): string {
  return `${a.symbol}@${a.start}:${a.end}`;
}

const SEVERITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 };

function severityWorsened(old_: string, new_: string): boolean {
  return (SEVERITY_ORDER[new_] ?? 0) > (SEVERITY_ORDER[old_] ?? 0);
}

/**
 * Recursively compare two snapshot nodes.
 */
function compareNodes(
  old_: SnapshotNode,
  new_: SnapshotNode,
  path: string,
  diffs: SnapshotDifference[],
): void {
  // Type mismatch
  if (old_.type !== new_.type) {
    diffs.push({
      path,
      type: 'node_type_changed',
      description: `Node type changed from ${old_.type} to ${new_.type}`,
      oldValue: old_.type,
      newValue: new_.type,
      severity: 'error',
    });
    return; // Cannot compare further
  }

  // Span change
  if (old_.start !== new_.start || old_.end !== new_.end) {
    diffs.push({
      path: `${path}.span`,
      type: 'span_changed',
      description: `Span changed from [${old_.start},${old_.end}) to [${new_.start},${new_.end})`,
      oldValue: `[${old_.start},${old_.end})`,
      newValue: `[${new_.start},${new_.end})`,
      severity: 'info',
    });
  }

  switch (old_.type) {
    case 'or': {
      const newOr = new_ as SnapshotOrNode;
      if (old_.symbol !== newOr.symbol) {
        diffs.push({
          path: `${path}.symbol`,
          type: 'symbol_changed',
          description: `Symbol changed from "${old_.symbol}" to "${newOr.symbol}"`,
          oldValue: old_.symbol,
          newValue: newOr.symbol,
          severity: 'error',
        });
      }
      const minLen = Math.min(old_.alternatives.length, newOr.alternatives.length);
      for (let i = 0; i < minLen; i++) {
        compareNodes(old_.alternatives[i]!, newOr.alternatives[i]!, `${path}.alternatives[${i}]`, diffs);
      }
      if (old_.alternatives.length !== newOr.alternatives.length) {
        diffs.push({
          path: `${path}.alternatives.length`,
          type: 'children_count_changed',
          description: `Alternative count changed from ${old_.alternatives.length} to ${newOr.alternatives.length}`,
          oldValue: String(old_.alternatives.length),
          newValue: String(newOr.alternatives.length),
          severity: 'warning',
        });
      }
      break;
    }

    case 'and': {
      const newAnd = new_ as SnapshotAndNode;
      if (old_.ruleId !== newAnd.ruleId) {
        diffs.push({
          path: `${path}.ruleId`,
          type: 'rule_changed',
          description: `Rule changed from "${old_.ruleId}" to "${newAnd.ruleId}"`,
          oldValue: old_.ruleId,
          newValue: newAnd.ruleId,
          severity: 'error',
        });
      }
      if (old_.symbol !== newAnd.symbol) {
        diffs.push({
          path: `${path}.symbol`,
          type: 'symbol_changed',
          description: `Symbol changed from "${old_.symbol}" to "${newAnd.symbol}"`,
          oldValue: old_.symbol,
          newValue: newAnd.symbol,
          severity: 'error',
        });
      }
      if (old_.priority !== newAnd.priority) {
        diffs.push({
          path: `${path}.priority`,
          type: 'priority_changed',
          description: `Priority changed from ${old_.priority} to ${newAnd.priority}`,
          oldValue: String(old_.priority),
          newValue: String(newAnd.priority),
          severity: 'warning',
        });
      }
      if (old_.semanticAction !== newAnd.semanticAction) {
        diffs.push({
          path: `${path}.semanticAction`,
          type: 'semantic_action_changed',
          description: `Semantic action changed from "${old_.semanticAction}" to "${newAnd.semanticAction}"`,
          oldValue: old_.semanticAction ?? '<none>',
          newValue: newAnd.semanticAction ?? '<none>',
          severity: 'error',
        });
      }
      const minLen = Math.min(old_.children.length, newAnd.children.length);
      for (let i = 0; i < minLen; i++) {
        compareNodes(old_.children[i]!, newAnd.children[i]!, `${path}.children[${i}]`, diffs);
      }
      if (old_.children.length !== newAnd.children.length) {
        diffs.push({
          path: `${path}.children.length`,
          type: 'children_count_changed',
          description: `Children count changed from ${old_.children.length} to ${newAnd.children.length}`,
          oldValue: String(old_.children.length),
          newValue: String(newAnd.children.length),
          severity: 'error',
        });
      }
      break;
    }

    case 'leaf': {
      const newLeaf = new_ as SnapshotLeafNode;
      if (old_.text !== newLeaf.text || old_.tokenType !== newLeaf.tokenType) {
        diffs.push({
          path: `${path}.token`,
          type: 'token_changed',
          description: `Token changed from "${old_.text}" (${old_.tokenType}) to "${newLeaf.text}" (${newLeaf.tokenType})`,
          oldValue: `${old_.text}:${old_.tokenType}`,
          newValue: `${newLeaf.text}:${newLeaf.tokenType}`,
          severity: 'error',
        });
      }
      break;
    }
  }
}

/**
 * Build a comparison summary from the list of differences.
 */
function buildSummary(
  diffs: readonly SnapshotDifference[],
  baseline: ForestSnapshot,
  current: ForestSnapshot,
): ComparisonSummary {
  let infoCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let semanticActionsChanged = false;
  let ruleApplicationsChanged = false;
  let ambiguitySeverityWorsened = false;

  for (const diff of diffs) {
    switch (diff.severity) {
      case 'info': infoCount++; break;
      case 'warning': warningCount++; break;
      case 'error': errorCount++; break;
    }
    if (diff.type === 'semantic_action_changed') semanticActionsChanged = true;
    if (diff.type === 'rule_changed') ruleApplicationsChanged = true;
    if (diff.type === 'ambiguity_severity_changed' && diff.severity === 'warning') {
      ambiguitySeverityWorsened = true;
    }
  }

  return {
    totalDifferences: diffs.length,
    infoCount,
    warningCount,
    errorCount,
    treeCountChanged: baseline.treeCount !== current.treeCount,
    oldTreeCount: baseline.treeCount,
    newTreeCount: current.treeCount,
    ambiguityCountChanged: baseline.metadata.ambiguityCount !== current.metadata.ambiguityCount,
    oldAmbiguityCount: baseline.metadata.ambiguityCount,
    newAmbiguityCount: current.metadata.ambiguityCount,
    ambiguitySeverityWorsened,
    semanticActionsChanged,
    ruleApplicationsChanged,
  };
}

// =============================================================================
// GOLDEN INPUT SUITE — test a set of known inputs against baselines
// =============================================================================

/**
 * A single golden test case.
 */
export interface GoldenTestCase {
  /** Unique test case ID */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** The input text */
  readonly input: string;

  /** The expected baseline snapshot */
  readonly baseline: ForestSnapshot;

  /** Tags for filtering/categorization */
  readonly tags: readonly string[];

  /** Optional notes about why this test exists */
  readonly notes?: string;
}

/**
 * A golden test suite — a collection of test cases.
 */
export interface GoldenTestSuite {
  /** Suite name */
  readonly name: string;

  /** Suite description */
  readonly description: string;

  /** The test cases */
  readonly cases: readonly GoldenTestCase[];

  /** When this suite was last updated */
  readonly lastUpdated: string;

  /** Suite-level metadata */
  readonly metadata: GoldenSuiteMetadata;
}

/**
 * Metadata about a golden test suite.
 */
export interface GoldenSuiteMetadata {
  readonly totalCases: number;
  readonly tagCounts: ReadonlyMap<string, number>;
}

/**
 * Result of running a golden test suite.
 */
export interface GoldenSuiteResult {
  /** Suite name */
  readonly suiteName: string;

  /** Overall pass/fail */
  readonly passed: boolean;

  /** Individual case results */
  readonly results: readonly GoldenCaseResult[];

  /** Summary statistics */
  readonly summary: GoldenSuiteSummary;
}

/**
 * Result for a single golden test case.
 */
export interface GoldenCaseResult {
  /** The test case */
  readonly testCase: GoldenTestCase;

  /** Whether the case passed */
  readonly passed: boolean;

  /** The comparison (if a current snapshot was produced) */
  readonly comparison: SnapshotComparison | null;

  /** The current snapshot (if produced) */
  readonly currentSnapshot: ForestSnapshot | null;

  /** Error message (if the parse failed) */
  readonly error: string | null;
}

/**
 * Summary of a golden suite run.
 */
export interface GoldenSuiteSummary {
  readonly totalCases: number;
  readonly passedCases: number;
  readonly failedCases: number;
  readonly errorCases: number;
  readonly passRate: number;
}

/**
 * A parse function that takes input text and produces a ForestLike.
 * This abstraction allows the harness to work with any parser.
 */
export type ParseFunction = (input: string) => ForestLike | null;

/**
 * Run a golden test suite against a parser.
 */
export function runGoldenSuite(
  suite: GoldenTestSuite,
  parse: ParseFunction,
): GoldenSuiteResult {
  const results: GoldenCaseResult[] = [];

  for (const testCase of suite.cases) {
    let currentSnapshot: ForestSnapshot | null = null;
    let comparison: SnapshotComparison | null = null;
    let error: string | null = null;

    try {
      const forest = parse(testCase.input);
      if (forest === null) {
        error = `Parse returned null for input: "${testCase.input}"`;
      } else {
        currentSnapshot = createSnapshot(forest);
        comparison = compareSnapshots(testCase.baseline, currentSnapshot);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const passed = comparison !== null && comparison.equal && error === null;
    results.push({ testCase, passed, comparison, currentSnapshot, error });
  }

  const passedCases = results.filter(r => r.passed).length;
  const errorCases = results.filter(r => r.error !== null).length;
  const failedCases = results.length - passedCases - errorCases;

  return {
    suiteName: suite.name,
    passed: passedCases === results.length,
    results,
    summary: {
      totalCases: results.length,
      passedCases,
      failedCases,
      errorCases,
      passRate: results.length > 0 ? passedCases / results.length : 1,
    },
  };
}

// =============================================================================
// PARAPHRASE INVARIANCE — verify that paraphrases produce equivalent forests
// =============================================================================

/**
 * A paraphrase group: a set of inputs that should produce equivalent parses.
 */
export interface ParaphraseGroup {
  /** Group name */
  readonly name: string;

  /** The canonical input */
  readonly canonical: string;

  /** Paraphrases of the canonical input */
  readonly paraphrases: readonly string[];

  /** Tags for filtering */
  readonly tags: readonly string[];
}

/**
 * Result of a paraphrase invariance check.
 */
export interface ParaphraseResult {
  /** The group that was tested */
  readonly group: ParaphraseGroup;

  /** Whether all paraphrases are structurally equivalent */
  readonly invariant: boolean;

  /** The canonical snapshot */
  readonly canonicalSnapshot: ForestSnapshot | null;

  /** Per-paraphrase results */
  readonly paraphraseResults: readonly ParaphraseComparisonResult[];

  /** How many paraphrases matched */
  readonly matchCount: number;
  readonly totalCount: number;
}

/**
 * Result for a single paraphrase comparison.
 */
export interface ParaphraseComparisonResult {
  /** The paraphrase text */
  readonly paraphrase: string;

  /** Whether it matched the canonical parse */
  readonly matched: boolean;

  /** The structural comparison */
  readonly comparison: SnapshotComparison | null;

  /** The paraphrase's snapshot */
  readonly snapshot: ForestSnapshot | null;

  /** Error (if parse failed) */
  readonly error: string | null;
}

/**
 * Check paraphrase invariance for a group of inputs.
 *
 * Structural equivalence is checked by comparing structural hashes.
 * Two forests are "equivalent" if they have the same tree shape, rules,
 * symbols, and semantic actions — but spans and source text may differ
 * (because the paraphrases have different wording).
 */
export function checkParaphraseInvariance(
  group: ParaphraseGroup,
  parse: ParseFunction,
): ParaphraseResult {
  // Parse canonical
  let canonicalSnapshot: ForestSnapshot | null = null;
  try {
    const forest = parse(group.canonical);
    if (forest) canonicalSnapshot = createSnapshot(forest);
  } catch {
    // canonical failed to parse
  }

  if (!canonicalSnapshot) {
    return {
      group,
      invariant: false,
      canonicalSnapshot: null,
      paraphraseResults: group.paraphrases.map(p => ({
        paraphrase: p,
        matched: false,
        comparison: null,
        snapshot: null,
        error: 'Canonical parse failed',
      })),
      matchCount: 0,
      totalCount: group.paraphrases.length,
    };
  }

  const paraphraseResults: ParaphraseComparisonResult[] = [];
  let matchCount = 0;

  for (const paraphrase of group.paraphrases) {
    let snapshot: ForestSnapshot | null = null;
    let comparison: SnapshotComparison | null = null;
    let error: string | null = null;

    try {
      const forest = parse(paraphrase);
      if (forest) {
        snapshot = createSnapshot(forest);
        // For paraphrase comparison, we compare tree structure ignoring spans
        comparison = compareSnapshotsStructural(canonicalSnapshot, snapshot);
      } else {
        error = `Parse returned null for paraphrase: "${paraphrase}"`;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const matched = comparison !== null && comparison.equal;
    if (matched) matchCount++;
    paraphraseResults.push({ paraphrase, matched, comparison, snapshot, error });
  }

  return {
    group,
    invariant: matchCount === group.paraphrases.length,
    canonicalSnapshot,
    paraphraseResults,
    matchCount,
    totalCount: group.paraphrases.length,
  };
}

/**
 * Compare two snapshots structurally, ignoring spans and source text.
 * This is used for paraphrase equivalence where the wording differs
 * but the parse structure should be the same.
 */
export function compareSnapshotsStructural(
  baseline: ForestSnapshot,
  current: ForestSnapshot,
): SnapshotComparison {
  const differences: SnapshotDifference[] = [];

  if (baseline.treeCount !== current.treeCount) {
    differences.push({
      path: 'treeCount',
      type: 'tree_count_changed',
      description: `Tree count changed from ${baseline.treeCount} to ${current.treeCount}`,
      oldValue: String(baseline.treeCount),
      newValue: String(current.treeCount),
      severity: 'error',
    });
  }

  if (baseline.metadata.ambiguityCount !== current.metadata.ambiguityCount) {
    differences.push({
      path: 'metadata.ambiguityCount',
      type: 'ambiguity_count_changed',
      description: `Ambiguity count changed`,
      oldValue: String(baseline.metadata.ambiguityCount),
      newValue: String(current.metadata.ambiguityCount),
      severity: 'warning',
    });
  }

  // Compare tree structure ignoring spans
  compareNodesStructural(baseline.root, current.root, 'root', differences);

  return {
    equal: differences.length === 0,
    hashMatch: false,
    differences,
    summary: buildSummary(differences, baseline, current),
  };
}

/**
 * Compare nodes structurally (ignoring spans and token text).
 */
function compareNodesStructural(
  old_: SnapshotNode,
  new_: SnapshotNode,
  path: string,
  diffs: SnapshotDifference[],
): void {
  if (old_.type !== new_.type) {
    diffs.push({
      path,
      type: 'node_type_changed',
      description: `Node type changed from ${old_.type} to ${new_.type}`,
      oldValue: old_.type,
      newValue: new_.type,
      severity: 'error',
    });
    return;
  }

  switch (old_.type) {
    case 'or': {
      const newOr = new_ as SnapshotOrNode;
      if (old_.symbol !== newOr.symbol) {
        diffs.push({
          path: `${path}.symbol`,
          type: 'symbol_changed',
          description: `Symbol changed from "${old_.symbol}" to "${newOr.symbol}"`,
          oldValue: old_.symbol,
          newValue: newOr.symbol,
          severity: 'error',
        });
      }
      const minLen = Math.min(old_.alternatives.length, newOr.alternatives.length);
      for (let i = 0; i < minLen; i++) {
        compareNodesStructural(old_.alternatives[i]!, newOr.alternatives[i]!, `${path}.alternatives[${i}]`, diffs);
      }
      if (old_.alternatives.length !== newOr.alternatives.length) {
        diffs.push({
          path: `${path}.alternatives.length`,
          type: 'children_count_changed',
          description: `Alternative count changed from ${old_.alternatives.length} to ${newOr.alternatives.length}`,
          oldValue: String(old_.alternatives.length),
          newValue: String(newOr.alternatives.length),
          severity: 'warning',
        });
      }
      break;
    }

    case 'and': {
      const newAnd = new_ as SnapshotAndNode;
      if (old_.ruleId !== newAnd.ruleId) {
        diffs.push({
          path: `${path}.ruleId`,
          type: 'rule_changed',
          description: `Rule changed from "${old_.ruleId}" to "${newAnd.ruleId}"`,
          oldValue: old_.ruleId,
          newValue: newAnd.ruleId,
          severity: 'error',
        });
      }
      if (old_.symbol !== newAnd.symbol) {
        diffs.push({
          path: `${path}.symbol`,
          type: 'symbol_changed',
          description: `Symbol changed`,
          oldValue: old_.symbol,
          newValue: newAnd.symbol,
          severity: 'error',
        });
      }
      if (old_.semanticAction !== newAnd.semanticAction) {
        diffs.push({
          path: `${path}.semanticAction`,
          type: 'semantic_action_changed',
          description: `Semantic action changed`,
          oldValue: old_.semanticAction ?? '<none>',
          newValue: newAnd.semanticAction ?? '<none>',
          severity: 'error',
        });
      }
      const minLen = Math.min(old_.children.length, newAnd.children.length);
      for (let i = 0; i < minLen; i++) {
        compareNodesStructural(old_.children[i]!, newAnd.children[i]!, `${path}.children[${i}]`, diffs);
      }
      if (old_.children.length !== newAnd.children.length) {
        diffs.push({
          path: `${path}.children.length`,
          type: 'children_count_changed',
          description: `Children count changed from ${old_.children.length} to ${newAnd.children.length}`,
          oldValue: String(old_.children.length),
          newValue: String(newAnd.children.length),
          severity: 'error',
        });
      }
      break;
    }

    case 'leaf': {
      // For structural comparison, we don't compare token text (paraphrases differ)
      // We compare token type only
      const newLeaf = new_ as SnapshotLeafNode;
      if (old_.tokenType !== newLeaf.tokenType) {
        diffs.push({
          path: `${path}.tokenType`,
          type: 'token_changed',
          description: `Token type changed from "${old_.tokenType}" to "${newLeaf.tokenType}"`,
          oldValue: old_.tokenType,
          newValue: newLeaf.tokenType,
          severity: 'warning',
        });
      }
      break;
    }
  }
}

// =============================================================================
// DETERMINISM CHECK — verify same input always produces same parse
// =============================================================================

/**
 * Result of a determinism check.
 */
export interface DeterminismResult {
  /** The input that was tested */
  readonly input: string;

  /** Whether all runs produced identical snapshots */
  readonly deterministic: boolean;

  /** How many runs were performed */
  readonly runCount: number;

  /** The hashes from each run */
  readonly hashes: readonly string[];

  /** The unique hashes (should be 1 for deterministic parsers) */
  readonly uniqueHashes: readonly string[];

  /** Differences between first and last run (if not deterministic) */
  readonly drift: SnapshotComparison | null;
}

/**
 * Check parse determinism by running the same input multiple times.
 */
export function checkDeterminism(
  input: string,
  parse: ParseFunction,
  runs: number = 10,
): DeterminismResult {
  const snapshots: ForestSnapshot[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < runs; i++) {
    try {
      const forest = parse(input);
      if (forest) {
        const snap = createSnapshot(forest);
        snapshots.push(snap);
        hashes.push(snap.structuralHash);
      } else {
        hashes.push('<null>');
      }
    } catch {
      hashes.push('<error>');
    }
  }

  const uniqueHashes = [...new Set(hashes)];
  const deterministic = uniqueHashes.length <= 1;

  let drift: SnapshotComparison | null = null;
  if (!deterministic && snapshots.length >= 2) {
    drift = compareSnapshots(snapshots[0]!, snapshots[snapshots.length - 1]!);
  }

  return {
    input,
    deterministic,
    runCount: runs,
    hashes,
    uniqueHashes,
    drift,
  };
}

// =============================================================================
// AMBIGUITY EXPLOSION DETECTION
// =============================================================================

/**
 * Configuration for ambiguity explosion detection.
 */
export interface AmbiguityExplosionConfig {
  /** Maximum allowed tree count (default 50) */
  readonly maxTreeCount: number;

  /** Maximum allowed ambiguity points (default 10) */
  readonly maxAmbiguityCount: number;

  /** Maximum allowed total OR-node alternatives (default 100) */
  readonly maxTotalAlternatives: number;

  /** Maximum allowed parse depth (default 30) */
  readonly maxDepth: number;

  /** Maximum ratio of tree count increase between baseline and current */
  readonly maxTreeCountRatio: number;
}

/**
 * Default ambiguity explosion thresholds.
 */
export const DEFAULT_EXPLOSION_CONFIG: AmbiguityExplosionConfig = {
  maxTreeCount: 50,
  maxAmbiguityCount: 10,
  maxTotalAlternatives: 100,
  maxDepth: 30,
  maxTreeCountRatio: 5.0,
};

/**
 * Ambiguity explosion alert.
 */
export interface AmbiguityExplosionAlert {
  /** What threshold was exceeded */
  readonly metric: string;

  /** The threshold value */
  readonly threshold: number;

  /** The actual value */
  readonly actual: number;

  /** Human-readable message */
  readonly message: string;

  /** Severity */
  readonly severity: 'warning' | 'error';
}

/**
 * Result of an ambiguity explosion check.
 */
export interface AmbiguityExplosionResult {
  /** Whether any explosion was detected */
  readonly explosion: boolean;

  /** Alerts generated */
  readonly alerts: readonly AmbiguityExplosionAlert[];

  /** The snapshot that was checked */
  readonly snapshot: ForestSnapshot;
}

/**
 * Check a snapshot for ambiguity explosion (exceeding configured thresholds).
 */
export function checkAmbiguityExplosion(
  snapshot: ForestSnapshot,
  config: AmbiguityExplosionConfig = DEFAULT_EXPLOSION_CONFIG,
): AmbiguityExplosionResult {
  const alerts: AmbiguityExplosionAlert[] = [];

  if (snapshot.treeCount > config.maxTreeCount) {
    alerts.push({
      metric: 'treeCount',
      threshold: config.maxTreeCount,
      actual: snapshot.treeCount,
      message: `Tree count ${snapshot.treeCount} exceeds threshold ${config.maxTreeCount}`,
      severity: snapshot.treeCount > config.maxTreeCount * 2 ? 'error' : 'warning',
    });
  }

  if (snapshot.metadata.ambiguityCount > config.maxAmbiguityCount) {
    alerts.push({
      metric: 'ambiguityCount',
      threshold: config.maxAmbiguityCount,
      actual: snapshot.metadata.ambiguityCount,
      message: `Ambiguity count ${snapshot.metadata.ambiguityCount} exceeds threshold ${config.maxAmbiguityCount}`,
      severity: snapshot.metadata.ambiguityCount > config.maxAmbiguityCount * 2 ? 'error' : 'warning',
    });
  }

  // Count total alternatives across all OR-nodes
  const totalAlternatives = countTotalAlternatives(snapshot.root);
  if (totalAlternatives > config.maxTotalAlternatives) {
    alerts.push({
      metric: 'totalAlternatives',
      threshold: config.maxTotalAlternatives,
      actual: totalAlternatives,
      message: `Total alternatives ${totalAlternatives} exceeds threshold ${config.maxTotalAlternatives}`,
      severity: 'error',
    });
  }

  if (snapshot.metadata.maxDepth > config.maxDepth) {
    alerts.push({
      metric: 'maxDepth',
      threshold: config.maxDepth,
      actual: snapshot.metadata.maxDepth,
      message: `Max depth ${snapshot.metadata.maxDepth} exceeds threshold ${config.maxDepth}`,
      severity: 'warning',
    });
  }

  return {
    explosion: alerts.length > 0,
    alerts,
    snapshot,
  };
}

/**
 * Check whether the tree count ratio between two snapshots indicates
 * an ambiguity explosion (e.g., adding a grammar rule caused a 10x
 * increase in parse trees).
 */
export function checkExplosionRatio(
  baseline: ForestSnapshot,
  current: ForestSnapshot,
  config: AmbiguityExplosionConfig = DEFAULT_EXPLOSION_CONFIG,
): AmbiguityExplosionAlert | null {
  if (baseline.treeCount === 0) return null;

  const ratio = current.treeCount / baseline.treeCount;
  if (ratio > config.maxTreeCountRatio) {
    return {
      metric: 'treeCountRatio',
      threshold: config.maxTreeCountRatio,
      actual: ratio,
      message: `Tree count ratio ${ratio.toFixed(1)}x exceeds threshold ${config.maxTreeCountRatio}x (${baseline.treeCount} → ${current.treeCount})`,
      severity: ratio > config.maxTreeCountRatio * 2 ? 'error' : 'warning',
    };
  }
  return null;
}

/**
 * Count the total number of alternatives across all OR-nodes.
 */
function countTotalAlternatives(node: SnapshotNode): number {
  switch (node.type) {
    case 'or':
      return node.alternatives.length + node.alternatives.reduce(
        (sum, alt) => sum + countTotalAlternatives(alt), 0,
      );
    case 'and':
      return node.children.reduce(
        (sum, child) => sum + countTotalAlternatives(child), 0,
      );
    case 'leaf':
      return 0;
  }
}

// =============================================================================
// REPORT FORMATTING — human-readable output
// =============================================================================

/**
 * Format a snapshot comparison as a human-readable report.
 */
export function formatComparisonReport(comparison: SnapshotComparison): string {
  const lines: string[] = [];

  if (comparison.equal) {
    lines.push('✓ Snapshots are structurally identical');
    if (comparison.hashMatch) {
      lines.push('  (verified by structural hash match)');
    }
    return lines.join('\n');
  }

  lines.push('✗ Snapshots differ:');
  lines.push('');

  const { summary } = comparison;
  lines.push(`  Total differences: ${summary.totalDifferences}`);
  if (summary.errorCount > 0) lines.push(`  Errors: ${summary.errorCount}`);
  if (summary.warningCount > 0) lines.push(`  Warnings: ${summary.warningCount}`);
  if (summary.infoCount > 0) lines.push(`  Info: ${summary.infoCount}`);
  lines.push('');

  if (summary.treeCountChanged) {
    lines.push(`  Tree count: ${summary.oldTreeCount} → ${summary.newTreeCount}`);
  }
  if (summary.ambiguityCountChanged) {
    lines.push(`  Ambiguity count: ${summary.oldAmbiguityCount} → ${summary.newAmbiguityCount}`);
  }
  if (summary.ambiguitySeverityWorsened) {
    lines.push('  ⚠ Ambiguity severity worsened');
  }
  if (summary.semanticActionsChanged) {
    lines.push('  ⚠ Semantic actions changed');
  }
  if (summary.ruleApplicationsChanged) {
    lines.push('  ⚠ Rule applications changed');
  }

  lines.push('');
  lines.push('  Details:');
  for (const diff of comparison.differences) {
    const marker = diff.severity === 'error' ? '✗' : diff.severity === 'warning' ? '⚠' : '·';
    lines.push(`    ${marker} [${diff.path}] ${diff.description}`);
  }

  return lines.join('\n');
}

/**
 * Format a golden suite result as a human-readable report.
 */
export function formatGoldenReport(result: GoldenSuiteResult): string {
  const lines: string[] = [];
  const { summary } = result;

  lines.push(`Golden Suite: ${result.suiteName}`);
  lines.push(`  Total: ${summary.totalCases}  Passed: ${summary.passedCases}  Failed: ${summary.failedCases}  Errors: ${summary.errorCases}`);
  lines.push(`  Pass rate: ${(summary.passRate * 100).toFixed(1)}%`);
  lines.push('');

  for (const r of result.results) {
    const status = r.passed ? '✓' : r.error ? '✗ ERROR' : '✗ FAIL';
    lines.push(`  ${status} ${r.testCase.name} (${r.testCase.id})`);
    if (r.error) {
      lines.push(`    Error: ${r.error}`);
    } else if (r.comparison && !r.comparison.equal) {
      lines.push(`    ${r.comparison.summary.totalDifferences} differences found`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a paraphrase invariance result as a human-readable report.
 */
export function formatParaphraseReport(result: ParaphraseResult): string {
  const lines: string[] = [];

  lines.push(`Paraphrase Group: ${result.group.name}`);
  lines.push(`  Canonical: "${result.group.canonical}"`);
  lines.push(`  Matches: ${result.matchCount}/${result.totalCount}`);
  lines.push(`  Invariant: ${result.invariant ? 'YES' : 'NO'}`);
  lines.push('');

  for (const r of result.paraphraseResults) {
    const status = r.matched ? '✓' : r.error ? '✗ ERROR' : '✗ DIFFER';
    lines.push(`  ${status} "${r.paraphrase}"`);
    if (r.error) {
      lines.push(`    Error: ${r.error}`);
    } else if (r.comparison && !r.comparison.equal) {
      lines.push(`    ${r.comparison.summary.totalDifferences} structural differences`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a determinism result as a human-readable report.
 */
export function formatDeterminismReport(result: DeterminismResult): string {
  const lines: string[] = [];

  lines.push(`Determinism Check: "${result.input}"`);
  lines.push(`  Runs: ${result.runCount}`);
  lines.push(`  Unique hashes: ${result.uniqueHashes.length}`);
  lines.push(`  Deterministic: ${result.deterministic ? 'YES' : 'NO'}`);

  if (!result.deterministic) {
    lines.push('');
    lines.push('  Hashes:');
    for (let i = 0; i < result.hashes.length; i++) {
      lines.push(`    Run ${i + 1}: ${result.hashes[i]}`);
    }
    if (result.drift) {
      lines.push('');
      lines.push('  Drift between first and last run:');
      lines.push(formatComparisonReport(result.drift).split('\n').map(l => `    ${l}`).join('\n'));
    }
  }

  return lines.join('\n');
}

/**
 * Format an ambiguity explosion result as a human-readable report.
 */
export function formatExplosionReport(result: AmbiguityExplosionResult): string {
  const lines: string[] = [];

  if (!result.explosion) {
    lines.push('✓ No ambiguity explosion detected');
    return lines.join('\n');
  }

  lines.push('⚠ Ambiguity explosion detected:');
  for (const alert of result.alerts) {
    const marker = alert.severity === 'error' ? '✗' : '⚠';
    lines.push(`  ${marker} ${alert.message}`);
  }

  return lines.join('\n');
}

// =============================================================================
// SERIALIZATION — JSON-safe snapshot I/O
// =============================================================================

/**
 * Serialize a snapshot to JSON string (pretty-printed).
 */
export function serializeSnapshot(snapshot: ForestSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Deserialize a snapshot from JSON string.
 * Returns null if the JSON is invalid or does not match the snapshot schema.
 */
export function deserializeSnapshot(json: string): ForestSnapshot | null {
  try {
    const parsed = JSON.parse(json);
    if (!isForestSnapshot(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Type guard for ForestSnapshot.
 */
function isForestSnapshot(value: unknown): value is ForestSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['version'] === 'number' &&
    typeof obj['source'] === 'string' &&
    typeof obj['structuralHash'] === 'string' &&
    typeof obj['treeCount'] === 'number' &&
    typeof obj['rootType'] === 'string' &&
    obj['root'] !== undefined &&
    Array.isArray(obj['ambiguities']) &&
    typeof obj['metadata'] === 'object'
  );
}

/**
 * Serialize a golden test suite to JSON.
 */
export function serializeGoldenSuite(suite: GoldenTestSuite): string {
  return JSON.stringify({
    ...suite,
    metadata: {
      totalCases: suite.metadata.totalCases,
      tagCounts: Object.fromEntries(suite.metadata.tagCounts),
    },
  }, null, 2);
}

/**
 * Deserialize a golden test suite from JSON.
 */
export function deserializeGoldenSuite(json: string): GoldenTestSuite | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj['name'] !== 'string') return null;
    if (!Array.isArray(obj['cases'])) return null;
    const meta = obj['metadata'] as Record<string, unknown> | undefined;
    const tagCounts = meta?.['tagCounts'];
    return {
      name: obj['name'] as string,
      description: (obj['description'] as string) ?? '',
      cases: obj['cases'] as GoldenTestCase[],
      lastUpdated: (obj['lastUpdated'] as string) ?? '',
      metadata: {
        totalCases: (meta?.['totalCases'] as number) ?? (obj['cases'] as unknown[]).length,
        tagCounts: tagCounts && typeof tagCounts === 'object'
          ? new Map(Object.entries(tagCounts as Record<string, number>))
          : new Map(),
      },
    };
  } catch {
    return null;
  }
}

// =============================================================================
// SUITE BUILDERS — helpers for constructing test suites
// =============================================================================

/**
 * Create a golden test case by parsing an input against the current grammar.
 * The current parse result becomes the baseline.
 */
export function createGoldenCase(
  id: string,
  name: string,
  input: string,
  parse: ParseFunction,
  tags: readonly string[] = [],
  notes?: string,
): GoldenTestCase | null {
  const forest = parse(input);
  if (!forest) return null;
  const baseline = createSnapshot(forest);
  const result: GoldenTestCase = { id, name, input, baseline, tags };
  if (notes !== undefined) {
    return { ...result, notes };
  }
  return result;
}

/**
 * Build a golden test suite from a list of inputs.
 */
export function buildGoldenSuite(
  name: string,
  description: string,
  inputs: readonly { id: string; name: string; input: string; tags?: readonly string[]; notes?: string }[],
  parse: ParseFunction,
): GoldenTestSuite {
  const cases: GoldenTestCase[] = [];
  const tagCounts = new Map<string, number>();

  for (const entry of inputs) {
    const golden = createGoldenCase(entry.id, entry.name, entry.input, parse, entry.tags ?? [], entry.notes);
    if (golden) {
      cases.push(golden);
      for (const tag of golden.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  return {
    name,
    description,
    cases,
    lastUpdated: new Date().toISOString(),
    metadata: {
      totalCases: cases.length,
      tagCounts,
    },
  };
}

/**
 * Build a paraphrase group.
 */
export function buildParaphraseGroup(
  name: string,
  canonical: string,
  paraphrases: readonly string[],
  tags: readonly string[] = [],
): ParaphraseGroup {
  return { name, canonical, paraphrases, tags };
}

// =============================================================================
// STATISTICS — aggregate suite statistics
// =============================================================================

/**
 * Aggregate statistics for a regression test run.
 */
export interface RegressionRunStats {
  /** When the run started */
  readonly startTime: string;

  /** Total golden tests */
  readonly goldenTotal: number;
  readonly goldenPassed: number;

  /** Total paraphrase groups */
  readonly paraphraseTotal: number;
  readonly paraphraseInvariant: number;

  /** Total determinism checks */
  readonly determinismTotal: number;
  readonly determinismPassed: number;

  /** Total explosion checks */
  readonly explosionTotal: number;
  readonly explosionClean: number;

  /** Overall pass rate */
  readonly overallPassRate: number;
}

/**
 * Compute aggregate statistics from a regression run.
 */
export function computeRunStats(
  goldenResults: readonly GoldenSuiteResult[],
  paraphraseResults: readonly ParaphraseResult[],
  determinismResults: readonly DeterminismResult[],
  explosionResults: readonly AmbiguityExplosionResult[],
): RegressionRunStats {
  const goldenTotal = goldenResults.reduce((n, r) => n + r.summary.totalCases, 0);
  const goldenPassed = goldenResults.reduce((n, r) => n + r.summary.passedCases, 0);

  const paraphraseTotal = paraphraseResults.length;
  const paraphraseInvariant = paraphraseResults.filter(r => r.invariant).length;

  const determinismTotal = determinismResults.length;
  const determinismPassed = determinismResults.filter(r => r.deterministic).length;

  const explosionTotal = explosionResults.length;
  const explosionClean = explosionResults.filter(r => !r.explosion).length;

  const totalTests = goldenTotal + paraphraseTotal + determinismTotal + explosionTotal;
  const totalPassed = goldenPassed + paraphraseInvariant + determinismPassed + explosionClean;

  return {
    startTime: new Date().toISOString(),
    goldenTotal,
    goldenPassed,
    paraphraseTotal,
    paraphraseInvariant,
    determinismTotal,
    determinismPassed,
    explosionTotal,
    explosionClean,
    overallPassRate: totalTests > 0 ? totalPassed / totalTests : 1,
  };
}

/**
 * Format aggregate run statistics as a human-readable report.
 */
export function formatRunStatsReport(stats: RegressionRunStats): string {
  const lines: string[] = [];

  lines.push('=== Grammar Regression Test Run ===');
  lines.push(`  Start: ${stats.startTime}`);
  lines.push('');
  lines.push(`  Golden tests:      ${stats.goldenPassed}/${stats.goldenTotal} passed`);
  lines.push(`  Paraphrase groups: ${stats.paraphraseInvariant}/${stats.paraphraseTotal} invariant`);
  lines.push(`  Determinism:       ${stats.determinismPassed}/${stats.determinismTotal} deterministic`);
  lines.push(`  Explosion checks:  ${stats.explosionClean}/${stats.explosionTotal} clean`);
  lines.push('');
  lines.push(`  Overall pass rate: ${(stats.overallPassRate * 100).toFixed(1)}%`);

  return lines.join('\n');
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetRegressionHarness(): void {
  // Currently stateless — placeholder for future state
}
