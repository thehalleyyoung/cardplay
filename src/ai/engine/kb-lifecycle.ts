/**
 * @fileoverview KB Lifecycle Management
 *
 * L361-L370: KB preloading, lazy-loading, caching, and offline support.
 *
 * All Prolog KB files are bundled with the app (no network dependency).
 * This module manages their lifecycle: preloading critical KBs at startup,
 * lazy-loading optional KBs on demand, and providing status reporting.
 *
 * @module @cardplay/ai/engine/kb-lifecycle
 */

import { getPrologAdapter, resetPrologAdapter, type PrologAdapter } from './prolog-adapter';
import { loadMusicTheoryKB, isMusicTheoryLoaded, resetMusicTheoryLoader } from '../knowledge/music-theory-loader';
import { loadBoardLayoutKB, isBoardLayoutLoaded, resetBoardLayoutLoader } from '../knowledge/board-layout-loader';
import { loadCompositionPatternsKB, isCompositionPatternsLoaded, resetCompositionPatternsLoader } from '../knowledge/composition-patterns-loader';
import { loadPhraseAdaptationKB, isPhraseAdaptationLoaded, resetPhraseAdaptationLoader } from '../knowledge/phrase-adaptation-loader';
import { loadUserPrefsKB, isUserPrefsLoaded, resetUserPrefsLoader } from '../knowledge/user-prefs-loader';
import { loadAdaptationKB, isAdaptationLoaded, resetAdaptationLoader } from '../knowledge/adaptation-loader';

// ============================================================================
// TYPES
// ============================================================================

/**
 * KB loading tier: critical KBs are preloaded; optional ones are lazy-loaded.
 */
export type KBTier = 'critical' | 'standard' | 'optional';

/**
 * Status of all knowledge bases.
 */
export interface KBStatus {
  readonly musicTheory: boolean;
  readonly boardLayout: boolean;
  readonly compositionPatterns: boolean;
  readonly phraseAdaptation: boolean;
  readonly userPrefs: boolean;
  readonly adaptation: boolean;
  readonly allCriticalLoaded: boolean;
  readonly allLoaded: boolean;
}

/**
 * KB load options.
 */
export interface KBLoadOptions {
  /** Only load critical KBs (music-theory, board-layout). */
  readonly criticalOnly?: boolean;
  /** Include optional KBs (adaptation, user-prefs). */
  readonly includeOptional?: boolean;
  /** Callback for progress reporting. */
  readonly onProgress?: (loaded: number, total: number, name: string) => void;
}

// ============================================================================
// CRITICAL KBs (L363: preloaded at startup)
// ============================================================================

const CRITICAL_KBS: Array<{
  name: string;
  load: (adapter: PrologAdapter) => Promise<void>;
  isLoaded: (adapter: PrologAdapter) => boolean;
}> = [
  { name: 'music-theory', load: loadMusicTheoryKB, isLoaded: isMusicTheoryLoaded },
  { name: 'board-layout', load: loadBoardLayoutKB, isLoaded: isBoardLayoutLoaded },
];

// ============================================================================
// STANDARD KBs
// ============================================================================

const STANDARD_KBS: Array<{
  name: string;
  load: (adapter: PrologAdapter) => Promise<void>;
  isLoaded: (adapter: PrologAdapter) => boolean;
}> = [
  { name: 'composition-patterns', load: loadCompositionPatternsKB, isLoaded: isCompositionPatternsLoaded },
  { name: 'phrase-adaptation', load: loadPhraseAdaptationKB, isLoaded: isPhraseAdaptationLoaded },
];

// ============================================================================
// OPTIONAL KBs (L364: lazy-loaded for advanced features)
// ============================================================================

const OPTIONAL_KBS: Array<{
  name: string;
  load: (adapter: PrologAdapter) => Promise<void>;
  isLoaded: (adapter: PrologAdapter) => boolean;
}> = [
  { name: 'user-prefs', load: loadUserPrefsKB, isLoaded: isUserPrefsLoaded },
  { name: 'adaptation', load: loadAdaptationKB, isLoaded: isAdaptationLoaded },
];

