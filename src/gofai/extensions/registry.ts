/**
 * GOFAI Extension Registry
 * 
 * This module implements Step 065 from gofai_goalB.md:
 * "Add an extension registry conceptually mirroring BoardRegistry/CardRegistry, 
 * with register/unregister events."
 * 
 * The extension registry manages GOFAI language extensions that can add:
 * - Lexemes (new vocabulary)
 * - Grammar rules (new constructions)
 * - Semantic nodes (new meaning types)
 * - Constraints (new validation rules)
 * - Opcodes (new plan operations)
 * - Prolog modules (new theory knowledge)
 * 
 * All extensions must follow strict namespacing rules to avoid collisions
 * with core vocabulary or other extensions.
 * 
 * @module gofai/extensions/registry
 */

import type { GofaiId } from '../canon/gofai-id';
import type { Lexeme, ConstraintType, EditOpcode } from '../canon/types';

// =============================================================================
// Extension Metadata Types
// =============================================================================

/**
 * Unique identifier for a GOFAI extension.
 * Must follow format: "gofai-ext:{pack-name}:{extension-name}"
 */
export type ExtensionId = GofaiId & { readonly __extensionId: unique symbol };

/**
 * Semantic version string (e.g., "1.2.3")
 */
export type SemanticVersion = string & { readonly __semver: unique symbol };

/**
 * Extension namespace (e.g., "my-pack", "jazz-theory")
 * Used as prefix for all extension-provided IDs.
 */
export type ExtensionNamespace = string & { readonly __namespace: unique symbol };

/**
 * Trust level for an extension.
 * Determines what capabilities the extension is allowed to use.
 */
export type ExtensionTrustLevel = 
  | 'trusted'       // Can execute mutations, full access
  | 'sandboxed'     // Can parse/plan but not execute
  | 'untrusted';    // Parse only, no execution or planning

/**
 * Extension capability flags.
 */
export interface ExtensionCapabilities {
  /** Can contribute lexemes and grammar rules */
  readonly canExtendLanguage: boolean;
  
  /** Can contribute semantic node types */
  readonly canExtendSemantics: boolean;
  
  /** Can contribute constraints */
  readonly canExtendConstraints: boolean;
  
  /** Can contribute plan opcodes */
  readonly canExtendOpcodes: boolean;
  
  /** Can contribute Prolog theory modules */
  readonly canExtendTheory: boolean;
  
  /** Can execute mutations (requires trusted) */
  readonly canExecute: boolean;
  
  /** Can register event listeners */
  readonly canRegisterListeners: boolean;
}

/**
 * Metadata about a GOFAI extension.
 */
export interface ExtensionMetadata {
  /** Unique ID for this extension */
  readonly id: ExtensionId;
  
  /** Extension namespace (must be globally unique) */
  readonly namespace: ExtensionNamespace;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Extension version */
  readonly version: SemanticVersion;
  
  /** Short description */
  readonly description: string;
  
  /** Author/maintainer */
  readonly author: string;
  
  /** Trust level */
  readonly trustLevel: ExtensionTrustLevel;
  
  /** Capabilities granted to this extension */
  readonly capabilities: ExtensionCapabilities;
  
  /** CardPlay pack ID this extension is bundled with (optional) */
  readonly packId?: string;
  
  /** Dependencies (other extension namespaces required) */
  readonly dependencies: readonly ExtensionNamespace[];
  
  /** Tags for categorization */
  readonly tags: readonly string[];
}

// =============================================================================
// Extension Content Types
// =============================================================================

/**
 * Lexemes contributed by an extension.
 */
export interface ExtensionLexemes {
  /** All lexemes must have IDs prefixed with extension namespace */
  readonly lexemes: readonly Lexeme[];
}

/**
 * Grammar rules contributed by an extension.
 */
export interface ExtensionGrammar {
  /** Rule IDs (namespaced) */
  readonly rules: readonly {
    readonly id: GofaiId;
    readonly pattern: string;
    readonly semantics: unknown; // Semantic composition function
    readonly examples: readonly string[];
  }[];
}

/**
 * Semantic node schemas contributed by an extension.
 */
export interface ExtensionSemantics {
  /** Node type names (namespaced) */
  readonly nodeTypes: readonly {
    readonly type: string;
    readonly schema: unknown; // JSON schema or TypeScript type
    readonly validator?: (node: unknown) => boolean;
  }[];
}

/**
 * Constraints contributed by an extension.
 */
export interface ExtensionConstraints {
  /** Constraint types (namespaced) */
  readonly constraints: readonly ConstraintType[];
}

