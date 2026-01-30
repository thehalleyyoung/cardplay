/**
 * GOFAI NL Semantics — CPL Type Checking & Validation
 *
 * Steps 181–185:
 *   181: CPL well-formedness checker (missing fields, unknown tags/opcodes/axes)
 *   182: CPL effect checker (inspect ≠ mutation)
 *   183: CPL capability checker (disabled capabilities)
 *   184: Numeric field refinement validations (BPM, semitones, amounts)
 *   185: Bidirectional typechecking (grammar semantics ↔ CPL AST)
 *
 * @module gofai/nl/semantics/cpl-typechecking
 */

import type {
  CPLNode,
  CPLNodeType,
  CPLIntent,
  CPLGoal,
  CPLConstraint,
  CPLPreference,
  CPLScope,
  CPLTimeRange,
  CPLSelector,
  CPLAmount,
  CPLPlan,
  CPLOpcode,
  CPLHole,
} from '../../canon/cpl-types';

// =============================================================================
// § 181 — CPL Well-Formedness Checker
// =============================================================================

/**
 * Severity level for well-formedness issues.
 */
export type WFSeverity = 'error' | 'warning' | 'info';

/**
 * A well-formedness diagnostic.
 */
export interface WFDiagnostic {
  /** Severity */
  readonly severity: WFSeverity;
  /** Error code */
  readonly code: WFErrorCode;
  /** Human-readable message */
  readonly message: string;
  /** Path to the problematic node (dot-separated) */
  readonly path: string;
  /** CPL node ID (if available) */
  readonly nodeId?: string;
  /** Suggested fix (if available) */
  readonly suggestion?: string;
}

/**
 * Well-formedness error codes.
 */
export type WFErrorCode =
  // Missing required fields
  | 'WF001_MISSING_TYPE'
  | 'WF002_MISSING_ID'
  | 'WF003_MISSING_VARIANT'
  | 'WF004_MISSING_GOALS'
  | 'WF005_MISSING_CONSTRAINTS'
  | 'WF006_MISSING_PREFERENCES'
  | 'WF007_MISSING_SCHEMA_VERSION'
  | 'WF008_MISSING_STRENGTH'
  | 'WF009_MISSING_DESCRIPTION'
  | 'WF010_MISSING_CATEGORY'
  | 'WF011_MISSING_VALUE'
  | 'WF012_MISSING_WEIGHT'
  | 'WF013_MISSING_OPCODES'
  | 'WF014_MISSING_OPCODE_ID'
  | 'WF015_MISSING_SCOPE'
  | 'WF016_MISSING_PARAMS'
  // Unknown values
  | 'WF100_UNKNOWN_NODE_TYPE'
  | 'WF101_UNKNOWN_VARIANT'
  | 'WF102_UNKNOWN_AXIS'
  | 'WF103_UNKNOWN_OPCODE'
  | 'WF104_UNKNOWN_SELECTOR_KIND'
  | 'WF105_UNKNOWN_ENTITY_TYPE'
  | 'WF106_UNKNOWN_CATEGORY'
  | 'WF107_UNKNOWN_AMOUNT_TYPE'
  | 'WF108_UNKNOWN_QUALIFIER'
  | 'WF109_UNKNOWN_DIRECTION'
  | 'WF110_UNKNOWN_CONSTRAINT_VARIANT'
  // Structural issues
  | 'WF200_EMPTY_GOALS'
  | 'WF201_EMPTY_OPCODES'
  | 'WF202_DUPLICATE_IDS'
  | 'WF203_CIRCULAR_SCOPE'
  | 'WF204_INVALID_TIME_RANGE'
  | 'WF205_OVERLAPPING_SCOPES'
  // Type mismatches
  | 'WF300_TYPE_MISMATCH'
  | 'WF301_AMOUNT_TYPE_MISMATCH'
  | 'WF302_SCOPE_TYPE_MISMATCH';

/**
 * Result of a well-formedness check.
 */
export interface WFCheckResult {
  /** Overall validity (no errors) */
  readonly valid: boolean;
  /** All diagnostics */
  readonly diagnostics: readonly WFDiagnostic[];
  /** Error count */
  readonly errorCount: number;
  /** Warning count */
  readonly warningCount: number;
  /** Info count */
  readonly infoCount: number;
}

/**
 * Configuration for the well-formedness checker.
 */
export interface WFCheckConfig {
  /** Known axis names */
  readonly knownAxes: ReadonlySet<string>;
  /** Known opcode IDs */
  readonly knownOpcodes: ReadonlySet<string>;
  /** Known selector kinds */
  readonly knownSelectorKinds: ReadonlySet<string>;
  /** Known entity types */
  readonly knownEntityTypes: ReadonlySet<string>;
  /** Whether to check for unknown axes (lenient mode skips this) */
  readonly strictAxes: boolean;
  /** Whether to check for unknown opcodes */
  readonly strictOpcodes: boolean;
  /** Whether to allow empty goals list */
  readonly allowEmptyGoals: boolean;
}

/**
 * Default known axes.
 */
export const DEFAULT_KNOWN_AXES: ReadonlySet<string> = new Set([
  'brightness', 'warmth', 'density', 'spaciousness', 'tension',
  'energy', 'complexity', 'weight', 'depth', 'width',
  'clarity', 'aggression', 'smoothness', 'sharpness', 'fullness',
  'thinness', 'presence', 'air', 'mud', 'harshness',
  'punch', 'impact', 'shimmer', 'grittiness', 'lushness',
]);

/**
 * Default known opcodes.
 */
export const DEFAULT_KNOWN_OPCODES: ReadonlySet<string> = new Set([
  // Event opcodes
  'event.create', 'event.delete', 'event.move', 'event.resize',
  'event.transpose', 'event.velocity', 'event.quantize',
  'event.humanize', 'event.legato', 'event.staccato',
  // Structure opcodes
  'structure.section.create', 'structure.section.delete',
  'structure.section.move', 'structure.section.resize',
  'structure.section.duplicate', 'structure.section.split',
  'structure.track.create', 'structure.track.delete',
  'structure.track.rename', 'structure.track.reorder',
  // Routing opcodes
  'routing.volume', 'routing.pan', 'routing.send',
  'routing.mute', 'routing.solo', 'routing.bus',
  // Production opcodes
  'production.eq', 'production.compress', 'production.reverb',
  'production.delay', 'production.saturate', 'production.limit',
  'production.gate', 'production.deess',
  // DSP opcodes
  'dsp.filter', 'dsp.modulate', 'dsp.distort',
  'dsp.pitch-shift', 'dsp.time-stretch',
  // Metadata opcodes
  'metadata.tempo', 'metadata.time-signature', 'metadata.key',
  'metadata.marker', 'metadata.tag',
]);

/**
 * Default known selector kinds.
 */
export const DEFAULT_KNOWN_SELECTOR_KINDS: ReadonlySet<string> = new Set([
  'all', 'track', 'layer', 'role', 'tag', 'card', 'event-type',
]);

/**
 * Default known entity types.
 */
export const DEFAULT_KNOWN_ENTITY_TYPES: ReadonlySet<string> = new Set([
  'track', 'section', 'marker', 'card', 'deck', 'board',
]);

/**
 * Default well-formedness check config.
 */
export const DEFAULT_WF_CONFIG: WFCheckConfig = {
  knownAxes: DEFAULT_KNOWN_AXES,
  knownOpcodes: DEFAULT_KNOWN_OPCODES,
  knownSelectorKinds: DEFAULT_KNOWN_SELECTOR_KINDS,
  knownEntityTypes: DEFAULT_KNOWN_ENTITY_TYPES,
  strictAxes: true,
  strictOpcodes: true,
  allowEmptyGoals: false,
};

/**
 * Known goal variants.
 */
const KNOWN_GOAL_VARIANTS: ReadonlySet<string> = new Set([
  'axis-goal', 'structural-goal', 'production-goal',
]);

/**
 * Known constraint variants.
 */
const KNOWN_CONSTRAINT_VARIANTS: ReadonlySet<string> = new Set([
  'preserve', 'only-change', 'range', 'relation', 'structural',
]);

/**
 * Known directions.
 */
const KNOWN_DIRECTIONS: ReadonlySet<string> = new Set([
  'increase', 'decrease', 'set',
]);

/**
 * Known amount types.
 */
const KNOWN_AMOUNT_TYPES: ReadonlySet<string> = new Set([
  'absolute', 'relative', 'percentage', 'qualitative',
]);

/**
 * Known qualifiers.
 */
const KNOWN_QUALIFIERS: ReadonlySet<string> = new Set([
  'a-little', 'somewhat', 'much', 'completely', 'slightly',
]);

/**
 * Known preference categories.
 */
const KNOWN_PREFERENCE_CATEGORIES: ReadonlySet<string> = new Set([
  'edit-style', 'layer-preference', 'method-preference', 'cost-preference',
]);

