/**
 * GOFAI NL Grammar — Questions
 *
 * Implements grammar rules for interrogative utterances that map to
 * inspect/explain acts. Questions do not produce edit operations — they
 * produce queries against the project state or explanations of prior
 * edits.
 *
 * ## Question Types
 *
 * 1. **Wh-questions**: "what chords are in the chorus?", "where is the delay?"
 * 2. **Yes/no questions**: "is the reverb on?", "are the drums muted?"
 * 3. **How-questions**: "how loud is the bass?", "how many bars?"
 * 4. **Why-questions**: "why did you change that?", "why is it clipping?"
 * 5. **Can-questions**: "can I add reverb here?", "can you show me the EQ?"
 * 6. **Which-questions**: "which track has reverb?", "which chorus is louder?"
 * 7. **Alternative questions**: "is it reverb or delay?"
 * 8. **Tag questions**: "it's brighter, isn't it?", "that sounds better, right?"
 * 9. **Echo questions**: "you removed what?" (repeating for clarification)
 * 10. **Rhetorical questions**: "why would I change that?" (not expecting answer)
 *
 * ## Speech Acts
 *
 * Questions map to CPL speech acts:
 * - `inspect`: Request to show/display information
 * - `explain`: Request to explain reasoning or provenance
 * - `confirm`: Request for yes/no confirmation
 * - `compare`: Request to compare alternatives
 * - `enumerate`: Request to list matching entities
 * - `measure`: Request to measure/quantify a property
 * - `identify`: Request to identify/name an entity
 * - `capability`: Request about system capabilities
 *
 * ## Design
 *
 * Questions are safe by definition — they cannot mutate state. The
 * type system enforces this: `inspect` speech acts cannot compile
 * to mutation actions (Step 182).
 *
 * @module gofai/nl/grammar/questions
 * @see gofai_goalA.md Step 119
 * @see gofai_goalA.md Step 153 (SpeechAct types)
 * @see gofai_goalA.md Step 182 (effect checker)
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// QUESTION PARSE RESULT — output of question parsing
// =============================================================================

/**
 * A parsed question.
 */
export interface ParsedQuestion {
  /** Unique ID for tracking */
  readonly questionId: string;

  /** The question type */
  readonly type: QuestionType;

  /** The speech act this question maps to */
  readonly speechAct: QuestionSpeechAct;

  /** The wh-word or question trigger */
  readonly trigger: QuestionTrigger;

  /** What the question is about (the focus) */
  readonly focus: QuestionFocus;

  /** The scope/context of the question */
  readonly scope: QuestionScope | undefined;

  /** Whether this is a rhetorical question (not expecting answer) */
  readonly rhetorical: boolean;

  /** Whether this is an echo question (repeating for clarification) */
  readonly echo: boolean;

  /** Polarity: positive or negative */
  readonly polarity: QuestionPolarity;

  /** Surface text */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** Confidence in the parse */
  readonly confidence: number;

  /** Warnings */
  readonly warnings: readonly QuestionWarning[];
}

// =============================================================================
// QUESTION TYPES
// =============================================================================

/**
 * Types of questions.
 */
export type QuestionType =
  | 'wh_what'          // "what chords are in the chorus?"
  | 'wh_where'         // "where is the delay?"
  | 'wh_when'          // "when does the chorus start?"
  | 'wh_which'         // "which track has reverb?"
  | 'wh_who'           // "who played this?" (metadata)
  | 'how_quality'      // "how does this sound?"
  | 'how_quantity'     // "how loud is the bass?"
  | 'how_many'         // "how many bars in the chorus?"
  | 'how_much'         // "how much reverb is there?"
  | 'how_method'       // "how do I add reverb?"
  | 'why'              // "why did you change that?"
  | 'yes_no'           // "is the reverb on?"
  | 'alternative'      // "is it reverb or delay?"
  | 'tag'              // "it's brighter, isn't it?"
  | 'echo'             // "you removed what?"
  | 'rhetorical'       // "why would I do that?"
  | 'confirmation';    // "did you mean the chorus?"

/**
 * Speech acts that questions map to.
 */
