/**
 * @fileoverview Registry V2 Types
 * 
 * Defines types for the unified registry system that manages all extension points:
 * - Card registrations
 * - Port type registrations
 * - Event kind registrations
 * - Deck template registrations
 * - Board registrations
 * - Theme registrations
 * - Ontology pack registrations
 * 
 * References:
 * - docs/registry-api.md
 * - docs/pack-provenance.md
 * 
 * @module registry/v2/types
 */

/**
 * Registry entry metadata model.
 * All registered entities carry this provenance information.
 */
export interface RegistryEntryProvenance {
  /** Unique ID of the entity */
  id: string;
  
  /** Pack/extension that provided this entity */
  source: {
    /** Pack ID (namespace) */
    packId: string;
    /** Pack version */
    version: string;
    /** Pack display name */
    displayName?: string;
  };
  
  /** When this entry was registered */
  registeredAt: Date;
  
  /** Signature/trust information */
  trust?: {
    /** Signature (if signed) */
    signature?: string;
    /** Signature algorithm */
    algorithm?: string;
    /** Signer public key */
    publicKey?: string;
    /** Signature verification status */
    verified: boolean;
  };
  
  /** Capabilities required by this entity */
  requiredCapabilities?: readonly string[];
  
  /** Whether this is a builtin (core) entity */
  builtin: boolean;
  
  /** Whether this entity is currently active/enabled */
  active: boolean;
}

/**
 * Registry entry combining entity data with provenance.
 */
export interface RegistryEntry<T = unknown> {
  /** The actual entity data */
  entity: T;
  
  /** Provenance metadata */
  provenance: RegistryEntryProvenance;
}

/**
 * Registry entry type discriminator.
 */
export type RegistryEntryType =
  | 'card'
  | 'port-type'
  | 'event-kind'
  | 'deck-template'
  | 'board'
  | 'theme'
  | 'ontology'
  | 'constraint-type'
  | 'host-action-handler';

/**
 * Typed registry entry with discriminator.
 */
export interface TypedRegistryEntry<T = unknown> extends RegistryEntry<T> {
  type: RegistryEntryType;
}

/**
 * Registry snapshot envelope for versioned persistence.
 */
export interface RegistrySnapshot {
  /** Snapshot format version */
  version: number;
  
  /** CardPlay version this snapshot is compatible with */
  cardplayVersion: string;
  
  /** When this snapshot was created */
  createdAt: Date;
  
  /** All registered entries by type */
  entries: {
    [K in RegistryEntryType]?: Array<TypedRegistryEntry>;
  };
  
  /** Metadata about the snapshot */
  metadata?: {
    /** Description of this snapshot */
    description?: string;
    /** Tags for categorization */
    tags?: readonly string[];
    /** Custom metadata */
    [key: string]: unknown;
  };
}

/**
 * Registry query filter.
 */
export interface RegistryQueryFilter {
  /** Filter by entry type */
  type?: RegistryEntryType;
  
  /** Filter by pack ID */
  packId?: string;
  
  /** Filter by builtin status */
  builtin?: boolean;
  
  /** Filter by active status */
  active?: boolean;
  
  /** Filter by required capabilities */
  requiredCapabilities?: readonly string[];
  
  /** Text search in ID/name */
  search?: string;
}

/**
 * Registry query result.
 */
export interface RegistryQueryResult<T = unknown> {
  /** Matching entries */
  entries: Array<RegistryEntry<T>>;
  
  /** Total count (may be greater than entries.length if paginated) */
  totalCount: number;
  
  /** Query that produced this result */
  query: RegistryQueryFilter;
}
