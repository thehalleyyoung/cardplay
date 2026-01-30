/**
 * GOFAI NL Semantics — Event-to-CPL Bridge
 *
 * Maps neo-Davidsonian edit events (from event-semantics.ts) to CPL-Intent
 * nodes. This is the formal bridge between the linguistic representation
 * (events with thematic roles) and the planning representation (goals,
 * constraints, preferences, scopes).
 *
 * ## Mapping Rules
 *
 * 1. **Agent role** → Always implicit (user). Not represented in CPL-Intent
 *    because the system is single-user. Recorded in provenance.
 *
 * 2. **Patient role** → CPL-Intent scope/selector. The entity being changed.
 *    Example: "make the bass louder" → patient(e, bass) → selector(kind=track, value="bass")
 *
 * 3. **Theme role** → CPL goal target. What is being created/added.
 *    Example: "add reverb" → theme(e, reverb) → goal(variant=production, ...)
 *
 * 4. **Result role** → CPL goal axis+direction. The desired outcome.
 *    Example: "make it brighter" → result(e, brighter) → goal(axis=brightness, direction=increase)
 *
 * 5. **Degree role** → CPL amount. How much to change.
 *    Example: "raise it 3dB" → degree(e, 3dB) → amount(type=absolute, value=3, unit=dB)
 *
 * 6. **Location role** → CPL scope. Where the action applies.
 *    Example: "in the chorus" → location(e, chorus) → scope(sections=["chorus"])
 *
 * 7. **Instrument role** → CPL preference. What tool to use.
 *    Example: "using the parametric EQ" → instrument(e, parametric_eq) → preference(category=method)
 *
 * 8. **Purpose role** → CPL constraint or preference. Why/for what.
 *    Example: "to make room for vocals" → purpose(e, ...) → constraint or preference
 *
 * 9. **Manner role** → CPL preference or constraint. How to do it.
 *    Example: "gently" → manner(e, gentle) → preference(edit-style=gentle)
 *
 * 10. **Time role** → CPL scope time-range. When the action applies.
 *     Example: "in bars 16-24" → time(e, bars[16,24]) → scope(bars=[16,24])
 *
 * 11. **Negation** → CPL constraint (preserve). What NOT to change.
 *     Example: "don't change the melody" → negated creation → preserve(melody)
 *
 * 12. **Event relations** → CPL plan constraints (ordering, dependencies).
 *     Example: "then raise the volume" → sequence(e1, e2) → plan ordering
 *
 * @module gofai/nl/semantics/event-to-cpl
 * @see gofai_goalA.md Step 154
 */

import type {
  EditEvent,
  EditEventCategory,
  ThematicRoleKind,
  RoleFiller,
  EntityRoleValue,
  AxisRoleValue,
  DegreeRoleValue,
  ConstraintRoleValue,
  ScopeRoleValue,
  TimeRoleValue,
  MannerRoleValue,
  CompoundRoleValue,
  EventRelation,
  EventRelationType,
} from './event-semantics';

import type { SemanticVersion } from '../../canon/versioning';

import type {
  CPLIntent,
  CPLGoal,
  CPLConstraint,
  CPLPreference,
  CPLScope,
  CPLAmount,
  CPLHole,
  CPLSelector,
  CPLTimeRange,
} from '../../canon/cpl-types';


// =============================================================================
// Mapping Configuration
// =============================================================================

/**
 * Configuration for event-to-CPL mapping.
 */
export interface EventToCPLConfig {
  /** Default scope when no location/time role is specified */
  readonly defaultScope: 'current-selection' | 'entire-project' | 'ask';

  /** Default amount when no degree role is specified */
  readonly defaultAmount: CPLAmount;

  /** Whether to generate preserve constraints for negated events */
  readonly generatePreserveConstraints: boolean;

  /** Whether to generate preferences from manner roles */
  readonly generateMannerPreferences: boolean;

  /** Whether to generate preferences from instrument roles */
  readonly generateInstrumentPreferences: boolean;

  /** ID prefix for generated CPL nodes */
  readonly idPrefix: string;

  /** Schema version for generated CPL nodes */
  readonly schemaVersion: SemanticVersion;
}

/**
 * Default event-to-CPL configuration.
 */
