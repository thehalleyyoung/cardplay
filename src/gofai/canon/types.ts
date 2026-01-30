/**
 * GOFAI Canon Types — Core ID and Vocabulary Types
 *
 * This module defines the foundational types for GOFAI vocabulary management,
 * following CardPlay's canon discipline of branded types and SSOT tables.
 *
 * @module gofai/canon/types
 */

// =============================================================================
// Branded ID Types (following CardPlay canon patterns)
// =============================================================================

/**
 * A stable identifier for a GOFAI entity.
 *
 * Format: `gofai:<category>:<name>` for core, `namespace:gofai:<category>:<name>` for extensions.
 *
 * Examples:
 * - `gofai:axis:brightness` — Core perceptual axis
 * - `gofai:lexeme:darker` — Core lexeme
 * - `my-pack:gofai:axis:grit` — Extension-defined axis
 */
export type GofaiId = string & { readonly __brand: 'GofaiId' };

/**
 * A stable identifier for a lexeme (word/phrase in vocabulary).
 *
 * Format: `lex:<category>:<lemma>` for core, `namespace:lex:<category>:<lemma>` for extensions.
 */
export type LexemeId = string & { readonly __brand: 'LexemeId' };

/**
 * A stable identifier for a perceptual axis.
 *
 * Format: `axis:<name>` for core, `namespace:axis:<name>` for extensions.
 */
export type AxisId = string & { readonly __brand: 'AxisId' };

/**
 * A stable identifier for an edit opcode.
 *
 * Format: `op:<name>` for core, `namespace:op:<name>` for extensions.
 */
export type OpcodeId = string & { readonly __brand: 'OpcodeId' };

/**
 * A stable identifier for a constraint type.
 *
 * Format: `constraint:<name>` for core, `namespace:constraint:<name>` for extensions.
 */
export type ConstraintTypeId = string & { readonly __brand: 'ConstraintTypeId' };

/**
 * A stable identifier for a grammar rule.
 *
 * Format: `rule:<category>:<name>`
 */
export type RuleId = string & { readonly __brand: 'RuleId' };

/**
 * A stable identifier for a unit of measurement.
 *
 * Format: `unit:<name>`
 */
export type UnitId = string & { readonly __brand: 'UnitId' };

/**
 * A stable identifier for a section type.
 *
 * Format: `section:<name>` for core, `namespace:section:<name>` for extensions.
 */
export type SectionTypeId = string & { readonly __brand: 'SectionTypeId' };

/**
 * A stable identifier for a layer/track type.
 *
 * Format: `layer:<name>` for core, `namespace:layer:<name>` for extensions.
 */
export type LayerTypeId = string & { readonly __brand: 'LayerTypeId' };

// =============================================================================
// ID Constructors
// =============================================================================

/**
 * Create a GofaiId from components.
 */
export function createGofaiId(
  category: string,
  name: string,
  namespace?: string
): GofaiId {
  if (namespace) {
    return `${namespace}:gofai:${category}:${name}` as GofaiId;
  }
  return `gofai:${category}:${name}` as GofaiId;
}

/**
 * Validate namespace format.
 * Must be 2-32 chars, kebab-case (lowercase alphanumeric with hyphens only, no underscores).
 */
function validateNamespace(namespace: string): void {
  if (namespace.length < 2 || namespace.length > 32) {
    throw new Error(`Invalid namespace length: ${namespace} (must be 2-32 chars)`);
  }
  
  if (!/^[a-z]/.test(namespace)) {
    throw new Error(`Invalid namespace: ${namespace} (must start with lowercase letter)`);
  }
  
  // Kebab-case: lowercase alphanumeric with hyphens only (no underscores)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(namespace)) {
    throw new Error(`Invalid namespace: ${namespace} (must be kebab-case: lowercase alphanumeric with hyphens, no underscores)`);
  }
  
  // Reserved namespaces
  const reserved = ['core', 'builtin', 'cardplay', 'system', 'gofai', 'internal'];
  if (reserved.includes(namespace)) {
    throw new Error(`Reserved namespace: ${namespace}`);
  }
}

