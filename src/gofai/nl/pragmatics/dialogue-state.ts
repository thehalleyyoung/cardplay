/**
 * dialogue-state.ts -- Steps 201-205: Pragmatics layer for dialogue management
 *
 * Step 201: Dialogue State Model -- types, focus stack, salience tracking, state ops
 * Step 202: DRT-style Discourse Referents -- DRS boxes, referent lifecycle, merge ops
 * Step 203: Anaphora Resolution -- pronoun / pro-form resolution via salience + UI focus
 * Step 204: Definite Description Resolution -- "the chorus", ordinals, property match
 * Step 205: Demonstrative Resolution -- proximal/distal, UI selection integration
 *
 * All types are locally defined (no external imports).
 */

// ===================== STEP 201: DIALOGUE STATE MODEL =====================

// ---- 201 Types ----

/** The kind of dialogue turn produced by the user or system. */
export type TurnType =
  | 'user-command'
  | 'user-question'
  | 'user-clarification'
  | 'system-response'
  | 'system-clarification-request'
  | 'system-execution-report'
  | 'system-error'
  | 'system-suggestion'
  | 'undo-request'
  | 'redo-request';

/** Grammatical role used for linguistic prominence scoring. */
export type GrammaticalRole = 'subject' | 'object' | 'oblique' | 'possessive' | 'vocative' | 'none';

/** Salience factors for an entity. */
export interface EntitySalience {
  readonly recencyTurn: number;
  readonly frequency: number;
  readonly uiFocused: boolean;
  readonly grammaticalRole: GrammaticalRole;
  readonly topicality: number;
  readonly score: number;
}

/** A salient entity tracked across dialogue turns. */
export interface SalientEntity {
  readonly id: string;
  readonly name: string;
  readonly entityType: string;
  readonly salience: EntitySalience;
  readonly metadata: Record<string, string>;
}

/** A single entry on the focus stack. */
export interface FocusEntry {
  readonly scopeId: string;
  readonly scopeType: string;
  readonly scopeName: string;
  readonly enteredAtTurn: number;
  readonly metadata: Record<string, string>;
}

/** Stack tracking nested discussion focus. */
export interface FocusStack {
  readonly entries: readonly FocusEntry[];
  readonly maxDepth: number;
}

/** Record of a single dialogue turn. */
export interface DialogueTurn {
  readonly turnNumber: number;
  readonly turnType: TurnType;
  readonly rawText: string;
  readonly timestamp: number;
  readonly mentionedEntityIds: readonly string[];
  readonly cplIntent: string;
  readonly tags: readonly string[];
}

/** Rolling history of dialogue turns. */
export interface DialogueHistory {
  readonly turns: readonly DialogueTurn[];
  readonly maxTurns: number;
}

/** Map of user preferences keyed by preference name. */
export interface UserPrefMap {
  readonly prefs: Record<string, string>;
}

/** Pending clarification that the system has asked the user. */
export interface PendingClarification {
  readonly id: string;
  readonly question: string;
  readonly options: readonly string[];
  readonly relatedEntityIds: readonly string[];
  readonly askedAtTurn: number;
  readonly resolved: boolean;
}

/** Contextual info about the current board state. */
export interface BoardContext {
  readonly boardId: string;
  readonly boardName: string;
  readonly sectionCount: number;
  readonly layerCount: number;
  readonly selectedEntityIds: readonly string[];
  readonly playbackPosition: number;
  readonly viewRange: readonly [number, number];
}

/** Full dialogue context passed around in the pragmatics layer. */
export interface DialogueContext {
  readonly state: DialogueState;
  readonly drs: DRSBox;
  readonly uiSelection: UISelectionState;
}

/** The top-level dialogue state. */
export interface DialogueState {
  readonly currentTurn: number;
  readonly focusStack: FocusStack;
  readonly salientEntities: readonly SalientEntity[];
  readonly lastCPLIntent: string;
  readonly lastPlan: string;
  readonly lastDiffSummary: string;
  readonly userPrefs: UserPrefMap;
  readonly boardContext: BoardContext;
  readonly activeClarifications: readonly PendingClarification[];
  readonly history: DialogueHistory;
  readonly salienceDecayHalfLifeTurns: number;
}

// ---- 201 Constants ----

const DEFAULT_SALIENCE_HALF_LIFE = 3;
const MAX_FOCUS_DEPTH = 20;
const MAX_HISTORY_TURNS = 200;

const SALIENCE_WEIGHTS = {
  recency: 0.30,
  frequency: 0.15,
  uiFocus: 0.25,
  grammaticalRole: 0.15,
  topicality: 0.15,
} as const;

const ROLE_PROMINENCE: Record<GrammaticalRole, number> = {
  subject: 1.0,
  object: 0.7,
  possessive: 0.5,
  oblique: 0.3,
  vocative: 0.2,
  none: 0.0,
};

// ---- 201 Helpers ----

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return prefix + '_' + ts + '_' + rand;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function computeRecencyFactor(currentTurn: number, lastMentionTurn: number, halfLife: number): number {
  const turnsAgo = currentTurn - lastMentionTurn;
  if (turnsAgo <= 0) return 1.0;
  return Math.pow(0.5, turnsAgo / Math.max(halfLife, 0.01));
}

function computeSalienceScore(
  currentTurn: number,
  salience: Omit<EntitySalience, 'score'>,
  halfLife: number,
): number {
  const recencyFactor = computeRecencyFactor(currentTurn, salience.recencyTurn, halfLife);
  const frequencyFactor = clamp(salience.frequency / 10, 0, 1);
  const uiFocusFactor = salience.uiFocused ? 1.0 : 0.0;
  const roleVal = ROLE_PROMINENCE[salience.grammaticalRole];
  const roleFactor = roleVal != null ? roleVal : 0.0;
  const topicFactor = clamp(salience.topicality, 0, 1);

  return (
    SALIENCE_WEIGHTS.recency * recencyFactor +
    SALIENCE_WEIGHTS.frequency * frequencyFactor +
    SALIENCE_WEIGHTS.uiFocus * uiFocusFactor +
    SALIENCE_WEIGHTS.grammaticalRole * roleFactor +
    SALIENCE_WEIGHTS.topicality * topicFactor
  );
}

function emptyBoardContext(): BoardContext {
  return {
    boardId: '',
    boardName: '',
    sectionCount: 0,
    layerCount: 0,
    selectedEntityIds: [],
    playbackPosition: 0,
    viewRange: [0, 0],
  };
}

function sortEntitiesBySalience(entities: readonly SalientEntity[]): readonly SalientEntity[] {
  return [...entities].sort((a, b) => b.salience.score - a.salience.score);
}

// ---- 201 Operations ----

export function createDialogueState(): DialogueState {
  return {
    currentTurn: 0,
    focusStack: { entries: [], maxDepth: MAX_FOCUS_DEPTH },
    salientEntities: [],
    lastCPLIntent: '',
    lastPlan: '',
    lastDiffSummary: '',
    userPrefs: { prefs: {} },
    boardContext: emptyBoardContext(),
    activeClarifications: [],
    history: { turns: [], maxTurns: MAX_HISTORY_TURNS },
    salienceDecayHalfLifeTurns: DEFAULT_SALIENCE_HALF_LIFE,
  };
}

export function advanceTurn(
  state: DialogueState,
  turnType: TurnType,
  rawText: string,
  mentionedEntityIds: readonly string[],
  cplIntent: string,
  tags: readonly string[],
): DialogueState {
  const nextTurn = state.currentTurn + 1;
  const newTurnRecord: DialogueTurn = {
    turnNumber: nextTurn,
    turnType,
    rawText,
    timestamp: Date.now(),
    mentionedEntityIds,
    cplIntent,
    tags,
  };
  const updatedTurns = [...state.history.turns, newTurnRecord];
  const trimmedTurns = updatedTurns.length > state.history.maxTurns
    ? updatedTurns.slice(updatedTurns.length - state.history.maxTurns)
    : updatedTurns;

  return {
    ...state,
    currentTurn: nextTurn,
    history: { ...state.history, turns: trimmedTurns },
  };
}

export function pushFocus(
  state: DialogueState,
  scopeId: string,
  scopeType: string,
  scopeName: string,
  metadata?: Record<string, string>,
): DialogueState {
  const entry: FocusEntry = {
    scopeId,
    scopeType,
    scopeName,
    enteredAtTurn: state.currentTurn,
    ...(metadata != null ? { metadata } : { metadata: {} }),
  };
  if (state.focusStack.entries.length >= state.focusStack.maxDepth) {
    const trimmed = state.focusStack.entries.slice(1);
    return {
      ...state,
      focusStack: { ...state.focusStack, entries: [...trimmed, entry] },
    };
  }
  return {
    ...state,
    focusStack: { ...state.focusStack, entries: [...state.focusStack.entries, entry] },
  };
}

export function popFocus(state: DialogueState): { state: DialogueState; popped: FocusEntry | undefined } {
  const entries = state.focusStack.entries;
  if (entries.length === 0) {
    return { state, popped: undefined };
  }
  const popped = entries[entries.length - 1];
  const remaining = entries.slice(0, entries.length - 1);
  return {
    state: {
      ...state,
      focusStack: { ...state.focusStack, entries: remaining },
    },
    popped,
  };
}

export function getCurrentFocus(state: DialogueState): FocusEntry | undefined {
  const entries = state.focusStack.entries;
  if (entries.length === 0) return undefined;
  return entries[entries.length - 1];
}

export function getFocusStackTopFirst(state: DialogueState): readonly FocusEntry[] {
  return [...state.focusStack.entries].reverse();
}

export function updateSalience(
  state: DialogueState,
  entityId: string,
  entityName: string,
  entityType: string,
  role: GrammaticalRole,
  uiFocused: boolean,
  topicality: number,
  extraMetadata?: Record<string, string>,
): DialogueState {
  const existing = state.salientEntities.find((e) => e.id === entityId);
  const halfLife = state.salienceDecayHalfLifeTurns;
  if (existing != null) {
    const existingRole = ROLE_PROMINENCE[existing.salience.grammaticalRole];
    const newRole = ROLE_PROMINENCE[role];
    const bestRole = (newRole != null && existingRole != null && newRole > existingRole) ? role : existing.salience.grammaticalRole;
    const updatedSalienceBase = {
      recencyTurn: state.currentTurn,
      frequency: existing.salience.frequency + 1,
      uiFocused,
      grammaticalRole: bestRole,
      topicality: Math.max(existing.salience.topicality, topicality),
    };
    const score = computeSalienceScore(state.currentTurn, updatedSalienceBase, halfLife);
    const updatedEntity: SalientEntity = {
      ...existing,
      name: entityName,
      salience: { ...updatedSalienceBase, score },
      metadata: extraMetadata != null
        ? { ...existing.metadata, ...extraMetadata }
        : existing.metadata,
    };
    const others = state.salientEntities.filter((e) => e.id !== entityId);
    return { ...state, salientEntities: sortEntitiesBySalience([...others, updatedEntity]) };
  }
  const salienceBase = {
    recencyTurn: state.currentTurn,
    frequency: 1,
    uiFocused,
    grammaticalRole: role,
    topicality,
  };
  const score = computeSalienceScore(state.currentTurn, salienceBase, halfLife);
  const newEntity: SalientEntity = {
    id: entityId,
    name: entityName,
    entityType,
    salience: { ...salienceBase, score },
    metadata: extraMetadata != null ? { ...extraMetadata } : {},
  };
  return { ...state, salientEntities: sortEntitiesBySalience([...state.salientEntities, newEntity]) };
}

export function decaySalience(state: DialogueState): DialogueState {
  const halfLife = state.salienceDecayHalfLifeTurns;
  const updated = state.salientEntities.map((entity) => {
    const score = computeSalienceScore(state.currentTurn, entity.salience, halfLife);
    return { ...entity, salience: { ...entity.salience, score } };
  });
  return { ...state, salientEntities: sortEntitiesBySalience(updated) };
}

export function getTopSalientEntities(state: DialogueState, n: number): readonly SalientEntity[] {
  return state.salientEntities.slice(0, Math.max(0, n));
}

export function getSalientEntitiesByType(state: DialogueState, entityType: string): readonly SalientEntity[] {
  return state.salientEntities.filter((e) => e.entityType === entityType);
}

export function setLastCPL(state: DialogueState, cpl: string): DialogueState {
  return { ...state, lastCPLIntent: cpl };
}

export function setLastPlan(state: DialogueState, plan: string): DialogueState {
  return { ...state, lastPlan: plan };
}

export function setLastDiff(state: DialogueState, diff: string): DialogueState {
  return { ...state, lastDiffSummary: diff };
}

export function setUserPref(state: DialogueState, key: string, value: string): DialogueState {
  const prefs = { ...state.userPrefs.prefs, [key]: value };
  return { ...state, userPrefs: { prefs } };
}

export function getUserPref(state: DialogueState, key: string): string | undefined {
  return state.userPrefs.prefs[key];
}

export function setBoardContext(state: DialogueState, ctx: BoardContext): DialogueState {
  return { ...state, boardContext: ctx };
}

export function addClarification(
  state: DialogueState,
  question: string,
  options: readonly string[],
  relatedEntityIds: readonly string[],
): DialogueState {
  const clar: PendingClarification = {
    id: makeId('clar'),
    question,
    options,
    relatedEntityIds,
    askedAtTurn: state.currentTurn,
    resolved: false,
  };
  return { ...state, activeClarifications: [...state.activeClarifications, clar] };
}

export function resolveClarification(state: DialogueState, clarId: string): DialogueState {
  const updated = state.activeClarifications.map((c) =>
    c.id === clarId ? { ...c, resolved: true } : c,
  );
  return { ...state, activeClarifications: updated };
}

export function getUnresolvedClarifications(state: DialogueState): readonly PendingClarification[] {
  return state.activeClarifications.filter((c) => !c.resolved);
}

export function getDialogueHistory(state: DialogueState): DialogueHistory {
  return state.history;
}

export function getRecentTurns(state: DialogueState, n: number): readonly DialogueTurn[] {
  const turns = state.history.turns;
  return turns.slice(Math.max(0, turns.length - n));
}

export function summarizeState(state: DialogueState): string {
  const lines: string[] = [];
  lines.push('=== Dialogue State Summary ===');
  lines.push('Current turn: ' + String(state.currentTurn));
  lines.push('Focus stack depth: ' + String(state.focusStack.entries.length));
  const topFocus = getCurrentFocus(state);
  if (topFocus != null) {
    lines.push('Current focus: ' + topFocus.scopeName + ' (' + topFocus.scopeType + ')');
  } else {
    lines.push('Current focus: (none)');
  }
  lines.push('Salient entities: ' + String(state.salientEntities.length));
  const top3 = getTopSalientEntities(state, 3);
  for (const ent of top3) {
    lines.push('  - ' + ent.name + ' [' + ent.entityType + '] score=' + ent.salience.score.toFixed(3));
  }
  if (state.lastCPLIntent !== '') {
    lines.push('Last CPL intent: ' + state.lastCPLIntent);
  }
  if (state.lastPlan !== '') {
    lines.push('Last plan: ' + state.lastPlan);
  }
  if (state.lastDiffSummary !== '') {
    lines.push('Last diff: ' + state.lastDiffSummary);
  }
  const unresolvedCount = getUnresolvedClarifications(state).length;
  if (unresolvedCount > 0) {
    lines.push('Unresolved clarifications: ' + String(unresolvedCount));
  }
  lines.push('History turns: ' + String(state.history.turns.length));
  lines.push('User prefs: ' + String(Object.keys(state.userPrefs.prefs).length) + ' set');
  const bname = state.boardContext.boardName !== '' ? state.boardContext.boardName : '(none)';
  lines.push('Board: ' + bname);
  return lines.join('\n');
}

