/**
 * GOFAI Pragmatics — Temporal Adverbs and Dialogue State
 *
 * Specifies how temporal adverbs ("now", "then", "before", "after",
 * "first", "next", "later", "already", "still", "yet") interact
 * with dialogue state to determine which edit targets are selected.
 *
 * Temporal adverbs in music editing commands are ambiguous between:
 * - **Musical time**: "before the chorus" = bars before the chorus
 * - **Dialogue time**: "before" = the edit before this one
 * - **Workflow time**: "first" = do this step first in the plan
 *
 * This module defines the disambiguation rules, the temporal
 * reference resolution strategy, and the interaction with the
 * discourse model and plan history.
 *
 * ## Design Principles
 *
 * 1. Musical time is preferred when a scope is present
 * 2. Dialogue time is preferred when referencing prior edits
 * 3. Workflow time is preferred when sequencing operations
 * 4. Ambiguity triggers clarification, not guessing
 * 5. All temporal resolutions are explainable
 *
 * @module gofai/pragmatics/temporal-adverbs
 * @see gofai_goalA.md Step 092
 */

// =============================================================================
// TEMPORAL ADVERB TYPES
// =============================================================================

/**
 * A temporal adverb that appears in a user utterance.
 */
export interface TemporalAdverb {
  /** The canonical form of the adverb */
  readonly canonical: string;

  /** Possible temporal interpretations */
  readonly interpretations: readonly TemporalInterpretation[];

  /** Surface forms (how the user might say it) */
  readonly surfaceForms: readonly string[];

  /** Default interpretation when context is insufficient */
  readonly defaultInterpretation: TemporalDomain;

  /** Whether this adverb is deictic (context-dependent) */
  readonly isDeictic: boolean;

  /** Examples */
  readonly examples: readonly TemporalAdverbExample[];
}

/**
 * A temporal interpretation of an adverb.
 */
export interface TemporalInterpretation {
  /** Which temporal domain */
  readonly domain: TemporalDomain;

  /** What it means in this domain */
  readonly meaning: TemporalMeaning;

  /** Conditions that favor this interpretation */
  readonly conditions: readonly InterpretationCondition[];

  /** Score bonus when conditions are met */
  readonly conditionBonus: number;
}

/**
 * The temporal domain an adverb can refer to.
 */
export type TemporalDomain =
  | 'musical_time'    // Position in the musical timeline (bars, beats)
  | 'dialogue_time'   // Position in the conversation (turns, edits)
  | 'workflow_time'   // Position in the edit plan (steps)
  | 'real_time'       // Actual clock time (rare in editing)
  | 'ambiguous';      // Cannot determine domain

/**
 * What the adverb means within its domain.
 */
export type TemporalMeaning =
  // Musical time
  | { readonly type: 'position'; readonly reference: 'current' | 'start' | 'end' }
  | { readonly type: 'relative'; readonly direction: 'before' | 'after'; readonly distance?: string }
  | { readonly type: 'sequence'; readonly order: 'first' | 'next' | 'last' | 'previous' }
  | { readonly type: 'state'; readonly state: 'ongoing' | 'completed' | 'not_yet' | 'changed' }
  // Dialogue time
  | { readonly type: 'edit_reference'; readonly which: 'last' | 'previous' | 'current' | 'next_planned' }
  // Workflow time
  | { readonly type: 'plan_step'; readonly order: 'first' | 'then' | 'finally' | 'meanwhile' }
  // Duration
  | { readonly type: 'duration'; readonly extent: 'momentary' | 'sustained' | 'permanent' };

/**
 * Conditions that favor a particular interpretation.
 */
export type InterpretationCondition =
  | { readonly kind: 'has_scope'; readonly scopeType: string }
  | { readonly kind: 'references_section' }
  | { readonly kind: 'references_edit' }
  | { readonly kind: 'multi_step_command' }
  | { readonly kind: 'has_plan_history' }
  | { readonly kind: 'is_question' }
  | { readonly kind: 'follows_temporal_clause' }
  | { readonly kind: 'has_selection' }
  | { readonly kind: 'no_context' };

