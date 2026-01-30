/**
 * GOFAI NL Semantics — Musical Preferences
 *
 * Typed representations for "preferences" as weighted soft constraints.
 * Preferences express "how" an edit should be accomplished, not "what."
 *
 * ## Preferences vs Constraints vs Goals
 *
 * - **Goals**: What to achieve ("make it brighter")
 * - **Constraints**: What must hold ("keep the melody the same")
 * - **Preferences**: How to do it ("prefer fewer changes", "use existing cards")
 *
 * Preferences are always soft: they guide the planner but can be violated
 * if no plan satisfies them all. They have weights that determine priority.
 *
 * ## Preference Categories
 *
 * 1. **Edit Style**: How edits should be made
 *    - "Make minimal changes" → least-change preference
 *    - "Only use EQ" → method preference
 *
 * 2. **Resource Usage**: What resources to use/avoid
 *    - "Don't add new layers" → no-new-layers preference
 *    - "Use existing cards" → reuse preference
 *
 * 3. **Aesthetic**: How the result should sound
 *    - "Keep it subtle" → intensity preference
 *    - "Go bold" → intensity preference (high)
 *
 * 4. **Workflow**: How the process should proceed
 *    - "Do it in one step" → atomicity preference
 *    - "Show me each change" → granularity preference
 *
 * 5. **Quality**: What quality attributes to prioritize
 *    - "Prioritize clarity over warmth" → axis priority
 *    - "Don't sacrifice dynamics" → protected-axis preference
 *
 * @module gofai/nl/semantics/musical-preferences
 * @see gofai_goalA.md Step 160
 */

import type { CPLPreference } from '../../canon/cpl-types';


// =============================================================================
// PREFERENCE CATEGORIES
// =============================================================================

/**
 * Top-level preference categories.
 */
export type MusicalPreferenceCategory =
  | 'edit_style'      // How edits should be made
  | 'resource_usage'  // What resources to use/avoid
  | 'aesthetic'        // How the result should sound
  | 'workflow'         // How the process should proceed
  | 'quality'          // What quality attributes to prioritize
  | 'safety'           // What to protect from accidental damage
  | 'efficiency'       // How to minimize resource usage
  | 'compatibility';   // Compatibility with other systems/formats

/**
 * How a preference was inferred.
 */
export type PreferenceSource =
  | 'explicit'          // User said it directly
  | 'inferred_from_verb'  // Inferred from verb choice (e.g., "tweak" → minimal)
  | 'inferred_from_context' // Inferred from context (e.g., mastering context → loudness norms)
  | 'user_profile'      // From user's preference profile
  | 'project_default'   // Project-level default preference
  | 'domain_default';   // Domain default (music production conventions)


// =============================================================================
// BASE MUSICAL PREFERENCE
// =============================================================================

/**
 * Base interface for all musical preferences.
 */
export interface MusicalPreferenceBase {
  /** Unique preference ID */
  readonly id: string;

  /** Category */
  readonly category: MusicalPreferenceCategory;

  /** Human-readable description */
  readonly description: string;

  /** Weight (0–1): how strongly this preference should be considered */
  readonly weight: number;

  /** How the preference was inferred */
  readonly source: PreferenceSource;

  /** Confidence that this preference is desired (0–1) */
  readonly confidence: number;

  /** Source text (if explicit) */
  readonly sourceText: string | null;

  /** Source span */
  readonly sourceSpan: { readonly start: number; readonly end: number } | null;

  /** Whether this preference is defeasible (can be overridden by context) */
  readonly defeasible: boolean;

  /** Conditions under which this preference applies */
  readonly applicabilityConditions: readonly PreferenceCondition[];

  /** Other preferences this one conflicts with */
  readonly conflictsWith: readonly string[];
}


// =============================================================================
// PREFERENCE CONDITIONS — when a preference applies
// =============================================================================

/**
 * A condition for when a preference applies.
 */
export interface PreferenceCondition {
  /** Condition type */
  readonly conditionType: PreferenceConditionType;

  /** Value for the condition */
  readonly value: string;

  /** Whether the condition is positive (must be true) or negative (must be false) */
  readonly positive: boolean;

  /** Description */
  readonly description: string;
}

/**
 * Types of preference conditions.
 */
