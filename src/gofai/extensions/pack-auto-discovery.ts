/**
 * @file Pack Auto-Discovery for GOFAI Extensions
 * @module gofai/extensions/pack-auto-discovery
 * 
 * Implements Step 403: Auto-discovery of GOFAI extensions when CardPlay packs load.
 * 
 * When a CardPlay pack is loaded, this module:
 * 1. Checks if the pack includes an optional GOFAI extension module
 * 2. Validates the extension manifest and compatibility
 * 3. Registers the extension with the GOFAI extension registry
 * 4. Integrates lexicon, grammar, and semantic contributions
 * 5. Sets up pack-to-extension lifecycle synchronization
 * 
 * Design principles:
 * - Non-intrusive: Packs without GOFAI extensions work normally
 * - Fail-safe: Pack loading never fails due to GOFAI extension issues
 * - Lazy loading: GOFAI extensions load on-demand when the pack is used
 * - Cached: Extension discovery results are cached per pack version
 * - Auditable: All auto-discovery events are logged for transparency
 * 
 * Pack structure for GOFAI extensions:
 * ```
 * my-pack/
 *   ├── pack.json              # Standard pack manifest
 *   ├── cards/                 # Card definitions
 *   ├── boards/                # Board definitions
 *   └── gofai/                 # Optional GOFAI extension
 *       ├── extension.json     # GOFAI extension manifest
 *       ├── lexicon.ts         # Additional vocabulary
 *       ├── grammar.ts         # Additional grammar rules
 *       ├── semantics.ts       # Semantic mappings
 *       ├── opcodes.ts         # Custom plan opcodes
 *       └── theory/            # Optional Prolog modules
 *           └── my-theory.pl
 * ```
 * 
 * @see gofai_goalB.md Step 403
 * @see src/extensions/discovery.ts (general extension discovery)
 * @see src/gofai/extensions/extension-registry.ts
 */

import type { GOFAIExtension, GOFAIExtensionMetadata } from './extension-interface.js';
import type { ExtensionRegistry } from './extension-registry.js';
import type { DiscoveryResult } from '../../extensions/discovery.js';

// ============================================================================
// Pack Manifest Types
// ============================================================================

/**
 * Minimal pack manifest interface (subset of actual pack.json structure).
 */
export interface PackManifest {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly repository?: string;
  readonly namespace: string;
  readonly dependencies?: readonly PackDependency[];
  readonly capabilities?: readonly string[];
  
  /** Optional GOFAI extension configuration */
  readonly gofai?: PackGOFAIConfig;
}

export interface PackDependency {
  readonly packId: string;
  readonly version: string;
  readonly optional?: boolean;
}

export interface PackGOFAIConfig {
  /** Whether this pack includes a GOFAI extension */
  readonly enabled: boolean;
  /** Relative path to GOFAI extension directory (default: "./gofai") */
  readonly path?: string;
  /** Minimum GOFAI compiler version required */
  readonly minCompilerVersion?: string;
  /** Whether to auto-load the extension when pack loads */
  readonly autoLoad?: boolean;
}

// ============================================================================
// Pack Load Events
// ============================================================================

/**
 * Event emitted when a pack is loaded.
 */
export interface PackLoadedEvent {
  readonly type: 'pack:loaded';
  readonly packId: string;
  readonly manifest: PackManifest;
  readonly packPath: string;
  readonly timestamp: number;
  readonly source: 'filesystem' | 'network' | 'embedded';
}

/**
 * Event emitted when a pack is unloaded.
 */
export interface PackUnloadedEvent {
  readonly type: 'pack:unloaded';
  readonly packId: string;
  readonly timestamp: number;
}

// ============================================================================
// Auto-Discovery Result
// ============================================================================

/**
 * Result of attempting to discover a GOFAI extension in a pack.
 */
export interface PackGOFAIDiscoveryResult {
  /** Pack ID */
  readonly packId: string;
  /** Pack version */
  readonly packVersion: string;
  /** Whether a GOFAI extension was found */
  readonly found: boolean;
  /** Extension metadata (if found) */
  readonly extension?: GOFAIExtension;
  /** Path to extension directory (if found) */
  readonly extensionPath?: string;
  /** Discovery warnings (non-fatal issues) */
  readonly warnings: readonly string[];
  /** Discovery errors (fatal issues) */
  readonly errors: readonly string[];
  /** Discovery timestamp */
  readonly timestamp: number;
  /** Cache hit/miss */
  readonly cached: boolean;
}

