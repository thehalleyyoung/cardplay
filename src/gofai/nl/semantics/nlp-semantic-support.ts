/**
 * GOFAI NL Semantics — NLP Semantic Support Features
 *
 * Steps 186–190:
 *   186: Quoted programmatic references ("the track called 'Glass Pad'")
 *   187: Adjectival stacks ("brighter and wider and less busy")
 *   188: Nested scopes ("in the chorus, on the drums, only for two bars")
 *   189: Numeric qualifiers ("raise it 2 semitones", "reduce density by 20%")
 *   190: Range expressions ("bars 33–40", "last 2 bars")
 *
 * @module gofai/nl/semantics/nlp-semantic-support
 */

import type {
  CPLScope,
  CPLGoal,
  CPLAmount,
  CPLSelector,
  CPLTimeRange,
  Provenance,
} from '../../canon/cpl-types';

// =============================================================================
// § 186 — Quoted Programmatic References
// =============================================================================

/**
 * A quoted reference: a literal string name for deterministic binding.
 */
export interface QuotedReference {
  /** The extracted name (without quotes) */
  readonly name: string;
  /** Original text including quotes */
  readonly originalText: string;
  /** Position in source text [start, end] */
  readonly span: readonly [number, number];
  /** What kind of entity this refers to */
  readonly entityType: QuotedRefEntityType;
  /** Quote style used */
  readonly quoteStyle: QuoteStyle;
  /** Whether the binding is deterministic (exact match) */
  readonly deterministic: boolean;
}

/**
 * Entity types that can be quoted-referenced.
 */
export type QuotedRefEntityType =
  | 'track'
  | 'section'
  | 'marker'
  | 'card'
  | 'deck'
  | 'board'
  | 'preset'
  | 'plugin'
  | 'bus'
  | 'send'
  | 'unknown';

/**
 * Quote style used in the reference.
 */
export type QuoteStyle =
  | 'single'   // 'Glass Pad'
  | 'double'   // "Glass Pad"
  | 'backtick' // `Glass Pad`
  | 'guillemet' // «Glass Pad»
  | 'called'   // called Glass Pad
  | 'named';   // named Glass Pad

/**
 * Patterns that introduce quoted references.
 */
export interface QuotedRefPattern {
  /** Pattern ID */
  readonly id: string;
  /** Regex pattern to match */
  readonly pattern: RegExp;
  /** Which capture group contains the name */
  readonly nameGroup: number;
  /** Default entity type for this pattern */
  readonly defaultEntityType: QuotedRefEntityType;
  /** Quote style */
  readonly quoteStyle: QuoteStyle;
  /** Whether binding is always deterministic */
  readonly alwaysDeterministic: boolean;
  /** Example */
  readonly example: string;
}

/**
 * Database of quoted reference patterns.
 */