export type PreferenceConditionType =
  | 'context'            // E.g., "during mixing", "when mastering"
  | 'entity_type'        // E.g., "when editing drums", "for vocals"
  | 'edit_category'      // E.g., "for transformations", "for additions"
  | 'section_type'       // E.g., "in the chorus", "during the bridge"
  | 'project_phase'      // E.g., "during arrangement", "in final mix"
  | 'always';            // Always applies


// =============================================================================
// SPECIFIC PREFERENCE TYPES
// =============================================================================

/**
 * Edit Style Preference: How edits should be made.
 */
export interface EditStylePreference extends MusicalPreferenceBase {
  readonly category: 'edit_style';

  /** The style preference */
  readonly style: EditStyleKind;

  /** Parameters for the style */
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Kinds of edit styles.
 */
export type EditStyleKind =
  | 'least_change'       // Make minimal changes (Occam's razor for edits)
  | 'targeted'           // Only change exactly what's specified
  | 'holistic'           // Consider the whole mix when making changes
  | 'surgical'           // Very precise, narrow changes
  | 'broad_stroke'       // Rough, approximate changes
  | 'iterative'          // Make small changes and check
  | 'aggressive'         // Make bold, large changes
  | 'conservative'       // Make cautious, small changes
  | 'experimental'       // Try unconventional approaches
  | 'by_the_book';       // Follow standard practice

/**
 * Resource Usage Preference: What resources to use/avoid.
 */
export interface ResourceUsagePreference extends MusicalPreferenceBase {
  readonly category: 'resource_usage';

  /** The resource preference */
  readonly resourceRule: ResourceRule;

  /** Target resource type */
  readonly resourceType: ResourceType;

  /** Parameters */
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Resource rules.
 */
export type ResourceRule =
  | 'prefer_existing'    // Use existing cards/effects/layers
  | 'avoid_new'          // Don't create new layers/cards
  | 'allow_new'          // It's OK to add new things
  | 'minimize_count'     // Use as few resources as possible
  | 'maximize_reuse'     // Reuse existing elements as much as possible
  | 'no_external'        // Don't use external plugins/resources
  | 'prefer_builtin'     // Prefer built-in effects over external
  | 'budget_limit';      // Stay within a resource budget

/**
 * Resource types.
 */
export type ResourceType =
  | 'layer'              // Audio layers/tracks
  | 'card'               // Processing cards
  | 'effect'             // Audio effects
  | 'automation'         // Automation lanes
  | 'send'               // Aux sends
  | 'bus'                // Buses
  | 'plugin'             // Plugins
  | 'any';               // Any resource

/**
 * Aesthetic Preference: How the result should sound.
 */
export interface AestheticPreference extends MusicalPreferenceBase {
  readonly category: 'aesthetic';

  /** The aesthetic preference */
  readonly aestheticKind: AestheticPreferenceKind;

  /** Target level (0–1) */
  readonly targetLevel: number;

  /** Axis associations */
  readonly associatedAxes: readonly string[];
}

/**
 * Kinds of aesthetic preferences.
 */
export type AestheticPreferenceKind =
  | 'subtlety'          // How subtle/dramatic the changes should be
  | 'naturalness'       // How natural/processed the result should sound
  | 'transparency'      // How transparent/obvious the processing should be
  | 'warmth_preference' // Preference for warm vs cold character
  | 'brightness_preference' // Preference for bright vs dark character
  | 'density_preference' // Preference for dense vs sparse arrangement
  | 'space_preference'  // Preference for dry vs wet/spacious
  | 'aggression_preference' // Preference for aggressive vs gentle
  | 'vintage_preference' // Preference for vintage vs modern sound
  | 'organic_preference'; // Preference for organic vs synthetic

/**
 * Workflow Preference: How the editing process should proceed.
 */
export interface WorkflowPreference extends MusicalPreferenceBase {
  readonly category: 'workflow';

  /** The workflow preference */
  readonly workflowKind: WorkflowPreferenceKind;

