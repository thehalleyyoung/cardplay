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
import { DECK_TYPES } from '../canon/ids';
import { normalizeDeckType, DEPRECATED_DECK_TYPES } from '../canon/legacy-aliases';
import { ontologyRegistry, type OntologyId } from '../ai/theory/ontologies';

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
// KNOWN DECK TYPES (from canon)
// ============================================================================

/**
 * Authoritative set of canonical deck types.
 * Imported from canon/ids.ts - single source of truth.
 */
const KNOWN_DECK_TYPES: ReadonlySet<DeckType> = new Set(DECK_TYPES);

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
  
  // B028: Validate each deck's DeckType is known (canonicalize legacy aliases)
  for (const deck of board.decks) {
    // Check if using deprecated legacy alias
    if (DEPRECATED_DECK_TYPES.has(deck.type)) {
      const canonical = normalizeDeckType(deck.type);
      errors.push({
        path: `decks[${deck.id}].type`,
        message: `Deprecated deck type "${deck.type}" - use "${canonical}" instead`,
        severity: 'warning',
      });
    }
    
    // Normalize and validate
    const canonicalType = normalizeDeckType(deck.type);
    if (!KNOWN_DECK_TYPES.has(canonicalType)) {
      errors.push({
        path: `decks[${deck.id}].type`,
        message: `Unknown deck type: ${deck.type} (canonical: ${canonicalType})`,
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
  
  // B135: Validate required metadata fields per docs
  if (!board.description || board.description.trim() === '') {
    errors.push({
      path: 'description',
      message: 'Board description should be provided',
      severity: 'warning',
    });
  }
  
  if (!('difficulty' in board)) {
    errors.push({
      path: 'difficulty',
      message: 'Board difficulty level should be declared (beginner/intermediate/advanced/expert)',
      severity: 'warning',
    });
  }
  
  if (!('tags' in board) || !Array.isArray((board as { tags?: unknown }).tags)) {
    errors.push({
      path: 'tags',
      message: 'Board should have tags array for categorization',
      severity: 'warning',
    });
  }
  
  if (!('author' in board) || !(board as { author?: string }).author?.trim()) {
    errors.push({
      path: 'author',
      message: 'Board author should be declared',
      severity: 'warning',
    });
  }
  
  if (!('version' in board)) {
    errors.push({
      path: 'version',
      message: 'Board version should be declared for compatibility tracking',
      severity: 'warning',
    });
  }
  
  // B137: Validate primaryView is consistent with deck mix
  if (board.primaryView) {
    const deckTypes = new Set(board.decks.map(d => normalizeDeckType(d.type)));
    
    const viewToDeckTypes: Record<string, string[]> = {
      'tracker': ['pattern-deck'],
      'notation': ['notation-deck'],
      'session': ['session-deck', 'session-grid-deck'],
      'arranger': ['arrangement-deck', 'arranger-deck'],
      'composer': ['notation-deck', 'pattern-deck'],
      'sampler': ['sampler-deck', 'sample-manager-deck'],
    };
    
    const expectedDeckTypes = viewToDeckTypes[board.primaryView] ?? [];
    const hasExpectedDeck = expectedDeckTypes.some(t => deckTypes.has(t as DeckType));
    
    if (expectedDeckTypes.length > 0 && !hasExpectedDeck) {
      errors.push({
        path: 'primaryView',
        message: `Board primaryView '${board.primaryView}' suggests deck types [${expectedDeckTypes.join(', ')}], but none found`,
        severity: 'warning',
      });
    }
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
  
  // B131: Validate that BoardDeck.panelId exists in board.layout.panels
  // Note: board.panels is deprecated, use layout.panels (Change 119)
  // Still check both for backwards compatibility during transition
  if (board.panels) {
    for (const panel of board.panels) {
      panelIds.add(panel.id);
    }
  }
  
  for (const deck of board.decks) {
    if (deck.panelId && !panelIds.has(deck.panelId)) {
      errors.push({
        path: `decks[${deck.id}].panelId`,
        message: `Deck references non-existent panel: "${deck.panelId}"`,
        severity: 'error',
      });
    }
  }
  
  // B132: Validate deck IDs are unique (already done above)
  
  // Change 138: Validate controlLevelOverride compatibility
  for (const deck of board.decks) {
    if (deck.controlLevelOverride) {
      const boardLevel = board.controlLevel;
      const deckLevel = deck.controlLevelOverride;
      
      // Define control level hierarchy (less restrictive -> more restrictive)
      const levelHierarchy: Record<string, number> = {
        'full-manual': 0,
        'manual-with-hints': 1,
        'assisted': 2,
        'directed': 3,
        'collaborative': 4,
        'generative': 5,
      };
      
      const boardLevelIndex = levelHierarchy[boardLevel] ?? -1;
      const deckLevelIndex = levelHierarchy[deckLevel] ?? -1;
      
      if (boardLevelIndex < 0 || deckLevelIndex < 0) {
        errors.push({
          path: `decks[${deck.id}].controlLevelOverride`,
          message: `Unknown control level: ${deckLevel}`,
          severity: 'error',
        });
      } else {
        // Warn if deck override is more permissive than board level
        // (Generally board level should be the maximum permission ceiling)
        if (deckLevelIndex > boardLevelIndex) {
          errors.push({
            path: `decks[${deck.id}].controlLevelOverride`,
            message: `Deck control level '${deckLevel}' is more permissive than board level '${boardLevel}'. Consider raising board level or restricting deck override.`,
            severity: 'warning',
          });
        }
      }
    }
  }
  
  // Change 139: Validate ontology selection for AI decks
  if (board.ontology) {
    const ontologyIds: OntologyId[] = Array.isArray(board.ontology)
      ? board.ontology
      : [board.ontology];
    
    // Validate all referenced ontologies exist
    for (const ontologyId of ontologyIds) {
      const ontology = ontologyRegistry.get(ontologyId);
      if (!ontology) {
        errors.push({
          path: 'ontology',
          message: `Board references unknown ontology: "${ontologyId}"`,
          severity: 'error',
        });
      }
    }
    
    // Warn if board has AI decks but no explicit ontology
    const hasAIDecks = board.decks.some(d => 
      d.type === 'ai-advisor-deck' || 
      d.type === 'harmony-deck' || 
      d.type === 'generators-deck'
    );
    
    if (hasAIDecks && !board.ontology) {
      errors.push({
        path: 'ontology',
        message: 'Board contains AI decks but no ontology specified. Will default to western-12tet.',
        severity: 'warning',
      });
    }
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
