/**
 * GOFAI NL Grammar — Edit Locality
 *
 * Implements grammar rules for "edit locality" markers that bias the
 * cost model and scope of an edit operation:
 *
 * - Restriction: "just", "only", "merely", "nothing but"
 * - Minimum threshold: "at least", "at minimum", "no less than"
 * - Maximum threshold: "at most", "no more than", "up to"
 * - Approximation: "about", "around", "roughly", "approximately"
 * - Exclusivity: "exclusively", "solely", "purely"
 * - Emphasis: "especially", "particularly", "primarily"
 * - Scope narrowing: "specifically", "precisely", "exactly"
 *
 * ## Cost Model Biasing
 *
 * Edit locality markers influence how the planner evaluates candidate
 * plans. "Just make it louder" signals that the user wants minimal
 * side-effects and the cheapest possible plan. "At least add reverb"
 * signals a minimum requirement that may be exceeded.
 *
 * ```
 * "just"      → prefer minimal-cost plan, narrow scope
 * "only"      → restrict scope to exactly the named target
 * "at least"  → establish floor requirement
 * "at most"   → establish ceiling constraint
 * "about"     → relax precision, accept approximations
 * "exactly"   → require precise values
 * ```
 *
 * ## Interaction with Preservation
 *
 * Locality markers interact with preservation constraints:
 * - "just change the melody" implies "preserve everything else"
 * - "only adjust the volume" implies "don't change timbre, pitch, etc."
 * - "at least keep the rhythm" establishes a preservation floor
 *
 * @module gofai/nl/grammar/edit-locality
 * @see gofai_goalA.md Step 124
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// LOCALITY TYPES — what kind of scope bias?
// =============================================================================

/**
 * An edit locality expression found in the input.
 */
export interface EditLocalityExpression {
  /** Type of locality marker */
  readonly type: LocalityType;

  /** The surface form that was matched */
  readonly marker: LocalityMarker;

  /** How this biases the cost model */
  readonly costBias: CostBias;

  /** How this constrains scope */
  readonly scopeEffect: ScopeEffect;

  /** Implied preservation constraint (if any) */
  readonly impliedPreservation: ImpliedPreservation | null;

  /** Span of the locality marker in the input */
  readonly markerSpan: Span;

  /** Span of the scope (what the locality applies to) */
  readonly scopeSpan: Span | null;

  /** Confidence in the parse (0-1) */
  readonly confidence: number;
}

/**
 * Types of edit locality markers.
 */
export type LocalityType =
  | 'restriction'       // "just", "only", "merely" — narrow scope, minimize cost
  | 'minimum_threshold' // "at least", "at minimum" — floor requirement
  | 'maximum_threshold' // "at most", "no more than" — ceiling constraint
  | 'approximation'     // "about", "around", "roughly" — relax precision
  | 'exclusivity'       // "exclusively", "solely" — strict restriction
  | 'emphasis'          // "especially", "particularly" — priority bias
  | 'precision'         // "exactly", "precisely" — require exact values
  | 'sufficiency'       // "enough", "sufficient" — satisficing
  | 'excess'            // "too much", "overly" — problem signal
  | 'totality';         // "completely", "entirely" — full scope

/**
 * A surface-form locality marker.
 */
export interface LocalityMarker {
  /** The canonical form of the marker */
  readonly canonical: string;

  /** The matched surface form */
  readonly surface: string;

  /** Which locality type this marker signals */
  readonly localityType: LocalityType;

  /** Relative strength (0-1, how strongly this biases) */
  readonly strength: number;
}

/**
 * How a locality marker biases the cost model.
 */
export interface CostBias {
  /** Direction of bias */
  readonly direction: 'minimize' | 'maximize' | 'constrain' | 'relax' | 'neutral';

  /** Magnitude of bias (0-1) */
  readonly magnitude: number;

  /** Whether this implies "preserve everything not mentioned" */
  readonly impliesPreserveRest: boolean;

  /** Whether this sets a threshold */
  readonly threshold: ThresholdSpec | null;
}

/**
 * Threshold specification for min/max markers.
 */
