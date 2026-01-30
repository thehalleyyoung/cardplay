/**
 * integration-safety.ts — Steps 241–250
 *
 * Discourse-level constraints, accommodation policies, safety-first deference,
 * confidence modeling, explainable resolution, "why this question?" affordance,
 * safe preview mode, commit button gating, developer mode toggles, and
 * pragmatics trace format.
 *
 * All types are defined locally. No external imports.
 */

// ============================================================================
// Step 241 [Sem][Prag] — Discourse-level Constraints
// ============================================================================

/**
 * Where a constraint originated from in the discourse.
 */
export type ConstraintSource =
  | 'explicit'
  | 'discourse-cue'
  | 'implicature'
  | 'presupposition'
  | 'focus'
  | 'default';

/**
 * The kind of constraint being expressed.
 */
export type ConstraintKind =
  | 'hard'
  | 'soft'
  | 'preference'
  | 'exclusion'
  | 'minimum-threshold'
  | 'maximum-threshold'
  | 'goal'
  | 'requirement'
  | 'suggestion'
  | 'prohibition';

/**
 * A constraint that emerges from discourse-level cues.
 */
export interface DiscourseConstraint {
  readonly id: string;
  readonly source: ConstraintSource;
  readonly kind: ConstraintKind;
  readonly target: string;
  readonly description: string;
  readonly priority: number;
  readonly cuePhrase: string;
  readonly originalUtterance: string;
  readonly promoted: boolean;
  readonly promotedFrom: string | null;
  readonly timestamp: number;
}

/**
 * A rule for promoting discourse cues into constraints.
 */
export interface ConstraintPromotion {
  readonly ruleId: string;
  readonly cuePattern: string;
  readonly targetKind: ConstraintKind;
  readonly priorityBoost: number;
  readonly description: string;
  readonly sourceType: ConstraintSource;
  readonly requiresTarget: boolean;
  readonly examples: readonly string[];
}

/**
 * Configuration for discourse constraint detection.
 */
export interface DiscourseConstraintConfig {
  readonly enablePromotion: boolean;
  readonly defaultPriority: number;
  readonly maxPriority: number;
  readonly minPriority: number;
  readonly priorityBoostForBut: number;
  readonly priorityBoostForHowever: number;
  readonly priorityBoostForEspecially: number;
  readonly mergeStrategy: 'highest-priority' | 'combine' | 'first-wins';
  readonly allowDuplicates: boolean;
  readonly maxConstraints: number;
}

/**
 * Result of a batch detection operation.
 */
export interface DiscourseConstraintBatchResult {
  readonly utterances: readonly string[];
  readonly constraints: readonly DiscourseConstraint[];
  readonly promotions: readonly ConstraintPromotion[];
  readonly totalDetected: number;
  readonly totalPromoted: number;
  readonly elapsed: number;
}

// ----- 241: Default config -----

const DEFAULT_DISCOURSE_CONSTRAINT_CONFIG: DiscourseConstraintConfig = {
  enablePromotion: true,
  defaultPriority: 50,
  maxPriority: 100,
  minPriority: 0,
  priorityBoostForBut: 30,
  priorityBoostForHowever: 25,
  priorityBoostForEspecially: 20,
  mergeStrategy: 'highest-priority',
  allowDuplicates: false,
  maxConstraints: 50,
};

// ----- 241: Promotion rules (20+) -----

const PROMOTION_RULES: readonly ConstraintPromotion[] = [
  {
    ruleId: 'promo-but-keep',
    cuePattern: 'but keep',
    targetKind: 'hard',
    priorityBoost: 30,
    description: '"but keep X" promotes X to a hard constraint',
    sourceType: 'discourse-cue',
    requiresTarget: true,
    examples: ['but keep the melody', 'but keep the rhythm intact'],
  },
  {
    ruleId: 'promo-and-also',
    cuePattern: 'and also',
    targetKind: 'goal',
    priorityBoost: 10,
    description: '"and also X" adds X as an additional goal',
    sourceType: 'discourse-cue',
    requiresTarget: true,
    examples: ['and also add reverb', 'and also transpose up'],
  },
  {
    ruleId: 'promo-especially',
    cuePattern: 'especially',
    targetKind: 'preference',
    priorityBoost: 20,
    description: '"especially X" promotes X to a high-weight preference',
    sourceType: 'focus',
    requiresTarget: true,
    examples: ['especially the bass line', 'especially in the chorus'],
  },
  {
    ruleId: 'promo-dont-touch',
    cuePattern: "don't touch",
    targetKind: 'exclusion',
    priorityBoost: 35,
    description: '"don\'t touch X" creates an exclusion constraint on X',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ["don't touch the vocals", "don't touch track 3"],
  },
  {
    ruleId: 'promo-at-least',
    cuePattern: 'at least',
    targetKind: 'minimum-threshold',
    priorityBoost: 15,
    description: '"at least X" creates a minimum threshold constraint',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['at least 4 bars', 'at least 120 bpm'],
  },
  {
    ruleId: 'promo-at-most',
    cuePattern: 'at most',
    targetKind: 'maximum-threshold',
    priorityBoost: 15,
    description: '"at most X" creates a maximum threshold constraint',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['at most 8 bars', 'at most 140 bpm'],
  },
  {
    ruleId: 'promo-however',
    cuePattern: 'however',
    targetKind: 'hard',
    priorityBoost: 25,
    description: '"however X" promotes X to a hard constraint via contrast',
    sourceType: 'discourse-cue',
    requiresTarget: true,
    examples: ['however keep the tempo', 'however leave the intro'],
  },
  {
    ruleId: 'promo-make-sure',
    cuePattern: 'make sure',
    targetKind: 'requirement',
    priorityBoost: 25,
    description: '"make sure X" creates a requirement constraint',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['make sure the key stays the same', 'make sure it loops cleanly'],
  },
  {
    ruleId: 'promo-never',
    cuePattern: 'never',
    targetKind: 'prohibition',
    priorityBoost: 40,
    description: '"never X" creates a prohibition constraint',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['never change the time signature', 'never remove the melody'],
  },
  {
    ruleId: 'promo-always',
    cuePattern: 'always',
    targetKind: 'requirement',
    priorityBoost: 30,
    description: '"always X" creates a persistent requirement',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['always keep the downbeat', 'always quantize to grid'],
  },
  {
    ruleId: 'promo-prefer',
    cuePattern: 'prefer',
    targetKind: 'preference',
    priorityBoost: 10,
    description: '"prefer X" creates a soft preference',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['prefer shorter phrases', 'prefer major keys'],
  },
  {
    ruleId: 'promo-avoid',
    cuePattern: 'avoid',
    targetKind: 'exclusion',
    priorityBoost: 20,
    description: '"avoid X" creates a soft exclusion',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['avoid dissonance', 'avoid tritones'],
  },
  {
    ruleId: 'promo-must',
    cuePattern: 'must',
    targetKind: 'hard',
    priorityBoost: 35,
    description: '"must X" promotes X to a hard constraint',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['must stay in 4/4', 'must resolve to tonic'],
  },
  {
    ruleId: 'promo-unless',
    cuePattern: 'unless',
    targetKind: 'soft',
    priorityBoost: 10,
    description: '"unless X" adds a conditional soft constraint',
    sourceType: 'implicature',
    requiresTarget: true,
    examples: ['unless you mean the bridge', 'unless it sounds better'],
  },
  {
    ruleId: 'promo-but-not',
    cuePattern: 'but not',
    targetKind: 'exclusion',
    priorityBoost: 25,
    description: '"but not X" creates an exclusion on X',
    sourceType: 'discourse-cue',
    requiresTarget: true,
    examples: ['but not the drums', 'but not in the verse'],
  },
  {
    ruleId: 'promo-only',
    cuePattern: 'only',
    targetKind: 'hard',
    priorityBoost: 30,
    description: '"only X" restricts scope to X exclusively',
    sourceType: 'focus',
    requiresTarget: true,
    examples: ['only the chorus', 'only track 2'],
  },
  {
    ruleId: 'promo-just',
    cuePattern: 'just',
    targetKind: 'soft',
    priorityBoost: 5,
    description: '"just X" minimizes scope to X',
    sourceType: 'focus',
    requiresTarget: true,
    examples: ['just the intro', 'just a little reverb'],
  },
  {
    ruleId: 'promo-ideally',
    cuePattern: 'ideally',
    targetKind: 'preference',
    priorityBoost: 8,
    description: '"ideally X" creates a weak preference',
    sourceType: 'implicature',
    requiresTarget: true,
    examples: ['ideally under 8 bars', 'ideally major key'],
  },
  {
    ruleId: 'promo-no-matter-what',
    cuePattern: 'no matter what',
    targetKind: 'hard',
    priorityBoost: 40,
    description: '"no matter what X" creates an absolute hard constraint',
    sourceType: 'explicit',
    requiresTarget: false,
    examples: ['keep the melody no matter what', 'no matter what keep it in time'],
  },
  {
    ruleId: 'promo-try-to',
    cuePattern: 'try to',
    targetKind: 'suggestion',
    priorityBoost: 5,
    description: '"try to X" creates a suggestion',
    sourceType: 'implicature',
    requiresTarget: true,
    examples: ['try to keep it short', 'try to match the vibe'],
  },
  {
    ruleId: 'promo-if-possible',
    cuePattern: 'if possible',
    targetKind: 'suggestion',
    priorityBoost: 3,
    description: '"if possible X" creates a low-priority suggestion',
    sourceType: 'implicature',
    requiresTarget: false,
    examples: ['add reverb if possible', 'keep it under 16 bars if possible'],
  },
  {
    ruleId: 'promo-without',
    cuePattern: 'without',
    targetKind: 'exclusion',
    priorityBoost: 20,
    description: '"without X" creates an exclusion constraint',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['without the drums', 'without changing the key'],
  },
  {
    ruleId: 'promo-preserve',
    cuePattern: 'preserve',
    targetKind: 'hard',
    priorityBoost: 30,
    description: '"preserve X" creates a hard preservation constraint',
    sourceType: 'explicit',
    requiresTarget: true,
    examples: ['preserve the original rhythm', 'preserve the bass line'],
  },
  {
    ruleId: 'promo-regardless',
    cuePattern: 'regardless',
    targetKind: 'hard',
    priorityBoost: 35,
    description: '"regardless X" promotes to unconditional hard constraint',
    sourceType: 'discourse-cue',
    requiresTarget: false,
    examples: ['keep the melody regardless', 'regardless of the tempo'],
  },
] as const;

// ----- 241: Constraint ID generator -----

let _discourseConstraintCounter = 0;

function generateConstraintId(): string {
  _discourseConstraintCounter += 1;
  return `dc-${_discourseConstraintCounter}-${Date.now()}`;
}

// ----- 241: Helper to extract target from text after cue -----

function extractTargetAfterCue(text: string, cue: string): string {
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(cue.toLowerCase());
  if (idx === -1) return '';
  const afterCue = text.substring(idx + cue.length).trim();
  // Take up to the next punctuation or end
  const endMatch = afterCue.match(/[.,;!?]/);
  if (endMatch !== null && endMatch.index !== undefined) {
    return afterCue.substring(0, endMatch.index).trim();
  }
  return afterCue.trim();
}

// ----- 241: Clamp utility -----

function clampPriority(value: number, config: DiscourseConstraintConfig): number {
  if (value < config.minPriority) return config.minPriority;
  if (value > config.maxPriority) return config.maxPriority;
  return value;
}

// ----- 241: Core functions -----

/**
 * Detect discourse constraints from an utterance.
 */
export function detectDiscourseConstraints(
  utterance: string,
  config?: Partial<DiscourseConstraintConfig>,
): readonly DiscourseConstraint[] {
  const cfg: DiscourseConstraintConfig = {
    ...DEFAULT_DISCOURSE_CONSTRAINT_CONFIG,
    ...(config !== undefined ? config : {}),
  };

  const detected: DiscourseConstraint[] = [];
  const lowerUtterance = utterance.toLowerCase();

  for (const rule of PROMOTION_RULES) {
    if (lowerUtterance.includes(rule.cuePattern.toLowerCase())) {
      const target = extractTargetAfterCue(utterance, rule.cuePattern);
      if (rule.requiresTarget && target.length === 0) {
        continue;
      }
      const priority = clampPriority(
        cfg.defaultPriority + rule.priorityBoost,
        cfg,
      );
      const constraint: DiscourseConstraint = {
        id: generateConstraintId(),
        source: rule.sourceType,
        kind: rule.targetKind,
        target: target.length > 0 ? target : utterance,
        description: rule.description,
        priority,
        cuePhrase: rule.cuePattern,
        originalUtterance: utterance,
        promoted: cfg.enablePromotion,
        promotedFrom: rule.ruleId,
        timestamp: Date.now(),
      };
      detected.push(constraint);
    }
  }

  if (!cfg.allowDuplicates) {
    const seen = new Set<string>();
    const unique: DiscourseConstraint[] = [];
    for (const c of detected) {
      const key = `${c.kind}:${c.target}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    return unique.slice(0, cfg.maxConstraints);
  }

  return detected.slice(0, cfg.maxConstraints);
}

/**
 * Promote a detected cue into a full constraint.
 */
export function promoteToConstraint(
  cue: string,
  target: string,
  kind: ConstraintKind,
  source: ConstraintSource,
  priorityBoost: number,
  config?: Partial<DiscourseConstraintConfig>,
): DiscourseConstraint {
  const cfg: DiscourseConstraintConfig = {
    ...DEFAULT_DISCOURSE_CONSTRAINT_CONFIG,
    ...(config !== undefined ? config : {}),
  };
  const priority = clampPriority(cfg.defaultPriority + priorityBoost, cfg);
  return {
    id: generateConstraintId(),
    source,
    kind,
    target,
    description: `Promoted from cue "${cue}" targeting "${target}"`,
    priority,
    cuePhrase: cue,
    originalUtterance: `${cue} ${target}`,
    promoted: true,
    promotedFrom: null,
    timestamp: Date.now(),
  };
}

/**
 * Get the constraint source for a given cue phrase.
 */
export function getConstraintSource(cuePhrase: string): ConstraintSource {
  const lower = cuePhrase.toLowerCase().trim();
  const discourseCues = ['but', 'however', 'yet', 'still', 'nevertheless', 'regardless'];
  const focusCues = ['especially', 'particularly', 'only', 'just', 'mainly'];
  const implicatureCues = ['unless', 'ideally', 'try to', 'if possible'];
  const presuppositionCues = ['again', 'still', 'keep', 'continue', 'preserve'];

  for (const cue of discourseCues) {
    if (lower.startsWith(cue)) return 'discourse-cue';
  }
  for (const cue of focusCues) {
    if (lower.startsWith(cue)) return 'focus';
  }
  for (const cue of implicatureCues) {
    if (lower.startsWith(cue)) return 'implicature';
  }
  for (const cue of presuppositionCues) {
    if (lower.startsWith(cue)) return 'presupposition';
  }
  return 'explicit';
}

/**
 * Apply discourse-level promotion to boost priority of constraints.
 */
export function applyDiscoursePromotion(
  constraint: DiscourseConstraint,
  boostAmount: number,
  config?: Partial<DiscourseConstraintConfig>,
): DiscourseConstraint {
  const cfg: DiscourseConstraintConfig = {
    ...DEFAULT_DISCOURSE_CONSTRAINT_CONFIG,
    ...(config !== undefined ? config : {}),
  };
  const newPriority = clampPriority(constraint.priority + boostAmount, cfg);
  return {
    ...constraint,
    priority: newPriority,
    promoted: true,
  };
}

/**
 * Rank discourse constraints by priority (descending).
 */
export function rankDiscourseConstraints(
  constraints: readonly DiscourseConstraint[],
): readonly DiscourseConstraint[] {
  const sorted = [...constraints];
  sorted.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.timestamp - b.timestamp;
  });
  return sorted;
}

/**
 * Format a discourse constraint for display.
 */
export function formatDiscourseConstraint(constraint: DiscourseConstraint): string {
  const kindLabel = constraint.kind.toUpperCase();
  const sourceLabel = constraint.source;
  const priorityLabel = constraint.priority >= 80
    ? 'HIGH'
    : constraint.priority >= 50
      ? 'MEDIUM'
      : 'LOW';
  return (
    `[${kindLabel}] (${sourceLabel}, ${priorityLabel} priority=${constraint.priority}) ` +
    `"${constraint.cuePhrase}" → ${constraint.target}`
  );
}

/**
 * Batch detect constraints across multiple utterances.
 */
export function batchDetectConstraints(
  utterances: readonly string[],
  config?: Partial<DiscourseConstraintConfig>,
): DiscourseConstraintBatchResult {
  const start = Date.now();
  const allConstraints: DiscourseConstraint[] = [];
  const allPromotions: ConstraintPromotion[] = [];

  for (const utt of utterances) {
    const detected = detectDiscourseConstraints(utt, config);
    for (const c of detected) {
      allConstraints.push(c);
    }
  }

  // Collect which promotion rules were actually used
  const usedRuleIds = new Set<string>();
  for (const c of allConstraints) {
    if (c.promotedFrom !== null) {
      usedRuleIds.add(c.promotedFrom);
    }
  }
  for (const rule of PROMOTION_RULES) {
    if (usedRuleIds.has(rule.ruleId)) {
      allPromotions.push(rule);
    }
  }

  return {
    utterances,
    constraints: allConstraints,
    promotions: allPromotions,
    totalDetected: allConstraints.length,
    totalPromoted: allConstraints.filter((c) => c.promoted).length,
    elapsed: Date.now() - start,
  };
}

/**
 * Get all promotion rules.
 */
export function getPromotionRules(): readonly ConstraintPromotion[] {
  return PROMOTION_RULES;
}

/**
 * Check if a constraint is high priority (>= 70).
 */
export function isHighPriority(constraint: DiscourseConstraint): boolean {
  return constraint.priority >= 70;
}

/**
 * Merge discourse constraints using the configured strategy.
 */
export function mergeDiscourseConstraints(
  constraintsA: readonly DiscourseConstraint[],
  constraintsB: readonly DiscourseConstraint[],
  config?: Partial<DiscourseConstraintConfig>,
): readonly DiscourseConstraint[] {
  const cfg: DiscourseConstraintConfig = {
    ...DEFAULT_DISCOURSE_CONSTRAINT_CONFIG,
    ...(config !== undefined ? config : {}),
  };

  if (cfg.mergeStrategy === 'first-wins') {
    const seen = new Set<string>();
    const result: DiscourseConstraint[] = [];
    for (const c of constraintsA) {
      const key = `${c.kind}:${c.target}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(c);
      }
    }
    for (const c of constraintsB) {
      const key = `${c.kind}:${c.target}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(c);
      }
    }
    return result.slice(0, cfg.maxConstraints);
  }

  if (cfg.mergeStrategy === 'highest-priority') {
    const byKey = new Map<string, DiscourseConstraint>();
    for (const c of constraintsA) {
      const key = `${c.kind}:${c.target}`;
      const existing = byKey.get(key);
      if (existing === undefined || c.priority > existing.priority) {
        byKey.set(key, c);
      }
    }
    for (const c of constraintsB) {
      const key = `${c.kind}:${c.target}`;
      const existing = byKey.get(key);
      if (existing === undefined || c.priority > existing.priority) {
        byKey.set(key, c);
      }
    }
    const result = Array.from(byKey.values());
    return rankDiscourseConstraints(result).slice(0, cfg.maxConstraints);
  }

  // combine: just concatenate and deduplicate
  const all = [...constraintsA, ...constraintsB];
  if (!cfg.allowDuplicates) {
    const seen = new Set<string>();
    const unique: DiscourseConstraint[] = [];
    for (const c of all) {
      const key = `${c.kind}:${c.target}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    return unique.slice(0, cfg.maxConstraints);
  }
  return all.slice(0, cfg.maxConstraints);
}


