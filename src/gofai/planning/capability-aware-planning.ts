/**
 * @file Capability-Aware Planning
 * @module gofai/planning/capability-aware-planning
 *
 * Implements Step 273 from gofai_goalB.md:
 * - If production layer disabled, map perceptual goals to alternative levers
 * - E.g., "wider" → orchestration levers instead of DSP stereo width
 * - Adapt planning strategy based on what's editable in current context
 * - Ensure plans stay within capability boundaries
 *
 * Key Principles:
 * - Never generate plans that require disabled capabilities
 * - Suggest alternative approaches when primary levers are unavailable
 * - Maintain semantic intent while changing implementation strategy
 * - Be transparent about capability limitations in explanations
 *
 * @see src/gofai/canon/capability-model.ts (capability definitions)
 * @see src/gofai/planning/lever-mappings.ts (primary lever mappings)
 * @see src/gofai/planning/plan-generation.ts (plan generation)
 */

import type { Goal, Constraint } from '../canon/goals-constraints';
import type { Capability, CapabilityContext } from '../canon/capability-model';
import type { Lever, LeverContext } from './lever-mappings';
import type { Opcode, OpcodeCategory } from './plan-types';
import type { MusicalAxis } from '../canon/musical-dimensions';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of capability-aware lever selection.
 */
export interface CapabilityAwareLeverSelection {
  /** Available levers given current capabilities */
  readonly availableLevers: readonly Lever[];

  /** Levers that were filtered out due to capability restrictions */
  readonly filteredLevers: readonly Lever[];

  /** Reasons for filtering (for user explanation) */
  readonly filterReasons: ReadonlyMap<string, string>;

  /** Alternative strategies suggested when primary levers unavailable */
  readonly alternatives: readonly AlternativeStrategy[];

  /** Whether the goal is fully satisfiable with available capabilities */
  readonly isFullySatisfiable: boolean;

  /** Warnings about capability limitations */
  readonly warnings: readonly string[];
}

/**
 * Alternative strategy when primary approach is disabled.
 */
export interface AlternativeStrategy {
  /** Description of the alternative */
  readonly description: string;

  /** Levers that implement this alternative */
  readonly levers: readonly Lever[];

  /** How well this satisfies the original goal (0.0-1.0) */
  readonly satisfactionRatio: number;

  /** Why this alternative works */
  readonly rationale: string;
}

/**
 * Mapping from axis to alternative levers when primary capability disabled.
 */
export interface AxisAlternatives {
  /** The perceptual axis */
  readonly axis: MusicalAxis;

  /** Primary capability required for standard implementation */
  readonly primaryCapability: Capability;

  /** Alternative lever categories when primary is disabled */
  readonly alternatives: ReadonlyMap<Capability, readonly Lever[]>;

  /** Explanation of how alternatives achieve similar effect */
  readonly alternativeRationale: string;
}

// ============================================================================
// Axis Alternative Definitions
// ============================================================================

/**
 * Standard alternatives for common axes when capabilities are restricted.
 *
 * Examples:
 * - "wider" normally → DSP stereo width (production capability)
 * - "wider" fallback → orchestration (panning, doubling) (routing capability)
 * - "wider" final fallback → arrangement (add complementary parts) (events capability)
 */
