/**
 * GOFAI NL Semantics — Event Semantics
 *
 * Implements neo-Davidsonian event semantics for edit actions.
 * Every edit command is modeled as an event with thematic roles:
 *
 * ```
 * "Add reverb to the chorus"
 * ∃e. add(e) ∧ agent(e, user) ∧ theme(e, reverb) ∧ location(e, chorus)
 *
 * "Make the bass brighter"
 * ∃e. change(e) ∧ agent(e, user) ∧ patient(e, bass) ∧ result(e, brighter)
 *
 * "Remove the drum fill and add a cymbal crash"
 * ∃e1. remove(e1) ∧ patient(e1, drum_fill)
 * ∧ ∃e2. add(e2) ∧ theme(e2, cymbal_crash)
 * ∧ sequence(e1, e2)
 * ```
 *
 * ## Why Neo-Davidsonian?
 *
 * 1. **Modularity**: Roles are independent conjuncts, so optional roles
 *    don't require type changes (unlike traditional Davidsonian).
 *
 * 2. **Underspecification**: Missing roles are just absent conjuncts,
 *    not type errors. "Add reverb" is valid even without a location.
 *
 * 3. **Composition**: Events compose naturally with coordination
 *    ("and", "then", "but") and temporal relations.
 *
 * 4. **Provenance**: Each role binding retains its source span, enabling
 *    the "why" affordance (why did this role get this value?).
 *
 * @module gofai/nl/semantics/event-semantics
 * @see gofai_goalA.md Step 136
 */

// =============================================================================
// EVENT TYPES — the formal model of edit actions
// =============================================================================

/**
 * A neo-Davidsonian edit event.
 */
export interface EditEvent {
  /** Unique event variable (e.g., "e1", "e2") */
  readonly eventVar: string;

  /** Event category (what kind of action) */
  readonly category: EditEventCategory;

  /** The verb that produced this event */
  readonly verb: EventVerb;

  /** Thematic roles (role → filler) */
  readonly roles: ReadonlyMap<string, RoleFiller>;

  /** Temporal/discourse relations to other events */
  readonly relations: readonly EventRelation[];

  /** Modifiers on the event (manner, degree, etc.) */
  readonly modifiers: readonly EventModifier[];

  /** Whether this event is negated ("don't remove") */
  readonly negated: boolean;

  /** Whether this event is hypothetical ("could add", "should make") */
  readonly modality: EventModality;

  /** Provenance: source spans */
  readonly provenance: EventProvenance;
}

/**
 * Edit event categories.
 */
export type EditEventCategory =
  | 'creation'         // add, create, insert, introduce
  | 'destruction'      // remove, delete, clear, strip
  | 'transformation'   // make, change, modify, adjust, set
  | 'movement'         // move, shift, swap, switch, rearrange
  | 'preservation'     // keep, maintain, preserve, retain
  | 'duplication'      // copy, duplicate, repeat, double
  | 'inspection'       // show, display, play, preview
  | 'reversal'         // undo, redo, revert, restore
  | 'combination'      // merge, blend, mix, combine
  | 'separation';      // split, separate, isolate, extract

/**
 * The verb that produced the event.
 */
export interface EventVerb {
  /** The canonical verb form */
  readonly lemma: string;

  /** The surface form used */
  readonly surface: string;

  /** The verb category */
  readonly category: EditEventCategory;

  /** The semantic action ID */
  readonly actionId: string;

  /** Span in source */
  readonly span: EventSpan;
}

/**
 * A span in source text.
 */
export interface EventSpan {
  readonly start: number;
  readonly end: number;
}

// =============================================================================
// THEMATIC ROLES — what participates in the event
// =============================================================================

/**
 * A filled thematic role.
 */
export interface RoleFiller {
  /** The role type */
  readonly role: ThematicRoleKind;

  /** The filler value */
  readonly filler: RoleValue;

  /** Whether this role was explicitly stated or inferred */
  readonly explicit: boolean;

  /** Confidence in this role binding (0–1) */
  readonly confidence: number;

  /** Provenance: where in the input this role was derived from */
  readonly span: EventSpan;
}

/**
 * Thematic role types in the neo-Davidsonian model.
 */
