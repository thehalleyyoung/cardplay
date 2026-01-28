/**
 * @fileoverview Layout Engine for Notation.
 * 
 * Handles:
 * - Horizontal spacing algorithm
 * - Collision avoidance
 * - Page/system breaks
 * - Voice separation
 * - Measure layout
 * 
 * @module @cardplay/core/notation/layout
 */

import {
  NotationEvent,
  NotationMeasure,
  NoteDuration,
  PageConfig,
  DEFAULT_PAGE_CONFIG,
  SystemBreak,
  PageBreak,
  StaffConfig,
  calculateDurationValue,
} from './types';
import {
  StaffDimensions,
  DEFAULT_STAFF_DIMENSIONS,
  RenderedStaff,
  calculateStaffLines,
  getClefWidth,
  getKeySignatureWidth,
  getTimeSignatureWidth,
} from './staff';

// ============================================================================
// SPACING CONFIGURATION
// ============================================================================

/**
 * Horizontal spacing configuration.
 */
export interface SpacingConfig {
  /** Minimum space between notes */
  readonly minNoteSpacing: number;
  /** Space per quarter note in proportional spacing */
  readonly quarterNoteSpace: number;
  /** Whether to use proportional spacing */
  readonly proportional: boolean;
  /** Minimum measure width */
  readonly minMeasureWidth: number;
  /** Maximum measure width */
  readonly maxMeasureWidth: number;
  /** Space after clef */
  readonly clefSpace: number;
  /** Space after key signature */
  readonly keySpace: number;
  /** Space after time signature */
  readonly timeSpace: number;
  /** Space before bar line */
  readonly preBarlineSpace: number;
  /** Space after bar line */
  readonly postBarlineSpace: number;
  /** Extra width for first measure to accommodate clef/key/time */
  readonly firstMeasureExtraWidth?: number;
}

/**
 * Default spacing configuration.
 */
export const DEFAULT_SPACING_CONFIG: SpacingConfig = {
  minNoteSpacing: 30,      // Increased for better readability
  quarterNoteSpace: 50,    // More space for quarter notes
  proportional: true,
  minMeasureWidth: 100,    // Wider minimum measure
  maxMeasureWidth: 400,
  clefSpace: 12,           // More space after clef
  keySpace: 12,            // More space after key signature
  timeSpace: 15,           // More space after time signature
  preBarlineSpace: 8,
  postBarlineSpace: 8,
  firstMeasureExtraWidth: 60, // Extra width for first measure to accommodate clef/key/time and still have room for notes
};

// ============================================================================
// SPACING CALCULATIONS
// ============================================================================

/**
 * Calculate horizontal spacing for a duration.
 */
export function calculateDurationSpacing(
  duration: NoteDuration,
  config: SpacingConfig
): number {
  const durationValue = calculateDurationValue(duration);
  
  if (config.proportional) {
    // Proportional spacing: space is proportional to duration
    // But use logarithmic scale for readability
    const base = config.quarterNoteSpace;
    const logFactor = Math.log2(durationValue + 1) + 0.5;
    return Math.max(config.minNoteSpacing, base * logFactor);
  } else {
    // Fixed spacing
    return config.minNoteSpacing;
  }
}

/**
 * Note position in a measure.
 */
export interface NotePosition {
  readonly eventId: string;
  readonly x: number;
  readonly width: number;
  readonly tick: number;
  readonly voice: number;
}

/**
 * Calculate note positions within a measure.
 */
export function calculateMeasureNotePositions(
  events: NotationEvent[],
  startX: number,
  measureWidth: number,
  config: SpacingConfig
): NotePosition[] {
  if (events.length === 0) return [];
  
  // Sort events by tick and voice
  const sorted = [...events].sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return a.voice - b.voice;
  });
  
  // Group by tick
  const tickGroups = new Map<number, NotationEvent[]>();
  for (const event of sorted) {
    const group = tickGroups.get(event.tick) || [];
    group.push(event);
    tickGroups.set(event.tick, group);
  }
  
  const ticks = Array.from(tickGroups.keys()).sort((a, b) => a - b);
  const positions: NotePosition[] = [];
  
  if (ticks.length === 0) return positions;
  
  // Calculate ideal spacing for each tick position
  const minTick: number = ticks[0] as number;
  const maxTick: number = ticks[ticks.length - 1] as number;
  const tickRange = maxTick - minTick || 1;
  
  // Available width after margins
  const availableWidth = measureWidth - config.preBarlineSpace - config.postBarlineSpace;
  
  for (let i = 0; i < ticks.length; i++) {
    const tick: number = ticks[i] as number;
    const tickEvents = tickGroups.get(tick)!;
    
    // Calculate x position based on tick
    const tickProgress = (tick - minTick) / tickRange;
    let x: number;
    
    if (config.proportional) {
      x = startX + config.postBarlineSpace + tickProgress * availableWidth;
    } else {
      // Equal spacing
      x = startX + config.postBarlineSpace + (i / Math.max(1, ticks.length - 1)) * availableWidth;
    }
    
    // Ensure minimum spacing from previous tick
    if (i > 0 && positions.length > 0) {
      const prevPosition = positions[positions.length - 1] as NotePosition;
      x = Math.max(x, prevPosition.x + config.minNoteSpacing);
    }
    
    // Add positions for all events at this tick
    for (const event of tickEvents) {
      const spacing = calculateDurationSpacing(event.duration, config);
      positions.push({
        eventId: event.id,
        x,
        width: spacing,
        tick: event.tick,
        voice: event.voice,
      });
    }
  }
  
  return positions;
}

/**
 * Adjust positions to fit within measure width.
 */
export function fitPositionsToWidth(
  positions: NotePosition[],
  startX: number,
  measureWidth: number,
  config: SpacingConfig
): NotePosition[] {
  if (positions.length === 0) return positions;
  
  const endX = startX + measureWidth - config.preBarlineSpace;
  const lastPosition = positions[positions.length - 1] as NotePosition;
  
  if (lastPosition.x <= endX) {
    return positions;
  }
  
  // Scale all positions to fit
  const firstX = (positions[0] as NotePosition).x;
  const currentRange = lastPosition.x - firstX;
  const targetRange = endX - firstX;
  const scale = targetRange / currentRange;
  
  return positions.map(pos => ({
    ...pos,
    x: firstX + (pos.x - firstX) * scale,
  }));
}

// ============================================================================
// COLLISION DETECTION
// ============================================================================

/**
 * Bounding box.
 */
export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Check if two bounding boxes overlap.
 */
export function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Calculate horizontal shift to resolve collision.
 */
export function calculateCollisionShift(a: BoundingBox, b: BoundingBox): number {
  if (!boxesOverlap(a, b)) return 0;
  
  const overlapRight = (a.x + a.width) - b.x;
  const overlapLeft = (b.x + b.width) - a.x;
  
  // Return the smaller shift
  return overlapRight < overlapLeft ? overlapRight : -overlapLeft;
}

/**
 * Collision item for resolution.
 */
export interface CollisionItem {
  readonly id: string;
  readonly box: BoundingBox;
  readonly priority: number; // Higher priority items don't move
}

/**
 * Resolve collisions between items.
 */
