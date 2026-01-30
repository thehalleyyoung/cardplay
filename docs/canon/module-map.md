# Module Map

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document maps canonical module paths (used in docs) to actual file locations in the codebase.

---

## Canonical Modules

These modules are stable and match their canonical paths:

| Canonical Path | Actual Path | Key Exports |
|---------------|-------------|-------------|
| `src/ai/adaptation/index.ts` | `src/ai/adaptation/index.ts` |  |
| `src/ai/adaptation/prolog-phrase-adapter.ts` | `src/ai/adaptation/prolog-phrase-adapter.ts` | PhraseNote, ChordTarget, ScaleTarget, +6 |
| `src/ai/advisor/advisor-interface.ts` | `src/ai/advisor/advisor-interface.ts` | AdvisorContext, AdvisorHostAction, HostAction, +5 |
| `src/ai/advisor/advisor-telemetry.ts` | `src/ai/advisor/advisor-telemetry.ts` | QuestionEvent, CategoryStats, AnswerFeedback, +15 |
| `src/ai/advisor/board-specific-queries.ts` | `src/ai/advisor/board-specific-queries.ts` | BoardQueryContext |
| `src/ai/advisor/conversation-manager.ts` | `src/ai/advisor/conversation-manager.ts` | ConversationTurn, Bookmark, ConversationSession, +3 |
| `src/ai/advisor/index.ts` | `src/ai/advisor/index.ts` |  |
| `src/ai/engine/index.ts` | `src/ai/engine/index.ts` |  |
| `src/ai/engine/kb-idb-cache.ts` | `src/ai/engine/kb-idb-cache.ts` | KBCacheEntry, KBCacheOptions, KBCache |
| `src/ai/engine/kb-lifecycle.ts` | `src/ai/engine/kb-lifecycle.ts` | KBTier, KBStatus, KBLoadOptions, +7 |
| `src/ai/engine/kb-memory-profiler.ts` | `src/ai/engine/kb-memory-profiler.ts` | KBMemoryBreakdown, KBSectionMemory, GCResult, +6 |
| `src/ai/engine/kb-migration.ts` | `src/ai/engine/kb-migration.ts` | KBMigration, MigrationPlan, MigrationResult, +4 |
| `src/ai/engine/perf-monitor.ts` | `src/ai/engine/perf-monitor.ts` | QuerySample, QueryStats, BudgetCheckResult, +4 |
| `src/ai/engine/profiling-tools.ts` | `src/ai/engine/profiling-tools.ts` | BenchmarkComparison, BenchmarkMetrics, OptimizationReport, +7 |
| `src/ai/engine/prolog-adapter.ts` | `src/ai/engine/prolog-adapter.ts` | PrologTerm, PrologAtom, PrologNumber, +21 |
| `src/ai/engine/prolog-worker-client.ts` | `src/ai/engine/prolog-worker-client.ts` | PrologWorkerClient |
| `src/ai/engine/prolog-worker.ts` | `src/ai/engine/prolog-worker.ts` |  |
| `src/ai/engine/query-batch.ts` | `src/ai/engine/query-batch.ts` | BatchQueryItem, BatchQueryResult, QueryBatch, +1 |
| `src/ai/engine/query-profiler.ts` | `src/ai/engine/query-profiler.ts` | ProfilingSession, QueryPathProfile, QueryPhase, +6 |
| `src/ai/engine/slow-query-logger.ts` | `src/ai/engine/slow-query-logger.ts` | SlowQueryLogEntry, SlowQueryLoggerConfig, SlowQueryAlertCallback, +2 |
| `src/ai/generators/arpeggio-generator.ts` | `src/ai/generators/arpeggio-generator.ts` | NoteEvent, ChordContext, ArpeggioPattern, +4 |
| `src/ai/generators/bass-generator.ts` | `src/ai/generators/bass-generator.ts` | NoteEvent, ChordInfo, BassGeneratorOptions, +3 |
| `src/ai/generators/chord-generator.ts` | `src/ai/generators/chord-generator.ts` | Chord, KeyContext, ChordGeneratorOptions, +18 |
| `src/ai/generators/drum-generator.ts` | `src/ai/generators/drum-generator.ts` | DrumEvent, DrumInstrument, DrumGeneratorOptions, +3 |
| `src/ai/generators/index.ts` | `src/ai/generators/index.ts` |  |
| `src/ai/generators/melody-generator.ts` | `src/ai/generators/melody-generator.ts` | NoteEvent, ChordContext, ScaleContext, +8 |
| `src/ai/harmony/harmony-explorer.ts` | `src/ai/harmony/harmony-explorer.ts` | ChordInfo, KeyInfo, HarmonicFunction, +7 |
| `src/ai/harmony/index.ts` | `src/ai/harmony/index.ts` |  |
| `src/ai/index.ts` | `src/ai/index.ts` |  |
| `src/ai/knowledge/adaptation-loader.ts` | `src/ai/knowledge/adaptation-loader.ts` | isAdaptationLoaded, resetAdaptationLoader, getAdaptationSource |
| `src/ai/knowledge/board-layout-loader.ts` | `src/ai/knowledge/board-layout-loader.ts` | isBoardLayoutLoaded, resetBoardLayoutLoader, getBoardLayoutSource |
| `src/ai/knowledge/composition-patterns-loader.ts` | `src/ai/knowledge/composition-patterns-loader.ts` | isCompositionPatternsLoaded, resetCompositionPatternsLoader, getCompositionPatternsSource |
| `src/ai/knowledge/index.ts` | `src/ai/knowledge/index.ts` |  |
| `src/ai/knowledge/kb-validation.ts` | `src/ai/knowledge/kb-validation.ts` | KBValidationResult, ValidationError, ValidationWarning, +3 |
| `src/ai/knowledge/music-theory-loader.ts` | `src/ai/knowledge/music-theory-loader.ts` | isMusicTheoryLoaded, resetMusicTheoryLoader, getMusicTheorySource, +5 |
| `src/ai/knowledge/persona-loader.ts` | `src/ai/knowledge/persona-loader.ts` | PersonaId, PersonaLoadStatus, isPersonaLoaded, +3 |
| `src/ai/knowledge/phrase-adaptation-loader.ts` | `src/ai/knowledge/phrase-adaptation-loader.ts` | isPhraseAdaptationLoaded, resetPhraseAdaptationLoader |
| `src/ai/knowledge/project-analysis-loader.ts` | `src/ai/knowledge/project-analysis-loader.ts` | isProjectAnalysisLoaded, resetProjectAnalysisLoader, getProjectAnalysisSource |
| `src/ai/knowledge/user-prefs-loader.ts` | `src/ai/knowledge/user-prefs-loader.ts` | isUserPrefsLoaded, resetUserPrefsLoader, getUserPrefsSource |
| `src/ai/knowledge/workflow-planning-loader.ts` | `src/ai/knowledge/workflow-planning-loader.ts` | isWorkflowPlanningLoaded, resetWorkflowPlanningLoader, getWorkflowPlanningSource |
| `src/ai/learning/help-browser.ts` | `src/ai/learning/help-browser.ts` | HelpTopic, HelpCategory, HelpContext, +9 |
| `src/ai/learning/index.ts` | `src/ai/learning/index.ts` |  |
| `src/ai/learning/preset-tagging.ts` | `src/ai/learning/preset-tagging.ts` | PresetReview, PresetComparison, ComparisonCriteria, +7 |
| `src/ai/learning/project-metadata.ts` | `src/ai/learning/project-metadata.ts` | MusicalKey, TimeSignature, ProjectMetadata, +15 |
| `src/ai/learning/project-versioning.ts` | `src/ai/learning/project-versioning.ts` | VersionNamingConvention, ProjectVersion, VersionDiffEntry, +11 |
| `src/ai/learning/session-notes.ts` | `src/ai/learning/session-notes.ts` | SessionNote, CreateNoteOptions, NoteSearchCriteria, +13 |
| `src/ai/learning/tutorial-progress.ts` | `src/ai/learning/tutorial-progress.ts` | TutorialStepStatus, TrackedTutorialStep, TutorialProgress, +16 |
| `src/ai/learning/undo-branching.ts` | `src/ai/learning/undo-branching.ts` | UndoSnapshot, UndoBranch, UndoTreeSummary, +14 |
| `src/ai/learning/user-preferences.ts` | `src/ai/learning/user-preferences.ts` | BoardPreferences, BoardUsage, DeckLayoutPreference, +52 |
| `src/ai/learning/workspace-templates.ts` | `src/ai/learning/workspace-templates.ts` | WorkspaceTemplate, WorkspaceTemplateCategory, ApplyTemplateOptions, +14 |
| `src/ai/policy/control-policy.ts` | `src/ai/policy/control-policy.ts` | ToolMode, AutoApplyPermission, ControlPolicyConfig, +6 |
| `src/ai/queries/board-queries.ts` | `src/ai/queries/board-queries.ts` | BoardInfo, DeckType, WorkflowType, +7 |
| `src/ai/queries/composition-queries.ts` | `src/ai/queries/composition-queries.ts` | Genre, SectionType, GenreInfo, +9 |
| `src/ai/queries/feature-derivation.ts` | `src/ai/queries/feature-derivation.ts` | PersonaId, getBoardsForPersona, FeatureAvailability, +7 |
| `src/ai/queries/index.ts` | `src/ai/queries/index.ts` |  |
| `src/ai/queries/persona-queries.ts` | `src/ai/queries/persona-queries.ts` | Importance, DeckEntry, BoardPreset, +103 |
| `src/ai/queries/spec-queries.ts` | `src/ai/queries/spec-queries.ts` | SpecConflict, SpecLintWarning, KeyDetectionResult, +266 |
| `src/ai/queries/theory-queries.ts` | `src/ai/queries/theory-queries.ts` | NoteName, ScaleType, ChordType, +5 |
| `src/ai/queries/workflow-queries.ts` | `src/ai/queries/workflow-queries.ts` | WorkflowPlan, DeckSequence, ParameterDependency, +37 |
| `src/ai/theory/apply-host-action.ts` | `src/ai/theory/apply-host-action.ts` | ApplyHostActionOptions, ApplyHostActionResult, applyHostAction, +2 |
| `src/ai/theory/canonical-representations.ts` | `src/ai/theory/canonical-representations.ts` | MusicSpecInvariants, MUSIC_SPEC_INVARIANTS, validateSpecInvariants, +46 |
| `src/ai/theory/carnatic-integration.ts` | `src/ai/theory/carnatic-integration.ts` | MridangamSyllable, MRIDANGAM_SYLLABLES, getMridangamSyllable, +20 |
| `src/ai/theory/constraint-mappers.ts` | `src/ai/theory/constraint-mappers.ts` | CardParamSchema, CardSchema, ConstraintMapper, +10 |
| `src/ai/theory/custom-constraints.ts` | `src/ai/theory/custom-constraints.ts` | CustomConstraintDefinition, CustomConstraintCategory, ValidationResult, +114 |
| `src/ai/theory/deck-templates.ts` | `src/ai/theory/deck-templates.ts` | DeckTemplate, DeckTemplateSlot, THEORY_DECK_TEMPLATE, +26 |
| `src/ai/theory/gttm-integration.ts` | `src/ai/theory/gttm-integration.ts` | GroupingBoundary, GroupingSpan, MetricalAccent, +21 |
| `src/ai/theory/harmony-cadence-integration.ts` | `src/ai/theory/harmony-cadence-integration.ts` | PivotChord, ModulationPlan, ModulationPlannerProps, +13 |
| `src/ai/theory/host-action-handlers.ts` | `src/ai/theory/host-action-handlers.ts` | ApplyResult, HostActionHandler, HostActionHandlerEntry, +8 |
| `src/ai/theory/host-actions.ts` | `src/ai/theory/host-actions.ts` | HostActionEnvelope, ExtensionAction, HostAction, +23 |
| `src/ai/theory/index.ts` | `src/ai/theory/index.ts` |  |
| `src/ai/theory/music-spec-integration.ts` | `src/ai/theory/music-spec-integration.ts` | PhraseGeneratorParams, rootToPitchClass, modeToIntervals, +11 |
| `src/ai/theory/music-spec-store.ts` | `src/ai/theory/music-spec-store.ts` | getMusicSpecStore, resetMusicSpecStore |
| `src/ai/theory/music-spec.ts` | `src/ai/theory/music-spec.ts` | RootName, ModeName, ChordQuality, +133 |
| `src/ai/theory/ontologies/bridge.ts` | `src/ai/theory/ontologies/bridge.ts` | BridgeAction, BridgeResult, BridgePolicyConfig, +4 |
| `src/ai/theory/ontologies/example-carnatic.ts` | `src/ai/theory/ontologies/example-carnatic.ts` | CARNATIC_ONTOLOGY, CarnaticMelakartaConstraint, CarnaticGamakaConstraint, +1 |
| `src/ai/theory/ontologies/index.ts` | `src/ai/theory/ontologies/index.ts` | OntologyId, PitchSystem, OntologyPack, +7 |
| `src/ai/theory/pareto-front.ts` | `src/ai/theory/pareto-front.ts` | ParetoCandidate, ParetoFrontResult, dominates, +6 |
| `src/ai/theory/selection-analyzer.ts` | `src/ai/theory/selection-analyzer.ts` | NoteEvent, SelectionProfile, CultureMatch, +9 |
| `src/ai/theory/spec-event-bus.ts` | `src/ai/theory/spec-event-bus.ts` | SpecChangeEvent, ParamLink, SpecChangeHandler, +3 |
| `src/ai/theory/spec-prolog-bridge.ts` | `src/ai/theory/spec-prolog-bridge.ts` | specToPrologFacts, specToPrologTerm, PrologBindings, +8 |
| `src/ai/theory/theory-card-registry.ts` | `src/ai/theory/theory-card-registry.ts` | BUILTIN_THEORY_CARDS, getTheoryCardRegistry, registerTheoryCard, +3 |
| `src/ai/theory/theory-cards.ts` | `src/ai/theory/theory-cards.ts` | TheoryCardParamState, TheoryCardState, TheoryCardParamDef, +71 |
| `src/audio/audio-engine-store-bridge.ts` | `src/audio/audio-engine-store-bridge.ts` | AudioEngineEvent, AudioEngineBridgeConfig, AudioEngineStoreBridge, +2 |
| `src/audio/audio-engine.ts` | `src/audio/audio-engine.ts` | AudioEngineConfig, AudioEvent, AudioGraphNode, +15 |
| `src/audio/audio-optimization.ts` | `src/audio/audio-optimization.ts` | PerformanceWarning, GlitchDetection, DegradationLevel, +11 |
| `src/audio/automation-lane.ts` | `src/audio/automation-lane.ts` | AutomationPointId, asAutomationPointId, CurveType, +8 |
| `src/audio/context.ts` | `src/audio/context.ts` | AudioEngineConfig, AudioEngineState, AudioDevice, +11 |
| `src/audio/deck-audio-bridge.ts` | `src/audio/deck-audio-bridge.ts` | AudioNodeType, AudioGraphNode, AudioGraphConnection, +8 |
| `src/audio/deck-routing-store-bridge.ts` | `src/audio/deck-routing-store-bridge.ts` | DeckNodeType, DeckRoutingNode, DeckRoutingConnection, +7 |
| `src/audio/drum-pattern-player.ts` | `src/audio/drum-pattern-player.ts` | TransportState, ScheduledNote, PatternPlaybackOptions, +17 |
| `src/audio/drum-patterns.ts` | `src/audio/drum-patterns.ts` | DRUM, VEL, SWING, +31 |
| `src/audio/dynamics-analyzer.ts` | `src/audio/dynamics-analyzer.ts` | DynamicsStats, CompressionAnalysis, LimitingAnalysis, +14 |
| `src/audio/event-flattener-store-bridge.ts` | `src/audio/event-flattener-store-bridge.ts` | FlattenedEvent, FlattenedStream, TickRange, +5 |
| `src/audio/event-flattener.ts` | `src/audio/event-flattener.ts` | FlattenedEventType, FlattenedEvent, InputEvent, +24 |
| `src/audio/export.ts` | `src/audio/export.ts` | ExportFormat, BitDepth, SampleRate, +10 |
| `src/audio/freesound-api.ts` | `src/audio/freesound-api.ts` | DEFAULT_PAGE_SIZE, MAX_RESULTS, FreesoundLicense, +14 |
| `src/audio/freesound-integration.ts` | `src/audio/freesound-integration.ts` | FreesoundLicense, FreesoundMetadata, FreesoundSearchFilters, +12 |
| `src/audio/freesound.ts` | `src/audio/freesound.ts` | FREESOUND_API_TOKEN, FREESOUND_API_BASE, DEFAULT_PAGE_SIZE, +24 |
| `src/audio/freeze-track.ts` | `src/audio/freeze-track.ts` | FreezeOptions, FreezeProgress, FreezeResult, +4 |
| `src/audio/hybrid-instrument.ts` | `src/audio/hybrid-instrument.ts` | HybridMode, HybridVoiceState, HybridConfig, +5 |
| `src/audio/index.ts` | `src/audio/index.ts` |  |
| `src/audio/instrument-cards.ts` | `src/audio/instrument-cards.ts` | AudioModuleState, MIDIRoutingMode, AudioRoutingMode, +25 |
| `src/audio/instrument-database.ts` | `src/audio/instrument-database.ts` | CategoryInfo, SubcategoryInfo, WavetableRecord, +4 |
| `src/audio/instrument-interface.ts` | `src/audio/instrument-interface.ts` | VoiceState, VoiceAllocationMode, VoiceInfo, +9 |
| `src/audio/midi-input-handler.ts` | `src/audio/midi-input-handler.ts` | NoteEvent, AftertouchEvent, PitchBendEvent, +103 |
| `src/audio/midi-mapping.ts` | `src/audio/midi-mapping.ts` | ParameterId, MappingCurve, MappingMode, +34 |
| `src/audio/midi-notation-bridge.ts` | `src/audio/midi-notation-bridge.ts` | MIDIRecordingMode, QuantizeGrid, MIDINotationBridgeConfig, +11 |
| `src/audio/mixer.ts` | `src/audio/mixer.ts` | ChannelType, PanLaw, SendType, +27 |
| `src/audio/performance-engine.ts` | `src/audio/performance-engine.ts` | PerformanceMetrics, BufferSize, SampleRateOption, +12 |
| `src/audio/pitch-detect.ts` | `src/audio/pitch-detect.ts` | MIN_FREQUENCY, MAX_FREQUENCY, DEFAULT_SAMPLE_RATE, +21 |
| `src/audio/preset-converter.ts` | `src/audio/preset-converter.ts` | detectCategory, detectSubCategory, detectCharacters, +7 |
| `src/audio/render.ts` | `src/audio/render.ts` | RenderOptions, RenderResult, RenderMetadata, +2 |
| `src/audio/sample-editor.ts` | `src/audio/sample-editor.ts` | MIN_LOOP_LENGTH, ZERO_CROSSING_THRESHOLD, SILENCE_THRESHOLD, +26 |
| `src/audio/sample-import-manager.ts` | `src/audio/sample-import-manager.ts` | ImportConfig, DEFAULT_IMPORT_CONFIG, EnrichedImportResult, +14 |
| `src/audio/sample-import.ts` | `src/audio/sample-import.ts` | AudioFileFormat, InstrumentFileFormat, AUDIO_FORMAT_MAP, +22 |
| `src/audio/sample-manipulation-ui.ts` | `src/audio/sample-manipulation-ui.ts` | ManipulationOperation, TrimParams, FadeParams, +34 |
| `src/audio/sample-mapper.ts` | `src/audio/sample-mapper.ts` | MAX_PITCH_SHIFT_UP, MAX_PITCH_SHIFT_DOWN, MIN_VELOCITY, +21 |
| `src/audio/sample-pack-manager.ts` | `src/audio/sample-pack-manager.ts` | PackInstallStatus, PackCredits, PackPreviewConfig, +12 |
| `src/audio/sample-packs.ts` | `src/audio/sample-packs.ts` | SamplePackCategory, PackSample, SamplePack, +22 |
| `src/audio/sample-pipeline.ts` | `src/audio/sample-pipeline.ts` | SampleId, asSampleId, SliceId, +15 |
| `src/audio/sample-slicer.ts` | `src/audio/sample-slicer.ts` | SliceMarker, SliceGridConfig, WarpMarker, +20 |
| `src/audio/sample.ts` | `src/audio/sample.ts` | VoiceState, PlaybackMode, LoopMode, +41 |
| `src/audio/sampler-core.ts` | `src/audio/sampler-core.ts` | GM_DRUM_MAP, EXTENDED_PERCUSSION_MAP, FULL_DRUM_MAP, +39 |
| `src/audio/sampler-effects.ts` | `src/audio/sampler-effects.ts` | SamplerEffectType, EffectSlot, EffectChainConfig, +50 |
| `src/audio/sampler-filter.ts` | `src/audio/sampler-filter.ts` | SamplerFilterType, FilterRoutingMode, SaturationMode, +12 |
| `src/audio/sampler-modulation.ts` | `src/audio/sampler-modulation.ts` | MAX_MOD_SLOTS, MAX_MACROS, MAX_MACRO_TARGETS, +42 |
| `src/audio/sampler-preset.ts` | `src/audio/sampler-preset.ts` | PRESET_FORMAT_VERSION, PRESET_FILE_EXTENSION, MULTISAMPLE_FILE_EXTENSION, +28 |
| `src/audio/sampler-routing.ts` | `src/audio/sampler-routing.ts` | OutputDestination, BusType, ZoneRouting, +13 |
| `src/audio/sampler-ui-types.ts` | `src/audio/sampler-ui-types.ts` | KeyboardDisplayConfig, KeyboardColors, DEFAULT_KEYBOARD_COLORS, +59 |
| `src/audio/sampler-voice.ts` | `src/audio/sampler-voice.ts` | VoiceState, VoiceMode, NotePriority, +10 |
| `src/audio/scheduler.ts` | `src/audio/scheduler.ts` | TimeSignature, DEFAULT_TIME_SIGNATURE, TransportState, +36 |
| `src/audio/surge-assets.ts` | `src/audio/surge-assets.ts` | SURGE_WAVETABLE_PATHS, SURGE_PATCH_PATHS, FACTORY_WAVETABLE_CATEGORIES, +21 |
| `src/audio/synth-asset-db.ts` | `src/audio/synth-asset-db.ts` | WavetableRecord, ParsedWavetable, OscillatorSettings, +21 |
| `src/audio/synth.ts` | `src/audio/synth.ts` | OscillatorWaveform, OscillatorParams, DEFAULT_OSCILLATOR, +38 |
| `src/audio/transport.ts` | `src/audio/transport.ts` | TransportState, TimeSignature, BarBeatPosition, +10 |
| `src/audio/unified-instrument.ts` | `src/audio/unified-instrument.ts` | MAX_LAYERS, MAX_SPLITS, MAX_VELOCITY_LAYERS, +41 |
| `src/audio/unified-preset.ts` | `src/audio/unified-preset.ts` | InstrumentCategory, InstrumentSubCategory, SoundCharacter, +23 |
| `src/audio/wavetable-core.ts` | `src/audio/wavetable-core.ts` | DEFAULT_FRAME_SIZE, MIN_FRAME_SIZE, MAX_FRAME_SIZE, +41 |
| `src/audio/wavetable-editor.ts` | `src/audio/wavetable-editor.ts` | WavetableEditorTool, SelectionMode, MorphInterpolation, +9 |
| `src/audio/wavetable-effects.ts` | `src/audio/wavetable-effects.ts` | WavetableEffectType, EffectPosition, WavetableEffectSlot, +46 |
| `src/audio/wavetable-import.ts` | `src/audio/wavetable-import.ts` | SURGE_WT_MAGIC, SERUM_FRAME_SIZE, COMMON_CYCLE_SIZES, +17 |
| `src/audio/wavetable-instrument-adapter.ts` | `src/audio/wavetable-instrument-adapter.ts` | WavetableShape, WavetableFilterType, LFOTarget, +4 |
| `src/audio/wavetable-loader.ts` | `src/audio/wavetable-loader.ts` | WavetableSource, PresetLoadOptions, DEFAULT_LOAD_OPTIONS, +8 |
| `src/audio/wavetable-modulation.ts` | `src/audio/wavetable-modulation.ts` | MAX_LFOS, MAX_MSEGS, MAX_MSEG_NODES, +39 |
| `src/audio/wavetable-synth.ts` | `src/audio/wavetable-synth.ts` | SynthVoice, WavetableInstrument |
| `src/audio/wavetable-visualizer.ts` | `src/audio/wavetable-visualizer.ts` | VisualizationMode, ColorScheme, RenderTarget, +11 |
| `src/audio/wavetable-voice.ts` | `src/audio/wavetable-voice.ts` | MAX_VOICES, MAX_UNISON, VoiceStealMode, +8 |
| `src/audio/web-midi.ts` | `src/audio/web-midi.ts` | MIDIDeviceType, MIDIDeviceState, MIDIDeviceConnection, +70 |
| `src/audio/worklet.ts` | `src/audio/worklet.ts` | WorkletMessageType, WorkletMessage, ParamMessage, +27 |
| `src/boards/benchmarks/harness.ts` | `src/boards/benchmarks/harness.ts` | BenchmarkResult |
| `src/boards/builtins/ai-arranger-board.ts` | `src/boards/builtins/ai-arranger-board.ts` | aiArrangerBoard |
| `src/boards/builtins/ai-arranger-ui.ts` | `src/boards/builtins/ai-arranger-ui.ts` | ArrangementSection, PartType, StylePreset, +11 |
| `src/boards/builtins/ai-composition-board.ts` | `src/boards/builtins/ai-composition-board.ts` | aiCompositionBoard |
| `src/boards/builtins/ai-composition-ui.ts` | `src/boards/builtins/ai-composition-ui.ts` | CompositionConstraints, DEFAULT_CONSTRAINTS, GeneratorConfig, +10 |
| `src/boards/builtins/basic-sampler-board.ts` | `src/boards/builtins/basic-sampler-board.ts` | basicSamplerBoard |
| `src/boards/builtins/basic-session-board.ts` | `src/boards/builtins/basic-session-board.ts` | basicSessionBoard |
| `src/boards/builtins/basic-tracker-board.ts` | `src/boards/builtins/basic-tracker-board.ts` | basicTrackerBoard |
| `src/boards/builtins/capture-to-manual-action.ts` | `src/boards/builtins/capture-to-manual-action.ts` | captureToManualBoard, getRecommendedManualBoard, canCaptureToManual, +1 |
| `src/boards/builtins/composer-board.ts` | `src/boards/builtins/composer-board.ts` | composerBoard |
| `src/boards/builtins/generative-ambient-board.ts` | `src/boards/builtins/generative-ambient-board.ts` | generativeAmbientBoard |
| `src/boards/builtins/generative-ambient-ui.ts` | `src/boards/builtins/generative-ambient-ui.ts` | MoodPreset, MOOD_PRESETS, GenerativeLayer, +13 |
| `src/boards/builtins/harmony-analysis.ts` | `src/boards/builtins/harmony-analysis.ts` | MusicalKey, Chord, getScaleDegrees, +12 |
| `src/boards/builtins/ids.ts` | `src/boards/builtins/ids.ts` | BuiltinBoardId, isBuiltinBoardId, isValidBoardId, +1 |
| `src/boards/builtins/index.ts` | `src/boards/builtins/index.ts` |  |
| `src/boards/builtins/live-performance-actions.ts` | `src/boards/builtins/live-performance-actions.ts` | RevealedDeck, revealTrackInstrument, hideRevealedDeck, +11 |
| `src/boards/builtins/live-performance-board.ts` | `src/boards/builtins/live-performance-board.ts` | livePerformanceBoard |
| `src/boards/builtins/live-performance-tracker-board.ts` | `src/boards/builtins/live-performance-tracker-board.ts` | livePerformanceTrackerBoard |
| `src/boards/builtins/midi-import-actions.ts` | `src/boards/builtins/midi-import-actions.ts` | ParsedMIDIFile, MIDITrack, MIDINoteEvent, +4 |
| `src/boards/builtins/modular-routing-board.ts` | `src/boards/builtins/modular-routing-board.ts` | modularRoutingBoard |
| `src/boards/builtins/notation-board-manual.ts` | `src/boards/builtins/notation-board-manual.ts` | notationBoardManual |
| `src/boards/builtins/notation-harmony-board.ts` | `src/boards/builtins/notation-harmony-board.ts` | notationHarmonyBoard |
| `src/boards/builtins/piano-roll-producer-board.ts` | `src/boards/builtins/piano-roll-producer-board.ts` | pianoRollProducerBoard |
| `src/boards/builtins/producer-actions.ts` | `src/boards/builtins/producer-actions.ts` | GeneratedMetadata, GENERATED_MARKER, isGeneratedEvent, +14 |
| `src/boards/builtins/producer-board.ts` | `src/boards/builtins/producer-board.ts` | producerBoard |
| `src/boards/builtins/register.ts` | `src/boards/builtins/register.ts` | registerBuiltinBoards |
| `src/boards/builtins/sample-manipulation-actions.ts` | `src/boards/builtins/sample-manipulation-actions.ts` | SampleReference, SliceMarker, ChopSettings, +6 |
| `src/boards/builtins/session-generators-board.ts` | `src/boards/builtins/session-generators-board.ts` | sessionGeneratorsBoard |
| `src/boards/builtins/session-grid-actions.ts` | `src/boards/builtins/session-grid-actions.ts` | SessionSlot, makeSlotKey, duplicateClipSlot, +7 |
| `src/boards/builtins/stub-basic-tracker.ts` | `src/boards/builtins/stub-basic-tracker.ts` | basicTrackerBoard |
| `src/boards/builtins/stub-notation.ts` | `src/boards/builtins/stub-notation.ts` | notationManualBoard |
| `src/boards/builtins/stub-session.ts` | `src/boards/builtins/stub-session.ts` | basicSessionBoard |
| `src/boards/builtins/stub-tracker-phrases.ts` | `src/boards/builtins/stub-tracker-phrases.ts` | trackerPhrasesBoard |
| `src/boards/builtins/tracker-harmony-board.ts` | `src/boards/builtins/tracker-harmony-board.ts` | trackerHarmonyBoard |
| `src/boards/builtins/tracker-phrases-board.ts` | `src/boards/builtins/tracker-phrases-board.ts` | trackerPhrasesBoard |
| `src/boards/compatibility/index.ts` | `src/boards/compatibility/index.ts` |  |
| `src/boards/compatibility/project-compatibility.ts` | `src/boards/compatibility/project-compatibility.ts` | CompatibilityIssue, CompatibilityCheckResult, ProjectMetadata, +3 |
| `src/boards/compatibility/warning-banner.ts` | `src/boards/compatibility/warning-banner.ts` | showCompatibilityWarning, hideCompatibilityWarning |
| `src/boards/context/store.ts` | `src/boards/context/store.ts` | BoardContextStore, getBoardContextStore, resetBoardContextStore |
| `src/boards/context/types.ts` | `src/boards/context/types.ts` | BoardContextId, SpecContextId, createBoardContextId, +5 |
| `src/boards/deck-packs/add-pack.ts` | `src/boards/deck-packs/add-pack.ts` | addDeckPackToBoard, generateUniqueDeckId |
| `src/boards/deck-packs/builtins.ts` | `src/boards/deck-packs/builtins.ts` | essentialProductionPack, notationEssentialsPack, soundDesignLabPack, +1 |
| `src/boards/deck-packs/index.ts` | `src/boards/deck-packs/index.ts` |  |
| `src/boards/deck-packs/register.ts` | `src/boards/deck-packs/register.ts` | registerBuiltinDeckPacks |
| `src/boards/deck-packs/registry.ts` | `src/boards/deck-packs/registry.ts` | getDeckPackRegistry, resetDeckPackRegistry |
| `src/boards/deck-packs/types.ts` | `src/boards/deck-packs/types.ts` | DeckPack, DeckPackInstallation, DeckPackAddOptions, +2 |
| `src/boards/decks/audio-deck-adapter.ts` | `src/boards/decks/audio-deck-adapter.ts` | AudioDeckAdapter, createAudioDeckAdapter |
| `src/boards/decks/deck-capabilities.ts` | `src/boards/decks/deck-capabilities.ts` | DeckCapabilities, DECK_CAPABILITIES, getDeckCapabilities, +5 |
| `src/boards/decks/deck-container.ts` | `src/boards/decks/deck-container.ts` | DeckContainerOptions, DeckContainer, createDeckContainer |
| `src/boards/decks/deck-factories.ts` | `src/boards/decks/deck-factories.ts` | DECK_TYPE_TITLES, DECK_TYPE_ICONS, DECK_SUPPORTS_SLOT_GRID, +7 |
| `src/boards/decks/factories/ai-advisor-factory.ts` | `src/boards/decks/factories/ai-advisor-factory.ts` | aiAdvisorFactory |
| `src/boards/decks/factories/arrangement-deck-factory.ts` | `src/boards/decks/factories/arrangement-deck-factory.ts` | arrangementDeckFactory |
| `src/boards/decks/factories/arranger-deck-factory.ts` | `src/boards/decks/factories/arranger-deck-factory.ts` | arrangerFactory |
| `src/boards/decks/factories/automation-deck-factory.ts` | `src/boards/decks/factories/automation-deck-factory.ts` | automationFactory |
| `src/boards/decks/factories/dsp-chain-factory.ts` | `src/boards/decks/factories/dsp-chain-factory.ts` | dspChainFactory |
| `src/boards/decks/factories/effects-deck-factory.ts` | `src/boards/decks/factories/effects-deck-factory.ts` | effectsRackFactory |
| `src/boards/decks/factories/generator-factory.ts` | `src/boards/decks/factories/generator-factory.ts` | generatorFactory |
| `src/boards/decks/factories/harmony-deck-factory.ts` | `src/boards/decks/factories/harmony-deck-factory.ts` | harmonyDisplayFactory |
| `src/boards/decks/factories/index.ts` | `src/boards/decks/factories/index.ts` | registerBuiltinDeckFactories |
| `src/boards/decks/factories/instruments-deck-factory.ts` | `src/boards/decks/factories/instruments-deck-factory.ts` | instrumentBrowserFactory |
| `src/boards/decks/factories/mix-bus-factory.ts` | `src/boards/decks/factories/mix-bus-factory.ts` | MixBus, mixBusDeckFactory |
| `src/boards/decks/factories/mixer-deck-factory.ts` | `src/boards/decks/factories/mixer-deck-factory.ts` | mixerDeckFactory |
| `src/boards/decks/factories/modulation-matrix-deck-factory.ts` | `src/boards/decks/factories/modulation-matrix-deck-factory.ts` | modulationMatrixFactory |
| `src/boards/decks/factories/notation-deck-factory.ts` | `src/boards/decks/factories/notation-deck-factory.ts` | notationDeckFactory |
| `src/boards/decks/factories/pattern-deck-factory.ts` | `src/boards/decks/factories/pattern-deck-factory.ts` | patternEditorFactory |
| `src/boards/decks/factories/phrases-deck-factory.ts` | `src/boards/decks/factories/phrases-deck-factory.ts` | phraseLibraryFactory |
| `src/boards/decks/factories/piano-roll-deck-factory.ts` | `src/boards/decks/factories/piano-roll-deck-factory.ts` | pianoRollFactory |
| `src/boards/decks/factories/properties-deck-factory.ts` | `src/boards/decks/factories/properties-deck-factory.ts` | propertiesFactory |
| `src/boards/decks/factories/reference-track-factory.ts` | `src/boards/decks/factories/reference-track-factory.ts` | ReferenceTrack, referenceTrackDeckFactory |
| `src/boards/decks/factories/registry-devtool-factory.ts` | `src/boards/decks/factories/registry-devtool-factory.ts` | registryDevtoolDeckFactory |
| `src/boards/decks/factories/routing-deck-factory.ts` | `src/boards/decks/factories/routing-deck-factory.ts` | routingFactory |
| `src/boards/decks/factories/sample-manager-deck-factory.ts` | `src/boards/decks/factories/sample-manager-deck-factory.ts` | sampleManagerFactory |
| `src/boards/decks/factories/samples-deck-factory.ts` | `src/boards/decks/factories/samples-deck-factory.ts` | sampleBrowserFactory |
| `src/boards/decks/factories/session-deck-factory.ts` | `src/boards/decks/factories/session-deck-factory.ts` | sessionDeckFactory |
| `src/boards/decks/factories/spectrum-analyzer-factory.ts` | `src/boards/decks/factories/spectrum-analyzer-factory.ts` | FrequencyBand, SpectrumPoint, Peak, +8 |
| `src/boards/decks/factories/track-groups-factory.ts` | `src/boards/decks/factories/track-groups-factory.ts` | TrackGroup, trackGroupsDeckFactory |
| `src/boards/decks/factories/transport-deck-factory.ts` | `src/boards/decks/factories/transport-deck-factory.ts` | transportFactory |
| `src/boards/decks/factories/waveform-editor-factory.ts` | `src/boards/decks/factories/waveform-editor-factory.ts` | WaveformSelection, WaveformMarker, WaveformRegion, +8 |
| `src/boards/decks/factory-registry.ts` | `src/boards/decks/factory-registry.ts` | DeckFactoryRegistry, validateBoardFactories, assertBoardFactories, +2 |
| `src/boards/decks/factory-types.ts` | `src/boards/decks/factory-types.ts` | DeckInstance, DeckFactoryContext, DeckFactory |
| `src/boards/decks/generators-factory.ts` | `src/boards/decks/generators-factory.ts` | generatorsDeckFactory |
| `src/boards/decks/index.ts` | `src/boards/decks/index.ts` |  |
| `src/boards/decks/routing-integration.ts` | `src/boards/decks/routing-integration.ts` | AudioNodeInfo, registerAudioDeckForRouting, unregisterAudioDeckFromRouting, +10 |
| `src/boards/decks/runtime-types.ts` | `src/boards/decks/runtime-types.ts` | DeckRuntimeState, DEFAULT_DECK_RUNTIME_STATE, BoardDeckStates, +3 |
| `src/boards/decks/tab-manager.ts` | `src/boards/decks/tab-manager.ts` | DeckTab, DeckTabState, createDefaultTabState, +19 |
| `src/boards/gating/capabilities.ts` | `src/boards/gating/capabilities.ts` | BoardCapabilities, computeBoardCapabilities, hasCapability, +1 |
| `src/boards/gating/card-kinds.ts` | `src/boards/gating/card-kinds.ts` | BoardCardKind, classifyCard, getAllowedKindsForControlLevel, +2 |
| `src/boards/gating/get-allowed-cards.ts` | `src/boards/gating/get-allowed-cards.ts` | getAllowedCardEntries, getAllCardEntries, getAllowedCardMeta, +4 |
| `src/boards/gating/index.ts` | `src/boards/gating/index.ts` |  |
| `src/boards/gating/instrument-card-adapter.ts` | `src/boards/gating/instrument-card-adapter.ts` | getInstrumentCardKind, instrumentToCardMeta, isInstrumentAllowed, +7 |
| `src/boards/gating/is-card-allowed.ts` | `src/boards/gating/is-card-allowed.ts` | isCardAllowed, filterAllowedCards, partitionCardsByAllowance |
| `src/boards/gating/ontology-gating.ts` | `src/boards/gating/ontology-gating.ts` | OntologyGateResult, OntologyGateContext, normalizeOntologySelection, +8 |
| `src/boards/gating/port-conversion.ts` | `src/boards/gating/port-conversion.ts` | PortAdapter, BUILTIN_ADAPTERS, registerPortAdapter, +5 |
| `src/boards/gating/tool-visibility.ts` | `src/boards/gating/tool-visibility.ts` | computeVisibleDeckTypes, isDeckTypeVisible, filterVisibleDecks |
| `src/boards/gating/validate-connection.ts` | `src/boards/gating/validate-connection.ts` | ConnectionValidation, validateConnection, PORT_COMPATIBILITY_MATRIX, +6 |
| `src/boards/gating/validate-deck-drop.ts` | `src/boards/gating/validate-deck-drop.ts` | DeckDropValidation, validateDeckDrop, validateDeckDropBatch, +1 |
| `src/boards/gating/why-not.ts` | `src/boards/gating/why-not.ts` | whyNotAllowed |
| `src/boards/generators/actions.ts` | `src/boards/generators/actions.ts` | GenerationResult, GenerateIntoNewClipOptions, RegenerateOptions, +6 |
| `src/boards/harmony/coloring.ts` | `src/boards/harmony/coloring.ts` | NoteClass, HarmonyContext, classifyNote, +5 |
| `src/boards/harmony/index.ts` | `src/boards/harmony/index.ts` |  |
| `src/boards/index.ts` | `src/boards/index.ts` |  |
| `src/boards/init.ts` | `src/boards/init.ts` | initializeBoardSystem, getCurrentBoardId, getCurrentBoard |
| `src/boards/integration/board-switch-integration.ts` | `src/boards/integration/board-switch-integration.ts` | BoardSwitchListener, initBoardSwitchIntegration, onBoardSwitch, +5 |
| `src/boards/integration/index.ts` | `src/boards/integration/index.ts` |  |
| `src/boards/layout/adapter.ts` | `src/boards/layout/adapter.ts` | createDefaultLayoutRuntime, mergePersistedLayout, resetPanelState |
| `src/boards/layout/assign-decks-to-panels.ts` | `src/boards/layout/assign-decks-to-panels.ts` | DeckPanelAssignment, PanelDeckAssignment, assignDecksToPanels, +3 |
| `src/boards/layout/deserialize.ts` | `src/boards/layout/deserialize.ts` | deserializeLayoutRuntime, layoutRuntimeFromJSON |
| `src/boards/layout/guards.ts` | `src/boards/layout/guards.ts` | isValidSerializedLayout, sanitizeSerializedLayout |
| `src/boards/layout/index.ts` | `src/boards/layout/index.ts` |  |
| `src/boards/layout/runtime-types.ts` | `src/boards/layout/runtime-types.ts` | PanelSize, DockNodeType, PanelRuntime, +5 |
| `src/boards/layout/serialize.ts` | `src/boards/layout/serialize.ts` | SerializedLayoutRuntime, SerializedPanel, SerializedDockNode, +3 |
| `src/boards/personas/index.ts` | `src/boards/personas/index.ts` |  |
| `src/boards/personas/notation-composer-enhancements.ts` | `src/boards/personas/notation-composer-enhancements.ts` | ClefType, StaffConfig, MeasureBeatInfo, +12 |
| `src/boards/personas/producer-enhancements.ts` | `src/boards/personas/producer-enhancements.ts` | BusConfiguration, FreezeOptions, ExportSettings, +17 |
| `src/boards/personas/sound-designer-enhancements.ts` | `src/boards/personas/sound-designer-enhancements.ts` | ParameterSnapshot, ModulationSource, ModulationDestination, +24 |
| `src/boards/personas/tracker-user-enhancements.ts` | `src/boards/personas/tracker-user-enhancements.ts` | PatternContextMenuItem, GrooveTemplate, TransformOptions, +8 |
| `src/boards/policy.ts` | `src/boards/policy.ts` | getBoardPolicy, canCustomize, canToggleTools, +4 |
| `src/boards/project/create.ts` | `src/boards/project/create.ts` | createNewProject, getNewProjectSeedIds, addStreamToProject, +3 |
| `src/boards/project/index.ts` | `src/boards/project/index.ts` |  |
| `src/boards/project/template-registry.ts` | `src/boards/project/template-registry.ts` | ProjectTemplate, ProjectTemplateContent, getTemplateRegistry, +1 |
| `src/boards/project/types.ts` | `src/boards/project/types.ts` | Project, DEFAULT_PROJECT |
| `src/boards/recommendations.ts` | `src/boards/recommendations.ts` | getRecommendedBoardIds, getRecommendedBoards, getDefaultBoardId, +1 |
| `src/boards/registry.ts` | `src/boards/registry.ts` | BoardRegistryListener, BoardRegistryEvent, BoardRegistry, +2 |
| `src/boards/settings/board-settings-panel.ts` | `src/boards/settings/board-settings-panel.ts` | BoardSettingsPanelConfig, VisualDensity, BoardDisplaySettings, +4 |
| `src/boards/settings/index.ts` | `src/boards/settings/index.ts` |  |
| `src/boards/settings/per-track-control.ts` | `src/boards/settings/per-track-control.ts` | TrackId, TrackControlLevel, PerTrackControlLevels, +19 |
| `src/boards/settings/store.ts` | `src/boards/settings/store.ts` | BoardSettingsStore, getBoardSettingsStore, getBoardSettings, +3 |
| `src/boards/settings/types.ts` | `src/boards/settings/types.ts` | HarmonySettings, VisualDensitySettings, GeneratorSettings, +4 |
| `src/boards/settings/visual-density.ts` | `src/boards/settings/visual-density.ts` | VisualDensity, DensityPreset, DENSITY_PRESETS, +3 |
| `src/boards/store/storage.ts` | `src/boards/store/storage.ts` | loadBoardState, saveBoardState, clearBoardState |
| `src/boards/store/store.ts` | `src/boards/store/store.ts` | BoardStateStore, getBoardStateStore, resetBoardStateStore |
| `src/boards/store/types.ts` | `src/boards/store/types.ts` | BoardState, LayoutState, DeckState, +8 |
| `src/boards/switching/capture-to-manual.ts` | `src/boards/switching/capture-to-manual.ts` | CaptureToManualOptions, CaptureToManualResult, captureToManualBoard, +2 |
| `src/boards/switching/index.ts` | `src/boards/switching/index.ts` |  |
| `src/boards/switching/migration-plan.ts` | `src/boards/switching/migration-plan.ts` | BoardMigrationPlan, createMigrationPlan, shouldPreserveDeck, +1 |
| `src/boards/switching/switch-board.ts` | `src/boards/switching/switch-board.ts` | switchBoard, switchToPreviousBoard, switchToNextBoard |
| `src/boards/switching/types.ts` | `src/boards/switching/types.ts` | BoardSwitchOptions, DEFAULT_SWITCH_OPTIONS |
| `src/boards/templates/builtins.ts` | `src/boards/templates/builtins.ts` | lofiHipHopTemplate, ambientTemplate, stringQuartetTemplate, +7 |
| `src/boards/templates/index.ts` | `src/boards/templates/index.ts` |  |
| `src/boards/templates/loader.ts` | `src/boards/templates/loader.ts` |  |
| `src/boards/templates/registry.ts` | `src/boards/templates/registry.ts` | TemplateRegistry, getTemplateRegistry, resetTemplateRegistry |
| `src/boards/templates/types.ts` | `src/boards/templates/types.ts` | TemplateDifficulty, TemplateGenre, TemplateMetadata, +7 |
| `src/boards/theme/board-theme-defaults.ts` | `src/boards/theme/board-theme-defaults.ts` | getDefaultBoardTheme, BOARD_THEME_OVERRIDES, mergeBoardTheme, +1 |
| `src/boards/theme/control-level-colors.ts` | `src/boards/theme/control-level-colors.ts` | ControlLevelColors, CONTROL_LEVEL_COLORS, getControlLevelColors, +4 |
| `src/boards/theme/index.ts` | `src/boards/theme/index.ts` |  |
| `src/boards/theme/manager.ts` | `src/boards/theme/manager.ts` | ThemeVariant, BoardThemeSettings, BoardThemeManager, +1 |
| `src/boards/theme/registry.ts` | `src/boards/theme/registry.ts` | ThemeId, ThemeColorPalette, ThemeTypography, +6 |
| `src/boards/theme/theme-applier.ts` | `src/boards/theme/theme-applier.ts` | boardThemeToCSSProperties, applyBoardTheme, removeBoardTheme, +2 |
| `src/boards/types.ts` | `src/boards/types.ts` | ControlLevel, ViewType, BoardDifficulty, +38 |
| `src/boards/ui/board-settings-panel.ts` | `src/boards/ui/board-settings-panel.ts` | BoardSettingsConfig, createBoardSettingsPanel |
| `src/boards/ui/icons.ts` | `src/boards/ui/icons.ts` | IconName, CONTROL_LEVEL_ICONS, VIEW_TYPE_ICONS, +8 |
| `src/boards/ui/theme-applier.ts` | `src/boards/ui/theme-applier.ts` | applyBoardTheme, clearBoardTheme, injectBoardThemeStyles |
| `src/boards/validate-tool-config.ts` | `src/boards/validate-tool-config.ts` | ToolConfigWarning, validateToolConfig, hasToolConfigWarnings, +2 |
| `src/boards/validate.ts` | `src/boards/validate.ts` | ValidationError, ValidationResult, validateBoard, +1 |
| `src/canon/cadence-aliases.ts` | `src/canon/cadence-aliases.ts` | CANONICAL_CADENCE_TYPES, CanonicalCadenceType, EXTENDED_CADENCE_TYPES, +13 |
| `src/canon/card-id.ts` | `src/canon/card-id.ts` | CardId, BUILTIN_CARD_IDS, BuiltinCardId, +8 |
| `src/canon/card-kind.ts` | `src/canon/card-kind.ts` | CardKind, ControlLevel, ControlLevelBranded, +8 |
| `src/canon/cardplay-id.ts` | `src/canon/cardplay-id.ts` | ParsedCardPlayId, CardPlayIdOptions, parseCardPlayId, +10 |
| `src/canon/constraint-types.ts` | `src/canon/constraint-types.ts` | KEY_CONSTRAINT_TYPES, METER_CONSTRAINT_TYPES, HARMONY_CONSTRAINT_TYPES, +15 |
| `src/canon/event-kinds.ts` | `src/canon/event-kinds.ts` | CanonicalEventKind, CANONICAL_EVENT_KINDS, CANONICAL_EVENT_KIND_LIST, +9 |
| `src/canon/feature-ids.ts` | `src/canon/feature-ids.ts` | FeatureId, FeatureCategory, EDITOR_FEATURES, +11 |
| `src/canon/host-action-wire.ts` | `src/canon/host-action-wire.ts` | HOST_ACTION_TYPES, HostActionType, isValidHostActionType, +12 |
| `src/canon/id-validation.ts` | `src/canon/id-validation.ts` | RESERVED_NAMESPACES, ReservedNamespace, BuiltinId, +15 |
| `src/canon/ids.ts` | `src/canon/ids.ts` | DeckType, DECK_TYPES, isDeckType, +13 |
| `src/canon/index.ts` | `src/canon/index.ts` |  |
| `src/canon/legacy-aliases.ts` | `src/canon/legacy-aliases.ts` | LEGACY_DECK_TYPE_ALIASES, DEPRECATED_DECK_TYPES, CADENCE_ABBREVIATIONS, +9 |
| `src/canon/migrations.ts` | `src/canon/migrations.ts` | registerStandardMigrations, migrateState |
| `src/canon/mode-aliases.ts` | `src/canon/mode-aliases.ts` | CANONICAL_MODE_NAMES, CanonicalModeName, MODE_ALIASES, +13 |
| `src/canon/namespaced-id.ts` | `src/canon/namespaced-id.ts` | NamespacedId, ParsedNamespacedId, isNamespacedId, +10 |
| `src/canon/port-types.ts` | `src/canon/port-types.ts` | CanonicalPortType, PortDirection, PortSpec, +12 |
| `src/canon/serialization.ts` | `src/canon/serialization.ts` | SerializationOptions, stableStringify, serializeVersioned, +8 |
| `src/canon/versioning.ts` | `src/canon/versioning.ts` | SchemaVersion, createSchemaVersion, parseSchemaVersion, +14 |
| `src/cards/adapter.ts` | `src/cards/adapter.ts` | AdapterCategory, Adapter, AdapterRegistryEntry, +33 |
| `src/cards/advanced-effects.ts` | `src/cards/advanced-effects.ts` | ImpulseResponse, BUILTIN_IMPULSES, ConvolutionState, +22 |
| `src/cards/analysis.ts` | `src/cards/analysis.ts` | AudioBufferLike, PitchDetection, ChordDetection, +38 |
| `src/cards/arpeggiator.ts` | `src/cards/arpeggiator.ts` | ArpDirection, ArpRate, OctaveMode, +17 |
| `src/cards/arranger-phrase-adapter.ts` | `src/cards/arranger-phrase-adapter.ts` | ArrangementBlock, ChordContext, ScaleContext, +6 |
| `src/cards/arranger.ts` | `src/cards/arranger.ts` | SongPartType, SongPart, SongStructure, +286 |
| `src/cards/audio-transforms.ts` | `src/cards/audio-transforms.ts` | AudioBuffer, createAudioBuffer, cloneAudioBuffer, +51 |
| `src/cards/bassline.ts` | `src/cards/bassline.ts` | BassEngine, OscWaveform, FilterType, +30 |
| `src/cards/card-filtering.ts` | `src/cards/card-filtering.ts` | categoryToKind, getCardKind, isCardAllowed, +3 |
| `src/cards/card-visuals.ts` | `src/cards/card-visuals.ts` | CardAnimation, CardVisuals, CardBadgeType, +135 |
| `src/cards/card.ts` | `src/cards/card.ts` | PortType, PortTypes, PortTypeEntry, +39 |
| `src/cards/choir.ts` | `src/cards/choir.ts` | MAX_CHOIR_VOICES, NUM_FORMANTS, SAMPLE_RATE, +31 |
| `src/cards/chord-progression.ts` | `src/cards/chord-progression.ts` | NOTE_NAMES, NoteName, ENHARMONIC_MAP, +25 |
| `src/cards/drum-kit.ts` | `src/cards/drum-kit.ts` | PAD_COUNT, MAX_VELOCITY_LAYERS, MAX_ROUND_ROBIN, +28 |
| `src/cards/drum-machine.ts` | `src/cards/drum-machine.ts` | FreesoundSample, SampleCache, globalSampleCache, +22 |
| `src/cards/effects.ts` | `src/cards/effects.ts` | EffectBypass, DEFAULT_BYPASS, BaseEffectState, +73 |
| `src/cards/freesound-search.ts` | `src/cards/freesound-search.ts` | SearchState, FreesoundSearchParams, FreesoundSearchState, +16 |
| `src/cards/generator-card-uis.ts` | `src/cards/generator-card-uis.ts` | DRUM_MACHINE_VISUALS, DRUM_MACHINE_PARAMETERS, DRUM_MACHINE_PRESETS, +45 |
| `src/cards/generator-mixin.ts` | `src/cards/generator-mixin.ts` | GeneratorState, GeneratorConfig, NoteParams, +21 |
| `src/cards/generator-notation-bridge.ts` | `src/cards/generator-notation-bridge.ts` | GeneratorCardType, GeneratedNote, MultiVoiceOutput, +13 |
| `src/cards/generator-output.ts` | `src/cards/generator-output.ts` | GeneratorType, GeneratorOutputConfig, GeneratedEventMetadata, +7 |
| `src/cards/generators.ts` | `src/cards/generators.ts` | DrumPad, DEFAULT_DRUM_PAD_NAMES, DEFAULT_DRUM_PAD_NOTES, +89 |
| `src/cards/graph.ts` | `src/cards/graph.ts` | Position, GraphNode, GraphEdge, +35 |
| `src/cards/index.ts` | `src/cards/index.ts` |  |
| `src/cards/keyboard-instruments.ts` | `src/cards/keyboard-instruments.ts` | PianoType, ElectricPianoType, MalletType, +27 |
| `src/cards/lead-synth.ts` | `src/cards/lead-synth.ts` | MAX_OSCILLATORS, MAX_POLYPHONY, SAMPLE_RATE, +32 |
| `src/cards/legacy-card-adapters.ts` | `src/cards/legacy-card-adapters.ts` | LegacyCardEvent, LegacyPattern, LegacyAdapterConfig, +12 |
| `src/cards/loop-player.ts` | `src/cards/loop-player.ts` | MAX_LAYERS, MAX_SLICES, MIN_TEMPO, +33 |
| `src/cards/macro-controls.ts` | `src/cards/macro-controls.ts` | MacroMapping, MacroMappingOptions, createMacroMapping, +56 |
| `src/cards/melody.ts` | `src/cards/melody.ts` | NOTE_NAMES, NoteName, ScaleDefinition, +21 |
| `src/cards/modulation.ts` | `src/cards/modulation.ts` | ModulationSourceType, LfoWaveform, LfoSyncMode, +40 |
| `src/cards/orchestral-cards.ts` | `src/cards/orchestral-cards.ts` | EnsembleInput, EnsembleOutput, VoiceLeadingConfig, +21 |
| `src/cards/organ.ts` | `src/cards/organ.ts` | NUM_DRAWBARS, DRAWBAR_FOOTAGES, DRAWBAR_HARMONICS, +38 |
| `src/cards/pad-synth.ts` | `src/cards/pad-synth.ts` | MAX_OSCILLATORS, MAX_UNISON, MAX_POLYPHONY, +31 |
| `src/cards/parameters.ts` | `src/cards/parameters.ts` | ParameterCurve, applyCurve, invertCurve, +71 |
| `src/cards/phrase-adapter.ts` | `src/cards/phrase-adapter.ts` | AdaptationMode, GamakaOrnament, AdaptationOptions, +29 |
| `src/cards/phrase-cards.ts` | `src/cards/phrase-cards.ts` | PHRASE_GENERATOR_CARD, PHRASE_BROWSER_CARD, PHRASE_VARIATION_CARD, +1 |
| `src/cards/phrase-midi.ts` | `src/cards/phrase-midi.ts` | MIDIFormat, MIDIEventType, MIDIMetaType, +10 |
| `src/cards/phrase-system.ts` | `src/cards/phrase-system.ts` | ShapeContour, ContourPoint, RhythmPattern, +118 |
| `src/cards/phrase-variations.ts` | `src/cards/phrase-variations.ts` | VariationType, VariationConfig, VariationResult, +5 |
| `src/cards/preset-sync.ts` | `src/cards/preset-sync.ts` | PresetSyncConfig, PresetSyncStatus, PresetSyncResult, +4 |
| `src/cards/presets.ts` | `src/cards/presets.ts` | Preset, CreatePresetOptions, createPreset, +49 |
| `src/cards/protocol.ts` | `src/cards/protocol.ts` | Protocol, ProtocolMethod, ProtocolRegistryEntry, +39 |
| `src/cards/recording-manager.ts` | `src/cards/recording-manager.ts` | RecordingMode, RecordedEvent, RecordingBuffer, +34 |
| `src/cards/registry.ts` | `src/cards/registry.ts` | CardVersion, parseVersion, formatVersion, +23 |
| `src/cards/sampler-instrument-adapter.ts` | `src/cards/sampler-instrument-adapter.ts` | SamplerConfig, SampleZone, SamplerInstrumentAdapter, +1 |
| `src/cards/sampler.ts` | `src/cards/sampler.ts` | MAX_ZONES, MAX_VELOCITY_LAYERS, MAX_ROUND_ROBIN, +37 |
| `src/cards/score-notation.ts` | `src/cards/score-notation.ts` | InternalNotationEvent, InternalNotationMeasure, ScoreNoteInput, +16 |
| `src/cards/sequencer.ts` | `src/cards/sequencer.ts` | NOTE_NAMES, NoteName, MAX_STEPS, +21 |
| `src/cards/stack.ts` | `src/cards/stack.ts` | StackMode, StackEntry, StackSnapshot, +30 |
| `src/cards/testing/advanced-testing.ts` | `src/cards/testing/advanced-testing.ts` | SnapshotTester, PerformanceBenchmark, MemoryLeakDetector, +3 |
| `src/cards/testing/card-test.ts` | `src/cards/testing/card-test.ts` | CardTest, UnitTest, IntegrationTest, +22 |
| `src/cards/testing/coverage-reporting.ts` | `src/cards/testing/coverage-reporting.ts` | CoverageData, CoverageReporter, CICDIntegration, +4 |
| `src/cards/testing/index.ts` | `src/cards/testing/index.ts` |  |
| `src/cards/testing/specialized-testing.ts` | `src/cards/testing/specialized-testing.ts` | CPUProfiler, AudioComparisonTester, EventComparisonTester, +9 |
| `src/cards/testing/test-runner.ts` | `src/cards/testing/test-runner.ts` | UnitTestRunner, IntegrationTestFramework, CardTestRunner, +1 |
| `src/cards/transforms.ts` | `src/cards/transforms.ts` | MidiNoteEvent, ScaleDefinition, SCALES, +56 |
| `src/cards/utility.ts` | `src/cards/utility.ts` | StereoSample, AudioBufferLike, SplitterOutput, +83 |
| `src/community/sample-packs/browser.ts` | `src/community/sample-packs/browser.ts` | SamplePackBrowserOptions, SamplePackBrowser |
| `src/community/sample-packs/builtins.ts` | `src/community/sample-packs/builtins.ts` | lofiDrumsPack, synthOneShotsPack, orchestralSamplesPack, +1 |
| `src/community/sample-packs/index.ts` | `src/community/sample-packs/index.ts` |  |
| `src/community/sample-packs/install.ts` | `src/community/sample-packs/install.ts` | InstallOptions, InstallResult, areSamplesAvailable |
| `src/community/sample-packs/register.ts` | `src/community/sample-packs/register.ts` | registerBuiltinSamplePacks |
| `src/community/sample-packs/registry.ts` | `src/community/sample-packs/registry.ts` | getSamplePackRegistry, resetSamplePackRegistry |
| `src/community/sample-packs/types.ts` | `src/community/sample-packs/types.ts` | SampleCategory, SamplePackDifficulty, SampleMetadata, +3 |
| `src/containers/chord-track.ts` | `src/containers/chord-track.ts` | ChordQuality, ChordExtension, ChordAlteration, +16 |
| `src/containers/container.ts` | `src/containers/container.ts` | ContainerId, generateContainerId, asContainerId, +47 |
| `src/containers/index.ts` | `src/containers/index.ts` |  |
| `src/demo/main.ts` | `src/demo/main.ts` |  |
| `src/events/index.ts` | `src/events/index.ts` |  |
| `src/events/operations.ts` | `src/events/operations.ts` | eventOverlaps, eventContains, eventContainsTick, +17 |
| `src/events/serialization.ts` | `src/events/serialization.ts` | EventJSON, TriggerJSON, LaneJSON, +11 |
| `src/export/board-export.ts` | `src/export/board-export.ts` | BoardExportManifest, BoardExportData, BoardImportOptions, +7 |
| `src/export/collaboration-metadata.ts` | `src/export/collaboration-metadata.ts` | Contributor, ContributorRole, ChangelogEntry, +13 |
| `src/export/comments.ts` | `src/export/comments.ts` | Comment, AttachmentType, CommentThread, +18 |
| `src/export/deck-preset-export.ts` | `src/export/deck-preset-export.ts` | DeckPresetManifest, DeckPresetData, DeckPresetImportOptions, +7 |
| `src/export/pdf-export.ts` | `src/export/pdf-export.ts` | PDFExportOptions, PDFExportResult, downloadPDF, +1 |
| `src/export/project-diff.ts` | `src/export/project-diff.ts` | ProjectSnapshot, RouteConnection, StreamDiff, +9 |
| `src/export/project-exchange.ts` | `src/export/project-exchange.ts` |  |
| `src/export/project-export.ts` | `src/export/project-export.ts` | ProjectExportOptions, ProjectMetadata, ProjectArchive, +10 |
| `src/export/project-import.ts` | `src/export/project-import.ts` | ProjectImportOptions, ImportConflict, ImportProgress, +2 |
| `src/export/stem-export.ts` | `src/export/stem-export.ts` | ExportFormat, BitDepth, SampleRate, +18 |
| `src/extensions/capabilities.ts` | `src/extensions/capabilities.ts` | CapabilityRiskLevel, CAPABILITIES, Capability, +13 |
| `src/extensions/discovery.ts` | `src/extensions/discovery.ts` | DiscoveryPaths, getDefaultDiscoveryPaths, DiscoveryResult, +3 |
| `src/extensions/errors.ts` | `src/extensions/errors.ts` | ExtensionErrorCode, ExtensionError, InvalidIdError, +6 |
| `src/extensions/examples/euclidean-rhythm-generator.ts` | `src/extensions/examples/euclidean-rhythm-generator.ts` | manifest |
| `src/extensions/examples/microtonal-scale-deck.ts` | `src/extensions/examples/microtonal-scale-deck.ts` | manifest |
| `src/extensions/hot-reload.ts` | `src/extensions/hot-reload.ts` | HotReloadConfig, ReloadResult, ReloadListener, +1 |
| `src/extensions/index.ts` | `src/extensions/index.ts` |  |
| `src/extensions/load-order.ts` | `src/extensions/load-order.ts` | PackDependency, LoadablePack, LoadConflict, +6 |
| `src/extensions/logging.ts` | `src/extensions/logging.ts` | LogLevel, RegistryAction, EntityType, +12 |
| `src/extensions/missing-behavior.ts` | `src/extensions/missing-behavior.ts` | PackMissingBehavior, EntityMissingBehavior, MissingBehaviorPolicy, +22 |
| `src/extensions/pack-storage.ts` | `src/extensions/pack-storage.ts` | NamespacedStorageKey, StorageEntry, PackStorageManager, +3 |
| `src/extensions/permissions.ts` | `src/extensions/permissions.ts` | hasPermission, hasAllPermissions, hasAnyPermission, +9 |
| `src/extensions/registry.ts` | `src/extensions/registry.ts` | ExtensionRegistry, extensionRegistry, PackInfo, +3 |
| `src/extensions/types.ts` | `src/extensions/types.ts` | ExtensionVersion, ExtensionCategory, ExtensionManifest, +24 |
| `src/extensions/validate.ts` | `src/extensions/validate.ts` | validateExtensionManifest, isCompatibleVersion |
| `src/extensions/validators.ts` | `src/extensions/validators.ts` | RegistryTrustLevel, RegistryEntryProvenance, createBuiltinProvenance, +12 |
| `src/gofai/canon/adjectives-audio-descriptors-batch38.ts` | `src/gofai/canon/adjectives-audio-descriptors-batch38.ts` | FREQUENCY_ADJECTIVES, TIME_DOMAIN_ADJECTIVES, SPATIAL_ADJECTIVES, +6 |
| `src/gofai/canon/adjectives-emotional-mood-character.ts` | `src/gofai/canon/adjectives-emotional-mood-character.ts` | AdjectiveLexeme, POSITIVE_EMOTIONAL_ADJECTIVES, NEGATIVE_EMOTIONAL_ADJECTIVES, +3 |
| `src/gofai/canon/adjectives-harmony-emotion.ts` | `src/gofai/canon/adjectives-harmony-emotion.ts` | TENSION_ADJECTIVES, TONAL_COLOR_ADJECTIVES, EMOTIONAL_ADJECTIVES, +6 |
| `src/gofai/canon/adjectives-production-timbre.ts` | `src/gofai/canon/adjectives-production-timbre.ts` | AdjectiveLexeme, BRIGHTNESS_ADJECTIVES, CLARITY_ADJECTIVES, +7 |
| `src/gofai/canon/adjectives-rhythm-energy.ts` | `src/gofai/canon/adjectives-rhythm-energy.ts` | ENERGY_ADJECTIVES, GROOVE_ADJECTIVES, BUSYNESS_ADJECTIVES, +6 |
| `src/gofai/canon/adjectives-texture-spatial-complexity.ts` | `src/gofai/canon/adjectives-texture-spatial-complexity.ts` | AdjectiveLexeme, TEXTURAL_ADJECTIVES, SPATIAL_ADJECTIVES, +2 |
| `src/gofai/canon/capability-model.ts` | `src/gofai/canon/capability-model.ts` | CapabilityCategory, CapabilityId, CapabilityPermission, +14 |
| `src/gofai/canon/change-control.ts` | `src/gofai/canon/change-control.ts` | ChangeProposalId, changeProposalId, ChangeType, +15 |
| `src/gofai/canon/check.ts` | `src/gofai/canon/check.ts` | ValidationError, ValidationResult, VocabularyCategory, +11 |
| `src/gofai/canon/constraint-types.ts` | `src/gofai/canon/constraint-types.ts` | CORE_CONSTRAINT_TYPES, CONSTRAINT_TYPES_TABLE, getConstraintTypeById, +9 |
| `src/gofai/canon/cpl-types.ts` | `src/gofai/canon/cpl-types.ts` | CPLNodeType, CPLNode, Provenance, +30 |
| `src/gofai/canon/default-interpretations.ts` | `src/gofai/canon/default-interpretations.ts` | DefaultInterpretation, DefaultId, createDefaultId, +11 |
| `src/gofai/canon/degree-modifiers-batch32.ts` | `src/gofai/canon/degree-modifiers-batch32.ts` | DegreeCategory, DegreeStrength, Polarity, +27 |
| `src/gofai/canon/domain-adjectives-batch26-conversational.ts` | `src/gofai/canon/domain-adjectives-batch26-conversational.ts` | ConversationalAdjective, CONVERSATIONAL_POSITIVE, CONVERSATIONAL_NEGATIVE, +9 |
| `src/gofai/canon/domain-adverbs-batch28.ts` | `src/gofai/canon/domain-adverbs-batch28.ts` | AdverbLexeme, AdverbCategory, AdverbSemantics, +8 |
| `src/gofai/canon/domain-nouns-batch10.ts` | `src/gofai/canon/domain-nouns-batch10.ts` | DynamicsArticulationLexeme, DYNAMICS_ARTICULATION_LEXEMES, getDynamicLevelByName, +5 |
| `src/gofai/canon/domain-nouns-batch11.ts` | `src/gofai/canon/domain-nouns-batch11.ts` | StyleGenreLexeme, STYLE_GENRE_LEXEMES, getStyleByName, +7 |
| `src/gofai/canon/domain-nouns-batch12.ts` | `src/gofai/canon/domain-nouns-batch12.ts` | EXTENDED_TECHNIQUE_NOUNS, TEXTURAL_CONCEPT_NOUNS, RHYTHMIC_CONCEPT_NOUNS, +3 |
| `src/gofai/canon/domain-nouns-batch13.ts` | `src/gofai/canon/domain-nouns-batch13.ts` | ORCHESTRATION_NOUNS, ROLE_NOUNS, TEXTURAL_TECHNIQUE_NOUNS, +3 |
| `src/gofai/canon/domain-nouns-batch14.ts` | `src/gofai/canon/domain-nouns-batch14.ts` | SYNTHESIS_NOUNS, SOUND_DESIGN_NOUNS, PRODUCTION_EFFECT_NOUNS, +3 |
| `src/gofai/canon/domain-nouns-batch15.ts` | `src/gofai/canon/domain-nouns-batch15.ts` | VOCAL_TECHNIQUE_NOUNS, VOCAL_ARRANGEMENT_NOUNS, VOCAL_PRODUCTION_NOUNS, +3 |
| `src/gofai/canon/domain-nouns-batch16-expression.ts` | `src/gofai/canon/domain-nouns-batch16-expression.ts` | EXPRESSION_ARTICULATION_LEXEMES |
| `src/gofai/canon/domain-nouns-batch17-genres.ts` | `src/gofai/canon/domain-nouns-batch17-genres.ts` | GENRE_STYLE_LEXEMES |
| `src/gofai/canon/domain-nouns-batch18-production.ts` | `src/gofai/canon/domain-nouns-batch18-production.ts` | PRODUCTION_MIXING_LEXEMES |
| `src/gofai/canon/domain-nouns-batch19-dynamics-expression.ts` | `src/gofai/canon/domain-nouns-batch19-dynamics-expression.ts` | DynamicsLexeme, DYNAMICS_CORE_LEXEMES, DYNAMICS_EXPRESSION_LEXEMES, +1 |
| `src/gofai/canon/domain-nouns-batch2.ts` | `src/gofai/canon/domain-nouns-batch2.ts` | DOMAIN_NOUNS_BATCH_2 |
| `src/gofai/canon/domain-nouns-batch20-phrasing-flow.ts` | `src/gofai/canon/domain-nouns-batch20-phrasing-flow.ts` | PhrasingLexeme, PHRASE_STRUCTURE_LEXEMES, PHRASING_FLOW_LEXEMES, +1 |
| `src/gofai/canon/domain-nouns-batch21-harmony-theory.ts` | `src/gofai/canon/domain-nouns-batch21-harmony-theory.ts` | HarmonyLexeme, BASIC_CHORD_LEXEMES, HARMONY_THEORY_LEXEMES, +1 |
| `src/gofai/canon/domain-nouns-batch22-rhythmic-patterns.ts` | `src/gofai/canon/domain-nouns-batch22-rhythmic-patterns.ts` | RhythmicLexeme, TIME_FEEL_LEXEMES, SUBDIVISION_LEXEMES, +6 |
| `src/gofai/canon/domain-nouns-batch23-timbre-sound-design.ts` | `src/gofai/canon/domain-nouns-batch23-timbre-sound-design.ts` | TimbreLexeme, SPECTRAL_QUALITY_LEXEMES, TEXTURAL_QUALITY_LEXEMES, +6 |
| `src/gofai/canon/domain-nouns-batch24-emotional-affective.ts` | `src/gofai/canon/domain-nouns-batch24-emotional-affective.ts` | EmotionalLexeme, POSITIVE_HIGH_AROUSAL_LEXEMES, POSITIVE_LOW_AROUSAL_LEXEMES, +7 |
| `src/gofai/canon/domain-nouns-batch25-form-structure.ts` | `src/gofai/canon/domain-nouns-batch25-form-structure.ts` | FormLexeme, SONG_SECTION_LEXEMES, CLASSICAL_FORM_LEXEMES, +6 |
| `src/gofai/canon/domain-nouns-batch3.ts` | `src/gofai/canon/domain-nouns-batch3.ts` | DOMAIN_NOUNS_BATCH_3 |
| `src/gofai/canon/domain-nouns-batch30-gestures.ts` | `src/gofai/canon/domain-nouns-batch30-gestures.ts` | GestureLexeme, BUILD_RELEASE_GESTURES, FILL_GESTURES, +6 |
| `src/gofai/canon/domain-nouns-batch4.ts` | `src/gofai/canon/domain-nouns-batch4.ts` | DOMAIN_NOUNS_BATCH_4 |
| `src/gofai/canon/domain-nouns-batch5.ts` | `src/gofai/canon/domain-nouns-batch5.ts` | DOMAIN_NOUNS_BATCH5, BATCH5_COUNT, getFormStructureNounById, +1 |
| `src/gofai/canon/domain-nouns-batch6.ts` | `src/gofai/canon/domain-nouns-batch6.ts` | DOMAIN_NOUNS_BATCH6, BATCH6_COUNT, getProductionNounById, +1 |
| `src/gofai/canon/domain-nouns-batch7.ts` | `src/gofai/canon/domain-nouns-batch7.ts` | DOMAIN_NOUNS_BATCH7, BATCH7_COUNT, getRhythmNounById, +1 |
| `src/gofai/canon/domain-nouns-batch8.ts` | `src/gofai/canon/domain-nouns-batch8.ts` | PitchHarmonyLexeme, PITCH_HARMONY_LEXEMES, getPitchClassByName, +5 |
| `src/gofai/canon/domain-nouns-batch9.ts` | `src/gofai/canon/domain-nouns-batch9.ts` | MelodyLexeme, MELODY_LEXEMES, getMelodyElementByName, +5 |
| `src/gofai/canon/domain-nouns-harmony-melody-batch1.ts` | `src/gofai/canon/domain-nouns-harmony-melody-batch1.ts` | BASIC_HARMONY_NOUNS, FUNCTIONAL_HARMONY_NOUNS, MELODY_NOUNS, +5 |
| `src/gofai/canon/domain-nouns-instruments.ts` | `src/gofai/canon/domain-nouns-instruments.ts` | InstrumentCategory, InstrumentLexeme, NOUN_KICK, +39 |
| `src/gofai/canon/domain-nouns-music-theory-batch39.ts` | `src/gofai/canon/domain-nouns-music-theory-batch39.ts` | TRIAD_NOUNS, SEVENTH_CHORD_NOUNS, CHORD_EXTENSION_NOUNS, +9 |
| `src/gofai/canon/domain-nouns-production-arrangement-batch1.ts` | `src/gofai/canon/domain-nouns-production-arrangement-batch1.ts` | ARRANGEMENT_NOUNS, MIXING_NOUNS, EFFECTS_NOUNS, +6 |
| `src/gofai/canon/domain-nouns-production-effects-batch40.ts` | `src/gofai/canon/domain-nouns-production-effects-batch40.ts` | DYNAMIC_PROCESSOR_NOUNS, TIME_BASED_EFFECTS_NOUNS, DISTORTION_SATURATION_NOUNS, +5 |
| `src/gofai/canon/domain-nouns-rhythm-tempo-batch1.ts` | `src/gofai/canon/domain-nouns-rhythm-tempo-batch1.ts` | RHYTHM_PATTERN_NOUNS, TEMPO_NOUNS, RHYTHM_ARTICULATION_NOUNS, +8 |
| `src/gofai/canon/domain-nouns-techniques.ts` | `src/gofai/canon/domain-nouns-techniques.ts` | TechniqueCategory, TechniqueLexeme, NOUN_STACCATO, +49 |
| `src/gofai/canon/domain-nouns.ts` | `src/gofai/canon/domain-nouns.ts` | DomainNounCategory, DomainNounSemantics, DomainNoun, +11 |
| `src/gofai/canon/domain-verbs-batch2.ts` | `src/gofai/canon/domain-verbs-batch2.ts` | DUPLICATION_VERBS, COMBINATION_VERBS, SEPARATION_VERBS, +4 |
| `src/gofai/canon/domain-verbs-batch27-commands.ts` | `src/gofai/canon/domain-verbs-batch27-commands.ts` | VerbLexeme, VerbConjugation, VerbCategory, +6 |
| `src/gofai/canon/domain-verbs-batch3.ts` | `src/gofai/canon/domain-verbs-batch3.ts` | TEMPORAL_VERBS, DYNAMIC_VERBS, HARMONIC_VERBS, +6 |
| `src/gofai/canon/domain-verbs-batch37-editing-operations.ts` | `src/gofai/canon/domain-verbs-batch37-editing-operations.ts` | STRUCTURAL_EDITING_VERBS, PARAMETER_ADJUSTMENT_VERBS, LAYER_CONTROL_VERBS, +6 |
| `src/gofai/canon/domain-verbs.ts` | `src/gofai/canon/domain-verbs.ts` | VerbLexeme, VerbConjugation, VerbCategory, +10 |
| `src/gofai/canon/edit-opcodes-phase5-batch1.ts` | `src/gofai/canon/edit-opcodes-phase5-batch1.ts` | OP_DUPLICATE_SECTION, OP_EXTEND_SECTION, OP_SHORTEN_SECTION, +22 |
| `src/gofai/canon/edit-opcodes-phase5-batch2.ts` | `src/gofai/canon/edit-opcodes-phase5-batch2.ts` | OP_ADD_ORNAMENTATION, OP_SHAPE_MELODIC_CONTOUR, OP_SHIFT_MELODY_REGISTER, +17 |
| `src/gofai/canon/edit-opcodes-register-pitch.ts` | `src/gofai/canon/edit-opcodes-register-pitch.ts` | OP_RAISE_REGISTER, OP_LOWER_REGISTER, OP_WIDEN_REGISTER_SPREAD, +12 |
| `src/gofai/canon/edit-opcodes-rhythm-timing.ts` | `src/gofai/canon/edit-opcodes-rhythm-timing.ts` | OP_QUANTIZE, OP_HUMANIZE, OP_ADJUST_SWING, +17 |
| `src/gofai/canon/edit-opcodes-texture-density.ts` | `src/gofai/canon/edit-opcodes-texture-density.ts` | OP_THIN_TEXTURE, OP_DENSIFY_TEXTURE, OP_ADJUST_NOTE_DENSITY, +11 |
| `src/gofai/canon/edit-opcodes.ts` | `src/gofai/canon/edit-opcodes.ts` | CORE_OPCODES, OPCODES_TABLE, getOpcodeById, +6 |
| `src/gofai/canon/effect-taxonomy.ts` | `src/gofai/canon/effect-taxonomy.ts` | EffectType, EffectCapability, EffectPolicy, +25 |
| `src/gofai/canon/entity-refs.ts` | `src/gofai/canon/entity-refs.ts` | SectionRefId, RangeRefId, LayerRefId, +84 |
| `src/gofai/canon/event-level-references.ts` | `src/gofai/canon/event-level-references.ts` | EventReferencePattern, EventReferenceCategory, EventReferenceExample, +7 |
| `src/gofai/canon/event-selector.ts` | `src/gofai/canon/event-selector.ts` | EventSelector, KindSelector, PitchRangeSelector, +75 |
| `src/gofai/canon/extension-semantics.ts` | `src/gofai/canon/extension-semantics.ts` | ExtensionSemanticNode, ExtensionNodeType, ExtensionProvenance, +28 |
| `src/gofai/canon/function-words-batch31.ts` | `src/gofai/canon/function-words-batch31.ts` | FunctionWordCategory, SemanticFunction, FunctionWord, +31 |
| `src/gofai/canon/goals-constraints-preferences.ts` | `src/gofai/canon/goals-constraints-preferences.ts` | Goal, AxisChangeGoal, ActionGoal, +55 |
| `src/gofai/canon/goals-constraints.ts` | `src/gofai/canon/goals-constraints.ts` | SelectorId, IntentCategory, ConstraintStrength, +40 |
| `src/gofai/canon/harmony-melody-vocabulary-batch34.ts` | `src/gofai/canon/harmony-melody-vocabulary-batch34.ts` | CHORD_QUALITY_ADJECTIVES, HARMONIC_MOTION_TERMS, MELODIC_SHAPE_TERMS, +8 |
| `src/gofai/canon/id-formatting.ts` | `src/gofai/canon/id-formatting.ts` | FormatOptions, DEFAULT_FORMAT_OPTIONS, formatGofaiId, +25 |
| `src/gofai/canon/index.ts` | `src/gofai/canon/index.ts` |  |
| `src/gofai/canon/layer-vocabulary.ts` | `src/gofai/canon/layer-vocabulary.ts` | CORE_LAYER_TYPES, LAYER_TYPES_TABLE, getLayerTypeById, +12 |
| `src/gofai/canon/lexemes.ts` | `src/gofai/canon/lexemes.ts` | VERB_LEXEMES, ADJ_LEXEMES, ADV_LEXEMES, +11 |
| `src/gofai/canon/musical-objects-batch1.ts` | `src/gofai/canon/musical-objects-batch1.ts` | MUSICAL_OBJECT_LEXEMES_BATCH1, getMusicalObjectBatch1Stats |
| `src/gofai/canon/musical-objects-batch2.ts` | `src/gofai/canon/musical-objects-batch2.ts` | MUSICAL_OBJECT_LEXEMES_BATCH2, getMusicalObjectBatch2Stats |
| `src/gofai/canon/musical-ontology.ts` | `src/gofai/canon/musical-ontology.ts` | OntologicalDomain, OntologicalType, MusicalObject, +10 |
| `src/gofai/canon/musical-roles-batch1.ts` | `src/gofai/canon/musical-roles-batch1.ts` | MUSICAL_ROLE_LEXEMES_BATCH1, getMusicalRoleBatch1Stats |
| `src/gofai/canon/musical-roles-batch2.ts` | `src/gofai/canon/musical-roles-batch2.ts` | MUSICAL_ROLE_LEXEMES_BATCH2, getMusicalRoleBatch2Stats |
| `src/gofai/canon/musical-roles-batch3.ts` | `src/gofai/canon/musical-roles-batch3.ts` | MUSICAL_ROLE_LEXEMES_BATCH3, getMusicalRoleBatch3Stats |
| `src/gofai/canon/normalize.ts` | `src/gofai/canon/normalize.ts` | normalizeWhitespace, normalizeQuotes, normalizePunctuation, +19 |
| `src/gofai/canon/perceptual-axes-extended-batch1.ts` | `src/gofai/canon/perceptual-axes-extended-batch1.ts` | AXIS_AIRINESS, AXIS_WARMTH, AXIS_CRISPNESS, +11 |
| `src/gofai/canon/perceptual-axes-extended-batch2.ts` | `src/gofai/canon/perceptual-axes-extended-batch2.ts` | AXIS_TENSION, AXIS_HOPEFULNESS, AXIS_MELANCHOLY, +12 |
| `src/gofai/canon/perceptual-axes.ts` | `src/gofai/canon/perceptual-axes.ts` | AXIS_BRIGHTNESS, AXIS_ENERGY, AXIS_WIDTH, +17 |
| `src/gofai/canon/preservation-targets.ts` | `src/gofai/canon/preservation-targets.ts` | PreservationTargetId, createPreservationTargetId, isValidPreservationTargetId, +75 |
| `src/gofai/canon/production-mixing-vocabulary-batch36.ts` | `src/gofai/canon/production-mixing-vocabulary-batch36.ts` | SPATIAL_PLACEMENT_TERMS, DYNAMICS_COMPRESSION_TERMS, EQ_FREQUENCY_TERMS, +9 |
| `src/gofai/canon/production-terms-batch1.ts` | `src/gofai/canon/production-terms-batch1.ts` | PRODUCTION_TERM_LEXEMES_BATCH1, getProductionTermBatch1Stats |
| `src/gofai/canon/rhythm-groove-vocabulary-batch35.ts` | `src/gofai/canon/rhythm-groove-vocabulary-batch35.ts` | GROOVE_FEEL_DESCRIPTORS, TIMING_MICROTIMING_TERMS, ARTICULATION_ATTACK_TERMS, +8 |
| `src/gofai/canon/section-vocabulary.ts` | `src/gofai/canon/section-vocabulary.ts` | CORE_SECTION_TYPES, SECTION_TYPES_TABLE, getSectionTypeById, +10 |
| `src/gofai/canon/semantic-safety.ts` | `src/gofai/canon/semantic-safety.ts` | SemanticInvariant, InvariantId, TestCategory, +59 |
| `src/gofai/canon/temporal-expressions-batch33.ts` | `src/gofai/canon/temporal-expressions-batch33.ts` | TemporalCategory, TemporalPrecision, TemporalExpression, +30 |
| `src/gofai/canon/time-vocabulary.ts` | `src/gofai/canon/time-vocabulary.ts` | TimeUnitCategory, TimeUnitEntry, TIME_UNITS, +28 |
| `src/gofai/canon/types.ts` | `src/gofai/canon/types.ts` | GofaiId, LexemeId, AxisId, +45 |
| `src/gofai/canon/units.ts` | `src/gofai/canon/units.ts` | CORE_UNITS, UNITS_TABLE, getUnitById, +27 |
| `src/gofai/canon/versioning.ts` | `src/gofai/canon/versioning.ts` | SemanticVersion, CompilerVersion, VersionEnvelope, +39 |
| `src/gofai/canon/vocabulary-policy.ts` | `src/gofai/canon/vocabulary-policy.ts` | PolicySeverity, PolicyViolation, PolicyViolationType, +18 |
| `src/gofai/eval/ambiguity-suite.ts` | `src/gofai/eval/ambiguity-suite.ts` | AmbiguityTestId, ambiguityTestId, AmbiguityType, +16 |
| `src/gofai/eval/index.ts` | `src/gofai/eval/index.ts` |  |
| `src/gofai/eval/paraphrase-suite-batch2.ts` | `src/gofai/eval/paraphrase-suite-batch2.ts` | PARAPHRASE_BATCH_4, PARAPHRASE_BATCH_5, PARAPHRASE_SETS_BATCH_2 |
| `src/gofai/eval/paraphrase-suite.ts` | `src/gofai/eval/paraphrase-suite.ts` | ParaphraseId, paraphraseId, VariationType, +11 |
| `src/gofai/eval/seed-dataset.ts` | `src/gofai/eval/seed-dataset.ts` | SeedExampleId, seedExampleId, SeedCategory, +15 |
| `src/gofai/index.ts` | `src/gofai/index.ts` | CompileResult, CompileSuccess, CompileClarification, +11 |
| `src/gofai/infra/build-matrix-extended.ts` | `src/gofai/infra/build-matrix-extended.ts` | Feature, FeatureCategory, FeatureStatus, +13 |
| `src/gofai/infra/build-matrix.ts` | `src/gofai/infra/build-matrix.ts` | TestType, FeatureDomain, BuildMatrixEntry, +6 |
| `src/gofai/infra/deterministic-ordering.ts` | `src/gofai/infra/deterministic-ordering.ts` | ORDERING_PRINCIPLES, CompareResult, Comparator, +39 |
| `src/gofai/infra/entity-binding-precedence.ts` | `src/gofai/infra/entity-binding-precedence.ts` | PrecedenceLevel, BindingCandidate, SubPrecedenceLevel, +13 |
| `src/gofai/infra/fuzzy-matching.ts` | `src/gofai/infra/fuzzy-matching.ts` | FuzzyMatchResult, StrategyScore, MatchType, +24 |
| `src/gofai/infra/project-world-api.ts` | `src/gofai/infra/project-world-api.ts` | CardId, ContainerId, ProjectWorldAPI, +10 |
| `src/gofai/infra/risk-register.ts` | `src/gofai/infra/risk-register.ts` | RiskEntry, RiskId, RiskCategory, +10 |
| `src/gofai/infra/salience-tracker.ts` | `src/gofai/infra/salience-tracker.ts` | SalienceEntry, SalienceSource, SalienceSourceKind, +16 |
| `src/gofai/infra/success-metrics.ts` | `src/gofai/infra/success-metrics.ts` | SuccessMetric, MetricId, MetricCategory, +9 |
| `src/gofai/infra/symbol-table.ts` | `src/gofai/infra/symbol-table.ts` | SymbolEntry, SymbolTableConfig, DEFAULT_SYMBOL_TABLE_CONFIG, +11 |
| `src/gofai/invariants/constraint-verifiers.ts` | `src/gofai/invariants/constraint-verifiers.ts` | NoteEvent, ChordEvent, SectionMarker, +20 |
| `src/gofai/invariants/core-invariants.ts` | `src/gofai/invariants/core-invariants.ts` | CPLOperation, InvariantContext, CORE_INVARIANTS, +2 |
| `src/gofai/invariants/index.ts` | `src/gofai/invariants/index.ts` |  |
| `src/gofai/invariants/semantic-safety-invariants.ts` | `src/gofai/invariants/semantic-safety-invariants.ts` | INVARIANT_CATEGORIES, INV_NO_SILENT_AMBIGUITY, INV_CONSTRAINTS_EXECUTABLE, +13 |
| `src/gofai/invariants/types.ts` | `src/gofai/invariants/types.ts` | InvariantId, invariantId, InvariantSeverity, +43 |
| `src/gofai/nl/grammar/comparatives.ts` | `src/gofai/nl/grammar/comparatives.ts` | DegreeModifier, DegreeModifierType, DegreeLevel, +32 |
| `src/gofai/nl/grammar/coordination.ts` | `src/gofai/nl/grammar/coordination.ts` | CoordinationKind, CoordinationLevel, ConjunctionEntry, +35 |
| `src/gofai/nl/grammar/edit-locality.ts` | `src/gofai/nl/grammar/edit-locality.ts` | EditLocalityExpression, LocalityType, LocalityMarker, +17 |
| `src/gofai/nl/grammar/error-formatter.ts` | `src/gofai/nl/grammar/error-formatter.ts` | ParseError, ParseErrorCode, ParseErrorCategory, +25 |
| `src/gofai/nl/grammar/extension-lexemes.ts` | `src/gofai/nl/grammar/extension-lexemes.ts` | ExtensionLexeme, ExtensionLexemeCategory, ExtensionLexemeSemantics, +15 |
| `src/gofai/nl/grammar/extension-rules.ts` | `src/gofai/nl/grammar/extension-rules.ts` | ExtensionGrammarRule, RulePattern, PatternType, +22 |
| `src/gofai/nl/grammar/imperative.ts` | `src/gofai/nl/grammar/imperative.ts` | VerbFrame, VerbFrameCategory, ThematicRole, +32 |
| `src/gofai/nl/grammar/index.ts` | `src/gofai/nl/grammar/index.ts` |  |
| `src/gofai/nl/grammar/modality.ts` | `src/gofai/nl/grammar/modality.ts` | ModalQualifier, ModalCategory, ModalForce, +25 |
| `src/gofai/nl/grammar/negation.ts` | `src/gofai/nl/grammar/negation.ts` | NegationExpression, NegationType, NegationScope, +35 |
| `src/gofai/nl/grammar/preservation.ts` | `src/gofai/nl/grammar/preservation.ts` | PreservationExpression, PreservationType, PreservationTrigger, +25 |
| `src/gofai/nl/grammar/quantification.ts` | `src/gofai/nl/grammar/quantification.ts` | SelectionPredicate, QuantifierType, ScopeReading, +28 |
| `src/gofai/nl/grammar/questions.ts` | `src/gofai/nl/grammar/questions.ts` | ParsedQuestion, QuestionType, QuestionSpeechAct, +27 |
| `src/gofai/nl/grammar/reference-expressions.ts` | `src/gofai/nl/grammar/reference-expressions.ts` | UnresolvedRef, ReferenceKind, GrammaticalNumber, +41 |
| `src/gofai/nl/grammar/regression-harness.ts` | `src/gofai/nl/grammar/regression-harness.ts` | ForestSnapshot, SnapshotNode, SnapshotNodeType, +54 |
| `src/gofai/nl/grammar/time-expressions.ts` | `src/gofai/nl/grammar/time-expressions.ts` | TimeRange, AbsoluteRange, SectionRange, +45 |
| `src/gofai/nl/grammar/unknown-tokens.ts` | `src/gofai/nl/grammar/unknown-tokens.ts` | UnknownToken, UnknownTokenCategory, UnknownTokenCandidate, +16 |
| `src/gofai/nl/grammar/user-defined-names.ts` | `src/gofai/nl/grammar/user-defined-names.ts` | NamedReference, NameReferenceType, QuoteStyle, +28 |
| `src/gofai/nl/hci/clarification-defaults.ts` | `src/gofai/nl/hci/clarification-defaults.ts` | ValidatableClarification, ValidatableOption, ClarificationValidationResult, +20 |
| `src/gofai/nl/hci/clarification-templates.ts` | `src/gofai/nl/hci/clarification-templates.ts` | ClarificationTemplate, ClarificationOptionTemplate, ClarificationPattern, +7 |
| `src/gofai/nl/hci/error-recovery-ux.ts` | `src/gofai/nl/hci/error-recovery-ux.ts` | ErrorCategory, ErrorRecoveryContext, ErrorSpan, +20 |
| `src/gofai/nl/hci/grammar-authorship-workflow.ts` | `src/gofai/nl/hci/grammar-authorship-workflow.ts` | ChecklistItem, ChecklistCategory, GRAMMAR_PR_CHECKLIST, +7 |
| `src/gofai/nl/hci/index.ts` | `src/gofai/nl/hci/index.ts` |  |
| `src/gofai/nl/hci/typing-ux-spec.ts` | `src/gofai/nl/hci/typing-ux-spec.ts` | ParseStatus, ParseStatusVisual, StatusIcon, +26 |
| `src/gofai/nl/index.ts` | `src/gofai/nl/index.ts` |  |
| `src/gofai/nl/parser/earley-engine.ts` | `src/gofai/nl/parser/earley-engine.ts` | GrammarSymbol, TerminalSymbol, NonTerminalSymbol, +33 |
| `src/gofai/nl/parser/incremental.ts` | `src/gofai/nl/parser/incremental.ts` | TokenFingerprint, computeTokenFingerprint, serializeFingerprint, +42 |
| `src/gofai/nl/parser/index.ts` | `src/gofai/nl/parser/index.ts` |  |
| `src/gofai/nl/parser/parse-diagnostics.ts` | `src/gofai/nl/parser/parse-diagnostics.ts` | DiagnosticReport, RuleTraceEntry, AmbiguityReport, +5 |
| `src/gofai/nl/parser/parse-forest.ts` | `src/gofai/nl/parser/parse-forest.ts` | ParseForest, ForestNode, OrNode, +13 |
| `src/gofai/nl/parser/parse-scoring.ts` | `src/gofai/nl/parser/parse-scoring.ts` | ScoredParse, ScoreBreakdown, ScoreComponent, +8 |
| `src/gofai/nl/parser/parse-visualizer.ts` | `src/gofai/nl/parser/parse-visualizer.ts` | VisualizableForest, VisualizableNode, VisualizableAmbiguity, +34 |
| `src/gofai/nl/semantics/compositional-hooks.ts` | `src/gofai/nl/semantics/compositional-hooks.ts` | SemanticValue, EntityValue, EventValue, +35 |
| `src/gofai/nl/semantics/construction-grammar.ts` | `src/gofai/nl/semantics/construction-grammar.ts` | Construction, ConstructionPattern, PatternElement, +22 |
| `src/gofai/nl/semantics/coordination-sequencing.ts` | `src/gofai/nl/semantics/coordination-sequencing.ts` | CoordinatedCommand, CoordinationType, CommandConstituent, +24 |
| `src/gofai/nl/semantics/degree-semantics.ts` | `src/gofai/nl/semantics/degree-semantics.ts` | DegreeExpression, DegreeExpressionType, ScalarDirection, +24 |
| `src/gofai/nl/semantics/event-semantics.ts` | `src/gofai/nl/semantics/event-semantics.ts` | EditEvent, EditEventCategory, EventVerb, +43 |
| `src/gofai/nl/semantics/index.ts` | `src/gofai/nl/semantics/index.ts` |  |
| `src/gofai/nl/semantics/pragmatic-bias.ts` | `src/gofai/nl/semantics/pragmatic-bias.ts` | InterpretationRisk, BiasDecision, BiasUrgency, +33 |
| `src/gofai/nl/semantics/quantifier-semantics.ts` | `src/gofai/nl/semantics/quantifier-semantics.ts` | QuantifierExpression, QuantifierType, UniversalQuantifier, +39 |
| `src/gofai/nl/semantics/replacement-semantics.ts` | `src/gofai/nl/semantics/replacement-semantics.ts` | ReplacementExpression, ReplacementKind, ReplacedTarget, +37 |
| `src/gofai/nl/semantics/representation.ts` | `src/gofai/nl/semantics/representation.ts` | SemanticType, EntityType_, EntitySubtype, +67 |
| `src/gofai/nl/semantics/scope-ambiguity.ts` | `src/gofai/nl/semantics/scope-ambiguity.ts` | MRS, Handle, MRSVariable, +28 |
| `src/gofai/nl/semantics/selectional-restrictions.ts` | `src/gofai/nl/semantics/selectional-restrictions.ts` | SelectionalFeature, FeatureBundle, createFeatureBundle, +30 |
| `src/gofai/nl/semantics/type-directed-disambiguation.ts` | `src/gofai/nl/semantics/type-directed-disambiguation.ts` | SynthesizedType, TypeDerivation, LexicalDerivation, +31 |
| `src/gofai/nl/tokenizer/index.ts` | `src/gofai/nl/tokenizer/index.ts` |  |
| `src/gofai/nl/tokenizer/morphology.ts` | `src/gofai/nl/tokenizer/morphology.ts` | LemmaResult, InflectionType, WordClass, +10 |
| `src/gofai/nl/tokenizer/normalizer.ts` | `src/gofai/nl/tokenizer/normalizer.ts` | NormalizedToken, NormalizationRule, NormalizationCategory, +19 |
| `src/gofai/nl/tokenizer/number-parser.ts` | `src/gofai/nl/tokenizer/number-parser.ts` | ParsedNumber, ExactNumber, RangeNumber, +19 |
| `src/gofai/nl/tokenizer/span-tokenizer.ts` | `src/gofai/nl/tokenizer/span-tokenizer.ts` | Span, span, spanLength, +21 |
| `src/gofai/nl/tokenizer/unit-parser.ts` | `src/gofai/nl/tokenizer/unit-parser.ts` | UnitExpression, ValueMode, CanonicalUnit, +14 |
| `src/gofai/pipeline/ambiguity-policy.ts` | `src/gofai/pipeline/ambiguity-policy.ts` | AmbiguityKind, AMBIGUITY_KINDS, AmbiguitySeverity, +28 |
| `src/gofai/pipeline/binding-inspector.ts` | `src/gofai/pipeline/binding-inspector.ts` | Binding, BindingSource, BindingColorCategory, +56 |
| `src/gofai/pipeline/compilation-stages.ts` | `src/gofai/pipeline/compilation-stages.ts` | Provenance, PipelineStage, StageResult, +40 |
| `src/gofai/pipeline/degree-affordances.ts` | `src/gofai/pipeline/degree-affordances.ts` | DegreeLevel, DEGREE_LEVELS, DegreeRange, +17 |
| `src/gofai/pipeline/entity-binding-ui.ts` | `src/gofai/pipeline/entity-binding-ui.ts` | BindingDisplayTemplate, BindingDisplayExample, BINDING_DISPLAY_TEMPLATES, +14 |
| `src/gofai/pipeline/error-shapes.ts` | `src/gofai/pipeline/error-shapes.ts` | ErrorShape, ErrorShapeType, ERROR_SHAPE_TYPES, +33 |
| `src/gofai/pipeline/focus-stack-ui.ts` | `src/gofai/pipeline/focus-stack-ui.ts` | FocusLevel, FocusEntityType, FocusLevelIcon, +32 |
| `src/gofai/pipeline/index.ts` | `src/gofai/pipeline/index.ts` |  |
| `src/gofai/pipeline/interaction-loop.ts` | `src/gofai/pipeline/interaction-loop.ts` | InteractionState, InteractionStateType, INTERACTION_STATE_TYPES, +78 |
| `src/gofai/pipeline/preview-first-ux.ts` | `src/gofai/pipeline/preview-first-ux.ts` | AutoApplyContext, PreviewFirstConfig, PreviewReviewTimes, +21 |
| `src/gofai/pipeline/provenance.ts` | `src/gofai/pipeline/provenance.ts` | ProvenanceId, provenanceId, nextProvenanceId, +43 |
| `src/gofai/pipeline/types.ts` | `src/gofai/pipeline/types.ts` | PipelineStageId, PIPELINE_STAGES, STAGE_BUDGETS, +65 |
| `src/gofai/pipeline/vocabulary-browser.ts` | `src/gofai/pipeline/vocabulary-browser.ts` | VocabularyEntry, VocabularyCategory, VocabularySource, +53 |
| `src/gofai/planning/constraint-satisfaction.ts` | `src/gofai/planning/constraint-satisfaction.ts` | ConstraintViolation, ConstraintCounterexample, PreserveViolation, +12 |
| `src/gofai/planning/cost-model.ts` | `src/gofai/planning/cost-model.ts` | CostFactors, CATEGORY_BASE_COSTS, RISK_COST_MULTIPLIERS, +17 |
| `src/gofai/planning/least-change-strategy.ts` | `src/gofai/planning/least-change-strategy.ts` | EditMagnitude, analyzeEditMagnitude, MagnitudePreference, +7 |
| `src/gofai/planning/lever-mappings-comprehensive-batch1.ts` | `src/gofai/planning/lever-mappings-comprehensive-batch1.ts` | BRIGHTNESS_VIA_HARMONIC_SHIFT, BRIGHTNESS_VIA_REGISTER_SHIFT, BRIGHTNESS_VIA_VOICING, +10 |
| `src/gofai/planning/lever-mappings-comprehensive-batch2.ts` | `src/gofai/planning/lever-mappings-comprehensive-batch2.ts` | WIDTH_VIA_STEREO_SPREAD, WIDTH_VIA_PANNING_DISTRIBUTION, WIDTH_VIA_STEREO_DOUBLING, +13 |
| `src/gofai/planning/lever-mappings-comprehensive-batch3.ts` | `src/gofai/planning/lever-mappings-comprehensive-batch3.ts` | ENERGY_VIA_TEMPO_INCREASE, ENERGY_VIA_DENSITY_INCREASE, ENERGY_VIA_RHYTHMIC_ACTIVATION, +12 |
| `src/gofai/planning/lever-mappings.ts` | `src/gofai/planning/lever-mappings.ts` | PerceptualDirection, Lever, LeverContext, +4 |
| `src/gofai/planning/plan-generation.ts` | `src/gofai/planning/plan-generation.ts` | SearchConfig, DEFAULT_SEARCH_CONFIG, FAST_SEARCH_CONFIG, +12 |
| `src/gofai/planning/plan-types.ts` | `src/gofai/planning/plan-types.ts` | OpcodeId, createOpcodeId, OpcodeCategory, +64 |
| `src/gofai/pragmatics/clarification-contract.ts` | `src/gofai/pragmatics/clarification-contract.ts` | ClarificationQuestion, ClarificationQuestionId, createClarificationQuestionId, +24 |
| `src/gofai/pragmatics/contrastive-semantics.ts` | `src/gofai/pragmatics/contrastive-semantics.ts` | ContrastiveType, ContrastiveConstruction, ContrastiveClause, +15 |
| `src/gofai/pragmatics/deictic-resolution-tests.ts` | `src/gofai/pragmatics/deictic-resolution-tests.ts` | DeicticTestCase, DeicticTestCategory, TestSelectionState, +14 |
| `src/gofai/pragmatics/deictic-resolution.ts` | `src/gofai/pragmatics/deictic-resolution.ts` | UISelectionState, SelectionKind, SelectionScope, +15 |
| `src/gofai/pragmatics/demonstrative-resolution.ts` | `src/gofai/pragmatics/demonstrative-resolution.ts` | DemonstrativeExpression, DemonstrativeWord, Proximity, +25 |
| `src/gofai/pragmatics/discourse-model.ts` | `src/gofai/pragmatics/discourse-model.ts` | DRS, DRSId, createDRSId, +52 |
| `src/gofai/pragmatics/implicature-model.ts` | `src/gofai/pragmatics/implicature-model.ts` | ImplicatureType, Implicature, ImplicatureConveyance, +13 |
| `src/gofai/pragmatics/index.ts` | `src/gofai/pragmatics/index.ts` |  |
| `src/gofai/pragmatics/presupposition-triggers.ts` | `src/gofai/pragmatics/presupposition-triggers.ts` | PresuppositionTriggerType, PresuppositionTrigger, Presupposition, +19 |
| `src/gofai/pragmatics/shared-plans.ts` | `src/gofai/pragmatics/shared-plans.ts` | PlanId, createPlanId, isValidPlanId, +56 |
| `src/gofai/pragmatics/temporal-adverbs.ts` | `src/gofai/pragmatics/temporal-adverbs.ts` | TemporalAdverb, TemporalInterpretation, TemporalDomain, +16 |
| `src/gofai/pragmatics/user-preferences.ts` | `src/gofai/pragmatics/user-preferences.ts` | ProfileId, profileId, UserPreferenceProfile, +20 |
| `src/gofai/scenarios/canonical-scenarios.ts` | `src/gofai/scenarios/canonical-scenarios.ts` | ScenarioId, scenarioId, ScenarioCategory, +31 |
| `src/gofai/scenarios/index.ts` | `src/gofai/scenarios/index.ts` |  |
| `src/gofai/testing/build-matrix.ts` | `src/gofai/testing/build-matrix.ts` | TestType, FeatureCategory, TestPriority, +16 |
| `src/gofai/testing/success-metrics.ts` | `src/gofai/testing/success-metrics.ts` | MetricCategory, MetricPriority, MetricStatus, +34 |
| `src/gofai/trust/diff.ts` | `src/gofai/trust/diff.ts` | DiffKind, EventDiff, EventSnapshot, +9 |
| `src/gofai/trust/index.ts` | `src/gofai/trust/index.ts` |  |
| `src/gofai/trust/preview.ts` | `src/gofai/trust/preview.ts` | PreviewSafetyLevel, PreviewConstraintCheck, PreviewCostEstimate, +11 |
| `src/gofai/trust/scope-highlighting.ts` | `src/gofai/trust/scope-highlighting.ts` | HighlightKind, HighlightLayer, HighlightRegion, +10 |
| `src/gofai/trust/undo.ts` | `src/gofai/trust/undo.ts` | EditPackageId, createEditPackageId, isValidEditPackageId, +28 |
| `src/gofai/trust/why.ts` | `src/gofai/trust/why.ts` | WhyNodeKind, ProvenanceLink, DecisionReason, +10 |
| `src/index.ts` | `src/index.ts` |  |
| `src/integration/index.ts` | `src/integration/index.ts` | resetIntegration |
| `src/midi/midi-input.ts` | `src/midi/midi-input.ts` | MidiMessageType, MidiMessage, NoteMessage, +10 |
| `src/mixer/reference-player.ts` | `src/mixer/reference-player.ts` | ReferenceTrack, ReferencePlaybackState, CompareMode, +17 |
| `src/music/harmony-helper.ts` | `src/music/harmony-helper.ts` | NoteClass, HarmonyContext, NoteClassification, +4 |
| `src/music/index.ts` | `src/music/index.ts` |  |
| `src/music/roman-numerals.ts` | `src/music/roman-numerals.ts` | chordToRomanNumeral, getChordFunction, RomanNumeralAnalysis, +1 |
| `src/music/scale-overlay.ts` | `src/music/scale-overlay.ts` | PitchClass, Note, ScaleDefinition, +10 |
| `src/notation/annotations.ts` | `src/notation/annotations.ts` | Annotation, AnnotationType, RehearsalMark, +44 |
| `src/notation/barlines.ts` | `src/notation/barlines.ts` | BAR_LINE_THICKNESS, RenderedBarLine, BarLineElement, +10 |
| `src/notation/capture-png.ts` | `src/notation/capture-png.ts` |  |
| `src/notation/comparison-sync.ts` | `src/notation/comparison-sync.ts` | NotationDiffType, NotationDiff, ComparisonViewConfig, +17 |
| `src/notation/curves.ts` | `src/notation/curves.ts` | ControlPoint, BezierCurve, RenderedTie, +15 |
| `src/notation/drum-notation.ts` | `src/notation/drum-notation.ts` | DrumInstrument, DrumNoteHead, GM_DRUM_MAP, +12 |
| `src/notation/editing.ts` | `src/notation/editing.ts` | NotationClipboard, NotationSelection, copyNotation, +19 |
| `src/notation/event-bridge.ts` | `src/notation/event-bridge.ts` | EventToNotationOptions, eventToNotation, eventsToNotation, +6 |
| `src/notation/figured-bass.ts` | `src/notation/figured-bass.ts` | FiguredBassFigure, FigureNumber, FigureAccidental, +10 |
| `src/notation/harmony-overlay.ts` | `src/notation/harmony-overlay.ts` | NotationHarmonySettings, DEFAULT_NOTATION_HARMONY_SETTINGS, ChordToneOverlay, +6 |
| `src/notation/index.ts` | `src/notation/index.ts` | PDFExportOptions |
| `src/notation/input-recognition.ts` | `src/notation/input-recognition.ts` | StrokePoint, Stroke, RecognizedSymbol, +5 |
| `src/notation/layout.ts` | `src/notation/layout.ts` | SpacingConfig, DEFAULT_SPACING_CONFIG, calculateDurationSpacing, +78 |
| `src/notation/midi-export.ts` | `src/notation/midi-export.ts` | MIDIFormat, MIDIExportConfig, DEFAULT_MIDI_EXPORT_CONFIG, +4 |
| `src/notation/musicxml.ts` | `src/notation/musicxml.ts` | MusicXMLScore, MusicXMLPart, MusicXMLMeasure, +8 |
| `src/notation/notation-store-adapter.ts` | `src/notation/notation-store-adapter.ts` | NotationAdapterState, NotationStateCallback, NotationAdapterOptions, +4 |
| `src/notation/notes.ts` | `src/notation/notes.ts` | NoteHeadShape, getNoteHeadShape, NoteHeadDimensions, +31 |
| `src/notation/ornaments-dynamics.ts` | `src/notation/ornaments-dynamics.ts` | OrnamentType, Ornament, RenderedOrnament, +30 |
| `src/notation/panel.ts` | `src/notation/panel.ts` | ZoomState, DEFAULT_ZOOM_STATE, ScrollPosition, +14 |
| `src/notation/playback-transport-bridge.ts` | `src/notation/playback-transport-bridge.ts` | NotationEvent, ScorePosition, NotationPlaybackState, +4 |
| `src/notation/playback.ts` | `src/notation/playback.ts` | NotationPlaybackContext, createPlaybackContext, notationNoteToEvent, +57 |
| `src/notation/print-layout.ts` | `src/notation/print-layout.ts` | PageSize, PageOrientation, PageDimensions, +19 |
| `src/notation/render-test.ts` | `src/notation/render-test.ts` |  |
| `src/notation/revisions.ts` | `src/notation/revisions.ts` | Revision, Change, ChangeType, +31 |
| `src/notation/smufl.ts` | `src/notation/smufl.ts` | SMUFL, ENGRAVING_DEFAULTS, GLYPH_BBOXES, +8 |
| `src/notation/staff.ts` | `src/notation/staff.ts` | StaffDimensions, DEFAULT_STAFF_DIMENSIONS, STAFF_DIMENSION_PRESETS, +29 |
| `src/notation/svg-professional.ts` | `src/notation/svg-professional.ts` | generateProfessionalSVG |
| `src/notation/tablature.ts` | `src/notation/tablature.ts` | StringTuning, STANDARD_TUNINGS, TabNote, +13 |
| `src/notation/transposition.ts` | `src/notation/transposition.ts` | TransposingInstrument, TRANSPOSING_INSTRUMENTS, writtenToConcert, +9 |
| `src/notation/tuplets.ts` | `src/notation/tuplets.ts` | TupletConfig, DEFAULT_TUPLET_CONFIG, TupletBracket, +14 |
| `src/notation/types.ts` | `src/notation/types.ts` | ClefType, ClefDefinition, CLEF_DEFINITIONS, +37 |
| `src/performance/bundle-monitor.ts` | `src/performance/bundle-monitor.ts` | BundleSizeBudget, BundleReport, DEFAULT_BUDGETS, +4 |
| `src/performance/code-splitting.ts` | `src/performance/code-splitting.ts` | LazyModule, lazyModule, aiEngine, +9 |
| `src/performance/index.ts` | `src/performance/index.ts` |  |
| `src/performance/performance-mode.ts` | `src/performance/performance-mode.ts` | PerformanceModeConfig, PerformanceFeature, PerformanceMetrics, +8 |
| `src/performance/tree-shaking.ts` | `src/performance/tree-shaking.ts` | TreeShakingConfig, DEFAULT_TREE_SHAKING_CONFIG, generateSideEffectsConfig, +6 |
| `src/rules/index.ts` | `src/rules/index.ts` |  |
| `src/rules/rules.ts` | `src/rules/rules.ts` | ValidationError, ValidationResult, Suggestion, +22 |
| `src/state/clip-registry.ts` | `src/state/clip-registry.ts` | ClipChangeType, ClipCallback, ClipRegistry, +3 |
| `src/state/event-store.ts` | `src/state/event-store.ts` | SharedEventStore, createEventStore, getSharedEventStore, +1 |
| `src/state/index.ts` | `src/state/index.ts` | resetAllState, EditOperation, CreateEditOperationOptions, +2 |
| `src/state/parameter-resolver.ts` | `src/state/parameter-resolver.ts` | ParameterSource, ParameterSourceType, ResolvedParameter, +10 |
| `src/state/routing-graph.ts` | `src/state/routing-graph.ts` | NodeType, EdgeType, RoutingNodeInfo, +17 |
| `src/state/selection-state.ts` | `src/state/selection-state.ts` | SelectionCallback, SelectionStore, createSelectionStore, +2 |
| `src/state/ssot.ts` | `src/state/ssot.ts` | SSOTStores, getSSOTStores, ProjectResetCallback, +3 |
| `src/state/tempo.ts` | `src/state/tempo.ts` | TempoPayload, DEFAULT_PROJECT_TEMPO, getTempoAtTick, +2 |
| `src/state/types.ts` | `src/state/types.ts` | EventStreamId, asEventStreamId, generateEventStreamId, +28 |
| `src/state/undo-stack.ts` | `src/state/undo-stack.ts` | UndoStackCallback, CreateUndoActionOptions, UndoStack, +3 |
| `src/storage/freesound-export.ts` | `src/storage/freesound-export.ts` | SampleSource, ProjectSampleRef, ProjectMetadata, +18 |
| `src/storage/indexeddb-backend.ts` | `src/storage/indexeddb-backend.ts` | DB_VERSION, DB_NAME, StoreName, +10 |
| `src/streams/index.ts` | `src/streams/index.ts` |  |
| `src/streams/stream.ts` | `src/streams/stream.ts` | Stream, StreamMeta, EventStream, +30 |
| `src/test-utils/breaking-changes.ts` | `src/test-utils/breaking-changes.ts` | APISignature, APISnapshot, BreakingChange, +5 |
| `src/test-utils/coverage-reporter.ts` | `src/test-utils/coverage-reporter.ts` | CoverageMetrics, FileCoverage, CoverageReport, +7 |
| `src/test-utils/deprecation.ts` | `src/test-utils/deprecation.ts` | DeprecationLevel, DeprecationInfo, DeprecationRegistry, +7 |
| `src/test-utils/fuzz-testing.ts` | `src/test-utils/fuzz-testing.ts` | SeededRNG, createSeededRNG, FuzzTestCase, +7 |
| `src/test-utils/index.ts` | `src/test-utils/index.ts` |  |
| `src/test-utils/property-testing.ts` | `src/test-utils/property-testing.ts` | Property, PropertyTestOptions, PropertyTestResult, +4 |
| `src/test-utils/quality-score.ts` | `src/test-utils/quality-score.ts` | QualityMetrics, QualityScore, calculateQualityScore, +2 |
| `src/test-utils/strict-types.ts` | `src/test-utils/strict-types.ts` | assertNever, exhaustiveDefault, isDefined, +16 |
| `src/test-utils/test-cache.ts` | `src/test-utils/test-cache.ts` | TestResult, TestFileResult, TestCache, +10 |
| `src/tracker/effect-processor.ts` | `src/tracker/effect-processor.ts` | ChannelEffectState, PendingEvent, createChannelState, +7 |
| `src/tracker/effects.ts` | `src/tracker/effects.ts` | FX, EffectCategory, ParamFormat, +30 |
| `src/tracker/event-sync.ts` | `src/tracker/event-sync.ts` | TrackerEventPayload, TrackerSyncConfig, ComputedTrackerView, +4 |
| `src/tracker/generator-integration.ts` | `src/tracker/generator-integration.ts` | GeneratorEvent, GeneratorContext, GeneratorFunction, +24 |
| `src/tracker/index.ts` | `src/tracker/index.ts` |  |
| `src/tracker/input-handler.ts` | `src/tracker/input-handler.ts` | Direction, NoteKeyMapping, InputHandlerConfig, +6 |
| `src/tracker/pattern-store.ts` | `src/tracker/pattern-store.ts` | PatternStore, getPatternStore, resetPatternStore |
| `src/tracker/phrases.ts` | `src/tracker/phrases.ts` | PhrasePlayMode, PhraseKeyMode, PhraseTiming, +10 |
| `src/tracker/renderer.ts` | `src/tracker/renderer.ts` | MultiTrackRow, getPatternRowView, getPatternLength, +25 |
| `src/tracker/tracker-card-integration.ts` | `src/tracker/tracker-card-integration.ts` | TRACKER_WIDGET_META, TrackerWidgetState, createTrackerWidgetState, +9 |
| `src/tracker/tracker-card.ts` | `src/tracker/tracker-card.ts` | TrackerViewTrack, TrackerViewCell, TrackerViewData, +3 |
| `src/tracker/types.ts` | `src/tracker/types.ts` | MidiNote, Velocity, EventId, +64 |
| `src/tracks/auto-coloring.ts` | `src/tracks/auto-coloring.ts` | InstrumentCategory, ColorScheme, TrackInfo, +8 |
| `src/tracks/clip-operations.ts` | `src/tracks/clip-operations.ts` | TimeRange, Clip, MidiData, +25 |
| `src/tracks/types.ts` | `src/tracks/types.ts` | TrackId, createTrackId, isValidTrackId, +1 |
| `src/types/event-id.ts` | `src/types/event-id.ts` | EventId, generateEventId, asEventId, +3 |
| `src/types/event-kind.ts` | `src/types/event-kind.ts` | EventKind, EventKindEntry, EventKinds, +6 |
| `src/types/event-meta.ts` | `src/types/event-meta.ts` | LineageEntry, EventMeta, EMPTY_META, +3 |
| `src/types/event-schema-registry.ts` | `src/types/event-schema-registry.ts` | SchemaValidator, EventKindSchema, registerEventKindSchema, +4 |
| `src/types/event.ts` | `src/types/event.ts` | Event, isEvent, CreateEventOptions, +17 |
| `src/types/index.ts` | `src/types/index.ts` |  |
| `src/types/lane.ts` | `src/types/lane.ts` | Interpolation, Control, Target, +28 |
| `src/types/port-ref.ts` | `src/types/port-ref.ts` | PortRef, ConnectionId, createConnectionId, +1 |
| `src/types/primitives.ts` | `src/types/primitives.ts` | Tick, TickDuration, PPQ, +16 |
| `src/types/raw-imports.d.ts` | `src/types/raw-imports.d.ts` |  |
| `src/types/tau-prolog.d.ts` | `src/types/tau-prolog.d.ts` |  |
| `src/types/time-conversion.ts` | `src/types/time-conversion.ts` | ticksToSeconds, secondsToTicks, tickDurationToSeconds, +9 |
| `src/types/trigger.ts` | `src/types/trigger.ts` | TriggerOffsetMode, Trigger, CreateTriggerOptions, +8 |
| `src/ui/accessibility/helper.ts` | `src/ui/accessibility/helper.ts` | AccessibilityShortcut, GLOBAL_SHORTCUTS, ARIA_ROLES, +3 |
| `src/ui/accessibility/hit-targets.ts` | `src/ui/accessibility/hit-targets.ts` | MIN_HIT_TARGET_SIZE, RECOMMENDED_HIT_TARGET_SIZE, meetsHitTargetSize, +4 |
| `src/ui/achievements.ts` | `src/ui/achievements.ts` | AchievementCategory, AchievementTier, Achievement, +43 |
| `src/ui/actions/capture-performance.ts` | `src/ui/actions/capture-performance.ts` | ClipLaunchEvent, PerformanceRecording, CapturePerformanceResult, +8 |
| `src/ui/actions/freeze-track.ts` | `src/ui/actions/freeze-track.ts` | FreezeTrackOptions, FreezeTrackResult, freezeGeneratedTrack, +2 |
| `src/ui/actions/harmony-actions.ts` | `src/ui/actions/harmony-actions.ts` | ChordPayload, ensureChordStream, setChord, +3 |
| `src/ui/actions/index.ts` | `src/ui/actions/index.ts` |  |
| `src/ui/actions/panic.ts` | `src/ui/actions/panic.ts` | PanicActionType, PanicActionResult, registerActiveNote, +7 |
| `src/ui/actions/render-track.ts` | `src/ui/actions/render-track.ts` | RenderQuality, RenderFormat, RenderTrackOptions, +5 |
| `src/ui/ai-advisor-integration.ts` | `src/ui/ai-advisor-integration.ts` | registerRevealPanel, getRevealPanel, openAIAdvisor, +2 |
| `src/ui/ai-context-menu.ts` | `src/ui/ai-context-menu.ts` | AIContextMenuItem, AIContextMenuConfig, extractChordContext, +11 |
| `src/ui/animations.ts` | `src/ui/animations.ts` | easing, duration, prefersReducedMotion, +17 |
| `src/ui/arrangement-operations.ts` | `src/ui/arrangement-operations.ts` | EditMode, TimeRange, ArrangementSection, +25 |
| `src/ui/arrangement-view.ts` | `src/ui/arrangement-view.ts` | ArrangementClip, ArrangementMarker, AutomationLane, +7 |
| `src/ui/arranger-sections-bar.ts` | `src/ui/arranger-sections-bar.ts` | SectionDisplay, ArrangerSectionsState, SectionDragState, +35 |
| `src/ui/beginner-bridge.ts` | `src/ui/beginner-bridge.ts` | ExperienceLevel, UserBackground, UserInterest, +27 |
| `src/ui/beginner.ts` | `src/ui/beginner.ts` | WelcomeTemplate, WelcomeScreenConfig, DEFAULT_WELCOME_CONFIG, +90 |
| `src/ui/cancellable-operations.ts` | `src/ui/cancellable-operations.ts` | CancellableOperation, OperationConfig, OperationResult, +5 |
| `src/ui/cards.ts` | `src/ui/cards.ts` | CardSurfaceSize, CardSize, CardSurfaceStyle, +105 |
| `src/ui/chord-track-lane.ts` | `src/ui/chord-track-lane.ts` | ChordBlock, ChordPickerState, ChordLaneOptions, +4 |
| `src/ui/chord-track-panel.ts` | `src/ui/chord-track-panel.ts` | ChordQuality, ChordDisplay, ChordFunction, +25 |
| `src/ui/components.ts` | `src/ui/components.ts` | ComponentSize, ComponentVariant, ComponentState, +82 |
| `src/ui/components/ai-advisor-panel.ts` | `src/ui/components/ai-advisor-panel.ts` | AIAdvisorPanel |
| `src/ui/components/ai-composer-deck.ts` | `src/ui/components/ai-composer-deck.ts` | GenerationScope, GenerationMode, GenerationConstraints, +3 |
| `src/ui/components/arrangement-panel.ts` | `src/ui/components/arrangement-panel.ts` | ArrangementTrack, Track, TrackType, +213 |
| `src/ui/components/arranger-deck.ts` | `src/ui/components/arranger-deck.ts` | ArrangerSection, PartTrack, ArrangerDeckState, +1 |
| `src/ui/components/board-browser.ts` | `src/ui/components/board-browser.ts` | BoardBrowserOptions, createBoardBrowser, injectBoardBrowserStyles |
| `src/ui/components/board-export-dialog.ts` | `src/ui/components/board-export-dialog.ts` | BoardExportDialogConfig, createBoardExportDialog |
| `src/ui/components/board-help-panel.ts` | `src/ui/components/board-help-panel.ts` | createBoardHelpPanel, openBoardHelp |
| `src/ui/components/board-host.ts` | `src/ui/components/board-host.ts` | BoardHostElement, createBoardHost, injectBoardHostStyles |
| `src/ui/components/board-import-dialog.ts` | `src/ui/components/board-import-dialog.ts` | BoardImportDialogConfig, createBoardImportDialog |
| `src/ui/components/board-settings-panel.ts` | `src/ui/components/board-settings-panel.ts` | BoardSettingsPanelOptions, BoardSettingsPanel, injectBoardSettingsPanelStyles |
| `src/ui/components/board-state-inspector.ts` | `src/ui/components/board-state-inspector.ts` | BoardStateInspector, initBoardStateInspector |
| `src/ui/components/board-switcher.ts` | `src/ui/components/board-switcher.ts` | BoardSwitcherOptions, createBoardSwitcher, initBoardSwitcher, +1 |
| `src/ui/components/board-theme-picker.ts` | `src/ui/components/board-theme-picker.ts` | BoardThemeVariant, BoardThemePickerConfig, BoardThemePickerState, +3 |
| `src/ui/components/bounce-dialog.ts` | `src/ui/components/bounce-dialog.ts` | BounceTarget, BounceDialogConfig, BounceSettings, +2 |
| `src/ui/components/capture-to-manual-cta.ts` | `src/ui/components/capture-to-manual-cta.ts` | CaptureToManualCTA, getCaptureToManualCTA, initCaptureToManualCTA |
| `src/ui/components/card-component.ts` | `src/ui/components/card-component.ts` | CardState, CardSize, UIPortType, +16 |
| `src/ui/components/chord-visualizer.ts` | `src/ui/components/chord-visualizer.ts` | ChordVisualizerOptions, createChordVisualizer, updateChordVisualizer |
| `src/ui/components/command-palette.ts` | `src/ui/components/command-palette.ts` | Command, CommandContext, UndoEntry, +14 |
| `src/ui/components/common-mistakes-help.ts` | `src/ui/components/common-mistakes-help.ts` | MistakeCategory, CommonMistake, MISTAKE_CATEGORIES, +3 |
| `src/ui/components/confirmation-dialog.ts` | `src/ui/components/confirmation-dialog.ts` | ConfirmationOptions, ConfirmationDialog, getConfirmationDialog, +3 |
| `src/ui/components/connection-inspector-impl.ts` | `src/ui/components/connection-inspector-impl.ts` | ConnectionInspectorOptions, ConnectionInspector, injectConnectionInspectorStyles |
| `src/ui/components/connection-inspector.ts` | `src/ui/components/connection-inspector.ts` | ConnectionInspector, injectConnectionInspectorStyles |
| `src/ui/components/connection-router.ts` | `src/ui/components/connection-router.ts` | ConnectionStyle, ConnectionType, Point, +10 |
| `src/ui/components/contextual-tooltips.ts` | `src/ui/components/contextual-tooltips.ts` | TooltipConfig, TooltipElement, ContextualTooltipManager, +4 |
| `src/ui/components/control-level-indicator.ts` | `src/ui/components/control-level-indicator.ts` | ControlLevelIndicatorOptions, createControlLevelIndicator, ControlLevelPickerOptions, +2 |
| `src/ui/components/control-spectrum-badge.ts` | `src/ui/components/control-spectrum-badge.ts` | ControlSpectrumBadgeOptions, ControlSpectrumBadge |
| `src/ui/components/control-spectrum-slider.ts` | `src/ui/components/control-spectrum-slider.ts` | ControlSpectrumOptions, ControlSpectrumSlider, createControlSpectrumSlider |
| `src/ui/components/credits-panel.ts` | `src/ui/components/credits-panel.ts` | CreditsPanelOptions, CreditsPanel, creditsPanelStyles |
| `src/ui/components/deck-pack-browser.ts` | `src/ui/components/deck-pack-browser.ts` | DeckPackBrowser |
| `src/ui/components/deck-panel-host.ts` | `src/ui/components/deck-panel-host.ts` | DeckPanelHostOptions, DeckPanelHost, createDeckPanelHost |
| `src/ui/components/dsp-chain-panel.ts` | `src/ui/components/dsp-chain-panel.ts` | EffectSlot, DSPChainConfig, createDSPChainPanel |
| `src/ui/components/empty-state.ts` | `src/ui/components/empty-state.ts` | EmptyStateConfig, createEmptyState, EmptyStates |
| `src/ui/components/empty-states.ts` | `src/ui/components/empty-states.ts` | EmptyStateConfig, createEmptyState, createNotationEmptyState, +6 |
| `src/ui/components/error-state.ts` | `src/ui/components/error-state.ts` | ErrorStateOptions, createErrorState, ErrorStates, +1 |
| `src/ui/components/export-dialog.ts` | `src/ui/components/export-dialog.ts` | ExportDialogState, ExportDialogActions, createExportDialogState, +14 |
| `src/ui/components/extension-browser.ts` | `src/ui/components/extension-browser.ts` | ExtensionBrowserConfig, ExtensionBrowser |
| `src/ui/components/extension-debug-panel.ts` | `src/ui/components/extension-debug-panel.ts` | ExtensionDebugInfo, ExtensionError, ExtensionPerformanceMetrics, +2 |
| `src/ui/components/first-run-board-selection.ts` | `src/ui/components/first-run-board-selection.ts` | FirstRunSelectionOptions, createFirstRunSelection, injectFirstRunStyles |
| `src/ui/components/freesound-search-panel.ts` | `src/ui/components/freesound-search-panel.ts` | FreesoundSearchPanelState, FreesoundSearchPanelAction, FreesoundSearchPanelConfig, +13 |
| `src/ui/components/gated-card-browser.ts` | `src/ui/components/gated-card-browser.ts` | GatedCardBrowserOptions, GatedCardBrowser, createCapabilitiesDebugPanel |
| `src/ui/components/gating-debug-overlay.ts` | `src/ui/components/gating-debug-overlay.ts` | GatingDebugOverlay, getGatingDebugOverlay, initGatingDebugOverlay |
| `src/ui/components/generator-deck.ts` | `src/ui/components/generator-deck.ts` | GeneratorType, GeneratorSettings, GeneratorDeck |
| `src/ui/components/generator-panel.ts` | `src/ui/components/generator-panel.ts` | GeneratorType, GeneratorSettings, GeneratorResult, +2 |
| `src/ui/components/ghost-copy-visualization.ts` | `src/ui/components/ghost-copy-visualization.ts` | GhostCopyVisual, VisualBounds, GhostLinkVisual, +11 |
| `src/ui/components/harmony-controls.ts` | `src/ui/components/harmony-controls.ts` | HarmonyControlsOptions, createHarmonyControls, injectHarmonyControlsStyles |
| `src/ui/components/harmony-settings-panel.ts` | `src/ui/components/harmony-settings-panel.ts` | HarmonySettingsPanelOptions, createHarmonySettingsPanel, injectHarmonySettingsStyles |
| `src/ui/components/help-browser-deck.ts` | `src/ui/components/help-browser-deck.ts` | HelpTopic, HelpBrowserConfig, registerHelpTopic, +6 |
| `src/ui/components/level-meter.ts` | `src/ui/components/level-meter.ts` | MeterOrientation, LevelMeterOptions, createLevelMeter, +1 |
| `src/ui/components/loading-indicator.ts` | `src/ui/components/loading-indicator.ts` | LoadingOptions, LoadingIndicator, getLoadingIndicator, +3 |
| `src/ui/components/loading-screen.ts` | `src/ui/components/loading-screen.ts` | LoadingScreenOptions, createLoadingScreen, removeLoadingScreen, +2 |
| `src/ui/components/macro-assignment-wizard.ts` | `src/ui/components/macro-assignment-wizard.ts` | ParameterId, MacroAssignment, MacroConfig, +3 |
| `src/ui/components/micro-interactions.ts` | `src/ui/components/micro-interactions.ts` | bounceElement, addRippleEffect, pulseElement, +4 |
| `src/ui/components/midi-device-panel.ts` | `src/ui/components/midi-device-panel.ts` | MIDIDevicePanelState, MIDIDevicePanelAction, MIDIDevicePanelConfig, +17 |
| `src/ui/components/midi-visualization.ts` | `src/ui/components/midi-visualization.ts` | MIDINoteEvent, MIDICCEvent, MIDIPitchBendEvent, +17 |
| `src/ui/components/missing-pack-placeholder.ts` | `src/ui/components/missing-pack-placeholder.ts` | MissingPackInfo, createMissingPackInfo, createMissingPackPlaceholder, +2 |
| `src/ui/components/mixer-panel.ts` | `src/ui/components/mixer-panel.ts` | MixerTrack, MixerPanelConfig, createMixerPanel, +3 |
| `src/ui/components/modal-root.ts` | `src/ui/components/modal-root.ts` | Modal, ModalRoot, getModalRoot, +1 |
| `src/ui/components/new-project-wizard.ts` | `src/ui/components/new-project-wizard.ts` | NewProjectWizardOptions, WizardState, NewProjectWizard, +1 |
| `src/ui/components/notation-harmony-overlay.ts` | `src/ui/components/notation-harmony-overlay.ts` | NotationHarmonyOverlayOptions, createNotationHarmonyOverlay, injectNotationHarmonyOverlayStyles |
| `src/ui/components/parameter-randomizer.ts` | `src/ui/components/parameter-randomizer.ts` | ParameterId, ParameterDescriptor, ParameterConstraint, +5 |
| `src/ui/components/phrase-adaptation-settings.ts` | `src/ui/components/phrase-adaptation-settings.ts` | AdaptationSettingsState, CategoryAdaptationSettings, BoardAdaptationSettings, +8 |
| `src/ui/components/phrase-browser-ui.ts` | `src/ui/components/phrase-browser-ui.ts` | PhraseBrowserState, PhraseSortOption, BrowserAction, +12 |
| `src/ui/components/phrase-cards.ts` | `src/ui/components/phrase-cards.ts` | PhraseCardData, PhraseCardsOptions, createPhraseCards |
| `src/ui/components/phrase-commit-dialog.ts` | `src/ui/components/phrase-commit-dialog.ts` | PhraseCommitData, PhraseCommitResult, showPhraseCommitDialog |
| `src/ui/components/piano-roll-panel.ts` | `src/ui/components/piano-roll-panel.ts` | PianoKeyboard, TimeGrid, NoteLane, +233 |
| `src/ui/components/piano-roll-store-adapter.ts` | `src/ui/components/piano-roll-store-adapter.ts` | NoteRectangle, PianoRollSharedState, PianoRollStateCallback, +3 |
| `src/ui/components/preset-browser.ts` | `src/ui/components/preset-browser.ts` | PresetBrowserConfig, PresetSortMode, PresetViewMode, +17 |
| `src/ui/components/preset-compare.ts` | `src/ui/components/preset-compare.ts` | PresetCompareState, CompareMode, ParameterDifference, +13 |
| `src/ui/components/preset-history.ts` | `src/ui/components/preset-history.ts` | PresetHistoryEntry, PresetHistoryState, PresetFavoritesState, +32 |
| `src/ui/components/preset-preview.ts` | `src/ui/components/preset-preview.ts` | PreviewConfig, PreviewNote, PreviewChord, +17 |
| `src/ui/components/project-browser.ts` | `src/ui/components/project-browser.ts` | ProjectMetadata, ProjectBrowserConfig, ProjectBrowser, +1 |
| `src/ui/components/project-diff-viewer.ts` | `src/ui/components/project-diff-viewer.ts` | DiffViewerOptions, ProjectDiffViewer, diffViewerStyles |
| `src/ui/components/project-export-dialog.ts` | `src/ui/components/project-export-dialog.ts` | ProjectExportDialog, openProjectExportDialog |
| `src/ui/components/project-import-dialog.ts` | `src/ui/components/project-import-dialog.ts` | ProjectImportConfig, ProjectImportDialog |
| `src/ui/components/properties-panel.ts` | `src/ui/components/properties-panel.ts` | PropertiesPanelState, PropertiesPanelConfig, PropertiesPanel |
| `src/ui/components/reference-library-deck.ts` | `src/ui/components/reference-library-deck.ts` | ReferenceCategory, ReferenceItem, REFERENCE_CATEGORIES, +3 |
| `src/ui/components/reveal-panel.ts` | `src/ui/components/reveal-panel.ts` | RevealPanelState, RevealTab, RevealPanelContext, +9 |
| `src/ui/components/routing-overlay-impl.ts` | `src/ui/components/routing-overlay-impl.ts` | RoutingOverlayOptions, RoutingOverlayState, PortPosition, +2 |
| `src/ui/components/routing-overlay.ts` | `src/ui/components/routing-overlay.ts` | RoutingOverlay, injectRoutingOverlayStyles |
| `src/ui/components/sample-browser.ts` | `src/ui/components/sample-browser.ts` | SampleMetadata, SampleType, SampleSource, +65 |
| `src/ui/components/sample-flow.ts` | `src/ui/components/sample-flow.ts` | SampleDragData, DropTargetType, DropZoneConfig, +11 |
| `src/ui/components/sample-waveform-preview.ts` | `src/ui/components/sample-waveform-preview.ts` | WaveformPreviewConfig, WaveformDisplayMode, WaveformColors, +23 |
| `src/ui/components/session-grid-panel.ts` | `src/ui/components/session-grid-panel.ts` | SessionSlot, SessionGridConfig, createSessionGridPanel |
| `src/ui/components/shortcuts-help-panel.ts` | `src/ui/components/shortcuts-help-panel.ts` | ShortcutsHelpPanelConfig, ShortcutsHelpPanel, openShortcutsHelp |
| `src/ui/components/shortcuts-help.ts` | `src/ui/components/shortcuts-help.ts` | ShortcutDisplay, ShortcutsHelpOptions, ShortcutsHelp, +1 |
| `src/ui/components/sound-design-library-deck.ts` | `src/ui/components/sound-design-library-deck.ts` | PresetId, PresetMetadata, PresetCollection, +4 |
| `src/ui/components/spectrum-analyzer.ts` | `src/ui/components/spectrum-analyzer.ts` | SpectrumDisplayMode, FrequencyScale, SpectrumAnalyzerOptions, +1 |
| `src/ui/components/splash-screen.ts` | `src/ui/components/splash-screen.ts` | SplashScreenState, SplashScreenConfig, createInitialSplashState, +9 |
| `src/ui/components/stack-component.ts` | `src/ui/components/stack-component.ts` | StackState, StackOrientation, StackOverflow, +10 |
| `src/ui/components/stereo-imaging-visualizer.ts` | `src/ui/components/stereo-imaging-visualizer.ts` | StereoImagingVisualizerConfig, StereoMeteringData, StereoImagingVisualizer, +3 |
| `src/ui/components/template-browser.ts` | `src/ui/components/template-browser.ts` | TemplateBrowser, injectTemplateBrowserStyles |
| `src/ui/components/test-panel.ts` | `src/ui/components/test-panel.ts` | createTestPanel |
| `src/ui/components/theory-card-patterns.ts` | `src/ui/components/theory-card-patterns.ts` | InspectorFact, InspectorGoal, SpecInspectorProps, +22 |
| `src/ui/components/timeline-ruler.ts` | `src/ui/components/timeline-ruler.ts` | TimeSignature, TempoChange, SectionMarker, +2 |
| `src/ui/components/toast-notification.ts` | `src/ui/components/toast-notification.ts` | ToastType, ToastPosition, ToastOptions, +8 |
| `src/ui/components/tool-toggle-panel.ts` | `src/ui/components/tool-toggle-panel.ts` | ToolToggleOptions, ToolTogglePanel |
| `src/ui/components/tracker-panel.ts` | `src/ui/components/tracker-panel.ts` | ColumnType, TrackColumn, TrackerTrack, +176 |
| `src/ui/components/tracker-store-adapter.ts` | `src/ui/components/tracker-store-adapter.ts` | TrackerSharedState, TrackerStateCallback, TrackerAdapterOptions, +2 |
| `src/ui/components/tutorial-mode.ts` | `src/ui/components/tutorial-mode.ts` | TutorialStep, TutorialAction, Tutorial, +6 |
| `src/ui/components/undo-history-browser.ts` | `src/ui/components/undo-history-browser.ts` | UndoHistoryBrowserConfig, UndoHistoryBrowser, createUndoHistoryBrowserDeck |
| `src/ui/components/unknown-card-placeholder.ts` | `src/ui/components/unknown-card-placeholder.ts` | UnknownCardInfo, parseCardId, createUnknownCardInfo, +3 |
| `src/ui/components/variation-preview.ts` | `src/ui/components/variation-preview.ts` | VariationPreviewState, ABComparison, PreviewAction, +11 |
| `src/ui/components/virtual-list.ts` | `src/ui/components/virtual-list.ts` | VirtualListConfig, VirtualList, VirtualGridConfig, +1 |
| `src/ui/components/visual-eq.ts` | `src/ui/components/visual-eq.ts` | FilterType, EQBand, VisualEQOptions, +1 |
| `src/ui/components/visualization-canvas.ts` | `src/ui/components/visualization-canvas.ts` | VisualizationMode, VisualizationTheme, VisualizationCanvasOptions, +13 |
| `src/ui/components/waveform-visualizer.ts` | `src/ui/components/waveform-visualizer.ts` | WaveformData, WaveformRegion, WaveformVisualizerOptions, +2 |
| `src/ui/components/welcome-screen.ts` | `src/ui/components/welcome-screen.ts` | WelcomeScreenOptions, createWelcomeScreen |
| `src/ui/components/what-brings-you-selector.ts` | `src/ui/components/what-brings-you-selector.ts` | UserIntent, IntentOption, WhatBringsYouState, +12 |
| `src/ui/components/whats-this-mode.ts` | `src/ui/components/whats-this-mode.ts` | WhatsThisInfo, WhatsThisConfig, WhatsThisMode, +1 |
| `src/ui/composer-deck-bar.ts` | `src/ui/composer-deck-bar.ts` | DeckSlotId, asDeckSlotId, GeneratorCardType, +38 |
| `src/ui/composer-deck-layout.ts` | `src/ui/composer-deck-layout.ts` | ComposerDeckPanelId, PanelVisibility, PanelHeights, +50 |
| `src/ui/core-card-adapter.ts` | `src/ui/core-card-adapter.ts` | mapPortTypeToUI, mapCardPortToUI, coreCardToUI, +7 |
| `src/ui/deck-layout.ts` | `src/ui/deck-layout.ts` | SlotGridDeckId, asSlotGridDeckId, SlotId, +8 |
| `src/ui/deck-layouts.ts` | `src/ui/deck-layouts.ts` | LayoutOrientation, StackType, StackConfig, +35 |
| `src/ui/deck-reveal.ts` | `src/ui/deck-reveal.ts` | RevealMode, RevealPosition, EasingFunction, +18 |
| `src/ui/demo-decks.ts` | `src/ui/demo-decks.ts` | DemoCard, DemoConnection, DemoDeck, +28 |
| `src/ui/demo-songs.ts` | `src/ui/demo-songs.ts` | DemoSong, DemoSongStep, FIRST_BEAT_DEMO, +28 |
| `src/ui/design-system-bridge.ts` | `src/ui/design-system-bridge.ts` | CSS_VARIABLES, CardPlayTheme, DARK_THEME, +19 |
| `src/ui/drag-drop-payloads.ts` | `src/ui/drag-drop-payloads.ts` | CardTemplatePayload, PhrasePayload, ClipPayload, +15 |
| `src/ui/drag-drop-system.ts` | `src/ui/drag-drop-system.ts` | DragItemType, DropEffect, DragSource, +10 |
| `src/ui/drop-handlers.ts` | `src/ui/drop-handlers.ts` | registerDropHandler, getDropHandler, handlePhraseToPatternEditor, +10 |
| `src/ui/editor-widget.ts` | `src/ui/editor-widget.ts` | EditorCategory, EditorWidgetMeta, EditorWidgetState, +6 |
| `src/ui/enhanced-empty-states.ts` | `src/ui/enhanced-empty-states.ts` | EmptyStateConfig, createEmptyState, EMPTY_STATES, +3 |
| `src/ui/event-styling.ts` | `src/ui/event-styling.ts` | EventOrigin, EventStyling, DEFAULT_OPACITIES, +7 |
| `src/ui/focus-ring.ts` | `src/ui/focus-ring.ts` | focusRingCSS, focusRingTokens, applyFocusRing, +7 |
| `src/ui/generated-styling.ts` | `src/ui/generated-styling.ts` | GENERATED_CLASSES, getGeneratedContentVars, injectGeneratedContentStyles, +6 |
| `src/ui/ghost-notes.ts` | `src/ui/ghost-notes.ts` | GhostNote, GhostNoteSource, GhostNoteFilter, +4 |
| `src/ui/index.ts` | `src/ui/index.ts` |  |
| `src/ui/keyboard-navigation.ts` | `src/ui/keyboard-navigation.ts` | FocusableType, NavDirection, FocusTarget, +10 |
| `src/ui/keyboard-shortcuts.ts` | `src/ui/keyboard-shortcuts.ts` | KeyboardShortcut, ShortcutCategory, KeyEventData, +4 |
| `src/ui/layout-bridge.ts` | `src/ui/layout-bridge.ts` | LayoutOrientation, ConnectionStyle, DeckLayout, +33 |
| `src/ui/layout.ts` | `src/ui/layout.ts` | LayoutDirection, ResizeDirection, DockPosition, +87 |
| `src/ui/onboarding.ts` | `src/ui/onboarding.ts` | GenrePreference, InstrumentPreference, UserGoal, +45 |
| `src/ui/performance/index.ts` | `src/ui/performance/index.ts` |  |
| `src/ui/performance/monitor.ts` | `src/ui/performance/monitor.ts` | getPerformanceMonitor, createPerformanceHUD |
| `src/ui/phrase-library-panel.ts` | `src/ui/phrase-library-panel.ts` | PhraseId, asPhraseId, PhraseRecord, +52 |
| `src/ui/piano-roll-integration.ts` | `src/ui/piano-roll-integration.ts` | EnhancedNoteRectangle, PianoKeyInfo, ScaleGridLine, +5 |
| `src/ui/polish-tracker.ts` | `src/ui/polish-tracker.ts` | PolishTask, polishTasks, getPolishStats, +5 |
| `src/ui/polish/checklist.ts` | `src/ui/polish/checklist.ts` | PolishItem, PolishCategory, UIPolishChecklist |
| `src/ui/ports/index.ts` | `src/ui/ports/index.ts` |  |
| `src/ui/ports/port-css-class.ts` | `src/ui/ports/port-css-class.ts` | getPortCssClass, getLegacyPortCssClass, getConnectionCssClass, +6 |
| `src/ui/ports/port-mapping.ts` | `src/ui/ports/port-mapping.ts` | uiPortTypeToCanonical, uiCanonicalToPortType, portSpecToCanonical, +5 |
| `src/ui/projections/event-projections.ts` | `src/ui/projections/event-projections.ts` | TrackerRow, TrackerProjection, projectTrackerRows, +10 |
| `src/ui/reveal-panel-ai-advisor.ts` | `src/ui/reveal-panel-ai-advisor.ts` | AIAdvisorRevealTabOptions, createAIAdvisorRevealTab, createAIAdvisorTabs |
| `src/ui/reveal-panel-audio.ts` | `src/ui/reveal-panel-audio.ts` | VisualizationMode, VisualizationConfig, LevelMeterState, +6 |
| `src/ui/score-notation-session-bridge.ts` | `src/ui/score-notation-session-bridge.ts` | NotationEditType, NotationEdit, ClipSelectionCallback, +9 |
| `src/ui/session-clip-adapter.ts` | `src/ui/session-clip-adapter.ts` | SessionSlot, SessionSharedState, SessionStateCallback, +5 |
| `src/ui/session-view-store-bridge.ts` | `src/ui/session-view-store-bridge.ts` | SessionTrackConfig, SessionSceneConfig, SessionGridPosition, +6 |
| `src/ui/session-view.ts` | `src/ui/session-view.ts` | ClipSlotState, GridPosition, ClipSlot, +192 |
| `src/ui/theme.ts` | `src/ui/theme.ts` | ThemeMode, ColorIntent, ColorShade, +51 |
| `src/ui/theme/board-tokens.ts` | `src/ui/theme/board-tokens.ts` | CONTROL_LEVEL_COLORS, ThemeTokens, LIGHT_THEME, +6 |
| `src/ui/tooltips.ts` | `src/ui/tooltips.ts` | TooltipType, TooltipPosition, TooltipContent, +58 |
| `src/ui/tutorials.ts` | `src/ui/tutorials.ts` | TutorialStepType, ValidationCriteria, TutorialStep, +31 |
| `src/ui/ui-event-bus.ts` | `src/ui/ui-event-bus.ts` | UIEventType, UIEvent, UIEventListener, +4 |
| `src/ui/utils/accessibility-audit.ts` | `src/ui/utils/accessibility-audit.ts` | AccessibilityIssue, AccessibilityAuditResult, auditAccessibility, +3 |
| `src/ui/utils/contrast-checker.ts` | `src/ui/utils/contrast-checker.ts` | getContrastRatio, WCAGLevel, TextSize, +4 |
| `src/ui/utils/micro-interactions.ts` | `src/ui/utils/micro-interactions.ts` | addPulseOnClick, addRippleEffect, addHoverLift, +9 |
| `src/ui/utils/polish-checklist.ts` | `src/ui/utils/polish-checklist.ts` | UIPolishChecklist, createUIPolishChecklist, calculateChecklistCompletion, +6 |
| `src/ui/video/frame-compositor.ts` | `src/ui/video/frame-compositor.ts` | FrameConfig, DEFAULT_FRAME_CONFIG, CompositorTheme, +6 |
| `src/ui/video/index.ts` | `src/ui/video/index.ts` | TutorialVideoOptions, createPreviewPlayer, VideoGenerationPipeline |
| `src/ui/video/interaction-recorder.ts` | `src/ui/video/interaction-recorder.ts` | InteractionType, EasingFunction, MouseButton, +33 |
| `src/ui/video/screenshot-sequence.ts` | `src/ui/video/screenshot-sequence.ts` |  |
| `src/ui/video/video-exporter.ts` | `src/ui/video/video-exporter.ts` | VideoFormat, VideoCodec, QualityPreset, +11 |
| `src/ui/visual-density.ts` | `src/ui/visual-density.ts` | VisualDensity, DensityConfig, DENSITY_PRESETS, +4 |
| `src/ui/visual-effects.ts` | `src/ui/visual-effects.ts` | gradients, shadows, GlassmorphismOptions, +18 |
| `src/ui/visualization-bridge.ts` | `src/ui/visualization-bridge.ts` | TimeSignature, TransportState, WaveformState, +47 |
| `src/ui/visualization.ts` | `src/ui/visualization.ts` | WaveformRenderMode, WaveformChannelMode, WaveformPeak, +80 |
| `src/user-cards/card-editor-panel.ts` | `src/user-cards/card-editor-panel.ts` | EditorLayoutMode, EditorTab, EditorCardDefinition, +32 |
| `src/user-cards/card-metadata-ui.ts` | `src/user-cards/card-metadata-ui.ts` | IconPickerOptions, ColorScheme, CategoryOption, +25 |
| `src/user-cards/cardscript/ast.ts` | `src/user-cards/cardscript/ast.ts` | NodeKind, BaseNode, TypeReference, +68 |
| `src/user-cards/cardscript/async.ts` | `src/user-cards/cardscript/async.ts` | CancelToken, createCancelToken, AsyncCancelError, +18 |
| `src/user-cards/cardscript/autocomplete.ts` | `src/user-cards/cardscript/autocomplete.ts` | CompletionKind, CompletionItem, CompletionContext, +8 |
| `src/user-cards/cardscript/compiler.ts` | `src/user-cards/cardscript/compiler.ts` | CardValue, CompiledFunction, RuntimeContext, +8 |
| `src/user-cards/cardscript/debug.ts` | `src/user-cards/cardscript/debug.ts` | SourceLocation, Breakpoint, StackFrame, +13 |
| `src/user-cards/cardscript/docgen.ts` | `src/user-cards/cardscript/docgen.ts` | DocEntry, DocParam, DocReturn, +13 |
| `src/user-cards/cardscript/errors.ts` | `src/user-cards/cardscript/errors.ts` | ErrorCategory, ErrorSeverity, ErrorCode, +13 |
| `src/user-cards/cardscript/examples.ts` | `src/user-cards/cardscript/examples.ts` | ExampleCategory, ExampleDifficulty, ExampleMeta, +9 |
| `src/user-cards/cardscript/grammar.ts` | `src/user-cards/cardscript/grammar.ts` | TokenType, KEYWORDS, SourcePosition, +8 |
| `src/user-cards/cardscript/highlight.ts` | `src/user-cards/cardscript/highlight.ts` | TokenClass, HighlightToken, HighlightTheme, +15 |
| `src/user-cards/cardscript/index.ts` | `src/user-cards/cardscript/index.ts` |  |
| `src/user-cards/cardscript/invoke-ext.ts` | `src/user-cards/cardscript/invoke-ext.ts` | ParamValidationResult, ParamValidationError, ParamValidationWarning, +39 |
| `src/user-cards/cardscript/invoke.ts` | `src/user-cards/cardscript/invoke.ts` | ParamOverrides, InvokeResult, PresetDef, +49 |
| `src/user-cards/cardscript/lexer.ts` | `src/user-cards/cardscript/lexer.ts` | LexerError, LexerOptions, LexerResult, +2 |
| `src/user-cards/cardscript/live-mode.ts` | `src/user-cards/cardscript/live-mode.ts` | HotReloadState, UndoAction, UndoStack, +20 |
| `src/user-cards/cardscript/live.ts` | `src/user-cards/cardscript/live.ts` | valuePool, CompleteCardDef, LiveCardDef, +44 |
| `src/user-cards/cardscript/migration.ts` | `src/user-cards/cardscript/migration.ts` | Version, MigrationFn, MigrationResult, +17 |
| `src/user-cards/cardscript/modules.ts` | `src/user-cards/cardscript/modules.ts` | ModuleId, ResolvedModule, ModuleExports, +9 |
| `src/user-cards/cardscript/parser.ts` | `src/user-cards/cardscript/parser.ts` | ParserError, peekNext, ParseResult, +3 |
| `src/user-cards/cardscript/playground-ui.ts` | `src/user-cards/cardscript/playground-ui.ts` | PlaygroundState, PlaygroundOutput, PlaygroundExample, +9 |
| `src/user-cards/cardscript/playground.ts` | `src/user-cards/cardscript/playground.ts` | PlaygroundDiagnostic, PlaygroundCompileResult, PlaygroundConfig, +13 |
| `src/user-cards/cardscript/presets.ts` | `src/user-cards/cardscript/presets.ts` | GainComplete, GainLive, OscillatorComplete, +13 |
| `src/user-cards/cardscript/query.ts` | `src/user-cards/cardscript/query.ts` | PhraseList, PhraseListBuilder, PhraseMetadata, +30 |
| `src/user-cards/cardscript/repl.ts` | `src/user-cards/cardscript/repl.ts` | ReplCommand, ReplOptions, ReplState, +8 |
| `src/user-cards/cardscript/sandbox.ts` | `src/user-cards/cardscript/sandbox.ts` | SandboxContext, DEFAULT_SANDBOX_CONTEXT, USER_CARD_SANDBOX_CONTEXT, +10 |
| `src/user-cards/cardscript/security.ts` | `src/user-cards/cardscript/security.ts` | SecuritySeverity, SecurityCategory, SecurityIssue, +8 |
| `src/user-cards/cardscript/sourcemap.ts` | `src/user-cards/cardscript/sourcemap.ts` | SourceMap, MappingSegment, DecodedMapping, +15 |
| `src/user-cards/cardscript/types.ts` | `src/user-cards/cardscript/types.ts` | Type, TypeKind, PrimitiveType, +29 |
| `src/user-cards/deck-template-advanced.ts` | `src/user-cards/deck-template-advanced.ts` | TemplateVariation, createVariation, applyVariation, +27 |
| `src/user-cards/deck-templates.ts` | `src/user-cards/deck-templates.ts` | TemplateCategory, TemplateParam, TemplateSlot, +18 |
| `src/user-cards/manifest-changelog.ts` | `src/user-cards/manifest-changelog.ts` | ChangeType, ChangeEntry, VersionChangelog, +6 |
| `src/user-cards/manifest-diff.ts` | `src/user-cards/manifest-diff.ts` | DiffOperation, DiffEntry, ManifestDiff, +5 |
| `src/user-cards/manifest-editor-ui.ts` | `src/user-cards/manifest-editor-ui.ts` | ManifestEditorState, createDefaultManifest, createEditorState, +6 |
| `src/user-cards/manifest-linter.ts` | `src/user-cards/manifest-linter.ts` | LintSeverity, LintCategory, LintRule, +10 |
| `src/user-cards/manifest-merge.ts` | `src/user-cards/manifest-merge.ts` | MergeStrategy, MergeConflict, MergeResult, +5 |
| `src/user-cards/manifest-metadata.ts` | `src/user-cards/manifest-metadata.ts` | ManifestMetadata, PackageIdentity, DependencyMetadata, +16 |
| `src/user-cards/manifest-preview.ts` | `src/user-cards/manifest-preview.ts` | PreviewFormat, PreviewOptions, PreviewResult, +4 |
| `src/user-cards/manifest-publishing.ts` | `src/user-cards/manifest-publishing.ts` | PublishStage, VersionBumpType, PublishOptions, +5 |
| `src/user-cards/manifest-registry.ts` | `src/user-cards/manifest-registry.ts` | RegistryConfig, UploadProgress, RegistryResponse, +5 |
| `src/user-cards/manifest-signature.ts` | `src/user-cards/manifest-signature.ts` | SignatureAlgorithm, HashAlgorithm, SignatureMetadata, +7 |
| `src/user-cards/manifest-testing.ts` | `src/user-cards/manifest-testing.ts` | TestStatus, TestSeverity, TestCase, +5 |
| `src/user-cards/manifest-update-checker.ts` | `src/user-cards/manifest-update-checker.ts` | UpdateStatus, UpdateInfo, UpdateCheckResult, +5 |
| `src/user-cards/manifest.ts` | `src/user-cards/manifest.ts` | MANIFEST_VERSION, SemverConstraint, DependencySpec, +25 |
| `src/user-cards/monaco-editor.ts` | `src/user-cards/monaco-editor.ts` | MonacoEditor, MonacoEditorOptions, MonacoMarker, +8 |
| `src/user-cards/pack-discovery.ts` | `src/user-cards/pack-discovery.ts` | PackCategory, CategoryInfo, CategoryFilter, +13 |
| `src/user-cards/pack-ratings.ts` | `src/user-cards/pack-ratings.ts` | StarRating, ReviewStatus, PackRating, +12 |
| `src/user-cards/pack-rollback.ts` | `src/user-cards/pack-rollback.ts` | InstallationSnapshot, RollbackOperation, RollbackHistoryEntry, +5 |
| `src/user-cards/pack-security.ts` | `src/user-cards/pack-security.ts` | PackLocation, PackTrustLevel, getTrustLevel, +12 |
| `src/user-cards/pack-stats.ts` | `src/user-cards/pack-stats.ts` | DownloadEvent, PackDownloadStats, DownloadDataPoint, +6 |
| `src/user-cards/pack-version.ts` | `src/user-cards/pack-version.ts` | ParsedVersion, parseVersion, compareVersions, +12 |
| `src/user-cards/pack.ts` | `src/user-cards/pack.ts` | PACK_MAGIC, PackHeader, PackEntry, +13 |
| `src/user-cards/template-preview.ts` | `src/user-cards/template-preview.ts` | TemplatePreview, PreviewElement, PreviewSlot, +11 |
| `src/vite-env.d.ts` | `src/vite-env.d.ts` |  |
| `src/voices/index.ts` | `src/voices/index.ts` |  |
| `src/voices/voice.ts` | `src/voices/voice.ts` | Pitch, PitchSystem, MIDIPitch, +38 |

