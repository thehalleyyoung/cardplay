/**
 * @file Risk Register Implementation - Complete Failure Mode Catalog
 * @module gofai/infra/risk-register-impl
 * 
 * Implements Step 022: Build a "risk register" (failure modes: wrong scope, wrong target,
 * broken constraints, destructive edits) and map each to mitigation steps.
 * 
 * This module provides a comprehensive catalog of risks that can occur during GOFAI
 * natural language music editing, along with detection strategies and mitigation steps.
 * 
 * The risk register enables:
 * - Proactive risk detection before execution
 * - Automatic mitigation where possible
 * - Clear communication to users about risks
 * - Audit logging for post-mortems
 * 
 * Design principles:
 * - Fail closed: when uncertain, prevent execution rather than risk corruption
 * - Transparent: always show users what might go wrong
 * - Recoverable: every risky operation must have undo/rollback
 * - Auditable: log all risk assessments for improvement
 * 
 * @see gofai_goalB.md Step 022
 * @see docs/gofai/risk-management.md
 */

import type { CPLIntent, CPLScope, CPLConstraint, CPLGoal } from '../canon/cpl-types.js';
import type { CPLOpcode } from '../planning/plan-types.js';
import type { ProjectWorldState } from './project-world-api.js';

// ============================================================================
// Risk Types and Severity
// ============================================================================

/**
 * Severity levels for risks
 */
export type RiskSeverity =
  | 'critical'   // Could corrupt project or lose data
  | 'high'       // Could violate user intent or break constraints
  | 'medium'     // Could produce unexpected results
  | 'low'        // Minor issues, easily reversible
  | 'info';      // Informational only

/**
 * Categories of risk
 */
export type RiskCategory =
  | 'scope'           // Wrong scope selected/applied
  | 'target'          // Wrong entities targeted
  | 'constraint'      // Constraint violation
  | 'destructive'     // Data loss or corruption
  | 'ambiguity'       // Ambiguous intent
  | 'capability'      // Capability/permission issues
  | 'precondition'    // Preconditions not met
  | 'side-effect'     // Unintended side effects
  | 'compatibility'   // Extension/version issues
  | 'performance';    // Performance/resource issues

/**
 * A specific risk that can occur
 */
export interface Risk {
  /** Unique risk ID */
  readonly id: string;
  
  /** Category */
  readonly category: RiskCategory;
  
  /** Severity level */
  readonly severity: RiskSeverity;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Detailed description */
  readonly description: string;
  
  /** How to detect this risk */
  readonly detection: RiskDetectionStrategy;
  
  /** How to mitigate this risk */
  readonly mitigation: readonly MitigationStep[];
  
  /** Examples of this risk */
  readonly examples: readonly RiskExample[];
  
  /** Related risks */
  readonly relatedRisks: readonly string[];
}

/**
 * Strategy for detecting a risk
 */
export interface RiskDetectionStrategy {
  /** Detection method type */
  readonly type: 'static' | 'runtime' | 'heuristic';
  
  /** When to check */
  readonly timing: 'parse' | 'semantic' | 'planning' | 'preflight' | 'execution';
  
  /** Checker function ID */
  readonly checkerId: string;
  
  /** Description of what we check */
  readonly description: string;
}

/**
 * A step to mitigate a risk
 */
export interface MitigationStep {
  /** Step type */
  readonly type: 'prevent' | 'clarify' | 'warn' | 'constrain' | 'undo' | 'rollback';
  
  /** When to apply */
  readonly when: 'always' | 'if-possible' | 'if-requested' | 'automatic';
  
  /** Action to take */
  readonly action: string;
  
  /** Implementation function ID */
  readonly implementationId: string;
  
  /** Success criteria */
  readonly successCriteria: string;
}

/**
 * Example of a risk scenario
 */
export interface RiskExample {
  /** User utterance */
  readonly utterance: string;
  
  /** Context */
  readonly context: string;
  
  /** What goes wrong */
  readonly problem: string;
  
  /** How mitigation helps */
  readonly resolution: string;
}

// ============================================================================
// Risk Assessment Result
// ============================================================================

/**
 * Result of risk assessment
 */
export interface RiskAssessment {
  /** Overall risk level */
  readonly overallSeverity: RiskSeverity;
  
  /** Detected risks */
  readonly risks: readonly DetectedRisk[];
  
  /** Can we proceed safely? */
  readonly safeToExecute: boolean;
  
  /** Required mitigations */
  readonly requiredMitigations: readonly MitigationStep[];
  
  /** Optional mitigations */
  readonly optionalMitigations: readonly MitigationStep[];
  
  /** Timestamp */
  readonly assessedAt: number;
}

/**
 * A risk that was detected
 */
export interface DetectedRisk {
  /** Risk definition */
  readonly risk: Risk;
  
  /** Confidence (0-1) */
  readonly confidence: number;
  
  /** Evidence */
  readonly evidence: readonly string[];
  
  /** Affected entities */
  readonly affectedEntities: readonly string[];
  
  /** Suggested mitigations */
  readonly suggestedMitigations: readonly MitigationStep[];
}

// ============================================================================
// Complete Risk Register Catalog
// ============================================================================

/**
 * Complete catalog of all known risks
 */
