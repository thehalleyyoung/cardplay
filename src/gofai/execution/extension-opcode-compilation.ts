/**
 * @file Extension Opcode Compilation (Step 331)
 * @module gofai/execution/extension-opcode-compilation
 * 
 * Implements Step 331: Define how extension opcodes compile: extensions return
 * proposed `EditPackage` fragments but core executor applies them.
 * 
 * This module defines the interface and compilation pipeline for extension-provided
 * opcodes. The key design principle is that extensions propose changes but never
 * directly mutate project state - all mutations go through the core executor which
 * maintains transactional integrity and constraint checking.
 * 
 * Architecture:
 * 1. Extension registers opcode handler with namespace
 * 2. Handler receives opcode + context, returns proposed changes
 * 3. Core executor validates proposed changes
 * 4. Core executor applies changes transactionally
 * 5. Core executor generates diff and provenance
 * 
 * Design principles:
 * - Extension handlers are pure: (opcode, context) → proposed changes
 * - Extensions cannot directly call store mutations
 * - All changes go through transactional executor
 * - Extension failures don't corrupt state
 * - Extension opcodes can be disabled per-namespace
 * - Provenance tracks which extension contributed what
 * 
 * @see gofai_goalB.md Step 331
 * @see gofai_goalB.md Step 332 (handler purity enforcement)
 * @see gofai_goalB.md Step 333 (unknown opcode behavior)
 * @see src/gofai/extensions/registry.ts
 * @see docs/gofai/extensions.md
 */

import type { GofaiId } from '../canon/types.js';
import type {
  EditPackage,
  CPLPlan,
  PlanOpcode,
  Provenance,
} from './edit-package.js';
import type { ProjectState } from './transactional-execution.js';
import type { CanonicalDiff } from './diff-model.js';

// ============================================================================
// Extension Opcode Types
// ============================================================================

/**
 * Extension namespace identifier.
 * 
 * Format: "pack-name" or "org:pack-name"
 * Must match the pack's declared namespace.
 */
export type ExtensionNamespace = string & { readonly __brand: 'ExtensionNamespace' };

/**
 * Extension opcode ID.
 * 
 * Format: "namespace:opcode-name"
 * Examples: "mypack:add-stutter", "acme:generate-variation"
 */
export type ExtensionOpcodeId = GofaiId;

/**
 * Proposed changes from an extension handler.
 * 
 * Extensions return these proposed changes which the core executor
 * then validates and applies transactionally.
 */
export interface ProposedChanges {
  /** Human-readable description of what will change */
  readonly description: string;
  
  /** Event mutations to propose */
  readonly events?: ProposedEventChanges;
  
  /** Card mutations to propose */
  readonly cards?: ProposedCardChanges;
  
  /** Track mutations to propose */
  readonly tracks?: ProposedTrackChanges;
  
  /** Section mutations to propose */
  readonly sections?: ProposedSectionChanges;
  
  /** Routing mutations to propose */
  readonly routing?: ProposedRoutingChanges;
  
  /** Additional metadata */
  readonly metadata?: ProposedMetadata;
  
  /** Provenance for these changes */
  readonly provenance: ExtensionProvenance;
}

/**
 * Proposed event changes.
 */
export interface ProposedEventChanges {
  readonly add?: readonly ProposedEvent[];
  readonly remove?: readonly string[]; // Event IDs
  readonly modify?: readonly ProposedEventModification[];
}

/**
 * A proposed new event.
 */
