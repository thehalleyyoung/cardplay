/**
 * @fileoverview Audio engine barrel export.
 * 
 * This module exports the complete WebAudio engine infrastructure including:
 * - Audio context management (singleton, pooling, device selection)
 * - AudioWorklet infrastructure (ring buffers, message protocol, processors)
 * - Sample playback engine (voices, caching, envelopes, filters)
 */

// ============================================================================
// CONTEXT EXPORTS
// ============================================================================

export {
  // Types
  type AudioEngineState,
  type AudioDevice,
  type AudioMetrics,
  type AudioEngineConfig,
  type AudioEngineEventType,
  type AudioEngineEvent,
  type AudioEngineEventListener,
  type AudioEngineContext,
  type AudioContextPool,
  
  // Context Management
  getAudioEngine,
  
  // Pool and Utilities
  createContextPool,
  negotiateSampleRate,
  detectGlitchRisk,
  getOptimalBufferSize,
} from './context';

// ============================================================================
// AUDIO ENGINE CORE EXPORTS (Phase 33)
// ============================================================================

export {
  // Types
  type AudioEngineConfig as AudioEngineCoreConfig,
  type AudioEvent,
  type AudioGraphNode,
  type CompiledGraph,
  type BufferStats,
  
  // Lock-free Ring Buffer
  LockFreeRingBuffer,
  
  // Priority Event Queue
  PriorityEventQueue,
  
  // Adaptive Buffer Controller
  AdaptiveBufferController,
  
  // Sample-Accurate Scheduler
  SampleAccurateScheduler,
  
  // Audio Graph Compiler
  AudioGraphCompiler,
  
  // SIMD Utilities
  simd,
  
  // Main Engine
  AudioEngine,
  
  // Factory Functions
  createAudioEngine,
  createEventRingBuffer,
  createEventQueue,
  createScheduler,
  createBufferController,
  createGraphCompiler,
} from './audio-engine';

// ============================================================================
// AUDIO OPTIMIZATION EXPORTS (Phase 33.1)
// ============================================================================

export {
  // Types
  type OptimizationConfig,
  type PooledBuffer,
  type GraphUpdateBatch,
  type CompilationCache,
  type AudioGraphOperation,
  type ZeroCopyTransfer,
  type CpuSample,
  type PerformanceWarning,
  type GlitchDetection,
  type DegradationLevel,
  type DegradationState,
  
  // Defaults
  DEFAULT_OPTIMIZATION_CONFIG,
  
  // Classes
  AudioBufferPool,
  LazyGraphUpdater,
  IncrementalGraphCompiler,
  CpuMonitor,
  PerformanceWarningManager,
  GlitchDetector,
  GracefulDegradation,
  AudioContextResume,
  AudioOptimizationManager,
} from './audio-optimization';

// ============================================================================
// WORKLET EXPORTS
// ============================================================================

export {
  // Message Types
  type WorkletMessageType,
  type WorkletMessage,
  type ParamMessage,
  type StateMessage,
  type EventMessage,
  type MetricsMessage,
  type ProcessorOptions,
  
  // Message Creators
  createWorkletMessage,
  createParamMessage,
  createStateMessage,
  createEventMessage,
  createMetricsMessage,
  
  // Ring Buffers
  RingBuffer,
  SharedRingBuffer,
  
  // Processor
  generateBaseProcessorScript,
  
  // Worklet Loader
  registerWorkletModule,
  getWorkletModule,
  
  // Node Wrapper
  type CardplayNodeOptions,
  CardplayWorkletNode,
  
  // Timing
  type WorkletTiming,
  createWorkletTiming,
  timeToSamples,
  samplesToTime,
  isTimingAccurate,
  
  // Profiler
  type ProfileEntry,
  WorkletProfiler,
  
  // Error Handling
  type WorkletError,
  withErrorBoundary,
  setWorkletDebug,
  workletDebug,
} from './worklet';

// ============================================================================
// SAMPLE PLAYBACK EXPORTS
// ============================================================================

export {
  // Voice Types
  type VoiceState,
  type PlaybackMode,
  type LoopMode,
  type StealingMode,
  
  // Sample Types
  type SampleFormat,
  type LoopPoint,
  type SampleMeta,
  type Sample,
  
  // Instrument Types
  type VelocityLayer,
  type KeyZone,
  type SampleInstrument,
  type VoiceParams,
  type ActiveVoice,
  type VoiceEvent,
  
  // Cache
  type CacheState,
  type CacheEntry,
  SampleCache,
  
  // Voice Pool
  VoicePool,
  
  // Envelope
  type EnvelopeParams,
  type EnvelopeStage,
  EnvelopeGenerator,
  DEFAULT_ENVELOPE,
  
  // Filter
  type FilterType,
  type FilterCoeffs,
  calculateFilterCoeffs,
  BiquadFilter,
  
  // Playback
  type PlaybackState,
  calculatePitchRatio,
  interpolateSample,
  interpolateSampleCubic,
  applyLoopCrossfade,
  
  // Instrument
  findSampleForNote,
  createSampleInstrument,
  
  // Player State
  type SamplePlayerConfig,
  type SamplePlayerMetrics,
  type SamplePlayerState,
  DEFAULT_SAMPLE_PLAYER_CONFIG,
  createSamplePlayerState,
  
  // Processor
  generateSamplePlayerProcessorScript,
  
  // Format Conversion
  resampleBuffer,
  stereoToMono,
  monoToStereo,
  normalizeBuffer,
  reverseBuffer,
} from './sample';

// ============================================================================
// SYNTHESIZER EXPORTS
// ============================================================================