/**
 * Check well-formedness of a CPL intent.
 */
export function checkCPLWellFormedness(
  intent: CPLIntent,
  config: WFCheckConfig = DEFAULT_WF_CONFIG,
): WFCheckResult {
  const diagnostics: WFDiagnostic[] = [];
  const seenIds = new Set<string>();

  // Check intent-level fields
  checkRequiredField(diagnostics, intent, 'type', 'intent', 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, intent, 'id', 'intent', 'WF002_MISSING_ID');

  if (intent.type !== 'intent') {
    diagnostics.push({
      severity: 'error',
      code: 'WF300_TYPE_MISMATCH',
      message: `Expected type "intent" but got "${intent.type}"`,
      path: 'intent.type',
      nodeId: intent.id,
    });
  }

  if (!intent.schemaVersion) {
    diagnostics.push({
      severity: 'warning',
      code: 'WF007_MISSING_SCHEMA_VERSION',
      message: 'Missing schema version',
      path: 'intent.schemaVersion',
      nodeId: intent.id,
      suggestion: 'Add schemaVersion field for forward compatibility',
    });
  }

  // Track IDs for duplicate detection
  trackId(diagnostics, seenIds, intent.id, 'intent');

  // Check goals
  if (!intent.goals) {
    diagnostics.push({
      severity: 'error',
      code: 'WF004_MISSING_GOALS',
      message: 'Intent missing required "goals" array',
      path: 'intent.goals',
      nodeId: intent.id,
    });
  } else {
    if (intent.goals.length === 0 && !config.allowEmptyGoals) {
      diagnostics.push({
        severity: 'warning',
        code: 'WF200_EMPTY_GOALS',
        message: 'Intent has empty goals array — is this intentional?',
        path: 'intent.goals',
        nodeId: intent.id,
      });
    }
    for (let i = 0; i < intent.goals.length; i++) {
      const goal = intent.goals[i];
      if (goal) {
        checkGoalWF(diagnostics, goal, `intent.goals[${i}]`, config, seenIds);
      }
    }
  }

  // Check constraints
  if (!intent.constraints) {
    diagnostics.push({
      severity: 'error',
      code: 'WF005_MISSING_CONSTRAINTS',
      message: 'Intent missing required "constraints" array',
      path: 'intent.constraints',
      nodeId: intent.id,
    });
  } else {
    for (let i = 0; i < intent.constraints.length; i++) {
      const constraint = intent.constraints[i];
      if (constraint) {
        checkConstraintWF(diagnostics, constraint, `intent.constraints[${i}]`, seenIds);
      }
    }
  }

  // Check preferences
  if (!intent.preferences) {
    diagnostics.push({
      severity: 'error',
      code: 'WF006_MISSING_PREFERENCES',
      message: 'Intent missing required "preferences" array',
      path: 'intent.preferences',
      nodeId: intent.id,
    });
  } else {
    for (let i = 0; i < intent.preferences.length; i++) {
      const pref = intent.preferences[i];
      if (pref) {
        checkPreferenceWF(diagnostics, pref, `intent.preferences[${i}]`, seenIds);
      }
    }
  }

  // Check scope
  if (intent.scope) {
    checkScopeWF(diagnostics, intent.scope, 'intent.scope', config, seenIds);
  }

  // Check holes
  if (intent.holes) {
    for (let i = 0; i < intent.holes.length; i++) {
      const hole = intent.holes[i];
      if (hole) {
        checkHoleWF(diagnostics, hole, `intent.holes[${i}]`, seenIds);
      }
    }
  }

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = diagnostics.filter(d => d.severity === 'info').length;

  return {
    valid: errorCount === 0,
    diagnostics,
    errorCount,
    warningCount,
    infoCount,
  };
}

/**
 * Check a goal node for well-formedness.
 */
function checkGoalWF(
  diagnostics: WFDiagnostic[],
  goal: CPLGoal,
  path: string,
  config: WFCheckConfig,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, goal, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, goal, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, goal.id, path);

  if (!goal.variant) {
    diagnostics.push({
      severity: 'error',
      code: 'WF003_MISSING_VARIANT',
      message: 'Goal missing required "variant" field',
      path: `${path}.variant`,
      nodeId: goal.id,
    });
  } else if (!KNOWN_GOAL_VARIANTS.has(goal.variant)) {
    diagnostics.push({
      severity: 'error',
      code: 'WF101_UNKNOWN_VARIANT',
      message: `Unknown goal variant "${goal.variant}". Known: ${[...KNOWN_GOAL_VARIANTS].join(', ')}`,
      path: `${path}.variant`,
      nodeId: goal.id,
    });
  }

  // Axis goal checks
  if (goal.variant === 'axis-goal') {
    if (goal.axis && config.strictAxes && !config.knownAxes.has(goal.axis)) {
      diagnostics.push({
        severity: 'warning',
        code: 'WF102_UNKNOWN_AXIS',
        message: `Unknown axis "${goal.axis}". This may be a custom or extension axis.`,
        path: `${path}.axis`,
        nodeId: goal.id,
      });
    }

    if (goal.direction && !KNOWN_DIRECTIONS.has(goal.direction)) {
      diagnostics.push({
        severity: 'error',
        code: 'WF109_UNKNOWN_DIRECTION',
        message: `Unknown direction "${goal.direction}". Known: increase, decrease, set`,
        path: `${path}.direction`,
        nodeId: goal.id,
      });
    }

    if (goal.targetValue) {
      checkAmountWF(diagnostics, goal.targetValue, `${path}.targetValue`, goal.id);
    }
  }

  if (goal.scope) {
    checkScopeWF(diagnostics, goal.scope, `${path}.scope`, config, seenIds);
  }
}

/**
 * Check a constraint node for well-formedness.
 */
function checkConstraintWF(
  diagnostics: WFDiagnostic[],
  constraint: CPLConstraint,
  path: string,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, constraint, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, constraint, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, constraint.id, path);

  if (!constraint.variant) {
    diagnostics.push({
      severity: 'error',
      code: 'WF003_MISSING_VARIANT',
      message: 'Constraint missing required "variant" field',
      path: `${path}.variant`,
      nodeId: constraint.id,
    });
  } else if (!KNOWN_CONSTRAINT_VARIANTS.has(constraint.variant)) {
    diagnostics.push({
      severity: 'error',
      code: 'WF110_UNKNOWN_CONSTRAINT_VARIANT',
      message: `Unknown constraint variant "${constraint.variant}". Known: ${[...KNOWN_CONSTRAINT_VARIANTS].join(', ')}`,
      path: `${path}.variant`,
      nodeId: constraint.id,
    });
  }

  if (!constraint.strength) {
    diagnostics.push({
      severity: 'error',
      code: 'WF008_MISSING_STRENGTH',
      message: 'Constraint missing required "strength" field',
      path: `${path}.strength`,
      nodeId: constraint.id,
    });
  }

  if (!constraint.description) {
    diagnostics.push({
      severity: 'warning',
      code: 'WF009_MISSING_DESCRIPTION',
      message: 'Constraint missing "description" field (recommended for error messages)',
      path: `${path}.description`,
      nodeId: constraint.id,
    });
  }
}

/**
 * Check a preference node for well-formedness.
 */
function checkPreferenceWF(
  diagnostics: WFDiagnostic[],
  pref: CPLPreference,
  path: string,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, pref, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, pref, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, pref.id, path);

  if (!pref.category) {
    diagnostics.push({
      severity: 'error',
      code: 'WF010_MISSING_CATEGORY',
      message: 'Preference missing required "category" field',
      path: `${path}.category`,
      nodeId: pref.id,
    });
  } else if (!KNOWN_PREFERENCE_CATEGORIES.has(pref.category)) {
    diagnostics.push({
      severity: 'warning',
      code: 'WF106_UNKNOWN_CATEGORY',
      message: `Unknown preference category "${pref.category}". Known: ${[...KNOWN_PREFERENCE_CATEGORIES].join(', ')}`,
      path: `${path}.category`,
      nodeId: pref.id,
    });
  }

  if (pref.value === undefined || pref.value === null) {
    diagnostics.push({
      severity: 'error',
      code: 'WF011_MISSING_VALUE',
      message: 'Preference missing required "value" field',
      path: `${path}.value`,
      nodeId: pref.id,
    });
  }

  if (pref.weight === undefined || pref.weight === null) {
    diagnostics.push({
      severity: 'error',
      code: 'WF012_MISSING_WEIGHT',
      message: 'Preference missing required "weight" field',
      path: `${path}.weight`,
      nodeId: pref.id,
    });
  } else if (pref.weight < 0 || pref.weight > 1) {
    diagnostics.push({
      severity: 'warning',
      code: 'WF301_AMOUNT_TYPE_MISMATCH',
      message: `Preference weight ${pref.weight} outside expected range [0, 1]`,
      path: `${path}.weight`,
      nodeId: pref.id,
    });
  }
}

