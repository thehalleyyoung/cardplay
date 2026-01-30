/**
 * GOFAI Infrastructure — Risk Register
 *
 * Step 022 from gofai_goalB.md: "Build a 'risk register' (failure modes:
 * wrong scope, wrong target, broken constraints, destructive edits) and
 * map each to mitigation steps."
 *
 * @module gofai/infra/risk-register
 */

// =============================================================================
// Risk Types
// =============================================================================

/**
 * A risk entry in the register.
 */
export interface RiskEntry {
  /** Stable risk ID */
  readonly id: RiskId;

  /** Risk name */
  readonly name: string;

  /** Category */
  readonly category: RiskCategory;

  /** Description of the failure mode */
  readonly description: string;

  /** Impact severity */
  readonly severity: RiskSeverity;

  /** Likelihood without mitigation */
  readonly likelihood: RiskLikelihood;

  /** Example scenario */
  readonly example: string;

  /** Root causes */
  readonly causes: readonly string[];

  /** Mitigation steps */
  readonly mitigations: readonly RiskMitigation[];

  /** Detection methods */
  readonly detection: readonly string[];

  /** Which invariant(s) protect against this */
  readonly relatedInvariants: readonly string[];

  /** Which test types catch this */
  readonly relatedTests: readonly string[];
}

/**
 * Risk identifiers.
 */
export type RiskId =
  | 'wrong_scope'
  | 'wrong_target'
  | 'broken_constraint'
  | 'destructive_edit'
  | 'silent_ambiguity'
  | 'undo_failure'
  | 'scope_escape'
  | 'constraint_conflict'
  | 'parse_hallucination'
  | 'stale_reference'
  | 'extension_corruption'
  | 'nondeterministic_output'
  | 'performance_degradation'
  | 'presupposition_failure'
  | 'lever_mismatch';

/**
 * Risk categories.
 */
export type RiskCategory =
  | 'scope'
  | 'constraint'
  | 'data_integrity'
  | 'semantic'
  | 'performance'
  | 'extension'
  | 'ux';

/**
 * Risk severity levels.
 */
export type RiskSeverity =
  | 'critical'   // Data loss, irreversible changes
  | 'high'       // Wrong edits applied, constraint violations
  | 'medium'     // Confusing behavior, wrong scope
  | 'low';       // Minor inconvenience

/**
 * Risk likelihood levels.
 */
export type RiskLikelihood =
  | 'very_likely'   // Will happen frequently without mitigation
  | 'likely'        // Will happen sometimes
  | 'possible'      // Could happen in edge cases
  | 'unlikely';     // Rare but possible

/**
 * A mitigation step for a risk.
 */
export interface RiskMitigation {
  /** Mitigation description */
  readonly description: string;

  /** Where this mitigation lives (code, test, UI, docs) */
  readonly location: 'code' | 'test' | 'ui' | 'docs' | 'policy';

  /** Implementation status */
  readonly status: 'implemented' | 'planned' | 'proposed';

  /** Effectiveness estimate */
  readonly effectiveness: 'full' | 'partial' | 'unknown';
}

// =============================================================================
// Risk Register
// =============================================================================

/**
 * The complete GOFAI risk register.
 */
