/**
 * @file Speech Situation Model
 * @module gofai/pragmatics/speech-situation
 * 
 * Implements Step 073: Add a "speech situation" model (speaker, addressee, time,
 * focused tool) to support situation semantics-like reasoning.
 * 
 * The speech situation captures the **context of utterance** that determines how
 * meaning is grounded. Drawing from situation semantics (Barwise & Perry),
 * conversational analysis, and discourse representation theory, this module
 * tracks:
 * 
 * - **Participants**: Speaker (user), addressee (system), observers (collaboration)
 * - **Temporal context**: Current time, time of last edit, session duration
 * - **Spatial/UI context**: Focused board/deck/track, visible entities
 * - **Discourse context**: Recent utterances, current question under discussion (QUD)
 * - **Project state**: What's selected, what's playing, what changed recently
 * - **Shared assumptions**: Common ground, presuppositions, user preferences
 * 
 * The speech situation enables:
 * - Deictic resolution ("that", "here", "now", "just before")
 * - Implicit scope inference ("make it brighter" — what is "it"?)
 * - Conversational implicature (what is left unsaid but understood)
 * - Presupposition accommodation (assuming what the user assumes)
 * - Turn-taking and clarification strategies
 * 
 * This is complementary to but distinct from:
 * - `dialogue-state.ts`: Tracks conversational state across turns
 * - `context-resolution.ts`: Resolves specific referents
 * - `discourse-context.ts`: Manages discourse referents and salience
 * 
 * The speech situation is the **grounding context** that those modules consult.
 * 
 * @see gofai_goalB.md Step 073
 * @see Barwise & Perry, "Situations and Attitudes" (1983)
 * @see Clark, "Using Language" (1996) on common ground
 */

import type { EventId, TrackId } from '../../types/index.js';
import type { BoardId } from '../../boards/types.js';
import type { DeckId } from '../../types/deck.js';
import type { CardId } from '../../types/card.js';
import type { SectionId } from '../../types/section.js';

// ============================================================================
// Core Speech Situation Types
// ============================================================================

/**
 * A speech situation — the complete context of an utterance.
 * 
 * This is the SSOT for grounding natural language semantics.
 */
export interface SpeechSituation {
  /** Stable situation identifier */
  readonly id: SituationId;
  
  /** When this situation was captured */
  readonly timestamp: number;
  
  /** Participants in the conversation */
  readonly participants: SituationParticipants;
  
  /** Temporal context */
  readonly temporal: TemporalContext;
  
  /** UI focus context */
  readonly focus: FocusContext;
  
  /** Project state context */
  readonly project: ProjectContext;
  
  /** Discourse context reference */
  readonly discourse: DiscourseReference;
  
  /** Common ground assumptions */
  readonly commonGround: CommonGround;
  
  /** Session metadata */
  readonly session: SessionContext;
}

export type SituationId = string & { readonly __situationId: unique symbol };

/**
 * Participants in the speech situation.
 */
export interface SituationParticipants {
  /** The speaker (user) */
  readonly speaker: Speaker;
  
  /** The addressee (GOFAI system) */
  readonly addressee: Addressee;
  
  /** Observers (collaborators, if any) */
  readonly observers: readonly Observer[];
}

export interface Speaker {
  /** User identifier */
  readonly userId: string;
  
  /** User's preferred name */
  readonly name?: string;
  
  /** User's role in session (composer, producer, mixing engineer, etc.) */
  readonly role?: UserRole;
  
  /** User's language preferences */
  readonly language: LanguagePreference;
  
  /** User's interaction style preferences */
  readonly interactionStyle: InteractionStyle;
}

export type UserRole =
  | 'composer'
  | 'arranger'
  | 'producer'
  | 'mixing-engineer'
  | 'sound-designer'
  | 'performer'
  | 'learner'
  | 'experimenter';

export interface LanguagePreference {
  /** Primary language code (e.g., 'en-US') */
  readonly primary: string;
  
  /** Fallback languages */
  readonly fallbacks: readonly string[];
  
