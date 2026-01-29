/**
 * @fileoverview Layout Guards
 *
 * Type guards and validators for persisted layout shapes.
 *
 * B098: Validate persisted layout shapes.
 *
 * @module @cardplay/boards/layout/guards
 */

import type { SerializedLayoutRuntime, SerializedDockNode } from './serialize';

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates a serialized layout runtime.
 *
 * @param value Value to validate
 * @returns true if valid
 */
export function isValidSerializedLayout(value: unknown): value is SerializedLayoutRuntime {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check root
  if (!obj.root || typeof obj.root !== 'object') {
    return false;
  }

  // Check panels
  if (!obj.panels || typeof obj.panels !== 'object') {
    return false;
  }

  // Check timestamp
  if (typeof obj.timestamp !== 'number') {
    return false;
  }

  // Validate root node structure
  if (!isValidDockNode(obj.root)) {
    return false;
  }

  // Validate panels
  const panels = obj.panels as Record<string, unknown>;
  for (const panel of Object.values(panels)) {
    if (!isValidPanel(panel)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a dock node (recursive).
 */
function isValidDockNode(node: unknown): node is SerializedDockNode {
  if (!node || typeof node !== 'object') {
    return false;
  }

  const obj = node as Record<string, unknown>;

  // Check if it's a panel node
  if ('id' in obj && typeof obj.id === 'string') {
    return isValidPanel(obj);
  }

  // Check if it's a split node
  if ('type' in obj && typeof obj.type === 'string') {
    return isValidSplitNode(obj);
  }

  return false;
}

/**
 * Validates a panel node.
 */
function isValidPanel(panel: unknown): boolean {
  if (!panel || typeof panel !== 'object') {
    return false;
  }

  const obj = panel as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.position === 'string' &&
    (typeof obj.size === 'number' || typeof obj.size === 'string') &&
    typeof obj.collapsed === 'boolean' &&
    (obj.activeTabId === null || typeof obj.activeTabId === 'string') &&
    Array.isArray(obj.tabOrder) &&
    typeof obj.scrollTop === 'number' &&
    typeof obj.scrollLeft === 'number' &&
    typeof obj.visible === 'boolean'
  );
}

/**
 * Validates a split node.
 */
function isValidSplitNode(node: unknown): boolean {
  if (!node || typeof node !== 'object') {
    return false;
  }

  const obj = node as Record<string, unknown>;

  if (
    typeof obj.type !== 'string' ||
    (obj.type !== 'split-horizontal' && obj.type !== 'split-vertical')
  ) {
    return false;
  }

  if (!Array.isArray(obj.children)) {
    return false;
  }

  // Validate all children
  for (const child of obj.children) {
    if (!isValidDockNode(child)) {
      return false;
    }
  }

  if (typeof obj.ratio !== 'number') {
    return false;
  }

  return true;
}

/**
 * Sanitizes a serialized layout (fills in defaults for missing fields).
 */
export function sanitizeSerializedLayout(
  layout: SerializedLayoutRuntime
): SerializedLayoutRuntime {
  // For now, just return as-is
  // Future: could add default values for missing optional fields
  return layout;
}