/**
 * Opcodes contributed by an extension.
 */
export interface ExtensionOpcodes {
  /** Opcodes (namespaced) */
  readonly opcodes: readonly EditOpcode[];
  
  /** Opcode handlers (pure functions returning edit proposals) */
  readonly handlers: ReadonlyMap<string, OpcodeHandler>;
}

/**
 * Handler function for a custom opcode.
 * Must be pure - returns edit proposal, doesn't mutate directly.
 */
export type OpcodeHandler = (
  opcode: EditOpcode,
  context: ExecutionContext
) => EditProposal;

/**
 * Context provided to opcode handlers.
 */
export interface ExecutionContext {
  /** Current project state snapshot */
  readonly projectState: unknown; // ProjectWorldAPI snapshot
  
  /** Scope the opcode is being applied to */
  readonly scope: unknown; // CPLScope
  
  /** Active constraints that must be preserved */
  readonly constraints: readonly unknown[]; // CPLConstraint[]
  
  /** Extension capabilities */
  readonly capabilities: ExtensionCapabilities;
}

/**
 * Edit proposal returned by opcode handlers.
 * Core executor validates and applies these.
 */
export interface EditProposal {
  /** Description of the edit */
  readonly description: string;
  
  /** Proposed mutations (abstract, not direct store access) */
  readonly mutations: readonly unknown[]; // Abstract mutation descriptors
  
  /** Estimated cost */
  readonly cost: number;
  
  /** Estimated risk level */
  readonly risk: 'low' | 'medium' | 'high';
  
  /** Whether this proposal is reversible */
  readonly reversible: boolean;
}

/**
 * Prolog theory modules contributed by an extension.
 */
export interface ExtensionProlog {
  /** Module names (namespaced) */
  readonly modules: readonly {
    readonly name: string;
    readonly source: string; // Prolog source code
    readonly exports: readonly string[]; // Exported predicate names
  }[];
}

/**
 * Complete extension content.
 */
export interface ExtensionContent {
  readonly lexemes?: ExtensionLexemes;
  readonly grammar?: ExtensionGrammar;
  readonly semantics?: ExtensionSemantics;
  readonly constraints?: ExtensionConstraints;
  readonly opcodes?: ExtensionOpcodes;
  readonly prolog?: ExtensionProlog;
}

/**
 * A registered GOFAI extension.
 */
export interface GofaiExtension {
  readonly metadata: ExtensionMetadata;
  readonly content: ExtensionContent;
  
  /** Lifecycle hooks */
  readonly onEnable?: () => void | Promise<void>;
  readonly onDisable?: () => void | Promise<void>;
  readonly onUnregister?: () => void | Promise<void>;
}

// =============================================================================
// Registry Events
// =============================================================================

/**
 * Event fired when an extension is registered.
 */
export interface ExtensionRegisteredEvent {
  readonly type: 'extension:registered';
  readonly extensionId: ExtensionId;
  readonly namespace: ExtensionNamespace;
  readonly metadata: ExtensionMetadata;
  readonly timestamp: number;
}

/**
 * Event fired when an extension is unregistered.
 */
export interface ExtensionUnregisteredEvent {
  readonly type: 'extension:unregistered';
  readonly extensionId: ExtensionId;
  readonly namespace: ExtensionNamespace;
  readonly timestamp: number;
}

/**
 * Event fired when an extension is enabled.
 */
export interface ExtensionEnabledEvent {
  readonly type: 'extension:enabled';
  readonly extensionId: ExtensionId;
  readonly namespace: ExtensionNamespace;
  readonly timestamp: number;
}

/**
 * Event fired when an extension is disabled.
 */
export interface ExtensionDisabledEvent {
  readonly type: 'extension:disabled';
  readonly extensionId: ExtensionId;
  readonly namespace: ExtensionNamespace;
  readonly timestamp: number;
}

/**
 * Union of all extension registry events.
 */
export type ExtensionRegistryEvent =
  | ExtensionRegisteredEvent
  | ExtensionUnregisteredEvent
  | ExtensionEnabledEvent
  | ExtensionDisabledEvent;

/**
 * Event listener for extension registry events.
 */
export type ExtensionRegistryListener = (event: ExtensionRegistryEvent) => void;

// =============================================================================
// Registry State
// =============================================================================

/**
 * State of a registered extension.
 */
export interface ExtensionState {
  readonly extension: GofaiExtension;
  readonly enabled: boolean;
  readonly registeredAt: number;
  readonly enabledAt: number | undefined;
  readonly disabledAt: number | undefined;
}