  /** Parameters */
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Kinds of workflow preferences.
 */
export type WorkflowPreferenceKind =
  | 'atomicity'          // Do everything in one step vs multiple
  | 'granularity'        // Fine-grained individual changes vs bulk
  | 'preview'            // Preview before applying
  | 'undo_friendly'      // Prefer easily undoable changes
  | 'non_destructive'    // Prefer non-destructive processing
  | 'explain'            // Explain what's being done
  | 'confirm_before'     // Ask for confirmation before major changes
  | 'auto_apply'         // Automatically apply changes
  | 'batch'              // Batch multiple changes together
  | 'sequential';        // Apply changes one at a time

/**
 * Quality Preference: What quality attributes to prioritize.
 */
export interface QualityPreference extends MusicalPreferenceBase {
  readonly category: 'quality';

  /** The quality preference */
  readonly qualityKind: QualityPreferenceKind;

  /** Priority axes (ordered from highest to lowest priority) */
  readonly priorityAxes: readonly AxisPriority[];

  /** Protected axes (should not be degraded) */
  readonly protectedAxes: readonly string[];
}

/**
 * Kinds of quality preferences.
 */
export type QualityPreferenceKind =
  | 'axis_priority'      // Which axes to prioritize
  | 'protected_axis'     // Which axes to protect from degradation
  | 'tradeoff_policy'    // How to handle axis tradeoffs
  | 'overall_quality'    // Overall quality target (lo-fi vs hi-fi)
  | 'headroom_policy'    // How to handle headroom
  | 'dynamic_range_policy' // Dynamic range preferences
  | 'frequency_balance'  // Frequency balance preferences
  | 'stereo_policy';     // Stereo image preferences

/**
 * Axis priority: how important an axis is relative to others.
 */
export interface AxisPriority {
  /** Axis name */
  readonly axisName: string;

  /** Priority level (higher = more important) */
  readonly priority: number;

  /** Whether degradation of this axis is acceptable */
  readonly degradationAcceptable: boolean;

  /** Maximum acceptable degradation (0–1, where 0 = none) */
  readonly maxDegradation: number;
}

/**
 * Safety Preference: What to protect from accidental damage.
 */
export interface SafetyPreference extends MusicalPreferenceBase {
  readonly category: 'safety';

  /** The safety preference */
  readonly safetyKind: SafetyPreferenceKind;

  /** Threshold for triggering the safety behavior */
  readonly threshold: number;

  /** What to protect */
  readonly protectedEntities: readonly string[];
}

/**
 * Kinds of safety preferences.
 */
export type SafetyPreferenceKind =
  | 'no_clipping'         // Don't let levels exceed 0dBFS
  | 'preserve_headroom'   // Keep some headroom
  | 'avoid_phase_issues'  // Watch for phase cancellation
  | 'protect_low_end'     // Don't compromise bass response
  | 'protect_transients'  // Don't smash transients
  | 'protect_stereo'      // Don't collapse stereo to mono
  | 'protect_dynamics'    // Don't over-compress
  | 'backup_first';       // Save a backup before major changes

/**
 * Efficiency Preference: How to minimize resource usage.
 */
export interface EfficiencyPreference extends MusicalPreferenceBase {
  readonly category: 'efficiency';

  /** The efficiency preference */
  readonly efficiencyKind: EfficiencyPreferenceKind;

  /** Target level */
  readonly targetLevel: number;
}

/**
 * Kinds of efficiency preferences.
 */
export type EfficiencyPreferenceKind =
  | 'cpu_efficient'       // Minimize CPU usage
  | 'memory_efficient'    // Minimize memory usage
  | 'minimize_latency'    // Reduce processing latency
  | 'minimize_plugins'    // Use fewer plugins
  | 'minimize_automation' // Minimize automation complexity
  | 'minimize_edits';     // Minimize total number of edits

/**
 * Compatibility Preference: System/format compatibility.
 */
export interface CompatibilityPreference extends MusicalPreferenceBase {
  readonly category: 'compatibility';

  /** The compatibility preference */
  readonly compatibilityKind: CompatibilityPreferenceKind;

