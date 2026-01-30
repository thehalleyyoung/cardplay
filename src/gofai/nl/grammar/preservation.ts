/**
 * GOFAI NL Grammar — Preservation Constraints
 *
 * Implements grammar rules for explicit preservation expressions that
 * generate CPL preserve constraints:
 *
 * - Direct preservation: "keep the chords", "preserve the melody"
 * - Negative preservation: "don't change the melody", "don't touch the drums"
 * - Conditional preservation: "keep the chords but change the rhythm"
 * - Aspect-specific preservation: "keep the rhythm but change the notes"
 * - Degree-bounded preservation: "keep it mostly the same"
 * - Exception-marked preservation: "keep everything except the bass"
 *
 * ## Preservation vs Negation
 *
 * While negation (Step 114) handles general negation scope, preservation
 * expressions specifically generate CPL `preserve` constraint nodes.
 * The two modules interact: "don't change X" is routed from negation
 * to preservation when the negated verb is an edit action.
 *
 * ## Preservation Targets
 *
 * Preservation can target different aspects of an entity:
 * - **Exact**: preserve all properties (pitch, rhythm, timbre)
 * - **Functional**: preserve functional harmony (exact voicings may change)
 * - **Character**: preserve recognizable identity (details may change)
 * - **Partial**: preserve specific named aspects ("keep the rhythm")
 *
 * @module gofai/nl/grammar/preservation
 * @see gofai_goalA.md Step 125
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// PRESERVATION TYPES
// =============================================================================

/**
 * A preservation expression found in the input.
 */
export interface PreservationExpression {
  /** Type of preservation */
  readonly type: PreservationType;

  /** The verb/phrase that triggers preservation */
  readonly trigger: PreservationTrigger;

  /** What entity or aspect is being preserved */
  readonly target: PreservationTarget;

  /** Fidelity level — how exact the preservation must be */
  readonly fidelity: PreservationFidelity;

  /** Exception clause (if any) */
  readonly exception: PreservationException | null;

  /** Condition under which preservation applies */
  readonly condition: PreservationCondition | null;

  /** Whether this was generated from negation ("don't change") */
  readonly fromNegation: boolean;

  /** Span of the full preservation expression */
  readonly fullSpan: Span;

  /** Span of just the preservation trigger */
  readonly triggerSpan: Span;

  /** Span of the target */
  readonly targetSpan: Span | null;

  /** Confidence in the parse (0-1) */
  readonly confidence: number;
}

/**
 * Types of preservation expressions.
 */
export type PreservationType =
  | 'direct'           // "keep the melody", "preserve the chords"
  | 'negative'         // "don't change the rhythm", "don't touch the drums"
  | 'conditional'      // "keep the chords but change the rhythm"
  | 'aspect_specific'  // "keep the rhythm of the melody"
  | 'degree_bounded'   // "keep it mostly the same"
  | 'exception_marked' // "keep everything except the bass"
  | 'temporal'         // "keep it the same until bar 16"
  | 'comparative';     // "keep it as it is", "leave it alone"

/**
 * The verb/phrase that triggers a preservation reading.
 */
export interface PreservationTrigger {
  /** Canonical form */
  readonly canonical: string;

  /** Matched surface form */
  readonly surface: string;

  /** Category of the trigger */
  readonly category: TriggerCategory;

  /** Whether this is a strong (explicit) or weak (implied) trigger */
  readonly strength: 'strong' | 'moderate' | 'weak';
}

/**
 * Categories of preservation triggers.
 */
export type TriggerCategory =
  | 'keep_verb'        // "keep", "retain", "maintain"
  | 'preserve_verb'    // "preserve", "protect", "safeguard"
  | 'leave_verb'       // "leave", "leave alone", "leave as is"
  | 'negated_change'   // "don't change", "don't modify", "don't alter"
  | 'negated_touch'    // "don't touch", "hands off", "don't mess with"
  | 'negated_remove'   // "don't remove", "don't delete", "don't cut"
  | 'status_quo'       // "as is", "as it is", "the way it is"
  | 'lock_verb';       // "lock", "freeze", "fix in place"

/**
 * What is being preserved.
 */
export interface PreservationTarget {
  /** Type of target reference */
  readonly referenceType: TargetReferenceType;

  /** The textual reference to the target */
  readonly text: string | null;

