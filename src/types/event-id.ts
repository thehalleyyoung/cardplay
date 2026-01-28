/**
 * @fileoverview EventId type using UUID v7 for time-ordered identifiers.
 * 
 * UUID v7 provides:
 * - Time-ordered sorting (timestamp prefix)
 * - Uniqueness across distributed systems
 * - Efficient indexing in databases
 * 
 * @module @cardplay/core/types/event-id
 * @see RFC 9562 - UUID v7
 */

// ============================================================================
// BRANDED TYPE
// ============================================================================

declare const __brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Unique identifier for an Event.
 * 
 * Uses UUID v7 format for time-ordered, globally unique IDs.
 * Branded string type prevents accidental use of arbitrary strings.
 */
export type EventId = Branded<string, 'EventId'>;

// ============================================================================
// UUID V7 IMPLEMENTATION
// ============================================================================

let lastTimestamp = 0;
let sequence = 0;

/**
 * Generates a UUID v7 string.
 * 
 * Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 * - First 48 bits: Unix timestamp in milliseconds
 * - Next 4 bits: Version (7)
 * - Next 12 bits: Random
 * - Next 2 bits: Variant (10)
 * - Last 62 bits: Random
 */
function generateUUIDv7(): string {
  let timestamp = Date.now();
  
  // Handle same-millisecond generation with sequence counter
  if (timestamp === lastTimestamp) {
    sequence++;
    if (sequence > 0xfff) {
      // Sequence overflow, wait for next millisecond
      while (Date.now() === timestamp) {
        // Busy wait (should rarely happen)
      }
      timestamp = Date.now();
      sequence = 0;
    }
  } else {
    sequence = 0;
    lastTimestamp = timestamp;
  }
  
  // Create 128-bit UUID
  const bytes = new Uint8Array(16);
  
  // Timestamp (48 bits, big-endian)
  // Use Math.floor for division to handle 48-bit timestamps correctly
  // (JavaScript bitwise operators only work on 32-bit integers)
  bytes[0] = Math.floor(timestamp / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(timestamp / 0x100000000) & 0xff;
  bytes[2] = Math.floor(timestamp / 0x1000000) & 0xff;
  bytes[3] = Math.floor(timestamp / 0x10000) & 0xff;
  bytes[4] = Math.floor(timestamp / 0x100) & 0xff;
  bytes[5] = timestamp & 0xff;
  
  // Version 7 + 12 bits of random/sequence
  bytes[6] = 0x70 | ((sequence >> 8) & 0x0f);
  bytes[7] = sequence & 0xff;
  
  // Variant bits (10) + random
  crypto.getRandomValues(bytes.subarray(8));
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  
  // Convert to hex string
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generates a new unique EventId.
 * 
 * Uses UUID v7 for time-ordered uniqueness.
 * Safe to call frequently - handles same-millisecond collisions.
 * 
 * @returns A new unique EventId
 * 
 * @example
 * ```ts
 * const id1 = generateEventId();
 * const id2 = generateEventId();
 * console.log(compareEventIds(id1, id2)); // -1 (id1 < id2)
 * ```
 */
export function generateEventId(): EventId {
  return generateUUIDv7() as EventId;
}

/**
 * Validates and casts a string to EventId.
 * 
 * @param value - String to validate
 * @returns EventId if valid
 * @throws {TypeError} If not a valid UUID format
 */
export function asEventId(value: string): EventId {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new TypeError(`Invalid EventId format: ${value}`);
  }
  return value.toLowerCase() as EventId;
}

/**
 * Extracts the timestamp from a UUID v7 EventId.
 * 
 * @param id - The EventId to extract from
 * @returns Unix timestamp in milliseconds
 */
export function extractTimestamp(id: EventId): number {
  const hex = id.replace(/-/g, '').slice(0, 12);
  return parseInt(hex, 16);
}

/**
 * Compares two EventIds for ordering.
 * 
 * Since UUID v7 is time-ordered, this provides chronological ordering.
 * 
 * @param a - First EventId
 * @param b - Second EventId
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareEventIds(a: EventId, b: EventId): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Nil EventId constant (all zeros).
 * Used as a placeholder or sentinel value.
 */
export const NIL_EVENT_ID = '00000000-0000-0000-0000-000000000000' as EventId;
