/**
 * @fileoverview Cards module barrel export.
 * 
 * @module @cardplay/core/cards
 */

export {
  // Port types (canonical — this is the core PortType, Change 274)
  type PortType,
  PortTypes,
  type PortTypeEntry,
  registerPortType,
  getPortTypeEntry,
  getAllPortTypeEntries,
  
  // Port
  type Port,
  createPort,
  
  // Parameters
  type ParamType,
  type CardParam,
  createParam,
  
  // Signature
  type CardSignature,
  createSignature,
  
  // Meta
  type CardCategory,
  type CoreCardCategory, // Change 261 alias
  type CardMeta,
  createCardMeta,
  
  // State
  type CardState,
  createCardState,
  updateCardState,
  
  // Context
  type Transport,
  type EngineRef,
  type CardContext,
  createCardContext,
  
  // Card
  type CardResult,
  type Card,
  type CoreCard, // Change 262 alias
  type CreateCardOptions,
  createCard,
  pureCard,
  statefulCard,
  asyncCard,
  
  // Composition
  cardCompose,
  cardParallel,
  cardBranch,
  cardLoop,
  
  // Wrappers
  cardMemo,
  cardProfile,
  cardValidate,
  
  // Serialization
  type CardJSON,
  cardToJSON,
} from './card';

// Registry exports
export {
  // Version
  type CardVersion,
  parseVersion,
  formatVersion,
  compareVersions,
  isVersionCompatible,
  
  // Registry
  type CardRegistryEntry,
  type CardQuery,
  type CardRegistry,
  getCardRegistry,
  resetCardRegistry,
  registerCard,
  getCard,
  findCards,
  listCardsByCategory,
  getCardDependencies,
  
  // Validation
  type SignatureValidation,
  validateCardSignature,
  
  // Migration
  type ParamMigration,
  migrateCardParams,
  
  // Compatibility
  arePortsCompatible,
  detectCardConflicts,
  
  // Lazy loading
  type CardLoader,
  type LazyCard,
  createLazyCard,
  loadLazyCard,
  
  // Analytics
  type CardUsageStats,
  getCardUsageStats,
} from './registry';

// Stack exports
export {
  // Types
  type StackMode,
  type StackEntry,
  type Stack,
  type SerialStack,
  type ParallelStack,
  type LayerStack,
  type TabStack,
  
  // Factory
  createStack,
  generateStackId,
  generateEntryId,
  
  // Validation
  type StackValidation,
  validateStack,
  inferStackPorts,
  
  // Operations
  stackInsertCard,
  stackRemoveCard,
  stackReorderCards,
  stackBypassCard,
  stackSoloCard,
  
  // Graph conversion
  type StackGraph,
  type StackGraphNode,
  type StackGraphEdge,
  stackToGraph,
  graphToStack,
  
  // Snapshot
  type StackSnapshot,
  stackSnapshot,
  stackRestore,
  
  // Diff
  type StackDiff,
  stackDiff,
  stackMerge,
  
  // Conversion
  stackToCard,
} from './stack';

// Graph exports
export {
  // Types
  type Position,
  type GraphNode,
  type GraphEdge,
  type Graph,
  type GraphMeta,
  type GraphValidation,
  type GraphError,
  type GraphSnapshot,
  type ExecutionPlan,
  type ExecutionStep,
  type GraphMinimap,
  type GraphInspector,
  type NodeInspection,
  type EdgeInspection,
  type GraphJSON,
  
  // ID generation
  generateGraphId,
  generateNodeId,
  generateEdgeId,
  
  // Factory
  createGraph,
  createGraphNode,
  createGraphEdge,
  
  // Node operations
  graphAddNode,
  graphRemoveNode,
  
  // Edge operations
  graphConnect,
  graphDisconnect,
  
  // Validation
  graphValidate,
  
  // Algorithms
  graphTopologicalSort,
  graphFindPath,
  graphCompile,
  
  // Snapshot
  graphSnapshot,
  graphRestore,
  
  // Serialization
  graphToJSON,
  graphFromJSON,
  
  // Layout
  graphAutoLayout,
  graphMinimap,
  graphInspector,
  
  // Optimization
  graphOptimize,
  
  // Conversion
  graphToCard,
} from './graph';