  /** Specific aspects being preserved (if aspect-specific) */
  readonly aspects: readonly PreservableAspect[];

  /** Whether this targets everything (universal preservation) */
  readonly universal: boolean;
}

/**
 * How the target is referenced.
 */
export type TargetReferenceType =
  | 'explicit_entity'   // "the melody", "the drums"
  | 'pronoun'           // "it", "them", "that"
  | 'demonstrative'     // "this", "these"
  | 'universal'         // "everything", "all"
  | 'unresolved';       // not yet resolved

/**
 * Aspects of an entity that can be independently preserved.
 */
export type PreservableAspect =
  | 'pitch'             // Melodic content
  | 'rhythm'            // Rhythmic pattern
  | 'harmony'           // Chord progression / voicings
  | 'timbre'            // Sound character / instrument
  | 'dynamics'          // Volume / expression
  | 'phrasing'          // Articulation / musical phrasing
  | 'structure'         // Formal structure
  | 'register'          // Pitch range / tessitura
  | 'density'           // Arrangement density
  | 'groove'            // Rhythmic feel
  | 'effects'           // Processing / FX
  | 'mix'               // Mix balance / spatial
  | 'all';              // Everything

/**
 * Fidelity level for preservation.
 */
export interface PreservationFidelity {
  /** How exact the preservation must be */
  readonly level: FidelityLevel;

  /** Degree modifier (if any) */
  readonly degree: string | null;

  /** Tolerance — how much deviation is acceptable */
  readonly tolerance: 'none' | 'minimal' | 'moderate' | 'generous';
}

/**
 * Fidelity levels for preservation.
 */
export type FidelityLevel =
  | 'exact'             // Bit-for-bit identical
  | 'functional'        // Same function/role (details may change)
  | 'character'         // Recognizable identity preserved
  | 'approximate'       // "mostly the same", "similar"
  | 'unspecified';      // User didn't specify

/**
 * An exception to a preservation constraint.
 */
export interface PreservationException {
  /** What is excepted from preservation */
  readonly exceptedElement: string;

  /** Span of the exception clause */
  readonly span: Span;

  /** Exception marker used ("except", "but", "apart from") */
  readonly marker: string;
}

/**
 * A condition on preservation.
 */
export interface PreservationCondition {
  /** Type of condition */
  readonly type: 'temporal' | 'sectional' | 'contingent';

  /** Text of the condition */
  readonly text: string;

  /** Span of the condition */
  readonly span: Span;
}

// =============================================================================
// TRIGGER LEXICON — preservation verb phrases
// =============================================================================

/**
 * Entry in the preservation trigger lexicon.
 */
export interface PreservationTriggerEntry {
  /** Canonical form */
  readonly canonical: string;

  /** Surface variants */
  readonly variants: readonly string[];

  /** Trigger category */
  readonly category: TriggerCategory;

  /** Strength of preservation signal */
  readonly strength: 'strong' | 'moderate' | 'weak';

  /** Default fidelity level */
  readonly defaultFidelity: FidelityLevel;

  /** Description */
  readonly description: string;

  /** Examples */
  readonly examples: readonly string[];
}

/**
 * All recognized preservation triggers.
 */
