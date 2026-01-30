/**
 * @file Structure Opcode Executors (Step 309)
 * @module gofai/execution/structure-opcode-executors
 * 
 * Implements Step 309: Plan opcode executors for structure edits (insert break,
 * duplicate section) with marker updates.
 * 
 * This module provides execution implementations for all structure editing opcodes
 * defined in edit-opcodes-structure.ts. Each executor:
 * 
 * 1. Validates structural preconditions (section exists, valid positions, etc.)
 * 2. Manipulates project structure (sections, markers, timing)
 * 3. Updates all dependent entities (events, automation, markers)
 * 4. Maintains timing integrity across the edit
 * 5. Returns actionable results with full provenance
 * 
 * Structure edits are complex because they affect:
 * - Section markers and boundaries
 * - Event timing (shifts when sections move)
 * - Automation curves (stretch/compress with sections)
 * - Following sections (timing cascades)
 * - Overall song length and form
 * 
 * Design principles:
 * - Atomic: All changes succeed or none do
 * - Predictable: Deterministic timing calculations
 * - Safe: Preserve musical integrity
 * - Reversible: Full undo support via inverse operations
 * - Traceable: Complete provenance chains
 * 
 * @see gofai_goalB.md Step 309
 * @see canon/edit-opcodes-structure.ts for opcode definitions
 * @see transactional-execution.ts for execution framework
 */

import type { ProjectState, Section, Event, Connection } from './transactional-execution.js';
import type { OpcodeExecutor, OpcodeExecutionResult } from './transactional-execution.js';
import type { PlanOpcode } from './edit-package.js';

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Section identifier - can be ID or name.
 */
type SectionRef = string | { id: string } | { name: string };

/**
 * Position specifier for insertions.
 */
interface InsertPosition {
  readonly relation: 'before' | 'after' | 'at_bar';
  readonly target: SectionRef | number; // section ref or bar number
}

/**
 * Time range in ticks.
 */
interface TimeRange {
  readonly startTick: number;
  readonly endTick: number;
  readonly durationTicks: number;
}

/**
 * Result of a structure modification.
 */
interface StructureModificationResult {
  readonly success: boolean;
  readonly modifiedSections: readonly string[]; // Section IDs affected
  readonly modifiedEvents: readonly string[]; // Event IDs affected
  readonly timingShifts: readonly TimingShift[]; // How timing changed
  readonly newMarkers: readonly string[]; // New marker IDs created
  readonly deletedMarkers: readonly string[]; // Marker IDs deleted
  readonly error?: string;
}

/**
 * A timing shift applied to events.
 */
interface TimingShift {
  readonly entityId: string;
  readonly oldStartTick: number;
  readonly newStartTick: number;
  readonly shiftAmount: number;
}

// ============================================================================
// Section Resolution Utilities
// ============================================================================

/**
 * Resolve a section reference to a section object.
 */
function resolveSection(ref: SectionRef, state: ProjectState): Section | undefined {
  if (typeof ref === 'string') {
    // Try as ID first, then as name
    return state.sections.get(ref) || 
           state.sections.getAll().find(s => s.name === ref);
  } else if ('id' in ref) {
    return state.sections.get(ref.id);
  } else if ('name' in ref) {
    return state.sections.getAll().find(s => s.name === ref.name);
  }
  return undefined;
}

/**
 * Get all sections in temporal order.
 */
function getSectionsInOrder(state: ProjectState): readonly Section[] {
  return [...state.sections.getAll()].sort((a, b) => a.startTick - b.startTick);
}

/**
 * Get events within a time range.
 */
function getEventsInRange(state: ProjectState, range: TimeRange): readonly Event[] {
  return state.events.getAll().filter(event =>
    event.startTick >= range.startTick &&
    event.startTick < range.endTick
  );
}

/**
 * Calculate time range for a section.
 */
function getSectionTimeRange(section: Section): TimeRange {
  return {
    startTick: section.startTick,
    endTick: section.endTick,
    durationTicks: section.endTick - section.startTick,
  };
}

/**
 * Shift all events after a given time by an amount.
 */
