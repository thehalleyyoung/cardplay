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

  function walk(node: CPLTreeNode, depth: number, prefix: string): void {
    if (depth > effectiveMaxDepth) return;
    if (!filterAll && !visibleSet.has(node.nodeType)) return;

    const indent = prefix;
    const tag = formatNodeLabel(node, config);
    const confStr = config.showConfidence
      ? ` [${(node.confidence * 100).toFixed(0)}%]`
      : '';
    const idStr = config.showNodeIds ? ` (${node.id})` : '';
    lines.push(`${indent}${tag}${confStr}${idStr}`);

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child === undefined) continue;
      const isLast = i === node.children.length - 1;
      const connector = isLast ? '└─ ' : '├─ ';
      const nextPrefix = prefix + (isLast ? '   ' : '│  ');
      walk(child, depth + 1, indent + connector);
      // Fix: use nextPrefix for grandchildren by re-calling walk properly
      // Actually the recursive call above already passes the right prefix via indent + connector
      // For children we need to use nextPrefix; let's restructure:
      void nextPrefix; // consumed below
    }
  }

  // Re-implement walk cleanly:
  lines.length = 0;
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
