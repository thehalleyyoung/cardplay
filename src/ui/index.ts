/**
 * @fileoverview UI Framework barrel export.
 * 
 * This module exports the complete UI infrastructure including:
 * - Design system foundation (theming, colors, typography)
 * - Core UI components
 * - Layout system
 * - Visualization components
 */

// ============================================================================
// THEME EXPORTS
// ============================================================================

export {
  // Types
  type ThemeMode,
  type ColorIntent,
  type ColorShade,
  type ColorScale,
  type SemanticColors,
  type TypographySize,
  type TypographyWeight,
  type TypographyStyle,
  type TypographyScale,
  type SpacingSize,
  type RadiusSize,
  type ElevationLevel,
  type AnimationDuration,
  type AnimationEasing,
  type AnimationTiming,
  type Theme,
  type FocusRingStyle,
  type StateStyles,
  type ThemeContext,
  
  // Color Scales
  NEUTRAL_SCALE,
  PRIMARY_SCALE,
  SECONDARY_SCALE,
  ACCENT_SCALE,
  SUCCESS_SCALE,
  WARNING_SCALE,
  ERROR_SCALE,
  INFO_SCALE,
  COLOR_SCALES,
  
  // Semantic Colors
  LIGHT_COLORS,
  DARK_COLORS,
  HIGH_CONTRAST_COLORS,
  
  // Typography
  DEFAULT_TYPOGRAPHY,
  
  // Spacing & Sizing
  SPACING_SCALE,
  RADIUS_SCALE,
  SHADOW_SCALE,
  
  // Animation
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
  
  // Theme Factory
  createTheme,
  LIGHT_THEME,
  DARK_THEME,
  HIGH_CONTRAST_THEME,
  
  // CSS Properties
  themeToCSSProperties,
  themeToCSSString,
  applyTheme,
  
  // Focus & State
  DEFAULT_FOCUS_RING,
  focusRingCSS,
  DEFAULT_STATE_STYLES,
  
  // Theme Context
  getSystemThemeMode,
  getStoredThemeMode,
  storeThemeMode,
  watchSystemTheme,
  
  // Accessibility
  prefersReducedMotion,
  getAnimationDuration,
  prefersHighContrast,
} from './theme';

// ============================================================================
// COMPONENTS EXPORTS
// ============================================================================

export {
  // Common Types
  type ComponentSize,
  type ComponentVariant,
  type ComponentState,
  type ComponentEventHandler,
  DEFAULT_COMPONENT_STATE,
  
  // Button
  type ButtonType,
  type ButtonProps,
  type ButtonStyle,
  DEFAULT_BUTTON_PROPS,
  getButtonStyle,
  getButtonColors,
  
  // Icon Button
  type IconButtonProps,
  DEFAULT_ICON_BUTTON_PROPS,
  getIconButtonSize,
  
  // Toggle Button
  type ToggleButtonProps,
  DEFAULT_TOGGLE_BUTTON_PROPS,
  
  // Button Group
  type ButtonGroupItem,
  type ButtonGroupProps,
  DEFAULT_BUTTON_GROUP_PROPS,
  
  // Slider
  type SliderProps,
  DEFAULT_SLIDER_PROPS,
  sliderToPercent,
  percentToSlider,
  
  // Range Slider
  type RangeSliderProps,
  DEFAULT_RANGE_SLIDER_PROPS,
  
  // Knob
  type KnobProps,
  DEFAULT_KNOB_PROPS,
  getKnobSize,
  knobToAngle,
  
  // Number Input
  type NumberInputProps,
  DEFAULT_NUMBER_INPUT_PROPS,
  parseNumberInput,
  
  // Text Input
  type TextInputType,
  type TextInputProps,
  type ValidationResult,
  DEFAULT_TEXT_INPUT_PROPS,
  validateTextInput,
  
  // Select
  type SelectOption,
  type SelectProps,
  DEFAULT_SELECT_PROPS,
  groupSelectOptions,
  
  // Combobox
  type ComboboxProps,
  DEFAULT_COMBOBOX_PROPS,
  defaultComboboxFilter,
  filterComboboxOptions,
  
  // Checkbox
  type CheckboxState,
  type CheckboxProps,
  DEFAULT_CHECKBOX_PROPS,
  getCheckboxState,
  
  // Switch
  type SwitchProps,
  DEFAULT_SWITCH_PROPS,
  getSwitchDimensions,
  
  // Radio Group
  type RadioOption,
  type RadioGroupProps,
  DEFAULT_RADIO_GROUP_PROPS,
  
  // Tabs
  type TabItem,
  type TabsProps,
  DEFAULT_TABS_PROPS,
  
  // Accordion
  type AccordionItem,
  type AccordionProps,
  DEFAULT_ACCORDION_PROPS,
  toggleAccordionItem,
  
  // Tree
  type TreeNode,
  type TreeProps,
  DEFAULT_TREE_PROPS,
  flattenTreeNodes,
  
  // Virtual List
  type VirtualListItem,
  type VirtualListState,
  calculateVirtualListState,
  
  // Table
  type TableColumn,
  type SortDirection,
  type TableSortState,
  type TableProps,
  sortTableData,
  
  // Menu
  type MenuItemType,
  type MenuItem,
  type MenuProps,
  menuSeparator,
  menuHeader,
  menuItem,
  submenu,
  
  // Tooltip
  type TooltipPosition,
  type TooltipProps,
  DEFAULT_TOOLTIP_PROPS,
  calculateTooltipPosition,
} from './components';

