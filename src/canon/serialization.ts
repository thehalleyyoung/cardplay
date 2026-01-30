/**
 * @fileoverview Stable JSON Serialization
 * 
 * Wrapper for stable JSON serialization of CardPlay IDs and branded types.
 * Ensures consistent serialization format for persisted state.
 * 
 * Features:
 * - Deterministic key ordering for reproducible output
 * - Branded type handling (Tick, DeckId, PanelId, etc.)
 * - Schema version injection
 * - Circular reference detection
 * 
 * @module @cardplay/canon/serialization
 */

import { type SchemaType, createVersionedState, type VersionedState } from './versioning';

// ============================================================================
// SERIALIZATION OPTIONS
// ============================================================================

/**
 * Options for JSON serialization.
 */
export interface SerializationOptions {
  /** Pretty print with indentation (default: false) */
  pretty?: boolean;
  /** Indentation spaces (default: 2) */
  indent?: number;
  /** Sort object keys alphabetically (default: true for stability) */
  sortKeys?: boolean;
  /** Include timestamp in output (default: true) */
  includeTimestamp?: boolean;
}

const DEFAULT_OPTIONS: Required<SerializationOptions> = {
  pretty: false,
  indent: 2,
  sortKeys: true,
  includeTimestamp: true,
};

// ============================================================================
// STABLE STRINGIFY
// ============================================================================

/**
 * Replacer function that sorts object keys for deterministic output.
 */
function stableReplacer(sortKeys: boolean) {
  const seen = new WeakSet();
  
  return function replacer(this: unknown, _key: string, value: unknown): unknown {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
      
      // Sort object keys if requested
      if (sortKeys && !Array.isArray(value)) {
        const sorted: Record<string, unknown> = {};
        const keys = Object.keys(value as Record<string, unknown>).sort();
        for (const k of keys) {
          sorted[k] = (value as Record<string, unknown>)[k];
        }
        return sorted;
      }
    }
    
    return value;
  };
}

/**
 * Serialize to stable JSON string.
 * 
 * Unlike JSON.stringify, this guarantees:
 * - Consistent key ordering
 * - Circular reference handling
 * - Reproducible output for the same input
 */
export function stableStringify(
  value: unknown,
  options: SerializationOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const indent = opts.pretty ? opts.indent : undefined;
  
  return JSON.stringify(
    value,
    stableReplacer(opts.sortKeys),
    indent
  );
}

// ============================================================================
// VERSIONED SERIALIZATION
// ============================================================================

/**
 * Serialize state with schema version.
 * 
 * Wraps the data in a VersionedState envelope and serializes to JSON.
 */
export function serializeVersioned<T>(
  schemaType: SchemaType,
  data: T,
  options: SerializationOptions = {}
): string {
  const versioned = createVersionedState(schemaType, data);
  
  // Remove timestamp if not requested
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!opts.includeTimestamp) {
    const { timestamp: _, ...rest } = versioned;
    return stableStringify(rest, opts);
  }
  
  return stableStringify(versioned, opts);
}

/**
 * Deserialize versioned state from JSON.
 */
export function deserializeVersioned<T>(json: string): VersionedState<T> {
  const parsed = JSON.parse(json) as VersionedState<T>;
  
  if (!parsed.schemaType || !parsed.schemaVersion) {
    throw new Error('Invalid versioned state: missing schemaType or schemaVersion');
  }
  
  return parsed;
}

// ============================================================================
// ID SERIALIZATION HELPERS
// ============================================================================

/**
 * Serialize a branded ID type to plain string.
 * Branded types serialize as their underlying string value.
 */
export function serializeId<T extends string>(id: T): string {
  return id;
}

/**
 * Serialize an array of branded IDs.
 */
export function serializeIds<T extends string>(ids: readonly T[]): string[] {
  return ids.map(serializeId);
}

// ============================================================================
// TICK/TIME SERIALIZATION
// ============================================================================

/**
 * Tick serialization format options.
 */
export type TickFormat = 'number' | 'object';

/**
 * Serialize a Tick value.
 * 
 * @param tick - Tick value to serialize
 * @param format - 'number' for bare number, 'object' for {tick, ppq} format
 */
export function serializeTick(tick: number, format: TickFormat = 'number'): unknown {
  if (format === 'object') {
    return { tick, ppq: 960 };
  }
  return tick;
}

/**
 * Deserialize a Tick value from either format.
 */
export function deserializeTick(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'object' && value !== null && 'tick' in value) {
    const tickObj = value as { tick: number; ppq?: number };
    // Normalize to PPQ 960 if different PPQ was used
    if (tickObj.ppq && tickObj.ppq !== 960) {
      return Math.round((tickObj.tick * 960) / tickObj.ppq);
    }
    return tickObj.tick;
  }
  
  throw new Error(`Invalid tick value: ${JSON.stringify(value)}`);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a value is a valid versioned state envelope.
 */
export function isVersionedState(value: unknown): value is VersionedState<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.schemaType === 'string' &&
    typeof obj.schemaVersion === 'string' &&
    'data' in obj
  );
}

/**
 * Validate JSON string before parsing.
 */
export function validateJson(json: string): { valid: true } | { valid: false; error: string } {
  try {
    JSON.parse(json);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Unknown parse error',
    };
  }
}