const AXIS_ALTERNATIVES: readonly AxisAlternatives[] = [
  // WIDTH ALTERNATIVES
  {
    axis: 'width',
    primaryCapability: 'production',
    alternatives: new Map([
      [
        'routing',
        [
          {
            id: 'lever:pan-distribution',
            axis: 'width',
            opcodes: ['distribute_panning', 'widen_stereo_field'],
            magnitudeRange: [0.0, 1.0],
            description: 'Distribute panning across stereo field',
          },
          {
            id: 'lever:double-and-pan',
            axis: 'width',
            opcodes: ['duplicate_layer', 'pan_copies_wide'],
            magnitudeRange: [0.0, 1.0],
            description: 'Duplicate layers and pan them wide',
          },
        ],
      ],
      [
        'events',
        [
          {
            id: 'lever:add-complementary-parts',
            axis: 'width',
            opcodes: ['add_countermelody', 'add_pad_layer'],
            magnitudeRange: [0.0, 1.0],
            description: 'Add complementary parts for fuller sound',
          },
        ],
      ],
    ]),
    alternativeRationale:
      'Stereo width can be achieved through panning/doubling (routing) or arrangement (adding parts)',
  },

  // BRIGHTNESS ALTERNATIVES
  {
    axis: 'brightness',
    primaryCapability: 'production',
    alternatives: new Map([
      [
        'events',
        [
          {
            id: 'lever:register-shift',
            axis: 'brightness',
            opcodes: ['shift_register_up', 'add_octave_layer'],
            magnitudeRange: [0.0, 1.0],
            description: 'Shift notes to higher register',
          },
          {
            id: 'lever:voicing-open',
            axis: 'brightness',
            opcodes: ['open_voicings', 'spread_chord'],
            magnitudeRange: [0.0, 1.0],
            description: 'Open up chord voicings',
          },
        ],
      ],
    ]),
    alternativeRationale:
      'Brightness can be increased by shifting to higher registers or opening voicings',
  },

  // PUNCH ALTERNATIVES
  {
    axis: 'punch',
    primaryCapability: 'production',
    alternatives: new Map([
      [
        'events',
        [
          {
            id: 'lever:accent-attacks',
            axis: 'punch',
            opcodes: ['increase_attack_velocity', 'shorten_releases'],
            magnitudeRange: [0.0, 1.0],
            description: 'Emphasize note attacks with higher velocity',
          },
          {
            id: 'lever:quantize-tighter',
            axis: 'punch',
            opcodes: ['quantize_tight', 'reduce_timing_variance'],
            magnitudeRange: [0.0, 1.0],
            description: 'Tighten timing for more precise attacks',
          },
        ],
      ],
    ]),
    alternativeRationale: 'Punch can be achieved through tighter timing and stronger attacks',
  },

  // INTIMACY ALTERNATIVES
  {
    axis: 'intimacy',
    primaryCapability: 'production',
    alternatives: new Map([
      [
        'routing',
        [
          {
            id: 'lever:narrow-field',
            axis: 'intimacy',
            opcodes: ['narrow_panning', 'reduce_reverb_width'],
            magnitudeRange: [0.0, 1.0],
            description: 'Narrow the stereo field',
          },
        ],
      ],
      [
        'events',
        [
          {
            id: 'lever:thin-arrangement',
            axis: 'intimacy',
            opcodes: ['reduce_layer_count', 'simplify_texture'],
            magnitudeRange: [0.0, 1.0],
            description: 'Reduce layers for simpler, closer sound',
          },
          {
            id: 'lever:close-register',
            axis: 'intimacy',
            opcodes: ['close_voicings', 'lower_register'],
            magnitudeRange: [0.0, 1.0],
            description: 'Use close voicings in lower register',
          },
        ],
      ],
    ]),
    alternativeRationale:
      'Intimacy can be created through narrow panning or simpler, closer arrangements',
  },

  // LIFT ALTERNATIVES
  {
    axis: 'lift',
    primaryCapability: 'production',
    alternatives: new Map([
      [
        'events',
        [
          {
            id: 'lever:add-energy',
            axis: 'lift',
            opcodes: ['increase_density', 'add_movement_layer'],
            magnitudeRange: [0.0, 1.0],
            description: 'Add layers or increase note density',
          },
          {
            id: 'lever:register-lift',
            axis: 'lift',
            opcodes: ['shift_register_up', 'add_high_harmony'],
            magnitudeRange: [0.0, 1.0],
            description: 'Shift to higher register or add high harmonies',
          },
          {
            id: 'lever:brighten-voicing',
            axis: 'lift',
            opcodes: ['open_voicings', 'add_extensions'],
            magnitudeRange: [0.0, 1.0],
            description: 'Open voicings and add chord extensions',
          },
        ],
      ],
    ]),
    alternativeRationale:
      'Lift can be achieved through density, register, and harmonic richness',
  },

  // BUSYNESS ALTERNATIVES
  {
    axis: 'busyness',
    primaryCapability: 'events',
    alternatives: new Map([
      [
        'events',
        [
          {
            id: 'lever:density-adjust',
            axis: 'busyness',
            opcodes: ['adjust_note_density', 'thin_texture'],
            magnitudeRange: [-1.0, 1.0],
            description: 'Add or remove notes to adjust density',
          },
        ],
      ],
    ]),
    alternativeRationale: 'Busyness is primarily controlled through note density',
  },

  // DARKNESS ALTERNATIVES
  {
    axis: 'darkness',
    primaryCapability: 'production',
    alternatives: new Map([
      [
        'events',
        [
          {
            id: 'lever:lower-register',
            axis: 'darkness',
            opcodes: ['shift_register_down', 'close_voicings'],
            magnitudeRange: [0.0, 1.0],
            description: 'Lower register and close voicings',
          },
          {
            id: 'lever:reduce-brightness',
            axis: 'darkness',
            opcodes: ['remove_high_notes', 'thicken_texture'],
            magnitudeRange: [0.0, 1.0],
            description: 'Remove high frequencies and thicken texture',
          },
        ],
      ],
    ]),
    alternativeRationale: 'Darkness can be achieved through lower registers and closed voicings',
  },
];

