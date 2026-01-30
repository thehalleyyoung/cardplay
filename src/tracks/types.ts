/**
 * Canonical Track Model Types
 * 
 * This file exports all canonical track-related types from a single location.
 * This is the SSOT for track type definitions.
 * 
 * ## Type Disambiguation
 * 
 * - `ArrangementTrack` - UI-facing track for arrangement view display
 * - `FreezeTrackModel` - Track state during freeze/bounce operations
 * - `TrackType` - Enum of track categories (audio, midi, instrument, etc.)
 * 
 * @module tracks/types
 */

// Re-export arrangement track types
export { ArrangementTrack, TrackType } from '../ui/components/arrangement-panel';

// Re-export freeze track model
export { FreezeTrackModel } from './clip-operations';

/**
 * Common track identifier type.
 * All tracks should use this type for their id field.
 */
export type TrackId = string & { readonly __brand: 'TrackId' };

/**
 * Creates a branded TrackId from a string.
 */
export function createTrackId(id: string): TrackId {
  return id as TrackId;
}

/**
 * Validates that a string is a valid track ID format.
 */
export function isValidTrackId(id: string): boolean {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Base track interface shared by all track types.
 * Extend this for specialized track models.
 */
export interface BaseTrack {
  readonly id: TrackId;
  readonly name: string;
  readonly muted: boolean;
  readonly solo: boolean;
  readonly volume: number;
  readonly pan: number;
}
