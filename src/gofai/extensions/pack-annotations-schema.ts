/**
 * Step 067 [Ext][Type] — Pack-Provided GOFAI Annotations Schema
 * 
 * Specifies the complete schema for pack-provided GOFAI annotations: synonyms, roles,
 * param semantics, default scopes, axis bindings, constraints, and more.
 * 
 * This enables pack authors to provide rich language bindings for their cards, boards,
 * and decks without modifying core GOFAI code. All annotations are optional; the system
 * will fall back to auto-binding if not provided.
 * 
 * @module gofai/extensions/pack-annotations-schema
 */

import type { AxisId, LexemeId, OpcodeId, ConstraintTypeId } from '../canon/types';
import type { ExtensionNamespace, SemanticVersion } from '../canon/extension-namespace-provenance';

// ============================================================================
// Top-Level Pack GOFAI Manifest
// ============================================================================

/**
 * Top-level GOFAI manifest in a pack.
 * 
 * Located at: `pack-root/gofai/manifest.json`
 * 
 * Example:
 * ```json
 * {
 *   "schemaVersion": "1.0",
 *   "namespace": "my-jazz-pack",
 *   "version": "2.1.0",
 *   "language": "en-US",
 *   "cards": { ... },
 *   "boards": { ... },
 *   "decks": { ... },
 *   "axes": { ... },
 *   "vocabulary": { ... }
 * }
 * ```
 */
export interface PackGofaiManifest {
  /** Schema version for this manifest format */
  schemaVersion: '1.0';
  
  /** Pack namespace (must match pack ID) */
  namespace: string;
  
  /** Pack version (semantic versioning) */
  version: SemanticVersion;
  
  /** Primary language code (ISO 639-1 + optional region) */
  language?: string;
  
  /** Supported languages (if multilingual) */
  languages?: readonly string[];
  
  /** Card GOFAI annotations (keyed by card ID) */
  cards?: Record<string, CardGofaiAnnotation>;
  
  /** Board GOFAI annotations (keyed by board ID) */
  boards?: Record<string, BoardGofaiAnnotation>;
  
  /** Deck GOFAI annotations (keyed by deck type ID) */
  decks?: Record<string, DeckGofaiAnnotation>;
  
  /** Custom axes defined by this pack */
  axes?: Record<string, AxisAnnotation>;
  
  /** Custom vocabulary (additional lexemes) */
  vocabulary?: VocabularyAnnotation;
  
  /** Custom constraints defined by this pack */
  constraints?: Record<string, ConstraintAnnotation>;
  
  /** Custom opcodes defined by this pack */
  opcodes?: Record<string, OpcodeAnnotation>;
  
  /** Prolog knowledge base files */
  prologModules?: readonly string[];
  
  /** Pack-level metadata */
  metadata?: PackMetadata;
}

/**
 * Pack-level metadata.
 */
export interface PackMetadata {
  /** Human-readable description */
  description?: string;
  
  /** Author attribution */
  author?: string;
  
  /** License */
  license?: string;
  
  /** Homepage URL */
  homepage?: string;
  
  /** Documentation URL */
  documentation?: string;
  
  /** Musical genres this pack targets */
  genres?: readonly string[];
  
  /** Musical styles this pack supports */
  styles?: readonly string[];
  
  /** Required CardPlay version (semver range) */
  requiredCardPlayVersion?: string;
  
  /** Required GOFAI version (semver range) */
  requiredGofaiVersion?: string;
}

// ============================================================================
// Card Annotations
// ============================================================================

/**
 * GOFAI annotations for a card.
 * 
 * Provides natural language bindings, semantic metadata, and integration hints.
 */
export interface CardGofaiAnnotation {
  /** Card ID (must match) */
  id: string;
  
  /** Display name override (if different from card metadata) */
  displayName?: string;
  
  /** Explicit synonyms for this card */
  synonyms?: readonly Synonym[];
  
  /** Musical roles this card fulfills */
  roles?: readonly MusicalRole[];
  
  /** Parameter annotations */
  params?: Record<string, ParamAnnotation>;
  
  /** Axis bindings (which perceptual axes this card affects) */
  axisBindings?: readonly AxisBinding[];
  
  /** Constraint annotations */
  constraints?: CardConstraintAnnotation;
  
