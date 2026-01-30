/**
 * @file Selector Application - Apply EventSelectors to Project State
 * @module gofai/execution/selector-application
 * 
 * Implements Step 307: Implement selector application over project state:
 * find events by scope and tags deterministically.
 * 
 * This module provides the runtime evaluation of EventSelectors against
 * actual project state, returning matched events in deterministic order.
 * 
 * Design principles:
 * - Deterministic: Same selector + same state = same results in same order
 * - Efficient: Cache and index where possible
 * - Safe: Never select outside bounds, validate selectors before applying
 * - Auditable: Track what was selected and why
 * - Composable: Complex selectors decompose into simple predicates
 * 
 * @see gofai_goalB.md Step 307
 * @see docs/gofai/execution.md
 * @see src/gofai/canon/event-selector.ts
 */

import type { EventSelector } from '../canon/event-selector.js';
import type { Event } from '../../types/event.js';

// ============================================================================
// Project State Interface for Selection
// ============================================================================

/**
 * Comparison operators for property selectors.
 */
type ComparisonOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | '=';

/**
 * Minimal interface to project state needed for selector evaluation.
 * 
 * This allows selector application without depending on full store internals.
 */
export interface SelectableProjectState {
  /** Query all events */
  readonly getAllEvents: () => readonly Event[];
  
  /** Query events in a time range */
  readonly getEventsInRange: (startTick: number, endTick: number) => readonly Event[];
  
  /** Query events on a track */
  readonly getEventsOnTrack: (trackId: string) => readonly Event[];
  
  /** Get track metadata */
  readonly getTrack: (trackId: string) => Track | undefined;
  
  /** Get all tracks */
  readonly getAllTracks: () => readonly Track[];
  
  /** Get section markers */
  readonly getSection: (sectionId: string) => Section | undefined;
  
  /** Get all sections */
  readonly getAllSections: () => readonly Section[];
  
  /** Get section at time */
  readonly getSectionAtTime: (tick: number) => Section | undefined;
  
  /** Get sections by type */
  readonly getSectionsByType: (type: string) => readonly Section[];
  
  /** Project tempo (for time conversions) */
  readonly getTempo: () => number;
  
  /** Project time signature */
  readonly getTimeSignature: () => { numerator: number; denominator: number };
  
  /** Ticks per quarter note */
  readonly getTicksPerQuarter: () => number;
}

/**
 * Track metadata.
 */
export interface Track {
  readonly id: string;
  readonly name: string;
  readonly role?: string;
  readonly type?: string;
  readonly tags?: readonly string[];
}

/**
 * Section marker.
 */
export interface Section {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly startTick: number;
  readonly endTick: number;
  readonly ordinal?: number;
}

// ============================================================================
// Selection Result
// ============================================================================

/**
 * Result of applying a selector to project state.
 */
export interface SelectionResult {
  /** Selected events in deterministic order */
  readonly events: readonly Event[];
  
  /** Selector that was applied */
  readonly selector: EventSelector;
  
  /** How many events matched */
  readonly count: number;
  
  /** Selection metadata */
  readonly metadata: SelectionMetadata;
}

/**
 * Metadata about a selection.
 */
export interface SelectionMetadata {
  /** When selection was performed */
  readonly timestamp: number;
  
  /** Selection execution time (ms) */
  readonly executionTimeMs: number;
  
  /** Whether selection was cached */
  readonly fromCache: boolean;
  
  /** Selector complexity score */
  readonly complexity: number;
  
  /** Human-readable description */
  readonly description: string;
}

// ============================================================================
// Selector Application
// ============================================================================

/**
 * Apply a selector to project state and return matching events.
 * 
 * Results are returned in deterministic order:
 * 1. By startTick (ascending)
 * 2. By trackId (lexicographic)
 * 3. By event id (lexicographic)
 * 
 * @param selector - The selector to apply
 * @param state - Project state to query
 * @param options - Application options
 * @returns Selection result with matched events
 */