/**
 * Validate name format before normalization.
 * Must be 2-64 chars, start with letter, lowercase alphanumeric with hyphens/underscores only.
 * No spaces allowed.
 */
function validateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error(`Invalid name: name cannot be empty`);
  }
  
  // Check for uppercase (not allowed)
  if (name !== name.toLowerCase()) {
    throw new Error(`Invalid name: ${name} (must be lowercase)`);
  }
  
  // Check format: must start with letter, contain only lowercase alphanumeric, hyphens, underscores
  // NO SPACES
  if (!/^[a-z][a-z0-9_-]*$/.test(name)) {
    throw new Error(`Invalid name: ${name} (must start with lowercase letter and contain only lowercase alphanumeric, hyphens, or underscores)`);
  }
  
  // Check length
  if (name.length < 2 || name.length > 64) {
    throw new Error(`Invalid name length: ${name} (must be 2-64 chars)`);
  }
  
  // Check for consecutive hyphens or underscores
  if (/--|__/.test(name)) {
    throw new Error(`Invalid name: ${name} (no consecutive hyphens or underscores)`);
  }
}

/**
 * Create a LexemeId from components.
 */
export function createLexemeId(
  name: string,
  namespace?: string
): LexemeId {
  // Validate BEFORE any transformation
  validateName(name);
  
  if (namespace) {
    validateNamespace(namespace);
    return `lexeme:${namespace}:${name}` as LexemeId;
  }
  
  return `lexeme:${name}` as LexemeId;
}

/**
 * Create an AxisId from a name.
 */
export function createAxisId(name: string, namespace?: string): AxisId {
  // Validate (no normalization needed)
  validateName(name);
  
  if (namespace) {
    validateNamespace(namespace);
    return `axis:${namespace}:${name}` as AxisId;
  }
  
  return `axis:${name}` as AxisId;
}

/**
 * Create an OpcodeId from a name.
 */
export function createOpcodeId(name: string, namespace?: string): OpcodeId {
  // Validate (no normalization needed)
  validateName(name);
  
  if (namespace) {
    validateNamespace(namespace);
    return `opcode:${namespace}:${name}` as OpcodeId;
  }
  
  return `opcode:${name}` as OpcodeId;
}

/**
 * Create a ConstraintTypeId from a name.
 */
export function createConstraintTypeId(
  name: string,
  namespace?: string
): ConstraintTypeId {
  // Validate (no normalization needed)
  validateName(name);
  
  if (namespace) {
    validateNamespace(namespace);
    return `${namespace}:${name}` as ConstraintTypeId;
  }
  
  return name as ConstraintTypeId;
}

/**
 * Create a RuleId from components.
 */
export function createRuleId(category: string, name: string): RuleId {
  return `rule:${category}:${name}` as RuleId;
}

/**
 * Create a UnitId from a name.
 */
export function createUnitId(name: string): UnitId {
  return `unit:${name.toLowerCase()}` as UnitId;
}

/**
 * Create a SectionTypeId from a name.
 */
export function createSectionTypeId(
  name: string,
  namespace?: string
): SectionTypeId {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '_');
  if (namespace) {
    return `${namespace}:section:${normalizedName}` as SectionTypeId;
  }
  return `section:${normalizedName}` as SectionTypeId;
}

/**
 * Create a LayerTypeId from a name.
 */
export function createLayerTypeId(
  name: string,
  namespace?: string
): LayerTypeId {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '_');
  if (namespace) {
    return `${namespace}:layer:${normalizedName}` as LayerTypeId;
  }
  return `layer:${normalizedName}` as LayerTypeId;
}

// =============================================================================
// ID Parsing and Validation
// =============================================================================

/**
 * Check if an ID is namespaced (from an extension).
 */