export function pruneEntities(state: DialogueState, threshold: number): DialogueState {
  const kept = state.salientEntities.filter((e) => e.salience.score >= threshold);
  return { ...state, salientEntities: kept };
}

export function clearFocusStack(state: DialogueState): DialogueState {
  return { ...state, focusStack: { ...state.focusStack, entries: [] } };
}

export function setSalienceHalfLife(state: DialogueState, halfLife: number): DialogueState {
  return { ...state, salienceDecayHalfLifeTurns: Math.max(0.1, halfLife) };
}

export function findSalientEntity(state: DialogueState, entityId: string): SalientEntity | undefined {
  return state.salientEntities.find((e) => e.id === entityId);
}

export function hasEntityOfType(state: DialogueState, entityType: string): boolean {
  return state.salientEntities.some((e) => e.entityType === entityType);
}

export function setUIFocusedEntity(state: DialogueState, entityId: string): DialogueState {
  const updated = state.salientEntities.map((e) => {
    const focused = e.id === entityId;
    if (focused === e.salience.uiFocused) return e;
    const newSalience: EntitySalience = { ...e.salience, uiFocused: focused };
    const score = computeSalienceScore(state.currentTurn, newSalience, state.salienceDecayHalfLifeTurns);
    return { ...e, salience: { ...newSalience, score } };
  });
  return { ...state, salientEntities: sortEntitiesBySalience(updated) };
}

/** Find the most recent turn of a given type. */
export function findLastTurnOfType(state: DialogueState, turnType: TurnType): DialogueTurn | undefined {
  const turns = state.history.turns;
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i];
    if (t != null && t.turnType === turnType) return t;
  }
  return undefined;
}

/** Count entities of a specific type in the salience list. */
export function countEntitiesOfType(state: DialogueState, entityType: string): number {
  return state.salientEntities.filter((e) => e.entityType === entityType).length;
}

/** Merge two dialogue states, preferring the newer state's scalars and combining entity lists. */
export function mergeDialogueStates(older: DialogueState, newer: DialogueState): DialogueState {
  const entityMap = new Map<string, SalientEntity>();
  for (const e of older.salientEntities) {
    entityMap.set(e.id, e);
  }
  for (const e of newer.salientEntities) {
    const prev = entityMap.get(e.id);
    if (prev != null) {
      const mergedSalienceBase = {
        recencyTurn: Math.max(prev.salience.recencyTurn, e.salience.recencyTurn),
        frequency: prev.salience.frequency + e.salience.frequency,
        uiFocused: e.salience.uiFocused,
        grammaticalRole: (ROLE_PROMINENCE[e.salience.grammaticalRole] ?? 0) >= (ROLE_PROMINENCE[prev.salience.grammaticalRole] ?? 0)
          ? e.salience.grammaticalRole
          : prev.salience.grammaticalRole,
        topicality: Math.max(prev.salience.topicality, e.salience.topicality),
      };
      const score = computeSalienceScore(newer.currentTurn, mergedSalienceBase, newer.salienceDecayHalfLifeTurns);
      entityMap.set(e.id, {
        ...e,
        salience: { ...mergedSalienceBase, score },
        metadata: { ...prev.metadata, ...e.metadata },
      });
    } else {
      entityMap.set(e.id, e);
    }
  }
  const allEntities = sortEntitiesBySalience(Array.from(entityMap.values()));
  const combinedTurns = [...older.history.turns, ...newer.history.turns];
  const maxT = newer.history.maxTurns;
  const trimmedTurns = combinedTurns.length > maxT
    ? combinedTurns.slice(combinedTurns.length - maxT)
    : combinedTurns;

  return {
    ...newer,
    salientEntities: allEntities,
    history: { turns: trimmedTurns, maxTurns: maxT },
    focusStack: newer.focusStack,
    activeClarifications: [
      ...older.activeClarifications.filter((c) => !c.resolved),
      ...newer.activeClarifications,
    ],
  };
}

/** Create a snapshot of the dialogue state at this point. */
export function snapshotDialogueState(state: DialogueState): DialogueState {
  return {
    ...state,
    focusStack: { ...state.focusStack, entries: [...state.focusStack.entries] },
    salientEntities: [...state.salientEntities],
    activeClarifications: [...state.activeClarifications],
    history: { ...state.history, turns: [...state.history.turns] },
  };
}


// ===================== STEP 202: DRT DISCOURSE REFERENTS =====================

// ---- 202 Types ----

/** Types of discourse referents in musical composition context. */
export type ReferentType =
  | 'section'
  | 'layer'
  | 'card'
  | 'motif'
  | 'track'
  | 'instrument'
  | 'effect'
  | 'parameter'
  | 'timeRange'
  | 'marker'
  | 'group'
  | 'mixBus'
  | 'send'
  | 'plugin'
  | 'automation'
  | 'note'
  | 'chord'
  | 'scale'
  | 'tempo'
  | 'region';

/** Lifecycle status of a referent. */
export type ReferentStatus = 'introduced' | 'active' | 'backgrounded' | 'expired';

/** A discourse referent (entity in the DRS universe). */
export interface DiscourseReferent {
  readonly id: string;
  readonly name: string;
  readonly referentType: ReferentType;
  readonly status: ReferentStatus;
  readonly introducedAtTurn: number;
  readonly lastAccessedTurn: number;
  readonly accessCount: number;
  readonly properties: Record<string, string>;
  readonly boundTo: string;
  readonly aliases: readonly string[];
}

/** A condition linking referents in a DRS box. */
export interface DRSCondition {
  readonly id: string;
  readonly conditionType: DRSConditionType;
  readonly referentIds: readonly string[];
  readonly predicate: string;
  readonly value: string;
  readonly negated: boolean;
}

/** Types of DRS conditions. */
export type DRSConditionType =
  | 'property'
  | 'relation'
  | 'identity'
  | 'type-assertion'
  | 'temporal'
  | 'spatial'
  | 'causal'
  | 'membership'
  | 'comparison'
  | 'quantified';

/** A binding linking a discourse referent to a concrete entity. */
export interface ReferentBinding {
  readonly referentId: string;
  readonly targetEntityId: string;
  readonly bindingType: BindingType;
  readonly confidence: number;
  readonly boundAtTurn: number;
}

/** How a referent was bound to its target. */
export type BindingType =
  | 'direct-mention'
  | 'anaphoric'
  | 'definite-description'
  | 'demonstrative'
  | 'inferred'
  | 'ui-selection'
  | 'default';

/** Box type in the DRS structure. */
export type DRSBoxType = 'main' | 'conditional-antecedent' | 'conditional-consequent' | 'negation' | 'modal' | 'temporal' | 'disjunct';

/** A DRS box containing a universe of referents and conditions. */
export interface DRSBox {
  readonly id: string;
  readonly boxType: DRSBoxType;
  readonly universe: readonly DiscourseReferent[];
  readonly conditions: readonly DRSCondition[];
  readonly bindings: readonly ReferentBinding[];
  readonly subordinates: readonly DRSBox[];
  readonly parentBoxId: string;
  readonly createdAtTurn: number;
}

// ---- 202 Constants ----

const DEFAULT_REFERENT_EXPIRY_TURNS = 15;
const MAX_UNIVERSE_SIZE = 500;
const REFERENT_BACKGROUND_TURNS = 6;

const REFERENT_TYPE_LABELS: Record<ReferentType, string> = {
  section: 'Section',
  layer: 'Layer',
  card: 'Card',
  motif: 'Motif',
  track: 'Track',
  instrument: 'Instrument',
  effect: 'Effect',
  parameter: 'Parameter',
  timeRange: 'Time Range',
  marker: 'Marker',
  group: 'Group',
  mixBus: 'Mix Bus',
  send: 'Send',
  plugin: 'Plugin',
  automation: 'Automation',
  note: 'Note',
  chord: 'Chord',
  scale: 'Scale',
  tempo: 'Tempo',
  region: 'Region',
};

/** Musical semantic defaults per referent type. */
const REFERENT_TYPE_DEFAULTS: Record<ReferentType, Record<string, string>> = {
  section: { scope: 'structural', granularity: 'large' },
  layer: { scope: 'vertical', granularity: 'medium' },
  card: { scope: 'atomic', granularity: 'small' },
  motif: { scope: 'thematic', granularity: 'small' },
  track: { scope: 'channel', granularity: 'large' },
  instrument: { scope: 'timbral', granularity: 'medium' },
  effect: { scope: 'processing', granularity: 'small' },
  parameter: { scope: 'control', granularity: 'atomic' },
  timeRange: { scope: 'temporal', granularity: 'variable' },
  marker: { scope: 'navigational', granularity: 'point' },
  group: { scope: 'organizational', granularity: 'large' },
  mixBus: { scope: 'routing', granularity: 'medium' },
  send: { scope: 'routing', granularity: 'small' },
  plugin: { scope: 'processing', granularity: 'medium' },
  automation: { scope: 'control', granularity: 'medium' },
  note: { scope: 'pitch', granularity: 'atomic' },
  chord: { scope: 'harmonic', granularity: 'small' },
  scale: { scope: 'harmonic', granularity: 'medium' },
  tempo: { scope: 'temporal', granularity: 'global' },
  region: { scope: 'spatial', granularity: 'medium' },
};

// ---- 202 Functions ----

/** Create a fresh, empty DRS box. */
export function createDRS(boxType?: DRSBoxType, parentBoxId?: string): DRSBox {
  return {
    id: makeId('drs'),
    boxType: boxType != null ? boxType : 'main',
    universe: [],
    conditions: [],
    bindings: [],
    subordinates: [],
    parentBoxId: parentBoxId != null ? parentBoxId : '',
    createdAtTurn: 0,
  };
}

/** Introduce a new discourse referent into a DRS box. */
export function introduceReferent(
  box: DRSBox,
  name: string,
  referentType: ReferentType,
  currentTurn: number,
  properties?: Record<string, string>,
  aliases?: readonly string[],
): { box: DRSBox; referent: DiscourseReferent } {
  const defaults = REFERENT_TYPE_DEFAULTS[referentType];
  const props: Record<string, string> = {
    ...(defaults != null ? defaults : {}),
    ...(properties != null ? properties : {}),
  };
  const referent: DiscourseReferent = {
    id: makeId('ref'),
    name,
    referentType,
    status: 'introduced',
    introducedAtTurn: currentTurn,
    lastAccessedTurn: currentTurn,
    accessCount: 1,
    properties: props,
    boundTo: '',
    aliases: aliases != null ? [...aliases] : [],
  };
  let universe = [...box.universe, referent];
  if (universe.length > MAX_UNIVERSE_SIZE) {
    universe = universe.slice(universe.length - MAX_UNIVERSE_SIZE);
  }
  return {
    box: { ...box, universe },
    referent,
  };
}

/** Activate a referent (transition introduced -> active). */
export function activateReferent(box: DRSBox, referentId: string, currentTurn: number): DRSBox {
  const universe = box.universe.map((r) => {
    if (r.id !== referentId) return r;
    return {
      ...r,
      status: 'active' as ReferentStatus,
      lastAccessedTurn: currentTurn,
      accessCount: r.accessCount + 1,
    };
  });
  return { ...box, universe };
}

/** Bind a referent to a concrete entity. */
export function bindReferent(
  box: DRSBox,
  referentId: string,
  targetEntityId: string,
  bindingType: BindingType,
  confidence: number,
  currentTurn: number,
): DRSBox {
  const binding: ReferentBinding = {
    referentId,
    targetEntityId,
    bindingType,
    confidence: clamp(confidence, 0, 1),
    boundAtTurn: currentTurn,
  };
  const universe = box.universe.map((r) => {
    if (r.id !== referentId) return r;
    return {
      ...r,
      boundTo: targetEntityId,
      status: 'active' as ReferentStatus,
      lastAccessedTurn: currentTurn,
      accessCount: r.accessCount + 1,
    };
  });
  return { ...box, universe, bindings: [...box.bindings, binding] };
}

/** Look up a referent by id. */
export function lookupReferent(box: DRSBox, referentId: string): DiscourseReferent | undefined {
  const found = box.universe.find((r) => r.id === referentId);
  if (found != null) return found;
  for (const sub of box.subordinates) {
    const subFound = lookupReferent(sub, referentId);
    if (subFound != null) return subFound;
  }
  return undefined;
}

/** Merge two DRS boxes, combining universes and conditions. */
export function mergeBoxes(boxA: DRSBox, boxB: DRSBox): DRSBox {
  const existingIds = new Set(boxA.universe.map((r) => r.id));
  const newReferents = boxB.universe.filter((r) => !existingIds.has(r.id));
  const existingCondIds = new Set(boxA.conditions.map((c) => c.id));
  const newConditions = boxB.conditions.filter((c) => !existingCondIds.has(c.id));
  const existingBindingKeys = new Set(boxA.bindings.map((b) => b.referentId + ':' + b.targetEntityId));
  const newBindings = boxB.bindings.filter((b) => !existingBindingKeys.has(b.referentId + ':' + b.targetEntityId));
  return {
    ...boxA,
    universe: [...boxA.universe, ...newReferents],
    conditions: [...boxA.conditions, ...newConditions],
    bindings: [...boxA.bindings, ...newBindings],
    subordinates: [...boxA.subordinates, ...boxB.subordinates],
  };
}

/** Check if a referent is accessible from a given box (DRS accessibility). */
export function isAccessible(box: DRSBox, referentId: string, fromBoxId: string): boolean {
  // Referents in the main box are always accessible
  if (box.id === fromBoxId) {
    return box.universe.some((r) => r.id === referentId);
  }
  // Referents in parent boxes are accessible
  if (box.universe.some((r) => r.id === referentId)) {
    return true;
  }
  // Check subordinate boxes -- only antecedent boxes are accessible from consequent
  for (const sub of box.subordinates) {
    if (sub.id === fromBoxId) {
      // Found the target box as a subordinate; referents from parent are accessible
      return box.universe.some((r) => r.id === referentId);
    }
    if (sub.boxType === 'conditional-antecedent') {
      const inSub = sub.universe.some((r) => r.id === referentId);
      if (inSub) {
        // Check if fromBoxId is the consequent sibling
        const hasSibling = box.subordinates.some(
          (s) => s.id === fromBoxId && s.boxType === 'conditional-consequent',
        );
        if (hasSibling) return true;
      }
    }
    // Recurse into subordinates
    if (isAccessible(sub, referentId, fromBoxId)) return true;
  }
  return false;
}

/** Expire referents that haven't been accessed within a threshold. */
export function expireOldReferents(box: DRSBox, currentTurn: number, expiryTurns?: number): DRSBox {
  const threshold = expiryTurns != null ? expiryTurns : DEFAULT_REFERENT_EXPIRY_TURNS;
  const universe = box.universe.map((r) => {
    if (r.status === 'expired') return r;
    const turnsIdle = currentTurn - r.lastAccessedTurn;
    if (turnsIdle >= threshold) {
      return { ...r, status: 'expired' as ReferentStatus };
    }
    if (turnsIdle >= REFERENT_BACKGROUND_TURNS && r.status === 'active') {
      return { ...r, status: 'backgrounded' as ReferentStatus };
    }
    return r;
  });
  const subordinates = box.subordinates.map((sub) => expireOldReferents(sub, currentTurn, expiryTurns));
  return { ...box, universe, subordinates };
}

/** Get all referents of a specific type. */
export function getReferentsByType(box: DRSBox, refType: ReferentType): readonly DiscourseReferent[] {
  const direct = box.universe.filter((r) => r.referentType === refType && r.status !== 'expired');
  const fromSubs: DiscourseReferent[] = [];
  for (const sub of box.subordinates) {
    const subResults = getReferentsByType(sub, refType);
    for (const sr of subResults) {
      fromSubs.push(sr);
    }
  }
  return [...direct, ...fromSubs];
}