  /** Default scope when referenced */
  defaultScope?: ScopeHint;
  
  /** Musical description (shown in tooltips/help) */
  description?: string;
  
  /** Example phrases */
  examples?: readonly ExamplePhrase[];
  
  /** Whether this card can be auto-added by planner */
  autoAddable?: boolean;
  
  /** Tags for categorization */
  tags?: readonly string[];
  
  /** Dependencies (other cards this requires) */
  dependencies?: readonly string[];
  
  /** Incompatibilities (cards that conflict) */
  incompatibilities?: readonly string[];
  
  /** Usage hints */
  hints?: CardHints;
}

/**
 * Synonym definition.
 */
export interface Synonym {
  /** The synonym word/phrase */
  form: string;
  
  /** Part of speech */
  pos?: 'noun' | 'verb' | 'adjective' | 'adverb';
  
  /** Confidence (0-1, default 1.0) */
  confidence?: number;
  
  /** Regional variant (e.g., "en-GB" vs "en-US") */
  region?: string;
  
  /** Formality level */
  formality?: 'formal' | 'informal' | 'slang' | 'technical';
  
  /** Context where this synonym is preferred */
  context?: string;
  
  /** Notes for translators/contributors */
  notes?: string;
}

/**
 * Musical role a card can fulfill.
 */
export interface MusicalRole {
  /** Role identifier */
  id: string;
  
  /** Role display name */
  name?: string;
  
  /** Priority (0-1, higher = more central to card's purpose) */
  priority?: number;
  
  /** Whether this is a primary or secondary role */
  primary?: boolean;
}

/**
 * Scope hint for natural language references.
 */
export type ScopeHint = 
  | 'global'       // Affects entire project
  | 'track'        // Affects current/selected track
  | 'section'      // Affects current/selected section
  | 'selection'    // Affects current selection
  | 'layer'        // Affects specific layer
  | 'event';       // Affects specific events

/**
 * Example phrase showing how to use this card in language.
 */
export interface ExamplePhrase {
  /** The phrase */
  phrase: string;
  
  /** Expected interpretation */
  interpretation?: string;
  
  /** Context where this example applies */
  context?: string;
  
  /** Tags */
  tags?: readonly string[];
}

/**
 * Usage hints for the card.
 */
export interface CardHints {
  /** When to use this card */
  whenToUse?: string;
  
  /** When NOT to use this card */
  whenNotToUse?: string;
  
  /** Common mistakes */
  commonMistakes?: readonly string[];
  
  /** Best practices */
  bestPractices?: readonly string[];
  
  /** Performance considerations */
  performance?: string;
}

// ============================================================================
// Parameter Annotations
// ============================================================================

/**
 * GOFAI annotation for a card parameter.
 */
export interface ParamAnnotation {
  /** Parameter name (must match) */
  name: string;
  
  /** Display name override */
  displayName?: string;
  
  /** Synonyms for this parameter */
  synonyms?: readonly Synonym[];
  
  /** Which perceptual axis this param controls */
  axis?: AxisId | string;
  
  /** Direction: does increasing param increase or decrease axis? */
  direction?: ParamDirection;
  
  /** Mapping from linguistic amounts to parameter values */
  amountMapping?: AmountMapping;
  
  /** Units (Hz, dB, ms, ratio, percentage, etc.) */
  units?: ParamUnits;
  
  /** Musical description */
  description?: string;
  
  /** Value range semantics */
  range?: ParamRange;
  
  /** Default value semantic meaning */
  defaultMeaning?: string;
  
  /** Special values with semantic meanings */
  specialValues?: Record<number | string, string>;
  
  /** Whether this param is commonly adjusted */
  commonlyAdjusted?: boolean;
  
  /** Sensitivity (how much does small change affect sound?) */
  sensitivity?: 'low' | 'medium' | 'high';
  
  /** Example values */
  examples?: readonly ParamExample[];
}

/**
 * Parameter direction relative to axis.
 */
export type ParamDirection = 
  | 'positive'     // Increasing param increases axis
  | 'negative'     // Increasing param decreases axis
  | 'nonlinear'    // Complex relationship
  | 'independent'; // Not directly related to axis

