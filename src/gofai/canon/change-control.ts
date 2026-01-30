/**
 * Change-Control Rules for GOFAI Vocabulary and Grammar
 *
 * Step 040 [Infra]: Define a change-control rule: new lexemes/grammar
 * rules require golden tests and ambiguity analysis notes.
 *
 * ## Purpose
 *
 * GOFAI Music+ is a deterministic compiler. Any change to its vocabulary
 * or grammar rules can silently change the meaning of existing utterances.
 * This file defines the change-control protocol that prevents drift.
 *
 * ## The Change-Control Protocol
 *
 * Every change to the GOFAI lexicon or grammar must follow this protocol:
 *
 * 1. **Propose**: Create a ChangeProposal describing the new lexeme or
 *    grammar rule, including its semantics and selectional restrictions.
 *
 * 2. **Analyze**: Run ambiguity analysis to identify any existing utterances
 *    that would parse differently after the change.
 *
 * 3. **Test**: Add golden tests for the new lexeme/rule (at least 5 utterances
 *    exercising the new entry).
 *
 * 4. **Paraphrase**: Add at least 3 paraphrases for each golden test to
 *    verify semantic invariance.
 *
 * 5. **Review**: Document the ambiguity analysis results and any intentional
 *    changes to existing parse behavior.
 *
 * 6. **Merge**: Only after all tests pass and the analysis is reviewed.
 *
 * ## Enforcement
 *
 * The `gofai:check` script validates that:
 * - Every lexeme ID has associated golden tests
 * - Every grammar rule ID has associated golden tests
 * - No lexeme has been added without an ambiguity analysis note
 * - The golden test count meets minimum thresholds
 *
 * @module gofai/canon/change-control
 */

// =============================================================================
// Change Proposal Types
// =============================================================================

/**
 * Unique identifier for a change proposal.
 */
export type ChangeProposalId = string & { readonly __brand: 'ChangeProposalId' };

/**
 * Create a ChangeProposalId.
 */
export function changeProposalId(id: string): ChangeProposalId {
  return id as ChangeProposalId;
}

/**
 * The type of change being proposed.
 */
export type ChangeType =
  | 'add_lexeme'         // New lexical entry
  | 'modify_lexeme'      // Change to existing lexeme semantics
  | 'remove_lexeme'      // Removing a lexeme (must be deprecated first)
  | 'add_grammar_rule'   // New grammar rule
  | 'modify_grammar_rule' // Change to existing grammar rule
  | 'remove_grammar_rule' // Remove a grammar rule
  | 'add_axis'           // New perceptual axis
  | 'modify_axis'        // Change to axis mappings
  | 'add_opcode'         // New CPL plan opcode
  | 'modify_opcode'      // Change to opcode semantics
  | 'add_constraint_type' // New constraint type
  | 'add_default';       // New default interpretation

/**
 * Impact level of a change.
 */
export type ChangeImpact =
  | 'low'        // Unlikely to affect existing parses
  | 'medium'     // May affect edge cases
  | 'high'       // Will affect common utterances
  | 'breaking';  // Will change behavior for existing utterances

/**
 * A change proposal to the GOFAI vocabulary or grammar.
 */
export interface ChangeProposal {
  /** Unique proposal ID. */
  readonly id: ChangeProposalId;
  /** Type of change. */
  readonly changeType: ChangeType;
  /** Human-readable description. */
  readonly description: string;
  /** The specific item being changed (lexeme ID, rule ID, etc.). */
  readonly targetId: string;
  /** Assessed impact level. */
  readonly impact: ChangeImpact;
  /** Author of the proposal. */
  readonly author: string;
  /** Date of proposal (ISO string). */
  readonly date: string;
  /** The ambiguity analysis for this change. */
  readonly ambiguityAnalysis: AmbiguityAnalysis;
  /** Required golden tests. */
  readonly requiredTests: readonly GoldenTestRequirement[];
  /** Status of the proposal. */
  readonly status: ChangeProposalStatus;
}

/**
 * Status of a change proposal.
 */
