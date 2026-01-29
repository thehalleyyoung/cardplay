/**
 * @fileoverview Board Policy Helpers
 * 
 * Provides utilities for working with board policies,
 * which define what users can customize in a board.
 * 
 * @module @cardplay/boards/policy
 */

import type { Board, BoardPolicy } from './types';
import { DEFAULT_BOARD_POLICY } from './types';

/**
 * Gets the effective policy for a board.
 * Returns DEFAULT_BOARD_POLICY if no policy is defined.
 */
export function getBoardPolicy(board: Board): BoardPolicy {
  return board.policy ?? DEFAULT_BOARD_POLICY;
}

/**
 * Checks if a board allows a specific customization.
 * 
 * @param board - The board to check
 * @param capability - The policy capability to check
 * @returns True if the customization is allowed
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('composer-board');
 * 
 * if (canCustomize(board, 'allowToolToggles')) {
 *   showToolToggleUI();
 * }
 * ```
 */
export function canCustomize(
  board: Board,
  capability: keyof BoardPolicy
): boolean {
  const policy = getBoardPolicy(board);
  return policy[capability] === true;
}

/**
 * Checks if tool toggles are allowed for a board.
 */
export function canToggleTools(board: Board): boolean {
  return canCustomize(board, 'allowToolToggles');
}

/**
 * Checks if per-track control level override is allowed.
 */
export function canOverrideControlLevel(board: Board): boolean {
  return canCustomize(board, 'allowControlLevelOverridePerTrack');
}

/**
 * Checks if deck customization is allowed.
 */
export function canCustomizeDecks(board: Board): boolean {
  return canCustomize(board, 'allowDeckCustomization');
}

/**
 * Checks if layout customization is allowed.
 */
export function canCustomizeLayout(board: Board): boolean {
  return canCustomize(board, 'allowLayoutCustomization');
}

/**
 * Gets a human-readable description of board policy.
 * 
 * @param board - The board
 * @returns Description of customization capabilities
 * 
 * @example
 * ```ts
 * const desc = getPolicyDescription(board);
 * // "Fixed preset - layout can be customized"
 * ```
 */
export function getPolicyDescription(board: Board): string {
  const policy = getBoardPolicy(board);
  const parts: string[] = [];
  
  if (policy.allowToolToggles) parts.push('tool toggles');
  if (policy.allowControlLevelOverridePerTrack) parts.push('per-track control');
  if (policy.allowDeckCustomization) parts.push('deck customization');
  if (policy.allowLayoutCustomization) parts.push('layout customization');
  
  if (parts.length === 0) {
    return 'Fixed preset - no customization allowed';
  }
  
  if (parts.length === 4) {
    return 'Fully customizable';
  }
  
  return `Customizable: ${parts.join(', ')}`;
}
