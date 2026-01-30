/**
 * GOFAI NL Parser — Parse Forest Visualization Developer Tooling
 *
 * Provides rich visualization of parse forests and semantic composition
 * for developer debugging, testing, and understanding of parse results.
 *
 * ## Features
 *
 * - **ASCII tree rendering**: Pretty-print parse forests as indented trees
 * - **DOT graph export**: Generate Graphviz DOT for visual graph rendering
 * - **Ambiguity highlighting**: Color-coded ambiguity points with severity
 * - **Semantic annotation overlay**: Show semantic composition alongside parse structure
 * - **Span-source mapping**: Inline source text under parse nodes
 * - **Diff visualization**: Compare two forests side by side
 * - **Interactive trace**: Step-by-step parse derivation replay
 * - **Statistics dashboard**: Forest complexity metrics at a glance
 *
 * All visualizers accept the `ForestLike` interface from the regression
 * harness for decoupling, as well as the concrete `ParseForest` type.
 *
 * @module gofai/nl/parser/parse-visualizer
 * @see gofai_goalA.md Step 140
 */

// =============================================================================
// FOREST-LIKE INTERFACE — decoupled from concrete ParseForest
// =============================================================================

/**
 * Minimal forest interface for visualization (mirrors regression harness).
 */
export interface VisualizableForest {
  readonly root: VisualizableNode;
  readonly treeCount: number;
  readonly ambiguities: readonly VisualizableAmbiguity[];
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

/**
 * Minimal node interface for visualization.
 */
export interface VisualizableNode {
  readonly type: 'or' | 'and' | 'leaf';
  readonly span: { readonly start: number; readonly end: number };
  readonly id?: string;
  // OR-node
  readonly symbol?: string;
  readonly alternatives?: readonly VisualizableNode[];
  // AND-node
  readonly ruleId?: string;
  readonly children?: readonly VisualizableNode[];
  readonly priority?: number;
  readonly semanticAction?: string;
  // Leaf
  readonly token?: { readonly text: string; readonly type: string };
}

/**
 * Minimal ambiguity interface.
 */
export interface VisualizableAmbiguity {
  readonly nodeId: string;
  readonly symbol: string;
  readonly span: { readonly start: number; readonly end: number };
  readonly text: string;
  readonly alternativeCount: number;
  readonly severity: 'low' | 'medium' | 'high';
  readonly alternatives?: readonly {
    readonly ruleId: string;
    readonly description: string;
    readonly priority: number;
  }[];
}

// =============================================================================
// VISUALIZATION OPTIONS
// =============================================================================

/**
 * Options controlling how a forest is visualized.
 */
export interface ForestVisualizationOptions {
  /** Show ambiguity points with markers. Default: true. */
  readonly showAmbiguities: boolean;
  /** Show rule priorities on AND-nodes. Default: false. */
  readonly showPriorities: boolean;
  /** Show semantic action IDs. Default: false. */
  readonly showSemanticActions: boolean;
  /** Show source text spans inline. Default: true. */
  readonly showSourceSpans: boolean;
  /** Maximum depth to render (0 = unlimited). Default: 0. */
  readonly maxDepth: number;
  /** Collapse leaf nodes into parent. Default: false. */
  readonly collapseLeaves: boolean;
  /** Show node IDs. Default: false. */
  readonly showNodeIds: boolean;
  /** Indent string for tree rendering. Default: '  '. */
  readonly indent: string;
  /** Use Unicode box-drawing characters. Default: true. */
  readonly useUnicode: boolean;
  /** Maximum line width for wrapping. Default: 120. */
  readonly maxWidth: number;
  /** Color mode for terminal output. Default: 'none'. */
  readonly colorMode: ColorMode;
}

/**
 * Color mode for terminal output.
 */
export type ColorMode = 'none' | 'ansi_16' | 'ansi_256';

/**
 * Default visualization options.
 */
export const DEFAULT_VISUALIZATION_OPTIONS: ForestVisualizationOptions = {
  showAmbiguities: true,
  showPriorities: false,
  showSemanticActions: false,
  showSourceSpans: true,
  maxDepth: 0,
  collapseLeaves: false,
  showNodeIds: false,
  indent: '  ',
  useUnicode: true,
  maxWidth: 120,
  colorMode: 'none',
};

// =============================================================================
// ASCII TREE RENDERING
// =============================================================================

/**
 * Render a forest as an ASCII tree string.
 */
export function renderForestTree(
  forest: VisualizableForest,
  options?: Partial<ForestVisualizationOptions>,
): string {
  const opts = { ...DEFAULT_VISUALIZATION_OPTIONS, ...options };
  const lines: string[] = [];

  // Header
  lines.push(headerLine('Parse Forest', opts));
  lines.push(`Source: "${forest.source}"`);
  lines.push(`Trees: ${forest.treeCount} | Nodes: ${forest.metadata.totalNodes} | Ambiguities: ${forest.metadata.ambiguityCount}`);
  lines.push('');

  // Render the tree
  renderNode(forest.root, forest.source, opts, lines, '', true, 0);

  // Ambiguity summary
  if (opts.showAmbiguities && forest.ambiguities.length > 0) {
    lines.push('');
    lines.push(headerLine('Ambiguity Points', opts));
    for (const amb of forest.ambiguities) {
      const severityMark = severityMarker(amb.severity, opts);
      lines.push(`  ${severityMark} "${amb.text}" (${amb.symbol}) — ${amb.alternativeCount} readings`);
      if (amb.alternatives) {
        for (const alt of amb.alternatives) {
          lines.push(`    ${opts.useUnicode ? '├' : '|'} [${alt.ruleId}] ${alt.description} (priority: ${alt.priority})`);
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * Render a single node and its children recursively.
 */
function renderNode(
  node: VisualizableNode,
  source: string,
  opts: ForestVisualizationOptions,
  lines: string[],
  prefix: string,
  isLast: boolean,
  depth: number,
): void {
  if (opts.maxDepth > 0 && depth > opts.maxDepth) {
    lines.push(`${prefix}${connector(isLast, opts)} ...`);
    return;
  }

  const conn = connector(isLast, opts);
  const cont = continuation(isLast, opts);

  switch (node.type) {
    case 'or': {
      const ambMark = opts.showAmbiguities && (node.alternatives?.length ?? 0) > 1
        ? ` ${severityMarker('medium', opts)}`
        : '';
      const idStr = opts.showNodeIds && node.id ? ` [${node.id}]` : '';
      const spanStr = opts.showSourceSpans
        ? ` "${extractSpan(source, node.span)}"`
        : '';
      lines.push(`${prefix}${conn}OR(${node.symbol ?? '?'})${idStr}${ambMark}${spanStr}`);

      const alts = node.alternatives ?? [];
      for (let i = 0; i < alts.length; i++) {
        renderNode(alts[i]!, source, opts, lines, prefix + cont, i === alts.length - 1, depth + 1);
      }
      break;
    }

    case 'and': {
      const prioStr = opts.showPriorities ? ` p=${node.priority ?? 0}` : '';
      const semStr = opts.showSemanticActions && node.semanticAction
        ? ` sem=${node.semanticAction}`
        : '';
      const idStr = opts.showNodeIds && node.id ? ` [${node.id}]` : '';
      const ruleStr = node.ruleId ?? '?';
      lines.push(`${prefix}${conn}AND(${node.symbol ?? '?'} ← ${ruleStr})${idStr}${prioStr}${semStr}`);

      const children = node.children ?? [];
      if (opts.collapseLeaves && children.every(c => c.type === 'leaf')) {
        // Collapse all leaves into one line
        const leafTexts = children.map(c => c.token?.text ?? '?').join(' ');
        lines.push(`${prefix}${cont}${opts.indent}${opts.useUnicode ? '└' : '\\'} "${leafTexts}"`);
      } else {
        for (let i = 0; i < children.length; i++) {
          renderNode(children[i]!, source, opts, lines, prefix + cont, i === children.length - 1, depth + 1);
        }
      }
      break;
    }

    case 'leaf': {
      const text = node.token?.text ?? '?';
      const type = node.token?.type ?? '?';
      const idStr = opts.showNodeIds && node.id ? ` [${node.id}]` : '';
      lines.push(`${prefix}${conn}"${text}" (${type})${idStr}`);
      break;
    }
  }
}

function connector(isLast: boolean, opts: ForestVisualizationOptions): string {
  if (opts.useUnicode) {
    return isLast ? '└─ ' : '├─ ';
  }
  return isLast ? '\\- ' : '|- ';
}

function continuation(isLast: boolean, opts: ForestVisualizationOptions): string {
  if (opts.useUnicode) {
    return isLast ? '   ' : '│  ';
  }
  return isLast ? '   ' : '|  ';
}

function headerLine(title: string, opts: ForestVisualizationOptions): string {
  const line = opts.useUnicode ? '═' : '=';
  return `${line.repeat(3)} ${title} ${line.repeat(Math.max(0, opts.maxWidth - title.length - 5))}`;
}

function severityMarker(severity: string, opts: ForestVisualizationOptions): string {
  if (opts.colorMode !== 'none') {
    switch (severity) {
      case 'high': return '\x1b[31m[HIGH]\x1b[0m';
      case 'medium': return '\x1b[33m[MED]\x1b[0m';
      case 'low': return '\x1b[32m[LOW]\x1b[0m';
      default: return `[${severity.toUpperCase()}]`;
    }
  }
  switch (severity) {
    case 'high': return '[HIGH]';
    case 'medium': return '[MED]';
    case 'low': return '[LOW]';
    default: return `[${severity.toUpperCase()}]`;
  }
}

function extractSpan(source: string, span: { start: number; end: number }): string {
  return source.slice(span.start, span.end);
}

// =============================================================================
// DOT GRAPH EXPORT — for Graphviz rendering
// =============================================================================

/**
 * Options for DOT graph export.
 */
export interface DotExportOptions {
  /** Graph direction. Default: 'top_down'. */
  readonly direction: 'top_down' | 'left_right';
  /** Show ambiguity coloring. Default: true. */
  readonly colorAmbiguities: boolean;
  /** Show source text on leaf nodes. Default: true. */
  readonly showLeafText: boolean;
  /** Show rule IDs on AND-nodes. Default: true. */
  readonly showRuleIds: boolean;
  /** Font size in points. Default: 12. */
  readonly fontSize: number;
  /** Node shape for OR-nodes. Default: 'diamond'. */
  readonly orNodeShape: string;
  /** Node shape for AND-nodes. Default: 'box'. */
  readonly andNodeShape: string;
  /** Node shape for leaf nodes. Default: 'ellipse'. */
  readonly leafNodeShape: string;
}

/**
 * Default DOT export options.
 */
export const DEFAULT_DOT_OPTIONS: DotExportOptions = {
  direction: 'top_down',
  colorAmbiguities: true,
  showLeafText: true,
  showRuleIds: true,
  fontSize: 12,
  orNodeShape: 'diamond',
  andNodeShape: 'box',
  leafNodeShape: 'ellipse',
};

/**
 * Export a forest as a Graphviz DOT string.
 */
export function exportForestDot(
  forest: VisualizableForest,
  options?: Partial<DotExportOptions>,
): string {
  const opts = { ...DEFAULT_DOT_OPTIONS, ...options };
  const lines: string[] = [];
  const ambiguousNodeIds = new Set(forest.ambiguities.map(a => a.nodeId));

  const rankDir = opts.direction === 'left_right' ? 'LR' : 'TB';
  lines.push(`digraph ParseForest {`);
  lines.push(`  rankdir=${rankDir};`);
  lines.push(`  fontsize=${opts.fontSize};`);
  lines.push(`  node [fontsize=${opts.fontSize}];`);
  lines.push('');

  // Collect all nodes and edges
  const nodeDecls: string[] = [];
  const edgeDecls: string[] = [];
  collectDotNodes(forest.root, forest.source, opts, ambiguousNodeIds, nodeDecls, edgeDecls, 0);

  lines.push(...nodeDecls.map(n => `  ${n}`));
  lines.push('');
  lines.push(...edgeDecls.map(e => `  ${e}`));
  lines.push('}');

  return lines.join('\n');
}

let _dotCounter = 0;

function dotNodeId(node: VisualizableNode): string {
  if (node.id) return `n_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  return `n_auto_${_dotCounter++}`;
}

function collectDotNodes(
  node: VisualizableNode,
  source: string,
  opts: DotExportOptions,
  ambiguousNodeIds: ReadonlySet<string>,
  nodeDecls: string[],
  edgeDecls: string[],
  _depth: number,
): string {
  const id = dotNodeId(node);

  switch (node.type) {
    case 'or': {
      const label = node.symbol ?? 'OR';
      const isAmbiguous = node.id ? ambiguousNodeIds.has(node.id) : (node.alternatives?.length ?? 0) > 1;
      const color = isAmbiguous && opts.colorAmbiguities ? ', style=filled, fillcolor="#FFCCCC"' : '';
      nodeDecls.push(`${id} [label="${escDot(label)}", shape=${opts.orNodeShape}${color}];`);

      for (const alt of node.alternatives ?? []) {
        const childId = collectDotNodes(alt, source, opts, ambiguousNodeIds, nodeDecls, edgeDecls, _depth + 1);
        edgeDecls.push(`${id} -> ${childId};`);
      }
      break;
    }

    case 'and': {
      const label = opts.showRuleIds
        ? `${node.symbol ?? 'AND'}\\n${node.ruleId ?? ''}`
        : (node.symbol ?? 'AND');
      nodeDecls.push(`${id} [label="${escDot(label)}", shape=${opts.andNodeShape}];`);

      for (const child of node.children ?? []) {
        const childId = collectDotNodes(child, source, opts, ambiguousNodeIds, nodeDecls, edgeDecls, _depth + 1);
        edgeDecls.push(`${id} -> ${childId};`);
      }
      break;
    }

    case 'leaf': {
      const label = opts.showLeafText
        ? `"${node.token?.text ?? '?'}"\\n(${node.token?.type ?? '?'})`
        : (node.token?.type ?? '?');
      nodeDecls.push(`${id} [label="${escDot(label)}", shape=${opts.leafNodeShape}];`);
      break;
    }
  }

  return id;
}

function escDot(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// =============================================================================
// SEMANTIC ANNOTATION OVERLAY
// =============================================================================

/**
 * A semantic annotation attached to a parse node.
 */
export interface SemanticAnnotation {
  readonly nodeId: string;
  readonly semanticType: string;
  readonly value: string;
  readonly composition: string;   // How it was composed (e.g., "functional application")
}

/**
 * A forest with semantic annotations overlaid.
 */
export interface AnnotatedForest {
  readonly forest: VisualizableForest;
  readonly annotations: ReadonlyMap<string, SemanticAnnotation>;
}

/**
 * Render a forest with semantic annotations inline.
 */
export function renderAnnotatedForest(
  annotated: AnnotatedForest,
  options?: Partial<ForestVisualizationOptions>,
): string {
  const opts = { ...DEFAULT_VISUALIZATION_OPTIONS, ...options };
  const lines: string[] = [];

  lines.push(headerLine('Annotated Parse Forest', opts));
  lines.push(`Source: "${annotated.forest.source}"`);
  lines.push('');

  renderAnnotatedNode(
    annotated.forest.root,
    annotated.forest.source,
    annotated.annotations,
    opts,
    lines,
    '',
    true,
    0,
  );

  return lines.join('\n');
}

function renderAnnotatedNode(
  node: VisualizableNode,
  source: string,
  annotations: ReadonlyMap<string, SemanticAnnotation>,
  opts: ForestVisualizationOptions,
  lines: string[],
  prefix: string,
  isLast: boolean,
  depth: number,
): void {
  if (opts.maxDepth > 0 && depth > opts.maxDepth) {
    lines.push(`${prefix}${connector(isLast, opts)} ...`);
    return;
  }

  const conn = connector(isLast, opts);
  const cont = continuation(isLast, opts);
  const annotation = node.id ? annotations.get(node.id) : undefined;
  const semStr = annotation ? ` :: ${annotation.semanticType} = ${annotation.value}` : '';

  switch (node.type) {
    case 'or': {
      lines.push(`${prefix}${conn}OR(${node.symbol ?? '?'})${semStr}`);
      const alts = node.alternatives ?? [];
      for (let i = 0; i < alts.length; i++) {
        renderAnnotatedNode(alts[i]!, source, annotations, opts, lines, prefix + cont, i === alts.length - 1, depth + 1);
      }
      break;
    }
    case 'and': {
      const compStr = annotation?.composition ? ` [${annotation.composition}]` : '';
      lines.push(`${prefix}${conn}AND(${node.symbol ?? '?'} ← ${node.ruleId ?? '?'})${semStr}${compStr}`);
      const children = node.children ?? [];
      for (let i = 0; i < children.length; i++) {
        renderAnnotatedNode(children[i]!, source, annotations, opts, lines, prefix + cont, i === children.length - 1, depth + 1);
      }
      break;
    }
    case 'leaf': {
      lines.push(`${prefix}${conn}"${node.token?.text ?? '?'}" (${node.token?.type ?? '?'})${semStr}`);
      break;
    }
  }
}

// =============================================================================
// SPAN-SOURCE MAPPING — Show source text under parse nodes
// =============================================================================

/**
 * A span-to-source mapping entry.
 */
export interface SpanMapping {
  readonly nodeId: string;
  readonly nodeType: 'or' | 'and' | 'leaf';
  readonly symbol: string;
  readonly spanStart: number;
  readonly spanEnd: number;
  readonly sourceText: string;
  readonly depth: number;
}

/**
 * Extract all span mappings from a forest.
 */
export function extractSpanMappings(
  forest: VisualizableForest,
): readonly SpanMapping[] {
  const mappings: SpanMapping[] = [];
  collectSpanMappings(forest.root, forest.source, mappings, 0);
  return mappings.sort((a, b) => a.spanStart - b.spanStart || a.depth - b.depth);
}

function collectSpanMappings(
  node: VisualizableNode,
  source: string,
  mappings: SpanMapping[],
  depth: number,
): void {
  const text = source.slice(node.span.start, node.span.end);
  const symbol = node.symbol ?? node.ruleId ?? node.token?.type ?? '?';

  mappings.push({
    nodeId: node.id ?? `anon_${mappings.length}`,
    nodeType: node.type,
    symbol,
    spanStart: node.span.start,
    spanEnd: node.span.end,
    sourceText: text,
    depth,
  });

  if (node.type === 'or') {
    for (const alt of node.alternatives ?? []) {
      collectSpanMappings(alt, source, mappings, depth + 1);
    }
  } else if (node.type === 'and') {
    for (const child of node.children ?? []) {
      collectSpanMappings(child, source, mappings, depth + 1);
    }
  }
}

/**
 * Render a span mapping table.
 */
export function renderSpanTable(
  mappings: readonly SpanMapping[],
  source: string,
  opts?: Partial<ForestVisualizationOptions>,
): string {
  const options = { ...DEFAULT_VISUALIZATION_OPTIONS, ...opts };
  const lines: string[] = [];

  lines.push(headerLine('Span Mapping Table', options));
  lines.push('');

  // Column headers
  const header = padRight('Span', 12) + padRight('Type', 6) + padRight('Symbol', 20) + 'Text';
  lines.push(header);
  lines.push('-'.repeat(Math.min(header.length + 20, options.maxWidth)));

  for (const m of mappings) {
    const spanStr = `${m.spanStart}..${m.spanEnd}`;
    const indent = options.indent.repeat(m.depth);
    const line = padRight(spanStr, 12)
      + padRight(m.nodeType, 6)
      + padRight(`${indent}${m.symbol}`, 20)
      + `"${m.sourceText}"`;
    lines.push(line);
  }

  lines.push('');
  lines.push(`Source: "${source}"`);
  lines.push(`Total mappings: ${mappings.length}`);

  return lines.join('\n');
}

function padRight(s: string, width: number): string {
  return s.length >= width ? s + ' ' : s + ' '.repeat(width - s.length);
}

// =============================================================================
// FOREST DIFF — Compare two forests side by side
// =============================================================================

/**
 * A diff entry between two forests.
 */
export interface ForestDiffEntry {
  readonly type: 'added' | 'removed' | 'changed' | 'unchanged';
  readonly path: string;
  readonly left: string | null;
  readonly right: string | null;
  readonly details: string;
}

/**
 * Result of comparing two forests.
 */
export interface ForestDiffResult {
  readonly entries: readonly ForestDiffEntry[];
  readonly summary: ForestDiffSummary;
}

/**
 * Summary statistics of a forest diff.
 */
export interface ForestDiffSummary {
  readonly added: number;
  readonly removed: number;
  readonly changed: number;
  readonly unchanged: number;
  readonly total: number;
  readonly structurallyIdentical: boolean;
  readonly treeCountChanged: boolean;
  readonly ambiguityCountChanged: boolean;
}

/**
 * Compare two forests and produce a diff.
 */
export function diffForests(
  left: VisualizableForest,
  right: VisualizableForest,
): ForestDiffResult {
  const entries: ForestDiffEntry[] = [];

  // Metadata comparison
  if (left.treeCount !== right.treeCount) {
    entries.push({
      type: 'changed',
      path: 'treeCount',
      left: String(left.treeCount),
      right: String(right.treeCount),
      details: `Tree count changed from ${left.treeCount} to ${right.treeCount}.`,
    });
  } else {
    entries.push({
      type: 'unchanged',
      path: 'treeCount',
      left: String(left.treeCount),
      right: String(right.treeCount),
      details: `Tree count: ${left.treeCount}.`,
    });
  }

  if (left.metadata.ambiguityCount !== right.metadata.ambiguityCount) {
    entries.push({
      type: 'changed',
      path: 'ambiguityCount',
      left: String(left.metadata.ambiguityCount),
      right: String(right.metadata.ambiguityCount),
      details: `Ambiguity count changed from ${left.metadata.ambiguityCount} to ${right.metadata.ambiguityCount}.`,
    });
  }

  if (left.metadata.totalNodes !== right.metadata.totalNodes) {
    entries.push({
      type: 'changed',
      path: 'totalNodes',
      left: String(left.metadata.totalNodes),
      right: String(right.metadata.totalNodes),
      details: `Node count changed from ${left.metadata.totalNodes} to ${right.metadata.totalNodes}.`,
    });
  }

  if (left.metadata.maxDepth !== right.metadata.maxDepth) {
    entries.push({
      type: 'changed',
      path: 'maxDepth',
      left: String(left.metadata.maxDepth),
      right: String(right.metadata.maxDepth),
      details: `Max depth changed from ${left.metadata.maxDepth} to ${right.metadata.maxDepth}.`,
    });
  }

  // Source comparison
  if (left.source !== right.source) {
    entries.push({
      type: 'changed',
      path: 'source',
      left: left.source,
      right: right.source,
      details: 'Source text differs.',
    });
  }

  // Structural comparison (recursive)
  diffNodes(left.root, right.root, 'root', entries);

  // Ambiguity comparison
  const leftAmbIds = new Set(left.ambiguities.map(a => a.nodeId));
  const rightAmbIds = new Set(right.ambiguities.map(a => a.nodeId));

  for (const amb of left.ambiguities) {
    if (!rightAmbIds.has(amb.nodeId)) {
      entries.push({
        type: 'removed',
        path: `ambiguity/${amb.nodeId}`,
        left: `${amb.symbol} "${amb.text}" (${amb.alternativeCount} alts)`,
        right: null,
        details: `Ambiguity at "${amb.text}" removed.`,
      });
    }
  }

  for (const amb of right.ambiguities) {
    if (!leftAmbIds.has(amb.nodeId)) {
      entries.push({
        type: 'added',
        path: `ambiguity/${amb.nodeId}`,
        left: null,
        right: `${amb.symbol} "${amb.text}" (${amb.alternativeCount} alts)`,
        details: `Ambiguity at "${amb.text}" added.`,
      });
    }
  }

  // Summary
  const added = entries.filter(e => e.type === 'added').length;
  const removed = entries.filter(e => e.type === 'removed').length;
  const changed = entries.filter(e => e.type === 'changed').length;
  const unchanged = entries.filter(e => e.type === 'unchanged').length;

  return {
    entries,
    summary: {
      added,
      removed,
      changed,
      unchanged,
      total: entries.length,
      structurallyIdentical: added === 0 && removed === 0 && changed === 0,
      treeCountChanged: left.treeCount !== right.treeCount,
      ambiguityCountChanged: left.metadata.ambiguityCount !== right.metadata.ambiguityCount,
    },
  };
}

function diffNodes(
  left: VisualizableNode | undefined,
  right: VisualizableNode | undefined,
  path: string,
  entries: ForestDiffEntry[],
): void {
  if (!left && !right) return;

  if (!left && right) {
    entries.push({
      type: 'added',
      path,
      left: null,
      right: nodeLabel(right),
      details: `Node added: ${nodeLabel(right)}.`,
    });
    return;
  }

  if (left && !right) {
    entries.push({
      type: 'removed',
      path,
      left: nodeLabel(left),
      right: null,
      details: `Node removed: ${nodeLabel(left)}.`,
    });
    return;
  }

  const l = left!;
  const r = right!;

  if (l.type !== r.type) {
    entries.push({
      type: 'changed',
      path,
      left: `${l.type}(${nodeLabel(l)})`,
      right: `${r.type}(${nodeLabel(r)})`,
      details: `Node type changed from ${l.type} to ${r.type}.`,
    });
    return;
  }

  // Same type — compare children
  if (l.type === 'or' && r.type === 'or') {
    const lAlts = l.alternatives ?? [];
    const rAlts = r.alternatives ?? [];
    const maxAlts = Math.max(lAlts.length, rAlts.length);
    for (let i = 0; i < maxAlts; i++) {
      diffNodes(lAlts[i], rAlts[i], `${path}/alt[${i}]`, entries);
    }
  } else if (l.type === 'and' && r.type === 'and') {
    if (l.ruleId !== r.ruleId) {
      entries.push({
        type: 'changed',
        path: `${path}/rule`,
        left: l.ruleId ?? '?',
        right: r.ruleId ?? '?',
        details: `Rule changed from ${l.ruleId} to ${r.ruleId}.`,
      });
    }
    const lChildren = l.children ?? [];
    const rChildren = r.children ?? [];
    const maxChildren = Math.max(lChildren.length, rChildren.length);
    for (let i = 0; i < maxChildren; i++) {
      diffNodes(lChildren[i], rChildren[i], `${path}/child[${i}]`, entries);
    }
  } else if (l.type === 'leaf' && r.type === 'leaf') {
    if (l.token?.text !== r.token?.text) {
      entries.push({
        type: 'changed',
        path,
        left: l.token?.text ?? '?',
        right: r.token?.text ?? '?',
        details: `Leaf text changed from "${l.token?.text}" to "${r.token?.text}".`,
      });
    }
  }
}

function nodeLabel(node: VisualizableNode): string {
  switch (node.type) {
    case 'or': return node.symbol ?? 'OR';
    case 'and': return `${node.symbol ?? '?'} ← ${node.ruleId ?? '?'}`;
    case 'leaf': return `"${node.token?.text ?? '?'}"`;
  }
}

/**
 * Render a forest diff as text.
 */
export function renderForestDiff(diff: ForestDiffResult): string {
  const lines: string[] = [];

  lines.push('=== Forest Diff ===');
  lines.push('');

  if (diff.summary.structurallyIdentical) {
    lines.push('Forests are structurally identical.');
    return lines.join('\n');
  }

  lines.push(`Changes: +${diff.summary.added} -${diff.summary.removed} ~${diff.summary.changed} =${diff.summary.unchanged}`);
  lines.push('');

  for (const entry of diff.entries) {
    if (entry.type === 'unchanged') continue;

    const marker = entry.type === 'added' ? '+' : entry.type === 'removed' ? '-' : '~';
    lines.push(`${marker} ${entry.path}: ${entry.details}`);
    if (entry.left && entry.right) {
      lines.push(`  L: ${entry.left}`);
      lines.push(`  R: ${entry.right}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// INTERACTIVE TRACE — Step-by-step parse derivation
// =============================================================================

/**
 * A derivation step in an interactive trace.
 */
export interface DerivationStep {
  readonly stepNumber: number;
  readonly action: DerivationAction;
  readonly nodeId: string;
  readonly symbol: string;
  readonly span: { readonly start: number; readonly end: number };
  readonly sourceText: string;
  readonly ruleId: string | null;
  readonly childCount: number;
  readonly isAmbiguous: boolean;
  readonly alternativeCount: number;
  readonly depth: number;
}

/**
 * Type of derivation action.
 */
export type DerivationAction =
  | 'scan'        // Matched a terminal token
  | 'predict'     // Predicted a non-terminal
  | 'complete'    // Completed a rule
  | 'ambiguate'   // Created an ambiguity point
  | 'select';     // Selected one alternative

/**
 * A full derivation trace.
 */
export interface DerivationTrace {
  readonly steps: readonly DerivationStep[];
  readonly source: string;
  readonly totalSteps: number;
  readonly ambiguitySteps: number;
  readonly maxDepth: number;
}

/**
 * Build a derivation trace by walking the forest in construction order.
 *
 * The trace is a post-order traversal: leaves first, then parents.
 * This mirrors how an Earley parser builds the forest bottom-up.
 */
export function buildDerivationTrace(
  forest: VisualizableForest,
): DerivationTrace {
  const steps: DerivationStep[] = [];
  walkForPostOrder(forest.root, forest.source, steps, 0);

  const ambiguitySteps = steps.filter(s => s.isAmbiguous).length;
  const maxDepth = steps.reduce((max, s) => Math.max(max, s.depth), 0);

  return {
    steps,
    source: forest.source,
    totalSteps: steps.length,
    ambiguitySteps,
    maxDepth,
  };
}

function walkForPostOrder(
  node: VisualizableNode,
  source: string,
  steps: DerivationStep[],
  depth: number,
): void {
  switch (node.type) {
    case 'leaf': {
      steps.push({
        stepNumber: steps.length + 1,
        action: 'scan',
        nodeId: node.id ?? `leaf_${steps.length}`,
        symbol: node.token?.type ?? '?',
        span: node.span,
        sourceText: source.slice(node.span.start, node.span.end),
        ruleId: null,
        childCount: 0,
        isAmbiguous: false,
        alternativeCount: 0,
        depth,
      });
      break;
    }

    case 'and': {
      // Children first (bottom-up)
      for (const child of node.children ?? []) {
        walkForPostOrder(child, source, steps, depth + 1);
      }
      steps.push({
        stepNumber: steps.length + 1,
        action: 'complete',
        nodeId: node.id ?? `and_${steps.length}`,
        symbol: node.symbol ?? '?',
        span: node.span,
        sourceText: source.slice(node.span.start, node.span.end),
        ruleId: node.ruleId ?? null,
        childCount: node.children?.length ?? 0,
        isAmbiguous: false,
        alternativeCount: 0,
        depth,
      });
      break;
    }

    case 'or': {
      const alts = node.alternatives ?? [];
      const isAmbiguous = alts.length > 1;

      // Walk each alternative
      for (const alt of alts) {
        walkForPostOrder(alt, source, steps, depth + 1);
      }

      if (isAmbiguous) {
        steps.push({
          stepNumber: steps.length + 1,
          action: 'ambiguate',
          nodeId: node.id ?? `or_${steps.length}`,
          symbol: node.symbol ?? '?',
          span: node.span,
          sourceText: source.slice(node.span.start, node.span.end),
          ruleId: null,
          childCount: alts.length,
          isAmbiguous: true,
          alternativeCount: alts.length,
          depth,
        });
      } else if (alts.length === 1) {
        // Trivial OR — pass through
        steps.push({
          stepNumber: steps.length + 1,
          action: 'predict',
          nodeId: node.id ?? `or_${steps.length}`,
          symbol: node.symbol ?? '?',
          span: node.span,
          sourceText: source.slice(node.span.start, node.span.end),
          ruleId: null,
          childCount: 1,
          isAmbiguous: false,
          alternativeCount: 1,
          depth,
        });
      }
      break;
    }
  }
}

/**
 * Render a derivation trace as a step-by-step log.
 */
export function renderDerivationTrace(
  trace: DerivationTrace,
  options?: Partial<ForestVisualizationOptions>,
): string {
  const opts = { ...DEFAULT_VISUALIZATION_OPTIONS, ...options };
  const lines: string[] = [];

  lines.push(headerLine('Derivation Trace', opts));
  lines.push(`Source: "${trace.source}"`);
  lines.push(`Steps: ${trace.totalSteps} | Ambiguities: ${trace.ambiguitySteps} | Max depth: ${trace.maxDepth}`);
  lines.push('');

  const stepWidth = String(trace.totalSteps).length;

  for (const step of trace.steps) {
    const num = String(step.stepNumber).padStart(stepWidth, ' ');
    const indent = opts.indent.repeat(step.depth);
    const actionStr = step.action.toUpperCase().padEnd(10);
    const ambStr = step.isAmbiguous ? ` [${step.alternativeCount} alts]` : '';

    let detail: string;
    switch (step.action) {
      case 'scan':
        detail = `"${step.sourceText}" (${step.symbol})`;
        break;
      case 'complete':
        detail = `${step.symbol} ← ${step.ruleId ?? '?'} (${step.childCount} children)`;
        break;
      case 'predict':
        detail = step.symbol;
        break;
      case 'ambiguate':
        detail = `${step.symbol} — ${step.alternativeCount} alternatives for "${step.sourceText}"`;
        break;
      case 'select':
        detail = `${step.symbol} → ${step.ruleId ?? '?'}`;
        break;
    }

    lines.push(`${num}. ${indent}${actionStr} ${detail}${ambStr}`);
  }

  return lines.join('\n');
}

// =============================================================================
// STATISTICS DASHBOARD
// =============================================================================

/**
 * Comprehensive forest statistics.
 */
export interface ForestStatistics {
  readonly nodeCount: NodeCountStats;
  readonly ambiguity: AmbiguityStats;
  readonly depth: DepthStats;
  readonly breadth: BreadthStats;
  readonly complexity: ComplexityStats;
}

export interface NodeCountStats {
  readonly total: number;
  readonly or: number;
  readonly and: number;
  readonly leaf: number;
  readonly orPercentage: number;
  readonly andPercentage: number;
  readonly leafPercentage: number;
}

export interface AmbiguityStats {
  readonly count: number;
  readonly maxAlternatives: number;
  readonly avgAlternatives: number;
  readonly bySeverity: { readonly low: number; readonly medium: number; readonly high: number };
  readonly ambiguityDensity: number;   // ambiguity count / total nodes
}

export interface DepthStats {
  readonly max: number;
  readonly average: number;
  readonly leafDepths: readonly number[];
}

export interface BreadthStats {
  readonly maxBranching: number;
  readonly avgBranching: number;
  readonly leafCount: number;
}

export interface ComplexityStats {
  readonly treeCount: number;
  readonly nodesPerTree: number;
  readonly packingRatio: number;        // total nodes / (nodes if unpacked)
  readonly shannonEntropy: number;      // Information-theoretic ambiguity measure
}

/**
 * Compute comprehensive statistics for a forest.
 */
export function computeForestStatistics(
  forest: VisualizableForest,
): ForestStatistics {
  const { metadata } = forest;
  const total = metadata.totalNodes;

  // Node counts
  const nodeCount: NodeCountStats = {
    total,
    or: metadata.orNodeCount,
    and: metadata.andNodeCount,
    leaf: metadata.leafNodeCount,
    orPercentage: total > 0 ? metadata.orNodeCount / total : 0,
    andPercentage: total > 0 ? metadata.andNodeCount / total : 0,
    leafPercentage: total > 0 ? metadata.leafNodeCount / total : 0,
  };

  // Ambiguity
  const ambCounts = forest.ambiguities.map(a => a.alternativeCount);
  const maxAlts = ambCounts.length > 0 ? Math.max(...ambCounts) : 0;
  const avgAlts = ambCounts.length > 0
    ? ambCounts.reduce((s, c) => s + c, 0) / ambCounts.length
    : 0;

  const bySeverity = { low: 0, medium: 0, high: 0 };
  for (const a of forest.ambiguities) {
    bySeverity[a.severity]++;
  }

  const ambiguity: AmbiguityStats = {
    count: forest.ambiguities.length,
    maxAlternatives: maxAlts,
    avgAlternatives: avgAlts,
    bySeverity,
    ambiguityDensity: total > 0 ? forest.ambiguities.length / total : 0,
  };

  // Depth
  const leafDepths: number[] = [];
  collectLeafDepths(forest.root, 0, leafDepths);
  const avgDepth = leafDepths.length > 0
    ? leafDepths.reduce((s, d) => s + d, 0) / leafDepths.length
    : 0;

  const depth: DepthStats = {
    max: metadata.maxDepth,
    average: avgDepth,
    leafDepths,
  };

  // Breadth
  const branchingFactors: number[] = [];
  collectBranching(forest.root, branchingFactors);
  const maxBranching = branchingFactors.length > 0 ? Math.max(...branchingFactors) : 0;
  const avgBranching = branchingFactors.length > 0
    ? branchingFactors.reduce((s, b) => s + b, 0) / branchingFactors.length
    : 0;

  const breadth: BreadthStats = {
    maxBranching,
    avgBranching,
    leafCount: metadata.leafNodeCount,
  };

  // Complexity
  const nodesPerTree = forest.treeCount > 0 ? total / forest.treeCount : total;
  const unpackedEstimate = forest.treeCount * nodesPerTree;
  const packingRatio = unpackedEstimate > 0 ? total / unpackedEstimate : 1;

  // Shannon entropy based on ambiguity distribution
  let entropy = 0;
  for (const a of forest.ambiguities) {
    if (a.alternativeCount > 1) {
      const p = 1 / a.alternativeCount;
      entropy += -a.alternativeCount * p * Math.log2(p);
    }
  }

  const complexity: ComplexityStats = {
    treeCount: forest.treeCount,
    nodesPerTree,
    packingRatio,
    shannonEntropy: entropy,
  };

  return { nodeCount, ambiguity, depth, breadth, complexity };
}

function collectLeafDepths(node: VisualizableNode, depth: number, depths: number[]): void {
  if (node.type === 'leaf') {
    depths.push(depth);
    return;
  }
  const children = node.type === 'or'
    ? node.alternatives ?? []
    : node.children ?? [];
  for (const child of children) {
    collectLeafDepths(child, depth + 1, depths);
  }
}

function collectBranching(node: VisualizableNode, factors: number[]): void {
  if (node.type === 'leaf') return;

  const children = node.type === 'or'
    ? node.alternatives ?? []
    : node.children ?? [];

  if (children.length > 0) {
    factors.push(children.length);
    for (const child of children) {
      collectBranching(child, factors);
    }
  }
}

/**
 * Render a statistics dashboard as text.
 */
export function renderStatsDashboard(
  stats: ForestStatistics,
  options?: Partial<ForestVisualizationOptions>,
): string {
  const opts = { ...DEFAULT_VISUALIZATION_OPTIONS, ...options };
  const lines: string[] = [];

  lines.push(headerLine('Forest Statistics Dashboard', opts));
  lines.push('');

  // Node counts
  lines.push('Node Counts:');
  lines.push(`  Total:  ${stats.nodeCount.total}`);
  lines.push(`  OR:     ${stats.nodeCount.or} (${(stats.nodeCount.orPercentage * 100).toFixed(1)}%)`);
  lines.push(`  AND:    ${stats.nodeCount.and} (${(stats.nodeCount.andPercentage * 100).toFixed(1)}%)`);
  lines.push(`  Leaf:   ${stats.nodeCount.leaf} (${(stats.nodeCount.leafPercentage * 100).toFixed(1)}%)`);
  lines.push('');

  // Ambiguity
  lines.push('Ambiguity:');
  lines.push(`  Points:          ${stats.ambiguity.count}`);
  lines.push(`  Max alternatives: ${stats.ambiguity.maxAlternatives}`);
  lines.push(`  Avg alternatives: ${stats.ambiguity.avgAlternatives.toFixed(1)}`);
  lines.push(`  Density:          ${(stats.ambiguity.ambiguityDensity * 100).toFixed(2)}%`);
  lines.push(`  By severity:      low=${stats.ambiguity.bySeverity.low} med=${stats.ambiguity.bySeverity.medium} high=${stats.ambiguity.bySeverity.high}`);
  lines.push('');

  // Depth
  lines.push('Depth:');
  lines.push(`  Max:     ${stats.depth.max}`);
  lines.push(`  Average: ${stats.depth.average.toFixed(1)}`);
  lines.push('');

  // Breadth
  lines.push('Breadth:');
  lines.push(`  Max branching: ${stats.breadth.maxBranching}`);
  lines.push(`  Avg branching: ${stats.breadth.avgBranching.toFixed(1)}`);
  lines.push(`  Leaf count:    ${stats.breadth.leafCount}`);
  lines.push('');

  // Complexity
  lines.push('Complexity:');
  lines.push(`  Trees:          ${stats.complexity.treeCount}`);
  lines.push(`  Nodes/tree:     ${stats.complexity.nodesPerTree.toFixed(1)}`);
  lines.push(`  Packing ratio:  ${stats.complexity.packingRatio.toFixed(3)}`);
  lines.push(`  Shannon entropy: ${stats.complexity.shannonEntropy.toFixed(2)} bits`);

  return lines.join('\n');
}

// =============================================================================
// JSON EXPORT — structured data for external tools
// =============================================================================

/**
 * Export a forest and its analysis as a JSON-serializable object.
 */
export function exportForestJson(
  forest: VisualizableForest,
): object {
  const stats = computeForestStatistics(forest);
  const trace = buildDerivationTrace(forest);
  const spanMappings = extractSpanMappings(forest);

  return {
    source: forest.source,
    treeCount: forest.treeCount,
    metadata: forest.metadata,
    statistics: {
      nodeCount: stats.nodeCount,
      ambiguity: {
        count: stats.ambiguity.count,
        maxAlternatives: stats.ambiguity.maxAlternatives,
        avgAlternatives: stats.ambiguity.avgAlternatives,
        bySeverity: stats.ambiguity.bySeverity,
        density: stats.ambiguity.ambiguityDensity,
      },
      depth: {
        max: stats.depth.max,
        average: stats.depth.average,
      },
      breadth: {
        maxBranching: stats.breadth.maxBranching,
        avgBranching: stats.breadth.avgBranching,
      },
      complexity: stats.complexity,
    },
    ambiguities: forest.ambiguities.map(a => ({
      nodeId: a.nodeId,
      symbol: a.symbol,
      text: a.text,
      alternativeCount: a.alternativeCount,
      severity: a.severity,
    })),
    derivation: {
      totalSteps: trace.totalSteps,
      ambiguitySteps: trace.ambiguitySteps,
      steps: trace.steps.map(s => ({
        step: s.stepNumber,
        action: s.action,
        symbol: s.symbol,
        text: s.sourceText,
        depth: s.depth,
        isAmbiguous: s.isAmbiguous,
      })),
    },
    spanMappings: spanMappings.map(m => ({
      symbol: m.symbol,
      type: m.nodeType,
      start: m.spanStart,
      end: m.spanEnd,
      text: m.sourceText,
      depth: m.depth,
    })),
  };
}

// =============================================================================
// COMBINED VISUALIZATION — all-in-one developer output
// =============================================================================

/**
 * Generate a complete developer visualization of a forest.
 * Combines tree, stats, ambiguity summary, and derivation trace.
 */
export function visualizeForest(
  forest: VisualizableForest,
  options?: Partial<ForestVisualizationOptions>,
): string {
  const sections: string[] = [];

  sections.push(renderForestTree(forest, options));
  sections.push('');

  const stats = computeForestStatistics(forest);
  sections.push(renderStatsDashboard(stats, options));
  sections.push('');

  if (forest.ambiguities.length > 0) {
    const trace = buildDerivationTrace(forest);
    sections.push(renderDerivationTrace(trace, options));
  }

  return sections.join('\n');
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset internal DOT counter (for deterministic test output).
 */
export function resetVisualizerState(): void {
  _dotCounter = 0;
}