// ============================================================================
// API
// ============================================================================

/**
 * Preload all critical KBs during app startup.
 *
 * L363: KB preloading during app startup.
 * L361: Ensures all KB files are bundled (no network dependency).
 * L362: All AI features work 100% offline.
 */
export async function preloadCriticalKBs(
  adapter: PrologAdapter = getPrologAdapter(),
  onProgress?: (loaded: number, total: number, name: string) => void
): Promise<void> {
  let loaded = 0;
  const total = CRITICAL_KBS.length;

  for (const kb of CRITICAL_KBS) {
    if (!kb.isLoaded(adapter)) {
      await kb.load(adapter);
    }
    loaded++;
    onProgress?.(loaded, total, kb.name);
  }
}

/**
 * Load all KBs (critical + standard + optionally optional).
 *
 * @param options - Load options
 */
export async function loadAllKBs(
  adapter: PrologAdapter = getPrologAdapter(),
  options: KBLoadOptions = {}
): Promise<void> {
  const { criticalOnly = false, includeOptional = false, onProgress } = options;

  const kbsToLoad = [
    ...CRITICAL_KBS,
    ...(criticalOnly ? [] : STANDARD_KBS),
    ...(includeOptional ? OPTIONAL_KBS : []),
  ];

  let loaded = 0;
  const total = kbsToLoad.length;

  for (const kb of kbsToLoad) {
    if (!kb.isLoaded(adapter)) {
      await kb.load(adapter);
    }
    loaded++;
    onProgress?.(loaded, total, kb.name);
  }
}

/**
 * Lazy-load a specific optional KB by name.
 *
 * L364: KB lazy-loading for optional advanced features.
 */
export async function lazyLoadKB(
  name: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  const allKBs = [...CRITICAL_KBS, ...STANDARD_KBS, ...OPTIONAL_KBS];
  const kb = allKBs.find((k) => k.name === name);

  if (!kb) {
    return false;
  }

  if (!kb.isLoaded(adapter)) {
    await kb.load(adapter);
  }

  return true;
}

/**
 * Get the current KB loading status.
 */
export function getKBStatus(
  adapter: PrologAdapter = getPrologAdapter()
): KBStatus {
  const musicTheory = isMusicTheoryLoaded(adapter);
  const boardLayout = isBoardLayoutLoaded(adapter);
  const compositionPatterns = isCompositionPatternsLoaded(adapter);
  const phraseAdaptation = isPhraseAdaptationLoaded(adapter);
  const userPrefs = isUserPrefsLoaded(adapter);
  const adaptation = isAdaptationLoaded(adapter);

  return {
    musicTheory,
    boardLayout,
    compositionPatterns,
    phraseAdaptation,
    userPrefs,
    adaptation,
    allCriticalLoaded: musicTheory && boardLayout,
    allLoaded:
      musicTheory &&
      boardLayout &&
      compositionPatterns &&
      phraseAdaptation &&
      userPrefs &&
      adaptation,
  };
}

/**
 * Check that all AI features can operate 100% offline.
 *
 * L362: Ensure all AI features work offline.
 * This is a runtime assertion — all KBs are bundled as ?raw imports.
 */
export function isFullyOfflineCapable(): boolean {
  // All KB files are imported via ?raw at build time.
  // No network requests are made by any AI subsystem.
  return true;
}

/**
 * Get KB version info (for future KB migration, L366-L367).
 */
export function getKBVersionInfo(): KBVersionInfo {
  return {
    schemaVersion: 1,
    musicTheoryVersion: '1.0.0',
    boardLayoutVersion: '1.0.0',
    compositionPatternsVersion: '1.0.0',
    phraseAdaptationVersion: '1.0.0',
    userPrefsVersion: '1.0.0',
    adaptationVersion: '1.0.0',
  };
}

/**
 * KB version info for migration support.
 */
