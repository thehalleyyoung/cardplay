/**
 * @fileoverview Constraint-Based Lever Filtering
 * 
 * Step 271 [Sem] — Implement "constraints as filters": constraints prune
 * candidate levers early (if preserve melody exact, avoid reharmonize ops).
 * 
 * This module implements early constraint-based filtering of candidate levers
 * to ensure that:
 * 
 * 1. Plans never violate hard constraints
 * 2. Expensive computations are avoided for impossible plans
 * 3. Constraint checking happens before full plan generation
 * 4. Filter rules are composable and modular
 * 5. Filter explanations are provided for rejected levers
 * 6. Performance is optimized via indexed constraint checks
 * 
 * Constraint types supported:
 * - Preservation constraints (preserve melody, harmony, rhythm)
 * - Scope restrictions (only touch drums, avoid intro)
 * - Mutation limits (no new tracks, no deletion)
 * - Range constraints (stay in register, duration limits)
 * - Dependency constraints (if X then not Y)
 * - Capability constraints (board policy restrictions)
 * - Safety constraints (risk thresholds)
 * 
 * @module @cardplay/gofai/planning/constraint-filters
 */

import type { Opcode } from './plan-types';
import type { TheoryLever } from './theory-driven-levers';
import type { AnalysisFacts } from './analysis-facts';

// ============================================================================
// TYPES - Constraints
// ============================================================================

/**
 * Constraint that can filter levers
 */
export interface LeverConstraint {
  readonly id: string;
  readonly type: ConstraintType;
  readonly description: string;
  readonly hard: boolean;
  readonly filter: (lever: CandidateLever, context: FilterContext) => FilterResult;
  readonly priority: number;
}

/**
 * Constraint type categorization
 */
export type ConstraintType =
  | 'preservation'
  | 'scope_restriction'
  | 'mutation_limit'
  | 'range_limit'
  | 'dependency'
  | 'capability'
  | 'safety'
  | 'preference'
  | 'custom';

/**
 * Candidate lever (before full plan generation)
 */
export interface CandidateLever {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly opcodes: readonly Opcode[];
  readonly affects: LeverEffects;
  readonly confidence: number;
}

/**
 * What a lever affects
 */
export interface LeverEffects {
  readonly melodic: boolean;
  readonly harmonic: boolean;
  readonly rhythmic: boolean;
  readonly textural: boolean;
  readonly timbral: boolean;
  readonly structural: boolean;
  readonly createsEntities: boolean;
  readonly deletesEntities: boolean;
  readonly modifiesScope: readonly string[];
  readonly risk: number;
}

/**
 * Context for filtering
 */
export interface FilterContext {
  readonly analysis: AnalysisFacts;
  readonly capabilities: readonly string[];
  readonly userPreferences: UserPreferences;
  readonly boardPolicy: BoardPolicy;
}

/**
 * User preferences that affect filtering
 */
export interface UserPreferences {
  readonly riskTolerance: 'low' | 'medium' | 'high';
  readonly preserveMelodyByDefault: boolean;
  readonly allowNewTracks: boolean;
  readonly allowDeletion: boolean;
  readonly maxStructuralChange: number;
}

/**
 * Board policy constraints
 */
export interface BoardPolicy {
  readonly allowMutation: boolean;
  readonly allowedScopes: readonly string[];
  readonly restrictedOperations: readonly string[];
  readonly requireConfirmation: readonly string[];
}

/**
 * Filter result
 */
export interface FilterResult {
  readonly passed: boolean;
  readonly reason?: string;
  readonly suggestion?: string;
  readonly alternativeLever?: string;
}

// ============================================================================
// CONSTRAINT REGISTRY
// ============================================================================

/**
 * Registry of constraint filters
 */
export class ConstraintFilterRegistry {
  private constraints = new Map<string, LeverConstraint>();