export const DEFAULT_EVENT_TO_CPL_CONFIG: EventToCPLConfig = {
  defaultScope: 'current-selection',
  defaultAmount: {
    type: 'qualitative',
    qualifier: 'somewhat',
  },
  generatePreserveConstraints: true,
  generateMannerPreferences: true,
  generateInstrumentPreferences: true,
  idPrefix: 'cpl',
  schemaVersion: { major: 1, minor: 0, patch: 0 },
};


// =============================================================================
// Mapping Result
// =============================================================================

/**
 * Result of mapping an EditEvent to CPL-Intent components.
 */
export interface EventToCPLResult {
  /** Goals extracted from this event */
  readonly goals: readonly CPLGoal[];

  /** Constraints extracted from this event */
  readonly constraints: readonly CPLConstraint[];

  /** Preferences extracted from this event */
  readonly preferences: readonly CPLPreference[];

  /** Scope extracted from this event */
  readonly scope: CPLScope | null;

  /** Holes (unresolved aspects) */
  readonly holes: readonly CPLHole[];

  /** Provenance mapping: which roles mapped to which CPL nodes */
  readonly provenanceMap: readonly RoleToCPLMapping[];

  /** Warnings generated during mapping */
  readonly warnings: readonly string[];

  /** Event ordering constraints (for multi-event sequences) */
  readonly orderingConstraints: readonly OrderingConstraint[];
}

/**
 * Provenance: maps a thematic role to the CPL node(s) it produced.
 */
export interface RoleToCPLMapping {
  /** Source event variable */
  readonly eventVar: string;

  /** Source role */
  readonly role: ThematicRoleKind;

  /** Target CPL node IDs */
  readonly cplNodeIds: readonly string[];

  /** Mapping rule that applied */
  readonly mappingRule: string;

  /** Confidence in the mapping */
  readonly confidence: number;
}

/**
 * Ordering constraint between events (for plan construction).
 */
export interface OrderingConstraint {
  /** First event variable */
  readonly beforeEvent: string;

  /** Second event variable */
  readonly afterEvent: string;

  /** Relation type */
  readonly relationType: EventRelationType;

  /** Whether this ordering is strict (must hold) or preferred */
  readonly strict: boolean;
}


// =============================================================================
// Core Mapping Functions
// =============================================================================

/** Counter for generating unique IDs */
let idCounter = 0;

function nextId(prefix: string): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Reset the ID counter (for testing).
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Map a single EditEvent to CPL-Intent components.
 */
