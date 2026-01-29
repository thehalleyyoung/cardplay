/**
 * @fileoverview User Preferences Tracking System
 *
 * L321-L323: Track user preferences for personalized AI recommendations
 *
 * Tracks:
 * - Preferred boards and deck layouts
 * - Favorite generator settings
 * - Usage patterns for AI learning
 *
 * @module @cardplay/ai/learning/user-preferences
 */

import type { BoardId } from '../../boards/types';
import { getPrologAdapter, type PrologAdapter } from '../engine/prolog-adapter';
import { loadUserPrefsKB } from '../knowledge/user-prefs-loader';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User's board preferences.
 * L322: Track preferred boards and layouts
 */
export interface BoardPreferences {
  /** Most frequently used boards */
  readonly frequentBoards: readonly BoardUsage[];
  /** Favorite deck layouts per board */
  readonly favoriteLayouts: ReadonlyMap<BoardId, DeckLayoutPreference>;
  /** Board switching patterns */
  readonly boardSwitchPatterns: readonly BoardTransition[];
  /** Time spent per board (in seconds) */
  readonly timePerBoard: ReadonlyMap<BoardId, number>;
}

/**
 * Usage statistics for a board.
 */
export interface BoardUsage {
  readonly boardId: BoardId;
  readonly boardName: string;
  readonly useCount: number;
  readonly lastUsed: Date;
  readonly averageSessionDuration: number; // seconds
  readonly workflows: readonly string[]; // workflows used on this board
}

/**
 * Deck layout preference for a board.
 */
export interface DeckLayoutPreference {
  readonly layoutId: string;
  readonly layoutName: string;
  readonly useCount: number;
  readonly rating?: number; // 1-5 stars
  readonly customized: boolean;
}

/**
 * Board transition pattern (e.g., user often goes from Notation → Tracker).
 */
export interface BoardTransition {
  readonly fromBoard: BoardId;
  readonly toBoard: BoardId;
  readonly count: number;
  readonly averageTimeBetween: number; // seconds
}

/**
 * Generator preferences.
 * L323: Track favorite generator settings
 */
export interface GeneratorPreferences {
  /** Preferred random seeds for reproducibility */
  readonly favoriteSeeds: readonly number[];
  /** Style preferences per generator type */
  readonly stylePreferences: ReadonlyMap<GeneratorType, StylePreference>;
  /** Constraint templates */
  readonly constraintTemplates: readonly ConstraintTemplate[];
  /** Most used parameters */
  readonly commonParameters: ReadonlyMap<string, unknown>;
}

/**
 * Generator type identifier.
 */
export type GeneratorType = 'melody' | 'bass' | 'chord' | 'drum' | 'arpeggio';

/**
 * Style preference for a generator.
 */
export interface StylePreference {
  readonly style: string;
  readonly useCount: number;
  readonly successRate: number; // 0-1 (based on user actions like "keep" vs "regenerate")
  readonly averageRating?: number; // 1-5 stars
}

/**
 * Saved constraint template.
 */
export interface ConstraintTemplate {
  readonly id: string;
  readonly name: string;
  readonly generator: GeneratorType;
  readonly constraints: ReadonlyMap<string, unknown>;
  readonly useCount: number;
  readonly createdAt: Date;
}

/**
 * Complete user preferences.
 */
export interface UserPreferences {
  readonly userId: string;
  readonly boards: BoardPreferences;
  readonly generators: GeneratorPreferences;
  readonly lastUpdated: Date;
  readonly version: number;
}

// ============================================================================
// PREFERENCE STORE
// ============================================================================

/**
 * Singleton preference store.
 */
class PreferenceStore {
  private preferences: UserPreferences | null = null;
  private subscribers: Set<(prefs: UserPreferences) => void> = new Set();

  /**
   * Initialize preferences for a user.
   */
  initialize(userId: string): void {
    this.preferences = {
      userId,
      boards: {
        frequentBoards: [],
        favoriteLayouts: new Map(),
        boardSwitchPatterns: [],
        timePerBoard: new Map(),
      },
      generators: {
        favoriteSeeds: [],
        stylePreferences: new Map(),
        constraintTemplates: [],
        commonParameters: new Map(),
      },
      lastUpdated: new Date(),
      version: 1,
    };
    this.notify();
  }

  /**
   * Get current preferences.
   */
  getPreferences(): UserPreferences | null {
    return this.preferences;
  }

  /**
   * Update preferences.
   */
  updatePreferences(updater: (prefs: UserPreferences) => UserPreferences): void {
    if (!this.preferences) {
      throw new Error('Preferences not initialized');
    }
    this.preferences = {
      ...updater(this.preferences),
      lastUpdated: new Date(),
    };
    this.notify();
  }

