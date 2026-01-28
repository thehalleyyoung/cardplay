/**
 * @fileoverview CardScript - DSL for defining cards with complete and live modes.
 * 
 * CardScript provides two interfaces:
 * 
 * 1. **Complete Mode** - Full-featured definitions suitable for LLM generation
 *    - All parameters explicit
 *    - Rich metadata (description, author, tags, etc.)
 *    - Verbose port/param definitions
 * 
 * 2. **Live Mode** - Minimal syntax for real-time performance
 *    - Single-letter shorthands
 *    - Tuple-based params
 *    - Zero-allocation helpers
 * 
 * Both modes compile to the same native Card<A,B> interface with identical
 * runtime performance.
 * 
 * @example
 * ```typescript
 * // Complete mode (LLM-friendly)
 * import { cardFromComplete, CompleteCardDef } from '@cardplay/cardscript';
 * 
 * const gain: CompleteCardDef = {
 *   name: 'Gain',
 *   id: 'fx.gain',
 *   category: 'effects',
 *   description: 'Adjusts signal amplitude',
 *   inputs: [{ name: 'in', type: 'audio' }],
 *   outputs: [{ name: 'out', type: 'audio' }],
 *   params: [{ name: 'gain', type: 'number', default: 1, min: 0, max: 2 }],
 *   process: (input, ctx, state, p) => ({ output: input * p.gain })
 * };
 * 
 * const card = cardFromComplete(gain);
 * ```
 * 
 * @example
 * ```typescript
 * // Live mode (performance-friendly)
 * import { fx, n } from '@cardplay/cardscript';
 * 
 * const gain = fx('Gain',
 *   (i, c, s, p) => ({ output: i * p.gain }),
 *   [n('gain', 1, 0, 2)]
 * );
 * ```
 * 
 * @module @cardplay/user-cards/cardscript
 */

// Core parsing/compilation (for text-based CardScript)
export { tokenize, createLexer } from './lexer';
export type { LexerOptions } from './lexer';

export { parse, parseExpressionString, parseTypeString } from './parser';

export { compile, compileCard, compileProgram, compileCardDeclaration } from './compiler';
export type { CompiledCardDef, RuntimeContext, CardValue, CompiledFunction } from './compiler';

// Type system
export {
  Types,
  typeEquals,
  isAssignableTo,
  typeToString,
  typeCheck,
  createTypeContext,
  lookupVariable,
  lookupType,
} from './types';
export type {
  Type,
  TypeKind,
  TypeVariant,
  PrimitiveType,
  ArrayType,
  OptionalType,
  UnionType,
  IntersectionType,
  FunctionType,
  ObjectType,
  GenericType,
  TypeParamType,
  AudioType,
  MidiType,
  EventType,
  StreamType,
  CardType,
  UnknownType,
  NeverType,
  AnyType,
  ObjectProperty,
  TypeError,
  TypeContext,
  TypeCheckResult,
} from './types';

// Complete mode (verbose, LLM-friendly)
export {
  cardFromComplete,
  liveToComplete,
  completeToLive,
} from './live';
export type {
  CompleteCardDef,
  CompletePortDef,
  CompleteParamDef,
} from './live';

// Live mode (minimal, performance-friendly)
export {
  cardFromLive,
  card,
  gen,
  fx,
  xform,
  filt,
  route,
  util,
  // Param helpers
  n,
  b,
  s,
  // Math helpers (inlined for perf)
  clamp,
  lerp,
  map,
  mtof,
  ftom,
  dbtoa,
  atodb,
  btoms,
  mstob,
  smoothstep,
  wrap,
  fold,
  // Session
  createLiveSession,
  addCard,
  setParam,
  p as pLive,  // Rename to avoid collision
} from './live';
export type {
  LiveCardDef,
  ParamTuple,
  LiveSession,
  InvokeOptions,
} from './live';

// AST types (for tooling)
export type {
  Program,
  Declaration,
  Statement,
  Expression,
  TypeNode,
  CardDeclaration,
  FunctionDeclaration,
  TypeDeclaration,
  LetDeclaration,
  ConstDeclaration,
  ASTNode,
  NodeKind,
} from './ast';

export { traverse, transform } from './ast';

// Grammar types
export type {
  Token,
  TokenType,
  SourcePosition,
  SourceSpan,
} from './grammar';

export { TokenType as TokenTypes, KEYWORDS, Precedence, getBinaryPrecedence } from './grammar';

// Presets (complete + live examples)
export {
  completeCards,
  liveCards,
  createCompleteCards,
  syntaxComparison,
  // Individual complete definitions
  GainComplete,
  OscillatorComplete,
  FilterComplete,
  DelayComplete,
  MidiToFreqComplete,
  SequencerComplete,
  // Individual live cards
  GainLive,
  OscLive,
  FiltLive,
  DelayLive,
  MtofLive,
  SeqLive,
} from './presets';

