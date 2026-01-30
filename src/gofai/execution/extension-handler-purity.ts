/**
 * @file Extension Handler Purity Enforcement (Step 332)
 * @module gofai/execution/extension-handler-purity
 * 
 * Implements Step 332: Enforce extension handler purity: forbid direct store
 * mutation in extension code paths; require returning pure patch objects.
 * 
 * This module provides enforcement mechanisms to ensure extension handlers
 * remain pure functions that propose changes rather than directly mutating
 * project state. This is critical for:
 * - Transactional integrity (rollback must work)
 * - Constraint validation (must happen before commit)
 * - Debugging and provenance (know what changed and why)
 * - Security (untrusted extensions can't corrupt state)
 * 
 * Enforcement strategies:
 * 1. Capability-based access control (handlers get read-only views)
 * 2. Type system enforcement (no mutable references passed)
 * 3. Runtime monitoring (detect mutation attempts)
 * 4. Sandboxing (isolate handler execution)
 * 5. Static analysis (lint handler code for violations)
 * 
 * Design principles:
 * - Handlers receive immutable project state snapshots
 * - Handlers return pure data (ProposedChanges)
 * - No access to store mutation APIs
 * - No shared mutable state
 * - Exceptions don't leak mutations
 * - Failed handlers leave no side effects
 * 
 * @see gofai_goalB.md Step 332
 * @see gofai_goalB.md Step 331 (extension opcode compilation)
 * @see gofai_goalB.md Step 333 (unknown opcode behavior)
 * @see src/gofai/execution/extension-opcode-compilation.ts
 * @see docs/gofai/extension-security.md
 */

import type {
  ExtensionOpcodeHandler,
  ExtensionOpcodeContext,
  ExtensionOpcodeResult,
  ProposedChanges,
} from './extension-opcode-compilation.js';
import type { ProjectState } from './transactional-execution.js';

// ============================================================================
// Immutable Project State View
// ============================================================================

/**
 * Read-only view of project state for extension handlers.
 * 
 * This is a deep-frozen snapshot that prevents any mutations.
 * Handlers can read but not write.
 */
export interface ImmutableProjectStateView {
  readonly events: ImmutableEventCollection;
  readonly tracks: ImmutableTrackCollection;
  readonly cards: ImmutableCardCollection;
  readonly sections: ImmutableSectionCollection;
  readonly routing: ImmutableRoutingCollection;
  readonly metadata: ImmutableProjectMetadata;
}

/**
 * Read-only event collection.
 */
export interface ImmutableEventCollection {
  readonly get: (id: string) => ImmutableEvent | undefined;
  readonly getAll: () => readonly ImmutableEvent[];
  readonly query: (selector: EventSelector) => readonly ImmutableEvent[];
  readonly count: () => number;
}

/**
 * Read-only event.
 */
export interface ImmutableEvent {
  readonly id: string;
  readonly trackId: string;
  readonly onset: number;
  readonly duration: number;
  readonly payload: unknown;
  readonly tags: readonly string[];
}

/**
 * Read-only track collection.
 */
export interface ImmutableTrackCollection {
  readonly get: (id: string) => ImmutableTrack | undefined;
  readonly getAll: () => readonly ImmutableTrack[];
  readonly count: () => number;
}

/**
 * Read-only track.
 */
export interface ImmutableTrack {
  readonly id: string;
  readonly label: string;
  readonly role?: string;
  readonly tags: readonly string[];
}

/**
 * Read-only card collection.
 */
export interface ImmutableCardCollection {
  readonly get: (id: string) => ImmutableCard | undefined;
  readonly getAll: () => readonly ImmutableCard[];
  readonly count: () => number;
}

/**
 * Read-only card.
 */
export interface ImmutableCard {
  readonly id: string;
  readonly cardType: string;
  readonly trackId?: string;
  readonly label?: string;
  readonly parameters: Readonly<Record<string, unknown>>;
}

/**
 * Read-only section collection.
 */
export interface ImmutableSectionCollection {
  readonly get: (id: string) => ImmutableSection | undefined;
  readonly getAll: () => readonly ImmutableSection[];
  readonly count: () => number;
}

/**
 * Read-only section.
 */
export interface ImmutableSection {
  readonly id: string;
  readonly label: string;
  readonly startBar: number;
  readonly endBar?: number;
  readonly tags: readonly string[];
}

/**
 * Read-only routing collection.
 */
export interface ImmutableRoutingCollection {
  readonly getConnections: () => readonly ImmutableConnection[];
  readonly count: () => number;
}

/**
 * Read-only connection.
 */
