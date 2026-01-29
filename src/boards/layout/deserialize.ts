/**
 * @fileoverview Layout Deserialization
 *
 * Deserializes layout runtime from storage.
 *
 * B097: Implement layout deserialization.
 *
 * @module @cardplay/boards/layout/deserialize
 */

import type {
  BoardLayoutRuntime,
  DockNodeRuntime,
  PanelRuntime,
  SplitNodeRuntime,
  PanelSize,
} from './runtime-types';
import type {
  SerializedLayoutRuntime,
  SerializedDockNode,
  SerializedPanel,
  SerializedSplitNode,
} from './serialize';
import type { PanelPosition } from '../types';

// ============================================================================
// DESERIALIZATION
// ============================================================================

/**
 * Deserializes layout runtime from storage.
 *
 * @param serialized Serialized layout
 * @returns Layout runtime with defaults
 */
export function deserializeLayoutRuntime(
  serialized: SerializedLayoutRuntime
): BoardLayoutRuntime {
  const panels = new Map<string, PanelRuntime>();

  // Deserialize panels
  Object.entries(serialized.panels).forEach(([id, panel]) => {
    panels.set(id, deserializePanel(panel));
  });

  // Deserialize root
  const root = deserializeDockNode(serialized.root);

  return {
    root,
    panels,
    timestamp: serialized.timestamp || Date.now(),
  };
}

/**
 * Deserializes a panel runtime.
 */
function deserializePanel(panel: SerializedPanel): PanelRuntime {
  return {
    id: panel.id,
    position: panel.position as PanelPosition,
    size: panel.size as PanelSize,
    collapsed: panel.collapsed,
    activeTabId: panel.activeTabId,
    tabOrder: [...panel.tabOrder],
    scrollTop: panel.scrollTop,
    scrollLeft: panel.scrollLeft,
    visible: panel.visible,
  };
}

/**
 * Deserializes a dock node (recursive).
 */
function deserializeDockNode(node: SerializedDockNode): DockNodeRuntime {
  if ('id' in node) {
    // Panel node
    return deserializePanel(node);
  } else {
    // Split node
    return deserializeSplitNode(node);
  }
}

/**
 * Deserializes a split node.
 */
function deserializeSplitNode(node: SerializedSplitNode): SplitNodeRuntime {
  return {
    type: node.type,
    children: node.children.map(deserializeDockNode),
    ratio: node.ratio,
  };
}

/**
 * Parses JSON string to layout runtime.
 */
export function layoutRuntimeFromJSON(json: string): BoardLayoutRuntime | null {
  try {
    const parsed = JSON.parse(json);
    return deserializeLayoutRuntime(parsed);
  } catch (error) {
    console.error('Failed to parse layout runtime JSON:', error);
    return null;
  }
}
