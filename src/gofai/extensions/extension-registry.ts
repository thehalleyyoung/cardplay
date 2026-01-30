/**
 * @file GOFAI Extension Registry
 * @module gofai/extensions/extension-registry
 * 
 * Implements Step 402: Implement an extension registry with register/unregister
 * events and version negotiation.
 * 
 * The extension registry is the central hub for managing GOFAI extensions.
 * It handles:
 * - Registration and unregistration of extensions
 * - Version compatibility checking
 * - Namespace conflict detection
 * - Extension lifecycle management
 * - Event notification for extension changes
 * - Extension dependency resolution
 * 
 * Design principles:
 * - Extensions are registered by namespace (unique identifier)
 * - Multiple versions of an extension cannot coexist
 * - Extensions can declare dependencies on other extensions
 * - Registry emits events for all state changes
 * - Registry state is serializable
 * 
 * @see gofai_goalB.md Step 402
 */

import type {
  GOFAIExtension,
  GOFAIExtensionMetadata,
  ExtensionValidationResult,
  ValidationError,
} from './extension-interface.js';

import { validateExtension } from './extension-interface.js';
import * as semver from 'semver'; // Would need to add this dependency

// ============================================================================
// Registry Types
// ============================================================================

/**
 * Extension registry interface.
 */
export interface ExtensionRegistry {
  /**
   * Register an extension.
   * 
   * @param extension The extension to register
   * @returns Registration result
   */
  register(extension: GOFAIExtension): Promise<ExtensionRegistrationResult>;

  /**
   * Unregister an extension.
   * 
   * @param namespace The namespace of the extension to unregister
   * @returns Whether unregistration succeeded
   */
  unregister(namespace: string): Promise<boolean>;

  /**
   * Get a registered extension.
   * 
   * @param namespace The extension namespace
   * @returns The extension, or undefined if not found
   */
  get(namespace: string): RegisteredExtension | undefined;

  /**
   * Get all registered extensions.
   * 
   * @returns Array of registered extensions
   */
  getAll(): readonly RegisteredExtension[];

  /**
   * Check if an extension is registered.
   * 
   * @param namespace The extension namespace
   * @returns True if registered
   */
  has(namespace: string): boolean;

  /**
   * Enable an extension.
   * 
   * @param namespace The extension namespace
   * @returns Whether enabling succeeded
   */
  enable(namespace: string): Promise<boolean>;

  /**
   * Disable an extension.
   * 
   * @param namespace The extension namespace
   * @returns Whether disabling succeeded
   */
  disable(namespace: string): Promise<boolean>;

  /**
   * Subscribe to registry events.
   * 
   * @param event Event type
   * @param handler Event handler
   * @returns Unsubscribe function
   */
  on(event: ExtensionRegistryEvent, handler: ExtensionEventHandler): () => void;

  /**
   * Get registry statistics.
   */
  getStatistics(): ExtensionRegistryStatistics;

  /**
   * Serialize registry state.
   */
  serialize(): string;
}

/**
 * A registered extension.
 */
export interface RegisteredExtension {
  /** The extension itself */
  readonly extension: GOFAIExtension;

  /** Registration metadata */
  readonly registration: ExtensionRegistration;

  /** Current status */
  readonly status: ExtensionStatus;

  /** Statistics */
  readonly statistics: ExtensionStatistics;
}

/**
 * Extension registration metadata.
 */
export interface ExtensionRegistration {
  /** When registered */
  readonly registeredAt: number;

  /** Registered by */
  readonly registeredBy: string;

  /** Registration method */
  readonly method: 'manual' | 'auto-discovery' | 'pack-loader';

  /** Dependencies */
  readonly dependencies: readonly string[];

  /** Dependents (other extensions that depend on this one) */
  readonly dependents: readonly string[];
}

/**
 * Extension status.
 */
export type ExtensionStatus =
  | { readonly state: 'registered'; readonly enabled: false }
  | { readonly state: 'enabled'; readonly enabled: true; readonly enabledAt: number }
  | { readonly state: 'disabled'; readonly enabled: false; readonly disabledAt: number; readonly reason?: string }
  | { readonly state: 'error'; readonly enabled: false; readonly error: string };

/**
 * Extension statistics.
 */
export interface ExtensionStatistics {
  readonly lexemesContributed: number;
  readonly opcodesContributed: number;
  readonly constraintsContributed: number;
  readonly axesContributed: number;
  readonly prologModulesContributed: number;
  readonly timesUsed: number;
  readonly lastUsed: number | undefined;
}