// Adapter exports
export {
  // Types
  type AdapterCategory,
  type Adapter,
  type AdapterRegistryEntry,
  type AdapterPath,
  type AdapterSuggestion,
  type AdapterRegistry,
  type CreateAdapterOptions,
  
  // Registry
  getAdapterRegistry,
  resetAdapterRegistry,
  
  // Factory
  createAdapter,
  registerAdapter,
  
  // Lookup
  findAdapter,
  findAdapterPath,
  adapterCost,
  
  // Stack helpers
  insertAdapter,
  autoInsertAdapters,
  suggestAdapters,
  
  // Data types
  type AdapterPattern,
  type MIDIMessage,
  type Gesture,
  type ControlValue,
  type Note,
  type Chord,
  type AdapterScore,
  
  // Built-in adapters
  PatternToEvents,
  EventsToAudio,
  AudioToEvents,
  MIDIToEvents,
  EventsToMIDI,
  GestureToEvents,
  ControlToEvents,
  NoteToChord,
  ChordToNotes,
  ScoreToPattern,
  PatternToScore,
  registerBuiltInAdapters,
} from './adapter';

// Protocol exports
export {
  // Types
  type Protocol,
  type ProtocolMethod,
  type ProtocolRegistryEntry,
  type ProtocolRegistry,
  type CreateProtocolOptions,
  type ProtocolVersionInfo,
  
  // Standard protocols
  type Schedulable,
  type Renderable,
  type Automatable,
  type Notatable,
  type Constrainable,
  type Transformable,
  type Serializable,
  type Diffable,
  type Patchable,
  type Contractable,
  type Contract,
  type Auditable,
  type AuditEntry,
  
  // Protocol instances
  SchedulableProtocol,
  RenderableProtocol,
  AutomatableProtocol,
  NotatableProtocol,
  ConstrainableProtocol,
  TransformableProtocol,
  SerializableProtocol,
  DiffableProtocol,
  PatchableProtocol,
  ContractableProtocol,
  AuditableProtocol,
  
  // Registry
  getProtocolRegistry,
  resetProtocolRegistry,
  
  // Factory
  createProtocol,
  
  // Utilities
  implementsProtocol,
  getProtocolMethods,
  protocolAdapter,
  composeProtocols,
  isProtocolVersionCompatible,
  generateProtocolDocs,
  registerBuiltInProtocols,
} from './protocol';

// Parameter System exports
export {
  // Curve functions
  type ParameterCurve,
  applyCurve,
  invertCurve,
  // Base
  type BaseParameter,
  // Float
  type FloatParameter,
  type FloatParameterOptions,
  createFloatParameter,
  setFloatValue,
  getFloatNormalized,
  setFloatNormalized,
  // Int
  type IntParameter,
  type IntParameterOptions,
  createIntParameter,
  setIntValue,
  getIntNormalized,
  setIntNormalized,
  // Enum
  type EnumParameter,
  type EnumParameterOptions,
  createEnumParameter,
  setEnumValue,
  getEnumByIndex,
  getEnumIndex,
  // String
  type StringParameter,
  type StringParameterOptions,
  createStringParameter,
  setStringValue,
  validateStringValue,
  // Bool
  type BoolParameter,
  type BoolParameterOptions,
  createBoolParameter,
  setBoolValue,
  toggleBool,
  // Array
  type ArrayParameter,
  type ArrayParameterOptions,
  createArrayParameter,
  addArrayElement,
  removeArrayElement,
  updateArrayElement,
  // Union
  type Parameter,
  type ParameterType,
  // Type guards
  isFloatParameter,
  isIntParameter,
  isEnumParameter,
  isStringParameter,
  isBoolParameter,
  isArrayParameter,
  // Registry
  type ParameterRegistry,
  createParameterRegistry,
  registerParameter,
  registerParameters,
  getParameter,
  getCardParameters,
  getGroupParameters,
  getParameterByCc,
  getAutomatableParameters,
  getModulatableParameters,
  // Utilities
  resetParameter,
  getNormalizedValue,
  setNormalizedValue,
  interpolateParameter,
  randomizeParameter,
  mutateParameter,
  cloneParameter,
  serializeParameter,
  extractParameterValues,
  applyParameterValues,
} from './parameters';

