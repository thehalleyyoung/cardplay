/**
 * @fileoverview Step 291: User Preference Profiles for Lever Selection
 * 
 * Integrates user preference profiles into planning, so terms like "dark" or
 * "bright" are interpreted according to the user's personal aesthetic and 
 * production style preferences. Profiles influence which levers are chosen
 * and how parameters are weighted.
 * 
 * Phase 5, Planning Layer (Steps 251-300)
 * 
 * Core Principles:
 * - User preferences stored as typed profile structures
 * - Preferences influence lever selection but don't violate constraints
 * - Profiles can be learned from past edits or explicitly configured
 * - Multiple profiles can coexist (per-project, per-genre, global defaults)
 * - Profiles are versioned and migratable
 * - All preferences are explainable (why a lever was chosen)
 * 
 * Integration:
 * - Works with lever-mappings.ts to adjust weights
 * - Works with plan-generation.ts to influence scoring
 * - Works with parameter-inference.ts for amount interpretation
 * - Profiles stored in user settings, not in project files
 */

import type { GofaiId } from '../canon/gofai-id';
import type { AxisId } from '../canon/types';
import type { Lever } from './lever-mappings';

// ============================================================================
// Profile Types
// ============================================================================

/**
 * Version marker for preference profile format.
 * Increment when profile schema changes incompatibly.
 */
export type PreferenceProfileVersion = '1.0.0';

/**
 * Scope for preference application.
 */
export type PreferenceScope = 
  | 'global'       // Default for all projects
  | 'genre'        // Genre-specific (e.g., "dark" in metal vs jazz)
  | 'project'      // Project-specific overrides
  | 'session';     // Temporary session preferences

/**
 * How strongly a preference influences planning.
 */
export type PreferenceWeight = 
  | 'weak'         // Minor influence (10% weight adjustment)
  | 'moderate'     // Medium influence (30% weight adjustment)
  | 'strong'       // Strong influence (60% weight adjustment)
  | 'dominant';    // Dominant influence (90% weight adjustment)

/**
 * Axis interpretation: how a perceptual axis maps to concrete levers
 * based on user's aesthetic preferences.
 */
export interface AxisInterpretation {
  readonly axis: AxisId;
  
  /**
   * Preferred levers for increasing this axis.
   * Order matters: first is most preferred.
   */
  readonly increasingLevers: readonly Lever[];
  
  /**
   * Preferred levers for decreasing this axis.
   */
  readonly decreasingLevers: readonly Lever[];
  
  /**
   * Relative weight adjustments for each lever.
   * 1.0 = neutral, >1 = prefer, <1 = avoid.
   */
  readonly leverWeights: ReadonlyMap<Lever, number>;
  
  /**
   * Default amount when user says "darker" without quantity.
   * Range: [0, 1] where 0.3 = "a little", 0.6 = "moderately", 0.9 = "a lot"
   */
  readonly defaultAmount: number;
  
  /**
   * Whether this axis interpretation applies to specific genres.
   */
  readonly genres?: readonly string[];
  
  /**
   * Explanation of why this interpretation exists.
   */
  readonly rationale?: string;
}

/**
 * Parameter scaling preference: how aggressively to apply changes.
 */
export interface ParameterScalingPreference {
  /**
   * Global multiplier on all parameter changes.
   * 0.5 = conservative, 1.0 = neutral, 2.0 = aggressive
   */
  readonly globalScale: number;
  
  /**
   * Per-axis multipliers.
   */
  readonly axisScales: ReadonlyMap<AxisId, number>;
  
  /**
   * Per-parameter-type multipliers (e.g., prefer larger filter changes).
   */
  readonly paramTypeScales: ReadonlyMap<string, number>;
}

/**
 * Constraint preferences: default constraints user prefers.
 */
export interface ConstraintPreferences {
  /**
   * Automatically add these constraints unless explicitly overridden.
   * E.g., ["preserve_melody_exact", "preserve_key"]
   */
  readonly implicitConstraints: readonly GofaiId[];
  
  /**
   * Never allow these operations unless explicitly requested.
   */
  readonly forbiddenOperations: readonly string[];
  
