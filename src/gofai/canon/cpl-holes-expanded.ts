/**
 * GOFAI CPL Expanded Hole Types — Explicit Clarification Nodes
 *
 * Extends the base CPLHole from cpl-types.ts with:
 * - Richer hole taxonomy (unknown axis sense, unknown referent, unknown amount,
 *   unknown scope, conflicting constraints, unknown term, ambiguous verb,
 *   ambiguous modifier, ambiguous coordination, ambiguous negation scope)
 * - Typed candidate sets for each hole kind
 * - Candidate scoring with confidence, risk, and reversibility
 * - Candidate evidence (what supports each candidate)
 * - Default selection with justification
 * - Merge and split operations on holes
 * - Hole dependency tracking (resolving one hole may resolve others)
 *
 * @module gofai/canon/cpl-holes-expanded
 */

import type { SemanticVersion } from './versioning';
import type {
  CPLHole,
  CPLHoleOption,
  CPLAmount,
  CPLScope,
} from './cpl-types';


// =============================================================================
// Expanded Hole Kind Taxonomy
// =============================================================================

/**
 * Expanded hole kind discriminator.
 *
 * The base CPLHole has 5 kinds. This extends with additional specific kinds
 * for more precise clarification UX.
 */
export type ExpandedHoleKind =
  // From base CPLHole
  | 'ambiguous-reference'
  | 'missing-scope'
  | 'missing-amount'
  | 'conflicting-constraints'
  | 'unknown-term'
  // New: axis-related ambiguity
  | 'unknown-axis-sense'      // "dark" could mean timbre or brightness
  | 'unknown-axis-direction'  // "change the brightness" — up or down?
  | 'ambiguous-axis-target'   // "make it warmer" — which frequency range?
  // New: referent ambiguity
  | 'unknown-referent'        // "it" — what does "it" refer to?
  | 'ambiguous-entity'        // "the track" — which track?
  | 'ambiguous-section'       // "the chorus" — which chorus (if repeated)?
  // New: amount ambiguity
  | 'unknown-amount'          // "raise the volume" — by how much?
  | 'ambiguous-unit'          // "raise it 3" — 3 what? dB? semitones?
  | 'ambiguous-degree'        // "a lot" — how much is "a lot"?
  // New: scope ambiguity
  | 'unknown-scope'           // no explicit scope mentioned
  | 'ambiguous-scope-extent'  // "in the chorus" — events only, or structure too?
  | 'ambiguous-temporal-scope' // "after the bridge" — from bridge end to song end?
  // New: structural ambiguity
  | 'ambiguous-verb'          // "cut" — delete or reduce?
  | 'ambiguous-modifier'      // "heavy bass" — weight or quantity?
  | 'ambiguous-coordination'  // "A and B" — conjunction or two separate requests?
  | 'ambiguous-negation-scope' // "don't change A or B" — neither, or just not both?
  | 'ambiguous-pp-attachment'  // "add reverb to the vocals in the chorus"
  // New: pragmatic ambiguity
  | 'ambiguous-speech-act'    // "is the tempo 120?" — question or implicit request?
  | 'ambiguous-intent'        // "make it like the intro" — copy or match feel?
  | 'missing-prerequisite';   // references an entity that doesn't exist yet

/**
 * Hole category for grouping related hole kinds.
 */
export type HoleCategory =
  | 'axis'
  | 'referent'
  | 'amount'
  | 'scope'
  | 'structural'
  | 'pragmatic'
  | 'constraint';

/**
 * Map from expanded hole kind to category.
 */
export const HOLE_KIND_CATEGORIES: Readonly<Record<ExpandedHoleKind, HoleCategory>> = {
  // Base kinds
  'ambiguous-reference': 'referent',
  'missing-scope': 'scope',
  'missing-amount': 'amount',
  'conflicting-constraints': 'constraint',
  'unknown-term': 'pragmatic',

  // Axis
  'unknown-axis-sense': 'axis',
  'unknown-axis-direction': 'axis',
  'ambiguous-axis-target': 'axis',

  // Referent
  'unknown-referent': 'referent',
  'ambiguous-entity': 'referent',
  'ambiguous-section': 'referent',

  // Amount
  'unknown-amount': 'amount',
  'ambiguous-unit': 'amount',
  'ambiguous-degree': 'amount',

  // Scope
  'unknown-scope': 'scope',
  'ambiguous-scope-extent': 'scope',
  'ambiguous-temporal-scope': 'scope',

  // Structural
  'ambiguous-verb': 'structural',
  'ambiguous-modifier': 'structural',
  'ambiguous-coordination': 'structural',
  'ambiguous-negation-scope': 'structural',
  'ambiguous-pp-attachment': 'structural',

  // Pragmatic
  'ambiguous-speech-act': 'pragmatic',
  'ambiguous-intent': 'pragmatic',
  'missing-prerequisite': 'pragmatic',
};


// =============================================================================
// Candidate Types
// =============================================================================

/**
 * Evidence supporting a candidate resolution.
 */
