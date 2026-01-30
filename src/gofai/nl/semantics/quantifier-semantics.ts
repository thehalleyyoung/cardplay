/**
 * GOFAI NL Semantics — Generalized Quantifier Semantics
 *
 * Implements generalized quantifier semantics for expressions like
 * "all choruses", "some layers", "most drums", "every other bar",
 * "the first three notes", "no reverb".
 *
 * ## Why Generalized Quantifiers?
 *
 * In music editing, quantification is common:
 * - "Remove reverb from all choruses"   — universal quantifier
 * - "Add a cymbal to some transitions"  — existential
 * - "Brighten every other bar"          — distributive with stride
 * - "Mute the first three layers"       — bounded existential
 * - "Keep no reverb on the verse"       — negative universal
 *
 * Generalized quantifiers (GQ theory, Barwise & Cooper 1981) model
 * these as relations between sets:
 *
 * ```
 * "All choruses are bright"
 * ALL(chorus, bright) ≡ ∀x. chorus(x) → bright(x)
 *
 * "Some layers have reverb"
 * SOME(layer, has_reverb) ≡ ∃x. layer(x) ∧ has_reverb(x)
 *
 * "Most notes are quantized"
 * MOST(note, quantized) ≡ |note ∩ quantized| > |note| / 2
 * ```
 *
 * @module gofai/nl/semantics/quantifier-semantics
 * @see gofai_goalA.md Step 137
 */

// =============================================================================
// QUANTIFIER TYPES — the formal model
// =============================================================================

/**
 * A generalized quantifier expression.
 */
export interface QuantifierExpression {
  /** The quantifier type */
  readonly quantifier: QuantifierType;

  /** The restriction (domain): what set we're quantifying over */
  readonly restriction: QuantifierRestriction;

  /** The nuclear scope: what property we're asserting */
  readonly scope: QuantifierScope | null;

  /** Distribution mode */
  readonly distribution: DistributionMode;

  /** Whether this quantifier has been resolved to a concrete set */
  readonly resolved: boolean;

  /** The concrete entities (if resolved) */
  readonly resolvedEntities: readonly string[];

  /** Provenance */
  readonly span: QuantifierSpan;
}

/**
 * Quantifier types.
 */
export type QuantifierType =
  | UniversalQuantifier
  | ExistentialQuantifier
  | ProportionalQuantifier
  | NumeralQuantifier
  | NegativeQuantifier
  | InterrogativeQuantifier;

/**
 * Universal quantifier: "all", "every", "each".
 */
export interface UniversalQuantifier {
  readonly kind: 'universal';
  /** The word used ("all", "every", "each") */
  readonly word: string;
  /** Whether this is distributive ("each") or collective ("all") */
  readonly distributive: boolean;
}

/**
 * Existential quantifier: "some", "a", "any".
 */
export interface ExistentialQuantifier {
  readonly kind: 'existential';
  readonly word: string;
  /** Whether "any" has free-choice reading ("any" = "whichever") */
  readonly freeChoice: boolean;
}

/**
 * Proportional quantifier: "most", "half", "few", "many".
 */
export interface ProportionalQuantifier {
  readonly kind: 'proportional';
  readonly word: string;
  /** The proportion (0–1): "most" ≈ 0.7, "half" = 0.5, "few" ≈ 0.2 */
  readonly proportion: number;
  /** Whether this is upward monotone (most, many) or downward (few) */
  readonly monotonicity: 'upward' | 'downward';
}

/**
 * Numeral quantifier: "three", "the first five", "exactly two".
 */
export interface NumeralQuantifier {
  readonly kind: 'numeral';
  readonly word: string;
  /** The number */
  readonly count: number;
  /** Ordering: "first", "last", null for unordered */
  readonly ordering: NumeralOrdering | null;
  /** Exactness: "exactly", "at least", "at most", "approximately" */
  readonly exactness: NumeralExactness;
}

export type NumeralOrdering = 'first' | 'last' | 'middle' | 'random';
export type NumeralExactness = 'exact' | 'at_least' | 'at_most' | 'approximate';

/**
 * Negative quantifier: "no", "none", "neither".
 */
export interface NegativeQuantifier {
  readonly kind: 'negative';
  readonly word: string;
}

/**
 * Interrogative quantifier: "which", "how many".
 */