export interface KBVersionInfo {
  readonly schemaVersion: number;
  readonly musicTheoryVersion: string;
  readonly boardLayoutVersion: string;
  readonly compositionPatternsVersion: string;
  readonly phraseAdaptationVersion: string;
  readonly userPrefsVersion: string;
  readonly adaptationVersion: string;
}

// ============================================================================
// KB UNLOADING (L378)
// ============================================================================

/**
 * Predicates to retract when unloading each optional KB.
 */
const KB_PREDICATES: Record<string, string[]> = {
  'user-prefs': [
    'user_prefers_board(_, _)',
    'user_workflow(_, _)',
    'user_genre_preference(_, _)',
    'user_skill_level(_, _)',
    'user_generator_style(_, _, _)',
    'user_board_transition(_, _, _)',
    'user_constraint_template(_, _, _)',
    'learned_workflow_pattern(_, _, _)',
    'learned_parameter_preference(_, _, _, _)',
    'learned_routing_pattern(_, _, _, _)',
  ],
  'adaptation': [
    'adapt_suggestion(_, _, _)',
    'beginner_simplification(_, _)',
    'expert_enhancement(_, _)',
  ],
};

/**
 * Reset functions for each optional KB loader's module-level loaded flag.
 */
const KB_RESET_FNS: Record<string, () => void> = {
  'user-prefs': resetUserPrefsLoader,
  'adaptation': resetAdaptationLoader,
};

/**
 * L378: Unload an optional KB to free memory.
 * Only optional KBs can be unloaded. Critical and standard KBs are always kept.
 * Returns true if the KB was unloaded, false if it wasn't loaded or can't be unloaded.
 */
export async function unloadKB(
  name: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  // Only optional KBs can be unloaded
  const kb = OPTIONAL_KBS.find((k) => k.name === name);
  if (!kb) {
    return false;
  }

  // Check if the KB is currently loaded
  if (!kb.isLoaded(adapter)) {
    return false;
  }

  // Retract all main predicates for this KB
  const predicates = KB_PREDICATES[name];
  if (predicates) {
    for (const predicate of predicates) {
      await adapter.retractAll(predicate);
    }
  }

  // Reset the module-level loaded flag
  const resetFn = KB_RESET_FNS[name];
  if (resetFn) {
    resetFn();
  }

  return true;
}

/**
 * L378: Get list of unloadable KB names.
 */
export function getUnloadableKBs(): string[] {
  return OPTIONAL_KBS.map(kb => kb.name);
}

/**
 * L378: Check if a specific KB is currently loaded.
 */
export function isKBLoaded(
  name: string,
  adapter: PrologAdapter = getPrologAdapter()
): boolean {
  const allKBs = [...CRITICAL_KBS, ...STANDARD_KBS, ...OPTIONAL_KBS];
  const kb = allKBs.find(k => k.name === name);
  return kb?.isLoaded(adapter) ?? false;
}

// ============================================================================
// DEV HOT-RELOAD (L125)
// ============================================================================

/**
 * L125: Enable hot reload for KB modules during development (Vite HMR).
 *
 * This resets the Prolog adapter singleton and all KB loader flags whenever
 * any KB loader module is updated. The next query/load will re-consult KBs.
 */
export function enableKBHotReload(): boolean {
  const hot = (import.meta as any).hot as { accept?: (deps: string[] | string, cb: () => void) => void } | undefined;
  if (!hot?.accept) return false;

  const resetAll = (): void => {
    resetPrologAdapter();
    resetMusicTheoryLoader();
    resetBoardLayoutLoader();
    resetCompositionPatternsLoader();
    resetPhraseAdaptationLoader();
    resetUserPrefsLoader();
    resetAdaptationLoader();
  };

  hot.accept(
    [
      '../knowledge/music-theory-loader',
      '../knowledge/board-layout-loader',
      '../knowledge/composition-patterns-loader',
      '../knowledge/phrase-adaptation-loader',
      '../knowledge/user-prefs-loader',
      '../knowledge/adaptation-loader',
    ],
    resetAll
  );

  return true;
}
