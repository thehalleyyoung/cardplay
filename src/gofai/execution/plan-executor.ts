/**
 * @file Plan Executor - Apply CPL plans to project state
 * @module gofai/execution/plan-executor
 * 
 * Implements Step 308: Plan opcode executors for core event transforms.
 * 
 * This module provides the execution layer that translates CPL-Plan opcodes
 * into concrete mutations of the project state. Each opcode type has a
 * dedicated executor that:
 * 
 * 1. Validates preconditions
 * 2. Applies transformations to events
 * 3. Records provenance and reasons
 * 4. Returns actionable results or errors
 * 
 * Core event transforms include:
 * - Quantize: adjust timing to grid
 * - Shift: move events in time/pitch
 * - Density: thin or densify event patterns
 * - Register: shift pitch ranges
 * - Velocity: adjust dynamics
 * - Duration: modify note lengths
 * - Timing: humanize or tighten microtiming
 * 
 * Design principles:
 * - Pure functions: executors don't mutate inputs
 * - Type-safe: strong typing for opcodes and parameters
 * - Composable: executors can be chained
 * - Testable: deterministic outputs for same inputs
 * - Traceable: full provenance of every change
 * 
 * @see gofai_goalB.md Step 308
 * @see event-edit-primitives.ts for low-level operations
 * @see selector-application.ts for event selection
 */

import type { CPLPlan, CPLOpcode, CPLScope } from '../canon/cpl-types';
import type { ProjectState } from './transactional-execution';
import type { ExecutionDiff, DiffChange } from './edit-package';
import { applySelector } from './selector-application';
import {
  quantizeEvents,
  shiftEvents,
  transposeEvents,
  scaleVelocity,
  thinEvents,
  densifyEvents,
  shiftRegister,
  humanizeRhythm
} from './event-edit-primitives';

// ============================================================================
// Opcode Execution Context
// ============================================================================

/**
 * Context provided to opcode executors.
 * Contains the project state and execution metadata.
 */
export interface ExecutionContext {
  /** Current project state (immutable) */
  readonly state: ProjectState;
  
  /** Plan being executed */
  readonly plan: CPLPlan;
  
  /** Execution timestamp */
  readonly timestamp: number;
  
  /** Accumulated changes so far */
  readonly changes: DiffChange[];
  
  /** Execution options */
  readonly options: ExecutionOptions;
}

/**
 * Options controlling execution behavior.
 */
export interface ExecutionOptions {
  /** Whether to validate constraints after each opcode */
  readonly validateIncremental: boolean;
  
  /** Whether to stop on first error */
  readonly failFast: boolean;
  
  /** Maximum events to process per opcode */
  readonly maxEventsPerOp: number;
  
  /** Whether to log detailed provenance */
  readonly detailedProvenance: boolean;
}

/**
 * Result of executing a single opcode.
 */
export interface OpcodeExecutionResult {
  /** Whether execution succeeded */
  readonly success: boolean;
  
  /** Modified state (if successful) */
  readonly state?: ProjectState;
  
  /** Changes made */
  readonly changes: DiffChange[];
  
  /** Error details (if failed) */
  readonly error?: ExecutionError;
  
  /** Execution metadata */
  readonly metadata: ExecutionMetadata;
}

/**
 * Error that occurred during execution.
 */
export interface ExecutionError {
  readonly code: string;
  readonly message: string;
  readonly opcodeId: string;
  readonly recoverable: boolean;
  readonly suggestions?: readonly string[];
}

/**
 * Metadata about execution.
 */
export interface ExecutionMetadata {
  readonly opcodeId: string;
  readonly eventsAffected: number;
  readonly executionTimeMs: number;
  readonly provenance: readonly ProvenanceRecord[];
}

/**
 * A provenance record linking a change to its cause.
 */
export interface ProvenanceRecord {
  readonly changeId: string;
  readonly opcodeId: string;
  readonly goalId?: string;
  readonly reason: string;
}