  /** Target format/system */
  readonly targetSystem: string;
}

/**
 * Kinds of compatibility preferences.
 */
export type CompatibilityPreferenceKind =
  | 'format_compatible'   // Compatible with a specific format (WAV, MP3)
  | 'sample_rate'         // Target sample rate
  | 'bit_depth'           // Target bit depth
  | 'loudness_standard'   // Target loudness standard (LUFS)
  | 'platform_compatible' // Compatible with a specific platform
  | 'backwards_compatible'; // Don't use features not supported by older versions


// =============================================================================
// UNION TYPE
// =============================================================================

/**
 * Union of all musical preference types.
 */
export type MusicalPreference =
  | EditStylePreference
  | ResourceUsagePreference
  | AestheticPreference
  | WorkflowPreference
  | QualityPreference
  | SafetyPreference
  | EfficiencyPreference
  | CompatibilityPreference;


// =============================================================================
// COMMON PREFERENCES DATABASE
// =============================================================================

/**
 * A catalog entry for a common/named preference.
 */
export interface CommonPreference {
  /** Short name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /** Category */
  readonly category: MusicalPreferenceCategory;

  /** Default weight */
  readonly defaultWeight: number;

  /** Trigger phrases that evoke this preference */
  readonly triggerPhrases: readonly string[];

