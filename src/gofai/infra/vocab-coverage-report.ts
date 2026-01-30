/**
 * GOFAI Vocabulary Coverage Report — Analyze Language Binding Coverage
 *
 * This module implements Step 098 [Infra] from gofai_goalB.md:
 * "Add a 'vocab coverage report' script: which cards/boards/decks
 * have no language bindings or weak bindings."
 *
 * It analyzes:
 * 1. Which registered cards have language bindings (lexemes, synonyms, param mappings)
 * 2. Which boards have language bindings (workflow verbs, scopes)
 * 3. Which decks have language bindings (deck references, actions)
 * 4. Coverage gaps and quality scores
 *
 * @module gofai/infra/vocab-coverage-report
 */

import { CORE_LEXEMES } from '../canon/lexemes';
import type { Lexeme } from '../canon/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Coverage level for an entity.
 */
export type CoverageLevel =
  | 'none'        // No bindings at all
  | 'minimal'     // Only basic ID reference
  | 'partial'     // Some bindings but missing key aspects
  | 'good'        // Most bindings present
  | 'excellent';  // Comprehensive bindings

/**
 * Coverage information for a card.
 */
export interface CardCoverage {
  /** Card ID */
  readonly cardId: string;

  /** Card display name */
  readonly displayName: string;

  /** Coverage level */
  readonly level: CoverageLevel;

  /** Coverage score (0-100) */
  readonly score: number;

  /** Has lexeme entries that refer to this card */
  readonly hasLexemes: boolean;

  /** Number of lexeme entries */
  readonly lexemeCount: number;

  /** Has synonyms defined */
  readonly hasSynonyms: boolean;

  /** Number of synonyms */
  readonly synonymCount: number;

  /** Has parameter mappings (e.g., to perceptual axes) */
  readonly hasParamMappings: boolean;

  /** Number of parameter mappings */
  readonly paramMappingCount: number;

  /** Has role annotations */
  readonly hasRole: boolean;

  /** Missing bindings */
  readonly missingBindings: readonly string[];

  /** Suggested improvements */
  readonly suggestions: readonly string[];
}

/**
 * Coverage information for a board.
 */
export interface BoardCoverage {
  /** Board ID */
  readonly boardId: string;

  /** Board display name */
  readonly displayName: string;

  /** Coverage level */
  readonly level: CoverageLevel;

  /** Coverage score (0-100) */
  readonly score: number;

  /** Has lexeme entries that refer to this board */
  readonly hasLexemes: boolean;

  /** Has workflow verb bindings */
  readonly hasWorkflowVerbs: boolean;

  /** Has default scope definitions */
  readonly hasDefaultScopes: boolean;

  /** Has safe execution policies defined */
  readonly hasSafetyPolicies: boolean;

  /** Missing bindings */
  readonly missingBindings: readonly string[];

  /** Suggested improvements */
  readonly suggestions: readonly string[];
}

/**
 * Coverage information for a deck.
 */
export interface DeckCoverage {
  /** Deck type ID */
  readonly deckTypeId: string;

  /** Deck display name */
  readonly displayName: string;

  /** Coverage level */
  readonly level: CoverageLevel;

  /** Coverage score (0-100) */
  readonly score: number;

  /** Has lexeme entries that refer to this deck */
  readonly hasLexemes: boolean;

  /** Has action bindings */
  readonly hasActions: boolean;

  /** Has scope definitions */
  readonly hasScopes: boolean;

  /** Missing bindings */
  readonly missingBindings: readonly string[];

  /** Suggested improvements */
  readonly suggestions: readonly string[];
}

/**
 * Complete vocabulary coverage report.
 */
export interface VocabCoverageReport {
  /** When the report was generated */
  readonly timestamp: number;