export interface ThresholdSpec {
  /** Type of threshold */
  readonly type: 'floor' | 'ceiling' | 'exact' | 'approximate';

  /** If a numeric value was specified */
  readonly numericValue: number | null;

  /** If a qualitative level was specified */
  readonly qualitativeLevel: string | null;
}

/**
 * How a locality marker affects the scope of an edit.
 */
export interface ScopeEffect {
  /** How scope is modified */
  readonly modification: 'narrow' | 'widen' | 'lock' | 'relax' | 'none';

  /** Whether the scope is exclusive (only the named target) */
  readonly exclusive: boolean;

  /** Priority adjustment for the scoped element */
  readonly priorityAdjust: number;
}

/**
 * An implied preservation constraint from a locality marker.
 */
export interface ImpliedPreservation {
  /** What to preserve */
  readonly target: 'everything_else' | 'named_aspects' | 'unspecified';

  /** How strong the preservation implication is */
  readonly strength: 'strong' | 'moderate' | 'weak';

  /** Whether this is defeasible (can be overridden by explicit instructions) */
  readonly defeasible: boolean;
}

// =============================================================================
// MARKER LEXICON — all recognized locality markers
// =============================================================================

/**
 * Entry in the locality marker lexicon.
 */
export interface LocalityLexiconEntry {
  /** Canonical form */
  readonly canonical: string;

  /** Surface variants (case-insensitive matching) */
  readonly variants: readonly string[];

  /** Which type this belongs to */
  readonly localityType: LocalityType;

  /** Strength of the bias (0-1) */
  readonly strength: number;

  /** Description for documentation */
  readonly description: string;

  /** Usage examples */
  readonly examples: readonly string[];
}

/**
 * All recognized locality markers.
 */