export function resolveCollisions(
  items: CollisionItem[],
  minGap: number = 2
): Map<string, { dx: number; dy: number }> {
  const adjustments = new Map<string, { dx: number; dy: number }>();
  
  // Initialize all adjustments to zero
  for (const item of items) {
    adjustments.set(item.id, { dx: 0, dy: 0 });
  }
  
  // Sort by priority (higher priority first)
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  
  // Check each pair
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i] as CollisionItem;
      const b = sorted[j] as CollisionItem;
      const aAdj = adjustments.get(a.id)!;
      const bAdj = adjustments.get(b.id)!;
      
      // Apply current adjustments
      const aBox: BoundingBox = {
        x: a.box.x + aAdj.dx,
        y: a.box.y + aAdj.dy,
        width: a.box.width,
        height: a.box.height,
      };
      const bBox: BoundingBox = {
        x: b.box.x + bAdj.dx,
        y: b.box.y + bAdj.dy,
        width: b.box.width,
        height: b.box.height,
      };
      
      const shift = calculateCollisionShift(aBox, bBox);
      if (shift !== 0) {
        // Move the lower priority item (b)
        adjustments.set(b.id, {
          dx: bAdj.dx + shift + (shift > 0 ? minGap : -minGap),
          dy: bAdj.dy,
        });
      }
    }
  }
  
  return adjustments;
}

// ============================================================================
// VOICE SEPARATION
// ============================================================================

/**
 * Separate voices within a measure for clear rendering.
 */
export function separateVoices(
  events: NotationEvent[],
  _staffPositions: Map<string, number>
): Map<number, NotationEvent[]> {
  const voices = new Map<number, NotationEvent[]>();
  
  for (const event of events) {
    const voiceEvents = voices.get(event.voice) || [];
    voiceEvents.push(event);
    voices.set(event.voice, voiceEvents);
  }
  
  return voices;
}

/**
 * Calculate voice-specific adjustments for clear rendering.
 */
export function calculateVoiceAdjustments(
  voices: Map<number, NotationEvent[]>,
  noteHeadWidth: number
): Map<string, { dx: number; stemDirection: 'up' | 'down' }> {
  const adjustments = new Map<string, { dx: number; stemDirection: 'up' | 'down' }>();
  
  // Standard 2-voice layout: voice 1 stems up, voice 2 stems down
  // For chords at same time, shift second voice if needed
  
  const voiceNumbers = Array.from(voices.keys()).sort();
  
  if (voiceNumbers.length <= 1) {
    // Single voice - no special adjustments
    const voiceEntries = Array.from(voices.values());
    for (const events of voiceEntries) {
      for (const event of events) {
        adjustments.set(event.id, { dx: 0, stemDirection: 'auto' as any });
      }
    }
    return adjustments;
  }
  
  // Group events by tick
  const tickGroups = new Map<number, NotationEvent[]>();
  const voiceValues = Array.from(voices.values());
  for (const events of voiceValues) {
    for (const event of events) {
      const group = tickGroups.get(event.tick) || [];
      group.push(event);
      tickGroups.set(event.tick, group);
    }
  }
  
  // Process each tick
  const tickEntries = Array.from(tickGroups.entries());
  for (const [_tick, tickEvents] of tickEntries) {
    // Sort by voice
    tickEvents.sort((a, b) => a.voice - b.voice);
    
    for (let i = 0; i < tickEvents.length; i++) {
      const event = tickEvents[i] as NotationEvent;
      const isFirstVoice = event.voice === voiceNumbers[0];
      
      // Stem direction based on voice
      const stemDirection: 'up' | 'down' = isFirstVoice ? 'up' : 'down';
      
      // Horizontal shift for overlapping seconds
      let dx = 0;
      if (!isFirstVoice && tickEvents.length > 1) {
        // Check for close intervals (seconds)
        // Could shift if notes are a second apart
        // For now, simple offset
        dx = noteHeadWidth * 0.8;
      }
      
      adjustments.set(event.id, { dx, stemDirection });
    }
  }
  
  return adjustments;
}

// ============================================================================
// MEASURE LAYOUT
// ============================================================================

/**
 * Measure layout result.
 */
export interface MeasureLayout {
  readonly measureNumber: number;
  readonly x: number;
  readonly width: number;
  readonly clefX: number | null;
  readonly keyX: number | null;
  readonly timeX: number | null;
  readonly notePositions: NotePosition[];
  readonly startBarLineX: number;
  readonly endBarLineX: number;
}

/**
 * Calculate layout for a single measure.
 */
export function layoutMeasure(
  measure: NotationMeasure,
  staffConfig: StaffConfig,
  startX: number,
  targetWidth: number,
  showClef: boolean,
  showKey: boolean,
  showTime: boolean,
  config: SpacingConfig = DEFAULT_SPACING_CONFIG
): MeasureLayout {
  let currentX = startX + config.postBarlineSpace;
  
  // Clef
  let clefX: number | null = null;
  if (showClef) {
    clefX = currentX;
    currentX += getClefWidth(staffConfig.clef) + config.clefSpace;
  }
  
  // Key signature
  let keyX: number | null = null;
  const keySig = measure.keySignature 
    ? Object.entries(measure.keySignature).find(([_k, v]) => v)?.[0] || staffConfig.keySignature
    : staffConfig.keySignature;
  if (showKey) {
    keyX = currentX;
    currentX += getKeySignatureWidth(keySig) + config.keySpace;
  }
  
  // Time signature
  let timeX: number | null = null;
  if (showTime) {
    timeX = currentX;
    currentX += getTimeSignatureWidth(staffConfig.timeSignature) + config.timeSpace;
  }
  
  // Get all events from all voices
  const allEvents: NotationEvent[] = [];
  const measureEventArrays = Array.from(measure.events.values());
  for (const events of measureEventArrays) {
    allEvents.push(...events);
  }
  
  // Calculate note positions
  const noteStartX = currentX;
  const noteEndX = startX + targetWidth - config.preBarlineSpace;
  const noteWidth = noteEndX - noteStartX;
  
  let notePositions = calculateMeasureNotePositions(allEvents, noteStartX, noteWidth, config);
  notePositions = fitPositionsToWidth(notePositions, noteStartX, noteWidth, config);
  
  return {
    measureNumber: measure.number,
    x: startX,
    width: targetWidth,
    clefX,
    keyX,
    timeX,
    notePositions,
    startBarLineX: startX,
    endBarLineX: startX + targetWidth,
  };
}

// ============================================================================
// SYSTEM LAYOUT
// ============================================================================

/**
 * System layout result.
 */
export interface SystemLayout {
  readonly systemIndex: number;
  readonly y: number;
  readonly height: number;
  readonly measures: MeasureLayout[];
  readonly staffLayouts: StaffLayout[];
}

/**
 * Staff layout within a system.
 */
export interface StaffLayout {
  readonly staffId: string;
  readonly y: number;
  readonly renderedStaff: RenderedStaff;
}

/**
 * Calculate which measures fit on a system.
 */