// ============================================================================
// LAYOUT EXPORTS
// ============================================================================

export {
  // Types
  type LayoutDirection,
  type ResizeDirection,
  type DockPosition,
  type PanelVisibility,
  
  // Panel
  type PanelConstraints,
  type PanelState,
  DEFAULT_PANEL_CONSTRAINTS,
  DEFAULT_PANEL_STATE,
  clampPanelSize,
  calculateResizeDelta,
  
  // Split Pane
  type SplitPaneState,
  DEFAULT_SPLIT_PANE_STATE,
  calculateSplitPaneSizes,
  handleSplitPaneDrag,
  
  // Dock Layout
  type DockPanel,
  type DockNodeType,
  type DockTabNode,
  type DockSplitNode,
  type DockPanelNode,
  type DockNode,
  type DockLayoutState,
  createDockLayoutState,
  addDockPanel,
  removeDockPanel,
  
  // Tab Panel
  type TabPanelItem,
  type TabPanelState,
  createTabPanelState,
  addTab,
  removeTab,
  reorderTabs,
  
  // Floating Panel
  type FloatingPanelState,
  type FloatingPanelManager,
  DEFAULT_FLOATING_PANEL,
  createFloatingPanelManager,
  bringToFront,
  moveFloatingPanel,
  resizeFloatingPanel,
  
  // Sidebar
  type SidebarState,
  DEFAULT_SIDEBAR_STATE,
  toggleSidebar,
  getSidebarWidth,
  
  // Toolbar
  type ToolbarItemType,
  type ToolbarItem,
  toolbarButton,
  toolbarToggle,
  toolbarSeparator,
  toolbarSpacer,
  
  // Scroll Area
  type ScrollAreaState,
  getScrollBarVisibility,
  getScrollBarThumbSize,
  getScrollBarThumbPosition,
  
  // Grid
  type GridItem,
  type GridLayoutState,
  DEFAULT_GRID_STATE,
  calculateGridItemBounds,
  
  // Layout Persistence
  type PersistedLayout,
  LAYOUT_SCHEMA_VERSION,
  serializeLayout,
  deserializeLayout,
  saveLayout,
  loadLayout,
  
  // Breakpoints
  type Breakpoints,
  type BreakpointName,
  DEFAULT_BREAKPOINTS,
  getCurrentBreakpoint,
  matchesBreakpoint,
  
  // Focus Navigation
  type FocusDirection,
  type FocusableElement,
  findNextFocusable,
} from './layout';

// ============================================================================
// VISUALIZATION EXPORTS
// ============================================================================

export {
  // Waveform
  type WaveformRenderMode,
  type WaveformChannelMode,
  type WaveformConfig,
  type WaveformPeak,
  type WaveformState,
  DEFAULT_WAVEFORM_CONFIG,
  calculateWaveformPeaks,
  normalizeWaveformPeaks,
  calculateStereoWaveformPeaks,
  createWaveformState,
  
  // Spectrogram
  type SpectrogramScale,
  type SpectrogramColorScheme,
  type SpectrogramConfig,
  type ColorGradient,
  DEFAULT_SPECTROGRAM_CONFIG,
  windowFunctions,
  generateWindow,
  calculateMagnitudeSpectrum,
  frequencyToY,
  binToFrequency,
  spectrogramGradients,
  
  // Piano Keyboard
  type KeyType,
  type PianoKeyboardConfig,
  type PianoKey,
  type PianoKeyboardState,
  DEFAULT_PIANO_CONFIG,
  NOTE_NAMES,
  isBlackKey,
  midiNoteToName,
  midiNoteToOctave,
  getBlackKeyOffset,
  generatePianoKeys,
  createPianoKeyboardState,
  pianoNoteOn,
  pianoNoteOff,
  highlightNotes,
  
  // Level Meters
  type LevelMeterType,
  type LevelMeterScale,
  type LevelMeterOrientation,
  type LevelMeterConfig,
  type LevelMeterReading,
  type LevelMeterState,
  DEFAULT_LEVEL_METER_CONFIG,
  amplitudeToDb,
  dbToAmplitude,
  calculateLevel,
  applyMeterBallistics,
  updatePeakHold,
  dbToMeterPosition,
  getMeterColor,
  generateMeterScale,
  
  // Phase Meter
  type PhaseMeterConfig,
  type PhaseMeterState,
  DEFAULT_PHASE_METER_CONFIG,
  calculateCorrelation,
  createPhaseMeterState,
  
  // Timeline
  type TimelineMode,
  type TimelineConfig,
  type TimelineTick,
  type TimelineState,
  DEFAULT_TIMELINE_CONFIG,
  calculateBarDuration,
  generateTimelineTicks,
  createTimelineState,
  
  // Velocity
  type VelocityConfig,
  type VelocityBar,
  DEFAULT_VELOCITY_CONFIG,
  velocityToHeight,
  heightToVelocity,
  
  // XY Pad
  type XYPadConfig,
  type XYPadState,
  DEFAULT_XY_PAD_CONFIG,
  createXYPadState,
  pixelToXYValue,
  xyValueToPixel,
  
  // Envelope Editor
  type EnvelopeStageType,
  type EnvelopePoint,
  type EnvelopeEditorConfig,
  type ADSREnvelope,
  DEFAULT_ENVELOPE_EDITOR_CONFIG,
  DEFAULT_ADSR,
  adsrToPoints,
  getEnvelopeValue,
} from './visualization';

