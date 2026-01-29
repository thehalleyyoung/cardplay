/**
 * @fileoverview Layout Serialization
 *
 * Serializes layout runtime to storage-safe format.
 *
 * B096: Implement layout serialization.
 *
 * @module @cardplay/boards/layout/serialize
 */

import type {
  BoardLayoutRuntime,
  DockNodeRuntime,
} from './runtime-types';
import { isPanelRuntime } from './runtime-types';

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serializable layout runtime (no functions, no DOM refs).
 */
export interface SerializedLayoutRuntime {
  root: SerializedDockNode;
  panels: Record<string, SerializedPanel>;
  timestamp: number;
}

/**
 * Serialized panel runtime.
 */
export interface SerializedPanel {
  id: string;
  position: string;
  size: number | string;
  collapsed: boolean;
  activeTabId: string | null;
  tabOrder: string[];
  scrollTop: number;
  scrollLeft: number;
  visible: boolean;
}

/**
 * Serialized dock node (recursive).
 */
export type SerializedDockNode = SerializedPanel | SerializedSplitNode;

/**
 * Serialized split node.
 */
export interface SerializedSplitNode {
  type: 'split-horizontal' | 'split-vertical';
  children: SerializedDockNode[];
  ratio: number;
}

/**
 * Serializes layout runtime to storage-safe format.
 *
 * @param runtime Layout runtime
 * @returns Serialized layout
 */
export function serializeLayoutRuntime(
  runtime: BoardLayoutRuntime
): SerializedLayoutRuntime {
  const panels: Record<string, SerializedPanel> = {};

  runtime.panels.forEach((panel, id) => {
    panels[id] = {
      id: panel.id,
      position: panel.position,
      size: panel.size,
      collapsed: panel.collapsed,
      activeTabId: panel.activeTabId,
      tabOrder: [...panel.tabOrder],
      scrollTop: panel.scrollTop,
      scrollLeft: panel.scrollLeft,
      visible: panel.visible,
    };
  });

  return {
    root: serializeDockNode(runtime.root),
    panels,
    timestamp: runtime.timestamp,
  };
}

/**
 * Serializes a dock node (recursive).
 */
function serializeDockNode(node: DockNodeRuntime): SerializedDockNode {
  if (isPanelRuntime(node)) {
    return {
      id: node.id,
      position: node.position,
      size: node.size,
      collapsed: node.collapsed,
      activeTabId: node.activeTabId,
      tabOrder: [...node.tabOrder],
      scrollTop: node.scrollTop,
      scrollLeft: node.scrollLeft,
      visible: node.visible,
    };
  } else {
    return {
      type: node.type,
      children: node.children.map(serializeDockNode),
      ratio: node.ratio,
    };
  }
}

/**
 * Converts serialized layout to JSON string.
 */
export function layoutRuntimeToJSON(runtime: BoardLayoutRuntime): string {
  const serialized = serializeLayoutRuntime(runtime);
  return JSON.stringify(serialized, null, 2);
}