export interface ProposedEvent {
  readonly trackId: string;
  readonly onset: number;
  readonly duration: number;
  readonly payload: EventPayload;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * A proposed modification to an existing event.
 */
export interface ProposedEventModification {
  readonly id: string;
  readonly changes: Partial<ProposedEvent>;
}

/**
 * Event payload (note, clip, marker, etc.).
 */
export type EventPayload = 
  | { type: 'note'; pitch: number; velocity: number }
  | { type: 'clip'; clipId: string }
  | { type: 'marker'; label: string }
  | { type: 'extension'; namespace: string; data: unknown };

/**
 * Proposed card changes.
 */
export interface ProposedCardChanges {
  readonly add?: readonly ProposedCard[];
  readonly remove?: readonly string[]; // Card IDs
  readonly modifyParams?: readonly ProposedCardParamChange[];
}

/**
 * A proposed new card.
 */
export interface ProposedCard {
  readonly cardType: string;
  readonly trackId?: string;
  readonly label?: string;
  readonly parameters?: Record<string, unknown>;
}

/**
 * A proposed card parameter change.
 */
export interface ProposedCardParamChange {
  readonly cardId: string;
  readonly paramId: string;
  readonly value: unknown;
}

/**
 * Proposed track changes.
 */
export interface ProposedTrackChanges {
  readonly add?: readonly ProposedTrack[];
  readonly remove?: readonly string[]; // Track IDs
  readonly modify?: readonly ProposedTrackModification[];
}

/**
 * A proposed new track.
 */
export interface ProposedTrack {
  readonly label: string;
  readonly role?: string;
  readonly tags?: readonly string[];
}

/**
 * A proposed track modification.
 */
export interface ProposedTrackModification {
  readonly id: string;
  readonly changes: Partial<ProposedTrack>;
}

/**
 * Proposed section changes.
 */
export interface ProposedSectionChanges {
  readonly add?: readonly ProposedSection[];
  readonly remove?: readonly string[]; // Section IDs
  readonly modify?: readonly ProposedSectionModification[];
}

/**
 * A proposed new section.
 */
export interface ProposedSection {
  readonly label: string;
  readonly startBar: number;
  readonly endBar?: number;
  readonly tags?: readonly string[];
}

/**
 * A proposed section modification.
 */
export interface ProposedSectionModification {
  readonly id: string;
  readonly changes: Partial<ProposedSection>;
}

/**
 * Proposed routing changes.
 */
export interface ProposedRoutingChanges {
  readonly addConnections?: readonly ProposedConnection[];
  readonly removeConnections?: readonly ConnectionId[];
}

/**
 * A proposed routing connection.
 */
export interface ProposedConnection {
  readonly sourceId: string;
  readonly targetId: string;
  readonly type?: string;
}

/**
 * Connection identifier.
 */
export type ConnectionId = string & { readonly __brand: 'ConnectionId' };

/**
 * Proposed metadata changes.
 */
export interface ProposedMetadata {
  readonly tempo?: number;
  readonly timeSignature?: { numerator: number; denominator: number };
  readonly key?: string;
  readonly [key: string]: unknown;
}

/**
 * Extension provenance.
 */
export interface ExtensionProvenance extends Provenance {
  readonly extensionNamespace: ExtensionNamespace;
  readonly extensionVersion: string;
  readonly opcodeId: ExtensionOpcodeId;
  readonly handlerVersion: string;
}

// ============================================================================
// Extension Opcode Handler Interface
// ============================================================================

/**
 * Context provided to extension opcode handlers.
 */
export interface ExtensionOpcodeContext {
  /** Current project state (read-only) */
  readonly projectState: ProjectState;
  
  /** The opcode being executed */
  readonly opcode: PlanOpcode;
  
  /** The full plan (for context) */
  readonly plan: CPLPlan;
  
  /** Execution options */
  readonly options: ExecutionOptions;
  
  /** Access to analysis/query functions */
  readonly query: QueryAPI;
}

/**
 * Execution options available to handlers.
 */
export interface ExecutionOptions {
  /** Dry run mode? */
  readonly dryRun: boolean;
  
  /** Maximum number of entities to modify */
  readonly maxEntities?: number;
  
  /** Require explicit user confirmation? */
  readonly requireConfirmation: boolean;
  
  /** Custom options from user */
  readonly custom?: Record<string, unknown>;
}

/**
 * Query API for extensions to read project state.
 */
export interface QueryAPI {
  /** Find events matching selector */
  readonly findEvents: (selector: EventSelector) => readonly Event[];
  
  /** Find tracks matching criteria */
  readonly findTracks: (criteria: TrackCriteria) => readonly Track[];
  