export const RISK_REGISTER: readonly Risk[] = [
  // ========================================================================
  // SCOPE RISKS
  // ========================================================================
  
  {
    id: 'R001-scope-ambiguous',
    category: 'scope',
    severity: 'high',
    name: 'Ambiguous Scope Reference',
    description: 'User said "the chorus" but there are multiple choruses in the project',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-scope-ambiguity',
      description: 'Count matching sections; if > 1, flag ambiguity'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Ask user to specify which chorus (first, second, all, etc.)',
        implementationId: 'clarify-scope-ambiguity',
        successCriteria: 'User selects a specific scope'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'If context suggests most recent, use recency heuristic but warn',
        implementationId: 'apply-recency-heuristic',
        successCriteria: 'Single scope selected with provenance'
      }
    ],
    examples: [
      {
        utterance: 'make the chorus darker',
        context: 'Song has Chorus1 (bars 8-16) and Chorus2 (bars 24-32)',
        problem: 'System might pick wrong chorus or apply to both unexpectedly',
        resolution: 'Ask: "Which chorus? (1) First chorus, (2) Second chorus, (3) Both"'
      }
    ],
    relatedRisks: ['R002-scope-wrong-section', 'R005-target-unintended']
  },
  
  {
    id: 'R002-scope-wrong-section',
    category: 'scope',
    severity: 'critical',
    name: 'Wrong Section Selected',
    description: 'System selects the wrong section due to misspelling or ambiguity',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-section-match',
      description: 'Fuzzy match section names; flag low-confidence matches'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Show matched section and ask for confirmation',
        implementationId: 'confirm-section-selection',
        successCriteria: 'User confirms or corrects'
      },
      {
        type: 'prevent',
        when: 'always',
        action: 'Reject matches below confidence threshold',
        implementationId: 'enforce-match-threshold',
        successCriteria: 'Only high-confidence matches accepted'
      }
    ],
    examples: [
      {
        utterance: 'brighten the brake',
        context: 'Song has section called "Break"',
        problem: 'Typo "brake" might not match, or might match wrong entity',
        resolution: 'System says: "Did you mean the Break section?" with visual highlight'
      }
    ],
    relatedRisks: ['R001-scope-ambiguous', 'R010-ambiguity-typo']
  },
  
  {
    id: 'R003-scope-empty',
    category: 'scope',
    severity: 'medium',
    name: 'Empty Scope',
    description: 'Selected scope contains no events or entities to operate on',
    detection: {
      type: 'runtime',
      timing: 'preflight',
      checkerId: 'check-scope-nonempty',
      description: 'Count entities in scope; flag if zero'
    },
    mitigation: [
      {
        type: 'warn',
        when: 'always',
        action: 'Tell user scope is empty and offer to expand',
        implementationId: 'warn-empty-scope',
        successCriteria: 'User understands why operation cannot proceed'
      },
      {
        type: 'clarify',
        when: 'if-possible',
        action: 'Suggest similar non-empty scopes',
        implementationId: 'suggest-alternative-scopes',
        successCriteria: 'User selects valid scope'
      }
    ],
    examples: [
      {
        utterance: 'make the drums louder in the intro',
        context: 'Intro has no drum events',
        problem: 'Operation would do nothing',
        resolution: 'System says: "The intro has no drums. Did you mean the verse?"'
      }
    ],
    relatedRisks: ['R004-scope-partial']
  },
  
  {
    id: 'R004-scope-partial',
    category: 'scope',
    severity: 'medium',
    name: 'Partial Scope Match',
    description: 'Scope only partially covers intended range',
    detection: {
      type: 'heuristic',
      timing: 'semantic',
      checkerId: 'check-scope-coverage',
      description: 'Compare scope to natural section boundaries'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'if-possible',
        action: 'Ask if user meant the full section or just part',
        implementationId: 'clarify-scope-extent',
        successCriteria: 'User confirms intended extent'
      },
      {
        type: 'warn',
        when: 'always',
        action: 'Show exactly which bars will be affected',
        implementationId: 'visualize-scope',
        successCriteria: 'User sees visual representation'
      }
    ],
    examples: [
      {
        utterance: 'make it darker from bar 8',
        context: 'User probably means "from bar 8 onward" but scope ends at bar 16',
        problem: 'Operation might stop too early',
        resolution: 'Show timeline with affected range highlighted'
      }
    ],
    relatedRisks: ['R003-scope-empty']
  },
  
  {
    id: 'R005-scope-leakage',
    category: 'scope',
    severity: 'critical',
    name: 'Scope Leakage',
    description: 'Operation affects entities outside intended scope',
    detection: {
      type: 'runtime',
      timing: 'execution',
      checkerId: 'check-scope-containment',
      description: 'Verify all mutations are within declared scope'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'always',
        action: 'Reject any operations that touch out-of-scope entities',
        implementationId: 'enforce-scope-boundary',
        successCriteria: 'No out-of-scope mutations occur'
      },
      {
        type: 'rollback',
        when: 'automatic',
        action: 'If leakage detected post-execution, automatic rollback',
        implementationId: 'rollback-scope-violation',
        successCriteria: 'Project state restored to pre-operation'
      }
    ],
    examples: [
      {
        utterance: 'quantize the verse',
        context: 'Verse is bars 8-16 but quantize operation accidentally touches bar 7',
        problem: 'Unintended mutation outside scope',
        resolution: 'Operation rejected with error; user sees which entities were out of bounds'
      }
    ],
    relatedRisks: ['R006-target-wrong-entities', 'R020-destructive-unintended']
  },
  
  // ========================================================================
  // TARGET RISKS
  // ========================================================================
  
  {
    id: 'R006-target-wrong-entities',
    category: 'target',
    severity: 'high',
    name: 'Wrong Entities Targeted',
    description: 'Operation targets wrong tracks, layers, or events',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-target-entities',
      description: 'Validate entity IDs exist and match intent'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Show which entities will be affected before execution',
        implementationId: 'preview-target-entities',
        successCriteria: 'User confirms correct targets'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Use type constraints to prevent wrong entity types',
        implementationId: 'enforce-entity-types',
        successCriteria: 'Only valid entity types can be targeted'
      }
    ],
    examples: [
      {
        utterance: 'mute the bass',
        context: 'User meant bass guitar track but system targets bass drum',
        problem: 'Wrong track affected',
        resolution: 'Show both options: "Which bass? (1) Bass Guitar, (2) Bass Drum"'
      }
    ],
    relatedRisks: ['R007-target-ambiguous', 'R001-scope-ambiguous']
  },
  
  {
    id: 'R007-target-ambiguous',
    category: 'target',
    severity: 'high',
    name: 'Ambiguous Target Reference',
    description: 'Target description matches multiple entities',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-target-uniqueness',
      description: 'Count matching entities; if > 1, flag ambiguity'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'List all matches and ask user to choose',
        implementationId: 'clarify-target-ambiguity',
        successCriteria: 'User selects specific target'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Use context to narrow (e.g., currently focused layer)',
        implementationId: 'apply-context-constraint',
        successCriteria: 'Single target identified with provenance'
      }
    ],
    examples: [
      {
        utterance: 'delete that card',
        context: 'Multiple cards visible; "that" is ambiguous',
        problem: 'Might delete wrong card',
        resolution: 'Highlight all candidate cards; user clicks to select'
      }
    ],
    relatedRisks: ['R006-target-wrong-entities', 'R010-ambiguity-pronoun']
  },
  
  {
    id: 'R008-target-nonexistent',
    category: 'target',
    severity: 'high',
    name: 'Nonexistent Target',
    description: 'Referenced entity does not exist',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-entity-exists',
      description: 'Lookup entity by ID/name; flag if not found'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'always',
        action: 'Reject operation and suggest similar existing entities',
        implementationId: 'suggest-similar-entities',
        successCriteria: 'User either finds correct entity or operation cancelled'
      },
      {
        type: 'clarify',
        when: 'if-possible',
        action: 'Check if entity was recently deleted; offer undo',
        implementationId: 'check-recent-deletions',
        successCriteria: 'User restores entity if desired'
      }
    ],
    examples: [
      {
        utterance: 'bring back the strings',
        context: 'Strings track was deleted 3 edits ago',
        problem: 'Cannot operate on deleted entity',
        resolution: 'System says: "Strings track was deleted. Undo delete?"'
      }
    ],
    relatedRisks: ['R009-target-wrong-type']
  },
  
  {
    id: 'R009-target-wrong-type',
    category: 'target',
    severity: 'high',
    name: 'Wrong Target Type',
    description: 'Operation requires one entity type but user referred to another',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-target-type-compatibility',
      description: 'Validate target type matches operation requirements'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'always',
        action: 'Reject type-incompatible operations',
        implementationId: 'enforce-type-compatibility',
        successCriteria: 'Only type-safe operations allowed'
      },
      {
        type: 'clarify',
        when: 'if-possible',
        action: 'Suggest what the user might have meant',
        implementationId: 'suggest-type-compatible-entities',
        successCriteria: 'User finds correct target'
      }
    ],
    examples: [
      {
        utterance: 'set reverb to 50%',
        context: 'User selected a track but reverb is a card parameter',
        problem: 'Type mismatch: track vs card',
        resolution: 'System says: "I need a reverb card. Add one or select existing?"'
      }
    ],
    relatedRisks: ['R006-target-wrong-entities', 'R024-precondition-missing-entity']
  },
  
  // ========================================================================
  // CONSTRAINT RISKS
  // ========================================================================
  
  {
    id: 'R010-constraint-violation',
    category: 'constraint',
    severity: 'critical',
    name: 'Constraint Violation',
    description: 'Planned operation would violate a declared constraint',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-constraint-satisfaction',
      description: 'Run constraint checkers on planned mutations'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'always',
        action: 'Reject plans that violate hard constraints',
        implementationId: 'enforce-hard-constraints',
        successCriteria: 'No constraint violations in executed plans'
      },
      {
        type: 'clarify',
        when: 'if-possible',
        action: 'Explain which constraint would be violated and why',
        implementationId: 'explain-constraint-conflict',
        successCriteria: 'User understands the conflict'
      }
    ],
    examples: [
      {
        utterance: 'reharmonize the verse',
        context: 'User previously said "keep the melody exact"',
        problem: 'Reharmonization might require melody changes',
        resolution: 'System says: "This might change the melody. Override constraint?"'
      }
    ],
    relatedRisks: ['R011-constraint-conflict', 'R012-constraint-unsatisfiable']
  },
  
  {
    id: 'R011-constraint-conflict',
    category: 'constraint',
    severity: 'high',
    name: 'Conflicting Constraints',
    description: 'Multiple constraints cannot all be satisfied simultaneously',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-constraint-consistency',
      description: 'Check if constraint set is satisfiable'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Show conflicting constraints and ask user to prioritize',
        implementationId: 'resolve-constraint-conflict',
        successCriteria: 'User chooses which constraints to relax'
      },
      {
        type: 'prevent',
        when: 'always',
        action: 'Do not plan if constraints are inconsistent',
        implementationId: 'reject-inconsistent-constraints',
        successCriteria: 'Planning only proceeds with consistent constraints'
      }
    ],
    examples: [
      {
        utterance: 'make it darker but keep it bright',
        context: 'Dark and bright are opposite on brightness axis',
        problem: 'Contradictory goals',
        resolution: 'System says: "Dark and bright conflict. Which is more important?"'
      }
    ],
    relatedRisks: ['R010-constraint-violation', 'R013-ambiguity-vague']
  },
  
  {
    id: 'R012-constraint-unsatisfiable',
    category: 'constraint',
    severity: 'high',
    name: 'Unsatisfiable Constraint',
    description: 'Constraint cannot be satisfied given current project state',
    detection: {
      type: 'runtime',
      timing: 'planning',
      checkerId: 'check-constraint-feasibility',
      description: 'Check if constraint can be met with available levers'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Explain why constraint cannot be satisfied',
        implementationId: 'explain-infeasibility',
        successCriteria: 'User understands limitation'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Suggest relaxing constraint or adding capabilities',
        implementationId: 'suggest-constraint-relaxation',
        successCriteria: 'User finds feasible alternative'
      }
    ],
    examples: [
      {
        utterance: 'make it wider but don\'t change any parameters',
        context: 'Width requires adjusting stereo parameters',
        problem: 'Goal requires changing forbidden parameters',
        resolution: 'System says: "Width requires parameter changes. Override constraint?"'
      }
    ],
    relatedRisks: ['R010-constraint-violation', 'R023-capability-insufficient']
  },
  
  {
    id: 'R013-constraint-ignored',
    category: 'constraint',
    severity: 'high',
    name: 'Constraint Silently Ignored',
    description: 'System ignores a constraint due to bug or limitation',
    detection: {
      type: 'runtime',
      timing: 'execution',
      checkerId: 'audit-constraint-enforcement',
      description: 'Post-execution: verify all constraints were respected'
    },
    mitigation: [
      {
        type: 'rollback',
        when: 'automatic',
        action: 'Rollback if constraint violation detected post-execution',
        implementationId: 'rollback-on-constraint-violation',
        successCriteria: 'Project state restored; user notified'
      },
      {
        type: 'warn',
        when: 'always',
        action: 'Log and report constraint enforcement failures',
        implementationId: 'report-constraint-failure',
        successCriteria: 'Failure is visible and logged for debugging'
      }
    ],
    examples: [
      {
        utterance: 'quantize but keep swing',
        context: 'Quantize implementation has bug that removes swing',
        problem: 'Constraint violated silently',
        resolution: 'Post-execution check catches violation; operation rolled back'
      }
    ],
    relatedRisks: ['R010-constraint-violation', 'R021-destructive-irreversible']
  },
  
  // ========================================================================
  // DESTRUCTIVE EDIT RISKS
  // ========================================================================
  
  {
    id: 'R020-destructive-unintended',
    category: 'destructive',
    severity: 'critical',
    name: 'Unintended Destructive Edit',
    description: 'Operation deletes or corrupts data user wanted to keep',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-destructive-operations',
      description: 'Flag operations that delete/replace existing data'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Warn about destructive operations before execution',
        implementationId: 'warn-destructive',
        successCriteria: 'User explicitly confirms destructive actions'
      },
      {
        type: 'undo',
        when: 'always',
        action: 'Ensure destructive operations are fully reversible',
        implementationId: 'ensure-undo-available',
        successCriteria: 'Undo restores exact prior state'
      }
    ],
    examples: [
      {
        utterance: 'replace the melody',
        context: 'Current melody took hours to compose',
        problem: 'User might not realize "replace" will delete current melody',
        resolution: 'System says: "Replace will delete current melody. Are you sure?"'
      }
    ],
    relatedRisks: ['R021-destructive-irreversible', 'R022-destructive-cascade']
  },
  
  {
    id: 'R021-destructive-irreversible',
    category: 'destructive',
    severity: 'critical',
    name: 'Irreversible Destructive Edit',
    description: 'Destructive operation cannot be undone',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-reversibility',
      description: 'Verify operation has undo implementation'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'always',
        action: 'Block irreversible operations unless explicit override',
        implementationId: 'require-reversibility',
        successCriteria: 'All operations have undo capability'
      },
      {
        type: 'warn',
        when: 'if-requested',
        action: 'Show dire warning for irreversible operations',
        implementationId: 'warn-irreversible',
        successCriteria: 'User understands permanence'
      }
    ],
    examples: [
      {
        utterance: 'normalize all audio',
        context: 'Normalization is potentially lossy if not implemented carefully',
        problem: 'Might not be able to restore exact original levels',
        resolution: 'System requires explicit confirmation with warning'
      }
    ],
    relatedRisks: ['R020-destructive-unintended', 'R023-capability-destructive']
  },
  
  {
    id: 'R022-destructive-cascade',
    category: 'destructive',
    severity: 'critical',
    name: 'Cascading Destructive Effects',
    description: 'Deleting one entity causes unexpected deletion of dependents',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-dependency-graph',
      description: 'Analyze entity dependencies; flag cascading deletes'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Show all entities that will be affected by cascade',
        implementationId: 'preview-cascade-effects',
        successCriteria: 'User sees full impact before confirming'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Offer to preserve dependents by rewiring',
        implementationId: 'preserve-dependents',
        successCriteria: 'Dependents preserved when possible'
      }
    ],
    examples: [
      {
        utterance: 'delete the reverb',
        context: 'Multiple tracks route through this reverb',
        problem: 'Deleting reverb breaks all connected routing',
        resolution: 'System shows: "5 tracks use this reverb. Delete anyway?"'
      }
    ],
    relatedRisks: ['R020-destructive-unintended', 'R005-scope-leakage']
  },
  
  // ========================================================================
  // AMBIGUITY RISKS
  // ========================================================================
  
  {
    id: 'R030-ambiguity-pronoun',
    category: 'ambiguity',
    severity: 'medium',
    name: 'Ambiguous Pronoun Reference',
    description: 'Pronoun "it", "that", "this" has unclear referent',
    detection: {
      type: 'heuristic',
      timing: 'semantic',
      checkerId: 'check-pronoun-resolution',
      description: 'Check if multiple salient entities could match'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'if-possible',
        action: 'Ask user to clarify referent',
        implementationId: 'clarify-pronoun',
        successCriteria: 'User identifies specific referent'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Use recency/salience heuristics but warn',
        implementationId: 'apply-salience-heuristic',
        successCriteria: 'Single referent chosen with provenance'
      }
    ],
    examples: [
      {
        utterance: 'make it louder',
        context: 'Multiple tracks recently edited',
        problem: '"It" could refer to any recent track',
        resolution: 'System asks: "Make what louder? (1) Drums, (2) Bass, (3) All"'
      }
    ],
    relatedRisks: ['R007-target-ambiguous', 'R031-ambiguity-vague']
  },
  
  {
    id: 'R031-ambiguity-vague',
    category: 'ambiguity',
    severity: 'medium',
    name: 'Vague Descriptor',
    description: 'Adjective or verb is too vague to execute reliably',
    detection: {
      type: 'heuristic',
      timing: 'semantic',
      checkerId: 'check-descriptor-specificity',
      description: 'Flag descriptors with wide semantic range'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'if-possible',
        action: 'Ask for more specific description',
        implementationId: 'request-specificity',
        successCriteria: 'User provides clearer intent'
      },
      {
        type: 'warn',
        when: 'always',
        action: 'Explain how vague term was interpreted',
        implementationId: 'explain-interpretation',
        successCriteria: 'User understands chosen interpretation'
      }
    ],
    examples: [
      {
        utterance: 'make it better',
        context: '"Better" has no clear musical meaning',
        problem: 'Cannot map to specific edits',
        resolution: 'System asks: "Better how? Louder? Clearer? More interesting?"'
      }
    ],
    relatedRisks: ['R032-ambiguity-typo', 'R013-constraint-conflict']
  },
  
  {
    id: 'R032-ambiguity-typo',
    category: 'ambiguity',
    severity: 'low',
    name: 'Typo or Misspelling',
    description: 'User input contains typos that affect meaning',
    detection: {
      type: 'heuristic',
      timing: 'parse',
      checkerId: 'check-spelling',
      description: 'Use edit distance to detect likely typos'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Suggest correction and ask for confirmation',
        implementationId: 'suggest-correction',
        successCriteria: 'User confirms or corrects'
      },
      {
        type: 'warn',
        when: 'if-possible',
        action: 'Highlight unrecognized words',
        implementationId: 'highlight-unknown-words',
        successCriteria: 'User notices and can fix typos'
      }
    ],
    examples: [
      {
        utterance: 'increse the bass',
        context: '"increse" is misspelling of "increase"',
        problem: 'Might not parse or might parse wrong',
        resolution: 'System says: "Did you mean increase?"'
      }
    ],
    relatedRisks: ['R002-scope-wrong-section', 'R031-ambiguity-vague']
  },
  
  // ========================================================================
  // CAPABILITY RISKS
  // ========================================================================
  
  {
    id: 'R040-capability-insufficient',
    category: 'capability',
    severity: 'medium',
    name: 'Insufficient Capabilities',
    description: 'Requested operation requires capabilities not enabled',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-capabilities',
      description: 'Verify required capabilities are enabled'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Explain which capabilities are needed and why',
        implementationId: 'explain-capability-requirement',
        successCriteria: 'User understands limitation'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Offer alternative approach within available capabilities',
        implementationId: 'suggest-capability-alternative',
        successCriteria: 'User achieves goal with available capabilities'
      }
    ],
    examples: [
      {
        utterance: 'add a reverb card',
        context: 'Board is in full-manual mode; AI cannot add cards',
        problem: 'Capability not available in this mode',
        resolution: 'System says: "Adding cards requires AI-assisted mode. Switch modes?"'
      }
    ],
    relatedRisks: ['R041-capability-board-policy', 'R012-constraint-unsatisfiable']
  },
  
  {
    id: 'R041-capability-board-policy',
    category: 'capability',
    severity: 'high',
    name: 'Board Policy Violation',
    description: 'Operation violates board-specific execution policy',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-board-policy',
      description: 'Verify operation is allowed by current board'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'always',
        action: 'Block operations that violate board policy',
        implementationId: 'enforce-board-policy',
        successCriteria: 'Only policy-compliant operations execute'
      },
      {
        type: 'clarify',
        when: 'always',
        action: 'Explain policy violation and alternatives',
        implementationId: 'explain-policy-violation',
        successCriteria: 'User understands board constraints'
      }
    ],
    examples: [
      {
        utterance: 'change the routing',
        context: 'Studio board forbids routing changes',
        problem: 'Board policy blocks this operation',
        resolution: 'System says: "Routing locked in Studio mode. Use Experiment board?"'
      }
    ],
    relatedRisks: ['R040-capability-insufficient', 'R023-capability-destructive']
  },
  
  {
    id: 'R042-capability-extension-required',
    category: 'capability',
    severity: 'medium',
    name: 'Extension Required',
    description: 'Operation requires extension that is not installed/enabled',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-extension-availability',
      description: 'Check if required extensions are available'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Tell user which extension is needed',
        implementationId: 'identify-required-extension',
        successCriteria: 'User knows what to install'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Offer built-in alternative if available',
        implementationId: 'suggest-builtin-alternative',
        successCriteria: 'User can proceed without extension'
      }
    ],
    examples: [
      {
        utterance: 'apply microtonal tuning',
        context: 'Requires microtonal-music extension',
        problem: 'Extension not installed',
        resolution: 'System says: "Microtonal tuning needs the microtonal-music pack. Install?"'
      }
    ],
    relatedRisks: ['R040-capability-insufficient', 'R050-compatibility-version']
  },
  
  // ========================================================================
  // PRECONDITION RISKS
  // ========================================================================
  
  {
    id: 'R050-precondition-missing-entity',
    category: 'precondition',
    severity: 'high',
    name: 'Missing Required Entity',
    description: 'Operation requires entity that does not exist',
    detection: {
      type: 'static',
      timing: 'planning',
      checkerId: 'check-required-entities',
      description: 'Verify all required entities exist'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Offer to create missing entity',
        implementationId: 'offer-entity-creation',
        successCriteria: 'User creates entity or cancels'
      },
      {
        type: 'prevent',
        when: 'always',
        action: 'Block operation if entity cannot be created',
        implementationId: 'block-on-missing-entity',
        successCriteria: 'No execution without required entities'
      }
    ],
    examples: [
      {
        utterance: 'increase reverb',
        context: 'No reverb card exists',
        problem: 'Cannot adjust nonexistent reverb',
        resolution: 'System says: "No reverb found. Add one?"'
      }
    ],
    relatedRisks: ['R008-target-nonexistent', 'R051-precondition-state']
  },
  
  {
    id: 'R051-precondition-state',
    category: 'precondition',
    severity: 'high',
    name: 'Invalid Project State',
    description: 'Project state does not meet operation preconditions',
    detection: {
      type: 'runtime',
      timing: 'preflight',
      checkerId: 'check-preconditions',
      description: 'Run precondition checks on project state'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Explain which precondition failed and why',
        implementationId: 'explain-precondition-failure',
        successCriteria: 'User understands what is needed'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Offer to fix precondition automatically',
        implementationId: 'fix-precondition',
        successCriteria: 'Precondition met; operation can proceed'
      }
    ],
    examples: [
      {
        utterance: 'halftime the groove',
        context: 'No events are selected',
        problem: 'Halftime requires selection',
        resolution: 'System says: "Select events to halftime. Try: \'halftime the drums\'"'
      }
    ],
    relatedRisks: ['R003-scope-empty', 'R050-precondition-missing-entity']
  },
  
  // ========================================================================
  // SIDE EFFECT RISKS
  // ========================================================================
  
  {
    id: 'R060-side-effect-unexpected',
    category: 'side-effect',
    severity: 'medium',
    name: 'Unexpected Side Effect',
    description: 'Operation has side effects beyond stated intent',
    detection: {
      type: 'runtime',
      timing: 'execution',
      checkerId: 'audit-side-effects',
      description: 'Compare actual changes to planned changes'
    },
    mitigation: [
      {
        type: 'warn',
        when: 'always',
        action: 'Document and show all side effects',
        implementationId: 'document-side-effects',
        successCriteria: 'User sees complete change list'
      },
      {
        type: 'undo',
        when: 'if-requested',
        action: 'Allow undoing specific side effects',
        implementationId: 'selective-undo',
        successCriteria: 'User can keep intended changes, undo side effects'
      }
    ],
    examples: [
      {
        utterance: 'quantize drums',
        context: 'Quantize also affects drum timing feel/swing',
        problem: 'User might not expect groove change',
        resolution: 'System shows: "Quantized drums (also affected swing feel)"'
      }
    ],
    relatedRisks: ['R005-scope-leakage', 'R061-side-effect-performance']
  },
  
  {
    id: 'R061-side-effect-performance',
    category: 'side-effect',
    severity: 'low',
    name: 'Performance Impact',
    description: 'Operation has significant performance cost',
    detection: {
      type: 'heuristic',
      timing: 'planning',
      checkerId: 'estimate-performance',
      description: 'Estimate operation cost; flag expensive operations'
    },
    mitigation: [
      {
        type: 'warn',
        when: 'if-possible',
        action: 'Warn about operations that may take time',
        implementationId: 'warn-expensive-operation',
        successCriteria: 'User has realistic expectations'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Offer lightweight alternative if available',
        implementationId: 'suggest-lightweight-alternative',
        successCriteria: 'User can choose performance vs quality'
      }
    ],
    examples: [
      {
        utterance: 'analyze harmony for entire project',
        context: 'Project has 200 tracks and 5 minutes',
        problem: 'Analysis might take 30+ seconds',
        resolution: 'System says: "This will take ~30s. Analyze just the verse instead?"'
      }
    ],
    relatedRisks: ['R060-side-effect-unexpected', 'R070-performance-timeout']
  },
  
  // ========================================================================
  // COMPATIBILITY RISKS
  // ========================================================================
  
  {
    id: 'R070-compatibility-version',
    category: 'compatibility',
    severity: 'medium',
    name: 'Version Incompatibility',
    description: 'Extension or schema version mismatch',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-version-compatibility',
      description: 'Compare required vs installed versions'
    },
    mitigation: [
      {
        type: 'clarify',
        when: 'always',
        action: 'Warn about version mismatch',
        implementationId: 'warn-version-mismatch',
        successCriteria: 'User aware of potential issues'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Attempt automatic migration if safe',
        implementationId: 'migrate-version',
        successCriteria: 'Compatible version achieved'
      }
    ],
    examples: [
      {
        utterance: 'apply saved plan',
        context: 'Plan was created with older extension version',
        problem: 'Semantics might have changed',
        resolution: 'System says: "Plan uses old version. Migrate to current?"'
      }
    ],
    relatedRisks: ['R042-capability-extension-required', 'R071-compatibility-namespace']
  },
  
  {
    id: 'R071-compatibility-namespace',
    category: 'compatibility',
    severity: 'high',
    name: 'Namespace Collision',
    description: 'Multiple extensions claim same namespace',
    detection: {
      type: 'static',
      timing: 'semantic',
      checkerId: 'check-namespace-uniqueness',
      description: 'Verify namespace is unique'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'always',
        action: 'Reject conflicting namespace registrations',
        implementationId: 'enforce-namespace-uniqueness',
        successCriteria: 'No namespace collisions allowed'
      },
      {
        type: 'clarify',
        when: 'always',
        action: 'Show which extensions conflict',
        implementationId: 'identify-namespace-conflict',
        successCriteria: 'User knows which extensions to disable'
      }
    ],
    examples: [
      {
        utterance: 'apply reverb:large',
        context: 'Two extensions both define "reverb:large"',
        problem: 'Ambiguous which extension to use',
        resolution: 'System says: "Multiple reverb:large. Use pack-a:reverb:large?"'
      }
    ],
    relatedRisks: ['R007-target-ambiguous', 'R070-compatibility-version']
  },
  
  // ========================================================================
  // PERFORMANCE RISKS
  // ========================================================================
  
  {
    id: 'R080-performance-timeout',
    category: 'performance',
    severity: 'low',
    name: 'Operation Timeout',
    description: 'Operation takes too long to complete',
    detection: {
      type: 'runtime',
      timing: 'execution',
      checkerId: 'monitor-execution-time',
      description: 'Track execution time; kill if exceeds budget'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'automatic',
        action: 'Cancel operation after timeout',
        implementationId: 'enforce-timeout',
        successCriteria: 'No operations hang indefinitely'
      },
      {
        type: 'clarify',
        when: 'always',
        action: 'Show progress bar for long operations',
        implementationId: 'show-progress',
        successCriteria: 'User knows operation is still running'
      }
    ],
    examples: [
      {
        utterance: 'analyze pitch for entire project',
        context: 'Project has hours of audio',
        problem: 'Might take extremely long',
        resolution: 'System shows progress; allows cancel after 60s'
      }
    ],
    relatedRisks: ['R061-side-effect-performance', 'R081-performance-memory']
  },
  
  {
    id: 'R081-performance-memory',
    category: 'performance',
    severity: 'medium',
    name: 'Memory Exhaustion',
    description: 'Operation uses excessive memory',
    detection: {
      type: 'runtime',
      timing: 'execution',
      checkerId: 'monitor-memory-usage',
      description: 'Track memory usage; fail if exceeds limit'
    },
    mitigation: [
      {
        type: 'prevent',
        when: 'automatic',
        action: 'Reject operations that would exhaust memory',
        implementationId: 'enforce-memory-limit',
        successCriteria: 'App remains stable'
      },
      {
        type: 'constrain',
        when: 'if-possible',
        action: 'Process in chunks to stay within memory budget',
        implementationId: 'chunk-processing',
        successCriteria: 'Operation completes without crashing'
      }
    ],
    examples: [
      {
        utterance: 'load all project history',
        context: 'Project has 10,000 edit packages',
        problem: 'Would use multiple GB of RAM',
        resolution: 'System loads history in pages; warns if full load requested'
      }
    ],
    relatedRisks: ['R080-performance-timeout']
  }
];