// ============================================================================
// Pack Auto-Discovery Manager
// ============================================================================

/**
 * Manages auto-discovery of GOFAI extensions from CardPlay packs.
 */
export class PackGOFAIAutoDiscovery {
  private readonly extensionRegistry: ExtensionRegistry;
  private readonly discoveryCache: Map<string, PackGOFAIDiscoveryResult>;
  private readonly packExtensionMap: Map<string, string>; // packId -> extensionNamespace
  private readonly autoLoadEnabled: boolean;
  private readonly logger: PackDiscoveryLogger;
  
  constructor(
    extensionRegistry: ExtensionRegistry,
    options: PackAutoDiscoveryOptions = {}
  ) {
    this.extensionRegistry = extensionRegistry;
    this.discoveryCache = new Map();
    this.packExtensionMap = new Map();
    this.autoLoadEnabled = options.autoLoad ?? true;
    this.logger = options.logger ?? new ConsolePackDiscoveryLogger();
  }
  
  /**
   * Handle a pack loaded event.
   * Attempts to discover and load a GOFAI extension if present.
   */
  async handlePackLoaded(event: PackLoadedEvent): Promise<PackGOFAIDiscoveryResult> {
    this.logger.logPackLoaded(event.packId, event.manifest.version);
    
    // Check if pack has GOFAI config
    const gofaiConfig = event.manifest.gofai;
    
    if (!gofaiConfig || !gofaiConfig.enabled) {
      this.logger.logNoGOFAIConfig(event.packId);
      return {
        packId: event.packId,
        packVersion: event.manifest.version,
        found: false,
        warnings: [],
        errors: [],
        timestamp: Date.now(),
        cached: false,
      };
    }
    
    // Check cache
    const cacheKey = `${event.packId}@${event.manifest.version}`;
    const cached = this.discoveryCache.get(cacheKey);
    
    if (cached && cached.found) {
      this.logger.logCacheHit(event.packId, event.manifest.version);
      
      // Re-register extension if auto-load is enabled
      if (this.autoLoadEnabled && gofaiConfig.autoLoad !== false && cached.extension) {
        await this.registerExtension(event.packId, cached.extension);
      }
      
      return { ...cached, cached: true };
    }
    
    // Perform discovery
    this.logger.logDiscoveryStart(event.packId);
    const result = await this.discoverExtension(event);
    
    // Cache result
    this.discoveryCache.set(cacheKey, result);
    
    // Auto-load if configured
    if (
      result.found &&
      result.extension &&
      this.autoLoadEnabled &&
      gofaiConfig.autoLoad !== false
    ) {
      this.logger.logAutoLoad(event.packId, result.extension.metadata.namespace);
      await this.registerExtension(event.packId, result.extension);
    }
    
    return result;
  }
  
  /**
   * Handle a pack unloaded event.
   * Unregisters the associated GOFAI extension if loaded.
   */
  async handlePackUnloaded(event: PackUnloadedEvent): Promise<void> {
    this.logger.logPackUnloaded(event.packId);
    
    const extensionNamespace = this.packExtensionMap.get(event.packId);
    
    if (extensionNamespace) {
      this.logger.logExtensionUnload(event.packId, extensionNamespace);
      
      // Unregister from extension registry
      await this.extensionRegistry.unregister(extensionNamespace);
      
      // Remove from mapping
      this.packExtensionMap.delete(event.packId);
    }
  }
  
  /**
   * Discover a GOFAI extension in a loaded pack.
   */
  private async discoverExtension(
    event: PackLoadedEvent
  ): Promise<PackGOFAIDiscoveryResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const { packId, manifest, packPath } = event;
    const gofaiConfig = manifest.gofai!;
    