export {
  // Oscillator Types
  type OscillatorWaveform,
  type OscillatorParams,
  DEFAULT_OSCILLATOR,
  
  // Wavetable
  type Wavetable,
  createWavetable,
  generateBasicWavetable,
  
  // Oscillator
  Oscillator,
  
  // LFO
  type LFOWaveform as SynthLFOWaveform,
  type LFOParams as SynthLFOParams,
  DEFAULT_LFO,
  LFO,
  
  // FM Synthesis
  type FMOperatorParams,
  type FMConnection,
  type FMSynthParams,
  FMOperator,
  FMVoice,
  
  // Synth Filter
  type SynthFilterType,
  type SynthFilterMode,
  type SynthFilterParams,
  DEFAULT_FILTER,
  
  // Synth Voice
  type SynthVoiceConfig,
  type SynthVoiceState,
  DEFAULT_SYNTH_VOICE,
  
  // Effects
  type DelayParams,
  type ChorusParams,
  type ReverbParams,
  type CompressorParams,
  type EQBandParams,
  type EQParams,
  DEFAULT_DELAY,
  DEFAULT_CHORUS,
  DEFAULT_REVERB,
  DEFAULT_COMPRESSOR,
  DEFAULT_EQ,
  
  // Effect Classes
  DelayLine,
  Chorus,
  CombFilter,
  AllpassFilter,
  Reverb,
  Compressor,
  
  // Processor
  generateSynthProcessorScript,
} from './synth';

// ============================================================================
// SCHEDULER EXPORTS
// ============================================================================

export {
  // Types
  type TimeSignature,
  type TransportState as SchedulerTransportState,
  type TransportPosition,
  type SchedulerConfig,
  type ScheduledEvent,
  type TempoPoint,
  type SwingSettings,
  type HumanizationSettings,
  type GrooveEntry,
  type GrooveTemplate,
  type LoopRegion,
  type Marker,
  type TransportCallbacks,
  type TransportSnapshot,
  type MetronomeSettings,
  type MetronomeClick,
  type PrerollSettings,
  
  // Defaults
  DEFAULT_TIME_SIGNATURE,
  DEFAULT_SCHEDULER_CONFIG,
  DEFAULT_METRONOME,
  DEFAULT_PREROLL,
  
  // Timing Functions
  ticksToSamples,
  samplesToTicks,
  ticksToSeconds,
  secondsToTicks,
  positionToTicks,
  ticksToPosition,
  quantizeTicks,
  getTicksPerNote,
  
  // Swing/Humanization
  applySwing,
  applyHumanization,
  applyGroove,
  
  // Tempo Automation
  getTempoAtTick,
  calculateTimeWithTempoAutomation,
  
  // Classes
  ScheduleQueue,
  AudioScheduler,
  
  // Utilities
  createTransportPosition,
  createMetronomeClicks,
  calculatePrerollStart,
} from './scheduler';

// ============================================================================
// MIXER EXPORTS
// ============================================================================

export {
  // Types
  type ChannelType,
  type PanLaw,
  type SendType,
  type MeterType as MixerMeterType,
  type SoloMode,
  
  // Interfaces
  type ChannelParams,
  type ChannelSend,
  type MeterReading as MixerMeterReading,
  type StereoMeter,
  type MixerConfig,
  type MixerState,
  type MixerNode,
  
  // Defaults
  DEFAULT_CHANNEL,
  DEFAULT_MIXER_CONFIG,
  
  // State Factory
  createMixerState,
  
  // Pan & Gain Functions
  calculatePanGains,
  applyStereoWidth,
  dbToLinear,
  linearToDb,
  calculateChannelGain,
  calculateSendLevel,
  
  // Metering Classes
  PeakDetector,
  RMSCalculator,
  CorrelationMeter,
  StereoMeterProcessor,
  
  // Channel Processing
  ChannelStrip,
  
  // Routing Functions
  buildMixerGraph,
  sortChannelsForProcessing,
  validateMixerRouting,
  
  // Mixer Processor
  MixerProcessor,
} from './mixer';

// ============================================================================
// FREESOUND API EXPORTS
// ============================================================================

export {
  // Constants
  FREESOUND_API_TOKEN,
  INSTRUMENT_SEARCH_TERMS,
  
  // Types
  type FreesoundLicense,
  type FreesoundPreviews,
  type FreesoundAnalysis,
  type FreesoundSample,
  type FreesoundSearchResponse,
  type FreesoundPack,
  type FreesoundSearchFilters,
  type SamplePack,
  type OrganizedSample,
  type LoadedSample,
  
  // API Functions
  searchFreesound,
  getSample,
  getSampleAnalysis,
  searchPacks,
  getPackSamples,
  searchInstrumentSamples,
  
  // Pitch Detection from Filename
  parseNoteName,
  midiToNoteName,
  detectNoteFromFilename,
  detectVelocityFromFilename,
  detectRoundRobinFromFilename,
  
  // Sample Organization
  organizeSamples,
  findBestSampleForNote,
  generateKeyboardMapping,
  
  // Audio Loading
  downloadSamplePreview,
  downloadSamplePack,
  
  // Sampler Generation
  generateSamplerZones,
  buildInstrumentFromFreesound,
} from './freesound';

// ============================================================================
// PITCH DETECTION EXPORTS
// ============================================================================

export {
  // Constants
  A4_FREQUENCY,
  A4_MIDI,
  NOTE_NAMES,
  MIN_FREQUENCY,
  MAX_FREQUENCY,
  YIN_THRESHOLD,
  
  // Types
  type PitchResult,
  type PitchDetectionOptions,
  type MultiPitchResult,
  
  // Conversion Functions
  frequencyToMidi,
  midiToFrequency,
  midiToNoteName as pitchMidiToNoteName,
  calculateCents,
  calculateRms,
  
  // Detection Functions
  detectPitch,
  detectPitchFromBuffer,
  detectPitchRobust,
  detectMultiplePitches,
  detectPitchBatch,
  
  // Low-level Algorithms
  yin,
  autocorrelation,
  applyHannWindow,
  downsample,
} from './pitch-detect';