export function mapEventToCPL(
  event: EditEvent,
  config: EventToCPLConfig = DEFAULT_EVENT_TO_CPL_CONFIG
): EventToCPLResult {
  const goals: CPLGoal[] = [];
  const constraints: CPLConstraint[] = [];
  const preferences: CPLPreference[] = [];
  const holes: CPLHole[] = [];
  const provenanceMap: RoleToCPLMapping[] = [];
  const warnings: string[] = [];
  const orderingConstraints: OrderingConstraint[] = [];

  // 1. Map the event verb + category to a goal variant
  const goalVariant = mapEventCategoryToGoalVariant(event.category);

  // 2. Extract patient role → scope/selector
  let scope: CPLScope | null = null;
  const patientRole = getRole(event, 'patient');
  if (patientRole) {
    const selector = mapRoleToSelector(patientRole, config);
    if (selector) {
      scope = {
        type: 'scope',
        id: nextId(config.idPrefix),
        entities: selector,
      };
      provenanceMap.push({
        eventVar: event.eventVar,
        role: 'patient',
        cplNodeIds: [scope.id],
        mappingRule: 'patient → scope.entities',
        confidence: patientRole.confidence,
      });
    }
  }

  // 3. Extract location role → scope (merge with patient scope)
  const locationRole = getRole(event, 'location');
  if (locationRole) {
    const locationScope = mapRoleToScopeExtension(locationRole, config);
    if (locationScope) {
      if (scope) {
        // Merge location into existing scope
        scope = mergeScopes(scope, locationScope, config);
      } else {
        scope = locationScope;
      }
      provenanceMap.push({
        eventVar: event.eventVar,
        role: 'location',
        cplNodeIds: [scope.id],
        mappingRule: 'location → scope',
        confidence: locationRole.confidence,
      });
    }
  }

  // 4. Extract time role → scope time-range
  const timeRole = getRole(event, 'time');
  if (timeRole) {
    const timeRange = mapRoleToTimeRange(timeRole, config);
    if (timeRange) {
      if (scope) {
        scope = {
          ...scope,
          timeRange,
        };
      } else {
        scope = {
          type: 'scope',
          id: nextId(config.idPrefix),
          timeRange,
        };
      }
      provenanceMap.push({
        eventVar: event.eventVar,
        role: 'time',
        cplNodeIds: [scope.id],
        mappingRule: 'time → scope.timeRange',
        confidence: timeRole.confidence,
      });
    }
  }

  // 5. Apply default scope if none specified
  if (!scope) {
    if (config.defaultScope === 'ask') {
      holes.push({
        type: 'hole',
        id: nextId(config.idPrefix),
        holeKind: 'missing-scope',
        priority: 'medium',
        question: 'What should this apply to?',
      });
    } else {
      scope = createDefaultScope(config);
    }
  }

  // 6. Extract result role → goal (axis + direction)
  const resultRole = getRole(event, 'result');
  if (resultRole) {
    const goal = mapResultToGoal(resultRole, goalVariant, scope, config);
    if (goal) {
      goals.push(goal);
      provenanceMap.push({
        eventVar: event.eventVar,
        role: 'result',
        cplNodeIds: [goal.id],
        mappingRule: 'result → goal (axis+direction)',
        confidence: resultRole.confidence,
      });
    }
  }

  // 7. Extract theme role → goal (what to add/create)
  const themeRole = getRole(event, 'theme');
  if (themeRole) {
    const goal = mapThemeToGoal(themeRole, goalVariant, scope, config);
    if (goal) {
      goals.push(goal);
      provenanceMap.push({
        eventVar: event.eventVar,
        role: 'theme',
        cplNodeIds: [goal.id],
        mappingRule: 'theme → goal (creation/production)',
        confidence: themeRole.confidence,
      });
    }
  }

  // 8. Extract degree role → amount (applied to goals)
  const degreeRole = getRole(event, 'degree');
  if (degreeRole) {
    const amount = mapDegreeToAmount(degreeRole);
    if (amount) {
      // Apply amount to goals
      for (let i = 0; i < goals.length; i++) {
        if (!goals[i]!.targetValue) {
          goals[i] = {
            ...goals[i]!,
            targetValue: amount,
          };
        }
      }
      provenanceMap.push({
        eventVar: event.eventVar,
        role: 'degree',
        cplNodeIds: goals.map(g => g.id),
        mappingRule: 'degree → goal.targetValue',
        confidence: degreeRole.confidence,
      });
    }
  } else if (goals.length > 0 && goals.some(g => !g.targetValue)) {
    // No degree specified — apply default amount
    for (let i = 0; i < goals.length; i++) {
      if (!goals[i]!.targetValue) {
        goals[i] = {
          ...goals[i]!,
          targetValue: config.defaultAmount,
        };
      }
    }
  }

  // 9. Handle negation → preserve constraint
  if (event.negated && config.generatePreserveConstraints) {
    const preserveConstraint = createNegationConstraint(event, config);
    if (preserveConstraint) {
      constraints.push(preserveConstraint);
      provenanceMap.push({
        eventVar: event.eventVar,
        role: 'patient',
        cplNodeIds: [preserveConstraint.id],
        mappingRule: 'negation → preserve constraint',
        confidence: 0.9,
      });
    }
  }

  // 10. Extract manner role → preference
  if (config.generateMannerPreferences) {
    const mannerRole = getRole(event, 'manner');
    if (mannerRole) {
      const pref = mapMannerToPreference(mannerRole, config);
      if (pref) {
        preferences.push(pref);
        provenanceMap.push({
          eventVar: event.eventVar,
          role: 'manner',
          cplNodeIds: [pref.id],
          mappingRule: 'manner → preference',
          confidence: mannerRole.confidence,
        });
      }
    }
  }

  // 11. Extract instrument role → preference
  if (config.generateInstrumentPreferences) {
    const instrumentRole = getRole(event, 'instrument');
    if (instrumentRole) {
      const pref = mapInstrumentToPreference(instrumentRole, config);
      if (pref) {
        preferences.push(pref);
        provenanceMap.push({
          eventVar: event.eventVar,
          role: 'instrument',
          cplNodeIds: [pref.id],
          mappingRule: 'instrument → preference',
          confidence: instrumentRole.confidence,
        });
      }
    }
  }

  // 12. Extract purpose role → constraint or preference
  const purposeRole = getRole(event, 'purpose');
  if (purposeRole) {
    const purposeResult = mapPurposeToConstraintOrPreference(purposeRole, config);
    if (purposeResult.constraint) constraints.push(purposeResult.constraint);
    if (purposeResult.preference) preferences.push(purposeResult.preference);
    provenanceMap.push({
      eventVar: event.eventVar,
      role: 'purpose',
      cplNodeIds: [
        ...(purposeResult.constraint ? [purposeResult.constraint.id] : []),
        ...(purposeResult.preference ? [purposeResult.preference.id] : []),
      ],
      mappingRule: 'purpose → constraint/preference',
      confidence: purposeRole.confidence,
    });
  }

  // 13. Map event relations → ordering constraints
  for (const relation of event.relations) {
    orderingConstraints.push(mapRelationToOrdering(event.eventVar, relation));
  }

  // 14. Check for empty result
  if (goals.length === 0 && !event.negated) {
    warnings.push(
      `Event '${event.eventVar}' (${event.verb.lemma}) produced no goals. ` +
      `This may indicate an unmapped verb or missing roles.`
    );
  }

  return {
    goals,
    constraints,
    preferences,
    scope,
    holes,
    provenanceMap,
    warnings,
    orderingConstraints,
  };
}