/**
 * Check a scope node for well-formedness.
 */
function checkScopeWF(
  diagnostics: WFDiagnostic[],
  scope: CPLScope,
  path: string,
  config: WFCheckConfig,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, scope, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, scope, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, scope.id, path);

  if (scope.type !== 'scope') {
    diagnostics.push({
      severity: 'error',
      code: 'WF300_TYPE_MISMATCH',
      message: `Expected type "scope" but got "${scope.type}"`,
      path: `${path}.type`,
      nodeId: scope.id,
    });
  }

  if (scope.timeRange) {
    checkTimeRangeWF(diagnostics, scope.timeRange, `${path}.timeRange`, seenIds);
  }

  if (scope.entities) {
    checkSelectorWF(diagnostics, scope.entities, `${path}.entities`, config, seenIds);
  }

  if (scope.exclude) {
    checkSelectorWF(diagnostics, scope.exclude, `${path}.exclude`, config, seenIds);
  }
}

/**
 * Check a time range for well-formedness.
 */
function checkTimeRangeWF(
  diagnostics: WFDiagnostic[],
  tr: CPLTimeRange,
  path: string,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, tr, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, tr, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, tr.id, path);

  if (tr.start !== undefined && tr.end !== undefined && tr.start > tr.end) {
    diagnostics.push({
      severity: 'error',
      code: 'WF204_INVALID_TIME_RANGE',
      message: `Invalid time range: start (${tr.start}) > end (${tr.end})`,
      path,
      nodeId: tr.id,
    });
  }

  if (tr.bars) {
    const [startBar, endBar] = tr.bars;
    if (startBar !== undefined && endBar !== undefined && startBar > endBar) {
      diagnostics.push({
        severity: 'error',
        code: 'WF204_INVALID_TIME_RANGE',
        message: `Invalid bar range: start (${startBar}) > end (${endBar})`,
        path: `${path}.bars`,
        nodeId: tr.id,
      });
    }
  }
}

/**
 * Check a selector for well-formedness.
 */
function checkSelectorWF(
  diagnostics: WFDiagnostic[],
  selector: CPLSelector,
  path: string,
  config: WFCheckConfig,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, selector, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, selector, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, selector.id, path);

  if (!config.knownSelectorKinds.has(selector.kind)) {
    diagnostics.push({
      severity: 'warning',
      code: 'WF104_UNKNOWN_SELECTOR_KIND',
      message: `Unknown selector kind "${selector.kind}". Known: ${[...config.knownSelectorKinds].join(', ')}`,
      path: `${path}.kind`,
      nodeId: selector.id,
    });
  }

  // Recursive check for sub-selectors
  if (selector.selectors) {
    for (let i = 0; i < selector.selectors.length; i++) {
      const sub = selector.selectors[i];
      if (sub) {
        checkSelectorWF(diagnostics, sub, `${path}.selectors[${i}]`, config, seenIds);
      }
    }
  }
}

/**
 * Check a hole for well-formedness.
 */
function checkHoleWF(
  diagnostics: WFDiagnostic[],
  hole: CPLHole,
  path: string,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, hole, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, hole, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, hole.id, path);

  if (!hole.question) {
    diagnostics.push({
      severity: 'warning',
      code: 'WF009_MISSING_DESCRIPTION',
      message: 'Hole missing "question" field',
      path: `${path}.question`,
      nodeId: hole.id,
    });
  }
}

/**
 * Check an amount for well-formedness.
 */
function checkAmountWF(
  diagnostics: WFDiagnostic[],
  amount: CPLAmount,
  path: string,
  parentNodeId?: string,
): void {
  if (!KNOWN_AMOUNT_TYPES.has(amount.type)) {
    diagnostics.push(Object.assign(
      {
        severity: 'error' as const,
        code: 'WF107_UNKNOWN_AMOUNT_TYPE' as const,
        message: `Unknown amount type "${amount.type}". Known: ${[...KNOWN_AMOUNT_TYPES].join(', ')}`,
        path: `${path}.type`,
      },
      parentNodeId ? { nodeId: parentNodeId } : {},
    ));
  }

  if (amount.qualifier && !KNOWN_QUALIFIERS.has(amount.qualifier)) {
    diagnostics.push(Object.assign(
      {
        severity: 'warning' as const,
        code: 'WF108_UNKNOWN_QUALIFIER' as const,
        message: `Unknown qualifier "${amount.qualifier}". Known: ${[...KNOWN_QUALIFIERS].join(', ')}`,
        path: `${path}.qualifier`,
      },
      parentNodeId ? { nodeId: parentNodeId } : {},
    ));
  }

  if (amount.range) {
    const [lo, hi] = amount.range;
    if (lo !== undefined && hi !== undefined && lo > hi) {
      diagnostics.push(Object.assign(
        {
          severity: 'error' as const,
          code: 'WF301_AMOUNT_TYPE_MISMATCH' as const,
          message: `Invalid range: low (${lo}) > high (${hi})`,
          path: `${path}.range`,
        },
        parentNodeId ? { nodeId: parentNodeId } : {},
      ));
    }
  }
}

// Utility helpers

function checkRequiredField(
  diagnostics: WFDiagnostic[],
  obj: object,
  field: string,
  path: string,
  code: WFErrorCode,
): void {
  const rec = obj as Record<string, unknown>;
  if (rec[field] === undefined || rec[field] === null || rec[field] === '') {
    diagnostics.push({
      severity: 'error',
      code,
      message: `Missing required field "${field}" at ${path}`,
      path: `${path}.${field}`,
    });
  }
}

function trackId(
  diagnostics: WFDiagnostic[],
  seenIds: Set<string>,
  id: string,
  path: string,
): void {
  if (!id) return;
  if (seenIds.has(id)) {
    diagnostics.push({
      severity: 'error',
      code: 'WF202_DUPLICATE_IDS',
      message: `Duplicate ID "${id}" at ${path}`,
      path,
      nodeId: id,
    });
  }
  seenIds.add(id);
}

// =============================================================================
// § 181 (cont.) — Plan Well-Formedness
// =============================================================================

/**
 * Check well-formedness of a CPL plan.
 */
export function checkPlanWellFormedness(
  plan: CPLPlan,
  config: WFCheckConfig = DEFAULT_WF_CONFIG,
): WFCheckResult {
  const diagnostics: WFDiagnostic[] = [];
  const seenIds = new Set<string>();

  checkRequiredField(diagnostics, plan, 'type', 'plan', 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, plan, 'id', 'plan', 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, plan.id, 'plan');

  if (!plan.opcodes || plan.opcodes.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'WF201_EMPTY_OPCODES',
      message: 'Plan has no opcodes',
      path: 'plan.opcodes',
      nodeId: plan.id,
    });
  } else {
    for (let i = 0; i < plan.opcodes.length; i++) {
      const opcode = plan.opcodes[i];
      if (opcode) {
        checkOpcodeWF(diagnostics, opcode, `plan.opcodes[${i}]`, config, seenIds);
      }
    }
  }

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = diagnostics.filter(d => d.severity === 'info').length;

  return { valid: errorCount === 0, diagnostics, errorCount, warningCount, infoCount };
}

/**
 * Check an opcode for well-formedness.
 */
function checkOpcodeWF(
  diagnostics: WFDiagnostic[],
  opcode: CPLOpcode,
  path: string,
  config: WFCheckConfig,
  seenIds: Set<string>,
): void {
  checkRequiredField(diagnostics, opcode, 'type', path, 'WF001_MISSING_TYPE');
  checkRequiredField(diagnostics, opcode, 'id', path, 'WF002_MISSING_ID');
  trackId(diagnostics, seenIds, opcode.id, path);

  if (!opcode.opcodeId) {
    diagnostics.push({
      severity: 'error',
      code: 'WF014_MISSING_OPCODE_ID',
      message: 'Opcode missing "opcodeId"',
      path: `${path}.opcodeId`,
      nodeId: opcode.id,
    });
  } else if (config.strictOpcodes && !config.knownOpcodes.has(opcode.opcodeId)) {
    diagnostics.push({
      severity: 'warning',
      code: 'WF103_UNKNOWN_OPCODE',
      message: `Unknown opcode "${opcode.opcodeId}". This may be an extension opcode.`,
      path: `${path}.opcodeId`,
      nodeId: opcode.id,
    });
  }

  if (!opcode.scope) {
    diagnostics.push({
      severity: 'error',
      code: 'WF015_MISSING_SCOPE',
      message: 'Opcode missing required "scope"',
      path: `${path}.scope`,
      nodeId: opcode.id,
    });
  } else {
    checkScopeWF(diagnostics, opcode.scope, `${path}.scope`, config, seenIds);
  }
}

// =============================================================================
// § 182 — CPL Effect Checker (Inspect ≠ Mutation)
// =============================================================================