  /**
   * Always require preview for these operation types.
   */
  readonly previewRequired: readonly string[];
}

/**
 * Planning style: how conservative or experimental the planner should be.
 */
export interface PlanningStylePreference {
  /**
   * Risk tolerance: how willing to make large changes.
   */
  readonly riskTolerance: 'very_conservative' | 'conservative' | 'balanced' | 'experimental' | 'aggressive';
  
  /**
   * Prefer fewer larger changes or many smaller changes?
   */
  readonly changeGranularity: 'coarse' | 'balanced' | 'fine';
  
  /**
   * How much to favor musical theory-driven suggestions vs perceptual levers.
   */
  readonly theoryWeight: number; // 0 = ignore theory, 1 = theory-first
  
  /**
   * Prefer structural edits or parameter tweaks?
   */
  readonly structuralBias: number; // 0 = params only, 1 = structure-first
}

/**
 * Genre-specific vocabulary: how terms map to levers in a genre context.
 */
export interface GenreVocabularyProfile {
  readonly genre: string;
  
  /**
   * Genre-specific axis interpretations.
   * E.g., "aggressive" in metal = distortion, in jazz = accents
   */
  readonly axisInterpretations: readonly AxisInterpretation[];
  
  /**
   * Genre-specific term meanings.
   * E.g., "tight" in EDM = quantize hard, in jazz = sync time feel
   */
  readonly termMappings: ReadonlyMap<string, Lever>;
  
  /**
   * Typical constraints for this genre.
   */
  readonly defaultConstraints: readonly GofaiId[];
}

/**
 * Complete user preference profile.
 */
export interface UserPreferenceProfile {
  readonly version: PreferenceProfileVersion;
  readonly id: GofaiId;
  readonly name: string;
  readonly scope: PreferenceScope;
  
  /**
   * When this profile was created/modified.
   */
  readonly created: string;
  readonly modified: string;
  
  /**
   * Axis interpretations (how "dark", "bright", etc. are understood).
   */
  readonly axisInterpretations: readonly AxisInterpretation[];
  
  /**
   * Parameter scaling preferences.
   */
  readonly parameterScaling: ParameterScalingPreference;
  
  /**
   * Constraint preferences.
   */
  readonly constraints: ConstraintPreferences;
  
  /**
   * Planning style.
   */
  readonly planningStyle: PlanningStylePreference;
  
  /**
   * Genre-specific profiles.
   */
  readonly genreProfiles: readonly GenreVocabularyProfile[];
  
  /**
   * User-defined metadata.
   */
  readonly metadata: {
    readonly description?: string;
    readonly tags?: readonly string[];
    readonly author?: string;
  };
}

// ============================================================================
// Profile Resolution
// ============================================================================

/**
 * Context for profile resolution: what information is available to select
 * the right profile.
 */
export interface ProfileResolutionContext {
  readonly projectId?: GofaiId;
  readonly detectedGenre?: string;
  readonly userSpecifiedGenre?: string;
  readonly sessionPreferences?: Partial<UserPreferenceProfile>;
}

/**
 * Result of resolving preferences for a planning context.
 */
export interface ResolvedPreferences {
  /**
   * The profiles that were merged to produce this result, in priority order.
   */
  readonly sourceProfiles: readonly UserPreferenceProfile[];
  
  /**
   * Final axis interpretations after merging.
   */
  readonly axisInterpretations: ReadonlyMap<AxisId, AxisInterpretation>;
  
  /**
   * Final parameter scaling.
   */
  readonly parameterScaling: ParameterScalingPreference;
  
  /**
   * Final constraints.
   */
  readonly constraints: ConstraintPreferences;
  
  /**
   * Final planning style.
   */
  readonly planningStyle: PlanningStylePreference;
  
  /**
   * Provenance: which profile contributed which preference.
   */
  readonly provenance: ReadonlyMap<string, GofaiId>;
}

/**
 * Resolve preferences from multiple profiles.
 * 
 * Resolution order (highest priority first):
 * 1. Session preferences
 * 2. Project-specific preferences
 * 3. Genre-specific preferences
 * 4. Global user preferences
 * 5. System defaults
 */