// ============================================================================
// CARD UI EXPORTS
// ============================================================================

export {
  // Card Surface
  type CardSize,
  type CardStyle,
  type CardState,
  type PortDirection,
  type PortType,
  type CardSurfaceConfig,
  type CardSurfaceState,
  type ResizeHandle,
  DEFAULT_CARD_SURFACE_CONFIG,
  CARD_SIZE_PRESETS,
  getCardDimensions,
  createCardSurfaceState,
  moveCard,
  resizeCard,
  startDrag,
  endDrag,
  startResize,
  endResize,
  toggleMinimize,
  toggleMaximize,
  setCardState,
  
  // Card Header
  type CardHeaderButton,
  type CardHeaderConfig,
  type CardHeaderState,
  DEFAULT_CARD_HEADER_CONFIG,
  createCardHeaderState,
  startTitleEdit,
  updateDraftTitle,
  confirmTitleEdit,
  cancelTitleEdit,
  toggleCardMenu,
  
  // Card Toolbar
  type ToolbarButtonType,
  type ToolbarButton,
  type CardToolbarConfig,
  DEFAULT_CARD_TOOLBAR_CONFIG,
  createToolbarButton,
  toggleToolbarButton,
  selectToolbarOption,
  
  // Card Content
  type ContentOverflow,
  type ContentLayout,
  type CardContentConfig,
  type ContentScrollState,
  DEFAULT_CARD_CONTENT_CONFIG,
  createContentScrollState,
  updateScroll,
  isScrollable,
  
  // Card Ports
  type CardPortConfig,
  type CardPortState,
  PORT_TYPE_COLORS,
  getPortColor,
  createCardPortState,
  addPortConnection,
  removePortConnection,
  arePortsCompatible,
  getPortScreenPosition,
  
  // Connections
  type CableStyle,
  type ConnectionConfig,
  type ConnectionState,
  DEFAULT_CONNECTION_CONFIG,
  createConnectionState,
  generateCablePoints,
  generateCablePath,
  
  // Card Preview
  type CardPreviewConfig,
  DEFAULT_CARD_PREVIEW_CONFIG,
  
  // Card Badge
  type BadgeType,
  type BadgePosition,
  type CardBadgeConfig,
  BADGE_TYPE_COLORS,
  getBadgeColor,
  
  // Card Menu
  type CardMenuItemType,
  type CardMenuItem,
  type CardMenuState,
  createMenuItem,
  createMenuSeparator,
  createCardMenuState,
  openMenu,
  closeMenu,
  
  // Card Stack
  type StackMode,
  type CardStackConfig,
  type CardStackState,
  DEFAULT_CARD_STACK_CONFIG,
  createCardStackState,
  addToStack,
  removeFromStack,
  setActiveCard,
  reorderStack,
  
  // Card Search
  type CardSearchConfig,
  type CardSearchState,
  DEFAULT_CARD_SEARCH_CONFIG,
  createCardSearchState,
  updateSearchQuery,
  setSearchResults,
  clearSearch,
  
  // Card Category
  type CardCategory,
  DEFAULT_CARD_CATEGORIES,
  matchesCategory,
  getCategoryForType,
  
  // Card Focus
  type CardNavigationDirection,
  type CardFocusState,
  createCardFocusState,
  focusCard,
  focusElement,
  trapFocus,
  releaseFocusTrap,
} from './cards';

// ============================================================================
// BEGINNER-FRIENDLY UI EXPORTS
// ============================================================================

export {
  // Welcome Screen
  type WelcomeTemplate,
  type WelcomeScreenConfig,
  type RecentProject,
  type WelcomeScreenState,
  DEFAULT_WELCOME_CONFIG,
  createWelcomeScreenState,
  filterTemplates,
  
  // Tutorial System
  type TutorialStepType,
  type ElementTarget,
  type TutorialStep,
  type TutorialConfig,
  type TutorialState,
  createTutorialState,
  startTutorial,
  nextTutorialStep,
  previousTutorialStep,
  skipTutorial,
  toggleTutorialPause,
  
  // Tooltip Tour
  type TourStop,
  type TooltipTourConfig,
  type TooltipTourState,
  createTooltipTourState,
  startTour,
  nextTourStop,
  previousTourStop,
  endTour,
  
  // Help Panel
  type HelpArticle,
  type HelpPanelConfig,
  type HelpPanelState,
  DEFAULT_HELP_PANEL_CONFIG,
  createHelpPanelState,
  openHelpPanel,
  closeHelpPanel,
  navigateToArticle,
  goBackInHelp,
  goForwardInHelp,
  searchHelpArticles,
  
  // Glossary
  type GlossaryTerm,
  type GlossaryConfig,
  createGlossaryLookup,
  findGlossaryTerm,
  getTermsByCategory,
  getGlossaryCategories,
  
  // Keyboard Shortcuts
  type KeyboardShortcut,
  type KeyboardShortcutsConfig,
  DEFAULT_SHORTCUT_CATEGORIES,
  parseKeyDisplay,
  searchShortcuts,
  groupShortcutsByCategory,
  
  // Search Everything
  type SearchResultType,
  type SearchResult,
  type SearchEverythingConfig,
  type SearchEverythingState,
  DEFAULT_SEARCH_EVERYTHING_CONFIG,
  createSearchEverythingState,
  openSearchEverything,
  closeSearchEverything,
  updateSearchEverythingQuery,
  setSearchEverythingResults,
  navigateSearchResults,
  addRecentSearch,
  
  // Suggested Actions
  type SuggestedAction,
  type SuggestedActionsState,
  createSuggestedActionsState,
  getVisibleSuggestions,
  dismissSuggestion,
  updateSuggestionContext,
  
  // Error Explainer
  type ErrorExplanation,
  type ErrorExplainerConfig,
  DEFAULT_ERROR_EXPLANATION,
  getErrorExplanation,
  
  // Undo History
  type HistoryEntry,
  type UndoHistoryState,
  createUndoHistoryState,
  addHistoryEntry,
  jumpToHistoryEntry,
  
  // Simplified Mode
  type SimplifiedModeConfig,
  type SimplifiedModeState,
  createSimplifiedModeState,
  toggleSimplifiedMode,
  setExperienceLevel,
  isFeatureVisible,
  
  // Progress Indicator
  type ProgressStep,
  type ProgressIndicatorState,
  createProgressIndicatorState,
  advanceProgress,
  completeProgress,
  
  // Onboarding Checklist
  type OnboardingTask,
  type OnboardingChecklistState,
  createOnboardingChecklistState,
  completeOnboardingTask,
  getOnboardingProgress,
  dismissOnboarding,
} from './beginner';