export type QuestionSpeechAct =
  | 'inspect'          // Show/display information
  | 'explain'          // Explain reasoning or provenance
  | 'confirm'          // Confirm yes/no
  | 'compare'          // Compare alternatives
  | 'enumerate'        // List matching entities
  | 'measure'          // Quantify a property
  | 'identify'         // Name/identify an entity
  | 'capability'       // Ask about capabilities
  | 'guide'            // Request help/tutorial
  | 'clarify';         // Clarification request

/**
 * The question trigger (what word/phrase initiated it).
 */
export interface QuestionTrigger {
  /** The trigger word/phrase */
  readonly word: string;

  /** Span in the input */
  readonly span: Span;

  /** The trigger type */
  readonly type: QuestionTriggerType;
}

/**
 * Types of question triggers.
 */
export type QuestionTriggerType =
  | 'wh_word'          // "what", "where", "when", etc.
  | 'auxiliary_inversion' // "is", "are", "can", "does"
  | 'tag'              // "isn't it", "right?"
  | 'rising_intonation' // Detected from "?" punctuation
  | 'how'              // "how"
  | 'why'              // "why"
  | 'which'            // "which"
  | 'echo_marker';     // Stress/focus on questioned element

// =============================================================================
// QUESTION FOCUS — what the question is about
// =============================================================================

/**
 * The focus of a question: what information is being requested.
 */
export interface QuestionFocus {
  /** The type of information requested */
  readonly infoType: QuestionInfoType;

  /** The entity or property being asked about */
  readonly target: string;

  /** Entity type constraints (if any) */
  readonly entityTypes: readonly string[];

  /** Whether the focus is on a property vs entity */
  readonly focusOn: 'property' | 'entity' | 'state' | 'reason' | 'method';

  /** Span in the input */
  readonly span: Span;
}

/**
 * Types of information a question can request.
 */
export type QuestionInfoType =
  | 'identity'         // What is it? / Which one?
  | 'location'         // Where is it?
  | 'time'             // When does it happen?
  | 'count'            // How many?
  | 'amount'           // How much?
  | 'quality'          // How does it sound? / What quality?
  | 'state'            // Is it on/off? / What state?
  | 'reason'           // Why was this done?
  | 'method'           // How to do something?
  | 'comparison'       // Which is more X?
  | 'existence'        // Is there a...? / Does it have...?
  | 'content'          // What is in/on/at...?
  | 'capability'       // Can the system do...?
  | 'preference'       // What does the user prefer?
  | 'history';         // What was done before?

// =============================================================================
// QUESTION SCOPE — where is the question about
// =============================================================================

/**
 * The scope/context that the question applies to.
 */
export interface QuestionScope {
  /** The scope description */
  readonly description: string;

  /** Span in the input */
  readonly span: Span;

  /** Entity type of the scope */
  readonly entityType: string | undefined;
}

/**
 * Polarity of the question.
 */
export type QuestionPolarity = 'positive' | 'negative';

// =============================================================================
// QUESTION WARNINGS
// =============================================================================

/**
 * Warning about a question parse.
 */
export interface QuestionWarning {
  readonly code: QuestionWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes for question parsing.
 */
export type QuestionWarningCode =
  | 'ambiguous_question_type'     // Could be multiple question types
  | 'implicit_question'           // Statement with "?" (implied question)
  | 'rhetorical_detected'         // Appears rhetorical; may not need answer
  | 'scope_unresolved'            // Question scope needs resolution
  | 'echo_detected'               // Echo question; user may be confused
  | 'complex_question'            // Multiple questions in one
  | 'presupposition_failure'      // "why did you X" but X didn't happen
  | 'capability_question';        // Asking about capabilities, not music

// =============================================================================
// QUESTION TRIGGER LEXICON
// =============================================================================

/**
 * A question trigger entry in the lexicon.
 */
export interface QuestionTriggerEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** The question type this trigger produces */
  readonly questionType: QuestionType;

  /** The speech act this maps to */
  readonly speechAct: QuestionSpeechAct;

  /** The trigger type */
  readonly triggerType: QuestionTriggerType;

  /** The info type being requested */
  readonly infoType: QuestionInfoType;

  /** What the focus is on */
  readonly focusOn: 'property' | 'entity' | 'state' | 'reason' | 'method';

  /** Whether this trigger starts a question */
  readonly isStarter: boolean;

