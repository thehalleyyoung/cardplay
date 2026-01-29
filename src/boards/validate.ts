/**
 * @fileoverview Board Validation
 * 
 * Runtime validation for board definitions to ensure they are well-formed
 * and internally consistent.
 * 
 * @module @cardplay/boards/validate
 */

import type { Board, DeckType } from './types';
import { validateToolConfig } from './validate-tool-config';

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

// ============================================================================
// KNOWN DECK TYPES
// ============================================================================

const KNOWN_DECK_TYPES: ReadonlySet<DeckType> = new Set([
  'pattern-deck',
  'notation-deck',
  'piano-roll-deck',
  'session-deck',
  'arrangement-deck',
  'instruments-deck',
  'dsp-chain',
  'effects-deck',
  'samples-deck',
  'phrases-deck',
  'harmony-deck',
  'generators-deck',
  'mixer-deck',
  'routing-deck',
  'automation-deck',
  'properties-deck',
  'transport-deck',
  'arranger-deck',
  'ai-advisor-deck',
  'sample-manager-deck',
  'modulation-matrix-deck',
]);

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a board definition.
 */
export function validateBoard(board: Board): ValidationResult {
  const errors: ValidationError[] = [];
  
  // B026: Validate board ID is unique and non-empty
  if (!board.id || board.id.trim() === '') {
    errors.push({
      path: 'id',
      message: 'Board ID must be non-empty',
      severity: 'error',
    });
  }
  
  // B027: Validate deck IDs are unique per board
  const deckIds = new Set<string>();
  for (const deck of board.decks) {
    if (deckIds.has(deck.id)) {
      errors.push({
        path: `decks[${deck.id}]`,
        message: `Duplicate deck ID: ${deck.id}`,
        severity: 'error',
      });
    }
    deckIds.add(deck.id);
  }
  
  // B028: Validate each deck's DeckType is known
  for (const deck of board.decks) {
    if (!KNOWN_DECK_TYPES.has(deck.type)) {
      errors.push({
        path: `decks[${deck.id}].type`,
        message: `Unknown deck type: ${deck.type}`,
        severity: 'error',
      });
    }
  }
  
  // B029: Validate tool config modes are consistent with enabled
  const tools = board.compositionTools;
  
  if (!tools.phraseDatabase.enabled && tools.phraseDatabase.mode !== 'hidden') {
    errors.push({
      path: 'compositionTools.phraseDatabase',
      message: 'Tool is disabled but mode is not hidden',
      severity: 'warning',
    });
  }
  
  if (!tools.harmonyExplorer.enabled && tools.harmonyExplorer.mode !== 'hidden') {
    errors.push({
      path: 'compositionTools.harmonyExplorer',
      message: 'Tool is disabled but mode is not hidden',
      severity: 'warning',
    });
  }
  
  if (!tools.phraseGenerators.enabled && tools.phraseGenerators.mode !== 'hidden') {
    errors.push({
      path: 'compositionTools.phraseGenerators',
      message: 'Tool is disabled but mode is not hidden',
      severity: 'warning',
    });
  }
  
  if (!tools.arrangerCard.enabled && tools.arrangerCard.mode !== 'hidden') {
    errors.push({
      path: 'compositionTools.arrangerCard',
      message: 'Tool is disabled but mode is not hidden',
      severity: 'warning',
    });
  }
  
  if (!tools.aiComposer.enabled && tools.aiComposer.mode !== 'hidden') {
    errors.push({
      path: 'compositionTools.aiComposer',
      message: 'Tool is disabled but mode is not hidden',
      severity: 'warning',
    });
  }
  
  // B030: Validate panel IDs are unique and positions are valid
  const panelIds = new Set<string>();
  const validPositions: ReadonlySet<string> = new Set(['left', 'right', 'top', 'bottom', 'center']);
  
  for (const panel of board.layout.panels) {
    if (panelIds.has(panel.id)) {
      errors.push({
        path: `panels[${panel.id}]`,
        message: `Duplicate panel ID: ${panel.id}`,
        severity: 'error',
      });
    }
    panelIds.add(panel.id);
    
    if (!validPositions.has(panel.position)) {
      errors.push({
        path: `panels[${panel.id}].position`,
        message: `Invalid panel position: ${panel.position}`,
        severity: 'error',
      });
    }
  }
  
  // Validate basic metadata
  if (!board.name || board.name.trim() === '') {
    errors.push({
      path: 'name',
      message: 'Board name must be non-empty',
      severity: 'error',
    });
  }
  
  if (!board.author || board.author.trim() === '') {
    errors.push({
      path: 'author',
      message: 'Board author must be non-empty',
      severity: 'warning',
    });
  }
  
  // D058-D059: Validate tool config with control level
  const toolWarnings = validateToolConfig(board);
  for (const warning of toolWarnings) {
    errors.push({
      path: `compositionTools.${warning.toolKind}`,
      message: `${warning.issue}. ${warning.recommendation}`,
      severity: 'warning',
    });
  }
  
  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validates and throws if board is invalid.
 */
export function assertValidBoard(board: Board): void {
  const result = validateBoard(board);
  if (!result.valid) {
    const errorMessages = result.errors
      .filter(e => e.severity === 'error')
      .map(e => `${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid board:\n${errorMessages}`);
  }
}