/** Get all referents matching a name (case-insensitive). */
export function getReferentsByName(box: DRSBox, name: string): readonly DiscourseReferent[] {
  const lowerName = name.toLowerCase();
  const direct = box.universe.filter((r) => {
    if (r.status === 'expired') return false;
    if (r.name.toLowerCase() === lowerName) return true;
    return r.aliases.some((a) => a.toLowerCase() === lowerName);
  });
  const fromSubs: DiscourseReferent[] = [];
  for (const sub of box.subordinates) {
    const subResults = getReferentsByName(sub, name);
    for (const sr of subResults) {
      fromSubs.push(sr);
    }
  }
  return [...direct, ...fromSubs];
}

/** Create a subordinate box (e.g., for conditionals, negation). */
export function subordinateBox(
  parentBox: DRSBox,
  boxType: DRSBoxType,
  currentTurn: number,
): { parent: DRSBox; child: DRSBox } {
  const child: DRSBox = {
    id: makeId('drs'),
    boxType,
    universe: [],
    conditions: [],
    bindings: [],
    subordinates: [],
    parentBoxId: parentBox.id,
    createdAtTurn: currentTurn,
  };
  return {
    parent: { ...parentBox, subordinates: [...parentBox.subordinates, child] },
    child,
  };
}

/** Update a subordinate box within the parent. */
export function updateSubordinateBox(parentBox: DRSBox, updatedChild: DRSBox): DRSBox {
  const subordinates = parentBox.subordinates.map((sub) => {
    if (sub.id === updatedChild.id) return updatedChild;
    return sub;
  });
  return { ...parentBox, subordinates };
}

/** Produce a human-readable representation of the DRS. */
export function formatDRS(box: DRSBox, indent?: number): string {
  const pad = ' '.repeat(indent != null ? indent : 0);
  const lines: string[] = [];
  lines.push(pad + '[ DRS ' + box.id + ' (' + box.boxType + ') ]');
  lines.push(pad + 'Universe:');
  for (const r of box.universe) {
    const label = REFERENT_TYPE_LABELS[r.referentType];
    const statusTag = r.status;
    lines.push(pad + '  ' + r.id + ': ' + r.name + ' (' + (label != null ? label : r.referentType) + ') [' + statusTag + ']');
    if (r.boundTo !== '') {
      lines.push(pad + '    -> bound to ' + r.boundTo);
    }
  }
  lines.push(pad + 'Conditions:');
  for (const c of box.conditions) {
    const neg = c.negated ? 'NOT ' : '';
    lines.push(pad + '  ' + neg + c.predicate + '(' + c.referentIds.join(', ') + ')' + (c.value !== '' ? ' = ' + c.value : ''));
  }
  if (box.bindings.length > 0) {
    lines.push(pad + 'Bindings:');
    for (const b of box.bindings) {
      lines.push(pad + '  ' + b.referentId + ' -> ' + b.targetEntityId + ' [' + b.bindingType + '] conf=' + b.confidence.toFixed(2));
    }
  }
  for (const sub of box.subordinates) {
    lines.push(formatDRS(sub, (indent != null ? indent : 0) + 2));
  }
  return lines.join('\n');
}

/** Count active (non-expired) referents in the DRS. */
export function countActiveReferents(box: DRSBox): number {
  let count = box.universe.filter((r) => r.status !== 'expired').length;
  for (const sub of box.subordinates) {
    count += countActiveReferents(sub);
  }
  return count;
}

/** Get the full binding chain for a referent (all bindings sorted by turn). */
export function getBindingChain(box: DRSBox, referentId: string): readonly ReferentBinding[] {
  const direct = box.bindings.filter((b) => b.referentId === referentId);
  const fromSubs: ReferentBinding[] = [];
  for (const sub of box.subordinates) {
    const subBindings = getBindingChain(sub, referentId);
    for (const sb of subBindings) {
      fromSubs.push(sb);
    }
  }
  return [...direct, ...fromSubs].sort((a, b) => a.boundAtTurn - b.boundAtTurn);
}

/** Refresh a referent's last-accessed turn and increment access count. */
export function refreshReferent(box: DRSBox, referentId: string, currentTurn: number): DRSBox {
  const inUniverse = box.universe.some((r) => r.id === referentId);
  if (inUniverse) {
    const universe = box.universe.map((r) => {
      if (r.id !== referentId) return r;
      const newStatus: ReferentStatus = r.status === 'backgrounded' || r.status === 'introduced' ? 'active' : r.status;
      return {
        ...r,
        status: newStatus,
        lastAccessedTurn: currentTurn,
        accessCount: r.accessCount + 1,
      };
    });
    return { ...box, universe };
  }
  const subordinates = box.subordinates.map((sub) => refreshReferent(sub, referentId, currentTurn));
  return { ...box, subordinates };
}

/** Deep clone a DRS box. */
export function cloneDRS(box: DRSBox): DRSBox {
  return {
    id: box.id,
    boxType: box.boxType,
    universe: box.universe.map((r) => ({
      ...r,
      properties: { ...r.properties },
      aliases: [...r.aliases],
    })),
    conditions: box.conditions.map((c) => ({
      ...c,
      referentIds: [...c.referentIds],
    })),
    bindings: [...box.bindings],
    subordinates: box.subordinates.map((sub) => cloneDRS(sub)),
    parentBoxId: box.parentBoxId,
    createdAtTurn: box.createdAtTurn,
  };
}

/** Add a condition to a DRS box. */
export function addCondition(
  box: DRSBox,
  conditionType: DRSConditionType,
  referentIds: readonly string[],
  predicate: string,
  value: string,
  negated: boolean,
): DRSBox {
  const condition: DRSCondition = {
    id: makeId('cond'),
    conditionType,
    referentIds,
    predicate,
    value,
    negated,
  };
  return { ...box, conditions: [...box.conditions, condition] };
}

/** Remove all expired referents and their bindings from the DRS. */
export function compactDRS(box: DRSBox): DRSBox {
  const activeUniverse = box.universe.filter((r) => r.status !== 'expired');
  const activeIds = new Set(activeUniverse.map((r) => r.id));
  const activeBindings = box.bindings.filter((b) => activeIds.has(b.referentId));
  const activeConditions = box.conditions.filter((c) =>
    c.referentIds.every((rid) => activeIds.has(rid)),
  );
  const compactedSubs = box.subordinates.map((sub) => compactDRS(sub));
  return {
    ...box,
    universe: activeUniverse,
    bindings: activeBindings,
    conditions: activeConditions,
    subordinates: compactedSubs,
  };
}

/** Find all referents that are bound to a specific target entity. */
export function getReferentsBoundTo(box: DRSBox, targetEntityId: string): readonly DiscourseReferent[] {
  const boundIds = new Set(
    box.bindings.filter((b) => b.targetEntityId === targetEntityId).map((b) => b.referentId),
  );
  const direct = box.universe.filter((r) => boundIds.has(r.id));
  const fromSubs: DiscourseReferent[] = [];
  for (const sub of box.subordinates) {
    const subResults = getReferentsBoundTo(sub, targetEntityId);
    for (const sr of subResults) {
      fromSubs.push(sr);
    }
  }
  return [...direct, ...fromSubs];
}

/** Get all active referents across all boxes. */
export function getAllActiveReferents(box: DRSBox): readonly DiscourseReferent[] {
  const direct = box.universe.filter((r) => r.status === 'active' || r.status === 'introduced');
  const fromSubs: DiscourseReferent[] = [];
  for (const sub of box.subordinates) {
    const subResults = getAllActiveReferents(sub);
    for (const sr of subResults) {
      fromSubs.push(sr);
    }
  }
  return [...direct, ...fromSubs];
}


// ===================== STEP 203: ANAPHORA RESOLUTION =====================

// ---- 203 Types ----

/** Types of anaphoric expressions. */
export type AnaphoraType =
  | 'personal'
  | 'demonstrative'
  | 'locative'
  | 'temporal'
  | 'possessive'
  | 'reflexive'
  | 'relative'
  | 'zero';

/** An anaphoric expression detected in user input. */
export interface AnaphoricExpression {
  readonly id: string;
  readonly text: string;
  readonly anaphoraType: AnaphoraType;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly grammaticalRole: GrammaticalRole;
  readonly plural: boolean;
  readonly gender: 'neutral' | 'masculine' | 'feminine' | 'unknown';
}

/** A candidate entity for anaphora resolution. */
export interface ResolutionCandidate {
  readonly entityId: string;
  readonly entityName: string;
  readonly entityType: string;
  readonly scores: ResolutionScore;
  readonly totalScore: number;
  readonly source: 'salience' | 'drs' | 'ui-focus' | 'context';
}

/** Breakdown of resolution scores. */
export interface ResolutionScore {
  readonly recency: number;
  readonly frequency: number;
  readonly uiFocus: number;
  readonly grammaticalRole: number;
  readonly semanticCompatibility: number;
}

/** Result of anaphora resolution. */
export interface ResolutionResult {
  readonly expression: AnaphoricExpression;
  readonly resolved: boolean;
  readonly bestCandidate: ResolutionCandidate | undefined;
  readonly candidates: readonly ResolutionCandidate[];
  readonly ambiguous: boolean;
  readonly clarificationNeeded: boolean;
  readonly clarificationText: string;
  readonly explanation: string;
}

/** A rule for resolving a specific anaphoric pattern. */
export interface AnaphoraRule {
  readonly id: string;
  readonly pattern: string;
  readonly anaphoraType: AnaphoraType;
  readonly description: string;
  readonly matcher: (text: string) => boolean;
  readonly preferredEntityType: string;
  readonly contextCondition: string;
  readonly priority: number;
}

// ---- 203 Constants ----

const ANAPHORA_RESOLUTION_WEIGHTS: ResolutionScore = {
  recency: 0.30,
  frequency: 0.15,
  uiFocus: 0.25,
  grammaticalRole: 0.15,
  semanticCompatibility: 0.15,
};

const AMBIGUITY_THRESHOLD = 0.08;
const MIN_RESOLUTION_SCORE = 0.15;
const MAX_CANDIDATES_RETURNED = 5;

/** Pattern definitions for anaphoric expressions. */
interface AnaphoraPatternDef {
  readonly regex: RegExp;
  readonly type: AnaphoraType;
  readonly plural: boolean;
  readonly gender: 'neutral' | 'masculine' | 'feminine' | 'unknown';
  readonly defaultRole: GrammaticalRole;
}

const ANAPHORA_PATTERNS: readonly AnaphoraPatternDef[] = [
  { regex: /\bit\b/i, type: 'personal', plural: false, gender: 'neutral', defaultRole: 'object' },
  { regex: /\bthem\b/i, type: 'personal', plural: true, gender: 'unknown', defaultRole: 'object' },
  { regex: /\bthey\b/i, type: 'personal', plural: true, gender: 'unknown', defaultRole: 'subject' },
  { regex: /\bthat\b/i, type: 'demonstrative', plural: false, gender: 'neutral', defaultRole: 'object' },
  { regex: /\bthis\b/i, type: 'demonstrative', plural: false, gender: 'neutral', defaultRole: 'object' },
  { regex: /\bthese\b/i, type: 'demonstrative', plural: true, gender: 'neutral', defaultRole: 'object' },
  { regex: /\bthose\b/i, type: 'demonstrative', plural: true, gender: 'neutral', defaultRole: 'object' },
  { regex: /\bthere\b/i, type: 'locative', plural: false, gender: 'neutral', defaultRole: 'oblique' },
  { regex: /\bhere\b/i, type: 'locative', plural: false, gender: 'neutral', defaultRole: 'oblique' },
  { regex: /\bthen\b/i, type: 'temporal', plural: false, gender: 'neutral', defaultRole: 'oblique' },
  { regex: /\bits\b/i, type: 'possessive', plural: false, gender: 'neutral', defaultRole: 'possessive' },
  { regex: /\btheir\b/i, type: 'possessive', plural: true, gender: 'unknown', defaultRole: 'possessive' },
  { regex: /\bitself\b/i, type: 'reflexive', plural: false, gender: 'neutral', defaultRole: 'object' },
  { regex: /\bthemselves\b/i, type: 'reflexive', plural: true, gender: 'unknown', defaultRole: 'object' },
  { regex: /\bwhich\b/i, type: 'relative', plural: false, gender: 'neutral', defaultRole: 'subject' },
  { regex: /\bthat(?=\s+(?:is|was|has|had|I|you|we))/i, type: 'relative', plural: false, gender: 'neutral', defaultRole: 'subject' },
];

// ---- 203 Musical context resolution rules ----

function makeAnaphoraRule(
  id: string,
  pattern: string,
  anaphoraType: AnaphoraType,
  description: string,
  matchFn: (text: string) => boolean,
  preferredEntityType: string,
  contextCondition: string,
  priority: number,
): AnaphoraRule {
  return { id, pattern, anaphoraType, description, matcher: matchFn, preferredEntityType, contextCondition, priority };
}

