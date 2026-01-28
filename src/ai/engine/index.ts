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