// ============================================================================
// Core Opcode Executors
// ============================================================================

/**
 * Execute a quantize opcode.
 * Snaps event timing to the nearest grid position.
 */
function executeQuantize(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    // Extract parameters
    const strength = (opcode.parameters.strength as number) ?? 1.0;
    const gridSize = (opcode.parameters.gridSize as number) ?? 960; // 16th notes at 960 PPQ
    
    // Apply selector to get matching events
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any, // CPLScope matches EventSelector conceptually
      {}
    );
    
    if (selectorResult.matchedEvents.length === 0) {
      return {
        success: true,
        state: context.state,
        changes: [],
        metadata: {
          opcodeId: opcode.id,
          eventsAffected: 0,
          executionTimeMs: Date.now() - startTime,
          provenance: []
        }
      };
    }
    
    // Use the batch quantize function
    const quantizeResult = quantizeEvents(
      selectorResult.matchedEvents,
      strength,
      gridSize
    );
    
    if (!quantizeResult.success || !quantizeResult.events) {
      throw new Error(quantizeResult.error?.message ?? 'Quantize failed');
    }
    
    // Record the changes
    quantizeResult.events.forEach((quantized, index) => {
      const original = selectorResult.matchedEvents[index];
      if (quantized.startTick !== original.startTick) {
        changes.push({
          type: 'modified',
          entityType: 'event',
          entityId: quantized.id,
          path: 'startTick',
          oldValue: original.startTick,
          newValue: quantized.startTick,
          causedByOpcodeId: opcode.id
        });
      }
    });
    
    // Create new state with modified events
    const modifiedEventsById = new Map(quantizeResult.events.map(e => [e.id, e]));
    const newState = {
      ...context.state,
      events: context.state.events.map(e =>
        modifiedEventsById.get(e.id) ?? e
      )
    };
    
    // Build provenance
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: `${change.entityId}.${change.path}`,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: quantizeResult.events.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'QUANTIZE_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true,
        suggestions: [
          'Check that grid size is positive',
          'Verify strength is between 0 and 1',
          'Ensure events exist in the selected scope'
        ]
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

/**
 * Execute a timing shift opcode.
 * Moves events forward or backward in time.
 */
function executeShiftTiming(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    const offsetTicks = (opcode.parameters.offsetTicks as number) ?? 0;
    
    if (offsetTicks === 0) {
      return {
        success: true,
        state: context.state,
        changes: [],
        metadata: {
          opcodeId: opcode.id,
          eventsAffected: 0,
          executionTimeMs: Date.now() - startTime,
          provenance: []
        }
      };
    }
    
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any,
      {}
    );
    
    const shiftResult = shiftEvents(
      selectorResult.matchedEvents,
      offsetTicks
    );
    
    if (!shiftResult.success || !shiftResult.events) {
      throw new Error(shiftResult.error?.message ?? 'Shift failed');
    }
    
    shiftResult.events.forEach((shifted, index) => {
      const original = selectorResult.matchedEvents[index];
      changes.push({
        type: 'modified',
        entityType: 'event',
        entityId: shifted.id,
        path: 'startTick',
        oldValue: original.startTick,
        newValue: shifted.startTick,
        causedByOpcodeId: opcode.id
      });
    });
    
    const modifiedEventsById = new Map(shiftResult.events.map(e => [e.id, e]));
    const newState = {
      ...context.state,
      events: context.state.events.map(e =>
        modifiedEventsById.get(e.id) ?? e
      )
    };
    
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: `${change.entityId}.${change.path}`,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: shiftResult.events.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'SHIFT_TIMING_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

/**
 * Execute a pitch shift opcode.
 * Transposes events up or down in pitch.
 */