function buildAnaphoraRules(): readonly AnaphoraRule[] {
  const rules: AnaphoraRule[] = [];
  // Personal pronoun rules
  rules.push(makeAnaphoraRule('pr-it-after-section', 'it (after section mention)', 'personal',
    '"it" after mentioning a section resolves to that section',
    (t) => /\bit\b/i.test(t), 'section', 'last-mentioned-is-section', 10));
  rules.push(makeAnaphoraRule('pr-it-after-layer', 'it (after layer mention)', 'personal',
    '"it" after mentioning a layer resolves to that layer',
    (t) => /\bit\b/i.test(t), 'layer', 'last-mentioned-is-layer', 10));
  rules.push(makeAnaphoraRule('pr-it-after-card', 'it (after card mention)', 'personal',
    '"it" after mentioning a card resolves to that card',
    (t) => /\bit\b/i.test(t), 'card', 'last-mentioned-is-card', 10));
  rules.push(makeAnaphoraRule('pr-it-after-effect', 'it (after effect mention)', 'personal',
    '"it" after mentioning an effect resolves to that effect',
    (t) => /\bit\b/i.test(t), 'effect', 'last-mentioned-is-effect', 9));
  rules.push(makeAnaphoraRule('pr-it-after-motif', 'it (after motif mention)', 'personal',
    '"it" after mentioning a motif resolves to that motif',
    (t) => /\bit\b/i.test(t), 'motif', 'last-mentioned-is-motif', 9));
  rules.push(makeAnaphoraRule('pr-it-after-instrument', 'it (after instrument mention)', 'personal',
    '"it" after mentioning an instrument resolves to that instrument',
    (t) => /\bit\b/i.test(t), 'instrument', 'last-mentioned-is-instrument', 8));
  rules.push(makeAnaphoraRule('pr-them-plural-notes', 'them (plural notes)', 'personal',
    '"them" refers to a group of notes or items',
    (t) => /\bthem\b/i.test(t), 'note', 'last-mentioned-is-plural', 8));
  rules.push(makeAnaphoraRule('pr-they-plural-tracks', 'they (plural tracks)', 'personal',
    '"they" refers to a group of tracks or layers',
    (t) => /\bthey\b/i.test(t), 'track', 'last-mentioned-is-plural', 8));

  // Demonstrative rules
  rules.push(makeAnaphoraRule('dem-that-after-diff', 'that (after diff shown)', 'demonstrative',
    '"that" after showing a diff resolves to the diff',
    (t) => /\bthat\b/i.test(t), 'diff', 'last-action-was-diff', 12));
  rules.push(makeAnaphoraRule('dem-that-after-plan', 'that (after plan shown)', 'demonstrative',
    '"that" after showing a plan resolves to the plan',
    (t) => /\bthat\b/i.test(t), 'plan', 'last-action-was-plan', 11));
  rules.push(makeAnaphoraRule('dem-this-current-focus', 'this (current focus)', 'demonstrative',
    '"this" resolves to the currently focused entity',
    (t) => /\bthis\b/i.test(t), '', 'has-focus', 10));
  rules.push(makeAnaphoraRule('dem-these-selection', 'these (current selection)', 'demonstrative',
    '"these" resolves to the current UI selection',
    (t) => /\bthese\b/i.test(t), '', 'has-selection', 11));
  rules.push(makeAnaphoraRule('dem-those-previous', 'those (previous mention)', 'demonstrative',
    '"those" resolves to previously mentioned plural entities',
    (t) => /\bthose\b/i.test(t), '', 'has-plural-history', 9));

  // Locative rules
  rules.push(makeAnaphoraRule('loc-there-scope', 'there (current scope)', 'locative',
    '"there" resolves to the current scope location (e.g. playback position)',
    (t) => /\bthere\b/i.test(t), 'timeRange', 'has-scope', 8));
  rules.push(makeAnaphoraRule('loc-here-focus', 'here (focused location)', 'locative',
    '"here" resolves to the currently focused location or section',
    (t) => /\bhere\b/i.test(t), 'section', 'has-focus', 9));

  // Temporal rules
  rules.push(makeAnaphoraRule('tmp-then-after-time', 'then (after time reference)', 'temporal',
    '"then" resolves to the last mentioned time point or range',
    (t) => /\bthen\b/i.test(t), 'timeRange', 'has-time-ref', 8));

  // Possessive rules
  rules.push(makeAnaphoraRule('poss-its-entity', 'its (possessive)', 'possessive',
    '"its" refers to a property of the last mentioned entity',
    (t) => /\bits\b/i.test(t), '', 'has-recent-entity', 7));
  rules.push(makeAnaphoraRule('poss-their-plural', 'their (plural possessive)', 'possessive',
    '"their" refers to properties of a group',
    (t) => /\btheir\b/i.test(t), '', 'has-plural-entity', 7));

  // Reflexive rules
  rules.push(makeAnaphoraRule('refl-itself-same', 'itself (reflexive)', 'reflexive',
    '"itself" refers back to the subject of the clause',
    (t) => /\bitself\b/i.test(t), '', 'has-clause-subject', 6));

  // Zero anaphora (implicit subject)
  rules.push(makeAnaphoraRule('zero-imperative', '(zero) imperative subject', 'zero',
    'Imperative sentences with no explicit object default to focused entity',
    (t) => /^(make|add|remove|delete|copy|move|set|change|adjust|increase|decrease|raise|lower|brighten|darken|widen|narrow)\b/i.test(t),
    '', 'has-focus-or-selection', 5));
  rules.push(makeAnaphoraRule('zero-verb-only', '(zero) verb-only command', 'zero',
    'Single-verb commands like "louder" or "brighter" target focused entity',
    (t) => /^(louder|softer|brighter|darker|faster|slower|shorter|longer|higher|lower|wider|narrower)\s*$/i.test(t),
    '', 'has-focus-or-selection', 6));

  // Additional musical context rules
  rules.push(makeAnaphoraRule('pr-it-after-automation', 'it (after automation ref)', 'personal',
    '"it" after automation mention resolves to automation lane',
    (t) => /\bit\b/i.test(t), 'automation', 'last-mentioned-is-automation', 8));
  rules.push(makeAnaphoraRule('pr-it-after-plugin', 'it (after plugin ref)', 'personal',
    '"it" after plugin mention resolves to plugin',
    (t) => /\bit\b/i.test(t), 'plugin', 'last-mentioned-is-plugin', 8));
  rules.push(makeAnaphoraRule('pr-it-after-region', 'it (after region ref)', 'personal',
    '"it" after region mention resolves to region',
    (t) => /\bit\b/i.test(t), 'region', 'last-mentioned-is-region', 8));
  rules.push(makeAnaphoraRule('dem-that-after-chord', 'that (after chord change)', 'demonstrative',
    '"that" after a chord change resolves to the chord',
    (t) => /\bthat\b/i.test(t), 'chord', 'last-mentioned-is-chord', 9));
  rules.push(makeAnaphoraRule('dem-this-after-note', 'this (after note selection)', 'demonstrative',
    '"this" after a note is selected resolves to that note',
    (t) => /\bthis\b/i.test(t), 'note', 'last-selected-is-note', 10));
  rules.push(makeAnaphoraRule('pr-it-after-send', 'it (after send mention)', 'personal',
    '"it" after send mention resolves to the send',
    (t) => /\bit\b/i.test(t), 'send', 'last-mentioned-is-send', 7));
  rules.push(makeAnaphoraRule('pr-it-after-mixbus', 'it (after mix bus mention)', 'personal',
    '"it" after mix bus mention resolves to the mix bus',
    (t) => /\bit\b/i.test(t), 'mixBus', 'last-mentioned-is-mixbus', 7));

  return rules;
}

const ANAPHORA_RULES: readonly AnaphoraRule[] = buildAnaphoraRules();

// ---- 203 Functions ----

/** Detect all anaphoric expressions in a text string. */
export function detectAnaphoricExpressions(text: string): readonly AnaphoricExpression[] {
  const results: AnaphoricExpression[] = [];
  const seenOffsets = new Set<number>();

  for (const pat of ANAPHORA_PATTERNS) {
    const globalRegex = new RegExp(pat.regex.source, 'gi');
    let match = globalRegex.exec(text);
    while (match != null) {
      const startOffset = match.index;
      if (!seenOffsets.has(startOffset)) {
        seenOffsets.add(startOffset);
        const matchedText = match[0] != null ? match[0] : '';
        results.push({
          id: makeId('anaph'),
          text: matchedText,
          anaphoraType: pat.type,
          startOffset,
          endOffset: startOffset + matchedText.length,
          grammaticalRole: pat.defaultRole,
          plural: pat.plural,
          gender: pat.gender,
        });
      }
      match = globalRegex.exec(text);
    }
  }

  return results.sort((a, b) => a.startOffset - b.startOffset);
}

/** Score a candidate entity for resolving an anaphoric expression. */
export function scoreCandidate(
  expression: AnaphoricExpression,
  entity: SalientEntity,
  state: DialogueState,
  drs: DRSBox,
): ResolutionCandidate {
  const halfLife = state.salienceDecayHalfLifeTurns;
  const recencyScore = computeRecencyFactor(state.currentTurn, entity.salience.recencyTurn, halfLife);
  const frequencyScore = clamp(entity.salience.frequency / 10, 0, 1);
  const uiFocusScore = entity.salience.uiFocused ? 1.0 : 0.0;

  const entityRole = ROLE_PROMINENCE[entity.salience.grammaticalRole];
  const roleScore = entityRole != null ? entityRole : 0.0;

  // Semantic compatibility: check if entity type matches any preferred type from rules
  let semanticScore = 0.5; // baseline
  const matchingRules = ANAPHORA_RULES.filter(
    (r) => r.anaphoraType === expression.anaphoraType && r.matcher(expression.text),
  );
  for (const rule of matchingRules) {
    if (rule.preferredEntityType !== '' && entity.entityType === rule.preferredEntityType) {
      semanticScore = 1.0;
      break;
    }
  }

  // Check plurality match
  if (expression.plural) {
    // Plural anaphors prefer groups or plural-marked entities
    if (entity.entityType === 'group' || entity.entityType === 'note') {
      semanticScore = Math.max(semanticScore, 0.8);
    }
  }

  // Check DRS for additional binding info
  const drsRefs = getReferentsByName(drs, entity.name);
  if (drsRefs.length > 0) {
    semanticScore = Math.min(1.0, semanticScore + 0.1);
  }

  const scores: ResolutionScore = {
    recency: recencyScore,
    frequency: frequencyScore,
    uiFocus: uiFocusScore,
    grammaticalRole: roleScore,
    semanticCompatibility: semanticScore,
  };

  const totalScore =
    ANAPHORA_RESOLUTION_WEIGHTS.recency * scores.recency +
    ANAPHORA_RESOLUTION_WEIGHTS.frequency * scores.frequency +
    ANAPHORA_RESOLUTION_WEIGHTS.uiFocus * scores.uiFocus +
    ANAPHORA_RESOLUTION_WEIGHTS.grammaticalRole * scores.grammaticalRole +
    ANAPHORA_RESOLUTION_WEIGHTS.semanticCompatibility * scores.semanticCompatibility;

  return {
    entityId: entity.id,
    entityName: entity.name,
    entityType: entity.entityType,
    scores,
    totalScore,
    source: entity.salience.uiFocused ? 'ui-focus' : 'salience',
  };
}

/** Check if a resolution is ambiguous (top two candidates are too close). */
export function isAmbiguousAnaphora(candidates: readonly ResolutionCandidate[]): boolean {
  if (candidates.length < 2) return false;
  const first = candidates[0];
  const second = candidates[1];
  if (first == null || second == null) return false;
  return Math.abs(first.totalScore - second.totalScore) < AMBIGUITY_THRESHOLD;
}

/** Get the top N candidates sorted by score. */
export function getTopCandidates(candidates: readonly ResolutionCandidate[], n: number): readonly ResolutionCandidate[] {
  const sorted = [...candidates].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.slice(0, Math.max(0, n));
}

/** Generate a clarification question for an ambiguous anaphoric expression. */
export function generateClarificationForAnaphora(
  expression: AnaphoricExpression,
  candidates: readonly ResolutionCandidate[],
): string {
  if (candidates.length === 0) {
    return 'I could not determine what "' + expression.text + '" refers to. Could you be more specific?';
  }
  const topCands = getTopCandidates(candidates, 3);
  const options = topCands.map((c) => '"' + c.entityName + '" (' + c.entityType + ')');
  return 'When you say "' + expression.text + '", do you mean ' + options.join(' or ') + '?';
}

/** Get all available anaphora rules. */
export function getAnaphoraRules(): readonly AnaphoraRule[] {
  return ANAPHORA_RULES;
}

/** Apply a specific anaphora rule to get preferred entity type. */
export function applyAnaphoraRule(
  rule: AnaphoraRule,
  text: string,
): { matched: boolean; preferredType: string } {
  const matched = rule.matcher(text);
  return { matched, preferredType: matched ? rule.preferredEntityType : '' };
}

/** Format a human-readable explanation of how a resolution was reached. */
export function formatResolutionExplanation(result: ResolutionResult): string {
  const lines: string[] = [];
  lines.push('Anaphora: "' + result.expression.text + '" (' + result.expression.anaphoraType + ')');
  if (result.resolved && result.bestCandidate != null) {
    const bc = result.bestCandidate;
    lines.push('Resolved to: ' + bc.entityName + ' (' + bc.entityType + ')');
    lines.push('Total score: ' + bc.totalScore.toFixed(3));
    lines.push('  Recency: ' + bc.scores.recency.toFixed(3));
    lines.push('  Frequency: ' + bc.scores.frequency.toFixed(3));
    lines.push('  UI Focus: ' + bc.scores.uiFocus.toFixed(3));
    lines.push('  Gram. Role: ' + bc.scores.grammaticalRole.toFixed(3));
    lines.push('  Sem. Compat: ' + bc.scores.semanticCompatibility.toFixed(3));
  } else if (result.ambiguous) {
    lines.push('AMBIGUOUS - clarification needed');
    lines.push('Top candidates:');
    for (const c of result.candidates.slice(0, 3)) {
      lines.push('  ' + c.entityName + ' (' + c.entityType + ') score=' + c.totalScore.toFixed(3));
    }
  } else {
    lines.push('UNRESOLVED - no suitable candidates found');
  }
  return lines.join('\n');
}

/** Resolve a single anaphoric expression against the dialogue state and DRS. */
export function resolveAnaphora(
  expression: AnaphoricExpression,
  state: DialogueState,
  drs: DRSBox,
): ResolutionResult {
  // Score all salient entities
  const candidates: ResolutionCandidate[] = [];
  for (const entity of state.salientEntities) {
    const candidate = scoreCandidate(expression, entity, state, drs);
    if (candidate.totalScore >= MIN_RESOLUTION_SCORE) {
      candidates.push(candidate);
    }
  }

  const sorted = [...candidates].sort((a, b) => b.totalScore - a.totalScore);
  const topN = sorted.slice(0, MAX_CANDIDATES_RETURNED);
  const best = topN[0];

  // Check for special cases
  // "that" after a diff
  if (expression.anaphoraType === 'demonstrative' && /\bthat\b/i.test(expression.text) && state.lastDiffSummary !== '') {
    const diffCandidate: ResolutionCandidate = {
      entityId: '__last_diff__',
      entityName: 'last diff',
      entityType: 'diff',
      scores: { recency: 1.0, frequency: 0.5, uiFocus: 0.0, grammaticalRole: 0.5, semanticCompatibility: 1.0 },
      totalScore: 0.85,
      source: 'context',
    };
    const allCandidates = [diffCandidate, ...topN];
    return {
      expression,
      resolved: true,
      bestCandidate: diffCandidate,
      candidates: allCandidates,
      ambiguous: false,
      clarificationNeeded: false,
      clarificationText: '',
      explanation: '"that" resolved to last diff via context rule',
    };
  }

  // Locative "there" -> current scope
  if (expression.anaphoraType === 'locative' && /\bthere\b/i.test(expression.text)) {
    const focus = getCurrentFocus(state);
    if (focus != null) {
      const locCandidate: ResolutionCandidate = {
        entityId: focus.scopeId,
        entityName: focus.scopeName,
        entityType: focus.scopeType,
        scores: { recency: 1.0, frequency: 0.5, uiFocus: 1.0, grammaticalRole: 0.3, semanticCompatibility: 0.9 },
        totalScore: 0.80,
        source: 'context',
      };
      return {
        expression,
        resolved: true,
        bestCandidate: locCandidate,
        candidates: [locCandidate, ...topN],
        ambiguous: false,
        clarificationNeeded: false,
        clarificationText: '',
        explanation: '"there" resolved to current focus scope',
      };
    }
  }

  // Check for ambiguity
  const ambiguous = isAmbiguousAnaphora(topN);

  if (best == null) {
    return {
      expression,
      resolved: false,
      bestCandidate: undefined,
      candidates: topN,
      ambiguous: false,
      clarificationNeeded: true,
      clarificationText: generateClarificationForAnaphora(expression, topN),
      explanation: 'No candidates above minimum score threshold',
    };
  }

  if (ambiguous) {
    return {
      expression,
      resolved: false,
      bestCandidate: best,
      candidates: topN,
      ambiguous: true,
      clarificationNeeded: true,
      clarificationText: generateClarificationForAnaphora(expression, topN),
      explanation: 'Top candidates too close in score; clarification required',
    };
  }

  return {
    expression,
    resolved: true,
    bestCandidate: best,
    candidates: topN,
    ambiguous: false,
    clarificationNeeded: false,
    clarificationText: '',
    explanation: 'Resolved to top candidate by salience scoring',
  };
}

/** Batch-resolve all anaphoric expressions in a text. */
export function batchResolveAnaphora(
  text: string,
  state: DialogueState,
  drs: DRSBox,
): readonly ResolutionResult[] {
  const expressions = detectAnaphoricExpressions(text);
  const results: ResolutionResult[] = [];
  for (const expr of expressions) {
    results.push(resolveAnaphora(expr, state, drs));
  }
  return results;
}

/** Get anaphora rules that match a given text and type. */
export function getMatchingAnaphoraRules(text: string, aType: AnaphoraType): readonly AnaphoraRule[] {
  return ANAPHORA_RULES.filter((r) => r.anaphoraType === aType && r.matcher(text));
}