// ============================================================================
// Risk Assessment Engine
// ============================================================================

/**
 * Assess risks for a given intent and project state
 */
export function assessRisks(
  intent: CPLIntent,
  projectState: ProjectWorldState,
  constraints: readonly CPLConstraint[]
): RiskAssessment {
  const risks: DetectedRisk[] = [];
  const timestamp = Date.now();
  
  // Run risk checks
  for (const risk of RISK_REGISTER) {
    const detected = checkRisk(risk, intent, projectState, constraints);
    if (detected) {
      risks.push(detected);
    }
  }
  
  // Determine overall severity
  const overallSeverity = determineOverallSeverity(risks);
  
  // Determine if safe to execute
  const safeToExecute = canExecuteSafely(risks);
  
  // Collect required vs optional mitigations
  const required: MitigationStep[] = [];
  const optional: MitigationStep[] = [];
  
  for (const detected of risks) {
    for (const mitigation of detected.suggestedMitigations) {
      if (mitigation.when === 'always') {
        required.push(mitigation);
      } else {
        optional.push(mitigation);
      }
    }
  }
  
  return {
    overallSeverity,
    risks,
    safeToExecute,
    requiredMitigations: required,
    optionalMitigations: optional,
    assessedAt: timestamp
  };
}

/**
 * Check if a specific risk applies
 */