/**
 * Mapping from linguistic amount descriptors to parameter values.
 * 
 * Example:
 * ```json
 * {
 *   "none": 0,
 *   "subtle": 0.15,
 *   "little": 0.3,
 *   "moderate": 0.5,
 *   "lot": 0.75,
 *   "extreme": 1.0
 * }
 * ```
 */
export interface AmountMapping {
  /** No effect */
  none?: number;
  
  /** Very subtle effect */
  subtle?: number;
  
  /** A little */
  little?: number;
  
  /** Small amount */
  small?: number;
  
  /** Moderate amount */
  moderate?: number;
  
  /** Medium amount */
  medium?: number;
  
  /** Significant amount */
  significant?: number;
  
  /** A lot */
  lot?: number;
  
  /** Very large amount */
  large?: number;
  
  /** Extreme amount */
  extreme?: number;
  
  /** Maximum */
  max?: number;
  
  /** Custom descriptors */
  custom?: Record<string, number>;
}

/**
 * Parameter units.
 */
export type ParamUnits = 
  | 'hz'           // Hertz
  | 'khz'          // Kilohertz
  | 'db'           // Decibels
  | 'ms'           // Milliseconds
  | 'seconds'      // Seconds
  | 'beats'        // Beats
  | 'bars'         // Bars
  | 'ticks'        // MIDI ticks
  | 'semitones'    // Semitones
  | 'cents'        // Cents (1/100 semitone)
  | 'ratio'        // Ratio (e.g., compression ratio)
  | 'percentage'   // Percentage (0-100)
  | 'normalized'   // Normalized (0-1)
  | 'degrees'      // Degrees (0-360)
  | 'samples'      // Audio samples
  | 'bpm'          // Beats per minute
  | string;        // Custom unit

/**
 * Parameter value range with semantic meanings.
 */
export interface ParamRange {
  /** Minimum value */
  min?: number;
  
  /** Maximum value */
  max?: number;
  
  /** Default value */
  default?: number;
  
  /** Recommended minimum for musical use */
  musicalMin?: number;
  
  /** Recommended maximum for musical use */
  musicalMax?: number;
  
  /** Sweet spot range */
  sweetSpot?: { min: number; max: number };
  
  /** Whether values wrap around */
  wraps?: boolean;
  
  /** Step size for discrete values */
  step?: number;
}

/**
 * Example parameter value with description.
 */
export interface ParamExample {
  /** The value */
  value: number;
  
  /** Description of effect */
  description: string;
  
  /** Musical context */
  context?: string;
  
  /** Genre where this value works well */
  genre?: string;
}

// ============================================================================
// Axis Binding
// ============================================================================

/**
 * Binding between a perceptual axis and card parameters.
 */
export interface AxisBinding {
  /** Axis identifier */
  axis: AxisId | string;
  
  /** Parameters that control this axis */
  params: readonly string[];
  
  /** How strongly this card affects the axis (0-1) */
  weight?: number;
  
  /** Whether this is a primary or secondary binding */
  primary?: boolean;
  
  /** Direction of effect */
  direction?: 'increase' | 'decrease' | 'both';
  
  /** Condition for this binding to apply */
  condition?: BindingCondition;
  
  /** Notes */
  notes?: string;
}

/**
 * Condition for when an axis binding applies.
 */
export interface BindingCondition {
  /** Other param must have certain value */
  paramEquals?: { param: string; value: number | string };
  
  /** Other param must be in range */
  paramInRange?: { param: string; min: number; max: number };
  
  /** Requires certain card configuration */
  cardState?: Record<string, unknown>;
}

// ============================================================================
// Constraint Annotation
// ============================================================================

/**
 * Constraint annotations for a card.
 */
export interface CardConstraintAnnotation {
  /** Can this card modify melody? */
  canAlterMelody?: boolean;
  
  /** Can this card modify harmony? */
  canAlterHarmony?: boolean;
  
  /** Can this card modify rhythm? */
  canAlterRhythm?: boolean;
  
  /** Can this card add/remove events? */
  canAddRemoveEvents?: boolean;
  
  /** Can this card modify timing? */
  canAlterTiming?: boolean;
  
  /** Can this card modify pitch? */
  canAlterPitch?: boolean;
  
  /** Can this card modify velocity/dynamics? */
  canAlterVelocity?: boolean;
  
  /** Can this card modify timbre? */
  canAlterTimbre?: boolean;
  