export const LOCALITY_MARKERS: readonly LocalityLexiconEntry[] = [
  // ── Restriction markers ──────────────────────────────────────────────
  {
    canonical: 'just',
    variants: ['just', 'jus'],
    localityType: 'restriction',
    strength: 0.7,
    description: 'Narrow scope, prefer minimal-cost plan.',
    examples: ['Just make it louder', 'Just add a bit of reverb'],
  },
  {
    canonical: 'only',
    variants: ['only'],
    localityType: 'restriction',
    strength: 0.85,
    description: 'Strict scope restriction to the named target.',
    examples: ['Only change the drums', 'Only adjust the volume'],
  },
  {
    canonical: 'merely',
    variants: ['merely', 'simply'],
    localityType: 'restriction',
    strength: 0.6,
    description: 'Downplay the scope, suggest a minor change.',
    examples: ['Merely adjust the EQ', 'Simply move the bass down'],
  },
  {
    canonical: 'nothing but',
    variants: ['nothing but', 'nothing other than', 'nothing except'],
    localityType: 'restriction',
    strength: 0.95,
    description: 'Extreme restriction — only the named element.',
    examples: ['Change nothing but the tempo', 'Touch nothing except the drums'],
  },
  {
    canonical: 'all I want is',
    variants: ['all I want is', 'all I need is', 'all that needs to change is', 'the only thing'],
    localityType: 'restriction',
    strength: 0.9,
    description: 'User explicitly naming the sole desired change.',
    examples: ['All I want is more reverb', 'The only thing that needs to change is the bass'],
  },

  // ── Minimum threshold markers ────────────────────────────────────────
  {
    canonical: 'at least',
    variants: ['at least', 'at a minimum', 'at minimum', 'minimum', 'no less than', 'not less than'],
    localityType: 'minimum_threshold',
    strength: 0.8,
    description: 'Establish a floor requirement.',
    examples: ['At least add reverb', 'At minimum keep the melody'],
  },
  {
    canonical: 'at the very least',
    variants: ['at the very least', 'at bare minimum', 'minimally'],
    localityType: 'minimum_threshold',
    strength: 0.9,
    description: 'Strong minimum requirement.',
    examples: ['At the very least, keep the groove', 'At bare minimum, preserve the hook'],
  },

  // ── Maximum threshold markers ────────────────────────────────────────
  {
    canonical: 'at most',
    variants: ['at most', 'at maximum', 'at max', 'no more than', 'not more than', 'up to'],
    localityType: 'maximum_threshold',
    strength: 0.8,
    description: 'Establish a ceiling constraint.',
    examples: ['At most change two bars', 'No more than a slight adjustment'],
  },
  {
    canonical: 'at the very most',
    variants: ['at the very most', 'at absolute maximum', 'maximum of'],
    localityType: 'maximum_threshold',
    strength: 0.9,
    description: 'Strong ceiling constraint.',
    examples: ['At the very most, a minor tweak', 'Maximum of two changes'],
  },

  // ── Approximation markers ───────────────────────────────────────────
  {
    canonical: 'about',
    variants: ['about', 'around', 'roughly', 'approximately', 'approx', 'circa', 'more or less'],
    localityType: 'approximation',
    strength: 0.5,
    description: 'Relax precision requirements.',
    examples: ['Make it about 120 BPM', 'Roughly twice as loud', 'Around 4 bars'],
  },
  {
    canonical: 'kind of',
    variants: ['kind of', 'sort of', 'kinda', 'sorta', 'somewhat', 'a bit'],
    localityType: 'approximation',
    strength: 0.3,
    description: 'Soft approximation, vague degree.',
    examples: ['Make it kind of brighter', 'Sort of like the original'],
  },
  {
    canonical: 'ish',
    variants: ['-ish', 'ish'],
    localityType: 'approximation',
    strength: 0.3,
    description: 'Suffix-style approximation marker.',
    examples: ['Make it 120-ish BPM', 'Use a jazz-ish feel'],
  },

  // ── Exclusivity markers ─────────────────────────────────────────────
  {
    canonical: 'exclusively',
    variants: ['exclusively', 'solely', 'purely', 'entirely and only'],
    localityType: 'exclusivity',
    strength: 0.95,
    description: 'Very strict scope restriction.',
    examples: ['Work exclusively on the drums', 'Solely adjust the bass'],
  },
  {
    canonical: 'strictly',
    variants: ['strictly', 'absolutely only', 'literally only'],
    localityType: 'exclusivity',
    strength: 0.95,
    description: 'Emphatic strict scope.',
    examples: ['Strictly the vocal track', 'Absolutely only change the tempo'],
  },

  // ── Emphasis markers ────────────────────────────────────────────────
  {
    canonical: 'especially',
    variants: ['especially', 'particularly', 'in particular', 'notably'],
    localityType: 'emphasis',
    strength: 0.6,
    description: 'Priority bias — this element gets more attention.',
    examples: ['Especially the chorus', 'Particularly the bass line'],
  },
  {
    canonical: 'primarily',
    variants: ['primarily', 'mainly', 'mostly', 'chiefly', 'above all'],
    localityType: 'emphasis',
    strength: 0.7,
    description: 'Focus on this element but don\'t exclude others.',
    examples: ['Primarily fix the drums', 'Mainly work on the verse'],
  },
  {
    canonical: 'focus on',
    variants: ['focus on', 'concentrate on', 'pay attention to', 'prioritize'],
    localityType: 'emphasis',
    strength: 0.75,
    description: 'Explicit focus directive.',
    examples: ['Focus on the low end', 'Concentrate on the vocal mix'],
  },

  // ── Precision markers ──────────────────────────────────────────────
  {
    canonical: 'exactly',
    variants: ['exactly', 'precisely', 'specifically'],
    localityType: 'precision',
    strength: 0.9,
    description: 'Require exact value or target.',
    examples: ['Set it to exactly 128 BPM', 'Precisely at bar 49'],
  },
  {
    canonical: 'literally',
    variants: ['literally'],
    localityType: 'precision',
    strength: 0.85,
    description: 'Emphatic precision (non-figurative reading).',
    examples: ['Literally double the tempo', 'Literally the same pattern'],
  },
  {
    canonical: 'to the',
    variants: ['to the beat', 'to the bar', 'to the note', 'to the dB'],
    localityType: 'precision',
    strength: 0.8,
    description: 'Precision anchored to a specific unit.',
    examples: ['Align it to the beat', 'Cut to the bar'],
  },

  // ── Sufficiency markers ─────────────────────────────────────────────
  {
    canonical: 'enough',
    variants: ['enough', 'sufficient', 'sufficiently', 'adequate', 'adequately'],
    localityType: 'sufficiency',
    strength: 0.5,
    description: 'Satisficing — acceptable level reached.',
    examples: ['That\'s bright enough', 'Add enough reverb', 'Sufficiently wide'],
  },
  {
    canonical: 'just enough',
    variants: ['just enough', 'barely enough', 'just sufficient'],
    localityType: 'sufficiency',
    strength: 0.6,
    description: 'Minimal satisficing — barely adequate.',
    examples: ['Just enough reverb', 'Barely enough bass'],
  },

  // ── Excess markers ──────────────────────────────────────────────────
  {
    canonical: 'too much',
    variants: ['too much', 'too many', 'too', 'overly', 'excessively', 'way too'],
    localityType: 'excess',
    strength: 0.8,
    description: 'Problem signal — current value exceeds desired.',
    examples: ['Too much reverb', 'The bass is too loud', 'Way too much compression'],
  },
  {
    canonical: 'too little',
    variants: ['too little', 'too few', 'not enough', 'insufficient', 'insufficiently'],
    localityType: 'excess',
    strength: 0.8,
    description: 'Problem signal — current value below desired.',
    examples: ['Not enough bass', 'Too little reverb', 'Insufficient warmth'],
  },

  // ── Totality markers ───────────────────────────────────────────────
  {
    canonical: 'completely',
    variants: ['completely', 'entirely', 'totally', 'wholly', 'fully'],
    localityType: 'totality',
    strength: 0.9,
    description: 'Apply to full scope, leave nothing unchanged.',
    examples: ['Completely redo the drums', 'Entirely new melody', 'Totally change the feel'],
  },
  {
    canonical: 'throughout',
    variants: ['throughout', 'all the way through', 'from start to finish', 'across the whole thing'],
    localityType: 'totality',
    strength: 0.85,
    description: 'Apply across full temporal extent.',
    examples: ['Throughout the song', 'All the way through the verse'],
  },
];

