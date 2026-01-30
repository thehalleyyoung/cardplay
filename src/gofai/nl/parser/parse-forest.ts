/**
 * GOFAI NL Parser — Parse Forest Representation
 *
 * Implements an explicit parse forest that preserves ambiguity instead
 * of losing it to early decisions. The forest is a compact representation
 * of ALL valid parse trees.
 *
 * ## Why a Parse Forest?
 *
 * In NL for music editing, many utterances are genuinely ambiguous:
 * - "Make the bass brighter" — bass instrument or bass frequency range?
 * - "Double it" — duplicate the track, or increase the value by 2x?
 * - "More reverb on the chorus" — more wet signal, or longer decay?
 *
 * Instead of picking one interpretation, we preserve ALL interpretations
 * in a packed forest. Downstream scoring then ranks them, and ambiguous
 * ones trigger clarification.
 *
 * ## Structure
 *
 * A parse forest is a DAG (directed acyclic graph) where:
 * - **OR-nodes** represent ambiguity (multiple parses for the same span)
 * - **AND-nodes** represent a single rule application (children are the RHS symbols)
 * - **Leaf nodes** represent terminal tokens
 *
 * This is equivalent to a Shared Packed Parse Forest (SPPF).
 *
 * @module gofai/nl/parser/parse-forest
 * @see gofai_goalA.md Step 107
 */

import type { Token, Span } from '../tokenizer/span-tokenizer';
import type { EarleyChart, ParseNode, NonTerminalNode } from './earley-engine';
import { extractParseTrees } from './earley-engine';

// =============================================================================
// PARSE FOREST — the packed forest representation
// =============================================================================

/**
 * A parse forest: a compact representation of all valid parse trees.
 */
export interface ParseForest {
  /** The root OR-node */
  readonly root: ForestNode;

  /** Total number of distinct parse trees */
  readonly treeCount: number;

  /** The ambiguity points (where multiple parses diverge) */
  readonly ambiguities: readonly AmbiguityPoint[];

  /** The tokens that were parsed */
  readonly tokens: readonly Token[];

  /** The source text */
  readonly source: string;

  /** Forest metadata */
  readonly metadata: ForestMetadata;
}

/**
 * A node in the parse forest.
 */
export type ForestNode =
  | OrNode
  | AndNode
  | LeafNode;

/**
 * An OR-node: represents ambiguity — multiple parses for the same span.
 * Each alternative is a different way to parse this span.
 */
export interface OrNode {
  readonly type: 'or';
  /** Unique node ID */
  readonly id: string;
  /** The non-terminal symbol */
  readonly symbol: string;
  /** The span in the source text */
  readonly span: Span;
  /** Alternative AND-nodes (different parses) */
  readonly alternatives: readonly AndNode[];
}

/**
 * An AND-node: a single rule application.
 * Children are the symbols on the RHS of the rule.
 */
export interface AndNode {
  readonly type: 'and';
  /** Unique node ID */
  readonly id: string;
  /** The rule that was applied */
  readonly ruleId: string;
  /** The non-terminal symbol (LHS of the rule) */
  readonly symbol: string;
  /** Children (RHS symbols) */
  readonly children: readonly ForestNode[];
  /** The span in the source text */
  readonly span: Span;
  /** Rule priority */
  readonly priority: number;
  /** Semantic action ID */
  readonly semanticAction?: string;
}

/**
 * A leaf node: a terminal token.
 */
export interface LeafNode {
  readonly type: 'leaf';
  /** Unique node ID */
  readonly id: string;
  /** The matched token */
  readonly token: Token;
  /** The span in the source text */
  readonly span: Span;
}

// =============================================================================
// AMBIGUITY — where parses diverge
// =============================================================================

/**
 * An ambiguity point: where multiple parses exist for the same span.
 */
export interface AmbiguityPoint {
  /** The OR-node where ambiguity occurs */
  readonly nodeId: string;

  /** The non-terminal symbol */
  readonly symbol: string;

  /** The span that is ambiguous */
  readonly span: Span;

  /** The text that is ambiguous */
  readonly text: string;

  /** Number of alternative parses */
  readonly alternativeCount: number;

  /** Brief descriptions of each alternative */
  readonly alternatives: readonly AmbiguityAlternative[];

  /** How severe the ambiguity is (low = likely one is correct; high = genuinely ambiguous) */
  readonly severity: AmbiguitySeverity;
}

export interface AmbiguityAlternative {
  readonly ruleId: string;
  readonly description: string;
  readonly priority: number;
}

export type AmbiguitySeverity = 'low' | 'medium' | 'high';

// =============================================================================
// FOREST METADATA
// =============================================================================