export interface CandidateEvidence {
  /** Evidence source */
  readonly source:
    | 'lexical'          // Surface form of the word
    | 'syntactic'        // Parse tree structure
    | 'semantic'         // Semantic composition
    | 'pragmatic'        // Context/history
    | 'domain-default'   // Domain heuristic
    | 'user-preference'  // Learned user preference
    | 'frequency'        // Corpus frequency
    | 'proximity'        // Recency in dialogue
    | 'salience'         // Perceptual salience
    | 'world-knowledge'; // Musical domain knowledge

  /** Human-readable description of the evidence */
  readonly description: string;

  /** Strength of the evidence (0..1) */
  readonly strength: number;

  /** Is this evidence defeasible (can be overridden)? */
  readonly defeasible: boolean;
}

/**
 * Risk assessment for a candidate resolution.
 */
export interface CandidateRisk {
  /** Risk level */
  readonly level: 'safe' | 'low' | 'medium' | 'high' | 'destructive';

  /** What could go wrong if this candidate is wrong */
  readonly consequence: string;

  /** Is this easily reversible if wrong? */
  readonly reversible: boolean;

  /** Estimated cost to undo (ms) */
  readonly undoCostMs: number;
}

/**
 * Musical context for a candidate (what it means musically).
 */
export interface CandidateMusicalContext {
  /** Affected musical parameter/axis */
  readonly axis?: string;

  /** Direction of change */
  readonly direction?: 'increase' | 'decrease' | 'set' | 'toggle';

  /** Affected entities (tracks, sections, etc.) */
  readonly affectedEntities?: readonly string[];

  /** Musical description for the user */
  readonly musicalDescription: string;
}

/**
 * A typed candidate for resolving a hole.
 *
 * Extends CPLHoleOption with richer metadata.
 */
export interface TypedCandidate {
  /** Unique candidate ID within this hole */
  readonly candidateId: string;

  /** Human-readable label */
  readonly label: string;

  /** Detailed description */
  readonly description: string;

  /** Confidence score (0..1) */
  readonly confidence: number;

  /** Evidence supporting this candidate */
  readonly evidence: readonly CandidateEvidence[];

  /** Risk assessment */
  readonly risk: CandidateRisk;

  /** Musical context */
  readonly musicalContext: CandidateMusicalContext;

  /** The CPL node(s) that would be produced if this candidate is selected */
  readonly resolution: CandidateResolution;

  /** Preview description: what would happen if this candidate is chosen */
  readonly previewDescription: string;

  /** Is this the pragmatic default? */
  readonly isPragmaticDefault: boolean;

  /** Is this the safest option? */
  readonly isSafestOption: boolean;
}

/**
 * What a candidate resolves to in CPL terms.
 */
export type CandidateResolution =
  | AxisResolution
  | ReferentResolution
  | AmountResolution
  | ScopeResolution
  | ConstraintResolution
  | VerbResolution
  | GenericResolution;

/**
 * Resolution for axis-related holes.
 */
export interface AxisResolution {
  readonly kind: 'axis';
  /** Resolved axis name */
  readonly axis: string;
  /** Resolved direction */
  readonly direction: 'increase' | 'decrease' | 'set';
  /** Associated levers */
  readonly levers: readonly string[];
}

/**
 * Resolution for referent-related holes.
 */
export interface ReferentResolution {
  readonly kind: 'referent';
  /** Resolved entity type */
  readonly entityType: 'track' | 'section' | 'marker' | 'card' | 'deck' | 'board' | 'event';
  /** Resolved entity ID */
  readonly entityId: string;
  /** Entity name */
  readonly entityName: string;
}

/**
 * Resolution for amount-related holes.
 */
export interface AmountResolution {
  readonly kind: 'amount';
  /** Resolved amount */
  readonly amount: CPLAmount;
  /** Unit interpretation */
  readonly unitInterpretation: string;
}

/**
 * Resolution for scope-related holes.
 */
export interface ScopeResolution {
  readonly kind: 'scope';
  /** Resolved scope */
  readonly scope: CPLScope;
  /** Scope description */
  readonly scopeDescription: string;
}

/**
 * Resolution for constraint-related holes.
 */
export interface ConstraintResolution {
  readonly kind: 'constraint';
  /** How to resolve the conflict */
  readonly strategy: 'keep-first' | 'keep-second' | 'merge' | 'relax' | 'remove';
  /** Affected constraint IDs */
  readonly affectedConstraints: readonly string[];
  /** Resulting constraint (if merge/relax) */
  readonly resultDescription: string;
}

/**
 * Resolution for verb-related holes.
 */
export interface VerbResolution {
  readonly kind: 'verb';
  /** Resolved verb sense */
  readonly verbSense: string;
  /** Resulting goal type */
  readonly goalVariant: 'axis-goal' | 'structural-goal' | 'production-goal';
  /** Opcode family */
  readonly opcodeFamily: string;
}

/**
 * Generic resolution (catch-all).
 */
