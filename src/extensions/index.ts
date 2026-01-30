/**
 * @fileoverview Extension System API
 * 
 * Public API for the CardPlay extension system.
 * 
 * @module @cardplay/extensions
 */

export * from './types';
export * from './validate';
export * from './registry';

// Re-export commonly used types
export type {
  ExtensionManifest,
  ExtensionModule,
  ExtensionContext,
  CardPlayAPI,
  InstalledExtension,
  ExtensionState,
  CardExtensionDefinition,
  DeckExtensionDefinition,
  GeneratorExtensionDefinition,
  EffectExtensionDefinition,
  PrologExtensionDefinition
} from './types';

export { extensionRegistry } from './registry';
export { validateExtensionManifest, isCompatibleVersion } from './validate';