export function calculateSystemMeasures(
  measures: NotationMeasure[],
  systemWidth: number,
  isFirstSystem: boolean,
  staffConfig: StaffConfig,
  config: SpacingConfig = DEFAULT_SPACING_CONFIG,
  dimensions: StaffDimensions = DEFAULT_STAFF_DIMENSIONS
): number[] {
  const measureIndices: number[] = [];
  
  // Account for staff margins - measures only go within the staff line area
  const effectiveWidth = systemWidth - dimensions.leftMargin - dimensions.rightMargin;
  let currentWidth = 0;
  
  // All systems need clef and key signature
  // Only first system (or time changes) need time signature
  currentWidth += getClefWidth(staffConfig.clef) + config.clefSpace;
  currentWidth += getKeySignatureWidth(staffConfig.keySignature) + config.keySpace;
  if (isFirstSystem) {
    currentWidth += getTimeSignatureWidth(staffConfig.timeSignature) + config.timeSpace;
  }
  
  for (let i = 0; i < measures.length; i++) {
    const measure = measures[i] as NotationMeasure;
    
    // Estimate measure width
    const eventArrays = Array.from(measure.events.values());
    const events: NotationEvent[] = [];
    for (const arr of eventArrays) {
      events.push(...arr);
    }
    const minWidth = events.length * config.minNoteSpacing + config.preBarlineSpace + config.postBarlineSpace;
    const measureWidth = Math.max(config.minMeasureWidth, Math.min(config.maxMeasureWidth, minWidth));
    
    // Check if time signature changes (needs extra space)
    let extraWidth = 0;
    if (measure.timeSignature) {
      extraWidth += getTimeSignatureWidth(staffConfig.timeSignature) + config.timeSpace;
    }
    
    if (currentWidth + measureWidth + extraWidth > effectiveWidth) {
      break;
    }
    
    measureIndices.push(i);
    currentWidth += measureWidth + extraWidth;
  }
  
  // Always include at least one measure
  if (measureIndices.length === 0 && measures.length > 0) {
    measureIndices.push(0);
  }
  
  return measureIndices;
}

/**
 * Layout a system of measures.
 */
export function layoutSystem(
  measures: NotationMeasure[],
  measureIndices: number[],
  staffConfigs: StaffConfig[],
  systemY: number,
  systemWidth: number,
  dimensions: StaffDimensions = DEFAULT_STAFF_DIMENSIONS,
  config: SpacingConfig = DEFAULT_SPACING_CONFIG
): SystemLayout {
  const measureLayouts: MeasureLayout[] = [];
  const staffLayouts: StaffLayout[] = [];
  
  // Calculate total height
  const staffSpacing = dimensions.height + 60; // Gap between staves in grand staff
  const totalHeight = staffConfigs.length * staffSpacing - 60;
  
  // Create staff layouts
  let staffY = systemY;
  for (const staffConfig of staffConfigs) {
    const renderedStaff = calculateStaffLines(
      staffConfig.id,
      staffConfig,
      dimensions,
      0,
      staffY,
      systemWidth
    );
    
    staffLayouts.push({
      staffId: staffConfig.id,
      y: staffY,
      renderedStaff,
    });
    
    staffY += staffSpacing;
  }
  
  // Layout measures - must respect staff margins
  // Staff lines go from leftMargin to (systemWidth - rightMargin)
  const measureAreaStart = dimensions.leftMargin;
  const measureAreaWidth = systemWidth - dimensions.leftMargin - dimensions.rightMargin;
  
  const isFirstSystem = measureIndices[0] === 0;
  let currentX = measureAreaStart;
  
  // Calculate measure widths to fill system
  const totalMeasures = measureIndices.length;
  
  // Calculate fixed width needed for clef/key/time in first measure of each system
  // This should be ADDED to the first measure, not subtracted from total
  const firstStaff = staffConfigs[0] as StaffConfig;
  let firstMeasureHeaderWidth = 0;
  firstMeasureHeaderWidth += getClefWidth(firstStaff.clef) + config.clefSpace;
  firstMeasureHeaderWidth += getKeySignatureWidth(firstStaff.keySignature) + config.keySpace;
  if (isFirstSystem) {
    firstMeasureHeaderWidth += getTimeSignatureWidth(firstStaff.timeSignature) + config.timeSpace;
  }
  
  // Distribute measure area width among measures, with first measure getting extra for header
  // All measures get equal base width, first measure gets additional header space
  const baseWidth = (measureAreaWidth - firstMeasureHeaderWidth) / totalMeasures;
  
  for (let i = 0; i < measureIndices.length; i++) {
    const measureIndex = measureIndices[i] as number;
    const measure = measures[measureIndex] as NotationMeasure;
    
    // Clefs and key sigs on first measure of EVERY system
    // Time sigs only on first system or when they change
    const showClef = i === 0;
    const showKey = i === 0;
    const showTime = (isFirstSystem && i === 0) || !!measure.timeSignature;
    
    // First measure gets extra width for header elements
    const measureWidth = i === 0 ? baseWidth + firstMeasureHeaderWidth : baseWidth;
    
    const layout = layoutMeasure(
      measure,
      staffConfigs[0] as StaffConfig, // Use first staff for now
      currentX,
      measureWidth,
      showClef,
      showKey,
      showTime,
      config
    );
    
    measureLayouts.push(layout);
    currentX += layout.width;
  }
  
  return {
    systemIndex: 0,
    y: systemY,
    height: totalHeight,
    measures: measureLayouts,
    staffLayouts,
  };
}

// ============================================================================
// PAGE LAYOUT
// ============================================================================

/**
 * Page layout result.
 */
export interface PageLayout {
  readonly pageNumber: number;
  readonly width: number;
  readonly height: number;
  readonly systems: SystemLayout[];
}

/**
 * Calculate page layout with system breaks.
 */
export function layoutPage(
  measures: NotationMeasure[],
  staffConfigs: StaffConfig[],
  pageConfig: PageConfig = DEFAULT_PAGE_CONFIG,
  dimensions: StaffDimensions = DEFAULT_STAFF_DIMENSIONS,
  _forcedBreaks: SystemBreak[] = [],
  config: SpacingConfig = DEFAULT_SPACING_CONFIG
): PageLayout {
  const systems: SystemLayout[] = [];
  const contentWidth = pageConfig.width - pageConfig.margins.left - pageConfig.margins.right;
  let currentY = pageConfig.margins.top;
  let measureIndex = 0;
  let systemIndex = 0;
  
  while (measureIndex < measures.length) {
    // Calculate which measures fit on this system
    const remainingMeasures = measures.slice(measureIndex);
    const isFirstSystem = systemIndex === 0;
    const measureIndices = calculateSystemMeasures(
      remainingMeasures,
      contentWidth,
      isFirstSystem,
      staffConfigs[0] as StaffConfig,
      config,
      dimensions
    );
    
    // Adjust indices to be absolute
    const absoluteIndices = measureIndices.map(i => i + measureIndex);
    
    // Layout system
    const system = layoutSystem(
      measures,
      absoluteIndices,
      staffConfigs,
      currentY,
      contentWidth,
      dimensions,
      config
    );
    
    // Update system index
    (system as any).systemIndex = systemIndex;
    
    systems.push(system);
    
    currentY += system.height + pageConfig.systemSpacing;
    measureIndex += measureIndices.length;
    systemIndex++;
    
    // Check if we've exceeded page height
    if (currentY > pageConfig.height - pageConfig.margins.bottom) {
      break;
    }
  }
  
  return {
    pageNumber: 1,
    width: pageConfig.width,
    height: pageConfig.height,
    systems,
  };
}

/**
 * Calculate all pages for a score.
 */
export function layoutScore(
  measures: NotationMeasure[],
  staffConfigs: StaffConfig[],
  pageConfig: PageConfig = DEFAULT_PAGE_CONFIG,
  dimensions: StaffDimensions = DEFAULT_STAFF_DIMENSIONS,
  systemBreaks: SystemBreak[] = [],
  _pageBreaks: PageBreak[] = [],
  config: SpacingConfig = DEFAULT_SPACING_CONFIG
): PageLayout[] {
  const pages: PageLayout[] = [];
  let measureIndex = 0;
  let pageNumber = 1;
  
  while (measureIndex < measures.length) {
    const remainingMeasures = measures.slice(measureIndex);
    
    // Find relevant breaks for this section
    const relevantSystemBreaks = systemBreaks.filter(
      b => b.afterMeasure >= measureIndex
    );
    
    const page = layoutPage(
      remainingMeasures,
      staffConfigs,
      pageConfig,
      dimensions,
      relevantSystemBreaks,
      config
    );
    
    // Update page number
    (page as any).pageNumber = pageNumber;
    
    pages.push(page);
    
    // Count measures laid out
    let measuresOnPage = 0;
    for (const system of page.systems) {
      measuresOnPage += system.measures.length;
    }
    
    measureIndex += measuresOnPage;
    pageNumber++;
    
    // Safety check
    if (measuresOnPage === 0) break;
  }
  
  return pages;
}

