/**
 * @file Auto-Binding Rules for Extension Integration
 * @module gofai/extensions/auto-binding
 * 
 * Implements Step 066: Define "auto-binding" rules - how card/board/deck metadata
 * becomes baseline lexicon entries without custom code.
 * 
 * When extensions (card packs, boards, decks) are loaded into CardPlay, this module
 * automatically generates GOFAI lexicon entries from their metadata, making them
 * immediately usable in natural language commands without manual vocabulary definition.
 * 
 * Design principles:
 * - Zero-config: Works out of the box for standard metadata
 * - Override-friendly: Extensions can provide custom GOFAI annotations
 * - Type-safe: Validates generated bindings against schemas
 * - Deterministic: Same metadata always generates same bindings
 * - Namespace-aware: Respects extension namespaces
 * 
 * @see gofai_goalB.md Step 066
 * @see docs/gofai/extension-integration.md
 */

import type {
  LexemeId,
  Lexeme,
  AxisId,
  OpcodeId,
  GofaiId,
} from '../canon/types.js';

import {
  createLexemeId,
  makeExtensionId,
  makeBuiltinId,
} from '../canon/gofai-id.js';

// ============================================================================
// Auto-Binding Context
// ============================================================================

/**
 * Context information needed for auto-binding
 */
export interface AutoBindingContext {
  /** Extension namespace (pack ID) */
  readonly namespace: string;
  
  /** Extension version */
  readonly version: string;
  
  /** Whether this is a trusted extension */
  readonly trusted: boolean;
  
  /** User language preference */
  readonly language?: string;
  
  /** Enable verbose logging */
  readonly debug?: boolean;
}

/**
 * Result of auto-binding process
 */
export interface AutoBindingResult {
  /** Generated lexemes */
  readonly lexemes: readonly Lexeme[];
  
  /** Generated axis bindings */
  readonly axes: readonly AxisBinding[];
  
  /** Generated opcode bindings */
  readonly opcodes: readonly OpcodeBinding[];
  
  /** Warnings encountered */
  readonly warnings: readonly string[];
  
  /** Errors encountered */
  readonly errors: readonly string[];
  
  /** Statistics */
  readonly stats: AutoBindingStats;
}

export interface AutoBindingStats {
  readonly cardsProcessed: number;
  readonly boardsProcessed: number;
  readonly decksProcessed: number;
  readonly lexemesGenerated: number;
  readonly axesGenerated: number;
  readonly opcodesGenerated: number;
}

export interface AxisBinding {
  readonly axisId: AxisId;
  readonly name: string;
  readonly description: string;
  readonly parameterMappings: readonly ParameterMapping[];
}

export interface OpcodeBinding {
  readonly opcodeId: OpcodeId;
  readonly name: string;
  readonly description: string;
  readonly handler: string;
}

export interface ParameterMapping {
  readonly paramPath: string;
  readonly cardId: string;
  readonly paramName: string;
  readonly mapping: 'linear' | 'exponential' | 'custom';
}

// ============================================================================
// Card Auto-Binding
// ============================================================================

/**
 * CardPlay card metadata (simplified)
 */
export interface CardMetadata {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly parameters?: readonly CardParameter[];
  readonly gofaiAnnotations?: CardGofaiAnnotations;
}

export interface CardParameter {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly type: 'number' | 'enum' | 'boolean' | 'string';
  readonly min?: number;
  readonly max?: number;
  readonly default?: unknown;
  readonly unit?: string;
  readonly description?: string;
}

/**
 * Optional GOFAI-specific annotations provided by card pack
 */
export interface CardGofaiAnnotations {
  /** Alternative names for the card */
  readonly synonyms?: readonly string[];
  
  /** Musical role (for entity resolution) */
  readonly role?: string;
  
  /** Parameter semantic bindings */
  readonly parameterSemantics?: Record<string, ParameterSemantics>;
  
  /** Default scope when card is referenced */
  readonly defaultScope?: string;
  
  /** Typical usage patterns */
  readonly usagePatterns?: readonly UsagePattern[];
}

export interface ParameterSemantics {
  /** Which axis this parameter maps to */
  readonly axis?: string;
  
  /** Direction of effect */
  readonly direction?: 'increase' | 'decrease' | 'bidirectional';
  
  /** Natural language names */
  readonly synonyms?: readonly string[];
  
  /** Typical values for "a little", "moderate", "a lot" */
  readonly magnitudes?: ParameterMagnitudes;
}