export const GOFAI_RISK_REGISTER: readonly RiskEntry[] = [
  {
    id: 'wrong_scope',
    name: 'Wrong Scope',
    category: 'scope',
    description: 'Edits are applied to the wrong section, layer, or range of the project',
    severity: 'high',
    likelihood: 'very_likely',
    example: '"Make the chorus brighter" applied to verse because scope resolution failed',
    causes: [
      'Ambiguous scope reference ("the chorus" when multiple choruses exist)',
      'Missing section markers in project',
      'Default scope applied incorrectly',
      'Pronoun resolution failure ("make it brighter" — what is "it"?)',
    ],
    mitigations: [
      {
        description: 'Scope visibility invariant: always show what will be affected',
        location: 'code',
        status: 'implemented',
        effectiveness: 'partial',
      },
      {
        description: 'Clarification question when scope is ambiguous',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Scope highlighting UI: visually mark affected bar ranges and layers',
        location: 'ui',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Scope confirmation in preview before apply',
        location: 'ui',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['golden_nl_to_cpl tests', 'scope_accuracy metric', 'integration tests'],
    relatedInvariants: ['scope-visibility', 'referent-resolution-completeness'],
    relatedTests: ['golden_nl_to_cpl', 'integration'],
  },

  {
    id: 'wrong_target',
    name: 'Wrong Target Entity',
    category: 'semantic',
    description: 'Edits target the wrong entity (e.g., wrong layer, card, or parameter)',
    severity: 'high',
    likelihood: 'likely',
    example: '"Tighten the drums" adjusts bass quantization instead of drums',
    causes: [
      'Ambiguous entity name (multiple tracks named similarly)',
      'Layer role inference failure',
      'Card name collision between extensions',
    ],
    mitigations: [
      {
        description: 'Referent resolution completeness invariant',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Entity disambiguation with clarification questions',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Preview diff showing exactly which entities are affected',
        location: 'ui',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['golden_nl_to_cpl tests', 'integration tests'],
    relatedInvariants: ['referent-resolution-completeness'],
    relatedTests: ['golden_nl_to_cpl', 'integration'],
  },

  {
    id: 'broken_constraint',
    name: 'Constraint Violation',
    category: 'constraint',
    description: 'A plan or execution violates a declared constraint (e.g., "keep melody")',
    severity: 'critical',
    likelihood: 'likely',
    example: '"Make it simpler but keep the melody" removes melody notes',
    causes: [
      'Planner fails to check constraint against proposed edits',
      'Constraint verifier has a bug',
      'Constraint and goal are inherently conflicting',
    ],
    mitigations: [
      {
        description: 'Constraint executability invariant: every constraint has a verifier',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Post-execution constraint verification with automatic rollback',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Constraint compatibility pre-check before planning',
        location: 'code',
        status: 'planned',
        effectiveness: 'partial',
      },
      {
        description: 'Property-based tests for constraint invariants',
        location: 'test',
        status: 'planned',
        effectiveness: 'partial',
      },
    ],
    detection: ['constraint_correctness tests', 'property_based tests', 'safety_diff tests'],
    relatedInvariants: ['constraint-executability', 'constraint-preservation', 'constraint-compatibility'],
    relatedTests: ['constraint_correctness', 'property_based', 'safety_diff'],
  },

  {
    id: 'destructive_edit',
    name: 'Destructive Edit',
    category: 'data_integrity',
    description: 'An edit causes irreversible data loss or corruption',
    severity: 'critical',
    likelihood: 'possible',
    example: 'Plan deletes all events in a section without backup, and undo fails',
    causes: [
      'Undo token does not capture all affected state',
      'Execution modifies state outside the undo scope',
      'Transactional rollback fails mid-operation',
    ],
    mitigations: [
      {
        description: 'Undoability invariant: every mutation produces valid undo token',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Transactional execution: apply to fork, verify, then commit',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Undo roundtrip property tests',
        location: 'test',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['undo_roundtrip tests', 'property_based tests'],
    relatedInvariants: ['undoability'],
    relatedTests: ['undo_roundtrip', 'property_based'],
  },

  {
    id: 'silent_ambiguity',
    name: 'Silent Ambiguity Resolution',
    category: 'semantic',
    description: 'System silently picks one interpretation of an ambiguous input without asking',
    severity: 'high',
    likelihood: 'very_likely',
    example: '"Make it darker" silently interpreted as timbre (not harmony or register)',
    causes: [
      'Disambiguation scoring picks one option above threshold',
      'Missing clarification trigger for this ambiguity type',
      'Default is used without disclosure',
    ],
    mitigations: [
      {
        description: 'Silent ambiguity prohibition invariant',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'All defaults are disclosed in the UI',
        location: 'ui',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Ambiguity golden test suite',
        location: 'test',
        status: 'planned',
        effectiveness: 'partial',
      },
    ],
    detection: ['golden_nl_to_cpl tests with ambiguity cases'],
    relatedInvariants: ['silent-ambiguity-prohibition'],
    relatedTests: ['golden_nl_to_cpl'],
  },

  {
    id: 'undo_failure',
    name: 'Undo Failure',
    category: 'data_integrity',
    description: 'Undo does not restore the exact original state',
    severity: 'critical',
    likelihood: 'possible',
    example: 'Undo after adding a layer leaves phantom routing connections',
    causes: [
      'Undo token missing side-effect data',
      'State changed between apply and undo by external action',
      'Undo implementation has off-by-one in event restoration',
    ],
    mitigations: [
      {
        description: 'Undo roundtrip fidelity metric at 100%',
        location: 'test',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'State hash verification in undo token',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['undo_roundtrip tests', 'property_based tests'],
    relatedInvariants: ['undoability'],
    relatedTests: ['undo_roundtrip', 'property_based'],
  },

  {
    id: 'scope_escape',
    name: 'Scope Escape',
    category: 'scope',
    description: 'Operation affects entities outside its declared scope',
    severity: 'high',
    likelihood: 'possible',
    example: 'Editing "drums in chorus" accidentally modifies drum events in the bridge',
    causes: [
      'Event selector is too broad',
      'Section boundary computation is wrong',
      'Opcode implementation ignores scope constraints',
    ],
    mitigations: [
      {
        description: 'Scope visibility invariant with out-of-scope detection',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Post-execution scope verification',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Fuzz testing with random scopes',
        location: 'test',
        status: 'planned',
        effectiveness: 'partial',
      },
    ],
    detection: ['scope_accuracy metric', 'fuzz tests'],
    relatedInvariants: ['scope-visibility'],
    relatedTests: ['fuzz', 'property_based'],
  },

  {
    id: 'constraint_conflict',
    name: 'Undetected Constraint Conflict',
    category: 'constraint',
    description: 'Two constraints are mutually unsatisfiable but not detected',
    severity: 'medium',
    likelihood: 'likely',
    example: '"Make it brighter and darker" or "preserve melody exactly and rewrite the melody"',
    causes: [
      'Constraint compatibility checker is incomplete',
      'New constraint type not integrated into compatibility matrix',
    ],
    mitigations: [
      {
        description: 'Constraint compatibility invariant',
        location: 'code',
        status: 'implemented',
        effectiveness: 'partial',
      },
      {
        description: 'Constraint conflict detection with human-readable explanations',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['constraint_correctness tests', 'unit tests'],
    relatedInvariants: ['constraint-compatibility'],
    relatedTests: ['constraint_correctness', 'unit'],
  },

  {
    id: 'parse_hallucination',
    name: 'Parse Hallucination',
    category: 'semantic',
    description: 'Parser produces a meaning that the user did not intend',
    severity: 'high',
    likelihood: 'likely',
    example: '"cut the drums" interpreted as "delete drum track" instead of "reduce drum volume"',
    causes: [
      'Verb sense ambiguity not detected',
      'Domain-specific meaning not in lexicon',
      'Grammar rule produces wrong attachment',
    ],
    mitigations: [
      {
        description: 'Clarification for verbs with multiple domain senses',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Preview before apply (user catches wrong interpretation)',
        location: 'ui',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Paraphrase invariance testing',
        location: 'test',
        status: 'planned',
        effectiveness: 'partial',
      },
    ],
    detection: ['paraphrase_invariance tests', 'golden_nl_to_cpl tests'],
    relatedInvariants: ['silent-ambiguity-prohibition'],
    relatedTests: ['paraphrase_invariance', 'golden_nl_to_cpl'],
  },

  {
    id: 'stale_reference',
    name: 'Stale Reference',
    category: 'semantic',
    description: 'Reference to "that" or "it" resolves to entity from expired context',
    severity: 'medium',
    likelihood: 'likely',
    example: '"Do that again" refers to edit from 5 turns ago instead of most recent',
    causes: [
      'Dialogue state salience decay is wrong',
      'Referent resolution does not account for undo history',
    ],
    mitigations: [
      {
        description: 'Salience scoring with recency bias',
        location: 'code',
        status: 'planned',
        effectiveness: 'partial',
      },
      {
        description: 'Show what "that" refers to in preview',
        location: 'ui',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['golden_nl_to_cpl tests with dialogue context'],
    relatedInvariants: ['referent-resolution-completeness'],
    relatedTests: ['golden_nl_to_cpl', 'integration'],
  },

  {
    id: 'extension_corruption',
    name: 'Extension Corruption',
    category: 'extension',
    description: 'An extension corrupts core state or interferes with other extensions',
    severity: 'critical',
    likelihood: 'possible',
    example: 'Extension opcode handler directly mutates project state, bypassing undo',
    causes: [
      'Extension handler is not pure (mutates state directly)',
      'Extension uses un-namespaced IDs that collide with core',
      'Extension Prolog module overrides core predicates',
    ],
    mitigations: [
      {
        description: 'Extension isolation invariant',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Extension handler purity enforcement (return proposals only)',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Extension namespace validation',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
    ],
    detection: ['extension_isolation tests', 'integration tests'],
    relatedInvariants: ['extension-isolation'],
    relatedTests: ['extension_isolation', 'integration'],
  },

  {
    id: 'nondeterministic_output',
    name: 'Nondeterministic Output',
    category: 'semantic',
    description: 'Same input produces different output on different runs',
    severity: 'high',
    likelihood: 'possible',
    example: 'Plan order changes between runs because Map iteration order varies',
    causes: [
      'Use of Date.now() in semantics/planning path',
      'Set/Map iteration order dependency',
      'Unstable sorting of tied elements',
    ],
    mitigations: [
      {
        description: 'Determinism invariant',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Determinism replay CI test',
        location: 'test',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Ban Date.now()/Math.random() in semantics/planning via linter',
        location: 'code',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['determinism_replay tests'],
    relatedInvariants: ['determinism'],
    relatedTests: ['determinism_replay'],
  },

  {
    id: 'performance_degradation',
    name: 'Performance Degradation',
    category: 'performance',
    description: 'Pipeline latency degrades as lexicon/grammar grows',
    severity: 'medium',
    likelihood: 'likely',
    example: 'Parse time grows from 50ms to 500ms after adding 1000 new lexemes',
    causes: [
      'Linear search in lexicon lookup',
      'Parse forest grows exponentially with grammar size',
      'No caching of repeated computations',
    ],
    mitigations: [
      {
        description: 'Performance budget checks in CI',
        location: 'test',
        status: 'planned',
        effectiveness: 'full',
      },
      {
        description: 'Indexed vocabulary lookup (Map-based)',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Parse forest pruning with beam size',
        location: 'code',
        status: 'planned',
        effectiveness: 'partial',
      },
    ],
    detection: ['performance_budget tests'],
    relatedInvariants: [],
    relatedTests: ['performance_budget'],
  },

  {
    id: 'presupposition_failure',
    name: 'Failed Presupposition',
    category: 'semantic',
    description: 'Utterance presupposes something that does not exist in the project',
    severity: 'medium',
    likelihood: 'likely',
    example: '"Stop the drums" when there is no drum track',
    causes: [
      'Presupposition not checked against project state',
      'New presupposition type not yet handled',
    ],
    mitigations: [
      {
        description: 'Presupposition verification invariant',
        location: 'code',
        status: 'implemented',
        effectiveness: 'full',
      },
      {
        description: 'Helpful error messages suggesting what to do',
        location: 'ui',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['golden_nl_to_cpl tests', 'unit tests'],
    relatedInvariants: ['presupposition-verification'],
    relatedTests: ['golden_nl_to_cpl', 'unit'],
  },

  {
    id: 'lever_mismatch',
    name: 'Lever Mismatch',
    category: 'semantic',
    description: 'Perceptual axis is mapped to wrong musical levers',
    severity: 'medium',
    likelihood: 'possible',
    example: '"More lift" decreases register instead of increasing it',
    causes: [
      'Lever mapping table has wrong direction',
      'Lever effectiveness estimate is wrong',
      'Context-dependent lever selection fails',
    ],
    mitigations: [
      {
        description: 'Plan explainability invariant (user can see which levers)',
        location: 'code',
        status: 'implemented',
        effectiveness: 'partial',
      },
      {
        description: 'Golden tests for axis→lever mappings',
        location: 'test',
        status: 'planned',
        effectiveness: 'full',
      },
    ],
    detection: ['golden_nl_to_cpl tests', 'expert review'],
    relatedInvariants: ['plan-explainability'],
    relatedTests: ['golden_nl_to_cpl'],
  },
] as const;

// =============================================================================
// Risk Register Utilities
// =============================================================================

/**
 * Get a risk by ID.
 */
export function getRisk(id: RiskId): RiskEntry | undefined {
  return GOFAI_RISK_REGISTER.find(r => r.id === id);
}

/**
 * Get all risks in a category.
 */
export function getRisksByCategory(category: RiskCategory): readonly RiskEntry[] {
  return GOFAI_RISK_REGISTER.filter(r => r.category === category);
}

/**
 * Get all critical risks.
 */
export function getCriticalRisks(): readonly RiskEntry[] {
  return GOFAI_RISK_REGISTER.filter(r => r.severity === 'critical');
}

/**
 * Get all risks mitigated by a specific invariant.
 */
export function getRisksMitigatedBy(invariantId: string): readonly RiskEntry[] {
  return GOFAI_RISK_REGISTER.filter(r => r.relatedInvariants.includes(invariantId));
}

/**
 * Get all unmitigated risks (no 'implemented' mitigations).
 */
export function getUnmitigatedRisks(): readonly RiskEntry[] {
  return GOFAI_RISK_REGISTER.filter(r =>
    !r.mitigations.some(m => m.status === 'implemented' && m.effectiveness === 'full')
  );
}

/**
 * Format risk register as a human-readable report.
 */
export function formatRiskReport(): string {
  const lines: string[] = ['GOFAI Risk Register', '='.repeat(80), ''];

  for (const risk of GOFAI_RISK_REGISTER) {
    const implemented = risk.mitigations.filter(m => m.status === 'implemented').length;
    const total = risk.mitigations.length;
    lines.push(`[${risk.severity.toUpperCase()}] ${risk.name} (${risk.id})`);
    lines.push(`  ${risk.description}`);
    lines.push(`  Likelihood: ${risk.likelihood}`);
    lines.push(`  Example: ${risk.example}`);
    lines.push(`  Mitigations: ${implemented}/${total} implemented`);
    lines.push(`  Invariants: ${risk.relatedInvariants.join(', ') || 'none'}`);
    lines.push('');
  }

  return lines.join('\n');
}
