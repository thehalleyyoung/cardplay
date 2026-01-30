/**
 * GOFAI NL Semantics — HCI Patterns for CPL Interaction
 *
 * Implements Steps 196–200 of the project roadmap, providing
 * human-computer interaction patterns for the CPL (Compositional
 * Production Language) pipeline:
 *
 * - Step 196: CPL Viewer UX — tree rendering, tag styles, span mappings
 * - Step 197: Ambiguity UI Pattern — side-by-side candidates with consequences
 * - Step 198: Semantic Provenance UI Pattern — hover tooltips, rule tracing
 * - Step 199: User Vocabulary Learning UX — preference capture and storage
 * - Step 200: Teach Mode — musical explanations and education workflow
 *
 * @module gofai/nl/semantics/hci-patterns
 * @see gofai_goalA.md Steps 196–200
 */

// =============================================================================
// STEP 196 [HCI] — CPL Viewer UX
// =============================================================================
//
// Defines a CPL viewer UX specification: collapsible tree, colored tags
// (goal/constraint/scope), and clickable spans back to original text.
// =============================================================================

// ---------------------------------------------------------------------------
// 196 — Types
// ---------------------------------------------------------------------------

/** Describes a single node in the CPL tree for rendering purposes. */
export interface CPLTreeNode {
  /** Unique node identifier within the tree. */
  readonly id: string;
  /** The CPL node type (intent, goal, constraint, etc.). */
  readonly nodeType: CPLNodeType;
  /** Human-readable label for this node. */
  readonly label: string;
  /** Children of this node. */
  readonly children: readonly CPLTreeNode[];
  /** Whether the node is currently expanded in the UI. */
  readonly expanded: boolean;
  /** Character span in the original utterance [start, end). */
  readonly sourceSpan: readonly [number, number] | null;
  /** Confidence score 0–1 for this node. */
  readonly confidence: number;
  /** Optional metadata bag. */
  readonly metadata: Readonly<Record<string, string>>;
}

/** All CPL node types that can appear in the tree. */
export type CPLNodeType =
  | 'intent'
  | 'goal'
  | 'constraint'
  | 'preference'
  | 'scope'
  | 'timeRange'
  | 'selector'
  | 'amount'
  | 'hole'
  | 'opcode'
  | 'modifier'
  | 'reference'
  | 'literal'
  | 'group';

/** RGB hex color string (e.g. "#ff0000"). */
export type HexColor = string;

/** Styling for a single tag type. */
export interface CPLTagStyle {
  /** Background color of the tag chip. */
  readonly background: HexColor;
  /** Text color of the tag chip. */
  readonly foreground: HexColor;
  /** Border color. */
  readonly border: HexColor;
  /** Icon name (font-icon key). */
  readonly icon: string;
  /** Short label shown in the tag. */
  readonly shortLabel: string;
  /** Longer accessible label for screen readers. */
  readonly accessibleLabel: string;
}

/** Maps a CPL tree node back to a range in the source utterance. */
export interface CPLSpanMapping {
  /** The node ID this mapping belongs to. */
  readonly nodeId: string;
  /** The node type. */
  readonly nodeType: CPLNodeType;
  /** Start character offset (inclusive). */
  readonly charStart: number;
  /** End character offset (exclusive). */
  readonly charEnd: number;
  /** The source text slice. */
  readonly sourceText: string;
  /** Nesting depth (0 = top level). */
  readonly depth: number;
}

/** High-level viewer theme. */
export interface CPLViewerTheme {
  /** Theme name. */
  readonly name: string;
  /** Tag styles by node type. */
  readonly tagStyles: Readonly<Record<CPLNodeType, CPLTagStyle>>;
  /** Background color of the tree panel. */
  readonly panelBackground: HexColor;
  /** Default text color. */
  readonly textColor: HexColor;
  /** Connector line color between tree nodes. */
  readonly connectorColor: HexColor;
  /** Highlight color when hovering. */
  readonly hoverHighlight: HexColor;
  /** Selection color when a node is clicked. */
  readonly selectionHighlight: HexColor;
  /** Font family. */
  readonly fontFamily: string;
  /** Base font size in px. */
  readonly fontSize: number;
}

/** Configuration for the CPL tree viewer. */
export interface CPLViewerConfig {
  /** Which theme to use. */
  readonly theme: CPLViewerTheme;
  /** Maximum tree depth to render (0 = unlimited). */
  readonly maxDepth: number;
  /** Whether to show confidence badges. */
  readonly showConfidence: boolean;
  /** Whether to show source-span underlines. */
  readonly showSpanLinks: boolean;
  /** Whether to allow collapsing/expanding. */
  readonly collapsible: boolean;
  /** Whether to show node IDs (developer mode). */
  readonly showNodeIds: boolean;
  /** Current search/filter query (empty = no filter). */
  readonly filterQuery: string;
  /** Which node types to display (empty = all). */
  readonly visibleTypes: readonly CPLNodeType[];
  /** Accessibility: high-contrast mode. */
  readonly highContrast: boolean;
  /** Accessibility: extra screen-reader labels. */
  readonly screenReaderVerbose: boolean;
  /** Accessibility: keyboard nav hints visible. */
  readonly showKeyboardHints: boolean;
  /** Layout preset name. */
  readonly layoutPreset: string;
}

/** Stats about a CPL tree. */
export interface CPLTreeStats {
  readonly totalNodes: number;
  readonly maxDepth: number;
  readonly nodeCountByType: Readonly<Record<string, number>>;
  readonly avgConfidence: number;
  readonly minConfidence: number;
  readonly nodesWithSpans: number;
  readonly nodesWithoutSpans: number;
}

/** A named viewer layout preset. */
export interface CPLViewerPreset {
  readonly name: string;
  readonly description: string;
  readonly config: Partial<CPLViewerConfig>;
}

// ---------------------------------------------------------------------------
// 196 — Tag Color Database
// ---------------------------------------------------------------------------

/**
 * Complete tag color scheme for all CPL node types.
 * Each entry provides background, foreground, border, icon, and labels.
 */
export const CPL_TAG_STYLES: Readonly<Record<CPLNodeType, CPLTagStyle>> = {
  intent: {
    background: '#4A90D9',
    foreground: '#FFFFFF',
    border: '#2C6FB5',
    icon: 'target',
    shortLabel: 'INT',
    accessibleLabel: 'Intent node',
  },
  goal: {
    background: '#50B86C',
    foreground: '#FFFFFF',
    border: '#3A9455',
    icon: 'flag',
    shortLabel: 'GOL',
    accessibleLabel: 'Goal node',
  },
  constraint: {
    background: '#E8534A',
    foreground: '#FFFFFF',
    border: '#C23D35',
    icon: 'lock',
    shortLabel: 'CON',
    accessibleLabel: 'Constraint node',
  },
  preference: {
    background: '#F5A623',
    foreground: '#1A1A1A',
    border: '#D48F1A',
    icon: 'heart',
    shortLabel: 'PRF',
    accessibleLabel: 'Preference node',
  },
  scope: {
    background: '#9B59B6',
    foreground: '#FFFFFF',
    border: '#7D3C98',
    icon: 'layers',
    shortLabel: 'SCP',
    accessibleLabel: 'Scope node',
  },
  timeRange: {
    background: '#1ABC9C',
    foreground: '#FFFFFF',
    border: '#16A085',
    icon: 'clock',
    shortLabel: 'TMR',
    accessibleLabel: 'Time range node',
  },
  selector: {
    background: '#3498DB',
    foreground: '#FFFFFF',
    border: '#2980B9',
    icon: 'crosshair',
    shortLabel: 'SEL',
    accessibleLabel: 'Selector node',
  },
  amount: {
    background: '#E67E22',
    foreground: '#FFFFFF',
    border: '#CA6C17',
    icon: 'sliders',
    shortLabel: 'AMT',
    accessibleLabel: 'Amount node',
  },
  hole: {
    background: '#95A5A6',
    foreground: '#1A1A1A',
    border: '#7F8C8D',
    icon: 'help-circle',
    shortLabel: 'HLE',
    accessibleLabel: 'Hole node (unresolved)',
  },
  opcode: {
    background: '#2C3E50',
    foreground: '#ECF0F1',
    border: '#1A252F',
    icon: 'code',
    shortLabel: 'OPC',
    accessibleLabel: 'Opcode node',
  },
  modifier: {
    background: '#D4A5E5',
    foreground: '#1A1A1A',
    border: '#B97FCC',
    icon: 'edit-3',
    shortLabel: 'MOD',
    accessibleLabel: 'Modifier node',
  },
  reference: {
    background: '#5DADE2',
    foreground: '#FFFFFF',
    border: '#3498DB',
    icon: 'link',
    shortLabel: 'REF',
    accessibleLabel: 'Reference node',
  },
  literal: {
    background: '#ABEBC6',
    foreground: '#1A1A1A',
    border: '#82E0AA',
    icon: 'type',
    shortLabel: 'LIT',
    accessibleLabel: 'Literal node',
  },
  group: {
    background: '#F0E68C',
    foreground: '#1A1A1A',
    border: '#D4C85C',
    icon: 'folder',
    shortLabel: 'GRP',
    accessibleLabel: 'Group node',
  },
} as const;

// ---------------------------------------------------------------------------
// 196 — High-Contrast Tag Styles
// ---------------------------------------------------------------------------

export const CPL_TAG_STYLES_HIGH_CONTRAST: Readonly<Record<CPLNodeType, CPLTagStyle>> = {
  intent: {
    background: '#0000FF',
    foreground: '#FFFFFF',
    border: '#0000AA',
    icon: 'target',
    shortLabel: 'INT',
    accessibleLabel: 'Intent node (high contrast)',
  },
  goal: {
    background: '#008000',
    foreground: '#FFFFFF',
    border: '#005500',
    icon: 'flag',
    shortLabel: 'GOL',
    accessibleLabel: 'Goal node (high contrast)',
  },
  constraint: {
    background: '#FF0000',
    foreground: '#FFFFFF',
    border: '#AA0000',
    icon: 'lock',
    shortLabel: 'CON',
    accessibleLabel: 'Constraint node (high contrast)',
  },
  preference: {
    background: '#FFD700',
    foreground: '#000000',
    border: '#CCB000',
    icon: 'heart',
    shortLabel: 'PRF',
    accessibleLabel: 'Preference node (high contrast)',
  },
  scope: {
    background: '#800080',
    foreground: '#FFFFFF',
    border: '#550055',
    icon: 'layers',
    shortLabel: 'SCP',
    accessibleLabel: 'Scope node (high contrast)',
  },
  timeRange: {
    background: '#008080',
    foreground: '#FFFFFF',
    border: '#005555',
    icon: 'clock',
    shortLabel: 'TMR',
    accessibleLabel: 'Time range node (high contrast)',
  },
  selector: {
    background: '#0066CC',
    foreground: '#FFFFFF',
    border: '#004499',
    icon: 'crosshair',
    shortLabel: 'SEL',
    accessibleLabel: 'Selector node (high contrast)',
  },
  amount: {
    background: '#FF8C00',
    foreground: '#000000',
    border: '#CC7000',
    icon: 'sliders',
    shortLabel: 'AMT',
    accessibleLabel: 'Amount node (high contrast)',
  },
  hole: {
    background: '#808080',
    foreground: '#FFFFFF',
    border: '#555555',
    icon: 'help-circle',
    shortLabel: 'HLE',
    accessibleLabel: 'Hole node (high contrast)',
  },
  opcode: {
    background: '#000000',
    foreground: '#FFFFFF',
    border: '#333333',
    icon: 'code',
    shortLabel: 'OPC',
    accessibleLabel: 'Opcode node (high contrast)',
  },
  modifier: {
    background: '#CC00CC',
    foreground: '#FFFFFF',
    border: '#990099',
    icon: 'edit-3',
    shortLabel: 'MOD',
    accessibleLabel: 'Modifier node (high contrast)',
  },
  reference: {
    background: '#00BFFF',
    foreground: '#000000',
    border: '#0099CC',
    icon: 'link',
    shortLabel: 'REF',
    accessibleLabel: 'Reference node (high contrast)',
  },
  literal: {
    background: '#00FF00',
    foreground: '#000000',
    border: '#00CC00',
    icon: 'type',
    shortLabel: 'LIT',
    accessibleLabel: 'Literal node (high contrast)',
  },
  group: {
    background: '#FFFF00',
    foreground: '#000000',
    border: '#CCCC00',
    icon: 'folder',
    shortLabel: 'GRP',
    accessibleLabel: 'Group node (high contrast)',
  },
} as const;

// ---------------------------------------------------------------------------
// 196 — Default Themes
// ---------------------------------------------------------------------------

const LIGHT_THEME: CPLViewerTheme = {
  name: 'light',
  tagStyles: CPL_TAG_STYLES,
  panelBackground: '#FFFFFF',
  textColor: '#1A1A1A',
  connectorColor: '#CCCCCC',
  hoverHighlight: '#E8F4FD',
  selectionHighlight: '#B3D9F7',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  fontSize: 13,
} as const;

const DARK_THEME: CPLViewerTheme = {
  name: 'dark',
  tagStyles: CPL_TAG_STYLES,
  panelBackground: '#1E1E2E',
  textColor: '#CDD6F4',
  connectorColor: '#45475A',
  hoverHighlight: '#313244',
  selectionHighlight: '#585B70',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  fontSize: 13,
} as const;

const HIGH_CONTRAST_THEME: CPLViewerTheme = {
  name: 'high-contrast',
  tagStyles: CPL_TAG_STYLES_HIGH_CONTRAST,
  panelBackground: '#000000',
  textColor: '#FFFFFF',
  connectorColor: '#FFFFFF',
  hoverHighlight: '#333333',
  selectionHighlight: '#666666',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  fontSize: 14,
} as const;

/** All built-in themes indexed by name. */
export const CPL_VIEWER_THEMES: Readonly<Record<string, CPLViewerTheme>> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  'high-contrast': HIGH_CONTRAST_THEME,
} as const;

// ---------------------------------------------------------------------------
// 196 — Layout Presets (15+)
// ---------------------------------------------------------------------------

export const CPL_VIEWER_PRESETS: readonly CPLViewerPreset[] = [
  {
    name: 'compact',
    description: 'Minimal view, nodes collapsed by default, no IDs',
    config: { maxDepth: 3, showConfidence: false, showNodeIds: false, collapsible: true, showSpanLinks: false, layoutPreset: 'compact' },
  },
  {
    name: 'expanded',
    description: 'All nodes expanded, full depth',
    config: { maxDepth: 0, showConfidence: true, showNodeIds: false, collapsible: true, showSpanLinks: true, layoutPreset: 'expanded' },
  },
  {
    name: 'developer',
    description: 'Full detail with node IDs and confidence scores',
    config: { maxDepth: 0, showConfidence: true, showNodeIds: true, collapsible: true, showSpanLinks: true, layoutPreset: 'developer' },
  },
  {
    name: 'presentation',
    description: 'Large fonts, simplified tree for slides',
    config: { maxDepth: 2, showConfidence: false, showNodeIds: false, collapsible: false, showSpanLinks: false, layoutPreset: 'presentation' },
  },
  {
    name: 'diff-view',
    description: 'Optimised for comparing two CPL trees side by side',
    config: { maxDepth: 0, showConfidence: true, showNodeIds: true, collapsible: true, showSpanLinks: true, layoutPreset: 'diff-view' },
  },
  {
    name: 'goals-only',
    description: 'Filter to show only goal nodes',
    config: { visibleTypes: ['goal'], maxDepth: 0, showConfidence: true, layoutPreset: 'goals-only' },
  },
  {
    name: 'constraints-only',
    description: 'Filter to show only constraint nodes',
    config: { visibleTypes: ['constraint'], maxDepth: 0, showConfidence: true, layoutPreset: 'constraints-only' },
  },
  {
    name: 'flat-list',
    description: 'Flattened list view instead of tree',
    config: { maxDepth: 1, showConfidence: true, showNodeIds: false, collapsible: false, layoutPreset: 'flat-list' },
  },
  {
    name: 'accessibility',
    description: 'High contrast, large text, verbose screen-reader labels',
    config: { highContrast: true, screenReaderVerbose: true, showKeyboardHints: true, showConfidence: true, layoutPreset: 'accessibility' },
  },
  {
    name: 'minimal',
    description: 'Only top-level nodes, no decorations',
    config: { maxDepth: 1, showConfidence: false, showNodeIds: false, showSpanLinks: false, collapsible: false, layoutPreset: 'minimal' },
  },
  {
    name: 'debug',
    description: 'All information visible including metadata',
    config: { maxDepth: 0, showConfidence: true, showNodeIds: true, showSpanLinks: true, showKeyboardHints: true, layoutPreset: 'debug' },
  },
  {
    name: 'focus-scope',
    description: 'Highlight scope and time-range nodes',
    config: { visibleTypes: ['scope', 'timeRange', 'selector'], maxDepth: 0, showSpanLinks: true, layoutPreset: 'focus-scope' },
  },
  {
    name: 'teaching',
    description: 'Simplified view for educational contexts',
    config: { maxDepth: 2, showConfidence: false, showNodeIds: false, collapsible: true, showSpanLinks: true, screenReaderVerbose: true, layoutPreset: 'teaching' },
  },
  {
    name: 'opcode-trace',
    description: 'Focus on opcodes and their parameters',
    config: { visibleTypes: ['opcode', 'amount', 'selector'], maxDepth: 0, showNodeIds: true, showConfidence: true, layoutPreset: 'opcode-trace' },
  },
  {
    name: 'print',
    description: 'Optimised for printing, no hover effects',
    config: { maxDepth: 0, showConfidence: true, showNodeIds: false, collapsible: false, showSpanLinks: false, layoutPreset: 'print' },
  },
  {
    name: 'summary',
    description: 'Top-level goals and constraints only',
    config: { visibleTypes: ['goal', 'constraint', 'preference'], maxDepth: 2, showConfidence: false, layoutPreset: 'summary' },
  },
] as const;

// ---------------------------------------------------------------------------
// 196 — Keyboard Navigation Hints
// ---------------------------------------------------------------------------

export const KEYBOARD_NAV_HINTS: readonly { readonly key: string; readonly action: string }[] = [
  { key: 'ArrowDown', action: 'Move to next sibling node' },
  { key: 'ArrowUp', action: 'Move to previous sibling node' },
  { key: 'ArrowRight', action: 'Expand current node / move to first child' },
  { key: 'ArrowLeft', action: 'Collapse current node / move to parent' },
  { key: 'Enter', action: 'Select current node and highlight source span' },
  { key: 'Space', action: 'Toggle expand/collapse of current node' },
  { key: 'Home', action: 'Move to first node in tree' },
  { key: 'End', action: 'Move to last visible node in tree' },
  { key: '/', action: 'Open search/filter field' },
  { key: 'Escape', action: 'Clear search / deselect node' },
  { key: 'Tab', action: 'Move focus to source text panel' },
  { key: 'Shift+Tab', action: 'Move focus back to tree panel' },
] as const;

// ---------------------------------------------------------------------------
// 196 — Functions
// ---------------------------------------------------------------------------

/** Create a default viewer configuration using the light theme. */
export function createDefaultViewerConfig(): CPLViewerConfig {
  return {
    theme: LIGHT_THEME,
    maxDepth: 0,
    showConfidence: true,
    showSpanLinks: true,
    collapsible: true,
    showNodeIds: false,
    filterQuery: '',
    visibleTypes: [],
    highContrast: false,
    screenReaderVerbose: false,
    showKeyboardHints: false,
    layoutPreset: 'expanded',
  };
}

/**
 * Walk the CPL tree and compute span mappings from each node back to the
 * source utterance.
 */
export function computeSpanMappings(
  root: CPLTreeNode,
  utterance: string,
): readonly CPLSpanMapping[] {
  const result: CPLSpanMapping[] = [];

  function walk(node: CPLTreeNode, depth: number): void {
    if (node.sourceSpan !== null) {
      const [start, end] = node.sourceSpan;
      const safeStart = Math.max(0, Math.min(start, utterance.length));
      const safeEnd = Math.max(safeStart, Math.min(end, utterance.length));
      result.push({
        nodeId: node.id,
        nodeType: node.nodeType,
        charStart: safeStart,
        charEnd: safeEnd,
        sourceText: utterance.slice(safeStart, safeEnd),
        depth,
      });
    }
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  }

  walk(root, 0);
  return result;
}

/**
 * Render a CPL tree as indented plain text suitable for logging or
 * accessibility readout.
 */