function executeShiftPitch(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    const semitones = (opcode.parameters.semitones as number) ?? 0;
    
    if (semitones === 0) {
      return {
        success: true,
        state: context.state,
        changes: [],
        metadata: {
          opcodeId: opcode.id,
          eventsAffected: 0,
          executionTimeMs: Date.now() - startTime,
          provenance: []
        }
      };
    }
    
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any,
      {}
    );
    
    const transposeResult = transposeEvents(
      selectorResult.matchedEvents,
      semitones
    );
    
    if (!transposeResult.success || !transposeResult.events) {
      throw new Error(transposeResult.error?.message ?? 'Transpose failed');
    }
    
    transposeResult.events.forEach((transposed, index) => {
      const original = selectorResult.matchedEvents[index];
      changes.push({
        type: 'modified',
        entityType: 'event',
        entityId: transposed.id,
        path: 'pitch',
        oldValue: (original as any).pitch,
        newValue: (transposed as any).pitch,
        causedByOpcodeId: opcode.id
      });
    });
    
    const modifiedEventsById = new Map(transposeResult.events.map(e => [e.id, e]));
    const newState = {
      ...context.state,
      events: context.state.events.map(e =>
        modifiedEventsById.get(e.id) ?? e
      )
    };
    
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: `${change.entityId}.${change.path}`,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: transposeResult.events.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'SHIFT_PITCH_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

/**
 * Execute a velocity scaling opcode.
 * Adjusts the dynamics of events.
 */
function executeScaleVelocity(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    const scaleFactor = (opcode.parameters.scaleFactor as number) ?? 1.0;
    const minVelocity = (opcode.parameters.minVelocity as number) ?? 1;
    const maxVelocity = (opcode.parameters.maxVelocity as number) ?? 127;
    
    if (scaleFactor === 1.0) {
      return {
        success: true,
        state: context.state,
        changes: [],
        metadata: {
          opcodeId: opcode.id,
          eventsAffected: 0,
          executionTimeMs: Date.now() - startTime,
          provenance: []
        }
      };
    }
    
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any,
      {}
    );
    
    const scaleResult = scaleVelocity(
      selectorResult.matchedEvents,
      scaleFactor,
      minVelocity,
      maxVelocity
    );
    
    if (!scaleResult.success || !scaleResult.events) {
      throw new Error(scaleResult.error?.message ?? 'Scale velocity failed');
    }
    
    scaleResult.events.forEach((scaled, index) => {
      const original = selectorResult.matchedEvents[index];
      const oldVel = (original as any).velocity;
      const newVel = (scaled as any).velocity;
      
      if (oldVel !== newVel) {
        changes.push({
          type: 'modified',
          entityType: 'event',
          entityId: scaled.id,
          path: 'velocity',
          oldValue: oldVel,
          newValue: newVel,
          causedByOpcodeId: opcode.id
        });
      }
    });
    
    const modifiedEventsById = new Map(scaleResult.events.map(e => [e.id, e]));
    const newState = {
      ...context.state,
      events: context.state.events.map(e =>
        modifiedEventsById.get(e.id) ?? e
      )
    };
    
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: `${change.entityId}.${change.path}`,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: scaleResult.events.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'SCALE_VELOCITY_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

/**
 * Execute a thin density opcode.
 * Removes events to reduce texture density.
 */
function executeThinDensity(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    const targetRatio = (opcode.parameters.targetRatio as number) ?? 0.7;
    
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any,
      {}
    );
    
    const thinResult = thinEvents(
      selectorResult.matchedEvents,
      targetRatio
    );
    
    if (!thinResult.success || !thinResult.events) {
      throw new Error(thinResult.error?.message ?? 'Thin density failed');
    }
    
    // Record removals
    const keptIds = new Set(thinResult.events.map(e => e.id));
    selectorResult.matchedEvents.forEach(event => {
      if (!keptIds.has(event.id)) {
        changes.push({
          type: 'removed',
          entityType: 'event',
          entityId: event.id,
          oldValue: event,
          newValue: null,
          causedByOpcodeId: opcode.id
        });
      }
    });
    
    // Create new state without removed events
    const newState = {
      ...context.state,
      events: context.state.events.filter(e => keptIds.has(e.id))
    };
    
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: change.entityId,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: changes.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'THIN_DENSITY_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