// ============================================================================
// ADVANCED LAYOUT ENHANCEMENTS (Section 11.4)
// ============================================================================

/**
 * Configuration for accidental placement.
 */
export interface AccidentalPlacementConfig {
  /** Minimum horizontal gap between accidentals */
  readonly minAccidentalGap: number;
  /** Maximum stacking height for accidentals */
  readonly maxStackHeight: number;
  /** Whether to use diagonal stacking */
  readonly diagonalStacking: boolean;
}

export const DEFAULT_ACCIDENTAL_PLACEMENT: AccidentalPlacementConfig = {
  minAccidentalGap: 3,
  maxStackHeight: 7,
  diagonalStacking: true,
};

/**
 * Resolve collisions between accidentals in a chord.
 * Returns adjusted x-offsets for each accidental.
 */
export function resolveAccidentalCollisions(
  accidentals: Array<{ id: string; staffPos: number; width: number }>,
  config: AccidentalPlacementConfig = DEFAULT_ACCIDENTAL_PLACEMENT
): Map<string, number> {
  const offsets = new Map<string, number>();
  
  if (accidentals.length === 0) return offsets;
  
  // Sort by staff position (top to bottom)
  const sorted = [...accidentals].sort((a, b) => b.staffPos - a.staffPos);
  
  // Track columns of accidentals
  const columns: Array<{ staffPos: number; width: number; id: string }[]> = [];
  
  for (const acc of sorted) {
    let placed = false;
    
    // Try to place in existing columns
    for (const column of columns) {
      const lastInColumn = column[column.length - 1];
      if (!lastInColumn) continue;
      
      // Check if there's enough vertical space
      const verticalGap = Math.abs(acc.staffPos - lastInColumn.staffPos);
      if (verticalGap > config.maxStackHeight) {
        column.push(acc);
        placed = true;
        break;
      }
    }
    
    // Create new column if not placed
    if (!placed) {
      columns.push([acc]);
    }
  }
  
  // Calculate x-offsets for each column
  let currentX = 0;
  for (let colIndex = columns.length - 1; colIndex >= 0; colIndex--) {
    const column = columns[colIndex] as typeof columns[0];
    const maxWidth = Math.max(...column.map(acc => acc.width));
    
    for (const acc of column) {
      offsets.set(acc.id, -currentX);
    }
    
    if (colIndex > 0) {
      currentX += maxWidth + config.minAccidentalGap;
    }
  }
  
  return offsets;
}

/**
 * Configuration for articulation placement.
 */
export interface ArticulationPlacementConfig {
  /** Default vertical offset from note */
  readonly defaultOffset: number;
  /** Minimum gap between articulations */
  readonly minArticulationGap: number;
  /** Prefer placement above or below note */
  readonly preferAbove: boolean;
}

export const DEFAULT_ARTICULATION_PLACEMENT: ArticulationPlacementConfig = {
  defaultOffset: 10,
  minArticulationGap: 4,
  preferAbove: true,
};

/**
 * Resolve collisions between articulations on a note.
 * Returns adjusted y-offsets for each articulation.
 */
export function resolveArticulationCollisions(
  articulations: Array<{ id: string; height: number; placement: 'above' | 'below' }>,
  config: ArticulationPlacementConfig = DEFAULT_ARTICULATION_PLACEMENT
): Map<string, number> {
  const offsets = new Map<string, number>();
  
  // Group by placement
  const above = articulations.filter(a => a.placement === 'above');
  const below = articulations.filter(a => a.placement === 'below');
  
  // Stack articulations above
  let currentOffsetAbove = config.defaultOffset;
  for (const art of above) {
    offsets.set(art.id, -currentOffsetAbove);
    currentOffsetAbove += art.height + config.minArticulationGap;
  }
  
  // Stack articulations below
  let currentOffsetBelow = config.defaultOffset;
  for (const art of below) {
    offsets.set(art.id, currentOffsetBelow);
    currentOffsetBelow += art.height + config.minArticulationGap;
  }
  
  return offsets;
}

/**
 * Optimize stem direction for a group of notes to minimize ledger lines
 * and create visual balance.
 */
export function optimizeStemDirection(
  notes: Array<{ id: string; staffPos: number; voice: number }>,
  averageStaffPosition: number = 0
): Map<string, 'up' | 'down'> {
  const directions = new Map<string, 'up' | 'down'>();
  
  for (const note of notes) {
    // Basic rule: notes above middle line go down, below go up
    let direction: 'up' | 'down';
    
    if (note.staffPos > averageStaffPosition) {
      direction = 'down';
    } else if (note.staffPos < averageStaffPosition) {
      direction = 'up';
    } else {
      // Middle line: prefer down for single notes
      direction = 'down';
    }
    
    // Voice-based override: lower voices prefer down, upper voices prefer up
    if (note.voice > 1) {
      direction = 'down';
    } else if (note.voice < 1) {
      direction = 'up';
    }
    
    directions.set(note.id, direction);
  }
  
  return directions;
}

/**
 * Configuration for beam angle optimization.
 */
export interface BeamAngleConfig {
  /** Maximum beam angle in degrees */
  readonly maxAngle: number;
  /** Minimum beam angle for non-flat beams */
  readonly minAngle: number;
  /** Prefer horizontal beams when possible */
  readonly preferHorizontal: boolean;
  /** Threshold for forcing horizontal (staff positions difference) */
  readonly horizontalThreshold: number;
}

export const DEFAULT_BEAM_ANGLE_CONFIG: BeamAngleConfig = {
  maxAngle: 30,
  minAngle: 5,
  preferHorizontal: true,
  horizontalThreshold: 2,
};

/**
 * Optimize beam angle for a group of beamed notes.
 * Returns the optimized angle in degrees and reference y-position.
 */
export function optimizeBeamAngle(
  notes: Array<{ x: number; staffPos: number; stemDirection: 'up' | 'down' }>,
  config: BeamAngleConfig = DEFAULT_BEAM_ANGLE_CONFIG
): { angle: number; yStart: number } {
  if (notes.length === 0) {
    return { angle: 0, yStart: 0 };
  }
  
  if (notes.length === 1) {
    const note = notes[0] as typeof notes[0];
    return { angle: 0, yStart: note.staffPos };
  }
  
  const firstNote = notes[0] as typeof notes[0];
  const lastNote = notes[notes.length - 1] as typeof notes[0];
  
  // Calculate staff position difference
  const staffPosDiff = lastNote.staffPos - firstNote.staffPos;
  
  // Force horizontal if difference is small
  if (Math.abs(staffPosDiff) <= config.horizontalThreshold && config.preferHorizontal) {
    // Use average position
    const avgPos = notes.reduce((sum, n) => sum + n.staffPos, 0) / notes.length;
    return { angle: 0, yStart: avgPos };
  }
  
  // Calculate ideal angle
  const xSpan = lastNote.x - firstNote.x;
  if (xSpan === 0) {
    return { angle: 0, yStart: firstNote.staffPos };
  }
  
  const ySpan = staffPosDiff;
  let angle = Math.atan2(ySpan, xSpan) * (180 / Math.PI);
  
  // Clamp angle to max
  angle = Math.max(-config.maxAngle, Math.min(config.maxAngle, angle));
  
  // Enforce minimum angle for non-horizontal beams
  if (Math.abs(angle) < config.minAngle && Math.abs(angle) > 0.1) {
    angle = angle > 0 ? config.minAngle : -config.minAngle;
  }
  
  return { angle, yStart: firstNote.staffPos };
}

