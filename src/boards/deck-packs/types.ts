/**
 * @fileoverview Deck Pack Types
 * 
 * Implements O027-O032:
 * - Pre-configured deck sets for quick board customization
 * - Pack browser and installation
 * - Metadata and tagging system
 * 
 * @module @cardplay/boards/deck-packs/types
 */

import type { BoardDeck } from '../types';

// --------------------------------------------------------------------------
// Deck Pack Types
// --------------------------------------------------------------------------

/**
 * A pre-configured collection of decks that can be added to a board
 */
export interface DeckPack {
  /** Unique identifier for the deck pack */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of what this pack provides */
  description: string;
  
  /** Category for organization */
  category: 'production' | 'composition' | 'performance' | 'sound-design' | 'mixing' | 'utility';
  
  /** Tags for searchability */
  tags: string[];
  
  /** Icon identifier */
  icon: string;
  
  /** Deck definitions in this pack */
  decks: BoardDeck[];
  
  /** Optional author information */
  author?: string;
  
  /** Optional version */
  version?: string;
  
  /** Target user personas */
  targetPersonas?: ('notation-composer' | 'tracker-user' | 'producer' | 'sound-designer')[];
  
  /** Difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Metadata for deck pack installation
 */
export interface DeckPackInstallation {
  packId: string;
  boardId: string;
  installedAt: number; // timestamp
  deckIds: string[]; // IDs of decks added to the board
}

/**
 * Configuration for adding a deck pack to a board
 */
export interface DeckPackAddOptions {
  /** Target board ID */
  boardId: string;
  
  /** Position hints for deck placement */
  positionHints?: {
    panel?: 'left' | 'right' | 'top' | 'bottom' | 'center';
    index?: number; // insertion index in panel
  };
  
  /** Whether to open the first deck after adding */
  activateFirst?: boolean;
  
  /** Whether to avoid ID collisions by renaming */
  autoRename?: boolean;
}

/**
 * Result of adding a deck pack to a board
 */
export interface DeckPackAddResult {
  success: boolean;
  deckIds: string[];
  renamed: Record<string, string>; // oldId -> newId
  errors: string[];
}

/**
 * Options for searching deck packs
 */
export interface DeckPackSearchOptions {
  category?: DeckPack['category'];
  tags?: string[];
  persona?: string;
  difficulty?: DeckPack['difficulty'];
  query?: string; // text search
}