// =============================================================================
// LOOKUP INDEX — fast marker lookup by surface form
// =============================================================================

/**
 * Map from lowercase surface form to lexicon entry.
 */
const markerIndex: Map<string, LocalityLexiconEntry> = new Map();

function buildIndex(): void {
  for (const entry of LOCALITY_MARKERS) {
    for (const variant of entry.variants) {
      markerIndex.set(variant.toLowerCase(), entry);
    }
    markerIndex.set(entry.canonical.toLowerCase(), entry);
  }
}

buildIndex();

/**
 * Look up a locality marker by surface form.
 */
export function lookupLocalityMarker(surface: string): LocalityLexiconEntry | undefined {
  return markerIndex.get(surface.toLowerCase());
}

// =============================================================================
// SCAN FUNCTION — find locality markers in token stream
// =============================================================================

/**
 * Result of scanning for locality markers.
 */
export interface LocalityScanResult {
  /** All locality expressions found */
  readonly expressions: readonly EditLocalityExpression[];

  /** Token indices consumed by locality markers */
  readonly consumedIndices: ReadonlySet<number>;

  /** Diagnostics / notes */
  readonly diagnostics: readonly string[];
}

/**
 * A token with its position information.
 */
interface PositionedToken {
  readonly text: string;
  readonly span: Span;
  readonly index: number;
}

/**
 * Scan a token stream for edit locality markers.
 *
 * Handles both single-word markers ("just", "only") and multi-word
 * markers ("at least", "nothing but", "no more than").
 */
