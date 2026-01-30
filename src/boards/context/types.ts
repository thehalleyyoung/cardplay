/**
 * @fileoverview Active Context Types
 *
 * Defines the active context shared across boards (currently playing stream,
 * clip, track, etc.). This context persists across board switches.
 *
 * @module @cardplay/boards/context/types
 */

import type { ViewType, DeckId } from '../types';

// ============================================================================
// B129: CONTEXT ID TYPES (Canon Naming Conventions)
// ============================================================================

/**
 * Unique symbol for branding BoardContextId.
 * @internal
 */
declare const __boardContextIdBrand: unique symbol;

/**
 * Unique symbol for branding SpecContextId.
 * @internal
 */
declare const __specContextIdBrand: unique symbol;

/**
 * B129: Board-level context identifier.
 * Used to namespace context state by board.
 */
export type BoardContextId = string & { readonly __brand?: typeof __boardContextIdBrand };

/**
 * B129: Spec-level context identifier.
 * Used for music specification context within a board.
 */
export type SpecContextId = string & { readonly __brand?: typeof __specContextIdBrand };

/**
 * B129: Create a board context ID from a board ID.
 */
export function createBoardContextId(boardId: string): BoardContextId {
  return `board:${boardId}` as BoardContextId;
}

/**
 * B129: Create a spec context ID from board and deck.
 */
export function createSpecContextId(boardId: string, deckId: DeckId): SpecContextId {
  return `spec:${boardId}:${deckId}` as SpecContextId;
}

/**
 * B129: Parse a context ID to extract its components.
 */
export function parseContextId(id: BoardContextId | SpecContextId): {
  type: 'board' | 'spec';
  boardId: string;
  deckId?: string;
} | null {
  if (id.startsWith('board:')) {
    return { type: 'board', boardId: id.slice(6) };
  }
  if (id.startsWith('spec:')) {
    const parts = id.slice(5).split(':');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { type: 'spec', boardId: parts[0], deckId: parts[1] };
    }
  }
  return null;
}

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
