/**
 * GOFAI Clarification Contract — QUD-Style Clarification Questions
 *
 * Step 015 [Prag][HCI]: Defines the "clarification question" contract.
 * Every clarification question must:
 *
 *   (a) **Name the ambiguity**: Tell the user exactly what is ambiguous
 *       ("By 'darker', do you mean timbre, harmony, or register?")
 *
 *   (b) **Offer defaults**: Provide a recommended option when one is safe
 *       ("Default: timbre (less high-frequency content)")
 *
 *   (c) **Show impact**: Explain what each choice means for the edit
 *       ("Timbre: will reduce brightness of synth layers;
 *        Harmony: will use minor substitutions")
 *
 * ## QUD (Questions Under Discussion) Integration
 *
 * Clarification questions are modeled as QUDs pushed onto the discourse
 * stack. When the user answers, the QUD is popped and the discourse
 * state is updated with the resolution.
 *
 * This means:
 * - Clarification questions participate in topic continuity
 * - Answers update the common ground
 * - The system can refer back to clarification answers
 * - Questions are batched when possible to reduce friction
 *
 * ## Question Categories
 *
 * 1. **Sense disambiguation**: Which meaning of a vague word?
 * 2. **Reference disambiguation**: Which entity does a pronoun refer to?
 * 3. **Scope disambiguation**: What range/section/layer is affected?
 * 4. **Amount specification**: How much change?
 * 5. **Constraint clarification**: What should be preserved?
 * 6. **Entity identification**: Which specific entity?
 * 7. **Temporal disambiguation**: Macro vs micro timing?
 * 8. **Plan selection**: Which plan variant?
 *
 * @module gofai/pragmatics/clarification-contract
 */

import type { AmbiguityKind } from '../pipeline/ambiguity-policy';
import type { SourceSpan } from '../nl/semantics/representation';

// =============================================================================
// Clarification Question Types
// =============================================================================

/**
 * A structured clarification question conforming to the QUD contract.
 *
 * This is the canonical type for all clarification questions.
 * Every question is:
 * - Machine-readable (typed options, structured impact)
 * - Human-readable (templates for UI display)
 * - Auditable (traces back to the ambiguity and source span)
 */
export interface ClarificationQuestion {
  /** Unique question identifier */
  readonly id: ClarificationQuestionId;

  /** (a) The ambiguity being named */
  readonly ambiguity: AmbiguityDescription;

  /** (b) The available options (including default) */
  readonly options: readonly ClarificationOption[];

  /** (b) The default option index (if a safe default exists) */
  readonly defaultOptionIndex: number | undefined;

  /** (c) Impact summary for each option */
  readonly impacts: readonly OptionImpact[];

  /** Display text: the question in natural language */
  readonly displayText: string;

  /** Short label for compact UI */
  readonly shortLabel: string;

  /** Category of clarification */
  readonly category: ClarificationCategory;

  /** Priority (higher = should be asked first) */
  readonly priority: number;

  /** Whether this question can be skipped (has a safe default) */
  readonly skippable: boolean;

  /** The CPL hole this resolves */
  readonly holeId: string;

  /** Source span in the original utterance */
  readonly sourceSpan: SourceSpan | undefined;

  /** The QUD this generates */
  readonly qudType: QUDType;

  /** One-line "why this matters" explanation */
  readonly whyItMatters: string;

  /** Related questions (for batching) */
  readonly relatedQuestionIds: readonly ClarificationQuestionId[];

  /** Metadata for the clarification UI */
  readonly uiHints: ClarificationUIHints;
}

/**
 * Clarification question ID.
 */
export type ClarificationQuestionId = string & { readonly __brand: 'ClarificationQuestionId' };

/**
 * Create a clarification question ID.
 */
export function createClarificationQuestionId(
  ambiguityKind: string,
  sourceWord: string,
  index: number
): ClarificationQuestionId {
  return `clarify:${ambiguityKind}:${sourceWord}:${index}` as ClarificationQuestionId;
}