// Invocation system (call complex cards with minimal params)
export {
  // Registration
  registerCard,
  registerLiveCard,
  registerPreset,
  registerDeck,
  registerScene,
  registerClip,
  registerPhrase,
  registerTrigger,
  // Invocation
  invoke,
  i,
  invokePreset,
  ip,
  invokeDeck,
  id,
  // Parameter control
  set,
  get,
  reset,
  resetAll,
  // Scene control
  scene,
  updateSceneTransition,
  // Clip control
  playClip,
  stopClip,
  updateClips,
  // Phrase control
  playPhrase,
  stopPhrase,
  updatePhrases,
  // Trigger control
  activateTrigger,
  deactivateTrigger,
  updateTriggers,
  // Live DSL shortcuts
  pre,
  deck,
  scn,
  clip,
  phr,
  trig,
  nt,
  pt,
  lane,
} from './invoke';

export type {
  ParamOverrides,
  InvokeResult,
  PresetDef,
  DeckDef,
  SceneDef,
  ClipDef,
  AutomationLane,
  AutomationPoint,
  PhraseDef,
  NoteEvent,
  TriggerDef,
  TriggerEvent,
  TriggerAction,
  MultiClipDef,
} from './invoke';

// Module system
export {
  ModuleLoader,
  getModuleLoader,
  setModuleLoader,
  importModule,
  InMemoryModuleCache,
  ModuleNamespace,
} from './modules';

export type {
  ModuleId,
  ResolvedModule,
  ModuleExports,
  Module,
  ModuleLoaderOptions,
  ModuleResolver,
  ModuleCache,
} from './modules';

// Async support
export {
  createCancelToken,
  createAsyncContext,
  AsyncCancelError,
  delay,
  delayUntilBeat,
  delayBeats,
  withTimeout,
  withCancel,
  parallel,
  sequence,
  race,
  AsyncScheduler,
  asyncProcess,
  asyncIterate,
  collect,
  retry,
  debounceAsync,
  throttleAsync,
  getAsyncScheduler,
  scheduleAt,
  scheduleAfter,
} from './async';

export type {
  CancelToken,
  AsyncContext,
  ScheduledTask,
  AsyncCardResult,
  RetryOptions,
} from './async';

// Debugging
export {
  CardScriptDebugger,
  ExecutionTracer,
  createExecutionContext,
  getDebugger,
  setBreakpoint,
  removeBreakpoint,
} from './debug';

export type {
  SourceLocation,
  Breakpoint,
  StackFrame,
  Scope,
  Variable,
  DebugEvent,
  DebugListener,
  StepMode,
  ExecutionContext,
  TraceEntry,
} from './debug';

// REPL
export {
  CardScriptRepl,
  createRepl,
  evalExpr,
  // Browser REPL
  BrowserRepl,
  createBrowserRepl,
  mountRepl,
} from './repl';

export type {
  ReplCommand,
  ReplOptions,
  ReplState,
  ReplOutput,
  BrowserReplOptions,
} from './repl';

// Phrase database queries
export {
  PhraseQueryBuilder,
  InMemoryPhraseDatabase,
  setDefaultPhraseDb,
  getDefaultPhraseDb,
  // Query shortcuts
  q,
  byTag,
  byTags,
  byCategory,
  byKey,
  phr as phrQuery,  // Renamed to avoid collision with invoke.ts phr
  phrs,
  seq as seqQuery,  // Renamed to avoid collision
  tup,
  seqTup,
  randomPhrases,
  materialize,
  materializeTup,
  // Creation helpers
  createPhrase,
  createSequence,
  createTuple,
  createSeqTuple,
  // Batch operations
  savePhrases,
  saveSequences,
  saveTuples,
  importPhrases,
  exportPhrases,
  // Collection types (List<Phrase>, List<List<Phrase>>)
  PhraseCollection,
  PhraseSequenceCollection,
  PhraseCollectionBuilder,
  PhraseSequenceCollectionBuilder,
  // Collection factories
  phrases,
  sequences,
  emptyPhrases,
  emptySequences,
} from './query';

export type {
  PhraseMetadata,
  StoredPhrase,
  PhraseSequence,
  PhraseTuple,
  SequenceTuple,
  QueryOp,
  QueryCondition,
  SortDirection,
  QuerySort,
  PhraseQuery,
  QueryResult,
  PhraseDatabase,
  // Collection interfaces
  PhraseList,
  PhraseListBuilder,
  ListOfPhrases,
  ListOfPhraseSequences,
} from './query';

// Security validation
export {
  SecurityChecker,
  createSecurityChecker,
  validateSource,
  validateSecurity,
  isSecure,
  formatSecurityReport,
} from './security';