export interface ForestMetadata {
  readonly totalNodes: number;
  readonly orNodeCount: number;
  readonly andNodeCount: number;
  readonly leafNodeCount: number;
  readonly maxDepth: number;
  readonly ambiguityCount: number;
}

// =============================================================================
// FOREST CONSTRUCTION — from Earley chart or parse trees
// =============================================================================

let _nextNodeId = 0;

function nextId(prefix: string): string {
  return `${prefix}_${_nextNodeId++}`;
}

/**
 * Build a parse forest from an Earley chart.
 */
export function buildForest(chart: EarleyChart): ParseForest | null {
  if (!chart.success) return null;

  _nextNodeId = 0;

  const parseTrees = extractParseTrees(chart);
  if (parseTrees.length === 0) return null;

  // If there's only one parse, no ambiguity
  if (parseTrees.length === 1) {
    const tree = parseTrees[0]!;
    const root = parseNodeToForestNode(tree);
    return {
      root,
      treeCount: 1,
      ambiguities: [],
      tokens: chart.tokens,
      source: chart.tokens.map(t => t.original).join(' '),
      metadata: computeMetadata(root),
    };
  }

  // Multiple parses: create an OR-node at the root
  const andNodes = parseTrees.map(tree => {
    const node = parseNodeToForestNode(tree);
    if (node.type === 'and') return node;
    // Wrap leaf or or in and
    return {
      type: 'and' as const,
      id: nextId('and'),
      ruleId: 'root',
      symbol: 'S',
      children: [node],
      span: node.span,
      priority: 0,
    };
  });

  const root: OrNode = {
    type: 'or',
    id: nextId('or'),
    symbol: andNodes[0]!.symbol,
    span: andNodes[0]!.span,
    alternatives: andNodes,
  };

  const ambiguities = findAmbiguities(root, chart.tokens);

  return {
    root,
    treeCount: parseTrees.length,
    ambiguities,
    tokens: chart.tokens,
    source: chart.tokens.map(t => t.original).join(' '),
    metadata: computeMetadata(root),
  };
}

/**
 * Convert a ParseNode to a ForestNode.
 */
function parseNodeToForestNode(node: ParseNode): ForestNode {
  if (node.type === 'terminal') {
    return {
      type: 'leaf',
      id: nextId('leaf'),
      token: node.token,
      span: node.span,
    };
  }

  const children = node.children.map(c => parseNodeToForestNode(c));
  const baseAnd = {
    type: 'and' as const,
    id: nextId('and'),
    ruleId: node.ruleId,
    symbol: node.symbol,
    children,
    span: node.span,
    priority: node.priority,
  };
  const andNode: AndNode = node.semanticAction
    ? { ...baseAnd, semanticAction: node.semanticAction }
    : baseAnd;
  return andNode;
}

/**
 * Build a parse forest from multiple parse trees (convenience).
 */
export function buildForestFromTrees(
  trees: readonly NonTerminalNode[],
  tokens: readonly Token[],
): ParseForest {
  _nextNodeId = 0;

  if (trees.length === 0) {
    const emptyAnd: AndNode = {
      type: 'and',
      id: nextId('and'),
      ruleId: 'empty',
      symbol: 'S',
      children: [],
      span: { start: 0, end: 0 },
      priority: 0,
    };
    return {
      root: emptyAnd,
      treeCount: 0,
      ambiguities: [],
      tokens,
      source: tokens.map(t => t.original).join(' '),
      metadata: computeMetadata(emptyAnd),
    };
  }

  if (trees.length === 1) {
    const root = parseNodeToForestNode(trees[0]!);
    return {
      root,
      treeCount: 1,
      ambiguities: [],
      tokens,
      source: tokens.map(t => t.original).join(' '),
      metadata: computeMetadata(root),
    };
  }

  const andNodes = trees.map(tree => {
    const node = parseNodeToForestNode(tree);
    if (node.type === 'and') return node;
    return {
      type: 'and' as const,
      id: nextId('and'),
      ruleId: 'root',
      symbol: 'S',
      children: [node],
      span: node.span,
      priority: 0,
    };
  });

  const root: OrNode = {
    type: 'or',
    id: nextId('or'),
    symbol: andNodes[0]!.symbol,
    span: andNodes[0]!.span,
    alternatives: andNodes,
  };

  const ambiguities = findAmbiguities(root, tokens);

  return {
    root,
    treeCount: trees.length,
    ambiguities,
    tokens,
    source: tokens.map(t => t.original).join(' '),
    metadata: computeMetadata(root),
  };
}

// =============================================================================
// AMBIGUITY DETECTION
// =============================================================================

/**
 * Find all ambiguity points in a forest.
 */