export const PRESERVATION_TRIGGERS: readonly PreservationTriggerEntry[] = [
  // ── Keep verbs ───────────────────────────────────────────────────────
  {
    canonical: 'keep',
    variants: ['keep', 'keeps', 'keeping', 'kept'],
    category: 'keep_verb',
    strength: 'strong',
    defaultFidelity: 'functional',
    description: 'Direct preservation verb.',
    examples: ['Keep the melody', 'Keep the chords the same', 'Keep it as is'],
  },
  {
    canonical: 'retain',
    variants: ['retain', 'retains', 'retaining', 'retained'],
    category: 'keep_verb',
    strength: 'strong',
    defaultFidelity: 'functional',
    description: 'Formal preservation verb.',
    examples: ['Retain the original rhythm', 'Retain the harmonic structure'],
  },
  {
    canonical: 'maintain',
    variants: ['maintain', 'maintains', 'maintaining', 'maintained'],
    category: 'keep_verb',
    strength: 'strong',
    defaultFidelity: 'functional',
    description: 'Sustained preservation verb.',
    examples: ['Maintain the groove', 'Maintain the overall feel'],
  },
  {
    canonical: 'hold',
    variants: ['hold', 'holds', 'holding', 'held', 'hold on to', 'hold onto'],
    category: 'keep_verb',
    strength: 'moderate',
    defaultFidelity: 'functional',
    description: 'Retention verb.',
    examples: ['Hold the bass note', 'Hold onto the original tempo'],
  },
  {
    canonical: 'save',
    variants: ['save', 'saves', 'saving', 'saved'],
    category: 'keep_verb',
    strength: 'moderate',
    defaultFidelity: 'character',
    description: 'Rescue/preservation verb.',
    examples: ['Save the hook', 'Save the original vibe'],
  },

  // ── Preserve verbs ──────────────────────────────────────────────────
  {
    canonical: 'preserve',
    variants: ['preserve', 'preserves', 'preserving', 'preserved'],
    category: 'preserve_verb',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Strongest explicit preservation verb.',
    examples: ['Preserve the melody exactly', 'Preserve the original arrangement'],
  },
  {
    canonical: 'protect',
    variants: ['protect', 'protects', 'protecting', 'protected'],
    category: 'preserve_verb',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Safety-oriented preservation verb.',
    examples: ['Protect the vocal from changes', 'Protect the hook'],
  },
  {
    canonical: 'safeguard',
    variants: ['safeguard', 'safeguards', 'safeguarding', 'safeguarded'],
    category: 'preserve_verb',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Strong safety-oriented preservation verb.',
    examples: ['Safeguard the original harmony'],
  },

  // ── Leave verbs ─────────────────────────────────────────────────────
  {
    canonical: 'leave',
    variants: ['leave', 'leaves', 'leaving', 'left'],
    category: 'leave_verb',
    strength: 'moderate',
    defaultFidelity: 'exact',
    description: 'Non-intervention preservation verb.',
    examples: ['Leave the drums alone', 'Leave the bass as is'],
  },
  {
    canonical: 'leave alone',
    variants: ['leave alone', 'leave it alone', 'leave them alone', 'leave that alone'],
    category: 'leave_verb',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Emphatic non-intervention.',
    examples: ['Leave the melody alone', 'Leave it alone'],
  },
  {
    canonical: 'leave as is',
    variants: ['leave as is', 'leave as-is', 'leave it as is', 'leave it as-is'],
    category: 'leave_verb',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Status-quo preservation.',
    examples: ['Leave the mix as is', 'Leave the arrangement as-is'],
  },

  // ── Negated change verbs ────────────────────────────────────────────
  {
    canonical: "don't change",
    variants: [
      "don't change", "do not change", "dont change",
      "don't modify", "do not modify",
      "don't alter", "do not alter",
      "don't adjust", "do not adjust",
      "don't edit", "do not edit",
    ],
    category: 'negated_change',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Negated edit action → preservation constraint.',
    examples: ["Don't change the melody", "Do not modify the bass"],
  },

  // ── Negated touch verbs ─────────────────────────────────────────────
  {
    canonical: "don't touch",
    variants: [
      "don't touch", "do not touch", "dont touch",
      "don't mess with", "do not mess with",
      "hands off",
      "don't tamper with",
      "stay away from",
    ],
    category: 'negated_touch',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Strong negated intervention → absolute preservation.',
    examples: ["Don't touch the drums", "Hands off the vocal"],
  },

  // ── Negated remove verbs ────────────────────────────────────────────
  {
    canonical: "don't remove",
    variants: [
      "don't remove", "do not remove",
      "don't delete", "do not delete",
      "don't cut", "do not cut",
      "don't drop", "do not drop",
      "don't take out", "do not take out",
      "don't get rid of",
    ],
    category: 'negated_remove',
    strength: 'strong',
    defaultFidelity: 'functional',
    description: 'Negated removal → presence preservation.',
    examples: ["Don't remove the reverb", "Don't cut the strings"],
  },

  // ── Status quo markers ──────────────────────────────────────────────
  {
    canonical: 'as is',
    variants: ['as is', 'as-is', 'as it is', 'as they are', 'the way it is', 'the way they are'],
    category: 'status_quo',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Explicit status-quo reference.',
    examples: ['Keep it as is', 'Leave everything the way it is'],
  },
  {
    canonical: 'the same',
    variants: ['the same', 'the same as before', 'unchanged', 'untouched', 'intact'],
    category: 'status_quo',
    strength: 'moderate',
    defaultFidelity: 'functional',
    description: 'Sameness marker.',
    examples: ['Keep the melody the same', 'Leave the drums unchanged'],
  },

  // ── Lock verbs ──────────────────────────────────────────────────────
  {
    canonical: 'lock',
    variants: ['lock', 'locks', 'locking', 'locked', 'lock down', 'lock in'],
    category: 'lock_verb',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Absolute preservation verb.',
    examples: ['Lock the melody', 'Lock down the arrangement', 'Lock in the tempo'],
  },
  {
    canonical: 'freeze',
    variants: ['freeze', 'freezes', 'freezing', 'frozen', 'freeze in place'],
    category: 'lock_verb',
    strength: 'strong',
    defaultFidelity: 'exact',
    description: 'Absolute preservation verb.',
    examples: ['Freeze the drums', 'Freeze the harmony in place'],
  },
  {
    canonical: 'fix',
    variants: ['fix', 'fix in place', 'fixed'],
    category: 'lock_verb',
    strength: 'moderate',
    defaultFidelity: 'exact',
    description: 'Stabilization verb (ambiguous with "fix a problem").',
    examples: ['Fix the tempo in place', 'Fix the arrangement'],
  },
];