  /**
   * Register a constraint filter
   */
  register(constraint: LeverConstraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  /**
   * Get all registered constraints
   */
  getAll(): readonly LeverConstraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Get constraints by type
   */
  getByType(type: ConstraintType): readonly LeverConstraint[] {
    return Array.from(this.constraints.values()).filter(c => c.type === type);
  }

  /**
   * Get hard constraints only
   */
  getHardConstraints(): readonly LeverConstraint[] {
    return Array.from(this.constraints.values()).filter(c => c.hard);
  }

  /**
   * Clear all constraints
   */
  clear(): void {
    this.constraints.clear();
  }
}

// ============================================================================
// BUILTIN CONSTRAINT FILTERS
// ============================================================================

/**
 * Create preservation constraint (preserve melody, harmony, etc.)
 */
export function createPreservationConstraint(
  target: 'melody' | 'harmony' | 'rhythm' | 'bass' | 'structure',
  exact: boolean
): LeverConstraint {
  return {
    id: `preserve_${target}_${exact ? 'exact' : 'recognizable'}`,
    type: 'preservation',
    description: `Preserve ${target} ${exact ? 'exactly' : 'recognizably'}`,
    hard: exact,
    priority: exact ? 100 : 50,
    filter: (lever, context) => {
      const affectsTarget = lever.affects[`${target}ic` as keyof LeverEffects];
      
      if (!affectsTarget) {
        return { passed: true };
      }
      
      if (exact) {
        // Hard constraint: reject any lever that modifies target
        return {
          passed: false,
          reason: `Lever modifies ${target} but constraint requires exact preservation`,
          suggestion: `Remove ${target} modifications or relax constraint to "recognizable"`
        };
      }
      
      // Soft constraint: allow if modifications are minor
      const risk = lever.affects.risk;
      if (risk < 0.3) {
        return { passed: true };
      }
      
      return {
        passed: false,
        reason: `Lever has high risk (${risk.toFixed(2)}) of significant ${target} modification`,
        suggestion: `Consider levers with lower ${target} impact`
      };
    }
  };
}

/**
 * Create scope restriction constraint
 */
export function createScopeRestrictionConstraint(
  allowedScopes: readonly string[],
  description: string
): LeverConstraint {
  return {
    id: `scope_restriction_${allowedScopes.join('_')}`,
    type: 'scope_restriction',
    description: `Only modify ${description}`,
    hard: true,
    priority: 90,
    filter: (lever, context) => {
      const modifiedScopes = lever.affects.modifiesScope;
      
      for (const scope of modifiedScopes) {
        if (!allowedScopes.some(allowed => scope.includes(allowed))) {
          return {
            passed: false,
            reason: `Lever modifies ${scope} which is outside allowed scopes: ${allowedScopes.join(', ')}`,
            suggestion: `Only use levers that modify ${description}`
          };
        }
      }
      
      return { passed: true };
    }
  };
}

/**
 * Create mutation limit constraint
 */
export function createMutationLimitConstraint(
  allowCreate: boolean,
  allowDelete: boolean
): LeverConstraint {
  return {
    id: `mutation_limit_create:${allowCreate}_delete:${allowDelete}`,
    type: 'mutation_limit',
    description: `${!allowCreate ? 'No creation' : ''}${!allowCreate && !allowDelete ? ', ' : ''}${!allowDelete ? 'No deletion' : ''}`,
    hard: true,
    priority: 95,
    filter: (lever, context) => {
      if (!allowCreate && lever.affects.createsEntities) {
        return {
          passed: false,
          reason: 'Lever creates new entities but creation is not allowed',
          suggestion: 'Use levers that only modify existing entities'
        };
      }
      
      if (!allowDelete && lever.affects.deletesEntities) {
        return {
          passed: false,
          reason: 'Lever deletes entities but deletion is not allowed',
          suggestion: 'Use levers that only add or modify'
        };
      }
      
      return { passed: true };
    }
  };
}

/**
 * Create harmony-melody dependency constraint
 */
export function createHarmonyMelodyConstraint(
  preserveMelody: boolean
): LeverConstraint {
  return {
    id: 'harmony_melody_dependency',
    type: 'dependency',
    description: 'Harmony changes must preserve melody',
    hard: preserveMelody,
    priority: 85,
    filter: (lever, context) => {
      if (!lever.affects.harmonic) {
        return { passed: true };
      }
      
      if (lever.affects.melodic && preserveMelody) {
        return {
          passed: false,
          reason: 'Harmony lever also affects melody, but melody must be preserved',
          suggestion: 'Use harmony-only levers like voicing changes or bass movement'
        };
      }
      
      return { passed: true };
    }
  };
}

/**
 * Create capability constraint
 */
export function createCapabilityConstraint(
  requiredCapability: string,
  operationType: string
): LeverConstraint {
  return {
    id: `capability_${requiredCapability}_for_${operationType}`,
    type: 'capability',
    description: `Require ${requiredCapability} capability for ${operationType}`,
    hard: true,
    priority: 100,
    filter: (lever, context) => {
      // Check if lever requires this capability
      const requiresCapability = lever.opcodes.some(op => 
        op.type.includes(operationType)
      );
      
      if (!requiresCapability) {
        return { passed: true };
      }
      
      if (!context.capabilities.includes(requiredCapability)) {
        return {
          passed: false,
          reason: `Lever requires ${requiredCapability} capability which is not available`,
          suggestion: `Enable ${requiredCapability} or use alternative levers`
        };
      }
      
      return { passed: true };
    }
  };
}

/**
 * Create safety constraint
 */
export function createSafetyConstraint(
  maxRisk: number,
  description: string
): LeverConstraint {
  return {
    id: `safety_max_risk_${maxRisk}`,
    type: 'safety',
    description: `Maximum risk: ${description}`,
    hard: false,
    priority: 60,
    filter: (lever, context) => {
      if (lever.affects.risk <= maxRisk) {
        return { passed: true };
      }
      
      // Check user risk tolerance
      const toleranceThresholds = {
        low: 0.3,
        medium: 0.6,
        high: 0.9
      };
      
      const userMax = toleranceThresholds[context.userPreferences.riskTolerance];
      
      if (lever.affects.risk <= userMax) {
        return {
          passed: true,
          reason: `Risk ${lever.affects.risk.toFixed(2)} exceeds default ${maxRisk} but within user tolerance ${userMax}`
        };
      }
      
      return {
        passed: false,
        reason: `Lever risk ${lever.affects.risk.toFixed(2)} exceeds maximum ${maxRisk} and user tolerance ${userMax}`,
        suggestion: 'Lower risk tolerance or choose safer levers'
      };
    }
  };
}

/**
 * Create board policy constraint
 */
export function createBoardPolicyConstraint(
  policy: BoardPolicy
): LeverConstraint {
  return {
    id: 'board_policy',
    type: 'capability',
    description: 'Enforce board policy restrictions',
    hard: true,
    priority: 100,
    filter: (lever, context) => {
      if (!policy.allowMutation) {
        return {
          passed: false,
          reason: 'Board policy does not allow mutations',
          suggestion: 'Switch to a board that allows editing'
        };
      }
      
      // Check if lever modifies restricted scopes
      for (const scope of lever.affects.modifiesScope) {
        if (!policy.allowedScopes.some(allowed => scope.includes(allowed))) {
          return {
            passed: false,
            reason: `Scope ${scope} is not in board's allowed scopes`,
            suggestion: `Only modify ${policy.allowedScopes.join(', ')}`
          };
        }
      }
      
      // Check for restricted operations
      for (const opcode of lever.opcodes) {
        if (policy.restrictedOperations.includes(opcode.type)) {
          return {
            passed: false,
            reason: `Operation ${opcode.type} is restricted by board policy`,
            suggestion: `Avoid using ${policy.restrictedOperations.join(', ')}`
          };
        }
      }
      
      return { passed: true };
    }
  };
}

// ============================================================================
// CONSTRAINT FILTER ENGINE
// ============================================================================

/**
 * Engine for applying constraint filters to candidate levers
 */
export class ConstraintFilterEngine {
  private registry: ConstraintFilterRegistry;