export function resolvePreferences(
  context: ProfileResolutionContext,
  availableProfiles: readonly UserPreferenceProfile[]
): ResolvedPreferences {
  // Sort profiles by priority
  const orderedProfiles = [...prioritizeProfiles(availableProfiles, context)];
  
  // Merge axis interpretations
  const axisMap = new Map<AxisId, AxisInterpretation>();
  const provenance = new Map<string, GofaiId>();
  
  for (const profile of orderedProfiles.reverse()) {
    for (const interp of profile.axisInterpretations) {
      axisMap.set(interp.axis, interp);
      provenance.set(`axis:${interp.axis}`, profile.id);
    }
  }
  
  // Merge genre-specific interpretations if genre is known
  const genre = context.userSpecifiedGenre ?? context.detectedGenre;
  if (genre) {
    for (const profile of [...orderedProfiles].reverse()) {
      const genreProfile = profile.genreProfiles.find((gp: GenreVocabularyProfile) => gp.genre === genre);
      if (genreProfile) {
        for (const interp of genreProfile.axisInterpretations) {
          // Genre-specific overrides general interpretation
          axisMap.set(interp.axis, interp);
          provenance.set(`axis:${interp.axis}`, profile.id);
        }
      }
    }
  }
  
  // Merge parameter scaling (average with weighting)
  const parameterScaling = mergeParameterScaling(orderedProfiles);
  
  // Merge constraints (union of implicit, intersection of forbidden)
  const constraints = mergeConstraints(orderedProfiles);
  
  // Merge planning style (weighted average)
  const planningStyle = mergePlanningStyle(orderedProfiles);
  
  return {
    sourceProfiles: orderedProfiles,
    axisInterpretations: axisMap,
    parameterScaling,
    constraints,
    planningStyle,
    provenance,
  };
}

/**
 * Prioritize profiles by scope and context match.
 */