  /** Factory function to create the preference */
  readonly create: (weight?: number) => MusicalPreference;
}

/**
 * Database of common preferences.
 */
export const COMMON_PREFERENCES: readonly CommonPreference[] = [
  // Edit style
  {
    name: 'least-change',
    description: 'Make as few changes as possible to achieve the goal',
    category: 'edit_style',
    defaultWeight: 0.8,
    triggerPhrases: ['minimal changes', 'least change', 'subtle', 'gently', 'slightly', 'just a touch'],
    create: (weight = 0.8) => createEditStylePreference('least_change', {
      weight,
      description: 'Prefer minimal changes',
    }),
  },
  {
    name: 'surgical',
    description: 'Make very precise, targeted changes',
    category: 'edit_style',
    defaultWeight: 0.7,
    triggerPhrases: ['precisely', 'exactly', 'surgically', 'carefully', 'specifically'],
    create: (weight = 0.7) => createEditStylePreference('surgical', {
      weight,
      description: 'Prefer surgical precision',
    }),
  },
  {
    name: 'holistic',
    description: 'Consider the whole mix when making changes',
    category: 'edit_style',
    defaultWeight: 0.6,
    triggerPhrases: ['overall', 'as a whole', 'the whole mix', 'everything together', 'globally'],
    create: (weight = 0.6) => createEditStylePreference('holistic', {
      weight,
      description: 'Consider the whole mix',
    }),
  },
  {
    name: 'aggressive',
    description: 'Make bold, dramatic changes',
    category: 'edit_style',
    defaultWeight: 0.7,
    triggerPhrases: ['dramatically', 'aggressively', 'boldly', 'a lot', 'really', 'much more'],
    create: (weight = 0.7) => createEditStylePreference('aggressive', {
      weight,
      description: 'Make bold changes',
    }),
  },

  // Resource usage
  {
    name: 'no-new-layers',
    description: "Don't add new layers/tracks",
    category: 'resource_usage',
    defaultWeight: 0.9,
    triggerPhrases: ["don't add layers", 'no new tracks', 'no new layers', 'existing tracks only'],
    create: (weight = 0.9) => createResourcePreference('avoid_new', 'layer', {
      weight,
      description: "Don't add new layers",
    }),
  },
  {
    name: 'reuse-existing',
    description: 'Use existing cards and effects rather than adding new ones',
    category: 'resource_usage',
    defaultWeight: 0.7,
    triggerPhrases: ['use existing', 'reuse', 'with what we have', "don't add new effects", 'existing cards'],
    create: (weight = 0.7) => createResourcePreference('prefer_existing', 'card', {
      weight,
      description: 'Prefer existing cards',
    }),
  },
  {
    name: 'no-new-effects',
    description: "Don't add new effects/plugins",
    category: 'resource_usage',
    defaultWeight: 0.8,
    triggerPhrases: ["don't add effects", 'no new plugins', 'no new effects', 'existing effects only'],
    create: (weight = 0.8) => createResourcePreference('avoid_new', 'effect', {
      weight,
      description: "Don't add new effects",
    }),
  },

  // Aesthetic
  {
    name: 'subtle-processing',
    description: 'Keep processing subtle and transparent',
    category: 'aesthetic',
    defaultWeight: 0.7,
    triggerPhrases: ['subtle', 'transparent', 'invisible', 'gentle', 'light touch'],
    create: (weight = 0.7) => createAestheticPreference('subtlety', 0.8, {
      weight,
      description: 'Keep processing subtle',
    }),
  },
  {
    name: 'natural-sounding',
    description: 'Keep the result sounding natural and unprocessed',
    category: 'aesthetic',
    defaultWeight: 0.7,
    triggerPhrases: ['natural', 'organic', 'unprocessed', 'authentic', 'real'],
    create: (weight = 0.7) => createAestheticPreference('naturalness', 0.8, {
      weight,
      description: 'Keep it sounding natural',
    }),
  },

  // Workflow
  {
    name: 'one-step',
    description: 'Accomplish everything in a single operation',
    category: 'workflow',
    defaultWeight: 0.6,
    triggerPhrases: ['in one step', 'all at once', 'single change', 'one edit'],
    create: (weight = 0.6) => createWorkflowPreference('atomicity', {
      weight,
      description: 'Prefer single-step operations',
    }),
  },
  {
    name: 'non-destructive',
    description: 'Prefer non-destructive processing',
    category: 'workflow',
    defaultWeight: 0.8,
    triggerPhrases: ['non-destructive', 'reversible', 'undoable', 'safely'],
    create: (weight = 0.8) => createWorkflowPreference('non_destructive', {
      weight,
      description: 'Prefer non-destructive processing',
    }),
  },
  {
    name: 'preview-first',
    description: 'Preview changes before applying',
    category: 'workflow',
    defaultWeight: 0.5,
    triggerPhrases: ['let me hear first', 'preview', 'try it out', 'show me first'],
    create: (weight = 0.5) => createWorkflowPreference('preview', {
      weight,
      description: 'Preview before applying',
    }),
  },

  // Quality
  {
    name: 'protect-dynamics',
    description: "Don't sacrifice dynamic range",
    category: 'quality',
    defaultWeight: 0.8,
    triggerPhrases: ["don't squash", "don't over-compress", 'keep dynamics', 'preserve dynamics', 'dynamic range'],
    create: (weight = 0.8) => createQualityPreference('protected_axis', {
      weight,
      protectedAxes: ['dynamics'],
      description: 'Protect dynamic range',
    }),
  },
  {
    name: 'prioritize-clarity',
    description: 'Prioritize mix clarity above other qualities',
    category: 'quality',
    defaultWeight: 0.7,
    triggerPhrases: ['clarity first', 'prioritize clarity', 'clean and clear', 'definition'],
    create: (weight = 0.7) => createQualityPreference('axis_priority', {
      weight,
      priorityAxes: [{ axisName: 'clarity', priority: 10, degradationAcceptable: false, maxDegradation: 0.1 }],
      description: 'Prioritize clarity',
    }),
  },

  // Safety
  {
    name: 'no-clipping',
    description: "Don't let any signal clip",
    category: 'safety',
    defaultWeight: 0.95,
    triggerPhrases: ["don't clip", 'no clipping', 'watch the levels', 'stay below 0'],
    create: (weight = 0.95) => createSafetyPreference('no_clipping', {
      weight,
      threshold: 0.0,
      description: "Don't allow clipping",
    }),
  },
  {
    name: 'preserve-headroom',
    description: 'Keep adequate headroom',
    category: 'safety',
    defaultWeight: 0.8,
    triggerPhrases: ['headroom', 'leave some room', 'not too loud', 'breathing room'],
    create: (weight = 0.8) => createSafetyPreference('preserve_headroom', {
      weight,
      threshold: -3.0,
      description: 'Maintain headroom',
    }),
  },
];


// =============================================================================
// PREFERENCE CONSTRUCTORS
// =============================================================================

let _preferenceIdCounter = 0;
function nextPreferenceId(): string {
  return `pref_${++_preferenceIdCounter}`;
}

/**
 * Create an edit style preference.
 */
export function createEditStylePreference(
  style: EditStyleKind,
  opts: {
    weight?: number;
    description?: string;
    source?: PreferenceSource;
    sourceText?: string | null;
    parameters?: Readonly<Record<string, string | number | boolean>>;
  } = {},
): EditStylePreference {
  return {
    id: nextPreferenceId(),
    category: 'edit_style',
    description: opts.description ?? `Edit style: ${style}`,
    weight: opts.weight ?? 0.7,
    source: opts.source ?? 'explicit',
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    defeasible: true,
    applicabilityConditions: [],
    conflictsWith: [],
    style,
    parameters: opts.parameters ?? {},
  };
}

/**
 * Create a resource usage preference.
 */
export function createResourcePreference(
  rule: ResourceRule,
  resourceType: ResourceType,
  opts: {
    weight?: number;
    description?: string;
    source?: PreferenceSource;
    sourceText?: string | null;
    parameters?: Readonly<Record<string, string | number | boolean>>;
  } = {},
): ResourceUsagePreference {
  return {
    id: nextPreferenceId(),
    category: 'resource_usage',
    description: opts.description ?? `Resource: ${rule} ${resourceType}`,
    weight: opts.weight ?? 0.7,
    source: opts.source ?? 'explicit',
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    defeasible: true,
    applicabilityConditions: [],
    conflictsWith: [],
    resourceRule: rule,
    resourceType,
    parameters: opts.parameters ?? {},
  };
}

/**
 * Create an aesthetic preference.
 */
export function createAestheticPreference(
  kind: AestheticPreferenceKind,
  targetLevel: number,
  opts: {
    weight?: number;
    description?: string;
    source?: PreferenceSource;
    sourceText?: string | null;
    associatedAxes?: readonly string[];
  } = {},
): AestheticPreference {
  return {
    id: nextPreferenceId(),
    category: 'aesthetic',
    description: opts.description ?? `Aesthetic: ${kind}`,
    weight: opts.weight ?? 0.6,
    source: opts.source ?? 'explicit',
    confidence: 0.85,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    defeasible: true,
    applicabilityConditions: [],
    conflictsWith: [],
    aestheticKind: kind,
    targetLevel,
    associatedAxes: opts.associatedAxes ?? [],
  };
}

/**
 * Create a workflow preference.
 */
export function createWorkflowPreference(
  kind: WorkflowPreferenceKind,
  opts: {
    weight?: number;
    description?: string;
    source?: PreferenceSource;
    sourceText?: string | null;
    parameters?: Readonly<Record<string, string | number | boolean>>;
  } = {},
): WorkflowPreference {
  return {
    id: nextPreferenceId(),
    category: 'workflow',
    description: opts.description ?? `Workflow: ${kind}`,
    weight: opts.weight ?? 0.6,
    source: opts.source ?? 'explicit',
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    defeasible: true,
    applicabilityConditions: [],
    conflictsWith: [],
    workflowKind: kind,
    parameters: opts.parameters ?? {},
  };
}

/**
 * Create a quality preference.
 */
export function createQualityPreference(
  kind: QualityPreferenceKind,
  opts: {
    weight?: number;
    description?: string;
    source?: PreferenceSource;
    sourceText?: string | null;
    priorityAxes?: readonly AxisPriority[];
    protectedAxes?: readonly string[];
  } = {},
): QualityPreference {
  return {
    id: nextPreferenceId(),
    category: 'quality',
    description: opts.description ?? `Quality: ${kind}`,
    weight: opts.weight ?? 0.7,
    source: opts.source ?? 'explicit',
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    defeasible: true,
    applicabilityConditions: [],
    conflictsWith: [],
    qualityKind: kind,
    priorityAxes: opts.priorityAxes ?? [],
    protectedAxes: opts.protectedAxes ?? [],
  };
}

/**
 * Create a safety preference.
 */
export function createSafetyPreference(
  kind: SafetyPreferenceKind,
  opts: {
    weight?: number;
    description?: string;
    source?: PreferenceSource;
    sourceText?: string | null;
    threshold?: number;
    protectedEntities?: readonly string[];
  } = {},
): SafetyPreference {
  return {
    id: nextPreferenceId(),
    category: 'safety',
    description: opts.description ?? `Safety: ${kind}`,
    weight: opts.weight ?? 0.9,
    source: opts.source ?? 'domain_default',
    confidence: 0.95,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    defeasible: false,
    applicabilityConditions: [],
    conflictsWith: [],
    safetyKind: kind,
    threshold: opts.threshold ?? 0,
    protectedEntities: opts.protectedEntities ?? [],
  };
}


// =============================================================================
// PREFERENCE INFERENCE — extracting preferences from text cues
// =============================================================================

/**
 * Result of inferring preferences from text.
 */
export interface PreferenceInferenceResult {
  /** Inferred preferences */
  readonly preferences: readonly MusicalPreference[];

