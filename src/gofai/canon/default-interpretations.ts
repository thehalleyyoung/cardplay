/**
 * GOFAI Default Interpretations — Inspectable, User-Configurable Defaults
 *
 * Step 019 [Infra]: Commits to "no magic": any default (e.g., what "darker"
 * means, what "moderate" amount is, which scope is implied) must be:
 *
 * 1. **Inspectable**: The user can see what default is being applied
 * 2. **User-configurable**: The user can change defaults via profiles
 * 3. **Versioned**: Defaults have provenance and version tags
 * 4. **Deterministic**: Same default config → same behavior
 *
 * ## Architecture
 *
 * The default interpretation registry is a canonical table of all defaults
 * used by the system. Each default has:
 * - A stable ID
 * - A human-readable description
 * - A default value
 * - A user-overridable flag
 * - A provenance tag (version + rationale)
 *
 * When the system applies a default, it records the decision with the
 * registry entry's ID, so the user can trace it back.
 *
 * ## Categories
 *
 * - **Sense defaults**: What vague adjectives mean ("darker" → timbre)
 * - **Amount defaults**: How much "more" or "less" means
 * - **Scope defaults**: What scope is implied when none is stated
 * - **Constraint defaults**: What preservation mode is assumed
 * - **Priority defaults**: How constraints are ranked
 * - **Resolution defaults**: How references are resolved
 *
 * @module gofai/canon/default-interpretations
 */

import type { AxisId, LexemeId } from './types';

// =============================================================================
// Default Interpretation Registry
// =============================================================================

/**
 * A default interpretation entry.
 */
export interface DefaultInterpretation {
  /** Stable identifier */
  readonly id: DefaultId;

  /** Category */
  readonly category: DefaultCategory;

  /** Human-readable name */
  readonly name: string;

  /** Description of what this default controls */
  readonly description: string;

  /** The default value */
  readonly defaultValue: DefaultValue;

  /** Whether the user can override this */
  readonly userOverridable: boolean;

  /** Rationale for this default */
  readonly rationale: string;

  /** Version when this default was established */
  readonly version: string;

  /** Related lexemes (if applicable) */
  readonly relatedLexemes: readonly LexemeId[];

  /** Related axes (if applicable) */
  readonly relatedAxes: readonly AxisId[];

  /** Examples of when this default is applied */
  readonly examples: readonly DefaultExample[];

  /** UI display hints */
  readonly uiHints: DefaultUIHints;
}

/**
 * Default interpretation ID.
 */
export type DefaultId = string & { readonly __brand: 'DefaultId' };

/**
 * Create a default ID.
 */
export function createDefaultId(category: string, name: string): DefaultId {
  return `default:${category}:${name}` as DefaultId;
}

/**
 * Categories of defaults.
 */
export type DefaultCategory =
  | 'sense'       // What a vague word means
  | 'amount'      // How much change
  | 'scope'       // Where to apply
  | 'constraint'  // What to preserve
  | 'priority'    // Constraint ranking
  | 'resolution'  // Reference resolution
  | 'safety'      // Safety thresholds
  | 'planning'    // Planning preferences
  | 'display';    // How things are shown

/**
 * All default categories.
 */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  'sense', 'amount', 'scope', 'constraint', 'priority',
  'resolution', 'safety', 'planning', 'display',
] as const;

/**
 * A default value (typed).
 */
export type DefaultValue =
  | { readonly type: 'axis_sense'; readonly axisId: AxisId; readonly direction: 'increase' | 'decrease' }
  | { readonly type: 'amount'; readonly degree: 'tiny' | 'small' | 'moderate' | 'large' | 'extreme' }
  | { readonly type: 'scope_strategy'; readonly strategy: ScopeDefaultStrategy }
  | { readonly type: 'preservation_mode'; readonly mode: 'exact' | 'functional' | 'recognizable' }
  | { readonly type: 'priority_level'; readonly level: 'low' | 'medium' | 'high' | 'critical' }
  | { readonly type: 'resolution_strategy'; readonly strategy: ResolutionDefaultStrategy }
  | { readonly type: 'numeric'; readonly value: number; readonly unit: string | undefined }
  | { readonly type: 'boolean'; readonly value: boolean }
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'enum'; readonly value: string; readonly options: readonly string[] }
  | { readonly type: 'threshold'; readonly value: number; readonly unit: string };