// Preset System exports
export {
  // Preset
  type Preset,
  type CreatePresetOptions,
  createPreset,
  createPresetFromParameters,
  updatePreset,
  derivePreset,
  // PresetBank
  type PresetBank,
  createPresetBank,
  addPreset,
  removePreset,
  loadPreset,
  getCurrentPreset,
  getEffectiveValue,
  setParameterValue,
  revertToPreset,
  diffFromPreset,
  saveAsPreset,
  applyPresetToParameters,
  // Operations
  getPresetsByCategory,
  getFactoryPresets,
  getUserPresets,
  searchPresets,
  getCategories,
  // Morphing
  createMorphedPreset,
  // Layers
  type PresetLayer,
  blendPresets,
  // Curried Presets
  applyCurriedPresetWithParams,
  stackOnCurriedPreset,
  CurryPatterns,
  curryPresetWithPattern,
  // Composite Presets
  type PresetSlot,
  type CompositePreset,
  createPresetSlot,
  extractSlotFromPreset,
  createCompositePreset,
  updateCompositeSlot,
  compositeToPreset,
  // Import/Export
  type PresetExport,
  type PresetValidationResult,
  exportPreset,
  exportPresetToJson,
  validatePresetExport,
  importPreset,
  importPresetFromJson,
  // Comparison
  comparePresets,
  presetSimilarity,
} from './presets';

// Modulation System exports
export {
  // Source types
  type ModulationSourceType,
  type LfoWaveform,
  type LfoSyncMode,
  type LfoTempoRate,
  // LFO
  type LfoSource,
  createLfoSource,
  calculateLfoValue,
  // Envelope
  type EnvelopeCurve,
  type EnvelopeSource,
  createEnvelopeSource,
  type EnvelopeStage,
  type EnvelopeState,
  createEnvelopeState,
  triggerEnvelope,
  releaseEnvelope,
  processEnvelope,
  // MIDI CC
  type MidiCcSource,
  createMidiCcSource,
  processMidiCc,
  // Expression
  type ExpressionSource,
  createExpressionSource,
  // Cross-card
  type CrossCardSource,
  createCrossCardSource,
  // Source union
  type ModulationSource,
  // Routing
  type ModulationRouting,
  createModulationRouting,
  setRoutingAmount,
  toggleRouting,
  // Matrix
  type ModulationMatrix,
  createModulationMatrix,
  addSource,
  removeSource,
  addRouting,
  removeRouting,
  getRoutingsForTarget,
  getRoutingsFromSource,
  // Processing
  type ModulationState,
  createModulationState,
  updateSourceValue,
  calculateModulatedValue,
  processModulation,
  // Presets
  LFO_PRESETS,
  ENVELOPE_PRESETS,
} from './modulation';