  /** Can this card modify spatial position? */
  canAlterSpatial?: boolean;
  
  /** Is this card destructive (hard to undo)? */
  isDestructive?: boolean;
  
  /** Is this card CPU-intensive? */
  isCpuIntensive?: boolean;
  
  /** Edit cost for planning (0-1, higher = more expensive) */
  editCost?: number;
  
  /** Risk level */
  riskLevel?: 'low' | 'medium' | 'high';
  
  /** Custom constraints */
  custom?: Record<string, boolean | number | string>;
}

// ============================================================================
// Board Annotations
// ============================================================================

/**
 * GOFAI annotations for a board.
 */
export interface BoardGofaiAnnotation {
  /** Board ID (must match) */
  id: string;
  
  /** Display name override */
  displayName?: string;
  
  /** Synonyms */
  synonyms?: readonly Synonym[];
  
  /** What kind of work is this board for? */
  workflows?: readonly WorkflowHint[];
  
  /** Default scope for operations */
  defaultScope?: ScopeHint;
  
  /** Safe execution policy */
  executionPolicy?: ExecutionPolicy;
  
  /** Common verbs associated with this board */
  verbs?: readonly VerbHint[];
  
  /** Description */
  description?: string;
  
  /** Capabilities exposed by this board */
  capabilities?: readonly string[];
  
  /** Example phrases */
  examples?: readonly ExamplePhrase[];
  
  /** When to use this board */
  hints?: BoardHints;
}

/**
 * Workflow hint for a board.
 */
export interface WorkflowHint {
  /** Workflow identifier */
  id: string;
  
  /** Workflow name */
  name?: string;
  
  /** Description */
  description?: string;
  
  /** Common tasks in this workflow */
  tasks?: readonly string[];
}

/**
 * Execution policy for a board.
 */
export type ExecutionPolicy = 
  | 'full-manual'      // Never auto-apply, always ask
  | 'confirm-each'     // Confirm before each operation
  | 'preview-first'    // Show preview, then confirm
  | 'safe-auto'        // Auto-apply safe operations only
  | 'full-auto';       // Auto-apply everything

/**
 * Verb hint for a board.
 */
export interface VerbHint {
  /** Verb form */
  verb: string;
  
  /** What this verb does on this board */
  action?: string;
  
  /** Example phrase */
  example?: string;
}

/**
 * Hints for when to use a board.
 */
export interface BoardHints {
  /** When to switch to this board */
  whenToUse?: string;
  
  /** What this board is good at */
  strengths?: readonly string[];
  
  /** What this board is not for */
  limitations?: readonly string[];
  
  /** Related boards */
  related?: readonly string[];
}

// ============================================================================
// Deck Annotations
// ============================================================================

/**
 * GOFAI annotations for a deck type.
 */
export interface DeckGofaiAnnotation {
  /** Deck type ID (must match factory ID) */
  id: string;
  
  /** Display name override */
  displayName?: string;
  
  /** Synonyms */
  synonyms?: readonly Synonym[];
  
  /** What "the deck" refers to */
  referent?: 'instance' | 'type' | 'both';
  
  /** Common actions */
  actions?: readonly DeckAction[];
  
  /** Default position/layout hints */
  defaultPosition?: DeckPosition;
  
  /** Description */
  description?: string;
  
  /** Safe scopes for operations */
  safeScopes?: readonly ScopeHint[];
  
  /** Example phrases */
  examples?: readonly ExamplePhrase[];
}

/**
 * Deck action hint.
 */
export interface DeckAction {
  /** Action verb */
  verb: string;
  
  /** What this action does */
  description?: string;
  
  /** Example phrase */
  example?: string;
  
  /** Scope of action */
  scope?: ScopeHint;
}

/**
 * Deck position hint.
 */
export type DeckPosition = 
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'bottom'
  | 'floating';

// ============================================================================
// Custom Axis Annotation
// ============================================================================

/**
 * Definition of a custom perceptual axis.
 */
export interface AxisAnnotation {
  /** Axis identifier (will be namespaced) */
  id: string;
  
  /** Display name */
  displayName: string;
  
  /** Synonyms */
  synonyms?: readonly Synonym[];
  
  /** Description */
  description?: string;
  
