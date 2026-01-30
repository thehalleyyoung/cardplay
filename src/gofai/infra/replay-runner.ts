/**
 * @file Replay Runner
 * @module gofai/infra/replay-runner
 * 
 * Implements Step 350: Add a deterministic "replay runner" that can replay
 * a conversation and applied edits from logs for regression debugging.
 * 
 * This module provides functionality to:
 * 1. Record complete GOFAI sessions (utterances + edits)
 * 2. Replay sessions deterministically
 * 3. Compare replay results against expected outputs
 * 4. Generate regression test cases from sessions
 * 5. Detect non-determinism and behavioral regressions
 * 
 * The replay runner is essential for:
 * - Regression testing after compiler changes
 * - Reproducing bug reports
 * - Creating golden test cases from real sessions
 * - Verifying determinism guarantees
 * 
 * @see gofai_goalB.md Step 350
 */

// ============================================================================
// Imports
// ============================================================================

import type {
  EditPackage,
  CPLIntent,
  CPLPlan,
} from '../execution/edit-package.js';

import type {
  DiscourseState,
} from '../pragmatics/discourse-model.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A recorded GOFAI session.
 */
export interface RecordedSession {
  /** Session metadata */
  readonly metadata: SessionMetadata;

  /** Initial project state fingerprint */
  readonly initialState: ProjectStateFingerprint;

  /** Sequence of turns */
  readonly turns: readonly RecordedTurn[];

  /** Final discourse state (optional) */
  readonly finalDiscourseState?: DiscourseState;

  /** Session-level statistics */
  readonly statistics: SessionStatistics;
}

/**
 * Session metadata.
 */
export interface SessionMetadata {
  /** Session ID */
  readonly sessionId: string;

  /** When the session was recorded */
  readonly recordedAt: number;

  /** GOFAI compiler version */
  readonly gofaiVersion: string;

  /** CardPlay version */
  readonly cardplayVersion: string;

  /** Recording format version */
  readonly recordingVersion: string;

  /** Description */
  readonly description?: string;

  /** Tags for categorization */
  readonly tags: readonly string[];

  /** Board type during session */
  readonly boardType: string;
}

/**
 * Project state fingerprint (for verification).
 */
export interface ProjectStateFingerprint {
  /** Number of tracks */
  readonly trackCount: number;

  /** Number of events */
  readonly eventCount: number;

  /** Number of cards */
  readonly cardCount: number;

  /** Number of sections */
  readonly sectionCount: number;

  /** Duration in bars */
  readonly durationBars: number;

  /** Structural hash (for quick validation) */
  readonly structureHash: string;
}

/**
 * A recorded turn in the session.
 */
export interface RecordedTurn {
  /** Turn number */
  readonly turnNumber: number;

  /** User utterance */
  readonly utterance: string;

  /** Expected CPL-Intent */
  readonly expectedIntent?: CPLIntent;

  /** Expected CPL-Plan */
  readonly expectedPlan?: CPLPlan;

  /** Expected edit package (if applied) */
  readonly expectedEditPackage?: EditPackage;

  /** Whether edit was applied in original session */
  readonly wasApplied: boolean;

  /** User action (if not a simple utterance) */
  readonly userAction?: UserAction;

  /** Project state fingerprint after this turn */
  readonly stateAfterTurn: ProjectStateFingerprint;

  /** Discourse state after this turn */
  readonly discourseStateAfterTurn?: DiscourseState;

  /** Turn timing */
  readonly timing: TurnTiming;
}

/**
 * User actions other than utterances.
 */
export type UserAction =
  | { readonly type: 'undo'; readonly editPackageId: string }
  | { readonly type: 'redo'; readonly editPackageId: string }
  | { readonly type: 'apply_edit'; readonly editPackageId: string }
  | { readonly type: 'reject_edit'; readonly editPackageId: string }
  | { readonly type: 'ui_selection'; readonly entityIds: readonly string[] }
  | { readonly type: 'ui_focus'; readonly entityId: string };

/**
 * Turn timing information.
 */
export interface TurnTiming {
  readonly parsingMs?: number;
  readonly planningMs?: number;
  readonly executionMs?: number;
  readonly totalMs: number;
}