  /** Preferred terminology (technical vs casual) */
  readonly terminologyLevel: 'casual' | 'standard' | 'technical';
  
  /** Preferred measurement units */
  readonly units: 'metric' | 'imperial';
}

export interface InteractionStyle {
  /** Verbosity preference */
  readonly verbosity: 'terse' | 'normal' | 'verbose';
  
  /** Confirmation frequency */
  readonly confirmations: 'always' | 'risky' | 'never';
  
  /** Preview before apply */
  readonly previewFirst: boolean;
  
  /** Show explanations */
  readonly showReasons: boolean;
  
  /** Tolerance for ambiguity */
  readonly ambiguityTolerance: 'strict' | 'moderate' | 'permissive';
}

export interface Addressee {
  /** System name */
  readonly name: 'GOFAI' | 'AI Advisor';
  
  /** Current capability mode */
  readonly mode: 'full-auto' | 'preview-first' | 'manual-only';
  
  /** Available capabilities */
  readonly capabilities: readonly string[];
}

export interface Observer {
  /** Observer ID */
  readonly id: string;
  
  /** Observer name */
  readonly name?: string;
  
  /** Observer role */
  readonly role: 'collaborator' | 'student' | 'viewer';
}

// ============================================================================
// Temporal Context
// ============================================================================

/**
 * Temporal context of the speech situation.
 */
export interface TemporalContext {
  /** Current wall-clock time */
  readonly now: number;
  
  /** When the current session started */
  readonly sessionStart: number;
  
  /** When the last edit was applied */
  readonly lastEditAt?: number;
  
  /** When the last utterance was processed */
  readonly lastUtteranceAt?: number;
  
  /** Current playback time (if playing) */
  readonly playbackTime?: PlaybackTime;
  
  /** Recent time anchors (for "just before", "earlier") */
  readonly timeAnchors: readonly TimeAnchor[];
}

export interface PlaybackTime {
  /** Playback position in ticks */
  readonly tick: number;
  
  /** Playback position in bars */
  readonly bar: number;
  
  /** Is currently playing? */
  readonly isPlaying: boolean;
  
  /** Loop range (if looping) */
  readonly loopRange?: BarRange;
}

export interface BarRange {
  readonly startBar: number;
  readonly endBar: number;
}

export interface TimeAnchor {
  /** Label for this anchor */
  readonly label: string;
  
  /** When it occurred */
  readonly timestamp: number;
  
  /** What happened */
  readonly event: string;
  
  /** How salient (for recency resolution) */
  readonly salience: number;
}

// ============================================================================
// Focus Context
// ============================================================================

/**
 * UI focus context — what the user is currently looking at/interacting with.
 */
export interface FocusContext {
  /** Currently focused board */
  readonly board: BoardFocus;
  
  /** Currently focused deck (if any) */
  readonly deck?: DeckFocus;
  
  /** Currently focused track (if any) */
  readonly track?: TrackFocus;
  
  /** Current selection */
  readonly selection: Selection;
  
  /** Visible entities (what's on screen) */
  readonly visible: VisibleEntities;
  
  /** Recently interacted entities */
  readonly recentInteractions: readonly EntityInteraction[];
}

export interface BoardFocus {
  readonly boardId: BoardId;
  readonly boardName: string;
  readonly focusedSince: number;
  readonly capabilities: readonly string[];
}

export interface DeckFocus {
  readonly deckId: DeckId;
  readonly deckType: string;
  readonly deckName?: string;
  readonly focusedSince: number;
}

export interface TrackFocus {
  readonly trackId: TrackId;
  readonly trackName: string;
  readonly role?: string;
  readonly focusedSince: number;
}

export interface Selection {
  /** Selected tracks */
  readonly tracks: readonly TrackId[];
  
  /** Selected events */
  readonly events: readonly EventId[];
  
  /** Selected bar range */
  readonly barRange?: BarRange;
  
  /** Selected section (if any) */
  readonly section?: SectionId;
  
  /** When selection was made */
  readonly selectedAt: number;
}