  constructor(registry?: ConstraintFilterRegistry) {
    this.registry = registry || new ConstraintFilterRegistry();
  }

  /**
   * Filter candidate levers by all constraints
   */
  filterLevers(
    candidates: readonly CandidateLever[],
    context: FilterContext
  ): FilteredLevers {
    const results: LeverFilterResult[] = [];
    const constraints = this.getSortedConstraints();
    
    for (const lever of candidates) {
      const result = this.filterSingleLever(lever, constraints, context);
      results.push(result);
    }
    
    const passed = results.filter(r => r.passed);
    const rejected = results.filter(r => !r.passed);
    
    return {
      passed: passed.map(r => r.lever),
      rejected,
      statistics: this.computeStatistics(results, constraints)
    };
  }

  /**
   * Filter a single lever
   */
  private filterSingleLever(
    lever: CandidateLever,
    constraints: readonly LeverConstraint[],
    context: FilterContext
  ): LeverFilterResult {
    const violations: ConstraintViolation[] = [];
    
    for (const constraint of constraints) {
      const result = constraint.filter(lever, context);
      
      if (!result.passed) {
        violations.push({
          constraint: constraint.id,
          hard: constraint.hard,
          reason: result.reason || 'Constraint not satisfied',
          suggestion: result.suggestion,
          alternativeLever: result.alternativeLever
        });
        
        // Stop at first hard constraint violation
        if (constraint.hard) {
          break;
        }
      }
    }
    
    const passed = violations.length === 0 || violations.every(v => !v.hard);
    
    return {
      lever,
      passed,
      violations,
      hardViolations: violations.filter(v => v.hard),
      softViolations: violations.filter(v => !v.hard)
    };
  }