// =============================================================================
// Ambiguity Description (Contract Part A)
// =============================================================================

/**
 * Structured description of the ambiguity.
 * This is the "name the ambiguity" part of the contract.
 */
export interface AmbiguityDescription {
  /** The kind of ambiguity */
  readonly kind: AmbiguityKind;

  /** The ambiguous word or phrase */
  readonly ambiguousPhrase: string;

  /** Human-readable explanation of what's ambiguous */
  readonly explanation: string;

  /** The source span */
  readonly sourceSpan: SourceSpan | undefined;

  /** Number of competing interpretations */
  readonly interpretationCount: number;

  /** Whether this ambiguity is "well-known" (e.g., "darker" is always ambiguous) */
  readonly isCommonAmbiguity: boolean;
}

// =============================================================================
// Clarification Options (Contract Part B)
// =============================================================================

/**
 * An option for a clarification question.
 *
 * Every option includes:
 * - A human-readable label
 * - A description of what it means
 * - Whether it's the default
 * - A preview of its effect
 */
export interface ClarificationOption {
  /** Option index (0-based) */
  readonly index: number;

  /** Short label for the option */
  readonly label: string;

  /** Longer description */
  readonly description: string;

  /** Whether this is the recommended default */
  readonly isDefault: boolean;

  /** Why this is the default (if it is) */
  readonly defaultReason: string | undefined;

  /** The value this option resolves the hole to */
  readonly resolvedValue: ClarificationValue;

  /** Tags for grouping/filtering */
  readonly tags: readonly string[];
}

/**
 * The resolved value when an option is chosen.
 */
export type ClarificationValue =
  | { readonly type: 'axis'; readonly axisId: string; readonly direction: 'increase' | 'decrease' }
  | { readonly type: 'entity_ref'; readonly entityId: string; readonly entityType: string }
  | { readonly type: 'scope'; readonly scopeType: string; readonly scopeValue: string }
  | { readonly type: 'amount'; readonly degree: string }
  | { readonly type: 'preservation_mode'; readonly mode: 'exact' | 'functional' | 'recognizable' }
  | { readonly type: 'boolean'; readonly value: boolean }
  | { readonly type: 'temporal'; readonly temporalType: 'macro' | 'micro' }
  | { readonly type: 'plan_index'; readonly planIndex: number }
  | { readonly type: 'custom'; readonly key: string; readonly value: unknown };

// =============================================================================
// Option Impact (Contract Part C)
// =============================================================================

/**
 * Impact description for a clarification option.
 * This is the "show impact" part of the contract.
 */
export interface OptionImpact {
  /** Which option this describes */
  readonly optionIndex: number;

  /** One-line summary of the impact */
  readonly summary: string;

  /** Detailed description of what will change */
  readonly details: string;

  /** Estimated scope of the change */
  readonly changeScope: ImpactScope;

  /** Risk level */
  readonly riskLevel: 'safe' | 'moderate' | 'risky';

  /** Number of events that would be affected */
  readonly estimatedAffectedEvents: number | undefined;

  /** Layers that would be affected */
  readonly affectedLayers: readonly string[];

  /** Whether this option is reversible */
  readonly reversible: boolean;
}

/**
 * Scope of an option's impact.
 */
export interface ImpactScope {
  /** Scope breadth */
  readonly breadth: 'narrow' | 'moderate' | 'wide' | 'global';

  /** Description */
  readonly description: string;

  /** Section(s) affected */
  readonly sections: readonly string[];

  /** Layer(s) affected */
  readonly layers: readonly string[];
}

// =============================================================================
// Clarification Categories
// =============================================================================

/**
 * Categories of clarification questions.
 */
export type ClarificationCategory =
  | 'sense'          // Which meaning of a word?
  | 'reference'      // Which entity does a pronoun refer to?
  | 'scope'          // What range/section/layer is affected?
  | 'amount'         // How much change?
  | 'constraint'     // What should be preserved?
  | 'entity'         // Which specific entity?
  | 'temporal'       // Macro vs micro timing?
  | 'plan'           // Which plan variant?
  | 'confirmation';  // Do you mean this? (yes/no)

