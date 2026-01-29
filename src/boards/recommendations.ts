/**
 * @fileoverview Board Recommendations
 * 
 * Maps user types to recommended boards based on their background and goals.
 * Used for onboarding and first-run board selection.
 * 
 * @module @cardplay/boards/recommendations
 */

import type { UserType } from './types';
import type { BoardRegistry } from './registry';

// Re-export UserType for convenience
export type { UserType };

// ============================================================================
// USER TYPE → BOARD ID MAPPING
// ============================================================================

/**
 * Recommended boards for each user type.
 * Aligned with cardplayui.md §10.1 recommendations.
 */
const RECOMMENDATIONS: Record<UserType, readonly string[]> = {
  'notation-composer': [
    'notation-manual',
    'notation-harmony-board',
    'composer-board',
  ],
  
  'tracker-user': [
    'basic-tracker',
    'tracker-phrases-board',
    'tracker-harmony-board',
  ],
  
  'producer': [
    'basic-session',
    'session-generators',
    'producer-board',
    'piano-roll-producer',
  ],
  
  'live-performer': [
    'basic-session',
    'session-generators',
    'live-performance-tracker',
    'tracker-phrases-board',
  ],
  
  'sound-designer': [
    'basic-sampler',
    'modular-routing',
    'basic-session',
  ],
  
  'ai-explorer': [
    'session-generators',
    'tracker-harmony-board',
    'tracker-phrases-board',
    'producer-board',
  ],
  
  'beginner': [
    'basic-tracker',
    'notation-manual',
    'basic-session',
  ],
};

// ============================================================================
// RECOMMENDATION FUNCTIONS
// ============================================================================

/**
 * Gets recommended board IDs for a user type.
 */
export function getRecommendedBoardIds(userType: UserType): readonly string[] {
  return RECOMMENDATIONS[userType] ?? [];
}

/**
 * Gets recommended boards for a user type from the registry.
 * Filters out boards that don't exist in the registry.
 */
export function getRecommendedBoards(userType: UserType, registry: BoardRegistry): readonly import('./types').Board[] {
  const boardIds = getRecommendedBoardIds(userType);
  return boardIds
    .map(id => registry.get(id))
    .filter((board): board is import('./types').Board => board !== undefined);
}

/**
 * Gets the default board ID for a user type.
 * Returns the first recommended board.
 */
export function getDefaultBoardId(userType: UserType): string | undefined {
  const boards = getRecommendedBoardIds(userType);
  return boards[0];
}

/**
 * Infers user type from onboarding responses (simplified).
 * In production, this would use more sophisticated logic.
 */
export function inferUserType(responses: {
  background?: string;
  goal?: string;
  experience?: string;
}): UserType {
  const { background, goal, experience } = responses;
  
  // Simple keyword-based inference
  if (background?.includes('notation') || background?.includes('score')) {
    return 'notation-composer';
  }
  
  if (background?.includes('tracker') || background?.includes('mod')) {
    return 'tracker-user';
  }
  
  if (goal?.includes('produce') || goal?.includes('beats')) {
    return 'producer';
  }
  
  if (goal?.includes('live') || goal?.includes('perform')) {
    return 'live-performer';
  }
  
  if (background?.includes('sound design') || goal?.includes('synthesis')) {
    return 'sound-designer';
  }
  
  if (goal?.includes('AI') || goal?.includes('generate')) {
    return 'ai-explorer';
  }
  
  if (experience === 'beginner' || !experience) {
    return 'beginner';
  }
  
  // Default fallback
  return 'beginner';
}