// ============================================================================
// Capability-Aware Lever Selection
// ============================================================================

/**
 * Select levers for a goal, respecting current capability restrictions.
 *
 * Strategy:
 * 1. Get standard levers for the goal
 * 2. Filter out levers requiring disabled capabilities
 * 3. Find alternatives from fallback capability levels
 * 4. Return available levers + alternatives + warnings
 *
 * @param goal - The musical goal to satisfy
 * @param capabilities - Current capability context
 * @param context - Additional planning context
 * @returns Capability-aware lever selection
 */
export function selectLeversWithCapabilities(
  goal: Goal,
  capabilities: CapabilityContext,
  context: LeverContext
): CapabilityAwareLeverSelection {
  const availableLevers: Lever[] = [];
  const filteredLevers: Lever[] = [];
  const filterReasons = new Map<string, string>();
  const alternatives: AlternativeStrategy[] = [];
  const warnings: string[] = [];

  // Get standard levers for this goal
  const standardLevers = getStandardLeversForGoal(goal, context);

  // Filter by capability
  for (const lever of standardLevers) {
    const requiredCapability = getLeverRequiredCapability(lever);
    if (capabilities.hasCapability(requiredCapability)) {
      availableLevers.push(lever);
    } else {
      filteredLevers.push(lever);
      filterReasons.set(
        lever.id,
        `Requires ${requiredCapability} capability (currently disabled)`
      );
    }
  }

  // Find alternatives if primary levers were filtered
  if (filteredLevers.length > 0) {
    const axisAlternatives = findAxisAlternatives(goal, capabilities);
    alternatives.push(...axisAlternatives);

    // Add alternative levers to available set
    for (const alt of alternatives) {
      availableLevers.push(...alt.levers);
    }

    // Add warning about using alternatives
    if (alternatives.length > 0) {
      warnings.push(
        `Using alternative approach: ${alternatives[0].description} (${alternatives[0].rationale})`
      );
    } else {
      warnings.push(
        `Cannot fully satisfy goal: required capabilities are disabled`
      );
    }
  }

  const isFullySatisfiable =
    availableLevers.length > 0 &&
    (filteredLevers.length === 0 || alternatives.length > 0);

  return {
    availableLevers,
    filteredLevers,
    filterReasons,
    alternatives,
    isFullySatisfiable,
    warnings,
  };
}

/**
 * Get standard levers for a goal (without capability filtering).
 */
function getStandardLeversForGoal(goal: Goal, context: LeverContext): readonly Lever[] {
  // Import actual lever mappings
  // For now, return empty array; will be connected to real lever-mappings.ts
  return [];
}

/**
 * Determine which capability a lever requires.
 */
function getLeverRequiredCapability(lever: Lever): Capability {
  // Map opcode categories to capabilities
  const opcodeCategories = lever.opcodes.map(getOpcodeCategory);

  if (opcodeCategories.includes('production')) return 'production';
  if (opcodeCategories.includes('routing')) return 'routing';
  if (opcodeCategories.includes('events')) return 'events';

  return 'inspect'; // Default safe capability
}

/**
 * Get opcode category from opcode ID.
 */
