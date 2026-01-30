/**
 * Board configuration export system
 * Allows sharing board definitions (layout + decks + tool config)
 */

import type { Board } from '../boards/types';
import type { DeckState } from '../boards/store/types';

export interface BoardExportManifest {
  version: '1.0';
  type: 'board-configuration';
  exportedAt: string;
  cardplayVersion: string;
}

export interface BoardExportData {
  manifest: BoardExportManifest;
  board: Board;
  deckStates?: DeckState;
  metadata: {
    name: string;
    description?: string;
    author?: string;
    tags?: readonly string[];
    createdAt: string;
  };
}

export interface BoardImportOptions {
  assignNewId?: boolean;
  preserveDeckStates?: boolean;
  validateOnly?: boolean;
}

export interface BoardImportResult {
  success: boolean;
  board?: Board;
  deckStates?: DeckState;
  errors?: readonly string[];
  warnings?: readonly string[];
}

/**
 * Export a board configuration to JSON
 */
export function exportBoardConfiguration(
  board: Board,
  deckStates?: DeckState,
  metadata?: Partial<BoardExportData['metadata']>
): BoardExportData {
  const now = new Date().toISOString();
  
  const result: BoardExportData = {
    manifest: {
      version: '1.0',
      type: 'board-configuration',
      exportedAt: now,
      cardplayVersion: '1.0.0'
    },
    board,
    metadata: {
      name: metadata?.name || board.name,
      createdAt: metadata?.createdAt || now
    }
  };

  if (deckStates) result.deckStates = deckStates;
  if (metadata?.description) result.metadata.description = metadata.description;
  if (board.description && !metadata?.description) result.metadata.description = board.description;
  if (metadata?.author) result.metadata.author = metadata.author;
  if (metadata?.tags) result.metadata.tags = metadata.tags;
  else if (board.tags) result.metadata.tags = board.tags;

  return result;
}

/**
 * Import a board configuration from JSON
 */
export function importBoardConfiguration(
  data: BoardExportData,
  options: BoardImportOptions = {}
): BoardImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate manifest
  if (data.manifest.type !== 'board-configuration') {
    errors.push(`Invalid export type: ${data.manifest.type}`);
    return { success: false, errors };
  }

  if (data.manifest.version !== '1.0') {
    warnings.push(`Board was exported with version ${data.manifest.version}, may have compatibility issues`);
  }

  // Validate board structure
  if (!data.board || !data.board.id || !data.board.name) {
    errors.push('Invalid board structure: missing required fields');
    return { success: false, errors };
  }

  if (options.validateOnly) {
    return { success: true, warnings };
  }

  // Clone board data
  let board = { ...data.board };

  // Assign new ID if requested
  if (options.assignNewId) {
    board = {
      ...board,
      id: `${board.id}-imported-${Date.now()}`
    };
  }

  // Handle deck states
  const result: BoardImportResult = {
    success: true,
    board
  };

  if (options.preserveDeckStates && data.deckStates) {
    result.deckStates = { ...data.deckStates };
  }

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}

/**
 * Serialize board configuration to JSON string
 */
export function serializeBoardConfiguration(data: BoardExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse board configuration from JSON string
 */
export function parseBoardConfiguration(json: string): BoardExportData {
  return JSON.parse(json);
}

/**
 * Create a downloadable board configuration file
 */
export function downloadBoardConfiguration(
  board: Board,
  deckStates?: DeckState,
  metadata?: Partial<BoardExportData['metadata']>
): void {
  const data = exportBoardConfiguration(board, deckStates, metadata);
  const json = serializeBoardConfiguration(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${board.id}.cardplay-board.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Check if a board configuration is compatible with current version
 */
export function checkBoardCompatibility(data: BoardExportData): {
  compatible: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check version
  if (data.manifest.version !== '1.0') {
    warnings.push(`Board uses version ${data.manifest.version}, current version is 1.0`);
  }

  // Check required fields
  if (!data.board.controlLevel) {
    issues.push('Missing control level');
  }

  if (!data.board.primaryView) {
    issues.push('Missing primary view');
  }

  if (!data.board.layout) {
    issues.push('Missing layout definition');
  }

  if (!data.board.decks || data.board.decks.length === 0) {
    issues.push('Board has no decks');
  }

  // Check deck types exist (basic validation)
  if (data.board.decks) {
    for (const deck of data.board.decks) {
      if (!deck.type) {
        issues.push(`Deck ${deck.id} missing type`);
      }
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
    warnings
  };
}
