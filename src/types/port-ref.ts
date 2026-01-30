/**
 * @fileoverview Port Reference Types
 *
 * Defines types for referring to ports across the system.
 * 
 * Change 220 from to_fix_repo_plan_500.md
 *
 * @module @cardplay/types/port-ref
 */

import type { CanonicalPortType } from '../canon/port-types';

/**
 * Reference to a port on a card or deck.
 * 
 * Used consistently across UI, routing, and serialization.
 */
export interface PortRef {
  /** Card or module ID that owns this port */
  ownerId: string;
  
  /** Port identifier (unique within owner) */
  portId: string;
  
  /** Port type (canonical or namespaced) */
  type: CanonicalPortType | string;
  
  /** Port direction */
  direction: 'input' | 'output';
}

/**
 * Connection identifier (stable across renames).
 * 
 * Change 222 from to_fix_repo_plan_500.md
 */
export type ConnectionId = string & { readonly __brand: 'ConnectionId' };

/**
 * Creates a ConnectionId from source and target port refs.
 * 
 * Generates a stable ID by ordering source→target canonically.
 */
export function createConnectionId(source: PortRef, target: PortRef): ConnectionId {
  const sourceStr = `${source.ownerId}:${source.portId}`;
  const targetStr = `${target.ownerId}:${target.portId}`;
  return `${sourceStr}→${targetStr}` as ConnectionId;
}

/**
 * Parses a ConnectionId back into source and target identifiers.
 */
export function parseConnectionId(id: ConnectionId): { source: string; target: string } {
  const [source, target] = id.split('→');
  if (!source || !target) {
    throw new Error(`Invalid ConnectionId format: ${id}`);
  }
  return { source, target };
}