function getOpcodeCategory(opcodeId: string): OpcodeCategory {
  if (opcodeId.includes('filter') || opcodeId.includes('reverb') || opcodeId.includes('eq')) {
    return 'production';
  }
  if (opcodeId.includes('pan') || opcodeId.includes('routing') || opcodeId.includes('send')) {
    return 'routing';
  }
  return 'events';
}

/**
 * Find alternative strategies for an axis when primary capability is disabled.
 */
function findAxisAlternatives(
  goal: Goal,
  capabilities: CapabilityContext
): readonly AlternativeStrategy[] {
  const strategies: AlternativeStrategy[] = [];

  // Find axis alternatives that match this goal
  for (const axisAlt of AXIS_ALTERNATIVES) {
    if (!goalMatchesAxis(goal, axisAlt.axis)) continue;

    // Check if primary capability is disabled
    if (capabilities.hasCapability(axisAlt.primaryCapability)) continue;

    // Find available fallback capabilities
    for (const [capability, levers] of axisAlt.alternatives) {
      if (capabilities.hasCapability(capability)) {
        strategies.push({
          description: `Use ${capability} approach instead of ${axisAlt.primaryCapability}`,
          levers: Array.from(levers),
          satisfactionRatio: computeSatisfactionRatio(capability, axisAlt.primaryCapability),
          rationale: axisAlt.alternativeRationale,
        });
      }
    }
  }

  return strategies;
}

/**
 * Check if goal targets a specific axis.
 */
function goalMatchesAxis(goal: Goal, axis: MusicalAxis): boolean {
  // Check if goal has a target axis field
  if ('targetAxis' in goal && goal.targetAxis === axis) {
    return true;
  }

  // Check if goal description mentions axis
  const descriptionLower = goal.description.toLowerCase();
  const axisKeywords: Record<string, readonly string[]> = {
    width: ['wider', 'narrow', 'stereo', 'width'],
    brightness: ['brighter', 'darker', 'bright', 'dark'],
    punch: ['punchy', 'punch', 'impact'],
    intimacy: ['intimate', 'close', 'distant'],
    lift: ['lift', 'energy', 'excitement'],
    busyness: ['busy', 'dense', 'sparse', 'thin'],
    darkness: ['dark', 'darker', 'dim'],
  };

  const keywords = axisKeywords[axis] || [];
  return keywords.some((kw) => descriptionLower.includes(kw));
}

/**
 * Compute how well an alternative satisfies the goal vs. primary approach.
 */
function computeSatisfactionRatio(
  alternative: Capability,
  primary: Capability
): number {
  // Heuristic satisfaction ratios
  const ratios: Record<string, Record<string, number>> = {
    production: {
      routing: 0.7,
      events: 0.5,
    },
    routing: {
      events: 0.6,
    },
  };

  return ratios[primary]?.[alternative] ?? 0.5;
}

// ============================================================================
// Capability Checking for Plans
// ============================================================================

/**
 * Check if a plan respects capability boundaries.
 * Returns violations if any opcodes require disabled capabilities.
 */
export function checkPlanCapabilities(
  opcodes: readonly Opcode[],
  capabilities: CapabilityContext
): CapabilityViolation[] {
  const violations: CapabilityViolation[] = [];

  for (const opcode of opcodes) {
    const required = getOpcodeRequiredCapability(opcode);
    if (!capabilities.hasCapability(required)) {
      violations.push({
        opcode,
        requiredCapability: required,
        reason: `Opcode '${opcode.type}' requires ${required} capability`,
      });
    }
  }

  return violations;
}

/**
 * A capability violation in a plan.
 */
export interface CapabilityViolation {
  readonly opcode: Opcode;
  readonly requiredCapability: Capability;
  readonly reason: string;
}

/**
 * Get the capability required by an opcode.
 */
function getOpcodeRequiredCapability(opcode: Opcode): Capability {
  const category = getOpcodeCategory(opcode.type);
  const capabilityMap: Record<OpcodeCategory, Capability> = {
    production: 'production',
    routing: 'routing',
    events: 'events',
    ui: 'inspect',
    analysis: 'inspect',
  };
  return capabilityMap[category] || 'inspect';
}

// ============================================================================
// Exports
// ============================================================================

export { AXIS_ALTERNATIVES };
export type { CapabilityAwareLeverSelection, AlternativeStrategy, AxisAlternatives };