export type ThematicRoleKind =
  | 'agent'         // Who performs the action (always implicit: user)
  | 'patient'       // What is affected/changed
  | 'theme'         // What is created/added/moved
  | 'goal'          // Where something is moved/added to
  | 'source'        // Where something is moved/removed from
  | 'location'      // Where the action takes place (scope)
  | 'instrument'    // What tool/card is used
  | 'beneficiary'   // Who benefits from the action
  | 'result'        // What state results
  | 'manner'        // How the action is performed
  | 'degree'        // How much (scalar change)
  | 'time'          // When / duration
  | 'purpose'       // Why (goal/reason)
  | 'comitative'    // Together with (e.g., "add reverb along with delay")
  | 'cause';        // What caused this event

/**
 * A role filler value.
 */
export type RoleValue =
  | EntityRoleValue
  | AxisRoleValue
  | DegreeRoleValue
  | ConstraintRoleValue
  | ScopeRoleValue
  | TimeRoleValue
  | MannerRoleValue
  | CompoundRoleValue
  | UnresolvedRoleValue;

/**
 * An entity filler (section, layer, card, etc.).
 */
export interface EntityRoleValue {
  readonly kind: 'entity';
  readonly entityType: string;
  readonly name: string;
  readonly refId: string | null;
  readonly definite: boolean;
  readonly plural: boolean;
}

/**
 * An axis filler (perceptual axis).
 */
export interface AxisRoleValue {
  readonly kind: 'axis';
  readonly axisName: string;
  readonly direction: 'increase' | 'decrease';
}

/**
 * A degree filler (scalar change).
 */
export interface DegreeRoleValue {
  readonly kind: 'degree';
  readonly intensity: number;
  readonly level: string;
  readonly absoluteValue: number | null;
  readonly unit: string | null;
}

/**
 * A constraint filler (preservation, restriction).
 */
export interface ConstraintRoleValue {
  readonly kind: 'constraint';
  readonly constraintType: string;
  readonly target: string;
}

/**
 * A scope filler (where the action applies).
 */
export interface ScopeRoleValue {
  readonly kind: 'scope';
  readonly scopeType: string;
  readonly target: string;
  readonly isGlobal: boolean;
}

/**
 * A time filler.
 */
export interface TimeRoleValue {
  readonly kind: 'time';
  readonly timeType: string;
  readonly value: string;
}

/**
 * A manner filler.
 */
export interface MannerRoleValue {
  readonly kind: 'manner';
  readonly description: string;
}

/**
 * A compound filler (list of values for the same role).
 */
export interface CompoundRoleValue {
  readonly kind: 'compound';
  readonly values: readonly RoleValue[];
  readonly junction: 'conjunction' | 'disjunction';
}

/**
 * An unresolved filler (hole needing clarification).
 */
export interface UnresolvedRoleValue {
  readonly kind: 'unresolved';
  readonly expectedType: string;
  readonly reason: string;
  readonly defaultValue: RoleValue | null;
}

// =============================================================================
// EVENT RELATIONS — how events relate to each other
// =============================================================================

/**
 * A relation between two events.
 */
export interface EventRelation {
  /** The relation type */
  readonly type: EventRelationType;

  /** The other event's variable */
  readonly otherEventVar: string;

  /** Description */
  readonly description: string;
}

export type EventRelationType =
  | 'sequence'       // "and then" — e1 before e2
  | 'parallel'       // "and" — e1 alongside e2
  | 'contrast'       // "but" — e2 contrasts with e1
  | 'condition'      // "if ... then" — e2 conditional on e1
  | 'alternative'    // "or" — e1 or e2
  | 'elaboration'    // e2 elaborates on e1
  | 'correction'     // "actually" — e2 corrects e1
  | 'cause_effect';  // e1 causes e2

// =============================================================================
// EVENT MODIFIERS — adverbial modifications
// =============================================================================

/**
 * A modifier on an event.
 */
export interface EventModifier {
  /** The modifier type */
  readonly type: EventModifierType;

  /** The modifier value */
  readonly value: string;

  /** How the modifier affects the event */
  readonly effect: string;

  /** Span */
  readonly span: EventSpan;
}