  /** Axis type */
  type?: AxisType;
  
  /** Value range */
  range?: AxisRange;
  
  /** Opposite axis (if applicable) */
  opposite?: string;
  
  /** Related axes */
  related?: readonly string[];
  
  /** Dimensions this axis spans */
  dimensions?: readonly AxisDimension[];
}

/**
 * Axis type.
 */
export type AxisType = 
  | 'perceptual'       // Subjective perceptual quality
  | 'acoustic'         // Measurable acoustic property
  | 'symbolic'         // Music theory concept
  | 'production'       // Production/mixing concept
  | 'compositional';   // Compositional concept

/**
 * Axis value range.
 */
export interface AxisRange {
  /** Minimum value */
  min?: number;
  
  /** Maximum value */
  max?: number;
  
  /** Default/neutral value */
  neutral?: number;
  
  /** Whether the axis is bipolar (has negative direction) */
  bipolar?: boolean;
}

/**
 * Axis dimension.
 */
export interface AxisDimension {
  /** Dimension name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Weight (0-1) */
  weight?: number;
}

// ============================================================================
// Vocabulary Annotation
// ============================================================================

/**
 * Additional vocabulary provided by pack.
 */
export interface VocabularyAnnotation {
  /** Additional lexemes */
  lexemes?: readonly LexemeAnnotation[];
  
  /** Phrase patterns */
  phrases?: readonly PhrasePattern[];
  
  /** Grammar extensions */
  grammar?: readonly GrammarExtension[];
}

/**
 * Custom lexeme definition.
 */
export interface LexemeAnnotation {
  /** Lexeme ID (will be namespaced) */
  id: string;
  
  /** Surface form */
  form: string;
  
  /** Part of speech */
  pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction';
  
  /** Meaning/semantics */
  meaning?: string;
  
  /** References entity */
  entity?: {
    type: 'card' | 'board' | 'deck' | 'axis' | 'opcode' | 'constraint';
    id: string;
  };
  
  /** Synonyms */
  synonyms?: readonly string[];
  
  /** Examples */
  examples?: readonly string[];
}

/**
 * Phrase pattern definition.
 */
export interface PhrasePattern {
  /** Pattern identifier */
  id: string;
  
  /** Pattern template */
  pattern: string;
  
  /** Meaning/interpretation */
  meaning?: string;
  
  /** Examples */
  examples?: readonly string[];
}

/**
 * Grammar extension.
 */
export interface GrammarExtension {
  /** Rule identifier */
  id: string;
  
  /** Rule type */
  type: 'construction' | 'transformation' | 'constraint';
  
  /** Rule definition (format TBD based on parser choice) */
  definition: unknown;
}

// ============================================================================
// Constraint Annotation
// ============================================================================

/**
 * Custom constraint definition.
 */
export interface ConstraintAnnotation {
  /** Constraint type ID (will be namespaced) */
  id: string;
  
  /** Display name */
  displayName: string;
  
  /** Description */
  description?: string;
  
  /** Constraint schema */
  schema?: ConstraintSchema;
  
  /** Checker function reference */
  checker?: string;
  
  /** Severity */
  severity?: 'error' | 'warning' | 'info';
  
  /** Examples */
  examples?: readonly ConstraintExample[];
}

/**
 * Constraint schema (parametric).
 */
export interface ConstraintSchema {
  /** Parameter definitions */
  params?: Record<string, ParamSchemaDefinition>;
  
  /** Required parameters */
  required?: readonly string[];
}

/**
 * Parameter schema definition.
 */
export interface ParamSchemaDefinition {
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  
  /** Description */
  description?: string;
  
  /** Allowed values (for enums) */
  enum?: readonly (string | number)[];
  
  /** Minimum value (for numbers) */
  minimum?: number;
  
  /** Maximum value (for numbers) */
  maximum?: number;
  
  /** Default value */
  default?: unknown;
}

/**
 * Constraint example.
 */
export interface ConstraintExample {
  /** Constraint usage */
  usage: string;
  
  /** What it prevents */
  prevents?: string;
  
  /** Example phrase */
  phrase?: string;
}

// ============================================================================
// Opcode Annotation
// ============================================================================

/**
 * Custom opcode definition.
 */
export interface OpcodeAnnotation {
  /** Opcode ID (will be namespaced) */
  id: string;
  