/**
 * Execute a densify opcode.
 * Adds events to increase texture density.
 */
function executeDensify(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    const targetRatio = (opcode.parameters.targetRatio as number) ?? 1.5;
    
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any,
      {}
    );
    
    const densifyResult = densifyEvents(
      selectorResult.matchedEvents,
      targetRatio
    );
    
    if (!densifyResult.success || !densifyResult.events) {
      throw new Error(densifyResult.error?.message ?? 'Densify failed');
    }
    
    // Record additions - new events are ones not in original
    const originalIds = new Set(selectorResult.matchedEvents.map(e => e.id));
    densifyResult.events.forEach(event => {
      if (!originalIds.has(event.id)) {
        changes.push({
          type: 'added',
          entityType: 'event',
          entityId: event.id,
          oldValue: null,
          newValue: event,
          causedByOpcodeId: opcode.id
        });
      }
    });
    
    // Create new state with added events
    const newState = {
      ...context.state,
      events: [...context.state.events, ...densifyResult.events.filter(e => !originalIds.has(e.id))]
    };
    
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: change.entityId,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: changes.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'DENSIFY_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

/**
 * Execute a register shift opcode.
 * Moves events to a different pitch register.
 */
function executeShiftRegister(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    const octaves = (opcode.parameters.octaves as number) ?? 1;
    
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any,
      {}
    );
    
    const registerResult = shiftRegister(
      selectorResult.matchedEvents,
      octaves
    );
    
    if (!registerResult.success || !registerResult.events) {
      throw new Error(registerResult.error?.message ?? 'Register shift failed');
    }
    
    // Record pitch changes
    registerResult.events.forEach((modified, index) => {
      const original = selectorResult.matchedEvents[index];
      const oldPitch = (original as any).pitch;
      const newPitch = (modified as any).pitch;
      
      if (oldPitch !== newPitch) {
        changes.push({
          type: 'modified',
          entityType: 'event',
          entityId: modified.id,
          path: 'pitch',
          oldValue: oldPitch,
          newValue: newPitch,
          causedByOpcodeId: opcode.id
        });
      }
    });
    
    const modifiedEventsById = new Map(registerResult.events.map(e => [e.id, e]));
    const newState = {
      ...context.state,
      events: context.state.events.map(e =>
        modifiedEventsById.get(e.id) ?? e
      )
    };
    
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: `${change.entityId}.${change.path}`,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: registerResult.events.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'SHIFT_REGISTER_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

/**
 * Execute a humanize timing opcode.
 * Adds natural variation to event timing.
 */
function executeHumanizeTiming(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const startTime = Date.now();
  const changes: DiffChange[] = [];
  
  try {
    const amount = (opcode.parameters.amount as number) ?? 0.5;
    const maxOffset = (opcode.parameters.maxOffset as number) ?? 48;
    
    const selectorResult = applySelector(
      context.state.events,
      opcode.scope as any,
      {}
    );
    
    const humanizeResult = humanizeRhythm(
      selectorResult.matchedEvents,
      amount,
      maxOffset
    );
    
    if (!humanizeResult.success || !humanizeResult.events) {
      throw new Error(humanizeResult.error?.message ?? 'Humanize failed');
    }
    
    humanizeResult.events.forEach((humanized, index) => {
      const original = selectorResult.matchedEvents[index];
      if (humanized.startTick !== original.startTick) {
        changes.push({
          type: 'modified',
          entityType: 'event',
          entityId: humanized.id,
          path: 'startTick',
          oldValue: original.startTick,
          newValue: humanized.startTick,
          causedByOpcodeId: opcode.id
        });
      }
    });
    
    const modifiedEventsById = new Map(humanizeResult.events.map(e => [e.id, e]));
    const newState = {
      ...context.state,
      events: context.state.events.map(e =>
        modifiedEventsById.get(e.id) ?? e
      )
    };
    
    const provenance: ProvenanceRecord[] = changes.map(change => ({
      changeId: `${change.entityId}.${change.path}`,
      opcodeId: opcode.id,
      goalId: opcode.servesGoals?.[0],
      reason: opcode.explanation
    }));
    
    return {
      success: true,
      state: newState,
      changes,
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: humanizeResult.events.length,
        executionTimeMs: Date.now() - startTime,
        provenance
      }
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'HUMANIZE_TIMING_FAILED',
        message: error instanceof Error ? error.message : String(error),
        opcodeId: opcode.id,
        recoverable: true
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: Date.now() - startTime,
        provenance: []
      }
    };
  }
}