/** Count how many anaphoric expressions are in a text. */
export function countAnaphoricExpressions(text: string): number {
  return detectAnaphoricExpressions(text).length;
}

/** Check if a text contains any anaphoric expressions at all. */
export function hasAnaphoricExpressions(text: string): boolean {
  return countAnaphoricExpressions(text) > 0;
}

/** Get a summary of all resolution results. */
export function summarizeResolutions(results: readonly ResolutionResult[]): string {
  const lines: string[] = [];
  lines.push('=== Anaphora Resolution Summary ===');
  lines.push('Total expressions: ' + String(results.length));
  const resolved = results.filter((r) => r.resolved).length;
  const ambiguous = results.filter((r) => r.ambiguous).length;
  const unresolved = results.filter((r) => !r.resolved && !r.ambiguous).length;
  lines.push('Resolved: ' + String(resolved));
  lines.push('Ambiguous: ' + String(ambiguous));
  lines.push('Unresolved: ' + String(unresolved));
  for (const r of results) {
    if (r.resolved && r.bestCandidate != null) {
      lines.push('  "' + r.expression.text + '" -> ' + r.bestCandidate.entityName);
    } else if (r.ambiguous) {
      lines.push('  "' + r.expression.text + '" -> AMBIGUOUS');
    } else {
      lines.push('  "' + r.expression.text + '" -> UNRESOLVED');
    }
  }
  return lines.join('\n');
}


// ===================== STEP 204: DEFINITE DESCRIPTION RESOLUTION =====================

// ---- 204 Types ----

/** Strategy used to match a definite description. */
export type MatchStrategy =
  | 'exact-name'
  | 'type-match'
  | 'ordinal'
  | 'relative-position'
  | 'property-match'
  | 'unique-type'
  | 'metadata-match'
  | 'alias-match'
  | 'partial-name';

/** A definite description detected in user input. */
export interface DefiniteDescription {
  readonly id: string;
  readonly text: string;
  readonly headNoun: string;
  readonly determiner: string;
  readonly modifiers: readonly string[];
  readonly ordinal: number;
  readonly relativePosition: string;
  readonly propertyConstraints: Record<string, string>;
  readonly startOffset: number;
  readonly endOffset: number;
}

/** A match between a definite description and an entity. */
export interface DescriptionMatch {
  readonly entityId: string;
  readonly entityName: string;
  readonly entityType: string;
  readonly strategy: MatchStrategy;
  readonly confidence: number;
  readonly matchDetails: string;
}

/** Resolution status for a definite description. */
export type DescriptionResolutionStatus = 'unique' | 'ambiguous' | 'no-match' | 'presupposition-failure';

/** Result of definite description resolution. */
export interface DescriptionResolution {
  readonly description: DefiniteDescription;
  readonly status: DescriptionResolutionStatus;
  readonly bestMatch: DescriptionMatch | undefined;
  readonly allMatches: readonly DescriptionMatch[];
  readonly clarificationText: string;
  readonly explanation: string;
}

/** A pattern for detecting definite descriptions. */
export interface DescriptionPattern {
  readonly id: string;
  readonly regex: RegExp;
  readonly headNounExtractor: (match: RegExpMatchArray) => string;
  readonly modifierExtractor: (match: RegExpMatchArray) => readonly string[];
  readonly ordinalExtractor: (match: RegExpMatchArray) => number;
  readonly entityTypeHint: string;
  readonly description: string;
}

// ---- 204 Constants ----

const DESCRIPTION_CONFIDENCE_THRESHOLD = 0.3;

/** Known section names in music production. */
const KNOWN_SECTION_NAMES: readonly string[] = [
  'intro', 'verse', 'chorus', 'bridge', 'outro', 'pre-chorus', 'post-chorus',
  'hook', 'breakdown', 'buildup', 'drop', 'interlude', 'solo', 'coda',
  'refrain', 'tag', 'turnaround', 'vamp', 'instrumental',
];

/** Known musical parameter names. */
const KNOWN_PARAMETER_NAMES: readonly string[] = [
  'volume', 'pan', 'tempo', 'pitch', 'gain', 'reverb', 'delay',
  'compression', 'eq', 'filter', 'cutoff', 'resonance', 'attack',
  'release', 'decay', 'sustain', 'threshold', 'ratio', 'width',
  'depth', 'rate', 'feedback', 'mix', 'dry', 'wet', 'brightness',
];

/** Known effect names. */
const KNOWN_EFFECT_NAMES: readonly string[] = [
  'reverb', 'delay', 'chorus', 'flanger', 'phaser', 'distortion',
  'overdrive', 'compressor', 'limiter', 'eq', 'equalizer', 'filter',
  'gate', 'expander', 'de-esser', 'saturator', 'bitcrusher',
  'tremolo', 'vibrato', 'wah', 'auto-pan',
];

/** Ordinal word to number mapping. */
const ORDINAL_MAP: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  last: -1, final: -1, penultimate: -2,
};

/** Relative position keywords. */
const RELATIVE_POSITION_MAP: Record<string, string> = {
  next: 'next', previous: 'previous', prev: 'previous',
  following: 'next', preceding: 'previous', before: 'previous', after: 'next',
  above: 'above', below: 'below', top: 'first', bottom: 'last',
  beginning: 'first', end: 'last', start: 'first', middle: 'middle',
  current: 'current', same: 'current', other: 'other',
};

/** Musical property adjectives mapped to their parameter and value. */
const PROPERTY_ADJECTIVE_MAP: Record<string, { param: string; value: string }> = {
  loud: { param: 'volume', value: 'high' },
  quiet: { param: 'volume', value: 'low' },
  soft: { param: 'volume', value: 'low' },
  bright: { param: 'brightness', value: 'high' },
  dark: { param: 'brightness', value: 'low' },
  fast: { param: 'tempo', value: 'high' },
  slow: { param: 'tempo', value: 'low' },
  long: { param: 'duration', value: 'high' },
  short: { param: 'duration', value: 'low' },
  high: { param: 'pitch', value: 'high' },
  low: { param: 'pitch', value: 'low' },
  wide: { param: 'width', value: 'high' },
  narrow: { param: 'width', value: 'low' },
  wet: { param: 'mix', value: 'high' },
  dry: { param: 'mix', value: 'low' },
  heavy: { param: 'intensity', value: 'high' },
  light: { param: 'intensity', value: 'low' },
  dense: { param: 'density', value: 'high' },
  sparse: { param: 'density', value: 'low' },
  clean: { param: 'distortion', value: 'low' },
  dirty: { param: 'distortion', value: 'high' },
  warm: { param: 'warmth', value: 'high' },
  cold: { param: 'warmth', value: 'low' },
  sharp: { param: 'attack', value: 'fast' },
  smooth: { param: 'attack', value: 'slow' },
  punchy: { param: 'transient', value: 'high' },
};

// ---- 204 Pattern definitions ----

