/**
 * GOFAI Infrastructure — Salience Tracking for Symbol Tables
 *
 * Tracks which entities are most "salient" (prominent/relevant) in the
 * current interaction context. Salience is the key factor in resolving
 * underspecified references like "it", "that", and bare noun phrases
 * ("the drums" when there are multiple drum tracks).
 *
 * Salience sources (in rough priority order):
 *   1. Current UI selection (highest — user is pointing at something)
 *   2. Last-edited entity (just modified → likely to be re-referenced)
 *   3. Last-mentioned entity (recently in conversation)
 *   4. Focus stack (board → deck → layer hierarchy)
 *   5. Last-focused entity (previously highlighted/selected)
 *   6. Entity frequency (mentioned many times → probably important)
 *   7. Default salience (base level from entity type)
 *
 * Salience decays over dialogue turns and events.
 *
 * @module gofai/infra/salience-tracker
 * @see gofai_goalA.md Step 057
 * @see gofaimusicplus.md §5.2 — Reference resolution and discourse
 */

import type { EntityType } from '../canon/types';
import type { ResolvedEntityRef } from '../canon/entity-refs';

// =============================================================================
// SALIENCE TYPES
// =============================================================================

/**
 * A salience entry for an entity.
 */
export interface SalienceEntry {
  /** The entity this salience score is for */
  readonly entity: ResolvedEntityRef;

  /** Current salience score (0.0 = not salient, 1.0 = maximally salient) */
  readonly score: number;

  /** Sources contributing to this score */
  readonly sources: readonly SalienceSource[];

  /** Turn number when last updated */
  readonly lastUpdatedTurn: number;

  /** Turn number when entity was first mentioned */
  readonly firstMentionedTurn: number;

  /** Number of times entity has been mentioned */
  readonly mentionCount: number;

  /** Whether entity is currently in the focus stack */
  readonly inFocusStack: boolean;
}

/**
 * A source of salience for an entity.
 */
export interface SalienceSource {
  /** The kind of salience contribution */
  readonly kind: SalienceSourceKind;

  /** The raw contribution to salience score */
  readonly weight: number;

  /** Turn number when this source was activated */
  readonly activatedTurn: number;

  /** Whether this source is still active */
  readonly active: boolean;
}

/**
 * Kinds of salience sources.
 */
export type SalienceSourceKind =
  | 'ui_selection'       // Currently selected in the UI
  | 'last_edit'          // Most recently edited entity
  | 'discourse_mention'  // Mentioned in conversation
  | 'focus_stack'        // Part of the current focus hierarchy
  | 'prior_focus'        // Previously focused/highlighted
  | 'frequency'          // Mentioned multiple times
  | 'recency'            // Recently mentioned (decays fast)
  | 'structural'         // Structurally prominent (e.g., current section)
  | 'default';           // Base salience from entity type

/**
 * Configuration for salience tracking.
 */
export interface SalienceConfig {
  /** How much salience decays per turn (multiplicative) */
  readonly decayRate: number;

  /** Minimum salience score before an entry is pruned */
  readonly pruneThreshold: number;

  /** Maximum number of tracked entities */
  readonly maxTrackedEntities: number;

  /** Weights for different salience sources */
  readonly sourceWeights: Readonly<Record<SalienceSourceKind, number>>;

  /** How many turns before a source is deactivated */
  readonly sourceStaleness: Readonly<Record<SalienceSourceKind, number>>;
}

/**
 * Default salience configuration.
 */
export const DEFAULT_SALIENCE_CONFIG: SalienceConfig = {
  decayRate: 0.85,
  pruneThreshold: 0.05,
  maxTrackedEntities: 100,
  sourceWeights: {
    ui_selection: 1.0,
    last_edit: 0.9,
    discourse_mention: 0.7,
    focus_stack: 0.6,
    prior_focus: 0.4,
    frequency: 0.3,
    recency: 0.5,
    structural: 0.35,
    default: 0.1,
  },
  sourceStaleness: {
    ui_selection: 1,      // Selection is only current for 1 turn
    last_edit: 3,         // Last edit stays relevant for 3 turns
    discourse_mention: 5, // Mentions stay relevant for 5 turns
    focus_stack: 999,     // Focus stack doesn't expire naturally
    prior_focus: 7,       // Prior focus fades after 7 turns
    frequency: 999,       // Frequency doesn't expire
    recency: 2,           // Recency fades after 2 turns
    structural: 999,      // Structural salience doesn't expire
    default: 999,         // Default doesn't expire
  },
};