// =============================================================================
// FIDELITY MODIFIERS — how exact the preservation should be
// =============================================================================

/**
 * Entry in the fidelity modifier lexicon.
 */
export interface FidelityModifierEntry {
  /** Canonical form */
  readonly canonical: string;

  /** Surface variants */
  readonly variants: readonly string[];

  /** Which fidelity level this maps to */
  readonly fidelity: FidelityLevel;

  /** Tolerance */
  readonly tolerance: 'none' | 'minimal' | 'moderate' | 'generous';

  /** Description */
  readonly description: string;
}

/**
 * Fidelity modifier entries that adjust how exact preservation should be.
 */
export const FIDELITY_MODIFIERS: readonly FidelityModifierEntry[] = [
  {
    canonical: 'exactly',
    variants: ['exactly', 'precisely', 'identically', 'perfectly', 'verbatim'],
    fidelity: 'exact',
    tolerance: 'none',
    description: 'Bit-for-bit preservation.',
  },
  {
    canonical: 'basically',
    variants: ['basically', 'essentially', 'fundamentally', 'in essence'],
    fidelity: 'functional',
    tolerance: 'minimal',
    description: 'Functional preservation — core function preserved, details may change.',
  },
  {
    canonical: 'mostly',
    variants: ['mostly', 'largely', 'for the most part', 'more or less', 'pretty much'],
    fidelity: 'approximate',
    tolerance: 'moderate',
    description: 'Approximate preservation — similar but not identical.',
  },
  {
    canonical: 'recognizably',
    variants: ['recognizably', 'noticeably', 'clearly'],
    fidelity: 'character',
    tolerance: 'moderate',
    description: 'Character preservation — still recognizable as the same thing.',
  },
  {
    canonical: 'somewhat',
    variants: ['somewhat', 'sort of', 'kind of', 'roughly'],
    fidelity: 'approximate',
    tolerance: 'generous',
    description: 'Loose preservation — general character kept.',
  },
];

// =============================================================================
// EXCEPTION MARKERS — "except", "but", "apart from"
// =============================================================================

/**
 * Entry in the exception marker lexicon.
 */
export interface ExceptionMarkerEntry {
  /** Canonical form */
  readonly canonical: string;