export interface GenericResolution {
  readonly kind: 'generic';
  /** Free-form resolution value */
  readonly value: unknown;
  /** Description */
  readonly description: string;
}


// =============================================================================
// Expanded Hole Type
// =============================================================================

/**
 * Expanded CPL hole with typed candidate sets.
 *
 * This extends the base CPLHole concept with richer metadata
 * for precise clarification UX.
 */
export interface ExpandedCPLHole {
  /** Unique hole ID */
  readonly id: string;

  /** Expanded hole kind */
  readonly holeKind: ExpandedHoleKind;

  /** Category (derived from kind) */
  readonly category: HoleCategory;

  /** Priority of resolution */
  readonly priority: 'critical' | 'high' | 'medium' | 'low';

  /** The ambiguous span in the original utterance */
  readonly sourceSpan?: readonly [number, number] | undefined;

  /** The ambiguous text */
  readonly sourceText?: string | undefined;

  /** Clarification question for the user */
  readonly question: string;

  /** Why this matters (musical consequence) */
  readonly whyItMatters: string;

  /** Typed candidates for resolution */
  readonly candidates: readonly TypedCandidate[];

  /** Index of the pragmatic default candidate (if any) */
  readonly defaultCandidateIndex: number | null;

  /** Index of the safest candidate */
  readonly safestCandidateIndex: number | null;

  /** Dependencies: other hole IDs that may be resolved if this one is */
  readonly resolvesHoles: readonly string[];

  /** Dependencies: hole IDs that must be resolved before this one */
  readonly dependsOnHoles: readonly string[];

  /** Whether the system can safely proceed with the default */
  readonly canAutoResolve: boolean;

  /** Auto-resolve justification (if canAutoResolve is true) */
  readonly autoResolveJustification?: string | undefined;

  /** Provenance: which compilation stage generated this hole */
  readonly generatedBy:
    | 'tokenizer'
    | 'parser'
    | 'semantic-composer'
    | 'pragmatic-resolver'
    | 'typechecker'
    | 'planner'
    | 'host-compiler';

  /** Schema version */
  readonly schemaVersion: SemanticVersion;
}


// =============================================================================
// Hole Construction Helpers
// =============================================================================

/**
 * Create an unknown-axis-sense hole.
 *
 * Example: "make it darker" — darker in timbre or brightness?
 */
export function createAxisSenseHole(params: {
  readonly id: string;
  readonly sourceText: string;
  readonly sourceSpan?: readonly [number, number];
  readonly candidates: readonly {
    readonly axis: string;
    readonly direction: 'increase' | 'decrease' | 'set';
    readonly levers: readonly string[];
    readonly confidence: number;
    readonly musicalDescription: string;
  }[];
  readonly defaultIndex: number | null;
  readonly schemaVersion: SemanticVersion;
}): ExpandedCPLHole {
  const typedCandidates: TypedCandidate[] = params.candidates.map((c, i) => ({
    candidateId: `${params.id}-c${i}`,
    label: `${c.axis} (${c.direction})`,
    description: c.musicalDescription,
    confidence: c.confidence,
    evidence: [
      {
        source: 'domain-default' as const,
        description: `"${params.sourceText}" commonly maps to ${c.axis}`,
        strength: c.confidence,
        defeasible: true,
      },
    ],
    risk: {
      level: 'low' as const,
      consequence: `Wrong axis interpretation will change the wrong quality`,
      reversible: true,
      undoCostMs: 50,
    },
    musicalContext: {
      axis: c.axis,
      direction: c.direction,
      musicalDescription: c.musicalDescription,
    },
    resolution: {
      kind: 'axis' as const,
      axis: c.axis,
      direction: c.direction,
      levers: c.levers,
    },
    previewDescription: `Interpret "${params.sourceText}" as ${c.direction} ${c.axis}`,
    isPragmaticDefault: params.defaultIndex === i,
    isSafestOption: i === 0, // First candidate is typically safest
  }));

  return {
    id: params.id,
    holeKind: 'unknown-axis-sense',
    category: 'axis',
    priority: 'medium',
    sourceSpan: params.sourceSpan,
    sourceText: params.sourceText,
    question: `What does "${params.sourceText}" mean here?`,
    whyItMatters: `Different interpretations will change different qualities of the sound.`,
    candidates: typedCandidates,
    defaultCandidateIndex: params.defaultIndex,
    safestCandidateIndex: 0,
    resolvesHoles: [],
    dependsOnHoles: [],
    canAutoResolve: params.defaultIndex !== null && (params.candidates[params.defaultIndex]?.confidence ?? 0) > 0.8,
    autoResolveJustification: params.defaultIndex !== null
      ? `High confidence (${params.candidates[params.defaultIndex]?.confidence ?? 0}) for ${params.candidates[params.defaultIndex]?.axis ?? 'unknown'}`
      : undefined,
    generatedBy: 'semantic-composer',
    schemaVersion: params.schemaVersion,
  };
}

/**
 * Create an unknown-referent hole.
 *
 * Example: "make it louder" — what is "it"?
 */