/**
 * Default salience scores for entity types.
 *
 * Some entity types are inherently more salient than others.
 * Sections and layers are more likely to be referenced than
 * individual parameters.
 */
export const DEFAULT_ENTITY_TYPE_SALIENCE: Readonly<Record<EntityType, number>> = {
  board: 0.05,     // Rarely referenced explicitly
  deck: 0.08,      // Sometimes referenced
  layer: 0.15,     // Frequently referenced
  track: 0.15,     // Same as layer (synonym)
  section: 0.20,   // Very frequently referenced
  range: 0.10,     // Sometimes referenced
  card: 0.12,      // Sometimes referenced
  event: 0.08,     // Rarely referenced individually
  param: 0.06,     // Rarely referenced individually
  axis: 0.05,      // Rarely referenced directly
};

// =============================================================================
// FOCUS STACK
// =============================================================================

/**
 * The focus stack represents the current hierarchical focus context.
 *
 * It tracks what the user is "looking at" in the project hierarchy:
 *   board → deck → layer → section/range → card → param
 *
 * Items higher in the stack are more contextually relevant.
 */
export interface FocusStack {
  /** Current board */
  readonly board?: ResolvedEntityRef;

  /** Current deck (if focused on a specific deck) */
  readonly deck?: ResolvedEntityRef;

  /** Current layer (if focused on a specific layer/track) */
  readonly layer?: ResolvedEntityRef;

  /** Current section (if focused on a specific section) */
  readonly section?: ResolvedEntityRef;

  /** Current range (if a range is selected) */
  readonly range?: ResolvedEntityRef;

  /** Current card (if a specific card is focused) */
  readonly card?: ResolvedEntityRef;

  /** Current parameter (if a specific param is focused) */
  readonly param?: ResolvedEntityRef;
}

/**
 * A focus change event.
 */
export interface FocusChangeEvent {
  readonly type: 'focus_change';
  readonly entityType: EntityType;
  readonly entity: ResolvedEntityRef;
  readonly turn: number;
}

// =============================================================================
// SALIENCE TRACKER CLASS
// =============================================================================

/**
 * Tracks entity salience across dialogue turns.
 *
 * The tracker maintains a scored list of entities and their salience
 * levels. It integrates signals from UI selection, discourse history,
 * edit operations, and the focus stack.
 */
export class SalienceTracker {
  private entries: Map<string, MutableSalienceEntry> = new Map();
  private currentTurn: number = 0;
  private focusStack: FocusStack = {};
  private readonly config: SalienceConfig;

  constructor(config: SalienceConfig = DEFAULT_SALIENCE_CONFIG) {
    this.config = config;
  }

  /**
   * Advance to the next dialogue turn.
   *
   * This decays all salience scores and deactivates stale sources.
   */
  advanceTurn(): void {
    this.currentTurn++;

    for (const [id, entry] of this.entries) {
      // Decay score
      entry.score *= this.config.decayRate;

      // Deactivate stale sources
      for (const source of entry.sources) {
        const staleness = this.config.sourceStaleness[source.kind];
        if (this.currentTurn - source.activatedTurn > staleness) {
          source.active = false;
        }
      }

      // Remove inactive sources
      entry.sources = entry.sources.filter(s => s.active);

      // Recalculate score from active sources
      entry.score = this.calculateScore(entry);

      // Prune low-salience entries
      if (entry.score < this.config.pruneThreshold) {
        this.entries.delete(id);
      }
    }

    // Enforce max tracked entities
    if (this.entries.size > this.config.maxTrackedEntities) {
      this.pruneToLimit();
    }
  }

