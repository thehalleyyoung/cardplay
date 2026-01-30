/**
 * GOFAI NL HCI — Grammar Authorship Workflow
 *
 * Establishes the workflow and PR checklist for adding new grammar rules,
 * lexemes, and vocabulary to the NL system. This ensures quality and
 * consistency when the vocabulary or grammar is extended.
 *
 * ## PR Checklist (enforced programmatically)
 *
 * When adding to the NL system, contributors must:
 *
 * 1. **Add lexeme**: Register the word in the canon vocabulary.
 * 2. **Add grammar rule**: Add or extend a grammar production rule.
 * 3. **Add golden tests**: Add at least 3 golden test utterances.
 * 4. **Add docs entry**: Update the glossary or docs.
 * 5. **Run regression**: Ensure no existing golden tests break.
 * 6. **Check ambiguity**: Verify the change doesn't introduce unintended ambiguity.
 *
 * @module gofai/nl/hci/grammar-authorship-workflow
 * @see gofai_goalA.md Step 150
 */

// =============================================================================
// PR CHECKLIST — Structured checklist for grammar changes
// =============================================================================

/**
 * A single checklist item.
 */
export interface ChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly required: boolean;
  readonly category: ChecklistCategory;
  readonly automatable: boolean;
  readonly automationScript: string | null;
  readonly verificationHint: string;
}

export type ChecklistCategory =
  | 'vocabulary'     // Lexeme / word registration
  | 'grammar'        // Grammar rule addition
  | 'testing'        // Test coverage
  | 'documentation'  // Docs updates
  | 'quality'        // Quality assurance
  | 'review';        // Human review

/**
 * The complete PR checklist for grammar changes.
 */