export function isNamespaced(id: string): boolean {
  // Check different ID formats:
  // - lexeme:<name> (not namespaced) vs lexeme:<namespace>:<name> (namespaced)
  // - axis:<name> (not namespaced) vs axis:<namespace>:<name> (namespaced)
  // - opcode:<name> (not namespaced) vs opcode:<namespace>:<name> (namespaced)
  // - gofai:<category>:<name> (not namespaced) vs <namespace>:gofai:<category>:<name> (namespaced)
  // - rule:<category>:<name> (not namespaced) vs <namespace>:rule:<category>:<name> (namespaced)
  // - <name> (not namespaced) vs <namespace>:<name> (namespaced, for constraints)
  
  const parts = id.split(':');
  
  // Constraint IDs: <name> (1 part) or <namespace>:<name> (2 parts)
  if (parts.length === 2 && !['lexeme', 'axis', 'opcode', 'gofai', 'rule', 'unit', 'section', 'layer'].includes(parts[0]!)) {
    return true; // namespace:name format for constraint
  }
  
  // gofai and rule IDs have 3 parts when core: gofai:category:name, rule:category:name
  if (parts.length === 3 && (parts[0] === 'gofai' || parts[0] === 'rule')) {
    return false; // core format
  }
  
  // Other IDs: type:<name> (2 parts) or type:<namespace>:<name> (3 parts)
  if (parts.length === 3) {
    return true; // type:namespace:name format
  }
  
  // gofai and rule with namespace have 4 parts: namespace:gofai:category:name
  if (parts.length === 4 && (parts[1] === 'gofai' || parts[1] === 'rule')) {
    return true;
  }
  
  return false;
}

/**
 * Extract namespace from an ID (if any).
 */
export function getNamespace(id: string): string | undefined {
  if (!isNamespaced(id)) return undefined;
  
  const parts = id.split(':');
  
  // For constraint IDs: <namespace>:<name>
  if (parts.length === 2 && !['lexeme', 'axis', 'opcode', 'gofai', 'rule', 'unit', 'section', 'layer'].includes(parts[0]!)) {
    return parts[0];
  }
  
  // For gofai and rule IDs with namespace: <namespace>:gofai:<category>:<name> or <namespace>:rule:<category>:<name>
  if (parts.length === 4 && (parts[1] === 'gofai' || parts[1] === 'rule')) {
    return parts[0];
  }
  
  // For other IDs: type:<namespace>:<name>
  if (parts.length === 3) {
    return parts[1];
  }
  
  return undefined;
}

/**
 * Validate that a LexemeId has correct format.
 * Format: lexeme:<name> or lexeme:<namespace>:<name>
 * - name: 2-64 chars, lowercase, can contain hyphens, underscores, numbers (not at start)
 * - namespace: 2-32 chars, lowercase, can contain hyphens, underscores, numbers (not at start)
 */
export function isValidLexemeId(id: string): id is LexemeId {
  // Match: lexeme:<name> or lexeme:<namespace>:<name>
  const pattern = /^lexeme:(?:([a-z][a-z0-9_-]{1,31}):)?([a-z][a-z0-9_-]{1,63})$/;
  const match = pattern.exec(id);
  if (!match) return false;
  
  const namespace = match[1];
  const name = match[2];
  
  // Check for consecutive hyphens/underscores
  if (namespace && (/--|__/.test(namespace))) return false;
  if (/--|__/.test(name)) return false;
  
  return true;
}

/**
 * Validate that an AxisId has correct format.
 * Format: axis:<name> or axis:<namespace>:<name>
 */
export function isValidAxisId(id: string): id is AxisId {
  const pattern = /^axis:(?:([a-z][a-z0-9_-]{1,31}):)?([a-z][a-z0-9_-]{1,63})$/;
  const match = pattern.exec(id);
  if (!match) return false;
  
  const namespace = match[1];
  const name = match[2];
  
  // Check for consecutive hyphens/underscores
  if (namespace && (/--|__/.test(namespace))) return false;
  if (/--|__/.test(name)) return false;
  
  return true;
}

/**
 * Validate that an OpcodeId has correct format.
 * Format: opcode:<name> or opcode:<namespace>:<name>
 */