function buildDescriptionPatterns(): readonly DescriptionPattern[] {
  const patterns: DescriptionPattern[] = [];

  // "the chorus", "the bridge", "the intro"
  patterns.push({
    id: 'dp-the-section',
    regex: /\bthe\s+(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|hook|breakdown|buildup|drop|interlude|solo|coda|refrain|tag|turnaround|vamp|instrumental)\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'section',
    description: 'Direct section name reference',
  });

  // "the second verse", "the first chorus"
  patterns.push({
    id: 'dp-ordinal-section',
    regex: /\bthe\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|final|penultimate)\s+(intro|verse|chorus|bridge|outro|pre-chorus|post-chorus|hook|breakdown|buildup|drop|interlude|solo|coda|refrain)\b/i,
    headNounExtractor: (m) => { const v = m[2]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: (m) => {
      const v = m[1];
      if (v == null) return 0;
      const mapped = ORDINAL_MAP[v.toLowerCase()];
      return mapped != null ? mapped : 0;
    },
    entityTypeHint: 'section',
    description: 'Ordinal section reference',
  });

  // "the next section", "the previous part"
  patterns.push({
    id: 'dp-relative-section',
    regex: /\bthe\s+(next|previous|prev|following|preceding|current|other)\s+(section|part|segment|region|block)\b/i,
    headNounExtractor: (m) => { const v = m[2]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: () => 0,
    entityTypeHint: 'section',
    description: 'Relative position section reference',
  });

  // "the bass track", "the drum track", "the vocal track"
  patterns.push({
    id: 'dp-named-track',
    regex: /\bthe\s+(\w+)\s+track\b/i,
    headNounExtractor: () => 'track',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: () => 0,
    entityTypeHint: 'track',
    description: 'Named track reference',
  });

  // "the reverb", "the delay", "the compressor"
  patterns.push({
    id: 'dp-effect-name',
    regex: /\bthe\s+(reverb|delay|chorus|flanger|phaser|distortion|overdrive|compressor|limiter|eq|equalizer|filter|gate|expander|de-esser|saturator|bitcrusher|tremolo|vibrato|wah|auto-pan)\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'effect',
    description: 'Effect name reference',
  });

  // "the volume", "the tempo", "the pitch"
  patterns.push({
    id: 'dp-parameter-name',
    regex: /\bthe\s+(volume|pan|tempo|pitch|gain|reverb|delay|compression|eq|filter|cutoff|resonance|attack|release|decay|sustain|threshold|ratio|width|depth|rate|feedback|mix|dry|wet|brightness)\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'parameter',
    description: 'Parameter name reference',
  });

  // "the loud part", "the bright section", "the fast bit"
  patterns.push({
    id: 'dp-property-part',
    regex: /\bthe\s+(loud|quiet|soft|bright|dark|fast|slow|long|short|high|low|wide|narrow|wet|dry|heavy|light|dense|sparse|clean|dirty|warm|cold|sharp|smooth|punchy)\s+(part|section|bit|segment|passage|phrase|region)\b/i,
    headNounExtractor: (m) => { const v = m[2]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: () => 0,
    entityTypeHint: 'section',
    description: 'Property-based section reference',
  });

  // "the melody", "the bassline", "the harmony"
  patterns.push({
    id: 'dp-musical-element',
    regex: /\bthe\s+(melody|bassline|bass\s*line|harmony|rhythm|beat|groove|riff|lick|fill|break|motif|theme|countermelody|counter-melody|ostinato|arpeggio|pad)\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'motif',
    description: 'Musical element reference',
  });

  // "the piano", "the guitar", "the synth"
  patterns.push({
    id: 'dp-instrument',
    regex: /\bthe\s+(piano|guitar|bass|drums|synth|synthesizer|organ|strings|brass|woodwinds|percussion|keys|keyboard|vocals|voice|horns|pad|lead|pluck)\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'instrument',
    description: 'Instrument reference',
  });

  // "the automation lane", "the automation curve"
  patterns.push({
    id: 'dp-automation',
    regex: /\bthe\s+(automation)\s*(lane|curve|line|envelope)?\b/i,
    headNounExtractor: () => 'automation',
    modifierExtractor: (m) => { const v = m[2]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: () => 0,
    entityTypeHint: 'automation',
    description: 'Automation reference',
  });

  // "the mix bus", "the master bus"
  patterns.push({
    id: 'dp-bus',
    regex: /\bthe\s+(mix|master|aux|sub)\s*bus\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() + ' bus' : 'bus'; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'mixBus',
    description: 'Mix bus reference',
  });

  // "the send", "the aux send"
  patterns.push({
    id: 'dp-send',
    regex: /\bthe\s+(?:(aux|pre|post)\s+)?send\b/i,
    headNounExtractor: () => 'send',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: () => 0,
    entityTypeHint: 'send',
    description: 'Send reference',
  });

  // "the plugin"
  patterns.push({
    id: 'dp-plugin',
    regex: /\bthe\s+(plugin|plug-in|vst|effect\s+unit)\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'plugin',
    description: 'Plugin reference',
  });

  // "the marker", "the first marker"
  patterns.push({
    id: 'dp-marker',
    regex: /\bthe\s+(?:(first|second|third|fourth|fifth|last|final|next|previous)\s+)?marker\b/i,
    headNounExtractor: () => 'marker',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: (m) => {
      const v = m[1];
      if (v == null) return 0;
      const mapped = ORDINAL_MAP[v.toLowerCase()];
      return mapped != null ? mapped : 0;
    },
    entityTypeHint: 'marker',
    description: 'Marker reference',
  });

  // "the group"
  patterns.push({
    id: 'dp-group',
    regex: /\bthe\s+(?:(\w+)\s+)?group\b/i,
    headNounExtractor: () => 'group',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: () => 0,
    entityTypeHint: 'group',
    description: 'Group reference',
  });

  // "the note", "the chord"
  patterns.push({
    id: 'dp-note-or-chord',
    regex: /\bthe\s+(?:(first|second|third|fourth|fifth|last|final|next|previous|selected)\s+)?(note|chord|scale)\b/i,
    headNounExtractor: (m) => { const v = m[2]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: (m) => {
      const v = m[1];
      if (v == null) return 0;
      const mapped = ORDINAL_MAP[v.toLowerCase()];
      return mapped != null ? mapped : 0;
    },
    entityTypeHint: 'note',
    description: 'Note or chord reference',
  });

  // "the layer", "the top layer"
  patterns.push({
    id: 'dp-layer',
    regex: /\bthe\s+(?:(top|bottom|first|second|third|last|final|next|previous|selected|main|upper|lower)\s+)?layer\b/i,
    headNounExtractor: () => 'layer',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: (m) => {
      const v = m[1];
      if (v == null) return 0;
      const mapped = ORDINAL_MAP[v.toLowerCase()];
      return mapped != null ? mapped : 0;
    },
    entityTypeHint: 'layer',
    description: 'Layer reference',
  });

  // "the card", "the selected card"
  patterns.push({
    id: 'dp-card',
    regex: /\bthe\s+(?:(first|second|third|last|final|next|previous|selected|current)\s+)?card\b/i,
    headNounExtractor: () => 'card',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: (m) => {
      const v = m[1];
      if (v == null) return 0;
      const mapped = ORDINAL_MAP[v.toLowerCase()];
      return mapped != null ? mapped : 0;
    },
    entityTypeHint: 'card',
    description: 'Card reference',
  });

  // "the region"
  patterns.push({
    id: 'dp-region',
    regex: /\bthe\s+(?:(first|second|third|last|final|next|previous|selected|current)\s+)?region\b/i,
    headNounExtractor: () => 'region',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: (m) => {
      const v = m[1];
      if (v == null) return 0;
      const mapped = ORDINAL_MAP[v.toLowerCase()];
      return mapped != null ? mapped : 0;
    },
    entityTypeHint: 'region',
    description: 'Region reference',
  });

  // "the tempo"
  patterns.push({
    id: 'dp-tempo',
    regex: /\bthe\s+tempo\b/i,
    headNounExtractor: () => 'tempo',
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: 'tempo',
    description: 'Tempo reference',
  });

  // "the time range", "the selection range"
  patterns.push({
    id: 'dp-time-range',
    regex: /\bthe\s+(?:(time|selection|loop|playback)\s+)?range\b/i,
    headNounExtractor: () => 'range',
    modifierExtractor: (m) => { const v = m[1]; return v != null ? [v.toLowerCase()] : []; },
    ordinalExtractor: () => 0,
    entityTypeHint: 'timeRange',
    description: 'Time range reference',
  });

  // Fallback: "the <word>"
  patterns.push({
    id: 'dp-generic-the',
    regex: /\bthe\s+(\w+)\b/i,
    headNounExtractor: (m) => { const v = m[1]; return v != null ? v.toLowerCase() : ''; },
    modifierExtractor: () => [],
    ordinalExtractor: () => 0,
    entityTypeHint: '',
    description: 'Generic definite article reference',
  });

  return patterns;
}

const DESCRIPTION_PATTERNS: readonly DescriptionPattern[] = buildDescriptionPatterns();

// ---- 204 Functions ----

/** Detect all definite descriptions in a text. */
export function detectDefiniteDescriptions(text: string): readonly DefiniteDescription[] {
  const results: DefiniteDescription[] = [];
  const seenOffsets = new Set<number>();

  for (const pat of DESCRIPTION_PATTERNS) {
    const globalRegex = new RegExp(pat.regex.source, 'gi');
    let match = globalRegex.exec(text);
    while (match != null) {
      const startOffset = match.index;
      if (!seenOffsets.has(startOffset)) {
        seenOffsets.add(startOffset);
        const headNoun = pat.headNounExtractor(match);
        const modifiers = pat.modifierExtractor(match);
        const ordinal = pat.ordinalExtractor(match);
        const matchedText = match[0] != null ? match[0] : '';

        // Build property constraints from modifiers
        const propertyConstraints: Record<string, string> = {};
        for (const mod of modifiers) {
          const propInfo = PROPERTY_ADJECTIVE_MAP[mod];
          if (propInfo != null) {
            propertyConstraints[propInfo.param] = propInfo.value;
          }
          const relPos = RELATIVE_POSITION_MAP[mod];
          if (relPos != null) {
            propertyConstraints['relativePosition'] = relPos;
          }
        }

        // Determine relative position from modifiers
        let relativePosition = '';
        for (const mod of modifiers) {
          const rp = RELATIVE_POSITION_MAP[mod];
          if (rp != null) {
            relativePosition = rp;
            break;
          }
        }

        results.push({
          id: makeId('desc'),
          text: matchedText,
          headNoun,
          determiner: 'the',
          modifiers,
          ordinal,
          relativePosition,
          propertyConstraints,
          startOffset,
          endOffset: startOffset + matchedText.length,
        });
      }
      match = globalRegex.exec(text);
    }
  }

  return results.sort((a, b) => a.startOffset - b.startOffset);
}

/** Find entities matching a definite description using all strategies. */
export function findMatchingEntities(
  description: DefiniteDescription,
  state: DialogueState,
  drs: DRSBox,
): readonly DescriptionMatch[] {
  const matches: DescriptionMatch[] = [];

  // Strategy 1: Exact name match
  for (const entity of state.salientEntities) {
    if (entity.name.toLowerCase() === description.headNoun.toLowerCase()) {
      matches.push({
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.entityType,
        strategy: 'exact-name',
        confidence: 0.95,
        matchDetails: 'Exact name match: "' + entity.name + '"',
      });
    }
  }

  // Strategy 2: Type match from DRS
  const typeHintFromPatterns = DESCRIPTION_PATTERNS.find((p) => {
    const testRegex = new RegExp(p.regex.source, 'i');
    return testRegex.test(description.text);
  });
  const hintType = typeHintFromPatterns != null ? typeHintFromPatterns.entityTypeHint : '';
  if (hintType !== '') {
    for (const entity of state.salientEntities) {
      if (entity.entityType === hintType) {
        const alreadyMatched = matches.some((m) => m.entityId === entity.id);
        if (!alreadyMatched) {
          matches.push({
            entityId: entity.id,
            entityName: entity.name,
            entityType: entity.entityType,
            strategy: 'type-match',
            confidence: 0.70,
            matchDetails: 'Type match: entity type "' + entity.entityType + '" matches hint "' + hintType + '"',
          });
        }
      }
    }
  }

  // Strategy 3: DRS referent name match
  const drsRefs = getReferentsByName(drs, description.headNoun);
  for (const ref of drsRefs) {
    if (ref.boundTo !== '') {
      const alreadyMatched = matches.some((m) => m.entityId === ref.boundTo);
      if (!alreadyMatched) {
        matches.push({
          entityId: ref.boundTo,
          entityName: ref.name,
          entityType: ref.referentType,
          strategy: 'exact-name',
          confidence: 0.85,
          matchDetails: 'DRS referent match: "' + ref.name + '" bound to ' + ref.boundTo,
        });
      }
    }
  }

  // Strategy 4: Alias match in salient entities
  for (const entity of state.salientEntities) {
    const nameLC = description.headNoun.toLowerCase();
    const partialMatch = entity.name.toLowerCase().includes(nameLC) || nameLC.includes(entity.name.toLowerCase());
    if (partialMatch) {
      const alreadyMatched = matches.some((m) => m.entityId === entity.id);
      if (!alreadyMatched) {
        matches.push({
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.entityType,
          strategy: 'partial-name',
          confidence: 0.55,
          matchDetails: 'Partial name match: "' + entity.name + '" ~ "' + description.headNoun + '"',
        });
      }
    }
  }

  // Strategy 5: Metadata match
  if (Object.keys(description.propertyConstraints).length > 0) {
    for (const entity of state.salientEntities) {
      let metadataMatches = 0;
      let totalConstraints = 0;
      for (const [key, val] of Object.entries(description.propertyConstraints)) {
        totalConstraints++;
        const metaVal = entity.metadata[key];
        if (metaVal != null && metaVal.toLowerCase() === val.toLowerCase()) {
          metadataMatches++;
        }
      }
      if (totalConstraints > 0 && metadataMatches > 0) {
        const alreadyMatched = matches.some((m) => m.entityId === entity.id);
        if (!alreadyMatched) {
          matches.push({
            entityId: entity.id,
            entityName: entity.name,
            entityType: entity.entityType,
            strategy: 'metadata-match',
            confidence: 0.6 * (metadataMatches / totalConstraints),
            matchDetails: 'Metadata match: ' + String(metadataMatches) + '/' + String(totalConstraints) + ' constraints',
          });
        }
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/** Check uniqueness of matched entities and determine resolution status. */
export function checkUniqueness(matches: readonly DescriptionMatch[]): DescriptionResolutionStatus {
  const validMatches = matches.filter((m) => m.confidence >= DESCRIPTION_CONFIDENCE_THRESHOLD);
  if (validMatches.length === 0) return 'no-match';
  if (validMatches.length === 1) return 'unique';
  // Check if the top match is significantly better than the second
  const first = validMatches[0];
  const second = validMatches[1];
  if (first != null && second != null && first.confidence - second.confidence > 0.2) {
    return 'unique';
  }
  return 'ambiguous';
}

/** Generate a clarification question for ambiguous definite descriptions. */
export function generateDescriptionClarification(
  description: DefiniteDescription,
  matches: readonly DescriptionMatch[],
): string {
  if (matches.length === 0) {
    return 'I could not find anything matching "' + description.text + '". Could you describe it differently?';
  }
  const topMatches = matches.slice(0, 4);
  const options = topMatches.map((m) => '"' + m.entityName + '" (' + m.entityType + ')');
  return 'When you say "' + description.text + '", which do you mean: ' + options.join(', ') + '?';
}

/** Format an explanation of how a match was found. */
export function formatMatchExplanation(match: DescriptionMatch): string {
  return 'Matched "' + match.entityName + '" [' + match.entityType + '] via ' + match.strategy + ' (confidence: ' + match.confidence.toFixed(2) + ') -- ' + match.matchDetails;
}

/** Rank matches by a combined score factoring in salience. */
export function rankMatches(
  matches: readonly DescriptionMatch[],
  state: DialogueState,
): readonly DescriptionMatch[] {
  const ranked = matches.map((m) => {
    const entity = state.salientEntities.find((e) => e.id === m.entityId);
    const salienceBoost = entity != null ? entity.salience.score * 0.3 : 0;
    return { ...m, confidence: m.confidence + salienceBoost };
  });
  return [...ranked].sort((a, b) => b.confidence - a.confidence);
}

/** Infer the entity type from a description's head noun. */
export function inferDescriptionType(description: DefiniteDescription): string {
  const noun = description.headNoun.toLowerCase();
  if (KNOWN_SECTION_NAMES.includes(noun)) return 'section';
  if (KNOWN_PARAMETER_NAMES.includes(noun)) return 'parameter';
  if (KNOWN_EFFECT_NAMES.includes(noun)) return 'effect';
  if (['track', 'channel'].includes(noun)) return 'track';
  if (['layer'].includes(noun)) return 'layer';
  if (['card'].includes(noun)) return 'card';
  if (['note', 'chord', 'scale'].includes(noun)) return 'note';
  if (['marker', 'cue'].includes(noun)) return 'marker';
  if (['group', 'bus'].includes(noun)) return 'group';
  if (['region', 'range'].includes(noun)) return 'region';
  if (['automation'].includes(noun)) return 'automation';
  if (['plugin', 'vst', 'plug-in'].includes(noun)) return 'plugin';
  if (['send'].includes(noun)) return 'send';
  if (['motif', 'melody', 'bassline', 'riff', 'theme'].includes(noun)) return 'motif';
  if (['instrument', 'piano', 'guitar', 'bass', 'drums', 'synth', 'organ', 'strings', 'vocals'].includes(noun)) return 'instrument';
  if (['tempo', 'bpm'].includes(noun)) return 'tempo';
  return '';
}

/** Resolve a description by ordinal ("the second verse"). */
export function resolveByOrdinal(
  description: DefiniteDescription,
  entitiesOfType: readonly SalientEntity[],
): DescriptionMatch | undefined {
  if (description.ordinal === 0) return undefined;
  if (entitiesOfType.length === 0) return undefined;

  let index: number;
  if (description.ordinal === -1) {
    // "last"
    index = entitiesOfType.length - 1;
  } else if (description.ordinal === -2) {
    // "penultimate"
    index = entitiesOfType.length - 2;
  } else {
    index = description.ordinal - 1;
  }

  if (index < 0 || index >= entitiesOfType.length) return undefined;
  const entity = entitiesOfType[index];
  if (entity == null) return undefined;

  return {
    entityId: entity.id,
    entityName: entity.name,
    entityType: entity.entityType,
    strategy: 'ordinal',
    confidence: 0.90,
    matchDetails: 'Ordinal match: position ' + String(description.ordinal) + ' in list of ' + String(entitiesOfType.length),
  };
}

/** Resolve a description by relative position ("the next section"). */
export function resolveByPosition(
  description: DefiniteDescription,
  state: DialogueState,
): DescriptionMatch | undefined {
  if (description.relativePosition === '') return undefined;
  const focus = getCurrentFocus(state);
  if (focus == null) return undefined;

  const entityType = inferDescriptionType(description);
  if (entityType === '') return undefined;

  const entitiesOfType = state.salientEntities.filter((e) => e.entityType === entityType);
  if (entitiesOfType.length === 0) return undefined;

  const focusIndex = entitiesOfType.findIndex((e) => e.id === focus.scopeId);

  let targetIndex = -1;
  if (description.relativePosition === 'next' && focusIndex >= 0) {
    targetIndex = focusIndex + 1;
  } else if (description.relativePosition === 'previous' && focusIndex > 0) {
    targetIndex = focusIndex - 1;
  } else if (description.relativePosition === 'first') {
    targetIndex = 0;
  } else if (description.relativePosition === 'last') {
    targetIndex = entitiesOfType.length - 1;
  } else if (description.relativePosition === 'current' && focusIndex >= 0) {
    targetIndex = focusIndex;
  }

  if (targetIndex < 0 || targetIndex >= entitiesOfType.length) return undefined;
  const target = entitiesOfType[targetIndex];
  if (target == null) return undefined;

  return {
    entityId: target.id,
    entityName: target.name,
    entityType: target.entityType,
    strategy: 'relative-position',
    confidence: 0.85,
    matchDetails: 'Relative position "' + description.relativePosition + '" from focus "' + focus.scopeName + '"',
  };
}

/** Resolve a definite description fully. */
export function resolveDefiniteDescription(
  description: DefiniteDescription,
  state: DialogueState,
  drs: DRSBox,
): DescriptionResolution {
  // Try ordinal resolution first
  if (description.ordinal !== 0) {
    const entityType = inferDescriptionType(description);
    if (entityType !== '') {
      const entitiesOfType = state.salientEntities.filter((e) => e.entityType === entityType);
      const ordinalMatch = resolveByOrdinal(description, entitiesOfType);
      if (ordinalMatch != null) {
        return {
          description,
          status: 'unique',
          bestMatch: ordinalMatch,
          allMatches: [ordinalMatch],
          clarificationText: '',
          explanation: 'Resolved via ordinal: ' + ordinalMatch.matchDetails,
        };
      }
    }
  }

  // Try relative position
  if (description.relativePosition !== '') {
    const posMatch = resolveByPosition(description, state);
    if (posMatch != null) {
      return {
        description,
        status: 'unique',
        bestMatch: posMatch,
        allMatches: [posMatch],
        clarificationText: '',
        explanation: 'Resolved via relative position: ' + posMatch.matchDetails,
      };
    }
  }

  // General matching
  const allMatches = findMatchingEntities(description, state, drs);
  const rankedMatches = rankMatches(allMatches, state);
  const status = checkUniqueness(rankedMatches);

  if (status === 'no-match') {
    // Check for unique-type strategy: if there's only one entity of the inferred type
    const entityType = inferDescriptionType(description);
    if (entityType !== '') {
      const entitiesOfType = state.salientEntities.filter((e) => e.entityType === entityType);
      if (entitiesOfType.length === 1) {
        const uniqueEntity = entitiesOfType[0];
        if (uniqueEntity != null) {
          const uniqueMatch: DescriptionMatch = {
            entityId: uniqueEntity.id,
            entityName: uniqueEntity.name,
            entityType: uniqueEntity.entityType,
            strategy: 'unique-type',
            confidence: 0.80,
            matchDetails: 'Unique type match: only one ' + entityType + ' exists',
          };
          return {
            description,
            status: 'unique',
            bestMatch: uniqueMatch,
            allMatches: [uniqueMatch],
            clarificationText: '',
            explanation: 'Resolved via unique-type: only one ' + entityType + ' in context',
          };
        }
      }
    }
    return {
      description,
      status: 'presupposition-failure',
      bestMatch: undefined,
      allMatches: [],
      clarificationText: 'I could not find anything matching "' + description.text + '".',
      explanation: 'Presupposition failure: no matching entity found',
    };
  }

  if (status === 'ambiguous') {
    const best = rankedMatches[0];
    return {
      description,
      status: 'ambiguous',
      bestMatch: best,
      allMatches: rankedMatches,
      clarificationText: generateDescriptionClarification(description, rankedMatches),
      explanation: 'Ambiguous: multiple matches with similar confidence',
    };
  }

  // Unique resolution
  const best = rankedMatches[0];
  return {
    description,
    status: 'unique',
    bestMatch: best,
    allMatches: rankedMatches,
    clarificationText: '',
    explanation: best != null ? 'Uniquely resolved: ' + best.matchDetails : 'Resolved but no match details',
  };
}

/** Batch detect and resolve all definite descriptions in a text. */
export function batchResolveDefiniteDescriptions(
  text: string,
  state: DialogueState,
  drs: DRSBox,
): readonly DescriptionResolution[] {
  const descriptions = detectDefiniteDescriptions(text);
  const results: DescriptionResolution[] = [];
  for (const desc of descriptions) {
    results.push(resolveDefiniteDescription(desc, state, drs));
  }
  return results;
}

/** Summarize a set of description resolution results. */
export function summarizeDescriptionResolutions(results: readonly DescriptionResolution[]): string {
  const lines: string[] = [];
  lines.push('=== Definite Description Resolution Summary ===');
  lines.push('Total descriptions: ' + String(results.length));
  const unique = results.filter((r) => r.status === 'unique').length;
  const ambig = results.filter((r) => r.status === 'ambiguous').length;
  const noMatch = results.filter((r) => r.status === 'no-match' || r.status === 'presupposition-failure').length;
  lines.push('Unique: ' + String(unique));
  lines.push('Ambiguous: ' + String(ambig));
  lines.push('No match: ' + String(noMatch));
  for (const r of results) {
    if (r.bestMatch != null) {
      lines.push('  "' + r.description.text + '" -> ' + r.bestMatch.entityName + ' [' + r.status + ']');
    } else {
      lines.push('  "' + r.description.text + '" -> UNRESOLVED [' + r.status + ']');
    }
  }
  return lines.join('\n');
}


// ===================== STEP 205: DEMONSTRATIVE RESOLUTION =====================

// ---- 205 Types ----

/** Types of demonstrative expressions. */
export type DemonstrativeType =
  | 'proximal-this'
  | 'proximal-these'
  | 'distal-that'
  | 'distal-those'
  | 'locative-here'
  | 'locative-there';

/** UI selection state. */
export interface UISelectionState {
  readonly hasSelection: boolean;
  readonly selectedEntityIds: readonly string[];
  readonly selectedEntityType: string;
  readonly selectionDescription: string;
  readonly selectionTimestamp: number;
  readonly selectionScope: string;
  readonly cursorPosition: number;
  readonly viewportStart: number;
  readonly viewportEnd: number;
  readonly lastSelectionEntityIds: readonly string[];
  readonly lastSelectionTimestamp: number;
}

/** A demonstrative expression detected in user input. */
export interface DemonstrativeExpression {
  readonly id: string;
  readonly text: string;
  readonly demonstrativeType: DemonstrativeType;
  readonly followingNoun: string;
  readonly plural: boolean;
  readonly startOffset: number;
  readonly endOffset: number;
}

/** Result of resolving a demonstrative expression. */
export interface DemonstrativeResolution {
  readonly expression: DemonstrativeExpression;
  readonly resolved: boolean;
  readonly resolvedEntityIds: readonly string[];
  readonly resolvedEntityType: string;
  readonly resolvedDescription: string;
  readonly fallbackUsed: SelectionFallback;
  readonly confidence: number;
  readonly explanation: string;
  readonly clarificationText: string;
}

/** Fallback chain used for demonstrative resolution. */
export type SelectionFallback =
  | 'ui-selection'
  | 'last-focused-entity'
  | 'last-mentioned-entity'
  | 'last-selection'
  | 'context-inferred'
  | 'clarification-needed'
  | 'none';

/** A pattern for detecting demonstrative expressions. */
interface DemonstrativePatternDef {
  readonly id: string;
  readonly regex: RegExp;
  readonly type: DemonstrativeType;
  readonly nounGroupIndex: number;
  readonly description: string;
  readonly musicalContext: string;
}

// ---- 205 Constants ----

const DEMONSTRATIVE_PATTERNS: readonly DemonstrativePatternDef[] = [
  // Proximal "this" patterns
  { id: 'dem-this-noun', regex: /\bthis\s+(\w+)/i, type: 'proximal-this', nounGroupIndex: 1, description: '"this <noun>" -- proximal singular', musicalContext: 'Currently focused/selected single entity' },
  { id: 'dem-this-bare', regex: /\bthis\b(?!\s+\w)/i, type: 'proximal-this', nounGroupIndex: 0, description: '"this" bare -- proximal reference', musicalContext: 'Currently focused entity (no noun)' },
  { id: 'dem-this-one', regex: /\bthis\s+one\b/i, type: 'proximal-this', nounGroupIndex: 0, description: '"this one" -- proximal singular', musicalContext: 'Currently selected single item' },
  { id: 'dem-this-part', regex: /\bthis\s+part\b/i, type: 'proximal-this', nounGroupIndex: 0, description: '"this part" -- proximal section', musicalContext: 'Currently focused section or region' },
  { id: 'dem-this-section', regex: /\bthis\s+section\b/i, type: 'proximal-this', nounGroupIndex: 0, description: '"this section" -- proximal section', musicalContext: 'Current section in focus' },

  // Proximal "these" patterns
  { id: 'dem-these-noun', regex: /\bthese\s+(\w+)/i, type: 'proximal-these', nounGroupIndex: 1, description: '"these <noun>" -- proximal plural', musicalContext: 'Currently selected multiple entities' },
  { id: 'dem-these-bare', regex: /\bthese\b(?!\s+\w)/i, type: 'proximal-these', nounGroupIndex: 0, description: '"these" bare -- proximal plural', musicalContext: 'Currently selected items' },
  { id: 'dem-these-notes', regex: /\bthese\s+notes\b/i, type: 'proximal-these', nounGroupIndex: 0, description: '"these notes" -- current note selection', musicalContext: 'All notes in current selection' },
  { id: 'dem-these-tracks', regex: /\bthese\s+tracks\b/i, type: 'proximal-these', nounGroupIndex: 0, description: '"these tracks" -- current track selection', musicalContext: 'All currently selected tracks' },
  { id: 'dem-these-chords', regex: /\bthese\s+chords\b/i, type: 'proximal-these', nounGroupIndex: 0, description: '"these chords" -- current chord selection', musicalContext: 'All currently selected chords' },

  // Distal "that" patterns
  { id: 'dem-that-noun', regex: /\bthat\s+(\w+)/i, type: 'distal-that', nounGroupIndex: 1, description: '"that <noun>" -- distal singular', musicalContext: 'Previously mentioned/shown entity' },
  { id: 'dem-that-bare', regex: /\bthat\b(?!\s+\w)/i, type: 'distal-that', nounGroupIndex: 0, description: '"that" bare -- distal reference', musicalContext: 'Last mentioned entity or result' },
  { id: 'dem-that-change', regex: /\bthat\s+change\b/i, type: 'distal-that', nounGroupIndex: 0, description: '"that change" -- last diff', musicalContext: 'The last diff or modification shown' },
  { id: 'dem-that-sound', regex: /\bthat\s+sound\b/i, type: 'distal-that', nounGroupIndex: 0, description: '"that sound" -- last auditioned sound', musicalContext: 'Previously auditioned or mentioned sound' },
  { id: 'dem-that-effect', regex: /\bthat\s+effect\b/i, type: 'distal-that', nounGroupIndex: 0, description: '"that effect" -- previously mentioned effect', musicalContext: 'Previously discussed effect' },

  // Distal "those" patterns
  { id: 'dem-those-noun', regex: /\bthose\s+(\w+)/i, type: 'distal-those', nounGroupIndex: 1, description: '"those <noun>" -- distal plural', musicalContext: 'Previously mentioned group of entities' },
  { id: 'dem-those-bare', regex: /\bthose\b(?!\s+\w)/i, type: 'distal-those', nounGroupIndex: 0, description: '"those" bare -- distal plural', musicalContext: 'Previously mentioned group' },
  { id: 'dem-those-changes', regex: /\bthose\s+changes\b/i, type: 'distal-those', nounGroupIndex: 0, description: '"those changes" -- last diff items', musicalContext: 'The changes from the last diff' },
  { id: 'dem-those-notes', regex: /\bthose\s+notes\b/i, type: 'distal-those', nounGroupIndex: 0, description: '"those notes" -- previously referenced notes', musicalContext: 'Notes mentioned in previous turn' },

  // Locative demonstratives
  { id: 'dem-here-bare', regex: /\bhere\b/i, type: 'locative-here', nounGroupIndex: 0, description: '"here" -- current location', musicalContext: 'Current playback position or focused scope' },
  { id: 'dem-there-bare', regex: /\bthere\b/i, type: 'locative-there', nounGroupIndex: 0, description: '"there" -- referenced location', musicalContext: 'Previously mentioned location or position' },
  { id: 'dem-right-here', regex: /\bright\s+here\b/i, type: 'locative-here', nounGroupIndex: 0, description: '"right here" -- exact current position', musicalContext: 'Exact playback position or cursor' },
  { id: 'dem-over-there', regex: /\bover\s+there\b/i, type: 'locative-there', nounGroupIndex: 0, description: '"over there" -- distal location', musicalContext: 'A location away from current focus' },
];

/** Noun-to-entity-type mapping for demonstrative resolution. */
const DEMONSTRATIVE_NOUN_TYPE_MAP: Record<string, string> = {
  note: 'note',
  notes: 'note',
  chord: 'chord',
  chords: 'chord',
  section: 'section',
  sections: 'section',
  part: 'section',
  parts: 'section',
  track: 'track',
  tracks: 'track',
  layer: 'layer',
  layers: 'layer',
  card: 'card',
  cards: 'card',
  effect: 'effect',
  effects: 'effect',
  plugin: 'plugin',
  plugins: 'plugin',
  instrument: 'instrument',
  instruments: 'instrument',
  region: 'region',
  regions: 'region',
  marker: 'marker',
  markers: 'marker',
  change: 'diff',
  changes: 'diff',
  sound: 'instrument',
  sounds: 'instrument',
  beat: 'timeRange',
  beats: 'timeRange',
  bar: 'timeRange',
  bars: 'timeRange',
  measure: 'timeRange',
  measures: 'timeRange',
  motif: 'motif',
  motifs: 'motif',
  pattern: 'motif',
  patterns: 'motif',
  automation: 'automation',
  send: 'send',
  sends: 'send',
  bus: 'mixBus',
  group: 'group',
  groups: 'group',
  melody: 'motif',
  bassline: 'motif',
  riff: 'motif',
  loop: 'region',
  loops: 'region',
  sample: 'region',
  samples: 'region',
  clip: 'region',
  clips: 'region',
};

// ---- 205 Functions ----

/** Create a default (empty) UI selection state. */
export function createEmptyUISelection(): UISelectionState {
  return {
    hasSelection: false,
    selectedEntityIds: [],
    selectedEntityType: '',
    selectionDescription: '',
    selectionTimestamp: 0,
    selectionScope: '',
    cursorPosition: 0,
    viewportStart: 0,
    viewportEnd: 0,
    lastSelectionEntityIds: [],
    lastSelectionTimestamp: 0,
  };
}

/** Update the UI selection state with a new selection. */
export function updateUISelection(
  prev: UISelectionState,
  entityIds: readonly string[],
  entityType: string,
  description: string,
  scope: string,
): UISelectionState {
  return {
    hasSelection: entityIds.length > 0,
    selectedEntityIds: entityIds,
    selectedEntityType: entityType,
    selectionDescription: description,
    selectionTimestamp: Date.now(),
    selectionScope: scope,
    cursorPosition: prev.cursorPosition,
    viewportStart: prev.viewportStart,
    viewportEnd: prev.viewportEnd,
    lastSelectionEntityIds: prev.selectedEntityIds,
    lastSelectionTimestamp: prev.selectionTimestamp,
  };
}

/** Clear the current UI selection. */
export function clearUISelection(prev: UISelectionState): UISelectionState {
  return {
    hasSelection: false,
    selectedEntityIds: [],
    selectedEntityType: '',
    selectionDescription: '',
    selectionTimestamp: 0,
    selectionScope: '',
    cursorPosition: prev.cursorPosition,
    viewportStart: prev.viewportStart,
    viewportEnd: prev.viewportEnd,
    lastSelectionEntityIds: prev.selectedEntityIds,
    lastSelectionTimestamp: prev.selectionTimestamp,
  };
}

/** Detect all demonstrative expressions in a text. */
export function detectDemonstratives(text: string): readonly DemonstrativeExpression[] {
  const results: DemonstrativeExpression[] = [];
  const seenOffsets = new Set<number>();

  for (const pat of DEMONSTRATIVE_PATTERNS) {
    const globalRegex = new RegExp(pat.regex.source, 'gi');
    let match = globalRegex.exec(text);
    while (match != null) {
      const startOffset = match.index;
      if (!seenOffsets.has(startOffset)) {
        seenOffsets.add(startOffset);
        const matchedText = match[0] != null ? match[0] : '';
        let followingNoun = '';
        if (pat.nounGroupIndex > 0) {
          const nounVal = match[pat.nounGroupIndex];
          followingNoun = nounVal != null ? nounVal.toLowerCase() : '';
        }
        results.push({
          id: makeId('dem'),
          text: matchedText,
          demonstrativeType: pat.type,
          followingNoun,
          plural: pat.type === 'proximal-these' || pat.type === 'distal-those',
          startOffset,
          endOffset: startOffset + matchedText.length,
        });
      }
      match = globalRegex.exec(text);
    }
  }

  return results.sort((a, b) => a.startOffset - b.startOffset);
}

/** Check if a demonstrative type is proximal. */
export function isProximal(demType: DemonstrativeType): boolean {
  return demType === 'proximal-this' || demType === 'proximal-these';
}

/** Check if a demonstrative type is distal. */
export function isDistal(demType: DemonstrativeType): boolean {
  return demType === 'distal-that' || demType === 'distal-those';
}

/** Check if a demonstrative type is locative. */
export function isLocative(demType: DemonstrativeType): boolean {
  return demType === 'locative-here' || demType === 'locative-there';
}

/** Check if a demonstrative expression refers to a plural group. */
export function isDemonstrativePlural(expr: DemonstrativeExpression): boolean {
  return expr.plural;
}

/** Get the current UI selection, returning entity ids. */
export function getUISelection(uiState: UISelectionState): readonly string[] {
  if (uiState.hasSelection) {
    return uiState.selectedEntityIds;
  }
  return [];
}

/** Match a demonstrative expression to the current UI selection. */
export function matchDemonstrativeToSelection(
  expr: DemonstrativeExpression,
  uiState: UISelectionState,
): { matched: boolean; entityIds: readonly string[]; entityType: string } {
  if (!uiState.hasSelection || uiState.selectedEntityIds.length === 0) {
    return { matched: false, entityIds: [], entityType: '' };
  }

  // If a following noun is specified, check if it matches the selection type
  if (expr.followingNoun !== '') {
    const expectedType = DEMONSTRATIVE_NOUN_TYPE_MAP[expr.followingNoun];
    if (expectedType != null && expectedType !== uiState.selectedEntityType) {
      return { matched: false, entityIds: [], entityType: '' };
    }
  }

  // Plural check: "these" requires multiple selected items
  if (expr.plural && uiState.selectedEntityIds.length < 2) {
    // Allow singular selection for plural demonstratives as a gentle fallback
    return {
      matched: true,
      entityIds: uiState.selectedEntityIds,
      entityType: uiState.selectedEntityType,
    };
  }

  // Singular check: "this" with multiple selections takes the first
  if (!expr.plural && uiState.selectedEntityIds.length > 1) {
    const firstId = uiState.selectedEntityIds[0];
    return {
      matched: true,
      entityIds: firstId != null ? [firstId] : [],
      entityType: uiState.selectedEntityType,
    };
  }

  return {
    matched: true,
    entityIds: uiState.selectedEntityIds,
    entityType: uiState.selectedEntityType,
  };
}

/** Get the fallback entity for a demonstrative that can't resolve via UI selection. */
export function getDemonstrativeFallback(
  expr: DemonstrativeExpression,
  state: DialogueState,
  uiState: UISelectionState,
): { fallback: SelectionFallback; entityIds: readonly string[]; entityType: string; description: string } {
  // Fallback 1: last UI selection (for distal)
  if (isDistal(expr.demonstrativeType) && uiState.lastSelectionEntityIds.length > 0) {
    return {
      fallback: 'last-selection',
      entityIds: uiState.lastSelectionEntityIds,
      entityType: '',
      description: 'Last UI selection (distal fallback)',
    };
  }

  // Fallback 2: last focused entity
  const focus = getCurrentFocus(state);
  if (focus != null && isProximal(expr.demonstrativeType)) {
    return {
      fallback: 'last-focused-entity',
      entityIds: [focus.scopeId],
      entityType: focus.scopeType,
      description: 'Current focus: "' + focus.scopeName + '"',
    };
  }

  // Fallback 3: last mentioned entity matching the noun type
  if (expr.followingNoun !== '') {
    const expectedType = DEMONSTRATIVE_NOUN_TYPE_MAP[expr.followingNoun];
    if (expectedType != null) {
      const matchingEntities = state.salientEntities.filter((e) => e.entityType === expectedType);
      if (matchingEntities.length > 0) {
        if (expr.plural) {
          return {
            fallback: 'last-mentioned-entity',
            entityIds: matchingEntities.map((e) => e.id),
            entityType: expectedType,
            description: 'Last mentioned ' + expectedType + ' entities (' + String(matchingEntities.length) + ')',
          };
        }
        const topEntity = matchingEntities[0];
        if (topEntity != null) {
          return {
            fallback: 'last-mentioned-entity',
            entityIds: [topEntity.id],
            entityType: expectedType,
            description: 'Last mentioned ' + expectedType + ': "' + topEntity.name + '"',
          };
        }
      }
    }
  }

  // Fallback 4: top salient entity
  const topEntity = state.salientEntities[0];
  if (topEntity != null) {
    return {
      fallback: 'last-mentioned-entity',
      entityIds: [topEntity.id],
      entityType: topEntity.entityType,
      description: 'Most salient entity: "' + topEntity.name + '"',
    };
  }

  // Fallback 5: special context for "that change" / "those changes"
  if ((expr.followingNoun === 'change' || expr.followingNoun === 'changes') && state.lastDiffSummary !== '') {
    return {
      fallback: 'context-inferred',
      entityIds: ['__last_diff__'],
      entityType: 'diff',
      description: 'Last diff summary',
    };
  }

  // No fallback available
  return {
    fallback: 'clarification-needed',
    entityIds: [],
    entityType: '',
    description: '',
  };
}

/** Generate a clarification question for an unresolved demonstrative. */
export function generateDemonstrativeClarification(
  expr: DemonstrativeExpression,
  state: DialogueState,
): string {
  const nounPart = expr.followingNoun !== '' ? ' ' + expr.followingNoun : '';
  const topEntities = getTopSalientEntities(state, 3);
  if (topEntities.length === 0) {
    return 'I am not sure what "' + expr.text + '" refers to. Could you specify which' + nounPart + ' you mean?';
  }
  const options = topEntities.map((e) => '"' + e.name + '" (' + e.entityType + ')');
  return 'When you say "' + expr.text + '", do you mean ' + options.join(', ') + ', or something else?';
}

/** Format a human-readable summary of a demonstrative resolution. */
export function formatDemonstrativeResolution(result: DemonstrativeResolution): string {
  const lines: string[] = [];
  lines.push('Demonstrative: "' + result.expression.text + '" (' + result.expression.demonstrativeType + ')');
  if (result.resolved) {
    lines.push('Resolved to: ' + result.resolvedDescription);
    lines.push('Entity type: ' + result.resolvedEntityType);
    lines.push('Entity IDs: ' + result.resolvedEntityIds.join(', '));
    lines.push('Fallback used: ' + result.fallbackUsed);
    lines.push('Confidence: ' + result.confidence.toFixed(2));
  } else {
    lines.push('UNRESOLVED');
    if (result.clarificationText !== '') {
      lines.push('Clarification: ' + result.clarificationText);
    }
  }
  lines.push('Explanation: ' + result.explanation);
  return lines.join('\n');
}

/** Resolve a single demonstrative expression. */
export function resolveDemonstrative(
  expr: DemonstrativeExpression,
  state: DialogueState,
  uiState: UISelectionState,
  drs: DRSBox,
): DemonstrativeResolution {
  // Step 1: Try UI selection first (for proximal demonstratives)
  if (isProximal(expr.demonstrativeType)) {
    const selMatch = matchDemonstrativeToSelection(expr, uiState);
    if (selMatch.matched && selMatch.entityIds.length > 0) {
      return {
        expression: expr,
        resolved: true,
        resolvedEntityIds: selMatch.entityIds,
        resolvedEntityType: selMatch.entityType,
        resolvedDescription: 'UI selection (' + String(selMatch.entityIds.length) + ' items)',
        fallbackUsed: 'ui-selection',
        confidence: 0.95,
        explanation: 'Proximal demonstrative matched to current UI selection',
        clarificationText: '',
      };
    }
  }

  // Step 2: For distal demonstratives, check last diff / last plan
  if (isDistal(expr.demonstrativeType)) {
    // "that change" / "those changes"
    if (expr.followingNoun === 'change' || expr.followingNoun === 'changes') {
      if (state.lastDiffSummary !== '') {
        return {
          expression: expr,
          resolved: true,
          resolvedEntityIds: ['__last_diff__'],
          resolvedEntityType: 'diff',
          resolvedDescription: 'Last diff: ' + state.lastDiffSummary.slice(0, 50),
          fallbackUsed: 'context-inferred',
          confidence: 0.90,
          explanation: 'Distal "' + expr.text + '" resolved to last diff via context',
          clarificationText: '',
        };
      }
    }
    // "that plan"
    if (expr.followingNoun === 'plan') {
      if (state.lastPlan !== '') {
        return {
          expression: expr,
          resolved: true,
          resolvedEntityIds: ['__last_plan__'],
          resolvedEntityType: 'plan',
          resolvedDescription: 'Last plan: ' + state.lastPlan.slice(0, 50),
          fallbackUsed: 'context-inferred',
          confidence: 0.88,
          explanation: 'Distal "' + expr.text + '" resolved to last plan via context',
          clarificationText: '',
        };
      }
    }
    // Try previous selection for distal
    if (uiState.lastSelectionEntityIds.length > 0) {
      const selMatch = matchDemonstrativeToSelection(expr, {
        ...uiState,
        hasSelection: true,
        selectedEntityIds: uiState.lastSelectionEntityIds,
        selectionTimestamp: uiState.lastSelectionTimestamp,
      });
      if (selMatch.matched && selMatch.entityIds.length > 0) {
        return {
          expression: expr,
          resolved: true,
          resolvedEntityIds: selMatch.entityIds,
          resolvedEntityType: selMatch.entityType,
          resolvedDescription: 'Previous UI selection (' + String(selMatch.entityIds.length) + ' items)',
          fallbackUsed: 'last-selection',
          confidence: 0.80,
          explanation: 'Distal demonstrative matched to previous UI selection',
          clarificationText: '',
        };
      }
    }
  }

  // Step 3: For locative demonstratives, resolve to position/scope
  if (isLocative(expr.demonstrativeType)) {
    if (expr.demonstrativeType === 'locative-here') {
      const focus = getCurrentFocus(state);
      if (focus != null) {
        return {
          expression: expr,
          resolved: true,
          resolvedEntityIds: [focus.scopeId],
          resolvedEntityType: focus.scopeType,
          resolvedDescription: 'Current focus: "' + focus.scopeName + '"',
          fallbackUsed: 'last-focused-entity',
          confidence: 0.88,
          explanation: '"here" resolved to current focus scope',
          clarificationText: '',
        };
      }
      // Fallback to playback position
      if (state.boardContext.boardId !== '') {
        return {
          expression: expr,
          resolved: true,
          resolvedEntityIds: ['__playback_position__'],
          resolvedEntityType: 'timeRange',
          resolvedDescription: 'Playback position: ' + String(state.boardContext.playbackPosition),
          fallbackUsed: 'context-inferred',
          confidence: 0.70,
          explanation: '"here" resolved to playback position (no focus available)',
          clarificationText: '',
        };
      }
    }
    if (expr.demonstrativeType === 'locative-there') {
      // "there" resolves to a previously mentioned location
      const locationEntities = state.salientEntities.filter(
        (e) => e.entityType === 'section' || e.entityType === 'timeRange' || e.entityType === 'region' || e.entityType === 'marker',
      );
      if (locationEntities.length > 0) {
        const best = locationEntities[0];
        if (best != null) {
          return {
            expression: expr,
            resolved: true,
            resolvedEntityIds: [best.id],
            resolvedEntityType: best.entityType,
            resolvedDescription: 'Location: "' + best.name + '" (' + best.entityType + ')',
            fallbackUsed: 'last-mentioned-entity',
            confidence: 0.75,
            explanation: '"there" resolved to most salient location entity',
            clarificationText: '',
          };
        }
      }
    }
  }

  // Step 4: Try DRS referent resolution by noun type
  if (expr.followingNoun !== '') {
    const expectedType = DEMONSTRATIVE_NOUN_TYPE_MAP[expr.followingNoun];
    if (expectedType != null && expectedType !== '' && expectedType !== 'diff') {
      const drsRefs = getReferentsByType(drs, expectedType as ReferentType);
      if (drsRefs.length > 0) {
        const activeRefs = drsRefs.filter((r) => r.status === 'active' || r.status === 'introduced');
        if (activeRefs.length > 0) {
          const ids = activeRefs.map((r) => r.boundTo !== '' ? r.boundTo : r.id);
          return {
            expression: expr,
            resolved: true,
            resolvedEntityIds: expr.plural ? ids : (ids[0] != null ? [ids[0]] : []),
            resolvedEntityType: expectedType,
            resolvedDescription: 'DRS referents of type ' + expectedType + ' (' + String(activeRefs.length) + ')',
            fallbackUsed: 'context-inferred',
            confidence: 0.72,
            explanation: 'Resolved via DRS referent lookup for type "' + expectedType + '"',
            clarificationText: '',
          };
        }
      }
    }
  }

  // Step 5: General fallback chain
  const fallbackResult = getDemonstrativeFallback(expr, state, uiState);
  if (fallbackResult.fallback !== 'clarification-needed' && fallbackResult.entityIds.length > 0) {
    return {
      expression: expr,
      resolved: true,
      resolvedEntityIds: fallbackResult.entityIds,
      resolvedEntityType: fallbackResult.entityType,
      resolvedDescription: fallbackResult.description,
      fallbackUsed: fallbackResult.fallback,
      confidence: 0.55,
      explanation: 'Resolved via fallback chain: ' + fallbackResult.fallback,
      clarificationText: '',
    };
  }

  // Step 6: Clarification needed
  return {
    expression: expr,
    resolved: false,
    resolvedEntityIds: [],
    resolvedEntityType: '',
    resolvedDescription: '',
    fallbackUsed: 'clarification-needed',
    confidence: 0,
    explanation: 'Could not resolve demonstrative through any strategy',
    clarificationText: generateDemonstrativeClarification(expr, state),
  };
}

/** Batch-detect and resolve all demonstrative expressions in a text. */
export function batchResolveDemonstratives(
  text: string,
  state: DialogueState,
  uiState: UISelectionState,
  drs: DRSBox,
): readonly DemonstrativeResolution[] {
  const expressions = detectDemonstratives(text);
  const results: DemonstrativeResolution[] = [];
  for (const expr of expressions) {
    results.push(resolveDemonstrative(expr, state, uiState, drs));
  }
  return results;
}

/** Summarize demonstrative resolutions. */
export function summarizeDemonstrativeResolutions(results: readonly DemonstrativeResolution[]): string {
  const lines: string[] = [];
  lines.push('=== Demonstrative Resolution Summary ===');
  lines.push('Total demonstratives: ' + String(results.length));
  const resolved = results.filter((r) => r.resolved).length;
  const unresolved = results.filter((r) => !r.resolved).length;
  lines.push('Resolved: ' + String(resolved));
  lines.push('Unresolved: ' + String(unresolved));
  for (const r of results) {
    if (r.resolved) {
      lines.push('  "' + r.expression.text + '" -> ' + r.resolvedDescription + ' [' + r.fallbackUsed + ']');
    } else {
      lines.push('  "' + r.expression.text + '" -> UNRESOLVED');
    }
  }
  return lines.join('\n');
}

/** Count demonstrative expressions in a text. */
export function countDemonstratives(text: string): number {
  return detectDemonstratives(text).length;
}

/** Check if a text has any demonstrative expressions. */
export function hasDemonstratives(text: string): boolean {
  return countDemonstratives(text) > 0;
}

/** Get only proximal demonstratives from a set of results. */
export function filterProximalResolutions(results: readonly DemonstrativeResolution[]): readonly DemonstrativeResolution[] {
  return results.filter((r) => isProximal(r.expression.demonstrativeType));
}

/** Get only distal demonstratives from a set of results. */
export function filterDistalResolutions(results: readonly DemonstrativeResolution[]): readonly DemonstrativeResolution[] {
  return results.filter((r) => isDistal(r.expression.demonstrativeType));
}

/** Get only locative demonstratives from a set of results. */
export function filterLocativeResolutions(results: readonly DemonstrativeResolution[]): readonly DemonstrativeResolution[] {
  return results.filter((r) => isLocative(r.expression.demonstrativeType));
}


// ===================== FULL PIPELINE =====================

/**
 * Perform full pragmatic resolution on an utterance:
 *   1. Detect and resolve anaphora
 *   2. Detect and resolve definite descriptions
 *   3. Detect and resolve demonstratives
 *
 * Returns a combined report.
 */
export interface PragmaticResolutionReport {
  readonly anaphoraResults: readonly ResolutionResult[];
  readonly descriptionResults: readonly DescriptionResolution[];
  readonly demonstrativeResults: readonly DemonstrativeResolution[];
  readonly totalExpressions: number;
  readonly totalResolved: number;
  readonly totalAmbiguous: number;
  readonly totalUnresolved: number;
  readonly summary: string;
}

export function runFullPragmaticResolution(
  text: string,
  state: DialogueState,
  drs: DRSBox,
  uiState: UISelectionState,
): PragmaticResolutionReport {
  const anaphoraResults = batchResolveAnaphora(text, state, drs);
  const descriptionResults = batchResolveDefiniteDescriptions(text, state, drs);
  const demonstrativeResults = batchResolveDemonstratives(text, state, uiState, drs);

  const totalExpressions = anaphoraResults.length + descriptionResults.length + demonstrativeResults.length;

  const anaphoraResolved = anaphoraResults.filter((r) => r.resolved).length;
  const descResolved = descriptionResults.filter((r) => r.status === 'unique').length;
  const demResolved = demonstrativeResults.filter((r) => r.resolved).length;
  const totalResolved = anaphoraResolved + descResolved + demResolved;

  const anaphoraAmbig = anaphoraResults.filter((r) => r.ambiguous).length;
  const descAmbig = descriptionResults.filter((r) => r.status === 'ambiguous').length;
  const totalAmbiguous = anaphoraAmbig + descAmbig;

  const totalUnresolved = totalExpressions - totalResolved - totalAmbiguous;

  const summaryLines: string[] = [];
  summaryLines.push('=== Full Pragmatic Resolution ===');
  summaryLines.push('Input: "' + text.slice(0, 80) + (text.length > 80 ? '...' : '') + '"');
  summaryLines.push('Expressions found: ' + String(totalExpressions));
  summaryLines.push('  Anaphora: ' + String(anaphoraResults.length) + ' (' + String(anaphoraResolved) + ' resolved)');
  summaryLines.push('  Descriptions: ' + String(descriptionResults.length) + ' (' + String(descResolved) + ' resolved)');
  summaryLines.push('  Demonstratives: ' + String(demonstrativeResults.length) + ' (' + String(demResolved) + ' resolved)');
  summaryLines.push('Total resolved: ' + String(totalResolved) + '/' + String(totalExpressions));
  if (totalAmbiguous > 0) {
    summaryLines.push('Ambiguous: ' + String(totalAmbiguous));
  }
  if (totalUnresolved > 0) {
    summaryLines.push('Unresolved: ' + String(totalUnresolved));
  }

  return {
    anaphoraResults,
    descriptionResults,
    demonstrativeResults,
    totalExpressions,
    totalResolved,
    totalAmbiguous,
    totalUnresolved,
    summary: summaryLines.join('\n'),
  };
}