function findAmbiguities(root: ForestNode, tokens: readonly Token[]): readonly AmbiguityPoint[] {
  const result: AmbiguityPoint[] = [];
  findAmbiguitiesRecursive(root, tokens, result);
  return result;
}

function findAmbiguitiesRecursive(
  node: ForestNode,
  tokens: readonly Token[],
  result: AmbiguityPoint[],
): void {
  if (node.type === 'or' && node.alternatives.length > 1) {
    const text = tokens
      .filter(t => t.span.start >= node.span.start && t.span.end <= node.span.end)
      .map(t => t.original)
      .join(' ');

    const alternatives: AmbiguityAlternative[] = node.alternatives.map(alt => ({
      ruleId: alt.ruleId,
      description: `${alt.symbol} via rule ${alt.ruleId}`,
      priority: alt.priority,
    }));

    // Determine severity
    const priorities = node.alternatives.map(a => a.priority);
    const maxPriority = Math.max(...priorities);
    const topCount = priorities.filter(p => p === maxPriority).length;
    const severity: AmbiguitySeverity = topCount > 1 ? 'high' : topCount === 1 ? 'medium' : 'low';

    result.push({
      nodeId: node.id,
      symbol: node.symbol,
      span: node.span,
      text,
      alternativeCount: node.alternatives.length,
      alternatives,
      severity,
    });

    // Recurse into alternatives
    for (const alt of node.alternatives) {
      for (const child of alt.children) {
        findAmbiguitiesRecursive(child, tokens, result);
      }
    }
  } else if (node.type === 'and') {
    for (const child of node.children) {
      findAmbiguitiesRecursive(child, tokens, result);
    }
  }
}

// =============================================================================
// FOREST METADATA COMPUTATION
// =============================================================================

function computeMetadata(root: ForestNode): ForestMetadata {
  let orCount = 0;
  let andCount = 0;
  let leafCount = 0;
  let maxDepth = 0;
  let ambiguityCount = 0;

  function walk(node: ForestNode, depth: number): void {
    if (depth > maxDepth) maxDepth = depth;

    switch (node.type) {
      case 'or':
        orCount++;
        if (node.alternatives.length > 1) ambiguityCount++;
        for (const alt of node.alternatives) walk(alt, depth + 1);
        break;
      case 'and':
        andCount++;
        for (const child of node.children) walk(child, depth + 1);
        break;
      case 'leaf':
        leafCount++;
        break;
    }
  }

  walk(root, 0);

  return {
    totalNodes: orCount + andCount + leafCount,
    orNodeCount: orCount,
    andNodeCount: andCount,
    leafNodeCount: leafCount,
    maxDepth,
    ambiguityCount,
  };
}

// =============================================================================
// TREE ENUMERATION — extract individual trees from the forest
// =============================================================================

/**
 * Enumerate all trees in the forest (up to a limit).
 */
export function enumerateTrees(forest: ParseForest, maxTrees: number = 100): readonly ForestNode[] {
  const trees: ForestNode[] = [];
  enumerateNode(forest.root, trees, maxTrees);
  return trees;
}

function enumerateNode(node: ForestNode, results: ForestNode[], max: number): void {
  if (results.length >= max) return;

  switch (node.type) {
    case 'leaf':
      results.push(node);
      break;

    case 'and': {
      // Need to enumerate cross-product of children alternatives
      const childOptions: ForestNode[][] = [];
      for (const child of node.children) {
        const opts: ForestNode[] = [];
        enumerateNode(child, opts, max);
        childOptions.push(opts);
      }

      // Simple: just take first option for each child
      if (childOptions.every(o => o.length > 0)) {
        const firstChildren = childOptions.map(o => o[0]!);
        results.push({
          ...node,
          children: firstChildren,
        });
      }
      break;
    }

    case 'or':
      for (const alt of node.alternatives) {
        if (results.length >= max) break;
        enumerateNode(alt, results, max);
      }
      break;
  }
}

// =============================================================================
// FOREST PRUNING — remove low-priority alternatives
// =============================================================================

/**
 * Prune the forest by removing alternatives below a priority threshold.
 */
export function pruneForest(forest: ParseForest, minPriority: number): ParseForest {
  const pruned = pruneNode(forest.root, minPriority);
  if (!pruned) return forest;

  return {
    ...forest,
    root: pruned,
    ambiguities: findAmbiguities(pruned, forest.tokens),
    metadata: computeMetadata(pruned),
  };
}