// ============================================================================
// PERSONALIZED ONBOARDING EXPORTS (Phase 10.2)
// ============================================================================

export {
  // Onboarding State
  type OnboardingStep as PersonalizedOnboardingStep,
  type GenrePreference,
  type InstrumentPreference,
  type UserGoal,
  type OnboardingState,
  createOnboardingState,
  saveOnboardingState,
  loadOnboardingState,
  hasCompletedOnboarding,
  
  // Onboarding Options
  type GenreOption,
  type SkillLevelOption,
  type DAWBackgroundOption,
  type InstrumentOption,
  type GoalOption,
  type AvatarOption,
  GENRE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  DAW_BACKGROUND_OPTIONS,
  INSTRUMENT_OPTIONS,
  GOAL_OPTIONS,
  AVATAR_PRESETS,
  
  // Onboarding Flow Control
  getNextOnboardingStep,
  getPreviousOnboardingStep,
  canProceedToNextStep,
  completeOnboarding as finalizeOnboarding,  // Aliased to avoid conflict
  
  // Personalized Dashboard
  type PersonalizedDashboard,
  type DashboardAction,
  generatePersonalizedDashboard,
} from './onboarding';

// =============================================================================
// PHASE 4 BRIDGE EXPORTS - Connecting Phase 4 Foundations to Phase 43 Components
// =============================================================================

// Visualization Bridge (Phase 4.3.4)
export {
  // Sync Visualization Types
  type SyncVisualization,
  type TransportState,
  type WaveformState as SyncWaveformState,  // Aliased to avoid conflict with visualization.ts
  type MIDIActivityState,
  type LevelsState,
  type ModulationState,
  type VoiceState,
  type PerformanceState,
  type TimeSignature,
  createSyncVisualization,
  
  // Visualization Colors
  type VisualizationColors,
  type VizThemeName,
  VIZ_COLOR_THEMES,
  DARK_VIZ_COLORS,
  LIGHT_VIZ_COLORS,
  HIGH_CONTRAST_VIZ_COLORS,
  RENOISE_VIZ_COLORS,
  ABLETON_VIZ_COLORS,
  DEFAULT_VIZ_COLORS,
  
  // Waveform Bridge
  type BridgedWaveformConfig,
  type WaveformDisplayState,
  createBridgedWaveformConfig,
  createWaveformDisplayState,
  
  // Meter Bridge
  type MeterType,
  type MeterOrientation,
  type BridgedMeterConfig,
  type MeterState,
  DEFAULT_METER_CONFIG,
  createMeterConfig,
  createMeterState,
  updateMeterState,
  
  // Spectrum Bridge
  type BridgedSpectrumConfig,
  DEFAULT_SPECTRUM_CONFIG,
  createSpectrumConfig,
  
  // MIDI Visualization Bridge
  type PianoKeyboardConfig as BridgedPianoConfig,  // Aliased to avoid conflict
  type NoteDisplayConfig,
  type NoteEvent,
  type MIDIVisualizationState,
  DEFAULT_PIANO_CONFIG as BRIDGED_PIANO_CONFIG,  // Aliased
  DEFAULT_NOTE_DISPLAY_CONFIG,
  createMIDIVisualizationState,
  
  // Beat Indicator Bridge
  type BeatIndicatorConfig,
  DEFAULT_BEAT_CONFIG,
  
  // Oscilloscope Bridge
  type OscilloscopeConfig,
  DEFAULT_SCOPE_CONFIG,
  
  // Render Helpers
  renderMeter,
  renderBeatIndicator,
  renderWaveform,
  renderVelocityBars,
  
  // CSS Generation
  generateVisualizationCSS,
  applyVisualizationCSS,
} from './visualization-bridge';