export type EventModifierType =
  | 'manner'      // "quickly", "carefully", "gradually"
  | 'temporal'    // "first", "then", "before the chorus"
  | 'iterative'   // "again", "repeatedly"
  | 'additive'    // "also", "too", "as well"
  | 'restrictive' // "only", "just"
  | 'contrastive' // "instead", "rather"
  | 'emphatic';   // "definitely", "absolutely"

// =============================================================================
// EVENT MODALITY — hypothetical / deontic status
// =============================================================================

export type EventModality =
  | 'actual'        // Default: do this action
  | 'possible'      // "could", "can" — possible action
  | 'necessary'     // "must", "need to" — required action
  | 'suggested'     // "should", "might want to" — suggested
  | 'conditional'   // "if ... then" — conditional
  | 'hypothetical'; // "what if" — exploring

// =============================================================================
// EVENT PROVENANCE — tracking where the event came from
// =============================================================================

/**
 * Provenance information for an event.
 */
export interface EventProvenance {
  /** The source text that produced this event */
  readonly sourceText: string;

  /** Span of the entire event expression */
  readonly span: EventSpan;

  /** The rule IDs that contributed to this event */
  readonly ruleIds: readonly string[];

  /** The lexeme IDs that contributed */
  readonly lexemeIds: readonly string[];
}

// =============================================================================
// EVENT CONSTRUCTION — building events from parse results
// =============================================================================

let _nextEventVar = 0;

/**
 * Generate a fresh event variable.
 */
export function freshEventVar(): string {
  return `e${_nextEventVar++}`;
}

/**
 * Create an empty event with a verb.
 */
export function createEvent(
  verb: EventVerb,
  sourceText: string = '',
): EditEvent {
  return {
    eventVar: freshEventVar(),
    category: verb.category,
    verb,
    roles: new Map(),
    relations: [],
    modifiers: [],
    negated: false,
    modality: 'actual',
    provenance: {
      sourceText,
      span: verb.span,
      ruleIds: [],
      lexemeIds: [],
    },
  };
}

/**
 * Add a role to an event (returns a new event).
 */
export function addEventRole(
  event: EditEvent,
  role: ThematicRoleKind,
  filler: RoleValue,
  explicit: boolean = true,
  confidence: number = 1.0,
  span: EventSpan = { start: 0, end: 0 },
): EditEvent {
  const newRoles = new Map(event.roles);
  newRoles.set(role, {
    role,
    filler,
    explicit,
    confidence,
    span,
  });
  return { ...event, roles: newRoles };
}

/**
 * Add a relation to an event.
 */
export function addEventRelation(
  event: EditEvent,
  relation: EventRelation,
): EditEvent {
  return {
    ...event,
    relations: [...event.relations, relation],
  };
}

/**
 * Add a modifier to an event.
 */
export function addEventModifier(
  event: EditEvent,
  modifier: EventModifier,
): EditEvent {
  return {
    ...event,
    modifiers: [...event.modifiers, modifier],
  };
}

/**
 * Negate an event.
 */
export function negateEvent(event: EditEvent): EditEvent {
  return { ...event, negated: !event.negated };
}

/**
 * Set the modality of an event.
 */
export function setModality(
  event: EditEvent,
  modality: EventModality,
): EditEvent {
  return { ...event, modality };
}

// =============================================================================
// EVENT COMPOSITION — combining events
// =============================================================================

/**
 * A compound event structure: multiple events with relations.
 */
export interface EventStructure {
  /** All events in the structure */
  readonly events: readonly EditEvent[];

  /** The top-level discourse relation */
  readonly topRelation: EventRelationType;

  /** Constraints that apply to all events */
  readonly globalConstraints: readonly RoleFiller[];

  /** The source text */
  readonly sourceText: string;
}

/**
 * Compose two events with a relation.
 */
export function composeEvents(
  e1: EditEvent,
  e2: EditEvent,
  relation: EventRelationType,
): EventStructure {
  // Add relation references to each event
  const e1WithRel = addEventRelation(e1, {
    type: relation,
    otherEventVar: e2.eventVar,
    description: `${e1.eventVar} ${relation} ${e2.eventVar}`,
  });
  const e2WithRel = addEventRelation(e2, {
    type: relation === 'sequence' ? 'sequence' : relation,
    otherEventVar: e1.eventVar,
    description: `${e2.eventVar} ${relation} ${e1.eventVar}`,
  });

  return {
    events: [e1WithRel, e2WithRel],
    topRelation: relation,
    globalConstraints: [],
    sourceText: `${e1.provenance.sourceText} ${e2.provenance.sourceText}`.trim(),
  };
}