  /** Display name */
  displayName: string;
  
  /** Description */
  description?: string;
  
  /** Opcode category */
  category?: OpcodeCategory;
  
  /** Parameter schema */
  paramSchema?: OpcodeParamSchema;
  
  /** Handler function reference */
  handler?: string;
  
  /** Effect type */
  effect?: EffectType;
  
  /** Cost (0-1) */
  cost?: number;
  
  /** Risk level */
  risk?: 'low' | 'medium' | 'high';
  
  /** Examples */
  examples?: readonly OpcodeExample[];
}

/**
 * Opcode category.
 */
export type OpcodeCategory = 
  | 'structure'
  | 'rhythm'
  | 'melody'
  | 'harmony'
  | 'arrangement'
  | 'production'
  | 'utility';

/**
 * Opcode parameter schema.
 */
export interface OpcodeParamSchema {
  /** Parameters */
  params?: Record<string, ParamSchemaDefinition>;
  
  /** Required parameters */
  required?: readonly string[];
}

/**
 * Effect type.
 */
export type EffectType = 
  | 'inspect'        // Read-only, no mutations
  | 'propose'        // Proposes changes, doesn't apply
  | 'mutate';        // Actually mutates project state

/**
 * Opcode example.
 */
export interface OpcodeExample {
  /** What the opcode does */
  description: string;
  
  /** Example parameters */
  params?: Record<string, unknown>;
  
  /** Expected result */
  result?: string;
}

// ============================================================================
// Schema Validation
// ============================================================================

/**
 * JSON Schema for PackGofaiManifest.
 * Can be used for validation of pack-provided manifests.
 */
export const PACK_GOFAI_MANIFEST_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'PackGofaiManifest',
  type: 'object',
  required: ['schemaVersion', 'namespace', 'version'],
  properties: {
    schemaVersion: {
      type: 'string',
      enum: ['1.0'],
    },
    namespace: {
      type: 'string',
      pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
      minLength: 2,
      maxLength: 50,
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?(\\+[a-zA-Z0-9.]+)?$',
    },
    language: {
      type: 'string',
      pattern: '^[a-z]{2}(-[A-Z]{2})?$',
    },
    languages: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z]{2}(-[A-Z]{2})?$',
      },
    },
    cards: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/CardGofaiAnnotation' },
    },
    boards: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/BoardGofaiAnnotation' },
    },
    decks: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/DeckGofaiAnnotation' },
    },
    axes: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/AxisAnnotation' },
    },
    vocabulary: { $ref: '#/definitions/VocabularyAnnotation' },
    constraints: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/ConstraintAnnotation' },
    },
    opcodes: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/OpcodeAnnotation' },
    },
    prologModules: {
      type: 'array',
      items: { type: 'string' },
    },
    metadata: { $ref: '#/definitions/PackMetadata' },
  },
  definitions: {
    // Define all the sub-schemas here
    // (Abbreviated for brevity - would include full definitions)
    CardGofaiAnnotation: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        displayName: { type: 'string' },
        synonyms: { type: 'array', items: { $ref: '#/definitions/Synonym' } },
        // ... etc
      },
    },
    Synonym: {
      type: 'object',
      required: ['form'],
      properties: {
        form: { type: 'string' },
        pos: { type: 'string', enum: ['noun', 'verb', 'adjective', 'adverb'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        // ... etc
      },
    },
    // ... other definitions
  },
} as const;

/**
 * Validate a pack GOFAI manifest against the schema.
 */
export function validatePackGofaiManifest(
  manifest: unknown
): { valid: true; manifest: PackGofaiManifest } | { valid: false; errors: readonly string[] } {
  // Would use a JSON schema validator library (e.g., ajv) in real implementation
  // For now, basic type checking
  
  if (typeof manifest !== 'object' || manifest === null) {
    return { valid: false, errors: ['Manifest must be an object'] };
  }
  
  const m = manifest as any;
  
  const errors: string[] = [];
  
  if (m.schemaVersion !== '1.0') {
    errors.push('schemaVersion must be "1.0"');
  }
  
  if (typeof m.namespace !== 'string' || !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(m.namespace)) {
    errors.push('namespace must be a valid lowercase identifier');
  }
  
  if (typeof m.version !== 'string' || !/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push('version must be a valid semantic version');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true, manifest: m as PackGofaiManifest };
}