export interface InterrogativeQuantifier {
  readonly kind: 'interrogative';
  readonly word: string;
  /** Whether this asks about identity ("which") or count ("how many") */
  readonly askType: 'identity' | 'count';
}

// =============================================================================
// RESTRICTION AND SCOPE — the two arguments of a quantifier
// =============================================================================

/**
 * The restriction (domain) of a quantifier.
 * "All [choruses]" — "choruses" is the restriction.
 */
export interface QuantifierRestriction {
  /** The entity type being quantified over */
  readonly entityType: string;

  /** The predicate that defines the domain */
  readonly predicate: string;

  /** Filtering conditions (adjective/PP modifiers) */
  readonly filters: readonly RestrictionFilter[];

  /** Whether the restriction is a proper name (definite description) */
  readonly definite: boolean;

  /** Provenance */
  readonly span: QuantifierSpan;
}

/**
 * A filter on the restriction domain.
 */
export interface RestrictionFilter {
  /** The filter type */
  readonly type: FilterType;

  /** The filter value */
  readonly value: string;

  /** Whether this filter is negated */
  readonly negated: boolean;
}

export type FilterType =
  | 'property'      // "loud layers"
  | 'location'      // "layers in the chorus"
  | 'ordinal'       // "first three layers"
  | 'temporal'      // "layers before bar 8"
  | 'stride'        // "every other layer"
  | 'name';         // "layers named 'drums'"

/**
 * The nuclear scope of a quantifier.
 * "All choruses [are bright]" — "are bright" is the scope.
 */
export interface QuantifierScope {
  /** The predicate applied to each quantified entity */
  readonly predicate: string;

  /** The action to perform (if this is an imperative scope) */
  readonly action: string | null;

  /** Provenance */
  readonly span: QuantifierSpan;
}

/**
 * Distribution mode: how the quantifier distributes over entities.
 */
export interface DistributionMode {
  /** How to distribute */
  readonly type: DistributionType;

  /** Stride (for "every other", "every third", etc.) */
  readonly stride: number;

  /** Group size (for "groups of 4") */
  readonly groupSize: number;
}

export type DistributionType =
  | 'individual'    // Apply to each entity separately
  | 'collective'    // Apply to all entities together
  | 'cumulative'    // Accumulate over entities
  | 'strided'       // Every Nth entity
  | 'grouped';      // In groups of N

/**
 * Provenance span.
 */
export interface QuantifierSpan {
  readonly start: number;
  readonly end: number;
}

// =============================================================================
// QUANTIFIER LEXICON — mapping words to quantifier types
// =============================================================================

/**
 * A quantifier lexicon entry.
 */
export interface QuantifierLexEntry {
  /** The word/phrase */
  readonly word: string;

  /** All surface forms */
  readonly forms: readonly string[];

  /** The quantifier type */
  readonly quantifierType: QuantifierType;

  /** Default distribution mode */
  readonly defaultDistribution: DistributionMode;

  /** Monotonicity (for scope ambiguity resolution) */
  readonly monotonicity: 'upward' | 'downward' | 'non_monotone';

  /** Whether this creates a scope island */
  readonly scopeIsland: boolean;
}

/**
 * Built-in quantifier lexicon.
 */