function prioritizeProfiles(
  profiles: readonly UserPreferenceProfile[],
  context: ProfileResolutionContext
): readonly UserPreferenceProfile[] {
  const scored = profiles.map(profile => {
    let score = 0;
    
    // Scope priority
    switch (profile.scope) {
      case 'session': score += 1000; break;
      case 'project': score += 100; break;
      case 'genre': score += 10; break;
      case 'global': score += 1; break;
    }
    
    // Genre match bonus
    const genre = context.userSpecifiedGenre ?? context.detectedGenre;
    if (genre && profile.genreProfiles.some(gp => gp.genre === genre)) {
      score += 50;
    }
    
    return { profile, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.profile);
}

/**
 * Merge parameter scaling from multiple profiles.
 */
function mergeParameterScaling(
  profiles: readonly UserPreferenceProfile[]
): ParameterScalingPreference {
  if (profiles.length === 0) {
    return {
      globalScale: 1.0,
      axisScales: new Map(),
      paramTypeScales: new Map(),
    };
  }
  
  // Weighted average of global scales
  const globalScale = profiles.reduce((sum, p) => 
    sum + p.parameterScaling.globalScale, 0) / profiles.length;
  
  // Merge axis scales (take most recent non-1.0 value)
  const axisScales = new Map<AxisId, number>();
  for (const profile of profiles) {
    for (const [axis, scale] of profile.parameterScaling.axisScales) {
      if (!axisScales.has(axis) || scale !== 1.0) {
        axisScales.set(axis, scale);
      }
    }
  }
  
  // Merge param type scales
  const paramTypeScales = new Map<string, number>();
  for (const profile of profiles) {
    for (const [type, scale] of profile.parameterScaling.paramTypeScales) {
      if (!paramTypeScales.has(type) || scale !== 1.0) {
        paramTypeScales.set(type, scale);
      }
    }
  }
  
  return { globalScale, axisScales, paramTypeScales };
}

/**
 * Merge constraint preferences from multiple profiles.
 */
function mergeConstraints(
  profiles: readonly UserPreferenceProfile[]
): ConstraintPreferences {
  if (profiles.length === 0) {
    return {
      implicitConstraints: [],
      forbiddenOperations: [],
      previewRequired: [],
    };
  }
  
  // Union of implicit constraints
  const implicitSet = new Set<GofaiId>();
  for (const profile of profiles) {
    for (const constraint of profile.constraints.implicitConstraints) {
      implicitSet.add(constraint);
    }
  }
  
  // Intersection of forbidden operations (most restrictive)
  let forbiddenSet: Set<string> | null = null;
  for (const profile of profiles) {
    const ops = new Set(profile.constraints.forbiddenOperations);
    if (forbiddenSet === null) {
      forbiddenSet = ops;
    } else {
      // Create intersection
      const intersection = new Set<string>();
      for (const op of Array.from(forbiddenSet)) {
        if (ops.has(op)) {
          intersection.add(op);
        }
      }
      forbiddenSet = intersection;
    }
  }
  
  // Union of preview required
  const previewSet = new Set<string>();
  for (const profile of profiles) {
    for (const op of profile.constraints.previewRequired) {
      previewSet.add(op);
    }
  }
  
  return {
    implicitConstraints: Array.from(implicitSet),
    forbiddenOperations: Array.from(forbiddenSet ?? []),
    previewRequired: Array.from(previewSet),
  };
}

/**
 * Merge planning style from multiple profiles.
 */
function mergePlanningStyle(
  profiles: readonly UserPreferenceProfile[]
): PlanningStylePreference {
  if (profiles.length === 0) {
    return {
      riskTolerance: 'balanced',
      changeGranularity: 'balanced',
      theoryWeight: 0.5,
      structuralBias: 0.5,
    };
  }
  
  // Map risk tolerance to numeric scale
  const riskMap = {
    'very_conservative': 0,
    'conservative': 0.25,
    'balanced': 0.5,
    'experimental': 0.75,
    'aggressive': 1.0,
  };
  
  const riskValues = profiles.map(p => riskMap[p.planningStyle.riskTolerance]);
  const avgRisk = riskValues.reduce((sum, v) => sum + v, 0) / riskValues.length;
  
  // Map back to category
  const riskTolerance = 
    avgRisk < 0.15 ? 'very_conservative' :
    avgRisk < 0.4 ? 'conservative' :
    avgRisk < 0.65 ? 'balanced' :
    avgRisk < 0.85 ? 'experimental' : 'aggressive';
  
  // Map granularity
  const granMap = { 'coarse': 0, 'balanced': 0.5, 'fine': 1.0 };
  const granValues = profiles.map(p => granMap[p.planningStyle.changeGranularity]);
  const avgGran = granValues.reduce((sum, v) => sum + v, 0) / granValues.length;
  const changeGranularity = avgGran < 0.33 ? 'coarse' : avgGran < 0.67 ? 'balanced' : 'fine';
  
  // Average numeric fields
  const theoryWeight = profiles.reduce((sum, p) => 
    sum + p.planningStyle.theoryWeight, 0) / profiles.length;
  const structuralBias = profiles.reduce((sum, p) => 
    sum + p.planningStyle.structuralBias, 0) / profiles.length;
  
  return {
    riskTolerance,
    changeGranularity,
    theoryWeight,
    structuralBias,
  };
}

// ============================================================================
// Applying Preferences to Planning
// ============================================================================

/**
 * Adjust lever weights based on user preferences.
 */
export function applyPreferencesToLeverWeights(
  levers: readonly Lever[],
  axis: AxisId,
  preferences: ResolvedPreferences
): Map<Lever, number> {
  const weights = new Map<Lever, number>();
  
  // Get axis interpretation
  const interpretation = preferences.axisInterpretations.get(axis);
  if (!interpretation) {
    // No preference, use neutral weights
    for (const lever of levers) {
      weights.set(lever, 1.0);
    }
    return weights;
  }
  
  // Apply preference weights
  for (const lever of levers) {
    const prefWeight = interpretation.leverWeights.get(lever) ?? 1.0;
    weights.set(lever, prefWeight);
  }
  
  return weights;
}

/**
 * Scale a parameter change amount by user preferences.
 */
export function scaleParameterByPreferences(
  _paramName: string,
  paramType: string,
  axis: AxisId,
  baseAmount: number,
  preferences: ResolvedPreferences
): number {
  let scaled = baseAmount;
  
  // Apply global scale
  scaled *= preferences.parameterScaling.globalScale;
  
  // Apply axis scale
  const axisScale = preferences.parameterScaling.axisScales.get(axis);
  if (axisScale !== undefined) {
    scaled *= axisScale;
  }
  
  // Apply param type scale
  const typeScale = preferences.parameterScaling.paramTypeScales.get(paramType);
  if (typeScale !== undefined) {
    scaled *= typeScale;
  }
  
  return scaled;
}

/**
 * Get default amount for an axis based on user preferences.
 */
export function getDefaultAmountForAxis(
  axis: AxisId,
  preferences: ResolvedPreferences
): number {
  const interpretation = preferences.axisInterpretations.get(axis);
  return interpretation?.defaultAmount ?? 0.5; // Default to moderate
}

/**
 * Check if an operation is forbidden by user preferences.
 */
export function isOperationForbidden(
  operationType: string,
  preferences: ResolvedPreferences
): boolean {
  return preferences.constraints.forbiddenOperations.includes(operationType);
}

/**
 * Check if an operation requires preview by user preferences.
 */
export function requiresPreview(
  operationType: string,
  preferences: ResolvedPreferences
): boolean {
  return preferences.constraints.previewRequired.includes(operationType);
}

/**
 * Get implicit constraints to add based on user preferences.
 */
export function getImplicitConstraints(
  preferences: ResolvedPreferences
): readonly GofaiId[] {
  return preferences.constraints.implicitConstraints;
}

// ============================================================================
// Profile Learning
// ============================================================================

/**
 * Evidence from user's editing behavior to update preferences.
 */
export interface EditBehaviorEvidence {
  readonly axis: AxisId;
  readonly chosenLever: Lever;
  readonly amount: number;
  readonly genre?: string;
  readonly timestamp: string;
}

/**
 * Learn preference updates from editing behavior.
 * Returns suggested updates to axis interpretations.
 */
export function learnFromEditBehavior(
  evidence: readonly EditBehaviorEvidence[],
  currentProfile: UserPreferenceProfile
): readonly AxisInterpretation[] {
  // Group evidence by axis
  const byAxis = new Map<AxisId, EditBehaviorEvidence[]>();
  for (const ev of evidence) {
    const existing = byAxis.get(ev.axis) ?? [];
    byAxis.set(ev.axis, [...existing, ev]);
  }
  
  // Generate updated interpretations
  const updates: AxisInterpretation[] = [];
  
  for (const [axis, samples] of byAxis) {
    // Count lever frequencies
    const leverCounts = new Map<Lever, number>();
    for (const sample of samples) {
      leverCounts.set(sample.chosenLever, (leverCounts.get(sample.chosenLever) ?? 0) + 1);
    }
    
    // Sort by frequency
    const sortedLevers = Array.from(leverCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([lever]) => lever);
    
    // Compute average amount
    const avgAmount = samples.reduce((sum, s) => sum + s.amount, 0) / samples.length;
    
    // Build weights (higher for more frequent levers)
    const leverWeights = new Map<Lever, number>();
    const maxCount = Math.max(...Array.from(leverCounts.values()));
    for (const [lever, count] of leverCounts) {
      leverWeights.set(lever, count / maxCount); // 0 to 1
    }
    
    // Create interpretation
    const currentInterp = currentProfile.axisInterpretations.find(i => i.axis === axis);
    
    updates.push({
      axis,
      increasingLevers: sortedLevers,
      decreasingLevers: currentInterp?.decreasingLevers ?? [],
      leverWeights,
      defaultAmount: avgAmount,
      rationale: `Learned from ${samples.length} editing actions`,
    });
  }
  
  return updates;
}

// ============================================================================
// Default Profiles
// ============================================================================

/**
 * Create a conservative default profile.
 */
export function createConservativeProfile(): UserPreferenceProfile {
  return {
    version: '1.0.0',
    id: 'profile:default:conservative' as GofaiId,
    name: 'Conservative Default',
    scope: 'global',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    axisInterpretations: [],
    parameterScaling: {
      globalScale: 0.7, // Conservative scaling
      axisScales: new Map(),
      paramTypeScales: new Map(),
    },
    constraints: {
      implicitConstraints: [
        'constraint:preserve_melody' as GofaiId,
        'constraint:preserve_key' as GofaiId,
      ],
      forbiddenOperations: ['delete_section', 'add_track'],
      previewRequired: ['reharmonize', 'transpose', 'quantize_hard'],
    },
    planningStyle: {
      riskTolerance: 'conservative',
      changeGranularity: 'fine',
      theoryWeight: 0.7,
      structuralBias: 0.2,
    },
    genreProfiles: [],
    metadata: {
      description: 'Safe, minimal-change approach with strong constraint enforcement',
      tags: ['default', 'conservative', 'safe'],
    },
  };
}

/**
 * Create an experimental default profile.
 */
export function createExperimentalProfile(): UserPreferenceProfile {
  return {
    version: '1.0.0',
    id: 'profile:default:experimental' as GofaiId,
    name: 'Experimental Default',
    scope: 'global',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    axisInterpretations: [],
    parameterScaling: {
      globalScale: 1.3, // Aggressive scaling
      axisScales: new Map(),
      paramTypeScales: new Map(),
    },
    constraints: {
      implicitConstraints: [],
      forbiddenOperations: [],
      previewRequired: [],
    },
    planningStyle: {
      riskTolerance: 'experimental',
      changeGranularity: 'coarse',
      theoryWeight: 0.3,
      structuralBias: 0.6,
    },
    genreProfiles: [],
    metadata: {
      description: 'Bold, structural changes with minimal constraint enforcement',
      tags: ['default', 'experimental', 'bold'],
    },
  };
}

/**
 * Create a balanced default profile.
 */
export function createBalancedProfile(): UserPreferenceProfile {
  return {
    version: '1.0.0',
    id: 'profile:default:balanced' as GofaiId,
    name: 'Balanced Default',
    scope: 'global',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    axisInterpretations: [],
    parameterScaling: {
      globalScale: 1.0,
      axisScales: new Map(),
      paramTypeScales: new Map(),
    },
    constraints: {
      implicitConstraints: ['constraint:preserve_key' as GofaiId],
      forbiddenOperations: [],
      previewRequired: ['delete_section', 'transpose'],
    },
    planningStyle: {
      riskTolerance: 'balanced',
      changeGranularity: 'balanced',
      theoryWeight: 0.5,
      structuralBias: 0.5,
    },
    genreProfiles: [],
    metadata: {
      description: 'Balanced approach between safety and experimentation',
      tags: ['default', 'balanced'],
    },
  };
}

// ============================================================================
// Profile Persistence (Integration Points)
// ============================================================================

/**
 * Profile storage interface (to be implemented by settings system).
 */
export interface ProfileStorage {
  saveProfile(profile: UserPreferenceProfile): Promise<void>;
  loadProfile(id: GofaiId): Promise<UserPreferenceProfile | null>;
  listProfiles(): Promise<readonly UserPreferenceProfile[]>;
  deleteProfile(id: GofaiId): Promise<void>;
}

/**
 * Profile manager: high-level API for profile operations.
 */
export class ProfileManager {
  constructor(private storage: ProfileStorage) {}
  
  async getActiveProfile(context: ProfileResolutionContext): Promise<ResolvedPreferences> {
    const profiles = await this.storage.listProfiles();
    return resolvePreferences(context, profiles);
  }
  
  async saveProfile(profile: UserPreferenceProfile): Promise<void> {
    await this.storage.saveProfile(profile);
  }
  
  async loadProfile(id: GofaiId): Promise<UserPreferenceProfile | null> {
    return await this.storage.loadProfile(id);
  }
  
  async createDefaultProfiles(): Promise<void> {
    await this.storage.saveProfile(createConservativeProfile());
    await this.storage.saveProfile(createBalancedProfile());
    await this.storage.saveProfile(createExperimentalProfile());
  }
}