export interface ImmutableConnection {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly type?: string;
}

/**
 * Read-only project metadata.
 */
export interface ImmutableProjectMetadata {
  readonly tempo?: number;
  readonly timeSignature?: { readonly numerator: number; readonly denominator: number };
  readonly key?: string;
  readonly [key: string]: unknown;
}

/**
 * Event selector (same as in extension-opcode-compilation.ts).
 */
export interface EventSelector {
  readonly scope?: { startBar: number; endBar: number };
  readonly tags?: readonly string[];
  readonly trackId?: string;
}

// ============================================================================
// Purity Enforcement
// ============================================================================

/**
 * Creates an immutable view of project state.
 * 
 * This performs deep freezing to prevent any mutations.
 */
export function createImmutableView(state: ProjectState): ImmutableProjectStateView {
  // Create frozen copies of collections
  const events = freezeEventCollection(state.events);
  const tracks = freezeTrackCollection(state.tracks);
  const cards = freezeCardCollection(state.cards);
  const sections = freezeSectionCollection(state.sections);
  const routing = freezeRoutingCollection(state.routing);
  const metadata = deepFreeze(state.metadata);
  
  return Object.freeze({
    events,
    tracks,
    cards,
    sections,
    routing,
    metadata,
  });
}

/**
 * Freeze event collection.
 */
function freezeEventCollection(collection: any): ImmutableEventCollection {
  const allEvents = collection.getAll().map((e: any) => deepFreeze({
    id: e.id,
    trackId: e.trackId,
    onset: e.onset,
    duration: e.duration,
    payload: e.payload,
    tags: [...(e.tags || [])],
  }));
  
  return Object.freeze({
    get: (id: string) => allEvents.find((e: any) => e.id === id),
    getAll: () => allEvents,
    query: (selector: EventSelector) => {
      // Simple query implementation
      return allEvents.filter((e: any) => {
        if (selector.trackId && e.trackId !== selector.trackId) {
          return false;
        }
        if (selector.tags && !selector.tags.every(tag => e.tags.includes(tag))) {
          return false;
        }
        return true;
      });
    },
    count: () => allEvents.length,
  });
}

/**
 * Freeze track collection.
 */
function freezeTrackCollection(collection: any): ImmutableTrackCollection {
  const allTracks = collection.getAll().map((t: any) => deepFreeze({
    id: t.id,
    label: t.label,
    role: t.role,
    tags: [...(t.tags || [])],
  }));
  
  return Object.freeze({
    get: (id: string) => allTracks.find((t: any) => t.id === id),
    getAll: () => allTracks,
    count: () => allTracks.length,
  });
}

/**
 * Freeze card collection.
 */
function freezeCardCollection(collection: any): ImmutableCardCollection {
  const allCards = collection.getAll().map((c: any) => deepFreeze({
    id: c.id,
    cardType: c.cardType,
    trackId: c.trackId,
    label: c.label,
    parameters: { ...(c.parameters || {}) },
  }));
  
  return Object.freeze({
    get: (id: string) => allCards.find((c: any) => c.id === id),
    getAll: () => allCards,
    count: () => allCards.length,
  });
}

/**
 * Freeze section collection.
 */
function freezeSectionCollection(collection: any): ImmutableSectionCollection {
  const allSections = collection.getAll().map((s: any) => deepFreeze({
    id: s.id,
    label: s.label,
    startBar: s.startBar,
    endBar: s.endBar,
    tags: [...(s.tags || [])],
  }));
  
  return Object.freeze({
    get: (id: string) => allSections.find((s: any) => s.id === id),
    getAll: () => allSections,
    count: () => allSections.length,
  });
}

/**
 * Freeze routing collection.
 */
function freezeRoutingCollection(collection: any): ImmutableRoutingCollection {
  const allConnections = (collection.getConnections?.() || []).map((c: any) => deepFreeze({
    id: c.id,
    sourceId: c.sourceId,
    targetId: c.targetId,
    type: c.type,
  }));
  
  return Object.freeze({
    getConnections: () => allConnections,
    count: () => allConnections.length,
  });
}

/**
 * Deep freeze an object recursively.
 */
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  Object.freeze(obj);
  
  for (const key of Object.keys(obj)) {
    const value = (obj as any)[key];
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  }
  
  return obj;
}

// ============================================================================
// Handler Wrapper with Purity Enforcement
// ============================================================================

/**
 * Violation of purity detected during handler execution.
 */
