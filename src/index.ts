/**
 * @fileoverview Main entry point for @cardplay/core.
 * 
 * @module @cardplay/core
 */

// Re-export all types
export * from './types';

// Re-export all events
export * from './events';

// Re-export all streams
export * from './streams';

// Re-export all containers
export * from './containers';

// Re-export all voices
export * from './voices';

// Re-export all rules
export * from './rules';

// Re-export all cards
// Note (Change 299): Card/Stack types from this module are "composition cards"
// (Card<A,B> and Stack compositions). They are distinct from:
// - AudioModuleCard (audio/instrument-cards.ts)
// - UICardComponent (ui/components/card-component.ts)
// - EditorCardDefinition (user-cards/card-editor-panel.ts)
// See docs/canon/card-systems.md for disambiguation.
export * from './cards';

// NOTE: Board system is available via internal imports until naming conflicts are resolved (B128)
// export * from './boards';