export interface VisibleEntities {
  /** Tracks visible in viewport */
  readonly tracks: readonly TrackId[];
  
  /** Cards visible in current view */
  readonly cards: readonly CardId[];
  
  /** Sections visible in timeline */
  readonly sections: readonly SectionId[];
  
  /** Bar range visible in timeline */
  readonly visibleBars: BarRange;
}

export interface EntityInteraction {
  /** What entity was interacted with */
  readonly entityId: string;
  
  /** What type of entity */
  readonly entityType: 'track' | 'card' | 'deck' | 'section' | 'event';
  
  /** What was done */
  readonly action: string;
  
  /** When */
  readonly timestamp: number;
  
  /** Salience for recency resolution */
  readonly salience: number;
}

// ============================================================================
// Project Context
// ============================================================================

/**
 * Current project state context.
 */
export interface ProjectContext {
  /** Project identifier */
  readonly projectId: string;
  
  /** Project name */
  readonly projectName?: string;
  
  /** Current tempo */
  readonly tempo: number;
  
  /** Current key (if known) */
  readonly key?: string;
  
  /** Current time signature */
  readonly timeSignature: TimeSignature;
  
  /** Available sections */
  readonly sections: readonly ProjectSection[];
  
  /** Available tracks */
  readonly tracks: readonly ProjectTrack[];
  
  /** What changed recently */
  readonly recentChanges: readonly ProjectChange[];
  
  /** Project duration */
  readonly duration: ProjectDuration;
}

export interface TimeSignature {
  readonly numerator: number;
  readonly denominator: number;
}

export interface ProjectSection {
  readonly id: SectionId;
  readonly name: string;
  readonly startBar: number;
  readonly endBar: number;
  readonly tags?: readonly string[];
}

export interface ProjectTrack {
  readonly id: TrackId;
  readonly name: string;
  readonly role?: string;
  readonly isMuted: boolean;
  readonly isSoloed: boolean;
  readonly hasContent: boolean;
}

export interface ProjectChange {
  /** What changed */
  readonly description: string;
  
  /** When */
  readonly timestamp: number;
  
  /** Scope affected */
  readonly scope: string;
  
  /** Edit package ID */
  readonly editPackageId?: string;
  
  /** Salience */
  readonly salience: number;
}

export interface ProjectDuration {
  /** Duration in bars */
  readonly bars: number;
  
  /** Duration in beats */
  readonly beats: number;
  
  /** Duration in seconds */
  readonly seconds: number;
}

// ============================================================================
// Discourse Reference
// ============================================================================

/**
 * Reference to discourse context.
 * 
 * The full discourse state is maintained separately; this is just
 * a pointer for situation semantics lookup.
 */
export interface DiscourseReference {
  /** Current discourse state ID */
  readonly discourseStateId: string;
  
  /** Current question under discussion */
  readonly currentQUD?: QuestionUnderDiscussion;
  
  /** Most recent discourse referents */
  readonly recentReferents: readonly DiscourseReferent[];
  
  /** Number of turns in this conversation */
  readonly turnCount: number;
}

export interface QuestionUnderDiscussion {
  /** The question */
  readonly question: string;
  
  /** When it was raised */
  readonly raisedAt: number;
  
  /** Partial answers so far */
  readonly partialAnswers: readonly string[];
}

export interface DiscourseReferent {
  /** What was referred to */
  readonly label: string;
  
  /** Entity ID (if known) */
  readonly entityId?: string;
  
  /** Entity type */
  readonly entityType?: string;
  
  /** When mentioned */
  readonly mentionedAt: number;
  
  /** Salience score */
  readonly salience: number;
}

// ============================================================================
// Common Ground
// ============================================================================

/**
 * Common ground — shared assumptions between speaker and system.
 * 
 * This represents what both parties presuppose to be true.
 */
export interface CommonGround {
  /** Known facts about the project */
  readonly facts: readonly GroundedFact[];
  
  /** Shared goals for this session */
  readonly goals: readonly SessionGoal[];
  
  /** Established conventions in this conversation */
  readonly conventions: readonly Convention[];
  