export interface PurityViolation {
  readonly type: 'mutation_attempt' | 'forbidden_access' | 'exception_with_side_effects';
  readonly message: string;
  readonly stackTrace?: string;
  readonly context?: unknown;
}

/**
 * Result of purity-enforced handler execution.
 */
export type PureHandlerResult =
  | { readonly status: 'success'; readonly result: ExtensionOpcodeResult }
  | { readonly status: 'purity_violation'; readonly violation: PurityViolation };

/**
 * Wraps an extension handler to enforce purity.
 */
export class PureHandlerWrapper {
  /**
   * Execute a handler with purity enforcement.
   */
  static async execute(
    handler: ExtensionOpcodeHandler,
    context: ExtensionOpcodeContext
  ): Promise<PureHandlerResult> {
    // Create immutable view of project state
    const immutableState = createImmutableView(context.projectState);
    
    // Create safe context (with immutable state)
    const safeContext: ExtensionOpcodeContext = {
      ...context,
      projectState: immutableState as any, // Type cast safe because immutable
    };
    
    try {
      // Execute handler
      const result = await handler(safeContext);
      
      // Validate result is pure (no mutable references)
      const validationError = this.validateResult(result);
      if (validationError) {
        return {
          status: 'purity_violation',
          violation: {
            type: 'mutation_attempt',
            message: validationError,
          },
        };
      }
      
      return {
        status: 'success',
        result,
      };
    } catch (error) {
      // Check if error indicates a purity violation
      if (this.isPurityError(error)) {
        return {
          status: 'purity_violation',
          violation: {
            type: 'forbidden_access',
            message: error instanceof Error ? error.message : 'Unknown purity violation',
            stackTrace: error instanceof Error ? error.stack : undefined,
          },
        };
      }
      
      // Regular error (handler threw)
      return {
        status: 'success',
        result: {
          status: 'error',
          error: {
            code: 'HANDLER_EXCEPTION',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error,
            recoverable: false,
          },
        },
      };
    }
  }
  
  /**
   * Validate that result contains no mutable references.
   */
  private static validateResult(result: ExtensionOpcodeResult): string | null {
    if (result.status !== 'success') {
      return null; // Errors and skips don't need validation
    }
    
    // Check that proposed changes are serializable (implies no functions/mutable refs)
    try {
      JSON.stringify(result.changes);
      return null;
    } catch (error) {
      return 'Result contains non-serializable data (functions or circular references)';
    }
  }
  
  /**
   * Check if an error indicates a purity violation.
   */
  private static isPurityError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('freeze') ||
        message.includes('immutable') ||
        message.includes('read-only') ||
        message.includes('cannot assign')
      );
    }
    return false;
  }
}

// ============================================================================
// Static Analysis Helpers
// ============================================================================

/**
 * Forbidden patterns in handler code (for static analysis).
 */
export const FORBIDDEN_PATTERNS = [
  /\.add\(/,
  /\.remove\(/,
  /\.update\(/,
  /\.modify\(/,
  /\.set\(/,
  /\.push\(/,
  /\.pop\(/,
  /\.splice\(/,
  /\.delete\(/,
  /store\./,
  /dispatch\(/,
] as const;

/**
 * Check handler source code for forbidden patterns.
 * 
 * This is a simple static check that can be run during registration.
 * More sophisticated analysis could use AST parsing.
 */
export function checkHandlerSource(handlerSource: string): readonly string[] {
  const violations: string[] = [];
  
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(handlerSource)) {
      violations.push(`Forbidden pattern detected: ${pattern.source}`);
    }
  }
  
  return violations;
}

// ============================================================================
// Purity Monitoring
// ============================================================================

/**
 * Monitors handler execution for purity violations.
 */
export class PurityMonitor {
  private violations: PurityViolation[] = [];
  
  /**
   * Record a violation.
   */
  recordViolation(violation: PurityViolation): void {
    this.violations.push(violation);
  }
  
  /**
   * Get all recorded violations.
   */
  getViolations(): readonly PurityViolation[] {
    return [...this.violations];
  }
  
  /**
   * Clear violations.
   */
  clear(): void {
    this.violations = [];
  }
  
  /**
   * Check if any violations were recorded.
   */
  hasViolations(): boolean {
    return this.violations.length > 0;
  }
}

/**
 * Global purity monitor instance.
 */
export const globalPurityMonitor = new PurityMonitor();

// ============================================================================
// Exports
// ============================================================================

export type {
  ImmutableProjectStateView,
  PurityViolation,
  PureHandlerResult,
};

export {
  createImmutableView,
  PureHandlerWrapper,
  checkHandlerSource,
  PurityMonitor,
};