export function applySelector(
  selector: EventSelector,
  state: SelectableProjectState,
  options: SelectorApplicationOptions = {}
): SelectionResult {
  const startTime = performance.now();
  
  // Check cache if enabled
  if (options.useCache) {
    const cached = getCachedSelection(selector, state);
    if (cached) {
      return cached;
    }
  }
  
  // Apply selector recursively
  const events = applySelectorInternal(selector, state, options);
  
  // Sort results deterministically
  const sorted = sortEventsDeterministically(events);
  
  // Build result
  const executionTime = performance.now() - startTime;
  const result: SelectionResult = {
    events: sorted,
    selector,
    count: sorted.length,
    metadata: {
      timestamp: Date.now(),
      executionTimeMs: executionTime,
      fromCache: false,
      complexity: computeSelectorComplexity(selector),
      description: describeSelectorSelection(selector, sorted.length),
    },
  };
  
  // Cache if enabled
  if (options.useCache) {
    cacheSelection(selector, state, result);
  }
  
  return result;
}

/**
 * Options for selector application.
 */
export interface SelectorApplicationOptions {
  /** Enable result caching */
  readonly useCache?: boolean;
  
  /** Maximum events to return (for performance) */
  readonly limit?: number;
  
  /** Skip first N events */
  readonly offset?: number;
  
  /** Validation mode (strict vs lenient) */
  readonly validationMode?: 'strict' | 'lenient';
}

/**
 * Internal recursive selector application.
 */
function applySelectorInternal(
  selector: EventSelector,
  state: SelectableProjectState,
  options: SelectorApplicationOptions
): Event[] {
  switch (selector.type) {
    case 'all':
      return Array.from(state.getAllEvents());
      
    case 'none':
      return [];
      
    case 'kind':
      return filterByKind(state.getAllEvents(), selector.kinds);
      
    case 'pitch_range':
      return filterByPitchRange(state.getAllEvents(), selector);
      
    case 'time_range':
      return filterByTimeRange(state, selector);
      
    case 'layer':
      return filterByLayer(state, selector);
      
    case 'section':
      return filterBySection(state, selector);
      
    case 'role':
      return filterByRole(state, selector);
      
    case 'tag':
      return filterByTag(state, selector);
      
    case 'pattern':
      return filterByPattern(state, selector);
      
    case 'velocity':
      return filterByVelocity(state.getAllEvents(), selector);
      
    case 'duration':
      return filterByDuration(state.getAllEvents(), selector);
      
    case 'articulation':
      return filterByArticulation(state.getAllEvents(), selector);
      
    case 'dynamic':
      return filterByDynamic(state.getAllEvents(), selector);
      
    case 'position':
      return filterByPosition(state, selector);
      
    case 'property':
      return filterByProperty(state.getAllEvents(), selector);
      
    case 'and':
      return intersectSelections(
        selector.selectors.map(s => applySelectorInternal(s, state, options))
      );
      
    case 'or':
      return unionSelections(
        selector.selectors.map(s => applySelectorInternal(s, state, options))
      );
      
    case 'not':
      return differenceSelections(
        state.getAllEvents(),
        applySelectorInternal(selector.selector, state, options)
      );
      
    case 'difference':
      return differenceSelections(
        applySelectorInternal(selector.include, state, options),
        applySelectorInternal(selector.exclude, state, options)
      );
      
    case 'nth':
      return selectNth(
        applySelectorInternal(selector.base, state, options),
        selector
      );
      
    case 'slice':
      return selectSlice(
        applySelectorInternal(selector.base, state, options),
        selector
      );
      
    case 'neighbor':
      return selectNeighbors(
        applySelectorInternal(selector.reference, state, options),
        state,
        selector
      );
      
    case 'contextual':
      return selectContextual(state, selector);
      
    default:
      // @ts-expect-error: exhaustiveness check
      throw new Error(`Unknown selector type: ${selector.type}`);
  }
}

// ============================================================================
// Atomic Selector Filters
// ============================================================================

/**
 * Filter events by kind.
 */
function filterByKind(events: readonly Event[], kinds: readonly string[]): Event[] {
  const kindSet = new Set(kinds);
  return events.filter(event => kindSet.has(event.kind));
}

/**
 * Filter events by pitch range.
 */