  /** Overall statistics */
  readonly stats: {
    readonly totalCards: number;
    readonly cardsWithBindings: number;
    readonly cardsCoveragePercent: number;

    readonly totalBoards: number;
    readonly boardsWithBindings: number;
    readonly boardsCoveragePercent: number;

    readonly totalDecks: number;
    readonly decksWithBindings: number;
    readonly decksCoveragePercent: number;

    readonly overallScore: number;
  };

  /** Per-card coverage */
  readonly cards: readonly CardCoverage[];

  /** Per-board coverage */
  readonly boards: readonly BoardCoverage[];

  /** Per-deck coverage */
  readonly decks: readonly DeckCoverage[];

  /** Summary of critical gaps */
  readonly criticalGaps: readonly CoverageGap[];

  /** Recommended priority actions */
  readonly recommendations: readonly string[];
}

/**
 * A critical coverage gap.
 */
export interface CoverageGap {
  /** Type of entity */
  readonly entityType: 'card' | 'board' | 'deck';

  /** Entity ID */
  readonly entityId: string;

  /** Entity name */
  readonly entityName: string;

  /** Gap description */
  readonly gap: string;

  /** Priority (1 = highest) */
  readonly priority: number;
}

// =============================================================================
// Coverage Analysis
// =============================================================================

/**
 * Analyze card coverage from lexemes and other bindings.
 */
function analyzeCardCoverage(cardId: string, displayName: string): CardCoverage {
  // Find lexemes that reference this card
  const cardLexemes = CORE_LEXEMES.filter(lex => {
    const sem = lex.semantics;
    return (
      sem && typeof sem === 'object' &&
      ('cardId' in sem && sem.cardId === cardId ||
       'card' in sem && sem.card === cardId)
    );
  });

  const lexemeCount = cardLexemes.length;
  const hasLexemes = lexemeCount > 0;

  // Count synonyms (multiple lemmas/variants mapping to same card)
  const allForms = new Set<string>();
  for (const lex of cardLexemes) {
    allForms.add(lex.lemma);
    for (const variant of lex.variants) {
      allForms.add(variant);
    }
  }
  const synonymCount = allForms.size;
  const hasSynonyms = synonymCount > 1;

  // Check for parameter mappings (would need to inspect axis bindings)
  // For now, simplified - look for param-related semantics
  const hasParamMappings = cardLexemes.some(lex => {
    const sem = lex.semantics;
    return sem && typeof sem === 'object' && 'param' in sem;
  });
  const paramMappingCount = hasParamMappings ? 1 : 0;

  // Check for role annotations
  const hasRole = cardLexemes.some(lex => {
    const sem = lex.semantics;
    return sem && typeof sem === 'object' && 'role' in sem;
  });

  // Calculate score
  let score = 0;
  if (hasLexemes) score += 40;
  if (hasSynonyms) score += 20;
  if (hasParamMappings) score += 25;
  if (hasRole) score += 15;

  // Determine coverage level
  let level: CoverageLevel;
  if (score === 0) level = 'none';
  else if (score < 40) level = 'minimal';
  else if (score < 70) level = 'partial';
  else if (score < 90) level = 'good';
  else level = 'excellent';

  // Identify missing bindings
  const missingBindings: string[] = [];
  if (!hasLexemes) missingBindings.push('no lexeme entries');
  if (!hasSynonyms) missingBindings.push('no synonyms');
  if (!hasParamMappings) missingBindings.push('no parameter mappings');
  if (!hasRole) missingBindings.push('no role annotation');

  // Generate suggestions
  const suggestions: string[] = [];
  if (!hasLexemes) {
    suggestions.push(`Add lexeme entries for card "${displayName}"`);
  }
  if (!hasSynonyms && hasLexemes) {
    suggestions.push(`Add synonyms for "${displayName}" (e.g., common variations)`);
  }
  if (!hasParamMappings) {
    suggestions.push(`Map parameters to perceptual axes for "${displayName}"`);
  }

  return {
    cardId,
    displayName,
    level,
    score,
    hasLexemes,
    lexemeCount,
    hasSynonyms,
    synonymCount,
    hasParamMappings,
    paramMappingCount,
    hasRole,
    missingBindings,
    suggestions,
  };
}