  /**
   * Record that an entity was mentioned in the current turn.
   */
  recordMention(entity: ResolvedEntityRef): void {
    const entry = this.getOrCreate(entity);
    entry.mentionCount++;
    entry.lastUpdatedTurn = this.currentTurn;

    this.addSource(entry, 'discourse_mention');
    this.addSource(entry, 'recency');

    // Add frequency bonus if mentioned multiple times
    if (entry.mentionCount >= 3) {
      this.addSource(entry, 'frequency');
    }

    entry.score = this.calculateScore(entry);
  }

  /**
   * Record that an entity was edited.
   */
  recordEdit(entity: ResolvedEntityRef): void {
    const entry = this.getOrCreate(entity);
    entry.lastUpdatedTurn = this.currentTurn;

    this.addSource(entry, 'last_edit');
    this.addSource(entry, 'recency');

    entry.score = this.calculateScore(entry);
  }

  /**
   * Record that an entity is currently selected in the UI.
   */
  recordUISelection(entity: ResolvedEntityRef): void {
    // Clear previous UI selection salience
    for (const entry of this.entries.values()) {
      entry.sources = entry.sources.filter(s => s.kind !== 'ui_selection');
      entry.score = this.calculateScore(entry);
    }

    const entry = this.getOrCreate(entity);
    entry.lastUpdatedTurn = this.currentTurn;

    this.addSource(entry, 'ui_selection');

    entry.score = this.calculateScore(entry);
  }

  /**
   * Update the focus stack.
   */
  updateFocusStack(stack: Partial<FocusStack>): void {
    // Remove focus_stack source from all entries
    for (const entry of this.entries.values()) {
      entry.sources = entry.sources.filter(s => s.kind !== 'focus_stack');
      entry.inFocusStack = false;
    }

    // Merge new stack
    this.focusStack = { ...this.focusStack, ...stack };

    // Add focus_stack salience to entities in the stack
    const stackEntities = [
      this.focusStack.board,
      this.focusStack.deck,
      this.focusStack.layer,
      this.focusStack.section,
      this.focusStack.range,
      this.focusStack.card,
      this.focusStack.param,
    ].filter((e): e is ResolvedEntityRef => e !== undefined);

    for (const entity of stackEntities) {
      const entry = this.getOrCreate(entity);
      entry.inFocusStack = true;
      this.addSource(entry, 'focus_stack');
      entry.score = this.calculateScore(entry);
    }
  }

  /**
   * Record that an entity was previously focused.
   */
  recordPriorFocus(entity: ResolvedEntityRef): void {
    const entry = this.getOrCreate(entity);
    entry.lastUpdatedTurn = this.currentTurn;

    this.addSource(entry, 'prior_focus');

    entry.score = this.calculateScore(entry);
  }

  /**
   * Get the most salient entity overall.
   */
  getMostSalient(): SalienceEntry | undefined {
    return this.getTopN(1)[0];
  }

  /**
   * Get the most salient entity of a given type.
   */
  getMostSalientOfType(entityType: EntityType): SalienceEntry | undefined {
    const candidates = Array.from(this.entries.values())
      .filter(e => e.entity.entityType === entityType)
      .sort((a, b) => b.score - a.score);

    const top = candidates[0];
    return top ? this.toReadonly(top) : undefined;
  }