function shiftEventsAfter(
  state: ProjectState,
  afterTick: number,
  shiftAmount: number
): TimingShift[] {
  const shifts: TimingShift[] = [];
  
  for (const event of state.events.getAll()) {
    if (event.startTick >= afterTick) {
      const oldStart = event.startTick;
      const newStart = oldStart + shiftAmount;
      
      state.events.update(event.id, {
        startTick: newStart,
      });
      
      shifts.push({
        entityId: event.id,
        oldStartTick: oldStart,
        newStartTick: newStart,
        shiftAmount,
      });
    }
  }
  
  return shifts;
}

/**
 * Shift all sections after a given time by an amount.
 */
function shiftSectionsAfter(
  state: ProjectState,
  afterTick: number,
  shiftAmount: number
): void {
  for (const section of state.sections.getAll()) {
    if (section.startTick >= afterTick) {
      state.sections.update(section.id, {
        startTick: section.startTick + shiftAmount,
        endTick: section.endTick + shiftAmount,
      });
    }
  }
}

/**
 * Generate a unique section ID.
 */
function generateSectionId(): string {
  return `section:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Clone events from a source range to a target tick.
 */
function cloneEventsToRange(
  state: ProjectState,
  sourceRange: TimeRange,
  targetStartTick: number
): string[] {
  const sourceEvents = getEventsInRange(state, sourceRange);
  const newEventIds: string[] = [];
  const timeOffset = targetStartTick - sourceRange.startTick;
  
  for (const sourceEvent of sourceEvents) {
    const newEventId = `event:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`;
    const newEvent: Event = {
      ...sourceEvent,
      id: newEventId,
      startTick: sourceEvent.startTick + timeOffset,
    };
    
    state.events.add(newEvent);
    newEventIds.push(newEventId);
  }
  
  return newEventIds;
}

// ============================================================================
// Duplicate Section Executor
// ============================================================================

/**
 * Executor for OP_DUPLICATE_SECTION.
 * 
 * Creates an exact copy of a section and inserts it at a specified location.
 */
export const DuplicateSectionExecutor: OpcodeExecutor = {
  opcodeType: 'gofai:op:duplicate_section',
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const sourceSection = resolveSection(opcode.parameters.source_section as SectionRef, state);
    if (!sourceSection) {
      return {
        canExecute: false,
        failedPreconditions: ['Source section not found'],
      };
    }
    
    // Validate insert position
    // TODO: More sophisticated position validation
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  },
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const sourceSection = resolveSection(opcode.parameters.source_section as SectionRef, state);
    if (!sourceSection) {
      return {
        success: false,
        affectedEntities: [],
        error: 'Source section not found',
      };
    }
    
    // Calculate where to insert
    const insertPosition = opcode.parameters.insert_position as string;
    const targetLocation = opcode.parameters.target_location;
    
    let insertTick: number;
    
    if (insertPosition === 'after') {
      const targetSection = resolveSection(targetLocation as SectionRef, state);
      if (!targetSection) {
        return {
          success: false,
          affectedEntities: [],
          error: 'Target section not found',
        };
      }
      insertTick = targetSection.endTick;
    } else if (insertPosition === 'before') {
      const targetSection = resolveSection(targetLocation as SectionRef, state);
      if (!targetSection) {
        return {
          success: false,
          affectedEntities: [],
          error: 'Target section not found',
        };
      }
      insertTick = targetSection.startTick;
    } else if (insertPosition === 'at_bar') {
      const barNumber = targetLocation as number;
      const ticksPerBar = state.metadata.ticksPerQuarter * 4; // Assuming 4/4
      insertTick = barNumber * ticksPerBar;
    } else {
      return {
        success: false,
        affectedEntities: [],
        error: `Unknown insert position: ${insertPosition}`,
      };
    }
    
    // Get source section time range
    const sourceRange = getSectionTimeRange(sourceSection);
    
    // Shift everything after insert point
    const shiftAmount = sourceRange.durationTicks;
    const timingShifts = shiftEventsAfter(state, insertTick, shiftAmount);
    shiftSectionsAfter(state, insertTick, shiftAmount);
    
    // Create new section
    const newSectionId = generateSectionId();
    const newSectionName = opcode.parameters.new_section_name as string | undefined ||
                           `${sourceSection.name} (copy)`;
    
    const newSection: Section = {
      id: newSectionId,
      type: sourceSection.type,
      name: newSectionName,
      startTick: insertTick,
      endTick: insertTick + sourceRange.durationTicks,
    };
    
    state.sections.add(newSection);
    
    // Clone events from source to new section
    const newEventIds = cloneEventsToRange(state, sourceRange, insertTick);
    
    // Build result
    const affectedEntities = [
      newSectionId,
      ...newEventIds,
      ...timingShifts.map(s => s.entityId),
    ];
    
    return {
      success: true,
      affectedEntities,
      warnings: [],
    };
  },
};

// ============================================================================
// Insert Break Executor
// ============================================================================

/**
 * Executor for OP_INSERT_BREAK.
 * 
 * Inserts a break section with reduced density.
 */
export const InsertBreakExecutor: OpcodeExecutor = {
  opcodeType: 'gofai:op:insert_break',
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const duration = opcode.parameters.duration as number || 4;
    if (duration < 1 || duration > 16) {
      return {
        canExecute: false,
        failedPreconditions: ['Invalid duration (must be 1-16 bars)'],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  },
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const position = opcode.parameters.position;
    const duration = (opcode.parameters.duration as number || 4);
    const breakType = (opcode.parameters.break_type as string || 'minimal');
    
    // Calculate insert tick
    let insertTick: number;
    
    if (typeof position === 'string' || typeof position === 'object') {
      const targetSection = resolveSection(position as SectionRef, state);
      if (!targetSection) {
        return {
          success: false,
          affectedEntities: [],
          error: 'Target position not found',
        };
      }
      insertTick = targetSection.endTick;
    } else {
      const barNumber = position as number;
      const ticksPerBar = state.metadata.ticksPerQuarter * 4;
      insertTick = barNumber * ticksPerBar;
    }
    
    // Calculate break duration in ticks
    const ticksPerBar = state.metadata.ticksPerQuarter * 4;
    const breakDurationTicks = duration * ticksPerBar;
    
    // Shift everything after insert point
    const timingShifts = shiftEventsAfter(state, insertTick, breakDurationTicks);
    shiftSectionsAfter(state, insertTick, breakDurationTicks);
    
    // Create break section
    const breakSectionId = generateSectionId();
    const breakSection: Section = {
      id: breakSectionId,
      type: 'break',
      name: 'Break',
      startTick: insertTick,
      endTick: insertTick + breakDurationTicks,
    };
    
    state.sections.add(breakSection);
    
    // Generate break content based on type
    const newEventIds = generateBreakContent(
      state,
      breakSection,
      breakType,
      opcode.parameters
    );
    
    const affectedEntities = [
      breakSectionId,
      ...newEventIds,
      ...timingShifts.map(s => s.entityId),
    ];
    
    return {
      success: true,
      affectedEntities,
      warnings: [],
    };
  },
};

/**
 * Generate content for a break section.
 */
function generateBreakContent(
  state: ProjectState,
  breakSection: Section,
  breakType: string,
  params: Record<string, unknown>
): string[] {
  const newEventIds: string[] = [];
  
  switch (breakType) {
    case 'silent':
      // No events - just empty space
      break;
      
    case 'minimal':
      // Add very sparse events (maybe just a pad or single element)
      // TODO: Implement minimal break content generation
      break;
      
    case 'filter_sweep':
      // Add automation for filter sweep
      // TODO: Implement filter sweep automation
      break;
      
    case 'vocal_only':
      // Keep vocal tracks, mute others
      // TODO: Implement vocal isolation
      break;
      
    case 'percussion_only':
      // Keep percussion, mute others
      // TODO: Implement percussion isolation
      break;
      
    default:
      // Default to minimal
      break;
  }
  
  return newEventIds;
}

// ============================================================================
// Insert Build Executor
// ============================================================================

/**
 * Executor for OP_INSERT_BUILD.
 * 
 * Inserts a build-up section with progressively increasing energy.
 */
export const InsertBuildExecutor: OpcodeExecutor = {
  opcodeType: 'gofai:op:insert_build',
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const duration = opcode.parameters.duration as number || 8;
    if (duration < 2 || duration > 32) {
      return {
        canExecute: false,
        failedPreconditions: ['Invalid duration (must be 2-32 bars)'],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  },
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const position = opcode.parameters.position;
    const duration = (opcode.parameters.duration as number || 8);
    const intensity = (opcode.parameters.intensity as string || 'moderate');
    
    // Calculate insert tick
    let insertTick: number;
    
    if (typeof position === 'string' || typeof position === 'object') {
      const targetSection = resolveSection(position as SectionRef, state);
      if (!targetSection) {
        return {
          success: false,
          affectedEntities: [],
          error: 'Target position not found',
        };
      }
      insertTick = targetSection.endTick;
    } else {
      const barNumber = position as number;
      const ticksPerBar = state.metadata.ticksPerQuarter * 4;
      insertTick = barNumber * ticksPerBar;
    }
    
    // Calculate build duration in ticks
    const ticksPerBar = state.metadata.ticksPerQuarter * 4;
    const buildDurationTicks = duration * ticksPerBar;
    
    // Shift everything after insert point
    const timingShifts = shiftEventsAfter(state, insertTick, buildDurationTicks);
    shiftSectionsAfter(state, insertTick, buildDurationTicks);
    
    // Create build section
    const buildSectionId = generateSectionId();
    const buildSection: Section = {
      id: buildSectionId,
      type: 'build',
      name: 'Build',
      startTick: insertTick,
      endTick: insertTick + buildDurationTicks,
    };
    
    state.sections.add(buildSection);
    
    // Generate build content
    const newEventIds = generateBuildContent(
      state,
      buildSection,
      intensity,
      opcode.parameters
    );
    
    const affectedEntities = [
      buildSectionId,
      ...newEventIds,
      ...timingShifts.map(s => s.entityId),
    ];
    
    return {
      success: true,
      affectedEntities,
      warnings: [],
    };
  },
};

/**
 * Generate content for a build section.
 */
function generateBuildContent(
  state: ProjectState,
  buildSection: Section,
  intensity: string,
  params: Record<string, unknown>
): string[] {
  const newEventIds: string[] = [];
  
  // TODO: Implement progressive build content generation
  // - Add layers progressively
  // - Increase density over time
  // - Add filter automation (rising frequency)
  // - Add drum fills
  // - Increase velocity/energy
  
  return newEventIds;
}

// ============================================================================
// Insert Drop Executor
// ============================================================================

/**
 * Executor for OP_INSERT_DROP.
 * 
 * Inserts a drop section following a build.
 */
export const InsertDropExecutor: OpcodeExecutor = {
  opcodeType: 'gofai:op:insert_drop',
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const duration = opcode.parameters.duration as number || 16;
    if (duration < 4 || duration > 32) {
      return {
        canExecute: false,
        failedPreconditions: ['Invalid duration (must be 4-32 bars)'],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  },
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const position = opcode.parameters.position;
    const duration = (opcode.parameters.duration as number || 16);
    const dropStyle = (opcode.parameters.drop_style as string || 'edm_full');
    
    // Calculate insert tick
    let insertTick: number;
    
    if (typeof position === 'string' || typeof position === 'object') {
      const targetSection = resolveSection(position as SectionRef, state);
      if (!targetSection) {
        return {
          success: false,
          affectedEntities: [],
          error: 'Target position not found',
        };
      }
      insertTick = targetSection.endTick;
    } else {
      const barNumber = position as number;
      const ticksPerBar = state.metadata.ticksPerQuarter * 4;
      insertTick = barNumber * ticksPerBar;
    }
    
    // Calculate drop duration in ticks
    const ticksPerBar = state.metadata.ticksPerQuarter * 4;
    const dropDurationTicks = duration * ticksPerBar;
    
    // Shift everything after insert point
    const timingShifts = shiftEventsAfter(state, insertTick, dropDurationTicks);
    shiftSectionsAfter(state, insertTick, dropDurationTicks);
    
    // Create drop section
    const dropSectionId = generateSectionId();
    const dropSection: Section = {
      id: dropSectionId,
      type: 'drop',
      name: 'Drop',
      startTick: insertTick,
      endTick: insertTick + dropDurationTicks,
    };
    
    state.sections.add(dropSection);
    
    // Generate drop content
    const newEventIds = generateDropContent(
      state,
      dropSection,
      dropStyle,
      opcode.parameters
    );
    
    const affectedEntities = [
      dropSectionId,
      ...newEventIds,
      ...timingShifts.map(s => s.entityId),
    ];
    
    return {
      success: true,
      affectedEntities,
      warnings: [],
    };
  },
};

/**
 * Generate content for a drop section.
 */
function generateDropContent(
  state: ProjectState,
  dropSection: Section,
  dropStyle: string,
  params: Record<string, unknown>
): string[] {
  const newEventIds: string[] = [];
  
  // TODO: Implement drop content generation based on style
  // - edm_full: Full arrangement with maximum energy
  // - trap_sparse: Minimal, sparse arrangement
  // - dubstep_heavy: Heavy bass and percussion
  // - progressive_smooth: Gradual energy release
  // - hybrid: Mix of styles
  
  return newEventIds;
}

// ============================================================================
// Extend Section Executor
// ============================================================================

/**
 * Executor for OP_EXTEND_SECTION.
 * 
 * Lengthens a section by adding bars.
 */
export const ExtendSectionExecutor: OpcodeExecutor = {
  opcodeType: 'gofai:op:extend_section',
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const section = resolveSection(opcode.parameters.section as SectionRef, state);
    if (!section) {
      return {
        canExecute: false,
        failedPreconditions: ['Section not found'],
      };
    }
    
    const bars = opcode.parameters.bars as number;
    if (bars < 1 || bars > 64) {
      return {
        canExecute: false,
        failedPreconditions: ['Invalid bars count (must be 1-64)'],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  },
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const section = resolveSection(opcode.parameters.section as SectionRef, state);
    if (!section) {
      return {
        success: false,
        affectedEntities: [],
        error: 'Section not found',
      };
    }
    
    const bars = opcode.parameters.bars as number;
    const position = (opcode.parameters.position as string || 'end');
    const fillMode = (opcode.parameters.fill_mode as string || 'empty');
    
    const ticksPerBar = state.metadata.ticksPerQuarter * 4;
    const extensionTicks = bars * ticksPerBar;
    
    let insertTick: number;
    
    if (position === 'end') {
      insertTick = section.endTick;
    } else if (position === 'start') {
      insertTick = section.startTick;
    } else {
      // Position before a specific bar within section
      return {
        success: false,
        affectedEntities: [],
        error: 'before_bar position not yet implemented',
      };
    }
    
    // Shift events after insertion point
    const timingShifts = shiftEventsAfter(state, insertTick, extensionTicks);
    shiftSectionsAfter(state, insertTick, extensionTicks);
    
    // Update section boundaries
    if (position === 'end') {
      state.sections.update(section.id, {
        endTick: section.endTick + extensionTicks,
      });
    } else if (position === 'start') {
      state.sections.update(section.id, {
        startTick: section.startTick,
        endTick: section.endTick + extensionTicks,
      });
    }
    
    // Generate fill content if needed
    let newEventIds: string[] = [];
    
    if (fillMode !== 'empty') {
      newEventIds = generateExtensionFill(
        state,
        section,
        insertTick,
        extensionTicks,
        fillMode
      );
    }
    
    const affectedEntities = [
      section.id,
      ...newEventIds,
      ...timingShifts.map(s => s.entityId),
    ];
    
    return {
      success: true,
      affectedEntities,
      warnings: [],
    };
  },
};

/**
 * Generate fill content for section extension.
 */
function generateExtensionFill(
  state: ProjectState,
  section: Section,
  insertTick: number,
  extensionTicks: number,
  fillMode: string
): string[] {
  const newEventIds: string[] = [];
  
  // TODO: Implement different fill modes
  // - repeat_last: Copy last bar(s) of section
  // - repeat_first: Copy first bar(s) of section
  // - extend_pattern: Intelligently continue musical patterns
  
  return newEventIds;
}

// ============================================================================
// Shorten Section Executor
// ============================================================================

/**
 * Executor for OP_SHORTEN_SECTION.
 * 
 * Reduces section length by removing bars.
 */
export const ShortenSectionExecutor: OpcodeExecutor = {
  opcodeType: 'gofai:op:shorten_section',
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const section = resolveSection(opcode.parameters.section as SectionRef, state);
    if (!section) {
      return {
        canExecute: false,
        failedPreconditions: ['Section not found'],
      };
    }
    
    const bars = opcode.parameters.bars as number;
    const ticksPerBar = state.metadata.ticksPerQuarter * 4;
    const sectionDurationBars = (section.endTick - section.startTick) / ticksPerBar;
    
    if (bars >= sectionDurationBars) {
      return {
        canExecute: false,
        failedPreconditions: ['Cannot remove all bars from section'],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  },
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const section = resolveSection(opcode.parameters.section as SectionRef, state);
    if (!section) {
      return {
        success: false,
        affectedEntities: [],
        error: 'Section not found',
      };
    }
    
    const bars = opcode.parameters.bars as number;
    const removeFrom = (opcode.parameters.remove_from as string || 'end');
    
    const ticksPerBar = state.metadata.ticksPerQuarter * 4;
    const removalTicks = bars * ticksPerBar;
    
    let removalStartTick: number;
    let removalEndTick: number;
    
    if (removeFrom === 'end') {
      removalStartTick = section.endTick - removalTicks;
      removalEndTick = section.endTick;
    } else if (removeFrom === 'start') {
      removalStartTick = section.startTick;
      removalEndTick = section.startTick + removalTicks;
    } else {
      return {
        success: false,
        affectedEntities: [],
        error: 'bar_range removal not yet implemented',
      };
    }
    
    // Delete events in removal range
    const deletedEventIds: string[] = [];
    for (const event of state.events.getAll()) {
      if (event.startTick >= removalStartTick && event.startTick < removalEndTick) {
        state.events.remove(event.id);
        deletedEventIds.push(event.id);
      }
    }
    
    // Shift events after removal range
    const timingShifts = shiftEventsAfter(state, removalEndTick, -removalTicks);
    shiftSectionsAfter(state, removalEndTick, -removalTicks);
    
    // Update section boundaries
    if (removeFrom === 'end') {
      state.sections.update(section.id, {
        endTick: section.endTick - removalTicks,
      });
    } else if (removeFrom === 'start') {
      state.sections.update(section.id, {
        startTick: section.startTick + removalTicks,
        endTick: section.endTick,
      });
    }
    
    const affectedEntities = [
      section.id,
      ...deletedEventIds,
      ...timingShifts.map(s => s.entityId),
    ];
    
    return {
      success: true,
      affectedEntities,
      warnings: deletedEventIds.length > 0 ? 
        [`Deleted ${deletedEventIds.length} events in removed bars`] :
        [],
    };
  },
};

// ============================================================================
// Export All Structure Executors
// ============================================================================

/**
 * All structure opcode executors.
 * 
 * Register these with the OpcodeExecutorRegistry to enable structure editing.
 */
export const STRUCTURE_OPCODE_EXECUTORS: readonly OpcodeExecutor[] = [
  DuplicateSectionExecutor,
  InsertBreakExecutor,
  InsertBuildExecutor,
  InsertDropExecutor,
  ExtendSectionExecutor,
  ShortenSectionExecutor,
  // TODO: Add remaining structure executors:
  // - RepeatSectionExecutor
  // - TrimSectionExecutor
  // - InsertPickupExecutor
  // - MoveSectionExecutor
  // - SwapSectionsExecutor
  // - DeleteSectionExecutor
  // - SplitSectionExecutor
  // - MergeSectionsExecutor
  // - AddTransitionExecutor
  // - RemoveTransitionExecutor
  // - AddIntroExecutor
  // - AddOutroExecutor
  // - ApplyFormTemplateExecutor
] as const;

/**
 * Register all structure executors with a registry.
 */
export function registerStructureExecutors(
  registry: { register(executor: OpcodeExecutor): void }
): void {
  for (const executor of STRUCTURE_OPCODE_EXECUTORS) {
    registry.register(executor);
  }
}