export function createReferentHole(params: {
  readonly id: string;
  readonly pronoun: string;
  readonly sourceSpan?: readonly [number, number];
  readonly candidates: readonly {
    readonly entityType: 'track' | 'section' | 'marker' | 'card' | 'deck' | 'board' | 'event';
    readonly entityId: string;
    readonly entityName: string;
    readonly confidence: number;
    readonly reason: string;
  }[];
  readonly defaultIndex: number | null;
  readonly schemaVersion: SemanticVersion;
}): ExpandedCPLHole {
  const typedCandidates: TypedCandidate[] = params.candidates.map((c, i) => ({
    candidateId: `${params.id}-c${i}`,
    label: c.entityName,
    description: `${c.entityType}: ${c.entityName}`,
    confidence: c.confidence,
    evidence: [
      {
        source: 'pragmatic' as const,
        description: c.reason,
        strength: c.confidence,
        defeasible: true,
      },
    ],
    risk: {
      level: 'medium' as const,
      consequence: `Editing the wrong ${c.entityType}`,
      reversible: true,
      undoCostMs: 100,
    },
    musicalContext: {
      affectedEntities: [c.entityId],
      musicalDescription: `Apply to ${c.entityName} (${c.entityType})`,
    },
    resolution: {
      kind: 'referent' as const,
      entityType: c.entityType,
      entityId: c.entityId,
      entityName: c.entityName,
    },
    previewDescription: `"${params.pronoun}" refers to ${c.entityName}`,
    isPragmaticDefault: params.defaultIndex === i,
    isSafestOption: false,
  }));

  // Safest option is the most recently mentioned entity (highest confidence)
  let safestIndex = 0;
  let maxConfidence = 0;
  for (let i = 0; i < typedCandidates.length; i++) {
    if (typedCandidates[i]!.confidence > maxConfidence) {
      maxConfidence = typedCandidates[i]!.confidence;
      safestIndex = i;
    }
  }

  return {
    id: params.id,
    holeKind: 'unknown-referent',
    category: 'referent',
    priority: 'high',
    sourceSpan: params.sourceSpan,
    sourceText: params.pronoun,
    question: `What does "${params.pronoun}" refer to?`,
    whyItMatters: `The edit will be applied to the wrong target if we misidentify the reference.`,
    candidates: typedCandidates,
    defaultCandidateIndex: params.defaultIndex,
    safestCandidateIndex: safestIndex,
    resolvesHoles: [],
    dependsOnHoles: [],
    canAutoResolve: params.candidates.length === 1,
    autoResolveJustification: params.candidates.length === 1
      ? `Only one possible referent: ${params.candidates[0]?.entityName ?? 'unknown'}`
      : undefined,
    generatedBy: 'pragmatic-resolver',
    schemaVersion: params.schemaVersion,
  };
}

/**
 * Create an unknown-amount hole.
 *
 * Example: "raise the volume" — by how much?
 */
export function createAmountHole(params: {
  readonly id: string;
  readonly verb: string;
  readonly axis: string;
  readonly sourceSpan?: readonly [number, number];
  readonly candidates: readonly {
    readonly amount: CPLAmount;
    readonly unitInterpretation: string;
    readonly confidence: number;
    readonly musicalDescription: string;
  }[];
  readonly defaultIndex: number | null;
  readonly schemaVersion: SemanticVersion;
}): ExpandedCPLHole {
  const typedCandidates: TypedCandidate[] = params.candidates.map((c, i) => ({
    candidateId: `${params.id}-c${i}`,
    label: c.unitInterpretation,
    description: c.musicalDescription,
    confidence: c.confidence,
    evidence: [
      {
        source: 'domain-default' as const,
        description: `Default amount for "${params.verb}" on ${params.axis}`,
        strength: c.confidence,
        defeasible: true,
      },
    ],
    risk: {
      level: c.amount.type === 'qualitative' ? ('low' as const) : ('medium' as const),
      consequence: `Amount may be too much or too little`,
      reversible: true,
      undoCostMs: 30,
    },
    musicalContext: {
      axis: params.axis,
      musicalDescription: c.musicalDescription,
    },
    resolution: {
      kind: 'amount' as const,
      amount: c.amount,
      unitInterpretation: c.unitInterpretation,
    },
    previewDescription: `${params.verb} ${params.axis} by ${c.unitInterpretation}`,
    isPragmaticDefault: params.defaultIndex === i,
    isSafestOption: c.amount.type === 'qualitative',
  }));

  return {
    id: params.id,
    holeKind: 'unknown-amount',
    category: 'amount',
    priority: 'low',
    sourceSpan: params.sourceSpan,
    sourceText: params.verb,
    question: `How much should we ${params.verb} the ${params.axis}?`,
    whyItMatters: `The magnitude of the change affects the musical result.`,
    candidates: typedCandidates,
    defaultCandidateIndex: params.defaultIndex,
    safestCandidateIndex: typedCandidates.findIndex(c => c.isSafestOption),
    resolvesHoles: [],
    dependsOnHoles: [],
    canAutoResolve: params.defaultIndex !== null,
    autoResolveJustification: params.defaultIndex !== null
      ? `Using domain default: ${params.candidates[params.defaultIndex]?.unitInterpretation ?? 'moderate amount'}`
      : undefined,
    generatedBy: 'semantic-composer',
    schemaVersion: params.schemaVersion,
  };
}