// ============================================================================
// SAMPLE AUTO-MAPPER EXPORTS
// ============================================================================

export {
  // Constants
  MAX_PITCH_SHIFT_UP,
  MAX_PITCH_SHIFT_DOWN,
  PIANO_RANGE,
  VELOCITY_LAYERS_8,
  VELOCITY_LAYERS_4,
  
  // Types
  type AnalyzedSample,
  type SampleGroup,
  type MappingOptions,
  type MappingResult,
  type MappingStats,
  type VelocityLayerConfig,
  
  // Analysis Functions
  analyzeSample,
  analyzeSamples,
  groupSamplesByPitch,
  
  // Zone Creation
  createSampleData,
  createZone,
  findBestSampleForNote as mapperFindBestSampleForNote,
  
  // Auto-mapping
  autoMapSamples,
  
  // Preset Generation
  createSamplerPreset,
  CATEGORY_ENVELOPES,
  
  // High-level Builder
  buildInstrumentFromBuffers,
  
  // Filename Parser
  standardFilenameParser,
} from './sample-mapper';

// ============================================================================
// SAMPLE EDITOR EXPORTS
// ============================================================================

export {
  // Constants
  MIN_LOOP_LENGTH,
  ZERO_CROSSING_THRESHOLD,
  SILENCE_THRESHOLD,
  ONSET_THRESHOLD,
  
  // Types
  type WaveformOverview,
  type LoopSuggestion,
  type TransientInfo,
  type SliceRegion,
  type SampleStats,
  type FadeCurve,
  type NormalizeMode,
  
  // Waveform Analysis
  generateWaveformOverview,
  calculateSampleStats,
  
  // Zero Crossing Detection
  findZeroCrossings,
  findNearestZeroCrossing,
  
  // Loop Detection
  findLoopPoints,
  calculateLoopCrossfade,
  
  // Transient Detection
  detectTransients,
  createSlicesFromTransients,
  
  // Sample Operations
  normalizeSample,
  removeDcOffset,
  applyFade,
  reverseSample,
  trimSilence,
  cropSample,
  applyGain,
  
  // Pitch/Time Manipulation
  pitchShiftByResampling,
  timeStretchByResampling,
} from './sample-editor';

// ============================================================================
// SAMPLER CORE EXPORTS
// ============================================================================

export {
  // Constants
  GM_DRUM_MAP,
  EXTENDED_PERCUSSION_MAP,
  FULL_DRUM_MAP,
  DRUM_PATTERNS,
  DEFAULT_TEMPO,
  TEMPO_CONFIDENCE_THRESHOLD,
  
  // Layer Selection Types
  type LayerSelectionMode,
  type RandomLayerConfig,
  type SequenceLayerConfig,
  type RoundRobinLayerConfig,
  type LayerConfig,
  
  // Crossfade Types
  type CrossfadeCurve,
  type VelocityCrossfade,
  type KeyCrossfade,
  
  // Trigger Types
  type ZoneTriggerMode,
  type ExtendedSampleZone,
  
  // Tempo Types
  type TempoDetectionResult,
  
  // Voice Types
  type VoiceState as SamplerVoiceState,
  type VoicePriority,
  type GlideCurve,
  type UnisonConfig,
  type GlideConfig,
  type ExtendedSamplerVoice,
  
  // Layer Selection Functions
  selectRandomLayer,
  selectSequenceLayer,
  selectRoundRobinLayer,
  
  // Crossfade Functions
  calculateCrossfadeGain,
  getVelocityCrossfadePosition,
  getKeyCrossfadePosition,
  
  // Tempo Detection
  detectTempo,
  
  // Drum Kit Functions
  detectDrumType,
  autoMapDrumKit,
  createDrumKitZones,
  
  // Voice Management
  createVoice as createSamplerVoice,
  createUnisonVoices,
  findVoicesToSteal,
  calculateGlidePitch,
  
  // Factory Functions
  createDefaultLayerConfig,
  createDefaultUnisonConfig,
  createDefaultGlideConfig,
  createDefaultVelocityCrossfade,
  createDefaultKeyCrossfade,
} from './sampler-core';

// ============================================================================
// SAMPLER MODULATION EXPORTS
// ============================================================================

export {
  // Constants
  MAX_MOD_SLOTS as SM_MAX_MOD_SLOTS,
  MAX_MACROS as SM_MAX_MACROS,
  MAX_MACRO_TARGETS as SM_MAX_MACRO_TARGETS,
  LFO_MIN_RATE,
  LFO_MAX_RATE,
  ENV_MIN_TIME,
  ENV_MAX_TIME,
  
  // Envelope Types
  type EnvelopeCurve,
  type AHDSREnvelope,
  type EnvelopeState,
  
  // LFO Types
  type LFOWaveform as SamplerLFOWaveform,
  type LFOSyncDivision,
  type LFOParams as SamplerLFOParams,
  type LFOState,
  
  // Modulation Types
  type ModSource,
  type ModDestination,
  type ModSlot,
  type MacroTarget as SamplerMacroTarget,
  type MacroConfig,
  
  // MPE Types
  type MPEZone,
  type MPEVoiceState,
  
  // Envelope Functions
  createDefaultEnvelope,
  createEnvelopeState,
  applyCurve,
  processEnvelope,
  
  // LFO Functions
  createDefaultLFO,
  createLFOState,
  syncDivisionToMultiplier,
  getLFOValue,
  processLFO,
  
  // Modulation Matrix Functions
  createModSlot,
  getModSourceValue,
  calculateModulation,
  
  // Macro Functions
  createMacroConfig,
  addMacroTarget,
  calculateMacroValue,
  
  // MPE Functions
  createMPEZone,
  createMPEVoiceState,
  processMPEPitchBend,
  isInMPEZone,
  
  // Utility Functions
  ccToNormalized,
  normalizedToCC,
  pitchBendToNormalized,
  lerp,
  expLerp,
} from './sampler-modulation';