/**
 * All clarification categories.
 */
export const CLARIFICATION_CATEGORIES: readonly ClarificationCategory[] = [
  'sense',
  'reference',
  'scope',
  'amount',
  'constraint',
  'entity',
  'temporal',
  'plan',
  'confirmation',
] as const;

/**
 * QUD type corresponding to the clarification.
 */
export type QUDType =
  | 'what_sense'       // "What do you mean by X?"
  | 'which_entity'     // "Which X do you mean?"
  | 'what_scope'       // "Where should this apply?"
  | 'how_much'         // "How much change?"
  | 'what_to_keep'     // "What should be preserved?"
  | 'which_one'        // "Which specific X?"
  | 'macro_or_micro'   // "Song form or bar timing?"
  | 'which_plan'       // "Which approach?"
  | 'yes_or_no';       // "Is this what you mean?"

// =============================================================================
// UI Hints for Clarification Display
// =============================================================================

/**
 * UI rendering hints for a clarification question.
 */
export interface ClarificationUIHints {
  /** Preferred display mode */
  readonly displayMode: ClarificationDisplayMode;

  /** Whether to highlight the ambiguous span in the input */
  readonly highlightSpan: boolean;

  /** Whether to show a preview diff for each option */
  readonly showPreviewDiffs: boolean;

  /** Whether to show the "why this matters" line */
  readonly showWhyItMatters: boolean;

  /** Whether to collapse into a single chip (for simple binary choices) */
  readonly collapseToChip: boolean;

  /** Whether this question should be grouped with related questions */
  readonly groupable: boolean;

  /** Icon hint */
  readonly iconHint: ClarificationIconHint;

  /** Accent color hint */
  readonly accentColor: 'neutral' | 'caution' | 'warning';
}

/**
 * Display modes for clarification questions.
 */
export type ClarificationDisplayMode =
  | 'radio'          // Radio buttons (single select)
  | 'card_list'      // Cards with descriptions (rich)
  | 'inline_chip'    // Inline chips (compact)
  | 'modal'          // Modal dialog (for complex choices)
  | 'sidebar'        // Sidebar panel (for multi-question)
  | 'dropdown';      // Dropdown (for many options)

/**
 * Icon hints for clarification questions.
 */
export type ClarificationIconHint =
  | 'question'       // Generic question
  | 'scope'          // Scope/location related
  | 'palette'        // Aesthetic/timbre related
  | 'target'         // Reference/entity related
  | 'ruler'          // Amount/degree related
  | 'shield'         // Constraint/safety related
  | 'clock'          // Temporal related
  | 'branch';        // Plan alternative related

// =============================================================================
// Clarification Question Templates
// =============================================================================

/**
 * A template for generating clarification questions.
 *
 * Templates are parameterized by the ambiguous phrase and candidates.
 * They produce consistent, natural-sounding question text.
 */
export interface ClarificationTemplate {
  /** Template ID */
  readonly id: string;

  /** Category this template handles */
  readonly category: ClarificationCategory;

  /** The question pattern (with placeholders) */
  readonly pattern: string;

  /** The "why it matters" pattern */
  readonly whyPattern: string;

  /** Short label pattern */
  readonly shortLabelPattern: string;

  /** Default UI hints */
  readonly defaultUIHints: ClarificationUIHints;

  /** Default priority */
  readonly defaultPriority: number;
}

/**
 * Core clarification templates.
 *
 * These are the canonical question patterns used by the system.
 * Each template handles a specific category of ambiguity.
 */