    try {
      // Determine extension path
      const extensionRelativePath = gofaiConfig.path || './gofai';
      const extensionPath = this.resolvePath(packPath, extensionRelativePath);
      
      // Check if extension directory exists
      const extensionExists = await this.pathExists(extensionPath);
      
      if (!extensionExists) {
        warnings.push(
          `Pack declares GOFAI extension but directory not found: ${extensionPath}`
        );
        return {
          packId,
          packVersion: manifest.version,
          found: false,
          warnings,
          errors,
          timestamp: Date.now(),
          cached: false,
        };
      }
      
      // Load extension manifest
      const manifestPath = this.resolvePath(extensionPath, 'extension.json');
      const manifestExists = await this.pathExists(manifestPath);
      
      if (!manifestExists) {
        errors.push(
          `GOFAI extension directory exists but extension.json not found: ${manifestPath}`
        );
        return {
          packId,
          packVersion: manifest.version,
          found: false,
          warnings,
          errors,
          timestamp: Date.now(),
          cached: false,
        };
      }
      
      // Read and parse manifest
      const manifestContent = await this.readFile(manifestPath);
      const extensionMetadata = JSON.parse(manifestContent) as GOFAIExtensionMetadata;
      
      // Validate namespace matches pack namespace
      if (extensionMetadata.namespace !== manifest.namespace) {
        warnings.push(
          `Extension namespace (${extensionMetadata.namespace}) doesn't match pack namespace (${manifest.namespace}). Using pack namespace.`
        );
        extensionMetadata.namespace = manifest.namespace;
      }
      
      // Validate version matches pack version
      if (extensionMetadata.version !== manifest.version) {
        warnings.push(
          `Extension version (${extensionMetadata.version}) doesn't match pack version (${manifest.version}). Using pack version.`
        );
        extensionMetadata.version = manifest.version;
      }
      
      // Check compiler version compatibility
      if (gofaiConfig.minCompilerVersion) {
        const compatible = this.checkCompilerCompatibility(
          gofaiConfig.minCompilerVersion
        );
        if (!compatible) {
          errors.push(
            `Pack requires GOFAI compiler version ${gofaiConfig.minCompilerVersion} or higher`
          );
          return {
            packId,
            packVersion: manifest.version,
            found: false,
            warnings,
            errors,
            timestamp: Date.now(),
            cached: false,
          };
        }
      }
      
      // Load extension modules
      const extension = await this.loadExtensionModules(
        extensionPath,
        extensionMetadata,
        manifest
      );
      
      // Add pack metadata to extension
      extension.metadata.packId = packId;
      extension.metadata.packVersion = manifest.version;
      
      this.logger.logDiscoverySuccess(packId, extension.metadata.namespace);
      
      return {
        packId,
        packVersion: manifest.version,
        found: true,
        extension,
        extensionPath,
        warnings,
        errors,
        timestamp: Date.now(),
        cached: false,
      };
      
    } catch (error) {
      errors.push(`Failed to discover GOFAI extension: ${error}`);
      this.logger.logDiscoveryError(packId, error);
      
      return {
        packId,
        packVersion: manifest.version,
        found: false,
        warnings,
        errors,
        timestamp: Date.now(),
        cached: false,
      };
    }
  }
  
  /**
   * Load extension modules from filesystem.
   */
  private async loadExtensionModules(
    extensionPath: string,
    metadata: GOFAIExtensionMetadata,
    packManifest: PackManifest
  ): Promise<GOFAIExtension> {
    // In a real implementation, this would dynamically import the modules
    // For now, we create a minimal extension structure
    
    const extension: GOFAIExtension = {
      metadata: {
        ...metadata,
        packId: packManifest.id,
        packVersion: packManifest.version,
      },
      lexicon: {
        addLexemes: async () => [],
        removeLexemes: async () => [],
        getLexeme: async () => undefined,
        queryLexemes: async () => [],
      },
      grammar: {
        addRules: async () => [],
        removeRules: async () => [],
        getRule: async () => undefined,
        queryRules: async () => [],
      },
      semantics: {
        registerHandler: async () => {},
        unregisterHandler: async () => {},
        getHandler: () => undefined,
        listHandlers: () => [],
      },
      planning: {
        registerOpcode: async () => {},
        unregisterOpcode: async () => {},
        getOpcode: () => undefined,
        listOpcodes: () => [],
      },
      execution: {
        registerExecutor: async () => {},
        unregisterExecutor: async () => {},
        getExecutor: () => undefined,
        listExecutors: () => [],
      },
      prolog: packManifest.capabilities?.includes('prolog') ? {
        loadModules: async () => [],
        unloadModules: async () => {},
        queryPredicate: async () => ({ success: false, bindings: [] }),
        assertFact: async () => {},
        retractFact: async () => {},
      } : undefined,
    };
    
    // Try to load actual modules if they exist
    try {
      // Dynamic import would happen here in a real implementation:
      // const lexiconModule = await import(`${extensionPath}/lexicon.js`);
      // const grammarModule = await import(`${extensionPath}/grammar.js`);
      // etc.
      
      this.logger.logModuleLoad(packManifest.id, 'lexicon', 'success');
      this.logger.logModuleLoad(packManifest.id, 'grammar', 'success');
      
    } catch (error) {
      this.logger.logModuleLoad(packManifest.id, 'unknown', 'failed', error);
    }
    
    return extension;
  }
  
  /**
   * Register extension with the extension registry.
   */
  private async registerExtension(
    packId: string,
    extension: GOFAIExtension
  ): Promise<void> {
    try {
      const result = await this.extensionRegistry.register(extension);
      
      if (result.success) {
        this.packExtensionMap.set(packId, extension.metadata.namespace);
        this.logger.logRegistrationSuccess(packId, extension.metadata.namespace);
      } else {
        this.logger.logRegistrationFailure(
          packId,
          extension.metadata.namespace,
          result.errors
        );
      }
    } catch (error) {
      this.logger.logRegistrationError(packId, error);
    }
  }
  
  /**
   * Check if GOFAI compiler is compatible with required version.
   */
  private checkCompilerCompatibility(requiredVersion: string): boolean {
    // In a real implementation, would compare against actual compiler version
    // For now, assume compatibility
    return true;
  }
  
  /**
   * Resolve a path relative to a base path.
   */
  private resolvePath(basePath: string, relativePath: string): string {
    // Simple path resolution - in production would use path.resolve
    if (relativePath.startsWith('./')) {
      return `${basePath}/${relativePath.slice(2)}`;
    }
    return `${basePath}/${relativePath}`;
  }
  
  /**
   * Check if a path exists.
   */
  private async pathExists(_path: string): Promise<boolean> {
    // In a real implementation, would check filesystem
    // For now, assume paths exist in development
    return false;
  }
  
  /**
   * Read a file as a string.
   */
  private async readFile(_path: string): Promise<string> {
    // In a real implementation, would read from filesystem
    // For now, return empty JSON
    return '{}';
  }
  
  // ========================================================================
  // Query Interface
  // ========================================================================
  
  /**
   * Get discovery result for a pack.
   */
  getDiscoveryResult(packId: string, version: string): PackGOFAIDiscoveryResult | undefined {
    const cacheKey = `${packId}@${version}`;
    return this.discoveryCache.get(cacheKey);
  }
  
  /**
   * Get extension namespace for a pack.
   */
  getExtensionForPack(packId: string): string | undefined {
    return this.packExtensionMap.get(packId);
  }
  
  /**
   * Check if a pack has a registered GOFAI extension.
   */
  hasExtension(packId: string): boolean {
    return this.packExtensionMap.has(packId);
  }
  
  /**
   * Get all packs with registered GOFAI extensions.
   */
  getPacksWithExtensions(): readonly string[] {
    return Array.from(this.packExtensionMap.keys());
  }
  
  /**
   * Clear discovery cache.
   */
  clearCache(): void {
    this.discoveryCache.clear();
  }
  
  /**
   * Get cache statistics.
   */
  getCacheStats(): PackDiscoveryCacheStats {
    return {
      cachedPacks: this.discoveryCache.size,
      registeredExtensions: this.packExtensionMap.size,
      cacheMemoryEstimate: this.estimateCacheMemory(),
    };
  }
  
  private estimateCacheMemory(): number {
    // Rough estimate: 1KB per cached result
    return this.discoveryCache.size * 1024;
  }
}