// Arranger System exports
export {
  // Visual
  ARRANGER_VISUALS,
  ARRANGER_UI_STYLES,
  
  // Song Parts / Scenes
  type SongPartType,
  type SongPart,
  type SongStructure,
  SONG_PART_THEMES,
  createSongPart,
  createPopSongStructure,
  createEDMSongStructure,
  createJazzAABASongStructure,
  
  // Chord Recognition
  type ChordQuality,
  type RecognizedChord,
  type ChordRecognizerConfig,
  DEFAULT_RECOGNIZER_CONFIG,
  recognizeChord,
  
  // Voice Types
  type VoiceType,
  type VoiceEvent,
  type VoiceConfig,
  
  // Patterns
  type PatternStep,
  type VoicePattern,
  type DrumStep,
  type DrumPattern,
  
  // Styles
  type StyleVariation,
  type SectionType,
  type StyleSection,
  type ArrangerStyle,
  
  // State
  type ArrangerState,
  createArrangerState,
  
  // Parameters
  createArrangerParameters,
  
  // Commands
  type ArrangerCommand,
  
  // Voice Allocation
  type VoiceLeadingState,
  allocateVoices,
  
  // Voice Leading Engine
  type VoiceLeadingConfig,
  DEFAULT_VOICE_LEADING_CONFIG,
  type FourPartVoicing,
  getChordTones,
  applyVoiceLeading,
  
  // Fill & Ending Generators
  type FillStyle,
  type FillConfig,
  generateFill,
  type EndingStyle,
  type EndingConfig,
  generateEnding,
  
  // Texture Generator
  type TextureType,
  type TextureConfig,
  DEFAULT_TEXTURE_CONFIG,
  applyTexture,
  
  // Drum Pattern Library Integration
  convertAudioDrumPattern,
  LIBRARY_DRUM_PATTERNS,
  getLibraryDrumPattern,
  getLibraryDrumPatternsByCategory,
  getLibraryDrumPatternsByTag,
  createVariationWithLibraryPattern,
  
  // Factory Styles
  POP_8BEAT_STYLE,
  JAZZ_SWING_STYLE,
  BOSSA_NOVA_STYLE,
  HOUSE_STYLE,
  ARRANGER_STYLES,
  getArrangerStyle,
  getStylesByCategory,
  searchStyles,
  
  // Card Meta
  ARRANGER_CARD_META,
  processArrangerCommand,
  
  // Arranger Card Definition
  ARRANGER_CARD_VISUALS,
  ARRANGER_CARD_BEHAVIOR,
  ARRANGER_UI_CONFIG,
  ARRANGER_PARAMETERS,
  ARRANGER_PRESETS,
  ARRANGER_CARD,
  
  // Scene View
  type SceneViewState,
  createSceneViewState,
  SCENE_VIEW_STYLES,
  type PartRenderData,
  generateSceneViewRenderData,
  type SceneViewCommand,
  processSceneViewCommand,
  
  // Integrated Arranger + Scene
  type ArrangerSceneState,
  createArrangerSceneState,
  type ArrangerSceneCommand,
  processArrangerSceneCommand,
  getCurrentPartInfo,
  renderMiniSceneView,
  renderAsciiTimeline,
  
  // EZ Keys-Inspired Features
  type SongPartPreset,
  type SongPartConfig,
  SONG_PART_CONFIGS,
  type EnergyLevelConfig,
  ENERGY_LEVELS,
  type VoicingStyleType,
  type VoicingStyleConfig,
  VOICING_STYLES,
  type BassLineStyle,
  type BassLineStyleConfig,
  BASS_LINE_STYLES,
  
  // Arranger Real-Time Controls
  type ArrangerControlType,
  type ArrangerControl,
  ARRANGER_CONTROLS,
  type ArrangerControlState,
  createArrangerControlState,
  type ArrangerControlCommand,
  processArrangerControlCommand,
  calculateTapTempo,
  
  // Instrument Switcher
  type InstrumentCategory,
  type InstrumentOption,
  INSTRUMENT_OPTIONS,
  getInstrumentOptions,
  searchInstruments,
} from './arranger';
// Freesound Search Card exports
export {
  // Types
  type SearchState,
  type FreesoundSearchParams,
  type FreesoundSearchState,
  type FreesoundSearchInput,
  type FreesoundSearchOutput,
  type FreesoundSearchResult,
  
  // Defaults
  DEFAULT_SEARCH_PARAMS,
  DEFAULT_SEARCH_STATE,
  
  // Card Signature
  FREESOUND_SEARCH_SIGNATURE,
  FREESOUND_SEARCH_INPUTS,
  FREESOUND_SEARCH_OUTPUTS,
  FREESOUND_SEARCH_PARAMS,
  
  // State Functions
  updateSearchParams,
  setSearchState,
  setProgress,
  setError,
  
  // Processing
  executeSearch,
  processFreesoundSearch,
  
  // Utilities
  getSuggestedInstruments,
  getInstrumentSearchTerms,
} from './freesound-search';