  /** Find cards matching criteria */
  readonly findCards: (criteria: CardCriteria) => readonly Card[];
  
  /** Find sections matching criteria */
  readonly findSections: (criteria: SectionCriteria) => readonly Section[];
  
  /** Get analysis result (cached) */
  readonly getAnalysis: <T>(key: string) => T | undefined;
}

/**
 * Simplified type stubs (actual types from other modules).
 */
export interface EventSelector {
  readonly scope?: { startBar: number; endBar: number };
  readonly tags?: readonly string[];
  readonly trackId?: string;
}

export interface TrackCriteria {
  readonly role?: string;
  readonly tags?: readonly string[];
  readonly label?: string;
}

export interface CardCriteria {
  readonly cardType?: string;
  readonly trackId?: string;
  readonly label?: string;
}

export interface SectionCriteria {
  readonly label?: string;
  readonly tags?: readonly string[];
}

export interface Event {
  readonly id: string;
  readonly trackId: string;
  readonly onset: number;
  readonly duration: number;
  readonly payload: EventPayload;
}

export interface Track {
  readonly id: string;
  readonly label: string;
  readonly role?: string;
}

export interface Card {
  readonly id: string;
  readonly cardType: string;
  readonly trackId?: string;
}

export interface Section {
  readonly id: string;
  readonly label: string;
  readonly startBar: number;
  readonly endBar?: number;
}

/**
 * Result of executing an extension opcode handler.
 */
export type ExtensionOpcodeResult =
  | { readonly status: 'success'; readonly changes: ProposedChanges }
  | { readonly status: 'skip'; readonly reason: string }
  | { readonly status: 'error'; readonly error: ExtensionError };

/**
 * Extension error.
 */
export interface ExtensionError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly recoverable: boolean;
}

/**
 * Extension opcode handler function.
 */
export type ExtensionOpcodeHandler = (
  context: ExtensionOpcodeContext
) => Promise<ExtensionOpcodeResult>;

// ============================================================================
// Extension Opcode Registry
// ============================================================================

/**
 * Registry entry for an extension opcode handler.
 */
export interface ExtensionOpcodeRegistration {
  /** Opcode ID */
  readonly opcodeId: ExtensionOpcodeId;
  
  /** Extension namespace */
  readonly namespace: ExtensionNamespace;
  
  /** Extension version */
  readonly extensionVersion: string;
  
  /** Handler function */
  readonly handler: ExtensionOpcodeHandler;
  
  /** Handler version */
  readonly handlerVersion: string;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Schema for opcode parameters (for validation) */
  readonly paramSchema?: OpcodeParamSchema;
  
  /** Required capabilities */
  readonly requiredCapabilities?: readonly string[];
  
  /** Whether this opcode is safe to auto-execute */
  readonly autoExecuteSafe: boolean;
}

/**
 * Schema for opcode parameters.
 */
export interface OpcodeParamSchema {
  readonly type: 'object';
  readonly properties: Record<string, ParamPropertySchema>;
  readonly required?: readonly string[];
}

/**
 * Schema for a parameter property.
 */
export type ParamPropertySchema =
  | { readonly type: 'string'; readonly enum?: readonly string[] }
  | { readonly type: 'number'; readonly min?: number; readonly max?: number }
  | { readonly type: 'boolean' }
  | { readonly type: 'array'; readonly items: ParamPropertySchema };

/**
 * Extension opcode registry.
 */
export class ExtensionOpcodeRegistry {
  private handlers = new Map<ExtensionOpcodeId, ExtensionOpcodeRegistration>();
  private disabledNamespaces = new Set<ExtensionNamespace>();
  
  /**
   * Register an extension opcode handler.
   */
  register(registration: ExtensionOpcodeRegistration): void {
    if (this.handlers.has(registration.opcodeId)) {
      throw new Error(`Opcode ${registration.opcodeId} is already registered`);
    }
    
    this.handlers.set(registration.opcodeId, registration);
  }
  