// Beginner UI Bridge (Phase 4.3.5)
export {
  // User Personas
  type ExperienceLevel,
  type UserBackground,
  type UserInterest,
  type UserPersona,
  USER_PERSONAS,
  
  // Progressive Disclosure
  type FeatureVisibility,
  type ProgressiveDisclosureConfig,
  type FeatureDefinition,
  FEATURES,
  isFeatureVisible as checkFeatureVisibility,  // Aliased to avoid conflict with beginner.ts
  getVisibleFeatures,
  getNextLevelFeatures,
  
  // CardPlay Tutorials
  type CardPlayTutorialTarget,
  type CardPlayTutorialStep,
  type CardPlayAutoAction,
  CARDPLAY_TUTORIALS,
  
  // Help Topics
  type CardPlayHelpTopic,
  CARDPLAY_HELP_TOPICS,
  
  // Onboarding
  type OnboardingStep,
  ONBOARDING_CHECKLIST,
  
  // Tooltips
  COMPONENT_TOOLTIPS,
  
  // State Management
  type BeginnerUIState,
  createBeginnerUIState,
  setUserPersona,
  completeOnboardingStep,
  startTutorial as beginTutorial,  // Aliased to avoid conflict
  nextTutorialStep as advanceTutorialStep,  // Aliased
  getCurrentTutorialStep,
  
  // CSS
  BEGINNER_UI_CSS,
  applyBeginnerUICSS,
} from './beginner-bridge';

// Layout Bridge (Phase 4.3.6)
export {
  // Layout Types
  type LayoutOrientation,
  type ConnectionStyle,
  type DeckLayout,
  type StackType,
  type CardCategory as DeckCardCategory,  // Aliased to avoid conflict with cards.ts
  type StackConfig,
  type LayoutZone,
  type CardPosition,
  type ConnectionTemplate,
  
  // DAW-Native Layouts
  RENOISE_LAYOUT,
  ABLETON_LAYOUT,
  CUBASE_LAYOUT,
  DORICO_LAYOUT,
  SIMPLIFIED_LAYOUT,
  MODULAR_LAYOUT,
  LAYOUT_PRESETS,
  
  // Layout Selection
  getLayoutForBackground,
  getLayoutForPersona,
  
  // Auto-Arrange
  autoArrangeStack,
  autoArrangeDeck,
  snapToGrid as snapPositionToGrid,
  snapCardToGrid,
  
  // Zone/Stack Hit Testing
  findZoneAtPosition,
  canDropInZone,
  findStackAtPosition,
  
  // State Management
  type DeckLayoutState,
  type DragLayoutState,
  createDeckLayoutState,
  toggleStackCollapsed,
  addCardToLayout,
  moveCard as moveCardInLayout,  // Aliased to avoid conflict with cards.ts
  removeCard as removeCardFromLayout,  // Aliased
  selectCard as selectCardInLayout,  // Aliased
  clearSelection as clearLayoutSelection,  // Aliased
  
  // CSS
  LAYOUT_CSS,
  applyLayoutCSS,
} from './layout-bridge';

// ============================================================================
// VIDEO GENERATION EXPORTS
// ============================================================================

export {
  // Interaction Recorder Types
  type InteractionType,
  type InteractionAction,
  type MouseMoveAction,
  type ClickAction,
  type DragAction,
  type DragSequenceAction,
  type KeyAction,
  type ScrollAction,
  type TouchAction,
  type HoverAction,
  type PinchAction,
  type AnnotationAction,
  type WaitAction,
  type InteractionSequence,
  type SequenceInitialState,
  type VisualEffect,
  type PlaybackState,
  type EasingFunction,
  type ModifierKeys,
  type MouseButton,
  
  // Interaction Recorder Functions
  EASING_FUNCTIONS,
  interpolate,
  interpolatePoint,
  applyEasing,
  SequenceBuilder,
  SequencePlayer,
  createBasicDemoSequence,
  createDragDropDemoSequence,
  createPersonaDemoSequence,
  
  // Frame Compositor Types
  type FrameConfig,
  type CompositorTheme,
  type LayerContext,
  type CompositorColors,
  
  // Frame Compositor Functions
  DEFAULT_FRAME_CONFIG,
  DARK_COMPOSITOR_COLORS,
  LIGHT_COMPOSITOR_COLORS,
  getCompositorColors,
  FrameCompositor,
  
  // Video Exporter Types
  type VideoFormat,
  type VideoCodec,
  type QualityPreset,
  type ExportConfig,
  type ExportProgressCallback,
  type ExportProgress,
  type ExportPhase,
  
  // Video Exporter Functions
  QUALITY_PRESETS,
  DEFAULT_EXPORT_CONFIG,
  FrameBuffer,
  VideoEncoderWrapper,
  SimpleMp4Muxer,
  VideoExporter,
  createLayoutDemoVideo,
  isVideoExportSupported,
  getSupportedFormats,
  
  // High-Level Video Generation
  type TutorialVideoOptions,
  createTutorialVideo,
  quickExport,
  createPreviewPlayer,
  VideoGenerationPipeline,
} from './video';

// ============================================================================
// COMPREHENSIVE TUTORIAL CATALOG EXPORTS
// ============================================================================