/**
 * Registry events.
 */
export type ExtensionRegistryEvent =
  | 'registered'
  | 'unregistered'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'version-conflict'
  | 'dependency-changed';

/**
 * Event handler type.
 */
export type ExtensionEventHandler = (event: ExtensionEvent) => void;

/**
 * Extension event.
 */
export interface ExtensionEvent {
  readonly type: ExtensionRegistryEvent;
  readonly namespace: string;
  readonly timestamp: number;
  readonly details?: Record<string, unknown>;
}

/**
 * Extension registration result.
 */
export interface ExtensionRegistrationResult {
  readonly success: boolean;
  readonly namespace: string;
  readonly errors?: readonly ValidationError[];
  readonly warnings?: readonly string[];
  readonly registeredExtension?: RegisteredExtension;
}

/**
 * Registry statistics.
 */
export interface ExtensionRegistryStatistics {
  readonly totalExtensions: number;
  readonly enabledExtensions: number;
  readonly disabledExtensions: number;
  readonly errorExtensions: number;
  readonly totalLexemes: number;
  readonly totalOpcodes: number;
  readonly totalConstraints: number;
  readonly totalAxes: number;
}

// ============================================================================
// Extension Registry Implementation
// ============================================================================

/**
 * Default extension registry implementation.
 */
export class DefaultExtensionRegistry implements ExtensionRegistry {
  private extensions = new Map<string, RegisteredExtension>();
  private eventHandlers = new Map<ExtensionRegistryEvent, Set<ExtensionEventHandler>>();
  private gofaiVersion: string;

  constructor(gofaiVersion: string) {
    this.gofaiVersion = gofaiVersion;
  }