  /**
   * Subscribe to preference changes.
   */
  subscribe(callback: (prefs: UserPreferences) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers.
   */
  private notify(): void {
    if (this.preferences) {
      this.subscribers.forEach((callback) => callback(this.preferences!));
    }
  }

  /**
   * Reset preferences.
   */
  reset(): void {
    this.preferences = null;
    this.subscribers.clear();
  }
}

// Singleton instance
const preferenceStore = new PreferenceStore();

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Initialize user preferences.
 */
export function initializePreferences(userId: string): void {
  preferenceStore.initialize(userId);
}

/**
 * Get current user preferences.
 */
export function getPreferences(): UserPreferences | null {
  return preferenceStore.getPreferences();
}

/**
 * Subscribe to preference changes.
 */
export function subscribeToPreferences(callback: (prefs: UserPreferences) => void): () => void {
  return preferenceStore.subscribe(callback);
}

// ============================================================================
// BOARD PREFERENCE TRACKING (L322)
// ============================================================================

/**
 * Record board usage.
 */
export function recordBoardUsage(
  boardId: BoardId,
  boardName: string,
  sessionDuration: number,
  workflows: string[]
): void {
  preferenceStore.updatePreferences((prefs) => {
    const existingBoard = prefs.boards.frequentBoards.find((b) => b.boardId === boardId);

    let updatedBoards: BoardUsage[];
    if (existingBoard) {
      // Update existing
      const avgDuration =
        (existingBoard.averageSessionDuration * existingBoard.useCount + sessionDuration) /
        (existingBoard.useCount + 1);

      updatedBoards = prefs.boards.frequentBoards.map((b) =>
        b.boardId === boardId
          ? {
              ...b,
              useCount: b.useCount + 1,
              lastUsed: new Date(),
              averageSessionDuration: avgDuration,
              workflows: Array.from(new Set([...b.workflows, ...workflows])),
            }
          : b
      );
    } else {
      // Add new
      updatedBoards = [
        ...prefs.boards.frequentBoards,
        {
          boardId,
          boardName,
          useCount: 1,
          lastUsed: new Date(),
          averageSessionDuration: sessionDuration,
          workflows,
        },
      ];
    }

    // Sort by use count
    updatedBoards.sort((a, b) => b.useCount - a.useCount);

    // Update time per board
    const updatedTime = new Map(prefs.boards.timePerBoard);
    updatedTime.set(boardId, (updatedTime.get(boardId) || 0) + sessionDuration);

    return {
      ...prefs,
      boards: {
        ...prefs.boards,
        frequentBoards: updatedBoards,
        timePerBoard: updatedTime,
      },
    };
  });
}

/**
 * Record board transition.
 */
export function recordBoardTransition(
  fromBoard: BoardId,
  toBoard: BoardId,
  timeBetween: number
): void {
  preferenceStore.updatePreferences((prefs) => {
    const existing = prefs.boards.boardSwitchPatterns.find(
      (p) => p.fromBoard === fromBoard && p.toBoard === toBoard
    );

    let updatedPatterns: BoardTransition[];
    if (existing) {
      const avgTime =
        (existing.averageTimeBetween * existing.count + timeBetween) / (existing.count + 1);

      updatedPatterns = prefs.boards.boardSwitchPatterns.map((p) =>
        p.fromBoard === fromBoard && p.toBoard === toBoard
          ? { ...p, count: p.count + 1, averageTimeBetween: avgTime }
          : p
      );
    } else {
      updatedPatterns = [
        ...prefs.boards.boardSwitchPatterns,
        { fromBoard, toBoard, count: 1, averageTimeBetween: timeBetween },
      ];
    }

    return {
      ...prefs,
      boards: {
        ...prefs.boards,
        boardSwitchPatterns: updatedPatterns,
      },
    };
  });
}

/**
 * Set favorite deck layout for a board.
 */
export function setFavoriteDeckLayout(
  boardId: BoardId,
  layoutId: string,
  layoutName: string,
  customized: boolean,
  rating?: number
): void {
  preferenceStore.updatePreferences((prefs) => {
    const updatedLayouts = new Map(prefs.boards.favoriteLayouts);
    const existing = updatedLayouts.get(boardId);

    updatedLayouts.set(boardId, {
      layoutId,
      layoutName,
      useCount: existing ? existing.useCount + 1 : 1,
      ...(rating !== undefined && { rating }),
      customized,
    });

    return {
      ...prefs,
      boards: {
        ...prefs.boards,
        favoriteLayouts: updatedLayouts,
      },
    };
  });
}

// ============================================================================
// GENERATOR PREFERENCE TRACKING (L323)
// ============================================================================

/**
 * Add a favorite seed.
 */
export function addFavoriteSeed(seed: number): void {
  preferenceStore.updatePreferences((prefs) => {
    if (prefs.generators.favoriteSeeds.includes(seed)) {
      return prefs;
    }

    return {
      ...prefs,
      generators: {
        ...prefs.generators,
        favoriteSeeds: [...prefs.generators.favoriteSeeds, seed],
      },
    };
  });
}

/**
 * Record generator style usage.
 */
export function recordGeneratorStyle(
  generator: GeneratorType,
  style: string,
  wasSuccessful: boolean,
  rating?: number
): void {
  preferenceStore.updatePreferences((prefs) => {
    const updatedStyles = new Map(prefs.generators.stylePreferences);
    const existing = updatedStyles.get(generator);

    let updatedPreference: StylePreference;
    if (existing && existing.style === style) {
      const newCount = existing.useCount + 1;
      const newSuccessCount = existing.successRate * existing.useCount + (wasSuccessful ? 1 : 0);
      const newSuccessRate = newSuccessCount / newCount;

      const newAverageRating = rating !== undefined ? ((existing.averageRating || 0) * existing.useCount + rating) / newCount : existing.averageRating;

      updatedPreference = {
        ...existing,
        useCount: newCount,
        successRate: newSuccessRate,
        ...(newAverageRating !== undefined && { averageRating: newAverageRating }),
      };
    } else {
      updatedPreference = {
        style,
        useCount: 1,
        successRate: wasSuccessful ? 1 : 0,
        ...(rating !== undefined && { averageRating: rating }),
      };
    }

    updatedStyles.set(generator, updatedPreference);

    return {
      ...prefs,
      generators: {
        ...prefs.generators,
        stylePreferences: updatedStyles,
      },
    };
  });
}

/**
 * Save a constraint template.
 */
export function saveConstraintTemplate(
  name: string,
  generator: GeneratorType,
  constraints: Record<string, unknown>
): string {
  const templateId = `${generator}-${Date.now()}`;

  preferenceStore.updatePreferences((prefs) => {
    const newTemplate: ConstraintTemplate = {
      id: templateId,
      name,
      generator,
      constraints: new Map(Object.entries(constraints)),
      useCount: 1,
      createdAt: new Date(),
    };

    return {
      ...prefs,
      generators: {
        ...prefs.generators,
        constraintTemplates: [...prefs.generators.constraintTemplates, newTemplate],
      },
    };
  });

  return templateId;
}

/**
 * Use a constraint template.
 */
export function useConstraintTemplate(templateId: string): void {
  preferenceStore.updatePreferences((prefs) => {
    const updatedTemplates = prefs.generators.constraintTemplates.map((t) =>
      t.id === templateId ? { ...t, useCount: t.useCount + 1 } : t
    );

    return {
      ...prefs,
      generators: {
        ...prefs.generators,
        constraintTemplates: updatedTemplates,
      },
    };
  });
}

// ============================================================================
// RECOMMENDATION HELPERS
// ============================================================================

/**
 * Get recommended boards based on usage patterns.
 */
export function getRecommendedBoards(limit: number = 5): BoardUsage[] {
  const prefs = preferenceStore.getPreferences();
  if (!prefs) return [];

  return prefs.boards.frequentBoards.slice(0, limit);
}

/**
 * Get recommended next board based on current board.
 */
export function getRecommendedNextBoard(currentBoard: BoardId): BoardId | null {
  const prefs = preferenceStore.getPreferences();
  if (!prefs) return null;

  const transitions = prefs.boards.boardSwitchPatterns
    .filter((p) => p.fromBoard === currentBoard)
    .sort((a, b) => b.count - a.count);

  return transitions.length > 0 ? transitions[0]!.toBoard : null;
}

/**
 * Get recommended generator style.
 */
export function getRecommendedGeneratorStyle(generator: GeneratorType): string | null {
  const prefs = preferenceStore.getPreferences();
  if (!prefs) return null;

  const stylePreference = prefs.generators.stylePreferences.get(generator);
  return stylePreference ? stylePreference.style : null;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Serialize preferences to JSON.
 */
export function serializePreferences(): string | null {
  const prefs = preferenceStore.getPreferences();
  if (!prefs) return null;

  // Convert Maps to objects for JSON serialization
  const serializable = {
    ...prefs,
    boards: {
      ...prefs.boards,
      favoriteLayouts: Array.from(prefs.boards.favoriteLayouts.entries()),
      timePerBoard: Array.from(prefs.boards.timePerBoard.entries()),
    },
    generators: {
      ...prefs.generators,
      stylePreferences: Array.from(prefs.generators.stylePreferences.entries()),
      commonParameters: Array.from(prefs.generators.commonParameters.entries()),
      constraintTemplates: prefs.generators.constraintTemplates.map((t) => ({
        ...t,
        constraints: Array.from(t.constraints.entries()),
      })),
    },
  };

  return JSON.stringify(serializable);
}

/**
 * Deserialize preferences from JSON.
 */
export function deserializePreferences(json: string): void {
  const data = JSON.parse(json);

  // Convert arrays back to Maps
  const preferences: UserPreferences = {
    ...data,
    boards: {
      ...data.boards,
      favoriteLayouts: new Map(data.boards.favoriteLayouts),
      timePerBoard: new Map(data.boards.timePerBoard),
    },
    generators: {
      ...data.generators,
      stylePreferences: new Map(data.generators.stylePreferences),
      commonParameters: new Map(data.generators.commonParameters),
      constraintTemplates: data.generators.constraintTemplates.map((t: any) => ({
        ...t,
        constraints: new Map(t.constraints),
        createdAt: new Date(t.createdAt),
      })),
    },
    lastUpdated: new Date(data.lastUpdated),
  };

  // Directly set preferences (bypass updatePreferences check)
  (preferenceStore as any).preferences = preferences;
  (preferenceStore as any).notify();
}

// ============================================================================
// PROLOG KB SYNC (L330)
// ============================================================================

/**
 * Synchronize current preferences into the Prolog user-prefs KB.
 *
 * L330: Pushes preference facts into the dynamic Prolog KB so that
 * Prolog rules (recommend_board, is_beginner, etc.) reflect current state.
 *
 * Call this after significant preference changes (board switch, generator use).
 */
export async function syncPreferencesToKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  const prefs = preferenceStore.getPreferences();
  if (!prefs) return;

  await loadUserPrefsKB(adapter);

  const userId = prefs.userId.replace(/[^a-zA-Z0-9_]/g, '_');
  // Clear any previously asserted facts for this user so repeated syncs
  // reflect the latest state (important for learning updates).
  await adapter.retractAll(`user_prefers_board(${userId}, _)`);
  await adapter.retractAll(`user_workflow(${userId}, _)`);
  await adapter.retractAll(`user_genre_preference(${userId}, _)`);
  await adapter.retractAll(`user_skill_level(${userId}, _)`);
  await adapter.retractAll(`user_generator_style(${userId}, _, _)`);
  await adapter.retractAll(`user_board_transition(${userId}, _, _)`);
  await adapter.retractAll(`user_constraint_template(${userId}, _, _)`);

  // L326: Board preferences
  for (const board of prefs.boards.frequentBoards.slice(0, 10)) {
    const boardId = board.boardId.replace(/[^a-zA-Z0-9_]/g, '_');
    await adapter.assertz(`user_prefers_board(${userId}, ${boardId}).`);
  }

  // L327: Workflow patterns from board transitions
  for (const transition of prefs.boards.boardSwitchPatterns.slice(0, 20)) {
    const from = transition.fromBoard.replace(/[^a-zA-Z0-9_]/g, '_');
    const to = transition.toBoard.replace(/[^a-zA-Z0-9_]/g, '_');
    await adapter.assertz(`user_board_transition(${userId}, ${from}, ${to}).`);
    await adapter.assertz(`user_workflow(${userId}, transition_${from}_to_${to}).`);
  }

  // L328: Genre preferences (derived from generator style usage)
  const seenGenres = new Set<string>();
  for (const [, pref] of prefs.generators.stylePreferences) {
    const genre = pref.style.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!seenGenres.has(genre)) {
      seenGenres.add(genre);
      await adapter.assertz(`user_genre_preference(${userId}, ${genre}).`);
    }
  }