/**
 * Effect classification for CPL operations.
 */
export type EffectClass =
  | 'pure'      // No side effects (query, compute)
  | 'inspect'   // Read-only observation
  | 'mutation'  // Writes data
  | 'mixed';    // Both read and write

/**
 * Result of effect checking.
 */
export interface EffectCheckResult {
  /** Overall effect class */
  readonly overallEffect: EffectClass;
  /** Per-node effects */
  readonly nodeEffects: readonly NodeEffect[];
  /** Violations (e.g., inspect containing mutations) */
  readonly violations: readonly EffectViolation[];
  /** Is the plan safe (no violations)? */
  readonly safe: boolean;
}

/**
 * Per-node effect classification.
 */
export interface NodeEffect {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly effect: EffectClass;
  readonly reason: string;
}

/**
 * An effect violation.
 */
export interface EffectViolation {
  readonly nodeId: string;
  readonly expected: EffectClass;
  readonly actual: EffectClass;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Opcode categories and their effect classes.
 */
export const OPCODE_EFFECT_MAP: ReadonlyMap<string, EffectClass> = new Map([
  // Event opcodes — mutations
  ['event.create', 'mutation'],
  ['event.delete', 'mutation'],
  ['event.move', 'mutation'],
  ['event.resize', 'mutation'],
  ['event.transpose', 'mutation'],
  ['event.velocity', 'mutation'],
  ['event.quantize', 'mutation'],
  ['event.humanize', 'mutation'],
  ['event.legato', 'mutation'],
  ['event.staccato', 'mutation'],
  // Structure opcodes — mutations
  ['structure.section.create', 'mutation'],
  ['structure.section.delete', 'mutation'],
  ['structure.section.move', 'mutation'],
  ['structure.section.resize', 'mutation'],
  ['structure.section.duplicate', 'mutation'],
  ['structure.section.split', 'mutation'],
  ['structure.track.create', 'mutation'],
  ['structure.track.delete', 'mutation'],
  ['structure.track.rename', 'mutation'],
  ['structure.track.reorder', 'mutation'],
  // Routing opcodes — mutations
  ['routing.volume', 'mutation'],
  ['routing.pan', 'mutation'],
  ['routing.send', 'mutation'],
  ['routing.mute', 'mutation'],
  ['routing.solo', 'mutation'],
  ['routing.bus', 'mutation'],
  // Production opcodes — mutations
  ['production.eq', 'mutation'],
  ['production.compress', 'mutation'],
  ['production.reverb', 'mutation'],
  ['production.delay', 'mutation'],
  ['production.saturate', 'mutation'],
  ['production.limit', 'mutation'],
  ['production.gate', 'mutation'],
  ['production.deess', 'mutation'],
  // DSP opcodes — mutations
  ['dsp.filter', 'mutation'],
  ['dsp.modulate', 'mutation'],
  ['dsp.distort', 'mutation'],
  ['dsp.pitch-shift', 'mutation'],
  ['dsp.time-stretch', 'mutation'],
  // Metadata opcodes — mutations
  ['metadata.tempo', 'mutation'],
  ['metadata.time-signature', 'mutation'],
  ['metadata.key', 'mutation'],
  ['metadata.marker', 'mutation'],
  ['metadata.tag', 'mutation'],
  // Inspect opcodes — read-only
  ['inspect.list-tracks', 'inspect'],
  ['inspect.list-sections', 'inspect'],
  ['inspect.show-events', 'inspect'],
  ['inspect.analyze-spectrum', 'inspect'],
  ['inspect.analyze-dynamics', 'inspect'],
  ['inspect.count-events', 'inspect'],
  ['inspect.measure-loudness', 'inspect'],
  ['inspect.detect-key', 'inspect'],
  ['inspect.detect-tempo', 'inspect'],
  ['inspect.show-mix', 'inspect'],
]);

/**
 * Inspect-intent keywords: if the user's intent contains these, it should be inspect-only.
 */
export const INSPECT_INTENT_KEYWORDS: readonly string[] = [
  'show', 'list', 'display', 'tell me', 'what is', 'what are',
  'how many', 'analyze', 'check', 'measure', 'detect', 'find',
  'count', 'describe', 'report', 'inspect', 'look at', 'examine',
];

/**
 * Check effect safety of a CPL plan.
 */
export function checkEffects(
  plan: CPLPlan,
  expectedEffect: EffectClass = 'mutation',
): EffectCheckResult {
  const nodeEffects: NodeEffect[] = [];
  const violations: EffectViolation[] = [];

  let hasMutation = false;
  let hasInspect = false;

  for (const opcode of plan.opcodes) {
    const effect = OPCODE_EFFECT_MAP.get(opcode.opcodeId) ?? 'mutation'; // Default: mutation
    nodeEffects.push({
      nodeId: opcode.id,
      nodeType: opcode.opcodeId,
      effect,
      reason: `Opcode "${opcode.opcodeId}" is classified as ${effect}`,
    });

    if (effect === 'mutation') hasMutation = true;
    if (effect === 'inspect') hasInspect = true;

    // Check for violations
    if (expectedEffect === 'inspect' && effect === 'mutation') {
      violations.push({
        nodeId: opcode.id,
        expected: 'inspect',
        actual: 'mutation',
        message: `Opcode "${opcode.opcodeId}" is a mutation but the intent expects inspect-only. This is a safety violation.`,
        severity: 'error',
      });
    }

    if (expectedEffect === 'pure' && (effect === 'mutation' || effect === 'inspect')) {
      violations.push({
        nodeId: opcode.id,
        expected: 'pure',
        actual: effect,
        message: `Opcode "${opcode.opcodeId}" has side effects but pure computation was expected`,
        severity: 'error',
      });
    }
  }

  const overallEffect: EffectClass = hasMutation && hasInspect
    ? 'mixed'
    : hasMutation
    ? 'mutation'
    : hasInspect
    ? 'inspect'
    : 'pure';

  return {
    overallEffect,
    nodeEffects,
    violations,
    safe: violations.length === 0,
  };
}

/**
 * Detect if the intent text implies inspect-only.
 */
export function isInspectIntent(intentText: string): boolean {
  const lower = intentText.toLowerCase();
  return INSPECT_INTENT_KEYWORDS.some(kw => lower.includes(kw));
}

// =============================================================================
// § 183 — CPL Capability Checker
// =============================================================================

/**
 * A board capability: what the current board/project supports.
 */
export type BoardCapability =
  | 'event-editing'       // Can edit note events
  | 'structure-editing'   // Can edit sections/structure
  | 'routing'             // Can adjust routing (volume, pan, sends)
  | 'production'          // Can apply production effects (EQ, compression)
  | 'dsp'                 // Can apply DSP (filters, modulation)
  | 'metadata'            // Can edit metadata (tempo, key, markers)
  | 'midi-input'          // Has MIDI input capability
  | 'audio-recording'     // Can record audio
  | 'scoring'             // Can do notation/scoring
  | 'automation'          // Can create/edit automation
  | 'plugin-hosting'      // Can host plugins
  | 'surround'            // Supports surround/immersive
  | 'video-sync'          // Supports video synchronization
  | 'collaborative';      // Supports collaborative editing

/**
 * A capability profile for a board.
 */
export interface CapabilityProfile {
  /** Board type name */
  readonly boardType: string;
  /** Enabled capabilities */
  readonly enabled: ReadonlySet<BoardCapability>;
  /** Disabled capabilities */
  readonly disabled: ReadonlySet<BoardCapability>;
  /** Restricted capabilities (require confirmation) */
  readonly restricted: ReadonlySet<BoardCapability>;
  /** Capability reasons (why something is disabled) */
  readonly reasons: ReadonlyMap<BoardCapability, string>;
}

/**
 * Result of capability checking.
 */
export interface CapabilityCheckResult {
  /** Whether all required capabilities are available */
  readonly capable: boolean;
  /** Missing capabilities */
  readonly missing: readonly CapabilityMiss[];
  /** Restricted capabilities (available but require confirmation) */
  readonly restricted: readonly CapabilityRestriction[];
  /** Available capabilities used by this plan */
  readonly used: readonly BoardCapability[];
}

/**
 * A missing capability.
 */
export interface CapabilityMiss {
  readonly capability: BoardCapability;
  readonly requiredBy: string; // Node ID or description
  readonly reason: string;
  readonly suggestion?: string;
}

/**
 * A restricted capability.
 */
export interface CapabilityRestriction {
  readonly capability: BoardCapability;
  readonly requiredBy: string;
  readonly reason: string;
  readonly confirmationRequired: boolean;
}

/**
 * Map opcode categories to required capabilities.
 */
export const OPCODE_CAPABILITY_MAP: ReadonlyMap<string, BoardCapability> = new Map([
  ['event', 'event-editing'],
  ['structure', 'structure-editing'],
  ['routing', 'routing'],
  ['production', 'production'],
  ['dsp', 'dsp'],
  ['metadata', 'metadata'],
]);

/**
 * Predefined capability profiles.
 */
export const CAPABILITY_PROFILES: ReadonlyMap<string, CapabilityProfile> = new Map([
  ['full-daw', {
    boardType: 'Full DAW',
    enabled: new Set<BoardCapability>([
      'event-editing', 'structure-editing', 'routing', 'production',
      'dsp', 'metadata', 'midi-input', 'audio-recording',
      'automation', 'plugin-hosting',
    ]),
    disabled: new Set<BoardCapability>([]),
    restricted: new Set<BoardCapability>(['surround', 'video-sync', 'collaborative']),
    reasons: new Map<BoardCapability, string>([
      ['surround', 'Surround mixing requires special monitoring setup'],
      ['video-sync', 'Video sync requires video file to be loaded'],
      ['collaborative', 'Collaborative editing requires cloud connection'],
    ]),
  }],
  ['composer-board', {
    boardType: 'Composer Board',
    enabled: new Set<BoardCapability>([
      'event-editing', 'structure-editing', 'metadata', 'midi-input', 'scoring',
    ]),
    disabled: new Set<BoardCapability>([
      'production', 'dsp', 'audio-recording', 'surround', 'video-sync',
    ]),
    restricted: new Set<BoardCapability>(['routing', 'automation', 'plugin-hosting']),
    reasons: new Map<BoardCapability, string>([
      ['production', 'Composer board focuses on composition, not production'],
      ['dsp', 'DSP processing not available on composer board'],
      ['audio-recording', 'Audio recording not available on composer board'],
      ['routing', 'Basic routing only — advanced routing requires full DAW'],
      ['automation', 'Automation limited to tempo and dynamics on composer board'],
      ['plugin-hosting', 'Plugin hosting limited on composer board'],
    ]),
  }],
  ['mixing-board', {
    boardType: 'Mixing Board',
    enabled: new Set<BoardCapability>([
      'routing', 'production', 'dsp', 'metadata', 'automation', 'plugin-hosting',
    ]),
    disabled: new Set<BoardCapability>([
      'event-editing', 'structure-editing', 'midi-input', 'scoring',
    ]),
    restricted: new Set<BoardCapability>(['audio-recording', 'surround']),
    reasons: new Map<BoardCapability, string>([
      ['event-editing', 'Mixing board cannot edit note events — use composer board'],
      ['structure-editing', 'Structure editing not available on mixing board'],
      ['midi-input', 'MIDI input not available on mixing board'],
      ['scoring', 'Notation not available on mixing board'],
      ['audio-recording', 'Recording requires confirmation on mixing board'],
      ['surround', 'Surround mixing requires special monitoring setup'],
    ]),
  }],
  ['mastering-board', {
    boardType: 'Mastering Board',
    enabled: new Set<BoardCapability>([
      'production', 'dsp', 'metadata',
    ]),
    disabled: new Set<BoardCapability>([
      'event-editing', 'structure-editing', 'routing', 'midi-input',
      'audio-recording', 'scoring', 'automation', 'plugin-hosting',
    ]),
    restricted: new Set<BoardCapability>([]),
    reasons: new Map<BoardCapability, string>([
      ['event-editing', 'Mastering board works with stereo/stem files only'],
      ['structure-editing', 'Structure is locked on mastering board'],
      ['routing', 'Routing is fixed on mastering board (stereo in/out)'],
      ['midi-input', 'No MIDI on mastering board'],
      ['audio-recording', 'No recording on mastering board'],
      ['scoring', 'No notation on mastering board'],
      ['automation', 'Use mastering-specific controls instead'],
      ['plugin-hosting', 'Use built-in mastering chain instead'],
    ]),
  }],
]);

/**
 * Check capabilities of a plan against a board profile.
 */
export function checkCapabilities(
  plan: CPLPlan,
  profile: CapabilityProfile,
): CapabilityCheckResult {
  const missing: CapabilityMiss[] = [];
  const restricted: CapabilityRestriction[] = [];
  const used = new Set<BoardCapability>();

  for (const opcode of plan.opcodes) {
    const requiredCap = OPCODE_CAPABILITY_MAP.get(opcode.category);
    if (!requiredCap) continue;

    used.add(requiredCap);

    if (profile.disabled.has(requiredCap)) {
      const reason = profile.reasons.get(requiredCap) ?? `Capability "${requiredCap}" is disabled`;
      missing.push({
        capability: requiredCap,
        requiredBy: `${opcode.opcodeId} (${opcode.id})`,
        reason,
        suggestion: `Switch to a board type that supports ${requiredCap}`,
      });
    } else if (profile.restricted.has(requiredCap)) {
      const reason = profile.reasons.get(requiredCap) ?? `Capability "${requiredCap}" is restricted`;
      restricted.push({
        capability: requiredCap,
        requiredBy: `${opcode.opcodeId} (${opcode.id})`,
        reason,
        confirmationRequired: true,
      });
    }
  }

  return {
    capable: missing.length === 0,
    missing,
    restricted,
    used: [...used],
  };
}

// =============================================================================
// § 184 — Numeric Field Refinement Validations
// =============================================================================

/**
 * A numeric refinement rule.
 */
export interface NumericRefinementRule {
  /** Rule ID */
  readonly id: string;
  /** Field name or pattern */
  readonly field: string;
  /** Human-readable name */
  readonly name: string;
  /** Unit */
  readonly unit: string;
  /** Minimum value (inclusive) */
  readonly min: number;
  /** Maximum value (inclusive) */
  readonly max: number;
  /** Typical range (for warnings) */
  readonly typicalMin: number;
  /** Typical range (for warnings) */
  readonly typicalMax: number;
  /** Default value */
  readonly defaultValue: number;
  /** Whether the value must be an integer */
  readonly integer: boolean;
  /** Step size (if quantized) */
  readonly step?: number;
  /** Error message template */
  readonly errorTemplate: string;
  /** Warning message template */
  readonly warningTemplate: string;
}

/**
 * Database of numeric refinement rules.
 */
export const NUMERIC_REFINEMENT_RULES: readonly NumericRefinementRule[] = [
  {
    id: 'nr-bpm',
    field: 'bpm',
    name: 'Tempo (BPM)',
    unit: 'BPM',
    min: 1,
    max: 999,
    typicalMin: 40,
    typicalMax: 300,
    defaultValue: 120,
    integer: false,
    step: 0.1,
    errorTemplate: 'BPM value {value} is out of range [{min}, {max}]',
    warningTemplate: 'BPM value {value} is unusual — typical range is [{typicalMin}, {typicalMax}]',
  },
  {
    id: 'nr-semitones',
    field: 'semitones',
    name: 'Semitones',
    unit: 'st',
    min: -48,
    max: 48,
    typicalMin: -12,
    typicalMax: 12,
    defaultValue: 0,
    integer: true,
    errorTemplate: 'Semitone value {value} is out of range [{min}, {max}]',
    warningTemplate: 'Semitone value {value}st is large — typical range is [{typicalMin}, {typicalMax}]',
  },
  {
    id: 'nr-cents',
    field: 'cents',
    name: 'Cents',
    unit: 'cents',
    min: -100,
    max: 100,
    typicalMin: -50,
    typicalMax: 50,
    defaultValue: 0,
    integer: true,
    errorTemplate: 'Cents value {value} is out of range [{min}, {max}]',
    warningTemplate: 'Cents value {value} is large — typical range is [{typicalMin}, {typicalMax}]',
  },
  {
    id: 'nr-velocity',
    field: 'velocity',
    name: 'MIDI Velocity',
    unit: '',
    min: 0,
    max: 127,
    typicalMin: 20,
    typicalMax: 127,
    defaultValue: 80,
    integer: true,
    errorTemplate: 'Velocity {value} is out of MIDI range [0, 127]',
    warningTemplate: 'Velocity {value} is very low — consider if this is intentional',
  },
  {
    id: 'nr-pan',
    field: 'pan',
    name: 'Pan Position',
    unit: '',
    min: -1.0,
    max: 1.0,
    typicalMin: -1.0,
    typicalMax: 1.0,
    defaultValue: 0,
    integer: false,
    errorTemplate: 'Pan value {value} is out of range [-1.0, 1.0]',
    warningTemplate: 'Pan value {value} is at the extreme',
  },
  {
    id: 'nr-volume-db',
    field: 'volume_db',
    name: 'Volume (dB)',
    unit: 'dB',
    min: -Infinity,
    max: 12,
    typicalMin: -60,
    typicalMax: 6,
    defaultValue: 0,
    integer: false,
    step: 0.1,
    errorTemplate: 'Volume {value}dB exceeds maximum headroom ({max}dB)',
    warningTemplate: 'Volume {value}dB is unusual — typical range is [{typicalMin}, {typicalMax}] dB',
  },
  {
    id: 'nr-amount-pct',
    field: 'amount_percent',
    name: 'Amount (%)',
    unit: '%',
    min: 0,
    max: 100,
    typicalMin: 5,
    typicalMax: 95,
    defaultValue: 50,
    integer: false,
    errorTemplate: 'Amount {value}% is out of range [0, 100]',
    warningTemplate: 'Amount {value}% is at the extreme',
  },
  {
    id: 'nr-amount-norm',
    field: 'amount_normalized',
    name: 'Normalized Amount',
    unit: '',
    min: 0,
    max: 1.0,
    typicalMin: 0.05,
    typicalMax: 0.95,
    defaultValue: 0.5,
    integer: false,
    errorTemplate: 'Normalized amount {value} is out of range [0, 1]',
    warningTemplate: 'Normalized amount {value} is at the extreme',
  },
  {
    id: 'nr-frequency-hz',
    field: 'frequency_hz',
    name: 'Frequency (Hz)',
    unit: 'Hz',
    min: 20,
    max: 20000,
    typicalMin: 50,
    typicalMax: 16000,
    defaultValue: 1000,
    integer: false,
    errorTemplate: 'Frequency {value}Hz is outside audible range [{min}, {max}]',
    warningTemplate: 'Frequency {value}Hz is unusual — typical range is [{typicalMin}, {typicalMax}] Hz',
  },
  {
    id: 'nr-ratio',
    field: 'compression_ratio',
    name: 'Compression Ratio',
    unit: ':1',
    min: 1.0,
    max: 100.0,
    typicalMin: 1.5,
    typicalMax: 20.0,
    defaultValue: 4.0,
    integer: false,
    errorTemplate: 'Compression ratio {value}:1 is out of range [{min}, {max}]',
    warningTemplate: 'Compression ratio {value}:1 is extreme — typical range is [{typicalMin}, {typicalMax}]:1',
  },
  {
    id: 'nr-attack-ms',
    field: 'attack_ms',
    name: 'Attack Time (ms)',
    unit: 'ms',
    min: 0,
    max: 500,
    typicalMin: 0.1,
    typicalMax: 100,
    defaultValue: 10,
    integer: false,
    errorTemplate: 'Attack time {value}ms is out of range [{min}, {max}]',
    warningTemplate: 'Attack time {value}ms is unusual — typical range is [{typicalMin}, {typicalMax}] ms',
  },
  {
    id: 'nr-release-ms',
    field: 'release_ms',
    name: 'Release Time (ms)',
    unit: 'ms',
    min: 0,
    max: 5000,
    typicalMin: 10,
    typicalMax: 1000,
    defaultValue: 100,
    integer: false,
    errorTemplate: 'Release time {value}ms is out of range [{min}, {max}]',
    warningTemplate: 'Release time {value}ms is unusual — typical range is [{typicalMin}, {typicalMax}] ms',
  },
  {
    id: 'nr-bar-number',
    field: 'bar_number',
    name: 'Bar Number',
    unit: '',
    min: 1,
    max: 9999,
    typicalMin: 1,
    typicalMax: 500,
    defaultValue: 1,
    integer: true,
    errorTemplate: 'Bar number {value} is out of range [{min}, {max}]',
    warningTemplate: 'Bar number {value} is very high — is this intentional?',
  },
  {
    id: 'nr-beat-number',
    field: 'beat_number',
    name: 'Beat Number',
    unit: '',
    min: 1,
    max: 32,
    typicalMin: 1,
    typicalMax: 7,
    defaultValue: 1,
    integer: true,
    errorTemplate: 'Beat number {value} is out of range [{min}, {max}]',
    warningTemplate: 'Beat number {value} is unusual — most time signatures have [{typicalMin}, {typicalMax}] beats',
  },
  {
    id: 'nr-reverb-size',
    field: 'reverb_size',
    name: 'Reverb Size',
    unit: '',
    min: 0,
    max: 1.0,
    typicalMin: 0.1,
    typicalMax: 0.9,
    defaultValue: 0.5,
    integer: false,
    errorTemplate: 'Reverb size {value} is out of range [{min}, {max}]',
    warningTemplate: 'Reverb size {value} is at the extreme',
  },
  {
    id: 'nr-delay-ms',
    field: 'delay_ms',
    name: 'Delay Time (ms)',
    unit: 'ms',
    min: 0,
    max: 5000,
    typicalMin: 10,
    typicalMax: 2000,
    defaultValue: 250,
    integer: false,
    errorTemplate: 'Delay time {value}ms is out of range [{min}, {max}]',
    warningTemplate: 'Delay time {value}ms is unusual — typical range is [{typicalMin}, {typicalMax}] ms',
  },
];

/**
 * Numeric refinement rule index by field name.
 */
export const NUMERIC_RULE_INDEX: ReadonlyMap<string, NumericRefinementRule> = (() => {
  const index = new Map<string, NumericRefinementRule>();
  for (const rule of NUMERIC_REFINEMENT_RULES) {
    index.set(rule.field, rule);
  }
  return index;
})();

/**
 * Result of numeric validation.
 */
export interface NumericValidationResult {
  readonly valid: boolean;
  readonly field: string;
  readonly value: number;
  readonly rule: NumericRefinementRule;
  readonly error?: string;
  readonly warning?: string;
}

/**
 * Validate a numeric value against its refinement rule.
 */
export function validateNumericField(
  field: string,
  value: number,
  rule?: NumericRefinementRule,
): NumericValidationResult {
  const actualRule = rule ?? NUMERIC_RULE_INDEX.get(field);
  if (!actualRule) {
    return {
      valid: true,
      field,
      value,
      rule: {
        id: 'nr-unknown',
        field,
        name: field,
        unit: '',
        min: -Infinity,
        max: Infinity,
        typicalMin: -Infinity,
        typicalMax: Infinity,
        defaultValue: 0,
        integer: false,
        errorTemplate: '',
        warningTemplate: '',
      },
    };
  }

  const result: NumericValidationResult & { error?: string; warning?: string } = {
    valid: true,
    field,
    value,
    rule: actualRule,
  };

  // Check hard range
  if (value < actualRule.min || value > actualRule.max) {
    const errorMsg = formatTemplate(actualRule.errorTemplate, {
      value: String(value),
      min: String(actualRule.min),
      max: String(actualRule.max),
      typicalMin: String(actualRule.typicalMin),
      typicalMax: String(actualRule.typicalMax),
    });
    return { ...result, valid: false, error: errorMsg };
  }

  // Check integer constraint
  if (actualRule.integer && !Number.isInteger(value)) {
    return {
      ...result,
      valid: false,
      error: `${actualRule.name} must be an integer, got ${value}`,
    };
  }

  // Check step constraint
  if (actualRule.step !== undefined && actualRule.step > 0) {
    const remainder = Math.abs(value % actualRule.step);
    if (remainder > 0.0001 && remainder < actualRule.step - 0.0001) {
      return {
        ...result,
        warning: `${actualRule.name} value ${value} is not aligned to step ${actualRule.step}`,
      };
    }
  }

  // Check typical range
  if (value < actualRule.typicalMin || value > actualRule.typicalMax) {
    const warningMsg = formatTemplate(actualRule.warningTemplate, {
      value: String(value),
      min: String(actualRule.min),
      max: String(actualRule.max),
      typicalMin: String(actualRule.typicalMin),
      typicalMax: String(actualRule.typicalMax),
    });
    return { ...result, warning: warningMsg };
  }

  return result;
}

/**
 * Validate all numeric values in a CPL amount.
 */
export function validateCPLAmount(
  amount: CPLAmount,
  contextField?: string,
): readonly NumericValidationResult[] {
  const results: NumericValidationResult[] = [];

  if (amount.value !== undefined) {
    const field = contextField ?? (amount.unit ? `${amount.unit}_value` : 'amount_normalized');
    const rule = NUMERIC_RULE_INDEX.get(field);
    if (rule) {
      results.push(validateNumericField(field, amount.value, rule));
    }
  }

  if (amount.range) {
    const [lo, hi] = amount.range;
    if (lo !== undefined) {
      results.push(validateNumericField(contextField ?? 'range_lo', lo));
    }
    if (hi !== undefined) {
      results.push(validateNumericField(contextField ?? 'range_hi', hi));
    }
  }

  return results;
}

/**
 * Format a template string with values.
 */
function formatTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  }
  return result;
}