  /**
   * Get constraints sorted by priority (highest first)
   */
  private getSortedConstraints(): readonly LeverConstraint[] {
    return this.registry.getAll().sort((a, b) => b.priority - a.priority);
  }

  /**
   * Compute filtering statistics
   */
  private computeStatistics(
    results: readonly LeverFilterResult[],
    constraints: readonly LeverConstraint[]
  ): FilterStatistics {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const rejected = total - passed;
    
    const constraintCounts = new Map<string, number>();
    for (const result of results) {
      for (const violation of result.violations) {
        const count = constraintCounts.get(violation.constraint) || 0;
        constraintCounts.set(violation.constraint, count + 1);
      }
    }
    
    const mostRestrictive = Array.from(constraintCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([constraint, count]) => ({ constraint, rejectedCount: count }));
    
    return {
      totalCandidates: total,
      passedCount: passed,
      rejectedCount: rejected,
      passRate: total > 0 ? passed / total : 0,
      mostRestrictive,
      constraintsApplied: constraints.length
    };
  }

  /**
   * Register a new constraint
   */
  addConstraint(constraint: LeverConstraint): void {
    this.registry.register(constraint);
  }

  /**
   * Get the constraint registry
   */
  getRegistry(): ConstraintFilterRegistry {
    return this.registry;
  }
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Result of filtering levers
 */
export interface FilteredLevers {
  readonly passed: readonly CandidateLever[];
  readonly rejected: readonly LeverFilterResult[];
  readonly statistics: FilterStatistics;
}

/**
 * Result of filtering a single lever
 */
export interface LeverFilterResult {
  readonly lever: CandidateLever;
  readonly passed: boolean;
  readonly violations: readonly ConstraintViolation[];
  readonly hardViolations: readonly ConstraintViolation[];
  readonly softViolations: readonly ConstraintViolation[];
}

/**
 * Constraint violation
 */
export interface ConstraintViolation {
  readonly constraint: string;
  readonly hard: boolean;
  readonly reason: string;
  readonly suggestion?: string;
  readonly alternativeLever?: string;
}

/**
 * Filter statistics
 */
export interface FilterStatistics {
  readonly totalCandidates: number;
  readonly passedCount: number;
  readonly rejectedCount: number;
  readonly passRate: number;
  readonly mostRestrictive: readonly { constraint: string; rejectedCount: number }[];
  readonly constraintsApplied: number;
}

// ============================================================================
// CONSTRAINT COMPOSITION
// ============================================================================

/**
 * Compose multiple constraints with AND logic
 */
export function andConstraints(...constraints: LeverConstraint[]): LeverConstraint {
  return {
    id: `and_${constraints.map(c => c.id).join('_')}`,
    type: 'custom',
    description: `All of: ${constraints.map(c => c.description).join(', ')}`,
    hard: constraints.some(c => c.hard),
    priority: Math.max(...constraints.map(c => c.priority)),
    filter: (lever, context) => {
      for (const constraint of constraints) {
        const result = constraint.filter(lever, context);
        if (!result.passed) {
          return result;
        }
      }
      return { passed: true };
    }
  };
}

/**
 * Compose multiple constraints with OR logic
 */
export function orConstraints(...constraints: LeverConstraint[]): LeverConstraint {
  return {
    id: `or_${constraints.map(c => c.id).join('_')}`,
    type: 'custom',
    description: `Any of: ${constraints.map(c => c.description).join(', ')}`,
    hard: constraints.every(c => c.hard),
    priority: Math.min(...constraints.map(c => c.priority)),
    filter: (lever, context) => {
      const reasons: string[] = [];
      
      for (const constraint of constraints) {
        const result = constraint.filter(lever, context);
        if (result.passed) {
          return { passed: true };
        }
        if (result.reason) {
          reasons.push(result.reason);
        }
      }
      
      return {
        passed: false,
        reason: `None of the constraints satisfied: ${reasons.join('; ')}`,
        suggestion: 'Consider alternative levers or relax constraints'
      };
    }
  };
}

/**
 * Negate a constraint
 */
export function notConstraint(constraint: LeverConstraint): LeverConstraint {
  return {
    id: `not_${constraint.id}`,
    type: constraint.type,
    description: `Not: ${constraint.description}`,
    hard: constraint.hard,
    priority: constraint.priority,
    filter: (lever, context) => {
      const result = constraint.filter(lever, context);
      return {
        passed: !result.passed,
        reason: result.passed ? `Lever satisfies ${constraint.description} but must not` : undefined
      };
    }
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create a default constraint filter engine with common constraints
 */
export function createDefaultFilterEngine(
  preserveMelody: boolean = true,
  allowNewTracks: boolean = false
): ConstraintFilterEngine {
  const registry = new ConstraintFilterRegistry();
  const engine = new ConstraintFilterEngine(registry);
  
  // Add common constraints
  if (preserveMelody) {
    engine.addConstraint(createPreservationConstraint('melody', true));
  }
  
  engine.addConstraint(createMutationLimitConstraint(allowNewTracks, false));
  engine.addConstraint(createSafetyConstraint(0.7, 'moderate risk'));
  
  return engine;
}

/**
 * Explain why a lever was rejected
 */
export function explainRejection(result: LeverFilterResult): string {
  if (result.passed) {
    return `Lever ${result.lever.name} passed all constraints`;
  }
  
  const hardViolations = result.hardViolations;
  const softViolations = result.softViolations;
  
  const parts: string[] = [`Lever ${result.lever.name} was rejected:`];
  
  if (hardViolations.length > 0) {
    parts.push(`\nHard constraint violations:`);
    for (const v of hardViolations) {
      parts.push(`  - ${v.reason}`);
      if (v.suggestion) {
        parts.push(`    Suggestion: ${v.suggestion}`);
      }
    }
  }
  
  if (softViolations.length > 0) {
    parts.push(`\nSoft constraint violations:`);
    for (const v of softViolations) {
      parts.push(`  - ${v.reason}`);
    }
  }
  
  return parts.join('\n');
}

/**
 * Get suggestions from rejected levers
 */
export function getSuggestions(rejected: readonly LeverFilterResult[]): readonly string[] {
  const suggestions: string[] = [];
  
  for (const result of rejected) {
    for (const violation of result.violations) {
      if (violation.suggestion && !suggestions.includes(violation.suggestion)) {
        suggestions.push(violation.suggestion);
      }
    }
  }
  
  return suggestions;
}

/**
 * Find alternative levers from rejections
 */
export function findAlternatives(
  rejected: readonly LeverFilterResult[],
  allLevers: readonly CandidateLever[]
): readonly CandidateLever[] {
  const alternativeIds = new Set<string>();
  
  for (const result of rejected) {
    for (const violation of result.violations) {
      if (violation.alternativeLever) {
        alternativeIds.add(violation.alternativeLever);
      }
    }
  }
  
  return allLevers.filter(lever => alternativeIds.has(lever.id));
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ConstraintFilterRegistry,
  ConstraintFilterEngine
};
