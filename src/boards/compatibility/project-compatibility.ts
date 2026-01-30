/**
 * @fileoverview Project Compatibility - Detect and handle projects using disabled tools
 * 
 * When loading a project that uses cards/tools disabled in the current board,
 * provide warnings and migration paths instead of blocking or breaking.
 * 
 * @module @cardplay/boards/compatibility
 */

import type { Board } from '../types';
import type { BoardCardKind } from '../gating/card-kinds';
import { computeBoardCapabilities } from '../gating/capabilities';

/**
 * Compatibility issue found when loading a project
 */
export interface CompatibilityIssue {
  /** Issue severity */
  readonly severity: 'warning' | 'error';
  /** Issue type */
  readonly type: 'disabled-tool' | 'missing-deck' | 'unsupported-card';
  /** Human-readable message */
  readonly message: string;
  /** Card/deck/tool ID that caused the issue */
  readonly itemId: string;
  /** Recommended board ID for this project */
  readonly recommendedBoardId?: string;
  /** Auto-fix action available */
  readonly autoFixAvailable: boolean;
}

/**
 * Compatibility check result
 */
export interface CompatibilityCheckResult {
  /** Whether project is fully compatible */
  readonly compatible: boolean;
  /** List of issues found */
  readonly issues: readonly CompatibilityIssue[];
  /** Recommended board ID if current board isn't ideal */
  readonly recommendedBoardId?: string;
}

/**
 * Project metadata extracted for compatibility checking
 */
export interface ProjectMetadata {
  /** Card kinds used in project */
  readonly usedCardKinds: ReadonlySet<BoardCardKind>;
  /** Deck types used in project */
  readonly usedDeckTypes: ReadonlySet<string>;
  /** Tool features used in project */
  readonly usedTools: ReadonlySet<string>;
}

/**
 * Check if a project is compatible with the current board
 */
export function checkProjectCompatibility(
  projectMeta: ProjectMetadata,
  currentBoard: Board
): CompatibilityCheckResult {
  const issues: CompatibilityIssue[] = [];
  const capabilities = computeBoardCapabilities(currentBoard);
  const allowedKinds = new Set(capabilities.allowedCardKinds);
  
  // Check for disabled card kinds
  for (const kind of projectMeta.usedCardKinds) {
    if (!allowedKinds.has(kind)) {
      issues.push({
        severity: 'warning',
        type: 'disabled-tool',
        message: `Project uses ${kind} cards which are disabled in "${currentBoard.name}" board`,
        itemId: kind,
        autoFixAvailable: true,
      });
    }
  }
  
  // Check for tool dependencies
  const toolMap: Record<string, keyof typeof currentBoard.compositionTools> = {
    'phrase': 'phraseDatabase',
    'harmony': 'harmonyExplorer',
    'generator': 'phraseGenerators',
    'arranger': 'arrangerCard',
    'ai-composer': 'aiComposer',
  };
  
  for (const tool of projectMeta.usedTools) {
    const toolKey = toolMap[tool];
    if (toolKey && currentBoard.compositionTools[toolKey].mode === 'hidden') {
      issues.push({
        severity: 'warning',
        type: 'disabled-tool',
        message: `Project uses ${tool} features which are disabled in "${currentBoard.name}" board`,
        itemId: tool,
        autoFixAvailable: true,
      });
    }
  }
  
  // Find recommended board if issues exist
  const recommendedBoardId = issues.length > 0 
    ? suggestBoardForProject(projectMeta) 
    : undefined;
  
  return {
    compatible: issues.length === 0,
    issues,
    ...(recommendedBoardId ? { recommendedBoardId } : {}),
  };
}

/**
 * Suggest the best board for a project based on its requirements
 */
function suggestBoardForProject(projectMeta: ProjectMetadata): string | undefined {
  // If project uses generative cards, suggest AI Composition or Composer board
  if (projectMeta.usedCardKinds.has('generative')) {
    return 'ai-composition-board';
  }
  
  // If project uses assisted cards, suggest an assisted board
  if (projectMeta.usedCardKinds.has('assisted')) {
    if (projectMeta.usedTools.has('phrase')) {
      return 'tracker-phrases-board';
    }
    if (projectMeta.usedTools.has('harmony')) {
      return 'notation-harmony-board';
    }
    if (projectMeta.usedTools.has('generator')) {
      return 'session-generators-board';
    }
    return 'composer-board';
  }
  
  // If project uses hints, suggest a hints board
  if (projectMeta.usedCardKinds.has('hint')) {
    return 'tracker-harmony-board';
  }
  
  // Default to composer board (most flexible)
  return 'composer-board';
}

/**
 * Extract project metadata from a loaded project
 */
export function extractProjectMetadata(/* projectData: unknown */): ProjectMetadata {
  // Stub implementation - in real code, walk project structure
  return {
    usedCardKinds: new Set<BoardCardKind>(),
    usedDeckTypes: new Set<string>(),
    usedTools: new Set<string>(),
  };
}

/**
 * Create a compatibility warning banner message
 */
export function createWarningMessage(result: CompatibilityCheckResult): string {
  if (result.compatible) {
    return '';
  }
  
  const issueCount = result.issues.length;
  const plural = issueCount === 1 ? '' : 's';
  
  return `This project uses ${issueCount} disabled tool${plural}. Some features may not be available. ${
    result.recommendedBoardId 
      ? `Consider switching to a board with more tools enabled.`
      : ''
  }`;
}