// ============================================================================
// Manifest Loading
// ============================================================================

/**
 * Load and parse a pack GOFAI manifest from JSON.
 */
export function loadPackGofaiManifest(json: string): PackGofaiManifest {
  const parsed = JSON.parse(json);
  const validation = validatePackGofaiManifest(parsed);
  
  if (!validation.valid) {
    throw new Error(`Invalid pack GOFAI manifest: ${validation.errors.join(', ')}`);
  }
  
  return validation.manifest;
}

/**
 * Serialize a pack GOFAI manifest to JSON.
 */
export function serializePackGofaiManifest(manifest: PackGofaiManifest): string {
  return JSON.stringify(manifest, null, 2);
}

// ============================================================================
// Migration Support
// ============================================================================

/**
 * Migrate a pack GOFAI manifest from an older schema version.
 */
export function migratePackGofaiManifest(
  manifest: any,
  fromVersion: string,
  toVersion: string = '1.0'
): PackGofaiManifest {
  // Would implement migration logic here
  // For now, just validate
  const validation = validatePackGofaiManifest(manifest);
  
  if (!validation.valid) {
    throw new Error(`Cannot migrate invalid manifest: ${validation.errors.join(', ')}`);
  }
  
  return validation.manifest;
}

// ============================================================================
// Annotation Merging
// ============================================================================

/**
 * Merge multiple card annotations (e.g., from base pack + override pack).
 */
export function mergeCardAnnotations(
  base: CardGofaiAnnotation,
  override: Partial<CardGofaiAnnotation>
): CardGofaiAnnotation {
  return {
    ...base,
    ...override,
    synonyms: override.synonyms ?? base.synonyms,
    roles: override.roles ?? base.roles,
    params: override.params ? { ...base.params, ...override.params } : base.params,
    axisBindings: override.axisBindings ?? base.axisBindings,
    examples: override.examples ?? base.examples,
  };
}

/**
 * Merge multiple board annotations.
 */
export function mergeBoardAnnotations(
  base: BoardGofaiAnnotation,
  override: Partial<BoardGofaiAnnotation>
): BoardGofaiAnnotation {
  return {
    ...base,
    ...override,
    synonyms: override.synonyms ?? base.synonyms,
    workflows: override.workflows ?? base.workflows,
    verbs: override.verbs ?? base.verbs,
    examples: override.examples ?? base.examples,
  };
}

/**
 * Merge multiple deck annotations.
 */
export function mergeDeckAnnotations(
  base: DeckGofaiAnnotation,
  override: Partial<DeckGofaiAnnotation>
): DeckGofaiAnnotation {
  return {
    ...base,
    ...override,
    synonyms: override.synonyms ?? base.synonyms,
    actions: override.actions ?? base.actions,
    examples: override.examples ?? base.examples,
  };
}

// ============================================================================
// Export All Types
// ============================================================================

export type {
  // Top-level
  PackGofaiManifest,
  PackMetadata,
  
  // Cards
  CardGofaiAnnotation,
  ParamAnnotation,
  AmountMapping,
  ParamUnits,
  ParamRange,
  ParamExample,
  AxisBinding,
  BindingCondition,
  CardConstraintAnnotation,
  CardHints,
  
  // Boards
  BoardGofaiAnnotation,
  WorkflowHint,
  ExecutionPolicy,
  VerbHint,
  BoardHints,
  
  // Decks
  DeckGofaiAnnotation,
  DeckAction,
  DeckPosition,
  
  // Axes
  AxisAnnotation,
  AxisType,
  AxisRange,
  AxisDimension,
  
  // Vocabulary
  VocabularyAnnotation,
  LexemeAnnotation,
  PhrasePattern,
  GrammarExtension,
  
  // Constraints
  ConstraintAnnotation,
  ConstraintSchema,
  ConstraintExample,
  
  // Opcodes
  OpcodeAnnotation,
  OpcodeCategory,
  OpcodeParamSchema,
  EffectType,
  OpcodeExample,
  
  // Shared
  Synonym,
  MusicalRole,
  ScopeHint,
  ExamplePhrase,
  ParamDirection,
  ParamSchemaDefinition,
};
