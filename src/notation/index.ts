/**
 * @fileoverview Notation Module Barrel Export.
 * 
 * Phase 11.1: Notation Rendering Engine
 * 
 * This module provides a complete notation rendering system including:
 * - Staff line rendering
 * - Clef rendering (treble, bass, alto, tenor)
 * - Key signature display
 * - Time signature display
 * - Bar line rendering
 * - Note head rendering (various durations)
 * - Stem direction logic
 * - Beam grouping algorithm
 * - Rest rendering (various durations)
 * - Accidental placement
 * - Ledger line rendering
 * - Tie rendering
 * - Slur rendering
 * - Dot/double-dot display
 * - Tuplet bracket/number
 * - Voice separation
 * - Grand staff (piano) layout
 * - Score layout (multiple staves)
 * - Page/system breaks
 * 
 * @module @cardplay/core/notation
 */

// Types
export {
  // Clef types
  type ClefType,
  type ClefDefinition,
  CLEF_DEFINITIONS,
  
  // Key signature types
  type KeySignature,
  type NoteName,
  type AccidentalType,
  KEY_SIGNATURES,
  
  // Time signature types
  type TimeSignature,
  type TimeSignatureDisplay,
  COMMON_TIME_SIGNATURES,
  
  // Note duration types
  type NoteDurationType,
  type NoteDuration,
  DURATION_VALUES,
  DURATION_FLAGS,
  calculateDurationValue,
  findClosestDuration,
  
  // Bar line types
  type BarLineType,
  
  // Stem & beam types
  type StemDirection,
  type BeamGroup,
  
  // Tie & slur types
  type NoteTie,
  type NoteSlur,
  
  // Tuplet types
  type Tuplet,
  
  // Staff types
  type StaffConfig,
  type GrandStaff,
  type SystemConfig,
  type StaffBracket,
  
  // Page types
  type PageConfig,
  type PageMargins,
  DEFAULT_PAGE_CONFIG,
  type SystemBreak,
  type PageBreak,
  
  // Notation event types
  type NotationNote,
  type NotationEvent,
  type ArticulationType,
  type NotationMeasure,
  type ClefChange,
  type TempoMarking,
  
  // Voice types
  type VoiceConfig,
  STANDARD_TWO_VOICES,
  STANDARD_FOUR_VOICES,
} from './types';

// Staff rendering
export {
  // Dimensions
  type StaffDimensions,
  DEFAULT_STAFF_DIMENSIONS,
  STAFF_DIMENSION_PRESETS,
  
  // Staff line types
  type StaffLine,
  type RenderedStaff,
  calculateStaffLines,
  getStaffPositionY,
  midiToStaffPosition,
  
  // Clef rendering
  CLEF_GLYPHS,
  type RenderedClef,
  renderClef,
  getClefWidth,
  
  // Key signature rendering
  SHARP_POSITIONS,
  FLAT_POSITIONS,
  type KeySigAccidental,
  type RenderedKeySignature,
  renderKeySignature,
  getKeySignatureWidth,
  
  // Time signature rendering
  type RenderedTimeSignature,
  renderTimeSignature,
  parseTimeSignature,
  getTimeSignatureWidth,
  
  // Ledger lines
  type LedgerLine,
  calculateLedgerLines,
  
  // Grand staff
  type RenderedGrandStaff,
  createDefaultGrandStaff,
  renderGrandStaff,
  
  // System
  type RenderedSystem,
  type RenderedBracket,
  renderSystem,
  
  // Factories
  createDefaultStaffConfig,
  createDefaultSystemConfig,
} from './staff';