/**
 * Analyze board coverage from lexemes and metadata.
 */
function analyzeBoardCoverage(boardId: string, displayName: string): BoardCoverage {
  // Find lexemes that reference this board
  const boardLexemes = CORE_LEXEMES.filter(lex => {
    const sem = lex.semantics;
    return (
      sem && typeof sem === 'object' &&
      ('boardId' in sem && sem.boardId === boardId ||
       'board' in sem && sem.board === boardId)
    );
  });

  const hasLexemes = boardLexemes.length > 0;

  // Check for workflow verb bindings
  // (simplified - would need to check against verb tables)
  const hasWorkflowVerbs = boardLexemes.some(lex =>
    lex.category === 'verb' || lex.category === 'verb-phrase'
  );

  // Check for scope definitions (placeholder)
  const hasDefaultScopes = false; // Would check board metadata

  // Check for safety policies (placeholder)
  const hasSafetyPolicies = false; // Would check board metadata

  // Calculate score
  let score = 0;
  if (hasLexemes) score += 50;
  if (hasWorkflowVerbs) score += 30;
  if (hasDefaultScopes) score += 10;
  if (hasSafetyPolicies) score += 10;

  // Determine coverage level
  let level: CoverageLevel;
  if (score === 0) level = 'none';
  else if (score < 40) level = 'minimal';
  else if (score < 70) level = 'partial';
  else if (score < 90) level = 'good';
  else level = 'excellent';

  // Identify missing bindings
  const missingBindings: string[] = [];
  if (!hasLexemes) missingBindings.push('no lexeme entries');
  if (!hasWorkflowVerbs) missingBindings.push('no workflow verbs');
  if (!hasDefaultScopes) missingBindings.push('no default scopes');
  if (!hasSafetyPolicies) missingBindings.push('no safety policies');

  // Generate suggestions
  const suggestions: string[] = [];
  if (!hasLexemes) {
    suggestions.push(`Add lexeme entries for board "${displayName}"`);
  }
  if (!hasWorkflowVerbs) {
    suggestions.push(`Add workflow verbs for "${displayName}" (e.g., "open", "switch to")`);
  }

  return {
    boardId,
    displayName,
    level,
    score,
    hasLexemes,
    hasWorkflowVerbs,
    hasDefaultScopes,
    hasSafetyPolicies,
    missingBindings,
    suggestions,
  };
}

/**
 * Analyze deck coverage from lexemes and metadata.
 */
function analyzeDeckCoverage(deckTypeId: string, displayName: string): DeckCoverage {
  // Find lexemes that reference this deck
  const deckLexemes = CORE_LEXEMES.filter(lex => {
    const sem = lex.semantics;
    return (
      sem && typeof sem === 'object' &&
      ('deckTypeId' in sem && sem.deckTypeId === deckTypeId ||
       'deckType' in sem && sem.deckType === deckTypeId ||
       'deck' in sem && sem.deck === deckTypeId)
    );
  });

  const hasLexemes = deckLexemes.length > 0;

  // Check for action bindings
  const hasActions = deckLexemes.some(lex =>
    lex.category === 'verb' || lex.category === 'verb-phrase'
  );

  // Check for scope definitions (placeholder)
  const hasScopes = false; // Would check deck metadata

  // Calculate score
  let score = 0;
  if (hasLexemes) score += 60;
  if (hasActions) score += 30;
  if (hasScopes) score += 10;

  // Determine coverage level
  let level: CoverageLevel;
  if (score === 0) level = 'none';
  else if (score < 40) level = 'minimal';
  else if (score < 70) level = 'partial';
  else if (score < 90) level = 'good';
  else level = 'excellent';

  // Identify missing bindings
  const missingBindings: string[] = [];
  if (!hasLexemes) missingBindings.push('no lexeme entries');
  if (!hasActions) missingBindings.push('no action verbs');
  if (!hasScopes) missingBindings.push('no scope definitions');

  // Generate suggestions
  const suggestions: string[] = [];
  if (!hasLexemes) {
    suggestions.push(`Add lexeme entries for deck "${displayName}"`);
  }
  if (!hasActions) {
    suggestions.push(`Add action verbs for "${displayName}" (e.g., "open", "move")`);
  }

  return {
    deckTypeId,
    displayName,
    level,
    score,
    hasLexemes,
    hasActions,
    hasScopes,
    missingBindings,
    suggestions,
  };
}

