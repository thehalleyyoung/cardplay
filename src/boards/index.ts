/**
 * @fileoverview Board System - Main Entry Point
 *
 * CardPlay's Board-Centric Architecture: Typed workspaces with control-level
 * specific tooling. Boards determine which cards and tools are available.
 *
 * @module @cardplay/boards
 */

export * from './types';
export * from './validate';
export * from './validate-tool-config';
export * from './registry';
export * from './recommendations';
export * from './policy';

// Store
export * from './store/types';
export * from './store/storage';
export * from './store/store';

// Context
export * from './context/types';
export * from './context/store';

// Project
export * from './project/types';
export * from './project/create';

// Switching
export * from './switching/types';
export * from './switching/switch-board';
export * from './switching/migration-plan';

// Layout
export * from './layout/runtime-types';
export * from './layout/adapter';
export * from './layout/serialize';
export * from './layout/deserialize';
export * from './layout/guards';

// Decks
export * from './decks/runtime-types';
export * from './decks/factory-types';
export * from './decks/factory-registry';

// Builtins
export * from './builtins';

// Gating
export * from './gating';