// ============================================================================
// Step 242 [Sem][Prag] — Accommodation Policies
// ============================================================================

/**
 * Policy level controlling how aggressively defaults are filled in.
 */
export type PolicyLevel = 'strict' | 'moderate' | 'permissive' | 'auto';

/**
 * A category of underspecified parameter.
 */
export type AccommodationCategory =
  | 'scope'
  | 'amount'
  | 'target'
  | 'timing'
  | 'instrument'
  | 'key'
  | 'tempo'
  | 'dynamics'
  | 'duration'
  | 'style'
  | 'effect'
  | 'position'
  | 'direction'
  | 'quantization'
  | 'velocity'
  | 'pan'
  | 'pitch'
  | 'octave'
  | 'channel'
  | 'articulation'
  | 'rhythm-pattern'
  | 'mix-level'
  | 'frequency-band';

/**
 * An accommodation policy dictating how underspecified requests are handled.
 */
export interface AccommodationPolicy {
  readonly level: PolicyLevel;
  readonly requiresAcknowledgement: boolean;
  readonly autoFillCategories: readonly AccommodationCategory[];
  readonly neverAutoFillCategories: readonly AccommodationCategory[];
  readonly maxAutoFills: number;
  readonly showAlternatives: boolean;
  readonly safetyImpactThreshold: number;
}

/**
 * A proposed default for an underspecified parameter.
 */
export interface AccommodationProposal {
  readonly id: string;
  readonly category: AccommodationCategory;
  readonly assumedValue: string;
  readonly reason: string;
  readonly alternatives: readonly string[];
  readonly safetyImpact: 'none' | 'low' | 'medium' | 'high';
  readonly acknowledged: boolean;
  readonly policyLevel: PolicyLevel;
  readonly timestamp: number;
}

/**
 * A default selection for a given accommodation category.
 */
export interface DefaultSelection {
  readonly category: AccommodationCategory;
  readonly defaultValue: string;
  readonly reason: string;
  readonly alternatives: readonly string[];
  readonly confidence: number;
}

/**
 * Configuration for the accommodation system.
 */
export interface AccommodationConfig {
  readonly policy: AccommodationPolicy;
  readonly maxProposals: number;
  readonly showSafetyImpact: boolean;
  readonly recordHistory: boolean;
  readonly historyLimit: number;
  readonly verboseProposals: boolean;
}

/**
 * History entry for accommodation decisions.
 */
export interface AccommodationHistoryEntry {
  readonly proposal: AccommodationProposal;
  readonly accepted: boolean;
  readonly userOverride: string | null;
  readonly timestamp: number;
}

// ----- 242: Default policies -----

const STRICT_POLICY: AccommodationPolicy = {
  level: 'strict',
  requiresAcknowledgement: true,
  autoFillCategories: [],
  neverAutoFillCategories: [
    'scope', 'amount', 'target', 'timing', 'instrument', 'key', 'tempo',
    'dynamics', 'duration', 'style', 'effect', 'position', 'direction',
    'quantization', 'velocity', 'pan', 'pitch', 'octave', 'channel',
    'articulation', 'rhythm-pattern', 'mix-level', 'frequency-band',
  ],
  maxAutoFills: 0,
  showAlternatives: true,
  safetyImpactThreshold: 0,
};

const MODERATE_POLICY: AccommodationPolicy = {
  level: 'moderate',
  requiresAcknowledgement: true,
  autoFillCategories: [
    'quantization', 'velocity', 'pan', 'octave', 'channel',
    'articulation', 'mix-level',
  ],
  neverAutoFillCategories: [
    'scope', 'key', 'tempo', 'instrument',
  ],
  maxAutoFills: 5,
  showAlternatives: true,
  safetyImpactThreshold: 3,
};

const PERMISSIVE_POLICY: AccommodationPolicy = {
  level: 'permissive',
  requiresAcknowledgement: false,
  autoFillCategories: [
    'scope', 'amount', 'target', 'timing', 'instrument', 'key', 'tempo',
    'dynamics', 'duration', 'style', 'effect', 'position', 'direction',
    'quantization', 'velocity', 'pan', 'pitch', 'octave', 'channel',
    'articulation', 'rhythm-pattern', 'mix-level', 'frequency-band',
  ],
  neverAutoFillCategories: [],
  maxAutoFills: 50,
  showAlternatives: false,
  safetyImpactThreshold: 8,
};

const AUTO_POLICY: AccommodationPolicy = {
  level: 'auto',
  requiresAcknowledgement: false,
  autoFillCategories: [
    'quantization', 'velocity', 'pan', 'octave', 'channel',
    'articulation', 'mix-level', 'position', 'direction',
    'amount', 'duration', 'dynamics',
  ],
  neverAutoFillCategories: ['scope', 'key', 'tempo'],
  maxAutoFills: 10,
  showAlternatives: true,
  safetyImpactThreshold: 5,
};

// ----- 242: Accommodation scenarios (20+) -----

interface AccommodationScenario {
  readonly category: AccommodationCategory;
  readonly condition: string;
  readonly defaultValue: string;
  readonly reason: string;
  readonly alternatives: readonly string[];
  readonly safetyImpact: 'none' | 'low' | 'medium' | 'high';
}

const ACCOMMODATION_SCENARIOS: readonly AccommodationScenario[] = [
  {
    category: 'scope',
    condition: 'missing-scope',
    defaultValue: 'whole project',
    reason: 'No scope specified; proposing the entire project as default',
    alternatives: ['current track', 'current selection', 'active section'],
    safetyImpact: 'high',
  },
  {
    category: 'amount',
    condition: 'missing-amount',
    defaultValue: 'moderate',
    reason: 'No amount specified; proposing a moderate change',
    alternatives: ['subtle', 'significant', 'maximum'],
    safetyImpact: 'low',
  },
  {
    category: 'target',
    condition: 'missing-target',
    defaultValue: 'all tracks',
    reason: 'No target specified; proposing all tracks',
    alternatives: ['selected track', 'master bus', 'active track'],
    safetyImpact: 'medium',
  },
  {
    category: 'timing',
    condition: 'missing-timing',
    defaultValue: 'from the beginning',
    reason: 'No timing specified; proposing from the beginning',
    alternatives: ['from current position', 'at the end', 'from selection start'],
    safetyImpact: 'low',
  },
  {
    category: 'instrument',
    condition: 'missing-instrument',
    defaultValue: 'piano',
    reason: 'No instrument specified; proposing piano as default',
    alternatives: ['synth', 'guitar', 'strings', 'organ'],
    safetyImpact: 'low',
  },
  {
    category: 'key',
    condition: 'missing-key',
    defaultValue: 'C major',
    reason: 'No key specified; proposing C major as default',
    alternatives: ['A minor', 'G major', 'D minor'],
    safetyImpact: 'medium',
  },
  {
    category: 'tempo',
    condition: 'missing-tempo',
    defaultValue: '120 BPM',
    reason: 'No tempo specified; proposing 120 BPM as default',
    alternatives: ['100 BPM', '140 BPM', 'match existing'],
    safetyImpact: 'medium',
  },
  {
    category: 'dynamics',
    condition: 'missing-dynamics',
    defaultValue: 'mezzo-forte',
    reason: 'No dynamics specified; proposing mezzo-forte',
    alternatives: ['piano', 'forte', 'fortissimo', 'pianissimo'],
    safetyImpact: 'low',
  },
  {
    category: 'duration',
    condition: 'missing-duration',
    defaultValue: '4 bars',
    reason: 'No duration specified; proposing 4 bars',
    alternatives: ['2 bars', '8 bars', '16 bars', '1 bar'],
    safetyImpact: 'low',
  },
  {
    category: 'style',
    condition: 'missing-style',
    defaultValue: 'neutral',
    reason: 'No style specified; proposing neutral style',
    alternatives: ['jazz', 'classical', 'electronic', 'rock'],
    safetyImpact: 'low',
  },
  {
    category: 'effect',
    condition: 'missing-effect',
    defaultValue: 'reverb (medium)',
    reason: 'No effect amount specified; proposing medium reverb',
    alternatives: ['light reverb', 'heavy reverb', 'delay', 'chorus'],
    safetyImpact: 'low',
  },
  {
    category: 'position',
    condition: 'missing-position',
    defaultValue: 'bar 1, beat 1',
    reason: 'No position specified; proposing the beginning',
    alternatives: ['current cursor', 'end of section', 'after selection'],
    safetyImpact: 'low',
  },
  {
    category: 'direction',
    condition: 'missing-direction',
    defaultValue: 'up',
    reason: 'No direction specified; proposing upward',
    alternatives: ['down', 'random', 'alternating'],
    safetyImpact: 'low',
  },
  {
    category: 'quantization',
    condition: 'missing-quantization',
    defaultValue: '1/16 note',
    reason: 'No quantization grid specified; proposing 1/16 note',
    alternatives: ['1/8 note', '1/4 note', '1/32 note', 'triplet'],
    safetyImpact: 'none',
  },
  {
    category: 'velocity',
    condition: 'missing-velocity',
    defaultValue: '80',
    reason: 'No velocity specified; proposing 80 (moderate)',
    alternatives: ['64', '100', '127', '48'],
    safetyImpact: 'none',
  },
  {
    category: 'pan',
    condition: 'missing-pan',
    defaultValue: 'center',
    reason: 'No pan position specified; proposing center',
    alternatives: ['left 50%', 'right 50%', 'hard left', 'hard right'],
    safetyImpact: 'none',
  },
  {
    category: 'pitch',
    condition: 'missing-pitch',
    defaultValue: 'C4',
    reason: 'No pitch specified; proposing middle C (C4)',
    alternatives: ['C3', 'C5', 'A4', 'E4'],
    safetyImpact: 'low',
  },
  {
    category: 'octave',
    condition: 'missing-octave',
    defaultValue: '4',
    reason: 'No octave specified; proposing octave 4 (middle)',
    alternatives: ['3', '5', '2', '6'],
    safetyImpact: 'low',
  },
  {
    category: 'channel',
    condition: 'missing-channel',
    defaultValue: '1',
    reason: 'No MIDI channel specified; proposing channel 1',
    alternatives: ['2', '10 (drums)', '16'],
    safetyImpact: 'none',
  },
  {
    category: 'articulation',
    condition: 'missing-articulation',
    defaultValue: 'normal',
    reason: 'No articulation specified; proposing normal',
    alternatives: ['staccato', 'legato', 'marcato', 'tenuto'],
    safetyImpact: 'none',
  },
  {
    category: 'rhythm-pattern',
    condition: 'missing-rhythm-pattern',
    defaultValue: 'straight eighths',
    reason: 'No rhythm pattern specified; proposing straight eighth notes',
    alternatives: ['swing', 'dotted', 'triplet', 'syncopated'],
    safetyImpact: 'low',
  },
  {
    category: 'mix-level',
    condition: 'missing-mix-level',
    defaultValue: '0 dB',
    reason: 'No mix level specified; proposing unity gain',
    alternatives: ['-3 dB', '-6 dB', '+3 dB', '-12 dB'],
    safetyImpact: 'none',
  },
  {
    category: 'frequency-band',
    condition: 'missing-frequency-band',
    defaultValue: 'full range',
    reason: 'No frequency band specified; proposing full range',
    alternatives: ['low (20-200 Hz)', 'mid (200-5000 Hz)', 'high (5000-20000 Hz)'],
    safetyImpact: 'none',
  },
] as const;

// ----- 242: Accommodation state -----

let _currentAccommodationPolicy: AccommodationPolicy = MODERATE_POLICY;
const _accommodationHistory: AccommodationHistoryEntry[] = [];
let _accommodationProposalCounter = 0;

function generateProposalId(): string {
  _accommodationProposalCounter += 1;
  return `ap-${_accommodationProposalCounter}-${Date.now()}`;
}

// ----- 242: Core functions -----

/**
 * Get the current accommodation policy.
 */
export function getAccommodationPolicy(): AccommodationPolicy {
  return _currentAccommodationPolicy;
}

/**
 * Propose defaults for underspecified categories.
 */
export function proposeDefaults(
  missingCategories: readonly AccommodationCategory[],
  policy?: AccommodationPolicy,
): readonly AccommodationProposal[] {
  const pol = policy !== undefined ? policy : _currentAccommodationPolicy;
  const proposals: AccommodationProposal[] = [];

  for (const cat of missingCategories) {
    if (pol.neverAutoFillCategories.includes(cat)) {
      continue;
    }

    const scenario = ACCOMMODATION_SCENARIOS.find((s) => s.category === cat);
    if (scenario === undefined) {
      continue;
    }

    const proposal: AccommodationProposal = {
      id: generateProposalId(),
      category: cat,
      assumedValue: scenario.defaultValue,
      reason: scenario.reason,
      alternatives: scenario.alternatives,
      safetyImpact: scenario.safetyImpact,
      acknowledged: false,
      policyLevel: pol.level,
      timestamp: Date.now(),
    };
    proposals.push(proposal);
  }

  return proposals.slice(0, pol.maxAutoFills);
}

/**
 * Check if a proposal requires acknowledgement.
 */
export function requiresAcknowledgement(
  proposal: AccommodationProposal,
  policy?: AccommodationPolicy,
): boolean {
  const pol = policy !== undefined ? policy : _currentAccommodationPolicy;

  if (pol.level === 'strict') return true;
  if (pol.level === 'permissive') return false;

  // For moderate and auto, check safety impact
  const impactScores: Record<string, number> = {
    none: 0,
    low: 1,
    medium: 3,
    high: 5,
  };
  const score = impactScores[proposal.safetyImpact] ?? 0;
  return score >= pol.safetyImpactThreshold || pol.requiresAcknowledgement;
}

/**
 * Apply an accommodation, recording it in history.
 */
export function applyAccommodation(
  proposal: AccommodationProposal,
  accepted: boolean,
  userOverride?: string,
): AccommodationHistoryEntry {
  const entry: AccommodationHistoryEntry = {
    proposal: {
      ...proposal,
      acknowledged: true,
    },
    accepted,
    userOverride: userOverride !== undefined ? userOverride : null,
    timestamp: Date.now(),
  };
  _accommodationHistory.push(entry);
  return entry;
}

/**
 * Format a proposal for display to the user.
 */
export function formatProposal(proposal: AccommodationProposal): string {
  const lines: string[] = [];
  lines.push(`Assumed: ${proposal.category} = "${proposal.assumedValue}"`);
  lines.push(`  Reason: ${proposal.reason}`);
  if (proposal.alternatives.length > 0) {
    lines.push(`  Alternatives: ${proposal.alternatives.join(', ')}`);
  }
  lines.push(`  Safety impact: ${proposal.safetyImpact}`);
  lines.push(`  Policy: ${proposal.policyLevel}`);
  return lines.join('\n');
}

/**
 * Set the accommodation policy level.
 */
export function setPolicy(level: PolicyLevel): AccommodationPolicy {
  switch (level) {
    case 'strict':
      _currentAccommodationPolicy = STRICT_POLICY;
      break;
    case 'moderate':
      _currentAccommodationPolicy = MODERATE_POLICY;
      break;
    case 'permissive':
      _currentAccommodationPolicy = PERMISSIVE_POLICY;
      break;
    case 'auto':
      _currentAccommodationPolicy = AUTO_POLICY;
      break;
  }
  return _currentAccommodationPolicy;
}

/**
 * Get the default for a specific underspecified category.
 */
export function getDefaultForHole(
  category: AccommodationCategory,
): DefaultSelection | null {
  const scenario = ACCOMMODATION_SCENARIOS.find((s) => s.category === category);
  if (scenario === undefined) return null;
  return {
    category: scenario.category,
    defaultValue: scenario.defaultValue,
    reason: scenario.reason,
    alternatives: scenario.alternatives,
    confidence: scenario.safetyImpact === 'none' ? 0.9
      : scenario.safetyImpact === 'low' ? 0.7
        : scenario.safetyImpact === 'medium' ? 0.5
          : 0.3,
  };
}

/**
 * Rank default options by confidence for a given category.
 */