// ============================================================================
// DRUM PATTERNS EXPORTS
// ============================================================================

export {
  // Constants
  DRUM,
  VEL,
  SWING,
  PATTERN_LENGTH,
  
  // Types
  type DrumHit,
  type GrooveSettings,
  type DrumPattern,
  
  // All patterns
  ALL_PATTERNS,
  
  // Rock patterns
  ROCK_BASIC,
  ROCK_DRIVING,
  ROCK_HALFTIME,
  
  // Funk patterns
  FUNK_BASIC,
  FUNK_JAMES_BROWN,
  
  // Jazz patterns
  JAZZ_SWING,
  JAZZ_BOSSA,
  
  // Latin patterns
  LATIN_SONGO,
  LATIN_TUMBAO,
  
  // Electronic patterns
  ELECTRONIC_FOUR_FLOOR,
  ELECTRONIC_BREAKBEAT,
  ELECTRONIC_TRAP,
  
  // World patterns
  WORLD_AFROBEAT,
  WORLD_REGGAE,
  WORLD_TABLA_TEENTAL,
  
  // Fills
  FILL_BASIC_TOM,
  FILL_SNARE_ROLL,
  
  // Functions
  parseBeats,
  hitsOnBeats,
  applySwing as applySwingToPattern,
  generateNotation,
  getPatternsByCategory,
  getPatternsByTag,
  getPatternById,
  getAllCategories,
  getAllTags,
} from './drum-patterns';

// ============================================================================
// DRUM PATTERN PLAYER EXPORTS
// ============================================================================

export {
  // Types
  type TransportState,
  type ScheduledNote,
  type PatternPlaybackOptions,
  type DrumClip,
  type VoiceTriggerCallback,
  type PatternPlayerState,
  type PatternPlayerConfig,
  type SamplerPatternIntegration,
  
  // Class
  DrumPatternPlayer,
  
  // Clip creation functions
  createClipFromPattern,
  createClipFromPatterns,
  createArrangementClip,
  
  // Utility functions
  beatsToSeconds,
  secondsToBeats,
  humanizeNote,
  applyFeel,
  applyGroove as applyGrooveToPattern,
  mergeGroove,
  
  // Sampler integration
  createSamplerTrigger,
  quickPlayPattern,
} from './drum-pattern-player';

// ============================================================================
// WAVETABLE ENGINE EXPORTS (Phase 39)
// ============================================================================

export {
  // Constants
  DEFAULT_FRAME_SIZE as WT_DEFAULT_FRAME_SIZE,
  MIN_FRAME_SIZE as WT_MIN_FRAME_SIZE,
  MAX_FRAME_SIZE as WT_MAX_FRAME_SIZE,
  MAX_FRAMES as WT_MAX_FRAMES,
  MIP_LEVELS as WT_MIP_LEVELS,
  
  // Types
  type Wavetable as WavetableSynth,
  type WavetableFrame,
  type WavetableSlot,
  type MipMappedWavetable,
  type InterpolationMode,
  type FrameInterpolation,
  type WavetableOscillatorState,
  type WavetableOscillatorParams,
  type WavetableModulation,
  
  // Defaults
  DEFAULT_OSCILLATOR_PARAMS as WT_DEFAULT_OSCILLATOR_PARAMS,
  DEFAULT_MODULATION as WT_DEFAULT_MODULATION,
  
  // Waveform generation
  generateBasicWaveform,
  generateFromHarmonics,
  generateMorphTable,
  generatePWMTable,
  generateSupersawTable,
  generateFormantTable,
  
  // Interpolation
  interpolateSample as wtInterpolateSample,
  interpolateFrame,
  
  // MIP-mapping
  generateMipMaps,
  generateWavetableMipMaps,
  selectMipLevel,
  readMipMappedSample,
  
  // Oscillator
  createOscillatorState as createWtOscillatorState,
  processWavetableOscillator,
  processWavetableBlock,
  
  // Modulation
  applyFM,
  applyRM,
  applyAM,
  applySync,
  
  // Utilities
  createEmptyWavetable,
  createSingleFrameWavetable,
  normalizeWavetable,
  resampleWavetable,
  analyzeHarmonics,
  getWavetableInfo,
  createFactoryWavetables,
} from './wavetable-core';

export {
  // Constants
  SURGE_WT_MAGIC,
  SERUM_FRAME_SIZE,
  COMMON_CYCLE_SIZES,
  MAX_FILE_SIZE as WT_MAX_FILE_SIZE,
  
  // Types
  type WavetableImportResult,
  type WAVHeader,
  type SurgeWTHeader,
  type WavetableImportOptions,
  type HarmonicSpec,
  
  // Parsing
  parseWAVHeader,
  extractWAVSamples,
  parseSurgeWTHeader,
  
  // Import functions
  importSurgeWT,
  detectFrameCount,
  importWAV,
  importSingleCycle,
  importFromAudioBuffer,
  importFromHarmonics,
  importEvolvingHarmonics,
  autoImport as autoImportWavetable,
} from './wavetable-import';