export function renderCPLTreeToText(
  root: CPLTreeNode,
  config: CPLViewerConfig,
): string {
  const lines: string[] = [];
  const effectiveMaxDepth = config.maxDepth > 0 ? config.maxDepth : Infinity;
  const visibleSet = new Set(config.visibleTypes);
  const filterAll = visibleSet.size === 0;

  function walkClean(node: CPLTreeNode, depth: number, prefix: string, childPrefix: string): void {
    if (depth > effectiveMaxDepth) return;
    if (!filterAll && !visibleSet.has(node.nodeType)) return;

    const tag = formatNodeLabel(node, config);
    const confStr = config.showConfidence
      ? ` [${(node.confidence * 100).toFixed(0)}%]`
      : '';
    const idStr = config.showNodeIds ? ` (${node.id})` : '';
    lines.push(`${prefix}${tag}${confStr}${idStr}`);

    const visibleChildren = filterAll
      ? node.children
      : node.children.filter(c => visibleSet.has(c.nodeType));

    for (let i = 0; i < visibleChildren.length; i++) {
      const child = visibleChildren[i];
      if (child === undefined) continue;
      const isLast = i === visibleChildren.length - 1;
      const connector = isLast ? '└─ ' : '├─ ';
      const nextChildPrefix = childPrefix + (isLast ? '   ' : '│  ');
      walkClean(child, depth + 1, childPrefix + connector, nextChildPrefix);
    }
  }

  walkClean(root, 0, '', '');
  return lines.join('\n');
}

/** Filter the tree to only include nodes of certain types. */
export function filterTreeByType(
  root: CPLTreeNode,
  types: readonly CPLNodeType[],
): CPLTreeNode | null {
  const allowed = new Set(types);

  function prune(node: CPLTreeNode): CPLTreeNode | null {
    const keptChildren: CPLTreeNode[] = [];
    for (const child of node.children) {
      const pruned = prune(child);
      if (pruned !== null) {
        keptChildren.push(pruned);
      }
    }
    if (allowed.has(node.nodeType) || keptChildren.length > 0) {
      return {
        ...node,
        children: keptChildren,
      };
    }
    return null;
  }

  return prune(root);
}