/**
 * Create an unknown-scope hole.
 *
 * Example: "make it louder" — the whole song or just the current selection?
 */
export function createScopeHole(params: {
  readonly id: string;
  readonly sourceText: string;
  readonly sourceSpan?: readonly [number, number];
  readonly candidates: readonly {
    readonly scope: CPLScope;
    readonly scopeDescription: string;
    readonly confidence: number;
  }[];
  readonly defaultIndex: number | null;
  readonly schemaVersion: SemanticVersion;
}): ExpandedCPLHole {
  const typedCandidates: TypedCandidate[] = params.candidates.map((c, i) => ({
    candidateId: `${params.id}-c${i}`,
    label: c.scopeDescription,
    description: `Apply to: ${c.scopeDescription}`,
    confidence: c.confidence,
    evidence: [
      {
        source: 'pragmatic' as const,
        description: `Scope inferred from context`,
        strength: c.confidence,
        defeasible: true,
      },
    ],
    risk: {
      level: 'medium' as const,
      consequence: `Edit may affect more or fewer elements than intended`,
      reversible: true,
      undoCostMs: 100,
    },
    musicalContext: {
      musicalDescription: `Scope: ${c.scopeDescription}`,
    },
    resolution: {
      kind: 'scope' as const,
      scope: c.scope,
      scopeDescription: c.scopeDescription,
    },
    previewDescription: `Apply to ${c.scopeDescription}`,
    isPragmaticDefault: params.defaultIndex === i,
    isSafestOption: false, // Will compute below
  }));

  // Safest scope is the most restrictive (smallest)
  const safestIndex = 0; // Assume first candidate is most restrictive

  return {
    id: params.id,
    holeKind: 'unknown-scope',
    category: 'scope',
    priority: 'medium',
    sourceSpan: params.sourceSpan,
    sourceText: params.sourceText,
    question: `What should "${params.sourceText}" apply to?`,
    whyItMatters: `The scope determines which parts of the project are affected.`,
    candidates: typedCandidates,
    defaultCandidateIndex: params.defaultIndex,
    safestCandidateIndex: safestIndex,
    resolvesHoles: [],
    dependsOnHoles: [],
    canAutoResolve: params.candidates.length === 1,
    autoResolveJustification: params.candidates.length === 1
      ? `Only one possible scope: ${params.candidates[0]?.scopeDescription ?? 'unknown'}`
      : undefined,
    generatedBy: 'semantic-composer',
    schemaVersion: params.schemaVersion,
  };
}

/**
 * Create a conflicting-constraints hole.
 *
 * Example: "make it louder but keep the dynamics" — contradiction
 */
export function createConflictingConstraintsHole(params: {
  readonly id: string;
  readonly conflictDescription: string;
  readonly sourceSpan?: readonly [number, number];
  readonly constraint1Id: string;
  readonly constraint1Description: string;
  readonly constraint2Id: string;
  readonly constraint2Description: string;
  readonly resolutions: readonly {
    readonly strategy: 'keep-first' | 'keep-second' | 'merge' | 'relax' | 'remove';
    readonly description: string;
    readonly confidence: number;
    readonly resultDescription: string;
  }[];
  readonly defaultIndex: number | null;
  readonly schemaVersion: SemanticVersion;
}): ExpandedCPLHole {
  const typedCandidates: TypedCandidate[] = params.resolutions.map((r, i) => ({
    candidateId: `${params.id}-c${i}`,
    label: r.strategy,
    description: r.description,
    confidence: r.confidence,
    evidence: [
      {
        source: 'pragmatic' as const,
        description: `Conflict resolution heuristic`,
        strength: r.confidence,
        defeasible: true,
      },
    ],
    risk: {
      level: r.strategy === 'remove' ? ('high' as const) : ('medium' as const),
      consequence: r.resultDescription,
      reversible: true,
      undoCostMs: 50,
    },
    musicalContext: {
      musicalDescription: r.resultDescription,
    },
    resolution: {
      kind: 'constraint' as const,
      strategy: r.strategy,
      affectedConstraints: [params.constraint1Id, params.constraint2Id],
      resultDescription: r.resultDescription,
    },
    previewDescription: r.description,
    isPragmaticDefault: params.defaultIndex === i,
    isSafestOption: r.strategy === 'keep-first' || r.strategy === 'keep-second',
  }));

  return {
    id: params.id,
    holeKind: 'conflicting-constraints',
    category: 'constraint',
    priority: 'high',
    sourceSpan: params.sourceSpan,
    sourceText: params.conflictDescription,
    question: `These requirements seem to conflict: ${params.constraint1Description} vs ${params.constraint2Description}. How should we resolve this?`,
    whyItMatters: `Conflicting constraints cannot both be satisfied; we need to choose or compromise.`,
    candidates: typedCandidates,
    defaultCandidateIndex: params.defaultIndex,
    safestCandidateIndex: typedCandidates.findIndex(c => c.isSafestOption),
    resolvesHoles: [],
    dependsOnHoles: [],
    canAutoResolve: false,
    generatedBy: 'typechecker',
    schemaVersion: params.schemaVersion,
  };
}