export {
  // Constants
  SURGE_WAVETABLE_PATHS,
  SURGE_PATCH_PATHS,
  FACTORY_WAVETABLE_CATEGORIES,
  THIRD_PARTY_CONTRIBUTORS,
  SURGE_OSC_TYPES,
  SURGE_FILTER_TYPES,
  SURGE_FX_TYPES,
  WT_OSC_PARAMS,
  KNOWN_FACTORY_WAVETABLES,
  
  // Types
  type WavetableMetadata,
  type OscillatorSettings as SurgeOscillatorSettings,
  type FilterSettings as SurgeFilterSettings,
  type EnvelopeSettings as SurgeEnvelopeSettings,
  type LFOSettings as SurgeLFOSettings,
  type FXSettings as SurgeFXSettings,
  type SceneSettings as SurgeSceneSettings,
  type SurgePreset,
  type WavetableCatalogEntry,
  type SurgeAssetCatalog,
  type DownloadProgressCallback,
  
  // Parsing functions
  parseFXPHeader,
  extractSurgeXML,
  parseSurgePresetXML,
  parseWavetableMetadata,
  
  // GitHub API functions
  fetchGitHubDirectory,
  listAllFiles,
  scanWavetables,
  scanPresets,
  
  // Download functions
  downloadWavetable,
  downloadWavetables,
  
  // Catalog functions
  buildSurgeAssetCatalog,
} from './surge-assets';

// ============================================================================
// SYNTH ASSET DATABASE EXPORTS
// ============================================================================

export {
  // Types
  type WavetableRecord,
  type ParsedWavetable,
  type OscillatorSettings,
  type FilterSettings,
  type EnvelopeSettings,
  type LFOSettings,
  type ModulationSettings,
  type EffectSettings,
  type PresetRecord,
  type ParsedPreset,
  type DatabaseStats,
  
  // Database class
  SynthAssetDatabase,
  
  // Helper functions
  decodeWavetableData,
  extractWavetableFrame,
  interpolateWavetableFrame,
  parseWavetableRecord,
  parsePresetRecord,
  
  // Preset analysis utilities
  getPresetWavetables,
  getPresetModSources,
  getPresetModDestinations,
  getPresetEnabledEffects,
  presetUsesOscType,
  presetUsesFilterType,
  
  // Factory function
  createSynthAssetDatabase,
} from './synth-asset-db';

// ============================================================================
// UNIFIED PRESET FORMAT EXPORTS
// ============================================================================

export {
  // Types
  type InstrumentCategory,
  type InstrumentSubCategory,
  type SoundCharacter,
  type UnifiedOscillator,
  type UnifiedFilter,
  type UnifiedEnvelope,
  type UnifiedLFO,
  type ModulationRoute as UnifiedModulationRoute,
  type UnifiedEffect,
  type UnifiedPreset,
  
  // Factory functions (aliased to avoid conflicts with synthesizer.ts)
  createDefaultOscillator as createPresetOscillator,
  createDefaultFilter as createPresetFilter,
  createDefaultEnvelope as createPresetEnvelope,
  createDefaultLFO as createPresetLFO,
  createInitPreset,
} from './unified-preset';

// ============================================================================
// PRESET CONVERTER EXPORTS
// ============================================================================

export {
  // Conversion functions
  convertSurgePreset,
  convertVitalPreset,
  convertPreset,
  
  // Classification functions
  detectCategory,
  detectSubCategory,
  detectCharacters,
  
  // Grouping utilities
  groupPresetsByCategory,
  groupPresetsBySubCategory,
  filterPresetsByCharacter,
} from './preset-converter';

// ============================================================================
// INSTRUMENT DATABASE EXPORTS
// ============================================================================

export {
  // Types
  type CategoryInfo,
  type SubcategoryInfo,
  type WavetableRecord as OrganizedWavetableRecord,
  type PresetRecord as OrganizedPresetRecord,
  
  // Database class
  InstrumentDatabase,
  
  // Singleton access
  getInstrumentDatabase,
  closeInstrumentDatabase,
} from './instrument-database';

// ============================================================================
// WAVETABLE SYNTHESIZER EXPORTS
// ============================================================================

export {
  // Main instrument
  WavetableInstrument,
  
  // Voice
  SynthVoice,
  
  // Components
  WavetableOscillator,
  SVFilter,
  ADSREnvelope,
  LFOProcessor,
  VoiceManager,
} from './wavetable-synth';

// ============================================================================
// WAVETABLE MODULATION EXPORTS (Phase 39)
// ============================================================================

export {
  // Constants
  MAX_LFOS,
  MAX_MSEGS,
  MAX_MSEG_NODES,
  MAX_MOD_SLOTS,
  MAX_MACROS,
  MAX_MACRO_TARGETS,
  MAX_SEQ_STEPS,
  
  // LFO Types
  type LfoWaveform,
  type LfoTriggerMode,
  type TempoSyncDivision,
  type LfoConfig,
  type LfoState,
  
  // MSEG Types
  type MsegCurveType,
  type MsegLoopMode,
  type MsegNode,
  type MsegConfig,
  type MsegState,
  
  // Step Sequencer Types
  type StepSeqStep,
  type StepSeqConfig,
  type StepSeqState,
  
  // Modulation Matrix Types
  type ModulationSource as WtModulationSource,
  type ModulationDestination as WtModulationDestination,
  type ModulationSlot,
  type MacroTarget,
  type MacroConfig as WtMacroConfig,
  
  // Defaults
  DEFAULT_LFO_CONFIG,
  DEFAULT_MSEG_CONFIG,
  DEFAULT_STEP_SEQ_CONFIG,
  DEFAULT_MACRO_CONFIG,
  
  // Classes
  LfoProcessor as WtLfoProcessor,
  MsegProcessor,
  StepSeqProcessor,
  ModulationMatrix,
  
  // Factory functions
  createLfoProcessor,
  createMsegProcessor,
  createStepSeqProcessor,
  createModulationMatrix,
} from './wavetable-modulation';