export interface ParameterMagnitudes {
  readonly small: number;
  readonly moderate: number;
  readonly large: number;
}

export interface UsagePattern {
  readonly utterance: string;
  readonly description: string;
  readonly parameters?: Record<string, unknown>;
}

/**
 * Auto-generate GOFAI bindings from card metadata
 */
export function bindCard(
  card: CardMetadata,
  context: AutoBindingContext
): AutoBindingResult {
  const lexemes: Lexeme[] = [];
  const axes: AxisBinding[] = [];
  const opcodes: OpcodeBinding[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Generate lexemes for card name
    const cardLexemes = generateCardLexemes(card, context);
    lexemes.push(...cardLexemes);

    // Generate parameter lexemes
    for (const param of card.parameters || []) {
      const paramLexemes = generateParameterLexemes(card, param, context);
      lexemes.push(...paramLexemes);
    }

    // Generate axis bindings from annotations
    if (card.gofaiAnnotations?.parameterSemantics) {
      const axisBindings = generateAxisBindings(card, context);
      axes.push(...axisBindings);
    }

    // Generate opcode for "add card" action
    const addOpcode = generateAddCardOpcode(card, context);
    opcodes.push(addOpcode);

  } catch (error) {
    errors.push(`Failed to bind card ${card.id}: ${error}`);
  }

  return {
    lexemes,
    axes,
    opcodes,
    warnings,
    errors,
    stats: {
      cardsProcessed: 1,
      boardsProcessed: 0,
      decksProcessed: 0,
      lexemesGenerated: lexemes.length,
      axesGenerated: axes.length,
      opcodesGenerated: opcodes.length,
    },
  };
}

/**
 * Generate lexemes for card reference
 */
function generateCardLexemes(
  card: CardMetadata,
  context: AutoBindingContext
): Lexeme[] {
  const lexemes: Lexeme[] = [];
  const baseName = card.displayName || card.name;
  
  // Normalize name: "EQ Eight" -> "eq" "eight"
  const normalizedTokens = normalizeCardName(baseName);
  const lemma = normalizedTokens.join('_');

  // Collect variants (synonyms + original name)
  const variants = new Set<string>([
    baseName,
    baseName.toLowerCase(),
    ...normalizedTokens,
  ]);

  if (card.gofaiAnnotations?.synonyms) {
    for (const syn of card.gofaiAnnotations.synonyms) {
      variants.add(syn);
      variants.add(syn.toLowerCase());
    }
  }

  // Generate noun lexeme for card
  const cardLexeme: Lexeme = {
    id: createLexemeId('noun', lemma, context.namespace) as LexemeId,
    lemma,
    variants: Array.from(variants),
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'card',
      entityId: card.id,
      namespace: context.namespace,
      role: card.gofaiAnnotations?.role || inferCardRole(card),
    },
    examples: [
      `add ${baseName}`,
      `use ${baseName}`,
      `${baseName} settings`,
    ],
    restrictions: {
      scopeTypes: ['track', 'layer', 'global'],
      contextualHints: card.category ? [card.category] : [],
    },
  };

  lexemes.push(cardLexeme);

  return lexemes;
}

/**
 * Generate lexemes for card parameter
 */
function generateParameterLexemes(
  card: CardMetadata,
  param: CardParameter,
  context: AutoBindingContext
): Lexeme[] {
  const lexemes: Lexeme[] = [];
  const baseName = param.displayName || param.name;
  const normalizedTokens = normalizeParameterName(baseName);
  const lemma = normalizedTokens.join('_');

  const variants = new Set<string>([
    baseName,
    baseName.toLowerCase(),
    ...normalizedTokens,
  ]);

  // Add synonyms from annotations
  const paramSem = card.gofaiAnnotations?.parameterSemantics?.[param.id];
  if (paramSem?.synonyms) {
    for (const syn of paramSem.synonyms) {
      variants.add(syn);
    }
  }

  // Generate noun lexeme for parameter reference
  const paramLexeme: Lexeme = {
    id: createLexemeId('noun', `${card.name}_${lemma}`, context.namespace) as LexemeId,
    lemma,
    variants: Array.from(variants),
    category: 'noun',
    semantics: {
      type: 'parameter',
      cardId: card.id,
      parameterId: param.id,
      parameterType: param.type,
      namespace: context.namespace,
    },
    examples: [
      `set ${baseName} to ${param.default}`,
      `adjust ${baseName}`,
      `${baseName} value`,
    ],
    restrictions: {
      scopeTypes: ['card', 'track'],
      requiresCard: card.id,
    },
  };

  lexemes.push(paramLexeme);

  // If parameter maps to axis, generate adjective lexemes
  if (paramSem?.axis) {
    const adjLexemes = generateAxisAdjectives(card, param, paramSem, context);
    lexemes.push(...adjLexemes);
  }

  return lexemes;
}