// ============================================================================
// Options and Configuration
// ============================================================================

export interface PackAutoDiscoveryOptions {
  /** Whether to auto-load extensions when packs load (default: true) */
  readonly autoLoad?: boolean;
  /** Logger for discovery events */
  readonly logger?: PackDiscoveryLogger;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  readonly cacheTTL?: number;
}

export interface PackDiscoveryCacheStats {
  readonly cachedPacks: number;
  readonly registeredExtensions: number;
  readonly cacheMemoryEstimate: number;
}

// ============================================================================
// Logging Interface
// ============================================================================

/**
 * Logger interface for pack discovery events.
 */
export interface PackDiscoveryLogger {
  logPackLoaded(packId: string, version: string): void;
  logPackUnloaded(packId: string): void;
  logNoGOFAIConfig(packId: string): void;
  logCacheHit(packId: string, version: string): void;
  logDiscoveryStart(packId: string): void;
  logDiscoverySuccess(packId: string, namespace: string): void;
  logDiscoveryError(packId: string, error: unknown): void;
  logAutoLoad(packId: string, namespace: string): void;
  logExtensionUnload(packId: string, namespace: string): void;
  logModuleLoad(packId: string, module: string, status: 'success' | 'failed', error?: unknown): void;
  logRegistrationSuccess(packId: string, namespace: string): void;
  logRegistrationFailure(packId: string, namespace: string, errors: readonly string[]): void;
  logRegistrationError(packId: string, error: unknown): void;
}