// Note rendering
export {
  // Note head types
  type NoteHeadShape,
  getNoteHeadShape,
  type NoteHeadDimensions,
  getNoteHeadDimensions,
  type RenderedNoteHead,
  type RenderedAccidental,
  type RenderedLedgerLine,
  renderNoteHead,
  
  // Accidentals
  ACCIDENTAL_GLYPHS,
  getAccidentalWidth,
  resolveAccidentalPositions,
  
  // Stems
  type StemConfig,
  DEFAULT_STEM_CONFIG,
  type RenderedStem,
  type RenderedFlag,
  determineStemDirection,
  determineChordStemDirection,
  renderStem,
  renderChordStem,
  
  // Beams
  type RenderedBeam,
  type RenderedBeamGroup,
  calculateBeamSlope,
  createBeamGroups,
  renderBeamGroup,
  
  // Rests
  REST_GLYPHS,
  type RenderedRest,
  renderRest,
  
  // Dots
  type RenderedDot,
  renderDots,
  
  // Grace notes
  type RenderedGraceNote,
  renderGraceNote,
  
  // Articulations
  ARTICULATION_GLYPHS,
  type RenderedArticulation,
  renderArticulations,
} from './notes';

// Bar lines
export {
  BAR_LINE_THICKNESS,
  type RenderedBarLine,
  type BarLineElement,
  renderBarLine,
  renderSystemBarLine,
  getBarLineWidth,
  
  // Repeat endings
  type RepeatEnding,
  type RenderedRepeatEnding,
  renderRepeatEnding,
  
  // Navigation symbols
  type NavigationSymbol,
  NAVIGATION_GLYPHS,
  type RenderedNavigationSymbol,
  renderNavigationSymbol,
} from './barlines';

// Curves (ties & slurs)
export {
  type ControlPoint,
  type BezierCurve,
  type RenderedTie,
  type RenderedSlur,
  type CurveConfig,
  DEFAULT_TIE_CONFIG,
  DEFAULT_SLUR_CONFIG,
  determineCurvePlacement,
  calculateCurve,
  adjustCurveForCollisions,
  evaluateBezier,
  getBezierBounds,
  renderTie,
  renderSplitTie,
  renderSlur,
  renderPhraseMark,
  generateCurveSVGPath,
  generateSimpleCurvePath,
} from './curves';

// Tuplets
export {
  type TupletConfig,
  DEFAULT_TUPLET_CONFIG,
  type TupletBracket,
  type TupletNumber,
  type RenderedTuplet,
  determineTupletPlacement,
  calculateTupletSlope,
  findTupletExtreme,
  renderTuplet,
  renderNestedTuplet,
  createTriplet,
  createQuintuplet,
  createSextuplet,
  createSeptuplet,
  createTuplet,
  formatTupletRatio,
  calculateTupletNoteDuration,
} from './tuplets';

// Layout
export {
  type SpacingConfig,
  DEFAULT_SPACING_CONFIG,
  calculateDurationSpacing,
  type NotePosition,
  calculateMeasureNotePositions,
  fitPositionsToWidth,
  type BoundingBox,
  boxesOverlap,
  calculateCollisionShift,
  type CollisionItem,
  resolveCollisions,
  separateVoices,
  calculateVoiceAdjustments,
  type MeasureLayout,
  layoutMeasure,
  type SystemLayout,
  type StaffLayout,
  calculateSystemMeasures,
  layoutSystem,
  type PageLayout,
  layoutPage,
  layoutScore,
  
  // Advanced layout (Phase 11.4)
  type AccidentalPlacementConfig,
  DEFAULT_ACCIDENTAL_PLACEMENT,
  resolveAccidentalCollisions,
  type ArticulationPlacementConfig,
  DEFAULT_ARTICULATION_PLACEMENT,
  resolveArticulationCollisions,
  optimizeStemDirection,
  type BeamAngleConfig,
  DEFAULT_BEAM_ANGLE_CONFIG,
  optimizeBeamAngle,
  type SlurCurvatureConfig,
  DEFAULT_SLUR_CURVATURE_CONFIG,
  optimizeSlurCurvature,
  type TiePlacementConfig,
  DEFAULT_TIE_PLACEMENT_CONFIG,
  calculateTiePlacement,
} from './layout';

// Panel
export {
  type ZoomState,
  DEFAULT_ZOOM_STATE,
  type ScrollPosition,
  type SelectionState,
  DEFAULT_SELECTION_STATE,
  type NotationPanelState,
  type EditMode,
  DEFAULT_PANEL_STATE,
  type NotationPanelConfig,
  type NotationTheme,
  DEFAULT_NOTATION_THEME,
  DEFAULT_PANEL_CONFIG,
  type RenderedNotation,
  NotationPanel,
  createSingleStaffPanel,
  createPianoPanel,
  createScorePanel,
} from './panel';