export function isValidOpcodeId(id: string): id is OpcodeId {
  const pattern = /^opcode:(?:([a-z][a-z0-9_-]{1,31}):)?([a-z][a-z0-9_-]{1,63})$/;
  const match = pattern.exec(id);
  if (!match) return false;
  
  const namespace = match[1];
  const name = match[2];
  
  // Check for consecutive hyphens/underscores
  if (namespace && (/--|__/.test(namespace))) return false;
  if (/--|__/.test(name)) return false;
  
  return true;
}

/**
 * Validate that a ConstraintTypeId has correct format.
 * Format: <name> or <namespace>:<name> (no prefix for constraints)
 */
export function isValidConstraintTypeId(id: string): id is ConstraintTypeId {
  const pattern = /^(?:([a-z][a-z0-9_-]{1,31}):)?([a-z][a-z0-9_-]{1,63})$/;
  const match = pattern.exec(id);
  if (!match) return false;
  
  const namespace = match[1];
  const name = match[2];
  
  // Check for consecutive hyphens/underscores
  if (namespace && (/--|__/.test(namespace))) return false;
  if (/--|__/.test(name)) return false;
  
  return true;
}

// =============================================================================
// Vocabulary Entry Types
// =============================================================================

/**
 * Category of a lexeme.
 */
export type LexemeCategory =
  | 'verb' // Action verbs (make, add, remove, keep)
  | 'adj' // Adjectives (brighter, darker, tighter)
  | 'noun' // Domain nouns (chorus, drums, melody)
  | 'prep' // Prepositions (in, on, for, before)
  | 'det' // Determiners (the, this, that, all)
  | 'adv' // Adverbs (slightly, much, very)
  | 'conj' // Conjunctions (and, but, then)
  | 'quant' // Quantifiers (all, some, every)
  | 'construction'; // Multi-word constructions

/**
 * A lexeme entry in the vocabulary.
 */
export interface Lexeme {
  /** Stable identifier */
  readonly id: LexemeId;

  /** Base form (lemma) */
  readonly lemma: string;

  /** Variant surface forms (synonyms, inflections) */
  readonly variants: readonly string[];

  /** Grammatical category */
  readonly category: LexemeCategory;

  /** Semantic binding (what CPL nodes this produces) */
  readonly semantics: LexemeSemantics;

  /** Selectional restrictions (what this can modify/apply to) */
  readonly restrictions?: LexemeRestrictions;

  /** Documentation description */
  readonly description: string;

  /** Usage examples */
  readonly examples: readonly string[];

  /** Whether this is deprecated */
  readonly deprecated?: boolean;

  /** Deprecation message */
  readonly deprecationMessage?: string;
}

/**
 * Semantic binding for a lexeme.
 */
export type LexemeSemantics =
  | { type: 'axis_modifier'; axis: AxisId; direction: 'increase' | 'decrease' }
  | { type: 'action'; opcode?: OpcodeId; role?: 'main' | 'modifier'; actionType?: string; [key: string]: any }
  | { type: 'constraint'; constraintType: ConstraintTypeId }
  | { type: 'reference'; referenceType: ReferenceType }
  | { type: 'scope'; scopeType: ScopeType }
  | { type: 'quantity'; quantityType: QuantityType }
  | { type: 'coordination'; coordType: CoordinationType }
  | { type: 'entity'; entityType?: EntityType; [key: string]: any }
  | { type: 'concept'; domain: string; aspect: string; [key: string]: any }
  | { type: 'modifier'; modifierType?: string; [key: string]: any }
  | { type: 'custom'; handler: string }
  | { type: 'intent_expression'; frame: string; maps_to: string; [key: string]: any }
  | { type: 'preference_expression'; frame: string; maps_to: string; [key: string]: any }
  | { type: 'experimental_action'; frame: string; maps_to: string; [key: string]: any }
  | { type: 'quality_assessment'; frame: string; [key: string]: any }
  | { type: 'perception_report'; frame: string; [key: string]: any }
  | { type: 'belief_statement'; frame: string; [key: string]: any }
  | { type: 'hypothetical_statement'; frame: string; [key: string]: any }
  | { type: 'comparison'; frame: string; [key: string]: any }
  | { type: 'structural_operation'; frame: string; [key: string]: any }
  | { type: 'collaborative_proposal'; frame: string; [key: string]: any }
  | { type: 'dialogue_response'; frame: string; [key: string]: any };