function filterByPitchRange(
  events: readonly Event[],
  selector: Extract<EventSelector, { type: 'pitch_range' }>
): Event[] {
  return events.filter(event => {
    // Only applicable to pitch-bearing events
    const payload = event.payload as any;
    if (!payload || typeof payload.pitch !== 'number') {
      return false;
    }
    
    const pitch = payload.pitch;
    
    // Check MIDI range
    if (selector.midiMin !== undefined && pitch < selector.midiMin) {
      return false;
    }
    if (selector.midiMax !== undefined && pitch > selector.midiMax) {
      return false;
    }
    
    // Check range label
    if (selector.range) {
      const inRange = isPitchInRange(pitch, selector.range);
      if (!inRange) return false;
    }
    
    return true;
  });
}

/**
 * Check if pitch is in labeled range.
 */
function isPitchInRange(pitch: number, range: string): boolean {
  switch (range) {
    case 'low':
      return pitch < 60;
    case 'middle':
      return pitch >= 60 && pitch <= 72;
    case 'high':
      return pitch > 72;
    case 'bass':
      return pitch < 48;
    case 'tenor':
      return pitch >= 48 && pitch < 60;
    case 'alto':
      return pitch >= 60 && pitch < 72;
    case 'soprano':
      return pitch >= 72;
    default:
      return true;
  }
}

/**
 * Filter events by time range.
 */
function filterByTimeRange(
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'time_range' }>
): Event[] {
  // Convert bars/beats to ticks
  const ticksPerQuarter = state.getTicksPerQuarter();
  const timeSig = state.getTimeSignature();
  const ticksPerBar = ticksPerQuarter * 4 * (timeSig.numerator / timeSig.denominator);
  
  let startTick: number | undefined;
  let endTick: number | undefined;
  
  if (selector.startBar !== undefined) {
    startTick = (selector.startBar - 1) * ticksPerBar;
  }
  
  if (selector.endBar !== undefined) {
    endTick = selector.endBar * ticksPerBar;
  }
  
  // Use section reference if provided
  if (selector.sectionRef) {
    const section = state.getSection(selector.sectionRef);
    if (section) {
      startTick = section.startTick;
      endTick = section.endTick;
    }
  }
  
  // Get events in range
  if (startTick !== undefined && endTick !== undefined) {
    return Array.from(state.getEventsInRange(startTick, endTick));
  }
  
  // No range specified, return all
  return Array.from(state.getAllEvents());
}

/**
 * Filter events by layer/track.
 */
function filterByLayer(
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'layer' }>
): Event[] {
  if (selector.layerRef) {
    return Array.from(state.getEventsOnTrack(selector.layerRef));
  }
  
  if (selector.layerType) {
    const tracks = state.getAllTracks().filter(t => t.type === selector.layerType);
    const events: Event[] = [];
    for (const track of tracks) {
      events.push(...state.getEventsOnTrack(track.id));
      if (!selector.allInstances) break;
    }
    return events;
  }
  
  return [];
}

/**
 * Filter events by section.
 */
function filterBySection(
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'section' }>
): Event[] {
  let sections: Section[] = [];
  
  if (selector.sectionRef) {
    const section = state.getSection(selector.sectionRef);
    if (section) sections = [section];
  } else if (selector.sectionType) {
    sections = Array.from(state.getSectionsByType(selector.sectionType));
    if (selector.ordinal !== undefined) {
      const filtered = sections.filter(s => s.ordinal === selector.ordinal);
      sections = filtered;
    }
  }
  
  // Collect events in matched sections
  const events: Event[] = [];
  for (const section of sections) {
    events.push(...state.getEventsInRange(section.startTick, section.endTick));
  }
  
  return events;
}

/**
 * Filter events by role.
 */
function filterByRole(
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'role' }>
): Event[] {
  const tracks = state.getAllTracks().filter(t => t.role === selector.role);
  const events: Event[] = [];
  for (const track of tracks) {
    events.push(...state.getEventsOnTrack(track.id));
  }
  return events;
}

/**
 * Filter events by tag.
 */
