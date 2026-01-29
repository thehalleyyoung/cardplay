/**
 * @fileoverview Layout Runtime Types
 *
 * Runtime representation of board layouts (persisted state).
 *
 * B090-B092: Define layout runtime types.
 *
 * @module @cardplay/boards/layout/runtime-types
 */

import type { PanelPosition } from '../types';

// ============================================================================
// LAYOUT RUNTIME
// ============================================================================

/**
 * Panel size in pixels or percentage.
 */
export type PanelSize = number | string;

/**
 * Dock tree node type.
 */
export type DockNodeType = 'leaf' | 'split-horizontal' | 'split-vertical';

/**
 * Runtime state for a single panel (leaf node).
 *
 * B092: Include panel sizes, collapsed states, active tab IDs.
 */
export interface PanelRuntime {
  /** Panel ID */
  id: string;

  /** Panel position hint */
  position: PanelPosition;

  /** Panel size (width or height depending on parent split) */
  size: PanelSize;

  /** Whether panel is collapsed */
  collapsed: boolean;

  /** Active tab ID (for tabbed panels) */
  activeTabId: string | null;

  /** Tab order (deck IDs) */
  tabOrder: readonly string[];

  /** Scroll position (for scrollable panels) */
  scrollTop: number;
  scrollLeft: number;

  /** Whether panel is visible */
  visible: boolean;
}

/**
 * Runtime state for a split container node.
 *
 * B091: Dock tree nodes compatible with ui/layout.ts structures.
 */
export interface SplitNodeRuntime {
  /** Node type */
  type: 'split-horizontal' | 'split-vertical';

  /** Child nodes */
  children: readonly DockNodeRuntime[];

  /** Split ratio (0-1 for first child) */
  ratio: number;
}

/**
 * Runtime state for a dock tree node (recursive).
 */
export type DockNodeRuntime = PanelRuntime | SplitNodeRuntime;

/**
 * Complete layout runtime for a board.
 */
export interface BoardLayoutRuntime {
  /** Root dock node */
  root: DockNodeRuntime;

  /** Panel runtimes by ID (flat map for quick access) */
  panels: ReadonlyMap<string, PanelRuntime>;

  /** Layout timestamp (last update) */
  timestamp: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for PanelRuntime.
 */
export function isPanelRuntime(node: DockNodeRuntime): node is PanelRuntime {
  return 'id' in node && 'position' in node;
}

/**
 * Type guard for SplitNodeRuntime.
 */
export function isSplitNodeRuntime(node: DockNodeRuntime): node is SplitNodeRuntime {
  return 'type' in node && ('split-horizontal' === node.type || 'split-vertical' === node.type);
}