export function rankDefaultOptions(
  category: AccommodationCategory,
): readonly DefaultSelection[] {
  const scenario = ACCOMMODATION_SCENARIOS.find((s) => s.category === category);
  if (scenario === undefined) return [];

  const results: DefaultSelection[] = [];
  // Primary default
  results.push({
    category,
    defaultValue: scenario.defaultValue,
    reason: `Primary default: ${scenario.reason}`,
    alternatives: scenario.alternatives,
    confidence: 0.8,
  });

  // Alternatives as lower-confidence options
  for (let i = 0; i < scenario.alternatives.length; i++) {
    const alt = scenario.alternatives[i];
    if (alt !== undefined) {
      results.push({
        category,
        defaultValue: alt,
        reason: `Alternative ${i + 1} for ${category}`,
        alternatives: [scenario.defaultValue],
        confidence: 0.6 - i * 0.1,
      });
    }
  }

  return results;
}

/**
 * Batch accommodate multiple missing categories.
 */
export function batchAccommodate(
  missingCategories: readonly AccommodationCategory[],
  policy?: AccommodationPolicy,
): readonly AccommodationProposal[] {
  return proposeDefaults(missingCategories, policy);
}

/**
 * Get the accommodation history.
 */
export function getAccommodationHistory(): readonly AccommodationHistoryEntry[] {
  return [..._accommodationHistory];
}


// ============================================================================
// Step 243 [Prag] — Safety-first Deference
// ============================================================================

/**
 * Scope of change that a binding would produce.
 */
export type ChangeScope =
  | 'minimal'
  | 'moderate'
  | 'significant'
  | 'major'
  | 'destructive';

/**
 * Why a safety assessment triggered.
 */
export type SafetyTrigger =
  | 'large-scope'
  | 'vague-intent'
  | 'destructive-action'
  | 'irreversible'
  | 'multi-track'
  | 'whole-project'
  | 'tempo-change'
  | 'key-change'
  | 'delete-operation'
  | 'overwrite-operation'
  | 'batch-operation'
  | 'structure-change'
  | 'time-signature-change'
  | 'instrument-reassign'
  | 'mix-reset'
  | 'effect-chain-replace'
  | 'automation-clear'
  | 'arrangement-reorder'
  | 'quantize-all'
  | 'normalize'
  | 'global-transpose';

/**
 * A safety assessment for a proposed binding.
 */
export interface SafetyAssessment {
  readonly id: string;
  readonly changeScope: ChangeScope;
  readonly riskScore: number;
  readonly triggers: readonly SafetyTrigger[];
  readonly description: string;
  readonly recommendation: 'proceed' | 'summarize' | 'clarify' | 'refuse';
  readonly affectedEntities: readonly string[];
  readonly estimatedImpact: string;
  readonly timestamp: number;
}

/**
 * A safety policy controlling deference thresholds.
 */
export interface SafetyPolicy {
  readonly autoExecuteMaxScope: ChangeScope;
  readonly alwaysConfirmScopes: readonly ChangeScope[];
  readonly riskThresholdForClarification: number;
  readonly riskThresholdForRefusal: number;
  readonly destructiveAlwaysConfirm: boolean;
  readonly maxAutoExecuteEntities: number;
  readonly allowOverride: boolean;
}

/**
 * A deference decision: should we ask instead of execute?
 */
export interface DeferenceDecision {
  readonly shouldDefer: boolean;
  readonly reason: string;
  readonly assessment: SafetyAssessment;
  readonly suggestedQuestion: string | null;
  readonly alternatives: readonly string[];
}

/**
 * Configuration for safety system.
 */
export interface SafetyConfig {
  readonly policy: SafetyPolicy;
  readonly recordHistory: boolean;
  readonly historyLimit: number;
  readonly verbose: boolean;
}

/**
 * History of safety assessments.
 */
export interface SafetyHistoryEntry {
  readonly assessment: SafetyAssessment;
  readonly decision: DeferenceDecision;
  readonly overridden: boolean;
  readonly timestamp: number;
}

// ----- 243: Scope thresholds -----

const SCOPE_SCORES: Record<ChangeScope, number> = {
  minimal: 1,
  moderate: 3,
  significant: 5,
  major: 8,
  destructive: 10,
};

const TRIGGER_RISK_SCORES: Record<SafetyTrigger, number> = {
  'large-scope': 4,
  'vague-intent': 3,
  'destructive-action': 8,
  'irreversible': 9,
  'multi-track': 3,
  'whole-project': 6,
  'tempo-change': 4,
  'key-change': 5,
  'delete-operation': 7,
  'overwrite-operation': 6,
  'batch-operation': 4,
  'structure-change': 5,
  'time-signature-change': 6,
  'instrument-reassign': 3,
  'mix-reset': 7,
  'effect-chain-replace': 5,
  'automation-clear': 6,
  'arrangement-reorder': 5,
  'quantize-all': 4,
  'normalize': 3,
  'global-transpose': 5,
};

// ----- 243: Default safety policy -----

const DEFAULT_SAFETY_POLICY: SafetyPolicy = {
  autoExecuteMaxScope: 'moderate',
  alwaysConfirmScopes: ['major', 'destructive'],
  riskThresholdForClarification: 4,
  riskThresholdForRefusal: 9,
  destructiveAlwaysConfirm: true,
  maxAutoExecuteEntities: 3,
  allowOverride: true,
};

let _currentSafetyPolicy: SafetyPolicy = DEFAULT_SAFETY_POLICY;
const _safetyHistory: SafetyHistoryEntry[] = [];
let _safetyAssessmentCounter = 0;

function generateSafetyId(): string {
  _safetyAssessmentCounter += 1;
  return `sa-${_safetyAssessmentCounter}-${Date.now()}`;
}

// ----- 243: Safety assessment patterns (20+) -----

interface SafetyPattern {
  readonly pattern: string;
  readonly triggers: readonly SafetyTrigger[];
  readonly scopeHint: ChangeScope;
  readonly description: string;
}

const SAFETY_PATTERNS: readonly SafetyPattern[] = [
  {
    pattern: 'delete all',
    triggers: ['destructive-action', 'whole-project', 'irreversible'],
    scopeHint: 'destructive',
    description: 'Deleting all content is destructive and irreversible',
  },
  {
    pattern: 'remove everything',
    triggers: ['destructive-action', 'whole-project'],
    scopeHint: 'destructive',
    description: 'Removing everything affects the entire project',
  },
  {
    pattern: 'change the key',
    triggers: ['key-change', 'whole-project'],
    scopeHint: 'major',
    description: 'Changing the key affects all pitched content',
  },
  {
    pattern: 'change tempo',
    triggers: ['tempo-change', 'whole-project'],
    scopeHint: 'significant',
    description: 'Tempo change affects timing of all events',
  },
  {
    pattern: 'replace all',
    triggers: ['overwrite-operation', 'batch-operation', 'whole-project'],
    scopeHint: 'major',
    description: 'Replacing all content is a major operation',
  },
  {
    pattern: 'overwrite',
    triggers: ['overwrite-operation'],
    scopeHint: 'significant',
    description: 'Overwriting existing content',
  },
  {
    pattern: 'clear',
    triggers: ['delete-operation'],
    scopeHint: 'significant',
    description: 'Clearing content removes existing data',
  },
  {
    pattern: 'reset',
    triggers: ['mix-reset', 'destructive-action'],
    scopeHint: 'major',
    description: 'Resetting loses current state',
  },
  {
    pattern: 'all tracks',
    triggers: ['multi-track', 'batch-operation'],
    scopeHint: 'significant',
    description: 'Operating on all tracks simultaneously',
  },
  {
    pattern: 'every',
    triggers: ['batch-operation'],
    scopeHint: 'significant',
    description: 'Operating on every instance',
  },
  {
    pattern: 'transpose everything',
    triggers: ['global-transpose', 'whole-project'],
    scopeHint: 'major',
    description: 'Global transposition affects all pitched content',
  },
  {
    pattern: 'restructure',
    triggers: ['structure-change', 'arrangement-reorder'],
    scopeHint: 'major',
    description: 'Restructuring changes arrangement order',
  },
  {
    pattern: 'rearrange',
    triggers: ['arrangement-reorder', 'structure-change'],
    scopeHint: 'major',
    description: 'Rearranging changes section order',
  },
  {
    pattern: 'time signature',
    triggers: ['time-signature-change', 'structure-change'],
    scopeHint: 'significant',
    description: 'Time signature change affects rhythmic structure',
  },
  {
    pattern: 'strip effects',
    triggers: ['effect-chain-replace', 'batch-operation'],
    scopeHint: 'significant',
    description: 'Stripping effects removes all processing',
  },
  {
    pattern: 'remove automation',
    triggers: ['automation-clear'],
    scopeHint: 'significant',
    description: 'Removing automation loses dynamic changes',
  },
  {
    pattern: 'quantize all',
    triggers: ['quantize-all', 'batch-operation'],
    scopeHint: 'significant',
    description: 'Quantizing all notes may change feel',
  },
  {
    pattern: 'normalize',
    triggers: ['normalize', 'batch-operation'],
    scopeHint: 'moderate',
    description: 'Normalizing changes levels',
  },
  {
    pattern: 'change instrument',
    triggers: ['instrument-reassign'],
    scopeHint: 'moderate',
    description: 'Changing instrument alters sound',
  },
  {
    pattern: 'add to all',
    triggers: ['batch-operation', 'multi-track'],
    scopeHint: 'moderate',
    description: 'Adding to all tracks is a batch operation',
  },
  {
    pattern: 'flatten',
    triggers: ['destructive-action', 'irreversible'],
    scopeHint: 'major',
    description: 'Flattening is typically irreversible',
  },
  {
    pattern: 'bounce',
    triggers: ['overwrite-operation'],
    scopeHint: 'moderate',
    description: 'Bouncing may overwrite existing audio',
  },
] as const;

// ----- 243: Core functions -----

/**
 * Assess the safety of a proposed action.
 */
export function assessSafety(
  actionDescription: string,
  affectedEntities: readonly string[],
  intentClarity: number,
): SafetyAssessment {
  const lowerAction = actionDescription.toLowerCase();
  const matchedTriggers: SafetyTrigger[] = [];
  let maxScopeHint: ChangeScope = 'minimal';

  for (const pattern of SAFETY_PATTERNS) {
    if (lowerAction.includes(pattern.pattern.toLowerCase())) {
      for (const trigger of pattern.triggers) {
        if (!matchedTriggers.includes(trigger)) {
          matchedTriggers.push(trigger);
        }
      }
      if (SCOPE_SCORES[pattern.scopeHint] > SCOPE_SCORES[maxScopeHint]) {
        maxScopeHint = pattern.scopeHint;
      }
    }
  }

  // Entity count affects scope
  if (affectedEntities.length > 10) {
    if (!matchedTriggers.includes('batch-operation')) {
      matchedTriggers.push('batch-operation');
    }
    if (SCOPE_SCORES[maxScopeHint] < SCOPE_SCORES['significant']) {
      maxScopeHint = 'significant';
    }
  }

  // Vague intent
  if (intentClarity < 0.3) {
    if (!matchedTriggers.includes('vague-intent')) {
      matchedTriggers.push('vague-intent');
    }
  }

  // Compute risk score
  let riskScore = 0;
  for (const trigger of matchedTriggers) {
    riskScore += TRIGGER_RISK_SCORES[trigger];
  }
  // Scale by entity count
  riskScore += Math.min(affectedEntities.length * 0.5, 5);
  // Scale down by intent clarity
  riskScore *= (1.5 - intentClarity);

  const recommendation = riskScore >= _currentSafetyPolicy.riskThresholdForRefusal
    ? 'refuse'
    : riskScore >= _currentSafetyPolicy.riskThresholdForClarification
      ? 'clarify'
      : SCOPE_SCORES[maxScopeHint] > SCOPE_SCORES[_currentSafetyPolicy.autoExecuteMaxScope]
        ? 'summarize'
        : 'proceed';

  const triggerDescriptions = matchedTriggers.map((t) =>
    t.split('-').join(' '),
  );
  const description = matchedTriggers.length > 0
    ? `Safety concerns: ${triggerDescriptions.join(', ')}. Risk score: ${riskScore.toFixed(1)}`
    : `No safety concerns detected. Risk score: ${riskScore.toFixed(1)}`;

  return {
    id: generateSafetyId(),
    changeScope: maxScopeHint,
    riskScore,
    triggers: matchedTriggers,
    description,
    recommendation,
    affectedEntities,
    estimatedImpact: `${affectedEntities.length} entities affected, scope: ${maxScopeHint}`,
    timestamp: Date.now(),
  };
}

/**
 * Should we defer (ask) instead of executing?
 */
export function shouldDefer(assessment: SafetyAssessment): boolean {
  return assessment.recommendation === 'clarify' || assessment.recommendation === 'refuse';
}

/**
 * Get the change scope for a set of triggers.
 */
export function getChangeScope(triggers: readonly SafetyTrigger[]): ChangeScope {
  let maxScore = 0;
  for (const trigger of triggers) {
    const score = TRIGGER_RISK_SCORES[trigger];
    if (score > maxScore) {
      maxScore = score;
    }
  }
  if (maxScore >= 8) return 'destructive';
  if (maxScore >= 6) return 'major';
  if (maxScore >= 4) return 'significant';
  if (maxScore >= 2) return 'moderate';
  return 'minimal';
}

/**
 * Compute a numeric risk score from triggers and context.
 */
export function computeRiskScore(
  triggers: readonly SafetyTrigger[],
  entityCount: number,
  intentClarity: number,
): number {
  let score = 0;
  for (const trigger of triggers) {
    score += TRIGGER_RISK_SCORES[trigger];
  }
  score += Math.min(entityCount * 0.5, 5);
  score *= (1.5 - Math.max(0, Math.min(1, intentClarity)));
  return Math.round(score * 10) / 10;
}

/**
 * Format a safety assessment for display.
 */
export function formatSafetyAssessment(assessment: SafetyAssessment): string {
  const lines: string[] = [];
  lines.push(`Safety Assessment [${assessment.id}]`);
  lines.push(`  Scope: ${assessment.changeScope}`);
  lines.push(`  Risk Score: ${assessment.riskScore.toFixed(1)}`);
  lines.push(`  Recommendation: ${assessment.recommendation}`);
  if (assessment.triggers.length > 0) {
    lines.push(`  Triggers: ${assessment.triggers.join(', ')}`);
  }
  lines.push(`  Impact: ${assessment.estimatedImpact}`);
  lines.push(`  ${assessment.description}`);
  return lines.join('\n');
}

/**
 * Get the current safety policy.
 */
export function getSafetyPolicy(): SafetyPolicy {
  return _currentSafetyPolicy;
}

/**
 * Set the safety policy.
 */
export function setSafetyPolicy(policy: SafetyPolicy): void {
  _currentSafetyPolicy = policy;
}

/**
 * Get a deference decision with suggested question.
 */
export function getDeferenceDecision(
  actionDescription: string,
  affectedEntities: readonly string[],
  intentClarity: number,
): DeferenceDecision {
  const assessment = assessSafety(actionDescription, affectedEntities, intentClarity);
  const defer = shouldDefer(assessment);

  let suggestedQuestion: string | null = null;
  const alternatives: string[] = [];

  if (defer) {
    if (assessment.recommendation === 'refuse') {
      suggestedQuestion =
        `This would affect ${affectedEntities.length} entities with a destructive scope. ` +
        `Can you be more specific about what you'd like to change?`;
    } else {
      suggestedQuestion =
        `This would make ${assessment.changeScope} changes to ${affectedEntities.length} entities. ` +
        `Would you like to proceed, or would you prefer to narrow the scope?`;
      alternatives.push('Narrow scope to current selection');
      alternatives.push('Apply to selected track only');
      alternatives.push('Preview changes first');
    }
  }

  const decision: DeferenceDecision = {
    shouldDefer: defer,
    reason: defer
      ? `Risk score ${assessment.riskScore.toFixed(1)} exceeds threshold`
      : 'Risk score within acceptable range',
    assessment,
    suggestedQuestion,
    alternatives,
  };

  _safetyHistory.push({
    assessment,
    decision,
    overridden: false,
    timestamp: Date.now(),
  });

  return decision;
}

/**
 * Batch assess safety for multiple actions.
 */
export function batchAssessSafety(
  actions: readonly { description: string; entities: readonly string[]; clarity: number }[],
): readonly SafetyAssessment[] {
  const results: SafetyAssessment[] = [];
  for (const action of actions) {
    results.push(assessSafety(action.description, action.entities, action.clarity));
  }
  return results;
}

/**
 * Get safety assessment history.
 */
export function getSafetyHistory(): readonly SafetyHistoryEntry[] {
  return [..._safetyHistory];
}


// ============================================================================
// Step 244 [Prag] — Confidence as Internal Measure
// ============================================================================

/**
 * Factors that contribute to confidence computation.
 */
export interface ConfidenceFactors {
  readonly ambiguityCount: number;
  readonly holeCount: number;
  readonly resolvedBindings: number;
  readonly userConfirmations: number;
  readonly hedgeModifiers: number;
  readonly contextStrength: number;
  readonly preferenceCoverage: number;
  readonly discourseCueCount: number;
  readonly entityResolutionRate: number;
  readonly constraintSatisfaction: number;
}

/**
 * Breakdown of how each factor contributed to the final confidence.
 */
export interface ConfidenceBreakdown {
  readonly factor: string;
  readonly rawValue: number;
  readonly weight: number;
  readonly contribution: number;
  readonly direction: 'positive' | 'negative';
  readonly description: string;
}

/**
 * The confidence model: a deterministic score derived from factors.
 */
export interface ConfidenceModel {
  readonly score: number;
  readonly level: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  readonly factors: ConfidenceFactors;
  readonly breakdown: readonly ConfidenceBreakdown[];
  readonly suggestions: readonly string[];
  readonly timestamp: number;
}

/**
 * Thresholds for confidence-driven actions.
 */
