/**
 * GOFAI Speech Act Types — Root of CPL-Intent
 *
 * Defines the speech act taxonomy for the GOFAI NL pipeline. Every user
 * utterance is classified into a speech act before semantic composition.
 * The speech act becomes the root of the CPL-Intent tree and determines:
 *
 * - What kind of CPL-Intent is produced
 * - Whether the intent compiles to mutation, inspection, or meta-actions
 * - What effect-type constraints apply (e.g., inspect cannot produce mutations)
 * - What confirmation/preview UX is appropriate
 *
 * Speech Act Taxonomy:
 *
 * 1. **Change** — User wants to modify the project (the primary case)
 *    Subtypes: direct-edit, parametric-adjust, structural-change, creative-transform
 *
 * 2. **Inspect** — User wants to examine/query the project state
 *    Subtypes: value-query, comparison, analysis, explanation-request
 *
 * 3. **Explain** — User wants the system to explain its behavior or decisions
 *    Subtypes: why-question, how-question, what-if, terminology
 *
 * 4. **Undo/Redo** — User wants to reverse or replay actions
 *    Subtypes: undo-last, undo-specific, redo-last, redo-specific, revert-to
 *
 * 5. **Propose** — User wants to see a preview/suggestion without committing
 *    Subtypes: suggest, compare-options, dry-run, experiment
 *
 * 6. **Configure** — User wants to change system settings or preferences
 *    Subtypes: set-preference, toggle-feature, set-default, reset-defaults
 *
 * 7. **Navigate** — User wants to move focus to a different part of the project
 *    Subtypes: go-to-section, go-to-time, go-to-track, zoom
 *
 * 8. **Meta** — User wants to interact with the NL system itself
 *    Subtypes: clarify, correct, confirm, cancel, help
 *
 * @module gofai/canon/speech-acts
 */

import type { SemanticVersion } from './versioning';
import type { CPLIntent } from './cpl-types';


// =============================================================================
// Speech Act Type Hierarchy
// =============================================================================

/**
 * Top-level speech act category.
 */
export type SpeechActCategory =
  | 'change'
  | 'inspect'
  | 'explain'
  | 'undo-redo'
  | 'propose'
  | 'configure'
  | 'navigate'
  | 'meta';

/**
 * Change subtypes: what kind of modification the user wants.
 */
export type ChangeSubtype =
  | 'direct-edit'         // "make it louder"
  | 'parametric-adjust'   // "set the reverb to 40%"
  | 'structural-change'   // "add a chorus after the bridge"
  | 'creative-transform'  // "make it sound like a 70s funk track"
  | 'batch-edit'          // "apply this to all tracks"
  | 'conditional-edit';   // "if the tempo is above 120, slow it down"

/**
 * Inspect subtypes: what kind of query the user is making.
 */
export type InspectSubtype =
  | 'value-query'          // "what's the tempo?"
  | 'comparison'           // "is the bass louder than the vocals?"
  | 'analysis'             // "analyze the frequency spectrum"
  | 'explanation-request'  // "why does the chorus sound muddy?"
  | 'list-query'           // "what tracks are in the project?"
  | 'state-query';         // "what was the last thing I changed?"

/**
 * Explain subtypes: what the user wants explained.
 */
export type ExplainSubtype =
  | 'why-question'    // "why did you choose that reverb?"
  | 'how-question'    // "how does the compressor work?"
  | 'what-if'         // "what would happen if I raised the bass?"
  | 'terminology'     // "what does 'sidechain' mean?"
  | 'decision-trace'  // "explain your reasoning for this edit"
  | 'capability';     // "what can you do with the EQ?"

/**
 * Undo/Redo subtypes.
 */
export type UndoRedoSubtype =
  | 'undo-last'       // "undo"
  | 'undo-specific'   // "undo the reverb change"
  | 'undo-n'          // "undo the last 3 changes"
  | 'redo-last'       // "redo"
  | 'redo-specific'   // "redo the EQ adjustment"
  | 'revert-to'       // "go back to how it sounded before"
  | 'compare-before';  // "compare with the version before the edit"

/**
 * Propose subtypes: preview/suggestion modes.
 */
export type ProposeSubtype =
  | 'suggest'           // "suggest how to make this warmer"
  | 'compare-options'   // "show me 3 different reverb settings"
  | 'dry-run'           // "preview what raising the bass would sound like"
  | 'experiment'        // "try different chorus effects"
  | 'a-b-compare';     // "compare A and B versions"

/**
 * Configure subtypes: system preference changes.
 */
