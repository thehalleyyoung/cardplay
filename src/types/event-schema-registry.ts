/**
 * @fileoverview Event Kind Schema Registry
 * 
 * Changes 432-434: Schema registry for event payloads.
 * Allows validation of event payloads at ingestion and before export.
 * Supports legacy alias tracking for migrations.
 * 
 * @module @cardplay/types/event-schema-registry
 */

import type { EventKind } from './event-kind';
import type { EventPayload } from './event';

// ============================================================================
// TYPES
// ============================================================================

/**
 * JSON schema-like type validator.
 */
export type SchemaValidator<P = unknown> = (payload: unknown) => payload is P;

/**
 * Event kind schema entry.
 */
export interface EventKindSchema<P extends EventPayload = EventPayload> {
  /** Event kind identifier */
  readonly kind: EventKind;
  /** Schema version */
  readonly version: string;
  /** Payload validator function */
  readonly validate: SchemaValidator<P>;
  /** Legacy aliases for migration */
  readonly legacyAliases?: readonly string[];
  /** Example payload (for documentation) */
  readonly example?: P;
}

// ============================================================================
// REGISTRY
// ============================================================================

const schemaRegistry = new Map<EventKind, EventKindSchema>();

/**
 * Change 432: Register an event kind schema.
 * 
 * @param schema - Schema definition
 * @throws {Error} if kind already registered with different version
 */
export function registerEventKindSchema<P extends EventPayload>(
  schema: EventKindSchema<P>
): void {
  const existing = schemaRegistry.get(schema.kind);
  
  if (existing) {
    if (existing.version !== schema.version) {
      console.warn(
        `Event kind '${schema.kind}' re-registered with different version ` +
        `(${existing.version} → ${schema.version})`
      );
    }
  }
  
  schemaRegistry.set(schema.kind, schema as EventKindSchema);
}

/**
 * Gets schema for an event kind.
 */
export function getEventKindSchema(kind: EventKind): EventKindSchema | undefined {
  return schemaRegistry.get(kind);
}

/**
 * Change 433: Validate event payload against registered schema.
 * 
 * @param kind - Event kind
 * @param payload - Payload to validate
 * @returns Validation result
 */
export function validateEventPayload(
  kind: EventKind,
  payload: unknown
): { valid: true } | { valid: false; error: string } {
  const schema = schemaRegistry.get(kind);
  
  if (!schema) {
    // Unknown event kinds are allowed (for extensibility)
    return { valid: true };
  }
  
  try {
    if (schema.validate(payload)) {
      return { valid: true };
    } else {
      return {
        valid: false,
        error: `Payload does not match schema for event kind '${kind}'`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `Schema validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Change 434: Resolve legacy alias to canonical event kind.
 * 
 * @param alias - Possibly legacy alias
 * @returns Canonical kind, or undefined if no match
 */
export function resolveEventKindAlias(alias: string): EventKind | undefined {
  // Direct match
  if (schemaRegistry.has(alias)) {
    return alias;
  }
  
  // Search for legacy alias
  for (const schema of schemaRegistry.values()) {
    if (schema.legacyAliases?.includes(alias)) {
      return schema.kind;
    }
  }
  
  return undefined;
}

/**
 * Lists all registered event kind schemas.
 */
export function listEventKindSchemas(): readonly EventKindSchema[] {
  return Array.from(schemaRegistry.values());
}

// ============================================================================
// BUILTIN SCHEMAS
// ============================================================================

// Note event schema
registerEventKindSchema({
  kind: 'note',
  version: '1.0',
  validate: (payload): payload is { pitch: number; velocity: number } => {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'pitch' in payload &&
      typeof (payload as { pitch: unknown }).pitch === 'number' &&
      'velocity' in payload &&
      typeof (payload as { velocity: unknown }).velocity === 'number'
    );
  },
  example: { pitch: 60, velocity: 100 },
});

// Automation event schema
registerEventKindSchema({
  kind: 'automation',
  version: '1.0',
  validate: (payload): payload is { param: string; value: number } => {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'param' in payload &&
      typeof (payload as { param: unknown }).param === 'string' &&
      'value' in payload &&
      typeof (payload as { value: unknown }).value === 'number'
    );
  },
  example: { param: 'volume', value: 0.75 },
});

// Tempo event schema
registerEventKindSchema({
  kind: 'tempo',
  version: '1.0',
  validate: (payload): payload is { bpm: number } => {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'bpm' in payload &&
      typeof (payload as { bpm: unknown }).bpm === 'number'
    );
  },
  legacyAliases: ['tempo_change'],
  example: { bpm: 120 },
});

// Time signature event schema
registerEventKindSchema({
  kind: 'signature',
  version: '1.0',
  validate: (payload): payload is { numerator: number; denominator: number } => {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'numerator' in payload &&
      typeof (payload as { numerator: unknown }).numerator === 'number' &&
      'denominator' in payload &&
      typeof (payload as { denominator: unknown }).denominator === 'number'
    );
  },
  legacyAliases: ['time_signature'],
  example: { numerator: 4, denominator: 4 },
});