// ============================================================================
// WAVETABLE EFFECTS EXPORTS (Phase 39)
// ============================================================================

export {
  // Types
  type WavetableEffectType,
  type EffectPosition,
  type WavetableEffectSlot,
  
  // EQ Types
  type EqBandType,
  type EqBandConfig,
  type ParametricEqConfig,
  
  // Distortion Types
  type DistortionConfig,
  type WaveshaperConfig,
  
  // Modulation Effect Types
  type WtChorusConfig,
  type WtPhaserConfig,
  type WtFlangerConfig,
  type RotaryConfig,
  
  // Time-based Types
  type WtDelayConfig,
  type ReverbType,
  type WtReverbConfig,
  
  // Special FX Types
  type CombulatorConfig,
  type FreqShifterConfig,
  type WtRingModConfig,
  type VocoderConfig,
  type ResonatorConfig,
  
  // Dynamics Types
  type WtCompressorConfig,
  type WtLimiterConfig,
  type StereoWidenerConfig,
  
  // Interface
  type WtEffectProcessor,
  
  // Defaults
  DEFAULT_PARAMETRIC_EQ,
  DEFAULT_DISTORTION,
  DEFAULT_WAVESHAPER,
  DEFAULT_WT_CHORUS,
  DEFAULT_WT_PHASER,
  DEFAULT_WT_FLANGER,
  DEFAULT_ROTARY,
  DEFAULT_WT_DELAY,
  DEFAULT_WT_REVERB,
  DEFAULT_COMBULATOR,
  DEFAULT_FREQ_SHIFTER,
  DEFAULT_WT_RING_MOD,
  DEFAULT_VOCODER,
  DEFAULT_RESONATOR,
  DEFAULT_WT_COMPRESSOR,
  DEFAULT_WT_LIMITER,
  DEFAULT_STEREO_WIDENER,
  
  // Classes
  ParametricEqProcessor,
  DistortionProcessor,
  WtReverbProcessor,
  WavetableEffectChain,
  
  // Factory functions
  createWtEffectChain,
  createParametricEq,
  createDistortion,
  createWtReverb,
} from './wavetable-effects';

// ============================================================================
// WAVETABLE EDITOR EXPORTS (Phase 39)
// ============================================================================

export {
  // Types
  type WavetableEditorTool,
  type SelectionMode,
  type MorphInterpolation,
  type HarmonicPreset,
  type EditorSelection,
  type EditOperation,
  type HarmonicData,
  type SpectralFrame,
  type WavetableEditorState,
  
  // Defaults
  DEFAULT_EDITOR_STATE,
  
  // Class
  WavetableEditor,
  
  // Factory function
  createWavetableEditor,
} from './wavetable-editor';

// ============================================================================
// WAVETABLE VISUALIZER EXPORTS (Phase 39)
// ============================================================================

export {
  // Types
  type VisualizationMode,
  type ColorScheme,
  type RenderTarget,
  type CameraSettings,
  type VisualizationSettings,
  type RenderedFrame,
  
  // Defaults
  DEFAULT_VISUALIZATION_SETTINGS,
  
  // Utilities
  ColorUtils,
  
  // Classes
  Canvas2DRenderer,
  Surface3DRenderer,
  WavetableVisualizer,
  
  // Factory functions
  createWavetableVisualizer,
  createCanvas2DRenderer,
  createSurface3DRenderer,
} from './wavetable-visualizer';

// ============================================================================
// WAVETABLE LOADER EXPORTS (Phase 39)
// ============================================================================

export {
  // Types
  type WavetableSource,
  type PresetLoadOptions,
  type WavetableLoadResult,
  type PresetLoadResult,
  type PresetBrowserInfo,
  type WavetableBrowserInfo,
  
  // Defaults
  DEFAULT_LOAD_OPTIONS,
  
  // Conversion function
  convertParsedPresetToUnified,
  
  // Class
  WavetableInstrumentLoader,
  
  // Factory functions
  createWavetableLoader,
  createLoadedWavetableInstrument,
  quickLoadPreset,
} from './wavetable-loader';

// ============================================================================
// SAMPLER IMPORT EXPORTS (Phase 38)
// ============================================================================

export {
  // Constants
  AUDIO_FORMAT_MAP,
  INSTRUMENT_FORMAT_MAP,
  
  // Types
  type AudioFileFormat,
  type InstrumentFileFormat,
  type SampleImportResult,
  type InstrumentImportResult,
  type ZoneImportData,
  type SampleMetadata,
  type GlobalInstrumentSettings,
  type EnvelopeSettings as ImportEnvelopeSettings,
  type FilterSettings as ImportFilterSettings,
  
  // Classes
  FileUploadHandler,
  SampleLibraryScanner,
  SfzParser,
  Sf2Parser,
  InstrumentImporter,
  
  // Factory functions
  createFileUploadHandler,
  createSampleLibraryScanner,
  createSfzParser,
  createSf2Parser,
  createInstrumentImporter,
} from './sample-import';

// ============================================================================
// SAMPLER FILTER EXPORTS (Phase 38)
// ============================================================================

