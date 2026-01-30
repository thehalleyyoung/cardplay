/**
 * @fileoverview Extension Registry and Loader
 * 
 * Manages extension discovery, installation, activation, and lifecycle.
 * Provides sandboxed API access based on permissions.
 * 
 * @module @cardplay/extensions/registry
 */

import type {
  ExtensionManifest,
  ExtensionModule,
  ExtensionContext,
  ExtensionPermission,
  InstalledExtension,
  ExtensionState,
  CardPlayAPI,
  ExtensionStoreAPI,
  ExtensionAudioAPI,
  ExtensionPrologAPI,
  ExtensionUIAPI
} from './types';
import { validateExtensionManifest, isCompatibleVersion } from './validate';
import { discoverExtensions, type DiscoveryPaths } from './discovery';

// ============================================================================
// EXTENSION REGISTRY
// ============================================================================

/**
 * Extension registry manages all installed and active extensions.
 */
export class ExtensionRegistry {
  private installedExtensions = new Map<string, InstalledExtension>();
  private activeModules = new Map<string, ExtensionModule>();
  private readonly cardplayVersion: string;

  constructor(cardplayVersion: string = '1.0.0') {
    this.cardplayVersion = cardplayVersion;
  }

  /**
   * Discovers extensions from a directory path or discovery paths config.
   * 
   * Change 404: Implements pack discovery from multiple sources:
   * - Project-local folder (./extensions/)
   * - User folder (~/.cardplay/extensions/)
   * - System folder (platform-specific)
   * 
   * @param pathOrPaths Single path string or DiscoveryPaths config
   * @returns List of discovered extension manifests
   */
  async discoverExtensions(pathOrPaths: string | DiscoveryPaths): Promise<ExtensionManifest[]> {
    // Convert string path to DiscoveryPaths
    const paths: DiscoveryPaths = typeof pathOrPaths === 'string'
      ? { projectLocal: pathOrPaths }
      : pathOrPaths;
    
    // Use discovery module
    const results = await discoverExtensions(paths);
    
    // Return just the manifests
    return results.map(r => r.manifest);
  }