export const CLARIFICATION_TEMPLATES: readonly ClarificationTemplate[] = [
  {
    id: 'template:sense:vague_adjective',
    category: 'sense',
    pattern: 'By "{phrase}", do you mean {options_list}?',
    whyPattern: 'Different interpretations produce different musical changes',
    shortLabelPattern: '"{phrase}" meaning',
    defaultUIHints: {
      displayMode: 'card_list',
      highlightSpan: true,
      showPreviewDiffs: true,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: true,
      iconHint: 'palette',
      accentColor: 'caution',
    },
    defaultPriority: 100,
  },
  {
    id: 'template:reference:pronoun',
    category: 'reference',
    pattern: 'What does "{phrase}" refer to? {options_list}',
    whyPattern: 'The edit will be applied to the chosen target',
    shortLabelPattern: '"{phrase}" target',
    defaultUIHints: {
      displayMode: 'radio',
      highlightSpan: true,
      showPreviewDiffs: false,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: false,
      iconHint: 'target',
      accentColor: 'caution',
    },
    defaultPriority: 90,
  },
  {
    id: 'template:scope:where',
    category: 'scope',
    pattern: 'Where should this apply? {options_list}',
    whyPattern: 'The scope determines which part of the project is affected',
    shortLabelPattern: 'Apply where?',
    defaultUIHints: {
      displayMode: 'radio',
      highlightSpan: false,
      showPreviewDiffs: true,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: false,
      iconHint: 'scope',
      accentColor: 'caution',
    },
    defaultPriority: 85,
  },
  {
    id: 'template:amount:how_much',
    category: 'amount',
    pattern: 'How much {axis_name} change? {options_list}',
    whyPattern: 'Controls the intensity of the edit',
    shortLabelPattern: 'How much?',
    defaultUIHints: {
      displayMode: 'inline_chip',
      highlightSpan: false,
      showPreviewDiffs: false,
      showWhyItMatters: false,
      collapseToChip: true,
      groupable: true,
      iconHint: 'ruler',
      accentColor: 'neutral',
    },
    defaultPriority: 60,
  },
  {
    id: 'template:entity:which_one',
    category: 'entity',
    pattern: 'Which {entity_type} do you mean? {options_list}',
    whyPattern: 'Multiple {entity_type_plural} match this description',
    shortLabelPattern: 'Which {entity_type}?',
    defaultUIHints: {
      displayMode: 'radio',
      highlightSpan: true,
      showPreviewDiffs: false,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: false,
      iconHint: 'target',
      accentColor: 'caution',
    },
    defaultPriority: 88,
  },
  {
    id: 'template:temporal:macro_micro',
    category: 'temporal',
    pattern: 'Do you mean "{phrase}" in terms of song structure or timing within bars?',
    whyPattern: 'Song structure changes are larger than timing adjustments',
    shortLabelPattern: 'Structure or timing?',
    defaultUIHints: {
      displayMode: 'card_list',
      highlightSpan: true,
      showPreviewDiffs: true,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: false,
      iconHint: 'clock',
      accentColor: 'caution',
    },
    defaultPriority: 88,
  },
  {
    id: 'template:constraint:what_to_keep',
    category: 'constraint',
    pattern: 'What should be preserved? {options_list}',
    whyPattern: 'Constraints restrict which aspects of the music can change',
    shortLabelPattern: 'Preserve what?',
    defaultUIHints: {
      displayMode: 'card_list',
      highlightSpan: false,
      showPreviewDiffs: true,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: true,
      iconHint: 'shield',
      accentColor: 'neutral',
    },
    defaultPriority: 75,
  },
  {
    id: 'template:plan:which_approach',
    category: 'plan',
    pattern: 'Which approach do you prefer? {options_list}',
    whyPattern: 'Different approaches produce different musical results',
    shortLabelPattern: 'Which approach?',
    defaultUIHints: {
      displayMode: 'card_list',
      highlightSpan: false,
      showPreviewDiffs: true,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: false,
      iconHint: 'branch',
      accentColor: 'neutral',
    },
    defaultPriority: 70,
  },
  {
    id: 'template:confirmation:yes_no',
    category: 'confirmation',
    pattern: 'Did you mean {description}?',
    whyPattern: 'Confirming to avoid unintended changes',
    shortLabelPattern: 'Confirm?',
    defaultUIHints: {
      displayMode: 'inline_chip',
      highlightSpan: false,
      showPreviewDiffs: false,
      showWhyItMatters: false,
      collapseToChip: true,
      groupable: false,
      iconHint: 'question',
      accentColor: 'neutral',
    },
    defaultPriority: 50,
  },
] as const;

