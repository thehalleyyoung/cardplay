/**
 * @fileoverview Deck Factories Index
 *
 * Exports all deck factories and registration function.
 *
 * @module @cardplay/boards/decks/factories
 */

export { patternEditorFactory } from './pattern-editor-factory';
export { pianoRollFactory } from './piano-roll-factory';
export { propertiesFactory } from './properties-factory';
export { instrumentBrowserFactory } from './instrument-browser-factory';
export { notationDeckFactory } from './notation-deck-factory';
export { sessionDeckFactory } from './session-deck-factory';
export { arrangementDeckFactory } from './arrangement-deck-factory';
export { mixerDeckFactory } from './mixer-deck-factory';

import { getDeckFactoryRegistry } from '../factory-registry';
import { patternEditorFactory } from './pattern-editor-factory';
import { pianoRollFactory } from './piano-roll-factory';
import { propertiesFactory } from './properties-factory';
import { instrumentBrowserFactory } from './instrument-browser-factory';
import { notationDeckFactory } from './notation-deck-factory';
import { sessionDeckFactory } from './session-deck-factory';
import { arrangementDeckFactory } from './arrangement-deck-factory';
import { mixerDeckFactory } from './mixer-deck-factory';

/**
 * Registers all builtin deck factories.
 */
export function registerBuiltinDeckFactories(): void {
  const registry = getDeckFactoryRegistry();

  registry.registerFactory('pattern-deck', patternEditorFactory);
  registry.registerFactory('piano-roll-deck', pianoRollFactory);
  registry.registerFactory('properties-deck', propertiesFactory);
  registry.registerFactory('instruments-deck', instrumentBrowserFactory);
  registry.registerFactory('notation-deck', notationDeckFactory);
  registry.registerFactory('session-deck', sessionDeckFactory);
  registry.registerFactory('arrangement-deck', arrangementDeckFactory);
  registry.registerFactory('mixer-deck', mixerDeckFactory);
}