function checkRisk(
  risk: Risk,
  intent: CPLIntent,
  projectState: ProjectWorldState,
  constraints: readonly CPLConstraint[]
): DetectedRisk | undefined {
  // This is a stub - real implementation would have specific checkers
  // for each risk type based on risk.detection.checkerId
  
  // Example: scope ambiguity check
  if (risk.id === 'R001-scope-ambiguous' && intent.scope) {
    // Check if scope matches multiple sections
    const matches = findMatchingSections(intent.scope, projectState);
    if (matches.length > 1) {
      return {
        risk,
        confidence: 0.9,
        evidence: [`Found ${matches.length} matching sections`],
        affectedEntities: matches,
        suggestedMitigations: risk.mitigation
      };
    }
  }
  
  // Add more checks as needed
  return undefined;
}

/**
 * Determine overall severity from detected risks
 */
function determineOverallSeverity(risks: readonly DetectedRisk[]): RiskSeverity {
  if (risks.length === 0) return 'info';
  
  const severities = risks.map(r => r.risk.severity);
  
  if (severities.includes('critical')) return 'critical';
  if (severities.includes('high')) return 'high';
  if (severities.includes('medium')) return 'medium';
  if (severities.includes('low')) return 'low';
  
  return 'info';
}

/**
 * Determine if it's safe to execute given detected risks
 */
