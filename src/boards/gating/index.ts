/**
 * @fileoverview Board Gating System
 * 
 * Runtime gating logic that controls which cards, decks, and tools are
 * visible based on the active board's control level and tool configuration.
 * 
 * @module @cardplay/boards/gating
 */

export * from './card-kinds';
export * from './tool-visibility';
export * from './is-card-allowed';
export * from './why-not';
export * from './get-allowed-cards';
export * from './validate-deck-drop';
export * from './validate-connection';
export * from './capabilities';
export * from './instrument-card-adapter';