/**
 * Reference types for pronouns and demonstratives.
 */
export type ReferenceType =
  | 'anaphoric' // "it", "that" — refers to prior entity
  | 'deictic' // "this", "here" — refers to UI selection
  | 'cataphoric' // "the following" — refers to upcoming
  | 'generic'; // "one", "something"

/**
 * Scope types for location phrases.
 */
export type ScopeType =
  | 'section' // "in the chorus"
  | 'layer' // "on the drums"
  | 'range' // "for two bars"
  | 'selection' // "the selected notes"
  | 'global'; // "everywhere"

/**
 * Quantity types for amount expressions.
 */
export type QuantityType =
  | 'degree' // "slightly", "much", "a lot"
  | 'numeric' // "two", "96", "half"
  | 'relative' // "more", "less", "same"
  | 'comparative'; // "than before"

/**
 * Coordination types for conjunctions.
 */
export type CoordinationType =
  | 'and' // Conjunction
  | 'but' // Contrast
  | 'or' // Alternative
  | 'then' // Sequence
  | 'while'; // Concurrent

/**
 * Entity types for domain nouns.
 */
export type EntityType =
  | 'section'
  | 'layer'
  | 'card'
  | 'param'
  | 'event'
  | 'deck'
  | 'board'
  | 'track'
  | 'range'
  | 'axis'
  | 'technique'
  | 'instrument'
  | 'style'
  | 'genre'
  | 'effect'
  | 'texture'
  | 'rhythm'
  | 'harmony'
  | 'melody'
  | 'marker'
  | 'automation';

/**
 * Selectional restrictions for a lexeme.
 */
export interface LexemeRestrictions {
  /** What entity types this can apply to */
  readonly applicableTo?: readonly EntityType[];

  /** What axes this is related to */
  readonly relatedAxes?: readonly AxisId[];

  /** Required capabilities */
  readonly requiresCapabilities?: readonly string[];

  /** Mutually exclusive with */
  readonly conflictsWith?: readonly LexemeId[];
}

/**
 * Domain Noun Lexeme (compatibility type for batch files using different structure)
 * @deprecated Batch files should migrate to base Lexeme interface
 */
// =============================================================================
// Domain Noun Types
// =============================================================================

/**
 * Simplified domain noun for batch registration.
 * Legacy alias for backward compatibility.
 */
export interface DomainNoun {
  readonly id: string;
  readonly category: string;
  readonly canonical: string;
  readonly synonyms?: readonly string[];
}

/**
 * Domain noun category.
 * Legacy type alias for backward compatibility.
 */
export type DomainNounCategory =
  | 'harmony'
  | 'melody'
  | 'rhythm'
  | 'tempo'
  | 'production'
  | 'arrangement'
  | 'instruments'
  | 'techniques'
  | 'general';

export interface DomainNounLexeme {
  readonly id: string;
  readonly term: string;
  readonly variants: readonly string[];
  readonly category: string;
  readonly definition: string;
  readonly semantics: LexemeSemantics;
  readonly examples: readonly string[];
  readonly deprecated?: boolean;
}

// =============================================================================
// Perceptual Axis Types
// =============================================================================

/**
 * A perceptual axis definition.
 */
export interface PerceptualAxis {
  /** Stable identifier */
  readonly id: AxisId;

  /** Display name */
  readonly name: string;

  /** Description of the axis */
  readonly description: string;

  /** Polarity labels (e.g., ["darker", "brighter"]) */
  readonly poles: readonly [string, string];

  /** Default value (0-1 scale) */
  readonly defaultValue: number;