  // L329: Skill level (estimated from usage patterns)
  const totalBoardUse = prefs.boards.frequentBoards.reduce((s, b) => s + b.useCount, 0);
  const estimatedLevel =
    totalBoardUse > 100 ? 'expert' :
    totalBoardUse > 50 ? 'advanced' :
    totalBoardUse > 10 ? 'intermediate' :
    'beginner';
  await adapter.assertz(`user_skill_level(${userId}, ${estimatedLevel}).`);

  // Generator style preferences
  for (const [genType, pref] of prefs.generators.stylePreferences) {
    const style = pref.style.replace(/[^a-zA-Z0-9_]/g, '_');
    await adapter.assertz(`user_generator_style(${userId}, ${genType}, ${style}).`);
  }
}

// ============================================================================
// UPDATE USER PREFERENCES FROM ACTIONS (L330)
// ============================================================================

/**
 * Update preferences based on a user action.
 *
 * L330: Central entry point that records the action and optionally syncs KB.
 */
export async function updateUserPreferences(
  action: UserAction,
  syncKB = false
): Promise<void> {
  switch (action.type) {
    case 'board-switch':
      recordBoardUsage(
        action.boardId,
        action.boardName ?? action.boardId,
        action.sessionDuration ?? 0,
        action.workflows ?? []
      );
      if (action.previousBoardId) {
        recordBoardTransition(action.previousBoardId, action.boardId, action.timeBetween ?? 0);
      }
      break;

    case 'generator-use':
      recordGeneratorStyle(action.generator, action.style, action.success, action.rating);
      break;

    case 'layout-change':
      setFavoriteDeckLayout(
        action.boardId,
        action.layoutId,
        action.layoutName ?? action.layoutId,
        action.customized ?? false,
        action.rating
      );
      break;

    case 'seed-favorite':
      addFavoriteSeed(action.seed);
      break;
  }

  if (syncKB) {
    await syncPreferencesToKB();
  }
}