/**
 * Map multiple EditEvents to a complete CPL-Intent.
 */
export function mapEventsToCPLIntent(
  events: readonly EditEvent[],
  config: EventToCPLConfig = DEFAULT_EVENT_TO_CPL_CONFIG
): {
  readonly intent: CPLIntent;
  readonly provenanceMaps: readonly RoleToCPLMapping[];
  readonly orderingConstraints: readonly OrderingConstraint[];
  readonly warnings: readonly string[];
} {
  const allGoals: CPLGoal[] = [];
  const allConstraints: CPLConstraint[] = [];
  const allPreferences: CPLPreference[] = [];
  const allHoles: CPLHole[] = [];
  const allProvenance: RoleToCPLMapping[] = [];
  const allOrderings: OrderingConstraint[] = [];
  const allWarnings: string[] = [];

  // Map each event
  let mergedScope: CPLScope | null = null;
  for (const event of events) {
    const result = mapEventToCPL(event, config);
    allGoals.push(...result.goals);
    allConstraints.push(...result.constraints);
    allPreferences.push(...result.preferences);
    allHoles.push(...result.holes);
    allProvenance.push(...result.provenanceMap);
    allOrderings.push(...result.orderingConstraints);
    allWarnings.push(...result.warnings);

    if (result.scope) {
      if (mergedScope) {
        mergedScope = mergeScopes(mergedScope, result.scope, config);
      } else {
        mergedScope = result.scope;
      }
    }
  }

  // Build the CPL-Intent
  const intent: CPLIntent = {
    type: 'intent',
    id: nextId(config.idPrefix),
    goals: allGoals,
    constraints: allConstraints,
    preferences: allPreferences,
    ...(mergedScope ? { scope: mergedScope } : {}),
    ...(allHoles.length > 0 ? { holes: allHoles } : {}),
    schemaVersion: config.schemaVersion,
    provenance: {
      origin: `event-to-cpl mapping from ${events.length} event(s)`,
    },
  };

  return {
    intent,
    provenanceMaps: allProvenance,
    orderingConstraints: allOrderings,
    warnings: allWarnings,
  };
}


// =============================================================================
// Role Extraction Helpers
// =============================================================================

/**
 * Get a specific role from an event.
 */
function getRole(event: EditEvent, role: ThematicRoleKind): RoleFiller | null {
  return event.roles.get(role) ?? null;
}

/**
 * Map event category to CPL goal variant.
 */
function mapEventCategoryToGoalVariant(
  category: EditEventCategory
): 'axis-goal' | 'structural-goal' | 'production-goal' {
  switch (category) {
    case 'transformation':
    case 'preservation':
      return 'axis-goal';
    case 'creation':
    case 'destruction':
    case 'movement':
    case 'duplication':
    case 'combination':
    case 'separation':
      return 'structural-goal';
    case 'inspection':
    case 'reversal':
      return 'production-goal';
    default:
      return 'axis-goal';
  }
}


// =============================================================================
// Role-to-CPL Mapping Functions
// =============================================================================

/**
 * Map a patient role filler to a CPL selector.
 */