export interface ConfidenceThreshold {
  readonly veryLow: number;
  readonly low: number;
  readonly medium: number;
  readonly high: number;
  readonly veryHigh: number;
}

/**
 * Configuration for confidence computation.
 */
export interface ConfidenceConfig {
  readonly thresholds: ConfidenceThreshold;
  readonly weights: ConfidenceWeights;
  readonly maxScore: number;
  readonly minScore: number;
  readonly recordHistory: boolean;
  readonly historyLimit: number;
}

/**
 * Weights for each confidence factor.
 */
export interface ConfidenceWeights {
  readonly ambiguityPenalty: number;
  readonly holePenalty: number;
  readonly resolvedBonus: number;
  readonly confirmationBonus: number;
  readonly hedgePenalty: number;
  readonly contextBonus: number;
  readonly preferenceBonus: number;
  readonly discourseCueBonus: number;
  readonly entityResolutionBonus: number;
  readonly constraintBonus: number;
}

/**
 * History of confidence computations.
 */
export interface ConfidenceHistoryEntry {
  readonly model: ConfidenceModel;
  readonly utterance: string;
  readonly timestamp: number;
}

// ----- 244: Default weights and thresholds -----

const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  ambiguityPenalty: -15,
  holePenalty: -20,
  resolvedBonus: 10,
  confirmationBonus: 15,
  hedgePenalty: -8,
  contextBonus: 12,
  preferenceBonus: 5,
  discourseCueBonus: 3,
  entityResolutionBonus: 8,
  constraintBonus: 6,
};

const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThreshold = {
  veryLow: 20,
  low: 40,
  medium: 60,
  high: 80,
  veryHigh: 95,
};

const DEFAULT_CONFIDENCE_CONFIG: ConfidenceConfig = {
  thresholds: DEFAULT_CONFIDENCE_THRESHOLDS,
  weights: DEFAULT_CONFIDENCE_WEIGHTS,
  maxScore: 100,
  minScore: 0,
  recordHistory: true,
  historyLimit: 100,
};

let _confidenceThresholds: ConfidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLDS;
const _confidenceHistory: ConfidenceHistoryEntry[] = [];

// ----- 244: Helper -----

function clampScore(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value * 100) / 100;
}

function getConfidenceLevel(
  score: number,
  thresholds: ConfidenceThreshold,
): 'very-low' | 'low' | 'medium' | 'high' | 'very-high' {
  if (score >= thresholds.veryHigh) return 'very-high';
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  if (score >= thresholds.low) return 'low';
  return 'very-low';
}

// ----- 244: Core functions -----

/**
 * Compute confidence from factors (deterministic, not probabilistic).
 */
export function computeConfidence(
  factors: ConfidenceFactors,
  config?: Partial<ConfidenceConfig>,
): ConfidenceModel {
  const cfg: ConfidenceConfig = {
    ...DEFAULT_CONFIDENCE_CONFIG,
    ...(config !== undefined ? config : {}),
  };
  const w = cfg.weights;
  const baseScore = 50; // Start at midpoint

  const breakdowns: ConfidenceBreakdown[] = [];

  // Ambiguity count: negative
  const ambiguityContrib = factors.ambiguityCount * w.ambiguityPenalty;
  breakdowns.push({
    factor: 'ambiguityCount',
    rawValue: factors.ambiguityCount,
    weight: w.ambiguityPenalty,
    contribution: ambiguityContrib,
    direction: 'negative',
    description: `${factors.ambiguityCount} ambiguities detected (${ambiguityContrib.toFixed(1)} impact)`,
  });

  // Hole count: negative
  const holeContrib = factors.holeCount * w.holePenalty;
  breakdowns.push({
    factor: 'holeCount',
    rawValue: factors.holeCount,
    weight: w.holePenalty,
    contribution: holeContrib,
    direction: 'negative',
    description: `${factors.holeCount} unresolved holes (${holeContrib.toFixed(1)} impact)`,
  });

  // Resolved bindings: positive
  const resolvedContrib = factors.resolvedBindings * w.resolvedBonus;
  breakdowns.push({
    factor: 'resolvedBindings',
    rawValue: factors.resolvedBindings,
    weight: w.resolvedBonus,
    contribution: resolvedContrib,
    direction: 'positive',
    description: `${factors.resolvedBindings} resolved bindings (+${resolvedContrib.toFixed(1)})`,
  });

  // User confirmations: positive
  const confirmContrib = factors.userConfirmations * w.confirmationBonus;
  breakdowns.push({
    factor: 'userConfirmations',
    rawValue: factors.userConfirmations,
    weight: w.confirmationBonus,
    contribution: confirmContrib,
    direction: 'positive',
    description: `${factors.userConfirmations} user confirmations (+${confirmContrib.toFixed(1)})`,
  });

  // Hedge modifiers: negative
  const hedgeContrib = factors.hedgeModifiers * w.hedgePenalty;
  breakdowns.push({
    factor: 'hedgeModifiers',
    rawValue: factors.hedgeModifiers,
    weight: w.hedgePenalty,
    contribution: hedgeContrib,
    direction: 'negative',
    description: `${factors.hedgeModifiers} hedge words (${hedgeContrib.toFixed(1)} impact)`,
  });

  // Context strength: positive (scaled 0-1)
  const contextContrib = factors.contextStrength * w.contextBonus;
  breakdowns.push({
    factor: 'contextStrength',
    rawValue: factors.contextStrength,
    weight: w.contextBonus,
    contribution: contextContrib,
    direction: 'positive',
    description: `Context strength ${(factors.contextStrength * 100).toFixed(0)}% (+${contextContrib.toFixed(1)})`,
  });

  // Preference coverage: positive (scaled 0-1)
  const prefContrib = factors.preferenceCoverage * w.preferenceBonus;
  breakdowns.push({
    factor: 'preferenceCoverage',
    rawValue: factors.preferenceCoverage,
    weight: w.preferenceBonus,
    contribution: prefContrib,
    direction: 'positive',
    description: `Preference coverage ${(factors.preferenceCoverage * 100).toFixed(0)}% (+${prefContrib.toFixed(1)})`,
  });

  // Discourse cue count: positive (weak)
  const discourseContrib = factors.discourseCueCount * w.discourseCueBonus;
  breakdowns.push({
    factor: 'discourseCueCount',
    rawValue: factors.discourseCueCount,
    weight: w.discourseCueBonus,
    contribution: discourseContrib,
    direction: 'positive',
    description: `${factors.discourseCueCount} discourse cues (+${discourseContrib.toFixed(1)})`,
  });

  // Entity resolution rate: positive (scaled 0-1)
  const entityContrib = factors.entityResolutionRate * w.entityResolutionBonus;
  breakdowns.push({
    factor: 'entityResolutionRate',
    rawValue: factors.entityResolutionRate,
    weight: w.entityResolutionBonus,
    contribution: entityContrib,
    direction: 'positive',
    description: `Entity resolution rate ${(factors.entityResolutionRate * 100).toFixed(0)}% (+${entityContrib.toFixed(1)})`,
  });

  // Constraint satisfaction: positive (scaled 0-1)
  const constraintContrib = factors.constraintSatisfaction * w.constraintBonus;
  breakdowns.push({
    factor: 'constraintSatisfaction',
    rawValue: factors.constraintSatisfaction,
    weight: w.constraintBonus,
    contribution: constraintContrib,
    direction: 'positive',
    description: `Constraint satisfaction ${(factors.constraintSatisfaction * 100).toFixed(0)}% (+${constraintContrib.toFixed(1)})`,
  });

  // Sum all contributions
  const totalContribution =
    ambiguityContrib +
    holeContrib +
    resolvedContrib +
    confirmContrib +
    hedgeContrib +
    contextContrib +
    prefContrib +
    discourseContrib +
    entityContrib +
    constraintContrib;

  const rawScore = baseScore + totalContribution;
  const finalScore = clampScore(rawScore, cfg.minScore, cfg.maxScore);
  const level = getConfidenceLevel(finalScore, cfg.thresholds);

  // Generate suggestions for improvement
  const suggestions: string[] = [];
  if (factors.ambiguityCount > 0) {
    suggestions.push(`Resolve ${factors.ambiguityCount} ambiguities to improve confidence`);
  }
  if (factors.holeCount > 0) {
    suggestions.push(`Fill ${factors.holeCount} underspecified parameters`);
  }
  if (factors.hedgeModifiers > 0) {
    suggestions.push('Use more definite language to reduce uncertainty');
  }
  if (factors.contextStrength < 0.5) {
    suggestions.push('Provide more context for better understanding');
  }
  if (factors.entityResolutionRate < 0.7) {
    suggestions.push('Clarify which entities you are referring to');
  }
  if (factors.preferenceCoverage < 0.5) {
    suggestions.push('Specify more preferences for clearer intent');
  }
  if (factors.userConfirmations === 0 && finalScore < cfg.thresholds.high) {
    suggestions.push('Confirm key assumptions to boost confidence');
  }

  return {
    score: finalScore,
    level,
    factors,
    breakdown: breakdowns,
    suggestions,
    timestamp: Date.now(),
  };
}

/**
 * Get the factors used in confidence computation.
 */
export function getConfidenceFactors(
  ambiguityCount: number,
  holeCount: number,
  resolvedBindings: number,
  userConfirmations: number,
  hedgeModifiers: number,
  contextStrength: number,
  preferenceCoverage: number,
): ConfidenceFactors {
  return {
    ambiguityCount,
    holeCount,
    resolvedBindings,
    userConfirmations,
    hedgeModifiers,
    contextStrength: Math.max(0, Math.min(1, contextStrength)),
    preferenceCoverage: Math.max(0, Math.min(1, preferenceCoverage)),
    discourseCueCount: 0,
    entityResolutionRate: resolvedBindings > 0
      ? resolvedBindings / (resolvedBindings + holeCount)
      : 0,
    constraintSatisfaction: 0,
  };
}

/**
 * Get a human-readable confidence breakdown.
 */
export function getConfidenceBreakdown(model: ConfidenceModel): string {
  const lines: string[] = [];
  lines.push(`Confidence: ${model.score.toFixed(1)}% (${model.level})`);
  lines.push('Breakdown:');
  for (const b of model.breakdown) {
    const sign = b.direction === 'positive' ? '+' : '';
    lines.push(`  ${b.factor}: ${sign}${b.contribution.toFixed(1)} — ${b.description}`);
  }
  if (model.suggestions.length > 0) {
    lines.push('Suggestions:');
    for (const s of model.suggestions) {
      lines.push(`  - ${s}`);
    }
  }
  return lines.join('\n');
}

/**
 * Check if the confidence meets a given threshold level.
 */
export function meetsThreshold(
  model: ConfidenceModel,
  requiredLevel: 'very-low' | 'low' | 'medium' | 'high' | 'very-high',
): boolean {
  const levelOrder: Record<string, number> = {
    'very-low': 0,
    'low': 1,
    'medium': 2,
    'high': 3,
    'very-high': 4,
  };
  const currentRank = levelOrder[model.level] ?? 0;
  const requiredRank = levelOrder[requiredLevel] ?? 0;
  return currentRank >= requiredRank;
}

/**
 * Format a confidence report for display.
 */
export function formatConfidenceReport(model: ConfidenceModel): string {
  const header = `=== Confidence Report ===`;
  const scoreStr = `Score: ${model.score.toFixed(1)}% (${model.level.toUpperCase()})`;
  const action = model.level === 'very-high' || model.level === 'high'
    ? 'Action: Proceed automatically'
    : model.level === 'medium'
      ? 'Action: Show summary before proceeding'
      : model.level === 'low'
        ? 'Action: Require clarification'
        : 'Action: Refuse until clarified';
  const breakdown = getConfidenceBreakdown(model);
  return `${header}\n${scoreStr}\n${action}\n\n${breakdown}`;
}

/**
 * Set confidence thresholds.
 */
export function setConfidenceThresholds(thresholds: ConfidenceThreshold): void {
  _confidenceThresholds = thresholds;
}

/**
 * Get confidence computation history.
 */
export function getConfidenceHistory(): readonly ConfidenceHistoryEntry[] {
  return [..._confidenceHistory];
}

/**
 * Compute factor contributions as a map.
 */
export function computeFactorContributions(
  factors: ConfidenceFactors,
  config?: Partial<ConfidenceConfig>,
): ReadonlyMap<string, number> {
  const model = computeConfidence(factors, config);
  const map = new Map<string, number>();
  for (const b of model.breakdown) {
    map.set(b.factor, b.contribution);
  }
  return map;
}

/**
 * Suggest improvements to boost confidence.
 */
export function suggestImprovements(model: ConfidenceModel): readonly string[] {
  return model.suggestions;
}

/**
 * Batch compute confidence for multiple inputs.
 */
export function batchComputeConfidence(
  factorsList: readonly ConfidenceFactors[],
  config?: Partial<ConfidenceConfig>,
): readonly ConfidenceModel[] {
  const results: ConfidenceModel[] = [];
  for (const factors of factorsList) {
    const model = computeConfidence(factors, config);
    results.push(model);
    if (DEFAULT_CONFIDENCE_CONFIG.recordHistory) {
      _confidenceHistory.push({
        model,
        utterance: '',
        timestamp: Date.now(),
      });
    }
  }
  return results;
}

/**
 * Get the currently active confidence thresholds.
 */
export function getActiveConfidenceThresholds(): ConfidenceThreshold {
  return _confidenceThresholds;
}


// ============================================================================
// Step 245 [Prag] — Explainable Resolution
// ============================================================================

/**
 * Reason categories for resolution explanations.
 */
export type ExplanationReason =
  | 'recency'
  | 'frequency'
  | 'ui-focus'
  | 'grammatical-role'
  | 'semantic-compatibility'
  | 'topic-continuity'
  | 'contrastive-focus'
  | 'explicit-mention'
  | 'common-ground'
  | 'default-assumption';

/**
 * An explanation of how a pronoun or reference was resolved.
 */
export interface ResolutionExplanation {
  readonly id: string;
  readonly pronoun: string;
  readonly resolvedTo: string;
  readonly reason: ExplanationReason;
  readonly explanation: string;
  readonly confidence: number;
  readonly alternatives: readonly AlternativeResolution[];
  readonly timestamp: number;
}

/**
 * An alternative resolution that was considered.
 */
export interface AlternativeResolution {
  readonly candidate: string;
  readonly reason: ExplanationReason;
  readonly score: number;
  readonly whyNotChosen: string;
}

/**
 * Configuration for explanation verbosity.
 */
export interface ExplanationConfig {
  readonly verbosity: 'minimal' | 'normal' | 'verbose' | 'debug';
  readonly includeAlternatives: boolean;
  readonly maxAlternatives: number;
  readonly includeScores: boolean;
  readonly logEnabled: boolean;
  readonly logLimit: number;
}

/**
 * A log of all explanations generated in a session.
 */
export interface ExplanationLog {
  readonly entries: readonly ResolutionExplanation[];
  readonly totalResolutions: number;
  readonly reasonDistribution: ReadonlyMap<ExplanationReason, number>;
  readonly averageConfidence: number;
}

/**
 * Summary of explanations.
 */
export interface ExplanationSummary {
  readonly totalExplanations: number;
  readonly topReasons: readonly { reason: ExplanationReason; count: number }[];
  readonly averageConfidence: number;
  readonly lowestConfidence: number;
  readonly highestConfidence: number;
  readonly unresolvedCount: number;
}

// ----- 245: Templates (30+) -----

interface ExplanationTemplate {
  readonly reason: ExplanationReason;
  readonly template: string;
  readonly description: string;
}

