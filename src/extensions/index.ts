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
export * from './capabilities';
export * from './errors';
export * from './logging';
export * from './validators';

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

// Re-export provenance types (Change 411)
export type {
  RegistryEntryProvenance,
  RegistryTrustLevel,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  RegistryHealthReport,
} from './validators';

export { extensionRegistry } from './registry';
export { validateExtensionManifest, isCompatibleVersion } from './validate';