export {
  // Tutorial Catalog Types
  type Tutorial as CompleteTutorial,
  type ValidationCriteria as TutorialValidation,
  
  // Tutorial Catalog Functions
  TUTORIALS as TUTORIAL_CATALOG,
  getTutorial as getTutorialFromCatalog,
  getAllTutorials as getAllTutorialsFromCatalog,
  getTutorialsByCategory as getTutorialsByCatalogCategory,
  getTutorialsByDifficulty,
  getStarterTutorials,
  getNextTutorial as getNextRecommendedTutorial,
  isTutorialAvailable,
  getLearningPath,
  getTutorialProgress,
  
  // Individual Complete Tutorials
  YOUR_FIRST_NOTE_TUTORIAL,
  BUILDING_DRUMS_TUTORIAL,
  WRITING_CHORDS_TUTORIAL,
  MELODY_101_TUTORIAL,
  BASS_FUNDAMENTALS_TUTORIAL,
  MIXING_BASICS_TUTORIAL,
  EFFECT_ESSENTIALS_TUTORIAL,
  AUTOMATION_MAGIC_TUTORIAL,
  SAMPLING_SCHOOL_TUTORIAL,
  SYNTHESIS_START_TUTORIAL,
  RECORDING_READY_TUTORIAL,
  PERFORMANCE_MODE_TUTORIAL,
  CARD_STACKING_TUTORIAL,
  GRAPH_ROUTING_TUTORIAL,
  PRESET_POWER_TUTORIAL,
  TEMPLATE_TIME_TUTORIAL,
  EXPORT_EXCELLENCE_TUTORIAL,
  COLLABORATION_TUTORIAL,
  ADVANCED_TRICKS_TUTORIAL,
  PRO_WORKFLOW_TUTORIAL,
} from './tutorials';

// ============================================================================
// TOOLTIP & HELP SYSTEM EXPORTS
// ============================================================================

export {
  // Tooltip Types
  type TooltipType,
  type TooltipPosition as TooltipPlacement,
  type TooltipContent,
  type Tooltip as DetailedTooltip,
  type ContextualTooltip,
  type TooltipContext,
  
  // What's This Mode
  type WhatsThisMode,
  type ElementExplanation,
  enableWhatsThisMode,
  
  // Keyboard Shortcuts
  type KeyboardShortcutHint,
  showKeyboardHint,
  
  // Action Suggestions
  type ActionSuggestion,
  getActionSuggestions,
  
  // Did You Know Tips
  type DidYouKnowTip,
  DID_YOU_KNOW_TIPS,
  getDidYouKnowTips,
  
  // Progress-Aware Hints
  type ProgressHint,
  PROGRESS_HINTS,
  getProgressHints,
  
  // Error Recovery
  type ErrorWithRecovery,
  type RecoverySolution,
  ERROR_RECOVERY,
  getErrorRecovery,
  
  // Glossary
  type GlossaryTerm as DetailedGlossaryTerm,
  GLOSSARY as DETAILED_GLOSSARY,
  getGlossaryTerm as getDetailedGlossaryTerm,
  
  // Unit Explanations
  type UnitExplanation,
  UNIT_EXPLANATIONS,
  getUnitExplanation,
  
  // Parameter Range Hints
  type ParameterRangeHint,
  PARAMETER_RANGE_HINTS,
  getParameterRangeHint,
  
  // Tooltip Manager
  TooltipManager,
  tooltipManager,
  
  // Helper Functions
  createContextualTooltip,
} from './tooltips';

// ============================================================================
// ACHIEVEMENT SYSTEM EXPORTS
// ============================================================================

export {
  // Achievement Types
  type AchievementCategory,
  type AchievementTier,
  type Achievement,
  type AchievementProgress,
  type AchievementUnlock,
  type AchievementStats,
  type AchievementManager,
  
  // Achievement Definitions
  ACHIEVEMENTS,
  
  // Achievement Framework
  createAchievementManager,
  updateAchievementProgress,
  unlockAchievement,
  clearRecentUnlocks,
  getAchievementStats,
  getUnlockedAchievements,
  getLockedAchievements,
  getAchievementsByCategory,
  getAchievementsByTier,
  
  // Achievement Notifications
  type AchievementNotificationConfig,
  DEFAULT_NOTIFICATION_CONFIG,
  createAchievementNotificationHTML,
  
  // Achievement Gallery
  type AchievementGalleryFilter,
  DEFAULT_GALLERY_FILTER,
  filterAchievements,
  
  // Achievement Sharing
  type AchievementShareOptions,
  generateShareText,
  generateShareURL,
  
  // Achievement Persistence
  serializeAchievementManager,
  deserializeAchievementManager,
} from './achievements';

// ============================================================================
// SESSION VIEW EXPORTS (Phase 10: Ableton-like Clip Grid)
// ============================================================================

export {
  // Grid Position Types
  type GridPosition,
  type ClipSlotState,
  type ClipSlot,
  type TrackHeader,
  type SceneHeader,
  type ClipSelection,
  type DragSelectState,
  type SessionGridState,
  type ClipSlotAction,
  type ClipSlotContextMenu,
  
  // Grid Position Helpers
  gridPositionToKey,
  keyToGridPosition,
  gridPositionsEqual,
  
  // Session Grid Management
  createSessionGrid,
  setClipInSlot,
  removeClipFromSlot,
  setClipSlotState,
  setClipSlotColor,
  
  // Selection Management
  selectClipSlot,
  clearSelection as clearSessionSelection,  // Aliased to avoid conflict
  selectRectangle,
  
  // Drag-Select
  startDragSelect,
  updateDragSelect,
  endDragSelect,
  cancelDragSelect,
  
  // Track Header Management
  renameTrack,
  setTrackColor,
  toggleTrackMute,
  toggleTrackSolo,
  toggleTrackArm,
  
  // Scene Header Management
  renameScene,
  setSceneColor,
  setSceneTempo,
  
  // Context Menu
  showContextMenu,
  hideContextMenu,
  
  // Layout
  type SessionPanelLayout,
  DEFAULT_SESSION_LAYOUT,
  calculateSlotPosition,
  pixelToGridPosition,
} from './session-view';

// ============================================================================
// SCORE NOTATION SESSION BRIDGE EXPORTS (Phase 1: Integration)
// ============================================================================