// =============================================================================
// Clarification Question Generation
// =============================================================================

/**
 * Parameters for generating a clarification question.
 */
export interface ClarificationGenerationParams {
  /** The ambiguous phrase */
  readonly phrase: string;

  /** The ambiguity kind */
  readonly ambiguityKind: AmbiguityKind;

  /** Category */
  readonly category: ClarificationCategory;

  /** Candidate interpretations */
  readonly candidates: readonly CandidateInterpretation[];

  /** Default candidate index (if safe) */
  readonly defaultIndex: number | undefined;

  /** Source span */
  readonly sourceSpan: SourceSpan | undefined;

  /** CPL hole ID */
  readonly holeId: string;

  /** Additional context */
  readonly context: ClarificationContext;
}

/**
 * A candidate interpretation for question generation.
 */
export interface CandidateInterpretation {
  /** Label */
  readonly label: string;

  /** Description */
  readonly description: string;

  /** Impact summary */
  readonly impact: string;

  /** Risk level */
  readonly risk: 'safe' | 'moderate' | 'risky';

  /** The resolved value */
  readonly value: ClarificationValue;

  /** Estimated affected scope */
  readonly affectedScope: string;
}

/**
 * Context for question generation.
 */
export interface ClarificationContext {
  /** Current scope (if known) */
  readonly currentScope: string | undefined;

  /** Current topic */
  readonly currentTopic: string | undefined;

  /** Turn number */
  readonly turnNumber: number;

  /** Whether this is the first question in this turn */
  readonly isFirstQuestion: boolean;

  /** Total questions pending */
  readonly totalQuestionsPending: number;
}

/**
 * Generate a clarification question from parameters.
 */
export function generateClarificationQuestion(
  params: ClarificationGenerationParams
): ClarificationQuestion {
  const template = findTemplate(params.category);

  const options: ClarificationOption[] = params.candidates.map((candidate, index) => ({
    index,
    label: candidate.label,
    description: candidate.description,
    isDefault: index === params.defaultIndex,
    defaultReason: index === params.defaultIndex
      ? 'Most common interpretation in this context'
      : undefined,
    resolvedValue: candidate.value,
    tags: [],
  }));

  const impacts: OptionImpact[] = params.candidates.map((candidate, index) => ({
    optionIndex: index,
    summary: candidate.impact,
    details: candidate.description,
    changeScope: {
      breadth: 'moderate' as const,
      description: candidate.affectedScope,
      sections: [],
      layers: [],
    },
    riskLevel: candidate.risk,
    estimatedAffectedEvents: undefined,
    affectedLayers: [],
    reversible: true,
  }));

  const displayText = formatQuestionText(template.pattern, params);
  const shortLabel = formatQuestionText(template.shortLabelPattern, params);
  const whyItMatters = formatQuestionText(template.whyPattern, params);

  return {
    id: createClarificationQuestionId(
      params.ambiguityKind,
      params.phrase,
      params.context.turnNumber
    ),
    ambiguity: {
      kind: params.ambiguityKind,
      ambiguousPhrase: params.phrase,
      explanation: `"${params.phrase}" can be interpreted in ${params.candidates.length} different ways`,
      sourceSpan: params.sourceSpan,
      interpretationCount: params.candidates.length,
      isCommonAmbiguity: isCommonAmbiguity(params.ambiguityKind, params.phrase),
    },
    options,
    defaultOptionIndex: params.defaultIndex,
    impacts,
    displayText,
    shortLabel,
    category: params.category,
    priority: template.defaultPriority,
    skippable: params.defaultIndex !== undefined,
    holeId: params.holeId,
    sourceSpan: params.sourceSpan,
    qudType: categoryToQUDType(params.category),
    whyItMatters,
    relatedQuestionIds: [],
    uiHints: template.defaultUIHints,
  };
}