// SMuFL glyphs and professional rendering
export {
  SMUFL,
  ENGRAVING_DEFAULTS,
  GLYPH_BBOXES,
  getNoteheadGlyph,
  getRestGlyph,
  getFlagGlyph,
  getAccidentalGlyph,
  getClefGlyph,
  getTimeSigGlyphs,
  getDynamicGlyph,
  getArticulationGlyph,
} from './smufl';

// Event bridge (Phase 11.2)
export {
  type EventToNotationOptions,
  eventToNotation,
  eventsToNotation,
  tickDurationToNoteDuration,
  quantizeEventToNotationGrid,
  inferAccidental,
  groupEventsIntoMeasures,
  type NotationUpdateSubscriber,
  NotationEventBridge,
} from './event-bridge';

// Ornaments, dynamics, and expression (Phase 11.2)
export {
  // Ornaments
  type OrnamentType,
  type Ornament,
  type RenderedOrnament,
  renderOrnament,
  
  // Dynamics
  type DynamicLevel,
  type Dynamic,
  type RenderedDynamic,
  renderDynamic,
  
  // Hairpins
  type HairpinType,
  type Hairpin,
  type RenderedHairpin,
  renderHairpin,
  
  // Expression
  type ExpressionType,
  type Expression,
  type RenderedExpression,
  renderExpression,
  
  // Tempo
  type TempoMarkingName,
  type Tempo,
  type RenderedTempo,
  renderTempo,
  
  // Rehearsal marks
  type RehearsalMark,
  type RenderedRehearsalMark,
  renderRehearsalMark,
  
  // Tremolo
  type TremoloNotation,
  type RenderedTremolo,
  renderTremolo,
  
  // Glissando
  type GlissandoLine,
  type RenderedGlissando,
  renderGlissando,
  
  // Ottava lines
  type OttavaType,
  type OttavaLine,
  type RenderedOttava,
  renderOttava,
} from './ornaments-dynamics';

export { generateProfessionalSVG } from './svg-professional';

// Editing operations (Phase 11.3)
export {
  // Clipboard types
  type NotationClipboard,
  type NotationSelection,
  type TextAnnotation,
  
  // Cut/copy/paste
  copyNotation,
  cutNotation,
  pasteNotation,
  
  // Measure operations
  insertMeasure,
  deleteMeasure,
  
  // Clef operations
  changeClef,
  
  // Key signature operations
  changeKeySignature,
  
  // Time signature operations
  changeTimeSignature,
  
  // Tie operations
  addTie,
  removeTie,
  
  // Slur operations
  addSlur,
  removeSlur,
  
  // Dynamics operations
  addDynamics,
  removeDynamics,
  
  // Articulation operations
  addArticulation,
  removeArticulation,
  
  // Text annotation operations
  addTextAnnotation,
  
  // Transpose operations
  transposeSelection,
  respellEnharmonic,
} from './editing';

// Playback integration (Phase 11.5)
export {
  // Playback context
  type NotationPlaybackContext,
  createPlaybackContext,
  
  // Measure timing
  calculateMeasureStartTicks,
  findMeasureAtTick,
  
  // Click-to-play
  notationNoteToEvent,
  playNotationNote,
  
  // Playback from selection
  extractEventsFromSelection,
  createSelectionPlaybackContext,
  
  // Playhead visualization
  type PlayheadPosition,
  calculatePlayheadPosition,
  shouldScrollToPlayhead,
  calculateScrollToPlayhead,
  
  // Playing notes highlighting
  updateActiveNotes,
  isNotePlaying,
  
  // Expression playback
  applyDynamic,
  interpretTempoMarking,
  
  // Repeat structure playback
  type RepeatStructure,
  type RepeatPlaybackState,
  createRepeatPlaybackState,
  advanceWithRepeats,
  
  // Grace note timing
  type GraceNoteTiming,
  DEFAULT_GRACE_NOTE_TIMING,
  calculateGraceNoteTiming,
  
  // Ornament realization
  type OrnamentRealization,
  ORNAMENT_REALIZATIONS,
  realizeOrnament,
  
  // Swing interpretation
  type SwingConfig,
  SWING_PRESETS,
  applySwing,
} from './playback';