export type {
  SecuritySeverity,
  SecurityCategory,
  SecurityIssue,
  SecurityValidationResult,
  SecurityCheckerOptions,
} from './security';

// Friendly error messages
export {
  createDiagnostic,
  DiagnosticCollection,
  formatDiagnostic,
  formatDiagnostics,
  formatCodeSnippet,
  syntaxError,
  typeError,
  referenceError,
  suggestSimilar,
  getAllErrorTemplates,
  getErrorCodesByCategory,
} from './errors';

export type {
  ErrorCategory,
  ErrorSeverity,
  ErrorCode,
  Diagnostic,
} from './errors';

// Source maps
export {
  SourceMapGenerator,
  SourceMapConsumer,
  SourceLocationTracker,
  encodeVLQ,
  parseSourceMapFromUrl,
  extractSourceMapUrl,
  removeSourceMapComments,
  mergeSourceMaps,
  parseStackFrame,
  mapStackTrace,
  MappedError,
} from './sourcemap';

export type {
  SourceMap,
  MappingSegment,
  DecodedMapping,
  LookupResult,
  ParsedStackFrame,
} from './sourcemap';

// Autocomplete
export {
  AutocompleteEngine,
  createAutocompleteEngine,
  getSignatureHelp,
  KEYWORD_COMPLETIONS,
  TYPE_COMPLETIONS,
  STDLIB_COMPLETIONS,
  SNIPPET_COMPLETIONS,
  BUILTIN_SIGNATURES,
} from './autocomplete';

export type {
  CompletionKind,
  CompletionItem,
  CompletionContext,
  CompletionResult,
  ParameterInfo,
  SignatureInfo,
  SignatureHelp,
} from './autocomplete';

// Syntax highlighting
export {
  SyntaxHighlighter,
  createHighlighter,
  highlight,
  classifyToken,
  findMatchingBrackets,
  findMatchingBracket,
  toMonacoTokens,
  DARK_THEME,
  LIGHT_THEME,
  MONOKAI_THEME,
  CARDSCRIPT_LANGUAGE_DEFINITION,
} from './highlight';

export type {
  TokenClass,
  HighlightToken,
  HighlightTheme,
  HighlightLine,
  HighlightResult,
  BracketPair,
  MonacoToken,
} from './highlight';

// Playground UI
export {
  Playground,
  createPlayground,
  mountPlayground,
  getExample as getPlaygroundExample,
  getExamplesByCategory as getPlaygroundExamplesByCategory,
  searchExamples as searchPlaygroundExamples,
  PLAYGROUND_EXAMPLES,
} from './playground';

export type {
  PlaygroundConfig,
  PlaygroundState,
  OutputItem,
  PlaygroundExample,
  PlaygroundEventType,
  PlaygroundEvent,
  PlaygroundEventListener,
} from './playground';

// Documentation Generator
export {
  parseDocComment,
  extractLeadingComment,
  extractDocs,
  generateDocs,
  generateDocsFromSource,
  generateDocsFromSources,
  createDocGenerator,
} from './docgen';

export type {
  DocEntry,
  DocParam,
  DocReturn,
  DocPort,
  DocExample,
  DocComment,
  DocGenOptions,
  DocGenResult,
  TocEntry,
} from './docgen';

// Examples Library
export {
  EXAMPLES,
  getExample,
  getExamplesByCategory,
  getExamplesByDifficulty,
  searchExamples,
  getCategories,
  getAllTags,
  getRelatedExamples,
} from './examples';

export type {
  Example,
  ExampleMeta,
  ExampleCategory,
  ExampleDifficulty,
} from './examples';

// Version Migration
export {
  parseVersion,
  formatVersion,
  compareVersions,
  versionInRange,
  CURRENT_VERSION,
  CURRENT_VERSION_STRING,
  registerMigration,
  getMigrationPath,
  migrate,
  detectVersion,
  addVersionPragma,
  checkDeprecations,
  formatMigrationReport,
  autoMigrate,
  migrateFile,
} from './migration';

export type {
  Version,
  MigrationFn,
  MigrationResult,
  MigrationChange,
  MigrationWarning,
  Migration,
} from './migration';

// Live Mode Extensions
export {
  HotReloadManager,
  UndoManager,
  InterpolationEngine,
  BeatSyncManager,
  MacroManager,
  KeyboardShortcutManager,
  LiveModeController,
  createLiveModeController,
  createHotReloadManager,
  createUndoManager,
  createMacroManager,
  createKeyboardShortcutManager,
} from './live-mode';

export type {
  HotReloadState,
  UndoAction,
  UndoStack,
  InterpolationCurve,
  InterpolationState,
  BeatQuantize,
  BeatSyncChange,
  MacroDef,
  MacroMapping,
  KeyboardShortcut,
  ShortcutAction,
} from './live-mode';