export const GRAMMAR_PR_CHECKLIST: readonly ChecklistItem[] = [
  // ─── VOCABULARY ────────────────────────────────────────────────────────
  {
    id: 'CL001',
    label: 'Register lexeme in canon vocabulary',
    description: 'Add the new word to the appropriate canon vocabulary file (e.g., domain-nouns, adjectives, edit-opcodes).',
    required: true,
    category: 'vocabulary',
    automatable: true,
    automationScript: 'scripts/check-lexeme-registered.ts',
    verificationHint: 'grep for the lexeme ID in src/gofai/canon/',
  },
  {
    id: 'CL002',
    label: 'Assign correct word class',
    description: 'Ensure the lexeme is tagged with the correct part-of-speech (noun, verb, adjective, etc.).',
    required: true,
    category: 'vocabulary',
    automatable: true,
    automationScript: 'scripts/check-word-class.ts',
    verificationHint: 'Verify wordClass field in the lexeme definition.',
  },
  {
    id: 'CL003',
    label: 'Add axis mapping (if adjective)',
    description: 'If the lexeme is an adjective, map it to at least one perceptual axis.',
    required: false,
    category: 'vocabulary',
    automatable: true,
    automationScript: 'scripts/check-axis-mapping.ts',
    verificationHint: 'Check ADJECTIVE_AXIS_DATABASE in degree-semantics.ts.',
  },
  {
    id: 'CL004',
    label: 'Add verb frame (if verb)',
    description: 'If the lexeme is a verb, define its argument structure (thematic roles, optionality).',
    required: false,
    category: 'vocabulary',
    automatable: true,
    automationScript: 'scripts/check-verb-frame.ts',
    verificationHint: 'Check VERB_FRAMES in imperative.ts.',
  },
  {
    id: 'CL005',
    label: 'Add selectional restrictions',
    description: 'If the lexeme constrains its arguments (e.g., "transpose" requires a pitched entity), add restrictions.',
    required: false,
    category: 'vocabulary',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check VERB_RESTRICTION_PROFILES in selectional-restrictions.ts.',
  },

  // ─── GRAMMAR RULES ────────────────────────────────────────────────────
  {
    id: 'CL006',
    label: 'Add or extend grammar rule',
    description: 'Add a new production rule or extend an existing one to handle the new lexeme.',
    required: true,
    category: 'grammar',
    automatable: false,
    automationScript: null,
    verificationHint: 'Verify the grammar file handles the new word in context.',
  },
  {
    id: 'CL007',
    label: 'Set rule priority',
    description: 'Assign an appropriate priority to the rule to avoid unintended ambiguity.',
    required: true,
    category: 'grammar',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check rule priority relative to similar rules.',
  },
  {
    id: 'CL008',
    label: 'Add semantic action',
    description: 'If the rule has a semantic action, ensure it produces the correct semantic representation.',
    required: false,
    category: 'grammar',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check semanticAction field and corresponding hook.',
  },

  // ─── TESTING ───────────────────────────────────────────────────────────
  {
    id: 'CL009',
    label: 'Add ≥ 3 golden test utterances',
    description: 'Add at least 3 utterances using the new word to the golden test suite.',
    required: true,
    category: 'testing',
    automatable: true,
    automationScript: 'scripts/check-golden-tests.ts',
    verificationHint: 'Check golden-utterances.test.ts for the new word.',
  },
  {
    id: 'CL010',
    label: 'Add paraphrase group (if applicable)',
    description: 'If the new word has synonyms, add a paraphrase group to paraphrase-invariance.test.ts.',
    required: false,
    category: 'testing',
    automatable: true,
    automationScript: 'scripts/check-paraphrase-group.ts',
    verificationHint: 'Check paraphrase-invariance.test.ts.',
  },
  {
    id: 'CL011',
    label: 'Run regression suite',
    description: 'Ensure no existing golden tests break.',
    required: true,
    category: 'testing',
    automatable: true,
    automationScript: 'npx vitest run golden-utterances',
    verificationHint: 'All golden tests should pass.',
  },
  {
    id: 'CL012',
    label: 'Run fuzz tests',
    description: 'Ensure the new word doesn\'t cause tokenizer crashes.',
    required: true,
    category: 'testing',
    automatable: true,
    automationScript: 'npx vitest run fuzz-tokenizer',
    verificationHint: 'All fuzz tests should pass.',
  },

  // ─── QUALITY ───────────────────────────────────────────────────────────
  {
    id: 'CL013',
    label: 'Check for ambiguity introduction',
    description: 'Verify the change doesn\'t introduce unintended ambiguity with existing vocabulary.',
    required: true,
    category: 'quality',
    automatable: true,
    automationScript: 'scripts/check-ambiguity-impact.ts',
    verificationHint: 'Check ambiguity-detection.test.ts for overlap.',
  },
  {
    id: 'CL014',
    label: 'Add clarification template (if ambiguous)',
    description: 'If the new word is inherently ambiguous, add a clarification template.',
    required: false,
    category: 'quality',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check clarification-templates.ts.',
  },
  {
    id: 'CL015',
    label: 'Verify pragmatic bias handling',
    description: 'If the word triggers pragmatic ambiguity, ensure the bias layer handles it.',
    required: false,
    category: 'quality',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check PRAGMATIC_HEURISTIC_DATABASE in pragmatic-bias.ts.',
  },
  {
    id: 'CL016',
    label: 'Check construction grammar patterns',
    description: 'If the word appears in idiomatic constructions, add to CONSTRUCTION_LIBRARY.',
    required: false,
    category: 'quality',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check construction-grammar.ts CONSTRUCTION_LIBRARY.',
  },

  // ─── DOCUMENTATION ────────────────────────────────────────────────────
  {
    id: 'CL017',
    label: 'Update glossary',
    description: 'Add the new term to docs/gofai/glossary.md.',
    required: true,
    category: 'documentation',
    automatable: true,
    automationScript: 'scripts/check-glossary-entry.ts',
    verificationHint: 'grep for the word in docs/gofai/glossary.md.',
  },
  {
    id: 'CL018',
    label: 'Add example usage in docs',
    description: 'Add at least one example of the word used in a sentence to the docs.',
    required: false,
    category: 'documentation',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check docs/ for usage examples.',
  },

  // ─── REVIEW ────────────────────────────────────────────────────────────
  {
    id: 'CL019',
    label: 'Peer review of linguistic analysis',
    description: 'Have a second person review the word class, axis mapping, and ambiguity analysis.',
    required: false,
    category: 'review',
    automatable: false,
    automationScript: null,
    verificationHint: 'Check PR approval status.',
  },
  {
    id: 'CL020',
    label: 'TypeScript compilation passes',
    description: 'Ensure npx tsc --noEmit has no errors.',
    required: true,
    category: 'review',
    automatable: true,
    automationScript: 'npx tsc --noEmit',
    verificationHint: 'No TypeScript errors.',
  },
];

// =============================================================================
// CHECKLIST EVALUATION — Programmatic checking
// =============================================================================

/**
 * A filled-in checklist item (completed or not).
 */