  /** Valid range */
  readonly range: readonly [number, number];

  /** Unit of measurement (if applicable) */
  readonly unit?: UnitId;

  /** Related lexemes that modify this axis */
  readonly relatedLexemes: readonly LexemeId[];

  /** Lever mappings (how to achieve changes on this axis) */
  readonly levers: readonly LeverMapping[];

  /** Whether this axis affects audio (vs. arrangement/structure) */
  readonly affectsAudio: boolean;

  /** Documentation link */
  readonly docLink?: string;
}

/**
 * A mapping from axis change to concrete lever.
 */
export interface LeverMapping {
  /** Human-readable lever name */
  readonly name: string;

  /** Opcode that implements this lever */
  readonly opcode: OpcodeId;

  /** Direction of axis change this lever provides */
  readonly direction: 'increase' | 'decrease' | 'bidirectional';

  /** Typical effectiveness (0-1, how much this lever moves the axis) */
  readonly effectiveness: number;

  /** Cost (how disruptive this lever is) */
  readonly cost: 'low' | 'medium' | 'high';

  /** Required capabilities */
  readonly requiresCapabilities?: readonly string[];

  /** Parameters to pass to the opcode */
  readonly params?: Record<string, unknown>;
}

// =============================================================================
// Section and Layer Types
// =============================================================================

/**
 * A section type in the vocabulary.
 */
export interface SectionType {
  /** Stable identifier */
  readonly id: SectionTypeId;

  /** Canonical name */
  readonly name: string;

  /** Variant names and abbreviations */
  readonly variants: readonly string[];

  /** Description */
  readonly description: string;

  /** Typical position in song form */
  readonly typicalPosition?: 'start' | 'middle' | 'end' | 'anywhere';

  /** Whether this section type is repeatable */
  readonly repeatable: boolean;
}

/**
 * A layer type in the vocabulary.
 */
export interface LayerType {
  /** Stable identifier */
  readonly id: LayerTypeId;

  /** Canonical name */
  readonly name: string;

  /** Variant names and abbreviations */
  readonly variants: readonly string[];

  /** Role category */
  readonly role: LayerRole;

  /** Description */
  readonly description: string;

  /** Typical frequency range (if applicable) */
  readonly frequencyRange?: readonly [number, number];

  /** Associated tags for matching */
  readonly tags: readonly string[];
}

/**
 * Layer role categories.
 */
export type LayerRole =
  | 'rhythm' // Drums, percussion
  | 'bass' // Bass instruments
  | 'harmony' // Chords, pads
  | 'melody' // Lead, vocal
  | 'texture' // Ambience, FX
  | 'structure'; // Markers, form

// =============================================================================
// Unit Types
// =============================================================================

/**
 * A unit of measurement.
 */
export interface MeasurementUnit {
  /** Stable identifier */
  readonly id: UnitId;

  /** Canonical name */
  readonly name: string;

  /** Abbreviations */
  readonly abbreviations: readonly string[];

  /** Unit category */
  readonly category: UnitCategory;

  /** Base unit for conversion */
  readonly baseUnit?: UnitId;

  /** Conversion factor to base unit */
  readonly conversionFactor?: number;

  /** Valid range (if applicable) */
  readonly validRange?: readonly [number, number];
}

/**
 * Unit categories.
 */
export type UnitCategory =
  | 'time' // Bars, beats, ticks, seconds
  | 'pitch' // Semitones, cents, octaves
  | 'tempo' // BPM
  | 'dynamic' // dB, velocity
  | 'ratio' // Percent, factor
  | 'frequency'; // Hz

// =============================================================================
// Constraint Types
// =============================================================================

/**
 * A constraint type definition.
 */
export interface ConstraintType {
  /** Stable identifier */
  readonly id: ConstraintTypeId;

  /** Display name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /** Parameter schema */
  readonly params: readonly ConstraintParam[];

  /** Default hardness */
  readonly defaultHard: boolean;

  /** Verification function name */
  readonly verifier: string;