function mapRoleToSelector(
  role: RoleFiller,
  config: EventToCPLConfig
): CPLSelector | null {
  const value = role.filler;

  switch (value.kind) {
    case 'entity': {
      const ev = value as EntityRoleValue;
      return {
        type: 'selector',
        id: nextId(config.idPrefix),
        kind: mapEntityTypeToSelectorKind(ev.entityType),
        value: ev.name,
      };
    }

    case 'scope': {
      const sv = value as ScopeRoleValue;
      return {
        type: 'selector',
        id: nextId(config.idPrefix),
        kind: sv.isGlobal ? 'all' : 'role',
        value: sv.target,
      };
    }

    case 'compound': {
      const cv = value as CompoundRoleValue;
      const subSelectors = cv.values
        .map(v => mapRoleToSelector({ ...role, filler: v }, config))
        .filter((s): s is CPLSelector => s !== null);

      if (subSelectors.length === 0) return null;
      if (subSelectors.length === 1) return subSelectors[0]!;

      return {
        type: 'selector',
        id: nextId(config.idPrefix),
        kind: 'all',
        combinator: cv.junction === 'conjunction' ? 'and' : 'or',
        selectors: subSelectors,
      };
    }

    case 'unresolved':
      return null;

    default:
      return null;
  }
}

/**
 * Map entity type to selector kind.
 */
function mapEntityTypeToSelectorKind(
  entityType: string
): CPLSelector['kind'] {
  switch (entityType) {
    case 'track':
    case 'channel':
      return 'track';
    case 'layer':
      return 'layer';
    case 'section':
      return 'role';
    case 'card':
      return 'card';
    case 'role':
    case 'instrument':
      return 'role';
    case 'tag':
      return 'tag';
    default:
      return 'role';
  }
}

/**
 * Map a location role to a scope extension.
 */
function mapRoleToScopeExtension(
  role: RoleFiller,
  config: EventToCPLConfig
): CPLScope | null {
  const value = role.filler;

  if (value.kind === 'scope') {
    const sv = value as ScopeRoleValue;
    return {
      type: 'scope',
      id: nextId(config.idPrefix),
      entities: {
        type: 'selector',
        id: nextId(config.idPrefix),
        kind: 'role',
        value: sv.target,
      },
    };
  }

  if (value.kind === 'entity') {
    const ev = value as EntityRoleValue;
    if (ev.entityType === 'section') {
      return {
        type: 'scope',
        id: nextId(config.idPrefix),
        timeRange: {
          type: 'time-range',
          id: nextId(config.idPrefix),
          sections: [ev.name],
        },
      };
    }
    return {
      type: 'scope',
      id: nextId(config.idPrefix),
      entities: {
        type: 'selector',
        id: nextId(config.idPrefix),
        kind: mapEntityTypeToSelectorKind(ev.entityType),
        value: ev.name,
      },
    };
  }

  return null;
}

/**
 * Map a time role to a CPL time-range.
 */
function mapRoleToTimeRange(
  role: RoleFiller,
  config: EventToCPLConfig
): CPLTimeRange | null {
  const value = role.filler;

  if (value.kind === 'time') {
    const tv = value as TimeRoleValue;
    // Parse time value — simplified
    return {
      type: 'time-range',
      id: nextId(config.idPrefix),
      sections: [tv.value],
    };
  }

  if (value.kind === 'scope') {
    const sv = value as ScopeRoleValue;
    return {
      type: 'time-range',
      id: nextId(config.idPrefix),
      sections: [sv.target],
    };
  }

  return null;
}

/**
 * Map a result role to a CPL goal.
 */
function mapResultToGoal(
  role: RoleFiller,
  goalVariant: 'axis-goal' | 'structural-goal' | 'production-goal',
  scope: CPLScope | null,
  config: EventToCPLConfig
): CPLGoal | null {
  const value = role.filler;

  if (value.kind === 'axis') {
    const av = value as AxisRoleValue;
    return {
      type: 'goal',
      id: nextId(config.idPrefix),
      variant: 'axis-goal',
      axis: av.axisName,
      direction: av.direction,
      ...(scope ? { scope } : {}),
    };
  }

  if (value.kind === 'entity') {
    const ev = value as EntityRoleValue;
    return {
      type: 'goal',
      id: nextId(config.idPrefix),
      variant: goalVariant,
      axis: ev.name,
      direction: 'set',
      ...(scope ? { scope } : {}),
    };
  }

  if (value.kind === 'degree') {
    const dv = value as DegreeRoleValue;
    return {
      type: 'goal',
      id: nextId(config.idPrefix),
      variant: 'axis-goal',
      direction: dv.intensity > 0 ? 'increase' : 'decrease',
      targetValue: {
        type: dv.absoluteValue !== null ? 'absolute' : 'relative',
        value: dv.absoluteValue ?? Math.abs(dv.intensity),
        ...(dv.unit ? { unit: dv.unit } : {}),
      },
      ...(scope ? { scope } : {}),
    };
  }

  if (value.kind === 'unresolved') {
    return {
      type: 'goal',
      id: nextId(config.idPrefix),
      variant: goalVariant,
      ...(scope ? { scope } : {}),
    };
  }

  return null;
}