/**
 * Session-level statistics.
 */
export interface SessionStatistics {
  readonly totalTurns: number;
  readonly utterances: number;
  readonly editsApplied: number;
  readonly editsUndone: number;
  readonly editsRedone: number;
  readonly clarifications: number;
  readonly failures: number;
  readonly totalDurationMs: number;
}

/**
 * Configuration for replay.
 */
export interface ReplayConfig {
  /** Stop on first mismatch? */
  readonly stopOnMismatch: boolean;

  /** Strict comparison mode (exact matches required) */
  readonly strictMode: boolean;

  /** Check CPL-Intent matches? */
  readonly checkIntents: boolean;

  /** Check CPL-Plan matches? */
  readonly checkPlans: boolean;

  /** Check diffs match? */
  readonly checkDiffs: boolean;

  /** Check project state fingerprints? */
  readonly checkStateFingerprints: boolean;

  /** Timeout per turn (ms) */
  readonly turnTimeoutMs: number;

  /** Allow timing variations? */
  readonly allowTimingVariations: boolean;
}

/**
 * Default replay configuration.
 */
export const DEFAULT_REPLAY_CONFIG: ReplayConfig = {
  stopOnMismatch: false,
  strictMode: true,
  checkIntents: true,
  checkPlans: true,
  checkDiffs: true,
  checkStateFingerprints: true,
  turnTimeoutMs: 30000,
  allowTimingVariations: true,
};

/**
 * Result of replaying a session.
 */
export interface ReplayResult {
  /** Did the replay succeed? */
  readonly success: boolean;

  /** Replay metadata */
  readonly metadata: ReplayMetadata;

  /** Results for each turn */
  readonly turnResults: readonly TurnReplayResult[];

  /** Summary statistics */
  readonly statistics: ReplayStatistics;

  /** Any errors */
  readonly errors: readonly ReplayError[];
}

/**
 * Replay metadata.
 */
export interface ReplayMetadata {
  readonly sessionId: string;
  readonly replayedAt: number;
  readonly replayerVersion: string;
  readonly originalGofaiVersion: string;
  readonly currentGofaiVersion: string;
}

/**
 * Result of replaying a single turn.
 */
export interface TurnReplayResult {
  readonly turnNumber: number;
  readonly success: boolean;
  readonly intentMatch?: ComparisonResult;
  readonly planMatch?: ComparisonResult;
  readonly diffMatch?: ComparisonResult;
  readonly stateFingerprintMatch?: ComparisonResult;
  readonly timing: TurnTiming;
  readonly errors: readonly ReplayError[];
}

/**
 * Result of comparing two values.
 */
export interface ComparisonResult {
  readonly matches: boolean;
  readonly expected: unknown;
  readonly actual: unknown;
  readonly differences: readonly Difference[];
}

/**
 * A difference between expected and actual.
 */
export interface Difference {
  readonly path: string;
  readonly expectedValue: unknown;
  readonly actualValue: unknown;
  readonly description: string;
}

/**
 * Replay statistics.
 */
export interface ReplayStatistics {
  readonly turnsReplayed: number;
  readonly turnsSucceeded: number;
  readonly turnsFailed: number;
  readonly totalReplayDurationMs: number;
  readonly averageTurnDurationMs: number;
}

/**
 * A replay error.
 */
export interface ReplayError {
  readonly turnNumber: number;
  readonly stage: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// ============================================================================
// Recording Functions
// ============================================================================

/**
 * Start recording a new session.
 * 
 * @param metadata Session metadata
 * @param initialState Initial project state fingerprint
 * @returns A session recorder
 */
export function startRecording(
  metadata: SessionMetadata,
  initialState: ProjectStateFingerprint
): SessionRecorder {
  return new SessionRecorder(metadata, initialState);
}

/**
 * Session recorder class.
 */
export class SessionRecorder {
  private turns: RecordedTurn[] = [];
  private startTime: number;

  constructor(
    private metadata: SessionMetadata,
    private initialState: ProjectStateFingerprint
  ) {
    this.startTime = Date.now();
  }

  /**
   * Record a turn.
   */
  recordTurn(turn: RecordedTurn): void {
    this.turns.push(turn);
  }