## Aliased Modules

These modules have been moved but maintain compatibility:

| Canonical Path | Actual Path | Status |
|---------------|-------------|--------|
| `src/extensions/registry/v2/diff.ts` | `src/registry/v2/diff.ts` | Redirected |
| `src/extensions/registry/v2/index.ts` | `src/registry/v2/index.ts` | Redirected |
| `src/extensions/registry/v2/merge.ts` | `src/registry/v2/merge.ts` | Redirected |
| `src/extensions/registry/v2/policy.ts` | `src/registry/v2/policy.ts` | Redirected |
| `src/extensions/registry/v2/reports.ts` | `src/registry/v2/reports.ts` | Redirected |
| `src/extensions/registry/v2/schema.ts` | `src/registry/v2/schema.ts` | Redirected |
| `src/extensions/registry/v2/types.ts` | `src/registry/v2/types.ts` | Redirected |
| `src/extensions/registry/v2/validate.ts` | `src/registry/v2/validate.ts` | Redirected |

## Legacy Modules

These modules are deprecated and should not be used in new code:

| Actual Path | Canonical Replacement | Status |
|-------------|----------------------|--------|

---

## Guidelines

1. **New code**: Always import from canonical paths
2. **Aliased modules**: Update imports gradually during refactors
3. **Legacy modules**: Do not use in new code; migrate existing usage

To regenerate this document: `npm run docs:sync-modules`
