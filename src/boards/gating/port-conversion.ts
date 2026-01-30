/**
 * @fileoverview Port Conversion / Adapter System
 *
 * Changes 210-213: Implements documented port adapters (e.g., notes→midi)
 * as explicit typed adapters, plus a minimal adapter registry for extensions.
 *
 * @module @cardplay/boards/gating/port-conversion
 */

import type { PortType } from '../../canon/port-types';

// ============================================================================
// PORT ADAPTER TYPES
// ============================================================================

/**
 * A port adapter converts data from one canonical port type to another.
 */
export interface PortAdapter {
  /** Unique identifier for this adapter */
  readonly id: string;
  /** Source port type */
  readonly from: PortType;
  /** Target port type */
  readonly to: PortType;
  /** Whether this conversion is lossless */
  readonly lossless: boolean;
  /** Human-readable description */
  readonly description: string;
}

// ============================================================================
// BUILTIN ADAPTERS (Change 210)
// ============================================================================

/**
 * Builtin port adapters implementing documented conversions.
 */
export const BUILTIN_ADAPTERS: readonly PortAdapter[] = [
  {
    id: 'notes-to-midi',
    from: 'notes',
    to: 'midi',
    lossless: true,
    description: 'Converts note events to MIDI note-on/note-off messages',
  },
  {
    id: 'midi-to-notes',
    from: 'midi',
    to: 'notes',
    lossless: false,
    description: 'Extracts note events from MIDI stream (non-note messages discarded)',
  },
  {
    id: 'trigger-to-gate',
    from: 'trigger',
    to: 'gate',
    lossless: true,
    description: 'Converts trigger pulses to gate signals (fixed duration)',
  },
  {
    id: 'gate-to-trigger',
    from: 'gate',
    to: 'trigger',
    lossless: false,
    description: 'Converts gate on-edge to trigger pulse (duration discarded)',
  },
  {
    id: 'clock-to-trigger',
    from: 'clock',
    to: 'trigger',
    lossless: true,
    description: 'Converts clock ticks to trigger pulses',
  },
  {
    id: 'control-to-audio',
    from: 'control',
    to: 'audio',
    lossless: true,
    description: 'Passes control signal as audio-rate modulation',
  },
];

// ============================================================================
// ADAPTER REGISTRY (Change 213)
// ============================================================================

const adapterRegistry = new Map<string, PortAdapter>();

/**
 * Register a port adapter. Extensions use this to add custom adapters.
 */
export function registerPortAdapter(adapter: PortAdapter): void {
  if (adapterRegistry.has(adapter.id)) {
    throw new Error(`Port adapter '${adapter.id}' is already registered`);
  }
  adapterRegistry.set(adapter.id, adapter);
}

/**
 * Get all registered adapters.
 */
export function getPortAdapters(): readonly PortAdapter[] {
  return Array.from(adapterRegistry.values());
}

/**
 * Find an adapter that converts from one port type to another.
 * Returns the first matching adapter, or null if none exists.
 */
export function findAdapter(from: PortType, to: PortType): PortAdapter | null {
  for (const adapter of adapterRegistry.values()) {
    if (adapter.from === from && adapter.to === to) {
      return adapter;
    }
  }
  return null;
}

/**
 * Check if a conversion path exists between two port types
 * (either direct compatibility or via an adapter).
 */
export function canConvert(from: PortType, to: PortType): boolean {
  if (from === to) return true;
  return findAdapter(from, to) !== null;
}

/**
 * Register all builtin adapters. Call at startup.
 */
export function registerBuiltinAdapters(): void {
  for (const adapter of BUILTIN_ADAPTERS) {
    if (!adapterRegistry.has(adapter.id)) {
      adapterRegistry.set(adapter.id, adapter);
    }
  }
}

/**
 * Clear all adapters (for testing).
 */
export function clearAdapterRegistry(): void {
  adapterRegistry.clear();
}