// =============================================================================
// § 185 — Bidirectional Typechecking (Grammar Semantics ↔ CPL AST)
// =============================================================================

/**
 * A type specification for a grammar semantic slot.
 */
export interface SemanticSlotType {
  /** Slot name (e.g., "axis", "direction", "amount") */
  readonly slot: string;
  /** Expected CPL type(s) */
  readonly expectedTypes: readonly string[];
  /** Whether the slot is required */
  readonly required: boolean;
  /** Whether multiple values are allowed */
  readonly multiple: boolean;
  /** Default value (if optional) */
  readonly defaultValue?: unknown;
  /** Human-readable description */
  readonly description: string;
}

/**
 * A grammar-to-CPL type mapping rule.
 */
export interface GrammarCPLTypeRule {
  /** Rule ID */
  readonly id: string;
  /** Grammar category (e.g., "verb.axis-change", "adj.affective") */
  readonly grammarCategory: string;
  /** Expected CPL node type */
  readonly expectedCPLType: CPLNodeType;
  /** Required semantic slots */
  readonly requiredSlots: readonly SemanticSlotType[];
  /** Optional semantic slots */
  readonly optionalSlots: readonly SemanticSlotType[];
  /** Compatibility notes */
  readonly notes: string;
}

/**
 * Database of grammar-to-CPL type rules.
 */