  /**
   * Get the top N most salient entities.
   */
  getTopN(n: number): readonly SalienceEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map(e => this.toReadonly(e));
  }

  /**
   * Get all salient entities above a threshold.
   */
  getAboveThreshold(threshold: number): readonly SalienceEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(e => this.toReadonly(e));
  }

  /**
   * Get the salience score for a specific entity.
   */
  getScore(entity: ResolvedEntityRef): number {
    const id = getEntityKey(entity);
    return this.entries.get(id)?.score ?? 0;
  }

  /**
   * Get the full salience entry for a specific entity.
   */
  getEntry(entity: ResolvedEntityRef): SalienceEntry | undefined {
    const id = getEntityKey(entity);
    const entry = this.entries.get(id);
    return entry ? this.toReadonly(entry) : undefined;
  }

  /**
   * Get the current focus stack.
   */
  getFocusStack(): Readonly<FocusStack> {
    return this.focusStack;
  }

  /**
   * Get the current turn number.
   */
  getCurrentTurn(): number {
    return this.currentTurn;
  }

  /**
   * Get a snapshot of all salience entries (for debugging/display).
   */
  getSnapshot(): SalienceSnapshot {
    return {
      turn: this.currentTurn,
      entries: this.getTopN(this.entries.size),
      focusStack: { ...this.focusStack },
      totalTracked: this.entries.size,
    };
  }

  /**
   * Reset all salience tracking (e.g., new conversation).
   */
  reset(): void {
    this.entries.clear();
    this.currentTurn = 0;
    this.focusStack = {};
  }

  // ===== Private helpers =====

  private getOrCreate(entity: ResolvedEntityRef): MutableSalienceEntry {
    const id = getEntityKey(entity);
    let entry = this.entries.get(id);
    if (!entry) {
      entry = {
        entity,
        score: DEFAULT_ENTITY_TYPE_SALIENCE[entity.entityType] ?? 0.1,
        sources: [],
        lastUpdatedTurn: this.currentTurn,
        firstMentionedTurn: this.currentTurn,
        mentionCount: 0,
        inFocusStack: false,
      };
      this.entries.set(id, entry);
    }
    return entry;
  }

  private addSource(entry: MutableSalienceEntry, kind: SalienceSourceKind): void {
    // Replace existing source of same kind
    entry.sources = entry.sources.filter(s => s.kind !== kind);
    entry.sources.push({
      kind,
      weight: this.config.sourceWeights[kind],
      activatedTurn: this.currentTurn,
      active: true,
    });
  }

  private calculateScore(entry: MutableSalienceEntry): number {
    if (entry.sources.length === 0) {
      return DEFAULT_ENTITY_TYPE_SALIENCE[entry.entity.entityType] ?? 0.1;
    }

    // Sum active source weights with turn-based decay
    let score = 0;
    for (const source of entry.sources) {
      if (!source.active) continue;
      const turnsSinceActive = this.currentTurn - source.activatedTurn;
      const decayedWeight = source.weight * Math.pow(this.config.decayRate, turnsSinceActive);
      score += decayedWeight;
    }

    // Clamp to [0, 1]
    return Math.min(1.0, Math.max(0, score));
  }

  private pruneToLimit(): void {
    const sorted = Array.from(this.entries.entries())
      .sort((a, b) => b[1].score - a[1].score);

    const toRemove = sorted.slice(this.config.maxTrackedEntities);
    for (const [id] of toRemove) {
      this.entries.delete(id);
    }
  }

  private toReadonly(entry: MutableSalienceEntry): SalienceEntry {
    return {
      entity: entry.entity,
      score: entry.score,
      sources: entry.sources.map(s => ({ ...s })),
      lastUpdatedTurn: entry.lastUpdatedTurn,
      firstMentionedTurn: entry.firstMentionedTurn,
      mentionCount: entry.mentionCount,
      inFocusStack: entry.inFocusStack,
    };
  }
}

/**
 * Mutable internal salience entry.
 */
interface MutableSalienceEntry {
  entity: ResolvedEntityRef;
  score: number;
  sources: MutableSalienceSource[];
  lastUpdatedTurn: number;
  firstMentionedTurn: number;
  mentionCount: number;
  inFocusStack: boolean;
}

/**
 * Mutable internal salience source.
 */
interface MutableSalienceSource {
  kind: SalienceSourceKind;
  weight: number;
  activatedTurn: number;
  active: boolean;
}

// =============================================================================
// SALIENCE SNAPSHOT
// =============================================================================

/**
 * A snapshot of salience state for debugging/display.
 */
export interface SalienceSnapshot {
  readonly turn: number;
  readonly entries: readonly SalienceEntry[];
  readonly focusStack: Readonly<FocusStack>;
  readonly totalTracked: number;
}

// =============================================================================
// ENTITY KEY EXTRACTION
// =============================================================================

/**
 * Get a unique key for an entity reference.
 */
function getEntityKey(entity: ResolvedEntityRef): string {
  return entity.id as string;
}

// =============================================================================
// SALIENCE-AWARE RESOLUTION
// =============================================================================

/**
 * Resolution context that includes salience information.
 *
 * Used by the resolver to incorporate salience into entity resolution.
 */
export interface SalienceResolutionContext {
  readonly tracker: SalienceTracker;
  readonly currentTurn: number;
  readonly focusStack: Readonly<FocusStack>;
}