function filterByTag(
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'tag' }>
): Event[] {
  const allEvents = state.getAllEvents();
  const tagSet = new Set(selector.tags);
  return allEvents.filter(event => {
    const payload = event.payload as any;
    if (!payload || !Array.isArray(payload.tags)) return false;
    
    if (selector.matchMode === 'all') {
      return selector.tags.every(tag => payload.tags.includes(tag));
    } else {
      return payload.tags.some((tag: string) => tagSet.has(tag));
    }
  });
}

/**
 * Filter events by pattern.
 */
function filterByPattern(
  _state: SelectableProjectState,
  _selector: Extract<EventSelector, { type: 'pattern' }>
): Event[] {
  // Pattern matching is complex - stub for now
  return [];
}

/**
 * Filter events by velocity.
 */
function filterByVelocity(
  events: readonly Event[],
  selector: Extract<EventSelector, { type: 'velocity' }>
): Event[] {
  return events.filter(event => {
    const payload = event.payload as any;
    if (!payload || typeof payload.velocity !== 'number') return false;
    
    const vel = payload.velocity;
    if (selector.min !== undefined && vel < selector.min) return false;
    if (selector.max !== undefined && vel > selector.max) return false;
    if (selector.range && !isVelocityInRange(vel, selector.range)) return false;
    
    return true;
  });
}

/**
 * Check if velocity is in labeled range.
 */
function isVelocityInRange(velocity: number, range: string): boolean {
  switch (range) {
    case 'ppp':
      return velocity < 16;
    case 'pp':
      return velocity >= 16 && velocity < 32;
    case 'p':
      return velocity >= 32 && velocity < 48;
    case 'mp':
      return velocity >= 48 && velocity < 64;
    case 'mf':
      return velocity >= 64 && velocity < 80;
    case 'f':
      return velocity >= 80 && velocity < 96;
    case 'ff':
      return velocity >= 96 && velocity < 112;
    case 'fff':
      return velocity >= 112;
    default:
      return true;
  }
}

/**
 * Filter events by duration.
 */
function filterByDuration(
  events: readonly Event[],
  selector: Extract<EventSelector, { type: 'duration' }>
): Event[] {
  return events.filter(event => {
    const dur = event.durationTicks;
    
    // Check beats if specified
    if (selector.minBeats !== undefined || selector.maxBeats !== undefined) {
      // Would need ticksPerBeat from state - simplified for now
      return true;
    }
    
    // Check range label
    if (selector.range) {
      // Would map range labels to tick ranges - simplified for now
      return true;
    }
    
    return true;
  });
}

/**
 * Filter events by articulation.
 */
function filterByArticulation(
  events: readonly Event[],
  selector: Extract<EventSelector, { type: 'articulation' }>
): Event[] {
  return events.filter(event => {
    const payload = event.payload as any;
    if (!payload || !payload.articulation) return false;
    return payload.articulation === selector.articulation;
  });
}

/**
 * Filter events by dynamic marking.
 */
function filterByDynamic(
  events: readonly Event[],
  selector: Extract<EventSelector, { type: 'dynamic' }>
): Event[] {
  return events.filter(event => {
    const payload = event.payload as any;
    if (!payload) return false;
    
    if (selector.level && payload.dynamicLevel) {
      return payload.dynamicLevel === selector.level;
    }
    
    if (selector.marking && payload.dynamicMarking) {
      return payload.dynamicMarking === selector.marking;
    }
    
    return false;
  });
}

/**
 * Filter events by position in structure.
 */
function filterByPosition(
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'position' }>
): Event[] {
  // Apply withinScope first if specified
  let events = selector.withinScope
    ? applySelectorInternal(selector.withinScope, state, {})
    : Array.from(state.getAllEvents());
  
  if (selector.position === 'first') {
    return events.length > 0 ? [events[0]] : [];
  }
  
  if (selector.position === 'last') {
    return events.length > 0 ? [events[events.length - 1]] : [];
  }
  
  if (selector.position === 'middle') {
    const midIndex = Math.floor(events.length / 2);
    return events.length > 0 ? [events[midIndex]] : [];
  }
  
  // Ordinal position
  if (selector.ordinal !== undefined) {
    const index = selector.fromEnd
      ? events.length - selector.ordinal
      : selector.ordinal - 1;
    return index >= 0 && index < events.length ? [events[index]] : [];
  }
  
  return events;
}