export {
  // Types
  type SamplerFilterType,
  type FilterRoutingMode,
  type SaturationMode,
  type FilterConfig,
  type DualFilterConfig,
  type FormantVowel,
  
  // Constants
  FORMANT_VOWELS,
  DEFAULT_FILTER_CONFIG,
  DEFAULT_DUAL_FILTER_CONFIG,
  
  // Classes
  SamplerFilter,
  DualSamplerFilter,
  
  // Factory functions
  createSamplerFilter,
  createDualSamplerFilter,
  createFilterConfig,
  createDualFilterConfig,
} from './sampler-filter';

// ============================================================================
// SAMPLER EFFECTS EXPORTS (Phase 38)
// ============================================================================

export {
  // Types
  type SamplerEffectType,
  type EffectSlot,
  type EffectChainConfig,
  type EqBand,
  type ParametricEqParams,
  type GraphicEqParams,
  type CompressorParams as SamplerCompressorParams,
  type LimiterParams,
  type GateParams,
  type SaturationParams,
  type ChorusParams as SamplerChorusParams,
  type FlangerParams,
  type PhaserParams,
  type DelayParams as SamplerDelayParams,
  type MultitapDelayParams,
  type ReverbParams as SamplerReverbParams,
  type BitcrusherParams,
  type RingModParams,
  type StereoWidenerParams,
  type LofiParams,
  type EffectProcessor,
  
  // Default params
  DEFAULT_COMPRESSOR_PARAMS as SAMPLER_DEFAULT_COMPRESSOR,
  DEFAULT_LIMITER_PARAMS,
  DEFAULT_GATE_PARAMS,
  DEFAULT_SATURATION_PARAMS,
  DEFAULT_CHORUS_PARAMS as SAMPLER_DEFAULT_CHORUS,
  DEFAULT_FLANGER_PARAMS,
  DEFAULT_PHASER_PARAMS,
  DEFAULT_DELAY_PARAMS as SAMPLER_DEFAULT_DELAY,
  DEFAULT_REVERB_PARAMS as SAMPLER_DEFAULT_REVERB,
  DEFAULT_BITCRUSHER_PARAMS,
  DEFAULT_LOFI_PARAMS,
  
  // Classes
  CompressorProcessor,
  LimiterProcessor,
  GateProcessor,
  SaturationProcessor,
  ChorusProcessor,
  DelayProcessor,
  ReverbProcessor,
  BitcrusherProcessor,
  LofiProcessor,
  SamplerEffectChain,
  
  // Factory functions
  createEffectChain,
  createCompressor as createSamplerCompressor,
  createLimiter,
  createGate,
  createSaturation,
  createChorus as createSamplerChorus,
  createDelay as createSamplerDelay,
  createReverb as createSamplerReverb,
  createBitcrusher,
  createLofi,
  getDefaultEffectParams,
} from './sampler-effects';

// ============================================================================
// SAMPLER UI TYPES EXPORTS (Phase 38)
// ============================================================================

export {
  // Keyboard types
  type KeyboardDisplayConfig,
  type KeyboardColors,
  type ZoneDisplayInfo,
  type KeyboardNoteState,
  type ZoneDragOperation,
  DEFAULT_KEYBOARD_COLORS,
  
  // Waveform types
  type WaveformDisplayMode,
  type WaveformDisplayConfig,
  type WaveformColors,
  type WaveformMarker,
  type WaveformRenderData,
  DEFAULT_WAVEFORM_COLORS,
  
  // Envelope types
  type EnvelopeDisplayPoint,
  type EnvelopeDisplayConfig,
  type EnvelopeColors,
  DEFAULT_ENVELOPE_COLORS,
  
  // Modulation matrix types
  type ModSourceDisplay,
  type ModDestinationDisplay,
  type ModConnectionDisplay,
  type ModMatrixConfig,
  
  // Filter display types
  type FilterResponsePoint,
  type FilterDisplayConfig,
  type FilterDisplayColors,
  DEFAULT_FILTER_COLORS,
  
  // Browser types
  type BrowserViewMode,
  type BrowserSortField,
  type BrowserSortOrder,
  type BrowserFilters,
  type BrowserItem,
  type BrowserState,
  type BrowserConfig,
  
  // Meter types
  type MeterType as SamplerMeterType,
  type MeterConfig,
  type MeterColors,
  type MeterState,
  DEFAULT_METER_COLORS,
  
  // UI state types
  type SamplerUIView,
  type SamplerPanel,
  type PanelLayoutConfig,
  type SamplerUIState,
  type UIAction,
  type ClipboardData,
  
  // Control types
  type KnobConfig,
  type SliderConfig,
  type ButtonConfig,
  type DropdownConfig,
  
  // Context menu types
  type ContextMenuItem,
  type ContextMenuConfig,
  
  // Drag and drop types
  type DragDataType,
  type DragData,
  type DropTarget,
  
  // Keyboard shortcuts
  type KeyboardShortcut,
  DEFAULT_SAMPLER_SHORTCUTS,
  
  // Help types
  type TooltipConfig,
  type HelpSection,
  
  // Factory functions
  createKeyboardDisplayConfig,
  createWaveformDisplayConfig,
  createEnvelopeDisplayConfig,
  createFilterDisplayConfig,
  createMeterConfig,
  createBrowserState,
  createSamplerUIState,
} from './sampler-ui-types';

// ============================================================================
// SAMPLER PRESET EXPORTS (Phase 38)
// ============================================================================