/**
 * Map a theme role to a CPL goal.
 */
function mapThemeToGoal(
  role: RoleFiller,
  goalVariant: 'axis-goal' | 'structural-goal' | 'production-goal',
  scope: CPLScope | null,
  config: EventToCPLConfig
): CPLGoal | null {
  const value = role.filler;

  if (value.kind === 'entity') {
    const ev = value as EntityRoleValue;
    return {
      type: 'goal',
      id: nextId(config.idPrefix),
      variant: goalVariant,
      axis: ev.name,
      ...(scope ? { scope } : {}),
    };
  }

  if (value.kind === 'axis') {
    const av = value as AxisRoleValue;
    return {
      type: 'goal',
      id: nextId(config.idPrefix),
      variant: 'axis-goal',
      axis: av.axisName,
      direction: av.direction,
      ...(scope ? { scope } : {}),
    };
  }

  return null;
}

/**
 * Map a degree role to a CPL amount.
 */
function mapDegreeToAmount(role: RoleFiller): CPLAmount | null {
  const value = role.filler;

  if (value.kind === 'degree') {
    const dv = value as DegreeRoleValue;
    if (dv.absoluteValue !== null) {
      return {
        type: 'absolute',
        value: dv.absoluteValue,
        ...(dv.unit ? { unit: dv.unit } : {}),
      };
    }
    // Map intensity level to qualitative amount
    const qualifierMap: Record<string, CPLAmount['qualifier']> = {
      'slight': 'slightly',
      'a bit': 'a-little',
      'moderate': 'somewhat',
      'a lot': 'much',
      'completely': 'completely',
    };
    return {
      type: 'qualitative',
      qualifier: qualifierMap[dv.level] ?? 'somewhat',
    };
  }

  return null;
}

/**
 * Create a preserve constraint from a negated event.
 */
function createNegationConstraint(
  event: EditEvent,
  config: EventToCPLConfig
): CPLConstraint | null {
  const patient = getRole(event, 'patient');
  if (!patient) return null;

  const patientName = patient.filler.kind === 'entity'
    ? (patient.filler as EntityRoleValue).name
    : 'target';

  return {
    type: 'constraint',
    id: nextId(config.idPrefix),
    variant: 'preserve',
    strength: 'hard',
    description: `Don't ${event.verb.lemma} ${patientName}`,
    provenance: {
      span: [event.provenance.span.start, event.provenance.span.end],
      origin: `Negation of ${event.verb.lemma}`,
    },
  };
}

/**
 * Map a manner role to a CPL preference.
 */
function mapMannerToPreference(
  role: RoleFiller,
  config: EventToCPLConfig
): CPLPreference | null {
  const value = role.filler;

  if (value.kind === 'manner') {
    const mv = value as MannerRoleValue;
    return {
      type: 'preference',
      id: nextId(config.idPrefix),
      category: 'edit-style',
      value: mv.description,
      weight: role.confidence,
    };
  }

  return null;
}

/**
 * Map an instrument role to a CPL preference.
 */
function mapInstrumentToPreference(
  role: RoleFiller,
  config: EventToCPLConfig
): CPLPreference | null {
  const value = role.filler;

  if (value.kind === 'entity') {
    const ev = value as EntityRoleValue;
    return {
      type: 'preference',
      id: nextId(config.idPrefix),
      category: 'method-preference',
      value: ev.name,
      weight: role.confidence,
    };
  }

  return null;
}

/**
 * Map a purpose role to a constraint or preference.
 */