/**
 * Configuration for slur curvature.
 */
export interface SlurCurvatureConfig {
  /** Default control point height as fraction of span */
  readonly defaultHeight: number;
  /** Minimum curvature for short slurs */
  readonly minCurvature: number;
  /** Maximum curvature for long slurs */
  readonly maxCurvature: number;
  /** Adjust curvature based on note range */
  readonly adjustForRange: boolean;
}

export const DEFAULT_SLUR_CURVATURE_CONFIG: SlurCurvatureConfig = {
  defaultHeight: 0.15,
  minCurvature: 0.08,
  maxCurvature: 0.25,
  adjustForRange: true,
};

/**
 * Optimize slur curvature for a phrase.
 * Returns control points for a smooth bezier curve.
 */
export function optimizeSlurCurvature(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  noteRange: number = 0,
  config: SlurCurvatureConfig = DEFAULT_SLUR_CURVATURE_CONFIG
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const xSpan = endX - startX;
  
  // Calculate base curvature height
  let heightFactor = config.defaultHeight;
  
  // Adjust for note range if enabled
  if (config.adjustForRange && noteRange > 0) {
    // Flatter curve for wider ranges
    heightFactor = Math.max(
      config.minCurvature,
      config.defaultHeight - (noteRange * 0.01)
    );
  }
  
  // Clamp height factor
  heightFactor = Math.max(config.minCurvature, Math.min(config.maxCurvature, heightFactor));
  
  // Calculate control points
  const height = Math.abs(xSpan) * heightFactor;
  
  // Determine curve direction (usually upward for slurs above notes)
  const curveDirection = startY < 0 ? -1 : 1;
  
  const cp1x = startX + xSpan * 0.25;
  const cp1y = startY - (height * curveDirection);
  const cp2x = startX + xSpan * 0.75;
  const cp2y = endY - (height * curveDirection);
  
  return { cp1x, cp1y, cp2x, cp2y };
}

/**
 * Configuration for tie placement.
 */
export interface TiePlacementConfig {
  /** Default vertical offset from note head */
  readonly defaultOffset: number;
  /** Curvature height as fraction of span */
  readonly curvature: number;
  /** Minimum tie length */
  readonly minLength: number;
  /** Prefer placement above or below note */
  readonly preferAbove: boolean;
}

export const DEFAULT_TIE_PLACEMENT_CONFIG: TiePlacementConfig = {
  defaultOffset: 8,
  curvature: 0.12,
  minLength: 15,
  preferAbove: false,
};

/**
 * Calculate optimal tie placement between two notes.
 * Returns tie positioning data.
 */
export function calculateTiePlacement(
  startX: number,
  startStaffPos: number,
  endX: number,
  endStaffPos: number,
  stemDirection: 'up' | 'down',
  config: TiePlacementConfig = DEFAULT_TIE_PLACEMENT_CONFIG
): {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  placement: 'above' | 'below';
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
} {
  // Determine placement based on stem direction
  // Ties go opposite to stem direction when possible
  const placement: 'above' | 'below' = stemDirection === 'down' ? 'above' : 'below';
  const offsetDirection = placement === 'above' ? -1 : 1;
  
  // Calculate y positions
  const startY = startStaffPos + (config.defaultOffset * offsetDirection);
  const endY = endStaffPos + (config.defaultOffset * offsetDirection);
  
  // Calculate control points for smooth curve
  const xSpan = Math.max(config.minLength, endX - startX);
  const height = xSpan * config.curvature;
  
  const cp1x = startX + xSpan * 0.33;
  const cp1y = startY + (height * offsetDirection);
  const cp2x = startX + xSpan * 0.67;
  const cp2y = endY + (height * offsetDirection);
  
  return {
    startX,
    startY,
    endX,
    endY,
    placement,
    cp1x,
    cp1y,
    cp2x,
    cp2y,
  };
}

// ============================================================================
// DYNAMICS PLACEMENT
// ============================================================================

/**
 * Configuration for dynamics placement.
 */
export interface DynamicsPlacementConfig {
  /** Minimum vertical spacing below staff */
  readonly minStaffDistance: number;
  /** Minimum horizontal spacing between dynamics */
  readonly minHorizontalSpacing: number;
  /** Extra spacing for wide markings (fff, sfz, etc.) */
  readonly wideMarkingSpacing: number;
  /** Whether to center dynamics under notes */
  readonly centerUnderNotes: boolean;
  /** Whether to avoid collisions with lyrics/text */
  readonly avoidTextCollisions: boolean;
}

/**
 * Default dynamics placement configuration.
 */
export const DEFAULT_DYNAMICS_PLACEMENT_CONFIG: DynamicsPlacementConfig = {
  minStaffDistance: 30,
  minHorizontalSpacing: 20,
  wideMarkingSpacing: 30,
  centerUnderNotes: true,
  avoidTextCollisions: true,
};

/**
 * Represents a placed dynamic marking.
 */
