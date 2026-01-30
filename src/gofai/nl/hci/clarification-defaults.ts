/**
 * GOFAI NL HCI — Clarification Defaults and "Why This Matters"
 *
 * Enforces the rule that every clarification UI must show:
 * 1. A default option (highlighted, selectable with Enter).
 * 2. A "why this matters" explanation in one line.
 *
 * This module provides validators, default-assignment logic, and
 * one-line summary generators for the clarification system.
 *
 * ## Design Rule
 *
 * > Every clarification question MUST show a default and
 * > "why this matters" in one line.
 *
 * This is a hard UX requirement. No clarification question may
 * be presented to the user without both elements.
 *
 * @module gofai/nl/hci/clarification-defaults
 * @see gofai_goalA.md Step 149
 */

// =============================================================================
// VALIDATION — Ensure every clarification has a default + why
// =============================================================================

/**
 * A clarification question to validate.
 */
export interface ValidatableClarification {
  readonly question: string;
  readonly options: readonly ValidatableOption[];
  readonly defaultOptionIndex: number | null;
  readonly whyItMatters: string | null;
}

export interface ValidatableOption {
  readonly label: string;
  readonly risk: 'safe' | 'moderate' | 'risky';
}

/**
 * Result of validating a clarification question.
 */
export interface ClarificationValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ClarificationValidationError[];
  readonly warnings: readonly ClarificationValidationWarning[];
  readonly fixedVersion: ValidatableClarification | null;
}

export interface ClarificationValidationError {
  readonly code: ValidationErrorCode;
  readonly message: string;
}

export interface ClarificationValidationWarning {
  readonly code: ValidationWarningCode;
  readonly message: string;
}

export type ValidationErrorCode =
  | 'NO_DEFAULT'           // No default option specified
  | 'NO_WHY_IT_MATTERS'   // Missing "why it matters" text
  | 'EMPTY_QUESTION'       // Question text is empty
  | 'NO_OPTIONS'           // No options provided
  | 'INVALID_DEFAULT_INDEX'; // Default index out of range

export type ValidationWarningCode =
  | 'DEFAULT_IS_RISKY'     // Default option has risk level 'risky'
  | 'WHY_TOO_LONG'         // "Why it matters" exceeds one line
  | 'QUESTION_TOO_LONG'    // Question exceeds recommended length
  | 'TOO_MANY_OPTIONS'     // More than 4 options
  | 'ALL_OPTIONS_RISKY';   // Every option is risky

/**
 * Maximum character length for "why it matters" (one line).
 */
export const MAX_WHY_IT_MATTERS_LENGTH = 100;

/**
 * Maximum character length for question text.
 */
export const MAX_QUESTION_LENGTH = 120;

/**
 * Maximum number of options recommended.
 */
export const MAX_RECOMMENDED_OPTIONS = 4;

/**
 * Validate a clarification question against the design rule.
 */
export function validateClarification(
  clarification: ValidatableClarification,
): ClarificationValidationResult {
  const errors: ClarificationValidationError[] = [];
  const warnings: ClarificationValidationWarning[] = [];

  // Error: empty question
  if (!clarification.question || clarification.question.trim().length === 0) {
    errors.push({
      code: 'EMPTY_QUESTION',
      message: 'Clarification question text is empty.',
    });
  }

  // Error: no options
  if (!clarification.options || clarification.options.length === 0) {
    errors.push({
      code: 'NO_OPTIONS',
      message: 'Clarification has no options.',
    });
  }

  // Error: no default
  if (clarification.defaultOptionIndex === null || clarification.defaultOptionIndex === undefined) {
    errors.push({
      code: 'NO_DEFAULT',
      message: 'Every clarification must have a default option. Assign the safest option as default.',
    });
  } else if (
    clarification.options &&
    (clarification.defaultOptionIndex < 0 || clarification.defaultOptionIndex >= clarification.options.length)
  ) {
    errors.push({
      code: 'INVALID_DEFAULT_INDEX',
      message: `Default index ${clarification.defaultOptionIndex} is out of range (0–${clarification.options.length - 1}).`,
    });
  }

  // Error: no "why it matters"
  if (!clarification.whyItMatters || clarification.whyItMatters.trim().length === 0) {
    errors.push({
      code: 'NO_WHY_IT_MATTERS',
      message: 'Every clarification must include a "why this matters" explanation.',
    });
  }

  // Warning: "why it matters" too long
  if (clarification.whyItMatters && clarification.whyItMatters.length > MAX_WHY_IT_MATTERS_LENGTH) {
    warnings.push({
      code: 'WHY_TOO_LONG',
      message: `"Why it matters" is ${clarification.whyItMatters.length} chars (max ${MAX_WHY_IT_MATTERS_LENGTH}). Should fit one line.`,
    });
  }

  // Warning: question too long
  if (clarification.question && clarification.question.length > MAX_QUESTION_LENGTH) {
    warnings.push({
      code: 'QUESTION_TOO_LONG',
      message: `Question is ${clarification.question.length} chars (max ${MAX_QUESTION_LENGTH}).`,
    });
  }

  // Warning: default is risky
  if (
    clarification.defaultOptionIndex !== null &&
    clarification.defaultOptionIndex !== undefined &&
    clarification.options &&
    clarification.defaultOptionIndex >= 0 &&
    clarification.defaultOptionIndex < clarification.options.length
  ) {
    const defaultOption = clarification.options[clarification.defaultOptionIndex]!;
    if (defaultOption.risk === 'risky') {
      warnings.push({
        code: 'DEFAULT_IS_RISKY',
        message: 'Default option has risk level "risky". Consider a safer default.',
      });
    }
  }

  // Warning: too many options
  if (clarification.options && clarification.options.length > MAX_RECOMMENDED_OPTIONS) {
    warnings.push({
      code: 'TOO_MANY_OPTIONS',
      message: `${clarification.options.length} options exceeds recommended max of ${MAX_RECOMMENDED_OPTIONS}.`,
    });
  }

  // Warning: all options risky
  if (clarification.options && clarification.options.length > 0 && clarification.options.every(o => o.risk === 'risky')) {
    warnings.push({
      code: 'ALL_OPTIONS_RISKY',
      message: 'All options are risky. Consider adding a safe/no-op option.',
    });
  }

  // Attempt auto-fix
  let fixedVersion: ValidatableClarification | null = null;
  if (errors.length > 0) {
    fixedVersion = autoFixClarification(clarification);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fixedVersion,
  };
}

