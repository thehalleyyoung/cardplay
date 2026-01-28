/**
 * @fileoverview Tracker Module Index
 * 
 * Exports all tracker-related components for the CardPlay tracker system.
 * 
 * @module @cardplay/tracker
 */

// Core types
export {
  // Branded types
  type PatternId,
  type TrackId,
  type RowIndex,
  type ColumnIndex,
  type EffectCode,
  type EffectParam,
  type PhraseId,
  type InstrumentSlot,
  
  // Brand constructors
  asPatternId,
  asTrackId,
  asRowIndex,
  asColumnIndex,
  asEffectCode,
  asEffectParam,
  asPhraseId,
  asInstrumentSlot,
  
  // Enums
  SpecialNote,
  TrackType,
  DisplayBase,
  EditMode,
  
  // Note/Effect types
  type NoteValue,
  type NoteCell,
  type EffectCommand,
  type EffectCell,
  type TrackerRow,
  
  // Note/Effect constructors
  emptyNoteCell,
  noteCell,
  noteOffCell,
  noteCutCell,
  emptyEffectCell,
  effectCell,
  effect,
  emptyRow,
  
  // Track types
  type TrackConfig,
  type TrackData,
  createTrackConfig,
  createTrackData,
  
  // Pattern types
  type PatternConfig,
  type Pattern,
  createPatternConfig,
  
  // Selection types
  type SelectionAnchor,
  type SelectionRange,
  type TrackerSelection,
  emptySelection,
  
  // Cursor types
  type CursorPosition,
  type CursorConfig,
  
  // Clipboard types
  type TrackerClipboard,
  
  // Display types
  type DisplayConfig,
  defaultDisplayConfig,
  
  // Record types
  type RecordConfig,
  defaultRecordConfig,
  
  // State types
  type TrackerState,
  createInitialTrackerState,
} from './types';

// Effect commands
export {
  // Effect code constants
  FX,
  
  // Effect metadata
  EffectCategory,
  ParamFormat,
  type EffectMeta,
  EFFECT_META,
  
  // Effect helpers
  arpeggio,
  portaUp,
  portaDown,
  tonePorta,
  vibrato,
  tremolo,
  setPan,
  setVolume,
  volSlide,
  noteDelay,
  noteCut,
  retrigger,
  sampleOffset,
  setTempo,
  patternBreak,
  patternJump,
  noteProb,
  genTrigger,
  genSeed,
  cardTrigger,
  clipLaunch,
  eventEmit,
  phraseTrigger,
  
  // Parsing
  parseEffect,
  formatEffect,
  getEffectMeta,
  getEffectName,
  getEffectsByCategory,
} from './effects';

// Pattern store
export {
  PatternStore,
  getPatternStore,
  resetPatternStore,
} from './pattern-store';

// Effect processor
export {
  type ChannelEffectState,
  type GlobalEffectState,
  type PendingEvent,
  type ProcessResult,
  createChannelState,
  createGlobalState,
  createProcessResult,
  EffectProcessor,
  getEffectProcessor,
  resetEffectProcessor,
} from './effect-processor';

// Event sync (bidirectional)
export {
  type TrackerEventPayload,
  type TrackerSyncConfig,
  type ComputedTrackerView,
  TrackerEventSync,
  getTrackerEventSync,
  resetTrackerEventSync,
  enhanceEventForTracker,
} from './event-sync';

// Input handler
export {
  type Direction,
  type NoteKeyMapping,
  type InputHandlerConfig,
  DEFAULT_INPUT_CONFIG,
  PIANO_KEY_MAP,
  HEX_KEY_MAP,
  TrackerInputHandler,
  getTrackerInputHandler,
  resetTrackerInputHandler,
} from './input-handler';

// Renderer
export {
  formatNote,
  formatHex,
  formatInstrument,
  formatEffectCommand,
  formatRowNumber,
  type RenderedCell,
  type RenderedRow,
  type RenderedTrackCells,
  renderRow,
  renderPatternToANSI,
  type VNode,
  type VRenderConfig,
  DEFAULT_VRENDER_CONFIG,
  renderPatternToVDOM,
  type DirtyRegion,
  createDirtyRegion,
  markDirty,
  markFullDirty,
  clearDirty,
  isDirty,
  type AccessibleRow,
  type AccessibleTrack,
  generateAccessibleRow,
  NOTE_NAMES,
  ANSI,
  COLUMN_WIDTHS,
} from './renderer';

// Tracker Card UI Component
export {
  type TrackerViewTrack,
  type TrackerViewCell,
  type TrackerViewData,
  type TrackerCardOptions,
  TrackerCard,
  createTrackerCard,
  TRACKER_STYLES,
  ICONS,
} from './tracker-card';

// Phrase System
export {
  PhrasePlayMode,
  PhraseKeyMode,
  type PhraseTiming,
  type PhraseConfig,
  type Phrase,
  type PhrasePlaybackState,
  PhraseStore,
  createArpeggioPhrase,
  createScalePhrase,
  createRhythmPhrase,
  createEuclideanPhrase,
  getPhraseStore,
  resetPhraseStore,
} from './phrases';

// Generator Integration
export {
  type GeneratorEvent,
  type GeneratorContext,
  type GeneratorFunction,
  type GeneratorDefinition,
  GeneratorRegistry,
  type GeneratorResult,
  GeneratorExecutor,
  randomMelodyGenerator,
  euclideanRhythmGenerator,
  arpeggioGenerator,
  walkingBassGenerator,
  getGeneratorRegistry,
  getGeneratorExecutor,
  resetGenerators,
} from './generator-integration';

// Card Integration
export {
  TRACKER_CARD_META,
  type TrackerCardState,
  createTrackerCardState,
  TrackerCardImpl,
  createTrackerCardImpl,
  registerTrackerCard,
} from './tracker-card-integration';