  /** Priority */
  readonly priority: number;

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * All recognized question trigger entries.
 */
export const QUESTION_TRIGGER_ENTRIES: readonly QuestionTriggerEntry[] = [
  // ---------------------------------------------------------------------------
  // WH-word triggers
  // ---------------------------------------------------------------------------
  {
    forms: ['what', 'what is', 'what are', "what's"],
    questionType: 'wh_what',
    speechAct: 'inspect',
    triggerType: 'wh_word',
    infoType: 'identity',
    focusOn: 'entity',
    isStarter: true,
    priority: 15,
    examples: ['what chords are in the chorus?', 'what is this track?', "what's playing?"],
    description: 'Wh-question asking for identity or content',
  },
  {
    forms: ['what kind of', 'what type of', 'what sort of'],
    questionType: 'wh_what',
    speechAct: 'identify',
    triggerType: 'wh_word',
    infoType: 'identity',
    focusOn: 'property',
    isStarter: true,
    priority: 16,
    examples: ['what kind of reverb is this?', 'what type of scale?'],
    description: 'Wh-question asking for type/classification',
  },
  {
    forms: ['where', 'where is', 'where are', "where's"],
    questionType: 'wh_where',
    speechAct: 'inspect',
    triggerType: 'wh_word',
    infoType: 'location',
    focusOn: 'entity',
    isStarter: true,
    priority: 14,
    examples: ['where is the delay?', 'where are the drums?', "where's the EQ?"],
    description: 'Wh-question asking for location',
  },
  {
    forms: ['when', 'when does', 'when do', 'when is'],
    questionType: 'wh_when',
    speechAct: 'inspect',
    triggerType: 'wh_word',
    infoType: 'time',
    focusOn: 'property',
    isStarter: true,
    priority: 14,
    examples: ['when does the chorus start?', 'when do the drums come in?'],
    description: 'Wh-question asking for time/position',
  },
  {
    forms: ['which', 'which one', 'which ones'],
    questionType: 'wh_which',
    speechAct: 'identify',
    triggerType: 'which',
    infoType: 'identity',
    focusOn: 'entity',
    isStarter: true,
    priority: 14,
    examples: ['which track has reverb?', 'which chorus is louder?', 'which one?'],
    description: 'Which-question asking for selection from set',
  },
  {
    forms: ['who', 'who is', "who's"],
    questionType: 'wh_who',
    speechAct: 'identify',
    triggerType: 'wh_word',
    infoType: 'identity',
    focusOn: 'entity',
    isStarter: true,
    priority: 10,
    examples: ['who played this?', 'who made this preset?'],
    description: 'Who-question (metadata/attribution)',
  },

  // ---------------------------------------------------------------------------
  // How-triggers
  // ---------------------------------------------------------------------------
  {
    forms: ['how', 'how does', 'how do'],
    questionType: 'how_quality',
    speechAct: 'inspect',
    triggerType: 'how',
    infoType: 'quality',
    focusOn: 'property',
    isStarter: true,
    priority: 12,
    examples: ['how does this sound?', 'how do the drums feel?'],
    description: 'How-question asking about quality',
  },
  {
    forms: ['how loud', 'how bright', 'how warm', 'how wide', 'how fast',
            'how slow', 'how long', 'how short', 'how high', 'how low',
            'how deep', 'how tight', 'how much'],
    questionType: 'how_quantity',
    speechAct: 'measure',
    triggerType: 'how',
    infoType: 'amount',
    focusOn: 'property',
    isStarter: true,
    priority: 16,
    examples: ['how loud is the bass?', 'how bright is this track?', 'how much reverb?'],
    description: 'How+adjective question asking for measurement',
  },
  {
    forms: ['how many'],
    questionType: 'how_many',
    speechAct: 'measure',
    triggerType: 'how',
    infoType: 'count',
    focusOn: 'property',
    isStarter: true,
    priority: 16,
    examples: ['how many bars in the chorus?', 'how many tracks?'],
    description: 'How many question asking for count',
  },
  {
    forms: ['how do i', 'how can i', 'how to', 'how would i'],
    questionType: 'how_method',
    speechAct: 'guide',
    triggerType: 'how',
    infoType: 'method',
    focusOn: 'method',
    isStarter: true,
    priority: 15,
    examples: ['how do I add reverb?', 'how can I change the tempo?', 'how to EQ bass?'],
    description: 'How-to question asking for method/tutorial',
  },

  // ---------------------------------------------------------------------------
  // Why-triggers
  // ---------------------------------------------------------------------------
  {
    forms: ['why', 'why did', 'why does', 'why do', 'why is', 'why are',
            'why was', 'why were'],
    questionType: 'why',
    speechAct: 'explain',
    triggerType: 'why',
    infoType: 'reason',
    focusOn: 'reason',
    isStarter: true,
    priority: 14,
    examples: ['why did you change that?', 'why is it clipping?', 'why does it sound muddy?'],
    description: 'Why-question asking for explanation/reasoning',
  },
  {
    forms: ['what caused', 'what made', 'what happened'],
    questionType: 'why',
    speechAct: 'explain',
    triggerType: 'wh_word',
    infoType: 'reason',
    focusOn: 'reason',
    isStarter: true,
    priority: 13,
    examples: ['what caused the clipping?', 'what made it brighter?', 'what happened to the bass?'],
    description: 'Causal question asking for explanation',
  },

  // ---------------------------------------------------------------------------
  // Yes/no triggers (auxiliary inversion)
  // ---------------------------------------------------------------------------
  {
    forms: ['is', 'are', 'was', 'were'],
    questionType: 'yes_no',
    speechAct: 'confirm',
    triggerType: 'auxiliary_inversion',
    infoType: 'state',
    focusOn: 'state',
    isStarter: true,
    priority: 10,
    examples: ['is the reverb on?', 'are the drums muted?', 'was it changed?'],
    description: 'Yes/no question via be-inversion',
  },
  {
    forms: ['does', 'do', 'did'],
    questionType: 'yes_no',
    speechAct: 'confirm',
    triggerType: 'auxiliary_inversion',
    infoType: 'existence',
    focusOn: 'state',
    isStarter: true,
    priority: 10,
    examples: ['does it have reverb?', 'do the drums sound right?', 'did you change the key?'],
    description: 'Yes/no question via do-support',
  },
  {
    forms: ['can i', 'could i', 'may i', 'am i able to'],
    questionType: 'yes_no',
    speechAct: 'capability',
    triggerType: 'auxiliary_inversion',
    infoType: 'capability',
    focusOn: 'state',
    isStarter: true,
    priority: 12,
    examples: ['can I add reverb here?', 'could I change the key?', 'may I delete this?'],
    description: 'Capability/permission question',
  },
  {
    forms: ['is there', 'are there', 'is there a', 'are there any'],
    questionType: 'yes_no',
    speechAct: 'inspect',
    triggerType: 'auxiliary_inversion',
    infoType: 'existence',
    focusOn: 'entity',
    isStarter: true,
    priority: 14,
    examples: ['is there reverb on this track?', 'are there any effects?'],
    description: 'Existential question',
  },
  {
    forms: ['has', 'have'],
    questionType: 'yes_no',
    speechAct: 'confirm',
    triggerType: 'auxiliary_inversion',
    infoType: 'state',
    focusOn: 'state',
    isStarter: true,
    priority: 8,
    examples: ['has it changed?', 'have the drums been muted?'],
    description: 'Yes/no question via have-inversion',
  },

  // ---------------------------------------------------------------------------
  // Tag question triggers
  // ---------------------------------------------------------------------------
  {
    forms: ["isn't it", "aren't they", "don't you think", "right",
            "correct", "yeah", "no"],
    questionType: 'tag',
    speechAct: 'confirm',
    triggerType: 'tag',
    infoType: 'state',
    focusOn: 'state',
    isStarter: false,
    priority: 8,
    examples: ["it sounds better, right?", "that's brighter, isn't it?"],
    description: 'Tag question seeking confirmation',
  },

  // ---------------------------------------------------------------------------
  // Alternative question triggers
  // ---------------------------------------------------------------------------
  {
    forms: ['or'],
    questionType: 'alternative',
    speechAct: 'compare',
    triggerType: 'wh_word',
    infoType: 'comparison',
    focusOn: 'entity',
    isStarter: false,
    priority: 6,
    examples: ['is it reverb or delay?', 'should I boost or cut?'],
    description: 'Alternative question (requires "?" context)',
  },

  // ---------------------------------------------------------------------------
  // Meta-question triggers
  // ---------------------------------------------------------------------------
  {
    forms: ['tell me about', 'show me', 'explain', 'describe'],
    questionType: 'wh_what',
    speechAct: 'inspect',
    triggerType: 'wh_word',
    infoType: 'content',
    focusOn: 'entity',
    isStarter: true,
    priority: 12,
    examples: ['tell me about the chorus', 'show me the EQ', 'explain the chord progression'],
    description: 'Imperative-form question/inspection request',
  },
  {
    forms: ['what did you', 'what have you', 'what was'],
    questionType: 'why',
    speechAct: 'explain',
    triggerType: 'wh_word',
    infoType: 'history',
    focusOn: 'reason',
    isStarter: true,
    priority: 14,
    examples: ['what did you change?', 'what have you done?', 'what was changed?'],
    description: 'History question about past actions',
  },
];

// =============================================================================
// QUESTION TRIGGER LOOKUP INDEX
// =============================================================================

/**
 * Index: surface form → question trigger entries.
 */
const questionTriggerIndex: ReadonlyMap<string, readonly QuestionTriggerEntry[]> = (() => {
  const index = new Map<string, QuestionTriggerEntry[]>();
  for (const entry of QUESTION_TRIGGER_ENTRIES) {
    for (const form of entry.forms) {
      const lower = form.toLowerCase();
      const existing = index.get(lower);
      if (existing) {
        existing.push(entry);
      } else {
        index.set(lower, [entry]);
      }
    }
  }
  for (const entries of index.values()) {
    entries.sort((a, b) => b.priority - a.priority);
  }
  return index;
})();

/**
 * Look up question trigger entries by surface form.
 */
export function lookupQuestionTrigger(form: string): readonly QuestionTriggerEntry[] {
  return questionTriggerIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Check if a word/phrase is a known question trigger.
 */
export function isQuestionTrigger(word: string): boolean {
  return questionTriggerIndex.has(word.toLowerCase());
}

/**
 * Get all known question trigger forms.
 */
export function getAllQuestionTriggerForms(): readonly string[] {
  return Array.from(questionTriggerIndex.keys());
}

/**
 * Check if a word could start a question.
 */
export function couldStartQuestion(word: string): boolean {
  const lower = word.toLowerCase();
  const starters = new Set([
    'what', 'where', 'when', 'which', 'who', 'how', 'why',
    'is', 'are', 'was', 'were', 'does', 'do', 'did',
    'can', 'could', 'may', 'has', 'have',
    'tell', 'show', 'explain', 'describe',
  ]);
  return starters.has(lower) || questionTriggerIndex.has(lower);
}

// =============================================================================
// QUESTION DETECTION — finding questions in token sequences
// =============================================================================

/**
 * Result of scanning for questions.
 */
export interface QuestionScan {
  /** Detected questions */
  readonly questions: readonly DetectedQuestion[];

  /** Whether any questions were found */
  readonly hasQuestions: boolean;

  /** Whether there's a question mark in the input */
  readonly hasQuestionMark: boolean;
}

/**
 * A detected question in the input.
 */
export interface DetectedQuestion {
  /** Token index where the question trigger starts */
  readonly startTokenIndex: number;

  /** Token index where the question trigger ends (exclusive) */
  readonly endTokenIndex: number;

  /** The matched trigger entry */
  readonly entry: QuestionTriggerEntry;

  /** The surface text */
  readonly surface: string;

  /** The remainder of the sentence (what comes after the trigger) */
  readonly remainder: string;

  /** Whether a question mark was found */
  readonly hasQuestionMark: boolean;

  /** Confidence */
  readonly confidence: number;
}

/**
 * Scan a lowercased word sequence for questions.
 */
export function scanForQuestions(words: readonly string[]): QuestionScan {
  const questions: DetectedQuestion[] = [];
  const hasQuestionMark = words.includes('?');

  for (let i = 0; i < words.length; i++) {
    // Skip words already consumed
    if (questions.some(q => i >= q.startTokenIndex && i < q.endTokenIndex)) {
      continue;
    }

    // Try multi-word triggers first (longer first)
    let matched = false;
    for (let len = Math.min(5, words.length - i); len >= 1; len--) {
      const candidate = words.slice(i, i + len).join(' ').toLowerCase();
      const entries = lookupQuestionTrigger(candidate);

      if (entries.length > 0) {
        const entry = entries[0]!;

        // Only match starter triggers at position 0 (or non-starters anywhere)
        if (entry.isStarter && i > 0 && !hasQuestionMark) continue;
        if (!entry.isStarter && i === 0) continue;

        const remainder = words.slice(i + len).join(' ');

        // Boost confidence if there's a question mark
        let confidence = entry.priority >= 14 ? 0.85 : 0.7;
        if (hasQuestionMark) confidence += 0.1;
        if (!entry.isStarter && !hasQuestionMark) confidence -= 0.2;

        questions.push({
          startTokenIndex: i,
          endTokenIndex: i + len,
          entry,
          surface: candidate,
          remainder,
          hasQuestionMark,
          confidence: Math.max(0, Math.min(1, confidence)),
        });

        matched = true;
        break;
      }
    }

    if (matched) continue;
  }

  // If no triggers found but there's a question mark, treat as implicit question
  if (questions.length === 0 && hasQuestionMark) {
    questions.push({
      startTokenIndex: 0,
      endTokenIndex: words.indexOf('?'),
      entry: {
        forms: ['?'],
        questionType: 'yes_no',
        speechAct: 'confirm',
        triggerType: 'rising_intonation',
        infoType: 'state',
        focusOn: 'state',
        isStarter: false,
        priority: 5,
        examples: ['make it brighter?'],
        description: 'Implicit question from question mark',
      },
      surface: words.filter(w => w !== '?').join(' '),
      remainder: '',
      hasQuestionMark: true,
      confidence: 0.5,
    });
  }

  return {
    questions,
    hasQuestions: questions.length > 0,
    hasQuestionMark,
  };
}

// =============================================================================
// PARSED QUESTION BUILDER
// =============================================================================

let questionIdCounter = 0;

/**
 * Reset the question ID counter (for testing).
 */
export function resetQuestionIdCounter(): void {
  questionIdCounter = 0;
}

/**
 * Build a ParsedQuestion from a DetectedQuestion.
 */
export function buildParsedQuestion(
  detected: DetectedQuestion,
  inputSpan: Span,
): ParsedQuestion {
  const questionId = `q-${++questionIdCounter}`;
  const entry = detected.entry;
  const warnings: QuestionWarning[] = [];

  // Build focus
  const focus: QuestionFocus = {
    infoType: entry.infoType,
    target: detected.remainder.trim(),
    entityTypes: [],
    focusOn: entry.focusOn,
    span: inputSpan,
  };

  // Detect rhetorical questions
  const rhetorical = entry.questionType === 'why' &&
    (detected.surface.includes('would i') || detected.surface.includes('would you'));
  if (rhetorical) {
    warnings.push({
      code: 'rhetorical_detected',
      message: `"${detected.surface}" appears rhetorical — may not need an answer`,
      span: inputSpan,
    });
  }

  // Detect implicit questions (statement + "?")
  if (entry.triggerType === 'rising_intonation') {
    warnings.push({
      code: 'implicit_question',
      message: 'Question detected from "?" punctuation — interpret as confirmation request',
      span: inputSpan,
    });
  }

  return {
    questionId,
    type: entry.questionType,
    speechAct: entry.speechAct,
    trigger: {
      word: detected.surface,
      span: inputSpan,
      type: entry.triggerType,
    },
    focus,
    scope: undefined,
    rhetorical,
    echo: entry.questionType === 'echo',
    polarity: 'positive',
    surface: detected.surface + (detected.remainder ? ' ' + detected.remainder : ''),
    span: inputSpan,
    confidence: detected.confidence,
    warnings,
  };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a ParsedQuestion for display.
 */
export function formatParsedQuestion(q: ParsedQuestion): string {
  const lines: string[] = [];
  lines.push(`[${q.questionId}] ${q.type}: "${q.surface}"`);
  lines.push(`  Speech act: ${q.speechAct}`);
  lines.push(`  Trigger: "${q.trigger.word}" (${q.trigger.type})`);
  lines.push(`  Focus: ${q.focus.infoType} on ${q.focus.focusOn}`);
  if (q.focus.target) {
    lines.push(`  Target: "${q.focus.target}"`);
  }
  if (q.scope) {
    lines.push(`  Scope: "${q.scope.description}"`);
  }
  if (q.rhetorical) {
    lines.push('  Rhetorical: yes');
  }
  lines.push(`  Polarity: ${q.polarity}`);
  lines.push(`  Confidence: ${(q.confidence * 100).toFixed(0)}%`);
  for (const w of q.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }
  return lines.join('\n');
}

/**
 * Format a QuestionScan for display.
 */
export function formatQuestionScan(scan: QuestionScan): string {
  if (!scan.hasQuestions) return 'No questions detected.';

  const lines: string[] = [];
  lines.push(`Questions found: ${scan.questions.length}`);
  lines.push(`Has question mark: ${scan.hasQuestionMark}`);
  lines.push('');

  for (const q of scan.questions) {
    lines.push(`  [${q.startTokenIndex}-${q.endTokenIndex}] ` +
      `${q.entry.questionType}: "${q.surface}"`);
    lines.push(`    Speech act: ${q.entry.speechAct}`);
    lines.push(`    Info type: ${q.entry.infoType}`);
    lines.push(`    Remainder: "${q.remainder}"`);
    lines.push(`    Confidence: ${(q.confidence * 100).toFixed(0)}%`);
  }

  return lines.join('\n');
}

/**
 * Format all question trigger entries by type.
 */
export function formatAllQuestionTriggers(): string {
  const sections: string[] = [];
  const types = [...new Set(QUESTION_TRIGGER_ENTRIES.map(e => e.questionType))];

  for (const type of types) {
    const entries = QUESTION_TRIGGER_ENTRIES.filter(e => e.questionType === type);
    sections.push(`\n=== ${type.toUpperCase()} ===`);
    for (const entry of entries) {
      sections.push(`  ${entry.forms.join('/')} → ${entry.speechAct} (${entry.infoType})`);
    }
  }

  return sections.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the question grammar.
 */
export function getQuestionStats(): QuestionStats {
  const typeCounts = new Map<QuestionType, number>();
  const speechActCounts = new Map<QuestionSpeechAct, number>();
  let totalForms = 0;

  for (const entry of QUESTION_TRIGGER_ENTRIES) {
    typeCounts.set(entry.questionType, (typeCounts.get(entry.questionType) ?? 0) + 1);
    speechActCounts.set(entry.speechAct, (speechActCounts.get(entry.speechAct) ?? 0) + 1);
    totalForms += entry.forms.length;
  }

  return {
    totalEntries: QUESTION_TRIGGER_ENTRIES.length,
    totalForms,
    typeCounts: Object.fromEntries(typeCounts) as Record<QuestionType, number>,
    speechActCounts: Object.fromEntries(speechActCounts) as Record<QuestionSpeechAct, number>,
  };
}

/**
 * Statistics about the question grammar.
 */
export interface QuestionStats {
  readonly totalEntries: number;
  readonly totalForms: number;
  readonly typeCounts: Record<string, number>;
  readonly speechActCounts: Record<string, number>;
}

// =============================================================================
// GRAMMAR RULES
// =============================================================================

/**
 * Generate grammar rules for questions.
 */
export function generateQuestionGrammarRules(): readonly QuestionGrammarRule[] {
  return [
    {
      id: 'q-001',
      lhs: 'Question',
      rhsDescription: 'WhWord NounPhrase Verb PrepPhrase "?"',
      producesType: 'wh_what',
      priority: 15,
      semanticAction: 'sem:question:wh',
      examples: ['what chords are in the chorus?', 'what effects are on the drums?'],
    },
    {
      id: 'q-002',
      lhs: 'Question',
      rhsDescription: 'AuxVerb NounPhrase Adjective "?"',
      producesType: 'yes_no',
      priority: 12,
      semanticAction: 'sem:question:yn',
      examples: ['is the reverb on?', 'are the drums muted?'],
    },
    {
      id: 'q-003',
      lhs: 'Question',
      rhsDescription: '"how" Adjective "is"/"are" NounPhrase "?"',
      producesType: 'how_quantity',
      priority: 16,
      semanticAction: 'sem:question:how_adj',
      examples: ['how loud is the bass?', 'how bright is this track?'],
    },
    {
      id: 'q-004',
      lhs: 'Question',
      rhsDescription: '"how many" NounPhrase PrepPhrase "?"',
      producesType: 'how_many',
      priority: 16,
      semanticAction: 'sem:question:how_many',
      examples: ['how many bars in the chorus?', 'how many tracks?'],
    },
    {
      id: 'q-005',
      lhs: 'Question',
      rhsDescription: '"why" AuxVerb NounPhrase VerbPhrase "?"',
      producesType: 'why',
      priority: 14,
      semanticAction: 'sem:question:why',
      examples: ['why did you change that?', 'why is it clipping?'],
    },
    {
      id: 'q-006',
      lhs: 'Question',
      rhsDescription: '"how do i" VerbPhrase "?"',
      producesType: 'how_method',
      priority: 15,
      semanticAction: 'sem:question:how_to',
      examples: ['how do I add reverb?', 'how do I change the tempo?'],
    },
    {
      id: 'q-007',
      lhs: 'Question',
      rhsDescription: '"which" NounPhrase VerbPhrase "?"',
      producesType: 'wh_which',
      priority: 14,
      semanticAction: 'sem:question:which',
      examples: ['which track has reverb?', 'which chorus is louder?'],
    },
    {
      id: 'q-008',
      lhs: 'Question',
      rhsDescription: 'Statement Tag "?"',
      producesType: 'tag',
      priority: 8,
      semanticAction: 'sem:question:tag',
      examples: ["it sounds better, right?", "that's brighter, isn't it?"],
    },
    {
      id: 'q-009',
      lhs: 'Question',
      rhsDescription: '"can i" VerbPhrase "?"',
      producesType: 'yes_no',
      priority: 12,
      semanticAction: 'sem:question:capability',
      examples: ['can I add reverb here?', 'can I undo that?'],
    },
    {
      id: 'q-010',
      lhs: 'Question',
      rhsDescription: 'InspectVerb NounPhrase',
      producesType: 'wh_what',
      priority: 12,
      semanticAction: 'sem:question:inspect_imperative',
      examples: ['show me the EQ', 'tell me about the chorus', 'explain the changes'],
    },
  ];
}

/**
 * A grammar rule for questions.
 */
export interface QuestionGrammarRule {
  readonly id: string;
  readonly lhs: string;
  readonly rhsDescription: string;
  readonly producesType: QuestionType;
  readonly priority: number;
  readonly semanticAction: string;
  readonly examples: readonly string[];
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const QUESTION_GRAMMAR_RULES = [
  'Rule Q-001: Wh-questions ("what", "where", "when", "which", "who") produce ' +
  'inspect or identify speech acts. They cannot produce mutation actions.',

  'Rule Q-002: How-questions split into quality ("how does it sound?"), ' +
  'quantity ("how loud?"), count ("how many?"), and method ("how do I?").',

  'Rule Q-003: Why-questions produce explain speech acts that trace the ' +
  'provenance of prior edits or current state.',

  'Rule Q-004: Yes/no questions via auxiliary inversion ("is", "does", "can") ' +
  'produce confirm speech acts.',

  'Rule Q-005: Tag questions ("right?", "isn\'t it?") are confirmation ' +
  'requests and have the lowest confidence.',

  'Rule Q-006: Imperative-form inspection requests ("show me", "tell me about") ' +
  'are treated as questions, not commands. They produce inspect acts.',

  'Rule Q-007: A question mark on a statement ("make it brighter?") creates an ' +
  'implicit confirmation question: "should I make it brighter?".',

  'Rule Q-008: Rhetorical questions ("why would I do that?") are detected and ' +
  'flagged. They may not need an answer.',

  'Rule Q-009: All questions are safe: they produce non-mutating speech acts. ' +
  'The type system (CPL effect checker) enforces this invariant.',

  'Rule Q-010: Capability questions ("can I add reverb here?") check system ' +
  'capabilities and board gating before answering.',
] as const;