export {
  // Types
  type NotationEditType,
  type NotationEdit,
  type ClipSelectionCallback,
  type NotationEditCallback,
  type ScoreNotationSessionBridgeConfig,
  type ScoreNotationSessionBridgeState,
  
  // Constants
  DEFAULT_BRIDGE_CONFIG,
  
  // Interface
  type ScoreNotationSessionBridge,
  
  // Factory
  createScoreNotationSessionBridge,
  
  // Singletons
  getScoreNotationSessionBridge,
  getGlobalScoreNotationCard,
  resetScoreNotationSessionBridge,
} from './score-notation-session-bridge';

// ============================================================================
// COMPOSER DECK LAYOUT EXPORTS (Phase 2: ComposerDeck UI)
// ============================================================================

export {
  // Types
  type ComposerDeckPanelId,
  type PanelVisibility as ComposerPanelVisibility,
  type PanelHeights,
  type ScrollSyncState,
  type ComposerDeckSelection,
  type ComposerDeckPlayback,
  type ComposerDeckState,
  type ComposerDeckConfig,
  type ComposerDeckShortcutAction,
  
  // Constants
  DEFAULT_PANEL_VISIBILITY,
  DEFAULT_PANEL_HEIGHTS,
  DEFAULT_SCROLL_SYNC,
  DEFAULT_SELECTION,
  DEFAULT_PLAYBACK,
  DEFAULT_COMPOSER_DECK_STATE,
  DEFAULT_COMPOSER_DECK_CONFIG,
  COMPOSER_DECK_SHORTCUTS,
  
  // Layout Calculation
  calculateTotalPanelHeight,
  calculatePanelPositions,
  barToPixel,
  pixelToBar,
  tickToBar,
  barToTick,
  calculateVisibleBars,
  
  // State Updates
  setPanelVisible,
  setPanelHeight,
  setScrollPosition,
  setZoomLevel,
  selectClip,
  selectSection,
  selectChord,
  setSelectedBarRange,
  clearSelection,
  setPlaybackPosition,
  setPlaying,
  setRecording,
  setLoopRange,
  setTempo,
  setTimeSignature,
  
  // Song Structure Operations
  addSection,
  removeSection,
  updateSection,
  reorderSections,
  calculateTotalBarsFromStructure,
  getSectionAtBar,
  getSectionBarRange,
  
  // Chord Operations
  addChord,
  removeChord,
  updateChord,
  getChordAtTick,
  
  // Render Helpers
  getGridLines,
  getPlayheadPosition,
  isPlayheadVisible,
} from './composer-deck-layout';

// ============================================================================
// CHORD TRACK PANEL EXPORTS (Phase 2: ComposerDeck UI)
// ============================================================================

export {
  // Types
  type ChordQuality,
  type ChordDisplay,
  type ChordFunction,
  type ChordSuggestion,
  type ChordTrackState,
  type ChordDragState,
  type ChordTrackConfig,
  type ChordTrackColors,
  
  // Constants
  DEFAULT_CHORD_TRACK_COLORS,
  DEFAULT_CHORD_TRACK_CONFIG,
  DEFAULT_CHORD_TRACK_STATE,
  
  // Chord Parsing
  parseChordSymbol,
  formatChordSymbol,
  getRomanNumeral,
  getChordFunction,
  
  // State Operations
  selectChord as selectChordTrack,
  startEditing as startChordEditing,
  updateEditValue as updateChordEditValue,
  commitEdit as commitChordEdit,
  cancelEdit as cancelChordEdit,
  startDrag as startChordDrag,
  updateDrag as updateChordDrag,
  endDrag as endChordDrag,
  cancelDrag as cancelChordDrag,
  setKey,
  toggleRomanNumerals,
  
  // Suggestions
  generateSuggestions,
  
  // Render Helpers
  calculateChordDisplays,
} from './chord-track-panel';

// ============================================================================
// ARRANGER SECTIONS BAR EXPORTS (Phase 2: ComposerDeck UI)
// ============================================================================

export {
  // Types
  type SectionDisplay,
  type ArrangerSectionsState,
  type SectionDragState,
  type ArrangerSectionsConfig,
  type ArrangerSectionsColors,
  
  // Constants
  DEFAULT_ARRANGER_SECTIONS_COLORS,
  DEFAULT_ARRANGER_SECTIONS_CONFIG,
  DEFAULT_ARRANGER_SECTIONS_STATE,
  SONG_STRUCTURE_TEMPLATES,
  SECTION_TYPE_MENU_ITEMS,
  SECTION_LENGTH_OPTIONS,
  SECTION_REPEAT_OPTIONS,
  SECTION_ENERGY_OPTIONS,
  
  // Template Factory
  createSectionsFromTemplate,
  
  // State Operations
  selectSection as selectArrangerSection,
  startEditingName,
  updateEditNameValue,
  commitNameEdit,
  cancelNameEdit,
  startDrag as startSectionDrag,
  updateDrag as updateSectionDrag,
  endDrag as endSectionDrag,
  cancelDrag as cancelSectionDrag,
  openMenu as openArrangerSectionsMenu,
  closeMenu as closeArrangerSectionsMenu,
  addSection as addArrangerSection,
  removeSection as removeArrangerSection,
  duplicateSection,
  changeSectionType,
  setSectionLength,
  setSectionRepeat,
  setSectionEnergy,
  
  // Calculation Helpers
  calculateTotalBars as calculateTotalSectionBars,
  getSectionAtBar as getSectionAtBarPosition,
  getSectionStartBar,
  getSectionBarRange as getArrangerSectionBarRange,
  
  // Render Helpers
  calculateSectionDisplays,
  getDropTargetIndex,
} from './arranger-sections-bar';

