/**
 * @fileoverview AI Engine barrel export.
 * 
 * Exports Prolog adapter and related utilities.
 * 
 * @module @cardplay/ai/engine
 */

export {
  // Prolog Types
  type PrologTerm,
  type PrologAtom,
  type PrologNumber,
  type PrologVariable,
  type PrologList,
  type PrologCompound,
  type PrologSolution,
  type QueryResult,
  type QueryOptions,
  type PrologAdapterConfig,
  
  // HostAction Types
  type HostAction,
  type HostActionSetParam,
  type HostActionInvokeMethod,
  type HostActionAddCard,
  type HostActionRemoveCard,
  type HostActionMoveCard,
  
  // Query Optimization (L368)
  type QueryOptimizationSuggestion,

  // Constants
  DEFAULT_QUERY_OPTIONS,
  DEFAULT_ADAPTER_CONFIG,
  
  // Class
  PrologAdapter,
  
  // Factory functions
  createPrologAdapter,
  getPrologAdapter,
  resetPrologAdapter,
} from './prolog-adapter';

export {
  // KB Lifecycle
  preloadCriticalKBs,
  loadAllKBs,
  lazyLoadKB,
  getKBStatus,
  isFullyOfflineCapable,
  getKBVersionInfo,
  unloadKB,
  getUnloadableKBs,
  isKBLoaded,
  type KBTier,
  type KBStatus,
  type KBLoadOptions,
  type KBVersionInfo,
} from './kb-lifecycle';

export {
  // Performance Monitoring
  PerfMonitor,
  getPerfMonitor,
  resetPerfMonitor,
  type QuerySample,
  type QueryStats,
  type BudgetCheckResult,
  type BudgetViolation,
  type PerformanceBudgets,
} from './perf-monitor';

export {
  // KB IndexedDB Cache (L365)
  KBCache,
  openKBCache,
  type KBCacheEntry,
  type KBCacheOptions,
} from './kb-idb-cache';

export {
  // KB Migration (L367)
  createMigrationRegistry,
  getGlobalMigrationRegistry,
  executeMigration,
  needsMigration,
  type KBMigration,
  type MigrationPlan,
  type MigrationResult,
  type KBMigrationRegistry,
} from './kb-migration';

export {
  // Query Batching (L370)
  createQueryBatch,
  type BatchQueryItem,
  type BatchQueryResult,
  type QueryBatch,
} from './query-batch';
