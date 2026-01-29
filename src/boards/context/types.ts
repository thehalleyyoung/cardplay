/**
 * @fileoverview Active Context Types
 *
 * Defines the active context shared across boards (currently playing stream,
 * clip, track, etc.). This context persists across board switches.
 *
 * @module @cardplay/boards/context/types
 */

import type { ViewType } from '../types';

// ============================================================================
// ACTIVE CONTEXT
// ============================================================================

/**
 * Active context shared across all boards.
 * Represents what the user is currently working on.
 *
 * B065-B067: Complete active context type definition.
 */
export interface ActiveContext {
  /** Currently active event stream ID */
  activeStreamId: string | null;

  /** Currently active clip ID (session view) */
  activeClipId: string | null;

  /** Currently active track ID (session/arrangement) */
  activeTrackId: string | null;

  /** Currently active deck ID (within current board) */
  activeDeckId: string | null;

  /** Currently active view type */
  activeViewType: ViewType | null;

  /** Currently selected event IDs (shared selection) */
  selectedEventIds: readonly string[];

  /** Transport playing state */
  isPlaying: boolean;

  /** Transport position (in beats) */
  transportPosition: number;

  /** Last update timestamp */
  lastUpdatedAt: number;

  // G015: Harmony context for assisted boards
  /** Current musical key (e.g., 'C', 'Am') */
  currentKey: string | null;

  /** Current chord (e.g., 'Cmaj7', 'Dm7') */
  currentChord: string | null;

  /** Chord stream ID (dedicated stream for chord progression) */
  chordStreamId: string | null;
}

/**
 * Default active context (empty state).
 */
export const DEFAULT_ACTIVE_CONTEXT: ActiveContext = {
  activeStreamId: null,
  activeClipId: null,
  activeTrackId: null,
  activeDeckId: null,
  activeViewType: null,
  selectedEventIds: [],
  isPlaying: false,
  transportPosition: 0,
  lastUpdatedAt: Date.now(),
  currentKey: null,
  currentChord: null,
  chordStreamId: null,
};

// ============================================================================
// LISTENER
// ============================================================================

/**
 * Callback for context changes.
 */
export type ActiveContextListener = (context: ActiveContext) => void;