/**
 * Score a resolution candidate using salience.
 *
 * Combines the base match score with salience to produce a final
 * confidence score. Higher salience entities get a boost.
 */
export function scoreCandidateWithSalience(
  baseScore: number,
  entity: ResolvedEntityRef,
  context: SalienceResolutionContext
): number {
  const salienceScore = context.tracker.getScore(entity);

  // Salience contributes up to 20% of final score
  const salienceBoost = salienceScore * 0.2;

  // Focus stack bonus: entities in the focus stack get a small boost
  const focusEntry = context.tracker.getEntry(entity);
  const focusBoost = focusEntry?.inFocusStack ? 0.05 : 0;

  return Math.min(1.0, baseScore + salienceBoost + focusBoost);
}

/**
 * Select the best candidate from a set of ambiguous matches using salience.
 *
 * Returns the candidate with the highest combined score, or undefined
 * if the scores are too close (true ambiguity).
 */
export function disambiguateWithSalience(
  candidates: readonly {
    readonly entity: ResolvedEntityRef;
    readonly baseScore: number;
  }[],
  context: SalienceResolutionContext,
  ambiguityThreshold: number = 0.15
): {
  readonly winner: ResolvedEntityRef | undefined;
  readonly scores: readonly { entity: ResolvedEntityRef; finalScore: number }[];
} {
  const scored = candidates.map(c => ({
    entity: c.entity,
    finalScore: scoreCandidateWithSalience(c.baseScore, c.entity, context),
  }));

  // Sort by final score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  if (scored.length === 0) {
    return { winner: undefined, scores: scored };
  }

  if (scored.length === 1) {
    return { winner: scored[0]!.entity, scores: scored };
  }

  // Check if top candidate is clearly better
  const top = scored[0]!;
  const second = scored[1]!;
  if (top.finalScore - second.finalScore > ambiguityThreshold) {
    return { winner: top.entity, scores: scored };
  }

  // True ambiguity — no winner
  return { winner: undefined, scores: scored };
}

// =============================================================================
// SALIENCE INTEGRATION WITH DISCOURSE
// =============================================================================

/**
 * Discourse event that affects salience.
 */
export type SalienceEvent =
  | { readonly type: 'mention'; readonly entity: ResolvedEntityRef; readonly turn: number }
  | { readonly type: 'edit'; readonly entity: ResolvedEntityRef; readonly turn: number }
  | { readonly type: 'select'; readonly entity: ResolvedEntityRef; readonly turn: number }
  | { readonly type: 'focus'; readonly entity: ResolvedEntityRef; readonly turn: number }
  | { readonly type: 'unfocus'; readonly entity: ResolvedEntityRef; readonly turn: number }
  | { readonly type: 'new_turn'; readonly turn: number };

/**
 * Process a sequence of salience events.
 *
 * This is the main integration point between the discourse model
 * and the salience tracker.
 */
export function processSalienceEvents(
  tracker: SalienceTracker,
  events: readonly SalienceEvent[]
): void {
  for (const event of events) {
    switch (event.type) {
      case 'mention':
        tracker.recordMention(event.entity);
        break;
      case 'edit':
        tracker.recordEdit(event.entity);
        break;
      case 'select':
        tracker.recordUISelection(event.entity);
        break;
      case 'focus':
        tracker.updateFocusStack({
          [event.entity.entityType]: event.entity,
        } as Partial<FocusStack>);
        break;
      case 'unfocus':
        tracker.recordPriorFocus(event.entity);
        break;
      case 'new_turn':
        tracker.advanceTurn();
        break;
    }
  }
}

// =============================================================================
// SALIENCE DISPLAY
// =============================================================================

/**
 * Format a salience entry for display in the UI.
 */
export function formatSalienceDisplay(entry: SalienceEntry): string {
  const sources = entry.sources
    .filter(s => s.active)
    .map(s => formatSourceKind(s.kind))
    .join(', ');

  const scorePercent = Math.round(entry.score * 100);
  return `${entry.entity.displayName}: ${scorePercent}% [${sources}]`;
}

/**
 * Format a source kind for display.
 */
