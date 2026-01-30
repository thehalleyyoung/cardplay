/**
 * @fileoverview Deck Factories Index
 *
 * Exports all deck factories and registration function.
 *
 * @module @cardplay/boards/decks/factories
 */

export { patternEditorFactory } from './pattern-deck-factory';
export { pianoRollFactory } from './piano-roll-deck-factory';
export { propertiesFactory } from './properties-deck-factory';
export { instrumentBrowserFactory } from './instruments-deck-factory';
export { notationDeckFactory } from './notation-deck-factory';
export { sessionDeckFactory } from './session-deck-factory';
export { arrangementDeckFactory } from './arrangement-deck-factory';
export { mixerDeckFactory } from './mixer-deck-factory';
export { dspChainFactory } from './dsp-chain-factory';
export { sampleBrowserFactory } from './samples-deck-factory';
export { phraseLibraryFactory } from './phrases-deck-factory';
export { transportFactory } from './transport-deck-factory';
export { harmonyDisplayFactory } from './harmony-deck-factory';
export { generatorFactory } from './generator-factory';
export { arrangerFactory } from './arranger-deck-factory';
export { routingFactory } from './routing-deck-factory';
export { automationFactory } from './automation-deck-factory';
export { sampleManagerFactory } from './sample-manager-deck-factory';
export { effectsRackFactory } from './effects-deck-factory';
export { modulationMatrixFactory } from './modulation-matrix-deck-factory';
export { trackGroupsDeckFactory } from './track-groups-factory';
export { mixBusDeckFactory } from './mix-bus-factory';
export { referenceTrackDeckFactory } from './reference-track-factory';
// export { spectrumAnalyzerDeckFactory } from './spectrum-analyzer-factory'; // TODO: implement
// export { waveformEditorDeckFactory } from './waveform-editor-factory'; // TODO: implement
export { aiAdvisorFactory } from './ai-advisor-factory';
export { registryDevtoolDeckFactory } from './registry-devtool-factory';

import { getDeckFactoryRegistry } from '../factory-registry';
import { patternEditorFactory } from './pattern-deck-factory';
import { pianoRollFactory } from './piano-roll-deck-factory';
import { propertiesFactory } from './properties-deck-factory';
import { instrumentBrowserFactory } from './instruments-deck-factory';
import { notationDeckFactory } from './notation-deck-factory';
import { sessionDeckFactory } from './session-deck-factory';
import { arrangementDeckFactory } from './arrangement-deck-factory';
import { mixerDeckFactory } from './mixer-deck-factory';
import { dspChainFactory } from './dsp-chain-factory';
import { sampleBrowserFactory } from './samples-deck-factory';
import { phraseLibraryFactory } from './phrases-deck-factory';
import { transportFactory } from './transport-deck-factory';
import { harmonyDisplayFactory } from './harmony-deck-factory';
import { generatorFactory } from './generator-factory';
import { arrangerFactory } from './arranger-deck-factory';
import { routingFactory } from './routing-deck-factory';
import { automationFactory } from './automation-deck-factory';
import { sampleManagerFactory } from './sample-manager-deck-factory';
import { effectsRackFactory } from './effects-deck-factory';
import { modulationMatrixFactory } from './modulation-matrix-deck-factory';
import { trackGroupsDeckFactory } from './track-groups-factory';
import { mixBusDeckFactory } from './mix-bus-factory';
import { referenceTrackDeckFactory } from './reference-track-factory';
// import { spectrumAnalyzerDeckFactory } from './spectrum-analyzer-factory'; // TODO: implement
// import { waveformEditorDeckFactory } from './waveform-editor-factory'; // TODO: implement
import { aiAdvisorFactory } from './ai-advisor-factory';
import { registryDevtoolDeckFactory } from './registry-devtool-factory';

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
  registry.registerFactory('registry-devtool-deck', registryDevtoolDeckFactory);
}