export interface PlacedDynamic {
  readonly tick: number;
  readonly level: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

/**
 * Calculate optimal placement for dynamic markings.
 * Ensures no collisions and proper vertical spacing.
 */
export function calculateDynamicsPlacement(
  dynamics: Array<{ tick: number; level: string; noteX?: number }>,
  staffY: number,
  config: DynamicsPlacementConfig = DEFAULT_DYNAMICS_PLACEMENT_CONFIG
): PlacedDynamic[] {
  const placed: PlacedDynamic[] = [];
  
  for (const dynamic of dynamics) {
    // Estimate width based on marking
    const width = estimateDynamicWidth(dynamic.level);
    
    // Base x position (center under note if specified)
    let x = dynamic.noteX ?? 0;
    if (config.centerUnderNotes && dynamic.noteX) {
      x = dynamic.noteX - width / 2;
    }
    
    // Check for horizontal collisions and adjust
    for (const prev of placed) {
      const minSpacing = width > 20 || prev.width > 20 
        ? config.wideMarkingSpacing 
        : config.minHorizontalSpacing;
      
      if (Math.abs(x - prev.x) < (width + prev.width) / 2 + minSpacing) {
        // Collision detected, shift right
        x = prev.x + prev.width + minSpacing;
      }
    }
    
    // Y position below staff
    const y = staffY + config.minStaffDistance;
    
    placed.push({
      tick: dynamic.tick,
      level: dynamic.level,
      x,
      y,
      width,
    });
  }
  
  return placed;
}

/**
 * Estimate width of a dynamic marking in pixels.
 */
function estimateDynamicWidth(level: string): number {
  // Rough estimation based on character count
  const baseCharWidth = 12;
  return level.length * baseCharWidth;
}

// ============================================================================
// TEXT PLACEMENT
// ============================================================================

/**
 * Text placement type.
 */
export type TextPlacementType = 
  | 'tempo'       // Tempo markings (above staff)
  | 'expression'  // Expression text (above staff)
  | 'lyric'       // Lyrics (below staff)
  | 'chord'       // Chord symbols (above staff)
  | 'rehearsal'   // Rehearsal marks (above staff)
  | 'technique';  // Performance technique (above/below staff)

/**
 * Configuration for text placement.
 */
export interface TextPlacementConfig {
  /** Vertical spacing from staff for text above */
  readonly aboveStaffDistance: number;
  /** Vertical spacing from staff for text below */
  readonly belowStaffDistance: number;
  /** Minimum horizontal spacing between text items */
  readonly minHorizontalSpacing: number;
  /** Whether to center text over notes */
  readonly centerOverNotes: boolean;
  /** Layer priorities (higher = placed first) */
  readonly layerPriorities: Record<TextPlacementType, number>;
}

/**
 * Default text placement configuration.
 */
export const DEFAULT_TEXT_PLACEMENT_CONFIG: TextPlacementConfig = {
  aboveStaffDistance: 35,
  belowStaffDistance: 30,
  minHorizontalSpacing: 10,
  centerOverNotes: true,
  layerPriorities: {
    tempo: 3,
    expression: 2,
    chord: 2,
    rehearsal: 3,
    technique: 1,
    lyric: 1,
  },
};

/**
 * Represents a placed text item.
 */
export interface PlacedText {
  readonly type: TextPlacementType;
  readonly tick: number;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly layer: number;
}

/**
 * Calculate optimal placement for text items.
 * Groups by type and handles collision avoidance.
 */
export function calculateTextPlacement(
  textItems: Array<{
    type: TextPlacementType;
    tick: number;
    text: string;
    noteX?: number;
  }>,
  staffY: number,
  config: TextPlacementConfig = DEFAULT_TEXT_PLACEMENT_CONFIG
): PlacedText[] {
  const placed: PlacedText[] = [];
  
  // Sort by priority (higher first) then by position
  const sorted = [...textItems].sort((a, b) => {
    const priorityDiff = config.layerPriorities[b.type] - config.layerPriorities[a.type];
    if (priorityDiff !== 0) return priorityDiff;
    return a.tick - b.tick;
  });
  
  // Track layers for each type
  const typeLayers = new Map<TextPlacementType, number>();
  
  for (const item of sorted) {
    const isAbove = item.type !== 'lyric';
    const width = estimateTextWidth(item.text);
    const height = 16; // Approximate line height
    
    // Base x position
    let x = item.noteX ?? 0;
    if (config.centerOverNotes && item.noteX) {
      x = item.noteX - width / 2;
    }
    
    // Determine layer (row) for this type
    let layer = typeLayers.get(item.type) ?? 0;
    
    // Check for collisions in this layer
    let hasCollision = true;
    while (hasCollision && layer < 5) { // Max 5 layers
      hasCollision = false;
      
      for (const prev of placed) {
        if (prev.type === item.type && prev.layer === layer) {
          const xOverlap = Math.abs(x - prev.x) < (width + prev.width) / 2 + config.minHorizontalSpacing;
          if (xOverlap) {
            hasCollision = true;
            layer++;
            break;
          }
        }
      }
    }
    
    typeLayers.set(item.type, Math.max(layer, typeLayers.get(item.type) ?? 0));
    
    // Calculate y position based on layer
    const baseDistance = isAbove ? config.aboveStaffDistance : config.belowStaffDistance;
    const layerOffset = layer * (height + 5);
    const y = isAbove 
      ? staffY - baseDistance - layerOffset
      : staffY + baseDistance + layerOffset;
    
    placed.push({
      type: item.type,
      tick: item.tick,
      text: item.text,
      x,
      y,
      width,
      height,
      layer,
    });
  }
  
  return placed;
}

/**
 * Estimate width of text in pixels.
 */
function estimateTextWidth(text: string): number {
  // Rough estimation: average 8px per character
  return text.length * 8;
}

// ============================================================================
// PAGE LAYOUT
// ============================================================================

/**
 * Extended page configuration with margins and layout options.
 */
export interface ExtendedPageConfig extends PageConfig {
  /** Top margin in pixels */
  readonly topMargin: number;
  /** Bottom margin in pixels */
  readonly bottomMargin: number;
  /** Left margin in pixels */
  readonly leftMargin: number;
  /** Right margin in pixels */
  readonly rightMargin: number;
  /** Whether to show page numbers */
  readonly showPageNumbers: boolean;
  /** Whether to show title on first page */
  readonly showTitle: boolean;
  /** Title text */
  readonly title?: string;
  /** Composer text */
  readonly composer?: string;
}

/**
 * Default extended page configuration.
 */
export const DEFAULT_EXTENDED_PAGE_CONFIG: ExtendedPageConfig = {
  ...DEFAULT_PAGE_CONFIG,
  topMargin: 60,
  bottomMargin: 60,
  leftMargin: 60,
  rightMargin: 60,
  showPageNumbers: true,
  showTitle: true,
};

/**
 * Calculate usable area within page margins.
 */
export function calculatePageUsableArea(config: ExtendedPageConfig): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: config.leftMargin,
    y: config.topMargin,
    width: config.width - config.leftMargin - config.rightMargin,
    height: config.height - config.topMargin - config.bottomMargin,
  };
}

/**
 * System layout configuration.
 */
export interface SystemLayoutConfig {
  /** Minimum space between systems */
  readonly minSystemSpacing: number;
  /** Maximum space between systems */
  readonly maxSystemSpacing: number;
  /** Whether to justify systems (stretch to full width) */
  readonly justifySystems: boolean;
  /** Indent first system */
  readonly firstSystemIndent: number;
}

/**
 * Default system layout configuration.
 */
export const DEFAULT_SYSTEM_LAYOUT_CONFIG: SystemLayoutConfig = {
  minSystemSpacing: 80,
  maxSystemSpacing: 150,
  justifySystems: true,
  firstSystemIndent: 40,
};

/**
 * Calculate vertical positions for systems on a page.
 */
export function calculateSystemPositions(
  systemCount: number,
  usableHeight: number,
  config: SystemLayoutConfig = DEFAULT_SYSTEM_LAYOUT_CONFIG
): number[] {
  if (systemCount === 0) return [];
  
  const positions: number[] = [];
  const totalSystemHeight = 100; // Approximate height per system
  
  // Calculate spacing
  const totalContentHeight = systemCount * totalSystemHeight;
  const availableSpace = usableHeight - totalContentHeight;
  const spacing = Math.max(
    config.minSystemSpacing,
    Math.min(config.maxSystemSpacing, availableSpace / (systemCount - 1 || 1))
  );
  
  // Position systems
  let currentY = 0;
  for (let i = 0; i < systemCount; i++) {
    positions.push(currentY);
    currentY += totalSystemHeight + spacing;
  }
  
  return positions;
}

/**
 * Staff distance adjustment configuration.
 */
export interface StaffDistanceConfig {
  /** Minimum distance between staves in a system */
  readonly minStaffDistance: number;
  /** Maximum distance between staves in a system */
  readonly maxStaffDistance: number;
  /** Extra distance for piano staves (grand staff) */
  readonly grandStaffDistance: number;
}

/**
 * Default staff distance configuration.
 */
export const DEFAULT_STAFF_DISTANCE_CONFIG: StaffDistanceConfig = {
  minStaffDistance: 60,
  maxStaffDistance: 120,
  grandStaffDistance: 50,
};

/**
 * Calculate vertical positions for multiple staves within a system.
 */
