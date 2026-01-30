/**
 * @fileoverview Canonical Port Types
 * 
 * Defines canonical builtin port types exactly as specified in
 * `cardplay/docs/canon/port-vocabulary.md`.
 * 
 * @module @cardplay/canon/port-types
 * @see cardplay/docs/canon/port-vocabulary.md
 * @see to_fix_repo_plan_500.md Change 066
 */

// ============================================================================
// CANONICAL PORT TYPES
// ============================================================================

/**
 * Canonical builtin port type.
 * 
 * Direction (in/out) is stored separately from type.
 * Do not encode direction in type name (e.g., avoid "audio_in").
 */
export type CanonicalPortType =
  | 'audio'     // Audio signal
  | 'midi'      // MIDI data
  | 'notes'     // Note events (can convert to MIDI with adapter)
  | 'control'   // Control signal (0-1 range typically)
  | 'trigger'   // Trigger/impulse signal
  | 'gate'      // Gate signal (on/off)
  | 'clock'     // Clock/sync signal
  | 'transport'; // Transport control (play/stop/position)

/**
 * Port direction (separate from type).
 */
export type PortDirection = 'in' | 'out';

/**
 * Complete port specification with direction.
 */
export interface PortSpec {
  readonly direction: PortDirection;
  readonly type: CanonicalPortType | string;  // string allows namespaced types
}

/**
 * Canonical port types object for easy access.
 */
export const CANONICAL_PORT_TYPES = {
  audio: 'audio' as CanonicalPortType,
  midi: 'midi' as CanonicalPortType,
  notes: 'notes' as CanonicalPortType,
  control: 'control' as CanonicalPortType,
  trigger: 'trigger' as CanonicalPortType,
  gate: 'gate' as CanonicalPortType,
  clock: 'clock' as CanonicalPortType,
  transport: 'transport' as CanonicalPortType,
} as const;

/**
 * Array of all canonical port types for validation.
 */
export const CANONICAL_PORT_TYPE_LIST: readonly CanonicalPortType[] = [
  'audio', 'midi', 'notes', 'control', 'trigger', 'gate', 'clock', 'transport',
] as const;

/**
 * Set for O(1) lookup.
 */
export const CANONICAL_PORT_TYPE_SET = new Set<string>(CANONICAL_PORT_TYPE_LIST);

/**
 * Check if a string is a canonical port type.
 */
export function isCanonicalPortType(value: string): value is CanonicalPortType {
  return CANONICAL_PORT_TYPE_SET.has(value);
}

/**
 * Check if a port type is namespaced (extension type).
 */
export function isNamespacedPortType(value: string): boolean {
  return value.includes(':');
}

// ============================================================================
// PORT COMPATIBILITY
// ============================================================================

/**
 * Port compatibility pair.
 */
export interface PortCompatibility {
  readonly from: CanonicalPortType;
  readonly to: CanonicalPortType;
  readonly requiresAdapter: boolean;
  readonly adapterName?: string;
}

/**
 * Canonical port compatibility pairs.
 * These define which port types can connect to each other.
 */
export const PORT_COMPATIBILITY_PAIRS: readonly PortCompatibility[] = [
  // Same-type connections (always compatible)
  { from: 'audio', to: 'audio', requiresAdapter: false },
  { from: 'midi', to: 'midi', requiresAdapter: false },
  { from: 'notes', to: 'notes', requiresAdapter: false },
  { from: 'control', to: 'control', requiresAdapter: false },
  { from: 'trigger', to: 'trigger', requiresAdapter: false },
  { from: 'gate', to: 'gate', requiresAdapter: false },
  { from: 'clock', to: 'clock', requiresAdapter: false },
  { from: 'transport', to: 'transport', requiresAdapter: false },
  
  // Cross-type compatible connections
  { from: 'notes', to: 'midi', requiresAdapter: true, adapterName: 'notes-to-midi' },
  { from: 'trigger', to: 'gate', requiresAdapter: false },
  { from: 'gate', to: 'trigger', requiresAdapter: false },
  { from: 'clock', to: 'transport', requiresAdapter: false },
  { from: 'transport', to: 'clock', requiresAdapter: false },
] as const;

/**
 * Map for O(1) compatibility lookup.
 */
const compatibilityMap = new Map<string, PortCompatibility>();
for (const pair of PORT_COMPATIBILITY_PAIRS) {
  compatibilityMap.set(`${pair.from}→${pair.to}`, pair);
}

/**
 * Check if two port types are compatible.
 * 
 * @param from - Source port type
 * @param to - Target port type
 * @returns Compatibility info, or null if incompatible
 */
export function getPortCompatibility(
  from: string,
  to: string
): PortCompatibility | null {
  // Check canonical compatibility
  const key = `${from}→${to}`;
  const canonical = compatibilityMap.get(key);
  if (canonical) {
    return canonical;
  }

  // Namespaced types: same namespace:type is compatible
  if (from === to && isNamespacedPortType(from)) {
    return { from: from as any, to: to as any, requiresAdapter: false };
  }

  return null;
}

/**
 * Check if two ports can connect.
 * 
 * @param fromType - Source port type
 * @param fromDirection - Source port direction
 * @param toType - Target port type  
 * @param toDirection - Target port direction
 * @returns True if connection is valid
 */
export function canConnect(
  fromType: string,
  fromDirection: PortDirection,
  toType: string,
  toDirection: PortDirection
): boolean {
  // Direction must be out → in
  if (fromDirection !== 'out' || toDirection !== 'in') {
    return false;
  }

  // Check type compatibility
  return getPortCompatibility(fromType, toType) !== null;
}

// ============================================================================
// PORT METADATA
// ============================================================================

/**
 * Port type metadata for UI display.
 */
export interface PortTypeMetadata {
  readonly type: CanonicalPortType;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly icon?: string;
}

/**
 * Canonical port type metadata for UI.
 */
export const PORT_TYPE_METADATA: readonly PortTypeMetadata[] = [
  { type: 'audio', name: 'Audio', description: 'Audio signal', color: '#4CAF50' },
  { type: 'midi', name: 'MIDI', description: 'MIDI messages', color: '#2196F3' },
  { type: 'notes', name: 'Notes', description: 'Note events', color: '#9C27B0' },
  { type: 'control', name: 'Control', description: 'Control signal', color: '#FF9800' },
  { type: 'trigger', name: 'Trigger', description: 'Trigger pulse', color: '#F44336' },
  { type: 'gate', name: 'Gate', description: 'Gate on/off', color: '#E91E63' },
  { type: 'clock', name: 'Clock', description: 'Clock/sync', color: '#00BCD4' },
  { type: 'transport', name: 'Transport', description: 'Transport control', color: '#607D8B' },
] as const;

const metadataMap = new Map<string, PortTypeMetadata>();
for (const meta of PORT_TYPE_METADATA) {
  metadataMap.set(meta.type, meta);
}

/**
 * Get metadata for a port type.
 */
export function getPortTypeMetadata(type: string): PortTypeMetadata | undefined {
  return metadataMap.get(type);
}