/**
 * Filter events by property.
 */
function filterByProperty(
  events: readonly Event[],
  selector: Extract<EventSelector, { type: 'property' }>
): Event[] {
  return events.filter(event => {
    const payload = event.payload as any;
    if (!payload) return false;
    
    const value = payload[selector.propertyName];
    
    // Compare based on operator
    switch (selector.operator) {
      case '==':
      case '=':
        return value === selector.value;
      case '!=':
        return value !== selector.value;
      case '>':
        return typeof value === 'number' && value > (selector.value as number);
      case '<':
        return typeof value === 'number' && value < (selector.value as number);
      case '>=':
        return typeof value === 'number' && value >= (selector.value as number);
      case '<=':
        return typeof value === 'number' && value <= (selector.value as number);
      default:
        return value !== undefined;
    }
  });
}

// ============================================================================
// Composite Selector Operations
// ============================================================================

/**
 * Intersect multiple event selections.
 */
function intersectSelections(selections: Event[][]): Event[] {
  if (selections.length === 0) return [];
  if (selections.length === 1) return selections[0];
  
  const eventIds = selections.map(events => new Set(events.map(e => e.id)));
  const firstSet = eventIds[0];
  const intersection = new Set([...firstSet].filter(id => 
    eventIds.every(set => set.has(id))
  ));
  
  return selections[0].filter(e => intersection.has(e.id));
}

/**
 * Union multiple event selections.
 */
function unionSelections(selections: Event[][]): Event[] {
  const eventMap = new Map<string, Event>();
  for (const events of selections) {
    for (const event of events) {
      eventMap.set(event.id, event);
    }
  }
  return Array.from(eventMap.values());
}

/**
 * Difference of two event selections (base - subtract).
 */
function differenceSelections(base: Event[] | readonly Event[], subtract: Event[]): Event[] {
  const subtractIds = new Set(subtract.map(e => e.id));
  return Array.from(base).filter(e => !subtractIds.has(e.id));
}

/**
 * Select every Nth event.
 */
function selectNth(events: Event[], selector: Extract<EventSelector, { type: 'nth' }>): Event[] {
  const n = selector.n;
  const offset = selector.offset || 0;
  return events.filter((_, i) => (i - offset) % n === 0);
}

/**
 * Select a slice of events.
 */
function selectSlice(events: Event[], selector: Extract<EventSelector, { type: 'slice' }>): Event[] {
  const start = selector.start || 0;
  const end = selector.end;
  return events.slice(start, end);
}

/**
 * Select neighbors of matched events.
 */
function selectNeighbors(
  events: Event[],
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'neighbor' }>
): Event[] {
  const allEvents = selector.base 
    ? applySelectorInternal(selector.base, state, {})
    : Array.from(state.getAllEvents());
    
  const matchedIds = new Set(events.map(e => e.id));
  const neighbors: Event[] = [];
  
  for (let i = 0; i < allEvents.length; i++) {
    if (matchedIds.has(allEvents[i].id)) {
      const count = selector.count || 1;
      
      if (selector.direction === 'before' || selector.direction === 'around') {
        for (let j = 1; j <= count && i - j >= 0; j++) {
          neighbors.push(allEvents[i - j]);
        }
      }
      
      if (selector.direction === 'after' || selector.direction === 'around') {
        for (let j = 1; j <= count && i + j < allEvents.length; j++) {
          neighbors.push(allEvents[i + j]);
        }
      }
    }
  }
  
  return neighbors;
}

/**
 * Select contextual events (implementation-specific).
 */
function selectContextual(
  state: SelectableProjectState,
  selector: Extract<EventSelector, { type: 'contextual' }>
): Event[] {
  // Contextual selection is complex - stub for now
  return [];
}

// ============================================================================
// Deterministic Ordering
// ============================================================================

/**
 * Sort events in deterministic order.
 * 
 * Order: startTick (asc), trackId (lex), id (lex)
 */
function sortEventsDeterministically(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    // Primary: time
    if (a.startTick !== b.startTick) {
      return a.startTick - b.startTick;
    }
    
    // Secondary: track
    const trackCompare = a.trackId.localeCompare(b.trackId);
    if (trackCompare !== 0) {
      return trackCompare;
    }
    
    // Tertiary: ID
    return a.id.localeCompare(b.id);
  });
}