  /** User's established preferences */
  readonly preferences: readonly Preference[];
  
  /** Presuppositions that have been accommodated */
  readonly presuppositions: readonly Presupposition[];
}

export interface GroundedFact {
  /** The fact */
  readonly fact: string;
  
  /** Confidence (0-1) */
  readonly confidence: number;
  
  /** Source of this fact */
  readonly source: 'stated' | 'inferred' | 'observed';
  
  /** When established */
  readonly establishedAt: number;
}

export interface SessionGoal {
  /** The goal */
  readonly goal: string;
  
  /** Priority */
  readonly priority: 'high' | 'medium' | 'low';
  
  /** Progress (0-1) */
  readonly progress: number;
}

export interface Convention {
  /** What the convention is */
  readonly convention: string;
  
  /** Examples */
  readonly examples: readonly string[];
  
  /** When established */
  readonly establishedAt: number;
}

export interface Preference {
  /** Preference key */
  readonly key: string;
  
  /** Preference value */
  readonly value: unknown;
  
  /** How strongly held */
  readonly strength: 'weak' | 'moderate' | 'strong';
}

export interface Presupposition {
  /** What is presupposed */
  readonly presupposition: string;
  
  /** When accommodated */
  readonly accommodatedAt: number;
  
  /** Source utterance */
  readonly sourceUtterance?: string;
}

// ============================================================================
// Session Context
// ============================================================================

/**
 * Session metadata.
 */
export interface SessionContext {
  /** Session ID */
  readonly sessionId: string;
  
  /** Session start time */
  readonly startedAt: number;
  
  /** Session type */
  readonly type: SessionType;
  
  /** Session phase */
  readonly phase: SessionPhase;
  
  /** Session quality metrics */
  readonly metrics: SessionMetrics;
}

export type SessionType =
  | 'composition'      // Creating new music
  | 'arrangement'      // Arranging existing music
  | 'production'       // Adding production layers
  | 'mixing'           // Mixing and balancing
  | 'sound-design'     // Designing sounds
  | 'exploration'      // Exploring/learning
  | 'collaboration';   // Working with others

export type SessionPhase =
  | 'ideation'         // Generating ideas
  | 'development'      // Developing ideas
  | 'refinement'       // Refining details
  | 'finalization'     // Final touches
  | 'review';          // Reviewing work

export interface SessionMetrics {
  /** Number of edits applied */
  readonly editsApplied: number;
  
  /** Number of edits undone */
  readonly editsUndone: number;
  
  /** Number of clarification questions */
  readonly clarificationCount: number;
  
  /** Average confidence */
  readonly avgConfidence: number;
  
  /** User satisfaction signals */
  readonly satisfactionSignals: number;
}

// ============================================================================
// Speech Situation Operations
// ============================================================================

/**
 * Create a new speech situation from current state.
 */
export function captureSpeechSituation(
  speaker: Speaker,
  focus: FocusContext,
  project: ProjectContext,
  options?: Partial<SpeechSituation>
): SpeechSituation {
  const now = Date.now();
  
  return {
    id: generateSituationId() as SituationId,
    timestamp: now,
    participants: {
      speaker,
      addressee: {
        name: 'GOFAI',
        mode: 'preview-first',
        capabilities: ['events', 'dsp', 'structure'],
      },
      observers: [],
    },
    temporal: {
      now,
      sessionStart: options?.session?.startedAt ?? now,
      timeAnchors: [],
    },
    focus,
    project,
    discourse: {
      discourseStateId: options?.discourse?.discourseStateId ?? generateDiscourseId(),
      recentReferents: [],
      turnCount: 0,
    },
    commonGround: {
      facts: [],
      goals: [],
      conventions: [],
      preferences: [],
      presuppositions: [],
    },
    session: {
      sessionId: options?.session?.sessionId ?? generateSessionId(),
      startedAt: now,
      type: 'composition',
      phase: 'ideation',
      metrics: {
        editsApplied: 0,
        editsUndone: 0,
        clarificationCount: 0,
        avgConfidence: 0,
        satisfactionSignals: 0,
      },
    },
    ...options,
  };
}