  /**
   * Finalize and return the recorded session.
   */
  finalize(finalDiscourseState?: DiscourseState): RecordedSession {
    const endTime = Date.now();

    const statistics: SessionStatistics = {
      totalTurns: this.turns.length,
      utterances: this.turns.filter(t => !t.userAction).length,
      editsApplied: this.turns.filter(t => t.wasApplied).length,
      editsUndone: this.turns.filter(t => t.userAction?.type === 'undo').length,
      editsRedone: this.turns.filter(t => t.userAction?.type === 'redo').length,
      clarifications: 0, // Would need to track explicitly
      failures: this.turns.filter(t => !t.expectedEditPackage && !t.userAction).length,
      totalDurationMs: endTime - this.startTime,
    };

    return {
      metadata: this.metadata,
      initialState: this.initialState,
      turns: this.turns,
      finalDiscourseState,
      statistics,
    };
  }
}

/**
 * Serialize a recorded session to JSON.
 */
export function serializeRecordedSession(session: RecordedSession): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Deserialize a recorded session from JSON.
 */
export function deserializeRecordedSession(json: string): RecordedSession {
  return JSON.parse(json) as RecordedSession;
}

// ============================================================================
// Replay Functions
// ============================================================================

/**
 * Replay a recorded session.
 * 
 * This is the main entry point for replay. It processes each turn in sequence,
 * compares outputs, and returns a comprehensive result.
 * 
 * @param session The recorded session to replay
 * @param compiler The GOFAI compiler instance
 * @param projectState Initial project state
 * @param config Replay configuration
 * @returns Replay result
 */
export async function replaySession(
  session: RecordedSession,
  compiler: GOFAICompiler,
  projectState: ProjectState,
  config: ReplayConfig = DEFAULT_REPLAY_CONFIG
): Promise<ReplayResult> {
  const replayStartTime = Date.now();
  const turnResults: TurnReplayResult[] = [];
  const errors: ReplayError[] = [];

  // Verify initial state
  const initialStateMatch = compareProjectStateFingerprints(
    session.initialState,
    computeProjectStateFingerprint(projectState)
  );

  if (!initialStateMatch.matches) {
    errors.push({
      turnNumber: 0,
      stage: 'initial_state',
      message: 'Initial project state does not match recording',
      details: { differences: initialStateMatch.differences },
    });

    if (config.stopOnMismatch) {
      return createFailureResult(session, turnResults, errors, replayStartTime);
    }
  }

  // Replay each turn
  for (const turn of session.turns) {
    const turnResult = await replayTurn(
      turn,
      compiler,
      projectState,
      config
    );

    turnResults.push(turnResult);

    if (!turnResult.success) {
      errors.push(...turnResult.errors);

      if (config.stopOnMismatch) {
        break;
      }
    }
  }

  const replayEndTime = Date.now();
  const success = errors.length === 0 && turnResults.every(r => r.success);

  return {
    success,
    metadata: {
      sessionId: session.metadata.sessionId,
      replayedAt: replayStartTime,
      replayerVersion: '1.0.0',
      originalGofaiVersion: session.metadata.gofaiVersion,
      currentGofaiVersion: compiler.version,
    },
    turnResults,
    statistics: {
      turnsReplayed: turnResults.length,
      turnsSucceeded: turnResults.filter(r => r.success).length,
      turnsFailed: turnResults.filter(r => !r.success).length,
      totalReplayDurationMs: replayEndTime - replayStartTime,
      averageTurnDurationMs: (replayEndTime - replayStartTime) / turnResults.length,
    },
    errors,
  };
}

/**
 * Replay a single turn.
 */
async function replayTurn(
  turn: RecordedTurn,
  compiler: GOFAICompiler,
  projectState: ProjectState,
  config: ReplayConfig
): Promise<TurnReplayResult> {
  const turnStartTime = Date.now();
  const errors: ReplayError[] = [];

  // Handle user actions
  if (turn.userAction) {
    return replayUserAction(turn, projectState, config);
  }

  // Compile utterance
  let intentMatch: ComparisonResult | undefined;
  let planMatch: ComparisonResult | undefined;
  let diffMatch: ComparisonResult | undefined;
  let stateFingerprintMatch: ComparisonResult | undefined;

  try {
    const compilationResult = await compiler.compile(turn.utterance, projectState);

    // Check intent
    if (config.checkIntents && turn.expectedIntent) {
      intentMatch = compareIntents(turn.expectedIntent, compilationResult.intent);
      if (!intentMatch.matches) {
        errors.push({
          turnNumber: turn.turnNumber,
          stage: 'intent',
          message: 'CPL-Intent does not match expected',
          details: { differences: intentMatch.differences },
        });
      }
    }

    // Check plan
    if (config.checkPlans && turn.expectedPlan) {
      planMatch = comparePlans(turn.expectedPlan, compilationResult.plan);
      if (!planMatch.matches) {
        errors.push({
          turnNumber: turn.turnNumber,
          stage: 'plan',
          message: 'CPL-Plan does not match expected',
          details: { differences: planMatch.differences },
        });
      }
    }

    // Apply edit if it was applied in original session
    if (turn.wasApplied && compilationResult.editPackage) {
      await compiler.applyEdit(compilationResult.editPackage, projectState);

      // Check diff
      if (config.checkDiffs && turn.expectedEditPackage) {
        diffMatch = compareDiffs(
          turn.expectedEditPackage.diff,
          compilationResult.editPackage.diff
        );
        if (!diffMatch.matches) {
          errors.push({
            turnNumber: turn.turnNumber,
            stage: 'diff',
            message: 'Execution diff does not match expected',
            details: { differences: diffMatch.differences },
          });
        }
      }

      // Check state fingerprint
      if (config.checkStateFingerprints) {
        const actualFingerprint = computeProjectStateFingerprint(projectState);
        stateFingerprintMatch = compareProjectStateFingerprints(
          turn.stateAfterTurn,
          actualFingerprint
        );
        if (!stateFingerprintMatch.matches) {
          errors.push({
            turnNumber: turn.turnNumber,
            stage: 'state_fingerprint',
            message: 'Project state fingerprint does not match',
            details: { differences: stateFingerprintMatch.differences },
          });
        }
      }
    }
  } catch (error) {
    errors.push({
      turnNumber: turn.turnNumber,
      stage: 'compilation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const turnEndTime = Date.now();

  return {
    turnNumber: turn.turnNumber,
    success: errors.length === 0,
    intentMatch,
    planMatch,
    diffMatch,
    stateFingerprintMatch,
    timing: {
      totalMs: turnEndTime - turnStartTime,
    },
    errors,
  };
}

/**
 * Replay a user action turn.
 */
async function replayUserAction(
  turn: RecordedTurn,
  projectState: ProjectState,
  config: ReplayConfig
): Promise<TurnReplayResult> {
  const errors: ReplayError[] = [];

  // Implementation depends on action type
  // For now, just return success

  return {
    turnNumber: turn.turnNumber,
    success: true,
    timing: { totalMs: 0 },
    errors,
  };
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Compare two CPL-Intent objects.
 */
function compareIntents(expected: CPLIntent, actual: CPLIntent): ComparisonResult {
  const differences: Difference[] = [];

  // Compare goal counts
  if (expected.goals.length !== actual.goals.length) {
    differences.push({
      path: 'goals.length',
      expectedValue: expected.goals.length,
      actualValue: actual.goals.length,
      description: 'Number of goals differs',
    });
  }

  // Compare constraint counts
  if (expected.constraints.length !== actual.constraints.length) {
    differences.push({
      path: 'constraints.length',
      expectedValue: expected.constraints.length,
      actualValue: actual.constraints.length,
      description: 'Number of constraints differs',
    });
  }

  // Compare scope types
  if (expected.scope.type !== actual.scope.type) {
    differences.push({
      path: 'scope.type',
      expectedValue: expected.scope.type,
      actualValue: actual.scope.type,
      description: 'Scope type differs',
    });
  }

  // More detailed comparisons would go here

  return {
    matches: differences.length === 0,
    expected,
    actual,
    differences,
  };
}

/**
 * Compare two CPL-Plan objects.
 */
function comparePlans(expected: CPLPlan, actual: CPLPlan): ComparisonResult {
  const differences: Difference[] = [];

  // Compare opcode counts
  if (expected.opcodes.length !== actual.opcodes.length) {
    differences.push({
      path: 'opcodes.length',
      expectedValue: expected.opcodes.length,
      actualValue: actual.opcodes.length,
      description: 'Number of opcodes differs',
    });
  }

  // Compare cost scores
  if (Math.abs(expected.costScore - actual.costScore) > 0.01) {
    differences.push({
      path: 'costScore',
      expectedValue: expected.costScore,
      actualValue: actual.costScore,
      description: 'Cost score differs',
    });
  }

  return {
    matches: differences.length === 0,
    expected,
    actual,
    differences,
  };
}

/**
 * Compare two execution diffs.
 */
function compareDiffs(expected: any, actual: any): ComparisonResult {
  const differences: Difference[] = [];

  // Compare change counts
  if (expected.changes.length !== actual.changes.length) {
    differences.push({
      path: 'changes.length',
      expectedValue: expected.changes.length,
      actualValue: actual.changes.length,
      description: 'Number of changes differs',
    });
  }

  return {
    matches: differences.length === 0,
    expected,
    actual,
    differences,
  };
}

/**
 * Compare two project state fingerprints.
 */
function compareProjectStateFingerprints(
  expected: ProjectStateFingerprint,
  actual: ProjectStateFingerprint
): ComparisonResult {
  const differences: Difference[] = [];

  if (expected.trackCount !== actual.trackCount) {
    differences.push({
      path: 'trackCount',
      expectedValue: expected.trackCount,
      actualValue: actual.trackCount,
      description: 'Track count differs',
    });
  }

  if (expected.eventCount !== actual.eventCount) {
    differences.push({
      path: 'eventCount',
      expectedValue: expected.eventCount,
      actualValue: actual.eventCount,
      description: 'Event count differs',
    });
  }

  if (expected.structureHash !== actual.structureHash) {
    differences.push({
      path: 'structureHash',
      expectedValue: expected.structureHash,
      actualValue: actual.structureHash,
      description: 'Structure hash differs',
    });
  }

  return {
    matches: differences.length === 0,
    expected,
    actual,
    differences,
  };
}

/**
 * Compute project state fingerprint.
 */
function computeProjectStateFingerprint(projectState: ProjectState): ProjectStateFingerprint {
  // Implementation would compute actual fingerprint from project state
  return {
    trackCount: 0,
    eventCount: 0,
    cardCount: 0,
    sectionCount: 0,
    durationBars: 0,
    structureHash: '',
  };
}

/**
 * Create a failure result.
 */
function createFailureResult(
  session: RecordedSession,
  turnResults: TurnReplayResult[],
  errors: ReplayError[],
  startTime: number
): ReplayResult {
  const endTime = Date.now();

  return {
    success: false,
    metadata: {
      sessionId: session.metadata.sessionId,
      replayedAt: startTime,
      replayerVersion: '1.0.0',
      originalGofaiVersion: session.metadata.gofaiVersion,
      currentGofaiVersion: 'unknown',
    },
    turnResults,
    statistics: {
      turnsReplayed: turnResults.length,
      turnsSucceeded: turnResults.filter(r => r.success).length,
      turnsFailed: turnResults.filter(r => !r.success).length,
      totalReplayDurationMs: endTime - startTime,
      averageTurnDurationMs: turnResults.length > 0 ? (endTime - startTime) / turnResults.length : 0,
    },
    errors,
  };
}

// ============================================================================
// Type Placeholders (would be imported from actual modules)
// ============================================================================

/**
 * GOFAI compiler interface (placeholder).
 */
export interface GOFAICompiler {
  readonly version: string;
  compile(utterance: string, projectState: ProjectState): Promise<CompilationResult>;
  applyEdit(editPackage: EditPackage, projectState: ProjectState): Promise<void>;
}

/**
 * Project state interface (placeholder).
 */
export interface ProjectState {
  // Would be the actual CardPlay project state
}

/**
 * Compilation result (placeholder).
 */
export interface CompilationResult {
  readonly intent: CPLIntent;
  readonly plan: CPLPlan;
  readonly editPackage?: EditPackage;
}