// =============================================================================
// Report Generation
// =============================================================================

/**
 * Generate a complete vocabulary coverage report.
 *
 * Note: In a full implementation, this would query the CardRegistry,
 * BoardRegistry, and DeckRegistry. For now, we use mock data to demonstrate
 * the structure.
 */
export function generateVocabCoverageReport(options?: {
  cards?: Array<{ id: string; name: string }>;
  boards?: Array<{ id: string; name: string }>;
  decks?: Array<{ id: string; name: string }>;
}): VocabCoverageReport {
  // In production, these would come from registries
  const sampleCards = options?.cards ?? [
    { id: 'card:sampler', name: 'Sampler' },
    { id: 'card:synth', name: 'Synthesizer' },
    { id: 'card:reverb', name: 'Reverb' },
    { id: 'card:eq', name: 'EQ' },
    { id: 'card:compressor', name: 'Compressor' },
  ];

  const sampleBoards = options?.boards ?? [
    { id: 'board:arrangement', name: 'Arrangement' },
    { id: 'board:mixer', name: 'Mixer' },
    { id: 'board:composer', name: 'Composer' },
  ];

  const sampleDecks = options?.decks ?? [
    { id: 'deck:timeline', name: 'Timeline' },
    { id: 'deck:mixer', name: 'Mixer' },
    { id: 'deck:piano-roll', name: 'Piano Roll' },
  ];

  // Analyze coverage for each entity
  const cardCoverages = sampleCards.map(card =>
    analyzeCardCoverage(card.id, card.name)
  );

  const boardCoverages = sampleBoards.map(board =>
    analyzeBoardCoverage(board.id, board.name)
  );

  const deckCoverages = sampleDecks.map(deck =>
    analyzeDeckCoverage(deck.id, deck.name)
  );

  // Calculate statistics
  const cardsWithBindings = cardCoverages.filter(c => c.level !== 'none').length;
  const boardsWithBindings = boardCoverages.filter(b => b.level !== 'none').length;
  const decksWithBindings = deckCoverages.filter(d => d.level !== 'none').length;

  const cardsCoveragePercent = (cardsWithBindings / cardCoverages.length) * 100;
  const boardsCoveragePercent = (boardsWithBindings / boardCoverages.length) * 100;
  const decksCoveragePercent = (decksWithBindings / deckCoverages.length) * 100;

  const avgCardScore = cardCoverages.reduce((sum, c) => sum + c.score, 0) / cardCoverages.length;
  const avgBoardScore = boardCoverages.reduce((sum, b) => sum + b.score, 0) / boardCoverages.length;
  const avgDeckScore = deckCoverages.reduce((sum, d) => sum + d.score, 0) / deckCoverages.length;

  const overallScore = (avgCardScore + avgBoardScore + avgDeckScore) / 3;

  // Identify critical gaps
  const criticalGaps: CoverageGap[] = [];

  for (const card of cardCoverages) {
    if (card.level === 'none' || card.level === 'minimal') {
      criticalGaps.push({
        entityType: 'card',
        entityId: card.cardId,
        entityName: card.displayName,
        gap: `No or minimal language bindings`,
        priority: card.level === 'none' ? 1 : 2,
      });
    }
  }

  for (const board of boardCoverages) {
    if (board.level === 'none') {
      criticalGaps.push({
        entityType: 'board',
        entityId: board.boardId,
        entityName: board.displayName,
        gap: `No language bindings`,
        priority: 1,
      });
    }
  }

  // Sort gaps by priority
  criticalGaps.sort((a, b) => a.priority - b.priority);

  // Generate recommendations
  const recommendations: string[] = [];

  if (cardsCoveragePercent < 70) {
    recommendations.push(
      `Card coverage is ${cardsCoveragePercent.toFixed(1)}%. Add lexeme entries for key cards.`
    );
  }

  if (boardsCoveragePercent < 70) {
    recommendations.push(
      `Board coverage is ${boardsCoveragePercent.toFixed(1)}%. Add workflow verbs for boards.`
    );
  }

  if (criticalGaps.length > 0) {
    recommendations.push(
      `${criticalGaps.length} critical gaps identified. Prioritize high-traffic entities.`
    );
  }

  return {
    timestamp: Date.now(),
    stats: {
      totalCards: cardCoverages.length,
      cardsWithBindings,
      cardsCoveragePercent,
      totalBoards: boardCoverages.length,
      boardsWithBindings,
      boardsCoveragePercent,
      totalDecks: deckCoverages.length,
      decksWithBindings,
      decksCoveragePercent,
      overallScore,
    },
    cards: cardCoverages,
    boards: boardCoverages,
    decks: deckCoverages,
    criticalGaps,
    recommendations,
  };
}

