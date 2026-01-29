/**
 * @fileoverview Project Types
 *
 * Minimal project structure. Projects are references to stream IDs and clip IDs,
 * not copies of data. The actual data lives in SharedEventStore and ClipRegistry.
 *
 * B072-B073: Define minimal project structure.
 *
 * @module @cardplay/boards/project/types
 */

// ============================================================================
// PROJECT
// ============================================================================

/**
 * Minimal project structure.
 * Projects reference streams and clips without duplicating data.
 */
export interface Project {
  /** Unique project ID */
  id: string;

  /** Project name */
  name: string;

  /** Project description (optional) */
  description?: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last modified timestamp */
  modifiedAt: number;

  /** Last board ID used in this project */
  lastBoardId?: string;

  /**
   * Stream IDs referenced by this project.
   * Data lives in SharedEventStore, not duplicated here.
   */
  streamIds: readonly string[];

  /**
   * Clip IDs referenced by this project.
   * Data lives in ClipRegistry, not duplicated here.
   */
  clipIds: readonly string[];

  /** Tempo (BPM) */
  tempo: number;

  /** Time signature numerator */
  timeSignatureNumerator: number;

  /** Time signature denominator */
  timeSignatureDenominator: number;

  /** Project-level metadata (tags, genre, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Default project values.
 */
export const DEFAULT_PROJECT: Omit<Project, 'id' | 'name' | 'createdAt' | 'modifiedAt'> = {
  streamIds: [],
  clipIds: [],
  tempo: 120,
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
};