export const GRAMMAR_CPL_TYPE_RULES: readonly GrammarCPLTypeRule[] = [
  {
    id: 'gcr-axis-change',
    grammarCategory: 'verb.axis-change',
    expectedCPLType: 'goal',
    requiredSlots: [
      { slot: 'axis', expectedTypes: ['string'], required: true, multiple: false, description: 'Target axis name' },
      { slot: 'direction', expectedTypes: ['increase', 'decrease', 'set'], required: true, multiple: false, description: 'Direction of change' },
    ],
    optionalSlots: [
      { slot: 'amount', expectedTypes: ['CPLAmount'], required: false, multiple: false, description: 'Amount of change' },
      { slot: 'scope', expectedTypes: ['CPLScope'], required: false, multiple: false, description: 'Scope restriction' },
    ],
    notes: 'Verbs like "brighten", "darken", "widen" map to axis-goal with direction',
  },
  {
    id: 'gcr-structural-edit',
    grammarCategory: 'verb.structural-edit',
    expectedCPLType: 'goal',
    requiredSlots: [
      { slot: 'operation', expectedTypes: ['string'], required: true, multiple: false, description: 'Structural operation (add, remove, move, copy)' },
      { slot: 'target', expectedTypes: ['CPLSelector'], required: true, multiple: false, description: 'What to operate on' },
    ],
    optionalSlots: [
      { slot: 'destination', expectedTypes: ['CPLScope'], required: false, multiple: false, description: 'Destination for move/copy' },
      { slot: 'amount', expectedTypes: ['number'], required: false, multiple: false, description: 'Number of items' },
    ],
    notes: 'Verbs like "add", "remove", "move", "copy", "duplicate"',
  },
  {
    id: 'gcr-preservation',
    grammarCategory: 'verb.preserve',
    expectedCPLType: 'constraint',
    requiredSlots: [
      { slot: 'target', expectedTypes: ['CPLSelector'], required: true, multiple: false, description: 'What to preserve' },
    ],
    optionalSlots: [
      { slot: 'level', expectedTypes: ['exact', 'recognizable', 'functional', 'approximate'], required: false, multiple: false, defaultValue: 'exact', description: 'Preservation level' },
      { slot: 'scope', expectedTypes: ['CPLScope'], required: false, multiple: false, description: 'Scope of preservation' },
    ],
    notes: 'Verbs like "keep", "preserve", "maintain", "don\'t change"',
  },
  {
    id: 'gcr-inspect',
    grammarCategory: 'verb.inspect',
    expectedCPLType: 'goal',
    requiredSlots: [
      { slot: 'target', expectedTypes: ['CPLSelector', 'string'], required: true, multiple: false, description: 'What to inspect' },
    ],
    optionalSlots: [
      { slot: 'property', expectedTypes: ['string'], required: false, multiple: false, description: 'Specific property to inspect' },
      { slot: 'scope', expectedTypes: ['CPLScope'], required: false, multiple: false, description: 'Scope restriction' },
    ],
    notes: 'Verbs like "show", "list", "analyze", "check"',
  },
  {
    id: 'gcr-affective-adj',
    grammarCategory: 'adj.affective',
    expectedCPLType: 'goal',
    requiredSlots: [
      { slot: 'adjective', expectedTypes: ['string'], required: true, multiple: false, description: 'Affective adjective' },
    ],
    optionalSlots: [
      { slot: 'intensity', expectedTypes: ['number', 'CPLAmount'], required: false, multiple: false, description: 'Intensity modifier' },
      { slot: 'scope', expectedTypes: ['CPLScope'], required: false, multiple: false, description: 'Scope restriction' },
    ],
    notes: '"Make it brighter/darker/warmer" — adjective maps to axis bundle',
  },
  {
    id: 'gcr-scope-section',
    grammarCategory: 'noun.section-ref',
    expectedCPLType: 'scope',
    requiredSlots: [
      { slot: 'sectionName', expectedTypes: ['string'], required: true, multiple: false, description: 'Section name' },
    ],
    optionalSlots: [
      { slot: 'occurrence', expectedTypes: ['number'], required: false, multiple: false, description: 'Which occurrence (first, second, etc.)' },
      { slot: 'universal', expectedTypes: ['boolean'], required: false, multiple: false, defaultValue: false, description: 'Whether to match all occurrences' },
    ],
    notes: '"The chorus", "verse 2", "every bridge"',
  },
  {
    id: 'gcr-scope-barrange',
    grammarCategory: 'noun.bar-range',
    expectedCPLType: 'scope',
    requiredSlots: [
      { slot: 'startBar', expectedTypes: ['number'], required: true, multiple: false, description: 'Start bar number' },
      { slot: 'endBar', expectedTypes: ['number'], required: true, multiple: false, description: 'End bar number' },
    ],
    optionalSlots: [
      { slot: 'startBeat', expectedTypes: ['number'], required: false, multiple: false, description: 'Start beat within bar' },
      { slot: 'endBeat', expectedTypes: ['number'], required: false, multiple: false, description: 'End beat within bar' },
    ],
    notes: '"Bars 4-8", "from bar 1 to bar 16"',
  },
  {
    id: 'gcr-quantifier',
    grammarCategory: 'det.quantifier',
    expectedCPLType: 'selector',
    requiredSlots: [
      { slot: 'quantType', expectedTypes: ['all', 'some', 'no', 'every', 'the'], required: true, multiple: false, description: 'Quantifier type' },
    ],
    optionalSlots: [
      { slot: 'restriction', expectedTypes: ['CPLSelector'], required: false, multiple: false, description: 'Restriction on quantifier domain' },
    ],
    notes: '"All tracks", "every note", "some sections", "no drums"',
  },
  {
    id: 'gcr-amount-numeric',
    grammarCategory: 'num.amount',
    expectedCPLType: 'param-set',
    requiredSlots: [
      { slot: 'value', expectedTypes: ['number'], required: true, multiple: false, description: 'Numeric value' },
    ],
    optionalSlots: [
      { slot: 'unit', expectedTypes: ['string'], required: false, multiple: false, description: 'Unit (dB, st, %, ms, Hz, BPM)' },
      { slot: 'type', expectedTypes: ['absolute', 'relative', 'percentage'], required: false, multiple: false, defaultValue: 'absolute', description: 'Amount type' },
    ],
    notes: '"2 semitones", "50%", "3 dB", "120 BPM"',
  },
  {
    id: 'gcr-conjunction',
    grammarCategory: 'conj.coordination',
    expectedCPLType: 'intent',
    requiredSlots: [
      { slot: 'conjuncts', expectedTypes: ['CPLGoal[]', 'CPLConstraint[]'], required: true, multiple: true, description: 'Coordinated elements' },
    ],
    optionalSlots: [
      { slot: 'coordType', expectedTypes: ['and', 'or', 'but'], required: false, multiple: false, defaultValue: 'and', description: 'Coordination type' },
    ],
    notes: '"Brighter and wider", "louder but keep the bass"',
  },
];