// =============================================================================
// Question Batching
// =============================================================================

/**
 * Batch related clarification questions into groups.
 *
 * Batching reduces the number of interaction turns:
 * - Multiple sense disambiguations for the same axis family
 * - Multiple scope disambiguations in the same utterance
 * - Amount specification for coordinated goals
 */
export interface QuestionBatch {
  /** Batch ID */
  readonly id: string;

  /** The questions in this batch */
  readonly questions: readonly ClarificationQuestion[];

  /** Whether all questions must be answered */
  readonly allRequired: boolean;

  /** Batch label */
  readonly label: string;

  /** Description */
  readonly description: string;
}

/**
 * Batch questions by category and relatedness.
 */
export function batchQuestions(
  questions: readonly ClarificationQuestion[]
): readonly QuestionBatch[] {
  if (questions.length <= 1) {
    return questions.map(q => ({
      id: `batch:${q.id}`,
      questions: [q],
      allRequired: !q.skippable,
      label: q.shortLabel,
      description: q.displayText,
    }));
  }

  // Group by category
  const byCategory = new Map<ClarificationCategory, ClarificationQuestion[]>();
  for (const q of questions) {
    const list = byCategory.get(q.category);
    if (list) {
      list.push(q);
    } else {
      byCategory.set(q.category, [q]);
    }
  }

  const batches: QuestionBatch[] = [];

  for (const [category, categoryQuestions] of byCategory) {
    if (categoryQuestions.length === 1) {
      const q = categoryQuestions[0]!;
      batches.push({
        id: `batch:${q.id}`,
        questions: categoryQuestions,
        allRequired: !q.skippable,
        label: q.shortLabel,
        description: q.displayText,
      });
    } else {
      // Batch multiple questions of the same category
      batches.push({
        id: `batch:${category}:${Date.now()}`,
        questions: categoryQuestions,
        allRequired: categoryQuestions.some(q => !q.skippable),
        label: `${categoryQuestions.length} ${category} questions`,
        description: `Resolve ${categoryQuestions.length} related ambiguities`,
      });
    }
  }

  // Sort batches by priority (highest priority first)
  batches.sort((a, b) => {
    const aPrio = Math.max(...a.questions.map(q => q.priority));
    const bPrio = Math.max(...b.questions.map(q => q.priority));
    return bPrio - aPrio;
  });

  return batches;
}

// =============================================================================
// Clarification Resolution
// =============================================================================

/**
 * Result of resolving a clarification question.
 */
export interface ClarificationResolution {
  /** The question that was resolved */
  readonly questionId: ClarificationQuestionId;

  /** The chosen option index */
  readonly chosenOptionIndex: number;

  /** The resolved value */
  readonly resolvedValue: ClarificationValue;

  /** Whether this was the default */
  readonly usedDefault: boolean;

  /** Turn number */
  readonly turnNumber: number;

  /** Updates to discourse state */
  readonly discourseUpdates: readonly DiscourseUpdate[];
}

/**
 * An update to the discourse state resulting from a clarification.
 */
export type DiscourseUpdate =
  | { readonly type: 'add_to_common_ground'; readonly fact: string }
  | { readonly type: 'update_preference'; readonly term: string; readonly value: string }
  | { readonly type: 'pop_qud' }
  | { readonly type: 'set_topic'; readonly entityId: string; readonly entityType: string };

// =============================================================================
// Clarification Minimality Principle
// =============================================================================

/**
 * Evaluate whether a clarification question is necessary.
 *
 * The minimality principle states: ask only what's needed to execute safely,
 * not what's needed to be perfect. This means:
 *
 * - If all interpretations produce the same edit → don't ask
 * - If one interpretation is clearly safest → suggest it as default
 * - If the question can be deferred to planning → defer
 * - If user preferences exist → apply them
 */
export interface MinimalityCheck {
  /** Whether the question is necessary */
  readonly necessary: boolean;

  /** Reason */
  readonly reason: string;

  /** Alternative to asking (if not necessary) */
  readonly alternative: MinimalityAlternative | undefined;
}