/**
 * Create an ambiguous-verb hole.
 *
 * Example: "cut the intro" — delete it or shorten it?
 */
export function createAmbiguousVerbHole(params: {
  readonly id: string;
  readonly verb: string;
  readonly sourceSpan?: readonly [number, number];
  readonly senses: readonly {
    readonly verbSense: string;
    readonly goalVariant: 'axis-goal' | 'structural-goal' | 'production-goal';
    readonly opcodeFamily: string;
    readonly confidence: number;
    readonly musicalDescription: string;
  }[];
  readonly defaultIndex: number | null;
  readonly schemaVersion: SemanticVersion;
}): ExpandedCPLHole {
  const typedCandidates: TypedCandidate[] = params.senses.map((s, i) => ({
    candidateId: `${params.id}-c${i}`,
    label: s.verbSense,
    description: s.musicalDescription,
    confidence: s.confidence,
    evidence: [
      {
        source: 'lexical' as const,
        description: `"${params.verb}" in the sense of "${s.verbSense}"`,
        strength: s.confidence,
        defeasible: true,
      },
    ],
    risk: {
      level: s.goalVariant === 'structural-goal' ? ('high' as const) : ('medium' as const),
      consequence: `Different verb interpretations lead to very different edits`,
      reversible: s.goalVariant !== 'structural-goal',
      undoCostMs: s.goalVariant === 'structural-goal' ? 200 : 50,
    },
    musicalContext: {
      musicalDescription: s.musicalDescription,
    },
    resolution: {
      kind: 'verb' as const,
      verbSense: s.verbSense,
      goalVariant: s.goalVariant,
      opcodeFamily: s.opcodeFamily,
    },
    previewDescription: `"${params.verb}" means: ${s.musicalDescription}`,
    isPragmaticDefault: params.defaultIndex === i,
    isSafestOption: s.goalVariant !== 'structural-goal',
  }));

  return {
    id: params.id,
    holeKind: 'ambiguous-verb',
    category: 'structural',
    priority: 'high',
    sourceSpan: params.sourceSpan,
    sourceText: params.verb,
    question: `What does "${params.verb}" mean here?`,
    whyItMatters: `Different interpretations of "${params.verb}" lead to very different edits.`,
    candidates: typedCandidates,
    defaultCandidateIndex: params.defaultIndex,
    safestCandidateIndex: typedCandidates.findIndex(c => c.isSafestOption),
    resolvesHoles: [],
    dependsOnHoles: [],
    canAutoResolve: params.senses.length === 1,
    autoResolveJustification: params.senses.length === 1
      ? `Only one verb sense available: ${params.senses[0]?.verbSense ?? 'unknown'}`
      : undefined,
    generatedBy: 'semantic-composer',
    schemaVersion: params.schemaVersion,
  };
}


// =============================================================================
// Hole Operations
// =============================================================================

/**
 * Resolve a hole by selecting a candidate.
 *
 * Returns the selected candidate's resolution and updates metadata.
 */
export function resolveHole(
  hole: ExpandedCPLHole,
  candidateIndex: number
): {
  readonly resolution: CandidateResolution;
  readonly resolvedHoleIds: readonly string[];
  readonly wasAutoResolved: boolean;
} {
  if (candidateIndex < 0 || candidateIndex >= hole.candidates.length) {
    throw new Error(
      `Candidate index ${candidateIndex} out of range for hole ${hole.id} ` +
      `(${hole.candidates.length} candidates)`
    );
  }

  const candidate = hole.candidates[candidateIndex]!;

  return {
    resolution: candidate.resolution,
    resolvedHoleIds: [hole.id, ...hole.resolvesHoles],
    wasAutoResolved: hole.canAutoResolve && candidateIndex === hole.defaultCandidateIndex,
  };
}

/**
 * Auto-resolve holes that can be safely auto-resolved.
 *
 * Returns resolutions for holes with canAutoResolve=true.
 */
export function autoResolveHoles(
  holes: readonly ExpandedCPLHole[]
): readonly {
  readonly holeId: string;
  readonly resolution: CandidateResolution;
  readonly justification: string;
}[] {
  const results: {
    readonly holeId: string;
    readonly resolution: CandidateResolution;
    readonly justification: string;
  }[] = [];

  for (const hole of holes) {
    if (hole.canAutoResolve && hole.defaultCandidateIndex !== null) {
      const candidate = hole.candidates[hole.defaultCandidateIndex];
      if (candidate) {
        results.push({
          holeId: hole.id,
          resolution: candidate.resolution,
          justification: hole.autoResolveJustification ?? 'Auto-resolved by default',
        });
      }
    }
  }

  return results;
}