export type ConfigureSubtype =
  | 'set-preference'   // "always ask before making destructive changes"
  | 'toggle-feature'   // "enable auto-save"
  | 'set-default'      // "default to 3dB increments for volume changes"
  | 'reset-defaults'   // "reset all preferences"
  | 'save-vocabulary';  // "remember that 'dark' means timbre for me"

/**
 * Navigate subtypes: focus/view changes.
 */
export type NavigateSubtype =
  | 'go-to-section'   // "go to the chorus"
  | 'go-to-time'      // "jump to 2:30"
  | 'go-to-track'     // "focus on the drums"
  | 'zoom'            // "zoom into bars 16-24"
  | 'scroll'          // "show me the next section"
  | 'select';         // "select the vocal track"

/**
 * Meta subtypes: NL system interaction.
 */
export type MetaSubtype =
  | 'clarify'     // "I meant the other track"
  | 'correct'     // "no, I said louder not lower"
  | 'confirm'     // "yes, do it"
  | 'cancel'      // "never mind"
  | 'help'        // "what can I say?"
  | 'repeat'      // "do that again"
  | 'rephrase';   // "let me try saying that differently"

/**
 * Union of all speech act subtypes.
 */
export type SpeechActSubtype =
  | ChangeSubtype
  | InspectSubtype
  | ExplainSubtype
  | UndoRedoSubtype
  | ProposeSubtype
  | ConfigureSubtype
  | NavigateSubtype
  | MetaSubtype;


// =============================================================================
// Speech Act Node
// =============================================================================

/**
 * A classified speech act: the root of a CPL-Intent tree.
 *
 * Every CPL-Intent must have exactly one speech act at its root.
 * The speech act determines the compilation pathway and effect constraints.
 */
export interface SpeechAct {
  /** Unique ID */
  readonly id: string;

  /** Top-level category */
  readonly category: SpeechActCategory;

  /** Subtype within the category */
  readonly subtype: SpeechActSubtype;

  /** Confidence in the classification (0..1) */
  readonly confidence: number;

  /** Alternative classifications (if ambiguous) */
  readonly alternatives: readonly SpeechActAlternative[];

  /** Source evidence for the classification */
  readonly evidence: readonly SpeechActEvidence[];

  /** Whether this speech act was explicitly marked or inferred */
  readonly inferenceMode: 'explicit' | 'inferred' | 'defaulted';

  /** If inferred, the source of the inference */
  readonly inferenceSource?: string | undefined;

  /** Provenance: span in the original utterance */
  readonly sourceSpan?: readonly [number, number] | undefined;

  /** Schema version */
  readonly schemaVersion: SemanticVersion;
}

/**
 * An alternative speech act classification.
 */
export interface SpeechActAlternative {
  readonly category: SpeechActCategory;
  readonly subtype: SpeechActSubtype;
  readonly confidence: number;
  readonly reason: string;
}

/**
 * Evidence supporting a speech act classification.
 */
export interface SpeechActEvidence {
  /** Evidence source */
  readonly source:
    | 'verb-form'        // Imperative "make" → change
    | 'question-syntax'  // "What is..." → inspect
    | 'keyword'          // "undo" → undo-redo
    | 'modal-verb'       // "could you..." → propose
    | 'discourse-cue'    // "actually" → meta:correct
    | 'pragmatic-context' // Following a question → meta:clarify
    | 'dialogue-state'   // System asked for clarification → meta:confirm
    | 'default';         // No explicit cue → change (default)

  /** Human-readable description */
  readonly description: string;

  /** Strength of the evidence (0..1) */
  readonly strength: number;
}


// =============================================================================
// Speech Act Classification Rules
// =============================================================================

/**
 * A classification rule for speech acts.
 *
 * Rules are evaluated in priority order; first match wins.
 */
export interface SpeechActRule {
  /** Rule ID */
  readonly id: string;

  /** Rule priority (lower = evaluated first) */
  readonly priority: number;

  /** Category this rule classifies to */
  readonly category: SpeechActCategory;

  /** Subtype this rule classifies to */
  readonly subtype: SpeechActSubtype;

  /** Trigger conditions */
  readonly triggers: readonly SpeechActTrigger[];

  /** Confidence assigned by this rule */
  readonly confidence: number;

  /** Evidence source type */
  readonly evidenceSource: SpeechActEvidence['source'];

  /** Human-readable description */
  readonly description: string;
}

/**
 * Trigger condition for a speech act rule.
 */