export function scanForLocalityMarkers(
  tokens: readonly string[],
  spans: readonly Span[]
): LocalityScanResult {
  const expressions: EditLocalityExpression[] = [];
  const consumedIndices = new Set<number>();
  const diagnostics: string[] = [];

  // Build positioned tokens
  const positioned: PositionedToken[] = tokens.map((text, index) => ({
    text,
    span: spans[index] ?? { start: 0, end: 0 },
    index,
  }));

  // Try multi-word markers first (greedy), then single-word
  let i = 0;
  while (i < positioned.length) {
    const token = positioned[i];
    if (!token) { i++; continue; }

    // Try multi-word lookups (up to 6 tokens)
    let matched = false;
    for (let len = Math.min(6, positioned.length - i); len > 1; len--) {
      const phrase = positioned
        .slice(i, i + len)
        .map(t => t.text)
        .join(' ')
        .toLowerCase();
      const entry = markerIndex.get(phrase);
      if (entry) {
        const lastToken = positioned[i + len - 1];
        if (!lastToken) break;
        const markerSpan: Span = {
          start: token.span.start,
          end: lastToken.span.end,
        };
        const expr = buildLocalityExpression(entry, phrase, markerSpan);
        expressions.push(expr);
        for (let j = i; j < i + len; j++) {
          consumedIndices.add(j);
        }
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Try single-word lookup
      const entry = markerIndex.get(token.text.toLowerCase());
      if (entry) {
        const expr = buildLocalityExpression(entry, token.text, token.span);
        expressions.push(expr);
        consumedIndices.add(i);
      }
      i++;
    }
  }

  if (expressions.length > 1) {
    diagnostics.push(
      `Found ${expressions.length} locality markers — check for interaction effects`
    );
  }

  return { expressions, consumedIndices, diagnostics };
}

// =============================================================================
// BUILDER — construct EditLocalityExpression from lexicon entry
// =============================================================================

/**
 * Build a full EditLocalityExpression from a matched lexicon entry.
 */
function buildLocalityExpression(
  entry: LocalityLexiconEntry,
  surface: string,
  markerSpan: Span
): EditLocalityExpression {
  const marker: LocalityMarker = {
    canonical: entry.canonical,
    surface,
    localityType: entry.localityType,
    strength: entry.strength,
  };

  const costBias = deriveCostBias(entry);
  const scopeEffect = deriveScopeEffect(entry);
  const impliedPreservation = deriveImpliedPreservation(entry);

  return {
    type: entry.localityType,
    marker,
    costBias,
    scopeEffect,
    impliedPreservation,
    markerSpan,
    scopeSpan: null, // Resolved later by the parser when scope is determined
    confidence: computeConfidence(entry),
  };
}

/**
 * Derive cost model bias from a locality entry.
 */
function deriveCostBias(entry: LocalityLexiconEntry): CostBias {
  switch (entry.localityType) {
    case 'restriction':
      return {
        direction: 'minimize',
        magnitude: entry.strength,
        impliesPreserveRest: true,
        threshold: null,
      };
    case 'minimum_threshold':
      return {
        direction: 'constrain',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: { type: 'floor', numericValue: null, qualitativeLevel: null },
      };
    case 'maximum_threshold':
      return {
        direction: 'constrain',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: { type: 'ceiling', numericValue: null, qualitativeLevel: null },
      };
    case 'approximation':
      return {
        direction: 'relax',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: { type: 'approximate', numericValue: null, qualitativeLevel: null },
      };
    case 'exclusivity':
      return {
        direction: 'minimize',
        magnitude: entry.strength,
        impliesPreserveRest: true,
        threshold: null,
      };
    case 'emphasis':
      return {
        direction: 'neutral',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: null,
      };
    case 'precision':
      return {
        direction: 'constrain',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: { type: 'exact', numericValue: null, qualitativeLevel: null },
      };
    case 'sufficiency':
      return {
        direction: 'constrain',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: { type: 'floor', numericValue: null, qualitativeLevel: null },
      };
    case 'excess':
      return {
        direction: 'constrain',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: { type: 'ceiling', numericValue: null, qualitativeLevel: null },
      };
    case 'totality':
      return {
        direction: 'maximize',
        magnitude: entry.strength,
        impliesPreserveRest: false,
        threshold: null,
      };
  }
}

/**
 * Derive scope effect from a locality entry.
 */
function deriveScopeEffect(entry: LocalityLexiconEntry): ScopeEffect {
  switch (entry.localityType) {
    case 'restriction':
      return { modification: 'narrow', exclusive: true, priorityAdjust: 0 };
    case 'exclusivity':
      return { modification: 'lock', exclusive: true, priorityAdjust: 0 };
    case 'emphasis':
      return { modification: 'none', exclusive: false, priorityAdjust: entry.strength };
    case 'totality':
      return { modification: 'widen', exclusive: false, priorityAdjust: 0 };
    case 'precision':
      return { modification: 'lock', exclusive: false, priorityAdjust: 0 };
    case 'approximation':
      return { modification: 'relax', exclusive: false, priorityAdjust: 0 };
    default:
      return { modification: 'none', exclusive: false, priorityAdjust: 0 };
  }
}

/**
 * Derive implied preservation from a locality entry.
 */
function deriveImpliedPreservation(entry: LocalityLexiconEntry): ImpliedPreservation | null {
  switch (entry.localityType) {
    case 'restriction':
      return {
        target: 'everything_else',
        strength: entry.strength >= 0.8 ? 'strong' : 'moderate',
        defeasible: true,
      };
    case 'exclusivity':
      return {
        target: 'everything_else',
        strength: 'strong',
        defeasible: false,
      };
    case 'minimum_threshold':
      return {
        target: 'named_aspects',
        strength: 'moderate',
        defeasible: true,
      };
    default:
      return null;
  }
}

/**
 * Compute confidence in the locality parse.
 */
function computeConfidence(entry: LocalityLexiconEntry): number {
  // Multi-word markers are more confident
  const wordCount = entry.canonical.split(/\s+/).length;
  const baseConfidence = entry.strength;
  return Math.min(1.0, baseConfidence + (wordCount > 1 ? 0.1 : 0));
}

// =============================================================================
// FORMATTING — human-readable descriptions
// =============================================================================

/**
 * Format a locality expression for display.
 */
export function formatLocalityExpression(expr: EditLocalityExpression): string {
  const parts: string[] = [];

  parts.push(`[${expr.type}]`);
  parts.push(`"${expr.marker.surface}"`);

  if (expr.costBias.direction !== 'neutral') {
    parts.push(`→ ${expr.costBias.direction} cost`);
  }

  if (expr.scopeEffect.exclusive) {
    parts.push('(exclusive scope)');
  }

  if (expr.impliedPreservation) {
    parts.push(`(implies preserve ${expr.impliedPreservation.target})`);
  }

  return parts.join(' ');
}

/**
 * Describe the locality effect in natural language.
 */
export function describeLocalityEffect(expr: EditLocalityExpression): string {
  switch (expr.type) {
    case 'restriction':
      return `Scope restricted by "${expr.marker.surface}" — prefer minimal changes, preserve everything not mentioned.`;
    case 'minimum_threshold':
      return `Floor requirement set by "${expr.marker.surface}" — at minimum, this must be done.`;
    case 'maximum_threshold':
      return `Ceiling constraint set by "${expr.marker.surface}" — do not exceed this level of change.`;
    case 'approximation':
      return `Precision relaxed by "${expr.marker.surface}" — approximate values are acceptable.`;
    case 'exclusivity':
      return `Exclusive scope set by "${expr.marker.surface}" — only the named element may be changed.`;
    case 'emphasis':
      return `Priority bias set by "${expr.marker.surface}" — this element gets more attention.`;
    case 'precision':
      return `Exact precision required by "${expr.marker.surface}" — values must match precisely.`;
    case 'sufficiency':
      return `Satisficing level set by "${expr.marker.surface}" — acceptable threshold reached.`;
    case 'excess':
      return `Problem signaled by "${expr.marker.surface}" — current value is outside desired range.`;
    case 'totality':
      return `Full scope set by "${expr.marker.surface}" — change applies everywhere.`;
  }
}

// =============================================================================
// STATISTICS — summary info for dev tooling
// =============================================================================

/**
 * Get statistics about the locality marker lexicon.
 */
export function getLocalityStats(): {
  totalMarkers: number;
  byType: Record<string, number>;
  totalVariants: number;
  averageStrength: number;
} {
  const byType: Record<string, number> = {};
  let totalVariants = 0;
  let totalStrength = 0;

  for (const entry of LOCALITY_MARKERS) {
    byType[entry.localityType] = (byType[entry.localityType] ?? 0) + 1;
    totalVariants += entry.variants.length;
    totalStrength += entry.strength;
  }

  return {
    totalMarkers: LOCALITY_MARKERS.length,
    byType,
    totalVariants,
    averageStrength: totalStrength / LOCALITY_MARKERS.length,
  };
}

// =============================================================================
// GRAMMAR RULES — declarative rule definitions
// =============================================================================

/**
 * A grammar rule for locality parsing.
 */
export interface LocalityRule {
  /** Unique rule identifier */
  readonly id: string;

  /** What this rule matches */
  readonly pattern: string;

  /** What type of locality this produces */
  readonly produces: LocalityType;

  /** Priority (higher = prefer) */
  readonly priority: number;

  /** Description */
  readonly description: string;
}

/**
 * Declarative locality grammar rules.
 */
export const LOCALITY_RULES: readonly LocalityRule[] = [
  {
    id: 'locality:restriction:just_VP',
    pattern: '"just" + VP',
    produces: 'restriction',
    priority: 10,
    description: 'Just + verb phrase → narrow scope, minimize cost',
  },
  {
    id: 'locality:restriction:only_NP',
    pattern: '"only" + NP',
    produces: 'restriction',
    priority: 10,
    description: 'Only + noun phrase → restrict to named target',
  },
  {
    id: 'locality:restriction:only_VP',
    pattern: '"only" + VP',
    produces: 'restriction',
    priority: 10,
    description: 'Only + verb phrase → restrict action',
  },
  {
    id: 'locality:threshold:at_least_VP',
    pattern: '"at least" + VP',
    produces: 'minimum_threshold',
    priority: 10,
    description: 'At least + verb phrase → floor requirement',
  },
  {
    id: 'locality:threshold:at_least_NUM',
    pattern: '"at least" + NUM + UNIT',
    produces: 'minimum_threshold',
    priority: 15,
    description: 'At least + numeric → numeric floor',
  },
  {
    id: 'locality:threshold:at_most_NUM',
    pattern: '"at most" + NUM + UNIT',
    produces: 'maximum_threshold',
    priority: 15,
    description: 'At most + numeric → numeric ceiling',
  },
  {
    id: 'locality:approx:about_NUM',
    pattern: '"about/around/roughly" + NUM + UNIT',
    produces: 'approximation',
    priority: 10,
    description: 'Approximation marker + numeric → relaxed precision',
  },
  {
    id: 'locality:precision:exactly_NUM',
    pattern: '"exactly/precisely" + NUM + UNIT',
    produces: 'precision',
    priority: 15,
    description: 'Precision marker + numeric → exact value required',
  },
  {
    id: 'locality:emphasis:especially_NP',
    pattern: '"especially/particularly" + NP',
    produces: 'emphasis',
    priority: 5,
    description: 'Emphasis marker + noun phrase → priority bias',
  },
  {
    id: 'locality:totality:completely_VP',
    pattern: '"completely/entirely/totally" + VP',
    produces: 'totality',
    priority: 10,
    description: 'Totality marker + verb phrase → full scope',
  },
  {
    id: 'locality:excess:too_ADJ',
    pattern: '"too" + ADJ',
    produces: 'excess',
    priority: 10,
    description: 'Too + adjective → current value excessive',
  },
  {
    id: 'locality:excess:not_enough_NP',
    pattern: '"not enough" + NP',
    produces: 'excess',
    priority: 10,
    description: 'Not enough + noun → current value insufficient',
  },
  {
    id: 'locality:sufficiency:enough_NP',
    pattern: '"enough" + NP / NP + "enough"',
    produces: 'sufficiency',
    priority: 5,
    description: 'Enough + noun or noun + enough → satisficing',
  },
  {
    id: 'locality:exclusivity:exclusively_NP',
    pattern: '"exclusively/solely/purely" + NP',
    produces: 'exclusivity',
    priority: 15,
    description: 'Strong exclusivity marker → strict restriction',
  },
  {
    id: 'locality:restriction:nothing_but_NP',
    pattern: '"nothing but/nothing except" + NP',
    produces: 'restriction',
    priority: 20,
    description: 'Nothing but + noun → extreme restriction',
  },
  {
    id: 'locality:emphasis:focus_on_NP',
    pattern: '"focus on/concentrate on" + NP',
    produces: 'emphasis',
    priority: 10,
    description: 'Focus on + noun → explicit focus directive',
  },
];

// =============================================================================
// INTERACTION ANALYSIS — how locality markers combine
// =============================================================================

/**
 * Analyze interactions between multiple locality markers.
 */
export function analyzeLocalityInteractions(
  expressions: readonly EditLocalityExpression[]
): LocalityInteractionResult {
  const conflicts: string[] = [];
  const reinforcements: string[] = [];

  for (let i = 0; i < expressions.length; i++) {
    for (let j = i + 1; j < expressions.length; j++) {
      const a = expressions[i]!;
      const b = expressions[j]!;

      // Restriction + Totality conflict
      if (
        (a.type === 'restriction' && b.type === 'totality') ||
        (a.type === 'totality' && b.type === 'restriction')
      ) {
        conflicts.push(
          `"${a.marker.surface}" (${a.type}) conflicts with "${b.marker.surface}" (${b.type})`
        );
      }

      // Restriction + Restriction reinforce
      if (a.type === 'restriction' && b.type === 'restriction') {
        reinforcements.push(
          `"${a.marker.surface}" reinforces "${b.marker.surface}" — strongly restricted scope`
        );
      }

      // Min + Max create a range
      if (
        (a.type === 'minimum_threshold' && b.type === 'maximum_threshold') ||
        (a.type === 'maximum_threshold' && b.type === 'minimum_threshold')
      ) {
        reinforcements.push(
          `"${a.marker.surface}" and "${b.marker.surface}" define a range constraint`
        );
      }

      // Precision + Approximation conflict
      if (
        (a.type === 'precision' && b.type === 'approximation') ||
        (a.type === 'approximation' && b.type === 'precision')
      ) {
        conflicts.push(
          `"${a.marker.surface}" (${a.type}) conflicts with "${b.marker.surface}" (${b.type})`
        );
      }
    }
  }

  // Compute combined bias
  const combinedBias = computeCombinedBias(expressions);

  return {
    conflicts,
    reinforcements,
    combinedBias,
    hasConflicts: conflicts.length > 0,
  };
}

/**
 * Result of locality interaction analysis.
 */
export interface LocalityInteractionResult {
  readonly conflicts: readonly string[];
  readonly reinforcements: readonly string[];
  readonly combinedBias: CostBias;
  readonly hasConflicts: boolean;
}

/**
 * Compute the combined cost bias from multiple locality markers.
 */
function computeCombinedBias(expressions: readonly EditLocalityExpression[]): CostBias {
  if (expressions.length === 0) {
    return {
      direction: 'neutral',
      magnitude: 0,
      impliesPreserveRest: false,
      threshold: null,
    };
  }

  if (expressions.length === 1) {
    return expressions[0]!.costBias;
  }

  // Take the strongest direction
  let strongestExpr = expressions[0]!;
  for (const expr of expressions) {
    if (expr.costBias.magnitude > strongestExpr.costBias.magnitude) {
      strongestExpr = expr;
    }
  }

  // Combine preserve implications
  const impliesPreserve = expressions.some(e => e.costBias.impliesPreserveRest);

  return {
    direction: strongestExpr.costBias.direction,
    magnitude: Math.min(1.0, strongestExpr.costBias.magnitude * 1.1),
    impliesPreserveRest: impliesPreserve,
    threshold: strongestExpr.costBias.threshold,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset the locality module state (rebuild index).
 */
export function resetLocalityModule(): void {
  markerIndex.clear();
  buildIndex();
}