// Card Visuals exports
export {
  // Animation and Visuals
  type CardAnimation,
  type CardVisuals,
  CARD_EMOJI_MAP,
  CARD_CATEGORY_COLORS,
  getCardEmoji,
  createDefaultCardVisuals,
  
  // Badge System
  type CardBadgeType,
  type CardBadge,
  CARD_BADGES,
  createBadge,
  
  // Frame System
  type CardFrameVariant,
  type CardFrame,
  CARD_FRAMES,
  createFrame,
  
  // Glow Effects
  type CardGlowState,
  type CardGlowConfig,
  CARD_GLOW_STATES,
  getGlowCSS,
  generateGlowKeyframes,
  
  // Behavior
  type CardMode,
  type CpuIntensity,
  type ThreadSafety,
  type CardSideEffect,
  type CardLatency,
  type CardMemory,
  type CardBehavior,
  createDefaultLatency,
  createDefaultMemory,
  createEventCardBehavior,
  createAudioCardBehavior,
  createInstrumentBehavior,
  
  // UI Configuration
  type CardEditorType,
  type CardViewMode,
  type CardControlType,
  type ControlSize,
  type CardControlStyle,
  type CardContextMenuItem,
  type CardControl,
  type LayoutType,
  type CardControlLayout,
  type PanelPosition,
  type CardPanel,
  type CardTheme,
  type CardUIConfig,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  createKnobControl,
  createSliderControl,
  createToggleControl,
  createButtonControl,
  createDropdownControl,
  createPanel,
  createDefaultUIConfig,
  
  // CSS Generation
  generateCardCSS,
  renderMiniCard,
  renderAsciiCard,
  
  // Card Definition
  type CardDefinition,
  type VisualPortType,
  type PortDefinition,
  type ParameterDefinition,
  type PresetDefinition,
  buildCardDefinition,
  
  // User-Injectable Card System
  type UserCardTemplate,
  type UserParameterTemplate,
  type UserPresetTemplate,
  type CardValidationResult,
  validateUserCardTemplate,
  buildCardFromUserTemplate,
  cloneCardWithOverrides,
  
  // Curried Preset System
  type CurriedPreset,
  type PresetScene,
  curryPreset,
  composePresets,
  createCurriedPreset,
  applyCurriedPreset,
  morphPresets,
  randomizePreset,
  mutatePreset,
  createPresetScene,
  
  // SVG/Canvas Generation
  cardToSVG,
  createCardCanvasRenderer,
  CONNECTION_STYLES,
  generateConnectionCSS,
} from './card-visuals';

// Card Editor exports (Change 271)
export {
  type EditorCardDefinition,
  createDefaultCardDefinition,
} from '../user-cards/card-editor-panel';

// Generator Card UI exports
export {
  // Drum Machine
  DRUM_MACHINE_VISUALS,
  DRUM_MACHINE_PARAMETERS,
  DRUM_MACHINE_PRESETS,
  DRUM_MACHINE_CARD,
  
  // Synth
  SYNTH_VISUALS,
  SYNTH_PARAMETERS,
  SYNTH_PRESETS,
  SYNTH_CARD,
  
  // Piano
  PIANO_VISUALS,
  PIANO_PARAMETERS,
  PIANO_PRESETS,
  PIANO_CARD,
  
  // Bass
  BASS_VISUALS,
  BASS_PARAMETERS,
  BASS_PRESETS,
  BASS_CARD,
  
  // Strings
  STRINGS_VISUALS,
  STRINGS_PARAMETERS,
  STRINGS_PRESETS,
  STRINGS_CARD,
  
  // Organ
  ORGAN_VISUALS,
  ORGAN_PARAMETERS,
  ORGAN_PRESETS,
  ORGAN_CARD,
  
  // Sampler
  SAMPLER_VISUALS,
  SAMPLER_PARAMETERS,
  SAMPLER_PRESETS,
  SAMPLER_CARD,
  
  // Loop Player
  LOOP_PLAYER_VISUALS,
  LOOP_PLAYER_PARAMETERS,
  LOOP_PLAYER_PRESETS,
  LOOP_PLAYER_CARD,
  
  // Arpeggiator
  ARPEGGIATOR_VISUALS,
  ARPEGGIATOR_PARAMETERS,
  ARPEGGIATOR_PRESETS,
  ARPEGGIATOR_CARD,
  
  // Sequencer
  SEQUENCER_VISUALS,
  SEQUENCER_PARAMETERS,
  SEQUENCER_PRESETS,
  SEQUENCER_CARD,
  
  // Chord Progression
  CHORD_PROGRESSION_VISUALS,
  CHORD_PROGRESSION_PARAMETERS,
  CHORD_PROGRESSION_PRESETS,
  CHORD_PROGRESSION_CARD,
  
  // Registry
  GENERATOR_CARDS,
  getCardDefinition,
  getCardsByCategory,
  searchCardsByTag,
} from './generator-card-uis';