/**
 * Alternatives to asking a clarification question.
 */
export type MinimalityAlternative =
  | { readonly type: 'apply_default'; readonly defaultValue: ClarificationValue; readonly reason: string }
  | { readonly type: 'defer_to_planning'; readonly reason: string }
  | { readonly type: 'apply_preference'; readonly preference: string; readonly value: string }
  | { readonly type: 'merge_equivalent'; readonly reason: string };

/**
 * Check whether a clarification question is minimal (necessary).
 */
export function checkMinimality(
  question: ClarificationQuestion,
  _userPreferences: Readonly<Record<string, string>>
): MinimalityCheck {
  // If all options have the same impact scope and risk, the question isn't necessary
  if (question.impacts.length > 0) {
    const firstImpact = question.impacts[0]!;
    const allSameScope = question.impacts.every(
      imp => imp.summary === firstImpact.summary
    );
    if (allSameScope) {
      return {
        necessary: false,
        reason: 'All interpretations produce equivalent edits',
        alternative: {
          type: 'merge_equivalent',
          reason: 'Interpretations are functionally identical',
        },
      };
    }
  }

  // If a safe default exists and risk is low, suggest default
  if (question.defaultOptionIndex !== undefined) {
    const defaultImpact = question.impacts.find(
      imp => imp.optionIndex === question.defaultOptionIndex
    );
    if (defaultImpact && defaultImpact.riskLevel === 'safe') {
      return {
        necessary: false,
        reason: 'Safe default available',
        alternative: {
          type: 'apply_default',
          defaultValue: question.options[question.defaultOptionIndex]!.resolvedValue,
          reason: `Safe default: ${question.options[question.defaultOptionIndex]!.label}`,
        },
      };
    }
  }

  return {
    necessary: true,
    reason: 'Interpretations produce materially different edits with no safe default',
    alternative: undefined,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function findTemplate(category: ClarificationCategory): ClarificationTemplate {
  const template = CLARIFICATION_TEMPLATES.find(t => t.category === category);
  if (template) return template;

  // Fallback template
  return {
    id: 'template:generic',
    category,
    pattern: 'Please clarify: {options_list}',
    whyPattern: 'This clarification is needed to proceed safely',
    shortLabelPattern: 'Clarify',
    defaultUIHints: {
      displayMode: 'radio',
      highlightSpan: true,
      showPreviewDiffs: false,
      showWhyItMatters: true,
      collapseToChip: false,
      groupable: false,
      iconHint: 'question',
      accentColor: 'caution',
    },
    defaultPriority: 50,
  };
}

function formatQuestionText(
  pattern: string,
  params: ClarificationGenerationParams
): string {
  let text = pattern;
  text = text.replace('{phrase}', params.phrase);
  text = text.replace('{options_list}', params.candidates.map(c => c.label).join(', '));
  text = text.replace('{entity_type}', params.category);
  text = text.replace('{entity_type_plural}', params.category + 's');
  text = text.replace('{axis_name}', params.phrase);
  text = text.replace('{description}', params.candidates.map(c => c.description).join(' or '));
  return text;
}

function categoryToQUDType(category: ClarificationCategory): QUDType {
  switch (category) {
    case 'sense': return 'what_sense';
    case 'reference': return 'which_entity';
    case 'scope': return 'what_scope';
    case 'amount': return 'how_much';
    case 'constraint': return 'what_to_keep';
    case 'entity': return 'which_one';
    case 'temporal': return 'macro_or_micro';
    case 'plan': return 'which_plan';
    case 'confirmation': return 'yes_or_no';
  }
}

function isCommonAmbiguity(_kind: AmbiguityKind, phrase: string): boolean {
  const commonlyAmbiguous = [
    'darker', 'brighter', 'warmer', 'bigger', 'wider', 'tighter',
    'earlier', 'later', 'it', 'that', 'this', 'more', 'less',
  ];
  return commonlyAmbiguous.includes(phrase.toLowerCase());
}