export function calculateStaffDistances(
  staffCount: number,
  config: StaffDistanceConfig = DEFAULT_STAFF_DISTANCE_CONFIG
): number[] {
  if (staffCount === 0) return [];
  
  const distances: number[] = [0]; // First staff at position 0
  
  for (let i = 1; i < staffCount; i++) {
    // Use grand staff distance for paired staves (piano, etc.)
    const distance = i % 2 === 1 && staffCount > 1
      ? config.grandStaffDistance
      : config.minStaffDistance;
    
    const prevY = distances[i - 1] ?? 0;
    distances.push(prevY + distance);
  }
  
  return distances;
}

// ============================================================================
// JUSTIFIED LAYOUT
// ============================================================================

/**
 * Configuration for measure justification.
 */
export interface JustificationConfig {
  /** Whether to justify the last system */
  readonly justifyLastSystem: boolean;
  /** Minimum stretch factor (avoid over-stretching) */
  readonly minStretchFactor: number;
  /** Maximum stretch factor */
  readonly maxStretchFactor: number;
  /** Spring constant for note spacing (flexibility) */
  readonly springConstant: number;
}

/**
 * Default justification configuration.
 */
export const DEFAULT_JUSTIFICATION_CONFIG: JustificationConfig = {
  justifyLastSystem: false,
  minStretchFactor: 0.9,
  maxStretchFactor: 1.5,
  springConstant: 1.0,
};

/**
 * Apply justification to measure positions within a system.
 * Stretches measures to fill the system width.
 */
export function applyJustification(
  measureWidths: number[],
  systemWidth: number,
  isLastSystem: boolean,
  config: JustificationConfig = DEFAULT_JUSTIFICATION_CONFIG
): number[] {
  if (measureWidths.length === 0) return [];
  
  // Skip justification for last system if configured
  if (isLastSystem && !config.justifyLastSystem) {
    return measureWidths;
  }
  
  const totalNaturalWidth = measureWidths.reduce((sum, w) => sum + w, 0);
  const stretchFactor = systemWidth / totalNaturalWidth;
  
  // Clamp stretch factor to avoid distortion
  const clampedFactor = Math.max(
    config.minStretchFactor,
    Math.min(config.maxStretchFactor, stretchFactor)
  );
  
  // Apply uniform stretching
  return measureWidths.map(w => w * clampedFactor);
}

/**
 * Calculate spring-based spacing for flexible justification.
 * More natural-looking spacing using springs.
 */
export function calculateSpringSpacing(
  notePositions: NotePosition[],
  targetWidth: number,
  config: JustificationConfig = DEFAULT_JUSTIFICATION_CONFIG
): NotePosition[] {
  if (notePositions.length === 0) return [];
  
  const lastPos = notePositions[notePositions.length - 1];
  const firstPos = notePositions[0];
  if (!lastPos || !firstPos) return notePositions;
  
  const naturalWidth = lastPos.x - firstPos.x;
  const stretchNeeded = targetWidth - naturalWidth;
  
  if (Math.abs(stretchNeeded) < 1) return notePositions;
  
  // Calculate spring compression/expansion per gap
  const gapCount = notePositions.length - 1;
  const springStretch = stretchNeeded / gapCount * config.springConstant;
  
  // Apply incremental stretch to each position
  return notePositions.map((pos, i) => ({
    ...pos,
    x: pos.x + i * springStretch,
  }));
}

// ============================================================================
// RAGGED-RIGHT OPTION
// ============================================================================

/**
 * Configuration for ragged-right layout.
 */
export interface RaggedRightConfig {
  /** Whether to enable ragged-right layout */
  readonly enabled: boolean;
  /** Maximum line raggedness (0-1, higher = more variation) */
  readonly maxRaggedness: number;
  /** Whether to apply to all systems */
  readonly allSystems: boolean;
}

/**
 * Default ragged-right configuration.
 */
export const DEFAULT_RAGGED_RIGHT_CONFIG: RaggedRightConfig = {
  enabled: false,
  maxRaggedness: 0.3,
  allSystems: false,
};

/**
 * Apply ragged-right layout (no justification).
 * Returns natural measure widths without stretching.
 */
export function applyRaggedRight(
  measureWidths: number[],
  config: RaggedRightConfig = DEFAULT_RAGGED_RIGHT_CONFIG
): number[] {
  if (!config.enabled) {
    return measureWidths;
  }
  
  // Return natural widths (no stretching)
  return measureWidths;
}

/**
 * Determine if a system should use ragged-right layout.
 */
export function shouldUseRaggedRight(
  systemIndex: number,
  totalSystems: number,
  config: RaggedRightConfig
): boolean {
  if (!config.enabled) return false;
  
  // Apply to last system only (unless allSystems is true)
  return config.allSystems || systemIndex === totalSystems - 1;
}

// ============================================================================
// MULTI-VOICE LAYOUT
// ============================================================================

/**
 * Voice configuration for multi-voice layout.
 */
export interface VoiceConfig {
  /** Voice number (1-4) */
  readonly voiceNumber: number;
  /** Stem direction */
  readonly stemDirection: 'up' | 'down' | 'auto';
  /** Vertical offset from staff center */
  readonly verticalOffset: number;
  /** Whether voice is hidden */
  readonly hidden: boolean;
}

/**
 * Default voice configurations for multi-voice layout.
 */
export const DEFAULT_VOICE_CONFIGS: VoiceConfig[] = [
  { voiceNumber: 1, stemDirection: 'up', verticalOffset: 0, hidden: false },
  { voiceNumber: 2, stemDirection: 'down', verticalOffset: 0, hidden: false },
  { voiceNumber: 3, stemDirection: 'up', verticalOffset: 5, hidden: false },
  { voiceNumber: 4, stemDirection: 'down', verticalOffset: 5, hidden: false },
];

/**
 * Multi-voice layout configuration.
 */
export interface MultiVoiceLayoutConfig {
  /** Voice-specific configurations */
  readonly voices: VoiceConfig[];
  /** Minimum horizontal offset for simultaneous notes */
  readonly simultaneousNoteOffset: number;
  /** Whether to automatically resolve collisions */
  readonly autoResolveCollisions: boolean;
}

/**
 * Default multi-voice layout configuration.
 */
export const DEFAULT_MULTI_VOICE_LAYOUT_CONFIG: MultiVoiceLayoutConfig = {
  voices: DEFAULT_VOICE_CONFIGS,
  simultaneousNoteOffset: 8,
  autoResolveCollisions: true,
};

/**
 * Calculate horizontal offsets for simultaneous notes in multiple voices.
 */
export function calculateMultiVoiceOffsets(
  noteGroups: Array<{ voice: number; x: number; width: number }[]>,
  config: MultiVoiceLayoutConfig = DEFAULT_MULTI_VOICE_LAYOUT_CONFIG
): Map<number, number> {
  const offsets = new Map<number, number>();
  
  for (const group of noteGroups) {
    if (group.length <= 1) continue;
    
    // Sort by voice number
    const sorted = [...group].sort((a, b) => a.voice - b.voice);
    
    // Voice 1 (stems up) stays at base position
    // Voice 2 (stems down) shifts right
    for (let i = 0; i < sorted.length; i++) {
      const note = sorted[i];
      if (!note) continue;
      
      const voiceConfig = config.voices.find(v => v.voiceNumber === note.voice);
      
      if (voiceConfig?.stemDirection === 'down' && i > 0) {
        // Shift right to avoid collision with stem-up notes
        offsets.set(note.voice, config.simultaneousNoteOffset);
      } else {
        offsets.set(note.voice, 0);
      }
    }
  }
  
  return offsets;
}

/**
 * Resolve multi-voice collisions by adjusting note positions.
 */