/**
 * Get holes that need manual resolution.
 */
export function getManualHoles(
  holes: readonly ExpandedCPLHole[]
): readonly ExpandedCPLHole[] {
  return holes.filter(h => !h.canAutoResolve);
}

/**
 * Sort holes by resolution priority.
 *
 * Critical holes first, then by dependency order.
 */
export function sortHolesByPriority(
  holes: readonly ExpandedCPLHole[]
): readonly ExpandedCPLHole[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  // Build dependency graph
  const dependsOnMap = new Map<string, readonly string[]>();
  for (const hole of holes) {
    dependsOnMap.set(hole.id, hole.dependsOnHoles);
  }

  // Topological sort with priority as tiebreaker
  const sorted = [...holes];
  sorted.sort((a, b) => {
    // If a depends on b, b comes first
    if (a.dependsOnHoles.includes(b.id)) return 1;
    if (b.dependsOnHoles.includes(a.id)) return -1;

    // Otherwise sort by priority
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return sorted;
}

/**
 * Convert an ExpandedCPLHole back to a base CPLHole for compatibility.
 */
export function toBaseCPLHole(expanded: ExpandedCPLHole): CPLHole {
  // Map expanded kind to base kind
  const baseKindMap: Record<ExpandedHoleKind, CPLHole['holeKind']> = {
    'ambiguous-reference': 'ambiguous-reference',
    'missing-scope': 'missing-scope',
    'missing-amount': 'missing-amount',
    'conflicting-constraints': 'conflicting-constraints',
    'unknown-term': 'unknown-term',
    'unknown-axis-sense': 'ambiguous-reference',
    'unknown-axis-direction': 'missing-amount',
    'ambiguous-axis-target': 'ambiguous-reference',
    'unknown-referent': 'ambiguous-reference',
    'ambiguous-entity': 'ambiguous-reference',
    'ambiguous-section': 'ambiguous-reference',
    'unknown-amount': 'missing-amount',
    'ambiguous-unit': 'missing-amount',
    'ambiguous-degree': 'missing-amount',
    'unknown-scope': 'missing-scope',
    'ambiguous-scope-extent': 'missing-scope',
    'ambiguous-temporal-scope': 'missing-scope',
    'ambiguous-verb': 'unknown-term',
    'ambiguous-modifier': 'unknown-term',
    'ambiguous-coordination': 'unknown-term',
    'ambiguous-negation-scope': 'unknown-term',
    'ambiguous-pp-attachment': 'unknown-term',
    'ambiguous-speech-act': 'unknown-term',
    'ambiguous-intent': 'unknown-term',
    'missing-prerequisite': 'unknown-term',
  };

  const options: CPLHoleOption[] = expanded.candidates.map(c => ({
    id: c.candidateId,
    description: c.description,
    resolution: c.previewDescription,
    confidence: c.confidence,
  }));

  return {
    type: 'hole',
    id: expanded.id,
    holeKind: baseKindMap[expanded.holeKind],
    priority: expanded.priority,
    question: expanded.question,
    options,
    defaultOption: expanded.defaultCandidateIndex ?? undefined,
    provenance: expanded.sourceSpan
      ? { span: expanded.sourceSpan }
      : undefined,
  } as CPLHole;
}

/**
 * Convert a base CPLHole to an ExpandedCPLHole with minimal candidates.
 */
export function fromBaseCPLHole(
  base: CPLHole,
  schemaVersion: SemanticVersion
): ExpandedCPLHole {
  const candidates: TypedCandidate[] = (base.options ?? []).map((opt, i) => ({
    candidateId: opt.id,
    label: opt.description,
    description: opt.description,
    confidence: opt.confidence,
    evidence: [],
    risk: {
      level: 'medium' as const,
      consequence: 'Unknown consequence',
      reversible: true,
      undoCostMs: 100,
    },
    musicalContext: {
      musicalDescription: opt.description,
    },
    resolution: {
      kind: 'generic' as const,
      value: opt.resolution,
      description: opt.description,
    },
    previewDescription: opt.description,
    isPragmaticDefault: base.defaultOption === i,
    isSafestOption: false,
  }));

  return {
    id: base.id,
    holeKind: base.holeKind as ExpandedHoleKind,
    category: HOLE_KIND_CATEGORIES[base.holeKind as ExpandedHoleKind] ?? 'pragmatic',
    priority: base.priority,
    sourceSpan: base.provenance?.span,
    sourceText: undefined,
    question: base.question,
    whyItMatters: 'Resolution needed for correct interpretation.',
    candidates,
    defaultCandidateIndex: base.defaultOption ?? null,
    safestCandidateIndex: 0,
    resolvesHoles: [],
    dependsOnHoles: [],
    canAutoResolve: false,
    generatedBy: 'semantic-composer',
    schemaVersion,
  };
}


// =============================================================================
// Hole Summary and Formatting
// =============================================================================

/**
 * Summary of holes in a CPL document.
 */
export interface HoleSummary {
  readonly totalHoles: number;
  readonly byCategory: Readonly<Record<HoleCategory, number>>;
  readonly byPriority: Readonly<Record<'critical' | 'high' | 'medium' | 'low', number>>;
  readonly autoResolvableCount: number;
  readonly manualCount: number;
  readonly totalCandidates: number;
  readonly averageCandidatesPerHole: number;
}

/**
 * Compute a summary of holes.
 */
export function computeHoleSummary(holes: readonly ExpandedCPLHole[]): HoleSummary {
  const byCategory: Record<HoleCategory, number> = {
    axis: 0,
    referent: 0,
    amount: 0,
    scope: 0,
    structural: 0,
    pragmatic: 0,
    constraint: 0,
  };

  const byPriority: Record<'critical' | 'high' | 'medium' | 'low', number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  let autoResolvable = 0;
  let totalCandidates = 0;

  for (const hole of holes) {
    byCategory[hole.category]++;
    byPriority[hole.priority]++;
    if (hole.canAutoResolve) autoResolvable++;
    totalCandidates += hole.candidates.length;
  }

  return {
    totalHoles: holes.length,
    byCategory,
    byPriority,
    autoResolvableCount: autoResolvable,
    manualCount: holes.length - autoResolvable,
    totalCandidates,
    averageCandidatesPerHole: holes.length > 0
      ? totalCandidates / holes.length
      : 0,
  };
}

/**
 * Format a hole for display in a CLI/debug context.
 */
export function formatExpandedHole(hole: ExpandedCPLHole, indent = 0): string {
  const sp = ' '.repeat(indent);
  const lines: string[] = [];

  lines.push(`${sp}Hole #${hole.id} [${hole.holeKind}] (${hole.priority})`);
  if (hole.sourceText) {
    lines.push(`${sp}  Source: "${hole.sourceText}"`);
  }
  lines.push(`${sp}  Question: ${hole.question}`);
  lines.push(`${sp}  Why it matters: ${hole.whyItMatters}`);
  lines.push(`${sp}  Auto-resolve: ${hole.canAutoResolve}`);
  if (hole.autoResolveJustification) {
    lines.push(`${sp}  Justification: ${hole.autoResolveJustification}`);
  }

  lines.push(`${sp}  Candidates (${hole.candidates.length}):`);
  for (let i = 0; i < hole.candidates.length; i++) {
    const c = hole.candidates[i]!;
    const markers: string[] = [];
    if (i === hole.defaultCandidateIndex) markers.push('DEFAULT');
    if (i === hole.safestCandidateIndex) markers.push('SAFEST');
    const markerStr = markers.length > 0 ? ` [${markers.join(', ')}]` : '';

    lines.push(`${sp}    ${i}: ${c.label} (${(c.confidence * 100).toFixed(0)}%)${markerStr}`);
    lines.push(`${sp}       ${c.previewDescription}`);
    lines.push(`${sp}       Risk: ${c.risk.level}, Reversible: ${c.risk.reversible}`);
  }

  if (hole.dependsOnHoles.length > 0) {
    lines.push(`${sp}  Depends on: [${hole.dependsOnHoles.join(', ')}]`);
  }
  if (hole.resolvesHoles.length > 0) {
    lines.push(`${sp}  Resolves: [${hole.resolvesHoles.join(', ')}]`);
  }

  return lines.join('\n');
}

/**
 * Format a compact one-line summary of a hole.
 */
export function formatHoleCompact(hole: ExpandedCPLHole): string {
  const auto = hole.canAutoResolve ? ' [auto]' : '';
  const candidates = `${hole.candidates.length} candidates`;
  return `[${hole.priority}] ${hole.holeKind}: "${hole.sourceText ?? '?'}" — ${candidates}${auto}`;
}

/**
 * Format all holes as a summary report.
 */
export function formatHoleSummaryReport(holes: readonly ExpandedCPLHole[]): string {
  const summary = computeHoleSummary(holes);
  const lines: string[] = [];

  lines.push(`=== Hole Summary ===`);
  lines.push(`Total: ${summary.totalHoles} holes (${summary.autoResolvableCount} auto-resolvable, ${summary.manualCount} manual)`);
  lines.push(`Avg candidates/hole: ${summary.averageCandidatesPerHole.toFixed(1)}`);
  lines.push('');

  lines.push('By priority:');
  for (const [priority, count] of Object.entries(summary.byPriority)) {
    if (count > 0) lines.push(`  ${priority}: ${count}`);
  }

  lines.push('');
  lines.push('By category:');
  for (const [category, count] of Object.entries(summary.byCategory)) {
    if (count > 0) lines.push(`  ${category}: ${count}`);
  }

  if (holes.length > 0) {
    lines.push('');
    lines.push('--- Holes ---');
    const sorted = sortHolesByPriority(holes);
    for (const hole of sorted) {
      lines.push(formatHoleCompact(hole));
    }
  }

  return lines.join('\n');
}
