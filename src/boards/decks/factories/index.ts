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
export { dspChainFactory } from './dsp-chain-factory';
export { sampleBrowserFactory } from './sample-browser-factory';
export { phraseLibraryFactory } from './phrase-library-factory';
export { transportFactory } from './transport-factory';
export { harmonyDisplayFactory } from './harmony-display-factory';
export { generatorFactory } from './generator-factory';
export { arrangerFactory } from './arranger-factory';
export { routingFactory } from './routing-factory';
export { automationFactory } from './automation-factory';
export { sampleManagerFactory } from './sample-manager-factory';
export { effectsRackFactory } from './effects-rack-factory';
export { modulationMatrixFactory } from './modulation-matrix-factory';
export { trackGroupsDeckFactory } from './track-groups-factory';
export { mixBusDeckFactory } from './mix-bus-factory';
export { referenceTrackDeckFactory } from './reference-track-factory';
// export { spectrumAnalyzerDeckFactory } from './spectrum-analyzer-factory'; // TODO: implement
// export { waveformEditorDeckFactory } from './waveform-editor-factory'; // TODO: implement
export { aiAdvisorFactory } from './ai-advisor-factory';

import { getDeckFactoryRegistry } from '../factory-registry';
import { patternEditorFactory } from './pattern-editor-factory';
import { pianoRollFactory } from './piano-roll-factory';
import { propertiesFactory } from './properties-factory';
import { instrumentBrowserFactory } from './instrument-browser-factory';
import { notationDeckFactory } from './notation-deck-factory';
import { sessionDeckFactory } from './session-deck-factory';
import { arrangementDeckFactory } from './arrangement-deck-factory';
import { mixerDeckFactory } from './mixer-deck-factory';
import { dspChainFactory } from './dsp-chain-factory';
import { sampleBrowserFactory } from './sample-browser-factory';
import { phraseLibraryFactory } from './phrase-library-factory';
import { transportFactory } from './transport-factory';
import { harmonyDisplayFactory } from './harmony-display-factory';
import { generatorFactory } from './generator-factory';
import { arrangerFactory } from './arranger-factory';
import { routingFactory } from './routing-factory';
import { automationFactory } from './automation-factory';
import { sampleManagerFactory } from './sample-manager-factory';
import { effectsRackFactory } from './effects-rack-factory';
import { modulationMatrixFactory } from './modulation-matrix-factory';
import { trackGroupsDeckFactory } from './track-groups-factory';
import { mixBusDeckFactory } from './mix-bus-factory';
import { referenceTrackDeckFactory } from './reference-track-factory';
// import { spectrumAnalyzerDeckFactory } from './spectrum-analyzer-factory'; // TODO: implement
// import { waveformEditorDeckFactory } from './waveform-editor-factory'; // TODO: implement
import { aiAdvisorFactory } from './ai-advisor-factory';

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
  registry.registerFactory('dsp-chain', dspChainFactory);
  registry.registerFactory('samples-deck', sampleBrowserFactory);
  registry.registerFactory('phrases-deck', phraseLibraryFactory);
  registry.registerFactory('transport-deck', transportFactory);
  registry.registerFactory('harmony-deck', harmonyDisplayFactory);
  registry.registerFactory('generators-deck', generatorFactory);
  registry.registerFactory('arranger-deck', arrangerFactory);
  registry.registerFactory('routing-deck', routingFactory);
  registry.registerFactory('automation-deck', automationFactory);
  registry.registerFactory('sample-manager-deck', sampleManagerFactory);
  registry.registerFactory('effects-deck', effectsRackFactory);
  registry.registerFactory('modulation-matrix-deck', modulationMatrixFactory);
  registry.registerFactory('track-groups-deck', trackGroupsDeckFactory);
  registry.registerFactory('mix-bus-deck', mixBusDeckFactory);
  registry.registerFactory('reference-track-deck', referenceTrackDeckFactory);
  // registry.registerFactory('spectrum-analyzer-deck', spectrumAnalyzerDeckFactory); // TODO: implement
  // registry.registerFactory('waveform-editor-deck', waveformEditorDeckFactory); // TODO: implement
  registry.registerFactory('ai-advisor-deck', aiAdvisorFactory);
}