const EXPLANATION_TEMPLATES: readonly ExplanationTemplate[] = [
  // Recency templates
  {
    reason: 'recency',
    template: 'Resolved "$pronoun" to $target because it was the most recently mentioned entity',
    description: 'Most recent mention in discourse',
  },
  {
    reason: 'recency',
    template: 'Interpreted "$pronoun" as $target since it was just discussed',
    description: 'Just discussed entity',
  },
  {
    reason: 'recency',
    template: '"$pronoun" refers to $target — the last item you mentioned',
    description: 'Last mentioned item',
  },
  // Frequency templates
  {
    reason: 'frequency',
    template: 'Resolved "$pronoun" to $target because it is the most frequently referenced entity',
    description: 'Most frequently mentioned',
  },
  {
    reason: 'frequency',
    template: '"$pronoun" most likely refers to $target — you\'ve mentioned it $count times',
    description: 'High mention count',
  },
  {
    reason: 'frequency',
    template: 'Interpreted "$pronoun" as $target because it dominates the current discourse',
    description: 'Dominant topic',
  },
  // UI focus templates
  {
    reason: 'ui-focus',
    template: 'Resolved "$pronoun" to $target because that\'s your current selection',
    description: 'Current UI selection',
  },
  {
    reason: 'ui-focus',
    template: '"$pronoun" refers to $target — the item currently highlighted in the editor',
    description: 'Editor highlight',
  },
  {
    reason: 'ui-focus',
    template: 'Interpreted "$pronoun" as $target since it has UI focus',
    description: 'UI focus target',
  },
  // Grammatical role templates
  {
    reason: 'grammatical-role',
    template: 'Resolved "$pronoun" to $target because it matches the grammatical subject',
    description: 'Grammatical subject match',
  },
  {
    reason: 'grammatical-role',
    template: '"$pronoun" refers to $target — it fills the expected grammatical role',
    description: 'Expected grammatical role',
  },
  {
    reason: 'grammatical-role',
    template: 'Interpreted "$pronoun" as $target based on syntactic position',
    description: 'Syntactic position',
  },
  // Semantic compatibility templates
  {
    reason: 'semantic-compatibility',
    template: 'Resolved "$pronoun" to $target because it is semantically compatible with the predicate',
    description: 'Predicate compatibility',
  },
  {
    reason: 'semantic-compatibility',
    template: '"$pronoun" refers to $target — only it can be "$predicate"',
    description: 'Selectional restriction match',
  },
  {
    reason: 'semantic-compatibility',
    template: 'Interpreted "$pronoun" as $target because the action requires that type of entity',
    description: 'Type requirement match',
  },
  // Topic continuity templates
  {
    reason: 'topic-continuity',
    template: 'Resolved "$pronoun" to $target because it continues the current topic',
    description: 'Topic continuation',
  },
  {
    reason: 'topic-continuity',
    template: '"$pronoun" refers to $target — maintaining the ongoing discussion topic',
    description: 'Ongoing topic',
  },
  {
    reason: 'topic-continuity',
    template: 'Interpreted "$pronoun" as $target to preserve discourse coherence',
    description: 'Discourse coherence',
  },
  // Contrastive focus templates
  {
    reason: 'contrastive-focus',
    template: 'Resolved "$pronoun" to $target because the contrast implies a different entity than $contrast',
    description: 'Contrastive implication',
  },
  {
    reason: 'contrastive-focus',
    template: '"$pronoun" refers to $target — distinguished from $contrast by the contrastive cue',
    description: 'Contrastive distinction',
  },
  {
    reason: 'contrastive-focus',
    template: 'Interpreted "$pronoun" as $target because "$cue" signals a contrast',
    description: 'Contrastive cue signal',
  },
  // Explicit mention templates
  {
    reason: 'explicit-mention',
    template: 'Resolved "$pronoun" to $target because it was explicitly named in the utterance',
    description: 'Explicit naming',
  },
  {
    reason: 'explicit-mention',
    template: '"$pronoun" refers to $target — you mentioned it by name',
    description: 'Named reference',
  },
  {
    reason: 'explicit-mention',
    template: 'Interpreted "$pronoun" as $target because it was directly specified',
    description: 'Direct specification',
  },
  // Common ground templates
  {
    reason: 'common-ground',
    template: 'Resolved "$pronoun" to $target because it\'s established in our shared context',
    description: 'Shared context',
  },
  {
    reason: 'common-ground',
    template: '"$pronoun" refers to $target — a commonly understood reference in this project',
    description: 'Project reference',
  },
  {
    reason: 'common-ground',
    template: 'Interpreted "$pronoun" as $target based on previously established understanding',
    description: 'Established understanding',
  },
  // Default assumption templates
  {
    reason: 'default-assumption',
    template: 'Resolved "$pronoun" to $target as a default assumption (no better candidate available)',
    description: 'Default fallback',
  },
  {
    reason: 'default-assumption',
    template: '"$pronoun" defaults to $target — please clarify if you meant something else',
    description: 'Clarification request',
  },
  {
    reason: 'default-assumption',
    template: 'Interpreted "$pronoun" as $target by convention when no specific referent is clear',
    description: 'Convention-based default',
  },
  {
    reason: 'default-assumption',
    template: 'Assuming "$pronoun" refers to $target — the most common referent in this context',
    description: 'Common referent assumption',
  },
] as const;

// ----- 245: State -----

let _explanationConfig: ExplanationConfig = {
  verbosity: 'normal',
  includeAlternatives: true,
  maxAlternatives: 3,
  includeScores: false,
  logEnabled: true,
  logLimit: 200,
};

const _explanationLogEntries: ResolutionExplanation[] = [];
let _explanationCounter = 0;

function generateExplanationId(): string {
  _explanationCounter += 1;
  return `re-${_explanationCounter}-${Date.now()}`;
}

// ----- 245: Template interpolation helper -----

function interpolateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`$${key}`).join(value);
  }
  return result;
}

// ----- 245: Find best template for a reason -----

function findTemplateForReason(
  reason: ExplanationReason,
  _templateIndex: number,
): ExplanationTemplate | null {
  const matching = EXPLANATION_TEMPLATES.filter((t) => t.reason === reason);
  if (matching.length === 0) return null;
  const idx = _templateIndex % matching.length;
  const found = matching[idx];
  return found !== undefined ? found : null;
}

// ----- 245: Core functions -----

/**
 * Generate an explanation for a pronoun resolution.
 */
export function explainResolution(
  pronoun: string,
  resolvedTo: string,
  reason: ExplanationReason,
  confidence: number,
  alternatives?: readonly AlternativeResolution[],
  templateIndex?: number,
): ResolutionExplanation {
  const tIdx = templateIndex !== undefined ? templateIndex : 0;
  const template = findTemplateForReason(reason, tIdx);

  const vars: Record<string, string> = {
    pronoun,
    target: resolvedTo,
    count: '0',
    predicate: '',
    contrast: '',
    cue: '',
  };

  const explanationText = template !== null
    ? interpolateTemplate(template.template, vars)
    : `Resolved "${pronoun}" to ${resolvedTo} via ${reason}`;

  const alts: readonly AlternativeResolution[] =
    alternatives !== undefined ? alternatives : [];

  const explanation: ResolutionExplanation = {
    id: generateExplanationId(),
    pronoun,
    resolvedTo,
    reason,
    explanation: explanationText,
    confidence: Math.max(0, Math.min(1, confidence)),
    alternatives: alts.slice(0, _explanationConfig.maxAlternatives),
    timestamp: Date.now(),
  };

  if (_explanationConfig.logEnabled) {
    _explanationLogEntries.push(explanation);
    while (_explanationLogEntries.length > _explanationConfig.logLimit) {
      _explanationLogEntries.shift();
    }
  }

  return explanation;
}

/**
 * Get the resolution reason for a given context.
 */
export function getResolutionReason(
  pronoun: string,
  candidates: readonly { entity: string; score: number; reason: ExplanationReason }[],
): ExplanationReason {
  if (candidates.length === 0) return 'default-assumption';

  let bestScore = -Infinity;
  let bestReason: ExplanationReason = 'default-assumption';

  for (const c of candidates) {
    if (c.score > bestScore) {
      bestScore = c.score;
      bestReason = c.reason;
    }
  }

  // Unused pronoun suppressed
  void pronoun;

  return bestReason;
}

/**
 * Format an explanation for display.
 */