function canExecuteSafely(risks: readonly DetectedRisk[]): boolean {
  // Cannot execute if any critical risks detected
  const hasCritical = risks.some(r => r.risk.severity === 'critical');
  if (hasCritical) return false;
  
  // Cannot execute if high risks without mitigation
  const highRisks = risks.filter(r => r.risk.severity === 'high');
  const allHighRisksMitigated = highRisks.every(r => 
    r.suggestedMitigations.some(m => m.when === 'always')
  );
  
  return allHighRisksMitigated;
}

/**
 * Stub: Find sections matching a scope description
 */
function findMatchingSections(
  scope: CPLScope,
  projectState: ProjectWorldState
): string[] {
  // Real implementation would query projectState for matching sections
  return [];
}

// ============================================================================
// Risk Logging and Audit
// ============================================================================

/**
 * Log a risk assessment for audit
 */
export interface RiskAuditEntry {
  readonly timestamp: number;
  readonly assessment: RiskAssessment;
  readonly intent: CPLIntent;
  readonly outcome: 'prevented' | 'mitigated' | 'accepted' | 'executed';
  readonly userResponse?: string;
}

/**
 * Risk audit log (in-memory, could be persisted)
 */
const RISK_AUDIT_LOG: RiskAuditEntry[] = [];

/**
 * Log a risk assessment
 */
export function logRiskAssessment(
  assessment: RiskAssessment,
  intent: CPLIntent,
  outcome: RiskAuditEntry['outcome'],
  userResponse?: string
): void {
  RISK_AUDIT_LOG.push({
    timestamp: Date.now(),
    assessment,
    intent,
    outcome,
    userResponse
  });
}

/**
 * Get recent risk audit entries
 */
export function getRecentRiskAudits(limit: number = 100): readonly RiskAuditEntry[] {
  return RISK_AUDIT_LOG.slice(-limit);
}

/**
 * Export risk audit log for analysis
 */
export function exportRiskAuditLog(): string {
  return JSON.stringify(RISK_AUDIT_LOG, null, 2);
}
