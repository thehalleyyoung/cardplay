/**
 * @fileoverview Extension System Types
 * 
 * Defines the type-safe extension API for CardPlay, enabling community-created
 * custom cards, decks, boards, generators, effects, and Prolog predicates.
 * 
 * Extensions follow a manifest-based architecture with sandboxing and validation.
 * 
 * @module @cardplay/extensions/types
 */

// ============================================================================
// EXTENSION METADATA
// ============================================================================

/**
 * Extension manifest version (semantic versioning).
 */
export type ExtensionVersion = `${number}.${number}.${number}`;

/**
 * Extension category for organization and discovery.
 */
export type ExtensionCategory =
  | 'card'           // Custom card types
  | 'deck'           // Custom deck types
  | 'board'          // Custom board configurations
  | 'generator'      // Custom MIDI/audio generators
  | 'effect'         // Custom audio effects
  | 'prolog'         // Custom Prolog predicates/rules
  | 'theme'          // Custom visual themes
  | 'utility';       // Helper functions/utilities

/**
 * Extension manifest describing an extension package.
 */
export interface ExtensionManifest {
  readonly id: string;                    // Unique extension ID (reverse DNS: com.author.extension)
  readonly name: string;                  // Display name
  readonly version: ExtensionVersion;     // Extension version
  readonly author: string;                // Author name/organization
  readonly description: string;           // Short description
  readonly category: ExtensionCategory;   // Primary category
  readonly tags: readonly string[];       // Searchable tags
  readonly homepage?: string;             // Documentation URL
  readonly repository?: string;           // Source code URL
  readonly license: string;               // SPDX license identifier
  readonly cardplayVersion: string;       // Minimum CardPlay version (semver range)
  readonly dependencies?: readonly ExtensionDependency[]; // Other extensions required
  readonly permissions: readonly ExtensionPermission[];   // Required permissions
  readonly entryPoint: string;            // Main module path (relative to extension root)
  readonly assets?: readonly string[];    // Asset file paths (samples, images, etc.)
}

/**
 * Extension dependency on another extension.
 */
export interface ExtensionDependency {
  readonly id: string;                    // Extension ID
  readonly version: string;               // Version constraint (semver range)
}

/**
 * Permissions an extension can request.
 */
export type ExtensionPermission =
  | 'audio-engine'       // Access to audio engine nodes/routing
  | 'event-store'        // Read/write event store
  | 'clip-registry'      // Read/write clip registry
  | 'routing-graph'      // Read/write routing graph
  | 'prolog-kb'          // Add predicates to Prolog knowledge base
  | 'file-system'        // Read/write local files (sandboxed)
  | 'network'            // Network access (HTTP requests)
  | 'ui-extension';      // Create custom UI components

// ============================================================================
// EXTENSION API
// ============================================================================

/**
 * Extension context provided to extensions at initialization.
 * Provides access to CardPlay APIs based on requested permissions.
 */
export interface ExtensionContext {
  readonly extensionId: string;
  readonly extensionPath: string;
  readonly permissions: readonly ExtensionPermission[];
  readonly cardplay: CardPlayAPI;
}

/**
 * CardPlay API surface exposed to extensions.
 * Only includes APIs for which the extension has permissions.
 */
export interface CardPlayAPI {
  readonly version: string;
  readonly stores?: ExtensionStoreAPI;
  readonly audio?: ExtensionAudioAPI;
  readonly prolog?: ExtensionPrologAPI;
  readonly ui?: ExtensionUIAPI;
}

/**
 * Store access API (requires 'event-store', 'clip-registry', or 'routing-graph' permissions).
 */
export interface ExtensionStoreAPI {
  readonly eventStore?: {
    readonly subscribe: (streamId: string, callback: (events: any[]) => void) => () => void;
    readonly getStream: (streamId: string) => any;
    readonly addEvents: (streamId: string, events: any[]) => void;
  };
  readonly clipRegistry?: {
    readonly subscribe: (callback: (clips: any[]) => void) => () => void;
    readonly getClip: (clipId: string) => any;
    readonly createClip: (clip: any) => void;
  };
  readonly routingGraph?: {
    readonly subscribe: (callback: (graph: any) => void) => () => void;
    readonly addConnection: (connection: any) => void;
    readonly removeConnection: (connectionId: string) => void;
  };
}

/**
 * Audio engine API (requires 'audio-engine' permission).
 */
export interface ExtensionAudioAPI {
  readonly createNode: (nodeType: string, config: any) => any;
  readonly connectNodes: (source: any, target: any) => void;
  readonly disconnectNodes: (source: any, target: any) => void;
}