/**
 * Add an event to an existing event structure.
 */
export function extendStructure(
  structure: EventStructure,
  event: EditEvent,
  relation: EventRelationType,
): EventStructure {
  const lastEvent = structure.events[structure.events.length - 1];
  const eventWithRel = lastEvent
    ? addEventRelation(event, {
        type: relation,
        otherEventVar: lastEvent.eventVar,
        description: `${event.eventVar} ${relation} ${lastEvent.eventVar}`,
      })
    : event;

  return {
    ...structure,
    events: [...structure.events, eventWithRel],
    sourceText: `${structure.sourceText} ${event.provenance.sourceText}`.trim(),
  };
}

/**
 * Add a global constraint to an event structure.
 */
export function addGlobalConstraint(
  structure: EventStructure,
  constraint: RoleFiller,
): EventStructure {
  return {
    ...structure,
    globalConstraints: [...structure.globalConstraints, constraint],
  };
}

// =============================================================================
// EVENT VALIDATION — checking well-formedness
// =============================================================================

/**
 * A validation issue with an event.
 */
export interface EventValidationIssue {
  /** The issue type */
  readonly type: EventIssueType;

  /** The event variable */
  readonly eventVar: string;

  /** Severity */
  readonly severity: 'error' | 'warning' | 'info';

  /** Description */
  readonly description: string;
}

export type EventIssueType =
  | 'missing_required_role'
  | 'conflicting_roles'
  | 'unsupported_category'
  | 'negated_without_alternative'
  | 'circular_relation'
  | 'unresolved_role';

/**
 * Required roles for each event category.
 */
const REQUIRED_ROLES: ReadonlyMap<EditEventCategory, readonly ThematicRoleKind[]> = new Map([
  ['creation', ['theme']],
  ['destruction', ['patient']],
  ['transformation', ['patient']],
  ['movement', ['patient', 'goal']],
  ['preservation', ['patient']],
  ['duplication', ['patient']],
  ['inspection', ['patient']],
  ['reversal', []],
  ['combination', ['patient']],
  ['separation', ['patient']],
]);

/**
 * Validate an event for well-formedness.
 */
export function validateEvent(event: EditEvent): readonly EventValidationIssue[] {
  const issues: EventValidationIssue[] = [];

  // Check required roles
  const required = REQUIRED_ROLES.get(event.category) ?? [];
  for (const role of required) {
    if (!event.roles.has(role)) {
      issues.push({
        type: 'missing_required_role',
        eventVar: event.eventVar,
        severity: 'warning',
        description: `Event ${event.eventVar} (${event.category}) is missing required role: ${role}`,
      });
    }
  }

  // Check for unresolved roles
  for (const [role, filler] of event.roles) {
    if (filler.filler.kind === 'unresolved') {
      issues.push({
        type: 'unresolved_role',
        eventVar: event.eventVar,
        severity: 'warning',
        description: `Role ${role} in event ${event.eventVar} is unresolved: ${filler.filler.reason}`,
      });
    }
  }

  // Check negation without alternative
  if (event.negated && event.relations.length === 0) {
    issues.push({
      type: 'negated_without_alternative',
      eventVar: event.eventVar,
      severity: 'info',
      description: `Negated event ${event.eventVar} has no alternative — may need clarification`,
    });
  }

  return issues;
}

/**
 * Validate an event structure.
 */