/**
 * Default scope strategies.
 */
export type ScopeDefaultStrategy =
  | 'focus'      // Use the current focus scope
  | 'selection'  // Use the current UI selection
  | 'global'     // Apply globally
  | 'ask';       // Always ask

/**
 * Default resolution strategies.
 */
export type ResolutionDefaultStrategy =
  | 'salience'   // Use the most salient referent
  | 'recency'    // Use the most recent mention
  | 'focus'      // Use the currently focused entity
  | 'ask';       // Always ask

/**
 * Example of when a default is applied.
 */
export interface DefaultExample {
  /** The utterance */
  readonly utterance: string;

  /** How the default is applied */
  readonly application: string;

  /** What the user sees */
  readonly userNotification: string;
}

/**
 * UI hints for displaying a default.
 */
export interface DefaultUIHints {
  /** Control type for editing */
  readonly controlType: 'dropdown' | 'slider' | 'toggle' | 'radio' | 'text';

  /** Group label for UI organization */
  readonly group: string;

  /** Sort order within group */
  readonly sortOrder: number;

  /** Whether this is an "advanced" setting */
  readonly advanced: boolean;
}

// =============================================================================
// Core Default Registry
// =============================================================================

/**
 * The core set of default interpretations.
 *
 * Every default used by the GOFAI system must be listed here.
 * No "hidden" defaults are allowed.
 */