/** Search the tree for nodes whose label matches the query (case-insensitive). */
export function searchTree(
  root: CPLTreeNode,
  query: string,
): readonly CPLTreeNode[] {
  const results: CPLTreeNode[] = [];
  const lowerQuery = query.toLowerCase();

  function walk(node: CPLTreeNode): void {
    if (node.label.toLowerCase().includes(lowerQuery)) {
      results.push(node);
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  walk(root);
  return results;
}

/** Gather statistics about a CPL tree. */
export function getTreeStats(root: CPLTreeNode): CPLTreeStats {
  let totalNodes = 0;
  let maxDepth = 0;
  let totalConfidence = 0;
  let minConfidence = 1;
  let nodesWithSpans = 0;
  let nodesWithoutSpans = 0;
  const countByType: Record<string, number> = {};

  function walk(node: CPLTreeNode, depth: number): void {
    totalNodes++;
    if (depth > maxDepth) maxDepth = depth;
    totalConfidence += node.confidence;
    if (node.confidence < minConfidence) minConfidence = node.confidence;
    if (node.sourceSpan !== null) {
      nodesWithSpans++;
    } else {
      nodesWithoutSpans++;
    }
    const prev = countByType[node.nodeType];
    countByType[node.nodeType] = (prev ?? 0) + 1;
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  }

  walk(root, 0);
  return {
    totalNodes,
    maxDepth,
    nodeCountByType: countByType,
    avgConfidence: totalNodes > 0 ? totalConfidence / totalNodes : 0,
    minConfidence: totalNodes > 0 ? minConfidence : 0,
    nodesWithSpans,
    nodesWithoutSpans,
  };
}

/** Format a human-readable label for a CPL tree node. */
export function formatNodeLabel(node: CPLTreeNode, config: CPLViewerConfig): string {
  const style = config.theme.tagStyles[node.nodeType];
  const tag = style.shortLabel;
  return `[${tag}] ${node.label}`;
}

/** Get the depth of a specific node by ID within the tree. Returns -1 if not found. */
export function getNodeDepth(root: CPLTreeNode, targetId: string): number {
  function walk(node: CPLTreeNode, depth: number): number {
    if (node.id === targetId) return depth;
    for (const child of node.children) {
      const found = walk(child, depth + 1);
      if (found >= 0) return found;
    }
    return -1;
  }
  return walk(root, 0);
}

/** Flatten the tree into a pre-order list. */
export function flattenTree(root: CPLTreeNode): readonly CPLTreeNode[] {
  const result: CPLTreeNode[] = [];
  function walk(node: CPLTreeNode): void {
    result.push(node);
    for (const child of node.children) {
      walk(child);
    }
  }
  walk(root);
  return result;
}

/** Group all nodes in the tree by their type. */
export function groupTreeByType(
  root: CPLTreeNode,
): Readonly<Record<string, readonly CPLTreeNode[]>> {
  const groups: Record<string, CPLTreeNode[]> = {};
  function walk(node: CPLTreeNode): void {
    const existing = groups[node.nodeType];
    if (existing !== undefined) {
      existing.push(node);
    } else {
      groups[node.nodeType] = [node];
    }
    for (const child of node.children) {
      walk(child);
    }
  }
  walk(root);
  return groups;
}


// =============================================================================
// STEP 197 [HCI] — Ambiguity UI Pattern
// =============================================================================
//
// Shows candidate meanings side-by-side with consequences; allows default
// selection.
// =============================================================================

// ---------------------------------------------------------------------------
// 197 — Types
// ---------------------------------------------------------------------------

/** The category of an ambiguity. */
export type AmbiguityCategory =
  | 'lexical'
  | 'scope'
  | 'attachment'
  | 'reference'
  | 'quantifier'
  | 'ellipsis'
  | 'metaphor'
  | 'metonymy'
  | 'coordination'
  | 'negation'
  | 'modality'
  | 'temporality'
  | 'causality'
  | 'comparison'
  | 'degree'
  | 'focus'
  | 'topic'
  | 'presupposition'
  | 'implicature'
  | 'speech-act'
  | 'polysemy'
  | 'vagueness';

/** How to resolve an ambiguity. */
export type AmbiguityResolutionStrategy =
  | 'ask-user'
  | 'use-default'
  | 'use-context'
  | 'use-frequency'
  | 'defer'
  | 'combine';

/** Impact severity of an ambiguity if resolved differently. */
export type AmbiguityImpact = 'cosmetic' | 'minor' | 'moderate' | 'major' | 'critical';

/** What changes in the CPL output for a given candidate. */
export interface AmbiguityConsequence {
  /** Which CPL node(s) are affected. */
  readonly affectedNodeIds: readonly string[];
  /** Human-readable description of the difference. */
  readonly description: string;
  /** In musical terms, what changes. */
  readonly musicalEffect: string;
  /** Severity of the change. */
  readonly impact: AmbiguityImpact;
  /** Example of the resulting audio change. */
  readonly audioExample: string;
}

/** One possible interpretation of an ambiguous phrase. */
export interface CandidateMeaning {
  /** Unique candidate ID within this ambiguity. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Longer explanation for the user. */
  readonly explanation: string;
  /** What happens if this candidate is chosen. */
  readonly consequence: AmbiguityConsequence;
  /** Prior probability / frequency score 0–1. */
  readonly priorScore: number;
  /** Contextual score 0–1. */
  readonly contextScore: number;
  /** Whether this is the recommended default. */
  readonly isDefault: boolean;
  /** Node type that would result in the CPL tree. */
  readonly resultNodeType: CPLNodeType;
}

/** A detected ambiguity with its candidate interpretations. */
export interface AmbiguityPresentation {
  /** Unique ambiguity ID. */
  readonly id: string;
  /** Category of the ambiguity. */
  readonly category: AmbiguityCategory;
  /** The source phrase that is ambiguous. */
  readonly sourcePhrase: string;
  /** Character span in the original utterance. */
  readonly charSpan: readonly [number, number];
  /** Candidate interpretations, ordered by score. */
  readonly candidates: readonly CandidateMeaning[];
  /** The recommended resolution strategy. */
  readonly strategy: AmbiguityResolutionStrategy;
  /** User-facing question to disambiguate. */
  readonly disambiguationQuestion: string;
  /** Why this ambiguity matters (user-facing). */
  readonly whyItMatters: string;
  /** Overall impact level. */
  readonly impact: AmbiguityImpact;
  /** Whether this ambiguity has been resolved. */
  readonly resolved: boolean;
  /** Index of the selected candidate (-1 if unresolved). */
  readonly selectedIndex: number;
}

/** Configuration for the ambiguity UI. */
export interface AmbiguityUIConfig {
  /** Whether to auto-resolve low-impact ambiguities. */
  readonly autoResolveLowImpact: boolean;
  /** Maximum candidates to show per ambiguity. */
  readonly maxCandidatesShown: number;
  /** Whether to show musical consequences. */
  readonly showMusicalEffects: boolean;
  /** Whether to show technical details. */
  readonly showTechnicalDetails: boolean;
  /** Default strategy when none is specified. */
  readonly defaultStrategy: AmbiguityResolutionStrategy;
  /** Whether to group ambiguities by category. */
  readonly groupByCategory: boolean;
  /** Sort order for ambiguities. */
  readonly sortBy: 'impact' | 'position' | 'category';
  /** Whether to show the "why it matters" section. */
  readonly showWhyItMatters: boolean;
}

/** A template for presenting a particular type of ambiguity. */
export interface AmbiguityDisplayTemplate {
  /** Which category this template covers. */
  readonly category: AmbiguityCategory;
  /** Template question with {phrase} placeholder. */
  readonly questionTemplate: string;
  /** Template for describing why it matters. */
  readonly whyItMattersTemplate: string;
  /** How to label option A vs option B. */
  readonly optionLabelPattern: string;
  /** Icon for this category. */
  readonly icon: string;
  /** Color for this category header. */
  readonly headerColor: HexColor;
  /** Short description of what this ambiguity type means. */
  readonly categoryDescription: string;
}

// ---------------------------------------------------------------------------
// 197 — Ambiguity Category Database
// ---------------------------------------------------------------------------

export const AMBIGUITY_CATEGORY_INFO: Readonly<Record<AmbiguityCategory, {
  readonly label: string;
  readonly description: string;
  readonly commonInMusic: boolean;
  readonly typicalImpact: AmbiguityImpact;
  readonly defaultStrategy: AmbiguityResolutionStrategy;
}>> = {
  lexical: {
    label: 'Word Meaning',
    description: 'A word has multiple dictionary senses',
    commonInMusic: true,
    typicalImpact: 'major',
    defaultStrategy: 'ask-user',
  },
  scope: {
    label: 'Scope',
    description: 'Unclear which part of the music a modifier applies to',
    commonInMusic: true,
    typicalImpact: 'major',
    defaultStrategy: 'ask-user',
  },
  attachment: {
    label: 'Attachment',
    description: 'Unclear which phrase a modifier or clause attaches to',
    commonInMusic: true,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-context',
  },
  reference: {
    label: 'Reference',
    description: 'Unclear what "it", "that", or a pronoun refers to',
    commonInMusic: false,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-context',
  },
  quantifier: {
    label: 'Quantifier',
    description: 'Unclear whether "all", "some", or "each" applies broadly or narrowly',
    commonInMusic: false,
    typicalImpact: 'minor',
    defaultStrategy: 'use-default',
  },
  ellipsis: {
    label: 'Ellipsis',
    description: 'Words are omitted and must be inferred',
    commonInMusic: true,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-context',
  },
  metaphor: {
    label: 'Metaphor',
    description: 'A word is used figuratively (e.g. "warm" for timbre)',
    commonInMusic: true,
    typicalImpact: 'major',
    defaultStrategy: 'ask-user',
  },
  metonymy: {
    label: 'Metonymy',
    description: 'A related concept is used to refer to something (e.g. "the bass" for bass instrument)',
    commonInMusic: true,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-context',
  },
  coordination: {
    label: 'Coordination',
    description: 'Unclear how "and"/"or" groups multiple items',
    commonInMusic: false,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-default',
  },
  negation: {
    label: 'Negation',
    description: 'Unclear what exactly is negated',
    commonInMusic: false,
    typicalImpact: 'major',
    defaultStrategy: 'ask-user',
  },
  modality: {
    label: 'Modality',
    description: 'Unclear if something is required, preferred, or possible',
    commonInMusic: true,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-default',
  },
  temporality: {
    label: 'Timing',
    description: 'Unclear when in the song something should happen',
    commonInMusic: true,
    typicalImpact: 'major',
    defaultStrategy: 'ask-user',
  },
  causality: {
    label: 'Causality',
    description: 'Unclear if two things are causally related or coincidental',
    commonInMusic: false,
    typicalImpact: 'minor',
    defaultStrategy: 'use-default',
  },
  comparison: {
    label: 'Comparison',
    description: 'Unclear what the reference point for a comparison is',
    commonInMusic: true,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-context',
  },
  degree: {
    label: 'Degree',
    description: 'Unclear how much of a quality is intended (e.g. "a bit louder")',
    commonInMusic: true,
    typicalImpact: 'minor',
    defaultStrategy: 'use-default',
  },
  focus: {
    label: 'Focus',
    description: 'Unclear which element is the main focus of the instruction',
    commonInMusic: false,
    typicalImpact: 'minor',
    defaultStrategy: 'use-context',
  },
  topic: {
    label: 'Topic',
    description: 'Unclear what the instruction is about overall',
    commonInMusic: false,
    typicalImpact: 'major',
    defaultStrategy: 'ask-user',
  },
  presupposition: {
    label: 'Presupposition',
    description: 'An implicit assumption may or may not be correct',
    commonInMusic: false,
    typicalImpact: 'minor',
    defaultStrategy: 'use-default',
  },
  implicature: {
    label: 'Implicature',
    description: 'Something is implied but not stated directly',
    commonInMusic: true,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-context',
  },
  'speech-act': {
    label: 'Speech Act',
    description: 'Unclear if the user is commanding, asking, or suggesting',
    commonInMusic: false,
    typicalImpact: 'moderate',
    defaultStrategy: 'use-default',
  },
  polysemy: {
    label: 'Polysemy',
    description: 'A word has related but distinct meanings in music production',
    commonInMusic: true,
    typicalImpact: 'major',
    defaultStrategy: 'ask-user',
  },
  vagueness: {
    label: 'Vagueness',
    description: 'The instruction is under-specified (e.g. "make it better")',
    commonInMusic: true,
    typicalImpact: 'moderate',
    defaultStrategy: 'ask-user',
  },
} as const;

// ---------------------------------------------------------------------------
// 197 — Ambiguity Display Templates (15+)
// ---------------------------------------------------------------------------

export const AMBIGUITY_DISPLAY_TEMPLATES: readonly AmbiguityDisplayTemplate[] = [
  {
    category: 'lexical',
    questionTemplate: 'The word "{phrase}" can mean different things. Which do you mean?',
    whyItMattersTemplate: 'Choosing the wrong meaning would change how the {parameter} is adjusted.',
    optionLabelPattern: 'Meaning {n}: {label}',
    icon: 'book-open',
    headerColor: '#4A90D9',
    categoryDescription: 'This word has multiple dictionary senses relevant to music.',
  },
  {
    category: 'scope',
    questionTemplate: 'Should "{phrase}" apply to the whole track or just part of it?',
    whyItMattersTemplate: 'Scope affects whether the change is global or localised.',
    optionLabelPattern: 'Apply to: {label}',
    icon: 'layers',
    headerColor: '#9B59B6',
    categoryDescription: 'It is unclear which portion of the music this applies to.',
  },
  {
    category: 'attachment',
    questionTemplate: 'Does "{phrase}" describe the {optionA} or the {optionB}?',
    whyItMattersTemplate: 'The modifier changes different aspects depending on what it attaches to.',
    optionLabelPattern: 'Describes: {label}',
    icon: 'paperclip',
    headerColor: '#E67E22',
    categoryDescription: 'A description could modify different parts of the instruction.',
  },
  {
    category: 'reference',
    questionTemplate: 'When you say "{phrase}", what are you referring to?',
    whyItMattersTemplate: 'The edit will target different elements depending on the reference.',
    optionLabelPattern: 'Refers to: {label}',
    icon: 'link',
    headerColor: '#3498DB',
    categoryDescription: 'A pronoun or reference is ambiguous.',
  },
  {
    category: 'quantifier',
    questionTemplate: 'Should "{phrase}" affect all of them or just some?',
    whyItMattersTemplate: 'This determines how many elements are changed.',
    optionLabelPattern: 'Quantity: {label}',
    icon: 'hash',
    headerColor: '#2ECC71',
    categoryDescription: 'It is unclear how many elements are being targeted.',
  },
  {
    category: 'ellipsis',
    questionTemplate: 'Your instruction "{phrase}" is short. What exactly do you want to do?',
    whyItMattersTemplate: 'We need to fill in the missing detail to execute the edit.',
    optionLabelPattern: 'Meaning: {label}',
    icon: 'more-horizontal',
    headerColor: '#95A5A6',
    categoryDescription: 'Some words are omitted and need to be inferred.',
  },
  {
    category: 'metaphor',
    questionTemplate: '"{phrase}" — do you mean this literally or figuratively?',
    whyItMattersTemplate: 'Figurative language maps to different audio parameters than literal.',
    optionLabelPattern: '{label}',
    icon: 'feather',
    headerColor: '#E74C3C',
    categoryDescription: 'A word might be used as a metaphor for an audio quality.',
  },
  {
    category: 'metonymy',
    questionTemplate: 'By "{phrase}", do you mean the instrument, the frequency range, or something else?',
    whyItMattersTemplate: 'Different interpretations target different parts of the mix.',
    optionLabelPattern: '{label}',
    icon: 'music',
    headerColor: '#8E44AD',
    categoryDescription: 'A name is being used to refer to a related concept.',
  },
  {
    category: 'coordination',
    questionTemplate: 'How should "{phrase}" be grouped?',
    whyItMattersTemplate: 'Grouping affects which elements share the same modification.',
    optionLabelPattern: 'Group as: {label}',
    icon: 'git-merge',
    headerColor: '#16A085',
    categoryDescription: 'It is unclear how "and" or "or" groups the items.',
  },
  {
    category: 'negation',
    questionTemplate: 'In "{phrase}", what exactly should NOT happen?',
    whyItMattersTemplate: 'Negation can apply to different parts of the instruction.',
    optionLabelPattern: 'Negate: {label}',
    icon: 'x-circle',
    headerColor: '#C0392B',
    categoryDescription: 'The scope of the negation is unclear.',
  },
  {
    category: 'modality',
    questionTemplate: 'Is "{phrase}" a hard rule or a soft preference?',
    whyItMattersTemplate: 'Rules are enforced strictly; preferences are best-effort.',
    optionLabelPattern: '{label}',
    icon: 'shield',
    headerColor: '#F39C12',
    categoryDescription: 'It is unclear whether this is required or optional.',
  },
  {
    category: 'temporality',
    questionTemplate: 'When should "{phrase}" happen in the song?',
    whyItMattersTemplate: 'Timing determines which section(s) of the arrangement are affected.',
    optionLabelPattern: 'At: {label}',
    icon: 'clock',
    headerColor: '#1ABC9C',
    categoryDescription: 'The timing of this instruction is ambiguous.',
  },
  {
    category: 'comparison',
    questionTemplate: '"{phrase}" — compared to what?',
    whyItMattersTemplate: 'The reference point determines the direction and magnitude of change.',
    optionLabelPattern: 'Compared to: {label}',
    icon: 'bar-chart-2',
    headerColor: '#D35400',
    categoryDescription: 'The baseline for this comparison is unclear.',
  },
  {
    category: 'degree',
    questionTemplate: 'How much should "{phrase}" change?',
    whyItMattersTemplate: 'The degree of change ranges from subtle to drastic.',
    optionLabelPattern: '{label}',
    icon: 'sliders',
    headerColor: '#27AE60',
    categoryDescription: 'The intended magnitude is vague.',
  },
  {
    category: 'polysemy',
    questionTemplate: '"{phrase}" has multiple related meanings in music. Which do you mean?',
    whyItMattersTemplate: 'Each meaning targets a different audio parameter.',
    optionLabelPattern: '{label}',
    icon: 'list',
    headerColor: '#2980B9',
    categoryDescription: 'A music term has several related but distinct interpretations.',
  },
  {
    category: 'vagueness',
    questionTemplate: 'Could you be more specific about "{phrase}"?',
    whyItMattersTemplate: 'A more specific instruction gives a more predictable result.',
    optionLabelPattern: '{label}',
    icon: 'help-circle',
    headerColor: '#7F8C8D',
    categoryDescription: 'The instruction is under-specified.',
  },
  {
    category: 'speech-act',
    questionTemplate: 'Are you asking to "{phrase}" or just wondering if it\'s possible?',
    whyItMattersTemplate: 'We want to know whether to execute the edit or just explain it.',
    optionLabelPattern: '{label}',
    icon: 'message-circle',
    headerColor: '#34495E',
    categoryDescription: 'It is unclear if this is a command, question, or suggestion.',
  },
] as const;

// ---------------------------------------------------------------------------
// 197 — Impact severity ordering
// ---------------------------------------------------------------------------

const IMPACT_ORDER: Readonly<Record<AmbiguityImpact, number>> = {
  cosmetic: 0,
  minor: 1,
  moderate: 2,
  major: 3,
  critical: 4,
} as const;

// ---------------------------------------------------------------------------
// 197 — Functions
// ---------------------------------------------------------------------------

/**
 * Detect ambiguities in a sequence of tokens + a simple CPL tree.
 * This is a heuristic detector that looks for known ambiguity patterns.
 */
export function detectAmbiguities(
  utterance: string,
  tokens: readonly string[],
  root: CPLTreeNode,
): readonly AmbiguityPresentation[] {
  const ambiguities: AmbiguityPresentation[] = [];
  let nextId = 1;

  // Pattern 1: lexical — words with known polysemy in music context
  const POLYSEMOUS_MUSIC_WORDS: Readonly<Record<string, readonly string[]>> = {
    dark: ['timbre quality (less bright)', 'mood/emotion (somber)'],
    bright: ['timbre quality (more high-frequency)', 'mood/emotion (cheerful)'],
    heavy: ['low-frequency emphasis', 'aggressive genre style'],
    light: ['reduced intensity', 'genre feel (airy, delicate)'],
    warm: ['analog-style saturation', 'emotionally comforting'],
    cold: ['clinical/digital sound', 'emotionally distant'],
    dry: ['no reverb/effects', 'staccato articulation'],
    wet: ['heavy reverb/effects', 'legato articulation'],
    sharp: ['high-frequency edge', 'slightly above pitch'],
    flat: ['EQ: reduced presence', 'slightly below pitch'],
    punch: ['transient impact', 'rhythmic emphasis'],
    space: ['reverb/delay', 'arrangement density'],
    clean: ['no distortion', 'uncluttered mix'],
    dirty: ['distortion/saturation', 'lo-fi aesthetic'],
    tight: ['precise timing', 'narrow stereo image'],
    wide: ['stereo spread', 'frequency range breadth'],
    full: ['rich harmonic content', 'dense arrangement'],
    thin: ['lacking low frequencies', 'sparse arrangement'],
    fat: ['boosted low-mids', 'analog saturation character'],
    crisp: ['clear high-frequency detail', 'precise transients'],
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) continue;
    const lower = token.toLowerCase();
    const senses = POLYSEMOUS_MUSIC_WORDS[lower];
    if (senses !== undefined && senses.length >= 2) {
      const charStart = utterance.toLowerCase().indexOf(lower);
      const charEnd = charStart >= 0 ? charStart + lower.length : 0;
      const sense0 = senses[0] ?? 'interpretation A';
      const sense1 = senses[1] ?? 'interpretation B';

      const candidates: CandidateMeaning[] = senses.map((sense, idx) => ({
        id: `cand-${nextId}-${idx}`,
        label: sense,
        explanation: `Interpret "${lower}" as: ${sense}`,
        consequence: {
          affectedNodeIds: [root.id],
          description: `The word "${lower}" would be interpreted as ${sense}`,
          musicalEffect: `Audio parameter changes based on ${sense}`,
          impact: 'major' as AmbiguityImpact,
          audioExample: `Example: applying "${lower}" as ${sense}`,
        },
        priorScore: idx === 0 ? 0.6 : 0.4,
        contextScore: 0.5,
        isDefault: idx === 0,
        resultNodeType: 'modifier' as CPLNodeType,
      }));

      ambiguities.push({
        id: `amb-${nextId++}`,
        category: 'lexical',
        sourcePhrase: token,
        charSpan: [charStart >= 0 ? charStart : 0, charEnd],
        candidates,
        strategy: 'ask-user',
        disambiguationQuestion: `The word "${lower}" can mean different things. Did you mean ${sense0} or ${sense1}?`,
        whyItMatters: `Choosing the wrong meaning would change which audio parameter is adjusted.`,
        impact: 'major',
        resolved: false,
        selectedIndex: -1,
      });
    }
  }

  // Pattern 2: scope — "make it X" when tree has multiple scope-compatible children
  const scopeChildren = root.children.filter(c => c.nodeType === 'scope' || c.nodeType === 'selector');
  if (scopeChildren.length > 1) {
    ambiguities.push({
      id: `amb-${nextId++}`,
      category: 'scope',
      sourcePhrase: utterance,
      charSpan: [0, utterance.length],
      candidates: scopeChildren.map((sc, idx) => ({
        id: `cand-scope-${idx}`,
        label: `Apply to ${sc.label}`,
        explanation: `The edit targets: ${sc.label}`,
        consequence: {
          affectedNodeIds: [sc.id],
          description: `Edit is scoped to ${sc.label}`,
          musicalEffect: `Only ${sc.label} is modified`,
          impact: 'major' as AmbiguityImpact,
          audioExample: `Change applied to ${sc.label} only`,
        },
        priorScore: idx === 0 ? 0.6 : 0.4 / Math.max(1, scopeChildren.length - 1),
        contextScore: 0.5,
        isDefault: idx === 0,
        resultNodeType: 'scope' as CPLNodeType,
      })),
      strategy: 'ask-user',
      disambiguationQuestion: `Should this change apply to ${scopeChildren.map(s => s.label).join(' or ')}?`,
      whyItMatters: 'Scope determines which part of the music is affected.',
      impact: 'major',
      resolved: false,
      selectedIndex: -1,
    });
  }

  return ambiguities;
}

/** Rank candidates within an ambiguity by combined score. */
export function rankCandidates(
  ambiguity: AmbiguityPresentation,
): readonly CandidateMeaning[] {
  return [...ambiguity.candidates].sort((a, b) => {
    const scoreA = a.priorScore * 0.4 + a.contextScore * 0.6;
    const scoreB = b.priorScore * 0.4 + b.contextScore * 0.6;
    return scoreB - scoreA;
  });
}

/** Format an ambiguity presentation as a user-facing text block. */
export function formatAmbiguityForUser(
  ambiguity: AmbiguityPresentation,
  config: AmbiguityUIConfig,
): string {
  const lines: string[] = [];
  const catInfo = AMBIGUITY_CATEGORY_INFO[ambiguity.category];

  lines.push(`--- ${catInfo.label} Ambiguity ---`);
  lines.push(ambiguity.disambiguationQuestion);
  lines.push('');

  const ranked = rankCandidates(ambiguity);
  const shown = ranked.slice(0, config.maxCandidatesShown);

  for (let i = 0; i < shown.length; i++) {
    const cand = shown[i];
    if (cand === undefined) continue;
    const defaultMarker = cand.isDefault ? ' (recommended)' : '';
    lines.push(`  ${i + 1}. ${cand.label}${defaultMarker}`);
    if (config.showMusicalEffects) {
      lines.push(`     Musical effect: ${cand.consequence.musicalEffect}`);
    }
    if (config.showTechnicalDetails) {
      lines.push(`     Impact: ${cand.consequence.impact}`);
    }
  }

  if (config.showWhyItMatters) {
    lines.push('');
    lines.push(`Why it matters: ${ambiguity.whyItMatters}`);
  }

  return lines.join('\n');
}

/** Apply a resolution to an ambiguity by selecting a candidate index. */
export function applyResolution(
  ambiguity: AmbiguityPresentation,
  selectedIndex: number,
): AmbiguityPresentation {
  const safeIndex = Math.max(0, Math.min(selectedIndex, ambiguity.candidates.length - 1));
  return {
    ...ambiguity,
    resolved: true,
    selectedIndex: safeIndex,
  };
}

/** Get the default candidate for an ambiguity. */
export function getDefaultCandidate(
  ambiguity: AmbiguityPresentation,
): CandidateMeaning | null {
  for (const c of ambiguity.candidates) {
    if (c.isDefault) return c;
  }
  const first = ambiguity.candidates[0];
  return first ?? null;
}

/** Compute the difference in consequences between two candidates. */
export function computeConsequenceDiff(
  a: CandidateMeaning,
  b: CandidateMeaning,
): { readonly description: string; readonly impactDelta: number } {
  const impA = IMPACT_ORDER[a.consequence.impact] ?? 0;
  const impB = IMPACT_ORDER[b.consequence.impact] ?? 0;
  return {
    description: `Option "${a.label}" vs "${b.label}": ${a.consequence.musicalEffect} versus ${b.consequence.musicalEffect}`,
    impactDelta: Math.abs(impA - impB),
  };
}

/** Generate a natural-language disambiguation question for a given ambiguity. */
export function generateDisambiguationQuestion(
  ambiguity: AmbiguityPresentation,
): string {
  const template = AMBIGUITY_DISPLAY_TEMPLATES.find(t => t.category === ambiguity.category);
  if (template !== undefined) {
    return template.questionTemplate.replace('{phrase}', ambiguity.sourcePhrase);
  }
  return `What do you mean by "${ambiguity.sourcePhrase}"?`;
}

/** Categorize an ambiguity from raw signals. */
export function categorizeAmbiguity(
  sourcePhrase: string,
  candidateCount: number,
  hasMultipleScopes: boolean,
  hasNegation: boolean,
  hasMetaphor: boolean,
): AmbiguityCategory {
  if (hasNegation) return 'negation';
  if (hasMetaphor) return 'metaphor';
  if (hasMultipleScopes) return 'scope';
  if (candidateCount > 3) return 'polysemy';
  if (sourcePhrase.split(/\s+/).length <= 1) return 'lexical';
  return 'vagueness';
}

/** Estimate the overall impact of an ambiguity. */
export function estimateAmbiguityImpact(
  ambiguity: AmbiguityPresentation,
): AmbiguityImpact {
  let maxImpact: AmbiguityImpact = 'cosmetic';
  let maxOrder = 0;
  for (const c of ambiguity.candidates) {
    const order = IMPACT_ORDER[c.consequence.impact] ?? 0;
    if (order > maxOrder) {
      maxOrder = order;
      maxImpact = c.consequence.impact;
    }
  }
  return maxImpact;
}

/** Batch-resolve ambiguities using their default strategies. */
export function batchResolveAmbiguities(
  ambiguities: readonly AmbiguityPresentation[],
): readonly AmbiguityPresentation[] {
  return ambiguities.map(amb => {
    if (amb.resolved) return amb;
    if (amb.strategy === 'ask-user') return amb; // cannot auto-resolve
    const defaultCand = getDefaultCandidate(amb);
    if (defaultCand === null) return amb;
    const idx = amb.candidates.findIndex(c => c.id === defaultCand.id);
    if (idx < 0) return amb;
    return applyResolution(amb, idx);
  });
}

/** Create a default AmbiguityUIConfig. */
export function createDefaultAmbiguityUIConfig(): AmbiguityUIConfig {
  return {
    autoResolveLowImpact: true,
    maxCandidatesShown: 5,
    showMusicalEffects: true,
    showTechnicalDetails: false,
    defaultStrategy: 'use-default',
    groupByCategory: true,
    sortBy: 'impact',
    showWhyItMatters: true,
  };
}


// =============================================================================
// STEP 198 [HCI] — Semantic Provenance UI Pattern
// =============================================================================
//
// Hover on CPL node → show source words + rule IDs in developer mode.
// =============================================================================

// ---------------------------------------------------------------------------
// 198 — Types
// ---------------------------------------------------------------------------

/** Identifier for a semantic rule that contributed to a CPL node. */
export type SemanticRuleId =
  | 'lexicon-lookup'
  | 'grammar-rule'
  | 'composition'
  | 'type-coercion'
  | 'default-fill'
  | 'pragmatic-inference'
  | 'frame-match'
  | 'metaphor-resolution'
  | 'metonymy-resolution'
  | 'ellipsis-resolution'
  | 'scope-resolution'
  | 'presupposition-accommodation'
  | 'degree-mapping'
  | 'quantifier-scoping'
  | 'reference-resolution'
  | 'coordination-expansion';

/** How confident we are in a provenance link. */
export type ProvenanceConfidence = 'high' | 'medium' | 'low' | 'uncertain';

/** Display mode for provenance information. */
export type ProvenanceDisplayMode =
  | 'tooltip'
  | 'sidebar'
  | 'inline'
  | 'overlay'
  | 'breadcrumb'
  | 'timeline'
  | 'graph'
  | 'table'
  | 'compact'
  | 'verbose'
  | 'diff'
  | 'trace';

/** One step in the provenance chain from source word(s) to CPL node. */
export interface ProvenanceStep {
  /** Index of this step in the chain (0 = source). */
  readonly stepIndex: number;
  /** Which rule was applied at this step. */
  readonly ruleId: SemanticRuleId;
  /** Human-readable label for the rule. */
  readonly ruleLabel: string;
  /** Input to this step (text or intermediate representation). */
  readonly input: string;
  /** Output of this step. */
  readonly output: string;
  /** Confidence in this step. */
  readonly confidence: ProvenanceConfidence;
  /** Confidence score 0–1. */
  readonly confidenceScore: number;
}

/** A complete provenance chain from source words to a CPL node. */
export interface ProvenancePath {
  /** The CPL node ID this path explains. */
  readonly targetNodeId: string;
  /** The CPL node type. */
  readonly targetNodeType: CPLNodeType;
  /** The source words (character offsets) that originated this node. */
  readonly sourceWords: readonly { readonly word: string; readonly charStart: number; readonly charEnd: number }[];
  /** The ordered chain of semantic rule applications. */
  readonly steps: readonly ProvenanceStep[];
  /** Overall confidence of the entire chain. */
  readonly overallConfidence: ProvenanceConfidence;
  /** Overall confidence score 0–1 (product of step scores). */
  readonly overallConfidenceScore: number;
}

/** A tooltip to display when hovering over a CPL node. */
export interface ProvenanceTooltip {
  /** The node being hovered. */
  readonly nodeId: string;
  /** Node label. */
  readonly nodeLabel: string;
  /** Source words that contributed. */
  readonly sourceWords: readonly string[];
  /** Brief summary of how this node was derived. */
  readonly derivationSummary: string;
  /** Rule IDs in the derivation chain. */
  readonly ruleIds: readonly SemanticRuleId[];
  /** Confidence badge text. */
  readonly confidenceBadge: string;
  /** Whether there are alternative derivations. */
  readonly hasAlternatives: boolean;
  /** Number of derivation steps. */
  readonly stepCount: number;
}

/** Highlight style for a provenance path in the UI. */
export interface ProvenanceHighlight {
  /** Source word highlight color. */
  readonly sourceColor: HexColor;
  /** Intermediate step color. */
  readonly stepColor: HexColor;
  /** Target node highlight color. */
  readonly targetColor: HexColor;
  /** Line style: solid, dashed, dotted. */
  readonly lineStyle: 'solid' | 'dashed' | 'dotted';
  /** Line opacity 0–1. */
  readonly lineOpacity: number;
  /** Whether to animate the highlight. */
  readonly animated: boolean;
}

/** Full overlay configuration for provenance display. */
export interface ProvenanceOverlay {
  /** Active display mode. */
  readonly mode: ProvenanceDisplayMode;
  /** Currently highlighted provenance paths. */
  readonly activePaths: readonly ProvenancePath[];
  /** Whether the overlay is visible. */
  readonly visible: boolean;
  /** Highlight styles by confidence level. */
  readonly highlightByConfidence: Readonly<Record<ProvenanceConfidence, ProvenanceHighlight>>;
  /** Whether to show rule labels or just IDs. */
  readonly showRuleLabels: boolean;
  /** Whether to show confidence scores numerically. */
  readonly showConfidenceScores: boolean;
  /** Maximum chain length to display before truncating. */
  readonly maxChainLength: number;
}

/** Configuration for the provenance UI. */
export interface ProvenanceUIConfig {
  /** Default display mode. */
  readonly defaultMode: ProvenanceDisplayMode;
  /** Whether the provenance panel is enabled. */
  readonly enabled: boolean;
  /** Whether to show provenance on hover (vs click). */
  readonly triggerOnHover: boolean;
  /** Hover delay in milliseconds. */
  readonly hoverDelayMs: number;
  /** Whether to show alternative derivations. */
  readonly showAlternatives: boolean;
  /** Whether to auto-highlight the bottleneck (lowest-confidence step). */
  readonly highlightBottleneck: boolean;
  /** Maximum number of paths to show simultaneously. */
  readonly maxPaths: number;
  /** Tooltip position preference. */
  readonly tooltipPosition: 'above' | 'below' | 'left' | 'right' | 'auto';
}

/** A query for developer-mode provenance exploration. */
export interface ProvenanceQuery {
  /** Query type identifier. */
  readonly type: ProvenanceQueryType;
  /** Query parameter (node ID, word, rule ID, etc.). */
  readonly parameter: string;
  /** Description of what this query finds. */
  readonly description: string;
}

/** Types of provenance queries available in developer mode. */
export type ProvenanceQueryType =
  | 'find-origin'
  | 'find-nodes-from-word'
  | 'trace-composition'
  | 'find-bottleneck'
  | 'find-by-rule'
  | 'find-uncertain'
  | 'find-default-fills'
  | 'find-metaphors'
  | 'find-coercions'
  | 'find-inferences'
  | 'compare-paths'
  | 'trace-full';

// ---------------------------------------------------------------------------
// 198 — Rule Label Database
// ---------------------------------------------------------------------------

/** Human-readable labels for all semantic rule IDs. */
export const SEMANTIC_RULE_LABELS: Readonly<Record<SemanticRuleId, {
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly category: string;
  readonly confidence: ProvenanceConfidence;
}>> = {
  'lexicon-lookup': {
    label: 'Lexicon Lookup',
    shortLabel: 'LEX',
    description: 'Word found in the lexicon with a known meaning',
    category: 'lexical',
    confidence: 'high',
  },
  'grammar-rule': {
    label: 'Grammar Rule',
    shortLabel: 'GRM',
    description: 'A syntactic grammar rule was applied to combine constituents',
    category: 'syntactic',
    confidence: 'high',
  },
  composition: {
    label: 'Semantic Composition',
    shortLabel: 'CMP',
    description: 'Two semantic representations were composed together',
    category: 'semantic',
    confidence: 'high',
  },
  'type-coercion': {
    label: 'Type Coercion',
    shortLabel: 'COE',
    description: 'A type mismatch was resolved by coercing one type to another',
    category: 'semantic',
    confidence: 'medium',
  },
  'default-fill': {
    label: 'Default Fill',
    shortLabel: 'DFL',
    description: 'A missing value was filled with a sensible default',
    category: 'pragmatic',
    confidence: 'low',
  },
  'pragmatic-inference': {
    label: 'Pragmatic Inference',
    shortLabel: 'PRG',
    description: 'An implicit meaning was inferred from context',
    category: 'pragmatic',
    confidence: 'medium',
  },
  'frame-match': {
    label: 'Frame Match',
    shortLabel: 'FRM',
    description: 'A semantic frame was matched to the input',
    category: 'semantic',
    confidence: 'high',
  },
  'metaphor-resolution': {
    label: 'Metaphor Resolution',
    shortLabel: 'MET',
    description: 'A figurative expression was resolved to a literal meaning',
    category: 'pragmatic',
    confidence: 'medium',
  },
  'metonymy-resolution': {
    label: 'Metonymy Resolution',
    shortLabel: 'MTN',
    description: 'A metonymic reference was resolved (e.g. "the bass" → bass instrument)',
    category: 'pragmatic',
    confidence: 'medium',
  },
  'ellipsis-resolution': {
    label: 'Ellipsis Resolution',
    shortLabel: 'ELP',
    description: 'Omitted words were recovered from context',
    category: 'pragmatic',
    confidence: 'low',
  },
  'scope-resolution': {
    label: 'Scope Resolution',
    shortLabel: 'SCP',
    description: 'The scope of a modifier was resolved',
    category: 'semantic',
    confidence: 'medium',
  },
  'presupposition-accommodation': {
    label: 'Presupposition Accommodation',
    shortLabel: 'PSP',
    description: 'An implicit assumption was accepted and integrated',
    category: 'pragmatic',
    confidence: 'low',
  },
  'degree-mapping': {
    label: 'Degree Mapping',
    shortLabel: 'DEG',
    description: 'A vague degree expression was mapped to a numeric range',
    category: 'semantic',
    confidence: 'medium',
  },
  'quantifier-scoping': {
    label: 'Quantifier Scoping',
    shortLabel: 'QNT',
    description: 'Quantifier scope was determined',
    category: 'semantic',
    confidence: 'medium',
  },
  'reference-resolution': {
    label: 'Reference Resolution',
    shortLabel: 'REF',
    description: 'A pronoun or anaphoric reference was resolved',
    category: 'pragmatic',
    confidence: 'medium',
  },
  'coordination-expansion': {
    label: 'Coordination Expansion',
    shortLabel: 'CRD',
    description: 'A coordinated phrase (X and Y) was expanded into parallel structures',
    category: 'syntactic',
    confidence: 'high',
  },
} as const;

// ---------------------------------------------------------------------------
// 198 — Highlight Styles by Confidence
// ---------------------------------------------------------------------------

export const PROVENANCE_HIGHLIGHT_STYLES: Readonly<Record<ProvenanceConfidence, ProvenanceHighlight>> = {
  high: {
    sourceColor: '#27AE60',
    stepColor: '#2ECC71',
    targetColor: '#1ABC9C',
    lineStyle: 'solid',
    lineOpacity: 1.0,
    animated: false,
  },
  medium: {
    sourceColor: '#F39C12',
    stepColor: '#F1C40F',
    targetColor: '#E67E22',
    lineStyle: 'solid',
    lineOpacity: 0.8,
    animated: false,
  },
  low: {
    sourceColor: '#E74C3C',
    stepColor: '#E67E73',
    targetColor: '#C0392B',
    lineStyle: 'dashed',
    lineOpacity: 0.6,
    animated: false,
  },
  uncertain: {
    sourceColor: '#95A5A6',
    stepColor: '#BDC3C7',
    targetColor: '#7F8C8D',
    lineStyle: 'dotted',
    lineOpacity: 0.4,
    animated: true,
  },
} as const;

// ---------------------------------------------------------------------------
// 198 — Provenance Query Templates (10+)
// ---------------------------------------------------------------------------

export const PROVENANCE_QUERY_TEMPLATES: readonly ProvenanceQuery[] = [
  { type: 'find-origin', parameter: '', description: 'Find the source words that originated a given CPL node' },
  { type: 'find-nodes-from-word', parameter: '', description: 'Find all CPL nodes that were derived from a specific source word' },
  { type: 'trace-composition', parameter: '', description: 'Trace the full composition chain from words to the final CPL node' },
  { type: 'find-bottleneck', parameter: '', description: 'Find the lowest-confidence step in a provenance chain' },
  { type: 'find-by-rule', parameter: '', description: 'Find all nodes that used a specific semantic rule in their derivation' },
  { type: 'find-uncertain', parameter: '', description: 'Find all nodes whose overall provenance confidence is below a threshold' },
  { type: 'find-default-fills', parameter: '', description: 'Find all nodes that include a default-fill step (values not in the utterance)' },
  { type: 'find-metaphors', parameter: '', description: 'Find all nodes derived through metaphor resolution' },
  { type: 'find-coercions', parameter: '', description: 'Find all nodes where a type coercion was applied' },
  { type: 'find-inferences', parameter: '', description: 'Find all nodes derived through pragmatic inference' },
  { type: 'compare-paths', parameter: '', description: 'Compare two alternative provenance paths for the same CPL node' },
  { type: 'trace-full', parameter: '', description: 'Show the complete derivation trace including all intermediate representations' },
] as const;

// ---------------------------------------------------------------------------
// 198 — Provenance Display Mode Info
// ---------------------------------------------------------------------------

export const PROVENANCE_DISPLAY_MODE_INFO: Readonly<Record<ProvenanceDisplayMode, {
  readonly label: string;
  readonly description: string;
  readonly bestFor: string;
  readonly interactive: boolean;
}>> = {
  tooltip: {
    label: 'Tooltip',
    description: 'Shows provenance in a hover popup',
    bestFor: 'Quick inspection during normal use',
    interactive: false,
  },
  sidebar: {
    label: 'Sidebar',
    description: 'Persistent provenance panel alongside the tree',
    bestFor: 'Detailed analysis during debugging',
    interactive: true,
  },
  inline: {
    label: 'Inline',
    description: 'Provenance annotations inline with tree nodes',
    bestFor: 'Compact overview with full context',
    interactive: false,
  },
  overlay: {
    label: 'Overlay',
    description: 'Semi-transparent overlay showing all provenance paths',
    bestFor: 'Visualising complex derivation networks',
    interactive: true,
  },
  breadcrumb: {
    label: 'Breadcrumb',
    description: 'Path from source word(s) to node as breadcrumb trail',
    bestFor: 'Following a single derivation chain',
    interactive: false,
  },
  timeline: {
    label: 'Timeline',
    description: 'Steps arranged left-to-right as a timeline',
    bestFor: 'Understanding the order of rule applications',
    interactive: true,
  },
  graph: {
    label: 'Graph',
    description: 'Full directed graph of all provenance relationships',
    bestFor: 'Seeing how multiple words contribute to multiple nodes',
    interactive: true,
  },
  table: {
    label: 'Table',
    description: 'Tabular view: Node | Source | Rules | Confidence',
    bestFor: 'Batch inspection and export',
    interactive: false,
  },
  compact: {
    label: 'Compact',
    description: 'One-line summary per node',
    bestFor: 'Minimal screen space',
    interactive: false,
  },
  verbose: {
    label: 'Verbose',
    description: 'Full detail including intermediate representations',
    bestFor: 'Deep debugging of semantic rules',
    interactive: false,
  },
  diff: {
    label: 'Diff',
    description: 'Compare provenance of two versions of a CPL tree',
    bestFor: 'Understanding how re-parsing changed derivations',
    interactive: true,
  },
  trace: {
    label: 'Trace',
    description: 'Step-by-step log of every rule application',
    bestFor: 'Debugging rule firing order',
    interactive: false,
  },
} as const;

// ---------------------------------------------------------------------------
// 198 — Functions
// ---------------------------------------------------------------------------

/** Compute a provenance overlay for a CPL tree. */
export function computeProvenanceOverlay(
  paths: readonly ProvenancePath[],
  mode: ProvenanceDisplayMode,
): ProvenanceOverlay {
  return {
    mode,
    activePaths: paths,
    visible: paths.length > 0,
    highlightByConfidence: PROVENANCE_HIGHLIGHT_STYLES,
    showRuleLabels: mode !== 'compact',
    showConfidenceScores: mode === 'verbose' || mode === 'table' || mode === 'trace',
    maxChainLength: mode === 'compact' ? 3 : mode === 'tooltip' ? 5 : 20,
  };
}

/** Format a tooltip for a CPL node's provenance. */
export function formatTooltip(path: ProvenancePath): ProvenanceTooltip {
  const words = path.sourceWords.map(sw => sw.word);
  const ruleIds = path.steps.map(s => s.ruleId);
  const confLabel = path.overallConfidence === 'high'
    ? 'High confidence'
    : path.overallConfidence === 'medium'
      ? 'Medium confidence'
      : path.overallConfidence === 'low'
        ? 'Low confidence'
        : 'Uncertain';

  const stepsText = path.steps.map(s => s.ruleLabel).join(' → ');
  const summary = `Derived from "${words.join(' ')}" via ${stepsText}`;

  return {
    nodeId: path.targetNodeId,
    nodeLabel: `${path.targetNodeType}:${path.targetNodeId}`,
    sourceWords: words,
    derivationSummary: summary,
    ruleIds,
    confidenceBadge: `${confLabel} (${(path.overallConfidenceScore * 100).toFixed(0)}%)`,
    hasAlternatives: false,
    stepCount: path.steps.length,
  };
}

/** Get the highlight style for a given provenance path. */
export function highlightProvenancePath(
  path: ProvenancePath,
): ProvenanceHighlight {
  return PROVENANCE_HIGHLIGHT_STYLES[path.overallConfidence];
}

/** Execute a provenance query against a set of paths. */
export function queryProvenance(
  paths: readonly ProvenancePath[],
  query: ProvenanceQuery,
): readonly ProvenancePath[] {
  const param = query.parameter.toLowerCase();

  switch (query.type) {
    case 'find-origin':
      return paths.filter(p => p.targetNodeId === query.parameter);

    case 'find-nodes-from-word':
      return paths.filter(p =>
        p.sourceWords.some(sw => sw.word.toLowerCase() === param),
      );

    case 'trace-composition':
      return paths.filter(p =>
        p.targetNodeId === query.parameter ||
        p.steps.some(s => s.ruleId === 'composition'),
      );

    case 'find-bottleneck':
      return paths.filter(p =>
        p.overallConfidence === 'low' || p.overallConfidence === 'uncertain',
      );

    case 'find-by-rule':
      return paths.filter(p =>
        p.steps.some(s => s.ruleId === param),
      );

    case 'find-uncertain':
      return paths.filter(p => p.overallConfidenceScore < 0.5);

    case 'find-default-fills':
      return paths.filter(p =>
        p.steps.some(s => s.ruleId === 'default-fill'),
      );

    case 'find-metaphors':
      return paths.filter(p =>
        p.steps.some(s => s.ruleId === 'metaphor-resolution'),
      );

    case 'find-coercions':
      return paths.filter(p =>
        p.steps.some(s => s.ruleId === 'type-coercion'),
      );

    case 'find-inferences':
      return paths.filter(p =>
        p.steps.some(s => s.ruleId === 'pragmatic-inference'),
      );

    case 'compare-paths':
      // Return all paths for the same node
      return paths.filter(p => p.targetNodeId === query.parameter);

    case 'trace-full':
      return paths.filter(p => p.targetNodeId === query.parameter);

    default:
      return [];
  }
}

/** Get the full provenance chain for a specific node. */
export function getProvenanceChain(
  paths: readonly ProvenancePath[],
  nodeId: string,
): ProvenancePath | null {
  for (const p of paths) {
    if (p.targetNodeId === nodeId) return p;
  }
  return null;
}

/** Find the lowest-confidence step across all paths or a specific path. */
export function findConfidenceBottleneck(
  paths: readonly ProvenancePath[],
): { readonly path: ProvenancePath; readonly step: ProvenanceStep } | null {
  let worstScore = 1.0;
  let worstPath: ProvenancePath | null = null;
  let worstStep: ProvenanceStep | null = null;

  for (const p of paths) {
    for (const s of p.steps) {
      if (s.confidenceScore < worstScore) {
        worstScore = s.confidenceScore;
        worstPath = p;
        worstStep = s;
      }
    }
  }

  if (worstPath !== null && worstStep !== null) {
    return { path: worstPath, step: worstStep };
  }
  return null;
}

/** Format a semantic rule label for display. */
export function formatRuleLabel(
  ruleId: SemanticRuleId,
  verbose: boolean,
): string {
  const info = SEMANTIC_RULE_LABELS[ruleId];
  if (verbose) {
    return `${info.label} (${info.shortLabel}): ${info.description}`;
  }
  return info.label;
}

/** Get source words for a specific CPL node from provenance data. */
export function getSourceWords(
  paths: readonly ProvenancePath[],
  nodeId: string,
): readonly string[] {
  const path = getProvenanceChain(paths, nodeId);
  if (path === null) return [];
  return path.sourceWords.map(sw => sw.word);
}

/** Render the provenance graph as a text representation. */
export function renderProvenanceGraph(
  paths: readonly ProvenancePath[],
): string {
  const lines: string[] = [];
  lines.push('=== Provenance Graph ===');
  lines.push('');

  for (const path of paths) {
    const words = path.sourceWords.map(sw => `"${sw.word}"`).join(', ');
    lines.push(`Node: ${path.targetNodeId} (${path.targetNodeType})`);
    lines.push(`  Source: ${words}`);
    lines.push(`  Confidence: ${path.overallConfidence} (${(path.overallConfidenceScore * 100).toFixed(1)}%)`);
    lines.push('  Chain:');
    for (const step of path.steps) {
      const conf = (step.confidenceScore * 100).toFixed(0);
      lines.push(`    [${step.stepIndex}] ${step.ruleLabel} (${conf}%): ${step.input} → ${step.output}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** Diff two provenance overlays to see what changed. */
export function diffProvenance(
  before: readonly ProvenancePath[],
  after: readonly ProvenancePath[],
): { readonly added: readonly ProvenancePath[]; readonly removed: readonly ProvenancePath[]; readonly changed: readonly { readonly nodeId: string; readonly before: ProvenancePath; readonly after: ProvenancePath }[] } {
  const beforeMap = new Map<string, ProvenancePath>();
  for (const p of before) {
    beforeMap.set(p.targetNodeId, p);
  }

  const afterMap = new Map<string, ProvenancePath>();
  for (const p of after) {
    afterMap.set(p.targetNodeId, p);
  }

  const added: ProvenancePath[] = [];
  const removed: ProvenancePath[] = [];
  const changed: { readonly nodeId: string; readonly before: ProvenancePath; readonly after: ProvenancePath }[] = [];

  for (const p of after) {
    const old = beforeMap.get(p.targetNodeId);
    if (old === undefined) {
      added.push(p);
    } else if (old.overallConfidenceScore !== p.overallConfidenceScore || old.steps.length !== p.steps.length) {
      changed.push({ nodeId: p.targetNodeId, before: old, after: p });
    }
  }

  for (const p of before) {
    if (!afterMap.has(p.targetNodeId)) {
      removed.push(p);
    }
  }

  return { added, removed, changed };
}

/** Create a default provenance UI configuration. */
export function createDefaultProvenanceUIConfig(): ProvenanceUIConfig {
  return {
    defaultMode: 'tooltip',
    enabled: true,
    triggerOnHover: true,
    hoverDelayMs: 300,
    showAlternatives: false,
    highlightBottleneck: true,
    maxPaths: 10,
    tooltipPosition: 'auto',
  };
}


// =============================================================================
// STEP 199 [HCI] — User Vocabulary Learning UX
// =============================================================================
//
// When the user clarifies "dark means timbre", offer to save as preference.
// =============================================================================

// ---------------------------------------------------------------------------
// 199 — Types
// ---------------------------------------------------------------------------

/** A vocabulary domain — the musical parameter space a word can map to. */
export type VocabularyDomain =
  | 'timbre'
  | 'dynamics'
  | 'pitch'
  | 'rhythm'
  | 'harmony'
  | 'texture'
  | 'space'
  | 'emotion'
  | 'energy'
  | 'density'
  | 'brightness'
  | 'warmth'
  | 'width'
  | 'depth'
  | 'attack'
  | 'release'
  | 'sustain'
  | 'decay'
  | 'genre'
  | 'era'
  | 'articulation'
  | 'form';

/** How a vocabulary preference was learned. */
export type LearningEventType =
  | 'explicit-correction'
  | 'implicit-selection'
  | 'repeated-pattern'
  | 'contextual-inference'
  | 'contrast-pair';

/** A single vocabulary learning event. */
export interface VocabularyLearningEvent {
  /** Unique event ID. */
  readonly id: string;
  /** Timestamp of the event. */
  readonly timestamp: number;
  /** The word or phrase being learned. */
  readonly word: string;
  /** Normalised lowercase form. */
  readonly normalizedWord: string;
  /** How this was learned. */
  readonly eventType: LearningEventType;
  /** Domain the word was mapped to. */
  readonly domain: VocabularyDomain;
  /** Specific axis or lever within the domain. */
  readonly axis: string;
  /** Direction on the axis (e.g. "increase", "decrease", "set"). */
  readonly direction: string;
  /** Confidence in this learning event 0–1. */
  readonly confidence: number;
  /** The context (utterance) in which this was learned. */
  readonly contextUtterance: string;
  /** Previous domain mapping (if this is a correction). */
  readonly previousDomain: VocabularyDomain | null;
  /** Whether the user explicitly confirmed this mapping. */
  readonly userConfirmed: boolean;
}

/** A stored user preference for a word → domain mapping. */
export interface UserPreference {
  /** The word or phrase. */
  readonly word: string;
  /** Normalised form. */
  readonly normalizedWord: string;
  /** Target domain. */
  readonly domain: VocabularyDomain;
  /** Specific axis within the domain. */
  readonly axis: string;
  /** Preferred direction. */
  readonly direction: string;
  /** Confidence in this preference 0–1. */
  readonly confidence: number;
  /** Number of times this mapping has been used. */
  readonly usageCount: number;
  /** When this preference was first learned. */
  readonly firstLearned: number;
  /** When this preference was last used. */
  readonly lastUsed: number;
  /** History of learning events for this preference. */
  readonly learningHistory: readonly string[];
}

/** A store for user vocabulary preferences. */
export interface PreferenceStore {
  /** User identifier. */
  readonly userId: string;
  /** All stored preferences, keyed by normalised word. */
  readonly preferences: Readonly<Record<string, readonly UserPreference[]>>;
  /** Total number of preferences. */
  readonly totalPreferences: number;
  /** When the store was last modified. */
  readonly lastModified: number;
  /** Store version for migration. */
  readonly version: number;
}

/** A prompt to present to the user about a vocabulary preference. */
export interface LearningPrompt {
  /** Unique prompt ID. */
  readonly id: string;
  /** The word being discussed. */
  readonly word: string;
  /** The proposed domain mapping. */
  readonly proposedDomain: VocabularyDomain;
  /** The proposed axis. */
  readonly proposedAxis: string;
  /** The user-facing question text. */
  readonly question: string;
  /** Options to present. */
  readonly options: readonly LearningPromptOption[];
  /** Whether to show a "don't ask again" checkbox. */
  readonly showDontAskAgain: boolean;
  /** Category of the prompt. */
  readonly promptCategory: LearningPromptCategory;
}

/** An option in a learning prompt. */
export interface LearningPromptOption {
  /** Label text. */
  readonly label: string;
  /** Domain this option maps to. */
  readonly domain: VocabularyDomain;
  /** Axis this option maps to. */
  readonly axis: string;
  /** Whether this is the suggested default. */
  readonly isDefault: boolean;
}

/** Categories of learning prompts. */
export type LearningPromptCategory =
  | 'first-use'
  | 'correction'
  | 'confirmation'
  | 'disambiguation'
  | 'calibration'
  | 'conflict-resolution';

/** Aggregate profile of a user's vocabulary. */
export interface VocabularyProfile {
  /** User identifier. */
  readonly userId: string;
  /** Total number of learned preferences. */
  readonly totalLearned: number;
  /** Count of preferences per domain. */
  readonly perDomainCounts: Readonly<Record<string, number>>;
  /** Distribution of confidence scores. */
  readonly confidenceDistribution: {
    readonly high: number;
    readonly medium: number;
    readonly low: number;
  };
  /** Number of preferences learned in the last 7 days. */
  readonly recentActivity: number;
  /** Domains with the most preferences. */
  readonly topDomains: readonly VocabularyDomain[];
  /** Domains with zero preferences. */
  readonly uncoveredDomains: readonly VocabularyDomain[];
  /** Average confidence across all preferences. */
  readonly averageConfidence: number;
  /** Number of conflicts detected. */
  readonly conflictCount: number;
}

// ---------------------------------------------------------------------------
// 199 — Domain Database
// ---------------------------------------------------------------------------

export const VOCABULARY_DOMAIN_INFO: Readonly<Record<VocabularyDomain, {
  readonly label: string;
  readonly description: string;
  readonly commonAxes: readonly string[];
  readonly exampleWords: readonly string[];
}>> = {
  timbre: {
    label: 'Timbre',
    description: 'The tonal quality or colour of a sound',
    commonAxes: ['brightness', 'warmth', 'harshness', 'richness', 'hollowness'],
    exampleWords: ['dark', 'bright', 'warm', 'cold', 'thin', 'fat', 'crisp'],
  },
  dynamics: {
    label: 'Dynamics',
    description: 'Loudness and volume-related parameters',
    commonAxes: ['volume', 'compression', 'limiting', 'sidechain', 'ducking'],
    exampleWords: ['loud', 'quiet', 'soft', 'punchy', 'squashed', 'dynamic'],
  },
  pitch: {
    label: 'Pitch',
    description: 'Frequency and note-related parameters',
    commonAxes: ['frequency', 'tuning', 'transposition', 'vibrato', 'portamento'],
    exampleWords: ['high', 'low', 'sharp', 'flat', 'detuned', 'pitched'],
  },
  rhythm: {
    label: 'Rhythm',
    description: 'Timing, groove, and rhythmic feel',
    commonAxes: ['tempo', 'swing', 'quantize', 'groove', 'syncopation'],
    exampleWords: ['fast', 'slow', 'syncopated', 'straight', 'swung', 'tight'],
  },
  harmony: {
    label: 'Harmony',
    description: 'Chords, keys, and harmonic relationships',
    commonAxes: ['key', 'mode', 'consonance', 'tension', 'voicing'],
    exampleWords: ['major', 'minor', 'dissonant', 'consonant', 'jazzy', 'tense'],
  },
  texture: {
    label: 'Texture',
    description: 'The density and layering of sounds',
    commonAxes: ['layering', 'density', 'transparency', 'thickness', 'grain'],
    exampleWords: ['thick', 'thin', 'sparse', 'dense', 'layered', 'stripped'],
  },
  space: {
    label: 'Space',
    description: 'Spatial positioning and reverb characteristics',
    commonAxes: ['reverb', 'delay', 'panning', 'width', 'distance'],
    exampleWords: ['spacious', 'close', 'distant', 'wide', 'narrow', 'intimate'],
  },
  emotion: {
    label: 'Emotion',
    description: 'Emotional character of the sound',
    commonAxes: ['mood', 'intensity', 'valence', 'arousal', 'tension'],
    exampleWords: ['happy', 'sad', 'aggressive', 'peaceful', 'melancholic', 'euphoric'],
  },
  energy: {
    label: 'Energy',
    description: 'Overall energy level and intensity',
    commonAxes: ['intensity', 'drive', 'excitement', 'calmness', 'momentum'],
    exampleWords: ['energetic', 'calm', 'driving', 'relaxed', 'intense', 'mellow'],
  },
  density: {
    label: 'Density',
    description: 'How many elements are active simultaneously',
    commonAxes: ['element-count', 'frequency-fill', 'arrangement-fullness'],
    exampleWords: ['busy', 'empty', 'full', 'sparse', 'crowded', 'minimal'],
  },
  brightness: {
    label: 'Brightness',
    description: 'High-frequency content and presence',
    commonAxes: ['high-shelf', 'presence', 'air', 'shimmer'],
    exampleWords: ['bright', 'dull', 'airy', 'sparkly', 'muted', 'shimmery'],
  },
  warmth: {
    label: 'Warmth',
    description: 'Low-mid emphasis and analog character',
    commonAxes: ['low-mid-emphasis', 'saturation', 'analog-feel'],
    exampleWords: ['warm', 'cold', 'analog', 'digital', 'tube', 'solid-state'],
  },
  width: {
    label: 'Width',
    description: 'Stereo spread and spatial breadth',
    commonAxes: ['stereo-width', 'mid-side-balance', 'correlation'],
    exampleWords: ['wide', 'narrow', 'mono', 'stereo', 'spread', 'focused'],
  },
  depth: {
    label: 'Depth',
    description: 'Front-to-back placement in the mix',
    commonAxes: ['distance', 'reverb-amount', 'pre-delay', 'early-reflections'],
    exampleWords: ['deep', 'shallow', 'upfront', 'distant', 'buried', 'forward'],
  },
  attack: {
    label: 'Attack',
    description: 'The onset characteristics of sounds',
    commonAxes: ['attack-time', 'transient-shape', 'click', 'snap'],
    exampleWords: ['sharp', 'soft', 'snappy', 'smooth', 'plucky', 'gradual'],
  },
  release: {
    label: 'Release',
    description: 'How sounds fade out',
    commonAxes: ['release-time', 'tail-length', 'sustain-level'],
    exampleWords: ['long', 'short', 'sustained', 'clipped', 'ringing', 'cut'],
  },
  sustain: {
    label: 'Sustain',
    description: 'How long a sound is held',
    commonAxes: ['sustain-level', 'hold-time', 'envelope-shape'],
    exampleWords: ['sustained', 'staccato', 'legato', 'held', 'chopped', 'flowing'],
  },
  decay: {
    label: 'Decay',
    description: 'How quickly a sound fades from peak to sustain level',
    commonAxes: ['decay-time', 'envelope-slope', 'damping'],
    exampleWords: ['quick', 'slow', 'snappy', 'lingering', 'tight', 'loose'],
  },
  genre: {
    label: 'Genre',
    description: 'Musical genre or style references',
    commonAxes: ['style', 'era', 'subgenre', 'influence'],
    exampleWords: ['jazz', 'rock', 'electronic', 'classical', 'hip-hop', 'ambient'],
  },
  era: {
    label: 'Era',
    description: 'Time period or production era references',
    commonAxes: ['decade', 'production-style', 'vintage-modern'],
    exampleWords: ['vintage', 'modern', 'retro', 'futuristic', '80s', 'lo-fi'],
  },
  articulation: {
    label: 'Articulation',
    description: 'How individual notes are played or shaped',
    commonAxes: ['staccato-legato', 'accent', 'ghost-note', 'slide'],
    exampleWords: ['staccato', 'legato', 'accented', 'ghosted', 'sliding', 'hammered'],
  },
  form: {
    label: 'Form',
    description: 'Song structure and arrangement form',
    commonAxes: ['section-type', 'transition', 'build', 'drop'],
    exampleWords: ['verse', 'chorus', 'bridge', 'intro', 'outro', 'buildup'],
  },
} as const;

/** All vocabulary domain values for iteration. */
export const ALL_VOCABULARY_DOMAINS: readonly VocabularyDomain[] = [
  'timbre', 'dynamics', 'pitch', 'rhythm', 'harmony', 'texture', 'space',
  'emotion', 'energy', 'density', 'brightness', 'warmth', 'width', 'depth',
  'attack', 'release', 'sustain', 'decay', 'genre', 'era', 'articulation', 'form',
] as const;

// ---------------------------------------------------------------------------
// 199 — Learning Prompt Templates (15+)
// ---------------------------------------------------------------------------

export const LEARNING_PROMPT_TEMPLATES: readonly {
  readonly id: string;
  readonly category: LearningPromptCategory;
  readonly questionTemplate: string;
  readonly optionTemplate: string;
}[] = [
  {
    id: 'LP001',
    category: 'first-use',
    questionTemplate: 'You used "{word}". In music, this often relates to {domain}. Sound right?',
    optionTemplate: 'Yes, I mean {domain}',
  },
  {
    id: 'LP002',
    category: 'correction',
    questionTemplate: 'Last time, "{word}" was treated as {previousDomain}. Did you mean {domain} instead?',
    optionTemplate: 'I meant {domain}',
  },
  {
    id: 'LP003',
    category: 'confirmation',
    questionTemplate: 'Just to confirm — when you say "{word}", you mean the {axis} of {domain}?',
    optionTemplate: 'Yes, {axis} of {domain}',
  },
  {
    id: 'LP004',
    category: 'disambiguation',
    questionTemplate: '"{word}" could refer to {domainA} or {domainB}. Which do you mean here?',
    optionTemplate: '{domain}',
  },
  {
    id: 'LP005',
    category: 'calibration',
    questionTemplate: 'When you say "{word}", how much change do you expect? A subtle shift or a big change?',
    optionTemplate: '{degree}: {description}',
  },
  {
    id: 'LP006',
    category: 'first-use',
    questionTemplate: 'I noticed you used "{word}" to describe the sound. Should I remember that you mean {domain}?',
    optionTemplate: 'Yes, save as {domain}',
  },
  {
    id: 'LP007',
    category: 'conflict-resolution',
    questionTemplate: 'You previously said "{word}" means {domainA}, but now it seems like you mean {domainB}. Which is correct?',
    optionTemplate: '{domain} is correct',
  },
  {
    id: 'LP008',
    category: 'calibration',
    questionTemplate: 'On a scale of 1-10, how "{word}" is the current sound? This helps me calibrate.',
    optionTemplate: 'Rating: {value}',
  },
  {
    id: 'LP009',
    category: 'confirmation',
    questionTemplate: 'I\'ll remember that "{word}" → {domain} ({axis}). Want to adjust this later?',
    optionTemplate: 'Save it / Let me adjust',
  },
  {
    id: 'LP010',
    category: 'first-use',
    questionTemplate: '"{word}" is new to me in your context. Does it relate to how the music sounds ({timbre}), how loud it is ({dynamics}), or something else?',
    optionTemplate: 'It relates to {domain}',
  },
  {
    id: 'LP011',
    category: 'disambiguation',
    questionTemplate: 'By "{word}", do you mean the {axisA} aspect or the {axisB} aspect?',
    optionTemplate: 'The {axis} aspect',
  },
  {
    id: 'LP012',
    category: 'calibration',
    questionTemplate: 'You said "{word}" several times. Should I apply a bigger change each time, or keep it consistent?',
    optionTemplate: '{strategy}',
  },
  {
    id: 'LP013',
    category: 'correction',
    questionTemplate: 'I applied "{word}" as {previousDomain}, but the result didn\'t seem right. Want to remap it?',
    optionTemplate: 'Remap to {domain}',
  },
  {
    id: 'LP014',
    category: 'first-use',
    questionTemplate: 'Some producers use "{word}" for {domainA}; others for {domainB}. What\'s your preference?',
    optionTemplate: 'I use it for {domain}',
  },
  {
    id: 'LP015',
    category: 'conflict-resolution',
    questionTemplate: '"{word}" conflicts with an earlier preference. Should I update the preference or keep the old one?',
    optionTemplate: '{action}',
  },
  {
    id: 'LP016',
    category: 'calibration',
    questionTemplate: 'Can you give me an example track where the sound is "{word}"? That helps me calibrate.',
    optionTemplate: 'Reference: {reference}',
  },
] as const;

// ---------------------------------------------------------------------------
// 199 — Functions
// ---------------------------------------------------------------------------

/** Detect a vocabulary learning event from user interaction. */
export function detectVocabularyEvent(
  word: string,
  domain: VocabularyDomain,
  axis: string,
  contextUtterance: string,
  store: PreferenceStore,
): VocabularyLearningEvent {
  const normalized = word.toLowerCase().trim();
  const existing = store.preferences[normalized];
  const hasExisting = existing !== undefined && existing.length > 0;
  const previousPref = hasExisting ? (existing[0] ?? null) : null;
  const previousDomain = previousPref !== null ? previousPref.domain : null;
  const isCorrection = previousDomain !== null && previousDomain !== domain;

  const eventType: LearningEventType = isCorrection
    ? 'explicit-correction'
    : hasExisting
      ? 'repeated-pattern'
      : 'implicit-selection';

  return {
    id: `vle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    word,
    normalizedWord: normalized,
    eventType,
    domain,
    axis,
    direction: 'increase',
    confidence: isCorrection ? 0.9 : hasExisting ? 0.7 : 0.5,
    contextUtterance,
    previousDomain: isCorrection ? previousDomain : null,
    userConfirmed: false,
  };
}

/** Generate a learning prompt to ask the user about a vocabulary preference. */
export function generateLearningPrompt(
  event: VocabularyLearningEvent,
): LearningPrompt {
  const domainInfo = VOCABULARY_DOMAIN_INFO[event.domain];
  const category: LearningPromptCategory = event.eventType === 'explicit-correction'
    ? 'correction'
    : event.previousDomain !== null
      ? 'conflict-resolution'
      : 'first-use';

  const question = `You used "${event.word}". In music, this often relates to ${domainInfo.label.toLowerCase()}. Sound right?`;

  const options: LearningPromptOption[] = [
    {
      label: `Yes, I mean ${domainInfo.label.toLowerCase()}`,
      domain: event.domain,
      axis: event.axis,
      isDefault: true,
    },
  ];

  // Add alternatives from related domains
  const relatedDomains = ALL_VOCABULARY_DOMAINS.filter(d => d !== event.domain);
  const alternativeCount = Math.min(3, relatedDomains.length);
  for (let i = 0; i < alternativeCount; i++) {
    const altDomain = relatedDomains[i];
    if (altDomain === undefined) continue;
    const altInfo = VOCABULARY_DOMAIN_INFO[altDomain];
    const firstAxis = altInfo.commonAxes[0];
    options.push({
      label: `No, I mean ${altInfo.label.toLowerCase()}`,
      domain: altDomain,
      axis: firstAxis ?? 'general',
      isDefault: false,
    });
  }

  return {
    id: `lp-${Date.now()}`,
    word: event.word,
    proposedDomain: event.domain,
    proposedAxis: event.axis,
    question,
    options,
    showDontAskAgain: event.eventType === 'repeated-pattern',
    promptCategory: category,
  };
}

/** Store a preference in the preference store. Returns a new store. */
export function storePreference(
  store: PreferenceStore,
  event: VocabularyLearningEvent,
): PreferenceStore {
  const normalized = event.normalizedWord;
  const existing = store.preferences[normalized];
  const existingList = existing ?? [];

  // Check if we already have a preference for this domain
  const existingForDomain = existingList.find(p => p.domain === event.domain);

  let updatedList: UserPreference[];
  if (existingForDomain !== undefined) {
    // Update existing preference
    updatedList = existingList.map(p => {
      if (p.domain === event.domain) {
        return {
          ...p,
          confidence: Math.min(1, p.confidence + 0.1),
          usageCount: p.usageCount + 1,
          lastUsed: Date.now(),
          learningHistory: [...p.learningHistory, event.id],
        };
      }
      return p;
    });
  } else {
    // Add new preference
    const newPref: UserPreference = {
      word: event.word,
      normalizedWord: normalized,
      domain: event.domain,
      axis: event.axis,
      direction: event.direction,
      confidence: event.confidence,
      usageCount: 1,
      firstLearned: Date.now(),
      lastUsed: Date.now(),
      learningHistory: [event.id],
    };
    updatedList = [...existingList, newPref];
  }

  const newPrefs = { ...store.preferences, [normalized]: updatedList };
  let total = 0;
  for (const key of Object.keys(newPrefs)) {
    const val = newPrefs[key];
    if (val !== undefined) {
      total += val.length;
    }
  }

  return {
    ...store,
    preferences: newPrefs,
    totalPreferences: total,
    lastModified: Date.now(),
  };
}

/** Look up a preference for a word. Returns the highest-confidence match. */
export function lookupPreference(
  store: PreferenceStore,
  word: string,
): UserPreference | null {
  const normalized = word.toLowerCase().trim();
  const prefs = store.preferences[normalized];
  if (prefs === undefined || prefs.length === 0) return null;

  let best: UserPreference | null = null;
  let bestConf = -1;
  for (const p of prefs) {
    if (p.confidence > bestConf) {
      bestConf = p.confidence;
      best = p;
    }
  }
  return best;
}

/** Get a vocabulary profile for the user. */
export function getVocabularyProfile(store: PreferenceStore): VocabularyProfile {
  const perDomainCounts: Record<string, number> = {};
  let totalLearned = 0;
  let totalConfidence = 0;
  let highConf = 0;
  let medConf = 0;
  let lowConf = 0;
  let recentCount = 0;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const key of Object.keys(store.preferences)) {
    const prefs = store.preferences[key];
    if (prefs === undefined) continue;
    for (const p of prefs) {
      totalLearned++;
      totalConfidence += p.confidence;
      const prev = perDomainCounts[p.domain];
      perDomainCounts[p.domain] = (prev ?? 0) + 1;
      if (p.confidence >= 0.7) highConf++;
      else if (p.confidence >= 0.4) medConf++;
      else lowConf++;
      if (p.lastUsed >= sevenDaysAgo) recentCount++;
    }
  }

  const domainCounts = ALL_VOCABULARY_DOMAINS.map(d => ({
    domain: d,
    count: perDomainCounts[d] ?? 0,
  }));
  domainCounts.sort((a, b) => b.count - a.count);

  const topDomains = domainCounts
    .filter(dc => dc.count > 0)
    .slice(0, 5)
    .map(dc => dc.domain);

  const uncoveredDomains = domainCounts
    .filter(dc => dc.count === 0)
    .map(dc => dc.domain);

  return {
    userId: store.userId,
    totalLearned,
    perDomainCounts,
    confidenceDistribution: { high: highConf, medium: medConf, low: lowConf },
    recentActivity: recentCount,
    topDomains,
    uncoveredDomains,
    averageConfidence: totalLearned > 0 ? totalConfidence / totalLearned : 0,
    conflictCount: detectConflicts(store).length,
  };
}

/** Suggest a calibration session for domains with low or no coverage. */
export function suggestCalibration(
  profile: VocabularyProfile,
): readonly VocabularyDomain[] {
  // Suggest uncovered domains first, then domains with low confidence
  return [...profile.uncoveredDomains].slice(0, 5);
}

/** Export preferences to a portable JSON-serialisable object. */
export function exportPreferences(
  store: PreferenceStore,
): { readonly version: number; readonly userId: string; readonly preferences: readonly UserPreference[] } {
  const allPrefs: UserPreference[] = [];
  for (const key of Object.keys(store.preferences)) {
    const prefs = store.preferences[key];
    if (prefs === undefined) continue;
    for (const p of prefs) {
      allPrefs.push(p);
    }
  }
  return {
    version: store.version,
    userId: store.userId,
    preferences: allPrefs,
  };
}

/** Import preferences from a portable format. */
export function importPreferences(
  exported: { readonly version: number; readonly userId: string; readonly preferences: readonly UserPreference[] },
): PreferenceStore {
  const prefs: Record<string, UserPreference[]> = {};
  for (const p of exported.preferences) {
    const existing = prefs[p.normalizedWord];
    if (existing !== undefined) {
      existing.push(p);
    } else {
      prefs[p.normalizedWord] = [p];
    }
  }

  return {
    userId: exported.userId,
    preferences: prefs,
    totalPreferences: exported.preferences.length,
    lastModified: Date.now(),
    version: exported.version,
  };
}

/** Merge two vocabulary profiles (e.g. across devices). */
export function mergeProfiles(
  a: PreferenceStore,
  b: PreferenceStore,
): PreferenceStore {
  const merged: Record<string, UserPreference[]> = {};

  // Add all from store A
  for (const key of Object.keys(a.preferences)) {
    const prefs = a.preferences[key];
    if (prefs === undefined) continue;
    merged[key] = [...prefs];
  }

  // Merge in store B
  for (const key of Object.keys(b.preferences)) {
    const bPrefs = b.preferences[key];
    if (bPrefs === undefined) continue;
    const existing = merged[key];
    if (existing === undefined) {
      merged[key] = [...bPrefs];
    } else {
      for (const bp of bPrefs) {
        const dup = existing.find(e => e.domain === bp.domain && e.axis === bp.axis);
        if (dup === undefined) {
          existing.push(bp);
        } else if (bp.lastUsed > dup.lastUsed) {
          // Replace with newer
          const idx = existing.indexOf(dup);
          if (idx >= 0) {
            existing[idx] = bp;
          }
        }
      }
    }
  }

  let total = 0;
  for (const key of Object.keys(merged)) {
    const val = merged[key];
    if (val !== undefined) total += val.length;
  }

  return {
    userId: a.userId,
    preferences: merged,
    totalPreferences: total,
    lastModified: Date.now(),
    version: Math.max(a.version, b.version),
  };
}

/** Detect conflicts where the same word maps to different domains with similar confidence. */
export function detectConflicts(
  store: PreferenceStore,
): readonly { readonly word: string; readonly domainA: VocabularyDomain; readonly domainB: VocabularyDomain; readonly confidenceDelta: number }[] {
  const conflicts: { readonly word: string; readonly domainA: VocabularyDomain; readonly domainB: VocabularyDomain; readonly confidenceDelta: number }[] = [];

  for (const key of Object.keys(store.preferences)) {
    const prefs = store.preferences[key];
    if (prefs === undefined || prefs.length < 2) continue;
    for (let i = 0; i < prefs.length; i++) {
      const a = prefs[i];
      if (a === undefined) continue;
      for (let j = i + 1; j < prefs.length; j++) {
        const b = prefs[j];
        if (b === undefined) continue;
        if (a.domain !== b.domain) {
          const delta = Math.abs(a.confidence - b.confidence);
          if (delta < 0.3) {
            conflicts.push({
              word: a.word,
              domainA: a.domain,
              domainB: b.domain,
              confidenceDelta: delta,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/** Resolve a conflict by boosting one domain and demoting the other. */
export function resolveConflict(
  store: PreferenceStore,
  word: string,
  preferredDomain: VocabularyDomain,
): PreferenceStore {
  const normalized = word.toLowerCase().trim();
  const prefs = store.preferences[normalized];
  if (prefs === undefined) return store;

  const updatedPrefs = prefs.map(p => {
    if (p.domain === preferredDomain) {
      return { ...p, confidence: Math.min(1, p.confidence + 0.2) };
    }
    return { ...p, confidence: Math.max(0, p.confidence - 0.2) };
  });

  return {
    ...store,
    preferences: { ...store.preferences, [normalized]: updatedPrefs },
    lastModified: Date.now(),
  };
}

/** Get recent learning events from a store (based on lastUsed). */
export function getRecentLearning(
  store: PreferenceStore,
  maxItems: number,
): readonly UserPreference[] {
  const all: UserPreference[] = [];
  for (const key of Object.keys(store.preferences)) {
    const prefs = store.preferences[key];
    if (prefs === undefined) continue;
    for (const p of prefs) {
      all.push(p);
    }
  }
  all.sort((a, b) => b.lastUsed - a.lastUsed);
  return all.slice(0, maxItems);
}

/** Compute vocabulary coverage as a fraction of total domains covered. */
export function computeVocabularyCoverage(
  store: PreferenceStore,
): number {
  const coveredDomains = new Set<string>();
  for (const key of Object.keys(store.preferences)) {
    const prefs = store.preferences[key];
    if (prefs === undefined) continue;
    for (const p of prefs) {
      coveredDomains.add(p.domain);
    }
  }
  return coveredDomains.size / ALL_VOCABULARY_DOMAINS.length;
}

/** Suggest the next calibration domain based on gaps in coverage. */
export function suggestNextCalibration(
  store: PreferenceStore,
): VocabularyDomain | null {
  const coveredDomains = new Set<string>();
  for (const key of Object.keys(store.preferences)) {
    const prefs = store.preferences[key];
    if (prefs === undefined) continue;
    for (const p of prefs) {
      coveredDomains.add(p.domain);
    }
  }
  for (const domain of ALL_VOCABULARY_DOMAINS) {
    if (!coveredDomains.has(domain)) {
      return domain;
    }
  }
  return null;
}

/** Create an empty preference store. */
export function createEmptyPreferenceStore(userId: string): PreferenceStore {
  return {
    userId,
    preferences: {},
    totalPreferences: 0,
    lastModified: Date.now(),
    version: 1,
  };
}


// =============================================================================
// STEP 200 [HCI] — Teach Mode
// =============================================================================
//
// The system can explain the semantics in musical terms (education workflow).
// =============================================================================

// ---------------------------------------------------------------------------
// 200 — Types
// ---------------------------------------------------------------------------

/** Explanation level for teach mode. */
export type ExplanationLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'developer';

/** A musical analogy mapping a semantic concept to a musical term. */
export interface MusicalAnalogy {
  /** The semantic / CPL concept being explained. */
  readonly concept: string;
  /** The musical analogy. */
  readonly musicalTerm: string;
  /** A short explanation of the analogy. */
  readonly explanation: string;
  /** An example in context. */
  readonly example: string;
  /** Which explanation levels this analogy is appropriate for. */
  readonly levels: readonly ExplanationLevel[];
}

/** An explanation of a CPL node at a given level. */
export interface SemanticExplanation {
  /** The node type being explained. */
  readonly nodeType: CPLNodeType;
  /** The explanation level. */
  readonly level: ExplanationLevel;
  /** The main explanation text. */
  readonly text: string;
  /** A musical analogy for this concept. */
  readonly analogy: string;
  /** A concrete example. */
  readonly example: string;
  /** Key takeaway (1 sentence). */
  readonly takeaway: string;
  /** Related concepts to explore next. */
  readonly relatedConcepts: readonly string[];
}

/** Configuration for teach mode. */
export interface TeachModeConfig {
  /** Current explanation level. */
  readonly level: ExplanationLevel;
  /** Whether to auto-advance levels based on quiz performance. */
  readonly autoAdvance: boolean;
  /** Minimum quiz score (0-1) required to advance. */
  readonly advanceThreshold: number;
  /** Whether to show analogies inline. */
  readonly showAnalogies: boolean;
  /** Whether to show examples inline. */
  readonly showExamples: boolean;
  /** Whether to offer quizzes after explanations. */
  readonly offerQuizzes: boolean;
  /** Maximum explanations before suggesting a quiz. */
  readonly explanationsBeforeQuiz: number;
  /** Whether to track session progress. */
  readonly trackProgress: boolean;
}

/** A quiz question for testing understanding. */
export interface TeachModeQuizQuestion {
  /** Unique question ID. */
  readonly id: string;
  /** The question text. */
  readonly question: string;
  /** Answer options. */
  readonly options: readonly string[];
  /** Index of the correct answer. */
  readonly correctIndex: number;
  /** Explanation shown after answering. */
  readonly explanation: string;
  /** Which concept this tests. */
  readonly concept: string;
  /** Which node type this relates to. */
  readonly nodeType: CPLNodeType;
  /** Difficulty level. */
  readonly level: ExplanationLevel;
}

/** A teach-mode session tracking what has been explained and quiz results. */
export interface TeachModeSession {
  /** Unique session ID. */
  readonly id: string;
  /** When the session started. */
  readonly startTime: number;
  /** Current explanation level. */
  readonly currentLevel: ExplanationLevel;
  /** Node types that have been explained. */
  readonly explainedNodeTypes: readonly CPLNodeType[];
  /** Concepts that have been explained. */
  readonly explainedConcepts: readonly string[];
  /** Quiz questions asked. */
  readonly quizHistory: readonly {
    readonly questionId: string;
    readonly selectedIndex: number;
    readonly correct: boolean;
    readonly timestamp: number;
  }[];
  /** Number of explanations given. */
  readonly explanationCount: number;
  /** Number of quizzes taken. */
  readonly quizCount: number;
  /** Number of correct quiz answers. */
  readonly correctAnswers: number;
  /** Total quiz questions answered. */
  readonly totalAnswered: number;
}

// ---------------------------------------------------------------------------
// 200 — Explanation Level Info
// ---------------------------------------------------------------------------

export const EXPLANATION_LEVEL_INFO: Readonly<Record<ExplanationLevel, {
  readonly label: string;
  readonly description: string;
  readonly targetAudience: string;
  readonly usesJargon: boolean;
  readonly showsTechnicalDetails: boolean;
  readonly order: number;
}>> = {
  beginner: {
    label: 'Beginner',
    description: 'Simple musical terms, everyday language, lots of analogies',
    targetAudience: 'Someone new to music production or CPL',
    usesJargon: false,
    showsTechnicalDetails: false,
    order: 0,
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Standard music production vocabulary, moderate detail',
    targetAudience: 'Someone with basic music production experience',
    usesJargon: false,
    showsTechnicalDetails: false,
    order: 1,
  },
  advanced: {
    label: 'Advanced',
    description: 'Technical music terms, detailed explanations',
    targetAudience: 'An experienced music producer',
    usesJargon: true,
    showsTechnicalDetails: false,
    order: 2,
  },
  expert: {
    label: 'Expert',
    description: 'Full technical detail, semantic theory references',
    targetAudience: 'A music technology expert or researcher',
    usesJargon: true,
    showsTechnicalDetails: true,
    order: 3,
  },
  developer: {
    label: 'Developer',
    description: 'Implementation details, rule IDs, internal representations',
    targetAudience: 'A developer working on the CPL system',
    usesJargon: true,
    showsTechnicalDetails: true,
    order: 4,
  },
} as const;

// ---------------------------------------------------------------------------
// 200 — Musical Analogies (25+)
// ---------------------------------------------------------------------------

export const MUSICAL_ANALOGIES: readonly MusicalAnalogy[] = [
  {
    concept: 'scope',
    musicalTerm: 'which part of the song',
    explanation: 'Scope is like choosing whether a change applies to the whole song, one section, or just one instrument.',
    example: '"Make it louder" — scope decides if the whole mix, or just the vocals, get louder.',
    levels: ['beginner', 'intermediate'],
  },
  {
    concept: 'constraint',
    musicalTerm: 'a rule the music must follow',
    explanation: 'A constraint is a hard rule — like saying "the bass must always be below 200Hz".',
    example: '"Keep the tempo at 120 BPM" is a constraint — it cannot be broken.',
    levels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    concept: 'preference',
    musicalTerm: 'something you would like but is not required',
    explanation: 'A preference is a soft wish — like saying "I\'d prefer more reverb" (but it\'s OK if not).',
    example: '"I\'d like it warmer" is a preference — the system tries but may compromise.',
    levels: ['beginner', 'intermediate'],
  },
  {
    concept: 'goal',
    musicalTerm: 'the overall sound you are going for',
    explanation: 'A goal is the big-picture target — like "make it sound like a 90s hip-hop track".',
    example: '"Make it dreamy" is a goal — it guides many small decisions.',
    levels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    concept: 'intent',
    musicalTerm: 'what you want the system to do',
    explanation: 'Intent is the action — are you creating, editing, comparing, or undoing?',
    example: '"Add reverb" has an "add" intent. "Remove the bass" has a "remove" intent.',
    levels: ['beginner', 'intermediate'],
  },
  {
    concept: 'selector',
    musicalTerm: 'which instrument or element you are talking about',
    explanation: 'A selector picks out a specific part of the mix — like "the drums" or "track 3".',
    example: '"Make the vocals brighter" — "the vocals" is the selector.',
    levels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    concept: 'amount',
    musicalTerm: 'how much to change',
    explanation: 'Amount is the size of the change — a little, a lot, or an exact number.',
    example: '"A bit more reverb" — "a bit" is the amount.',
    levels: ['beginner', 'intermediate'],
  },
  {
    concept: 'timeRange',
    musicalTerm: 'when in the song',
    explanation: 'Time range is which bars, beats, or sections the change applies to.',
    example: '"In the chorus" or "at bar 32" — these define the time range.',
    levels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    concept: 'opcode',
    musicalTerm: 'the specific edit operation',
    explanation: 'An opcode is the exact technical operation — like "EQ boost at 3kHz" or "add delay".',
    example: 'When you say "brighten", the opcode might be "high-shelf EQ boost".',
    levels: ['intermediate', 'advanced', 'expert'],
  },
  {
    concept: 'hole',
    musicalTerm: 'a missing piece of information',
    explanation: 'A hole is something the system needs to know but you did not say — like which track to edit.',
    example: '"Make it louder" has a hole: louder by how much?',
    levels: ['intermediate', 'advanced'],
  },
  {
    concept: 'modifier',
    musicalTerm: 'a descriptive word that shapes the edit',
    explanation: 'Modifiers add colour to an instruction — "slightly", "extremely", "more like jazz".',
    example: '"Slightly brighter" — "slightly" modifies the brightness edit.',
    levels: ['beginner', 'intermediate'],
  },
  {
    concept: 'reference',
    musicalTerm: 'pointing back to something mentioned earlier',
    explanation: 'A reference is when you say "it" or "that" to mean something you talked about before.',
    example: '"Make the bass louder. Also add reverb to it." — "it" refers to the bass.',
    levels: ['beginner', 'intermediate'],
  },
  {
    concept: 'composition',
    musicalTerm: 'combining multiple ideas into one instruction',
    explanation: 'Composition is when the system combines "brighter" + "the vocals" + "in the chorus" into one edit.',
    example: '"Brighter vocals in the chorus" composes three pieces of meaning.',
    levels: ['intermediate', 'advanced', 'expert'],
  },
  {
    concept: 'type-coercion',
    musicalTerm: 'translating between different kinds of description',
    explanation: 'Sometimes you say a colour ("dark") and the system needs a number (e.g. -3dB at 8kHz). That translation is type coercion.',
    example: '"Dark" gets coerced from a mood word to a specific EQ curve.',
    levels: ['advanced', 'expert', 'developer'],
  },
  {
    concept: 'default-fill',
    musicalTerm: 'the system guessing what you left out',
    explanation: 'When you leave out details, the system fills in sensible defaults — like assuming "the whole track" if you do not specify.',
    example: '"Add reverb" — the system defaults to a medium room reverb.',
    levels: ['intermediate', 'advanced'],
  },
  {
    concept: 'pragmatic-inference',
    musicalTerm: 'reading between the lines',
    explanation: 'The system infers things you implied but did not say explicitly.',
    example: '"It\'s too quiet" implies you want it louder — that\'s a pragmatic inference.',
    levels: ['advanced', 'expert'],
  },
  {
    concept: 'frame-match',
    musicalTerm: 'recognising a pattern in what you said',
    explanation: 'The system recognises common patterns like "make X more Y" or "add X to Y".',
    example: '"Make the drums punchier" matches the "make X more Y" frame.',
    levels: ['advanced', 'expert', 'developer'],
  },
  {
    concept: 'metaphor-resolution',
    musicalTerm: 'understanding figurative language about sound',
    explanation: 'When you use a non-musical word to describe sound, the system maps it to an audio parameter.',
    example: '"Warm" is not a temperature — it means boosted low-mids and gentle saturation.',
    levels: ['intermediate', 'advanced', 'expert'],
  },
  {
    concept: 'ellipsis-resolution',
    musicalTerm: 'figuring out what words you skipped',
    explanation: 'When you leave out words (like saying "louder" instead of "make it louder"), the system fills them in.',
    example: '"More reverb" is short for "add more reverb to the current selection".',
    levels: ['intermediate', 'advanced'],
  },
  {
    concept: 'scope-resolution',
    musicalTerm: 'deciding what part of the music to change',
    explanation: 'When it is ambiguous, the system decides which tracks, sections, or parameters your instruction targets.',
    example: '"Brighten everything" — scope resolution decides if "everything" means all tracks or all frequencies.',
    levels: ['advanced', 'expert'],
  },
  {
    concept: 'confidence',
    musicalTerm: 'how sure the system is about its interpretation',
    explanation: 'Each interpretation has a confidence score. High confidence means the system is sure; low means it might ask you to clarify.',
    example: '"Louder" has high confidence. "Make it more alive" has lower confidence.',
    levels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    concept: 'ambiguity',
    musicalTerm: 'when your words could mean more than one thing',
    explanation: 'Sometimes a word or phrase has multiple valid interpretations in a music context.',
    example: '"Dark" could mean "less bright (timbre)" or "somber mood".',
    levels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    concept: 'provenance',
    musicalTerm: 'where each part of the interpretation came from',
    explanation: 'Provenance traces each piece of the interpretation back to the words you said and the rules that processed them.',
    example: 'Hovering a CPL node shows: "vocals" came from lexicon, which produced a selector node.',
    levels: ['advanced', 'expert', 'developer'],
  },
  {
    concept: 'literal',
    musicalTerm: 'an exact value you specified',
    explanation: 'A literal is a concrete value like "120 BPM" or "3dB" — no interpretation needed.',
    example: '"Set the tempo to 120" — 120 is a literal value.',
    levels: ['beginner', 'intermediate'],
  },
  {
    concept: 'group',
    musicalTerm: 'a collection of related instructions',
    explanation: 'A group bundles multiple edits together so they all happen as one logical change.',
    example: '"Make the verse louder and add reverb" is a group of two edits.',
    levels: ['intermediate', 'advanced'],
  },
  {
    concept: 'negation',
    musicalTerm: 'saying what you do NOT want',
    explanation: 'Negation is when you tell the system to avoid or remove something.',
    example: '"No reverb" or "don\'t change the bass" are negations.',
    levels: ['beginner', 'intermediate', 'advanced'],
  },
  {
    concept: 'quantifier',
    musicalTerm: 'how many things to change',
    explanation: 'Quantifiers specify whether you mean all, some, or each of a set of elements.',
    example: '"All the tracks" vs "each track" vs "some tracks" — different quantifiers.',
    levels: ['intermediate', 'advanced'],
  },
] as const;

// ---------------------------------------------------------------------------
// 200 — Explanation Templates (5 levels x 10+ node types = 50+)
// ---------------------------------------------------------------------------

/** All CPL node types for which we have explanations. */
const EXPLAINED_NODE_TYPES: readonly CPLNodeType[] = [
  'intent', 'goal', 'constraint', 'preference', 'scope',
  'timeRange', 'selector', 'amount', 'hole', 'opcode',
  'modifier', 'reference', 'literal', 'group',
] as const;

const EXPLANATION_DATABASE: readonly SemanticExplanation[] = [
  // --- intent (5 levels) ---
  { nodeType: 'intent', level: 'beginner', text: 'This tells the system what action to take — like "add", "remove", or "change".', analogy: 'Think of it as the verb in your sentence.', example: '"Add reverb" — the intent is "add".', takeaway: 'The intent is the action word.', relatedConcepts: ['goal', 'opcode'] },
  { nodeType: 'intent', level: 'intermediate', text: 'The intent captures the high-level action: create, modify, delete, query, or undo. It determines which processing pipeline is used.', analogy: 'Like choosing between "record", "mix", and "master" workflows.', example: '"Compare the two mixes" — intent is "query/compare".', takeaway: 'Intent drives which tools the system reaches for.', relatedConcepts: ['goal', 'opcode', 'scope'] },
  { nodeType: 'intent', level: 'advanced', text: 'Intent is the illocutionary force of the utterance mapped to a finite set of action types. Multiple intents can be composed via coordination.', analogy: 'The DAW command palette — each intent maps to a category of operations.', example: '"Add reverb and then compress it" — two composed intents: add, then modify.', takeaway: 'Intents can be composed and sequenced.', relatedConcepts: ['composition', 'opcode', 'group'] },
  { nodeType: 'intent', level: 'expert', text: 'Intent classification uses speech-act theory: directives map to edit intents, questions to query intents, and commissives to goal-setting intents.', analogy: 'MIDI CC messages — different message types trigger different synth behaviours.', example: '"What if we added more bass?" — interrogative form but directive intent (hypothetical edit).', takeaway: 'Surface form and intent can diverge — pragmatic inference resolves this.', relatedConcepts: ['pragmatic-inference', 'speech-act', 'goal'] },
  { nodeType: 'intent', level: 'developer', text: 'Intent node is produced by the speech-act classifier in the pragmatic-bias module. It carries an action enum and optional sub-action.', analogy: 'HTTP method (GET/POST/PUT/DELETE) in a REST API.', example: 'IntentNode { action: "modify", subAction: "increase", confidence: 0.92 }', takeaway: 'Check pragmatic-bias.ts for the classifier implementation.', relatedConcepts: ['pragmatic-inference', 'opcode', 'frame-match'] },

  // --- goal (5 levels) ---
  { nodeType: 'goal', level: 'beginner', text: 'A goal is the overall sound you are going for — the big picture.', analogy: 'Like saying "I want a summer vibe" to a DJ.', example: '"Make it sound dreamy" — the goal is a dreamy sound.', takeaway: 'Goals describe the destination, not the route.', relatedConcepts: ['intent', 'preference'] },
  { nodeType: 'goal', level: 'intermediate', text: 'Goals are high-level musical targets that may require multiple edits to achieve.', analogy: 'A mix reference track — it defines the target sound but not the individual EQ moves.', example: '"Make it radio-ready" — goal that decomposes into loudness, EQ, and stereo width targets.', takeaway: 'One goal can produce many edits.', relatedConcepts: ['constraint', 'preference', 'opcode'] },
  { nodeType: 'goal', level: 'advanced', text: 'Goals sit at the top of the CPL intent hierarchy. They constrain the solution space and may conflict, requiring priority resolution.', analogy: 'A mastering brief — it sets aesthetic targets that guide technical decisions.', example: '"Warm but clear" — two potentially conflicting goals requiring balance.', takeaway: 'Conflicting goals need explicit priority ordering.', relatedConcepts: ['constraint', 'preference', 'ambiguity'] },
  { nodeType: 'goal', level: 'expert', text: 'Goals are represented as partial specifications of the target audio state. They are evaluated via perceptual distance metrics.', analogy: 'An objective function in optimisation — defines what "better" means.', example: 'GoalNode { target: "dreamy", perceptualAxes: [reverb: high, brightness: low, attack: soft] }', takeaway: 'Goals are operationalised into measurable perceptual targets.', relatedConcepts: ['frame-match', 'type-coercion', 'constraint'] },
  { nodeType: 'goal', level: 'developer', text: 'GoalNode is emitted by musical-goals.ts. It contains a target descriptor, optional reference, and decomposition hints.', analogy: 'A declarative build target (like a Makefile target).', example: 'GoalNode { id: "g1", target: "radio-ready", decomposedInto: ["loudness", "eq", "width"] }', takeaway: 'See musical-goals.ts for goal extraction and decomposition logic.', relatedConcepts: ['opcode', 'constraint', 'frame-match'] },

  // --- constraint (5 levels) ---
  { nodeType: 'constraint', level: 'beginner', text: 'A constraint is a hard rule — something that must be true about the music.', analogy: 'Like a speed limit — you cannot go over it.', example: '"The bass cannot go above -6dB" is a constraint.', takeaway: 'Constraints are rules that cannot be broken.', relatedConcepts: ['preference', 'goal'] },
  { nodeType: 'constraint', level: 'intermediate', text: 'Constraints are non-negotiable requirements. The system will refuse to violate them.', analogy: 'Like a noise ordinance — the venue has a maximum SPL regardless of what the band wants.', example: '"Keep the tempo exactly at 128 BPM" — this constrains the tempo parameter.', takeaway: 'When constraints conflict, the system asks which to relax.', relatedConcepts: ['preference', 'goal', 'ambiguity'] },
  { nodeType: 'constraint', level: 'advanced', text: 'Constraints are hard bounds on the solution space. They are distinguished from preferences by modality markers (must, always, never).', analogy: 'Clipping protection — a hard limiter that never lets the signal exceed 0dBFS.', example: '"Never clip the master bus" — constraint on peak level.', takeaway: 'Constraints use modality analysis to distinguish from preferences.', relatedConcepts: ['modality', 'preference', 'negation'] },
  { nodeType: 'constraint', level: 'expert', text: 'Constraints are first-order predicates over the audio state. They are compiled into checker functions that run after each edit.', analogy: 'Type constraints in a programming language — the compiler enforces them.', example: 'ConstraintNode { predicate: "peak(master) <= -1dBFS", enforcement: "hard" }', takeaway: 'Constraints are compiled to runtime checkers.', relatedConcepts: ['type-coercion', 'scope-resolution', 'goal'] },
  { nodeType: 'constraint', level: 'developer', text: 'ConstraintNode is produced by musical-constraints.ts. It carries a predicate AST and enforcement level.', analogy: 'A database CHECK constraint.', example: 'ConstraintNode { id: "c1", predicate: { op: "<=", lhs: "peak(master)", rhs: -1 }, enforcement: "hard" }', takeaway: 'See musical-constraints.ts and custom-constraints.ts.', relatedConcepts: ['goal', 'preference', 'opcode'] },

  // --- preference (5 levels) ---
  { nodeType: 'preference', level: 'beginner', text: 'A preference is something you would like — but it is OK if the system cannot fully achieve it.', analogy: 'Like asking for a window seat on a plane — nice to have, but not a dealbreaker.', example: '"I\'d like it a bit warmer" is a preference.', takeaway: 'Preferences are wishes, not demands.', relatedConcepts: ['constraint', 'goal'] },
  { nodeType: 'preference', level: 'intermediate', text: 'Preferences are soft targets. The system optimises for them but may compromise.', analogy: 'An EQ preference curve — the target shape, but the result might differ.', example: '"Prefer less compression on the vocals" — the system tries.', takeaway: 'Preferences can be overridden by constraints.', relatedConcepts: ['constraint', 'goal', 'modality'] },
  { nodeType: 'preference', level: 'advanced', text: 'Preferences are weighted soft constraints. They use hedging language detected by modality analysis.', analogy: 'A weighted mix bus — preferences blend according to their weights.', example: '"Ideally keep the reverb short, but it\'s not critical" — low-weight preference.', takeaway: 'Preference weight comes from hedging language.', relatedConcepts: ['modality', 'degree', 'constraint'] },
  { nodeType: 'preference', level: 'expert', text: 'Preferences are utility functions over the audio state. The planner maximises total utility subject to hard constraints.', analogy: 'A loss function in machine learning — guides optimisation but allows approximation.', example: 'PreferenceNode { utility: "warmth(mix) > 0.6", weight: 0.7 }', takeaway: 'Preferences are operationalised via the user vocabulary profile.', relatedConcepts: ['vocabulary-learning', 'goal', 'constraint'] },
  { nodeType: 'preference', level: 'developer', text: 'PreferenceNode from musical-preferences.ts. Carries a utility expression and weight.', analogy: 'CSS "!important" vs normal cascade — preferences have weights.', example: 'PreferenceNode { id: "p1", utility: { axis: "warmth", target: 0.7 }, weight: 0.6 }', takeaway: 'See musical-preferences.ts for extraction logic.', relatedConcepts: ['goal', 'constraint', 'amount'] },

  // --- scope (5 levels) ---
  { nodeType: 'scope', level: 'beginner', text: 'Scope says which part of the music is affected by your instruction.', analogy: 'Like highlighting text before pressing delete — scope is what you select.', example: '"In the chorus" sets the scope to the chorus section.', takeaway: 'Always think about what part of the song you mean.', relatedConcepts: ['selector', 'timeRange'] },
  { nodeType: 'scope', level: 'intermediate', text: 'Scope can be a time range, a track, a frequency band, or a combination.', analogy: 'Like selecting a region on multiple tracks in a DAW.', example: '"Brighten the high end of the vocals in the bridge" — combined scope.', takeaway: 'Scope can combine multiple dimensions.', relatedConcepts: ['selector', 'timeRange', 'ambiguity'] },
  { nodeType: 'scope', level: 'advanced', text: 'Scope resolution is one of the most common sources of ambiguity. Nested scopes compose intersectively.', analogy: 'A multi-band compressor — each band is a scope within the full signal.', example: '"Everything except the vocals" — complement scope.', takeaway: 'Scope can use set operations: union, intersection, complement.', relatedConcepts: ['scope-resolution', 'ambiguity', 'negation'] },
  { nodeType: 'scope', level: 'expert', text: 'ScopeNode represents a product of selector dimensions (track x time x frequency x spatial).', analogy: 'A tensor product of selection dimensions.', example: 'ScopeNode { track: "vocals", time: "chorus_1", freq: [2000, 20000] }', takeaway: 'Scopes are multi-dimensional selections with set algebra.', relatedConcepts: ['selector', 'timeRange', 'scope-resolution'] },
  { nodeType: 'scope', level: 'developer', text: 'ScopeNode is built by composition in the compositional pipeline.', analogy: 'SQL WHERE clause with multiple conditions.', example: 'ScopeNode { dimensions: [{ type: "track", value: "vocals" }, { type: "time", range: [32, 64] }] }', takeaway: 'Scope composition is in compositional-pipeline.ts.', relatedConcepts: ['selector', 'timeRange', 'composition'] },

  // --- timeRange (5 levels) ---
  { nodeType: 'timeRange', level: 'beginner', text: 'A time range says when in the song something should happen.', analogy: 'Like setting the start and end point of a loop.', example: '"From bar 16 to bar 32" is a time range.', takeaway: 'Time range = start point + end point.', relatedConcepts: ['scope', 'selector'] },
  { nodeType: 'timeRange', level: 'intermediate', text: 'Time ranges can be absolute, relative, or named sections.', analogy: 'Like setting loop markers or punch-in/punch-out points.', example: '"During the bridge" or "the first 30 seconds" are time ranges.', takeaway: 'Named sections resolve to bar ranges.', relatedConcepts: ['scope', 'selector', 'form'] },
  { nodeType: 'timeRange', level: 'advanced', text: 'TimeRangeNode supports absolute, named, relative, and set-operation time references.', analogy: 'Playlist regions in a DAW.', example: '"Every chorus" — union of all chorus time ranges.', takeaway: 'Time ranges can be computed dynamically.', relatedConcepts: ['scope', 'quantifier', 'form'] },
  { nodeType: 'timeRange', level: 'expert', text: 'TimeRangeNode carries an interval algebra representation with Allen interval relations.', analogy: 'Allen interval algebra from temporal reasoning.', example: 'TimeRangeNode { type: "named", section: "chorus", occurrence: "all" }', takeaway: 'Time range composition uses interval algebra.', relatedConcepts: ['scope', 'scope-resolution', 'form'] },
  { nodeType: 'timeRange', level: 'developer', text: 'TimeRangeNode is produced by time-expressions.ts grammar rules.', analogy: 'An interval type in a temporal database.', example: 'TimeRangeNode { id: "tr1", bars: [16, 32], resolution: "named:chorus_1" }', takeaway: 'See time-expressions.ts for parsing.', relatedConcepts: ['scope', 'selector', 'grammar-rule'] },

  // --- selector (5 levels) ---
  { nodeType: 'selector', level: 'beginner', text: 'A selector picks out which instrument or element you are talking about.', analogy: 'Like clicking on a track name in your DAW.', example: '"The vocals" or "the kick drum" are selectors.', takeaway: 'The selector answers: "which part of the mix?"', relatedConcepts: ['scope', 'timeRange'] },
  { nodeType: 'selector', level: 'intermediate', text: 'Selectors can target tracks by name, type, frequency, or position.', analogy: 'Like a send bus routing — selecting which signals to process.', example: '"All the synths" or "the high-frequency elements".', takeaway: 'Selectors can use categories, not just names.', relatedConcepts: ['scope', 'timeRange', 'quantifier'] },
  { nodeType: 'selector', level: 'advanced', text: 'SelectorNode supports direct, descriptive, quantified, and relative references.', analogy: 'CSS selectors for audio.', example: '"The loudest element" — relative selector requiring runtime evaluation.', takeaway: 'Some selectors need runtime analysis.', relatedConcepts: ['reference', 'quantifier', 'scope'] },
  { nodeType: 'selector', level: 'expert', text: 'SelectorNode is a typed expression evaluating to a set of audio regions.', analogy: 'XPath for audio structure.', example: 'SelectorNode { type: "property", property: "frequency", range: [20, 200] }', takeaway: 'Selectors compose into complex queries.', relatedConcepts: ['scope', 'reference', 'composition'] },
  { nodeType: 'selector', level: 'developer', text: 'SelectorNode is produced by reference-expressions.ts and edit-locality.ts.', analogy: 'A DOM querySelector().', example: 'SelectorNode { id: "s1", type: "name", value: "vocals" }', takeaway: 'See reference-expressions.ts.', relatedConcepts: ['scope', 'timeRange', 'reference-resolution'] },

  // --- amount (5 levels) ---
  { nodeType: 'amount', level: 'beginner', text: 'Amount says how much to change something.', analogy: 'Like turning a knob — how far do you turn it?', example: '"A bit louder" = small amount. "Way more reverb" = large.', takeaway: 'Amount = the size of the change.', relatedConcepts: ['modifier', 'degree'] },
  { nodeType: 'amount', level: 'intermediate', text: 'Amounts can be vague, relative, or absolute. Vague amounts are calibrated.', analogy: 'Like "a touch" vs "a lot" on a console.', example: '"Boost by 3dB" vs "make it a bit brighter".', takeaway: 'Vague amounts get calibrated from your vocabulary.', relatedConcepts: ['modifier', 'degree', 'vocabulary-learning'] },
  { nodeType: 'amount', level: 'advanced', text: 'AmountNode carries a numeric range with confidence from degree-semantics.', analogy: 'A fader throw with a dead zone.', example: '"Slightly" maps to [0.05, 0.15] on a 0-1 scale.', takeaway: 'Degree words map to numeric intervals.', relatedConcepts: ['degree', 'type-coercion', 'modifier'] },
  { nodeType: 'amount', level: 'expert', text: 'AmountNode is a scalar or vector quantity with units, range, and confidence.', analogy: 'A parametric control with range and curve type.', example: 'AmountNode { value: 3, unit: "dB", mode: "relative", confidence: 0.85 }', takeaway: 'Amounts carry units and ranges.', relatedConcepts: ['degree', 'modifier', 'type-coercion'] },
  { nodeType: 'amount', level: 'developer', text: 'AmountNode is produced by degree-to-cpl.ts and number-parser.ts.', analogy: 'A normalized float with metadata.', example: 'AmountNode { id: "a1", value: 0.2, unit: "normalized", confidence: 0.7 }', takeaway: 'See degree-to-cpl.ts and degree-semantics.ts.', relatedConcepts: ['degree', 'vocabulary-learning', 'type-coercion'] },

  // --- hole (5 levels) ---
  { nodeType: 'hole', level: 'beginner', text: 'A hole means the system needs more information from you.', analogy: 'Like a fill-in-the-blank question.', example: '"Make it louder" — hole: how much louder?', takeaway: 'Holes are blanks the system needs you to fill.', relatedConcepts: ['default-fill', 'ambiguity'] },
  { nodeType: 'hole', level: 'intermediate', text: 'Holes are missing parameters filled by defaults, context, or user input.', analogy: 'Optional plugin parameters.', example: '"Add reverb" — holes: decay time, pre-delay, wet/dry mix.', takeaway: 'Every hole has a default.', relatedConcepts: ['default-fill', 'preference', 'ambiguity'] },
  { nodeType: 'hole', level: 'advanced', text: 'HoleNode is a typed placeholder. Filling strategies: default, context, prompt, inference.', analogy: 'Template parameters in a preset.', example: 'HoleNode { expectedType: "scalar<dB>", filledBy: "default-fill" }', takeaway: 'Holes are typed.', relatedConcepts: ['default-fill', 'type-coercion', 'pragmatic-inference'] },
  { nodeType: 'hole', level: 'expert', text: 'Holes are prioritised by impact and confidence for filling order.', analogy: 'A metavariable in a proof.', example: 'HoleNode { expectedType: "Selector", impact: "high", defaultConfidence: 0.3 }', takeaway: 'High-impact, low-confidence holes trigger clarification.', relatedConcepts: ['ambiguity', 'default-fill', 'pragmatic-inference'] },
  { nodeType: 'hole', level: 'developer', text: 'HoleNode from compositional-pipeline.ts. The clarification system generates prompts.', analogy: 'A null value with type information.', example: 'HoleNode { id: "h1", expectedType: "Selector", parent: "intent-1" }', takeaway: 'See compositional-pipeline.ts.', relatedConcepts: ['default-fill', 'ambiguity', 'composition'] },

  // --- opcode (5 levels) ---
  { nodeType: 'opcode', level: 'beginner', text: 'An opcode is the specific audio operation performed — like "boost EQ" or "add reverb".', analogy: 'Like the name of a plugin effect.', example: '"Brighten" becomes "high-shelf EQ boost".', takeaway: 'Opcodes are the actual audio operations.', relatedConcepts: ['intent', 'goal', 'amount'] },
  { nodeType: 'opcode', level: 'intermediate', text: 'Opcodes map musical descriptions to concrete DSP operations.', analogy: 'Like a recipe step.', example: '"Punchier" becomes transient-enhance + parallel-compress.', takeaway: 'Musical descriptions decompose into technical operations.', relatedConcepts: ['intent', 'goal', 'type-coercion'] },
  { nodeType: 'opcode', level: 'advanced', text: 'OpcodeNode carries a DSP operation type, parameter map, and execution order.', analogy: 'Assembly instructions — the lowest level of the edit program.', example: 'OpcodeNode { op: "eq-shelf", params: { type: "high", gain: 3, freq: 8000 } }', takeaway: 'Frame matching selects opcodes from the registry.', relatedConcepts: ['frame-match', 'type-coercion', 'goal'] },
  { nodeType: 'opcode', level: 'expert', text: 'OpcodeNode is the terminal representation in the CPL-to-execution pipeline.', analogy: 'A microcode instruction with typed operands.', example: 'OpcodeNode { processor: "parametric-eq", params: { band: 3, gain: 3.0, freq: 8000 } }', takeaway: 'Opcodes are fully specified DSP operations.', relatedConcepts: ['frame-match', 'composition', 'amount'] },
  { nodeType: 'opcode', level: 'developer', text: 'OpcodeNode is emitted by frame-semantics.ts. The registry is in canon/edit-opcodes-*.ts.', analogy: 'A fully-qualified function call.', example: 'OpcodeNode { registryKey: "eq.shelf.high", params: { gain: 3 } }', takeaway: 'See frame-semantics.ts and the edit-opcode registry.', relatedConcepts: ['frame-match', 'goal', 'intent'] },

  // --- modifier (5 levels) ---
  { nodeType: 'modifier', level: 'beginner', text: 'A modifier adds detail to an instruction — words like "slightly", "very", or "more like jazz".', analogy: 'Like adding adjectives to a sentence.', example: '"Slightly brighter" — "slightly" is the modifier.', takeaway: 'Modifiers shape the edit.', relatedConcepts: ['amount', 'degree'] },
  { nodeType: 'modifier', level: 'intermediate', text: 'Modifiers adjust degree, style, or comparison. They interact with amount and type coercion.', analogy: 'Like a knob fine-tuning a parameter after the main fader is set.', example: '"Much more reverb, like a cathedral" — degree modifier + style comparison.', takeaway: 'Modifiers can stack and combine.', relatedConcepts: ['amount', 'comparison', 'metaphor'] },
  { nodeType: 'modifier', level: 'advanced', text: 'ModifierNode is a typed adjunct that composes with the head node via function application or intersection.', analogy: 'A sidechain input that shapes the main signal.', example: 'ModifierNode { type: "degree", value: 0.3, compositionMode: "scalar-multiply" }', takeaway: 'Modifier composition follows formal semantics rules.', relatedConcepts: ['composition', 'degree', 'type-coercion'] },
  { nodeType: 'modifier', level: 'expert', text: 'Modifiers are analysed by degree-semantics.ts and compositional-hooks.ts. They carry typing information for composition.', analogy: 'A transfer function applied to the control signal.', example: 'ModifierNode { type: "comparison", referent: "cathedral", dimension: "reverb-size" }', takeaway: 'Modifier typing determines composition strategy.', relatedConcepts: ['degree', 'composition', 'frame-match'] },
  { nodeType: 'modifier', level: 'developer', text: 'ModifierNode from compositional-hooks.ts. Degree modifiers go through degree-semantics.ts for scalar mapping.', analogy: 'A higher-order function wrapping a value.', example: 'ModifierNode { id: "m1", type: "degree", scalarValue: 0.3, source: "degree-mapping" }', takeaway: 'See compositional-hooks.ts and degree-semantics.ts.', relatedConcepts: ['degree', 'amount', 'composition'] },

  // --- reference (5 levels) ---
  { nodeType: 'reference', level: 'beginner', text: 'A reference points back to something mentioned earlier — like "it" or "that".', analogy: 'Like pointing at something across the room.', example: '"Make the bass louder. Now add reverb to it." — "it" refers to the bass.', takeaway: 'References avoid repeating yourself.', relatedConcepts: ['selector', 'scope'] },
  { nodeType: 'reference', level: 'intermediate', text: 'References can be pronouns ("it"), demonstratives ("that sound"), or descriptions ("the same one").', analogy: 'Like "ditto marks" in a table — they mean "same as above".', example: '"Edit the drums. Make them punchier." — "them" = the drums.', takeaway: 'The system tracks what you have mentioned recently.', relatedConcepts: ['selector', 'scope', 'ellipsis'] },
  { nodeType: 'reference', level: 'advanced', text: 'ReferenceNode tracks discourse entities. Resolution uses recency, salience, and type compatibility.', analogy: 'A name resolution scope in programming.', example: '"Brighten the synth. Now do the same to the pad." — "the same" is a reference to the action.', takeaway: 'References can point to actions, not just objects.', relatedConcepts: ['reference-resolution', 'selector', 'discourse'] },
  { nodeType: 'reference', level: 'expert', text: 'Reference resolution uses a discourse model with entity salience scores and type constraints.', analogy: 'Variable binding in a lambda calculus.', example: 'ReferenceNode { type: "pronoun", antecedentCandidates: ["bass", "drums"], selectedAntecedent: "bass" }', takeaway: 'The discourse model maintains a salience-ranked entity list.', relatedConcepts: ['reference-resolution', 'pragmatic-inference', 'selector'] },
  { nodeType: 'reference', level: 'developer', text: 'ReferenceNode from reference-expressions.ts. Resolution in compositional-pipeline.ts against discourse state.', analogy: 'A pointer dereference.', example: 'ReferenceNode { id: "r1", type: "pronoun", form: "it", resolved: "bass_track" }', takeaway: 'See reference-expressions.ts.', relatedConcepts: ['selector', 'reference-resolution', 'composition'] },

  // --- literal (5 levels) ---
  { nodeType: 'literal', level: 'beginner', text: 'A literal is an exact value you specified — like "120 BPM" or "3dB".', analogy: 'Like typing a number into a field instead of using a slider.', example: '"Set the tempo to 120" — 120 is a literal.', takeaway: 'Literals are exact, no guessing needed.', relatedConcepts: ['amount', 'constraint'] },
  { nodeType: 'literal', level: 'intermediate', text: 'Literals have units (dB, Hz, BPM, ms) and are parsed by the number-parser.', analogy: 'Like entering "3:30" for song length vs "about 3 and a half minutes".', example: '"Cut 5dB at 200Hz" — two literals: 5dB and 200Hz.', takeaway: 'Literals are unambiguous.', relatedConcepts: ['amount', 'constraint', 'opcode'] },
  { nodeType: 'literal', level: 'advanced', text: 'LiteralNode carries value, unit, and precision. It bypasses degree-semantics entirely.', analogy: 'A fixed-point constant vs a floating-point estimate.', example: 'LiteralNode { value: 120, unit: "BPM", precision: "exact" }', takeaway: 'Literals bypass vague-amount processing.', relatedConcepts: ['amount', 'type-coercion', 'constraint'] },
  { nodeType: 'literal', level: 'expert', text: 'LiteralNode is strongly typed with unit algebra. Unit conversion is automatic (e.g. ms to samples).', analogy: 'A dimensioned quantity in physics with unit tracking.', example: 'LiteralNode { value: 50, unit: "ms", convertedValue: 2205, convertedUnit: "samples" }', takeaway: 'Units are tracked and converted automatically.', relatedConcepts: ['amount', 'type-coercion', 'opcode'] },
  { nodeType: 'literal', level: 'developer', text: 'LiteralNode from number-parser.ts and unit-parser.ts. Units are in the canon unit registry.', analogy: 'A typed constant with unit metadata.', example: 'LiteralNode { id: "l1", value: 120, unit: "BPM", parser: "number-parser" }', takeaway: 'See number-parser.ts and unit-parser.ts.', relatedConcepts: ['amount', 'constraint', 'opcode'] },

  // --- group (5 levels) ---
  { nodeType: 'group', level: 'beginner', text: 'A group bundles multiple edits together as one logical change.', analogy: 'Like selecting multiple tracks and moving them all at once.', example: '"Make the verse louder and add reverb" — a group of two edits.', takeaway: 'Groups keep related changes together.', relatedConcepts: ['intent', 'scope'] },
  { nodeType: 'group', level: 'intermediate', text: 'Groups can be sequential (do A then B), parallel (do A and B together), or conditional.', analogy: 'Like a macro that runs multiple effects in order.', example: '"First boost the bass, then add compression" — sequential group.', takeaway: 'Groups have order: sequential or parallel.', relatedConcepts: ['intent', 'scope', 'coordination'] },
  { nodeType: 'group', level: 'advanced', text: 'GroupNode represents discourse-level coordination. It tracks ordering, shared scope, and shared constraints.', analogy: 'An effects chain with series and parallel routing.', example: 'GroupNode { type: "sequential", children: [intent1, intent2], sharedScope: "verse" }', takeaway: 'Groups can share scope and constraints across children.', relatedConcepts: ['coordination', 'scope', 'constraint'] },
  { nodeType: 'group', level: 'expert', text: 'GroupNode is produced by discourse-operators.ts. It handles coordination, sequencing, and conditional branching.', analogy: 'A control flow graph with blocks and edges.', example: 'GroupNode { type: "conditional", condition: "if possible", then: intent1, else: intent2 }', takeaway: 'Groups support conditional and iterative patterns.', relatedConcepts: ['discourse', 'coordination', 'modality'] },
  { nodeType: 'group', level: 'developer', text: 'GroupNode from discourse-operators.ts and coordination.ts grammar module.', analogy: 'An AST block statement with child statements.', example: 'GroupNode { id: "grp1", type: "sequential", children: ["i1", "i2"], source: "coordination" }', takeaway: 'See discourse-operators.ts and coordination.ts.', relatedConcepts: ['coordination', 'discourse', 'composition'] },
] as const;

// ---------------------------------------------------------------------------
// 200 — Quiz Question Templates (20+)
// ---------------------------------------------------------------------------

export const QUIZ_QUESTION_TEMPLATES: readonly TeachModeQuizQuestion[] = [
  { id: 'Q001', question: 'What does a "goal" node represent in CPL?', options: ['A specific audio operation', 'The overall sound you are going for', 'A time range in the song', 'An instrument selector'], correctIndex: 1, explanation: 'A goal is the big-picture musical target.', concept: 'goal', nodeType: 'goal', level: 'beginner' },
  { id: 'Q002', question: 'What is the difference between a constraint and a preference?', options: ['Constraints are hard rules; preferences are soft wishes', 'Preferences are more important', 'There is no difference', 'Constraints apply to timing only'], correctIndex: 0, explanation: 'Constraints must be satisfied; preferences are best-effort.', concept: 'constraint', nodeType: 'constraint', level: 'beginner' },
  { id: 'Q003', question: 'What does "scope" determine?', options: ['How loud the change is', 'Which part of the music is affected', 'When to save the project', 'The genre of the music'], correctIndex: 1, explanation: 'Scope determines which tracks, sections, or frequency ranges are targeted.', concept: 'scope', nodeType: 'scope', level: 'beginner' },
  { id: 'Q004', question: 'What is a "hole" in the CPL tree?', options: ['A gap in the audio', 'A missing piece of information', 'An error in the tree', 'A placeholder for silence'], correctIndex: 1, explanation: 'Holes represent missing parameters that need filling.', concept: 'hole', nodeType: 'hole', level: 'beginner' },
  { id: 'Q005', question: 'If you say "make the vocals brighter", what is the selector?', options: ['make', 'brighter', 'the vocals', 'it'], correctIndex: 2, explanation: '"The vocals" picks which element to modify.', concept: 'selector', nodeType: 'selector', level: 'beginner' },
  { id: 'Q006', question: 'What does "amount" specify?', options: ['The cost', 'How much to change a parameter', 'The number of tracks', 'The song length'], correctIndex: 1, explanation: 'Amount is the magnitude of the change.', concept: 'amount', nodeType: 'amount', level: 'beginner' },
  { id: 'Q007', question: 'In "add reverb to the bridge", what is the time range?', options: ['add', 'reverb', 'the bridge', 'to'], correctIndex: 2, explanation: '"The bridge" defines when the reverb should apply.', concept: 'timeRange', nodeType: 'timeRange', level: 'beginner' },
  { id: 'Q008', question: 'What is type coercion in the CPL pipeline?', options: ['Converting audio formats', 'Translating a descriptive word into a numeric parameter', 'Forcing the user to pick an option', 'Compressing audio'], correctIndex: 1, explanation: 'Type coercion maps descriptions like "warm" to audio parameters.', concept: 'type-coercion', nodeType: 'modifier', level: 'intermediate' },
  { id: 'Q009', question: 'What is pragmatic inference?', options: ['A type of reverb', 'Reading between the lines', 'A compression technique', 'A mixing console'], correctIndex: 1, explanation: 'Pragmatic inference detects implied meanings.', concept: 'pragmatic-inference', nodeType: 'intent', level: 'intermediate' },
  { id: 'Q010', question: 'When "dark" is used as a metaphor for timbre, what rule resolves it?', options: ['Grammar rule', 'Metaphor resolution', 'Quantifier scoping', 'Reference resolution'], correctIndex: 1, explanation: 'Metaphor resolution maps figurative language to audio parameters.', concept: 'metaphor-resolution', nodeType: 'modifier', level: 'intermediate' },
  { id: 'Q011', question: 'What does "composition" mean in CPL semantics?', options: ['Writing a song', 'Combining pieces of meaning into one structure', 'Compressing audio', 'A genre'], correctIndex: 1, explanation: 'Composition combines words like "bright" + "vocals" + "chorus" into one instruction.', concept: 'composition', nodeType: 'group', level: 'intermediate' },
  { id: 'Q012', question: 'What is a frame match?', options: ['Matching a video frame', 'Recognising a common instruction pattern', 'Aligning clips', 'A type of compression'], correctIndex: 1, explanation: 'Frame matching recognises patterns like "make X more Y".', concept: 'frame-match', nodeType: 'opcode', level: 'intermediate' },
  { id: 'Q013', question: 'How does default-fill work?', options: ['It adds silence', 'It fills missing parameters with sensible defaults', 'It copies from another track', 'It deletes empty regions'], correctIndex: 1, explanation: 'Default-fill provides reasonable values for omitted details.', concept: 'default-fill', nodeType: 'hole', level: 'intermediate' },
  { id: 'Q014', question: 'What does "provenance" tell you about a CPL node?', options: ['Its audio quality', 'Where it came from (source words + rules)', 'Its volume level', 'When it was created'], correctIndex: 1, explanation: 'Provenance traces each node to its source words and rules.', concept: 'provenance', nodeType: 'intent', level: 'advanced' },
  { id: 'Q015', question: 'What happens when two constraints conflict?', options: ['System crashes', 'System picks randomly', 'System asks the user which to relax', 'Both are ignored'], correctIndex: 2, explanation: 'The system presents the conflict and asks for user guidance.', concept: 'constraint', nodeType: 'constraint', level: 'advanced' },
  { id: 'Q016', question: 'What is scope algebra?', options: ['A math course', 'Set operations on scope selections', 'A reverb algorithm', 'An EQ technique'], correctIndex: 1, explanation: 'Scope algebra uses union, intersection, and complement on selections.', concept: 'scope-resolution', nodeType: 'scope', level: 'advanced' },
  { id: 'Q017', question: 'How are vague amounts like "a bit" calibrated?', options: ['They are always 3dB', 'From the user vocabulary profile', 'They are ignored', 'From the BPM'], correctIndex: 1, explanation: 'The system learns your vocabulary to calibrate vague amounts.', concept: 'vocabulary-learning', nodeType: 'amount', level: 'advanced' },
  { id: 'Q018', question: 'What is ellipsis resolution?', options: ['Deleting audio', 'Recovering omitted words', 'A reverb tail', 'Noise reduction'], correctIndex: 1, explanation: 'Ellipsis resolution fills in words the user left out.', concept: 'ellipsis-resolution', nodeType: 'hole', level: 'advanced' },
  { id: 'Q019', question: 'What converts goals to opcodes in the pipeline?', options: ['The lexicon', 'The planner using frame decomposition', 'The reverb engine', 'The master bus'], correctIndex: 1, explanation: 'The planner decomposes goals into operation sequences.', concept: 'goal', nodeType: 'goal', level: 'expert' },
  { id: 'Q020', question: 'What is the role of modality analysis?', options: ['Analysing major/minor modes', 'Distinguishing commands, wishes, and questions', 'Measuring loudness', 'Selecting output format'], correctIndex: 1, explanation: 'Modality analysis detects whether the user is commanding, wishing, or asking.', concept: 'modality', nodeType: 'intent', level: 'expert' },
  { id: 'Q021', question: 'What is presupposition accommodation?', options: ['Accepting an implicit assumption', 'Adjusting the bass', 'Sidechain compression', 'Speaker placement'], correctIndex: 0, explanation: 'It accepts unstated assumptions into the context.', concept: 'presupposition-accommodation', nodeType: 'modifier', level: 'expert' },
  { id: 'Q022', question: 'What does the confidence bottleneck indicate?', options: ['The loudest point', 'The weakest step in the derivation', 'The fastest CPU core', 'The most popular track'], correctIndex: 1, explanation: 'The bottleneck is the least confident step in the interpretation chain.', concept: 'provenance', nodeType: 'intent', level: 'expert' },
] as const;

// ---------------------------------------------------------------------------
// 200 — Functions
// ---------------------------------------------------------------------------

/** Create a new teach-mode session. */
export function createTeachSession(level: ExplanationLevel): TeachModeSession {
  return {
    id: `ts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startTime: Date.now(),
    currentLevel: level,
    explainedNodeTypes: [],
    explainedConcepts: [],
    quizHistory: [],
    explanationCount: 0,
    quizCount: 0,
    correctAnswers: 0,
    totalAnswered: 0,
  };
}

/** Explain a CPL node at the session's current level. */
export function explainNode(
  nodeType: CPLNodeType,
  session: TeachModeSession,
): { readonly explanation: SemanticExplanation | null; readonly updatedSession: TeachModeSession } {
  const explanation = EXPLANATION_DATABASE.find(
    e => e.nodeType === nodeType && e.level === session.currentLevel,
  );

  if (explanation === undefined) {
    return { explanation: null, updatedSession: session };
  }

  const updatedSession: TeachModeSession = {
    ...session,
    explainedNodeTypes: session.explainedNodeTypes.includes(nodeType)
      ? session.explainedNodeTypes
      : [...session.explainedNodeTypes, nodeType],
    explainedConcepts: session.explainedConcepts.includes(nodeType)
      ? session.explainedConcepts
      : [...session.explainedConcepts, nodeType],
    explanationCount: session.explanationCount + 1,
  };

  return { explanation, updatedSession };
}

/** Get a musical analogy for a concept. */
export function getMusicalAnalogy(
  concept: string,
  level: ExplanationLevel,
): MusicalAnalogy | null {
  for (const analogy of MUSICAL_ANALOGIES) {
    if (analogy.concept === concept && analogy.levels.includes(level)) {
      return analogy;
    }
  }
  // Fallback: any level
  for (const analogy of MUSICAL_ANALOGIES) {
    if (analogy.concept === concept) {
      return analogy;
    }
  }
  return null;
}

/** Generate a quiz for the current session. */
export function generateQuiz(
  session: TeachModeSession,
  questionCount: number,
): readonly TeachModeQuizQuestion[] {
  const levelInfo = EXPLANATION_LEVEL_INFO[session.currentLevel];
  const levelOrder = levelInfo.order;

  // Filter questions at or below the current level
  const eligible = QUIZ_QUESTION_TEMPLATES.filter(q => {
    const qLevelInfo = EXPLANATION_LEVEL_INFO[q.level];
    return qLevelInfo.order <= levelOrder;
  });

  // Prefer questions about explained concepts
  const explained = new Set(session.explainedConcepts);
  const preferred = eligible.filter(q => explained.has(q.concept) || explained.has(q.nodeType));
  const fallback = eligible.filter(q => !explained.has(q.concept) && !explained.has(q.nodeType));

  // Exclude already asked
  const alreadyAsked = new Set(session.quizHistory.map(h => h.questionId));
  const preferredNew = preferred.filter(q => !alreadyAsked.has(q.id));
  const fallbackNew = fallback.filter(q => !alreadyAsked.has(q.id));

  const pool = [...preferredNew, ...fallbackNew];
  const selected: TeachModeQuizQuestion[] = [];
  const count = Math.min(questionCount, pool.length);

  // Simple shuffle-and-take
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    const swp = shuffled[j];
    if (tmp !== undefined && swp !== undefined) {
      shuffled[i] = swp;
      shuffled[j] = tmp;
    }
  }

  for (let i = 0; i < count; i++) {
    const q = shuffled[i];
    if (q !== undefined) {
      selected.push(q);
    }
  }

  return selected;
}

/** Check a quiz answer and update the session. */
export function checkAnswer(
  session: TeachModeSession,
  questionId: string,
  selectedIndex: number,
): { readonly correct: boolean; readonly explanation: string; readonly updatedSession: TeachModeSession } {
  const question = QUIZ_QUESTION_TEMPLATES.find(q => q.id === questionId);
  if (question === undefined) {
    return { correct: false, explanation: 'Question not found.', updatedSession: session };
  }

  const correct = selectedIndex === question.correctIndex;

  const updatedSession: TeachModeSession = {
    ...session,
    quizHistory: [
      ...session.quizHistory,
      { questionId, selectedIndex, correct, timestamp: Date.now() },
    ],
    quizCount: session.quizCount + 1,
    correctAnswers: session.correctAnswers + (correct ? 1 : 0),
    totalAnswered: session.totalAnswered + 1,
  };

  return {
    correct,
    explanation: question.explanation,
    updatedSession,
  };
}

/** Get the explanation for a specific node type at a specific level. */
export function getExplanationForLevel(
  nodeType: CPLNodeType,
  level: ExplanationLevel,
): SemanticExplanation | null {
  const found = EXPLANATION_DATABASE.find(
    e => e.nodeType === nodeType && e.level === level,
  );
  return found ?? null;
}

/** Advance the session to the next level if quiz performance warrants it. */
export function advanceLevel(
  session: TeachModeSession,
  threshold: number,
): TeachModeSession {
  if (session.totalAnswered === 0) return session;
  const score = session.correctAnswers / session.totalAnswered;
  if (score < threshold) return session;

  const currentOrder = EXPLANATION_LEVEL_INFO[session.currentLevel].order;
  const levels: ExplanationLevel[] = ['beginner', 'intermediate', 'advanced', 'expert', 'developer'];
  const nextLevel = levels.find(l => EXPLANATION_LEVEL_INFO[l].order === currentOrder + 1);

  if (nextLevel === undefined) return session; // already at max

  return {
    ...session,
    currentLevel: nextLevel,
    correctAnswers: 0,
    totalAnswered: 0,
  };
}

/** Get session progress metrics. */
export function getSessionProgress(
  session: TeachModeSession,
): {
  readonly level: ExplanationLevel;
  readonly explanationsGiven: number;
  readonly quizzesTaken: number;
  readonly accuracy: number;
  readonly conceptsCovered: number;
  readonly totalConcepts: number;
} {
  return {
    level: session.currentLevel,
    explanationsGiven: session.explanationCount,
    quizzesTaken: session.quizCount,
    accuracy: session.totalAnswered > 0 ? session.correctAnswers / session.totalAnswered : 0,
    conceptsCovered: session.explainedConcepts.length,
    totalConcepts: EXPLAINED_NODE_TYPES.length,
  };
}

/** Format a semantic explanation as a text block. */
export function formatExplanation(
  explanation: SemanticExplanation,
): string {
  const lines: string[] = [];
  lines.push(`--- ${explanation.nodeType.toUpperCase()} (${explanation.level}) ---`);
  lines.push('');
  lines.push(explanation.text);
  lines.push('');
  lines.push(`Musical analogy: ${explanation.analogy}`);
  lines.push(`Example: ${explanation.example}`);
  lines.push('');
  lines.push(`Key takeaway: ${explanation.takeaway}`);
  if (explanation.relatedConcepts.length > 0) {
    lines.push(`Related concepts: ${explanation.relatedConcepts.join(', ')}`);
  }
  return lines.join('\n');
}

/** Suggest the next topic to explain based on what has not been covered. */
export function suggestNextTopic(
  session: TeachModeSession,
): CPLNodeType | null {
  const explained = new Set(session.explainedNodeTypes);
  for (const nt of EXPLAINED_NODE_TYPES) {
    if (!explained.has(nt)) return nt;
  }
  return null;
}

/** Get the completion percentage for the current level. */
export function getCompletionPercentage(
  session: TeachModeSession,
): number {
  const total = EXPLAINED_NODE_TYPES.length;
  if (total === 0) return 100;
  const covered = session.explainedNodeTypes.length;
  return Math.round((covered / total) * 100);
}

/** Reset the session to start fresh. */
export function resetSession(
  session: TeachModeSession,
  level?: ExplanationLevel,
): TeachModeSession {
  return {
    ...session,
    currentLevel: level ?? session.currentLevel,
    explainedNodeTypes: [],
    explainedConcepts: [],
    quizHistory: [],
    explanationCount: 0,
    quizCount: 0,
    correctAnswers: 0,
    totalAnswered: 0,
  };
}

/** Export the session log as a portable object. */
export function exportSessionLog(
  session: TeachModeSession,
): {
  readonly sessionId: string;
  readonly level: ExplanationLevel;
  readonly explanationsGiven: number;
  readonly quizResults: readonly { readonly questionId: string; readonly correct: boolean }[];
  readonly accuracy: number;
  readonly durationMs: number;
} {
  return {
    sessionId: session.id,
    level: session.currentLevel,
    explanationsGiven: session.explanationCount,
    quizResults: session.quizHistory.map(h => ({
      questionId: h.questionId,
      correct: h.correct,
    })),
    accuracy: session.totalAnswered > 0 ? session.correctAnswers / session.totalAnswered : 0,
    durationMs: Date.now() - session.startTime,
  };
}

/** Create a default teach-mode configuration. */
export function createDefaultTeachModeConfig(): TeachModeConfig {
  return {
    level: 'beginner',
    autoAdvance: true,
    advanceThreshold: 0.8,
    showAnalogies: true,
    showExamples: true,
    offerQuizzes: true,
    explanationsBeforeQuiz: 5,
    trackProgress: true,
  };
}