export function validateEventStructure(structure: EventStructure): readonly EventValidationIssue[] {
  const allIssues: EventValidationIssue[] = [];

  for (const event of structure.events) {
    allIssues.push(...validateEvent(event));
  }

  // Check for circular relations
  const graph = new Map<string, Set<string>>();
  for (const event of structure.events) {
    const targets = new Set<string>();
    for (const rel of event.relations) {
      targets.add(rel.otherEventVar);
    }
    graph.set(event.eventVar, targets);
  }

  // Simple cycle check (DFS)
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(node: string): boolean {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    inStack.add(node);
    const neighbors = graph.get(node) ?? new Set();
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }
    inStack.delete(node);
    return false;
  }

  for (const event of structure.events) {
    if (hasCycle(event.eventVar)) {
      allIssues.push({
        type: 'circular_relation',
        eventVar: event.eventVar,
        severity: 'error',
        description: `Circular event relation detected involving ${event.eventVar}`,
      });
      break; // One circular report is enough
    }
  }

  return allIssues;
}

// =============================================================================
// EVENT FORMATTING — human-readable output
// =============================================================================

/**
 * Format an event as a neo-Davidsonian logical form.
 */
export function formatEventLogicalForm(event: EditEvent): string {
  const conjuncts: string[] = [];

  // Event predicate
  conjuncts.push(`${event.verb.lemma}(${event.eventVar})`);

  // Roles
  for (const [role, filler] of event.roles) {
    conjuncts.push(`${role}(${event.eventVar}, ${formatRoleValue(filler.filler)})`);
  }

  // Negation
  const prefix = event.negated ? '¬' : '';

  return `${prefix}∃${event.eventVar}. ${conjuncts.join(' ∧ ')}`;
}

/**
 * Format a role value as a string.
 */
export function formatRoleValue(value: RoleValue): string {
  switch (value.kind) {
    case 'entity':
      return value.refId
        ? `${value.entityType}(${value.refId})`
        : `${value.entityType}("${value.name}")`;
    case 'axis':
      return `axis(${value.axisName}, ${value.direction})`;
    case 'degree':
      return value.absoluteValue !== null
        ? `degree(${value.absoluteValue}${value.unit ?? ''})`
        : `degree(${value.level}, ${(value.intensity * 100).toFixed(0)}%)`;
    case 'constraint':
      return `constraint(${value.constraintType}, ${value.target})`;
    case 'scope':
      return `scope(${value.scopeType}, ${value.target})`;
    case 'time':
      return `time(${value.timeType}, ${value.value})`;
    case 'manner':
      return `manner(${value.description})`;
    case 'compound':
      return `[${value.values.map(formatRoleValue).join(` ${value.junction} `)}]`;
    case 'unresolved':
      return `?(${value.expectedType}: ${value.reason})`;
  }
}

/**
 * Format an event as a human-readable description.
 */
export function formatEventDescription(event: EditEvent): string {
  const lines: string[] = [];

  const prefix = event.negated ? '[NEGATED] ' : '';
  const modal = event.modality !== 'actual' ? `[${event.modality}] ` : '';

  lines.push(`${prefix}${modal}Event ${event.eventVar}: ${event.verb.lemma} (${event.category})`);

  for (const [role, filler] of event.roles) {
    const explicitMark = filler.explicit ? '' : ' [inferred]';
    const conf = filler.confidence < 1 ? ` (${(filler.confidence * 100).toFixed(0)}%)` : '';
    lines.push(`  ${role}: ${formatRoleValue(filler.filler)}${explicitMark}${conf}`);
  }

  for (const mod of event.modifiers) {
    lines.push(`  [${mod.type}]: ${mod.value} — ${mod.effect}`);
  }

  for (const rel of event.relations) {
    lines.push(`  → ${rel.type} ${rel.otherEventVar}`);
  }

  return lines.join('\n');
}

/**
 * Format an event structure as a report.
 */