/**
 * Generate adjective lexemes for axis-mapped parameters
 */
function generateAxisAdjectives(
  card: CardMetadata,
  param: CardParameter,
  sem: ParameterSemantics,
  context: AutoBindingContext
): Lexeme[] {
  const lexemes: Lexeme[] = [];
  
  if (!sem.axis) return lexemes;

  // Generate increase adjective (e.g., "brighter" for brightness axis)
  if (sem.direction === 'increase' || sem.direction === 'bidirectional') {
    const increaseLemma = `more_${sem.axis}`;
    const increaseLexeme: Lexeme = {
      id: createLexemeId('adj', increaseLemma, context.namespace) as LexemeId,
      lemma: increaseLemma,
      variants: [`more ${sem.axis}`, `increase ${sem.axis}`, ...(sem.synonyms || [])],
      category: 'adj',
      semantics: {
        type: 'axis_modifier',
        axis: sem.axis,
        direction: 'increase',
        parameterBinding: {
          cardId: card.id,
          parameterId: param.id,
        },
        namespace: context.namespace,
      },
      examples: [
        `make it more ${sem.axis}`,
        `increase ${sem.axis}`,
      ],
    };
    lexemes.push(increaseLexeme);
  }

  // Generate decrease adjective
  if (sem.direction === 'decrease' || sem.direction === 'bidirectional') {
    const decreaseLemma = `less_${sem.axis}`;
    const decreaseLexeme: Lexeme = {
      id: createLexemeId('adj', decreaseLemma, context.namespace) as LexemeId,
      lemma: decreaseLemma,
      variants: [`less ${sem.axis}`, `decrease ${sem.axis}`],
      category: 'adj',
      semantics: {
        type: 'axis_modifier',
        axis: sem.axis,
        direction: 'decrease',
        parameterBinding: {
          cardId: card.id,
          parameterId: param.id,
        },
        namespace: context.namespace,
      },
      examples: [
        `make it less ${sem.axis}`,
        `decrease ${sem.axis}`,
      ],
    };
    lexemes.push(decreaseLexeme);
  }

  return lexemes;
}

/**
 * Generate axis bindings from parameter semantics
 */
function generateAxisBindings(
  card: CardMetadata,
  context: AutoBindingContext
): AxisBinding[] {
  const bindings: AxisBinding[] = [];
  const paramSemantics = card.gofaiAnnotations?.parameterSemantics || {};

  for (const [paramId, sem] of Object.entries(paramSemantics)) {
    if (!sem.axis) continue;

    const param = card.parameters?.find(p => p.id === paramId);
    if (!param) continue;

    const axisId = makeExtensionId(context.namespace, 'axis', sem.axis) as AxisId;
    
    const binding: AxisBinding = {
      axisId,
      name: sem.axis,
      description: `${sem.axis} control via ${card.name} ${param.name}`,
      parameterMappings: [{
        paramPath: `${card.id}:${param.id}`,
        cardId: card.id,
        paramName: param.name,
        mapping: inferMappingType(param),
      }],
    };

    bindings.push(binding);
  }

  return bindings;
}

/**
 * Generate opcode for adding this card
 */
function generateAddCardOpcode(
  card: CardMetadata,
  context: AutoBindingContext
): OpcodeBinding {
  const opcodeName = `add_${normalizeCardName(card.name).join('_')}`;
  const opcodeId = makeExtensionId(context.namespace, 'op', opcodeName) as OpcodeId;

  return {
    opcodeId,
    name: `Add ${card.displayName || card.name}`,
    description: `Add ${card.displayName || card.name} card to the signal chain`,
    handler: 'addCard',
  };
}

// ============================================================================
// Board Auto-Binding
// ============================================================================

/**
 * CardPlay board metadata (simplified)
 */
export interface BoardMetadata {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly category?: string;
  readonly capabilities?: readonly string[];
  readonly gofaiAnnotations?: BoardGofaiAnnotations;
}

export interface BoardGofaiAnnotations {
  /** Alternative names */
  readonly synonyms?: readonly string[];
  
  /** Default scope for commands in this board */
  readonly defaultScope?: 'global' | 'selection' | 'track' | 'section';
  