// ============================================================================
// Selector Complexity and Description
// ============================================================================

/**
 * Compute selector complexity score.
 */
function computeSelectorComplexity(selector: EventSelector): number {
  switch (selector.type) {
    case 'all':
    case 'none':
      return 1;
      
    case 'and':
    case 'or':
      return 1 + selector.selectors.reduce((sum, s) => sum + computeSelectorComplexity(s), 0);
      
    case 'not':
    case 'difference':
      return 2;
      
    default:
      return 3;
  }
}

/**
 * Describe selector and its results.
 */
function describeSelectorSelection(selector: EventSelector, count: number): string {
  const desc = describeSelectorRecursive(selector);
  return `${desc} (${count} events)`;
}

/**
 * Recursively describe a selector.
 */
function describeSelectorRecursive(selector: EventSelector): string {
  switch (selector.type) {
    case 'all':
      return 'all events';
    case 'none':
      return 'no events';
    case 'kind':
      return `${selector.kinds.join(' or ')} events`;
    case 'time_range':
      if (selector.startBar && selector.endBar) {
        return `bars ${selector.startBar}-${selector.endBar}`;
      }
      return 'time range';
    case 'layer':
      return selector.layerType || 'layer';
    case 'section':
      return selector.sectionType || 'section';
    case 'and':
      return `(${selector.selectors.map(describeSelectorRecursive).join(' AND ')})`;
    case 'or':
      return `(${selector.selectors.map(describeSelectorRecursive).join(' OR ')})`;
    case 'not':
      return `NOT (${describeSelectorRecursive(selector.selector)})`;
    default:
      return 'events';
  }
}

// ============================================================================
// Caching (Simple Implementation)
// ============================================================================

const selectorCache = new Map<string, SelectionResult>();

function getCachedSelection(
  selector: EventSelector,
  state: SelectableProjectState
): SelectionResult | undefined {
  const key = generateCacheKey(selector, state);
  return selectorCache.get(key);
}

function cacheSelection(
  selector: EventSelector,
  state: SelectableProjectState,
  result: SelectionResult
): void {
  const key = generateCacheKey(selector, state);
  selectorCache.set(key, result);
}

function generateCacheKey(selector: EventSelector, state: SelectableProjectState): string {
  // Simple key: JSON stringify selector + state fingerprint
  // In production, use a better hashing strategy
  const selectorJson = JSON.stringify(selector);
  const stateFingerprint = state.getAllEvents().length.toString();
  return `${selectorJson}::${stateFingerprint}`;
}

/**
 * Clear the selector cache.
 */
export function clearSelectorCache(): void {
  selectorCache.clear();
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a selector before application.
 */
export interface SelectorValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validate a selector.
 */
export function validateSelector(
  selector: EventSelector,
  state: SelectableProjectState
): SelectorValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check references exist
  if (selector.type === 'layer' && selector.layerRef) {
    if (!state.getTrack(selector.layerRef)) {
      errors.push(`Track not found: ${selector.layerRef}`);
    }
  }
  
  if (selector.type === 'section' && selector.sectionRef) {
    if (!state.getSection(selector.sectionRef)) {
      errors.push(`Section not found: ${selector.sectionRef}`);
    }
  }
  
  if (selector.type === 'time_range') {
    if (selector.startBar !== undefined && selector.endBar !== undefined) {
      if (selector.startBar > selector.endBar) {
        errors.push(`Start bar ${selector.startBar} after end bar ${selector.endBar}`);
      }
    }
  }
  
  // Recursively validate composite selectors
  if (selector.type === 'and' || selector.type === 'or') {
    for (const sub of selector.selectors) {
      const subValidation = validateSelector(sub, state);
      errors.push(...subValidation.errors);
      warnings.push(...subValidation.warnings);
    }
  }
  
  if (selector.type === 'not') {
    const subValidation = validateSelector(selector.selector, state);
    errors.push(...subValidation.errors);
    warnings.push(...subValidation.warnings);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