export type ChangeProposalStatus =
  | 'draft'           // Being prepared
  | 'analysis_done'   // Ambiguity analysis complete
  | 'tests_written'   // Golden tests exist
  | 'review_pending'  // Ready for review
  | 'approved'        // Approved for merge
  | 'merged'          // Merged into main
  | 'rejected';       // Rejected (with reason)


// =============================================================================
// Ambiguity Analysis
// =============================================================================

/**
 * An ambiguity analysis for a vocabulary/grammar change.
 *
 * This documents what could go wrong if the change is merged,
 * and what mitigations are in place.
 */
export interface AmbiguityAnalysis {
  /** Whether the change introduces new parse ambiguities. */
  readonly introducesAmbiguity: boolean;

  /** Description of any new ambiguities. */
  readonly newAmbiguities: readonly AmbiguityNote[];

  /** Existing utterances whose parse would change. */
  readonly affectedUtterances: readonly AffectedUtterance[];

  /** Whether existing golden tests still pass after the change. */
  readonly goldenTestsPass: boolean;

  /** Risk assessment. */
  readonly riskAssessment: string;

  /** Mitigation strategy (if any). */
  readonly mitigation: string;
}

/**
 * A note about a new ambiguity introduced by a change.
 */
export interface AmbiguityNote {
  /** The ambiguous utterance pattern. */
  readonly utterancePattern: string;
  /** The competing interpretations. */
  readonly interpretations: readonly string[];
  /** How the ambiguity is resolved (clarification, scoring, etc.). */
  readonly resolution: string;
  /** Whether this ambiguity is acceptable. */
  readonly acceptable: boolean;
  /** Rationale for acceptability. */
  readonly rationale: string;
}

/**
 * An existing utterance whose parse would change after a vocabulary change.
 */
export interface AffectedUtterance {
  /** The utterance text. */
  readonly utterance: string;
  /** Previous CPL output. */
  readonly previousCPL: string;
  /** New CPL output after the change. */
  readonly newCPL: string;
  /** Whether this change is intentional. */
  readonly intentional: boolean;
  /** Explanation of why the change is (or isn't) acceptable. */
  readonly explanation: string;
}


// =============================================================================
// Golden Test Requirements
// =============================================================================

/**
 * A requirement for golden tests associated with a change.
 */
export interface GoldenTestRequirement {
  /** Description of what the test should cover. */
  readonly description: string;
  /** Minimum number of test utterances required. */
  readonly minimumUtterances: number;
  /** Whether paraphrase tests are also required. */
  readonly paraphrasesRequired: boolean;
  /** Minimum paraphrases per utterance (if required). */
  readonly minimumParaphrases: number;
  /** Whether ambiguity tests are required. */
  readonly ambiguityTestRequired: boolean;
  /** Test file path (relative to src/gofai/). */
  readonly testFilePath: string;
  /** Whether the tests currently pass. */
  readonly passing: boolean;
}


// =============================================================================
// Change-Control Policy
// =============================================================================

/**
 * The minimum requirements for different change types.
 */
export interface ChangeControlPolicy {
  /** Change type this policy applies to. */
  readonly changeType: ChangeType;
  /** Minimum golden test utterances. */
  readonly minimumGoldenTests: number;
  /** Whether paraphrase tests are required. */
  readonly paraphrasesRequired: boolean;
  /** Minimum paraphrases per utterance. */
  readonly minimumParaphrases: number;
  /** Whether ambiguity analysis is required. */
  readonly ambiguityAnalysisRequired: boolean;
  /** Whether existing golden tests must still pass. */
  readonly regressionCheckRequired: boolean;
  /** Whether a review is required. */
  readonly reviewRequired: boolean;
}

/**
 * The canonical change-control policies.
 */