// ============================================================================
// Opcode Registry and Dispatcher
// ============================================================================

/**
 * Registry mapping opcode types to their executors.
 */
const OPCODE_EXECUTORS: Record<string, (opcode: CPLOpcode, context: ExecutionContext) => OpcodeExecutionResult> = {
  'quantize': executeQuantize,
  'shift_timing': executeShiftTiming,
  'shift_pitch': executeShiftPitch,
  'scale_velocity': executeScaleVelocity,
  'thin_density': executeThinDensity,
  'densify': executeDensify,
  'shift_register': executeShiftRegister,
  'humanize_timing': executeHumanizeTiming,
};

/**
 * Execute a single opcode.
 */
function executeOpcode(
  opcode: CPLOpcode,
  context: ExecutionContext
): OpcodeExecutionResult {
  const executor = OPCODE_EXECUTORS[opcode.type];
  
  if (!executor) {
    return {
      success: false,
      changes: [],
      error: {
        code: 'UNKNOWN_OPCODE',
        message: `No executor registered for opcode type: ${opcode.type}`,
        opcodeId: opcode.id,
        recoverable: false,
        suggestions: [
          `Available opcode types: ${Object.keys(OPCODE_EXECUTORS).join(', ')}`,
          'Check if extension providing this opcode is loaded',
          'Verify opcode type spelling and namespacing'
        ]
      },
      metadata: {
        opcodeId: opcode.id,
        eventsAffected: 0,
        executionTimeMs: 0,
        provenance: []
      }
    };
  }
  
  return executor(opcode, context);
}

// ============================================================================
// Plan Execution
// ============================================================================

/**
 * Default execution options.
 */
const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  validateIncremental: false,
  failFast: true,
  maxEventsPerOp: 10000,
  detailedProvenance: true
};

/**
 * Execute a complete plan.
 * Applies all opcodes in sequence and returns the final result.
 */
export function executePlan(
  plan: CPLPlan,
  state: ProjectState,
  options: Partial<ExecutionOptions> = {}
): OpcodeExecutionResult {
  const opts = { ...DEFAULT_EXECUTION_OPTIONS, ...options };
  const startTime = Date.now();
  
  let currentState = state;
  const allChanges: DiffChange[] = [];
  const allProvenance: ProvenanceRecord[] = [];
  let totalEventsAffected = 0;
  
  // Execute each opcode in sequence
  for (const opcode of plan.opcodes) {
    const context: ExecutionContext = {
      state: currentState,
      plan,
      timestamp: Date.now(),
      changes: allChanges,
      options: opts
    };
    
    const result = executeOpcode(opcode, context);
    
    if (!result.success) {
      if (opts.failFast) {
        return result;
      }
      // Continue with warning if not failing fast
      console.warn(`Opcode ${opcode.id} failed:`, result.error);
      continue;
    }
    
    // Accumulate results
    if (result.state) {
      currentState = result.state;
    }
    allChanges.push(...result.changes);
    allProvenance.push(...result.metadata.provenance);
    totalEventsAffected += result.metadata.eventsAffected;
  }
  
  return {
    success: true,
    state: currentState,
    changes: allChanges,
    metadata: {
      opcodeId: 'plan',
      eventsAffected: totalEventsAffected,
      executionTimeMs: Date.now() - startTime,
      provenance: allProvenance
    }
  };
}