// ============================================================================
// PHRASE LIBRARY PANEL EXPORTS (Phase 3)
// ============================================================================

export {
  // Types
  type PhraseId,
  type PhraseRecord,
  type PhraseCategory,
  type PhraseSortOption,
  type PhraseFilter,
  type PhraseLibraryState,
  type PhraseDragData,
  type PhraseDropTarget,
  type PhrasePreviewConfig,
  type PhraseLibraryAdapter,
  
  // ID Factory
  asPhraseId,
  
  // Constants
  PHRASE_CATEGORIES,
  
  // State Factory
  createPhraseLibraryState,
  
  // Filter & Sort
  filterPhrases,
  sortPhrases,
  groupPhrasesByCategory,
  getAllTags,
  getAllInstruments,
  
  // Phrase CRUD
  createPhrase,
  updatePhrase,
  recordPhraseUsage,
  togglePhraseFavorite,
  
  // Drag & Drop
  startPhraseDrag,
  endPhraseDrag,
  createPhraseDragData,
  
  // Preview
  selectPhraseForPreview,
  startPreviewPlayback,
  stopPreviewPlayback,
  
  // View State
  setViewMode as setPhraseViewMode,
  setGridColumns as setPhraseGridColumns,
  toggleGroupByCategory,
  toggleCategoryExpansion,
  expandAllCategories,
  collapseAllCategories,
  
  // Filter State
  setFilter as setPhraseFilter,
  updateFilter as updatePhraseFilter,
  clearFilter as clearPhraseFilter,
  setSearchText as setPhraseSearchText,
  toggleCategoryFilter,
  toggleTagFilter,
  
  // Sort State
  setSortOption as setPhraseSortOption,
  
  // Context
  setChordContext,
  setKeyContext,
  
  // Library Management
  addPhraseToLibrary,
  removePhraseFromLibrary,
  updatePhraseInLibrary,
  importPhrases,
  exportPhrases,
  
  // Computed Values
  getDisplayPhrases,
  getSelectedPhrase,
  getDraggedPhrase,
  getPhraseCounts,
  
  // Controller
  PhraseLibraryController,
  getPhraseLibraryController,
  resetPhraseLibraryController,
} from './phrase-library-panel';

// ============================================================================
// COMPOSER DECK BAR EXPORTS (Phase 3)
// ============================================================================

export {
  // Types
  type DeckSlotId,
  type GeneratorCardType,
  type DeckSlot,
  type GeneratorSettings,
  type GeneratorOutput,
  type DeckBarState,
  type GeneratorCallback,
  type DeckBarAdapter,
  
  // ID Factory
  asDeckSlotId,
  
  // Constants
  GENERATOR_CARD_INFO,
  DEFAULT_GENERATOR_SETTINGS,
  DECK_BAR_SHORTCUTS,
  
  // State Factory
  createDeckBarState,
  
  // Slot Operations
  addSlot,
  removeSlot,
  reorderSlots,
  setActiveSlot,
  toggleSlotConfiguration,
  updateSlotSettings,
  toggleSlotPinned,
  
  // Generation Operations
  startGenerating,
  setGenerationOutput,
  acceptOutput,
  rejectOutput,
  clearOutput,
  
  // Preset Operations
  saveSettingsPreset,
  recallSettingsPreset,
  setCurrentSection,
  
  // View State
  toggleDeckBarCollapsed,
  setQuickGenerateEnabled,
  setAutoAccept,
  
  // Computed Values
  getVisibleSlots,
  getActiveSlot,
  getSlotById,
  getSlotsWithPendingOutput,
  getGeneratingSlots,
  hasPendingOutput,
  
  // Controller
  DeckBarController,
  getDeckBarController,
  resetDeckBarController,
  
  // Keyboard
  handleDeckBarShortcut,
} from './composer-deck-bar';

// ============================================================================
// AI ADVISOR INTEGRATION EXPORTS
// ============================================================================

export {
  // Registration
  registerRevealPanel,
  getRevealPanel,

  // Actions
  openAIAdvisor,

  // Initialization
  initializeAIAdvisorIntegration,
  cleanupAIAdvisorIntegration,
} from './ai-advisor-integration';

// ============================================================================
// COMMAND PALETTE EXPORTS
// ============================================================================

export {
  // Component
  CommandPalette,

  // Command Registration
  registerCommand,
  unregisterCommand,
  getAllCommands,
  clearCommands,

  // Palette Actions
  getCommandPalette,
  openCommandPalette,
  initializeCommandPalette,

  // Types
  type Command,
  type CommandContext,
} from './components/command-palette';

// ============================================================================
// AI CONTEXT MENU EXPORTS
// ============================================================================

export {
  // Context Menu Setup
  addAIContextMenu,
  addAIContextMenuToAll,
  setupAIContextMenuObserver,
  initializeAIContextMenus,

  // Context Extractors
  extractChordContext,
  extractNoteContext,
  extractPatternContext,
  extractProgressionContext,

  // Built-in Menu Items
  CHORD_MENU_ITEMS,
  NOTE_MENU_ITEMS,
  PATTERN_MENU_ITEMS,
  PROGRESSION_MENU_ITEMS,

  // Types
  type AIContextMenuItem,
  type AIContextMenuConfig,
} from './ai-context-menu';