function mapPurposeToConstraintOrPreference(
  role: RoleFiller,
  config: EventToCPLConfig
): {
  readonly constraint: CPLConstraint | null;
  readonly preference: CPLPreference | null;
} {
  const value = role.filler;

  if (value.kind === 'constraint') {
    const cv = value as ConstraintRoleValue;
    return {
      constraint: {
        type: 'constraint',
        id: nextId(config.idPrefix),
        variant: 'preserve',
        strength: 'soft',
        description: `Purpose: ${cv.target}`,
      },
      preference: null,
    };
  }

  // Default: treat as a soft preference
  const description = value.kind === 'entity'
    ? (value as EntityRoleValue).name
    : value.kind === 'manner'
      ? (value as MannerRoleValue).description
      : 'unspecified purpose';

  return {
    constraint: null,
    preference: {
      type: 'preference',
      id: nextId(config.idPrefix),
      category: 'cost-preference',
      value: description,
      weight: role.confidence * 0.5,
    },
  };
}

/**
 * Map an event relation to an ordering constraint.
 */
function mapRelationToOrdering(
  eventVar: string,
  relation: EventRelation
): OrderingConstraint {
  const strict = relation.type === 'sequence' || relation.type === 'condition';

  return {
    beforeEvent: eventVar,
    afterEvent: relation.otherEventVar,
    relationType: relation.type,
    strict,
  };
}


// =============================================================================
// Scope Merging
// =============================================================================

/**
 * Merge two CPL scopes.
 *
 * The second scope is more specific and takes priority for time ranges.
 * Entity selectors are combined with AND.
 */
function mergeScopes(
  base: CPLScope,
  overlay: CPLScope,
  config: EventToCPLConfig
): CPLScope {
  const timeRange = overlay.timeRange ?? base.timeRange;
  const entities = base.entities && overlay.entities
    ? {
        type: 'selector' as const,
        id: nextId(config.idPrefix),
        kind: 'all' as const,
        combinator: 'and' as const,
        selectors: [base.entities, overlay.entities],
      }
    : overlay.entities ?? base.entities;
  const exclude = overlay.exclude ?? base.exclude;

  return {
    type: 'scope',
    id: nextId(config.idPrefix),
    ...(timeRange ? { timeRange } : {}),
    ...(entities ? { entities } : {}),
    ...(exclude ? { exclude } : {}),
  };
}

/**
 * Create a default scope based on configuration.
 */
function createDefaultScope(config: EventToCPLConfig): CPLScope {
  return {
    type: 'scope',
    id: nextId(config.idPrefix),
    entities: {
      type: 'selector',
      id: nextId(config.idPrefix),
      kind: 'all',
    },
  };
}


// =============================================================================
// Formatting and Debugging
// =============================================================================

/**
 * Format a provenance map for debugging.
 */
export function formatProvenanceMap(
  mappings: readonly RoleToCPLMapping[]
): string {
  const lines: string[] = ['=== Event → CPL Provenance ==='];

  for (const m of mappings) {
    lines.push(
      `  ${m.eventVar}.${m.role} → [${m.cplNodeIds.join(', ')}] ` +
      `via "${m.mappingRule}" (${(m.confidence * 100).toFixed(0)}%)`
    );
  }

  return lines.join('\n');
}

/**
 * Format an EventToCPLResult for debugging.
 */
export function formatEventToCPLResult(result: EventToCPLResult): string {
  const lines: string[] = ['=== Event → CPL Result ==='];

  lines.push(`Goals: ${result.goals.length}`);
  for (const g of result.goals) {
    lines.push(`  ${g.id}: ${g.variant} (axis=${g.axis ?? 'none'}, dir=${g.direction ?? 'none'})`);
  }

  lines.push(`Constraints: ${result.constraints.length}`);
  for (const c of result.constraints) {
    lines.push(`  ${c.id}: ${c.variant} — ${c.description}`);
  }

  lines.push(`Preferences: ${result.preferences.length}`);
  for (const p of result.preferences) {
    lines.push(`  ${p.id}: ${p.category} = ${p.value} (weight=${p.weight})`);
  }

  if (result.scope) {
    lines.push(`Scope: ${result.scope.id}`);
  } else {
    lines.push('Scope: (none)');
  }

  lines.push(`Holes: ${result.holes.length}`);
  lines.push(`Ordering constraints: ${result.orderingConstraints.length}`);

  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of result.warnings) {
      lines.push(`  ! ${w}`);
    }
  }

  return lines.join('\n');
}