export interface ChecklistResponse {
  readonly itemId: string;
  readonly completed: boolean;
  readonly notes: string;
  readonly evidence: string | null;
}

/**
 * Result of evaluating a filled-in checklist.
 */
export interface ChecklistEvaluation {
  readonly allRequiredMet: boolean;
  readonly requiredComplete: number;
  readonly requiredTotal: number;
  readonly optionalComplete: number;
  readonly optionalTotal: number;
  readonly missingRequired: readonly ChecklistItem[];
  readonly missingOptional: readonly ChecklistItem[];
  readonly score: number;            // 0–1 completeness score
  readonly readyToMerge: boolean;
}

/**
 * Evaluate a set of checklist responses against the full checklist.
 */
export function evaluateChecklist(
  responses: readonly ChecklistResponse[],
): ChecklistEvaluation {
  const responseMap = new Map(responses.map(r => [r.itemId, r]));

  const required = GRAMMAR_PR_CHECKLIST.filter(item => item.required);
  const optional = GRAMMAR_PR_CHECKLIST.filter(item => !item.required);

  const missingRequired: ChecklistItem[] = [];
  const missingOptional: ChecklistItem[] = [];
  let requiredComplete = 0;
  let optionalComplete = 0;

  for (const item of required) {
    const response = responseMap.get(item.id);
    if (response?.completed) {
      requiredComplete++;
    } else {
      missingRequired.push(item);
    }
  }

  for (const item of optional) {
    const response = responseMap.get(item.id);
    if (response?.completed) {
      optionalComplete++;
    } else {
      missingOptional.push(item);
    }
  }

  const allRequiredMet = missingRequired.length === 0;
  const totalItems = GRAMMAR_PR_CHECKLIST.length;
  const completedItems = requiredComplete + optionalComplete;
  const score = totalItems > 0 ? completedItems / totalItems : 0;

  return {
    allRequiredMet,
    requiredComplete,
    requiredTotal: required.length,
    optionalComplete,
    optionalTotal: optional.length,
    missingRequired,
    missingOptional,
    score,
    readyToMerge: allRequiredMet,
  };
}

// =============================================================================
// WORKFLOW STEPS — Step-by-step authoring guide
// =============================================================================

/**
 * A workflow step for grammar authorship.
 */
export interface WorkflowStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly files: readonly string[];
  readonly checklistItems: readonly string[];
  readonly example: string;
}

/**
 * The grammar authorship workflow steps.
 */
export const GRAMMAR_AUTHORSHIP_STEPS: readonly WorkflowStep[] = [
  {
    stepNumber: 1,
    title: 'Define the lexeme',
    description: 'Add the new word to the appropriate canon vocabulary file.',
    files: [
      'src/gofai/canon/domain-nouns-*.ts',
      'src/gofai/canon/adjectives-*.ts',
      'src/gofai/canon/edit-opcodes-*.ts',
    ],
    checklistItems: ['CL001', 'CL002'],
    example: "Export a new entry: { id: createLexemeId('lexeme:shimmer'), wordClass: 'adjective', ... }",
  },
  {
    stepNumber: 2,
    title: 'Add semantic mapping',
    description: 'Map the word to perceptual axes, verb frames, or entity types.',
    files: [
      'src/gofai/nl/semantics/degree-semantics.ts',
      'src/gofai/nl/grammar/imperative.ts',
      'src/gofai/nl/semantics/selectional-restrictions.ts',
    ],
    checklistItems: ['CL003', 'CL004', 'CL005'],
    example: "Add to ADJECTIVE_AXIS_DATABASE: 'shimmer' → [{ axis: 'brightness', ... }, { axis: 'texture', ... }]",
  },
  {
    stepNumber: 3,
    title: 'Add or extend grammar rules',
    description: 'Ensure the parser can handle the new word in context.',
    files: [
      'src/gofai/nl/grammar/*.ts',
    ],
    checklistItems: ['CL006', 'CL007', 'CL008'],
    example: 'Add a rule: VP → "make" NP ADJ where ADJ includes the new word.',
  },
  {
    stepNumber: 4,
    title: 'Write tests',
    description: 'Add golden tests, paraphrase groups, and check for ambiguity.',
    files: [
      'src/gofai/nl/__tests__/golden-utterances.test.ts',
      'src/gofai/nl/__tests__/paraphrase-invariance.test.ts',
      'src/gofai/nl/__tests__/ambiguity-detection.test.ts',
    ],
    checklistItems: ['CL009', 'CL010', 'CL011', 'CL012', 'CL013'],
    example: 'Add: { id: "G101", input: "add some shimmer", ... }',
  },
  {
    stepNumber: 5,
    title: 'Handle ambiguity (if applicable)',
    description: 'If the word is ambiguous, add clarification templates and pragmatic heuristics.',
    files: [
      'src/gofai/nl/hci/clarification-templates.ts',
      'src/gofai/nl/semantics/pragmatic-bias.ts',
      'src/gofai/nl/semantics/construction-grammar.ts',
    ],
    checklistItems: ['CL014', 'CL015', 'CL016'],
    example: 'Add to CLARIFICATION_TEMPLATES: { pattern: "shimmer_ambiguity", question: "By shimmer do you mean...", ... }',
  },
  {
    stepNumber: 6,
    title: 'Update documentation',
    description: 'Add the term to the glossary and include usage examples.',
    files: [
      'docs/gofai/glossary.md',
    ],
    checklistItems: ['CL017', 'CL018'],
    example: 'Add glossary entry: **shimmer** — A high-frequency textural quality...',
  },
  {
    stepNumber: 7,
    title: 'Run full validation',
    description: 'Compile, run all tests, and verify no regressions.',
    files: [],
    checklistItems: ['CL011', 'CL012', 'CL020'],
    example: 'npx tsc --noEmit && npx vitest run',
  },
  {
    stepNumber: 8,
    title: 'Submit for review',
    description: 'Create a PR with the checklist filled in.',
    files: [],
    checklistItems: ['CL019'],
    example: 'gh pr create --title "vocab: add shimmer adjective" --body "$(cat checklist.md)"',
  },
];