// Comparison and Audio Sync (Phase 11.5 final)
export {
  // Comparison types
  type NotationDiffType,
  type NotationDiff,
  type ComparisonViewConfig,
  DEFAULT_COMPARISON_CONFIG,
  type ComparisonSummary,
  
  // Comparison functions
  compareNotationMeasures,
  generateComparisonSummary,
  getComparisonHighlightClass,
  generateComparisonCSS,
  
  // Audio sync types
  type WaveformData,
  type AudioSyncConfig,
  DEFAULT_AUDIO_SYNC_CONFIG,
  type TickToTimeMapping,
  
  // Audio sync functions
  tickToAudioTime,
  audioTimeToTick,
  generateWaveformPeaks,
  generateWaveformRMS,
  renderWaveformSVG,
  renderBeatMarkers,
  renderPlayheadSync,
} from './comparison-sync';

// MIDI Export (Phase 11.5 final)
export {
  // MIDI export types
  type MIDIFormat,
  type MIDIExportConfig,
  DEFAULT_MIDI_EXPORT_CONFIG,
  
  // MIDI export functions
  exportNotationToMIDI,
  createMIDIBlob,
  downloadMIDIFile,
  validateMIDIData,
} from './midi-export';

// Tablature (Phase 11.6)
export {
  // Tablature types
  type StringTuning,
  STANDARD_TUNINGS,
  type TabNote,
  type TabTechnique,
  type TabMeasure,
  type ChordDiagram,
  type ChordFinger,
  type ChordBarre,
  GUITAR_CHORD_LIBRARY,
  
  // Conversion functions
  findFretPositions,
  chooseBestFretPosition,
  convertToTab,
  getChordDiagram,
  createChordDiagram,
  formatFret,
  formatTabLine,
} from './tablature';

// Drum Notation (Phase 11.6)
export {
  // Drum types
  type DrumInstrument,
  type DrumNoteHead,
  GM_DRUM_MAP,
  type PercussionKey,
  STANDARD_DRUM_KEY,
  type UnpitchedNotation,
  UNPITCHED_INSTRUMENTS,
  type DrumStaffConfig,
  DEFAULT_DRUM_STAFF_CONFIG,
  
  // Drum functions
  getDrumInstrument,
  getDrumsByStaffLine,
  getUnpitchedNotation,
  createCustomPercussionKey,
  getDrumNoteHeadPath,
  drumNoteRequiresStem,
} from './drum-notation';

// Transposing Instruments (Phase 11.6)
export {
  // Transposition types
  type TransposingInstrument,
  TRANSPOSING_INSTRUMENTS,
  type DisplayMode,
  type TranspositionConfig,
  DEFAULT_TRANSPOSITION_CONFIG,
  
  // Transposition functions
  writtenToConcert,
  concertToWritten,
  transposePart,
  getWrittenKeySignature,
  getTransposingInstrument,
  getInstrumentsByFamily,
  isTransposing,
} from './transposition';

// MusicXML Import/Export (Phase 11.6)
export {
  // MusicXML types
  type MusicXMLScore,
  type MusicXMLPart,
  type MusicXMLMeasure,
  type MusicXMLAttributes,
  type MusicXMLNote,
  type MusicXMLBarline,
  
  // MusicXML functions
  exportToMusicXML,
  importFromMusicXML,
} from './musicxml';

// Print Layout & PDF Export (Phase 11.6)
export {
  // Print layout types
  type PageSize,
  type PageOrientation,
  type PageDimensions,
  PAGE_SIZES,
  type PageMargins as PrintPageMargins,
  MARGIN_PRESETS,
  type PrintLayoutConfig,
  DEFAULT_PRINT_LAYOUT,
  type Page,
  type System,
  type PartConfig,
  
  // Print layout functions
  calculatePageBreaks,
  extractPart,
  generateAllParts,
  calculateStaffSpacing,
  distributeMeasureWidths,
  shouldBreakSystem,
  shouldBreakPage,
  
  // PDF export
  type PDFExportOptions,
  exportToPDF,
  downloadPDF,
} from './print-layout';