export function resolveMultiVoiceCollisions(
  voices: Array<{ voice: number; notes: NotePosition[] }>,
  config: MultiVoiceLayoutConfig = DEFAULT_MULTI_VOICE_LAYOUT_CONFIG
): Array<{ voice: number; notes: NotePosition[] }> {
  if (!config.autoResolveCollisions || voices.length <= 1) {
    return voices;
  }
  
  // Group simultaneous notes by tick position
  const simultaneousGroups = new Map<number, Array<{ voice: number; note: NotePosition }>>();
  
  for (const voice of voices) {
    for (const note of voice.notes) {
      if (!simultaneousGroups.has(note.tick)) {
        simultaneousGroups.set(note.tick, []);
      }
      simultaneousGroups.get(note.tick)!.push({ voice: voice.voice, note });
    }
  }
  
  // Apply offsets
  const result = voices.map(v => ({ ...v, notes: [...v.notes] }));
  
  for (const [_tick, group] of simultaneousGroups) {
    if (group.length <= 1) continue;
    
    const offsets = calculateMultiVoiceOffsets(
      [group.map(g => ({ voice: g.voice, x: g.note.x, width: 10 }))],
      config
    );
    
    for (const { voice, note } of group) {
      const offset = offsets.get(voice) ?? 0;
      const voiceResult = result.find(v => v.voice === voice);
      if (voiceResult) {
        const noteIndex = voiceResult.notes.indexOf(note);
        if (noteIndex >= 0) {
          voiceResult.notes[noteIndex] = { ...note, x: note.x + offset };
        }
      }
    }
  }
  
  return result;
}

// ============================================================================
// LYRIC SYLLABLE PLACEMENT
// ============================================================================

/**
 * Lyric syllable type.
 */
export type LyricSyllableType =
  | 'single'     // Standalone word
  | 'begin'      // First syllable
  | 'middle'     // Middle syllable
  | 'end';       // Last syllable

/**
 * Lyric syllable definition.
 */
export interface LyricSyllable {
  readonly text: string;
  readonly type: LyricSyllableType;
  readonly tick: number;
  readonly noteId: string;
  /** Verse number (for multiple verses) */
  readonly verse?: number;
}

/**
 * Configuration for lyric placement.
 */
export interface LyricPlacementConfig {
  /** Vertical distance below staff */
  readonly staffDistance: number;
  /** Minimum horizontal spacing between syllables */
  readonly minSyllableSpacing: number;
  /** Extension line length for melisma */
  readonly extensionLineLength: number;
  /** Hyphen length between syllables */
  readonly hyphenLength: number;
  /** Verse spacing (when multiple verses) */
  readonly verseSpacing: number;
}

/**
 * Default lyric placement configuration.
 */
export const DEFAULT_LYRIC_PLACEMENT_CONFIG: LyricPlacementConfig = {
  staffDistance: 40,
  minSyllableSpacing: 15,
  extensionLineLength: 20,
  hyphenLength: 8,
  verseSpacing: 20,
};

/**
 * Placed lyric syllable with position.
 */
export interface PlacedLyricSyllable {
  readonly syllable: LyricSyllable;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  /** Whether to draw hyphen after this syllable */
  readonly drawHyphen: boolean;
  /** Whether to draw extension line after this syllable */
  readonly drawExtension: boolean;
}

/**
 * Calculate placement for lyric syllables.
 * Centers syllables under notes and handles hyphens/extensions.
 */
export function calculateLyricSyllablePlacement(
  syllables: LyricSyllable[],
  notePositions: Map<string, { x: number; width: number }>,
  staffY: number,
  config: LyricPlacementConfig = DEFAULT_LYRIC_PLACEMENT_CONFIG
): PlacedLyricSyllable[] {
  const placed: PlacedLyricSyllable[] = [];
  
  for (let i = 0; i < syllables.length; i++) {
    const syllable = syllables[i];
    if (!syllable) continue;
    
    const notePos = notePositions.get(syllable.noteId);
    
    if (!notePos) continue;
    
    const width = estimateTextWidth(syllable.text);
    const x = notePos.x - width / 2; // Center under note
    
    // Calculate y based on verse number
    const verse = syllable.verse ?? 1;
    const y = staffY + config.staffDistance + (verse - 1) * config.verseSpacing;
    
    // Determine if we need hyphen or extension
    const drawHyphen = syllable.type === 'begin' || syllable.type === 'middle';
    const drawExtension = false; // TODO: Detect melisma (multiple notes per syllable)
    
    placed.push({
      syllable,
      x,
      y,
      width,
      drawHyphen,
      drawExtension,
    });
  }
  
  return placed;
}

// ============================================================================
// CHORD SYMBOL PLACEMENT
// ============================================================================

/**
 * Chord symbol definition.
 */
export interface ChordSymbol {
  readonly symbol: string;  // e.g., "Cmaj7", "Dm", "G7"
  readonly tick: number;
  /** Optional alternate bass note */
  readonly bassNote?: string;
}

/**
 * Configuration for chord symbol placement.
 */
export interface ChordSymbolPlacementConfig {
  /** Vertical distance above staff */
  readonly staffDistance: number;
  /** Font size scale factor */
  readonly fontSizeScale: number;
  /** Minimum horizontal spacing between symbols */
  readonly minSpacing: number;
  /** Whether to align with beat positions */
  readonly alignWithBeats: boolean;
}

/**
 * Default chord symbol placement configuration.
 */
export const DEFAULT_CHORD_SYMBOL_PLACEMENT_CONFIG: ChordSymbolPlacementConfig = {
  staffDistance: 50,
  fontSizeScale: 1.2,
  minSpacing: 30,
  alignWithBeats: true,
};

/**
 * Placed chord symbol with position.
 */
export interface PlacedChordSymbol {
  readonly symbol: ChordSymbol;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Calculate placement for chord symbols.
 * Places symbols above staff aligned with beat positions.
 */
export function calculateChordSymbolPlacement(
  chordSymbols: ChordSymbol[],
  beatPositions: Map<number, number>,  // tick -> x position
  staffY: number,
  config: ChordSymbolPlacementConfig = DEFAULT_CHORD_SYMBOL_PLACEMENT_CONFIG
): PlacedChordSymbol[] {
  const placed: PlacedChordSymbol[] = [];
  
  for (const chord of chordSymbols) {
    // Find x position (align with beat or closest position)
    let x = 0;
    if (config.alignWithBeats) {
      x = beatPositions.get(chord.tick) ?? 0;
    } else {
      x = findClosestPosition(chord.tick, beatPositions);
    }
    
    // Build full symbol text (with bass note if specified)
    const fullSymbol = chord.bassNote 
      ? `${chord.symbol}/${chord.bassNote}`
      : chord.symbol;
    
    const width = estimateTextWidth(fullSymbol) * config.fontSizeScale;
    const height = 16 * config.fontSizeScale;
    
    // Check for collisions and adjust x
    for (const prev of placed) {
      if (Math.abs(x - prev.x) < (width + prev.width) / 2 + config.minSpacing) {
        x = prev.x + prev.width + config.minSpacing;
      }
    }
    
    const y = staffY - config.staffDistance;
    
    placed.push({
      symbol: chord,
      x,
      y,
      width,
      height,
    });
  }
  
  return placed;
}

/**
 * Find closest x position for a given tick.
 */
function findClosestPosition(tick: number, positions: Map<number, number>): number {
  let closestX = 0;
  let minDiff = Infinity;
  
  for (const [t, x] of positions) {
    const diff = Math.abs(t - tick);
    if (diff < minDiff) {
      minDiff = diff;
      closestX = x;
    }
  }
  
  return closestX;
}