// =============================================================================
// PR TEMPLATE — Markdown template for grammar PRs
// =============================================================================

/**
 * Generate a Markdown PR template for a grammar change.
 */
export function generatePRTemplate(
  wordBeingAdded: string,
  wordClass: string,
): string {
  const lines: string[] = [];

  lines.push(`## Grammar Change: Add "${wordBeingAdded}" (${wordClass})`);
  lines.push('');
  lines.push('### Summary');
  lines.push(`Adds the ${wordClass} "${wordBeingAdded}" to the NL vocabulary and grammar.`);
  lines.push('');
  lines.push('### Checklist');
  lines.push('');

  for (const item of GRAMMAR_PR_CHECKLIST) {
    const marker = item.required ? '- [ ]' : '- [ ] _(optional)_';
    lines.push(`${marker} **${item.label}** — ${item.description}`);
  }

  lines.push('');
  lines.push('### Test Results');
  lines.push('');
  lines.push('- [ ] `npx tsc --noEmit` passes');
  lines.push('- [ ] `npx vitest run golden-utterances` passes');
  lines.push('- [ ] `npx vitest run fuzz-tokenizer` passes');
  lines.push('- [ ] `npx vitest run paraphrase-invariance` passes');
  lines.push('- [ ] `npx vitest run ambiguity-detection` passes');
  lines.push('');
  lines.push('### Notes');
  lines.push('');
  lines.push('_Add any notes about ambiguity handling, edge cases, or design decisions._');

  return lines.join('\n');
}

// =============================================================================
// INDEX EXPORT — barrel file for HCI module
// =============================================================================

// (This file is exported from the hci/index.ts barrel)

// =============================================================================
// STATISTICS
// =============================================================================

export function getGrammarWorkflowStats(): {
  readonly checklistItemCount: number;
  readonly requiredItemCount: number;
  readonly optionalItemCount: number;
  readonly automatableCount: number;
  readonly workflowStepCount: number;
  readonly categoryCounts: ReadonlyMap<ChecklistCategory, number>;
} {
  const categoryCounts = new Map<ChecklistCategory, number>();
  let requiredCount = 0;
  let automatableCount = 0;

  for (const item of GRAMMAR_PR_CHECKLIST) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
    if (item.required) requiredCount++;
    if (item.automatable) automatableCount++;
  }

  return {
    checklistItemCount: GRAMMAR_PR_CHECKLIST.length,
    requiredItemCount: requiredCount,
    optionalItemCount: GRAMMAR_PR_CHECKLIST.length - requiredCount,
    automatableCount,
    workflowStepCount: GRAMMAR_AUTHORSHIP_STEPS.length,
    categoryCounts,
  };
}