// Figured Bass (Phase 11.6)
export {
  // Figured bass types
  type FiguredBassFigure,
  type FigureNumber,
  type FigureAccidental,
  FIGURED_BASS_PATTERNS,
  type RomanNumeral,
  type ChordQuality,
  
  // Figured bass functions
  parseFiguredBass,
  formatFiguredBass,
  realizeFiguredBass,
  figuredBassToRomanNumeral,
  formatRomanNumeral,
  calculateFigurePositions,
  getFigureAccidentalPath,
} from './figured-bass';

// Annotations (Phase 11.6)
export {
  // Annotation types
  type Annotation,
  type AnnotationType,
  type RehearsalMark as RehearsalMarkAnnotation,
  type TempoMarking as TempoMarkingAnnotation,
  type ExpressionMarking,
  type CommentThread,
  type Comment,
  type AnnotationLayer,
  type AnalysisType,
  type AnalyticalMarking,
  PERFORMANCE_NOTE_TEMPLATES,
  FORMAL_SECTIONS,
  CADENCE_TYPES,
  
  // Annotation functions
  createAnnotationLayer,
  addAnnotation,
  removeAnnotation,
  updateAnnotation,
  getAnnotationsForMeasure,
  getAnnotationsInRange,
  createCommentThread,
  addReply,
  resolveThread,
  reopenThread,
  generateRehearsalMarks,
  createPerformanceNote,
  createAnalyticalMarking,
  getAnnotationColor,
  formatAnnotationText,
  calculateAnnotationPosition,
} from './annotations';

// Revision Tracking (Phase 11.6)
export {
  // Revision types
  type Revision,
  type Change,
  type ChangeType,
  type ChangeTarget,
  type RevisionHistory,
  
  // Revision functions
  createRevision,
  createChange,
  createRevisionHistory,
  addRevision,
  getRevision,
  getRevisionChain,
  getRevisionsByAuthor,
  getRevisionsInRange,
  computeDiff,
  applyPatch,
  invertChanges,
  createBranch,
  switchBranch,
  mergeRevisions,
  formatRevision,
  getRevisionStats,
  
  // Advanced revision tracking
  type RevisionTag,
  type TaggedRevisionHistory,
  type RevisionDiff,
  getRevisionByIndex,
  tagRevision,
  getRevisionByTag,
  exportRevisionHistory,
  importRevisionHistory,
  squashRevisions,
  cherryPickChanges,
  revertChanges,
  calculateDiff,
  findCommonAncestor,
} from './revisions';

// Input recognition (handwriting and OCR)
export {
  // Handwriting types
  type StrokePoint,
  type Stroke,
  type RecognizedSymbol,
  type SymbolType,
  // BoundingBox already exported from layout.ts
  
  // Handwriting functions
  recognizeStrokes,
  symbolsToEvents,
  
  // OCR types
  type OMRResult,
  
  // OCR functions
  recognizeScoreImage,
  processScannedScore,
} from './input-recognition';

// Enhanced annotation features
export {
  // Annotation layer types
  type AnnotationLayerConfig,
  type AnnotationLayerSystem,
  DEFAULT_ANNOTATION_LAYERS,
  
  // Annotation layer functions
  createAnnotationLayerSystem,
  addAnnotationToLayer,
  toggleLayerVisibility,
  getVisibleAnnotations,
  
  // Markup comment types
  type MarkupComment,
  type CommentAttachment,
  
  // Markup comment functions
  createMarkupComment,
  addReactionToComment,
  resolveComment,
  getCommentThread,
  getUnresolvedComments,
  getCommentsByAuthor,
  searchComments,
  exportCommentsToJSON,
  importCommentsFromJSON,
} from './annotations';

// MusicXML and MIDI import enhancements
export {
  // MIDI import functions
  importFromMIDI,
  detectTimeSignature,
  detectKeySignature,
} from './musicxml';

// Additional print/PDF functionality
export {
  type PDFMetadata,
  printPDF,
} from './print-layout';// Harmony overlay
export * from './harmony-overlay';