  /** Related lexemes that express this constraint */
  readonly relatedLexemes: readonly LexemeId[];
}

/**
 * A parameter for a constraint type.
 */
export interface ConstraintParam {
  /** Parameter name */
  readonly name: string;

  /** Parameter type */
  readonly type: 'string' | 'number' | 'boolean' | 'entity_ref' | 'enum';

  /** Whether required */
  readonly required: boolean;

  /** Default value */
  readonly defaultValue?: unknown;

  /** Enum values (if type is 'enum') */
  readonly enumValues?: readonly string[];

  /** Description */
  readonly description: string;
}

// =============================================================================
// Opcode Types
// =============================================================================

/**
 * An edit opcode definition.
 */
export interface EditOpcode {
  /** Stable identifier */
  readonly id: OpcodeId;

  /** Display name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /** Parameter schema */
  readonly params: readonly OpcodeParam[];

  /** What this opcode affects */
  readonly affects: readonly EntityType[];

  /** Effect category */
  readonly effectType: 'inspect' | 'propose' | 'mutate';

  /** Cost level */
  readonly cost: 'low' | 'medium' | 'high';

  /** Required capabilities */
  readonly requiresCapabilities?: readonly string[];

  /** Axes this opcode can affect */
  readonly affectsAxes?: readonly AxisId[];

  /** Preconditions */
  readonly preconditions?: readonly string[];

  /** Postconditions */
  readonly postconditions?: readonly string[];
}

/**
 * A parameter for an opcode.
 */
export interface OpcodeParam {
  /** Parameter name */
  readonly name: string;

  /** Parameter type */
  readonly type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'entity_ref'
    | 'scope'
    | 'amount'
    | 'axis'
    | 'enum';

  /** Whether required */
  readonly required: boolean;

  /** Default value */
  readonly defaultValue?: unknown;

  /** Enum values (if type is 'enum') */
  readonly enumValues?: readonly string[];

  /** Description */
  readonly description: string;

  /** Validation constraints */
  readonly validation?: {
    readonly min?: number;
    readonly max?: number;
    readonly pattern?: string;
  };
}

// =============================================================================
// Vocabulary Table Types
// =============================================================================

/**
 * A vocabulary table containing all entries of a type.
 */
export interface VocabularyTable<T> {
  /** All entries indexed by ID */
  readonly byId: ReadonlyMap<string, T>;

  /** All entries in stable order */
  readonly all: readonly T[];

  /** Lookup by any variant form */
  readonly byVariant: ReadonlyMap<string, T>;
}

/**
 * Create a vocabulary table from an array of entries.
 */
export function createVocabularyTable<
  T extends { id: string; variants?: readonly string[] }
>(entries: readonly T[]): VocabularyTable<T> {
  const byId = new Map<string, T>();
  const byVariant = new Map<string, T>();

  for (const entry of entries) {
    byId.set(entry.id, entry);

    // Index by all variant forms
    if ('lemma' in entry && typeof (entry as { lemma: string }).lemma === 'string') {
      byVariant.set((entry as { lemma: string }).lemma.toLowerCase(), entry);
    }
    if ('name' in entry && typeof (entry as { name: string }).name === 'string') {
      byVariant.set((entry as { name: string }).name.toLowerCase(), entry);
    }
    if (entry.variants) {
      for (const variant of entry.variants) {
        byVariant.set(variant.toLowerCase(), entry);
      }
    }
  }

  return {
    byId,
    all: entries,
    byVariant,
  };
}

/**
 * Lookup an entry by ID or variant.
 */
export function lookupVocabulary<T>(
  table: VocabularyTable<T>,
  query: string
): T | undefined {
  // Try exact ID match first
  const byId = table.byId.get(query);
  if (byId) return byId;

  // Try variant match (case-insensitive)
  return table.byVariant.get(query.toLowerCase());
}

// Re-export namespace validation constants from gofai-id
export {
  isValidNamespace,
  RESERVED_NAMESPACES,
} from './gofai-id.js';