/**
 * Update speech situation with new context.
 */
export function updateSpeechSituation(
  situation: SpeechSituation,
  updates: Partial<SpeechSituation>
): SpeechSituation {
  return {
    ...situation,
    ...updates,
    timestamp: Date.now(),
  };
}

/**
 * Check if a presupposition is grounded in the situation.
 */
export function isPresuppositionGrounded(
  presupposition: string,
  situation: SpeechSituation
): boolean {
  // Check if presupposition is in common ground
  return situation.commonGround.presuppositions.some(
    p => p.presupposition === presupposition
  );
}

/**
 * Accommodate a presupposition into common ground.
 */
export function accommodatePresupposition(
  presupposition: string,
  situation: SpeechSituation,
  sourceUtterance?: string
): SpeechSituation {
  const newPresupposition: Presupposition = {
    presupposition,
    accommodatedAt: Date.now(),
    sourceUtterance,
  };
  
  return updateSpeechSituation(situation, {
    commonGround: {
      ...situation.commonGround,
      presuppositions: [
        ...situation.commonGround.presuppositions,
        newPresupposition,
      ],
    },
  });
}

/**
 * Add a fact to common ground.
 */
export function addGroundedFact(
  fact: string,
  situation: SpeechSituation,
  confidence: number = 1.0,
  source: GroundedFact['source'] = 'observed'
): SpeechSituation {
  const newFact: GroundedFact = {
    fact,
    confidence,
    source,
    establishedAt: Date.now(),
  };
  
  return updateSpeechSituation(situation, {
    commonGround: {
      ...situation.commonGround,
      facts: [...situation.commonGround.facts, newFact],
    },
  });
}

/**
 * Get the most salient recent referent.
 */
export function getMostSalientReferent(
  situation: SpeechSituation,
  entityType?: string
): DiscourseReferent | undefined {
  let referents = situation.discourse.recentReferents;
  
  if (entityType) {
    referents = referents.filter(r => r.entityType === entityType);
  }
  
  if (referents.length === 0) return undefined;
  
  // Sort by salience (descending)
  const sorted = [...referents].sort((a, b) => b.salience - a.salience);
  return sorted[0];
}

/**
 * Get the focused entity of a given type.
 */
export function getFocusedEntity(
  situation: SpeechSituation,
  entityType: 'track' | 'deck' | 'board'
): string | undefined {
  switch (entityType) {
    case 'track':
      return situation.focus.track?.trackId as string | undefined;
    case 'deck':
      return situation.focus.deck?.deckId as string | undefined;
    case 'board':
      return situation.focus.board.boardId as string | undefined;
  }
}

/**
 * Compute temporal distance from "now" to a time anchor.
 */
export function computeTemporalDistance(
  anchorLabel: string,
  situation: SpeechSituation
): number {
  const anchor = situation.temporal.timeAnchors.find(a => a.label === anchorLabel);
  if (!anchor) return Infinity;
  
  return situation.temporal.now - anchor.timestamp;
}

/**
 * Is entity currently visible?
 */
export function isEntityVisible(
  entityId: string,
  entityType: 'track' | 'card' | 'section',
  situation: SpeechSituation
): boolean {
  const visible = situation.focus.visible;
  
  switch (entityType) {
    case 'track':
      return visible.tracks.includes(entityId as TrackId);
    case 'card':
      return visible.cards.includes(entityId as CardId);
    case 'section':
      return visible.sections.includes(entityId as SectionId);
    default:
      return false;
  }
}

/**
 * Get recent interactions with an entity type.
 */
export function getRecentInteractions(
  entityType: string,
  situation: SpeechSituation,
  limit: number = 5
): readonly EntityInteraction[] {
  return situation.focus.recentInteractions
    .filter(i => i.entityType === entityType)
    .slice(0, limit);
}

// ============================================================================
// Helpers
// ============================================================================

function generateSituationId(): string {
  return `sit:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateDiscourseId(): string {
  return `disc:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `sess:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