  /** Workflow verbs specific to this board */
  readonly workflowVerbs?: readonly WorkflowVerb[];
  
  /** Safe execution policy */
  readonly executionPolicy?: 'full-manual' | 'preview-first' | 'auto-apply';
}

export interface WorkflowVerb {
  readonly verb: string;
  readonly description: string;
  readonly opcodeId: string;
}

/**
 * Auto-generate GOFAI bindings from board metadata
 */
export function bindBoard(
  board: BoardMetadata,
  context: AutoBindingContext
): AutoBindingResult {
  const lexemes: Lexeme[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Generate lexemes for board name
    const boardLexemes = generateBoardLexemes(board, context);
    lexemes.push(...boardLexemes);

    // Generate workflow verb lexemes
    if (board.gofaiAnnotations?.workflowVerbs) {
      for (const verb of board.gofaiAnnotations.workflowVerbs) {
        const verbLexeme = generateWorkflowVerbLexeme(board, verb, context);
        lexemes.push(verbLexeme);
      }
    }

  } catch (error) {
    errors.push(`Failed to bind board ${board.id}: ${error}`);
  }

  return {
    lexemes,
    axes: [],
    opcodes: [],
    warnings,
    errors,
    stats: {
      cardsProcessed: 0,
      boardsProcessed: 1,
      decksProcessed: 0,
      lexemesGenerated: lexemes.length,
      axesGenerated: 0,
      opcodesGenerated: 0,
    },
  };
}

function generateBoardLexemes(
  board: BoardMetadata,
  context: AutoBindingContext
): Lexeme[] {
  const baseName = board.displayName || board.name;
  const normalizedTokens = normalizeBoardName(baseName);
  const lemma = normalizedTokens.join('_');

  const variants = new Set<string>([
    baseName,
    baseName.toLowerCase(),
    ...normalizedTokens,
  ]);

  if (board.gofaiAnnotations?.synonyms) {
    for (const syn of board.gofaiAnnotations.synonyms) {
      variants.add(syn);
    }
  }

  const boardLexeme: Lexeme = {
    id: createLexemeId('noun', lemma, context.namespace) as LexemeId,
    lemma,
    variants: Array.from(variants),
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'board',
      entityId: board.id,
      namespace: context.namespace,
    },
    examples: [
      `switch to ${baseName}`,
      `open ${baseName}`,
      `in ${baseName}`,
    ],
    restrictions: {
      scopeTypes: ['global'],
    },
  };

  return [boardLexeme];
}

function generateWorkflowVerbLexeme(
  board: BoardMetadata,
  verb: WorkflowVerb,
  context: AutoBindingContext
): Lexeme {
  return {
    id: createLexemeId('verb', verb.verb, context.namespace) as LexemeId,
    lemma: verb.verb,
    variants: [verb.verb],
    category: 'verb',
    semantics: {
      type: 'action',
      category: 'workflow',
      operation: verb.opcodeId,
      board: board.id,
      namespace: context.namespace,
    },
    examples: [
      verb.description,
    ],
    restrictions: {
      scopeTypes: ['selection', 'track'],
      requiresBoard: board.id,
    },
  };
}

// ============================================================================
// Deck Auto-Binding
// ============================================================================

/**
 * CardPlay deck metadata (simplified)
 */
export interface DeckMetadata {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly deckType?: string;
  readonly gofaiAnnotations?: DeckGofaiAnnotations;
}

export interface DeckGofaiAnnotations {
  /** Alternative names */
  readonly synonyms?: readonly string[];
  
  /** Common actions */
  readonly commonActions?: readonly string[];
  
  /** Safe scopes */
  readonly safeScopes?: readonly string[];
}

/**
 * Auto-generate GOFAI bindings from deck metadata
 */
export function bindDeck(
  deck: DeckMetadata,
  context: AutoBindingContext
): AutoBindingResult {
  const lexemes: Lexeme[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const deckLexemes = generateDeckLexemes(deck, context);
    lexemes.push(...deckLexemes);
  } catch (error) {
    errors.push(`Failed to bind deck ${deck.id}: ${error}`);
  }

  return {
    lexemes,
    axes: [],
    opcodes: [],
    warnings,
    errors,
    stats: {
      cardsProcessed: 0,
      boardsProcessed: 0,
      decksProcessed: 1,
      lexemesGenerated: lexemes.length,
      axesGenerated: 0,
      opcodesGenerated: 0,
    },
  };
}