export const CORE_DEFAULTS: readonly DefaultInterpretation[] = [
  // ===== Sense Defaults =====
  {
    id: createDefaultId('sense', 'darker'),
    category: 'sense',
    name: 'Default sense of "darker"',
    description: 'When the user says "darker" without context, which axis is affected',
    defaultValue: { type: 'axis_sense', axisId: 'axis:brightness' as AxisId, direction: 'decrease' },
    userOverridable: true,
    rationale: 'Most musicians associate "darker" with reduced high-frequency content (timbre), not harmonic darkness',
    version: '1.0.0',
    relatedLexemes: ['lex:adj:darker' as LexemeId, 'lex:adj:dark' as LexemeId],
    relatedAxes: ['axis:brightness' as AxisId],
    examples: [
      {
        utterance: 'Make it darker',
        application: 'Interpreted as: decrease brightness (timbre)',
        userNotification: 'Using your default: "darker" → timbre brightness. Change in preferences.',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Vague Adjectives', sortOrder: 1, advanced: false },
  },
  {
    id: createDefaultId('sense', 'brighter'),
    category: 'sense',
    name: 'Default sense of "brighter"',
    description: 'When the user says "brighter" without context, which axis is affected',
    defaultValue: { type: 'axis_sense', axisId: 'axis:brightness' as AxisId, direction: 'increase' },
    userOverridable: true,
    rationale: 'Brightness maps most naturally to high-frequency content',
    version: '1.0.0',
    relatedLexemes: ['lex:adj:brighter' as LexemeId, 'lex:adj:bright' as LexemeId],
    relatedAxes: ['axis:brightness' as AxisId],
    examples: [
      {
        utterance: 'Make the chorus brighter',
        application: 'Interpreted as: increase brightness in the chorus',
        userNotification: 'Using default: "brighter" → timbre brightness',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Vague Adjectives', sortOrder: 2, advanced: false },
  },
  {
    id: createDefaultId('sense', 'warmer'),
    category: 'sense',
    name: 'Default sense of "warmer"',
    description: 'When the user says "warmer" without context, which axis is affected',
    defaultValue: { type: 'axis_sense', axisId: 'axis:warmth' as AxisId, direction: 'increase' },
    userOverridable: true,
    rationale: 'Warmth typically refers to timbral quality (more low-mids, less harsh)',
    version: '1.0.0',
    relatedLexemes: ['lex:adj:warmer' as LexemeId, 'lex:adj:warm' as LexemeId],
    relatedAxes: ['axis:warmth' as AxisId],
    examples: [
      {
        utterance: 'Make it warmer',
        application: 'Interpreted as: increase warmth (timbre)',
        userNotification: 'Using default: "warmer" → timbral warmth',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Vague Adjectives', sortOrder: 3, advanced: false },
  },
  {
    id: createDefaultId('sense', 'bigger'),
    category: 'sense',
    name: 'Default sense of "bigger"',
    description: 'When the user says "bigger" without context, which axis is affected',
    defaultValue: { type: 'axis_sense', axisId: 'axis:energy' as AxisId, direction: 'increase' },
    userOverridable: true,
    rationale: '"Bigger" most commonly means more energy/impact in arrangement context',
    version: '1.0.0',
    relatedLexemes: ['lex:adj:bigger' as LexemeId, 'lex:adj:big' as LexemeId],
    relatedAxes: ['axis:energy' as AxisId, 'axis:width' as AxisId],
    examples: [
      {
        utterance: 'Make the chorus bigger',
        application: 'Interpreted as: increase energy',
        userNotification: 'Using default: "bigger" → energy. Other options: width, register spread.',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Vague Adjectives', sortOrder: 4, advanced: false },
  },
  {
    id: createDefaultId('sense', 'tighter'),
    category: 'sense',
    name: 'Default sense of "tighter"',
    description: 'When the user says "tighter" without context, which axis is affected',
    defaultValue: { type: 'axis_sense', axisId: 'axis:groove_tightness' as AxisId, direction: 'increase' },
    userOverridable: true,
    rationale: '"Tighter" most commonly refers to groove/rhythm tightness',
    version: '1.0.0',
    relatedLexemes: ['lex:adj:tighter' as LexemeId, 'lex:adj:tight' as LexemeId],
    relatedAxes: ['axis:groove_tightness' as AxisId],
    examples: [
      {
        utterance: 'Make the drums tighter',
        application: 'Interpreted as: increase groove tightness on drums',
        userNotification: 'Using default: "tighter" → groove tightness (quantize/humanize)',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Vague Adjectives', sortOrder: 5, advanced: false },
  },
  {
    id: createDefaultId('sense', 'wider'),
    category: 'sense',
    name: 'Default sense of "wider"',
    description: 'When the user says "wider" without context, which axis is affected',
    defaultValue: { type: 'axis_sense', axisId: 'axis:width' as AxisId, direction: 'increase' },
    userOverridable: true,
    rationale: '"Wider" most commonly refers to stereo width or register spread',
    version: '1.0.0',
    relatedLexemes: ['lex:adj:wider' as LexemeId, 'lex:adj:wide' as LexemeId],
    relatedAxes: ['axis:width' as AxisId],
    examples: [
      {
        utterance: 'Make the pad wider',
        application: 'Interpreted as: increase width on the pad',
        userNotification: 'Using default: "wider" → stereo/register width',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Vague Adjectives', sortOrder: 6, advanced: false },
  },

  // ===== Amount Defaults =====
  {
    id: createDefaultId('amount', 'unspecified_increase'),
    category: 'amount',
    name: 'Default amount for "more"',
    description: 'When the user says "more X" without specifying how much',
    defaultValue: { type: 'amount', degree: 'moderate' },
    userOverridable: true,
    rationale: 'Moderate is a safe middle ground that produces noticeable but not extreme changes',
    version: '1.0.0',
    relatedLexemes: ['lex:adv:more' as LexemeId],
    relatedAxes: [],
    examples: [
      {
        utterance: 'More lift in the chorus',
        application: 'Interpreted as: moderate increase in lift',
        userNotification: 'Using default amount: moderate. Adjust in preferences or specify "a lot"/"slightly".',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Amount Defaults', sortOrder: 1, advanced: false },
  },
  {
    id: createDefaultId('amount', 'unspecified_decrease'),
    category: 'amount',
    name: 'Default amount for "less"',
    description: 'When the user says "less X" without specifying how much',
    defaultValue: { type: 'amount', degree: 'moderate' },
    userOverridable: true,
    rationale: 'Moderate decrease is safe and noticeable',
    version: '1.0.0',
    relatedLexemes: ['lex:adv:less' as LexemeId],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Less busy',
        application: 'Interpreted as: moderate decrease in busyness',
        userNotification: 'Using default amount: moderate',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Amount Defaults', sortOrder: 2, advanced: false },
  },
  {
    id: createDefaultId('amount', 'comparative_step'),
    category: 'amount',
    name: 'Default comparative step size',
    description: 'How much a single comparative ("brighter", "louder") changes an axis',
    defaultValue: { type: 'amount', degree: 'small' },
    userOverridable: true,
    rationale: 'Comparatives imply a single step, which should be noticeable but conservative',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it brighter',
        application: 'Interpreted as: small increase in brightness',
        userNotification: 'Using default comparative step: small',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Amount Defaults', sortOrder: 3, advanced: false },
  },

  // ===== Scope Defaults =====
  {
    id: createDefaultId('scope', 'implicit_scope'),
    category: 'scope',
    name: 'Default scope when unspecified',
    description: 'What scope to use when the user does not specify one',
    defaultValue: { type: 'scope_strategy', strategy: 'focus' },
    userOverridable: true,
    rationale: 'Using the current focus scope is most natural and least surprising',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it brighter',
        application: 'Scope: current focus (Chorus 2)',
        userNotification: 'Applied to current focus: Chorus 2. Specify a scope to override.',
      },
    ],
    uiHints: { controlType: 'radio', group: 'Scope Defaults', sortOrder: 1, advanced: false },
  },
  {
    id: createDefaultId('scope', 'no_focus_fallback'),
    category: 'scope',
    name: 'Fallback when no focus scope exists',
    description: 'What to do when there is no focus scope and none is specified',
    defaultValue: { type: 'scope_strategy', strategy: 'ask' },
    userOverridable: true,
    rationale: 'When no scope is available, asking is safer than defaulting to global',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it brighter (no focus)',
        application: 'No scope available — asking user',
        userNotification: 'Where should this apply?',
      },
    ],
    uiHints: { controlType: 'radio', group: 'Scope Defaults', sortOrder: 2, advanced: false },
  },

  // ===== Constraint Defaults =====
  {
    id: createDefaultId('constraint', 'preserve_melody'),
    category: 'constraint',
    name: 'Default melody preservation mode',
    description: 'How "keep the melody" is interpreted by default',
    defaultValue: { type: 'preservation_mode', mode: 'exact' },
    userOverridable: true,
    rationale: '"Keep the melody" most naturally means exact pitch/rhythm preservation',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it brighter but keep the melody',
        application: 'Melody preserved in exact mode (pitch + rhythm unchanged)',
        userNotification: 'Using default: melody preservation = exact. Options: functional, recognizable.',
      },
    ],
    uiHints: { controlType: 'radio', group: 'Constraint Defaults', sortOrder: 1, advanced: false },
  },
  {
    id: createDefaultId('constraint', 'preserve_chords'),
    category: 'constraint',
    name: 'Default chord preservation mode',
    description: 'How "keep the chords" is interpreted by default',
    defaultValue: { type: 'preservation_mode', mode: 'functional' },
    userOverridable: true,
    rationale: '"Keep the chords" usually means functional harmony, not exact voicings',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it bigger but keep the chords',
        application: 'Chords preserved in functional mode (same functions, voicings may change)',
        userNotification: 'Using default: chord preservation = functional',
      },
    ],
    uiHints: { controlType: 'radio', group: 'Constraint Defaults', sortOrder: 2, advanced: false },
  },
  {
    id: createDefaultId('constraint', 'preserve_rhythm'),
    category: 'constraint',
    name: 'Default rhythm preservation mode',
    description: 'How "keep the rhythm" is interpreted by default',
    defaultValue: { type: 'preservation_mode', mode: 'recognizable' },
    userOverridable: true,
    rationale: '"Keep the rhythm" usually means the rhythmic feel, not exact onset positions',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it wider but keep the rhythm',
        application: 'Rhythm preserved in recognizable mode (feel preserved, micro-timing may shift)',
        userNotification: 'Using default: rhythm preservation = recognizable',
      },
    ],
    uiHints: { controlType: 'radio', group: 'Constraint Defaults', sortOrder: 3, advanced: false },
  },

  // ===== Priority Defaults =====
  {
    id: createDefaultId('priority', 'but_constraint'),
    category: 'priority',
    name: 'Priority of "but" constraints',
    description: 'When "but" introduces a constraint, what priority it receives',
    defaultValue: { type: 'priority_level', level: 'high' },
    userOverridable: false,
    rationale: '"But" signals contrast — the speaker is emphasizing the constraint',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it brighter but keep the melody',
        application: '"Keep the melody" is high-priority (hard constraint)',
        userNotification: '',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Constraint Priority', sortOrder: 1, advanced: true },
  },
  {
    id: createDefaultId('priority', 'implicit_constraint'),
    category: 'priority',
    name: 'Priority of implicit constraints',
    description: 'Default priority for constraints that are implied, not stated',
    defaultValue: { type: 'priority_level', level: 'medium' },
    userOverridable: true,
    rationale: 'Implicit constraints should be respected but can be overridden',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it brighter (implicit: keep tempo)',
        application: 'Tempo preservation at medium priority',
        userNotification: 'Implicitly preserving tempo (default). Override by stating tempo changes.',
      },
    ],
    uiHints: { controlType: 'dropdown', group: 'Constraint Priority', sortOrder: 2, advanced: true },
  },

  // ===== Resolution Defaults =====
  {
    id: createDefaultId('resolution', 'pronoun_strategy'),
    category: 'resolution',
    name: 'Default pronoun resolution strategy',
    description: 'How pronouns like "it" are resolved when ambiguous',
    defaultValue: { type: 'resolution_strategy', strategy: 'salience' },
    userOverridable: true,
    rationale: 'Salience-based resolution aligns with natural language processing norms',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it louder',
        application: '"it" resolved to most salient referent (Chorus 2)',
        userNotification: '"it" → Chorus 2 (most recently focused)',
      },
    ],
    uiHints: { controlType: 'radio', group: 'Resolution Defaults', sortOrder: 1, advanced: true },
  },
  {
    id: createDefaultId('resolution', 'salience_threshold'),
    category: 'resolution',
    name: 'Salience gap threshold for confident resolution',
    description: 'How large the salience gap must be for automatic pronoun resolution',
    defaultValue: { type: 'threshold', value: 0.3, unit: 'salience_gap' },
    userOverridable: true,
    rationale: 'A gap of 0.3 ensures the winner is clearly more salient',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make it louder (gap = 0.5)',
        application: 'Gap > 0.3 → resolved confidently to Chorus 2',
        userNotification: '',
      },
    ],
    uiHints: { controlType: 'slider', group: 'Resolution Defaults', sortOrder: 2, advanced: true },
  },

  // ===== Safety Defaults =====
  {
    id: createDefaultId('safety', 'large_change_threshold'),
    category: 'safety',
    name: 'Large change warning threshold',
    description: 'Number of events above which a change is considered "large" and triggers extra confirmation',
    defaultValue: { type: 'numeric', value: 100, unit: 'events' },
    userOverridable: true,
    rationale: 'Changes affecting >100 events deserve a second look',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Make the whole song brighter (500 events)',
        application: 'Warning: this affects 500 events (threshold: 100)',
        userNotification: 'This change affects 500 events. Proceed?',
      },
    ],
    uiHints: { controlType: 'slider', group: 'Safety', sortOrder: 1, advanced: true },
  },
  {
    id: createDefaultId('safety', 'structural_change_confirm'),
    category: 'safety',
    name: 'Require confirmation for structural changes',
    description: 'Whether adding/removing sections or layers requires extra confirmation',
    defaultValue: { type: 'boolean', value: true },
    userOverridable: true,
    rationale: 'Structural changes are harder to undo and should be confirmed',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'Add a bridge after the second chorus',
        application: 'Structural change: requires confirmation',
        userNotification: 'This will add a new section. Confirm?',
      },
    ],
    uiHints: { controlType: 'toggle', group: 'Safety', sortOrder: 2, advanced: false },
  },

  // ===== Planning Defaults =====
  {
    id: createDefaultId('planning', 'prefer_least_change'),
    category: 'planning',
    name: 'Prefer least-change plans',
    description: 'When multiple plans satisfy a goal, prefer the one with fewest changes',
    defaultValue: { type: 'boolean', value: true },
    userOverridable: true,
    rationale: 'Least-change is safest and most predictable',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [
      {
        utterance: 'More lift (2 plans: add layer vs adjust voicings)',
        application: 'Prefers voicing adjustment (fewer changes) over adding a layer',
        userNotification: '',
      },
    ],
    uiHints: { controlType: 'toggle', group: 'Planning', sortOrder: 1, advanced: false },
  },
  {
    id: createDefaultId('planning', 'max_plan_alternatives'),
    category: 'planning',
    name: 'Maximum plan alternatives to show',
    description: 'How many alternative plans to generate and present to the user',
    defaultValue: { type: 'numeric', value: 3, unit: undefined },
    userOverridable: true,
    rationale: 'Three alternatives balances choice with decision fatigue',
    version: '1.0.0',
    relatedLexemes: [],
    relatedAxes: [],
    examples: [],
    uiHints: { controlType: 'slider', group: 'Planning', sortOrder: 2, advanced: true },
  },
] as const;