  /** Surface variants */
  readonly variants: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * Exception markers that carve out elements from preservation.
 */
export const EXCEPTION_MARKERS: readonly ExceptionMarkerEntry[] = [
  {
    canonical: 'except',
    variants: ['except', 'except for', 'excepting', 'with the exception of'],
    description: 'Explicit exception from preservation scope.',
  },
  {
    canonical: 'but',
    variants: ['but', 'but not', 'other than'],
    description: 'Contrastive exception.',
  },
  {
    canonical: 'apart from',
    variants: ['apart from', 'aside from', 'besides', 'save for', 'barring'],
    description: 'Exclusionary exception.',
  },
  {
    canonical: 'not including',
    variants: ['not including', 'not counting', 'excluding', 'without'],
    description: 'Exclusion marker.',
  },
];

// =============================================================================
// LOOKUP INDEX — fast trigger lookup by surface form
// =============================================================================

const triggerIndex: Map<string, PreservationTriggerEntry> = new Map();
const fidelityIndex: Map<string, FidelityModifierEntry> = new Map();
const exceptionIndex: Map<string, ExceptionMarkerEntry> = new Map();

function buildIndices(): void {
  triggerIndex.clear();
  fidelityIndex.clear();
  exceptionIndex.clear();

  for (const entry of PRESERVATION_TRIGGERS) {
    for (const variant of entry.variants) {
      triggerIndex.set(variant.toLowerCase(), entry);
    }
    triggerIndex.set(entry.canonical.toLowerCase(), entry);
  }

  for (const entry of FIDELITY_MODIFIERS) {
    for (const variant of entry.variants) {
      fidelityIndex.set(variant.toLowerCase(), entry);
    }
    fidelityIndex.set(entry.canonical.toLowerCase(), entry);
  }

  for (const entry of EXCEPTION_MARKERS) {
    for (const variant of entry.variants) {
      exceptionIndex.set(variant.toLowerCase(), entry);
    }
    exceptionIndex.set(entry.canonical.toLowerCase(), entry);
  }
}

buildIndices();

/**
 * Look up a preservation trigger by surface form.
 */
export function lookupPreservationTrigger(surface: string): PreservationTriggerEntry | undefined {
  return triggerIndex.get(surface.toLowerCase());
}

/**
 * Look up a fidelity modifier by surface form.
 */
export function lookupFidelityModifier(surface: string): FidelityModifierEntry | undefined {
  return fidelityIndex.get(surface.toLowerCase());
}

/**
 * Look up an exception marker by surface form.
 */
export function lookupExceptionMarker(surface: string): ExceptionMarkerEntry | undefined {
  return exceptionIndex.get(surface.toLowerCase());
}

// =============================================================================
// SCAN FUNCTION — find preservation expressions in token stream
// =============================================================================

/**
 * Result of scanning for preservation expressions.
 */
export interface PreservationScanResult {
  /** All preservation expressions found */
  readonly expressions: readonly PreservationExpression[];

  /** Token indices consumed */
  readonly consumedIndices: ReadonlySet<number>;