/**
 * Grammar-CPL rule index by grammar category.
 */
export const GRAMMAR_CPL_RULE_INDEX: ReadonlyMap<string, GrammarCPLTypeRule> = (() => {
  const index = new Map<string, GrammarCPLTypeRule>();
  for (const rule of GRAMMAR_CPL_TYPE_RULES) {
    index.set(rule.grammarCategory, rule);
  }
  return index;
})();

/**
 * Result of bidirectional type checking.
 */
export interface BidirectionalTypeCheckResult {
  /** Overall validity */
  readonly valid: boolean;
  /** Slot-level diagnostics */
  readonly slotDiagnostics: readonly SlotDiagnostic[];
  /** Rule that was matched */
  readonly matchedRule?: GrammarCPLTypeRule;
  /** Summary */
  readonly summary: string;
}

/**
 * A diagnostic for a single semantic slot.
 */
export interface SlotDiagnostic {
  readonly slot: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly expected?: string;
  readonly actual?: string;
}

/**
 * Check a grammar semantic output against CPL type rules.
 *
 * @param grammarCategory - The grammar category (e.g., "verb.axis-change")
 * @param slots - The semantic slots filled by the grammar
 */
export function checkGrammarToCPL(
  grammarCategory: string,
  slots: ReadonlyMap<string, unknown>,
): BidirectionalTypeCheckResult {
  const rule = GRAMMAR_CPL_RULE_INDEX.get(grammarCategory);
  if (!rule) {
    return {
      valid: false,
      slotDiagnostics: [{
        slot: '(category)',
        severity: 'error',
        message: `Unknown grammar category "${grammarCategory}"`,
      }],
      summary: `No type rule for grammar category "${grammarCategory}"`,
    };
  }

  const diagnostics: SlotDiagnostic[] = [];

  // Check required slots
  for (const reqSlot of rule.requiredSlots) {
    if (!slots.has(reqSlot.slot)) {
      diagnostics.push({
        slot: reqSlot.slot,
        severity: 'error',
        message: `Required slot "${reqSlot.slot}" (${reqSlot.description}) is missing`,
        expected: reqSlot.expectedTypes.join(' | '),
      });
    } else {
      const value = slots.get(reqSlot.slot);
      checkSlotType(diagnostics, reqSlot, value);
    }
  }

  // Check optional slots
  for (const optSlot of rule.optionalSlots) {
    if (slots.has(optSlot.slot)) {
      const value = slots.get(optSlot.slot);
      checkSlotType(diagnostics, optSlot, value);
    }
  }

  // Check for unknown slots
  for (const [slotName] of slots) {
    const known = [...rule.requiredSlots, ...rule.optionalSlots].some(s => s.slot === slotName);
    if (!known) {
      diagnostics.push({
        slot: slotName,
        severity: 'warning',
        message: `Unknown slot "${slotName}" — not defined in rule "${rule.id}"`,
      });
    }
  }

  const hasErrors = diagnostics.some(d => d.severity === 'error');

  return {
    valid: !hasErrors,
    slotDiagnostics: diagnostics,
    matchedRule: rule,
    summary: hasErrors
      ? `Type check failed for "${grammarCategory}": ${diagnostics.filter(d => d.severity === 'error').map(d => d.message).join('; ')}`
      : `Type check passed for "${grammarCategory}"`,
  };
}