function generateDeckLexemes(
  deck: DeckMetadata,
  context: AutoBindingContext
): Lexeme[] {
  const baseName = deck.displayName || deck.name;
  const normalizedTokens = normalizeDeckName(baseName);
  const lemma = normalizedTokens.join('_');

  const variants = new Set<string>([
    baseName,
    `the ${baseName}`,
    ...normalizedTokens,
  ]);

  if (deck.gofaiAnnotations?.synonyms) {
    for (const syn of deck.gofaiAnnotations.synonyms) {
      variants.add(syn);
    }
  }

  const deckLexeme: Lexeme = {
    id: createLexemeId('noun', lemma, context.namespace) as LexemeId,
    lemma,
    variants: Array.from(variants),
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'deck',
      entityId: deck.id,
      deckType: deck.deckType,
      namespace: context.namespace,
    },
    examples: [
      `open ${baseName}`,
      `move ${baseName} right`,
      `close ${baseName}`,
    ],
    restrictions: {
      scopeTypes: ['ui'],
    },
  };

  return [deckLexeme];
}

// ============================================================================
// Name Normalization Utilities
// ============================================================================

/**
 * Normalize card name into tokens
 */
function normalizeCardName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Normalize parameter name into tokens
 */
function normalizeParameterName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Normalize board name into tokens
 */
function normalizeBoardName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Normalize deck name into tokens
 */
function normalizeDeckName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Infer card role from metadata
 */
function inferCardRole(card: CardMetadata): string {
  const category = card.category?.toLowerCase() || '';
  const name = card.name.toLowerCase();

  if (category.includes('eq') || name.includes('eq')) return 'eq';
  if (category.includes('compressor') || name.includes('comp')) return 'dynamics';
  if (category.includes('reverb')) return 'reverb';
  if (category.includes('delay')) return 'delay';
  if (category.includes('synth')) return 'synth';
  if (category.includes('sampler')) return 'sampler';
  if (category.includes('drum')) return 'drums';
  
  return 'unknown';
}

/**
 * Infer parameter mapping type
 */
function inferMappingType(param: CardParameter): 'linear' | 'exponential' | 'custom' {
  const name = param.name.toLowerCase();
  
  // Frequency parameters are typically exponential
  if (name.includes('freq') || name.includes('hz')) {
    return 'exponential';
  }
  
  // Gain parameters are typically exponential (dB)
  if (name.includes('gain') || name.includes('level') || name.includes('volume')) {
    return 'exponential';
  }
  
  // Time parameters are often exponential
  if (name.includes('time') || name.includes('decay') || name.includes('release')) {
    return 'exponential';
  }
  
  // Default to linear
  return 'linear';
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process multiple entities at once
 */
export function bindEntities(
  entities: {
    cards?: readonly CardMetadata[];
    boards?: readonly BoardMetadata[];
    decks?: readonly DeckMetadata[];
  },
  context: AutoBindingContext
): AutoBindingResult {
  const allLexemes: Lexeme[] = [];
  const allAxes: AxisBinding[] = [];
  const allOpcodes: OpcodeBinding[] = [];
  const allWarnings: string[] = [];
  const allErrors: string[] = [];

  let cardsProcessed = 0;
  let boardsProcessed = 0;
  let decksProcessed = 0;

  // Process cards
  for (const card of entities.cards || []) {
    const result = bindCard(card, context);
    allLexemes.push(...result.lexemes);
    allAxes.push(...result.axes);
    allOpcodes.push(...result.opcodes);
    allWarnings.push(...result.warnings);
    allErrors.push(...result.errors);
    cardsProcessed++;
  }

  // Process boards
  for (const board of entities.boards || []) {
    const result = bindBoard(board, context);
    allLexemes.push(...result.lexemes);
    allWarnings.push(...result.warnings);
    allErrors.push(...result.errors);
    boardsProcessed++;
  }

  // Process decks
  for (const deck of entities.decks || []) {
    const result = bindDeck(deck, context);
    allLexemes.push(...result.lexemes);
    allWarnings.push(...result.warnings);
    allErrors.push(...result.errors);
    decksProcessed++;
  }

  return {
    lexemes: allLexemes,
    axes: allAxes,
    opcodes: allOpcodes,
    warnings: allWarnings,
    errors: allErrors,
    stats: {
      cardsProcessed,
      boardsProcessed,
      decksProcessed,
      lexemesGenerated: allLexemes.length,
      axesGenerated: allAxes.length,
      opcodesGenerated: allOpcodes.length,
    },
  };
}