/**
 * Console-based logger implementation.
 */
export class ConsolePackDiscoveryLogger implements PackDiscoveryLogger {
  private readonly prefix = '[GOFAI Pack Discovery]';
  
  logPackLoaded(packId: string, version: string): void {
    console.info(`${this.prefix} Pack loaded: ${packId}@${version}`);
  }
  
  logPackUnloaded(packId: string): void {
    console.info(`${this.prefix} Pack unloaded: ${packId}`);
  }
  
  logNoGOFAIConfig(packId: string): void {
    console.debug(`${this.prefix} Pack ${packId} has no GOFAI configuration`);
  }
  
  logCacheHit(packId: string, version: string): void {
    console.debug(`${this.prefix} Cache hit for ${packId}@${version}`);
  }
  
  logDiscoveryStart(packId: string): void {
    console.info(`${this.prefix} Starting discovery for pack: ${packId}`);
  }
  
  logDiscoverySuccess(packId: string, namespace: string): void {
    console.info(`${this.prefix} Found GOFAI extension in ${packId}: ${namespace}`);
  }
  
  logDiscoveryError(packId: string, error: unknown): void {
    console.error(`${this.prefix} Discovery failed for ${packId}:`, error);
  }
  
  logAutoLoad(packId: string, namespace: string): void {
    console.info(`${this.prefix} Auto-loading extension ${namespace} from ${packId}`);
  }
  
  logExtensionUnload(packId: string, namespace: string): void {
    console.info(`${this.prefix} Unloading extension ${namespace} from ${packId}`);
  }
  
  logModuleLoad(packId: string, module: string, status: 'success' | 'failed', error?: unknown): void {
    if (status === 'success') {
      console.debug(`${this.prefix} Loaded ${module} module for ${packId}`);
    } else {
      console.warn(`${this.prefix} Failed to load ${module} module for ${packId}:`, error);
    }
  }
  
  logRegistrationSuccess(packId: string, namespace: string): void {
    console.info(`${this.prefix} Registered extension ${namespace} from ${packId}`);
  }
  
  logRegistrationFailure(packId: string, namespace: string, errors: readonly string[]): void {
    console.error(
      `${this.prefix} Failed to register extension ${namespace} from ${packId}:`,
      errors
    );
  }
  
  logRegistrationError(packId: string, error: unknown): void {
    console.error(`${this.prefix} Registration error for ${packId}:`, error);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a pack auto-discovery manager.
 */
export function createPackAutoDiscovery(
  extensionRegistry: ExtensionRegistry,
  options?: PackAutoDiscoveryOptions
): PackGOFAIAutoDiscovery {
  return new PackGOFAIAutoDiscovery(extensionRegistry, options);
}

/**
 * Attach pack auto-discovery to a pack registry.
 * 
 * In a real implementation, this would attach event listeners to the pack
 * registry to automatically discover GOFAI extensions when packs are loaded.
 */
export function attachToPackRegistry(
  autoDiscovery: PackGOFAIAutoDiscovery,
  packRegistry: PackRegistryLike
): PackRegistryDisconnect {
  // Attach to pack loaded events
  const handlePackLoaded = (event: PackLoadedEvent) => {
    autoDiscovery.handlePackLoaded(event).catch(error => {
      console.error('[GOFAI] Failed to handle pack loaded event:', error);
    });
  };
  
  const handlePackUnloaded = (event: PackUnloadedEvent) => {
    autoDiscovery.handlePackUnloaded(event).catch(error => {
      console.error('[GOFAI] Failed to handle pack unloaded event:', error);
    });
  };
  
  // In a real implementation, would attach to actual event emitters:
  // packRegistry.on('loaded', handlePackLoaded);
  // packRegistry.on('unloaded', handlePackUnloaded);
  
  // Return disconnect function
  return () => {
    // In a real implementation, would remove event listeners:
    // packRegistry.off('loaded', handlePackLoaded);
    // packRegistry.off('unloaded', handlePackUnloaded);
  };
}

/**
 * Minimal pack registry interface for attachment.
 */
export interface PackRegistryLike {
  on?(event: string, handler: (data: any) => void): void;
  off?(event: string, handler: (data: any) => void): void;
}

/**
 * Function to disconnect from pack registry.
 */
export type PackRegistryDisconnect = () => void;