  /** Trigger phrases that were matched */
  readonly matchedTriggers: readonly string[];

  /** Confidence in the inference (0–1) */
  readonly confidence: number;
}

/**
 * Infer preferences from a text input.
 * Scans for trigger phrases in the common preferences database.
 */
export function inferPreferences(text: string): PreferenceInferenceResult {
  const normalizedText = text.toLowerCase();
  const matched: MusicalPreference[] = [];
  const triggers: string[] = [];

  for (const commonPref of COMMON_PREFERENCES) {
    for (const trigger of commonPref.triggerPhrases) {
      if (normalizedText.includes(trigger.toLowerCase())) {
        matched.push(commonPref.create());
        triggers.push(trigger);
        break; // Only match once per common preference
      }
    }
  }

  return {
    preferences: matched,
    matchedTriggers: triggers,
    confidence: matched.length > 0 ? 0.7 : 0,
  };
}


// =============================================================================
// PREFERENCE-TO-CPL BRIDGE
// =============================================================================

/**
 * Convert a musical preference to a CPLPreference.
 */
export function musicalPreferenceToCPL(preference: MusicalPreference): CPLPreference {
  switch (preference.category) {
    case 'edit_style':
      return {
        type: 'preference',
        id: preference.id,
        category: 'edit-style',
        value: preference.style,
        weight: preference.weight,
      };
    case 'resource_usage':
      return {
        type: 'preference',
        id: preference.id,
        category: 'layer-preference',
        value: preference.resourceRule,
        weight: preference.weight,
      };
    case 'aesthetic':
      return {
        type: 'preference',
        id: preference.id,
        category: 'edit-style',
        value: preference.aestheticKind,
        weight: preference.weight,
      };
    case 'workflow':
      return {
        type: 'preference',
        id: preference.id,
        category: 'method-preference',
        value: preference.workflowKind,
        weight: preference.weight,
      };
    case 'quality':
      return {
        type: 'preference',
        id: preference.id,
        category: 'cost-preference',
        value: preference.qualityKind,
        weight: preference.weight,
      };
    case 'safety':
      return {
        type: 'preference',
        id: preference.id,
        category: 'cost-preference',
        value: preference.safetyKind,
        weight: preference.weight,
      };
    case 'efficiency':
      return {
        type: 'preference',
        id: preference.id,
        category: 'cost-preference',
        value: preference.efficiencyKind,
        weight: preference.weight,
      };
    case 'compatibility':
      return {
        type: 'preference',
        id: preference.id,
        category: 'method-preference',
        value: preference.compatibilityKind,
        weight: preference.weight,
      };
  }
}


// =============================================================================
// PREFERENCE RESOLUTION — resolving conflicts between preferences
// =============================================================================

/**
 * A conflict between two preferences.
 */
export interface PreferenceConflict {
  /** First preference */
  readonly prefA: MusicalPreference;

