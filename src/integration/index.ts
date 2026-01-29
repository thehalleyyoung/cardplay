/**
 * @fileoverview CardPlay Integration Layer - Unified re-exports
 * 
 * This barrel export provides a single import point for all the
 * integration components that unify CardPlay's architecture.
 * 
 * Usage:
 * ```typescript
 * import {
 *   // State management
 *   getSharedEventStore,
 *   getClipRegistry,
 *   getSelectionStore,
 *   getUndoStack,
 *   getRoutingGraphStore,
 *   getParameterResolver,
 *   executeWithUndo,
 *   
 *   // Editors
 *   TrackerStoreAdapter,
 *   PianoRollStoreAdapter,
 *   NotationStoreAdapter,
 *   
 *   // Generators
 *   GeneratorBase,
 *   ArrangerCard,
 *   DrumMachineCard,
 *   SequencerCard,
 *   MelodyCard,
 *   ArpeggiatorCard,
 *   BasslineCard,
 *   
 *   // Audio
 *   InstrumentBase,
 *   getTransport,
 *   createAutomationLane,
 *   getSampleCache,
 *   
 *   // Views
 *   ArrangementAdapter,
 *   DeckLayoutAdapter,
 *   SessionClipAdapter,
 *   
 *   // MIDI
 *   getMidiInput,
 *   initializeMidi,
 *   
 *   // Music theory
 *   createScaleOverlay,
 *   
 *   // UI helpers
 *   createGhostNotesManager,
 * } from '@cardplay/integration';
 * ```
 * 
 * @module @cardplay/integration
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export {
  // Core stores
  getSharedEventStore,
  getClipRegistry,
  getSelectionStore,
  getUndoStack,
  getRoutingGraphStore,
  
  // Helpers
  resetAllState,
  createEditOperation,
  executeWithUndo,
  
  // Types
  type EventStreamId,
  type EventId,
  type ClipId,
  type RoutingNodeId,
  type EventStreamRecord,
  type ClipRecord,
  type SelectionState,
  type SubscriptionId,
  type UndoAction,
  type RoutingNode,
  type RoutingConnection,
  type RoutingGraph,
} from '../state';

export { getParameterResolver } from '../state/parameter-resolver';
export type {
  ParameterSourceType,
  ParameterSource,
  ResolvedParameter,
  ModulationSource,
} from '../state/parameter-resolver';

// ============================================================================
// EDITOR ADAPTERS
// ============================================================================

export {
  TrackerStoreAdapter,
  createTrackerAdapter,
  type TrackerSharedState,
} from '../ui/components/tracker-store-adapter';

export {
  PianoRollStoreAdapter,
  createPianoRollAdapter,
  type PianoRollSharedState,
  type NoteRectangle,
} from '../ui/components/piano-roll-store-adapter';

export {
  NotationStoreAdapter,
  createNotationAdapter,
} from '../notation/notation-store-adapter';

// ============================================================================
// GENERATOR CARDS
// ============================================================================

export {
  GeneratorBase,
  ArrangerCard,
  DrumMachineCard,
  SequencerCard,
  MelodyCard,
  ArpeggiatorCard,
  BasslineCard,
  type GeneratorConfig,
} from '../cards/generator-mixin';

export {
  GeneratorOutputManager,
  createGeneratorOutput,
} from '../cards/generator-output';

// ============================================================================
// CHORD TRACK
// ============================================================================

export {
  ChordTrackAdapter,
  createChordTrackAdapter,
  parseChord,
  type ChordPayload,
  type ChordEvent,
  type ChordQuality,
} from '../containers/chord-track';

// ============================================================================
// VIEW ADAPTERS
// ============================================================================

export {
  ArrangementAdapter,
  createArrangementAdapter,
  type ArrangementState,
  type ArrangementClip,
  type ArrangementTrack,
  type ArrangementMarker,
  type TimeRulerConfig,
} from '../ui/arrangement-view';

export {
  DeckLayoutAdapter,
  getDeckRegistry,
  createDeck,
  asDeckId,
  asSlotId,
  type DeckId,
  type SlotId,
  type DeckState,
  type CardSlot,
} from '../ui/deck-layout';

export {
  SessionClipAdapter,
  createSessionClipAdapter,
  type SessionSlot,
  type SessionScene,
} from '../ui/session-clip-adapter';

// ============================================================================
// AUDIO
// ============================================================================

export {
  InstrumentBase,
  getInstrumentRegistry,
  type InstrumentCard,
  type NoteEvent,
  type VoiceInfo,
  type InstrumentParameter,
  type InstrumentPreset,
} from '../audio/instrument-interface';

export {
  SamplerInstrumentAdapter,
  createSamplerInstrument,
  type SamplerConfig,
  type SampleZone,
} from '../cards/sampler-instrument-adapter';

export {
  WavetableInstrumentAdapter,
  createWavetableInstrument,
  type WavetableShape,
  type WavetableFilterType,
  type LFOTarget,
  type WavetableFrame,
  type WavetableData,
} from '../audio/wavetable-instrument-adapter';

export {
  getTransport,
  resetTransport,
  type TransportState,
  type TransportConfig,
  type TransportSnapshot,
  type TimeSignature,
  type LoopRegion,
} from '../audio/transport';

export {
  AutomationLane,
  AutomationManager,
  createAutomationLane,
  createAutomationManager,
  asAutomationPointId,
  type AutomationPoint,
  type AutomationPointId,
  type AutomationLaneConfig,
  type CurveType,
} from '../audio/automation-lane';

export {
  getSampleCache,
  createSampleProcessor,
  createSampleEventStream,
  TransientDetector,
  asSampleId,
  asSliceId,
  type SampleId,
  type SliceId,
  type SampleMetadata,
  type SampleSlice,
  type LoadedSample,
  type StretchSettings,
  type PitchSettings,
} from '../audio/sample-pipeline';

// ============================================================================
// MIDI
// ============================================================================

export {
  getMidiInput,
  initializeMidi,
  type MidiMessage,
  type MidiMessageType,
  type NoteMessage,
  type CCMessage,
  type MidiMapping,
  type MidiDeviceInfo,
  type MidiLearnState,
} from '../midi/midi-input';

// ============================================================================
// MUSIC THEORY
// ============================================================================

export {
  ScaleOverlay,
  createScaleOverlay,
  SCALES,
  NOTE_NAMES,
  NOTE_NAMES_FLAT,
  SCALE_DEGREES,
  type PitchClass,
  type ScaleDefinition,
  type ActiveScale,
  type ScaleRegion,
  type ScaleOverlayOptions,
  type KeyDetectionResult,
} from '../music/scale-overlay';

// ============================================================================
// UI HELPERS
// ============================================================================

export {
  GhostNotesManager,
  createGhostNotesManager,
  type GhostNote,
  type GhostNoteSource,
  type GhostNoteFilter,
  type GhostNotesOptions,
} from '../ui/ghost-notes';

export {
  ChordTrackLane,
  createChordTrackLane,
  type ChordBlock,
  type ChordPickerState,
  type ChordLaneOptions,
  type ChordLaneState,
} from '../ui/chord-track-lane';

export {
  getKeyboardShortcuts,
  initializeKeyboardShortcuts,
  type KeyboardShortcut,
  type ShortcutCategory,
} from '../ui/keyboard-shortcuts';

export {
  PianoRollIntegration,
  createPianoRollIntegration,
  type EnhancedNoteRectangle,
  type PianoKeyInfo,
  type ScaleGridLine,
  type PianoRollIntegrationOptions,
} from '../ui/piano-roll-integration';

export {
  SampleFlowManager,
  getSampleFlowManager,
  createSampleDragData,
  makeSampleDraggable,
  createEditorTrackDropZone,
  createSamplerZoneDropZone,
  createDrumPadDropZone,
  setupStandardDropHandlers,
  type SampleDragData,
  type DropTargetType,
  type DropZoneConfig,
  type DropResult,
  type DropHandler,
} from '../ui/components/sample-flow';

export {
  ArrangerPhraseAdapter,
  createArrangerPhraseAdapter,
  getArrangerPhraseAdapter,
  type ArrangementBlock,
  type ChordContext,
  type ScaleContext,
  type ArrangementContext,
  type PhraseSuggestion,
  type PhraseOperationOptions,
} from '../cards/arranger-phrase-adapter';

export {
  AudioAnalyzer,
  VisualizationRenderer,
  createAudioVisualizationTabs,
  getAudioAnalyzer,
  initializeAudioAnalyzer,
  type VisualizationMode,
  type VisualizationConfig,
  type LevelMeterState,
  type CorrelationState,
} from '../ui/reveal-panel-audio';

export {
  createAIAdvisorRevealTab,
  createAIAdvisorTabs,
  type AIAdvisorRevealTabOptions,
} from '../ui/reveal-panel-ai-advisor';

export {
  registerRevealPanel,
  getRevealPanel,
  openAIAdvisor,
  initializeAIAdvisorIntegration,
  cleanupAIAdvisorIntegration,
} from '../ui/ai-advisor-integration';

export {
  CommandPalette,
  registerCommand,
  unregisterCommand,
  getAllCommands,
  clearCommands,
  getCommandPalette,
  openCommandPalette,
  initializeCommandPalette,
  type Command,
  type CommandContext,
} from '../ui/components/command-palette';

export {
  addAIContextMenu,
  addAIContextMenuToAll,
  setupAIContextMenuObserver,
  initializeAIContextMenus,
  extractChordContext,
  extractNoteContext,
  extractPatternContext,
  extractProgressionContext,
  CHORD_MENU_ITEMS,
  NOTE_MENU_ITEMS,
  PATTERN_MENU_ITEMS,
  PROGRESSION_MENU_ITEMS,
  type AIContextMenuItem,
  type AIContextMenuConfig,
} from '../ui/ai-context-menu';

export {
  // MIDI learn functions
  setMidiBinding,
  clearMidiBinding,
  hasMidiBinding,
  applyMidiCCValue,
  getParameterAsMidiCC,
  findParametersByMidiBinding,
  createMidiLearnCallback,
  type MidiLearnBinding,
} from '../cards/parameters';

// ============================================================================
// SUBSYSTEM BRIDGES
// ============================================================================

export {
  AudioEngineStoreBridge,
  getAudioEngineBridge,
  resetAudioEngineBridge,
  type AudioEngineEvent,
  type AudioEngineBridgeConfig,
} from '../audio/audio-engine-store-bridge';

export {
  SessionViewStoreBridge,
  getSessionViewBridge,
  resetSessionViewBridge,
  type SessionTrackConfig,
  type SessionSceneConfig,
  type SessionGridPosition,
  type SyncedClipSlot,
  type SyncedSessionState,
  type SessionViewBridgeConfig,
} from '../ui/session-view-store-bridge';

export {
  NotationPlaybackBridge,
  getNotationPlaybackBridge,
  resetNotationPlaybackBridge,
  type NotationEvent,
  type ScorePosition,
  type NotationPlaybackState,
  type NotationPlaybackBridgeConfig,
} from '../notation/playback-transport-bridge';

export {
  EventFlattenerStoreBridge,
  getEventFlattenerBridge,
  resetEventFlattenerBridge,
  type FlattenedEvent,
  type FlattenedStream,
  type TickRange,
  type EventFilterOptions,
  type EventFlattenerBridgeConfig,
} from '../audio/event-flattener-store-bridge';

export {
  DeckRoutingStoreBridge,
  getDeckRoutingBridge,
  resetDeckRoutingBridge,
  type DeckNodeType,
  type DeckRoutingNode,
  type DeckRoutingConnection,
  type DeckState as DeckRoutingDeckState,
  type MixerState,
  type DeckRoutingState,
  type DeckRoutingBridgeConfig,
} from '../audio/deck-routing-store-bridge';

export {
  // Legacy card adapters
  createLegacyCardAdapter,
  DrumMachineAdapter,
  ArpeggiatorAdapter,
  BasslineAdapter,
  ArrangerAdapter,
  BaseLegacyAdapter,
  type LegacyCardEvent,
  type LegacyPattern,
  type LegacyAdapterConfig,
  type LegacyCardAdapter,
  type DrumMachinePattern,
  type DrumTrack,
  type ArpeggiatorPattern,
  type BasslinePattern,
  type ArrangerSection,
  type ArrangementPattern,
} from '../cards/legacy-card-adapters';

// ============================================================================
// INTEGRATION UTILITIES
// ============================================================================

/**
 * Initializes all integration components.
 */