export function formatExplanation(explanation: ResolutionExplanation): string {
  const lines: string[] = [];
  lines.push(explanation.explanation);

  if (_explanationConfig.includeScores) {
    lines.push(`  Confidence: ${(explanation.confidence * 100).toFixed(0)}%`);
  }

  if (_explanationConfig.includeAlternatives && explanation.alternatives.length > 0) {
    lines.push('  Other candidates:');
    for (const alt of explanation.alternatives) {
      lines.push(`    - ${alt.candidate} (${alt.reason}, score=${alt.score.toFixed(2)}): ${alt.whyNotChosen}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get the explanation log.
 */
export function getExplanationLog(): ExplanationLog {
  const distribution = new Map<ExplanationReason, number>();
  let totalConfidence = 0;

  for (const entry of _explanationLogEntries) {
    const prev = distribution.get(entry.reason);
    distribution.set(entry.reason, (prev !== undefined ? prev : 0) + 1);
    totalConfidence += entry.confidence;
  }

  return {
    entries: [..._explanationLogEntries],
    totalResolutions: _explanationLogEntries.length,
    reasonDistribution: distribution,
    averageConfidence: _explanationLogEntries.length > 0
      ? totalConfidence / _explanationLogEntries.length
      : 0,
  };
}

/**
 * Clear the explanation log.
 */
export function clearExplanationLog(): void {
  _explanationLogEntries.length = 0;
}

/**
 * Set explanation verbosity.
 */
export function setExplanationVerbosity(
  verbosity: 'minimal' | 'normal' | 'verbose' | 'debug',
): void {
  _explanationConfig = {
    ..._explanationConfig,
    verbosity,
    includeAlternatives: verbosity === 'verbose' || verbosity === 'debug',
    includeScores: verbosity === 'debug',
  };
}

/**
 * Batch explain resolutions.
 */
export function batchExplainResolutions(
  resolutions: readonly {
    pronoun: string;
    resolvedTo: string;
    reason: ExplanationReason;
    confidence: number;
  }[],
): readonly ResolutionExplanation[] {
  const results: ResolutionExplanation[] = [];
  for (let i = 0; i < resolutions.length; i++) {
    const r = resolutions[i];
    if (r !== undefined) {
      results.push(explainResolution(r.pronoun, r.resolvedTo, r.reason, r.confidence, undefined, i));
    }
  }
  return results;
}

/**
 * Summarize all explanations in the log.
 */
export function summarizeExplanations(): ExplanationSummary {
  const log = getExplanationLog();
  const reasonCounts = new Map<ExplanationReason, number>();

  let lowestConf = 1;
  let highestConf = 0;
  let totalConf = 0;
  let unresolvedCount = 0;

  for (const entry of log.entries) {
    const prev = reasonCounts.get(entry.reason);
    reasonCounts.set(entry.reason, (prev !== undefined ? prev : 0) + 1);
    if (entry.confidence < lowestConf) lowestConf = entry.confidence;
    if (entry.confidence > highestConf) highestConf = entry.confidence;
    totalConf += entry.confidence;
    if (entry.reason === 'default-assumption') unresolvedCount += 1;
  }

  const topReasons: { reason: ExplanationReason; count: number }[] = [];
  for (const [reason, count] of Array.from(reasonCounts.entries())) {
    topReasons.push({ reason, count });
  }
  topReasons.sort((a, b) => b.count - a.count);

  return {
    totalExplanations: log.entries.length,
    topReasons: topReasons.slice(0, 5),
    averageConfidence: log.entries.length > 0 ? totalConf / log.entries.length : 0,
    lowestConfidence: log.entries.length > 0 ? lowestConf : 0,
    highestConfidence: highestConf,
    unresolvedCount,
  };
}

/**
 * Export the explanation log as a formatted string.
 */
export function exportExplanationLog(): string {
  const log = getExplanationLog();
  const lines: string[] = [];
  lines.push(`=== Explanation Log (${log.totalResolutions} entries) ===`);
  lines.push(`Average confidence: ${(log.averageConfidence * 100).toFixed(1)}%`);
  lines.push('');

  for (const entry of log.entries) {
    lines.push(`[${entry.id}] "${entry.pronoun}" -> ${entry.resolvedTo}`);
    lines.push(`  Reason: ${entry.reason}`);
    lines.push(`  ${entry.explanation}`);
    lines.push(`  Confidence: ${(entry.confidence * 100).toFixed(0)}%`);
    if (entry.alternatives.length > 0) {
      lines.push(`  Alternatives: ${entry.alternatives.map((a) => a.candidate).join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get available explanation templates.
 */
export function getExplanationTemplates(): readonly ExplanationTemplate[] {
  return EXPLANATION_TEMPLATES;
}


// ============================================================================
// Step 246 [HCI] — "Why This Question?" Affordance
// ============================================================================

/**
 * A competing meaning for a clarification question.
 */
export interface CompetingMeaning {
  readonly id: string;
  readonly interpretation: string;
  readonly description: string;
  readonly editSummary: string;
  readonly affectedEntities: readonly string[];
  readonly confidence: number;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly examples: readonly string[];
}

/**
 * The difference between two competing meanings.
 */
export interface MeaningDiff {
  readonly meaningA: string;
  readonly meaningB: string;
  readonly differenceDescription: string;
  readonly affectedEntityDiffs: readonly string[];
  readonly impactComparison: string;
  readonly riskDifference: string;
}

/**
 * Explanation of why a particular clarification question was asked.
 */
export interface WhyThisQuestion {
  readonly questionId: string;
  readonly question: string;
  readonly reason: string;
  readonly competingMeanings: readonly CompetingMeaning[];
  readonly diffs: readonly MeaningDiff[];
  readonly timestamp: number;
}

/**
 * Configuration for "why this question?" generation.
 */
export interface WhyConfig {
  readonly maxCompetingMeanings: number;
  readonly showDiffs: boolean;
  readonly showRiskLevels: boolean;
  readonly showExamples: boolean;
  readonly verbosity: 'brief' | 'normal' | 'detailed';
  readonly maxDiffs: number;
}

/**
 * Detailed explanation for UI display.
 */
export interface WhyExplanation {
  readonly title: string;
  readonly body: string;
  readonly sections: readonly WhyExplanationSection[];
  readonly timestamp: number;
}

/**
 * A section of a why-explanation.
 */
export interface WhyExplanationSection {
  readonly heading: string;
  readonly content: string;
  readonly type: 'meaning' | 'diff' | 'summary' | 'risk';
}

// ----- 246: Why-explanation templates (15+) -----

interface WhyTemplate {
  readonly id: string;
  readonly pattern: string;
  readonly template: string;
  readonly category: 'ambiguity' | 'scope' | 'target' | 'action' | 'amount' | 'timing' | 'style';
}

const WHY_TEMPLATES: readonly WhyTemplate[] = [
  {
    id: 'why-ambiguous-pronoun',
    pattern: 'ambiguous-pronoun',
    template: 'We asked because "$utterance" could refer to multiple things: $candidates. Each would produce a different result.',
    category: 'ambiguity',
  },
  {
    id: 'why-ambiguous-scope',
    pattern: 'ambiguous-scope',
    template: 'We asked because the scope is unclear. "$utterance" could apply to $scopeA or $scopeB, with different impacts.',
    category: 'scope',
  },
  {
    id: 'why-ambiguous-target',
    pattern: 'ambiguous-target',
    template: 'We asked because "$utterance" doesn\'t specify which $entityType to affect. The options are: $candidates.',
    category: 'target',
  },
  {
    id: 'why-ambiguous-action',
    pattern: 'ambiguous-action',
    template: 'We asked because "$utterance" could mean $actionA or $actionB. These produce very different edits.',
    category: 'action',
  },
  {
    id: 'why-ambiguous-amount',
    pattern: 'ambiguous-amount',
    template: 'We asked because "$utterance" doesn\'t specify how much. A little vs. a lot could change the character of the music.',
    category: 'amount',
  },
  {
    id: 'why-safety-concern',
    pattern: 'safety-concern',
    template: 'We asked because one interpretation would make $impactDescription. We want to make sure that\'s what you intended.',
    category: 'scope',
  },
  {
    id: 'why-destructive-option',
    pattern: 'destructive-option',
    template: 'We asked because one interpretation would permanently $destructiveAction. This cannot be undone easily.',
    category: 'action',
  },
  {
    id: 'why-conflicting-constraints',
    pattern: 'conflicting-constraints',
    template: 'We asked because your request implies conflicting goals: $constraintA and $constraintB cannot both be satisfied.',
    category: 'ambiguity',
  },
  {
    id: 'why-missing-timing',
    pattern: 'missing-timing',
    template: 'We asked because "$utterance" doesn\'t specify when this should happen. Starting at $timeA vs $timeB would differ.',
    category: 'timing',
  },
  {
    id: 'why-style-ambiguity',
    pattern: 'style-ambiguity',
    template: 'We asked because "$utterance" could be interpreted in multiple musical styles, each producing a distinct result.',
    category: 'style',
  },
  {
    id: 'why-multiple-tracks',
    pattern: 'multiple-tracks',
    template: 'We asked because multiple tracks match "$utterance". Applying to all vs. one would have different effects.',
    category: 'target',
  },
  {
    id: 'why-degree-unclear',
    pattern: 'degree-unclear',
    template: 'We asked because "$utterance" uses a vague degree term. "A bit" vs "a lot" would change the edit substantially.',
    category: 'amount',
  },
  {
    id: 'why-section-ambiguity',
    pattern: 'section-ambiguity',
    template: 'We asked because "$utterance" could refer to $sectionA or $sectionB of the song.',
    category: 'target',
  },
  {
    id: 'why-preservation-conflict',
    pattern: 'preservation-conflict',
    template: 'We asked because applying "$utterance" might conflict with the preservation of $preservedElement.',
    category: 'ambiguity',
  },
  {
    id: 'why-no-context',
    pattern: 'no-context',
    template: 'We asked because there isn\'t enough context to determine what "$utterance" refers to. Please specify.',
    category: 'ambiguity',
  },
  {
    id: 'why-tempo-key-interact',
    pattern: 'tempo-key-interaction',
    template: 'We asked because changing $paramA may interact with $paramB in unexpected ways.',
    category: 'action',
  },
] as const;

// ----- 246: Default config -----

const DEFAULT_WHY_CONFIG: WhyConfig = {
  maxCompetingMeanings: 5,
  showDiffs: true,
  showRiskLevels: true,
  showExamples: true,
  verbosity: 'normal',
  maxDiffs: 3,
};

let _whyMeaningCounter = 0;

function generateMeaningId(): string {
  _whyMeaningCounter += 1;
  return `cm-${_whyMeaningCounter}-${Date.now()}`;
}

// ----- 246: Core functions -----

/**
 * Generate a "why this question?" explanation.
 */
export function generateWhyExplanation(
  question: string,
  competingMeanings: readonly CompetingMeaning[],
  config?: Partial<WhyConfig>,
): WhyThisQuestion {
  const cfg: WhyConfig = {
    ...DEFAULT_WHY_CONFIG,
    ...(config !== undefined ? config : {}),
  };

  const limitedMeanings = competingMeanings.slice(0, cfg.maxCompetingMeanings);
  const diffs: MeaningDiff[] = [];

  // Compute diffs between each pair of meanings
  for (let i = 0; i < limitedMeanings.length; i++) {
    for (let j = i + 1; j < limitedMeanings.length; j++) {
      if (diffs.length >= cfg.maxDiffs) break;
      const mA = limitedMeanings[i];
      const mB = limitedMeanings[j];
      if (mA !== undefined && mB !== undefined) {
        const entityDiffs: string[] = [];
        const allEntities = new Set<string>();
        for (const e of mA.affectedEntities) allEntities.add(e);
        for (const e of mB.affectedEntities) allEntities.add(e);

        for (const entity of Array.from(allEntities)) {
          const inA = mA.affectedEntities.includes(entity);
          const inB = mB.affectedEntities.includes(entity);
          if (inA && !inB) {
            entityDiffs.push(`"${entity}" only affected by interpretation A`);
          } else if (!inA && inB) {
            entityDiffs.push(`"${entity}" only affected by interpretation B`);
          }
        }

        diffs.push({
          meaningA: mA.interpretation,
          meaningB: mB.interpretation,
          differenceDescription:
            `"${mA.interpretation}" would ${mA.editSummary}, ` +
            `while "${mB.interpretation}" would ${mB.editSummary}`,
          affectedEntityDiffs: entityDiffs,
          impactComparison:
            `Interpretation A affects ${mA.affectedEntities.length} entities; ` +
            `B affects ${mB.affectedEntities.length}`,
          riskDifference:
            mA.riskLevel === mB.riskLevel
              ? `Both are ${mA.riskLevel} risk`
              : `A is ${mA.riskLevel} risk, B is ${mB.riskLevel} risk`,
        });
      }
    }
  }

  const reasonParts: string[] = [];
  if (limitedMeanings.length >= 2) {
    reasonParts.push(
      `There are ${limitedMeanings.length} possible interpretations of your request`,
    );
  }
  const highRisk = limitedMeanings.filter((m) => m.riskLevel === 'high');
  if (highRisk.length > 0) {
    reasonParts.push(`${highRisk.length} interpretation(s) involve high-risk edits`);
  }
  const reason = reasonParts.length > 0
    ? reasonParts.join('. ') + '.'
    : 'Your request was ambiguous and we need clarification.';

  return {
    questionId: `wq-${Date.now()}`,
    question,
    reason,
    competingMeanings: limitedMeanings,
    diffs,
    timestamp: Date.now(),
  };
}

/**
 * Get competing meanings for a given utterance.
 */
export function getCompetingMeanings(
  utterance: string,
  candidates: readonly { interpretation: string; editSummary: string; entities: readonly string[]; risk: 'low' | 'medium' | 'high' }[],
): readonly CompetingMeaning[] {
  const meanings: CompetingMeaning[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c !== undefined) {
      meanings.push({
        id: generateMeaningId(),
        interpretation: c.interpretation,
        description: `Interpretation ${i + 1}: "${c.interpretation}"`,
        editSummary: c.editSummary,
        affectedEntities: c.entities,
        confidence: 1.0 / candidates.length,
        riskLevel: c.risk,
        examples: [`If you mean "${c.interpretation}", then: ${c.editSummary}`],
      });
    }
  }
  void utterance;
  return meanings;
}

/**
 * Compute diffs between two specific meanings.
 */
export function computeMeaningDiffs(
  meaningA: CompetingMeaning,
  meaningB: CompetingMeaning,
): MeaningDiff {
  const entityDiffs: string[] = [];
  const allEntities = new Set<string>();
  for (const e of meaningA.affectedEntities) allEntities.add(e);
  for (const e of meaningB.affectedEntities) allEntities.add(e);

  for (const entity of Array.from(allEntities)) {
    const inA = meaningA.affectedEntities.includes(entity);
    const inB = meaningB.affectedEntities.includes(entity);
    if (inA && !inB) {
      entityDiffs.push(`"${entity}" only in interpretation A`);
    } else if (!inA && inB) {
      entityDiffs.push(`"${entity}" only in interpretation B`);
    } else {
      entityDiffs.push(`"${entity}" affected by both`);
    }
  }

  return {
    meaningA: meaningA.interpretation,
    meaningB: meaningB.interpretation,
    differenceDescription:
      `A: ${meaningA.editSummary} vs B: ${meaningB.editSummary}`,
    affectedEntityDiffs: entityDiffs,
    impactComparison:
      `A affects ${meaningA.affectedEntities.length} entities, ` +
      `B affects ${meaningB.affectedEntities.length} entities`,
    riskDifference:
      meaningA.riskLevel === meaningB.riskLevel
        ? `Both ${meaningA.riskLevel} risk`
        : `A=${meaningA.riskLevel}, B=${meaningB.riskLevel}`,
  };
}

/**
 * Format the "why this question?" content for UI rendering.
 */
export function formatWhyForUI(why: WhyThisQuestion): WhyExplanation {
  const sections: WhyExplanationSection[] = [];

  // Summary section
  sections.push({
    heading: 'Why we asked',
    content: why.reason,
    type: 'summary',
  });

  // Meaning sections
  for (const meaning of why.competingMeanings) {
    sections.push({
      heading: `Interpretation: "${meaning.interpretation}"`,
      content:
        `${meaning.editSummary}\n` +
        `Affects: ${meaning.affectedEntities.join(', ')}\n` +
        `Risk: ${meaning.riskLevel}\n` +
        `Confidence: ${(meaning.confidence * 100).toFixed(0)}%`,
      type: 'meaning',
    });
  }

  // Diff sections
  for (const diff of why.diffs) {
    sections.push({
      heading: 'Difference',
      content:
        `${diff.differenceDescription}\n` +
        `${diff.impactComparison}\n` +
        `${diff.riskDifference}`,
      type: 'diff',
    });
  }

  // Risk section
  const highRiskMeanings = why.competingMeanings.filter((m) => m.riskLevel === 'high');
  if (highRiskMeanings.length > 0) {
    sections.push({
      heading: 'Risk Warning',
      content: `${highRiskMeanings.length} interpretation(s) carry high risk: ` +
        highRiskMeanings.map((m) => `"${m.interpretation}"`).join(', '),
      type: 'risk',
    });
  }

  const title = `Why did we ask: "${why.question}"?`;
  const bodyParts: string[] = [];
  for (const s of sections) {
    bodyParts.push(`### ${s.heading}\n${s.content}`);
  }

  return {
    title,
    body: bodyParts.join('\n\n'),
    sections,
    timestamp: Date.now(),
  };
}

/**
 * Rank meanings by their impact (entity count, risk).
 */
export function rankMeaningsByImpact(
  meanings: readonly CompetingMeaning[],
): readonly CompetingMeaning[] {
  const riskScores: Record<string, number> = { low: 1, medium: 3, high: 5 };
  const sorted = [...meanings];
  sorted.sort((a, b) => {
    const scoreA = (riskScores[a.riskLevel] ?? 1) * a.affectedEntities.length;
    const scoreB = (riskScores[b.riskLevel] ?? 1) * b.affectedEntities.length;
    return scoreB - scoreA;
  });
  return sorted;
}

/**
 * Get available why-explanation templates.
 */
export function getWhyTemplates(): readonly WhyTemplate[] {
  return WHY_TEMPLATES;
}

/**
 * Batch generate "why this question?" explanations.
 */
export function batchGenerateWhyExplanations(
  questions: readonly {
    question: string;
    meanings: readonly CompetingMeaning[];
  }[],
  config?: Partial<WhyConfig>,
): readonly WhyThisQuestion[] {
  const results: WhyThisQuestion[] = [];
  for (const q of questions) {
    results.push(generateWhyExplanation(q.question, q.meanings, config));
  }
  return results;
}

/**
 * Summarize all competing interpretations across multiple questions.
 */
export function summarizeCompetitions(
  whyQuestions: readonly WhyThisQuestion[],
): string {
  const lines: string[] = [];
  lines.push(`=== Competition Summary (${whyQuestions.length} questions) ===`);

  let totalMeanings = 0;
  let totalHighRisk = 0;

  for (const wq of whyQuestions) {
    totalMeanings += wq.competingMeanings.length;
    totalHighRisk += wq.competingMeanings.filter((m) => m.riskLevel === 'high').length;
    lines.push(
      `  Q: "${wq.question}" — ${wq.competingMeanings.length} interpretations, ` +
      `${wq.diffs.length} diffs`,
    );
  }

  lines.push('');
  lines.push(`Total interpretations: ${totalMeanings}`);
  lines.push(`High-risk interpretations: ${totalHighRisk}`);
  lines.push(`Average interpretations per question: ${whyQuestions.length > 0
    ? (totalMeanings / whyQuestions.length).toFixed(1) : '0'}`);

  return lines.join('\n');
}


// ============================================================================
// Step 247 [HCI] — Safe Preview Mode
// ============================================================================

/**
 * A diff showing what changes a candidate would produce.
 */
export interface PreviewDiff {
  readonly entityId: string;
  readonly entityName: string;
  readonly property: string;
  readonly oldValue: string;
  readonly newValue: string;
  readonly changeType: 'add' | 'modify' | 'remove';
}

/**
 * A candidate preview for a possible interpretation.
 */
export interface PreviewCandidate {
  readonly id: string;
  readonly label: string;
  readonly interpretation: string;
  readonly diffs: readonly PreviewDiff[];
  readonly totalChanges: number;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly summary: string;
  readonly selected: boolean;
}

/**
 * A safe preview showing side-by-side candidates.
 */
export interface SafePreview {
  readonly id: string;
  readonly utterance: string;
  readonly candidates: readonly PreviewCandidate[];
  readonly comparison: PreviewComparison | null;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly status: 'pending' | 'selected' | 'discarded';
}

/**
 * A comparison between two preview candidates.
 */
export interface PreviewComparison {
  readonly candidateA: string;
  readonly candidateB: string;
  readonly sharedChanges: readonly PreviewDiff[];
  readonly uniqueToA: readonly PreviewDiff[];
  readonly uniqueToB: readonly PreviewDiff[];
  readonly summary: string;
}

/**
 * Configuration for safe preview mode.
 */
export interface PreviewConfig {
  readonly maxCandidates: number;
  readonly previewLifetimeMs: number;
  readonly showSideBySide: boolean;
  readonly highlightDifferences: boolean;
  readonly autoDiscard: boolean;
  readonly maxDiffsPerCandidate: number;
}

// ----- 247: Default config -----

const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  maxCandidates: 4,
  previewLifetimeMs: 300000, // 5 minutes
  showSideBySide: true,
  highlightDifferences: true,
  autoDiscard: true,
  maxDiffsPerCandidate: 50,
};

let _previewCounter = 0;
const _previewHistory: SafePreview[] = [];

function generatePreviewId(): string {
  _previewCounter += 1;
  return `sp-${_previewCounter}-${Date.now()}`;
}

function generateCandidateId(): string {
  _previewCounter += 1;
  return `pc-${_previewCounter}-${Date.now()}`;
}

// ----- 247: Diff comparison helper -----

function diffKey(d: PreviewDiff): string {
  return `${d.entityId}:${d.property}:${d.changeType}`;
}

function compareCandidateDiffs(
  diffsA: readonly PreviewDiff[],
  diffsB: readonly PreviewDiff[],
): { shared: PreviewDiff[]; uniqueA: PreviewDiff[]; uniqueB: PreviewDiff[] } {
  const keysA = new Set(diffsA.map(diffKey));
  const keysB = new Set(diffsB.map(diffKey));
  const keyToDiffA = new Map<string, PreviewDiff>();
  const keyToDiffB = new Map<string, PreviewDiff>();

  for (const d of diffsA) keyToDiffA.set(diffKey(d), d);
  for (const d of diffsB) keyToDiffB.set(diffKey(d), d);

  const shared: PreviewDiff[] = [];
  const uniqueA: PreviewDiff[] = [];
  const uniqueB: PreviewDiff[] = [];

  for (const d of diffsA) {
    const k = diffKey(d);
    if (keysB.has(k)) {
      const bDiff = keyToDiffB.get(k);
      if (bDiff !== undefined && bDiff.newValue === d.newValue) {
        shared.push(d);
      } else {
        uniqueA.push(d);
      }
    } else {
      uniqueA.push(d);
    }
  }

  for (const d of diffsB) {
    const k = diffKey(d);
    if (!keysA.has(k)) {
      uniqueB.push(d);
    } else {
      const aDiff = keyToDiffA.get(k);
      if (aDiff !== undefined && aDiff.newValue !== d.newValue) {
        uniqueB.push(d);
      }
    }
  }

  return { shared, uniqueA, uniqueB };
}

// ----- 247: Core functions -----

/**
 * Generate a safe preview for an ambiguous request.
 */
export function generateSafePreview(
  utterance: string,
  candidateData: readonly {
    label: string;
    interpretation: string;
    diffs: readonly PreviewDiff[];
    risk: 'low' | 'medium' | 'high';
  }[],
  config?: Partial<PreviewConfig>,
): SafePreview {
  const cfg: PreviewConfig = {
    ...DEFAULT_PREVIEW_CONFIG,
    ...(config !== undefined ? config : {}),
  };

  const candidates: PreviewCandidate[] = [];
  for (const cd of candidateData.slice(0, cfg.maxCandidates)) {
    const trimmedDiffs = cd.diffs.slice(0, cfg.maxDiffsPerCandidate);
    candidates.push({
      id: generateCandidateId(),
      label: cd.label,
      interpretation: cd.interpretation,
      diffs: trimmedDiffs,
      totalChanges: cd.diffs.length,
      riskLevel: cd.risk,
      summary: `${cd.label}: ${trimmedDiffs.length} changes (${cd.risk} risk)`,
      selected: false,
    });
  }

  // Compute comparison between first two candidates if available
  let comparison: PreviewComparison | null = null;
  const candA = candidates[0];
  const candB = candidates[1];
  if (candA !== undefined && candB !== undefined) {
    const comp = compareCandidateDiffs(candA.diffs, candB.diffs);
    comparison = {
      candidateA: candA.id,
      candidateB: candB.id,
      sharedChanges: comp.shared,
      uniqueToA: comp.uniqueA,
      uniqueToB: comp.uniqueB,
      summary:
        `${comp.shared.length} shared changes, ` +
        `${comp.uniqueA.length} unique to "${candA.label}", ` +
        `${comp.uniqueB.length} unique to "${candB.label}"`,
    };
  }

  const now = Date.now();
  const preview: SafePreview = {
    id: generatePreviewId(),
    utterance,
    candidates,
    comparison,
    createdAt: now,
    expiresAt: now + cfg.previewLifetimeMs,
    status: 'pending',
  };

  _previewHistory.push(preview);
  return preview;
}

/**
 * Render a preview diff as a human-readable string.
 */
export function renderPreviewDiff(diff: PreviewDiff): string {
  switch (diff.changeType) {
    case 'add':
      return `+ ${diff.entityName}.${diff.property} = "${diff.newValue}"`;
    case 'remove':
      return `- ${diff.entityName}.${diff.property} (was "${diff.oldValue}")`;
    case 'modify':
      return `~ ${diff.entityName}.${diff.property}: "${diff.oldValue}" -> "${diff.newValue}"`;
  }
}

/**
 * Compare two preview candidates side by side.
 */
export function comparePreviewCandidates(
  candidateA: PreviewCandidate,
  candidateB: PreviewCandidate,
): PreviewComparison {
  const comp = compareCandidateDiffs(candidateA.diffs, candidateB.diffs);
  return {
    candidateA: candidateA.id,
    candidateB: candidateB.id,
    sharedChanges: comp.shared,
    uniqueToA: comp.uniqueA,
    uniqueToB: comp.uniqueB,
    summary:
      `${comp.shared.length} shared, ` +
      `${comp.uniqueA.length} only in "${candidateA.label}", ` +
      `${comp.uniqueB.length} only in "${candidateB.label}"`,
  };
}

/**
 * Format a preview for UI display.
 */
export function formatPreviewForUI(preview: SafePreview): string {
  const lines: string[] = [];
  lines.push(`=== Safe Preview [${preview.id}] ===`);
  lines.push(`Utterance: "${preview.utterance}"`);
  lines.push(`Status: ${preview.status}`);
  lines.push('');

  for (const candidate of preview.candidates) {
    lines.push(`--- ${candidate.label} (${candidate.riskLevel} risk) ---`);
    lines.push(`  Interpretation: ${candidate.interpretation}`);
    lines.push(`  Changes (${candidate.totalChanges} total):`);
    for (const diff of candidate.diffs.slice(0, 10)) {
      lines.push(`    ${renderPreviewDiff(diff)}`);
    }
    if (candidate.totalChanges > 10) {
      lines.push(`    ... and ${candidate.totalChanges - 10} more changes`);
    }
    lines.push('');
  }

  if (preview.comparison !== null) {
    lines.push('--- Comparison ---');
    lines.push(`  ${preview.comparison.summary}`);
    if (preview.comparison.uniqueToA.length > 0) {
      lines.push(`  Only in A: ${preview.comparison.uniqueToA.length} changes`);
    }
    if (preview.comparison.uniqueToB.length > 0) {
      lines.push(`  Only in B: ${preview.comparison.uniqueToB.length} changes`);
    }
  }

  return lines.join('\n');
}

/**
 * Select a preview candidate (mark it as chosen).
 */
export function selectPreviewCandidate(
  preview: SafePreview,
  candidateId: string,
): SafePreview {
  const updatedCandidates = preview.candidates.map((c) => ({
    ...c,
    selected: c.id === candidateId,
  }));

  return {
    ...preview,
    candidates: updatedCandidates,
    status: 'selected',
  };
}

/**
 * Discard all pending previews.
 */
export function discardPreviews(): number {
  let count = 0;
  for (let i = 0; i < _previewHistory.length; i++) {
    const p = _previewHistory[i];
    if (p !== undefined && p.status === 'pending') {
      _previewHistory[i] = { ...p, status: 'discarded' };
      count += 1;
    }
  }
  return count;
}

/**
 * Get preview history.
 */
export function getPreviewHistory(): readonly SafePreview[] {
  return [..._previewHistory];
}

/**
 * Batch generate previews for multiple utterances.
 */
export function batchGeneratePreviews(
  items: readonly {
    utterance: string;
    candidates: readonly {
      label: string;
      interpretation: string;
      diffs: readonly PreviewDiff[];
      risk: 'low' | 'medium' | 'high';
    }[];
  }[],
  config?: Partial<PreviewConfig>,
): readonly SafePreview[] {
  const results: SafePreview[] = [];
  for (const item of items) {
    results.push(generateSafePreview(item.utterance, item.candidates, config));
  }
  return results;
}


// ============================================================================
// Step 248 [HCI] — Commit Button Gating
// ============================================================================

/**
 * Types of gate conditions.
 */
export type GateConditionType =
  | 'no-unresolved-ambiguities'
  | 'safety-check-passed'
  | 'confirmation-received'
  | 'confidence-threshold-met'
  | 'no-open-holes'
  | 'all-constraints-satisfied'
  | 'preview-reviewed'
  | 'policy-requirements-met'
  | 'no-destructive-without-confirm'
  | 'scope-validated';

/**
 * A condition that must be met before committing.
 */
export interface GateCondition {
  readonly type: GateConditionType;
  readonly description: string;
  readonly satisfied: boolean;
  readonly blockerDescription: string | null;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
  readonly overridable: boolean;
}

/**
 * The status of the commit gate.
 */
export interface GateStatus {
  readonly enabled: boolean;
  readonly conditions: readonly GateCondition[];
  readonly allSatisfied: boolean;
  readonly criticalBlockers: readonly GateCondition[];
  readonly overridableBlockers: readonly GateCondition[];
  readonly timestamp: number;
}

/**
 * The full gate report including reasons and history.
 */
export interface CommitGate {
  readonly id: string;
  readonly status: GateStatus;
  readonly overrideApplied: boolean;
  readonly overrideReason: string | null;
  readonly timestamp: number;
}

/**
 * Configuration for commit gating.
 */
export interface CommitConfig {
  readonly enableGating: boolean;
  readonly requireAllCritical: boolean;
  readonly requireAllHigh: boolean;
  readonly allowOverride: boolean;
  readonly overrideRequiresReason: boolean;
  readonly logHistory: boolean;
  readonly historyLimit: number;
}

/**
 * Report on the gate state.
 */
export interface GateReport {
  readonly gate: CommitGate;
  readonly summary: string;
  readonly blockerDetails: readonly string[];
  readonly recommendations: readonly string[];
}

// ----- 248: Default config -----

const DEFAULT_COMMIT_CONFIG: CommitConfig = {
  enableGating: true,
  requireAllCritical: true,
  requireAllHigh: true,
  allowOverride: true,
  overrideRequiresReason: true,
  logHistory: true,
  historyLimit: 50,
};

let _commitGateCounter = 0;
const _gateHistory: CommitGate[] = [];

function generateGateId(): string {
  _commitGateCounter += 1;
  return `cg-${_commitGateCounter}-${Date.now()}`;
}

// ----- 248: Core functions -----

/**
 * Check the commit gate against a set of conditions.
 */
export function checkCommitGate(
  conditions: readonly GateCondition[],
  config?: Partial<CommitConfig>,
): CommitGate {
  const cfg: CommitConfig = {
    ...DEFAULT_COMMIT_CONFIG,
    ...(config !== undefined ? config : {}),
  };

  if (!cfg.enableGating) {
    const gate: CommitGate = {
      id: generateGateId(),
      status: {
        enabled: false,
        conditions,
        allSatisfied: true,
        criticalBlockers: [],
        overridableBlockers: [],
        timestamp: Date.now(),
      },
      overrideApplied: false,
      overrideReason: null,
      timestamp: Date.now(),
    };
    if (cfg.logHistory) _gateHistory.push(gate);
    return gate;
  }

  const criticalBlockers: GateCondition[] = [];
  const overridableBlockers: GateCondition[] = [];

  for (const cond of conditions) {
    if (!cond.satisfied) {
      if (cond.priority === 'critical') {
        criticalBlockers.push(cond);
      } else if (cond.overridable) {
        overridableBlockers.push(cond);
      } else {
        criticalBlockers.push(cond);
      }
    }
  }

  let allSatisfied = criticalBlockers.length === 0;
  if (cfg.requireAllHigh) {
    const highBlockers = conditions.filter(
      (c) => !c.satisfied && c.priority === 'high',
    );
    if (highBlockers.length > 0) allSatisfied = false;
  }

  const gate: CommitGate = {
    id: generateGateId(),
    status: {
      enabled: true,
      conditions,
      allSatisfied,
      criticalBlockers,
      overridableBlockers,
      timestamp: Date.now(),
    },
    overrideApplied: false,
    overrideReason: null,
    timestamp: Date.now(),
  };

  if (cfg.logHistory) {
    _gateHistory.push(gate);
    while (_gateHistory.length > cfg.historyLimit) {
      _gateHistory.shift();
    }
  }

  return gate;
}

/**
 * Get the conditions for a commit gate.
 */
export function getGateConditions(
  unresolvedAmbiguities: number,
  safetyPassed: boolean,
  confirmationReceived: boolean,
  confidenceMet: boolean,
  openHoles: number,
  constraintsSatisfied: boolean,
  previewReviewed: boolean,
  policyMet: boolean,
  hasDestructiveUnconfirmed: boolean,
  scopeValidated: boolean,
): readonly GateCondition[] {
  const conditions: GateCondition[] = [
    {
      type: 'no-unresolved-ambiguities',
      description: 'All ambiguities must be resolved',
      satisfied: unresolvedAmbiguities === 0,
      blockerDescription: unresolvedAmbiguities > 0
        ? `${unresolvedAmbiguities} unresolved ambiguities remain`
        : null,
      priority: 'critical',
      overridable: false,
    },
    {
      type: 'safety-check-passed',
      description: 'Safety assessment must pass',
      satisfied: safetyPassed,
      blockerDescription: !safetyPassed
        ? 'Safety check has not passed'
        : null,
      priority: 'critical',
      overridable: false,
    },
    {
      type: 'confirmation-received',
      description: 'User confirmation received if required',
      satisfied: confirmationReceived,
      blockerDescription: !confirmationReceived
        ? 'Awaiting user confirmation'
        : null,
      priority: 'high',
      overridable: true,
    },
    {
      type: 'confidence-threshold-met',
      description: 'Confidence must meet minimum threshold',
      satisfied: confidenceMet,
      blockerDescription: !confidenceMet
        ? 'Confidence score below required threshold'
        : null,
      priority: 'high',
      overridable: true,
    },
    {
      type: 'no-open-holes',
      description: 'No underspecified parameters remain',
      satisfied: openHoles === 0,
      blockerDescription: openHoles > 0
        ? `${openHoles} underspecified parameters remain`
        : null,
      priority: 'critical',
      overridable: false,
    },
    {
      type: 'all-constraints-satisfied',
      description: 'All hard constraints must be satisfied',
      satisfied: constraintsSatisfied,
      blockerDescription: !constraintsSatisfied
        ? 'Some hard constraints are not satisfied'
        : null,
      priority: 'critical',
      overridable: false,
    },
    {
      type: 'preview-reviewed',
      description: 'Preview has been reviewed if generated',
      satisfied: previewReviewed,
      blockerDescription: !previewReviewed
        ? 'Preview has not been reviewed'
        : null,
      priority: 'medium',
      overridable: true,
    },
    {
      type: 'policy-requirements-met',
      description: 'Accommodation policy requirements are met',
      satisfied: policyMet,
      blockerDescription: !policyMet
        ? 'Accommodation policy requirements not met'
        : null,
      priority: 'medium',
      overridable: true,
    },
    {
      type: 'no-destructive-without-confirm',
      description: 'Destructive actions require explicit confirmation',
      satisfied: !hasDestructiveUnconfirmed,
      blockerDescription: hasDestructiveUnconfirmed
        ? 'Destructive action requires explicit confirmation'
        : null,
      priority: 'critical',
      overridable: false,
    },
    {
      type: 'scope-validated',
      description: 'Action scope has been validated',
      satisfied: scopeValidated,
      blockerDescription: !scopeValidated
        ? 'Action scope has not been validated'
        : null,
      priority: 'medium',
      overridable: true,
    },
  ];
  return conditions;
}

/**
 * Check if the commit button should be enabled.
 */
export function isCommitEnabled(gate: CommitGate): boolean {
  return gate.status.allSatisfied || gate.overrideApplied;
}

/**
 * Get the blocking conditions preventing commit.
 */
export function getBlockingConditions(gate: CommitGate): readonly GateCondition[] {
  return gate.status.conditions.filter((c) => !c.satisfied);
}

/**
 * Format a gate report for display.
 */
export function formatGateReport(gate: CommitGate): GateReport {
  const blockerDetails: string[] = [];
  const recommendations: string[] = [];

  for (const cond of gate.status.conditions) {
    if (!cond.satisfied && cond.blockerDescription !== null) {
      blockerDetails.push(`[${cond.priority.toUpperCase()}] ${cond.blockerDescription}`);
      if (cond.type === 'no-unresolved-ambiguities') {
        recommendations.push('Resolve all ambiguities before committing');
      } else if (cond.type === 'safety-check-passed') {
        recommendations.push('Review and pass the safety check');
      } else if (cond.type === 'confidence-threshold-met') {
        recommendations.push('Provide more details to increase confidence');
      } else if (cond.type === 'no-open-holes') {
        recommendations.push('Specify all required parameters');
      } else if (cond.type === 'all-constraints-satisfied') {
        recommendations.push('Ensure all constraints are met');
      } else if (cond.type === 'preview-reviewed') {
        recommendations.push('Review the generated preview');
      } else if (cond.type === 'no-destructive-without-confirm') {
        recommendations.push('Confirm destructive actions explicitly');
      } else if (cond.type === 'scope-validated') {
        recommendations.push('Validate the scope of the action');
      } else if (cond.type === 'confirmation-received') {
        recommendations.push('Confirm the proposed action');
      } else if (cond.type === 'policy-requirements-met') {
        recommendations.push('Meet accommodation policy requirements');
      }
    }
  }

  const isEnabled = isCommitEnabled(gate);
  const summary = isEnabled
    ? gate.overrideApplied
      ? `Commit ENABLED (override applied: ${gate.overrideReason ?? 'no reason'})`
      : 'Commit ENABLED — all conditions met'
    : `Commit DISABLED — ${blockerDetails.length} blocker(s)`;

  return {
    gate,
    summary,
    blockerDetails,
    recommendations,
  };
}

/**
 * Override the commit gate with a reason.
 */
export function overrideGate(
  gate: CommitGate,
  reason: string,
  config?: Partial<CommitConfig>,
): CommitGate {
  const cfg: CommitConfig = {
    ...DEFAULT_COMMIT_CONFIG,
    ...(config !== undefined ? config : {}),
  };

  if (!cfg.allowOverride) {
    return gate;
  }

  if (cfg.overrideRequiresReason && reason.trim().length === 0) {
    return gate;
  }

  // Only allow overriding if there are no critical blockers that are non-overridable
  const nonOverridableCritical = gate.status.criticalBlockers.filter(
    (c) => !c.overridable,
  );
  if (nonOverridableCritical.length > 0) {
    return gate;
  }

  return {
    ...gate,
    overrideApplied: true,
    overrideReason: reason,
  };
}

/**
 * Get gate history.
 */
export function getGateHistory(): readonly CommitGate[] {
  return [..._gateHistory];
}

/**
 * Batch check gates for multiple sets of conditions.
 */
export function batchCheckGates(
  conditionSets: readonly (readonly GateCondition[])[],
  config?: Partial<CommitConfig>,
): readonly CommitGate[] {
  const results: CommitGate[] = [];
  for (const conditions of conditionSets) {
    results.push(checkCommitGate(conditions, config));
  }
  return results;
}


// ============================================================================
// Step 249 [HCI] — Developer Mode Toggles
// ============================================================================

/**
 * Available developer panels.
 */
export type DevPanelId =
  | 'discourse-referents'
  | 'salience-scores'
  | 'qud-stack'
  | 'common-ground'
  | 'binding-chain'
  | 'provenance'
  | 'confidence-breakdown'
  | 'speech-act'
  | 'focus-markers'
  | 'temporal-references'
  | 'safety-assessment'
  | 'accommodation-state'
  | 'constraint-list';

/**
 * Configuration for developer mode.
 */
export interface DevModeConfig {
  readonly enabled: boolean;
  readonly activePanels: readonly DevPanelId[];
  readonly overlayPosition: 'left' | 'right' | 'bottom' | 'floating';
  readonly overlayOpacity: number;
  readonly autoRefresh: boolean;
  readonly refreshIntervalMs: number;
  readonly showTimestamps: boolean;
  readonly compactMode: boolean;
}

/**
 * A single developer panel.
 */
export interface DevModePanel {
  readonly id: DevPanelId;
  readonly label: string;
  readonly description: string;
  readonly visible: boolean;
  readonly data: readonly DevModeDataEntry[];
  readonly lastUpdated: number;
}

/**
 * An overlay containing all active panels.
 */
export interface DevModeOverlay {
  readonly panels: readonly DevModePanel[];
  readonly config: DevModeConfig;
  readonly timestamp: number;
}

/**
 * A toggle for a specific dev panel.
 */
export interface DevModeToggle {
  readonly panelId: DevPanelId;
  readonly enabled: boolean;
  readonly label: string;
  readonly shortcut: string;
}

/**
 * Data for a dev mode panel.
 */
export interface DevModeData {
  readonly panelId: DevPanelId;
  readonly entries: readonly DevModeDataEntry[];
  readonly metadata: Record<string, string>;
  readonly timestamp: number;
}

/**
 * A single entry in dev mode data.
 */
export interface DevModeDataEntry {
  readonly key: string;
  readonly value: string;
  readonly type: 'string' | 'number' | 'list' | 'score' | 'boolean';
  readonly highlight: boolean;
}

/**
 * A snapshot of all dev mode state for export.
 */
export interface DevModeSnapshot {
  readonly config: DevModeConfig;
  readonly panels: readonly DevModePanel[];
  readonly timestamp: number;
  readonly version: string;
}

// ----- 249: Panel definitions -----

interface PanelDefinition {
  readonly id: DevPanelId;
  readonly label: string;
  readonly description: string;
  readonly shortcut: string;
  readonly defaultVisible: boolean;
}

const PANEL_DEFINITIONS: readonly PanelDefinition[] = [
  {
    id: 'discourse-referents',
    label: 'Discourse Referents',
    description: 'Shows all entities currently in the discourse model',
    shortcut: 'Ctrl+Shift+D',
    defaultVisible: false,
  },
  {
    id: 'salience-scores',
    label: 'Salience Scores',
    description: 'Shows salience/activation levels for each discourse entity',
    shortcut: 'Ctrl+Shift+S',
    defaultVisible: false,
  },
  {
    id: 'qud-stack',
    label: 'QUD Stack',
    description: 'Shows the Questions Under Discussion stack',
    shortcut: 'Ctrl+Shift+Q',
    defaultVisible: false,
  },
  {
    id: 'common-ground',
    label: 'Common Ground',
    description: 'Shows propositions in the common ground',
    shortcut: 'Ctrl+Shift+G',
    defaultVisible: false,
  },
  {
    id: 'binding-chain',
    label: 'Binding Chain',
    description: 'Shows how each pronoun/reference was resolved',
    shortcut: 'Ctrl+Shift+B',
    defaultVisible: false,
  },
  {
    id: 'provenance',
    label: 'Provenance',
    description: 'Shows the origin of each interpretation decision',
    shortcut: 'Ctrl+Shift+P',
    defaultVisible: false,
  },
  {
    id: 'confidence-breakdown',
    label: 'Confidence Breakdown',
    description: 'Shows detailed confidence score breakdown',
    shortcut: 'Ctrl+Shift+C',
    defaultVisible: false,
  },
  {
    id: 'speech-act',
    label: 'Speech Act',
    description: 'Shows detected speech act type and parameters',
    shortcut: 'Ctrl+Shift+A',
    defaultVisible: false,
  },
  {
    id: 'focus-markers',
    label: 'Focus Markers',
    description: 'Shows focus and topic markers in the utterance',
    shortcut: 'Ctrl+Shift+F',
    defaultVisible: false,
  },
  {
    id: 'temporal-references',
    label: 'Temporal References',
    description: 'Shows detected time and sequence expressions',
    shortcut: 'Ctrl+Shift+T',
    defaultVisible: false,
  },
  {
    id: 'safety-assessment',
    label: 'Safety Assessment',
    description: 'Shows current safety assessment and risk scores',
    shortcut: 'Ctrl+Shift+Y',
    defaultVisible: false,
  },
  {
    id: 'accommodation-state',
    label: 'Accommodation State',
    description: 'Shows current accommodation policy and proposals',
    shortcut: 'Ctrl+Shift+O',
    defaultVisible: false,
  },
  {
    id: 'constraint-list',
    label: 'Constraint List',
    description: 'Shows all active discourse constraints',
    shortcut: 'Ctrl+Shift+L',
    defaultVisible: false,
  },
] as const;

// ----- 249: State -----

let _devModeConfig: DevModeConfig = {
  enabled: false,
  activePanels: [],
  overlayPosition: 'right',
  overlayOpacity: 0.9,
  autoRefresh: true,
  refreshIntervalMs: 1000,
  showTimestamps: true,
  compactMode: false,
};

// ----- 249: Core functions -----

/**
 * Create a developer mode configuration.
 */
export function createDevModeConfig(
  options?: Partial<DevModeConfig>,
): DevModeConfig {
  const config: DevModeConfig = {
    enabled: false,
    activePanels: [],
    overlayPosition: 'right',
    overlayOpacity: 0.9,
    autoRefresh: true,
    refreshIntervalMs: 1000,
    showTimestamps: true,
    compactMode: false,
    ...(options !== undefined ? options : {}),
  };
  _devModeConfig = config;
  return config;
}

/**
 * Toggle a specific developer panel.
 */
export function toggleDevPanel(panelId: DevPanelId): DevModeToggle {
  const currentlyActive = _devModeConfig.activePanels.includes(panelId);
  const newActivePanels = currentlyActive
    ? _devModeConfig.activePanels.filter((p) => p !== panelId)
    : [..._devModeConfig.activePanels, panelId];

  _devModeConfig = {
    ..._devModeConfig,
    activePanels: newActivePanels,
    enabled: newActivePanels.length > 0,
  };

  const def = PANEL_DEFINITIONS.find((p) => p.id === panelId);
  return {
    panelId,
    enabled: !currentlyActive,
    label: def !== undefined ? def.label : panelId,
    shortcut: def !== undefined ? def.shortcut : '',
  };
}

/**
 * Get data for a specific developer panel.
 */
export function getDevModeData(panelId: DevPanelId): DevModeData {
  const entries: DevModeDataEntry[] = [];

  switch (panelId) {
    case 'discourse-referents':
      entries.push({ key: 'Total referents', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Active referents', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Stale referents', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Last update', value: new Date().toISOString(), type: 'string', highlight: false });
      break;

    case 'salience-scores':
      entries.push({ key: 'Max salience', value: '0.0', type: 'score', highlight: false });
      entries.push({ key: 'Min salience', value: '0.0', type: 'score', highlight: false });
      entries.push({ key: 'Avg salience', value: '0.0', type: 'score', highlight: false });
      entries.push({ key: 'Entities scored', value: '0', type: 'number', highlight: false });
      break;

    case 'qud-stack':
      entries.push({ key: 'Stack depth', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Top QUD', value: '(empty)', type: 'string', highlight: true });
      entries.push({ key: 'Resolved QUDs', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Open QUDs', value: '0', type: 'number', highlight: false });
      break;

    case 'common-ground':
      entries.push({ key: 'Propositions', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Shared facts', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Assumptions', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Contested', value: '0', type: 'number', highlight: false });
      break;

    case 'binding-chain':
      entries.push({ key: 'Total bindings', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Chain length', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Unresolved', value: '0', type: 'number', highlight: true });
      entries.push({ key: 'Override count', value: '0', type: 'number', highlight: false });
      break;

    case 'provenance':
      entries.push({ key: 'Decisions logged', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Sources', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Trace entries', value: '0', type: 'number', highlight: false });
      break;

    case 'confidence-breakdown':
      entries.push({ key: 'Score', value: '0.0', type: 'score', highlight: true });
      entries.push({ key: 'Level', value: 'unknown', type: 'string', highlight: false });
      entries.push({ key: 'Positive factors', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Negative factors', value: '0', type: 'number', highlight: false });
      break;

    case 'speech-act':
      entries.push({ key: 'Type', value: '(none)', type: 'string', highlight: false });
      entries.push({ key: 'Force', value: '(none)', type: 'string', highlight: false });
      entries.push({ key: 'Directness', value: '(none)', type: 'string', highlight: false });
      entries.push({ key: 'Felicity', value: 'unknown', type: 'boolean', highlight: false });
      break;

    case 'focus-markers':
      entries.push({ key: 'Topic', value: '(none)', type: 'string', highlight: false });
      entries.push({ key: 'Focus', value: '(none)', type: 'string', highlight: true });
      entries.push({ key: 'Contrast', value: '(none)', type: 'string', highlight: false });
      entries.push({ key: 'Background', value: '(none)', type: 'string', highlight: false });
      break;

    case 'temporal-references':
      entries.push({ key: 'Time expressions', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Sequence markers', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Duration refs', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Relative refs', value: '0', type: 'number', highlight: false });
      break;

    case 'safety-assessment':
      entries.push({ key: 'Risk score', value: '0.0', type: 'score', highlight: true });
      entries.push({ key: 'Scope', value: 'minimal', type: 'string', highlight: false });
      entries.push({ key: 'Triggers', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Recommendation', value: 'proceed', type: 'string', highlight: false });
      break;

    case 'accommodation-state':
      entries.push({ key: 'Policy level', value: _currentAccommodationPolicy.level, type: 'string', highlight: false });
      entries.push({ key: 'Auto-fills', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Pending proposals', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'History entries', value: String(_accommodationHistory.length), type: 'number', highlight: false });
      break;

    case 'constraint-list':
      entries.push({ key: 'Total constraints', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Hard constraints', value: '0', type: 'number', highlight: true });
      entries.push({ key: 'Soft constraints', value: '0', type: 'number', highlight: false });
      entries.push({ key: 'Exclusions', value: '0', type: 'number', highlight: false });
      break;
  }

  return {
    panelId,
    entries,
    metadata: {
      panelLabel: PANEL_DEFINITIONS.find((p) => p.id === panelId)?.label ?? panelId,
      lastRefresh: new Date().toISOString(),
    },
    timestamp: Date.now(),
  };
}

/**
 * Format a dev panel for display.
 */
export function formatDevPanel(panel: DevModePanel): string {
  const lines: string[] = [];
  lines.push(`=== ${panel.label} ===`);
  if (_devModeConfig.showTimestamps) {
    lines.push(`  Updated: ${new Date(panel.lastUpdated).toISOString()}`);
  }
  for (const entry of panel.data) {
    const marker = entry.highlight ? ' *' : '';
    lines.push(`  ${entry.key}: ${entry.value}${marker}`);
  }
  return lines.join('\n');
}

/**
 * Export a snapshot of the current dev mode state.
 */
export function exportDevSnapshot(): DevModeSnapshot {
  const panels: DevModePanel[] = [];
  for (const panelId of _devModeConfig.activePanels) {
    const def = PANEL_DEFINITIONS.find((p) => p.id === panelId);
    const data = getDevModeData(panelId);
    panels.push({
      id: panelId,
      label: def !== undefined ? def.label : panelId,
      description: def !== undefined ? def.description : '',
      visible: true,
      data: data.entries,
      lastUpdated: data.timestamp,
    });
  }

  return {
    config: _devModeConfig,
    panels,
    timestamp: Date.now(),
    version: '1.0.0',
  };
}

/**
 * Import a dev mode snapshot.
 */
export function importDevSnapshot(snapshot: DevModeSnapshot): DevModeConfig {
  _devModeConfig = snapshot.config;
  return _devModeConfig;
}

/**
 * Get all available developer panels.
 */
export function getAllDevPanels(): readonly DevModeToggle[] {
  return PANEL_DEFINITIONS.map((def) => ({
    panelId: def.id,
    enabled: _devModeConfig.activePanels.includes(def.id),
    label: def.label,
    shortcut: def.shortcut,
  }));
}

/**
 * Render the full dev mode overlay.
 */
export function renderDevOverlay(): DevModeOverlay {
  const panels: DevModePanel[] = [];
  for (const panelId of _devModeConfig.activePanels) {
    const def = PANEL_DEFINITIONS.find((p) => p.id === panelId);
    const data = getDevModeData(panelId);
    panels.push({
      id: panelId,
      label: def !== undefined ? def.label : panelId,
      description: def !== undefined ? def.description : '',
      visible: true,
      data: data.entries,
      lastUpdated: data.timestamp,
    });
  }

  return {
    panels,
    config: _devModeConfig,
    timestamp: Date.now(),
  };
}


// ============================================================================
// Step 250 [Infra] — Pragmatics Trace Format
// ============================================================================

/**
 * Types of trace events.
 */
export type TraceEventType =
  | 'binding-decision'
  | 'clarification-generated'
  | 'accommodation-applied'
  | 'repair-processed'
  | 'confirmation-received'
  | 'safety-assessment'
  | 'confidence-computed'
  | 'constraint-promoted'
  | 'preview-generated'
  | 'gate-checked'
  | 'deference-decision'
  | 'explanation-generated'
  | 'dev-mode-toggle';

/**
 * A single entry in the pragmatics trace.
 */
export interface TraceEntry {
  readonly id: string;
  readonly eventType: TraceEventType;
  readonly timestamp: number;
  readonly description: string;
  readonly inputData: Record<string, string>;
  readonly outputData: Record<string, string>;
  readonly decision: string;
  readonly reason: string;
  readonly relatedEntryIds: readonly string[];
  readonly tags: readonly string[];
}

/**
 * A trace event for structured recording.
 */
export interface TraceEvent {
  readonly type: TraceEventType;
  readonly payload: Record<string, string>;
  readonly timestamp: number;
}

/**
 * Configuration for trace recording.
 */
export interface TraceConfig {
  readonly enabled: boolean;
  readonly maxEntries: number;
  readonly captureInputData: boolean;
  readonly captureOutputData: boolean;
  readonly filterEventTypes: readonly TraceEventType[] | null;
  readonly includeTimestamps: boolean;
  readonly includeRelatedEntries: boolean;
}

/**
 * Summary statistics for a trace.
 */
export interface TraceSummary {
  readonly totalEntries: number;
  readonly eventTypeCounts: ReadonlyMap<TraceEventType, number>;
  readonly firstTimestamp: number;
  readonly lastTimestamp: number;
  readonly durationMs: number;
  readonly uniqueTags: readonly string[];
  readonly decisionDistribution: ReadonlyMap<string, number>;
}

/**
 * An exported trace for bug reports or reproducibility.
 */
export interface TraceExport {
  readonly version: string;
  readonly config: TraceConfig;
  readonly entries: readonly TraceEntry[];
  readonly summary: TraceSummary;
  readonly exportedAt: number;
  readonly metadata: Record<string, string>;
}

/**
 * The full pragmatics trace.
 */
export interface PragmaticsTrace {
  readonly id: string;
  readonly config: TraceConfig;
  readonly entries: readonly TraceEntry[];
  readonly createdAt: number;
  readonly lastUpdated: number;
}

// ----- 250: Default config -----

const DEFAULT_TRACE_CONFIG: TraceConfig = {
  enabled: true,
  maxEntries: 500,
  captureInputData: true,
  captureOutputData: true,
  filterEventTypes: null,
  includeTimestamps: true,
  includeRelatedEntries: true,
};

let _traceCounter = 0;
let _traceEntryCounter = 0;
const _traceEntries: TraceEntry[] = [];
let _traceConfig: TraceConfig = DEFAULT_TRACE_CONFIG;
let _traceCreatedAt: number = Date.now();

function generateTraceId(): string {
  _traceCounter += 1;
  return `pt-${_traceCounter}-${Date.now()}`;
}

function generateTraceEntryId(): string {
  _traceEntryCounter += 1;
  return `te-${_traceEntryCounter}-${Date.now()}`;
}

// ----- 250: Core functions -----

/**
 * Create a new pragmatics trace.
 */
export function createTrace(config?: Partial<TraceConfig>): PragmaticsTrace {
  _traceConfig = {
    ...DEFAULT_TRACE_CONFIG,
    ...(config !== undefined ? config : {}),
  };
  _traceEntries.length = 0;
  _traceCreatedAt = Date.now();

  return {
    id: generateTraceId(),
    config: _traceConfig,
    entries: [],
    createdAt: _traceCreatedAt,
    lastUpdated: _traceCreatedAt,
  };
}

/**
 * Add a trace entry.
 */
export function addTraceEntry(
  eventType: TraceEventType,
  description: string,
  decision: string,
  reason: string,
  inputData?: Record<string, string>,
  outputData?: Record<string, string>,
  relatedEntryIds?: readonly string[],
  tags?: readonly string[],
): TraceEntry {
  if (!_traceConfig.enabled) {
    return {
      id: 'disabled',
      eventType,
      timestamp: Date.now(),
      description,
      inputData: {},
      outputData: {},
      decision,
      reason,
      relatedEntryIds: [],
      tags: [],
    };
  }

  if (
    _traceConfig.filterEventTypes !== null &&
    !_traceConfig.filterEventTypes.includes(eventType)
  ) {
    return {
      id: 'filtered',
      eventType,
      timestamp: Date.now(),
      description,
      inputData: {},
      outputData: {},
      decision,
      reason,
      relatedEntryIds: [],
      tags: [],
    };
  }

  const entry: TraceEntry = {
    id: generateTraceEntryId(),
    eventType,
    timestamp: Date.now(),
    description,
    inputData: _traceConfig.captureInputData && inputData !== undefined ? inputData : {},
    outputData: _traceConfig.captureOutputData && outputData !== undefined ? outputData : {},
    decision,
    reason,
    relatedEntryIds: _traceConfig.includeRelatedEntries && relatedEntryIds !== undefined
      ? relatedEntryIds
      : [],
    tags: tags !== undefined ? tags : [],
  };

  _traceEntries.push(entry);
  while (_traceEntries.length > _traceConfig.maxEntries) {
    _traceEntries.shift();
  }

  return entry;
}

/**
 * Get the current trace.
 */
export function getTrace(): PragmaticsTrace {
  return {
    id: `pt-current-${_traceCreatedAt}`,
    config: _traceConfig,
    entries: [..._traceEntries],
    createdAt: _traceCreatedAt,
    lastUpdated: _traceEntries.length > 0
      ? (_traceEntries[_traceEntries.length - 1]?.timestamp ?? Date.now())
      : _traceCreatedAt,
  };
}

/**
 * Export the trace for bug reports or reproducibility.
 */
export function exportTrace(metadata?: Record<string, string>): TraceExport {
  const trace = getTrace();
  const summary = summarizeTrace();

  return {
    version: '1.0.0',
    config: _traceConfig,
    entries: trace.entries,
    summary,
    exportedAt: Date.now(),
    metadata: metadata !== undefined ? metadata : {},
  };
}

/**
 * Import a trace from an export.
 */
export function importTrace(exported: TraceExport): PragmaticsTrace {
  _traceConfig = exported.config;
  _traceEntries.length = 0;
  for (const entry of exported.entries) {
    _traceEntries.push(entry);
  }
  _traceCreatedAt = exported.entries.length > 0
    ? (exported.entries[0]?.timestamp ?? Date.now())
    : Date.now();

  return getTrace();
}

/**
 * Summarize the trace.
 */
export function summarizeTrace(): TraceSummary {
  const eventTypeCounts = new Map<TraceEventType, number>();
  const decisionDistribution = new Map<string, number>();
  const allTags = new Set<string>();

  let firstTimestamp = Infinity;
  let lastTimestamp = 0;

  for (const entry of _traceEntries) {
    // Event type counts
    const prevCount = eventTypeCounts.get(entry.eventType);
    eventTypeCounts.set(entry.eventType, (prevCount !== undefined ? prevCount : 0) + 1);

    // Decision distribution
    const prevDec = decisionDistribution.get(entry.decision);
    decisionDistribution.set(entry.decision, (prevDec !== undefined ? prevDec : 0) + 1);

    // Tags
    for (const tag of entry.tags) {
      allTags.add(tag);
    }

    // Timestamps
    if (entry.timestamp < firstTimestamp) firstTimestamp = entry.timestamp;
    if (entry.timestamp > lastTimestamp) lastTimestamp = entry.timestamp;
  }

  if (_traceEntries.length === 0) {
    firstTimestamp = 0;
    lastTimestamp = 0;
  }

  return {
    totalEntries: _traceEntries.length,
    eventTypeCounts,
    firstTimestamp,
    lastTimestamp,
    durationMs: lastTimestamp - firstTimestamp,
    uniqueTags: Array.from(allTags),
    decisionDistribution,
  };
}

/**
 * Filter the trace to specific event types.
 */
export function filterTrace(
  eventTypes: readonly TraceEventType[],
): readonly TraceEntry[] {
  const typeSet = new Set(eventTypes);
  return _traceEntries.filter((e) => typeSet.has(e.eventType));
}

/**
 * Format the trace for a bug report.
 */
export function formatTraceForBugReport(): string {
  const summary = summarizeTrace();
  const lines: string[] = [];

  lines.push('=== Pragmatics Trace Bug Report ===');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total entries: ${summary.totalEntries}`);
  lines.push(`Duration: ${summary.durationMs}ms`);
  lines.push('');

  // Event type breakdown
  lines.push('Event Type Breakdown:');
  for (const [eventType, count] of Array.from(summary.eventTypeCounts.entries())) {
    lines.push(`  ${eventType}: ${count}`);
  }
  lines.push('');

  // Decision distribution
  lines.push('Decision Distribution:');
  for (const [decision, count] of Array.from(summary.decisionDistribution.entries())) {
    lines.push(`  "${decision}": ${count}`);
  }
  lines.push('');

  // Tags
  if (summary.uniqueTags.length > 0) {
    lines.push(`Tags: ${summary.uniqueTags.join(', ')}`);
    lines.push('');
  }

  // Last 20 entries
  lines.push('Recent Entries (last 20):');
  const recentEntries = _traceEntries.slice(-20);
  for (const entry of recentEntries) {
    const ts = _traceConfig.includeTimestamps
      ? `[${new Date(entry.timestamp).toISOString()}] `
      : '';
    lines.push(`${ts}${entry.eventType}: ${entry.description}`);
    lines.push(`  Decision: ${entry.decision}`);
    lines.push(`  Reason: ${entry.reason}`);
    if (Object.keys(entry.inputData).length > 0) {
      lines.push(`  Input: ${JSON.stringify(entry.inputData)}`);
    }
    if (Object.keys(entry.outputData).length > 0) {
      lines.push(`  Output: ${JSON.stringify(entry.outputData)}`);
    }
    if (entry.relatedEntryIds.length > 0) {
      lines.push(`  Related: ${entry.relatedEntryIds.join(', ')}`);
    }
    if (entry.tags.length > 0) {
      lines.push(`  Tags: ${entry.tags.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Clear the trace.
 */
export function clearTrace(): void {
  _traceEntries.length = 0;
  _traceCreatedAt = Date.now();
}

/**
 * Get trace statistics.
 */
export function getTraceStats(): {
  totalEntries: number;
  oldestEntryAge: number;
  newestEntryAge: number;
  entriesPerSecond: number;
  eventTypes: readonly TraceEventType[];
  configEnabled: boolean;
} {
  const now = Date.now();
  const firstEntry = _traceEntries[0];
  const lastEntry = _traceEntries[_traceEntries.length - 1];

  const oldestAge = firstEntry !== undefined ? now - firstEntry.timestamp : 0;
  const newestAge = lastEntry !== undefined ? now - lastEntry.timestamp : 0;
  const duration = oldestAge > 0 ? oldestAge / 1000 : 1;

  const eventTypeSet = new Set<TraceEventType>();
  for (const entry of _traceEntries) {
    eventTypeSet.add(entry.eventType);
  }

  return {
    totalEntries: _traceEntries.length,
    oldestEntryAge: oldestAge,
    newestEntryAge: newestAge,
    entriesPerSecond: _traceEntries.length / duration,
    eventTypes: Array.from(eventTypeSet),
    configEnabled: _traceConfig.enabled,
  };
}