// =============================================================================
// AUTO-FIX — Assign defaults and generate "why it matters"
// =============================================================================

/**
 * Attempt to auto-fix a clarification that fails validation.
 */
export function autoFixClarification(
  clarification: ValidatableClarification,
): ValidatableClarification {
  const options = clarification.options ?? [];

  // Fix: assign default to safest option
  let defaultIndex = clarification.defaultOptionIndex;
  if (defaultIndex === null || defaultIndex === undefined || defaultIndex < 0 || defaultIndex >= options.length) {
    defaultIndex = findSafestOptionIndex(options);
  }

  // Fix: generate "why it matters" if missing
  let whyItMatters = clarification.whyItMatters;
  if (!whyItMatters || whyItMatters.trim().length === 0) {
    whyItMatters = generateWhyItMatters(options);
  }

  // Fix: truncate "why it matters" if too long
  if (whyItMatters.length > MAX_WHY_IT_MATTERS_LENGTH) {
    whyItMatters = whyItMatters.slice(0, MAX_WHY_IT_MATTERS_LENGTH - 3) + '...';
  }

  return {
    question: clarification.question || 'Which did you mean?',
    options,
    defaultOptionIndex: defaultIndex,
    whyItMatters,
  };
}

/**
 * Find the index of the safest option.
 * Preference order: safe > moderate > risky. Ties broken by first occurrence.
 */