/**
 * Example of a temporal adverb in use.
 */
export interface TemporalAdverbExample {
  /** The utterance */
  readonly utterance: string;
  /** Chosen domain */
  readonly domain: TemporalDomain;
  /** Resolved meaning */
  readonly resolution: string;
  /** Why this interpretation was chosen */
  readonly reasoning: string;
}

// =============================================================================
// CANONICAL TEMPORAL ADVERB TABLE
// =============================================================================

export const TEMPORAL_ADVERBS: readonly TemporalAdverb[] = [
  // === "NOW" ===
  {
    canonical: 'now',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'position', reference: 'current' },
        conditions: [{ kind: 'has_selection' }, { kind: 'has_scope', scopeType: 'section' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'dialogue_time',
        meaning: { type: 'edit_reference', which: 'current' },
        conditions: [{ kind: 'references_edit' }],
        conditionBonus: 0.2,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'first' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.1,
      },
    ],
    surfaceForms: ['now', 'right now', 'at this point', 'here', 'at the moment'],
    defaultInterpretation: 'musical_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'Make it louder now',
        domain: 'workflow_time',
        resolution: 'Apply the change immediately (not after preview)',
        reasoning: '"Now" modifies the application timing, not musical position.',
      },
      {
        utterance: 'The bass is too quiet right now',
        domain: 'musical_time',
        resolution: 'At the current playback position / focused section',
        reasoning: '"Right now" refers to the current musical context in focus.',
      },
    ],
  },

  // === "THEN" ===
  {
    canonical: 'then',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'relative', direction: 'after' },
        conditions: [{ kind: 'references_section' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'dialogue_time',
        meaning: { type: 'edit_reference', which: 'previous' },
        conditions: [{ kind: 'has_plan_history' }],
        conditionBonus: 0.2,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'then' },
        conditions: [{ kind: 'multi_step_command' }, { kind: 'follows_temporal_clause' }],
        conditionBonus: 0.4,
      },
    ],
    surfaceForms: ['then', 'and then', 'after that', 'next', 'subsequently'],
    defaultInterpretation: 'workflow_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'Make the verse louder, then brighten the chorus',
        domain: 'workflow_time',
        resolution: 'Sequence: first make verse louder, then brighten chorus',
        reasoning: '"Then" sequences two operations in workflow time.',
      },
      {
        utterance: 'What was happening then?',
        domain: 'dialogue_time',
        resolution: 'Refers to a previously mentioned point in time',
        reasoning: '"Then" is anaphoric, referring to a prior dialogue referent.',
      },
    ],
  },

  // === "BEFORE" ===
  {
    canonical: 'before',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'relative', direction: 'before' },
        conditions: [{ kind: 'references_section' }, { kind: 'has_scope', scopeType: 'time_range' }],
        conditionBonus: 0.5,
      },
      {
        domain: 'dialogue_time',
        meaning: { type: 'edit_reference', which: 'previous' },
        conditions: [{ kind: 'references_edit' }],
        conditionBonus: 0.2,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'first' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.1,
      },
    ],
    surfaceForms: ['before', 'prior to', 'ahead of', 'preceding', 'leading up to'],
    defaultInterpretation: 'musical_time',
    isDeictic: false,
    examples: [
      {
        utterance: 'Add a riser before the chorus',
        domain: 'musical_time',
        resolution: 'Insert riser in the bars preceding the chorus section',
        reasoning: '"Before the chorus" is clearly a musical time reference.',
      },
      {
        utterance: 'What did it look like before?',
        domain: 'dialogue_time',
        resolution: 'State before the last edit was applied',
        reasoning: '"Before" refers to the state prior to the last change.',
      },
    ],
  },

  // === "AFTER" ===
  {
    canonical: 'after',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'relative', direction: 'after' },
        conditions: [{ kind: 'references_section' }, { kind: 'has_scope', scopeType: 'time_range' }],
        conditionBonus: 0.5,
      },
      {
        domain: 'dialogue_time',
        meaning: { type: 'edit_reference', which: 'next_planned' },
        conditions: [{ kind: 'references_edit' }],
        conditionBonus: 0.2,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'then' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.2,
      },
    ],
    surfaceForms: ['after', 'following', 'past', 'beyond', 'after the'],
    defaultInterpretation: 'musical_time',
    isDeictic: false,
    examples: [
      {
        utterance: 'Add a fill after the bridge',
        domain: 'musical_time',
        resolution: 'Insert fill in the bars following the bridge section',
        reasoning: '"After the bridge" is a clear musical time reference.',
      },
      {
        utterance: 'After you do that, brighten it',
        domain: 'workflow_time',
        resolution: 'Apply brightening after the preceding operation',
        reasoning: '"After you do that" sequences workflow steps.',
      },
    ],
  },

  // === "FIRST" ===
  {
    canonical: 'first',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'sequence', order: 'first' },
        conditions: [{ kind: 'references_section' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'first' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.4,
      },
    ],
    surfaceForms: ['first', 'to start', 'initially', 'to begin with', 'for starters'],
    defaultInterpretation: 'workflow_time',
    isDeictic: false,
    examples: [
      {
        utterance: 'First, make the drums louder',
        domain: 'workflow_time',
        resolution: 'This is step 1 of a multi-step command',
        reasoning: '"First" at the start of a command indicates workflow sequencing.',
      },
      {
        utterance: 'Brighten the first chorus',
        domain: 'musical_time',
        resolution: 'Apply to the first occurrence of the chorus section',
        reasoning: '"First" modifies "chorus" as an ordinal, selecting section instance.',
      },
    ],
  },

  // === "NEXT" ===
  {
    canonical: 'next',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'sequence', order: 'next' },
        conditions: [{ kind: 'has_scope', scopeType: 'section' }, { kind: 'has_selection' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'then' },
        conditions: [{ kind: 'multi_step_command' }, { kind: 'follows_temporal_clause' }],
        conditionBonus: 0.3,
      },
    ],
    surfaceForms: ['next', 'the next', 'following', 'upcoming'],
    defaultInterpretation: 'musical_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'Now do the next section',
        domain: 'musical_time',
        resolution: 'The section following the current focus',
        reasoning: '"Next section" refers to the musical timeline relative to focus.',
      },
    ],
  },

  // === "ALREADY" ===
  {
    canonical: 'already',
    interpretations: [
      {
        domain: 'dialogue_time',
        meaning: { type: 'state', state: 'completed' },
        conditions: [{ kind: 'has_plan_history' }],
        conditionBonus: 0.4,
      },
      {
        domain: 'musical_time',
        meaning: { type: 'state', state: 'ongoing' },
        conditions: [{ kind: 'has_scope', scopeType: 'section' }],
        conditionBonus: 0.2,
      },
    ],
    surfaceForms: ['already', 'already done', 'been done'],
    defaultInterpretation: 'dialogue_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'I already made the verse brighter',
        domain: 'dialogue_time',
        resolution: 'Refers to a prior edit in the plan history',
        reasoning: '"Already" indicates a completed state in dialogue time.',
      },
      {
        utterance: 'It\'s already too loud',
        domain: 'musical_time',
        resolution: 'The current state is "too loud"',
        reasoning: '"Already" refers to the current musical state.',
      },
    ],
  },

  // === "STILL" ===
  {
    canonical: 'still',
    interpretations: [
      {
        domain: 'dialogue_time',
        meaning: { type: 'state', state: 'ongoing' },
        conditions: [{ kind: 'has_plan_history' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'musical_time',
        meaning: { type: 'state', state: 'ongoing' },
        conditions: [],
        conditionBonus: 0.2,
      },
    ],
    surfaceForms: ['still', 'still is', 'continues to be', 'remains'],
    defaultInterpretation: 'dialogue_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'It\'s still too dark',
        domain: 'dialogue_time',
        resolution: 'Despite prior edits, the condition persists',
        reasoning: '"Still" implies a previous attempt was made but the problem remains.',
      },
    ],
  },

  // === "YET" ===
  {
    canonical: 'yet',
    interpretations: [
      {
        domain: 'dialogue_time',
        meaning: { type: 'state', state: 'not_yet' },
        conditions: [{ kind: 'has_plan_history' }],
        conditionBonus: 0.3,
      },
    ],
    surfaceForms: ['yet', 'not yet', 'haven\'t yet', 'still haven\'t'],
    defaultInterpretation: 'dialogue_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'I haven\'t changed the drums yet',
        domain: 'dialogue_time',
        resolution: 'The drums have not been edited in this session',
        reasoning: '"Yet" implies an expected action that hasn\'t happened.',
      },
    ],
  },

  // === "EARLIER" ===
  {
    canonical: 'earlier',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'relative', direction: 'before' },
        conditions: [{ kind: 'references_section' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'dialogue_time',
        meaning: { type: 'edit_reference', which: 'previous' },
        conditions: [{ kind: 'has_plan_history' }],
        conditionBonus: 0.4,
      },
    ],
    surfaceForms: ['earlier', 'previously', 'before this', 'a moment ago'],
    defaultInterpretation: 'dialogue_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'What I did earlier to the verse',
        domain: 'dialogue_time',
        resolution: 'A prior edit that targeted the verse',
        reasoning: '"Earlier" refers to a past point in dialogue time.',
      },
      {
        utterance: 'The motif that appears earlier in the song',
        domain: 'musical_time',
        resolution: 'A motif at a preceding position in the musical timeline',
        reasoning: '"Earlier in the song" is a clear musical time reference.',
      },
    ],
  },

  // === "LATER" ===
  {
    canonical: 'later',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'relative', direction: 'after' },
        conditions: [{ kind: 'references_section' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'then' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.2,
      },
    ],
    surfaceForms: ['later', 'afterwards', 'subsequently', 'later on', 'down the road'],
    defaultInterpretation: 'musical_time',
    isDeictic: false,
    examples: [
      {
        utterance: 'This motif shows up again later',
        domain: 'musical_time',
        resolution: 'The motif recurs at a later point in the song',
        reasoning: '"Later" with a musical subject refers to musical time.',
      },
    ],
  },

  // === "MEANWHILE" ===
  {
    canonical: 'meanwhile',
    interpretations: [
      {
        domain: 'musical_time',
        meaning: { type: 'state', state: 'ongoing' },
        conditions: [{ kind: 'references_section' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'meanwhile' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.4,
      },
    ],
    surfaceForms: ['meanwhile', 'at the same time', 'simultaneously', 'concurrently'],
    defaultInterpretation: 'musical_time',
    isDeictic: false,
    examples: [
      {
        utterance: 'Make the lead brighter, and meanwhile add reverb to the pad',
        domain: 'workflow_time',
        resolution: 'Both operations should be planned and applied together',
        reasoning: '"Meanwhile" indicates parallel plan execution.',
      },
      {
        utterance: 'The bass drops out while the pads come in, meanwhile the melody stays',
        domain: 'musical_time',
        resolution: 'Describes simultaneous musical events',
        reasoning: '"Meanwhile" describes concurrent musical events.',
      },
    ],
  },

  // === "FINALLY" ===
  {
    canonical: 'finally',
    interpretations: [
      {
        domain: 'workflow_time',
        meaning: { type: 'plan_step', order: 'finally' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.5,
      },
      {
        domain: 'musical_time',
        meaning: { type: 'position', reference: 'end' },
        conditions: [{ kind: 'references_section' }],
        conditionBonus: 0.2,
      },
    ],
    surfaceForms: ['finally', 'lastly', 'to finish', 'at the end', 'last but not least'],
    defaultInterpretation: 'workflow_time',
    isDeictic: false,
    examples: [
      {
        utterance: 'Finally, add a fade-out',
        domain: 'workflow_time',
        resolution: 'This is the last step in the multi-step plan',
        reasoning: '"Finally" marks the concluding step of a workflow.',
      },
    ],
  },

  // === "ONCE" ===
  {
    canonical: 'once',
    interpretations: [
      {
        domain: 'workflow_time',
        meaning: { type: 'duration', extent: 'momentary' },
        conditions: [{ kind: 'multi_step_command' }],
        conditionBonus: 0.3,
      },
      {
        domain: 'musical_time',
        meaning: { type: 'sequence', order: 'first' },
        conditions: [{ kind: 'references_section' }],
        conditionBonus: 0.2,
      },
    ],
    surfaceForms: ['once', 'one time', 'a single time'],
    defaultInterpretation: 'workflow_time',
    isDeictic: false,
    examples: [
      {
        utterance: 'Once you\'ve brightened the verse, move to the chorus',
        domain: 'workflow_time',
        resolution: 'After the verse brightening is complete, switch focus to chorus',
        reasoning: '"Once" as a temporal conjunction creates a workflow dependency.',
      },
    ],
  },

  // === "AGAIN" ===
  {
    canonical: 'again',
    interpretations: [
      {
        domain: 'dialogue_time',
        meaning: { type: 'edit_reference', which: 'last' },
        conditions: [{ kind: 'has_plan_history' }],
        conditionBonus: 0.5,
      },
      {
        domain: 'musical_time',
        meaning: { type: 'state', state: 'changed' },
        conditions: [],
        conditionBonus: 0.1,
      },
    ],
    surfaceForms: ['again', 'once more', 'one more time', 'repeat', 'do it again'],
    defaultInterpretation: 'dialogue_time',
    isDeictic: true,
    examples: [
      {
        utterance: 'Do it again',
        domain: 'dialogue_time',
        resolution: 'Repeat the most recent edit plan',
        reasoning: '"Again" refers to the last executed plan in plan history.',
      },
      {
        utterance: 'Do it again but bigger',
        domain: 'dialogue_time',
        resolution: 'Repeat the last plan with increased magnitude',
        reasoning: '"Again but bigger" triggers plan reuse with scale modification.',
      },
    ],
  },
];

// =============================================================================
// LOOKUP AND RESOLUTION
// =============================================================================

const _adverbByCanonical = new Map<string, TemporalAdverb>(
  TEMPORAL_ADVERBS.map(a => [a.canonical, a])
);

const _adverbBySurface = new Map<string, TemporalAdverb>();
for (const adverb of TEMPORAL_ADVERBS) {
  for (const form of adverb.surfaceForms) {
    _adverbBySurface.set(form.toLowerCase(), adverb);
  }
}

/**
 * Look up a temporal adverb by canonical form.
 */
export function getTemporalAdverb(canonical: string): TemporalAdverb | undefined {
  return _adverbByCanonical.get(canonical.toLowerCase());
}

/**
 * Look up a temporal adverb by any surface form.
 */
export function lookupTemporalAdverb(phrase: string): TemporalAdverb | undefined {
  return _adverbBySurface.get(phrase.toLowerCase());
}

/**
 * Find all temporal adverbs in a string.
 */
export function findTemporalAdverbs(text: string): readonly FoundTemporalAdverb[] {
  const lower = text.toLowerCase();
  const found: FoundTemporalAdverb[] = [];

  for (const adverb of TEMPORAL_ADVERBS) {
    for (const form of adverb.surfaceForms) {
      const idx = lower.indexOf(form.toLowerCase());
      if (idx >= 0) {
        // Check word boundaries
        const before = idx > 0 ? lower[idx - 1] : ' ';
        const after = idx + form.length < lower.length ? lower[idx + form.length] : ' ';
        if ((before === ' ' || before === ',') && (after === ' ' || after === ',' || after === '.' || after === '!' || after === '?')) {
          found.push({
            adverb,
            surfaceForm: form,
            position: idx,
            length: form.length,
          });
          break; // Only find each adverb once
        }
      }
    }
  }

  return found.sort((a, b) => a.position - b.position);
}

export interface FoundTemporalAdverb {
  readonly adverb: TemporalAdverb;
  readonly surfaceForm: string;
  readonly position: number;
  readonly length: number;
}

// =============================================================================
// TEMPORAL RESOLUTION
// =============================================================================

/**
 * Context for resolving a temporal adverb.
 */
export interface TemporalResolutionContext {
  /** Whether there's an active scope/selection */
  readonly hasSelection: boolean;
  /** Whether the utterance references a section */
  readonly referencesSection: boolean;
  /** Whether the utterance references a prior edit */
  readonly referencesEdit: boolean;
  /** Whether this is a multi-step command */
  readonly isMultiStep: boolean;
  /** Whether there's plan history available */
  readonly hasPlanHistory: boolean;
  /** Whether the utterance is a question */
  readonly isQuestion: boolean;
  /** Whether a temporal clause precedes this adverb */
  readonly followsTemporalClause: boolean;
  /** The current scope type */
  readonly scopeType?: string;
}

/**
 * Resolve a temporal adverb to its best interpretation.
 */
export function resolveTemporalAdverb(
  adverb: TemporalAdverb,
  context: TemporalResolutionContext
): TemporalResolutionResult {
  let bestInterpretation: TemporalInterpretation | undefined;
  let bestScore = -1;

  for (const interp of adverb.interpretations) {
    let score = 0;

    for (const condition of interp.conditions) {
      if (conditionMet(condition, context)) {
        score += interp.conditionBonus;
      }
    }

    // Base score from interpretation order
    score += 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestInterpretation = interp;
    }
  }

  if (!bestInterpretation) {
    return {
      resolved: false,
      domain: adverb.defaultInterpretation,
      meaning: undefined,
      confidence: 0,
      explanation: `No interpretation conditions matched for "${adverb.canonical}". Using default: ${adverb.defaultInterpretation}.`,
      alternatives: adverb.interpretations.map(i => i.domain),
    };
  }

  const secondBest = adverb.interpretations
    .filter(i => i !== bestInterpretation)
    .reduce((best, i) => {
      let score = 0;
      for (const c of i.conditions) {
        if (conditionMet(c, context)) score += i.conditionBonus;
      }
      return score > (best?.score ?? -1) ? { interp: i, score } : best;
    }, undefined as { interp: TemporalInterpretation; score: number } | undefined);

  const gap = secondBest ? bestScore - secondBest.score : bestScore;
  const confident = gap > 0.15;

  return {
    resolved: confident,
    domain: bestInterpretation.domain,
    meaning: bestInterpretation.meaning,
    confidence: Math.min(1, bestScore),
    explanation: confident
      ? `"${adverb.canonical}" → ${bestInterpretation.domain} (confidence: ${(bestScore * 100).toFixed(0)}%)`
      : `"${adverb.canonical}" is ambiguous between ${bestInterpretation.domain} and ${secondBest?.interp.domain ?? 'unknown'} (gap: ${(gap * 100).toFixed(0)}%)`,
    alternatives: adverb.interpretations.map(i => i.domain),
  };
}

export interface TemporalResolutionResult {
  readonly resolved: boolean;
  readonly domain: TemporalDomain;
  readonly meaning: TemporalMeaning | undefined;
  readonly confidence: number;
  readonly explanation: string;
  readonly alternatives: readonly TemporalDomain[];
}

function conditionMet(condition: InterpretationCondition, context: TemporalResolutionContext): boolean {
  switch (condition.kind) {
    case 'has_scope': return context.scopeType === condition.scopeType || context.hasSelection;
    case 'references_section': return context.referencesSection;
    case 'references_edit': return context.referencesEdit;
    case 'multi_step_command': return context.isMultiStep;
    case 'has_plan_history': return context.hasPlanHistory;
    case 'is_question': return context.isQuestion;
    case 'follows_temporal_clause': return context.followsTemporalClause;
    case 'has_selection': return context.hasSelection;
    case 'no_context': return !context.hasSelection && !context.referencesSection && !context.hasPlanHistory;
  }
}

// =============================================================================
// DISPLAY AND FORMATTING
// =============================================================================

/**
 * Format a temporal adverb entry for display.
 */
export function formatTemporalAdverb(adverb: TemporalAdverb): string {
  const domains = adverb.interpretations.map(i => i.domain).join(', ');
  return `"${adverb.canonical}" — domains: [${domains}], default: ${adverb.defaultInterpretation}, deictic: ${adverb.isDeictic}`;
}

/**
 * Format a resolution result for display.
 */
export function formatTemporalResolution(result: TemporalResolutionResult): string {
  const status = result.resolved ? 'Resolved' : 'Ambiguous';
  return `${status}: domain=${result.domain}, confidence=${(result.confidence * 100).toFixed(0)}%`;
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface TemporalAdverbStats {
  readonly totalAdverbs: number;
  readonly totalSurfaceForms: number;
  readonly deicticCount: number;
  readonly byDefaultDomain: Readonly<Record<string, number>>;
  readonly totalExamples: number;
}

export function getTemporalAdverbStats(): TemporalAdverbStats {
  const byDomain: Record<string, number> = {};
  let totalSurface = 0;
  let deicticCount = 0;
  let totalExamples = 0;

  for (const adverb of TEMPORAL_ADVERBS) {
    totalSurface += adverb.surfaceForms.length;
    if (adverb.isDeictic) deicticCount++;
    totalExamples += adverb.examples.length;
    byDomain[adverb.defaultInterpretation] = (byDomain[adverb.defaultInterpretation] ?? 0) + 1;
  }

  return {
    totalAdverbs: TEMPORAL_ADVERBS.length,
    totalSurfaceForms: totalSurface,
    deicticCount,
    byDefaultDomain: byDomain,
    totalExamples,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const TEMPORAL_ADVERB_RULES = [
  'Rule TA-001: Temporal adverbs are THREE-WAY ambiguous: musical time, ' +
  'dialogue time, and workflow time. Resolution requires context.',

  'Rule TA-002: When a temporal adverb co-occurs with a section reference ' +
  '("before the chorus"), musical time is strongly preferred.',

  'Rule TA-003: When a temporal adverb is part of a multi-step command ' +
  '("first X, then Y"), workflow time is strongly preferred.',

  'Rule TA-004: "Again" and "still" always refer to dialogue time (prior edits). ' +
  'They never refer to musical time positions.',

  'Rule TA-005: "Before" and "after" with section arguments are always ' +
  'musical time. "Before" and "after" without arguments are ambiguous.',

  'Rule TA-006: When resolution confidence is below the threshold, the system ' +
  'MUST ask for clarification rather than guessing.',

  'Rule TA-007: Temporal adverbs that are deictic (context-dependent) require ' +
  'a discourse context to resolve. Without context, the default interpretation is used.',

  'Rule TA-008: In multi-step commands, temporal ordering is explicit: ' +
  '"first" < "then" < "finally". The planner must respect this ordering.',

  'Rule TA-009: "Meanwhile" indicates parallel plan execution. Operations ' +
  'joined by "meanwhile" are independent and can be applied in any order.',

  'Rule TA-010: All temporal resolutions are recorded in the provenance trace ' +
  'so the user can see why "now" was interpreted as musical time vs. workflow time.',
] as const;