export const CHANGE_CONTROL_POLICIES: readonly ChangeControlPolicy[] = [
  // Adding a new lexeme
  {
    changeType: 'add_lexeme',
    minimumGoldenTests: 5,
    paraphrasesRequired: true,
    minimumParaphrases: 3,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: false,
  },

  // Modifying an existing lexeme
  {
    changeType: 'modify_lexeme',
    minimumGoldenTests: 5,
    paraphrasesRequired: true,
    minimumParaphrases: 3,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: true,  // Requires review because it changes existing behavior
  },

  // Removing a lexeme
  {
    changeType: 'remove_lexeme',
    minimumGoldenTests: 0,  // No new tests needed
    paraphrasesRequired: false,
    minimumParaphrases: 0,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: true,  // Must verify nothing depends on it
  },

  // Adding a grammar rule
  {
    changeType: 'add_grammar_rule',
    minimumGoldenTests: 10,  // Grammar rules have wider impact
    paraphrasesRequired: true,
    minimumParaphrases: 3,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: true,  // Grammar changes always need review
  },

  // Modifying a grammar rule
  {
    changeType: 'modify_grammar_rule',
    minimumGoldenTests: 10,
    paraphrasesRequired: true,
    minimumParaphrases: 3,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: true,
  },

  // Adding a perceptual axis
  {
    changeType: 'add_axis',
    minimumGoldenTests: 5,
    paraphrasesRequired: true,
    minimumParaphrases: 3,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: true,  // Axes affect lever mappings
  },

  // Adding an opcode
  {
    changeType: 'add_opcode',
    minimumGoldenTests: 3,
    paraphrasesRequired: false,
    minimumParaphrases: 0,
    ambiguityAnalysisRequired: false,
    regressionCheckRequired: true,
    reviewRequired: false,
  },

  // Adding a constraint type
  {
    changeType: 'add_constraint_type',
    minimumGoldenTests: 5,
    paraphrasesRequired: true,
    minimumParaphrases: 3,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: true,
  },

  // Adding a default interpretation
  {
    changeType: 'add_default',
    minimumGoldenTests: 5,
    paraphrasesRequired: true,
    minimumParaphrases: 3,
    ambiguityAnalysisRequired: true,
    regressionCheckRequired: true,
    reviewRequired: false,
  },
];

/**
 * Get the policy for a given change type.
 */
export function getChangeControlPolicy(
  changeType: ChangeType,
): ChangeControlPolicy | undefined {
  return CHANGE_CONTROL_POLICIES.find(p => p.changeType === changeType);
}


// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate a change proposal against its policy.
 * Returns a list of violations (empty = passes).
 */
export function validateChangeProposal(
  proposal: ChangeProposal,
): readonly string[] {
  const policy = getChangeControlPolicy(proposal.changeType);
  if (policy === undefined) {
    return [`No policy defined for change type: ${proposal.changeType}`];
  }

  const violations: string[] = [];

  // Check ambiguity analysis
  if (policy.ambiguityAnalysisRequired) {
    if (proposal.ambiguityAnalysis.newAmbiguities.length > 0) {
      const unacceptable = proposal.ambiguityAnalysis.newAmbiguities.filter(
        a => !a.acceptable,
      );
      if (unacceptable.length > 0) {
        violations.push(
          `${unacceptable.length} unacceptable ambiguity/ies introduced: ${
            unacceptable.map(a => a.utterancePattern).join(', ')
          }`,
        );
      }
    }

    if (
      proposal.ambiguityAnalysis.affectedUtterances.length > 0 &&
      proposal.ambiguityAnalysis.affectedUtterances.some(a => !a.intentional)
    ) {
      violations.push(
        'Unintentional changes to existing utterance parses detected',
      );
    }
  }

  // Check golden tests
  const totalTests = proposal.requiredTests.reduce(
    (sum, t) => sum + t.minimumUtterances,
    0,
  );
  if (totalTests < policy.minimumGoldenTests) {
    violations.push(
      `Insufficient golden tests: ${totalTests} < minimum ${policy.minimumGoldenTests}`,
    );
  }

  // Check paraphrase requirements
  if (policy.paraphrasesRequired) {
    const testsWithParaphrases = proposal.requiredTests.filter(
      t => t.paraphrasesRequired && t.minimumParaphrases >= policy.minimumParaphrases,
    );
    if (testsWithParaphrases.length === 0) {
      violations.push(
        `Paraphrase tests required (>= ${policy.minimumParaphrases} per utterance) but none found`,
      );
    }
  }

  // Check regression tests
  if (policy.regressionCheckRequired && !proposal.ambiguityAnalysis.goldenTestsPass) {
    violations.push('Existing golden tests do not pass after this change');
  }

  // Check failing tests
  const failingTests = proposal.requiredTests.filter(t => !t.passing);
  if (failingTests.length > 0) {
    violations.push(
      `${failingTests.length} test(s) failing: ${failingTests.map(t => t.testFilePath).join(', ')}`,
    );
  }

  return violations;
}