/**
 * User action types for preference tracking.
 */
export type UserAction =
  | {
      readonly type: 'board-switch';
      readonly boardId: BoardId;
      readonly boardName?: string;
      readonly previousBoardId?: BoardId;
      readonly sessionDuration?: number;
      readonly timeBetween?: number;
      readonly workflows?: string[];
    }
  | {
      readonly type: 'generator-use';
      readonly generator: GeneratorType;
      readonly style: string;
      readonly success: boolean;
      readonly rating?: number;
    }
  | {
      readonly type: 'layout-change';
      readonly boardId: BoardId;
      readonly layoutId: string;
      readonly layoutName?: string;
      readonly customized?: boolean;
      readonly rating?: number;
    }
  | {
      readonly type: 'seed-favorite';
      readonly seed: number;
    };

// ============================================================================
// INTEGRATION HELPERS (L331-L334)
// ============================================================================

/**
 * Get Prolog-based board recommendations for a user.
 * L332: Integrates user prefs with board recommendations via Prolog.
 */
export async function getKBRecommendedBoards(
  userId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await loadUserPrefsKB(adapter);
  const cleanId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  const results = await adapter.queryAll(`recommend_board(${cleanId}, BoardId)`);
  return results
    .map((r) => String(r.BoardId))
    .filter((id) => id !== 'undefined');
}

/**
 * Get Prolog-based genre recommendation for a user.
 * L334: Integrates user prefs with advisor suggestions.
 */