export {
  // Constants
  PRESET_FORMAT_VERSION,
  PRESET_FILE_EXTENSION,
  MULTISAMPLE_FILE_EXTENSION,
  
  // Types
  type PresetCategory,
  type PresetTag,
  type PresetSampleReference,
  type PresetZone,
  type PresetEnvelope,
  type PresetLfo,
  type PresetFilter,
  type PresetModulation,
  type PresetEffect,
  type PresetVoiceSettings,
  type SamplerPreset,
  type PresetManagerOptions,
  type PresetSearchOptions,
  type PresetSearchResult,
  
  // Defaults
  DEFAULT_PRESET_ENVELOPE,
  DEFAULT_PRESET_LFO,
  DEFAULT_PRESET_FILTER,
  DEFAULT_VOICE_SETTINGS,
  
  // Class
  SamplerPresetManager,
  
  // Factory functions
  createPresetManager,
  createNewPreset,
  validatePreset,
  exportPresetToJson,
  importPresetFromJson,
  clonePreset,
  mergePresets,
  splitPresetByKeyRange,
  
  // Morphing
  morphPresets,
} from './sampler-preset';

// ============================================================================
// SAMPLER VOICE MANAGER EXPORTS (Phase 38)
// ============================================================================

export {
  // Types
  type VoiceState as SamplerVoiceManagerState,
  type VoiceMode,
  type NotePriority,
  type VoiceStealingMode,
  type VoiceAllocationInfo,
  type VoiceConfig,
  type VoicePoolStats,
  
  // Defaults
  DEFAULT_VOICE_CONFIG,
  
  // Classes
  SamplerVoice,
  SamplerVoiceManager,
  
  // Factory functions
  createVoiceManager,
  createVoiceConfig,
  createVoice as createSamplerVoiceInstance,
} from './sampler-voice';

// ============================================================================
// SAMPLER ROUTING EXPORTS (Phase 38)
// ============================================================================

export {
  // Types
  type OutputDestination,
  type BusType,
  type ZoneRouting,
  type AuxSend,
  type BusConfig,
  type MasterOutputConfig,
  type MeterReading as SamplerRoutingMeterReading,
  
  // Defaults
  DEFAULT_ZONE_ROUTING,
  DEFAULT_BUS_CONFIG,
  DEFAULT_MASTER_OUTPUT,
  
  // Classes
  AudioBus,
  SamplerRoutingManager,
  
  // Factory functions
  createRoutingManager,
  createAudioBus,
  createZoneRouting,
  createAuxSend,
} from './sampler-routing';

// ============================================================================
// SAMPLE MANIPULATION UI EXPORTS
// ============================================================================

export {
  // Types
  type ManipulationOperation,
  type TrimParams,
  type FadeParams,
  type NormalizeParams,
  type TimeStretchParams,
  type PitchShiftParams,
  type ConvertRateParams,
  type ConvertDepthParams,
  type ConvertChannelsParams,
  type CropParams,
  type SliceParams,
  type WarpMarker,
  type ManipulationParams,
  type ManipulationResult,
  type SaveAsNewParams,
  type BatchJob,
  type BatchResult,
  type UndoState,
  
  // Operations
  performTrim,
  performFade,
  performNormalize,
  performReverse,
  performTimeStretch,
  performPitchShift,
  performConvertRate,
  performConvertDepth,
  performConvertChannels,
  performCrop,
  performGain,
  performDcRemove,
  performSlice,
  performSaveAsNew,
  applyManipulation,
  
  // Batch processing
  processBatch,
  
  // Undo/redo
  createUndoState,
  applyUndo,
  
  // Visualization
  generateWaveformForUI,
  getSampleRegion,
} from './sample-manipulation-ui';

// ============================================================================
// MIDI NOTATION BRIDGE EXPORTS (Phase 1: Integration)
// ============================================================================

export {
  // Types
  type MIDIRecordingMode,
  type QuantizeGrid,
  type MIDINotationBridgeConfig,
  type MIDINotationBridgeState,
  type HeldNote,
  type RecordedNote,
  type MIDINotationBridgeCallbacks,
  
  // Constants
  DEFAULT_MIDI_NOTATION_CONFIG,
  
  // Interface
  type MIDINotationBridge,
  
  // Factory
  createMIDINotationBridge,
  
  // Helpers
  getQuantizeGridTicks,
  quantizeTick,
  
  // Singletons
  getMIDINotationBridge,
  resetMIDINotationBridge,
} from './midi-notation-bridge';

// ============================================================================
// AUDIO EXPORT & OFFLINE RENDERING EXPORTS (Phase 16)
// ============================================================================

export {
  // Types
  type ExportFormat,
  type BitDepth,
  type SampleRate,
  type DitherType,
  type ExportConfig,
  type ExportProgress,
  type ExportResult,
  type ExportQueueEntry,
  type ExportPreset,
  
  // Constants
  DEFAULT_EXPORT_CONFIG,
  FACTORY_EXPORT_PRESETS,
  
  // Engine
  AudioExportEngine,
  getExportEngine,
} from './export';

// ============================================================================
// EVENT FLATTENING/BAKING EXPORTS
// ============================================================================

export {
  // Types
  type FlattenedEventType,
  type FlattenedEvent,
  type InputEvent,
  type FlattenConfig,
  type FlattenStats,
  type FlattenWarning,
  type FlattenResult,
  type TrackDefinition,
  type SessionDefinition,
  
  // Constants
  DEFAULT_FLATTEN_CONFIG,
  
  // Time Conversion
  calculateSamplesPerTick,
  tickToSample,
  tickToSeconds,
  sampleToTick,
  
  // State Management
  CardStateManager,
  EventCollector,
  
  // Card Processing
  createContextForTick,
  cardOutputToEvents,
  simulateCardProcessing,
  
  // Flattening Functions
  flattenCardChain,
  flattenGraph,
  flattenToTimeline,
  flattenTrack,
  
  // Export Integration
  prepareForExport,
  
  // Note Event Helpers
  createNoteOnEvent,
  createNoteOffEvent,
  expandNoteDurations,
} from './event-flattener';