// Keyboard Instruments exports
export {
  // Piano
  type PianoType,
  type MicPositioning,
  type PianoState,
  PIANO_CARD_META as PIANO_CARD_DETAILED_META,
  PIANO_CARD_VISUALS as PIANO_CARD_DETAILED_VISUALS,
  PIANO_CARD_BEHAVIOR,
  PIANO_UI_CONFIG,
  PIANO_PARAMETERS as PIANO_CARD_DETAILED_PARAMETERS,
  PIANO_PRESETS as PIANO_CARD_DETAILED_PRESETS,
  createPianoCard,
  
  // Electric Piano
  type ElectricPianoType,
  type ElectricPianoState,
  ELECTRIC_PIANO_CARD_META,
  ELECTRIC_PIANO_CARD_VISUALS,
  ELECTRIC_PIANO_CARD_BEHAVIOR,
  ELECTRIC_PIANO_UI_CONFIG,
  ELECTRIC_PIANO_PARAMETERS,
  ELECTRIC_PIANO_PRESETS,
  createElectricPianoCard,
  
  // Mallet
  type MalletType,
  type DamperBehavior,
  type MalletState,
  MALLET_CARD_META,
  MALLET_CARD_VISUALS,
  MALLET_CARD_BEHAVIOR,
  MALLET_UI_CONFIG,
  MALLET_PARAMETERS,
  MALLET_PRESETS,
  createMalletCard,
} from './keyboard-instruments';

// Analysis functions export
export {
  // Types
  type AudioBufferLike,
  type PitchDetection,
  type ChordDetection,
  type BeatDetection,
  type TempoDetection,
  type KeyDetection,
  type LoudnessMeasurement,
  type SpectrumAnalysis,
  type AudioEnvelopeFollowerState,
  type TransientDetection,
  type SilenceRegion,
  
  // Analysis functions
  detectPitchYIN,
  detectChord,
  detectBeats,
  detectTempo,
  detectKey,
  measureLoudness,
  analyzeSpectrum,
  followEnvelope,
  detectTransients,
  detectSilence,
} from './analysis';

// Audio transform cards export
export {
  // Types
  type AudioBuffer,
  type MonoMode,
  type FadeCurve,
  type InvertParams,
  type MonoParams,
  type StereoParams,
  type WidthParams,
  type DelayCompParams,
  type TimeStretchParams,
  type TimeStretchAlgorithm,
  type PitchShiftParams,
  type NormalizeParams,
  type TrimParams,
  type FadeParams,
  
  // Functions
  createAudioBuffer,
  cloneAudioBuffer,
  applyGain,
  applyInvert,
  applyMono,
  applyMonoToStereo,
  applyWidth,
  applyDelayComp,
  applyTimeStretch,
  applyPitchShift,
  applyNormalize,
  findPeakLevel,
  findFirstSound,
  findLastSound,
  applyTrim,
  calculateFadeGain,
  applyFade,
  
  // Cards
  INVERT_CARD,
  MONO_CARD,
  STEREO_CARD,
  WIDTH_CARD,
  DELAY_COMP_CARD,
  TIME_STRETCH_CARD,
  PITCH_SHIFT_CARD,
  NORMALIZE_CARD,
  TRIM_CARD,
  FADE_CARD,
  AUDIO_TRANSFORM_CARDS,
  
  // Defaults
  DEFAULT_INVERT_PARAMS,
  DEFAULT_MONO_PARAMS,
  DEFAULT_STEREO_PARAMS,
  DEFAULT_WIDTH_PARAMS,
  DEFAULT_DELAY_COMP_PARAMS,
  DEFAULT_TIME_STRETCH_PARAMS,
  DEFAULT_PITCH_SHIFT_PARAMS,
  DEFAULT_NORMALIZE_PARAMS,
  DEFAULT_TRIM_PARAMS,
  DEFAULT_FADE_PARAMS,
} from './audio-transforms';