export const QUOTED_REF_PATTERNS: readonly QuotedRefPattern[] = [
  // Single-quoted: 'Name'
  {
    id: 'qr-single-track',
    pattern: /(?:the\s+)?track\s+(?:called|named)\s+'([^']+)'/gi,
    nameGroup: 1,
    defaultEntityType: 'track',
    quoteStyle: 'single',
    alwaysDeterministic: true,
    example: "the track called 'Glass Pad'",
  },
  {
    id: 'qr-single-section',
    pattern: /(?:the\s+)?section\s+(?:called|named)\s+'([^']+)'/gi,
    nameGroup: 1,
    defaultEntityType: 'section',
    quoteStyle: 'single',
    alwaysDeterministic: true,
    example: "the section called 'Intro Build'",
  },
  {
    id: 'qr-single-marker',
    pattern: /(?:the\s+)?marker\s+(?:called|named)\s+'([^']+)'/gi,
    nameGroup: 1,
    defaultEntityType: 'marker',
    quoteStyle: 'single',
    alwaysDeterministic: true,
    example: "marker called 'Drop Start'",
  },
  {
    id: 'qr-single-card',
    pattern: /(?:the\s+)?card\s+(?:called|named)\s+'([^']+)'/gi,
    nameGroup: 1,
    defaultEntityType: 'card',
    quoteStyle: 'single',
    alwaysDeterministic: true,
    example: "the card called 'Warm Reverb'",
  },
  {
    id: 'qr-single-generic',
    pattern: /'([^']+)'/g,
    nameGroup: 1,
    defaultEntityType: 'unknown',
    quoteStyle: 'single',
    alwaysDeterministic: true,
    example: "'Glass Pad' (any context)",
  },
  // Double-quoted: "Name"
  {
    id: 'qr-double-track',
    pattern: /(?:the\s+)?track\s+(?:called|named)\s+"([^"]+)"/gi,
    nameGroup: 1,
    defaultEntityType: 'track',
    quoteStyle: 'double',
    alwaysDeterministic: true,
    example: 'the track called "Glass Pad"',
  },
  {
    id: 'qr-double-section',
    pattern: /(?:the\s+)?section\s+(?:called|named)\s+"([^"]+)"/gi,
    nameGroup: 1,
    defaultEntityType: 'section',
    quoteStyle: 'double',
    alwaysDeterministic: true,
    example: 'the section named "Chorus A"',
  },
  {
    id: 'qr-double-generic',
    pattern: /"([^"]+)"/g,
    nameGroup: 1,
    defaultEntityType: 'unknown',
    quoteStyle: 'double',
    alwaysDeterministic: true,
    example: '"Glass Pad" (any context)',
  },
  // Backtick: `Name`
  {
    id: 'qr-backtick-generic',
    pattern: /`([^`]+)`/g,
    nameGroup: 1,
    defaultEntityType: 'unknown',
    quoteStyle: 'backtick',
    alwaysDeterministic: true,
    example: '`Glass Pad`',
  },
  // "called/named X" without quotes (less deterministic)
  {
    id: 'qr-called-track',
    pattern: /(?:the\s+)?track\s+called\s+(\S+(?:\s+\S+)?)/gi,
    nameGroup: 1,
    defaultEntityType: 'track',
    quoteStyle: 'called',
    alwaysDeterministic: false,
    example: 'the track called Glass Pad',
  },
  {
    id: 'qr-named-track',
    pattern: /(?:the\s+)?track\s+named\s+(\S+(?:\s+\S+)?)/gi,
    nameGroup: 1,
    defaultEntityType: 'track',
    quoteStyle: 'named',
    alwaysDeterministic: false,
    example: 'the track named Bass',
  },
];

/**
 * Extract quoted references from text.
 */
export function extractQuotedReferences(text: string): readonly QuotedReference[] {
  const results: QuotedReference[] = [];
  const seen = new Set<string>(); // Avoid duplicates by span

  // Try specific patterns first, then generic
  const orderedPatterns = [
    ...QUOTED_REF_PATTERNS.filter(p => p.defaultEntityType !== 'unknown'),
    ...QUOTED_REF_PATTERNS.filter(p => p.defaultEntityType === 'unknown'),
  ];

  for (const pat of orderedPatterns) {
    const regex = new RegExp(pat.pattern.source, pat.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const name = match[pat.nameGroup];
      if (!name) continue;

      const start = match.index;
      const end = start + match[0].length;
      const spanKey = `${start}-${end}`;

      // Skip if we already have a more specific match for this span
      if (seen.has(spanKey)) continue;
      seen.add(spanKey);

      results.push({
        name: name.trim(),
        originalText: match[0],
        span: [start, end],
        entityType: pat.defaultEntityType,
        quoteStyle: pat.quoteStyle,
        deterministic: pat.alwaysDeterministic,
      });
    }
  }

  // Sort by position
  results.sort((a, b) => a.span[0] - b.span[0]);

  return results;
}

/**
 * Convert a quoted reference to a CPL selector.
 */
export function quotedRefToCPLSelector(
  ref: QuotedReference,
  provenance?: Provenance,
): CPLSelector {
  const kindMap: Record<QuotedRefEntityType, CPLSelector['kind']> = {
    'track': 'track',
    'section': 'all', // Sections go through scope, not selector
    'marker': 'all',
    'card': 'card',
    'deck': 'all',
    'board': 'all',
    'preset': 'all',
    'plugin': 'all',
    'bus': 'all',
    'send': 'all',
    'unknown': 'all',
  };

  return Object.assign(
    {
      type: 'selector' as const,
      id: `sel-quoted-${ref.name.replace(/\s/g, '-')}-${Date.now()}`,
      kind: kindMap[ref.entityType],
      value: ref.name,
    },
    provenance ? { provenance } : {},
  ) as CPLSelector;
}

/**
 * Resolve a quoted reference against available entity names.
 */
export interface QuotedRefResolution {
  readonly ref: QuotedReference;
  readonly resolved: boolean;
  readonly matchedEntity?: string;
  readonly matchType: 'exact' | 'case-insensitive' | 'partial' | 'none';
  readonly candidates: readonly string[];
}

/**
 * Resolve a quoted reference against a list of known entity names.
 */
export function resolveQuotedReference(
  ref: QuotedReference,
  knownNames: readonly string[],
): QuotedRefResolution {
  // Exact match
  const exactMatch = knownNames.find(n => n === ref.name);
  if (exactMatch) {
    return { ref, resolved: true, matchedEntity: exactMatch, matchType: 'exact', candidates: [exactMatch] };
  }

  // Case-insensitive match
  const ciMatch = knownNames.find(n => n.toLowerCase() === ref.name.toLowerCase());
  if (ciMatch) {
    return { ref, resolved: true, matchedEntity: ciMatch, matchType: 'case-insensitive', candidates: [ciMatch] };
  }

  // Partial match (name contains the reference)
  const partials = knownNames.filter(n =>
    n.toLowerCase().includes(ref.name.toLowerCase()) ||
    ref.name.toLowerCase().includes(n.toLowerCase()),
  );
  if (partials.length === 1) {
    const pm = partials[0] as string;
    return { ref, resolved: true, matchedEntity: pm, matchType: 'partial', candidates: partials };
  }
  if (partials.length > 1) {
    return { ref, resolved: false, matchType: 'partial', candidates: partials };
  }

  return { ref, resolved: false, matchType: 'none', candidates: [] };
}

// =============================================================================
// § 187 — Adjectival Stacks
// =============================================================================

/**
 * An adjectival stack: multiple adjectives combined with coordination.
 */
export interface AdjectivalStack {
  /** The adjectives in order */
  readonly adjectives: readonly AdjectivalStackEntry[];
  /** Coordination type */
  readonly coordination: AdjectivalCoordination;
  /** Shared scope (if any) */
  readonly sharedScope?: string; // Source text for scope
  /** Source text span */
  readonly span: readonly [number, number];
}

/**
 * Entry in an adjectival stack.
 */
export interface AdjectivalStackEntry {
  /** The adjective word */
  readonly adjective: string;
  /** Polarity modifier ("less", "more", "not") */
  readonly polarity: AdjectivalPolarity;
  /** Degree modifier ("much", "a little", "slightly") */
  readonly degree?: string;
  /** Position in the stack (0-indexed) */
  readonly position: number;
}

export type AdjectivalPolarity =
  | 'positive'   // "brighter"
  | 'negative'   // "less bright"
  | 'comparative' // "more bright"
  | 'superlative' // "brightest"
  | 'negated';    // "not bright"

export type AdjectivalCoordination =
  | 'and'   // "brighter and wider"
  | 'or'    // "brighter or wider"
  | 'but'   // "brighter but not harsh"
  | 'comma'; // "brighter, wider, less busy"

/**
 * Patterns for detecting adjectival stacks.
 */
export const ADJECTIVE_STACK_PATTERNS: readonly {
  readonly id: string;
  readonly pattern: RegExp;
  readonly coordination: AdjectivalCoordination;
  readonly example: string;
}[] = [
  {
    id: 'as-and',
    pattern: /(\w+(?:er|ier))\s+and\s+(\w+(?:er|ier))(?:\s+and\s+(\w+(?:er|ier)))?/gi,
    coordination: 'and',
    example: 'brighter and wider',
  },
  {
    id: 'as-less-and',
    pattern: /(?:less\s+)?(\w+)\s+and\s+(?:less\s+)?(\w+)(?:\s+and\s+(?:less\s+)?(\w+))?/gi,
    coordination: 'and',
    example: 'less bright and less busy',
  },
  {
    id: 'as-comma',
    pattern: /(\w+(?:er|ier)),\s*(\w+(?:er|ier)),?\s*(?:and\s+)?(\w+(?:er|ier))/gi,
    coordination: 'comma',
    example: 'brighter, wider, and punchier',
  },
  {
    id: 'as-but',
    pattern: /(\w+(?:er|ier))\s+but\s+(?:not\s+)?(\w+)/gi,
    coordination: 'but',
    example: 'brighter but not harsh',
  },
  {
    id: 'as-more-and-less',
    pattern: /more\s+(\w+)\s+and\s+less\s+(\w+)/gi,
    coordination: 'and',
    example: 'more punch and less mud',
  },
];

/**
 * Polarity-detecting patterns.
 */
export const POLARITY_PATTERNS: readonly {
  readonly pattern: RegExp;
  readonly polarity: AdjectivalPolarity;
}[] = [
  { pattern: /less\s+(\w+)/i, polarity: 'negative' },
  { pattern: /not\s+(\w+)/i, polarity: 'negated' },
  { pattern: /more\s+(\w+)/i, polarity: 'comparative' },
  { pattern: /(\w+)est\b/i, polarity: 'superlative' },
  { pattern: /(\w+)(?:er|ier)\b/i, polarity: 'comparative' },
];

/**
 * Detect adjectival stacks in text.
 */
export function detectAdjectivalStack(text: string): readonly AdjectivalStack[] {
  const results: AdjectivalStack[] = [];
  const lower = text.toLowerCase();

  for (const pat of ADJECTIVE_STACK_PATTERNS) {
    const regex = new RegExp(pat.pattern.source, pat.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lower)) !== null) {
      const entries: AdjectivalStackEntry[] = [];

      for (let i = 1; i < match.length; i++) {
        const adj = match[i];
        if (!adj) continue;

        const polarity = detectPolarity(adj, lower);
        entries.push({
          adjective: adj.trim(),
          polarity,
          position: entries.length,
        });
      }

      if (entries.length >= 2) {
        results.push({
          adjectives: entries,
          coordination: pat.coordination,
          span: [match.index, match.index + match[0].length],
        });
      }
    }
  }

  return results;
}

/**
 * Detect polarity of an adjective in context.
 */
function detectPolarity(adjective: string, context: string): AdjectivalPolarity {
  const lowerAdj = adjective.toLowerCase();

  // Check context for "less X" or "not X"
  if (context.includes(`less ${lowerAdj}`)) return 'negative';
  if (context.includes(`not ${lowerAdj}`)) return 'negated';
  if (context.includes(`more ${lowerAdj}`)) return 'comparative';

  // Check morphology
  if (lowerAdj.endsWith('est')) return 'superlative';
  if (lowerAdj.endsWith('er') || lowerAdj.endsWith('ier')) return 'comparative';

  return 'positive';
}

/**
 * Convert an adjectival stack to CPL goals with shared scope.
 */
export function adjectivalStackToCPLGoals(
  stack: AdjectivalStack,
  lookupAdjective: (adj: string) => { axis: string; direction: 'increase' | 'decrease' } | undefined,
  options: {
    readonly scope?: CPLScope;
    readonly provenance?: Provenance;
    readonly intensity?: number;
  } = {},
): readonly CPLGoal[] {
  const goals: CPLGoal[] = [];
  const intensity = options.intensity ?? 0.5;

  for (const entry of stack.adjectives) {
    const mapping = lookupAdjective(entry.adjective);
    if (!mapping) continue;

    // Flip direction based on polarity
    let direction = mapping.direction;
    if (entry.polarity === 'negative' || entry.polarity === 'negated') {
      direction = direction === 'increase' ? 'decrease' : 'increase';
    }

    const amount: CPLAmount = {
      type: 'qualitative',
      value: intensity,
      qualifier: entry.polarity === 'superlative' ? 'much'
        : entry.polarity === 'comparative' ? 'somewhat'
        : 'a-little',
    };

    const goal: CPLGoal = Object.assign(
      {
        type: 'goal' as const,
        id: `goal-adjstack-${entry.adjective}-${Date.now()}`,
        variant: 'axis-goal' as const,
      },
      options.provenance ? { provenance: options.provenance } : {},
      {
        axis: mapping.axis,
        direction,
        targetValue: amount,
      },
      options.scope ? { scope: options.scope } : {},
    );
    goals.push(goal);
  }

  return goals;
}

// =============================================================================
// § 188 — Nested Scopes
// =============================================================================

/**
 * A nested scope: multiple scope layers composed together.
 */
export interface NestedScope {
  /** The layers from outermost to innermost */
  readonly layers: readonly ScopeLayer[];
  /** Composition type */
  readonly composition: ScopeCompositionType;
  /** Source text */
  readonly sourceText: string;
}

/**
 * A single scope layer.
 */
export interface ScopeLayer {
  /** Layer type */
  readonly type: ScopeLayerType;
  /** Layer value */
  readonly value: string;
  /** Restriction kind */
  readonly restrictionKind: ScopeRestrictionKind;
  /** Position in nesting (0 = outermost) */
  readonly depth: number;
  /** Source text for this layer */
  readonly sourceText: string;
}

export type ScopeLayerType =
  | 'section'     // "in the chorus"
  | 'entity'      // "on the drums"
  | 'bar-range'   // "bars 4-8"
  | 'time-range'  // "first two bars"
  | 'quantifier'  // "only"
  | 'selection';  // "the selected region"

export type ScopeRestrictionKind =
  | 'inclusive'    // "in the chorus" — includes everything in chorus
  | 'exclusive'    // "only the chorus" — excludes everything else
  | 'temporal'     // "for two bars" — temporal restriction
  | 'entity-filter'; // "on the drums" — entity filter

export type ScopeCompositionType =
  | 'intersection' // All layers must match (most common)
  | 'union'        // Any layer can match
  | 'sequence';    // Layers apply in sequence

/**
 * Patterns for detecting nested scope layers.
 */
export const SCOPE_LAYER_PATTERNS: readonly {
  readonly id: string;
  readonly pattern: RegExp;
  readonly type: ScopeLayerType;
  readonly restrictionKind: ScopeRestrictionKind;
  readonly example: string;
}[] = [
  {
    id: 'sl-in-section',
    pattern: /\bin\s+the\s+(\w+)(?:\s+section)?/gi,
    type: 'section',
    restrictionKind: 'inclusive',
    example: 'in the chorus',
  },
  {
    id: 'sl-during-section',
    pattern: /\bduring\s+the\s+(\w+)/gi,
    type: 'section',
    restrictionKind: 'inclusive',
    example: 'during the verse',
  },
  {
    id: 'sl-on-entity',
    pattern: /\bon\s+the\s+(\w+(?:\s+track)?)/gi,
    type: 'entity',
    restrictionKind: 'entity-filter',
    example: 'on the drums',
  },
  {
    id: 'sl-for-entity',
    pattern: /\bfor\s+the\s+(\w+)/gi,
    type: 'entity',
    restrictionKind: 'entity-filter',
    example: 'for the bass',
  },
  {
    id: 'sl-only-duration',
    pattern: /\bonly\s+(?:for\s+)?(\w+\s+bars?)/gi,
    type: 'time-range',
    restrictionKind: 'exclusive',
    example: 'only for two bars',
  },
  {
    id: 'sl-bars-range',
    pattern: /\bbars?\s+(\d+)\s*[-–to]+\s*(\d+)/gi,
    type: 'bar-range',
    restrictionKind: 'temporal',
    example: 'bars 4-8',
  },
  {
    id: 'sl-first-n-bars',
    pattern: /\b(?:first|last)\s+(\d+)\s+bars?/gi,
    type: 'time-range',
    restrictionKind: 'temporal',
    example: 'first 4 bars',
  },
  {
    id: 'sl-only-entity',
    pattern: /\bonly\s+(?:on\s+)?the\s+(\w+)/gi,
    type: 'entity',
    restrictionKind: 'exclusive',
    example: 'only the drums',
  },
];

/**
 * Detect nested scope layers in text.
 */
export function detectNestedScopes(text: string): NestedScope | undefined {
  const layers: ScopeLayer[] = [];
  const lower = text.toLowerCase();

  for (const pat of SCOPE_LAYER_PATTERNS) {
    const regex = new RegExp(pat.pattern.source, pat.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lower)) !== null) {
      const value = match[1] ?? match[0];
      layers.push({
        type: pat.type,
        value: value.trim(),
        restrictionKind: pat.restrictionKind,
        depth: layers.length,
        sourceText: match[0],
      });
    }
  }

  if (layers.length === 0) return undefined;

  // Sort layers: sections first, then entities, then temporal
  const typeOrder: Record<ScopeLayerType, number> = {
    'section': 0,
    'entity': 1,
    'bar-range': 2,
    'time-range': 3,
    'quantifier': 4,
    'selection': 5,
  };

  layers.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  // Re-number depths
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (layer) {
      layers[i] = { ...layer, depth: i };
    }
  }

  return {
    layers,
    composition: 'intersection',
    sourceText: text,
  };
}

/**
 * Convert a nested scope to a CPL scope.
 */
export function nestedScopeToCPL(
  nested: NestedScope,
  provenance?: Provenance,
): CPLScope {
  const baseScope: CPLScope = Object.assign(
    { type: 'scope' as const, id: `scope-nested-${Date.now()}` },
    provenance ? { provenance } : {},
  ) as CPLScope;

  // Build up scope from innermost to outermost
  let timeRange: CPLTimeRange | undefined;
  let entities: CPLSelector | undefined;
  let exclude: CPLSelector | undefined;

  for (const layer of nested.layers) {
    switch (layer.type) {
      case 'section': {
        timeRange = Object.assign(
          {
            type: 'time-range' as const,
            id: `tr-nested-section-${Date.now()}`,
            sections: [layer.value],
          },
        ) as CPLTimeRange;
        break;
      }
      case 'bar-range': {
        const barMatch = layer.value.match(/(\d+)\s*[-–to]+\s*(\d+)/);
        if (barMatch) {
          const startBar = parseInt(barMatch[1] ?? '1', 10);
          const endBar = parseInt(barMatch[2] ?? '1', 10);
          timeRange = Object.assign(
            {
              type: 'time-range' as const,
              id: `tr-nested-bars-${Date.now()}`,
              bars: [startBar, endBar] as const,
            },
          ) as CPLTimeRange;
        }
        break;
      }
      case 'entity': {
        entities = {
          type: 'selector',
          id: `sel-nested-entity-${Date.now()}`,
          kind: 'track',
          value: layer.value,
        };
        break;
      }
      case 'time-range': {
        // "first/last N bars" — parse
        const numMatch = layer.value.match(/(\d+)/);
        if (numMatch) {
          const n = parseInt(numMatch[1] ?? '1', 10);
          const isFirst = layer.sourceText.includes('first');
          if (isFirst) {
            timeRange = Object.assign(
              {
                type: 'time-range' as const,
                id: `tr-nested-first-${Date.now()}`,
                bars: [1, n] as const,
              },
            ) as CPLTimeRange;
          }
          // "last N bars" needs project context — leave as is
        }
        break;
      }
      case 'quantifier':
      case 'selection':
        break;
    }

    // Handle exclusive restrictions
    if (layer.restrictionKind === 'exclusive' && layer.type === 'entity') {
      exclude = {
        type: 'selector',
        id: `sel-nested-exclude-${Date.now()}`,
        kind: 'all',
        combinator: 'not',
        selectors: entities ? [entities] : [],
      };
    }
  }

  return Object.assign(
    {},
    baseScope,
    timeRange ? { timeRange } : {},
    entities ? { entities } : {},
    exclude ? { exclude } : {},
  );
}

// =============================================================================
// § 189 — Numeric Qualifiers
// =============================================================================

/**
 * A numeric qualifier: "2 semitones", "20%", "3 dB", "120 BPM".
 */
export interface NumericQualifier {
  /** Numeric value */
  readonly value: number;
  /** Unit */
  readonly unit: NumericUnit;
  /** Whether this is relative ("by 2 semitones") or absolute ("to 120 BPM") */
  readonly mode: 'relative' | 'absolute';
  /** Direction (if explicitly stated) */
  readonly direction?: 'increase' | 'decrease';
  /** Source text */
  readonly sourceText: string;
  /** Span in source */
  readonly span: readonly [number, number];
}

/**
 * Supported numeric units.
 */
export type NumericUnit =
  | 'semitones'  // Pitch: "2 semitones"
  | 'cents'      // Pitch: "50 cents"
  | 'octaves'    // Pitch: "1 octave"
  | 'percent'    // Amount: "20%"
  | 'db'         // Volume: "3 dB"
  | 'bpm'        // Tempo: "120 BPM"
  | 'hz'         // Frequency: "440 Hz"
  | 'khz'        // Frequency: "4.5 kHz"
  | 'ms'         // Time: "50 ms"
  | 'seconds'    // Time: "2 seconds"
  | 'bars'       // Duration: "4 bars"
  | 'beats'      // Duration: "2 beats"
  | 'steps'      // Quantize: "16th steps"
  | 'ticks'      // MIDI ticks
  | 'ratio'      // Compression: "4:1"
  | 'none';      // Dimensionless number

/**
 * Patterns for detecting numeric qualifiers.
 */
export const NUMERIC_QUALIFIER_PATTERNS: readonly {
  readonly id: string;
  readonly pattern: RegExp;
  readonly unit: NumericUnit;
  readonly valueGroup: number;
  readonly mode: 'relative' | 'absolute';
  readonly example: string;
}[] = [
  // Semitones
  {
    id: 'nq-semitones',
    pattern: /(\d+(?:\.\d+)?)\s*(?:semi[-\s]?tones?|st)\b/gi,
    unit: 'semitones',
    valueGroup: 1,
    mode: 'relative',
    example: '2 semitones',
  },
  // Cents
  {
    id: 'nq-cents',
    pattern: /(\d+)\s*cents?\b/gi,
    unit: 'cents',
    valueGroup: 1,
    mode: 'relative',
    example: '50 cents',
  },
  // Octaves
  {
    id: 'nq-octaves',
    pattern: /(\d+)\s*octaves?\b/gi,
    unit: 'octaves',
    valueGroup: 1,
    mode: 'relative',
    example: '1 octave',
  },
  // Percentage
  {
    id: 'nq-percent',
    pattern: /(\d+(?:\.\d+)?)\s*%/g,
    unit: 'percent',
    valueGroup: 1,
    mode: 'relative',
    example: '20%',
  },
  // Decibels
  {
    id: 'nq-db',
    pattern: /(\d+(?:\.\d+)?)\s*(?:dB|decibels?)\b/gi,
    unit: 'db',
    valueGroup: 1,
    mode: 'relative',
    example: '3 dB',
  },
  // BPM
  {
    id: 'nq-bpm',
    pattern: /(\d+(?:\.\d+)?)\s*(?:bpm|beats?\s*per\s*min)/gi,
    unit: 'bpm',
    valueGroup: 1,
    mode: 'absolute',
    example: '120 BPM',
  },
  // Hz
  {
    id: 'nq-hz',
    pattern: /(\d+(?:\.\d+)?)\s*(?:Hz|hertz)\b/gi,
    unit: 'hz',
    valueGroup: 1,
    mode: 'absolute',
    example: '440 Hz',
  },
  // kHz
  {
    id: 'nq-khz',
    pattern: /(\d+(?:\.\d+)?)\s*(?:kHz|kilohertz)\b/gi,
    unit: 'khz',
    valueGroup: 1,
    mode: 'absolute',
    example: '4.5 kHz',
  },
  // Milliseconds
  {
    id: 'nq-ms',
    pattern: /(\d+(?:\.\d+)?)\s*(?:ms|milliseconds?)\b/gi,
    unit: 'ms',
    valueGroup: 1,
    mode: 'absolute',
    example: '50 ms',
  },
  // Seconds
  {
    id: 'nq-seconds',
    pattern: /(\d+(?:\.\d+)?)\s*(?:seconds?|secs?)\b/gi,
    unit: 'seconds',
    valueGroup: 1,
    mode: 'absolute',
    example: '2 seconds',
  },
  // Bars
  {
    id: 'nq-bars',
    pattern: /(\d+)\s*bars?\b/gi,
    unit: 'bars',
    valueGroup: 1,
    mode: 'relative',
    example: '4 bars',
  },
  // Beats
  {
    id: 'nq-beats',
    pattern: /(\d+)\s*beats?\b/gi,
    unit: 'beats',
    valueGroup: 1,
    mode: 'relative',
    example: '2 beats',
  },
  // Compression ratio
  {
    id: 'nq-ratio',
    pattern: /(\d+(?:\.\d+)?)\s*:\s*1/g,
    unit: 'ratio',
    valueGroup: 1,
    mode: 'absolute',
    example: '4:1',
  },
];

/**
 * Direction cue patterns.
 */
export const DIRECTION_CUE_PATTERNS: readonly {
  readonly pattern: RegExp;
  readonly direction: 'increase' | 'decrease';
}[] = [
  { pattern: /\braise\b|\bup\b|\bincrease\b|\bboost\b|\badd\b|\braise\b|\bhigher\b/gi, direction: 'increase' },
  { pattern: /\blower\b|\bdown\b|\bdecrease\b|\breduce\b|\bcut\b|\bdrop\b/gi, direction: 'decrease' },
];

/**
 * Extract numeric qualifiers from text.
 */
export function extractNumericQualifiers(text: string): readonly NumericQualifier[] {
  const results: NumericQualifier[] = [];

  // Detect direction from context
  let direction: 'increase' | 'decrease' | undefined;
  for (const dcue of DIRECTION_CUE_PATTERNS) {
    if (dcue.pattern.test(text)) {
      direction = dcue.direction;
      break;
    }
  }

  for (const pat of NUMERIC_QUALIFIER_PATTERNS) {
    const regex = new RegExp(pat.pattern.source, pat.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const valueStr = match[pat.valueGroup];
      if (!valueStr) continue;

      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;

      // Check for "by" prefix → relative
      const contextBefore = text.slice(Math.max(0, match.index - 10), match.index).toLowerCase();
      const mode = contextBefore.includes('by') ? 'relative' as const
        : contextBefore.includes('to') ? 'absolute' as const
        : pat.mode;

      results.push(Object.assign(
        {
          value,
          unit: pat.unit,
          mode,
          sourceText: match[0],
          span: [match.index, match.index + match[0].length] as const,
        },
        direction ? { direction } : {},
      ));
    }
  }

  // Sort by position
  results.sort((a, b) => a.span[0] - b.span[0]);

  return results;
}

/**
 * Convert a numeric qualifier to a CPL amount.
 */
export function numericQualifierToCPLAmount(
  qualifier: NumericQualifier,
): CPLAmount {
  const unitToAmountUnit: Record<NumericUnit, string> = {
    'semitones': 'st',
    'cents': 'cents',
    'octaves': 'oct',
    'percent': '%',
    'db': 'dB',
    'bpm': 'BPM',
    'hz': 'Hz',
    'khz': 'kHz',
    'ms': 'ms',
    'seconds': 's',
    'bars': 'bars',
    'beats': 'beats',
    'steps': 'steps',
    'ticks': 'ticks',
    'ratio': ':1',
    'none': '',
  };

  const amountType = qualifier.mode === 'relative'
    ? (qualifier.unit === 'percent' ? 'percentage' : 'relative')
    : 'absolute';

  return Object.assign(
    {
      type: amountType as CPLAmount['type'],
      value: qualifier.value,
    },
    unitToAmountUnit[qualifier.unit] ? { unit: unitToAmountUnit[qualifier.unit] } : {},
  ) as CPLAmount;
}

// =============================================================================
// § 190 — Range Expressions
// =============================================================================

/**
 * A range expression: "bars 33–40", "last 2 bars", "from marker A to B".
 */
export interface RangeExpression {
  /** Range type */
  readonly type: RangeExpressionType;
  /** Start value */
  readonly start: RangeEndpoint;
  /** End value */
  readonly end: RangeEndpoint;
  /** Inclusivity rules */
  readonly inclusivity: RangeInclusivity;
  /** Source text */
  readonly sourceText: string;
  /** Span in source */
  readonly span: readonly [number, number];
}

export type RangeExpressionType =
  | 'bar-range'      // "bars 33–40"
  | 'beat-range'     // "beats 1-3 of bar 4"
  | 'time-range'     // "0:30 to 1:00"
  | 'section-range'  // "from verse to chorus"
  | 'marker-range'   // "from marker A to marker B"
  | 'relative-range' // "last 2 bars", "next 4 bars"
  | 'ordinal-range'; // "bars 1 through 8"

/**
 * A range endpoint.
 */
export interface RangeEndpoint {
  /** Endpoint type */
  readonly type: 'numeric' | 'named' | 'relative' | 'current';
  /** Numeric value (if numeric) */
  readonly value?: number;
  /** Name (if named) */
  readonly name?: string;
  /** Relative offset (if relative) */
  readonly offset?: number;
  /** Relative direction (if relative) */
  readonly relativeDirection?: 'before' | 'after' | 'from-start' | 'from-end';
}

/**
 * Range inclusivity rules.
 *
 * Musical ranges are typically both-inclusive:
 * "bars 4-8" means bars 4, 5, 6, 7, 8 (inclusive on both ends).
 */
export interface RangeInclusivity {
  /** Start is inclusive */
  readonly startInclusive: boolean;
  /** End is inclusive */
  readonly endInclusive: boolean;
  /** Documentation of the rule */
  readonly rule: string;
}

/**
 * Default range inclusivity for musical contexts.
 *
 * In music, ranges are almost always both-inclusive:
 * - "bars 4-8" includes bars 4, 5, 6, 7, 8
 * - "from verse to chorus" includes both sections
 * - "0:30 to 1:00" includes both timestamps
 */
export const MUSICAL_RANGE_INCLUSIVITY: RangeInclusivity = {
  startInclusive: true,
  endInclusive: true,
  rule: 'Musical ranges are both-inclusive by convention: "bars 4-8" includes bars 4, 5, 6, 7, and 8',
};

/**
 * Programming-style range inclusivity (start-inclusive, end-exclusive).
 */
export const PROGRAMMING_RANGE_INCLUSIVITY: RangeInclusivity = {
  startInclusive: true,
  endInclusive: false,
  rule: 'Programming ranges are start-inclusive, end-exclusive: [4, 8) = 4, 5, 6, 7',
};

/**
 * Patterns for detecting range expressions.
 */
export const RANGE_EXPRESSION_PATTERNS: readonly {
  readonly id: string;
  readonly pattern: RegExp;
  readonly type: RangeExpressionType;
  readonly startGroup: number;
  readonly endGroup: number;
  readonly example: string;
}[] = [
  // "bars 33-40" / "bars 33–40" / "bars 33 to 40"
  {
    id: 're-bars-dash',
    pattern: /bars?\s+(\d+)\s*[-–]\s*(\d+)/gi,
    type: 'bar-range',
    startGroup: 1,
    endGroup: 2,
    example: 'bars 33-40',
  },
  {
    id: 're-bars-to',
    pattern: /bars?\s+(\d+)\s+to\s+(\d+)/gi,
    type: 'bar-range',
    startGroup: 1,
    endGroup: 2,
    example: 'bars 33 to 40',
  },
  {
    id: 're-bars-through',
    pattern: /bars?\s+(\d+)\s+through\s+(\d+)/gi,
    type: 'bar-range',
    startGroup: 1,
    endGroup: 2,
    example: 'bars 1 through 8',
  },
  // "from bar 4 to bar 8"
  {
    id: 're-from-bar-to',
    pattern: /from\s+bar\s+(\d+)\s+to\s+bar\s+(\d+)/gi,
    type: 'bar-range',
    startGroup: 1,
    endGroup: 2,
    example: 'from bar 4 to bar 8',
  },
  // "beats 1-3 of bar 4"
  {
    id: 're-beats-of-bar',
    pattern: /beats?\s+(\d+)\s*[-–]\s*(\d+)\s+(?:of|in)\s+bar\s+\d+/gi,
    type: 'beat-range',
    startGroup: 1,
    endGroup: 2,
    example: 'beats 1-3 of bar 4',
  },
  // Time ranges: "0:30 to 1:00"
  {
    id: 're-time-range',
    pattern: /(\d+:\d{2})\s+to\s+(\d+:\d{2})/gi,
    type: 'time-range',
    startGroup: 1,
    endGroup: 2,
    example: '0:30 to 1:00',
  },
  // Section ranges: "from verse to chorus"
  {
    id: 're-section-range',
    pattern: /from\s+(?:the\s+)?(\w+)\s+to\s+(?:the\s+)?(\w+)/gi,
    type: 'section-range',
    startGroup: 1,
    endGroup: 2,
    example: 'from verse to chorus',
  },
  // Marker ranges: "from marker A to marker B"
  {
    id: 're-marker-range',
    pattern: /from\s+marker\s+(\w+)\s+to\s+marker\s+(\w+)/gi,
    type: 'marker-range',
    startGroup: 1,
    endGroup: 2,
    example: 'from marker A to marker B',
  },
];

/**
 * Relative range patterns: "last 2 bars", "first 4 bars", "next 8 bars".
 */
export const RELATIVE_RANGE_PATTERNS: readonly {
  readonly id: string;
  readonly pattern: RegExp;
  readonly direction: 'from-start' | 'from-end' | 'before' | 'after';
  readonly example: string;
}[] = [
  {
    id: 'rr-last-n',
    pattern: /last\s+(\d+)\s+bars?/gi,
    direction: 'from-end',
    example: 'last 2 bars',
  },
  {
    id: 'rr-first-n',
    pattern: /first\s+(\d+)\s+bars?/gi,
    direction: 'from-start',
    example: 'first 4 bars',
  },
  {
    id: 'rr-next-n',
    pattern: /next\s+(\d+)\s+bars?/gi,
    direction: 'after',
    example: 'next 8 bars',
  },
  {
    id: 'rr-previous-n',
    pattern: /(?:previous|preceding)\s+(\d+)\s+bars?/gi,
    direction: 'before',
    example: 'previous 4 bars',
  },
];

/**
 * Extract range expressions from text.
 */
export function extractRangeExpressions(text: string): readonly RangeExpression[] {
  const results: RangeExpression[] = [];

  // Absolute ranges
  for (const pat of RANGE_EXPRESSION_PATTERNS) {
    const regex = new RegExp(pat.pattern.source, pat.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const startStr = match[pat.startGroup];
      const endStr = match[pat.endGroup];
      if (!startStr || !endStr) continue;

      const startNum = parseFloat(startStr);
      const endNum = parseFloat(endStr);

      const startEndpoint: RangeEndpoint = !isNaN(startNum)
        ? { type: 'numeric', value: startNum }
        : { type: 'named', name: startStr };

      const endEndpoint: RangeEndpoint = !isNaN(endNum)
        ? { type: 'numeric', value: endNum }
        : { type: 'named', name: endStr };

      results.push({
        type: pat.type,
        start: startEndpoint,
        end: endEndpoint,
        inclusivity: MUSICAL_RANGE_INCLUSIVITY,
        sourceText: match[0],
        span: [match.index, match.index + match[0].length],
      });
    }
  }

  // Relative ranges
  for (const pat of RELATIVE_RANGE_PATTERNS) {
    const regex = new RegExp(pat.pattern.source, pat.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const countStr = match[1];
      if (!countStr) continue;
      const count = parseInt(countStr, 10);

      results.push({
        type: 'relative-range',
        start: {
          type: 'relative',
          offset: pat.direction === 'from-end' ? -count : 0,
          relativeDirection: pat.direction,
        },
        end: {
          type: 'relative',
          offset: pat.direction === 'from-start' ? count : 0,
          relativeDirection: pat.direction,
        },
        inclusivity: MUSICAL_RANGE_INCLUSIVITY,
        sourceText: match[0],
        span: [match.index, match.index + match[0].length],
      });
    }
  }

  // Sort by position
  results.sort((a, b) => a.span[0] - b.span[0]);

  return results;
}

/**
 * Convert a range expression to a CPL time range.
 */
export function rangeExpressionToCPLTimeRange(
  range: RangeExpression,
  provenance?: Provenance,
): CPLTimeRange {
  const base = Object.assign(
    { type: 'time-range' as const, id: `tr-range-${range.type}-${Date.now()}` },
    provenance ? { provenance } : {},
  );

  switch (range.type) {
    case 'bar-range':
    case 'ordinal-range': {
      const startBar = range.start.value ?? 1;
      const endBar = range.end.value ?? startBar;
      return Object.assign(base, { bars: [startBar, endBar] as const }) as CPLTimeRange;
    }
    case 'beat-range': {
      const startBeat = range.start.value ?? 1;
      const endBeat = range.end.value ?? startBeat;
      return Object.assign(base, { start: startBeat, end: endBeat }) as CPLTimeRange;
    }
    case 'time-range': {
      // Parse time strings like "0:30" → seconds
      const startSec = range.start.value ?? 0;
      const endSec = range.end.value ?? 0;
      return Object.assign(base, { start: startSec * 1000, end: endSec * 1000 }) as CPLTimeRange;
    }
    case 'section-range': {
      const sections = [
        range.start.name ?? 'unknown',
        range.end.name ?? 'unknown',
      ];
      return Object.assign(base, { sections }) as CPLTimeRange;
    }
    case 'marker-range': {
      const sections = [
        `@marker:${range.start.name ?? ''}`,
        `@marker:${range.end.name ?? ''}`,
      ];
      return Object.assign(base, { sections }) as CPLTimeRange;
    }
    case 'relative-range': {
      // Relative ranges need project context to resolve fully
      // For now, encode the offset information
      const offset = range.start.offset ?? 0;
      const dir = range.start.relativeDirection ?? 'from-start';
      return Object.assign(base, {
        sections: [`@relative:${dir}:${offset}`],
      }) as CPLTimeRange;
    }
  }
}

/**
 * Parse a time string like "1:30" to seconds.
 */
export function parseTimeString(timeStr: string): number | undefined {
  const match = timeStr.match(/^(\d+):(\d{2})(?:\.(\d+))?$/);
  if (!match) return undefined;
  const minutes = parseInt(match[1] ?? '0', 10);
  const seconds = parseInt(match[2] ?? '0', 10);
  const millis = match[3] ? parseInt(match[3], 10) / 1000 : 0;
  return minutes * 60 + seconds + millis;
}

// =============================================================================
// § Formatting
// =============================================================================

/**
 * Format a quoted reference.
 */
export function formatQuotedReference(ref: QuotedReference): string {
  return `QuotedRef: "${ref.name}" [${ref.entityType}] (${ref.quoteStyle}, ${ref.deterministic ? 'deterministic' : 'fuzzy'})`;
}

/**
 * Format an adjectival stack.
 */
export function formatAdjectivalStack(stack: AdjectivalStack): string {
  const adjs = stack.adjectives
    .map(a => `${a.polarity === 'negative' ? 'less ' : a.polarity === 'negated' ? 'not ' : ''}${a.adjective}`)
    .join(` ${stack.coordination} `);
  return `AdjectivalStack: ${adjs}`;
}

/**
 * Format a nested scope.
 */
export function formatNestedScope(nested: NestedScope): string {
  const layers = nested.layers
    .map(l => `  [${l.depth}] ${l.type}: "${l.value}" (${l.restrictionKind})`)
    .join('\n');
  return `NestedScope (${nested.composition}):\n${layers}`;
}

/**
 * Format a numeric qualifier.
 */
export function formatNumericQualifier(nq: NumericQualifier): string {
  const dir = nq.direction ? ` (${nq.direction})` : '';
  return `NumericQualifier: ${nq.value} ${nq.unit} [${nq.mode}]${dir}`;
}

/**
 * Format a range expression.
 */
export function formatRangeExpression(range: RangeExpression): string {
  const start = range.start.value ?? range.start.name ?? `offset:${range.start.offset}`;
  const end = range.end.value ?? range.end.name ?? `offset:${range.end.offset}`;
  const incl = range.inclusivity.startInclusive && range.inclusivity.endInclusive
    ? '[inclusive]'
    : `[${range.inclusivity.startInclusive ? 'inc' : 'exc'}-${range.inclusivity.endInclusive ? 'inc' : 'exc'}]`;
  return `Range: ${range.type} ${start}..${end} ${incl}`;
}