  /**
   * Unregister an extension opcode handler.
   */
  unregister(opcodeId: ExtensionOpcodeId): void {
    this.handlers.delete(opcodeId);
  }
  
  /**
   * Get a registered handler.
   */
  getHandler(opcodeId: ExtensionOpcodeId): ExtensionOpcodeRegistration | undefined {
    return this.handlers.get(opcodeId);
  }
  
  /**
   * Check if an opcode is registered.
   */
  isRegistered(opcodeId: ExtensionOpcodeId): boolean {
    return this.handlers.has(opcodeId);
  }
  
  /**
   * Check if an opcode is enabled.
   */
  isEnabled(opcodeId: ExtensionOpcodeId): boolean {
    const registration = this.handlers.get(opcodeId);
    if (!registration) {
      return false;
    }
    
    return !this.disabledNamespaces.has(registration.namespace);
  }
  
  /**
   * Disable all opcodes from a namespace.
   */
  disableNamespace(namespace: ExtensionNamespace): void {
    this.disabledNamespaces.add(namespace);
  }
  
  /**
   * Enable all opcodes from a namespace.
   */
  enableNamespace(namespace: ExtensionNamespace): void {
    this.disabledNamespaces.delete(namespace);
  }
  
  /**
   * Get all registered opcodes.
   */
  getAllOpcodes(): readonly ExtensionOpcodeRegistration[] {
    return Array.from(this.handlers.values());
  }
  
  /**
   * Get all opcodes from a namespace.
   */
  getOpcodesByNamespace(namespace: ExtensionNamespace): readonly ExtensionOpcodeRegistration[] {
    return Array.from(this.handlers.values()).filter(
      reg => reg.namespace === namespace
    );
  }
}

// ============================================================================
// Extension Opcode Compiler
// ============================================================================

/**
 * Compiles extension opcodes to proposed changes.
 */
export class ExtensionOpcodeCompiler {
  constructor(
    private registry: ExtensionOpcodeRegistry
  ) {}
  
  /**
   * Compile an extension opcode to proposed changes.
   */
  async compile(
    opcode: PlanOpcode,
    context: ExtensionOpcodeContext
  ): Promise<ExtensionOpcodeResult> {
    const opcodeId = opcode.type as ExtensionOpcodeId;
    
    // Check if handler is registered
    const registration = this.registry.getHandler(opcodeId);
    if (!registration) {
      return {
        status: 'error',
        error: {
          code: 'UNKNOWN_OPCODE',
          message: `No handler registered for opcode: ${opcodeId}`,
          recoverable: false,
        },
      };
    }
    
    // Check if opcode is enabled
    if (!this.registry.isEnabled(opcodeId)) {
      return {
        status: 'error',
        error: {
          code: 'OPCODE_DISABLED',
          message: `Opcode ${opcodeId} is disabled (namespace: ${registration.namespace})`,
          recoverable: true,
        },
      };
    }
    
    // Validate parameters if schema provided
    if (registration.paramSchema) {
      const validationError = this.validateParams(opcode, registration.paramSchema);
      if (validationError) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_PARAMS',
            message: validationError,
            recoverable: false,
          },
        };
      }
    }
    
    // Execute handler
    try {
      const result = await registration.handler(context);
      return result;
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'HANDLER_EXCEPTION',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          recoverable: false,
        },
      };
    }
  }
  
  /**
   * Validate opcode parameters against schema.
   */
  private validateParams(opcode: PlanOpcode, schema: OpcodeParamSchema): string | null {
    // Simple validation (in practice, use a JSON schema validator)
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in (opcode.params || {}))) {
          return `Missing required parameter: ${requiredProp}`;
        }
      }
    }
    
    return null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ExtensionNamespace,
  ExtensionOpcodeId,
  ProposedChanges,
  ExtensionOpcodeContext,
  ExtensionOpcodeResult,
  ExtensionOpcodeHandler,
  ExtensionOpcodeRegistration,
  OpcodeParamSchema,
};

export {
  ExtensionOpcodeRegistry,
  ExtensionOpcodeCompiler,
};