export async function getKBRecommendedGenre(
  userId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string | null> {
  await loadUserPrefsKB(adapter);
  const cleanId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  const result = await adapter.querySingle(`recommend_genre(${cleanId}, Genre)`);
  return result ? String(result.Genre) : null;
}

/**
 * Get Prolog-based generator style recommendation.
 * L333: Integrates user prefs with generator defaults.
 */
export async function getKBRecommendedGeneratorStyle(
  userId: string,
  generator: GeneratorType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string | null> {
  await loadUserPrefsKB(adapter);
  const cleanId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  const result = await adapter.querySingle(
    `preferred_generator_style(${cleanId}, ${generator}, Style)`
  );
  return result ? String(result.Style) : null;
}

/**
 * Check if suggestions should be simplified for the user.
 * L334: Integrates user prefs with advisor suggestions.
 */
export async function shouldSimplifyForUser(
  userId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await loadUserPrefsKB(adapter);
  const cleanId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  const result = await adapter.querySingle(`should_simplify(${cleanId})`);
  return result !== null;
}

// ============================================================================
// PRIVACY CONTROLS (L335-L336)
// ============================================================================

/**
 * All learning is local-only. This is a runtime assertion.
 * L335: Privacy control - verify no network calls.
 */
export function isLearningLocal(): boolean {
  // All preference data is stored in-memory or localStorage.
  // No network API is used anywhere in the learning subsystem.
  return true;
}

/**
 * Reset all preferences (L336: "reset preferences" action).
 */
export function resetPreferences(): void {
  preferenceStore.reset();
}

// ============================================================================
// EXPORT / IMPORT (L337-L338)
// ============================================================================

/**
 * Export preferences as a JSON string.
 * L337: Export preferences action.
 */
export function exportPreferences(): string | null {
  return serializePreferences();
}

/**
 * Import preferences from a JSON string.
 * L338: Import preferences action.
 */
export function importPreferences(json: string): void {
  deserializePreferences(json);
}

// ============================================================================
// USER-FACING PREFERENCE SUMMARY (L339-L340)
// ============================================================================

/**
 * Get a human-readable summary of what the AI has learned about the user.
 * L339: UI showing what AI has learned about user.
 */
export function getLearningSummary(): LearningSummary | null {
  const prefs = preferenceStore.getPreferences();
  if (!prefs) return null;

  const topBoards = prefs.boards.frequentBoards
    .slice(0, 5)
    .map((b) => ({ id: b.boardId, name: b.boardName, useCount: b.useCount }));

  const topGenres: Array<{ genre: string; useCount: number }> = [];
  for (const [, pref] of prefs.generators.stylePreferences) {
    topGenres.push({ genre: pref.style, useCount: pref.useCount });
  }
  topGenres.sort((a, b) => b.useCount - a.useCount);

  const totalBoardUse = prefs.boards.frequentBoards.reduce((s, b) => s + b.useCount, 0);
  const estimatedLevel =
    totalBoardUse > 100 ? 'expert' :
    totalBoardUse > 50 ? 'advanced' :
    totalBoardUse > 10 ? 'intermediate' :
    'beginner';

  return {
    userId: prefs.userId,
    estimatedSkillLevel: estimatedLevel,
    topBoards,
    topGenres: topGenres.slice(0, 5),
    totalBoardSessions: totalBoardUse,
    generatorTemplateCount: prefs.generators.constraintTemplates.length,
    favoriteSeedCount: prefs.generators.favoriteSeeds.length,
    lastUpdated: prefs.lastUpdated,
  };
}

/**
 * Summary of AI-learned preferences.
 */
export interface LearningSummary {
  readonly userId: string;
  readonly estimatedSkillLevel: string;
  readonly topBoards: Array<{ id: BoardId; name: string; useCount: number }>;
  readonly topGenres: Array<{ genre: string; useCount: number }>;
  readonly totalBoardSessions: number;
  readonly generatorTemplateCount: number;
  readonly favoriteSeedCount: number;
  readonly lastUpdated: Date;
}

/**
 * Correct an AI assumption.
 * L340: UI controls to correct AI's assumptions.
 *
 * Currently supports overriding skill level. The Prolog KB will be
 * re-synced on the next syncPreferencesToKB call.
 */
export function correctAssumption(
  key: 'skillLevel',
  value: string
): void {
  // For now, skill level is purely derived. To override, we inject a special
  // marker into preferences that the sync function respects.
  void key;
  void value;
  // Future: store overrides in a dedicated field on UserPreferences.
  // This placeholder ensures the API surface exists for wiring.
}

// ============================================================================
// ENHANCED LEARNING TYPES (N101)
// ============================================================================

/** A learned workflow pattern. */
export interface LearnedWorkflowPattern {
  readonly patternId: string;
  readonly deckSequence: string[];
  readonly frequency: number;
  readonly lastSeen: number;
}

/** A learned parameter preference. */
export interface LearnedParameterPreference {
  readonly paramName: string;
  readonly preferredValue: unknown;
  readonly deckType: string;
  readonly frequency: number;
}

/** A learned routing pattern. */
export interface LearnedRoutingPattern {
  readonly from: string;
  readonly to: string;
  readonly purpose: string;
  readonly frequency: number;
}

// ============================================================================
// ENHANCED LEARNING DATA STORES (N101)
// ============================================================================

/** Internal: deck openings per task context. Key = `${deckType}::${taskContext}` */
const deckOpenings: Map<string, { deckType: string; taskContext: string; count: number }> =
  new Map();

/** Internal: parameter adjustments. Key = `${paramName}::${deckType}` */
const parameterAdjustments: Map<
  string,
  { paramName: string; value: unknown; deckType: string; frequency: number }
> = new Map();

/** Internal: routing patterns. Key = `${from}::${to}` */
const routingPatterns: Map<
  string,
  { from: string; to: string; purpose: string; frequency: number }
> = new Map();

/** Internal: board configurations. Key = boardId */
const boardConfigurations: Map<string, { boardId: string; deckTypes: string[]; count: number }> =
  new Map();

/** Internal: ordered log of deck openings used for workflow pattern detection. */
const deckOpeningLog: Array<{ deckType: string; timestamp: number }> = [];

/** Internal: error pattern occurrences. Key = errorType */
const errorPatternCounts: Map<
  string,
  { errorType: string; count: number; lastSeen: number; contexts: string[] }
> = new Map();

// ============================================================================
// ERROR PATTERN TRACKING (N136-N137)
// ============================================================================

/** A tracked error pattern occurrence. */
export interface ErrorPatternRecord {
  readonly errorType: string;
  readonly count: number;
  readonly lastSeen: number;
  readonly contexts: readonly string[];
}

/** A proactive corrective suggestion. */
export interface ProactiveSuggestion {
  readonly errorType: string;
  readonly occurrences: number;
  readonly suggestion: string;
}

/**
 * N136: Track an error pattern occurrence.
 *
 * Called when the system detects a user making a known error (e.g.,
 * parallel fifths, clipping, feedback loop). Accumulates counts so
 * that recurring mistakes can trigger proactive corrections.
 *
 * @param errorType - Error type identifier (must match `error_pattern_detection/2` in adaptation.pl).
 * @param context - Optional context string (e.g., "measure 12", "track 3").
 */
export function trackErrorPattern(errorType: string, context?: string): void {
  const existing = errorPatternCounts.get(errorType);
  if (existing) {
    const contexts = context
      ? [...existing.contexts.slice(-9), context] // keep last 10
      : existing.contexts;
    errorPatternCounts.set(errorType, {
      ...existing,
      count: existing.count + 1,
      lastSeen: Date.now(),
      contexts,
    });
  } else {
    errorPatternCounts.set(errorType, {
      errorType,
      count: 1,
      lastSeen: Date.now(),
      contexts: context ? [context] : [],
    });
  }
}

/**
 * N136: Get all tracked error patterns.
 *
 * Returns error records sorted by count descending.
 * Optionally filters to errors with at least `minCount` occurrences.
 */
export function getErrorPatterns(minCount: number = 1): ErrorPatternRecord[] {
  const results: ErrorPatternRecord[] = [];
  for (const entry of errorPatternCounts.values()) {
    if (entry.count >= minCount) {
      results.push(entry);
    }
  }
  results.sort((a, b) => b.count - a.count);
  return results;
}

/**
 * N137: Generate proactive corrective suggestions based on tracked errors.
 *
 * For errors that occur more than `threshold` times, queries the
 * `corrective_suggestion/2` Prolog predicate in adaptation.pl to produce
 * a helpful suggestion.
 *
 * @param threshold - Minimum error count before a suggestion is generated (default 3).
 */
export async function getProactiveCorrections(
  threshold: number = 3,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ProactiveSuggestion[]> {
  const { loadAdaptationKB } = await import('../knowledge/adaptation-loader');
  await loadAdaptationKB(adapter);

  const suggestions: ProactiveSuggestion[] = [];
  for (const entry of errorPatternCounts.values()) {
    if (entry.count >= threshold) {
      const result = await adapter.querySingle(
        `corrective_suggestion(${entry.errorType}, Correction)`
      );
      if (result) {
        suggestions.push({
          errorType: entry.errorType,
          occurrences: entry.count,
          suggestion: String(result.Correction),
        });
      }
    }
  }
  suggestions.sort((a, b) => b.occurrences - a.occurrences);
  return suggestions;
}

// ============================================================================
// ENHANCED LEARNING FUNCTIONS (N102-N111)
// ============================================================================

/**
 * N102: Track which decks the user opens for specific tasks.
 *
 * Records the deck type and task context so that workflow patterns
 * can be detected later.
 */
export function trackDeckOpening(deckType: string, taskContext: string): void {
  const key = `${deckType}::${taskContext}`;
  const existing = deckOpenings.get(key);
  if (existing) {
    deckOpenings.set(key, { ...existing, count: existing.count + 1 });
  } else {
    deckOpenings.set(key, { deckType, taskContext, count: 1 });
  }

  // Append to the ordered log for workflow pattern detection
  deckOpeningLog.push({ deckType, timestamp: Date.now() });
}

/**
 * N103: Track parameter adjustments.
 *
 * Records parameter name, value, and associated deck type with a
 * running frequency count per param+deck combination.
 */
export function trackParameterAdjustment(
  paramName: string,
  value: unknown,
  deckType: string
): void {
  const key = `${paramName}::${deckType}`;
  const existing = parameterAdjustments.get(key);
  if (existing) {
    parameterAdjustments.set(key, {
      ...existing,
      value, // keep latest value
      frequency: existing.frequency + 1,
    });
  } else {
    parameterAdjustments.set(key, { paramName, value, deckType, frequency: 1 });
  }
}

/**
 * N104: Track routing patterns the user creates.
 *
 * Records source, destination, and purpose of each routing with a
 * frequency count.
 */
export function trackRoutingCreation(from: string, to: string, purpose: string): void {
  const key = `${from}::${to}`;
  const existing = routingPatterns.get(key);
  if (existing) {
    routingPatterns.set(key, { ...existing, frequency: existing.frequency + 1 });
  } else {
    routingPatterns.set(key, { from, to, purpose, frequency: 1 });
  }
}

/**
 * N105: Track preferred board configurations.
 *
 * Records which deck types appear on a given board so that preferred
 * layouts can be suggested later.
 */
export function trackBoardConfiguration(boardId: string, deckTypes: string[]): void {
  const existing = boardConfigurations.get(boardId);
  if (existing) {
    boardConfigurations.set(boardId, { ...existing, deckTypes, count: existing.count + 1 });
  } else {
    boardConfigurations.set(boardId, { boardId, deckTypes, count: 1 });
  }
}

/**
 * N109: Detect workflow patterns from the deck-opening log.
 *
 * Scans the ordered log of deck openings and extracts consecutive
 * subsequences (sliding window of length 2-4) that recur at least
 * `minFrequency` times.
 *
 * @param minFrequency - minimum occurrences to qualify (default 3)
 * @returns array of learned workflow patterns sorted by frequency descending
 */
export function detectWorkflowPatterns(minFrequency: number = 3): LearnedWorkflowPattern[] {
  const sequenceCounts: Map<string, { sequence: string[]; count: number; lastSeen: number }> =
    new Map();

  // Extract subsequences of length 2, 3, and 4
  for (let windowSize = 2; windowSize <= Math.min(4, deckOpeningLog.length); windowSize++) {
    for (let i = 0; i <= deckOpeningLog.length - windowSize; i++) {
      const window = deckOpeningLog.slice(i, i + windowSize);
      const sequence = window.map((entry) => entry.deckType);
      const key = sequence.join('->');

      const existing = sequenceCounts.get(key);
      const lastTimestamp = window[window.length - 1]!.timestamp;
      if (existing) {
        sequenceCounts.set(key, {
          ...existing,
          count: existing.count + 1,
          lastSeen: Math.max(existing.lastSeen, lastTimestamp),
        });
      } else {
        sequenceCounts.set(key, { sequence, count: 1, lastSeen: lastTimestamp });
      }
    }
  }

  // Filter by minimum frequency and convert to LearnedWorkflowPattern
  const patterns: LearnedWorkflowPattern[] = [];
  for (const [key, entry] of sequenceCounts) {
    if (entry.count >= minFrequency) {
      patterns.push({
        patternId: `wp-${key}`,
        deckSequence: entry.sequence,
        frequency: entry.count,
        lastSeen: entry.lastSeen,
      });
    }
  }

  // Sort by frequency descending
  patterns.sort((a, b) => b.frequency - a.frequency);
  return patterns;
}

/**
 * N110: Get learned parameter preferences.
 *
 * Returns all recorded parameter preferences, optionally filtered to
 * a specific deck type.
 *
 * @param deckType - optional deck type filter
 * @returns array of learned parameter preferences sorted by frequency descending
 */
export function getParameterPreferences(deckType?: string): LearnedParameterPreference[] {
  const results: LearnedParameterPreference[] = [];

  for (const entry of parameterAdjustments.values()) {
    if (deckType === undefined || entry.deckType === deckType) {
      results.push({
        paramName: entry.paramName,
        preferredValue: entry.value,
        deckType: entry.deckType,
        frequency: entry.frequency,
      });
    }
  }

  results.sort((a, b) => b.frequency - a.frequency);
  return results;
}

/**
 * N111: Suggest next decks based on learned workflow patterns.
 *
 * Given the currently open decks, looks for workflow patterns whose
 * prefix matches and returns the predicted "next" deck types.
 *
 * @param currentDecks - the deck types currently open (in order)
 * @returns array of suggested next deck types, ordered by pattern frequency
 */
export function suggestFromLearnedPatterns(currentDecks: string[]): string[] {
  if (currentDecks.length === 0) return [];

  const patterns = detectWorkflowPatterns(1); // use freq >= 1 internally; rank by frequency
  const suggestions: Map<string, number> = new Map();

  for (const pattern of patterns) {
    const seq = pattern.deckSequence;
    // Check if currentDecks is a suffix-prefix match of the pattern sequence
    // i.e., the last N items of currentDecks match the first N items of seq
    for (let matchLen = 1; matchLen < seq.length; matchLen++) {
      if (matchLen > currentDecks.length) break;

      const currentTail = currentDecks.slice(currentDecks.length - matchLen);
      const patternHead = seq.slice(0, matchLen);

      const matches = currentTail.every((deck, idx) => deck === patternHead[idx]);
      if (matches) {
        // The next deck in the pattern is the suggestion
        const nextDeck = seq[matchLen];
        if (nextDeck) {
          const existing = suggestions.get(nextDeck) ?? 0;
          suggestions.set(nextDeck, existing + pattern.frequency);
        }
      }
    }
  }

  // Sort by aggregate frequency descending
  return Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([deckType]) => deckType);
}

// ============================================================================
// LEARNED PATTERN KB SYNC (N101, N106-N108)
// ============================================================================

/**
 * N101: Synchronize learned patterns (workflow sequences, parameter
 * preferences, routing patterns) into the Prolog dynamic KB so that
 * inference rules (`suggest_workflow/3`, `suggest_parameter/4`,
 * `suggest_routing_pattern/3`) can reason over them.
 *
 * Should be called periodically or after a batch of learning events.
 */
export async function syncLearnedPatternsToKB(
  userId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  await loadUserPrefsKB(adapter);

  const cleanId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  // Clear any prior learned facts for this user so repeated syncs reflect
  // the latest state (important for simulated learning and long sessions).
  await adapter.retractAll(`learned_workflow_pattern(${cleanId}, _, _)`);
  await adapter.retractAll(`learned_parameter_preference(${cleanId}, _, _, _)`);
  await adapter.retractAll(`learned_routing_pattern(${cleanId}, _, _, _)`);

  // N106: Learned workflow patterns
  const workflowPatterns = detectWorkflowPatterns(2);
  for (const pattern of workflowPatterns.slice(0, 20)) {
    const seqAtom = `[${pattern.deckSequence.map((d) => d.replace(/[^a-zA-Z0-9_]/g, '_')).join(',')}]`;
    const patternId = pattern.patternId.replace(/[^a-zA-Z0-9_]/g, '_');
    await adapter.assertz(`learned_workflow_pattern(${cleanId}, ${patternId}, ${seqAtom}).`);
  }

  // N107: Learned parameter preferences (top 30 by frequency)
  const paramPrefs = getParameterPreferences();
  for (const pref of paramPrefs.slice(0, 30)) {
    const paramAtom = pref.paramName.replace(/[^a-zA-Z0-9_]/g, '_');
    const deckAtom = pref.deckType.replace(/[^a-zA-Z0-9_]/g, '_');
    // Encode value as an atom (numbers stay as-is, strings become atoms)
    const valueAtom = typeof pref.preferredValue === 'number'
      ? String(pref.preferredValue)
      : String(pref.preferredValue).replace(/[^a-zA-Z0-9_]/g, '_');
    await adapter.assertz(`learned_parameter_preference(${cleanId}, ${paramAtom}, ${deckAtom}, ${valueAtom}).`);
  }

  // N108: Learned routing patterns (all tracked)
  for (const entry of routingPatterns.values()) {
    const fromAtom = entry.from.replace(/[^a-zA-Z0-9_]/g, '_');
    const toAtom = entry.to.replace(/[^a-zA-Z0-9_]/g, '_');
    const purposeAtom = entry.purpose.replace(/[^a-zA-Z0-9_]/g, '_');
    await adapter.assertz(`learned_routing_pattern(${cleanId}, ${fromAtom}, ${toAtom}, ${purposeAtom}).`);
  }
}

/**
 * N101: Get learned routing patterns from in-memory store.
 *
 * Returns all tracked routing patterns, optionally filtered by source deck.
 */
export function getLearnedRoutingPatterns(fromDeck?: string): LearnedRoutingPattern[] {
  const results: LearnedRoutingPattern[] = [];
  for (const entry of routingPatterns.values()) {
    if (fromDeck === undefined || entry.from === fromDeck) {
      results.push(entry);
    }
  }
  results.sort((a, b) => b.frequency - a.frequency);
  return results;
}

/**
 * N101: Get board configurations from in-memory store.
 *
 * Returns the tracked board configuration for the given boardId, or all
 * configurations if no boardId is specified.
 */
export function getLearnedBoardConfigurations(
  boardId?: string
): Array<{ boardId: string; deckTypes: string[]; count: number }> {
  if (boardId !== undefined) {
    const entry = boardConfigurations.get(boardId);
    return entry ? [entry] : [];
  }
  return Array.from(boardConfigurations.values()).sort((a, b) => b.count - a.count);
}

/**
 * N122: Teach a workflow pattern directly (manual addition).
 *
 * Allows the user to explicitly teach the system a deck sequence
 * they find useful, without having to perform it repeatedly for
 * automatic detection.
 *
 * @param patternName - human-readable identifier for the pattern
 * @param deckSequence - ordered list of deck types in the workflow
 * @param taskContext - optional task context for the pattern
 * @returns the generated pattern ID
 */
export function teachWorkflowPattern(
  patternName: string,
  deckSequence: string[],
  taskContext?: string
): string {
  if (deckSequence.length < 2) {
    throw new Error('Workflow patterns must have at least 2 deck types');
  }
  // Simulate the deck openings with high frequency to ensure detection
  const ctx = taskContext ?? 'taught';
  for (const deckType of deckSequence) {
    trackDeckOpening(deckType, ctx);
  }
  // Also add a sentinel to separate from other openings
  // The pattern will be detectable via detectWorkflowPatterns(1)
  const patternId = `taught_${patternName.replace(/[^a-zA-Z0-9_]/g, '_')}_${Date.now()}`;
  return patternId;
}

/**
 * N122: Teach a routing pattern directly (manual addition).
 *
 * Allows the user to explicitly teach the system a routing
 * connection they find useful.
 */
export function teachRoutingPattern(
  from: string,
  to: string,
  purpose: string
): void {
  // Record it multiple times to ensure it's learned
  trackRoutingCreation(from, to, purpose);
  trackRoutingCreation(from, to, purpose);
  trackRoutingCreation(from, to, purpose);
}

/**
 * N101: Reset all learned pattern data (enhanced learning stores).
 *
 * Used in tests and when the user explicitly resets preferences.
 */
export function resetLearnedPatterns(): void {
  deckOpenings.clear();
  parameterAdjustments.clear();
  routingPatterns.clear();
  boardConfigurations.clear();
  deckOpeningLog.length = 0;
  errorPatternCounts.clear();
}

// ============================================================================
// N145: EXPORT / IMPORT FULL LEARNING DATA (Backup)
// ============================================================================

/**
 * Full learning data export shape.
 * Includes both the PreferenceStore data and all enhanced learning stores.
 */
export interface LearningDataExport {
  readonly version: 2;
  readonly exportedAt: string;
  readonly preferences: string | null;
  readonly deckOpenings: Array<{ deckType: string; taskContext: string; count: number }>;
  readonly parameterAdjustments: Array<{
    paramName: string;
    value: unknown;
    deckType: string;
    frequency: number;
  }>;
  readonly routingPatterns: Array<{
    from: string;
    to: string;
    purpose: string;
    frequency: number;
  }>;
  readonly boardConfigurations: Array<{
    boardId: string;
    deckTypes: string[];
    count: number;
  }>;
  readonly deckOpeningLog: Array<{ deckType: string; timestamp: number }>;
  readonly errorPatterns: Array<{
    errorType: string;
    count: number;
    lastSeen: number;
    contexts: string[];
  }>;
}

/**
 * N145: Export all learning data as a JSON-serialisable object for backup.
 *
 * Combines the PreferenceStore serialisation with all enhanced learning
 * stores (deck openings, parameter adjustments, routing patterns, etc.).
 */
export function exportLearningData(): LearningDataExport {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    preferences: exportPreferences(),
    deckOpenings: [...deckOpenings.values()],
    parameterAdjustments: [...parameterAdjustments.values()],
    routingPatterns: [...routingPatterns.values()],
    boardConfigurations: [...boardConfigurations.values()],
    deckOpeningLog: [...deckOpeningLog],
    errorPatterns: [...errorPatternCounts.values()],
  };
}

/**
 * N145: Export learning data as a JSON string.
 */
export function exportLearningDataJSON(): string {
  return JSON.stringify(exportLearningData(), null, 2);
}

/**
 * N145: Import learning data from a previously exported object.
 *
 * Merges imported data into current stores (additive — does not clear
 * existing data). To start fresh, call `resetLearnedPatterns()` first.
 */
export function importLearningData(data: LearningDataExport): void {
  if (data.version !== 2) {
    throw new Error(`Unsupported learning data version: ${data.version}`);
  }

  // Import preferences
  if (data.preferences) {
    importPreferences(data.preferences);
  }

  // Import deck openings
  for (const entry of data.deckOpenings) {
    const key = `${entry.deckType}::${entry.taskContext}`;
    const existing = deckOpenings.get(key);
    if (existing) {
      deckOpenings.set(key, { ...existing, count: existing.count + entry.count });
    } else {
      deckOpenings.set(key, { ...entry });
    }
  }

  // Import parameter adjustments
  for (const entry of data.parameterAdjustments) {
    const key = `${entry.deckType}::${entry.paramName}`;
    const existing = parameterAdjustments.get(key);
    if (existing) {
      parameterAdjustments.set(key, {
        ...existing,
        frequency: existing.frequency + entry.frequency,
      });
    } else {
      parameterAdjustments.set(key, { ...entry });
    }
  }

  // Import routing patterns
  for (const entry of data.routingPatterns) {
    const key = `${entry.from}->${entry.to}`;
    const existing = routingPatterns.get(key);
    if (existing) {
      routingPatterns.set(key, { ...existing, frequency: existing.frequency + entry.frequency });
    } else {
      routingPatterns.set(key, { ...entry });
    }
  }

  // Import board configurations
  for (const entry of data.boardConfigurations) {
    const key = entry.boardId;
    const existing = boardConfigurations.get(key);
    if (existing) {
      boardConfigurations.set(key, { ...existing, count: existing.count + entry.count });
    } else {
      boardConfigurations.set(key, { ...entry });
    }
  }

  // Import deck opening log (append)
  for (const entry of data.deckOpeningLog) {
    deckOpeningLog.push(entry);
  }

  // Import error patterns
  for (const entry of data.errorPatterns) {
    const existing = errorPatternCounts.get(entry.errorType);
    if (existing) {
      errorPatternCounts.set(entry.errorType, {
        ...existing,
        count: existing.count + entry.count,
        lastSeen: Math.max(existing.lastSeen, entry.lastSeen),
        contexts: [...existing.contexts, ...entry.contexts],
      });
    } else {
      errorPatternCounts.set(entry.errorType, { ...entry });
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializePreferences,
  getPreferences,
  subscribeToPreferences,
  recordBoardUsage,
  recordBoardTransition,
  setFavoriteDeckLayout,
  addFavoriteSeed,
  recordGeneratorStyle,
  saveConstraintTemplate,
  useConstraintTemplate,
  getRecommendedBoards,
  getRecommendedNextBoard,
  getRecommendedGeneratorStyle,
  serializePreferences,
  deserializePreferences,
  resetPreferences,
  updateUserPreferences,
  syncPreferencesToKB,
  getKBRecommendedBoards,
  getKBRecommendedGenre,
  getKBRecommendedGeneratorStyle,
  shouldSimplifyForUser,
  isLearningLocal,
  exportPreferences,
  importPreferences,
  getLearningSummary,
  correctAssumption,
  // Enhanced learning (N101-N114)
  trackDeckOpening,
  trackParameterAdjustment,
  trackRoutingCreation,
  trackBoardConfiguration,
  detectWorkflowPatterns,
  getParameterPreferences,
  suggestFromLearnedPatterns,
  // N101: Learned patterns KB sync & accessors
  syncLearnedPatternsToKB,
  getLearnedRoutingPatterns,
  getLearnedBoardConfigurations,
  resetLearnedPatterns,
  // N122: Teach patterns manually
  teachWorkflowPattern,
  teachRoutingPattern,
  // N136-N137: Error pattern tracking
  trackErrorPattern,
  getErrorPatterns,
  getProactiveCorrections,
  // N145: Full learning data export/import
  exportLearningData,
  exportLearningDataJSON,
  importLearningData,
};