export function formatEventStructure(structure: EventStructure): string {
  const lines: string[] = [];

  lines.push(`Event Structure (${structure.events.length} events, ${structure.topRelation})`);
  lines.push(`  Source: "${structure.sourceText}"`);
  lines.push('');

  for (const event of structure.events) {
    lines.push(formatEventDescription(event));
    lines.push('');
  }

  if (structure.globalConstraints.length > 0) {
    lines.push('  Global constraints:');
    for (const c of structure.globalConstraints) {
      lines.push(`    ${c.role}: ${formatRoleValue(c.filler)}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// VERB DATABASE — mapping verbs to event categories
// =============================================================================

/**
 * Verb-to-category mapping.
 */
export interface VerbCategoryEntry {
  readonly lemma: string;
  readonly forms: readonly string[];
  readonly category: EditEventCategory;
  readonly actionId: string;
  readonly defaultRoles: ReadonlyMap<string, ThematicRoleKind>;
}

/**
 * Built-in verb category database.
 */
export const VERB_CATEGORY_DATABASE: ReadonlyMap<string, VerbCategoryEntry> = new Map([
  ['add', { lemma: 'add', forms: ['add', 'adds', 'adding', 'added'], category: 'creation', actionId: 'sem:add', defaultRoles: new Map([['object', 'theme']]) }],
  ['create', { lemma: 'create', forms: ['create', 'creates', 'creating', 'created'], category: 'creation', actionId: 'sem:create', defaultRoles: new Map([['object', 'theme']]) }],
  ['insert', { lemma: 'insert', forms: ['insert', 'inserts', 'inserting', 'inserted'], category: 'creation', actionId: 'sem:insert', defaultRoles: new Map([['object', 'theme']]) }],
  ['introduce', { lemma: 'introduce', forms: ['introduce', 'introduces', 'introducing', 'introduced'], category: 'creation', actionId: 'sem:introduce', defaultRoles: new Map([['object', 'theme']]) }],
  ['remove', { lemma: 'remove', forms: ['remove', 'removes', 'removing', 'removed'], category: 'destruction', actionId: 'sem:remove', defaultRoles: new Map([['object', 'patient']]) }],
  ['delete', { lemma: 'delete', forms: ['delete', 'deletes', 'deleting', 'deleted'], category: 'destruction', actionId: 'sem:delete', defaultRoles: new Map([['object', 'patient']]) }],
  ['clear', { lemma: 'clear', forms: ['clear', 'clears', 'clearing', 'cleared'], category: 'destruction', actionId: 'sem:clear', defaultRoles: new Map([['object', 'patient']]) }],
  ['strip', { lemma: 'strip', forms: ['strip', 'strips', 'stripping', 'stripped'], category: 'destruction', actionId: 'sem:strip', defaultRoles: new Map([['object', 'patient']]) }],
  ['make', { lemma: 'make', forms: ['make', 'makes', 'making', 'made'], category: 'transformation', actionId: 'sem:make', defaultRoles: new Map([['object', 'patient'], ['complement', 'result']]) }],
  ['change', { lemma: 'change', forms: ['change', 'changes', 'changing', 'changed'], category: 'transformation', actionId: 'sem:change', defaultRoles: new Map([['object', 'patient']]) }],
  ['modify', { lemma: 'modify', forms: ['modify', 'modifies', 'modifying', 'modified'], category: 'transformation', actionId: 'sem:modify', defaultRoles: new Map([['object', 'patient']]) }],
  ['adjust', { lemma: 'adjust', forms: ['adjust', 'adjusts', 'adjusting', 'adjusted'], category: 'transformation', actionId: 'sem:adjust', defaultRoles: new Map([['object', 'patient']]) }],
  ['set', { lemma: 'set', forms: ['set', 'sets', 'setting'], category: 'transformation', actionId: 'sem:set', defaultRoles: new Map([['object', 'patient']]) }],
  ['move', { lemma: 'move', forms: ['move', 'moves', 'moving', 'moved'], category: 'movement', actionId: 'sem:move', defaultRoles: new Map([['object', 'patient']]) }],
  ['shift', { lemma: 'shift', forms: ['shift', 'shifts', 'shifting', 'shifted'], category: 'movement', actionId: 'sem:shift', defaultRoles: new Map([['object', 'patient']]) }],
  ['swap', { lemma: 'swap', forms: ['swap', 'swaps', 'swapping', 'swapped'], category: 'movement', actionId: 'sem:swap', defaultRoles: new Map([['object', 'patient']]) }],
  ['keep', { lemma: 'keep', forms: ['keep', 'keeps', 'keeping', 'kept'], category: 'preservation', actionId: 'sem:keep', defaultRoles: new Map([['object', 'patient']]) }],
  ['preserve', { lemma: 'preserve', forms: ['preserve', 'preserves', 'preserving', 'preserved'], category: 'preservation', actionId: 'sem:preserve', defaultRoles: new Map([['object', 'patient']]) }],
  ['maintain', { lemma: 'maintain', forms: ['maintain', 'maintains', 'maintaining', 'maintained'], category: 'preservation', actionId: 'sem:maintain', defaultRoles: new Map([['object', 'patient']]) }],
  ['copy', { lemma: 'copy', forms: ['copy', 'copies', 'copying', 'copied'], category: 'duplication', actionId: 'sem:copy', defaultRoles: new Map([['object', 'patient']]) }],
  ['duplicate', { lemma: 'duplicate', forms: ['duplicate', 'duplicates', 'duplicating', 'duplicated'], category: 'duplication', actionId: 'sem:duplicate', defaultRoles: new Map([['object', 'patient']]) }],
  ['repeat', { lemma: 'repeat', forms: ['repeat', 'repeats', 'repeating', 'repeated'], category: 'duplication', actionId: 'sem:repeat', defaultRoles: new Map([['object', 'patient']]) }],
  ['show', { lemma: 'show', forms: ['show', 'shows', 'showing', 'showed'], category: 'inspection', actionId: 'sem:show', defaultRoles: new Map([['object', 'patient']]) }],
  ['play', { lemma: 'play', forms: ['play', 'plays', 'playing', 'played'], category: 'inspection', actionId: 'sem:play', defaultRoles: new Map([['object', 'patient']]) }],
  ['preview', { lemma: 'preview', forms: ['preview', 'previews', 'previewing', 'previewed'], category: 'inspection', actionId: 'sem:preview', defaultRoles: new Map([['object', 'patient']]) }],
  ['undo', { lemma: 'undo', forms: ['undo', 'undoes', 'undoing', 'undid'], category: 'reversal', actionId: 'sem:undo', defaultRoles: new Map() }],
  ['redo', { lemma: 'redo', forms: ['redo', 'redoes', 'redoing', 'redid'], category: 'reversal', actionId: 'sem:redo', defaultRoles: new Map() }],
  ['revert', { lemma: 'revert', forms: ['revert', 'reverts', 'reverting', 'reverted'], category: 'reversal', actionId: 'sem:revert', defaultRoles: new Map() }],
  ['merge', { lemma: 'merge', forms: ['merge', 'merges', 'merging', 'merged'], category: 'combination', actionId: 'sem:merge', defaultRoles: new Map([['object', 'patient']]) }],
  ['blend', { lemma: 'blend', forms: ['blend', 'blends', 'blending', 'blended'], category: 'combination', actionId: 'sem:blend', defaultRoles: new Map([['object', 'patient']]) }],
  ['combine', { lemma: 'combine', forms: ['combine', 'combines', 'combining', 'combined'], category: 'combination', actionId: 'sem:combine', defaultRoles: new Map([['object', 'patient']]) }],
  ['split', { lemma: 'split', forms: ['split', 'splits', 'splitting'], category: 'separation', actionId: 'sem:split', defaultRoles: new Map([['object', 'patient']]) }],
  ['separate', { lemma: 'separate', forms: ['separate', 'separates', 'separating', 'separated'], category: 'separation', actionId: 'sem:separate', defaultRoles: new Map([['object', 'patient']]) }],
  ['isolate', { lemma: 'isolate', forms: ['isolate', 'isolates', 'isolating', 'isolated'], category: 'separation', actionId: 'sem:isolate', defaultRoles: new Map([['object', 'patient']]) }],
]);

/**
 * Look up a verb's category and action ID.
 */
export function lookupVerbCategory(word: string): VerbCategoryEntry | null {
  const lower = word.toLowerCase();
  for (const [, entry] of VERB_CATEGORY_DATABASE) {
    if (entry.forms.includes(lower) || entry.lemma === lower) {
      return entry;
    }
  }
  return null;
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the event semantics module.
 */
export function getEventSemanticsStats(): {
  verbEntries: number;
  eventCategories: number;
  thematicRoles: number;
  relationTypes: number;
  modifierTypes: number;
} {
  return {
    verbEntries: VERB_CATEGORY_DATABASE.size,
    eventCategories: 10,
    thematicRoles: 15,
    relationTypes: 8,
    modifierTypes: 7,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetEventSemantics(): void {
  _nextEventVar = 0;
}