/**
 * Apply a plan to a forked copy of the project state.
 * Returns the modified state without mutating the original.
 */
export function applyPlanToFork(
  plan: CPLPlan,
  state: ProjectState,
  options?: Partial<ExecutionOptions>
): ProjectState {
  const result = executePlan(plan, state, options);
  
  if (!result.success || !result.state) {
    throw new Error(
      result.error?.message ?? 'Plan execution failed without error details'
    );
  }
  
  return result.state;
}

/**
 * Compute the diff between two project states.
 * Returns an execution diff describing the changes.
 */
export function computeDiff(
  before: ProjectState,
  after: ProjectState
): ExecutionDiff {
  const changes: DiffChange[] = [];
  
  // Compare events
  const beforeEventsById = new Map(before.events.map(e => [e.id, e]));
  const afterEventsById = new Map(after.events.map(e => [e.id, e]));
  
  // Detect removed events
  for (const [id, event] of beforeEventsById) {
    if (!afterEventsById.has(id)) {
      changes.push({
        type: 'removed',
        entityType: 'event',
        entityId: id,
        oldValue: event,
        newValue: null,
        causedByOpcodeId: 'unknown'
      });
    }
  }
  
  // Detect added events
  for (const [id, event] of afterEventsById) {
    if (!beforeEventsById.has(id)) {
      changes.push({
        type: 'added',
        entityType: 'event',
        entityId: id,
        oldValue: null,
        newValue: event,
        causedByOpcodeId: 'unknown'
      });
    }
  }
  
  // Detect modified events
  for (const [id, afterEvent] of afterEventsById) {
    const beforeEvent = beforeEventsById.get(id);
    if (beforeEvent) {
      // Check timing
      if (beforeEvent.startTick !== afterEvent.startTick) {
        changes.push({
          type: 'modified',
          entityType: 'event',
          entityId: id,
          path: 'startTick',
          oldValue: beforeEvent.startTick,
          newValue: afterEvent.startTick,
          causedByOpcodeId: 'unknown'
        });
      }
      
      if (beforeEvent.durationTicks !== afterEvent.durationTicks) {
        changes.push({
          type: 'modified',
          entityType: 'event',
          entityId: id,
          path: 'durationTicks',
          oldValue: beforeEvent.durationTicks,
          newValue: afterEvent.durationTicks,
          causedByOpcodeId: 'unknown'
        });
      }
    }
  }
  
  // Build summary
  const addedCount = changes.filter(c => c.type === 'added').length;
  const removedCount = changes.filter(c => c.type === 'removed').length;
  const modifiedCount = changes.filter(c => c.type === 'modified').length;
  
  const summary = [
    addedCount > 0 ? `${addedCount} events added` : '',
    removedCount > 0 ? `${removedCount} events removed` : '',
    modifiedCount > 0 ? `${modifiedCount} events modified` : ''
  ].filter(Boolean).join(', ') || 'No changes';
  
  return {
    version: '1.0',
    before: {
      events: before.events.map(e => ({
        id: e.id,
        kind: e.kind,
        startTick: e.startTick,
        durationTicks: e.durationTicks,
        payload: (e as any).payload,
        trackId: (e as any).trackId ?? 'unknown'
      })),
      tracks: [],
      cards: [],
      sections: [],
      routing: []
    },
    after: {
      events: after.events.map(e => ({
        id: e.id,
        kind: e.kind,
        startTick: e.startTick,
        durationTicks: e.durationTicks,
        payload: (e as any).payload,
        trackId: (e as any).trackId ?? 'unknown'
      })),
      tracks: [],
      cards: [],
      sections: [],
      routing: []
    },
    changes,
    verifications: [],
    summary,
    timestamp: Date.now()
  };
}