function formatSourceKind(kind: SalienceSourceKind): string {
  switch (kind) {
    case 'ui_selection': return 'selected';
    case 'last_edit': return 'just edited';
    case 'discourse_mention': return 'mentioned';
    case 'focus_stack': return 'in focus';
    case 'prior_focus': return 'previously focused';
    case 'frequency': return 'frequently mentioned';
    case 'recency': return 'recently referenced';
    case 'structural': return 'structurally prominent';
    case 'default': return 'default';
  }
}

/**
 * Format the focus stack for display.
 */
export function formatFocusStackDisplay(stack: Readonly<FocusStack>): string {
  const parts: string[] = [];
  if (stack.board) parts.push(stack.board.displayName);
  if (stack.deck) parts.push(stack.deck.displayName);
  if (stack.layer) parts.push(stack.layer.displayName);
  if (stack.section) parts.push(stack.section.displayName);
  if (stack.range) parts.push(stack.range.displayName);
  if (stack.card) parts.push(stack.card.displayName);
  if (stack.param) parts.push(stack.param.displayName);

  if (parts.length === 0) return 'No focus';
  return parts.join(' → ');
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules governing salience tracking.
 */
export interface SalienceRule {
  readonly id: string;
  readonly description: string;
  readonly category: 'decay' | 'boosting' | 'resolution' | 'focus';
  readonly rule: string;
}

/**
 * Canonical rules for salience tracking.
 */
export const SALIENCE_RULES: readonly SalienceRule[] = [
  {
    id: 'sal-001',
    description: 'UI selection has highest salience',
    category: 'boosting',
    rule: 'The currently selected entity in the UI always has the highest salience score (weight 1.0). This overrides all other salience sources for reference resolution.',
  },
  {
    id: 'sal-002',
    description: 'Salience decays per turn',
    category: 'decay',
    rule: 'All salience scores are multiplied by the decay rate (0.85) at the start of each new dialogue turn. This ensures that old references fade unless refreshed.',
  },
  {
    id: 'sal-003',
    description: 'Last-edit salience is high but fades',
    category: 'boosting',
    rule: 'An entity that was just edited gets a salience boost of 0.9, which decays normally. After 3 turns without re-editing, the last_edit source deactivates.',
  },
  {
    id: 'sal-004',
    description: 'Frequency builds slow persistent salience',
    category: 'boosting',
    rule: 'After an entity is mentioned 3+ times, it gets a frequency bonus of 0.3. This source does not expire, ensuring repeatedly-discussed entities stay findable.',
  },
  {
    id: 'sal-005',
    description: 'Focus stack provides structural salience',
    category: 'focus',
    rule: 'Entities in the current focus stack (board → deck → layer → section) get a persistent 0.6 salience boost. This makes "the drums" resolve correctly when the drums track is focused.',
  },
  {
    id: 'sal-006',
    description: 'Salience disambiguates near-equal matches',
    category: 'resolution',
    rule: 'When two candidates have base match scores within 0.15, salience provides up to 0.2 additional score to disambiguate. If salience cannot disambiguate (scores still within 0.15), a clarification question is triggered.',
  },
  {
    id: 'sal-007',
    description: 'Anaphoric resolution uses salience ranking',
    category: 'resolution',
    rule: '"It" and "them" resolve to the most salient entity of the expected type. "That" resolves to the second-most salient (distal deictic).',
  },
  {
    id: 'sal-008',
    description: 'New conversation resets salience',
    category: 'decay',
    rule: 'Starting a new conversation session resets all salience scores to default entity type levels. The focus stack is preserved from the UI state.',
  },
  {
    id: 'sal-009',
    description: 'Salience is deterministic',
    category: 'resolution',
    rule: 'Given the same sequence of salience events and the same configuration, the salience tracker must produce identical scores. No randomness or platform-dependent behavior.',
  },
  {
    id: 'sal-010',
    description: 'Entity type default salience',
    category: 'boosting',
    rule: 'Entity types have default salience levels: sections (0.20) > layers (0.15) > cards (0.12) > ranges (0.10) > decks (0.08) = events (0.08) > params (0.06) > board (0.05) = axes (0.05). These are the base scores before any interaction.',
  },
];