export async function initializeIntegration(options?: {
  audioContext?: AudioContext;
  initMidi?: boolean;
}): Promise<void> {
  // Set audio context for components that need it
  if (options?.audioContext) {
    getSampleCache().setAudioContext(options.audioContext);
    getTransport().setAudioContext(options.audioContext);
  }

  // Initialize MIDI if requested
  if (options?.initMidi) {
    await initializeMidi();
  }
}

/**
 * Resets all integration state (useful for testing).
 */
export function resetIntegration(): void {
  resetAllState();
  resetTransport();
  getDeckRegistry().clear();
  getSampleCache().clear();
  getInstrumentRegistry().clear();
  
  // Reset subsystem bridges
  resetAudioEngineBridge();
  resetSessionViewBridge();
  resetNotationPlaybackBridge();
  resetEventFlattenerBridge();
  resetDeckRoutingBridge();
}

// Import singletons for initialization
import { getSampleCache } from '../audio/sample-pipeline';
import { getTransport, resetTransport } from '../audio/transport';
import { getDeckRegistry } from '../ui/deck-layout';
import { getInstrumentRegistry } from '../audio/instrument-interface';
import { initializeMidi } from '../midi/midi-input';
import { resetAllState } from '../state';
import { resetAudioEngineBridge } from '../audio/audio-engine-store-bridge';
import { resetSessionViewBridge } from '../ui/session-view-store-bridge';
import { resetNotationPlaybackBridge } from '../notation/playback-transport-bridge';
import { resetEventFlattenerBridge } from '../audio/event-flattener-store-bridge';
import { resetDeckRoutingBridge } from '../audio/deck-routing-store-bridge';