// =============================================================================
// PR Checklist
// =============================================================================

/**
 * A PR checklist item for vocabulary/grammar changes.
 */
export interface PRChecklistItem {
  /** Checklist item description. */
  readonly description: string;
  /** Whether this item is required or optional. */
  readonly required: boolean;
  /** The change types this applies to. */
  readonly appliesTo: readonly ChangeType[];
}

/**
 * The PR checklist for GOFAI vocabulary/grammar changes.
 *
 * This is Step 150 [Infra] — the "grammar authorship workflow" checklist.
 * Every PR that modifies GOFAI vocabulary or grammar must include
 * evidence of completing these items.
 */
export const PR_CHECKLIST: readonly PRChecklistItem[] = [
  {
    description: 'Add or update lexeme entry in canon/lexemes.ts or domain-*.ts',
    required: true,
    appliesTo: ['add_lexeme', 'modify_lexeme'],
  },
  {
    description: 'Add or update grammar rule in nl/grammar/*.ts',
    required: true,
    appliesTo: ['add_grammar_rule', 'modify_grammar_rule'],
  },
  {
    description: 'Add golden test utterances (minimum 5 for lexemes, 10 for grammar rules)',
    required: true,
    appliesTo: ['add_lexeme', 'modify_lexeme', 'add_grammar_rule', 'modify_grammar_rule'],
  },
  {
    description: 'Add paraphrase tests (minimum 3 paraphrases per golden test utterance)',
    required: true,
    appliesTo: ['add_lexeme', 'modify_lexeme', 'add_grammar_rule', 'modify_grammar_rule'],
  },
  {
    description: 'Run ambiguity analysis and document results',
    required: true,
    appliesTo: ['add_lexeme', 'modify_lexeme', 'add_grammar_rule', 'modify_grammar_rule', 'add_axis', 'add_constraint_type'],
  },
  {
    description: 'Verify all existing golden tests still pass (regression check)',
    required: true,
    appliesTo: ['add_lexeme', 'modify_lexeme', 'remove_lexeme', 'add_grammar_rule', 'modify_grammar_rule', 'remove_grammar_rule'],
  },
  {
    description: 'Update docs entry in docs/gofai/ (if public-facing terminology changed)',
    required: false,
    appliesTo: ['add_lexeme', 'modify_lexeme', 'add_axis', 'add_constraint_type'],
  },
  {
    description: 'Add entry to CHANGELOG with change ID and impact assessment',
    required: true,
    appliesTo: ['modify_lexeme', 'remove_lexeme', 'modify_grammar_rule', 'remove_grammar_rule'],
  },
  {
    description: 'Peer review approval from GOFAI maintainer',
    required: true,
    appliesTo: ['modify_lexeme', 'remove_lexeme', 'add_grammar_rule', 'modify_grammar_rule', 'remove_grammar_rule', 'add_axis', 'modify_axis', 'add_constraint_type'],
  },
];

/**
 * Get the applicable PR checklist items for a given change type.
 */
export function getApplicableChecklist(
  changeType: ChangeType,
): readonly PRChecklistItem[] {
  return PR_CHECKLIST.filter(item => item.appliesTo.includes(changeType));
}

/**
 * Get only the required checklist items for a given change type.
 */
export function getRequiredChecklist(
  changeType: ChangeType,
): readonly PRChecklistItem[] {
  return PR_CHECKLIST.filter(
    item => item.required && item.appliesTo.includes(changeType),
  );
}