/**
 * Check a slot value against its expected type.
 */
function checkSlotType(
  diagnostics: SlotDiagnostic[],
  slot: SemanticSlotType,
  value: unknown,
): void {
  if (value === undefined || value === null) {
    if (slot.required) {
      diagnostics.push({
        slot: slot.slot,
        severity: 'error',
        message: `Required slot "${slot.slot}" has null/undefined value`,
        expected: slot.expectedTypes.join(' | '),
      });
    }
    return;
  }

  const actualType = typeof value;

  // Simple type checks
  const isTypeMatch = slot.expectedTypes.some(expected => {
    switch (expected) {
      case 'string': return actualType === 'string';
      case 'number': return actualType === 'number';
      case 'boolean': return actualType === 'boolean';
      default:
        // For union types like 'increase' | 'decrease' | 'set', check string value
        if (actualType === 'string') {
          return value === expected;
        }
        // For complex types like CPLScope, check if it's an object with a type field
        if (actualType === 'object' && value !== null) {
          const obj = value as Record<string, unknown>;
          if (expected === 'CPLScope') return obj['type'] === 'scope';
          if (expected === 'CPLSelector') return obj['type'] === 'selector';
          if (expected === 'CPLAmount') return 'type' in obj && typeof obj['value'] === 'number';
          if (expected.endsWith('[]')) return Array.isArray(value);
        }
        return false;
    }
  });

  if (!isTypeMatch) {
    diagnostics.push({
      slot: slot.slot,
      severity: 'error',
      message: `Slot "${slot.slot}" has incompatible type`,
      expected: slot.expectedTypes.join(' | '),
      actual: actualType === 'object' ? JSON.stringify(value).slice(0, 50) : String(value),
    });
  }
}

/**
 * Check CPL output back against grammar expectations (reverse direction).
 *
 * Given a CPL node, verify it matches one of the grammar rules.
 */
export function checkCPLToGrammar(
  cplNode: CPLNode,
): BidirectionalTypeCheckResult {
  // Find matching rules by CPL type
  const matchingRules = GRAMMAR_CPL_TYPE_RULES.filter(
    r => r.expectedCPLType === cplNode.type,
  );

  if (matchingRules.length === 0) {
    return {
      valid: true, // Unknown types are allowed (extension nodes)
      slotDiagnostics: [{
        slot: '(type)',
        severity: 'info',
        message: `CPL type "${cplNode.type}" has no corresponding grammar rule — may be an extension`,
      }],
      summary: `No grammar rule for CPL type "${cplNode.type}"`,
    };
  }

  // Try each matching rule, pick best
  let bestResult: BidirectionalTypeCheckResult | undefined;
  let bestErrorCount = Infinity;

  for (const rule of matchingRules) {
    const diagnostics: SlotDiagnostic[] = [];
    const nodeObj = cplNode as unknown as Record<string, unknown>;

    // Check required slots exist on the node
    for (const reqSlot of rule.requiredSlots) {
      if (!(reqSlot.slot in nodeObj)) {
        diagnostics.push({
          slot: reqSlot.slot,
          severity: 'error',
          message: `CPL node missing slot "${reqSlot.slot}" expected by grammar rule "${rule.grammarCategory}"`,
          expected: reqSlot.expectedTypes.join(' | '),
        });
      }
    }

    const errorCount = diagnostics.filter(d => d.severity === 'error').length;
    if (errorCount < bestErrorCount) {
      bestErrorCount = errorCount;
      bestResult = {
        valid: errorCount === 0,
        slotDiagnostics: diagnostics,
        matchedRule: rule,
        summary: errorCount === 0
          ? `CPL node matches grammar rule "${rule.grammarCategory}"`
          : `CPL node partially matches "${rule.grammarCategory}" but missing ${errorCount} slot(s)`,
      };
    }
  }

  return bestResult ?? {
    valid: false,
    slotDiagnostics: [],
    summary: 'No matching grammar rule found',
  };
}

// =============================================================================
// § Formatting and Reporting
// =============================================================================

/**
 * Format a well-formedness check result.
 */
export function formatWFCheck(result: WFCheckResult): string {
  const lines: string[] = [];
  const status = result.valid ? 'VALID' : 'INVALID';
  lines.push(`Well-formedness: ${status} (${result.errorCount} errors, ${result.warningCount} warnings, ${result.infoCount} info)`);

  for (const d of result.diagnostics) {
    const icon = d.severity === 'error' ? 'ERROR' : d.severity === 'warning' ? 'WARN' : 'INFO';
    lines.push(`  ${icon} [${d.code}] ${d.path}: ${d.message}`);
    if (d.suggestion) {
      lines.push(`    Suggestion: ${d.suggestion}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format an effect check result.
 */
export function formatEffectCheck(result: EffectCheckResult): string {
  const lines: string[] = [];
  lines.push(`Effect check: ${result.overallEffect} (${result.safe ? 'SAFE' : 'VIOLATIONS'})`);

  if (result.violations.length > 0) {
    lines.push('  Violations:');
    for (const v of result.violations) {
      lines.push(`    ${v.severity.toUpperCase()}: ${v.message}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a capability check result.
 */
export function formatCapabilityCheck(result: CapabilityCheckResult): string {
  const lines: string[] = [];
  lines.push(`Capability check: ${result.capable ? 'ALL CAPABLE' : 'MISSING CAPABILITIES'}`);
  lines.push(`  Used: ${result.used.join(', ')}`);

  if (result.missing.length > 0) {
    lines.push('  Missing:');
    for (const m of result.missing) {
      lines.push(`    ${m.capability}: ${m.reason}`);
      if (m.suggestion) {
        lines.push(`      Suggestion: ${m.suggestion}`);
      }
    }
  }

  if (result.restricted.length > 0) {
    lines.push('  Restricted:');
    for (const r of result.restricted) {
      lines.push(`    ${r.capability}: ${r.reason} (confirmation required: ${r.confirmationRequired})`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a bidirectional type check result.
 */
export function formatBidirectionalTypeCheck(result: BidirectionalTypeCheckResult): string {
  const lines: string[] = [];
  lines.push(`Bidirectional type check: ${result.valid ? 'PASS' : 'FAIL'}`);
  if (result.matchedRule) {
    lines.push(`  Rule: ${result.matchedRule.grammarCategory} → ${result.matchedRule.expectedCPLType}`);
  }
  lines.push(`  ${result.summary}`);

  for (const d of result.slotDiagnostics) {
    lines.push(`    ${d.severity.toUpperCase()} [${d.slot}]: ${d.message}`);
    if (d.expected) lines.push(`      Expected: ${d.expected}`);
    if (d.actual) lines.push(`      Actual: ${d.actual}`);
  }

  return lines.join('\n');
}