  /** Second preference */
  readonly prefB: MusicalPreference;

  /** Description of the conflict */
  readonly description: string;

  /** Resolution strategy */
  readonly resolution: PreferenceResolution;
}

/**
 * How to resolve a preference conflict.
 */
export type PreferenceResolution =
  | { readonly kind: 'weight_wins'; readonly winner: string }      // Higher weight wins
  | { readonly kind: 'explicit_wins'; readonly winner: string }    // Explicit beats inferred
  | { readonly kind: 'merge'; readonly mergedWeight: number }      // Merge into one
  | { readonly kind: 'context_dependent'; readonly description: string }; // Depends on context

/**
 * Detect and resolve conflicts between preferences.
 */
export function resolvePreferenceConflicts(
  preferences: readonly MusicalPreference[],
): {
  readonly resolved: readonly MusicalPreference[];
  readonly conflicts: readonly PreferenceConflict[];
} {
  const conflicts: PreferenceConflict[] = [];
  const resolved = [...preferences];

  // Check for style conflicts (e.g., aggressive vs conservative)
  for (let i = 0; i < preferences.length; i++) {
    for (let j = i + 1; j < preferences.length; j++) {
      const a = preferences[i] as MusicalPreference | undefined;
      const b = preferences[j] as MusicalPreference | undefined;
      if (!a || !b) continue;

      if (a.category === 'edit_style' && b.category === 'edit_style') {
        const styleA = a.style;
        const styleB = b.style;
        if (isOppositeStyle(styleA, styleB)) {
          const winner = a.weight >= b.weight ? a : b;
          conflicts.push({
            prefA: a,
            prefB: b,
            description: `Conflicting edit styles: "${styleA}" vs "${styleB}"`,
            resolution: { kind: 'weight_wins', winner: winner.id },
          });
        }
      }
    }
  }

  return { resolved, conflicts };
}

/**
 * Check if two edit styles are opposites.
 */
function isOppositeStyle(a: EditStyleKind, b: EditStyleKind): boolean {
  const opposites: ReadonlyMap<EditStyleKind, EditStyleKind> = new Map([
    ['least_change', 'aggressive'],
    ['aggressive', 'least_change'],
    ['surgical', 'broad_stroke'],
    ['broad_stroke', 'surgical'],
    ['conservative', 'experimental'],
    ['experimental', 'conservative'],
  ]);
  return opposites.get(a) === b;
}


// =============================================================================
// PREFERENCE SUMMARY AND FORMATTING
// =============================================================================

/**
 * Compute a summary of a set of preferences.
 */
export function computePreferenceSummary(preferences: readonly MusicalPreference[]): PreferenceSummary {
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let totalWeight = 0;

  for (const pref of preferences) {
    byCategory[pref.category] = (byCategory[pref.category] ?? 0) + 1;
    bySource[pref.source] = (bySource[pref.source] ?? 0) + 1;
    totalWeight += pref.weight;
  }

  const { conflicts } = resolvePreferenceConflicts(preferences);

  return {
    totalPreferences: preferences.length,
    byCategory,
    bySource,
    averageWeight: preferences.length > 0 ? totalWeight / preferences.length : 0,
    conflictCount: conflicts.length,
    defeasibleCount: preferences.filter(p => p.defeasible).length,
    nonDefeasibleCount: preferences.filter(p => !p.defeasible).length,
  };
}

/**
 * Preference summary.
 */
export interface PreferenceSummary {
  readonly totalPreferences: number;
  readonly byCategory: Readonly<Record<string, number>>;
  readonly bySource: Readonly<Record<string, number>>;
  readonly averageWeight: number;
  readonly conflictCount: number;
  readonly defeasibleCount: number;
  readonly nonDefeasibleCount: number;
}

/**
 * Format a preference summary as a report string.
 */
export function formatPreferenceSummaryReport(summary: PreferenceSummary): string {
  const lines: string[] = [
    '=== Musical Preferences Summary ===',
    `Total preferences: ${summary.totalPreferences}`,
    `Average weight: ${summary.averageWeight.toFixed(2)}`,
    `Conflicts: ${summary.conflictCount}`,
    `Defeasible: ${summary.defeasibleCount}`,
    `Non-defeasible: ${summary.nonDefeasibleCount}`,
    '',
    'By category:',
  ];
  for (const [cat, count] of Object.entries(summary.byCategory)) {
    lines.push(`  ${cat}: ${count}`);
  }
  lines.push('', 'By source:');
  for (const [src, count] of Object.entries(summary.bySource)) {
    lines.push(`  ${src}: ${count}`);
  }
  return lines.join('\n');
}

/**
 * Format a single preference as a human-readable string.
 */
export function formatPreference(preference: MusicalPreference): string {
  const weightStr = `[w=${preference.weight.toFixed(2)}]`;
  const sourceStr = preference.source !== 'explicit' ? ` (${preference.source})` : '';
  return `${weightStr} ${preference.description}${sourceStr}`;
}

/**
 * Format all preferences as a list.
 */
export function formatPreferenceList(preferences: readonly MusicalPreference[]): string {
  if (preferences.length === 0) return '(no preferences)';
  return preferences.map(p => `  • ${formatPreference(p)}`).join('\n');
}