  /**
   * Installs an extension from a manifest.
   */
  async installExtension(
    manifest: ExtensionManifest,
    extensionPath: string
  ): Promise<{ success: boolean; error?: string }> {
    // Validate manifest
    const validation = validateExtensionManifest(manifest);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join(', ')
      };
    }

    // Check version compatibility
    if (!isCompatibleVersion(manifest.cardplayVersion, this.cardplayVersion)) {
      return {
        success: false,
        error: `Extension requires CardPlay ${manifest.cardplayVersion}, current version is ${this.cardplayVersion}`
      };
    }

    // Check if already installed
    if (this.installedExtensions.has(manifest.id)) {
      return {
        success: false,
        error: 'Extension is already installed'
      };
    }

    // Check dependencies
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        const depExtension = this.installedExtensions.get(dep.id);
        if (!depExtension) {
          return {
            success: false,
            error: `Missing dependency: ${dep.id}`
          };
        }
        if (!isCompatibleVersion(dep.version, depExtension.manifest.version)) {
          return {
            success: false,
            error: `Dependency version mismatch: ${dep.id} requires ${dep.version}, installed is ${depExtension.manifest.version}`
          };
        }
      }
    }

    // Install extension
    const installed: InstalledExtension = {
      manifest,
      state: 'installed',
      installedAt: new Date(),
      path: extensionPath
    };

    this.installedExtensions.set(manifest.id, installed);

    return { success: true };
  }

  /**
   * Uninstalls an extension.
   */
  async uninstallExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension) {
      return {
        success: false,
        error: 'Extension not found'
      };
    }

    // Check if other extensions depend on this one
    for (const [id, ext] of this.installedExtensions) {
      if (ext.manifest.dependencies?.some(dep => dep.id === extensionId)) {
        return {
          success: false,
          error: `Cannot uninstall: extension ${id} depends on this extension`
        };
      }
    }

    // Disable if enabled
    if (extension.state === 'enabled') {
      await this.disableExtension(extensionId);
    }

    // Remove from registry
    this.installedExtensions.delete(extensionId);

    return { success: true };
  }

  /**
   * Enables (activates) an extension.
   */
  async enableExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension) {
      return {
        success: false,
        error: 'Extension not found'
      };
    }

    if (extension.state === 'enabled') {
      return { success: true }; // Already enabled
    }

    try {
      // Load extension module (placeholder)
      const module = await this.loadExtensionModule(extension);

      // Create extension context
      const context = this.createExtensionContext(extension);

      // Activate extension
      await module.activate(context);

      // Update state
      this.activeModules.set(extensionId, module);
      const updated: InstalledExtension = {
        ...extension,
        state: 'enabled',
        enabledAt: new Date()
      };
      this.installedExtensions.set(extensionId, updated);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const updated: InstalledExtension = {
        ...extension,
        state: 'error',
        error: errorMessage
      };
      this.installedExtensions.set(extensionId, updated);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Disables (deactivates) an extension.
   */
  async disableExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension) {
      return {
        success: false,
        error: 'Extension not found'
      };
    }

    if (extension.state !== 'enabled') {
      return { success: true }; // Already disabled
    }

    try {
      const module = this.activeModules.get(extensionId);
      if (module?.deactivate) {
        await module.deactivate();
      }

      this.activeModules.delete(extensionId);

      const updated: InstalledExtension = {
        ...extension,
        state: 'installed'
      };
      this.installedExtensions.set(extensionId, updated);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Gets an installed extension.
   */
  getExtension(extensionId: string): InstalledExtension | undefined {
    return this.installedExtensions.get(extensionId);
  }

  /**
   * Lists all installed extensions.
   */
  listExtensions(): InstalledExtension[] {
    return Array.from(this.installedExtensions.values());
  }

  /**
   * Lists extensions by state.
   */
  listExtensionsByState(state: ExtensionState): InstalledExtension[] {
    return this.listExtensions().filter(ext => ext.state === state);
  }

  /**
   * Lists extensions by category.
   */
  listExtensionsByCategory(category: string): InstalledExtension[] {
    return this.listExtensions().filter(ext => ext.manifest.category === category);
  }

  /**
   * Searches extensions by query.
   */
  searchExtensions(query: string): InstalledExtension[] {
    const lowerQuery = query.toLowerCase();
    return this.listExtensions().filter(ext =>
      ext.manifest.name.toLowerCase().includes(lowerQuery) ||
      ext.manifest.description.toLowerCase().includes(lowerQuery) ||
      ext.manifest.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Loads an extension module (placeholder).
   * In production, this would dynamically import the extension code.
   */
  private async loadExtensionModule(_extension: InstalledExtension): Promise<ExtensionModule> {
    // Placeholder: In production, use dynamic import
    // const modulePath = path.join(_extension.path, _extension.manifest.entryPoint);
    // return await import(modulePath);
    
    throw new Error('Extension loading not implemented (requires dynamic import)');
  }

  /**
   * Creates an extension context with appropriate API access.
   */
  private createExtensionContext(extension: InstalledExtension): ExtensionContext {
    const permissions = extension.manifest.permissions;
    
    return {
      extensionId: extension.manifest.id,
      extensionPath: extension.path,
      permissions,
      cardplay: this.createCardPlayAPI(permissions)
    };
  }

  /**
   * Creates a CardPlay API object with only the permitted APIs.
   */
  private createCardPlayAPI(permissions: readonly ExtensionPermission[]): CardPlayAPI {
    // Build API with conditional properties
    const apiParts: {
      version: string;
      stores?: ExtensionStoreAPI;
      audio?: ExtensionAudioAPI;
      prolog?: ExtensionPrologAPI;
      ui?: ExtensionUIAPI;
    } = {
      version: this.cardplayVersion
    };

    // Add store APIs if permitted
    if (permissions.includes('event-store') || 
        permissions.includes('clip-registry') || 
        permissions.includes('routing-graph')) {
      apiParts.stores = this.createStoreAPI(permissions);
    }

    // Add audio API if permitted
    if (permissions.includes('audio-engine')) {
      apiParts.audio = this.createAudioAPI();
    }

    // Add Prolog API if permitted
    if (permissions.includes('prolog-kb')) {
      apiParts.prolog = this.createPrologAPI();
    }

    // Add UI API if permitted
    if (permissions.includes('ui-extension')) {
      apiParts.ui = this.createUIAPI();
    }

    return apiParts as CardPlayAPI;
  }

  /**
   * Creates store API object.
   */
  private createStoreAPI(permissions: readonly ExtensionPermission[]): ExtensionStoreAPI {
    const apiParts: {
      eventStore?: any;
      clipRegistry?: any;
      routingGraph?: any;
    } = {};

    // Note: In production, these would connect to actual store instances
    // For now, these are placeholders

    if (permissions.includes('event-store')) {
      apiParts.eventStore = {
        subscribe: (_streamId: string, _callback: (events: any[]) => void) => {
          // Placeholder: connect to SharedEventStore
          return () => {}; // unsubscribe
        },
        getStream: (_streamId: string) => {
          // Placeholder: get from SharedEventStore
          return null;
        },
        addEvents: (_streamId: string, _events: any[]) => {
          // Placeholder: add to SharedEventStore
        }
      };
    }

    if (permissions.includes('clip-registry')) {
      apiParts.clipRegistry = {
        subscribe: (_callback: (clips: any[]) => void) => {
          // Placeholder: connect to ClipRegistry
          return () => {}; // unsubscribe
        },
        getClip: (_clipId: string) => {
          // Placeholder: get from ClipRegistry
          return null;
        },
        createClip: (_clip: any) => {
          // Placeholder: create in ClipRegistry
        }
      };
    }

    if (permissions.includes('routing-graph')) {
      apiParts.routingGraph = {
        subscribe: (_callback: (graph: any) => void) => {
          // Placeholder: connect to RoutingGraph
          return () => {}; // unsubscribe
        },
        addConnection: (_connection: any) => {
          // Placeholder: add to RoutingGraph
        },
        removeConnection: (_connectionId: string) => {
          // Placeholder: remove from RoutingGraph
        }
      };
    }

    return apiParts as ExtensionStoreAPI;
  }

  /**
   * Creates audio API object.
   */
  private createAudioAPI(): ExtensionAudioAPI {
    return {
      createNode: (_nodeType: string, _config: any) => {
        // Placeholder: create audio node
        return null;
      },
      connectNodes: (_source: any, _target: any) => {
        // Placeholder: connect audio nodes
      },
      disconnectNodes: (_source: any, _target: any) => {
        // Placeholder: disconnect audio nodes
      }
    };
  }

  /**
   * Creates Prolog API object.
   */
  private createPrologAPI(): ExtensionPrologAPI {
    return {
      addPredicate: (_name: string, _arity: number, _handler: (...args: any[]) => any) => {
        // Placeholder: add predicate to Prolog KB
      },
      addRule: (_rule: string) => {
        // Placeholder: add rule to Prolog KB
      },
      query: (_query: string) => {
        // Placeholder: query Prolog KB
        return [];
      }
    };
  }

  /**
   * Creates UI API object.
   */
  private createUIAPI(): ExtensionUIAPI {
    return {
      registerCard: (_cardType: string, _factory: any) => {
        // Placeholder: register card type
      },
      registerDeck: (_deckType: string, _factory: any) => {
        // Placeholder: register deck type
      },
      registerBoard: (_board: any) => {
        // Placeholder: register board
      },
      showNotification: (_message: string, _type?: 'info' | 'success' | 'warning' | 'error') => {
        // Placeholder: show notification
      }
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global extension registry singleton.
 */
export const extensionRegistry = new ExtensionRegistry();