// =============================================================================
// Extension Registry Implementation
// =============================================================================

/**
 * The GOFAI Extension Registry.
 * 
 * Manages registration, lifecycle, and capabilities of GOFAI language extensions.
 * Mirrors the pattern of BoardRegistry and CardRegistry in CardPlay.
 */
export class GofaiExtensionRegistry {
  private readonly extensions = new Map<ExtensionId, ExtensionState>();
  private readonly namespaces = new Map<ExtensionNamespace, ExtensionId>();
  private readonly listeners = new Set<ExtensionRegistryListener>();
  
  /**
   * Register a new extension.
   * 
   * @throws Error if namespace is already taken
   * @throws Error if extension ID is already registered
   * @throws Error if namespace is reserved or invalid
   */
  register(extension: GofaiExtension): void {
    const { id, namespace } = extension.metadata;
    
    // Validate namespace is not reserved
    this.validateNamespace(namespace);
    
    // Check for collisions
    if (this.extensions.has(id)) {
      throw new Error(`Extension already registered: ${id}`);
    }
    
    if (this.namespaces.has(namespace)) {
      const existingId = this.namespaces.get(namespace)!;
      throw new Error(
        `Namespace "${namespace}" already taken by extension "${existingId}"`
      );
    }
    
    // Validate dependencies are satisfied
    this.validateDependencies(extension.metadata.dependencies);
    
    // Register
    const state: ExtensionState = {
      extension,
      enabled: false,
      registeredAt: Date.now(),
      enabledAt: undefined,
      disabledAt: undefined,
    };
    
    this.extensions.set(id, state);
    this.namespaces.set(namespace, id);
    
    // Emit event
    this.emit({
      type: 'extension:registered',
      extensionId: id,
      namespace,
      metadata: extension.metadata,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Unregister an extension.
   * 
   * @throws Error if extension not found
   */
  async unregister(extensionId: ExtensionId): Promise<void> {
    const state = this.extensions.get(extensionId);
    
    if (!state) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    
    // Disable if enabled
    if (state.enabled) {
      await this.disable(extensionId);
    }
    
    // Call lifecycle hook
    if (state.extension.onUnregister) {
      await state.extension.onUnregister();
    }
    
    // Unregister
    const { namespace } = state.extension.metadata;
    this.extensions.delete(extensionId);
    this.namespaces.delete(namespace);
    
    // Emit event
    this.emit({
      type: 'extension:unregistered',
      extensionId,
      namespace,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Enable an extension.
   * 
   * @throws Error if extension not found
   * @throws Error if dependencies not satisfied
   */
  async enable(extensionId: ExtensionId): Promise<void> {
    const state = this.extensions.get(extensionId);
    
    if (!state) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    
    if (state.enabled) {
      return; // Already enabled
    }
    
    // Validate dependencies are enabled
    const deps = state.extension.metadata.dependencies;
    for (const depNamespace of deps) {
      const depId = this.namespaces.get(depNamespace);
      if (!depId) {
        throw new Error(`Dependency not registered: ${depNamespace}`);
      }
      
      const depState = this.extensions.get(depId);
      if (!depState?.enabled) {
        throw new Error(`Dependency not enabled: ${depNamespace}`);
      }
    }
    
    // Call lifecycle hook
    if (state.extension.onEnable) {
      await state.extension.onEnable();
    }
    
    // Update state
    const newState: ExtensionState = {
      ...state,
      enabled: true,
      enabledAt: Date.now(),
    };
    
    this.extensions.set(extensionId, newState);
    
    // Emit event
    this.emit({
      type: 'extension:enabled',
      extensionId,
      namespace: state.extension.metadata.namespace,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Disable an extension.
   * 
   * @throws Error if extension not found
   */
  async disable(extensionId: ExtensionId): Promise<void> {
    const state = this.extensions.get(extensionId);
    
    if (!state) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    
    if (!state.enabled) {
      return; // Already disabled
    }
    
    // Check if other enabled extensions depend on this one
    const dependents = this.findDependents(state.extension.metadata.namespace);
    if (dependents.length > 0) {
      const depNames = dependents.map(d => d.metadata.name).join(', ');
      throw new Error(
        `Cannot disable: other extensions depend on this one: ${depNames}`
      );
    }
    
    // Call lifecycle hook
    if (state.extension.onDisable) {
      await state.extension.onDisable();
    }
    
    // Update state
    const newState: ExtensionState = {
      ...state,
      enabled: false,
      disabledAt: Date.now(),
    };
    
    this.extensions.set(extensionId, newState);
    
    // Emit event
    this.emit({
      type: 'extension:disabled',
      extensionId,
      namespace: state.extension.metadata.namespace,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Get an extension by ID.
   */
  get(extensionId: ExtensionId): GofaiExtension | undefined {
    return this.extensions.get(extensionId)?.extension;
  }
  
  /**
   * Get an extension by namespace.
   */
  getByNamespace(namespace: ExtensionNamespace): GofaiExtension | undefined {
    const id = this.namespaces.get(namespace);
    return id ? this.get(id) : undefined;
  }
  
  /**
   * Check if an extension is registered.
   */
  has(extensionId: ExtensionId): boolean {
    return this.extensions.has(extensionId);
  }
  
  /**
   * Check if an extension is enabled.
   */
  isEnabled(extensionId: ExtensionId): boolean {
    return this.extensions.get(extensionId)?.enabled ?? false;
  }
  
  /**
   * Get all registered extensions.
   */
  getAll(): readonly GofaiExtension[] {
    return Array.from(this.extensions.values()).map(s => s.extension);
  }
  
  /**
   * Get all enabled extensions.
   */
  getEnabled(): readonly GofaiExtension[] {
    return Array.from(this.extensions.values())
      .filter(s => s.enabled)
      .map(s => s.extension);
  }
  
  /**
   * Get all registered namespaces.
   */
  getNamespaces(): readonly ExtensionNamespace[] {
    return Array.from(this.namespaces.keys());
  }
  
  /**
   * Add an event listener.
   */
  addEventListener(listener: ExtensionRegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  // Private helpers
  
  private validateNamespace(namespace: ExtensionNamespace): void {
    // Reserved namespaces
    const reserved = ['core', 'builtin', 'system', 'cardplay', 'gofai'];
    if (reserved.includes(namespace as string)) {
      throw new Error(`Namespace "${namespace}" is reserved`);
    }
    
    // Must be valid identifier pattern
    if (!/^[a-z][a-z0-9-]*$/.test(namespace as string)) {
      throw new Error(
        `Invalid namespace "${namespace}": must be lowercase alphanumeric with hyphens`
      );
    }
  }
  
  private validateDependencies(deps: readonly ExtensionNamespace[]): void {
    for (const dep of deps) {
      if (!this.namespaces.has(dep)) {
        throw new Error(`Dependency not registered: ${dep}`);
      }
    }
  }
  
  private findDependents(namespace: ExtensionNamespace): GofaiExtension[] {
    const dependents: GofaiExtension[] = [];
    
    for (const state of this.extensions.values()) {
      if (!state.enabled) continue;
      
      if (state.extension.metadata.dependencies.includes(namespace)) {
        dependents.push(state.extension);
      }
    }
    
    return dependents;
  }
  
  private emit(event: ExtensionRegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in extension registry listener:', error);
      }
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Global GOFAI extension registry instance.
 */
export const gofaiExtensionRegistry = new GofaiExtensionRegistry();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create an extension ID from namespace and name.
 */
export function createExtensionId(
  namespace: string,
  name: string
): ExtensionId {
  return `gofai-ext:${namespace}:${name}` as ExtensionId;
}

/**
 * Create an extension namespace.
 */
export function createExtensionNamespace(namespace: string): ExtensionNamespace {
  return namespace as ExtensionNamespace;
}

/**
 * Create a semantic version.
 */
export function createSemanticVersion(version: string): SemanticVersion {
  // Basic semver validation
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
  return version as SemanticVersion;
}

/**
 * Get default capabilities for a trust level.
 */
export function getDefaultCapabilities(
  trustLevel: ExtensionTrustLevel
): ExtensionCapabilities {
  switch (trustLevel) {
    case 'trusted':
      return {
        canExtendLanguage: true,
        canExtendSemantics: true,
        canExtendConstraints: true,
        canExtendOpcodes: true,
        canExtendTheory: true,
        canExecute: true,
        canRegisterListeners: true,
      };
    
    case 'sandboxed':
      return {
        canExtendLanguage: true,
        canExtendSemantics: true,
        canExtendConstraints: true,
        canExtendOpcodes: true,
        canExtendTheory: true,
        canExecute: false,
        canRegisterListeners: false,
      };
    
    case 'untrusted':
      return {
        canExtendLanguage: true,
        canExtendSemantics: false,
        canExtendConstraints: false,
        canExtendOpcodes: false,
        canExtendTheory: false,
        canExecute: false,
        canRegisterListeners: false,
      };
  }
}