// Recording Manager exports
export {
  // Types
  type RecordingMode,
  type RecordedEvent,
  type RecordingBuffer,
  type RecordingState,
  type RoutedOutput,
  type RecordingSupport,
  
  // Buffer Operations
  createRecordingBuffer,
  addEventToBuffer,
  stopRecording,
  bufferToStream,
  
  // State Management
  createRecordingState,
  startRecordingBuffer,
  stopRecordingBuffer,
  recordEvent,
  updateRecordingState,
  getBuffer,
  removeBuffer,
  
  // Mode Detection
  shouldCaptureEvents,
  shouldOutputRealtime,
  getEffectiveMode,
  
  // Output Routing
  routeOutput,
  
  // Validation
  checkRecordingSupport,
} from './recording-manager';

// ScoreNotation exports
export {
  // Types
  type ScoreNoteInput,
  type ArrangerSectionInput,
  type ChordSymbolInput,
  type ScoreDisplayMode,
  type StaffConfiguration,
  type EngravingOptions,
  type PageLayoutOptions,
  type NotationEditOutput,
  type ExtractedPhraseOutput,
  type ScoreNotationState,
  type InternalNotationEvent,
  type InternalNotationMeasure,
  
  // Class
  ScoreNotationCard,
  
  // Factory functions
  createScoreNotationCard,
  createLeadSheetCard,
  createPianoScoreCard,
  
  // Conversion helpers
  eventToScoreNote,
  scoreNoteToEvent,
  songPartToSectionInput,
} from './score-notation';

// ============================================================================
// GENERATOR NOTATION BRIDGE EXPORTS (Phase 1: Integration)
// ============================================================================

export {
  // Types
  type GeneratorCardType,
  type GeneratedNote,
  type MultiVoiceOutput,
  type GeneratorRegistration,
  type GeneratorNotationBridgeState,
  type GeneratorNotationBridgeCallbacks,
  type GeneratorNotationBridgeConfig,
  
  // Constants
  DEFAULT_GENERATOR_BRIDGE_CONFIG,
  DEFAULT_GENERATOR_THEMES,
  
  // Interface
  type GeneratorNotationBridge,
  
  // Factory
  createGeneratorNotationBridge,
  
  // Singletons
  getGeneratorNotationBridge,
  resetGeneratorNotationBridge,
  
  // Helpers
  createGeneratedNote,
  melodyNotesToGeneratedNotes,
  arrangerVoiceToGeneratedNotes,
} from './generator-notation-bridge';

// ============================================================================
// PHRASE ADAPTER EXPORTS (Phase 3: Smart Phrase Adaptation)
// ============================================================================

export {
  // Types
  type AdaptationMode,
  type AdaptationOptions,
  type ChordAnalysis,
  type NoteAnalysis,
  type PhraseAdapterService,
  
  // Constants
  DEFAULT_ADAPTATION_OPTIONS,
  
  // Chord Analysis
  parseChordRoot,
  parseChordType,
  analyzeChord,
  analyzeNote,
  
	  // Transposition Helpers
	  getTranspositionAmount,
	  transposePitch as transposePhrasePitch,
	  constrainToOctaveRange,
  
  // Adaptation Algorithms
  adaptByTransposition,
  adaptByChordTone,
  adaptByScaleDegree,
  adaptByVoiceLeading,
  adaptByRhythmOnly,
  
  // Main Adapter
  adaptPhrase,
  
  // Service Factory
  createPhraseAdapterService,
  getPhraseAdapterService,
  resetPhraseAdapterService,
  
  // Batch Operations
  adaptPhrasesToProgression,
  generatePhraseVariation,
} from './phrase-adapter';