  async register(extension: GOFAIExtension): Promise<ExtensionRegistrationResult> {
    const namespace = extension.metadata.namespace;

    // Check if already registered
    if (this.extensions.has(namespace)) {
      return {
        success: false,
        namespace,
        errors: [{
          code: 'already-registered',
          message: `Extension "${namespace}" is already registered`,
        }],
      };
    }

    // Validate extension
    const validation = validateExtension(extension);
    if (!validation.valid) {
      return {
        success: false,
        namespace,
        errors: validation.errors,
        warnings: validation.warnings.map(w => w.message),
      };
    }

    // Check version compatibility
    const compatible = this.checkVersionCompatibility(extension.metadata);
    if (!compatible.compatible) {
      return {
        success: false,
        namespace,
        errors: [{
          code: 'version-incompatible',
          message: compatible.reason || 'Version incompatible',
        }],
      };
    }

    // Check dependencies
    const depCheck = this.checkDependencies(extension);
    if (!depCheck.satisfied) {
      return {
        success: false,
        namespace,
        errors: [{
          code: 'dependencies-unsatisfied',
          message: `Missing dependencies: ${depCheck.missing.join(', ')}`,
        }],
      };
    }

    // Initialize extension
    if (extension.initialize) {
      try {
        await extension.initialize();
      } catch (error) {
        return {
          success: false,
          namespace,
          errors: [{
            code: 'initialization-failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          }],
        };
      }
    }

    // Create registered extension
    const registered: RegisteredExtension = {
      extension,
      registration: {
        registeredAt: Date.now(),
        registeredBy: 'system',
        method: 'manual',
        dependencies: depCheck.dependencies,
        dependents: [],
      },
      status: {
        state: 'registered',
        enabled: false,
      },
      statistics: this.computeStatistics(extension),
    };

    // Store
    this.extensions.set(namespace, registered);

    // Update dependents
    for (const depNamespace of depCheck.dependencies) {
      const dep = this.extensions.get(depNamespace);
      if (dep) {
        this.extensions.set(depNamespace, {
          ...dep,
          registration: {
            ...dep.registration,
            dependents: [...dep.registration.dependents, namespace],
          },
        });
      }
    }

    // Emit event
    this.emitEvent({
      type: 'registered',
      namespace,
      timestamp: Date.now(),
      details: {
        version: extension.metadata.version,
      },
    });

    return {
      success: true,
      namespace,
      warnings: validation.warnings.map(w => w.message),
      registeredExtension: registered,
    };
  }

  async unregister(namespace: string): Promise<boolean> {
    const registered = this.extensions.get(namespace);
    if (!registered) {
      return false;
    }

    // Check if other extensions depend on this one
    if (registered.registration.dependents.length > 0) {
      throw new Error(
        `Cannot unregister "${namespace}": depended on by ${registered.registration.dependents.join(', ')}`
      );
    }

    // Disable first if enabled
    if (registered.status.enabled) {
      await this.disable(namespace);
    }

    // Dispose
    if (registered.extension.dispose) {
      try {
        await registered.extension.dispose();
      } catch (error) {
        console.error(`Error disposing extension "${namespace}":`, error);
      }
    }

    // Remove
    this.extensions.delete(namespace);

    // Update dependents of dependencies
    for (const depNamespace of registered.registration.dependencies) {
      const dep = this.extensions.get(depNamespace);
      if (dep) {
        this.extensions.set(depNamespace, {
          ...dep,
          registration: {
            ...dep.registration,
            dependents: dep.registration.dependents.filter(d => d !== namespace),
          },
        });
      }
    }

    // Emit event
    this.emitEvent({
      type: 'unregistered',
      namespace,
      timestamp: Date.now(),
    });

    return true;
  }

  get(namespace: string): RegisteredExtension | undefined {
    return this.extensions.get(namespace);
  }

  getAll(): readonly RegisteredExtension[] {
    return Array.from(this.extensions.values());
  }

  has(namespace: string): boolean {
    return this.extensions.has(namespace);
  }

  async enable(namespace: string): Promise<boolean> {
    const registered = this.extensions.get(namespace);
    if (!registered) {
      return false;
    }

    if (registered.status.enabled) {
      return true; // Already enabled
    }

    // Enable dependencies first
    for (const depNamespace of registered.registration.dependencies) {
      const dep = this.extensions.get(depNamespace);
      if (dep && !dep.status.enabled) {
        const success = await this.enable(depNamespace);
        if (!success) {
          throw new Error(`Failed to enable dependency "${depNamespace}"`);
        }
      }
    }

    // Update status
    this.extensions.set(namespace, {
      ...registered,
      status: {
        state: 'enabled',
        enabled: true,
        enabledAt: Date.now(),
      },
    });

    // Emit event
    this.emitEvent({
      type: 'enabled',
      namespace,
      timestamp: Date.now(),
    });

    return true;
  }

  async disable(namespace: string): Promise<boolean> {
    const registered = this.extensions.get(namespace);
    if (!registered) {
      return false;
    }

    if (!registered.status.enabled) {
      return true; // Already disabled
    }

    // Disable dependents first
    for (const dependentNamespace of registered.registration.dependents) {
      const dependent = this.extensions.get(dependentNamespace);
      if (dependent && dependent.status.enabled) {
        await this.disable(dependentNamespace);
      }
    }

    // Update status
    this.extensions.set(namespace, {
      ...registered,
      status: {
        state: 'disabled',
        enabled: false,
        disabledAt: Date.now(),
      },
    });

    // Emit event
    this.emitEvent({
      type: 'disabled',
      namespace,
      timestamp: Date.now(),
    });

    return true;
  }

  on(event: ExtensionRegistryEvent, handler: ExtensionEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  getStatistics(): ExtensionRegistryStatistics {
    const all = this.getAll();

    return {
      totalExtensions: all.length,
      enabledExtensions: all.filter(e => e.status.enabled).length,
      disabledExtensions: all.filter(e => !e.status.enabled && e.status.state !== 'error').length,
      errorExtensions: all.filter(e => e.status.state === 'error').length,
      totalLexemes: all.reduce((sum, e) => sum + e.statistics.lexemesContributed, 0),
      totalOpcodes: all.reduce((sum, e) => sum + e.statistics.opcodesContributed, 0),
      totalConstraints: all.reduce((sum, e) => sum + e.statistics.constraintsContributed, 0),
      totalAxes: all.reduce((sum, e) => sum + e.statistics.axesContributed, 0),
    };
  }

  serialize(): string {
    const state = {
      extensions: Array.from(this.extensions.entries()).map(([namespace, registered]) => ({
        namespace,
        version: registered.extension.metadata.version,
        enabled: registered.status.enabled,
        registeredAt: registered.registration.registeredAt,
      })),
    };

    return JSON.stringify(state, null, 2);
  }

  // Private helper methods

  private checkVersionCompatibility(metadata: GOFAIExtensionMetadata): { compatible: boolean; reason?: string } {
    // Check GOFAI version compatibility
    if (!semver.satisfies(this.gofaiVersion, metadata.compatibleGofaiVersions)) {
      return {
        compatible: false,
        reason: `GOFAI version ${this.gofaiVersion} does not satisfy required range ${metadata.compatibleGofaiVersions}`,
      };
    }

    return { compatible: true };
  }

  private checkDependencies(extension: GOFAIExtension): {
    satisfied: boolean;
    dependencies: string[];
    missing: string[];
  } {
    // For now, assume no dependencies
    // In a full implementation, would parse metadata for declared dependencies
    return {
      satisfied: true,
      dependencies: [],
      missing: [],
    };
  }

  private computeStatistics(extension: GOFAIExtension): ExtensionStatistics {
    return {
      lexemesContributed: extension.lexicon?.lexemes.length || 0,
      opcodesContributed: extension.planner?.opcodes.length || 0,
      constraintsContributed: extension.constraints?.constraints.length || 0,
      axesContributed: extension.axes?.axes.length || 0,
      prologModulesContributed: extension.prolog ? 1 : 0,
      timesUsed: 0,
      lastUsed: undefined,
    };
  }

  private emitEvent(event: ExtensionEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in extension event handler:`, error);
        }
      }
    }
  }
}

// ============================================================================
// Global Registry Instance
// ============================================================================

/**
 * Global extension registry instance.
 * 
 * This is a singleton that should be used throughout the application.
 */
let globalRegistry: ExtensionRegistry | undefined;

/**
 * Get the global extension registry.
 * 
 * @param gofaiVersion GOFAI version (required on first call)
 * @returns The global registry
 */
export function getExtensionRegistry(gofaiVersion?: string): ExtensionRegistry {
  if (!globalRegistry) {
    if (!gofaiVersion) {
      throw new Error('GOFAI version required to initialize extension registry');
    }
    globalRegistry = new DefaultExtensionRegistry(gofaiVersion);
  }
  return globalRegistry;
}

/**
 * Reset the global extension registry (for testing).
 */
export function resetExtensionRegistry(): void {
  globalRegistry = undefined;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all enabled extensions.
 * 
 * @param registry The registry
 * @returns Array of enabled extensions
 */
export function getEnabledExtensions(registry: ExtensionRegistry): readonly RegisteredExtension[] {
  return registry.getAll().filter(e => e.status.enabled);
}

/**
 * Get all opcodes from enabled extensions.
 * 
 * @param registry The registry
 * @returns Map from opcode ID to opcode definition
 */
export function getAllOpcodes(registry: ExtensionRegistry): Map<string, any> {
  const opcodes = new Map();

  for (const registered of getEnabledExtensions(registry)) {
    if (registered.extension.planner?.opcodes) {
      for (const opcode of registered.extension.planner.opcodes) {
        opcodes.set(opcode.id, opcode);
      }
    }
  }

  return opcodes;
}

/**
 * Get all lexemes from enabled extensions.
 * 
 * @param registry The registry
 * @returns Array of lexemes
 */
export function getAllLexemes(registry: ExtensionRegistry): readonly any[] {
  const lexemes: any[] = [];

  for (const registered of getEnabledExtensions(registry)) {
    if (registered.extension.lexicon?.lexemes) {
      lexemes.push(...registered.extension.lexicon.lexemes);
    }
  }

  return lexemes;
}

/**
 * Find extensions by tag.
 * 
 * @param registry The registry
 * @param tag Tag to search for
 * @returns Array of matching extensions
 */
export function findExtensionsByTag(
  registry: ExtensionRegistry,
  tag: string
): readonly RegisteredExtension[] {
  return registry.getAll().filter(e => e.extension.metadata.tags.includes(tag));
}

/**
 * Check if an extension has a specific capability.
 * 
 * @param extension The registered extension
 * @param capability Capability to check
 * @returns True if the extension has the capability
 */
export function hasCapability(
  extension: RegisteredExtension,
  capability: ExtensionCapability
): boolean {
  switch (capability) {
    case 'lexicon':
      return extension.extension.lexicon !== undefined;
    case 'grammar':
      return extension.extension.grammar !== undefined;
    case 'planning':
      return extension.extension.planner !== undefined;
    case 'execution':
      return extension.extension.execution !== undefined;
    case 'prolog':
      return extension.extension.prolog !== undefined;
    case 'constraints':
      return extension.extension.constraints !== undefined;
    case 'axes':
      return extension.extension.axes !== undefined;
    default:
      return false;
  }
}

/**
 * Extension capabilities.
 */
export type ExtensionCapability =
  | 'lexicon'
  | 'grammar'
  | 'planning'
  | 'execution'
  | 'prolog'
  | 'constraints'
  | 'axes';
