/**
 * @fileoverview Canon Module - Canonical Types and IDs
 * 
 * This module provides the single source of truth for canonical IDs,
 * types, and utilities used throughout CardPlay.
 * 
 * @module @cardplay/canon
 * @see cardplay/docs/canon/
 */

// Canonical ID types and constants (excluding constraint types which are in constraint-types.ts)
export {
  DECK_TYPES,
  type DeckType,
  type BuiltinConstraintType,
  PORT_TYPES,
  PORT_TYPE_LIST,
  type PortType,
} from './ids';

// Namespaced ID utilities (excluding items re-exported by id-validation.ts)
export {
  parseNamespacedId,
  formatNamespacedId,
  isValidNamespace,
  extractNamespace,
  extractName,
} from './namespaced-id';

// Legacy alias mappings and normalizers (excluding items in mode-aliases.ts and cadence-aliases.ts)
export {
  normalizeDeckType,
  LEGACY_DECK_TYPE_ALIASES,
} from './legacy-aliases';

// Canonical port types and compatibility
export * from './port-types';

// Canonical event kinds and normalization
export * from './event-kinds';

// HostAction wire format and validation
export * from './host-action-wire';

// Canonical constraint types for music specifications (SSOT for constraint types)
export * from './constraint-types';

// Mode name aliases and normalization (SSOT for mode names)
export * from './mode-aliases';

// Cadence type aliases and normalization (SSOT for cadence types)
export * from './cadence-aliases';

// ID validation and namespacing (SSOT for ID validation)
export * from './id-validation';

// CardPlay ID helper for builtin and namespaced IDs
export * from './cardplay-id';

// Feature IDs for progressive disclosure (distinct from DeckType/DeckId)
export * from './feature-ids';

// Schema versioning for persisted state
export * from './versioning';

// State migrations
export * from './migrations';

// Stable JSON serialization
export * from './serialization';