export const QUANTIFIER_LEXICON: ReadonlyMap<string, QuantifierLexEntry> = new Map([
  // Universal
  ['all', {
    word: 'all',
    forms: ['all'],
    quantifierType: { kind: 'universal', word: 'all', distributive: false },
    defaultDistribution: { type: 'collective', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: false,
  }],
  ['every', {
    word: 'every',
    forms: ['every'],
    quantifierType: { kind: 'universal', word: 'every', distributive: true },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: false,
  }],
  ['each', {
    word: 'each',
    forms: ['each'],
    quantifierType: { kind: 'universal', word: 'each', distributive: true },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: true,
  }],

  // Existential
  ['some', {
    word: 'some',
    forms: ['some'],
    quantifierType: { kind: 'existential', word: 'some', freeChoice: false },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: false,
  }],
  ['a', {
    word: 'a',
    forms: ['a', 'an'],
    quantifierType: { kind: 'existential', word: 'a', freeChoice: false },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: false,
  }],
  ['any', {
    word: 'any',
    forms: ['any'],
    quantifierType: { kind: 'existential', word: 'any', freeChoice: true },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: false,
  }],

  // Proportional
  ['most', {
    word: 'most',
    forms: ['most'],
    quantifierType: { kind: 'proportional', word: 'most', proportion: 0.7, monotonicity: 'upward' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: false,
  }],
  ['many', {
    word: 'many',
    forms: ['many'],
    quantifierType: { kind: 'proportional', word: 'many', proportion: 0.6, monotonicity: 'upward' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'upward',
    scopeIsland: false,
  }],
  ['few', {
    word: 'few',
    forms: ['few'],
    quantifierType: { kind: 'proportional', word: 'few', proportion: 0.2, monotonicity: 'downward' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'downward',
    scopeIsland: false,
  }],
  ['half', {
    word: 'half',
    forms: ['half'],
    quantifierType: { kind: 'proportional', word: 'half', proportion: 0.5, monotonicity: 'upward' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'non_monotone',
    scopeIsland: false,
  }],

  // Negative
  ['no', {
    word: 'no',
    forms: ['no'],
    quantifierType: { kind: 'negative', word: 'no' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'downward',
    scopeIsland: true,
  }],
  ['none', {
    word: 'none',
    forms: ['none', 'none of'],
    quantifierType: { kind: 'negative', word: 'none' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'downward',
    scopeIsland: true,
  }],
  ['neither', {
    word: 'neither',
    forms: ['neither'],
    quantifierType: { kind: 'negative', word: 'neither' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'downward',
    scopeIsland: true,
  }],

  // Interrogative
  ['which', {
    word: 'which',
    forms: ['which', 'what'],
    quantifierType: { kind: 'interrogative', word: 'which', askType: 'identity' },
    defaultDistribution: { type: 'individual', stride: 1, groupSize: 1 },
    monotonicity: 'non_monotone',
    scopeIsland: false,
  }],
  ['how many', {
    word: 'how many',
    forms: ['how many', 'how much'],
    quantifierType: { kind: 'interrogative', word: 'how many', askType: 'count' },
    defaultDistribution: { type: 'collective', stride: 1, groupSize: 1 },
    monotonicity: 'non_monotone',
    scopeIsland: false,
  }],
]);

/**
 * Numeral quantifier entries (special handling for numeric words).
 */
export const NUMERAL_WORDS: ReadonlyMap<string, number> = new Map([
  ['one', 1], ['two', 2], ['three', 3], ['four', 4], ['five', 5],
  ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9], ['ten', 10],
  ['eleven', 11], ['twelve', 12], ['dozen', 12],
  ['first', 1], ['second', 2], ['third', 3], ['fourth', 4], ['fifth', 5],
  ['sixth', 6], ['seventh', 7], ['eighth', 8], ['ninth', 9], ['tenth', 10],
]);

/**
 * Ordering words.
 */
export const ORDERING_WORDS: ReadonlyMap<string, NumeralOrdering> = new Map([
  ['first', 'first'], ['last', 'last'], ['middle', 'middle'],
  ['random', 'random'], ['initial', 'first'], ['final', 'last'],
  ['opening', 'first'], ['closing', 'last'],
]);

/**
 * Exactness words.
 */
export const EXACTNESS_WORDS: ReadonlyMap<string, NumeralExactness> = new Map([
  ['exactly', 'exact'], ['precisely', 'exact'],
  ['at least', 'at_least'], ['at minimum', 'at_least'], ['minimum', 'at_least'],
  ['at most', 'at_most'], ['up to', 'at_most'], ['no more than', 'at_most'], ['maximum', 'at_most'],
  ['about', 'approximate'], ['approximately', 'approximate'], ['roughly', 'approximate'], ['around', 'approximate'],
]);

// =============================================================================
// QUANTIFIER CONSTRUCTION — building quantifier expressions
// =============================================================================

/**
 * Build a quantifier expression from a word and entity type.
 */
export function buildQuantifierExpression(
  quantifierWord: string,
  entityType: string,
  entityPredicate: string,
  span: QuantifierSpan = { start: 0, end: 0 },
): QuantifierExpression | null {
  const lexEntry = lookupQuantifier(quantifierWord);
  if (!lexEntry) return null;

  return {
    quantifier: lexEntry.quantifierType,
    restriction: {
      entityType,
      predicate: entityPredicate,
      filters: [],
      definite: false,
      span,
    },
    scope: null,
    distribution: lexEntry.defaultDistribution,
    resolved: false,
    resolvedEntities: [],
    span,
  };
}

/**
 * Build a numeral quantifier expression.
 */
export function buildNumeralQuantifier(
  count: number,
  entityType: string,
  entityPredicate: string,
  ordering: NumeralOrdering | null = null,
  exactness: NumeralExactness = 'exact',
  span: QuantifierSpan = { start: 0, end: 0 },
): QuantifierExpression {
  return {
    quantifier: {
      kind: 'numeral',
      word: String(count),
      count,
      ordering,
      exactness,
    },
    restriction: {
      entityType,
      predicate: entityPredicate,
      filters: [],
      definite: ordering !== null,
      span,
    },
    scope: null,
    distribution: { type: 'individual', stride: 1, groupSize: 1 },
    resolved: false,
    resolvedEntities: [],
    span,
  };
}

/**
 * Build a strided quantifier ("every other", "every third").
 */
export function buildStridedQuantifier(
  stride: number,
  entityType: string,
  entityPredicate: string,
  span: QuantifierSpan = { start: 0, end: 0 },
): QuantifierExpression {
  return {
    quantifier: { kind: 'universal', word: `every ${ordinalName(stride)}`, distributive: true },
    restriction: {
      entityType,
      predicate: entityPredicate,
      filters: [{ type: 'stride', value: String(stride), negated: false }],
      definite: false,
      span,
    },
    scope: null,
    distribution: { type: 'strided', stride, groupSize: 1 },
    resolved: false,
    resolvedEntities: [],
    span,
  };
}

function ordinalName(n: number): string {
  switch (n) {
    case 2: return 'other';
    case 3: return 'third';
    case 4: return 'fourth';
    default: return `${n}th`;
  }
}

/**
 * Add a filter to a quantifier expression.
 */
export function addFilter(
  expr: QuantifierExpression,
  filter: RestrictionFilter,
): QuantifierExpression {
  return {
    ...expr,
    restriction: {
      ...expr.restriction,
      filters: [...expr.restriction.filters, filter],
    },
  };
}

/**
 * Set the scope of a quantifier expression.
 */
export function setQuantifierScope(
  expr: QuantifierExpression,
  scope: QuantifierScope,
): QuantifierExpression {
  return { ...expr, scope };
}

/**
 * Resolve a quantifier to concrete entities.
 */
export function resolveQuantifier(
  expr: QuantifierExpression,
  entities: readonly string[],
): QuantifierExpression {
  return {
    ...expr,
    resolved: true,
    resolvedEntities: entities,
  };
}

// =============================================================================
// QUANTIFIER LOOKUP — finding quantifiers from words
// =============================================================================

/**
 * Look up a quantifier from a word.
 */
export function lookupQuantifier(word: string): QuantifierLexEntry | null {
  const lower = word.toLowerCase();
  for (const [, entry] of QUANTIFIER_LEXICON) {
    if (entry.forms.includes(lower) || entry.word === lower) {
      return entry;
    }
  }
  return null;
}

/**
 * Check if a word is a quantifier.
 */
export function isQuantifierWord(word: string): boolean {
  return lookupQuantifier(word) !== null;
}

/**
 * Check if a word is a numeral (number word).
 */
export function isNumeralWord(word: string): boolean {
  return NUMERAL_WORDS.has(word.toLowerCase());
}

/**
 * Parse a numeral from a word.
 */
export function parseNumeralWord(word: string): number | null {
  return NUMERAL_WORDS.get(word.toLowerCase()) ?? null;
}

// =============================================================================
// QUANTIFIER EVALUATION — computing which entities satisfy a quantifier
// =============================================================================

/**
 * An entity set provider: returns all entities of a given type.
 */
export type EntitySetProvider = (entityType: string) => readonly string[];

/**
 * A predicate evaluator: checks if an entity satisfies a predicate.
 */
export type PredicateEvaluator = (entityId: string, predicate: string) => boolean;

/**
 * Evaluate a quantifier expression against a set of entities.
 * Returns the set of entities that the quantifier selects.
 */
export function evaluateQuantifier(
  expr: QuantifierExpression,
  entityProvider: EntitySetProvider,
  predicateEvaluator: PredicateEvaluator,
): readonly string[] {
  // Get the domain (all entities of the restriction type)
  let domain = entityProvider(expr.restriction.entityType);

  // Apply the restriction predicate
  domain = domain.filter(e => predicateEvaluator(e, expr.restriction.predicate));

  // Apply filters
  for (const filter of expr.restriction.filters) {
    if (filter.type === 'property') {
      const pred = filter.value;
      const neg = filter.negated;
      domain = domain.filter(e => {
        const result = predicateEvaluator(e, pred);
        return neg ? !result : result;
      });
    }
  }

  // Apply the quantifier
  const qt = expr.quantifier;

  switch (qt.kind) {
    case 'universal':
      // "All" — return entire domain
      return applyDistribution(domain, expr.distribution);

    case 'existential':
      // "Some" / "a" — return first match (or all for free-choice "any")
      if (qt.freeChoice) return applyDistribution(domain, expr.distribution);
      return domain.length > 0 ? [domain[0]!] : [];

    case 'proportional':
      // "Most" / "half" / "few" — return proportional subset
      {
        const count = Math.round(domain.length * qt.proportion);
        return applyDistribution(domain.slice(0, count), expr.distribution);
      }

    case 'numeral':
      // "Three" / "the first five" — return count entities
      {
        let selected = domain;
        if (qt.ordering === 'first') {
          selected = domain.slice(0, qt.count);
        } else if (qt.ordering === 'last') {
          selected = domain.slice(-qt.count);
        } else {
          selected = domain.slice(0, qt.count);
        }
        return applyDistribution(selected, expr.distribution);
      }

    case 'negative':
      // "No" — return empty set (the scope is negated)
      return [];

    case 'interrogative':
      // "Which" — return all candidates for user to choose
      return domain;
  }
}

/**
 * Apply distribution mode to a set of entities.
 */
function applyDistribution(entities: readonly string[], dist: DistributionMode): readonly string[] {
  switch (dist.type) {
    case 'individual':
    case 'collective':
    case 'cumulative':
      return entities;

    case 'strided':
      return entities.filter((_, i) => i % dist.stride === 0);

    case 'grouped':
      // Return entities in groups
      return entities;
  }
}

// =============================================================================
// QUANTIFIER TRUTH CONDITIONS — checking whether a quantified statement is true
// =============================================================================

/**
 * Check whether a quantified statement is true.
 * Returns a truth value with evidence.
 */
export interface QuantifierTruthResult {
  /** Whether the quantified statement is true */
  readonly value: boolean;

  /** The domain (all entities satisfying the restriction) */
  readonly domain: readonly string[];

  /** The scope satisfiers (domain entities satisfying the scope) */
  readonly satisfiers: readonly string[];

  /** The proportion of satisfiers */
  readonly proportion: number;

  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * Evaluate the truth value of a quantifier expression.
 */
export function evaluateQuantifierTruth(
  expr: QuantifierExpression,
  entityProvider: EntitySetProvider,
  predicateEvaluator: PredicateEvaluator,
): QuantifierTruthResult {
  // Get domain
  let domain = entityProvider(expr.restriction.entityType);
  domain = domain.filter(e => predicateEvaluator(e, expr.restriction.predicate));

  // Get scope satisfiers
  const scopePredicate = expr.scope?.predicate ?? 'true';
  const satisfiers = domain.filter(e => predicateEvaluator(e, scopePredicate));

  const proportion = domain.length > 0 ? satisfiers.length / domain.length : 0;

  const qt = expr.quantifier;
  let value: boolean;
  let explanation: string;

  switch (qt.kind) {
    case 'universal':
      value = satisfiers.length === domain.length;
      explanation = value
        ? `All ${domain.length} ${expr.restriction.entityType}s satisfy the scope`
        : `${satisfiers.length} of ${domain.length} satisfy (not all)`;
      break;

    case 'existential':
      value = satisfiers.length > 0;
      explanation = value
        ? `${satisfiers.length} ${expr.restriction.entityType}(s) satisfy the scope`
        : `No ${expr.restriction.entityType}s satisfy the scope`;
      break;

    case 'proportional':
      value = proportion >= qt.proportion;
      explanation = `${(proportion * 100).toFixed(0)}% satisfy (threshold: ${(qt.proportion * 100).toFixed(0)}%)`;
      break;

    case 'numeral':
      switch (qt.exactness) {
        case 'exact': value = satisfiers.length === qt.count; break;
        case 'at_least': value = satisfiers.length >= qt.count; break;
        case 'at_most': value = satisfiers.length <= qt.count; break;
        case 'approximate': value = Math.abs(satisfiers.length - qt.count) <= 1; break;
      }
      explanation = `${satisfiers.length} satisfy (expected: ${qt.exactness} ${qt.count})`;
      break;

    case 'negative':
      value = satisfiers.length === 0;
      explanation = value
        ? `No ${expr.restriction.entityType}s satisfy the scope (as expected)`
        : `${satisfiers.length} unexpectedly satisfy the scope`;
      break;

    case 'interrogative':
      value = true; // Questions are always "true" (they just need an answer)
      explanation = qt.askType === 'count'
        ? `${satisfiers.length} ${expr.restriction.entityType}s match`
        : `Matching: ${satisfiers.join(', ')}`;
      break;
  }

  return {
    value,
    domain: [...domain],
    satisfiers: [...satisfiers],
    proportion,
    explanation,
  };
}

// =============================================================================
// FORMATTING — human-readable output
// =============================================================================

/**
 * Format a quantifier expression as a logical form.
 */
export function formatQuantifierLogical(expr: QuantifierExpression): string {
  const qt = expr.quantifier;
  const restr = expr.restriction.predicate;
  const scope = expr.scope?.predicate ?? '?';

  switch (qt.kind) {
    case 'universal':
      return `∀x. ${restr}(x) → ${scope}(x)`;
    case 'existential':
      return `∃x. ${restr}(x) ∧ ${scope}(x)`;
    case 'proportional':
      return `${qt.word.toUpperCase()}(x. ${restr}(x), ${scope}(x)) [≥${(qt.proportion * 100).toFixed(0)}%]`;
    case 'numeral':
      return `∃${qt.exactness === 'exact' ? '!' : ''}${qt.count}x. ${restr}(x) ∧ ${scope}(x)`;
    case 'negative':
      return `¬∃x. ${restr}(x) ∧ ${scope}(x)`;
    case 'interrogative':
      return `?x. ${restr}(x) ∧ ${scope}(x)`;
  }
}

/**
 * Format a quantifier expression as a human-readable string.
 */
export function formatQuantifierHuman(expr: QuantifierExpression): string {
  const qt = expr.quantifier;
  const entity = expr.restriction.entityType;

  switch (qt.kind) {
    case 'universal':
      return `${qt.word} ${entity}s`;
    case 'existential':
      return qt.freeChoice ? `any ${entity}` : `some ${entity}(s)`;
    case 'proportional':
      return `${qt.word} ${entity}s`;
    case 'numeral': {
      const ord = qt.ordering ? `${qt.ordering} ` : '';
      const exact = qt.exactness !== 'exact' ? `${qt.exactness} ` : '';
      return `${exact}${ord}${qt.count} ${entity}(s)`;
    }
    case 'negative':
      return `${qt.word} ${entity}(s)`;
    case 'interrogative':
      return `${qt.word} ${entity}(s)`;
  }
}

/**
 * Format a quantifier truth result.
 */
export function formatQuantifierTruth(result: QuantifierTruthResult): string {
  const lines: string[] = [];
  lines.push(`Truth: ${result.value ? 'TRUE' : 'FALSE'}`);
  lines.push(`  Domain: ${result.domain.length} entities`);
  lines.push(`  Satisfiers: ${result.satisfiers.length} (${(result.proportion * 100).toFixed(0)}%)`);
  lines.push(`  ${result.explanation}`);
  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the quantifier semantics module.
 */
export function getQuantifierSemanticStats(): {
  quantifierEntries: number;
  numeralWords: number;
  orderingWords: number;
  exactnessWords: number;
  quantifierTypes: number;
} {
  return {
    quantifierEntries: QUANTIFIER_LEXICON.size,
    numeralWords: NUMERAL_WORDS.size,
    orderingWords: ORDERING_WORDS.size,
    exactnessWords: EXACTNESS_WORDS.size,
    quantifierTypes: 6,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetQuantifierSemantics(): void {
  // Currently stateless — placeholder for future state
}