export interface SpeechActTrigger {
  /** Trigger type */
  readonly kind:
    | 'keyword'          // Specific word present
    | 'keyword-pattern'  // Regex pattern on words
    | 'pos-pattern'      // POS tag sequence
    | 'syntax-feature'   // Syntactic feature (interrogative, imperative, etc.)
    | 'dialogue-state'   // Current dialogue state
    | 'negation-present' // Negation cue detected
    | 'pronoun-pattern'; // Specific pronoun usage

  /** Value for the trigger */
  readonly value: string;

  /** Whether the trigger is negated (must NOT match) */
  readonly negated: boolean;
}

/**
 * Built-in speech act classification rules.
 *
 * These are the default rules; extensions can add more.
 */
export const SPEECH_ACT_RULES: readonly SpeechActRule[] = [
  // === Undo/Redo (highest priority — explicit keywords) ===
  {
    id: 'SA-R001',
    priority: 10,
    category: 'undo-redo',
    subtype: 'undo-last',
    triggers: [{ kind: 'keyword', value: 'undo', negated: false }],
    confidence: 0.95,
    evidenceSource: 'keyword',
    description: 'Keyword "undo" → undo-last',
  },
  {
    id: 'SA-R002',
    priority: 10,
    category: 'undo-redo',
    subtype: 'redo-last',
    triggers: [{ kind: 'keyword', value: 'redo', negated: false }],
    confidence: 0.95,
    evidenceSource: 'keyword',
    description: 'Keyword "redo" → redo-last',
  },
  {
    id: 'SA-R003',
    priority: 15,
    category: 'undo-redo',
    subtype: 'revert-to',
    triggers: [{ kind: 'keyword-pattern', value: 'revert|go\\s+back|restore', negated: false }],
    confidence: 0.90,
    evidenceSource: 'keyword',
    description: 'Keywords "revert", "go back", "restore" → revert-to',
  },
  {
    id: 'SA-R004',
    priority: 15,
    category: 'undo-redo',
    subtype: 'compare-before',
    triggers: [{ kind: 'keyword-pattern', value: 'compare.*before|before.*after', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'Before/after comparison → compare-before',
  },

  // === Meta (high priority — dialogue management) ===
  {
    id: 'SA-R010',
    priority: 20,
    category: 'meta',
    subtype: 'cancel',
    triggers: [{ kind: 'keyword-pattern', value: 'never\\s*mind|cancel|forget\\s+it|stop', negated: false }],
    confidence: 0.95,
    evidenceSource: 'keyword',
    description: 'Cancellation keywords → cancel',
  },
  {
    id: 'SA-R011',
    priority: 20,
    category: 'meta',
    subtype: 'confirm',
    triggers: [
      { kind: 'keyword-pattern', value: '^(yes|yeah|yep|ok|okay|sure|do\\s+it|go\\s+ahead)$', negated: false },
      { kind: 'dialogue-state', value: 'awaiting-confirmation', negated: false },
    ],
    confidence: 0.90,
    evidenceSource: 'dialogue-state',
    description: 'Affirmative response during confirmation → confirm',
  },
  {
    id: 'SA-R012',
    priority: 20,
    category: 'meta',
    subtype: 'correct',
    triggers: [{ kind: 'keyword-pattern', value: '^(no|nope)\\b|I\\s+meant|actually|not\\s+that', negated: false }],
    confidence: 0.85,
    evidenceSource: 'discourse-cue',
    description: 'Correction cues → correct',
  },
  {
    id: 'SA-R013',
    priority: 20,
    category: 'meta',
    subtype: 'help',
    triggers: [{ kind: 'keyword-pattern', value: 'help|what\\s+can\\s+you|how\\s+do\\s+I', negated: false }],
    confidence: 0.90,
    evidenceSource: 'keyword',
    description: 'Help request → help',
  },
  {
    id: 'SA-R014',
    priority: 25,
    category: 'meta',
    subtype: 'repeat',
    triggers: [{ kind: 'keyword-pattern', value: 'do\\s+that\\s+again|repeat|same\\s+thing', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'Repeat request → repeat',
  },

  // === Inspect (question detection) ===
  {
    id: 'SA-R020',
    priority: 30,
    category: 'inspect',
    subtype: 'value-query',
    triggers: [{ kind: 'syntax-feature', value: 'interrogative-wh-what', negated: false }],
    confidence: 0.80,
    evidenceSource: 'question-syntax',
    description: 'WH-what question → value-query',
  },
  {
    id: 'SA-R021',
    priority: 30,
    category: 'inspect',
    subtype: 'comparison',
    triggers: [{ kind: 'keyword-pattern', value: 'is.*louder|is.*higher|compare|which.*more', negated: false }],
    confidence: 0.80,
    evidenceSource: 'question-syntax',
    description: 'Comparison question → comparison',
  },
  {
    id: 'SA-R022',
    priority: 30,
    category: 'inspect',
    subtype: 'list-query',
    triggers: [{ kind: 'keyword-pattern', value: 'what\\s+tracks|list|show\\s+me\\s+all|how\\s+many', negated: false }],
    confidence: 0.80,
    evidenceSource: 'question-syntax',
    description: 'List/enumeration question → list-query',
  },
  {
    id: 'SA-R023',
    priority: 30,
    category: 'inspect',
    subtype: 'state-query',
    triggers: [{ kind: 'keyword-pattern', value: 'what\\s+was|what\\s+did|last\\s+change|history', negated: false }],
    confidence: 0.80,
    evidenceSource: 'question-syntax',
    description: 'History/state question → state-query',
  },

  // === Explain ===
  {
    id: 'SA-R030',
    priority: 35,
    category: 'explain',
    subtype: 'why-question',
    triggers: [{ kind: 'syntax-feature', value: 'interrogative-wh-why', negated: false }],
    confidence: 0.85,
    evidenceSource: 'question-syntax',
    description: 'Why question → why-question',
  },
  {
    id: 'SA-R031',
    priority: 35,
    category: 'explain',
    subtype: 'how-question',
    triggers: [{ kind: 'keyword-pattern', value: 'how\\s+does|how\\s+do|how\\s+would', negated: false }],
    confidence: 0.80,
    evidenceSource: 'question-syntax',
    description: 'How question → how-question',
  },
  {
    id: 'SA-R032',
    priority: 35,
    category: 'explain',
    subtype: 'what-if',
    triggers: [{ kind: 'keyword-pattern', value: 'what\\s+if|what\\s+would\\s+happen', negated: false }],
    confidence: 0.85,
    evidenceSource: 'question-syntax',
    description: 'What-if question → what-if',
  },
  {
    id: 'SA-R033',
    priority: 35,
    category: 'explain',
    subtype: 'terminology',
    triggers: [{ kind: 'keyword-pattern', value: 'what\\s+is\\s+a|what\\s+does.*mean|define|explain\\s+\\w+$', negated: false }],
    confidence: 0.85,
    evidenceSource: 'question-syntax',
    description: 'Terminology question → terminology',
  },

  // === Propose (modal/tentative cues) ===
  {
    id: 'SA-R040',
    priority: 40,
    category: 'propose',
    subtype: 'suggest',
    triggers: [{ kind: 'keyword-pattern', value: 'suggest|recommend|what\\s+should|ideas\\s+for', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'Suggestion request → suggest',
  },
  {
    id: 'SA-R041',
    priority: 40,
    category: 'propose',
    subtype: 'dry-run',
    triggers: [{ kind: 'keyword-pattern', value: 'preview|try\\s+out|show\\s+me\\s+what|without\\s+committing', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'Preview request → dry-run',
  },
  {
    id: 'SA-R042',
    priority: 40,
    category: 'propose',
    subtype: 'compare-options',
    triggers: [{ kind: 'keyword-pattern', value: 'show\\s+me\\s+\\d+|give\\s+me\\s+options|alternatives', negated: false }],
    confidence: 0.80,
    evidenceSource: 'keyword',
    description: 'Options request → compare-options',
  },
  {
    id: 'SA-R043',
    priority: 40,
    category: 'propose',
    subtype: 'a-b-compare',
    triggers: [{ kind: 'keyword-pattern', value: 'A\\s*\\/\\s*B|compare\\s+version|side\\s+by\\s+side', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'A/B comparison request → a-b-compare',
  },

  // === Configure ===
  {
    id: 'SA-R050',
    priority: 45,
    category: 'configure',
    subtype: 'set-preference',
    triggers: [{ kind: 'keyword-pattern', value: 'always\\s+ask|prefer|default\\s+to|from\\s+now\\s+on', negated: false }],
    confidence: 0.80,
    evidenceSource: 'keyword',
    description: 'Preference-setting language → set-preference',
  },
  {
    id: 'SA-R051',
    priority: 45,
    category: 'configure',
    subtype: 'save-vocabulary',
    triggers: [{ kind: 'keyword-pattern', value: 'remember.*means|when\\s+I\\s+say|save.*vocabulary', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'Vocabulary teaching → save-vocabulary',
  },

  // === Navigate ===
  {
    id: 'SA-R060',
    priority: 50,
    category: 'navigate',
    subtype: 'go-to-section',
    triggers: [{ kind: 'keyword-pattern', value: 'go\\s+to|jump\\s+to|take\\s+me\\s+to|show\\s+me\\s+the', negated: false }],
    confidence: 0.75,
    evidenceSource: 'keyword',
    description: 'Navigation language → go-to-section',
  },
  {
    id: 'SA-R061',
    priority: 50,
    category: 'navigate',
    subtype: 'zoom',
    triggers: [{ kind: 'keyword-pattern', value: 'zoom\\s+in|zoom\\s+out|focus\\s+on|magnify', negated: false }],
    confidence: 0.80,
    evidenceSource: 'keyword',
    description: 'Zoom language → zoom',
  },
  {
    id: 'SA-R062',
    priority: 50,
    category: 'navigate',
    subtype: 'select',
    triggers: [{ kind: 'keyword-pattern', value: 'select|highlight|mark|choose', negated: false }],
    confidence: 0.70,
    evidenceSource: 'keyword',
    description: 'Selection language → select',
  },

  // === Change (default — lowest priority, imperative form) ===
  {
    id: 'SA-R100',
    priority: 100,
    category: 'change',
    subtype: 'direct-edit',
    triggers: [{ kind: 'syntax-feature', value: 'imperative', negated: false }],
    confidence: 0.75,
    evidenceSource: 'verb-form',
    description: 'Imperative verb form → direct-edit (default)',
  },
  {
    id: 'SA-R101',
    priority: 100,
    category: 'change',
    subtype: 'parametric-adjust',
    triggers: [{ kind: 'keyword-pattern', value: 'set\\s+.*to|change\\s+.*to\\s+\\d', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'Set-to-value pattern → parametric-adjust',
  },
  {
    id: 'SA-R102',
    priority: 100,
    category: 'change',
    subtype: 'structural-change',
    triggers: [{ kind: 'keyword-pattern', value: 'add\\s+a|remove\\s+the|delete\\s+the|insert|duplicate|split|merge', negated: false }],
    confidence: 0.85,
    evidenceSource: 'keyword',
    description: 'Structural operation keywords → structural-change',
  },
  {
    id: 'SA-R103',
    priority: 100,
    category: 'change',
    subtype: 'creative-transform',
    triggers: [{ kind: 'keyword-pattern', value: 'make\\s+it\\s+(sound|feel)\\s+like|in\\s+the\\s+style\\s+of|transform\\s+into', negated: false }],
    confidence: 0.80,
    evidenceSource: 'keyword',
    description: 'Creative transformation language → creative-transform',
  },

  // === Fallback: default to change/direct-edit ===
  {
    id: 'SA-R999',
    priority: 999,
    category: 'change',
    subtype: 'direct-edit',
    triggers: [], // No triggers — always matches as fallback
    confidence: 0.50,
    evidenceSource: 'default',
    description: 'Default fallback → change/direct-edit',
  },
];


// =============================================================================
// Speech Act Effect Constraints
// =============================================================================

/**
 * Effect type that a speech act can produce.
 */
export type EffectType =
  | 'mutation'      // Changes project state
  | 'inspection'    // Reads project state (no mutation)
  | 'explanation'   // Produces text/visual explanation
  | 'undo-mutation' // Reverses a previous mutation
  | 'preview'       // Produces a preview (no commitment)
  | 'preference'    // Changes user preferences
  | 'navigation'    // Changes view/focus
  | 'dialogue'      // Affects dialogue state only
  | 'none';         // No effect (cancelled, etc.)

/**
 * Effect constraint: what effects a speech act category is allowed to produce.
 */
export interface EffectConstraint {
  readonly category: SpeechActCategory;
  readonly allowedEffects: readonly EffectType[];
  readonly forbiddenEffects: readonly EffectType[];
  readonly requiresConfirmation: boolean;
  readonly description: string;
}

/**
 * Effect constraints for each speech act category.
 *
 * This is a safety invariant: inspect actions MUST NOT produce mutations.
 */
export const SPEECH_ACT_EFFECT_CONSTRAINTS: readonly EffectConstraint[] = [
  {
    category: 'change',
    allowedEffects: ['mutation', 'preview'],
    forbiddenEffects: [],
    requiresConfirmation: false, // Depends on risk level
    description: 'Change acts produce mutations; may require confirmation for destructive edits.',
  },
  {
    category: 'inspect',
    allowedEffects: ['inspection', 'explanation'],
    forbiddenEffects: ['mutation', 'undo-mutation'],
    requiresConfirmation: false,
    description: 'Inspect acts MUST NOT produce mutations. Read-only.',
  },
  {
    category: 'explain',
    allowedEffects: ['explanation', 'inspection'],
    forbiddenEffects: ['mutation', 'undo-mutation'],
    requiresConfirmation: false,
    description: 'Explain acts produce text/visual output only.',
  },
  {
    category: 'undo-redo',
    allowedEffects: ['undo-mutation', 'mutation', 'inspection'],
    forbiddenEffects: [],
    requiresConfirmation: false, // Undo is inherently safe
    description: 'Undo/redo acts reverse or replay prior mutations.',
  },
  {
    category: 'propose',
    allowedEffects: ['preview', 'inspection', 'explanation'],
    forbiddenEffects: ['mutation'],
    requiresConfirmation: false,
    description: 'Propose acts produce previews without commitment.',
  },
  {
    category: 'configure',
    allowedEffects: ['preference'],
    forbiddenEffects: ['mutation'],
    requiresConfirmation: false,
    description: 'Configure acts change preferences, not project state.',
  },
  {
    category: 'navigate',
    allowedEffects: ['navigation'],
    forbiddenEffects: ['mutation'],
    requiresConfirmation: false,
    description: 'Navigate acts change view/focus only.',
  },
  {
    category: 'meta',
    allowedEffects: ['dialogue', 'none'],
    forbiddenEffects: ['mutation'],
    requiresConfirmation: false,
    description: 'Meta acts affect dialogue state only.',
  },
];

/**
 * Get effect constraints for a speech act category.
 */
export function getEffectConstraints(category: SpeechActCategory): EffectConstraint {
  const constraint = SPEECH_ACT_EFFECT_CONSTRAINTS.find(c => c.category === category);
  if (!constraint) {
    throw new Error(`No effect constraints defined for speech act category: ${category}`);
  }
  return constraint;
}

/**
 * Check if an effect type is allowed for a speech act category.
 */
export function isEffectAllowed(
  category: SpeechActCategory,
  effect: EffectType
): boolean {
  const constraints = getEffectConstraints(category);
  if (constraints.forbiddenEffects.includes(effect)) return false;
  if (constraints.allowedEffects.length > 0) {
    return constraints.allowedEffects.includes(effect);
  }
  return true;
}

/**
 * Validate that a speech act's intended effects don't violate constraints.
 */
export function validateSpeechActEffects(
  speechAct: SpeechAct,
  intendedEffects: readonly EffectType[]
): {
  readonly valid: boolean;
  readonly violations: readonly string[];
} {
  const constraints = getEffectConstraints(speechAct.category);
  const violations: string[] = [];

  for (const effect of intendedEffects) {
    if (constraints.forbiddenEffects.includes(effect)) {
      violations.push(
        `Speech act '${speechAct.category}/${speechAct.subtype}' forbids effect '${effect}'. ` +
        `${constraints.description}`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}


// =============================================================================
// Speech Act Intent Integration
// =============================================================================

/**
 * A CPL-Intent with an explicit speech act root.
 *
 * This extends the base CPLIntent by requiring a speech act.
 * The speech act determines compilation behavior.
 */
export interface SpeechActIntent {
  /** The classified speech act (root) */
  readonly speechAct: SpeechAct;

  /** The CPL-Intent tree */
  readonly intent: CPLIntent;

  /** Intended effects */
  readonly intendedEffects: readonly EffectType[];

  /** Effect validation result */
  readonly effectValidation: {
    readonly valid: boolean;
    readonly violations: readonly string[];
  };

  /** Whether this intent was auto-classified or user-confirmed */
  readonly classificationConfirmed: boolean;
}

/**
 * Create a SpeechActIntent from a classified speech act and CPL-Intent.
 */
export function createSpeechActIntent(
  speechAct: SpeechAct,
  intent: CPLIntent
): SpeechActIntent {
  // Infer intended effects from the speech act category
  const intendedEffects = inferIntendedEffects(speechAct);

  // Validate
  const effectValidation = validateSpeechActEffects(speechAct, intendedEffects);

  return {
    speechAct,
    intent,
    intendedEffects,
    effectValidation,
    classificationConfirmed: false,
  };
}

/**
 * Infer the intended effects from a speech act.
 */
export function inferIntendedEffects(speechAct: SpeechAct): EffectType[] {
  const categoryEffects: Record<SpeechActCategory, EffectType[]> = {
    'change': ['mutation'],
    'inspect': ['inspection'],
    'explain': ['explanation'],
    'undo-redo': ['undo-mutation'],
    'propose': ['preview'],
    'configure': ['preference'],
    'navigate': ['navigation'],
    'meta': ['dialogue'],
  };

  return categoryEffects[speechAct.category] ?? ['none'];
}


// =============================================================================
// Speech Act Classification Utilities
// =============================================================================

/**
 * Classify an utterance into a speech act (simplified rule-based classifier).
 *
 * This evaluates rules in priority order and returns the best match.
 * In a full system, this would also consider syntactic features and dialogue state.
 */
export function classifySpeechAct(
  utterance: string,
  dialogueState?: string,
  schemaVersion?: SemanticVersion
): SpeechAct {
  const version = schemaVersion ?? { major: 1, minor: 0, patch: 0 };
  const normalizedUtterance = utterance.toLowerCase().trim();

  const matches: Array<{
    rule: SpeechActRule;
    matchStrength: number;
  }> = [];

  for (const rule of SPEECH_ACT_RULES) {
    let allTriggersMatch = true;
    let totalStrength = 0;
    let triggerCount = 0;

    for (const trigger of rule.triggers) {
      const matched = evaluateTrigger(trigger, normalizedUtterance, dialogueState);
      if (trigger.negated ? matched : !matched) {
        allTriggersMatch = false;
        break;
      }
      totalStrength += 1;
      triggerCount++;
    }

    // Fallback rules (no triggers) always match
    if (allTriggersMatch) {
      matches.push({
        rule,
        matchStrength: triggerCount > 0 ? totalStrength / triggerCount : 0,
      });
    }
  }

  // Sort by priority (lower first), then by match strength (higher first)
  matches.sort((a, b) => {
    if (a.rule.priority !== b.rule.priority) return a.rule.priority - b.rule.priority;
    return b.matchStrength - a.matchStrength;
  });

  const best = matches[0];
  if (!best) {
    // Should never happen since we have a fallback rule
    return {
      id: 'sa-fallback',
      category: 'change',
      subtype: 'direct-edit',
      confidence: 0.5,
      alternatives: [],
      evidence: [{
        source: 'default',
        description: 'No rules matched; defaulting to change/direct-edit',
        strength: 0.5,
      }],
      inferenceMode: 'defaulted',
      schemaVersion: version,
    };
  }

  // Build alternatives from other matches
  const alternatives: SpeechActAlternative[] = matches.slice(1, 4).map(m => ({
    category: m.rule.category,
    subtype: m.rule.subtype,
    confidence: m.rule.confidence * m.matchStrength,
    reason: m.rule.description,
  }));

  return {
    id: `sa-${best.rule.id}`,
    category: best.rule.category,
    subtype: best.rule.subtype,
    confidence: best.rule.confidence,
    alternatives,
    evidence: [{
      source: best.rule.evidenceSource,
      description: best.rule.description,
      strength: best.rule.confidence,
    }],
    inferenceMode: best.rule.triggers.length > 0 ? 'inferred' : 'defaulted',
    inferenceSource: best.rule.id,
    schemaVersion: version,
  };
}

/**
 * Evaluate a single trigger against an utterance.
 */
function evaluateTrigger(
  trigger: SpeechActTrigger,
  utterance: string,
  dialogueState?: string
): boolean {
  switch (trigger.kind) {
    case 'keyword':
      return utterance.includes(trigger.value);

    case 'keyword-pattern':
      try {
        const regex = new RegExp(trigger.value, 'i');
        return regex.test(utterance);
      } catch {
        return false;
      }

    case 'syntax-feature':
      // Simplified: check for question marks, imperative patterns
      if (trigger.value === 'interrogative-wh-what') {
        return /^what\b/i.test(utterance);
      }
      if (trigger.value === 'interrogative-wh-why') {
        return /^why\b/i.test(utterance);
      }
      if (trigger.value === 'imperative') {
        // Simplified: first word is a verb-like token
        return /^(make|set|add|remove|delete|raise|lower|increase|decrease|change|put|move|turn|mute|solo|boost|cut)\b/i.test(utterance);
      }
      return false;

    case 'dialogue-state':
      return dialogueState === trigger.value;

    case 'negation-present':
      return /\b(not|don't|doesn't|no|never|without)\b/i.test(utterance);

    case 'pronoun-pattern':
      return new RegExp(trigger.value, 'i').test(utterance);

    case 'pos-pattern':
      // Would require POS tagger — skip in simplified version
      return false;

    default:
      return false;
  }
}


// =============================================================================
// Speech Act Formatting
// =============================================================================

/**
 * Format a speech act for display.
 */
export function formatSpeechAct(act: SpeechAct, indent = 0): string {
  const sp = ' '.repeat(indent);
  const lines: string[] = [];

  lines.push(`${sp}SpeechAct #${act.id}`);
  lines.push(`${sp}  Category: ${act.category}`);
  lines.push(`${sp}  Subtype: ${act.subtype}`);
  lines.push(`${sp}  Confidence: ${(act.confidence * 100).toFixed(0)}%`);
  lines.push(`${sp}  Inference: ${act.inferenceMode}`);

  if (act.evidence.length > 0) {
    lines.push(`${sp}  Evidence:`);
    for (const e of act.evidence) {
      lines.push(`${sp}    [${e.source}] ${e.description} (${(e.strength * 100).toFixed(0)}%)`);
    }
  }

  if (act.alternatives.length > 0) {
    lines.push(`${sp}  Alternatives:`);
    for (const alt of act.alternatives) {
      lines.push(`${sp}    ${alt.category}/${alt.subtype} (${(alt.confidence * 100).toFixed(0)}%): ${alt.reason}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a speech act as a compact one-liner.
 */
export function formatSpeechActCompact(act: SpeechAct): string {
  const conf = (act.confidence * 100).toFixed(0);
  const alts = act.alternatives.length > 0
    ? ` (+${act.alternatives.length} alts)`
    : '';
  return `[${act.category}/${act.subtype}] ${conf}%${alts} (${act.inferenceMode})`;
}

/**
 * Get a human-readable description of a speech act category.
 */
export function describeSpeechActCategory(category: SpeechActCategory): string {
  const descriptions: Record<SpeechActCategory, string> = {
    'change': 'Modify the project (edit, adjust, transform)',
    'inspect': 'Examine the project state (query, compare, analyze)',
    'explain': 'Get an explanation (why, how, what-if)',
    'undo-redo': 'Reverse or replay actions',
    'propose': 'Preview or suggest without committing',
    'configure': 'Change system settings or preferences',
    'navigate': 'Move focus within the project',
    'meta': 'Interact with the NL system (clarify, correct, cancel)',
  };
  return descriptions[category];
}

/**
 * Get the icon/badge for a speech act category (for UI).
 */
export function getSpeechActBadge(category: SpeechActCategory): string {
  const badges: Record<SpeechActCategory, string> = {
    'change': 'EDIT',
    'inspect': 'QUERY',
    'explain': 'EXPLAIN',
    'undo-redo': 'UNDO',
    'propose': 'PREVIEW',
    'configure': 'CONFIG',
    'navigate': 'NAV',
    'meta': 'META',
  };
  return badges[category];
}


// =============================================================================
// Speech Act Statistics
// =============================================================================

/**
 * Summary statistics for speech act classification coverage.
 */
export interface SpeechActRuleCoverage {
  readonly totalRules: number;
  readonly rulesByCategory: Readonly<Record<SpeechActCategory, number>>;
  readonly rulesByEvidenceSource: Readonly<Record<string, number>>;
  readonly averageConfidence: number;
  readonly priorityRange: readonly [number, number];
}

/**
 * Compute coverage statistics for the speech act rule set.
 */
export function computeRuleCoverage(): SpeechActRuleCoverage {
  const byCategory: Record<SpeechActCategory, number> = {
    'change': 0,
    'inspect': 0,
    'explain': 0,
    'undo-redo': 0,
    'propose': 0,
    'configure': 0,
    'navigate': 0,
    'meta': 0,
  };

  const bySource: Record<string, number> = {};
  let totalConfidence = 0;
  let minPriority = Infinity;
  let maxPriority = -Infinity;

  for (const rule of SPEECH_ACT_RULES) {
    byCategory[rule.category]++;
    bySource[rule.evidenceSource] = (bySource[rule.evidenceSource] ?? 0) + 1;
    totalConfidence += rule.confidence;
    minPriority = Math.min(minPriority, rule.priority);
    maxPriority = Math.max(maxPriority, rule.priority);
  }

  return {
    totalRules: SPEECH_ACT_RULES.length,
    rulesByCategory: byCategory,
    rulesByEvidenceSource: bySource,
    averageConfidence: SPEECH_ACT_RULES.length > 0
      ? totalConfidence / SPEECH_ACT_RULES.length
      : 0,
    priorityRange: [minPriority, maxPriority],
  };
}