/**
 * Prolog knowledge base API (requires 'prolog-kb' permission).
 */
export interface ExtensionPrologAPI {
  readonly addPredicate: (name: string, arity: number, handler: (...args: any[]) => any) => void;
  readonly addRule: (rule: string) => void;
  readonly query: (query: string) => any[];
}

/**
 * UI extension API (requires 'ui-extension' permission).
 */
export interface ExtensionUIAPI {
  readonly registerCard: (cardType: string, factory: any) => void;
  readonly registerDeck: (deckType: string, factory: any) => void;
  readonly registerBoard: (board: any) => void;
  readonly showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// ============================================================================
// EXTENSION MODULE
// ============================================================================

/**
 * Extension module interface that all extensions must implement.
 */
export interface ExtensionModule {
  /**
   * Called when extension is activated.
   * @param context Extension context with API access
   */
  activate(context: ExtensionContext): void | Promise<void>;

  /**
   * Called when extension is deactivated.
   * Clean up resources, unregister handlers, etc.
   */
  deactivate?(): void | Promise<void>;
}

// ============================================================================
// CARD EXTENSION API
// ============================================================================

/**
 * Custom card type definition.
 */
export interface CardExtensionDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly render: (container: HTMLElement, state: any) => CardExtensionInstance;
}

/**
 * Card extension instance with lifecycle methods.
 */
export interface CardExtensionInstance {
  readonly destroy: () => void;
  readonly update?: (state: any) => void;
  readonly serialize?: () => any;
}

// ============================================================================
// DECK EXTENSION API
// ============================================================================

/**
 * Custom deck type definition.
 */
export interface DeckExtensionDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon?: string;
  readonly render: (container: HTMLElement, config: any) => DeckExtensionInstance;
}

/**
 * Deck extension instance with lifecycle methods.
 */
export interface DeckExtensionInstance {
  readonly destroy: () => void;
  readonly update?: (config: any) => void;
  readonly resize?: (width: number, height: number) => void;
}

// ============================================================================
// GENERATOR EXTENSION API
// ============================================================================

/**
 * Custom generator definition.
 */
export interface GeneratorExtensionDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly parameters: readonly GeneratorParameter[];
  readonly generate: (params: any) => any[]; // Returns MIDI events
}

/**
 * Generator parameter definition.
 */
export interface GeneratorParameter {
  readonly id: string;
  readonly name: string;
  readonly type: 'number' | 'boolean' | 'string' | 'enum';
  readonly min?: number;
  readonly max?: number;
  readonly default: any;
  readonly options?: readonly string[];
}

// ============================================================================
// EFFECT EXTENSION API
// ============================================================================

/**
 * Custom audio effect definition.
 */
export interface EffectExtensionDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly parameters: readonly EffectParameter[];
  readonly createProcessor: (audioContext: AudioContext, config: any) => AudioNode;
}

/**
 * Effect parameter definition.
 */
export interface EffectParameter {
  readonly id: string;
  readonly name: string;
  readonly type: 'number' | 'boolean' | 'enum';
  readonly min?: number;
  readonly max?: number;
  readonly default: any;
  readonly unit?: string;
  readonly options?: readonly string[];
}

// ============================================================================
// PROLOG EXTENSION API
// ============================================================================

/**
 * Custom Prolog predicate definition.
 */
export interface PrologExtensionDefinition {
  readonly predicates: readonly PrologPredicate[];
  readonly rules?: readonly string[];
  readonly facts?: readonly string[];
}

/**
 * Prolog predicate definition.
 */
export interface PrologPredicate {
  readonly name: string;
  readonly arity: number;
  readonly description: string;
  readonly handler: (...args: any[]) => any;
}

// ============================================================================
// EXTENSION STATE
// ============================================================================

/**
 * Extension installation state.
 */
export type ExtensionState =
  | 'uninstalled'
  | 'installing'
  | 'installed'
  | 'enabled'
  | 'disabled'
  | 'error';

/**
 * Installed extension metadata.
 */
export interface InstalledExtension {
  readonly manifest: ExtensionManifest;
  readonly state: ExtensionState;
  readonly installedAt: Date;
  readonly enabledAt?: Date;
  readonly error?: string;
  readonly path: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Extension validation result.
 */
export interface ExtensionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ExtensionValidationError[];
  readonly warnings: readonly ExtensionValidationWarning[];
}

/**
 * Extension validation error.
 */
export interface ExtensionValidationError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

/**
 * Extension validation warning.
 */
export interface ExtensionValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}