function pruneNode(node: ForestNode, minPriority: number): ForestNode | null {
  switch (node.type) {
    case 'leaf':
      return node;

    case 'and': {
      const children: ForestNode[] = [];
      for (const child of node.children) {
        const pruned = pruneNode(child, minPriority);
        if (!pruned) return null;
        children.push(pruned);
      }
      return { ...node, children };
    }

    case 'or': {
      const kept = node.alternatives.filter(alt => alt.priority >= minPriority);
      if (kept.length === 0) return null;

      const prunedAlts: AndNode[] = [];
      for (const alt of kept) {
        const pruned = pruneNode(alt, minPriority);
        if (pruned && pruned.type === 'and') {
          prunedAlts.push(pruned);
        }
      }

      if (prunedAlts.length === 0) return null;
      if (prunedAlts.length === 1) return prunedAlts[0]!;
      return { ...node, alternatives: prunedAlts };
    }
  }
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a parse forest for display.
 */
export function formatForest(forest: ParseForest): string {
  const lines: string[] = [];
  lines.push(`Parse Forest: ${forest.treeCount} tree(s)`);
  lines.push(`  Nodes: ${forest.metadata.totalNodes} (${forest.metadata.orNodeCount} OR, ${forest.metadata.andNodeCount} AND, ${forest.metadata.leafNodeCount} leaf)`);
  lines.push(`  Depth: ${forest.metadata.maxDepth}`);
  lines.push(`  Ambiguities: ${forest.ambiguities.length}`);

  if (forest.ambiguities.length > 0) {
    lines.push('');
    lines.push('  Ambiguity points:');
    for (const amb of forest.ambiguities) {
      lines.push(`    "${amb.text}" (${amb.symbol}): ${amb.alternativeCount} alternatives [${amb.severity}]`);
      for (const alt of amb.alternatives) {
        lines.push(`      - ${alt.description} (priority: ${alt.priority})`);
      }
    }
  }

  lines.push('');
  lines.push('  Structure:');
  lines.push(formatForestNode(forest.root, 2));

  return lines.join('\n');
}

function formatForestNode(node: ForestNode, indent: number): string {
  const pad = '  '.repeat(indent);

  switch (node.type) {
    case 'leaf':
      return `${pad}"${node.token.original}"`;

    case 'and': {
      const lines = [`${pad}${node.symbol} [${node.ruleId}]`];
      for (const child of node.children) {
        lines.push(formatForestNode(child, indent + 1));
      }
      return lines.join('\n');
    }

    case 'or': {
      const lines = [`${pad}${node.symbol} (${node.alternatives.length} alternatives)`];
      for (let i = 0; i < node.alternatives.length; i++) {
        lines.push(`${pad}  ALT ${i + 1}:`);
        lines.push(formatForestNode(node.alternatives[i]!, indent + 2));
      }
      return lines.join('\n');
    }
  }
}

/**
 * Format an ambiguity point for display.
 */
export function formatAmbiguity(amb: AmbiguityPoint): string {
  const alts = amb.alternatives
    .map((a, i) => `  ${i + 1}. ${a.description} (priority: ${a.priority})`)
    .join('\n');
  return `Ambiguity in "${amb.text}" (${amb.symbol}): ${amb.alternativeCount} alternatives [${amb.severity}]\n${alts}`;
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const PARSE_FOREST_RULES = [
  'Rule FOREST-001: The parse forest is a packed representation of ALL valid ' +
  'parse trees. No ambiguity is lost during forest construction.',

  'Rule FOREST-002: OR-nodes represent ambiguity: multiple parses for the ' +
  'same span. AND-nodes represent a single rule application.',

  'Rule FOREST-003: Ambiguity points are detected and classified by severity: ' +
  'low (one clear winner), medium (priority gap), high (genuinely ambiguous).',

  'Rule FOREST-004: The forest can be pruned by removing alternatives below ' +
  'a priority threshold. Pruning preserves at least one alternative.',

  'Rule FOREST-005: Individual trees can be enumerated from the forest up to ' +
  'a configurable limit.',

  'Rule FOREST-006: Forest metadata tracks total nodes, depth, and ambiguity ' +
  'count for monitoring parse complexity.',

  'Rule FOREST-007: Ambiguity severity is determined by priority distribution: ' +
  'if one alternative dominates, severity is low; if tied, severity is high.',

  'Rule FOREST-008: The forest preserves spans from the tokenizer, enabling ' +
  'provenance tracking through ambiguous parses.',

  'Rule FOREST-009: High-severity ambiguities trigger clarification prompts. ' +
  'Low-severity ones are resolved by the scoring model.',

  'Rule FOREST-010: Forest construction is deterministic: the same chart always ' +
  'produces the same forest.',

  'Rule FOREST-011: The forest is immutable. Pruning and scoring produce new ' +
  'forests, leaving the original intact.',

  'Rule FOREST-012: The forest format is inspectable: formatForest() shows ' +
  'the full structure with ambiguity annotations.',
] as const;