  /** Diagnostics */
  readonly diagnostics: readonly string[];
}

/**
 * Scan a token stream for preservation expressions.
 */
export function scanForPreservation(
  tokens: readonly string[],
  spans: readonly Span[]
): PreservationScanResult {
  const expressions: PreservationExpression[] = [];
  const consumedIndices = new Set<number>();
  const diagnostics: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    // Try multi-word triggers first (up to 5 tokens)
    let matched = false;
    for (let len = Math.min(5, tokens.length - i); len > 0; len--) {
      const phrase = tokens
        .slice(i, i + len)
        .join(' ')
        .toLowerCase();
      const triggerEntry = triggerIndex.get(phrase);
      if (triggerEntry) {
        const lastIdx = i + len - 1;
        const startSpan = spans[i] ?? { start: 0, end: 0 };
        const endSpan = spans[lastIdx] ?? { start: 0, end: 0 };
        const triggerSpan: Span = { start: startSpan.start, end: endSpan.end };

        // Look ahead for target and modifiers
        const parseResult = parsePreservationTarget(tokens, spans, i + len);

        const expr = buildPreservationExpression(
          triggerEntry,
          phrase,
          triggerSpan,
          parseResult,
          triggerEntry.category.startsWith('negated')
        );

        expressions.push(expr);
        for (let j = i; j < i + len; j++) {
          consumedIndices.add(j);
        }
        for (const idx of parseResult.consumedIndices) {
          consumedIndices.add(idx);
        }

        i = i + len + parseResult.consumedIndices.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      i++;
    }
  }

  return { expressions, consumedIndices, diagnostics };
}

// =============================================================================
// TARGET PARSER — extract what's being preserved
// =============================================================================

/**
 * Result of parsing a preservation target.
 */
interface TargetParseResult {
  readonly target: PreservationTarget;
  readonly fidelity: PreservationFidelity;
  readonly exception: PreservationException | null;
  readonly targetSpan: Span | null;
  readonly consumedIndices: readonly number[];
}

/**
 * Parse the target of a preservation expression.
 */
function parsePreservationTarget(
  tokens: readonly string[],
  spans: readonly Span[],
  startIdx: number
): TargetParseResult {
  const consumed: number[] = [];
  let fidelityLevel: FidelityLevel = 'unspecified';
  let tolerance: 'none' | 'minimal' | 'moderate' | 'generous' = 'moderate';
  let degreeText: string | null = null;
  let targetText: string | null = null;
  let targetSpan: Span | null = null;
  let referenceType: TargetReferenceType = 'unresolved';
  const aspects: PreservableAspect[] = [];
  let universal = false;
  let exception: PreservationException | null = null;

  let i = startIdx;

  // Check for fidelity modifiers
  if (i < tokens.length) {
    const fidelityEntry = fidelityIndex.get((tokens[i] ?? '').toLowerCase());
    if (fidelityEntry) {
      fidelityLevel = fidelityEntry.fidelity;
      tolerance = fidelityEntry.tolerance;
      degreeText = tokens[i] ?? null;
      consumed.push(i);
      i++;
    }
  }

  // Parse target noun phrase (simplified — collect until exception or end)
  const targetTokens: string[] = [];
  const targetStart = i;

  while (i < tokens.length) {
    const token = (tokens[i] ?? '').toLowerCase();

    // Check for exception markers
    const exceptionEntry = exceptionIndex.get(token);
    if (exceptionEntry) {
      // Multi-word exception check
      let exLen = 1;
      for (let tryLen = Math.min(4, tokens.length - i); tryLen > 1; tryLen--) {
        const exPhrase = tokens.slice(i, i + tryLen).join(' ').toLowerCase();
        if (exceptionIndex.has(exPhrase)) {
          exLen = tryLen;
          break;
        }
      }

      const exMarker = tokens.slice(i, i + exLen).join(' ');
      for (let j = i; j < i + exLen; j++) consumed.push(j);
      i += exLen;

      // Collect excepted element
      const exceptTokens: string[] = [];
      while (i < tokens.length) {
        exceptTokens.push(tokens[i] ?? '');
        consumed.push(i);
        i++;
      }

      if (exceptTokens.length > 0) {
        const exStartSpan = spans[i - exceptTokens.length] ?? { start: 0, end: 0 };
        const exEndSpan = spans[i - 1] ?? { start: 0, end: 0 };
        exception = {
          exceptedElement: exceptTokens.join(' '),
          span: { start: exStartSpan.start, end: exEndSpan.end },
          marker: exMarker,
        };
      }
      break;
    }

    // Check for aspect keywords
    const aspect = tokenToAspect(token);
    if (aspect) {
      aspects.push(aspect);
    }

    // Check for universal markers
    if (['everything', 'all', 'the whole thing', 'it all'].includes(token)) {
      universal = true;
    }

    // Check for pronouns
    if (['it', 'them', 'that', 'those'].includes(token)) {
      referenceType = 'pronoun';
    } else if (['this', 'these'].includes(token)) {
      referenceType = 'demonstrative';
    } else if (['everything', 'all'].includes(token)) {
      referenceType = 'universal';
    }

    targetTokens.push(tokens[i] ?? '');
    consumed.push(i);
    i++;
  }

  if (targetTokens.length > 0) {
    targetText = targetTokens.join(' ');
    const tStart = spans[targetStart] ?? { start: 0, end: 0 };
    const tEnd = spans[targetStart + targetTokens.length - 1] ?? { start: 0, end: 0 };
    targetSpan = { start: tStart.start, end: tEnd.end };

    if (referenceType === 'unresolved' && targetText.trim().length > 0) {
      referenceType = 'explicit_entity';
    }
  }

  if (aspects.length === 0 && !universal) {
    aspects.push('all');
  }

  return {
    target: {
      referenceType,
      text: targetText,
      aspects,
      universal,
    },
    fidelity: {
      level: fidelityLevel,
      degree: degreeText,
      tolerance,
    },
    exception,
    targetSpan,
    consumedIndices: consumed,
  };
}

/**
 * Map a token to a preservable aspect.
 */
function tokenToAspect(token: string): PreservableAspect | null {
  const mapping: Record<string, PreservableAspect> = {
    'melody': 'pitch',
    'pitch': 'pitch',
    'pitches': 'pitch',
    'notes': 'pitch',
    'tune': 'pitch',
    'rhythm': 'rhythm',
    'beat': 'rhythm',
    'timing': 'rhythm',
    'groove': 'groove',
    'feel': 'groove',
    'chords': 'harmony',
    'harmony': 'harmony',
    'progression': 'harmony',
    'voicings': 'harmony',
    'sound': 'timbre',
    'timbre': 'timbre',
    'tone': 'timbre',
    'instrument': 'timbre',
    'dynamics': 'dynamics',
    'volume': 'dynamics',
    'levels': 'dynamics',
    'phrasing': 'phrasing',
    'articulation': 'phrasing',
    'structure': 'structure',
    'form': 'structure',
    'arrangement': 'structure',
    'register': 'register',
    'range': 'register',
    'density': 'density',
    'thickness': 'density',
    'effects': 'effects',
    'reverb': 'effects',
    'delay': 'effects',
    'fx': 'effects',
    'mix': 'mix',
    'balance': 'mix',
    'panning': 'mix',
  };

  return mapping[token] ?? null;
}

// =============================================================================
// BUILDER — construct PreservationExpression
// =============================================================================

/**
 * Build a PreservationExpression from parsed components.
 */
function buildPreservationExpression(
  triggerEntry: PreservationTriggerEntry,
  surface: string,
  triggerSpan: Span,
  parseResult: TargetParseResult,
  fromNegation: boolean
): PreservationExpression {
  const trigger: PreservationTrigger = {
    canonical: triggerEntry.canonical,
    surface,
    category: triggerEntry.category,
    strength: triggerEntry.strength,
  };

  // Determine preservation type
  let type: PreservationType;
  if (fromNegation) {
    type = 'negative';
  } else if (parseResult.exception) {
    type = 'exception_marked';
  } else if (parseResult.target.aspects.length > 0 && !parseResult.target.aspects.includes('all')) {
    type = 'aspect_specific';
  } else if (parseResult.fidelity.level === 'approximate') {
    type = 'degree_bounded';
  } else if (triggerEntry.category === 'status_quo') {
    type = 'comparative';
  } else {
    type = 'direct';
  }

  // Determine fidelity from trigger default if unspecified
  const fidelity: PreservationFidelity = parseResult.fidelity.level === 'unspecified'
    ? { level: triggerEntry.defaultFidelity, degree: null, tolerance: 'moderate' }
    : parseResult.fidelity;

  const fullSpan: Span = {
    start: triggerSpan.start,
    end: parseResult.targetSpan
      ? parseResult.targetSpan.end
      : triggerSpan.end,
  };

  return {
    type,
    trigger,
    target: parseResult.target,
    fidelity,
    exception: parseResult.exception,
    condition: null,
    fromNegation,
    fullSpan,
    triggerSpan,
    targetSpan: parseResult.targetSpan,
    confidence: computePreservationConfidence(triggerEntry, parseResult),
  };
}

/**
 * Compute confidence in the preservation parse.
 */
function computePreservationConfidence(
  trigger: PreservationTriggerEntry,
  parseResult: TargetParseResult
): number {
  let confidence = trigger.strength === 'strong' ? 0.9 : trigger.strength === 'moderate' ? 0.7 : 0.5;

  // Boost for explicit target
  if (parseResult.target.referenceType === 'explicit_entity') {
    confidence = Math.min(1.0, confidence + 0.05);
  }

  // Boost for explicit fidelity
  if (parseResult.fidelity.level !== 'unspecified') {
    confidence = Math.min(1.0, confidence + 0.05);
  }

  return confidence;
}

// =============================================================================
// FORMATTING — human-readable descriptions
// =============================================================================

/**
 * Format a preservation expression for display.
 */
export function formatPreservationExpression(expr: PreservationExpression): string {
  const parts: string[] = [];

  parts.push(`[${expr.type}]`);
  parts.push(`"${expr.trigger.surface}"`);

  if (expr.target.text) {
    parts.push(`→ ${expr.target.text}`);
  }

  if (expr.fidelity.level !== 'unspecified') {
    parts.push(`(${expr.fidelity.level})`);
  }

  if (expr.exception) {
    parts.push(`except: ${expr.exception.exceptedElement}`);
  }

  if (expr.fromNegation) {
    parts.push('[from negation]');
  }

  return parts.join(' ');
}

/**
 * Describe the preservation constraint in natural language.
 */
export function describePreservation(expr: PreservationExpression): string {
  const targetDesc = expr.target.universal
    ? 'everything'
    : expr.target.text ?? 'the specified element';

  const fidelityDesc = expr.fidelity.level === 'exact'
    ? 'exactly as it is'
    : expr.fidelity.level === 'functional'
      ? 'in terms of function and character'
      : expr.fidelity.level === 'character'
        ? 'so it remains recognizable'
        : expr.fidelity.level === 'approximate'
          ? 'mostly the same'
          : '';

  let desc = `Preserve ${targetDesc}`;
  if (fidelityDesc) desc += ` ${fidelityDesc}`;

  if (expr.exception) {
    desc += `, except ${expr.exception.exceptedElement}`;
  }

  return desc + '.';
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the preservation lexicon.
 */
export function getPreservationStats(): {
  totalTriggers: number;
  byCategory: Record<string, number>;
  totalVariants: number;
  totalFidelityModifiers: number;
  totalExceptionMarkers: number;
} {
  const byCategory: Record<string, number> = {};
  let totalVariants = 0;

  for (const entry of PRESERVATION_TRIGGERS) {
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
    totalVariants += entry.variants.length;
  }

  return {
    totalTriggers: PRESERVATION_TRIGGERS.length,
    byCategory,
    totalVariants,
    totalFidelityModifiers: FIDELITY_MODIFIERS.length,
    totalExceptionMarkers: EXCEPTION_MARKERS.length,
  };
}

// =============================================================================
// GRAMMAR RULES — declarative rule definitions
// =============================================================================

/**
 * A grammar rule for preservation parsing.
 */
export interface PreservationRule {
  readonly id: string;
  readonly pattern: string;
  readonly produces: PreservationType;
  readonly priority: number;
  readonly description: string;
}

/**
 * Declarative preservation grammar rules.
 */
export const PRESERVATION_RULES: readonly PreservationRule[] = [
  {
    id: 'preserve:direct:keep_NP',
    pattern: '"keep/retain/maintain" + NP',
    produces: 'direct',
    priority: 10,
    description: 'Keep verb + noun phrase → direct preservation',
  },
  {
    id: 'preserve:direct:preserve_NP',
    pattern: '"preserve/protect" + NP',
    produces: 'direct',
    priority: 15,
    description: 'Preserve verb + noun phrase → strong preservation',
  },
  {
    id: 'preserve:negative:dont_change_NP',
    pattern: '"don\'t change/modify/alter" + NP',
    produces: 'negative',
    priority: 15,
    description: 'Negated change + noun phrase → preservation from negation',
  },
  {
    id: 'preserve:negative:dont_touch_NP',
    pattern: '"don\'t touch/mess with" + NP',
    produces: 'negative',
    priority: 15,
    description: 'Negated touch + noun phrase → absolute preservation',
  },
  {
    id: 'preserve:status_quo:leave_NP_as_is',
    pattern: '"leave" + NP + "as is/alone"',
    produces: 'comparative',
    priority: 10,
    description: 'Leave + NP + status quo → comparative preservation',
  },
  {
    id: 'preserve:exception:keep_all_except_NP',
    pattern: '"keep everything/all" + "except/but" + NP',
    produces: 'exception_marked',
    priority: 20,
    description: 'Universal preservation with exception',
  },
  {
    id: 'preserve:aspect:keep_ASPECT_of_NP',
    pattern: '"keep the" + ASPECT + "of" + NP',
    produces: 'aspect_specific',
    priority: 15,
    description: 'Aspect-specific preservation',
  },
  {
    id: 'preserve:degree:keep_mostly_same',
    pattern: '"keep it" + DEGREE + "the same"',
    produces: 'degree_bounded',
    priority: 10,
    description: 'Degree-bounded preservation',
  },
  {
    id: 'preserve:lock:lock_NP',
    pattern: '"lock/freeze" + NP',
    produces: 'direct',
    priority: 15,
    description: 'Lock verb + noun phrase → exact preservation',
  },
  {
    id: 'preserve:conditional:keep_NP_but_VP',
    pattern: '"keep" + NP + "but" + VP',
    produces: 'conditional',
    priority: 10,
    description: 'Preservation with contrastive change',
  },
  {
    id: 'preserve:temporal:keep_NP_until',
    pattern: '"keep" + NP + "until/before/after" + TIME',
    produces: 'temporal',
    priority: 10,
    description: 'Temporally bounded preservation',
  },
];

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset the preservation module state (rebuild indices).
 */
export function resetPreservationModule(): void {
  buildIndices();
}