// =============================================================================
// Report Formatting
// =============================================================================

/**
 * Format a coverage report for console display.
 */
export function formatCoverageReport(report: VocabCoverageReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(70));
  lines.push('GOFAI Vocabulary Coverage Report');
  lines.push('='.repeat(70));
  lines.push(`Generated: ${new Date(report.timestamp).toISOString()}`);
  lines.push('');

  lines.push('OVERALL STATISTICS');
  lines.push('─'.repeat(70));
  lines.push(`Overall Score: ${report.stats.overallScore.toFixed(1)}/100`);
  lines.push('');
  lines.push(`Cards: ${report.stats.cardsWithBindings}/${report.stats.totalCards} with bindings (${report.stats.cardsCoveragePercent.toFixed(1)}%)`);
  lines.push(`Boards: ${report.stats.boardsWithBindings}/${report.stats.totalBoards} with bindings (${report.stats.boardsCoveragePercent.toFixed(1)}%)`);
  lines.push(`Decks: ${report.stats.decksWithBindings}/${report.stats.totalDecks} with bindings (${report.stats.decksCoveragePercent.toFixed(1)}%)`);
  lines.push('');

  if (report.criticalGaps.length > 0) {
    lines.push('CRITICAL GAPS');
    lines.push('─'.repeat(70));
    for (const gap of report.criticalGaps.slice(0, 10)) {
      lines.push(`[P${gap.priority}] ${gap.entityType.toUpperCase()}: ${gap.entityName}`);
      lines.push(`     ${gap.gap}`);
    }
    lines.push('');
  }

  if (report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    lines.push('─'.repeat(70));
    for (const rec of report.recommendations) {
      lines.push(`• ${rec}`);
    }
    lines.push('');
  }

  lines.push('DETAILED COVERAGE');
  lines.push('─'.repeat(70));
  
  lines.push('');
  lines.push('Cards with Poor Coverage:');
  const poorCards = report.cards.filter(c => c.level === 'none' || c.level === 'minimal');
  for (const card of poorCards.slice(0, 5)) {
    lines.push(`  ${card.displayName} (${card.level}, score: ${card.score})`);
    for (const missing of card.missingBindings) {
      lines.push(`    - Missing: ${missing}`);
    }
  }

  lines.push('');
  lines.push('='.repeat(70));

  return lines.join('\n');
}

/**
 * Log a coverage report to console.
 */
export function logCoverageReport(report: VocabCoverageReport): void {
  console.log(formatCoverageReport(report));
}