export function findSafestOptionIndex(options: readonly ValidatableOption[]): number {
  if (options.length === 0) return 0;

  const riskOrder: Record<string, number> = { safe: 0, moderate: 1, risky: 2 };
  let bestIndex = 0;
  let bestRisk = riskOrder[options[0]!.risk] ?? 1;

  for (let i = 1; i < options.length; i++) {
    const risk = riskOrder[options[i]!.risk] ?? 1;
    if (risk < bestRisk) {
      bestRisk = risk;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Generate a "why it matters" string from the options.
 */
export function generateWhyItMatters(options: readonly ValidatableOption[]): string {
  if (options.length === 0) {
    return 'Different interpretations produce different results.';
  }

  const risks = options.map(o => o.risk);
  const hasRisky = risks.includes('risky');
  const allSafe = risks.every(r => r === 'safe');

  if (hasRisky) {
    return 'Some options could cause significant changes to your project.';
  }
  if (allSafe) {
    return 'Each option produces a noticeably different result.';
  }
  return 'Different interpretations affect different aspects of your music.';
}

// =============================================================================
// DEFAULT ASSIGNMENT STRATEGIES
// =============================================================================

/**
 * Strategy for assigning defaults when none is specified.
 */
export type DefaultAssignmentStrategy =
  | 'safest'           // Pick the safest option
  | 'first'            // Always pick the first option
  | 'most_common'      // Pick the statistically most common interpretation
  | 'contextual'       // Use project context to decide
  | 'none';            // Require explicit user choice (violates the rule!)

/**
 * The required default assignment strategy (enforcing the design rule).
 */
export const REQUIRED_DEFAULT_STRATEGY: DefaultAssignmentStrategy = 'safest';

/**
 * Apply a default assignment strategy.
 */
export function assignDefault(
  options: readonly ValidatableOption[],
  strategy: DefaultAssignmentStrategy = REQUIRED_DEFAULT_STRATEGY,
): number {
  if (options.length === 0) return 0;

  switch (strategy) {
    case 'safest':
      return findSafestOptionIndex(options);
    case 'first':
      return 0;
    case 'most_common':
      // Would use statistics in production; fallback to safest
      return findSafestOptionIndex(options);
    case 'contextual':
      // Would use project context; fallback to safest
      return findSafestOptionIndex(options);
    case 'none':
      // This violates the rule! Return safest anyway.
      return findSafestOptionIndex(options);
  }
}

// =============================================================================
// "WHY THIS MATTERS" GENERATORS — one-line explanations
// =============================================================================

/**
 * Risk-based "why it matters" generators.
 */
export interface WhyItMattersGenerator {
  readonly id: string;
  readonly condition: string;
  readonly template: string;
}

/**
 * Built-in "why it matters" generator templates.
 */
export const WHY_IT_MATTERS_GENERATORS: readonly WhyItMattersGenerator[] = [
  {
    id: 'WIM001',
    condition: 'any destructive option',
    template: 'Some options cannot be undone — choose carefully.',
  },
  {
    id: 'WIM002',
    condition: 'all options safe',
    template: 'Each option produces a different sound — try one and undo if needed.',
  },
  {
    id: 'WIM003',
    condition: 'affects global vs local',
    template: 'Some options affect the whole project; others just this section.',
  },
  {
    id: 'WIM004',
    condition: 'EQ vs arrangement',
    template: 'One option changes the mix; the other changes the arrangement.',
  },
  {
    id: 'WIM005',
    condition: 'degree ambiguity',
    template: 'Each option adjusts a different sound quality.',
  },
  {
    id: 'WIM006',
    condition: 'reference ambiguity',
    template: 'We need to know which element you\'re referring to.',
  },
  {
    id: 'WIM007',
    condition: 'scope ambiguity',
    template: 'This affects how broadly the change is applied.',
  },
  {
    id: 'WIM008',
    condition: 'timing ambiguity',
    template: 'This determines when and where the change happens.',
  },
  {
    id: 'WIM009',
    condition: 'quantity ambiguity',
    template: 'This determines how many elements are affected.',
  },
  {
    id: 'WIM010',
    condition: 'intent ambiguity',
    template: 'We want to make sure we do what you intended.',
  },
];

/**
 * Get a "why it matters" explanation given the ambiguity type.
 */
export function getWhyItMatters(ambiguityType: string): string {
  const generator = WHY_IT_MATTERS_GENERATORS.find(
    g => g.condition.includes(ambiguityType) || ambiguityType.includes(g.condition.split(' ')[0]!),
  );
  return generator?.template ?? 'Different interpretations produce different results.';
}

// =============================================================================
// BATCH VALIDATION — Validate all templates
// =============================================================================

/**
 * Result of batch-validating all clarification templates.
 */
export interface BatchValidationResult {
  readonly totalChecked: number;
  readonly passed: number;
  readonly failed: number;
  readonly warnings: number;
  readonly failures: readonly {
    readonly templateId: string;
    readonly errors: readonly ClarificationValidationError[];
  }[];
}

/**
 * Validate a batch of clarifications.
 */
export function batchValidate(
  clarifications: readonly ValidatableClarification[],
): BatchValidationResult {
  let passed = 0;
  let failed = 0;
  let totalWarnings = 0;
  const failures: { templateId: string; errors: ClarificationValidationError[] }[] = [];

  for (let i = 0; i < clarifications.length; i++) {
    const result = validateClarification(clarifications[i]!);
    if (result.valid) {
      passed++;
    } else {
      failed++;
      failures.push({
        templateId: `item_${i}`,
        errors: [...result.errors],
      });
    }
    totalWarnings += result.warnings.length;
  }

  return {
    totalChecked: clarifications.length,
    passed,
    failed,
    warnings: totalWarnings,
    failures,
  };
}

// =============================================================================
// STATISTICS
// =============================================================================

export function getClarificationDefaultsStats(): {
  readonly generatorCount: number;
  readonly maxWhyLength: number;
  readonly maxQuestionLength: number;
  readonly maxOptions: number;
  readonly requiredStrategy: string;
} {
  return {
    generatorCount: WHY_IT_MATTERS_GENERATORS.length,
    maxWhyLength: MAX_WHY_IT_MATTERS_LENGTH,
    maxQuestionLength: MAX_QUESTION_LENGTH,
    maxOptions: MAX_RECOMMENDED_OPTIONS,
    requiredStrategy: REQUIRED_DEFAULT_STRATEGY,
  };
}