// =============================================================================
// Default Registry Interface
// =============================================================================

/**
 * The default interpretation registry.
 *
 * Provides lookup and override capabilities for all system defaults.
 */
export interface DefaultInterpretationRegistry {
  /** Get a default by ID */
  get(id: DefaultId): DefaultInterpretation | undefined;

  /** Get all defaults in a category */
  getByCategory(category: DefaultCategory): readonly DefaultInterpretation[];

  /** Get the effective value (considering user overrides) */
  getEffectiveValue(id: DefaultId): DefaultValue;

  /** Set a user override */
  setOverride(id: DefaultId, value: DefaultValue): void;

  /** Clear a user override (revert to system default) */
  clearOverride(id: DefaultId): void;

  /** Get all overrides */
  getOverrides(): ReadonlyMap<DefaultId, DefaultValue>;

  /** Get all defaults */
  all(): readonly DefaultInterpretation[];

  /** Export overrides as JSON (for profile saving) */
  exportOverrides(): string;

  /** Import overrides from JSON (for profile loading) */
  importOverrides(json: string): void;
}

/**
 * Create a default interpretation registry from the core defaults.
 */
export function createDefaultInterpretationRegistry(): DefaultInterpretationRegistry {
  const defaults = new Map<DefaultId, DefaultInterpretation>();
  const overrides = new Map<DefaultId, DefaultValue>();

  for (const def of CORE_DEFAULTS) {
    defaults.set(def.id, def);
  }

  return {
    get(id: DefaultId): DefaultInterpretation | undefined {
      return defaults.get(id);
    },

    getByCategory(category: DefaultCategory): readonly DefaultInterpretation[] {
      return CORE_DEFAULTS.filter(d => d.category === category);
    },

    getEffectiveValue(id: DefaultId): DefaultValue {
      const override = overrides.get(id);
      if (override) return override;

      const def = defaults.get(id);
      if (def) return def.defaultValue;

      throw new Error(`Unknown default ID: ${id}`);
    },

    setOverride(id: DefaultId, value: DefaultValue): void {
      const def = defaults.get(id);
      if (!def) throw new Error(`Unknown default ID: ${id}`);
      if (!def.userOverridable) throw new Error(`Default ${id} is not user-overridable`);
      overrides.set(id, value);
    },

    clearOverride(id: DefaultId): void {
      overrides.delete(id);
    },

    getOverrides(): ReadonlyMap<DefaultId, DefaultValue> {
      return overrides;
    },

    all(): readonly DefaultInterpretation[] {
      return CORE_DEFAULTS;
    },

    exportOverrides(): string {
      const obj: Record<string, DefaultValue> = {};
      for (const [key, value] of overrides) {
        obj[key] = value;
      }
      return JSON.stringify(obj, null, 2);
    },

    importOverrides(json: string): void {
      const obj = JSON.parse(json) as Record<string, DefaultValue>;
      for (const [key, value] of Object.entries(obj)) {
        const id = key as DefaultId;
        const def = defaults.get(id);
        if (def && def.userOverridable) {
          overrides.set(id, value);
        }
      }
    },
  };
}

// =============================================================================
// Applied Default Tracking
// =============================================================================

/**
 * Record of a default being applied during compilation.
 *
 * Every time the system applies a default, it creates one of these
 * records. The user can inspect these to see what was assumed.
 */
export interface AppliedDefaultRecord {
  /** Which default was applied */
  readonly defaultId: DefaultId;

  /** The effective value that was used */
  readonly value: DefaultValue;

  /** Whether it was a user override or system default */
  readonly source: 'system_default' | 'user_override';

  /** The source span in the utterance that triggered this default */
  readonly triggerSpan: { readonly start: number; readonly end: number; readonly text: string } | undefined;

  /** Human-readable explanation */
  readonly explanation: string;

  /** How to override this default */
  readonly howToOverride: string;
}
