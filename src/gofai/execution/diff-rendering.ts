/**
 * @file Diff Rendering Helpers (Step 326)
 * @module gofai/execution/diff-rendering
 * 
 * Implements Step 326: Implement diff rendering helpers: convert low-level diffs
 * into human summary sentences ("Chorus: hats density +20%").
 * 
 * This module transforms structured diffs into natural language summaries that
 * musicians can read and understand without diving into technical details.
 * 
 * Design principles:
 * - Human-first: Use musical terminology, not technical jargon
 * - Hierarchical: Provide summary, section, and detail levels
 * - Context-aware: Use section names, instrument roles, musical terms
 * - Concise: One line per significant change
 * - Precise: Include numbers and specifics when relevant
 * - Locatable: Reference specific locations (bars, sections, tracks)
 * 
 * Summary levels:
 * - One-line: "Modified 12 events across chorus and verse"
 * - Section: "Chorus: hats density +20%, kick timing tightened"
 * - Detail: "Chorus bars 9-16: hi-hats density 45% → 65% (+20%), kick quantized to 16th grid"
 * - Full: Complete technical diff with IDs and parameters
 * 
 * @see gofai_goalB.md Step 326
 * @see gofai_goalB.md Step 328 (explanation generator)
 * @see docs/gofai/diff-rendering.md
 */

import type { CanonicalDiff, DiffSummary } from './diff-model.js';
import type { Scope } from './edit-package.js';

// ============================================================================
// Summary Types
// ============================================================================

/**
 * Human-readable diff summary at various detail levels.
 */
export interface DiffRendering {
  /** One-line summary */
  readonly oneLine: string;
  
  /** Section-level summaries */
  readonly bySection: readonly SectionSummary[];
  
  /** Layer-level summaries */
  readonly byLayer: readonly LayerSummary[];
  
  /** Detailed change descriptions */
  readonly detailed: readonly DetailedChange[];
  
  /** Full technical report */
  readonly technical: string;
}

/**
 * Summary for a section.
 */
export interface SectionSummary {
  /** Section ID */
  readonly sectionId: string;
  
  /** Section name */
  readonly sectionName: string;
  
  /** Bar range */
  readonly barRange: { start: number; end: number };
  
  /** One-line summary for this section */
  readonly summary: string;
  
  /** Changes in this section */
  readonly changes: readonly string[];
  
  /** Change count */
  readonly changeCount: number;
}

/**
 * Summary for a layer (track/role).
 */
export interface LayerSummary {
  /** Track ID */
  readonly trackId: string;
  
  /** Track name */
  readonly trackName: string;
  
  /** Musical role (drums, bass, melody, etc.) */
  readonly role?: string;
  
  /** One-line summary for this layer */
  readonly summary: string;
  
  /** Changes in this layer */
  readonly changes: readonly string[];
  
  /** Change count */
  readonly changeCount: number;
}

/**
 * Detailed change description.
 */
export interface DetailedChange {
  /** Location description */
  readonly location: string;
  
  /** What changed */
  readonly what: string;
  
  /** How it changed */
  readonly how: string;
  
  /** Numeric details (if applicable) */
  readonly numbers?: {
    readonly before: number | string;
    readonly after: number | string;
    readonly delta?: number | string;
  };
  
  /** Which goal this served */
  readonly servedGoals?: readonly string[];
  
  /** Technical ref (for power users) */
  readonly technicalRef?: string;
}

// ============================================================================
// Main Rendering Function
// ============================================================================

/**
 * Render a diff into human-readable summaries at multiple levels.
 */
export function renderDiff(diff: CanonicalDiff): DiffRendering {
  const oneLine = generateOneLine(diff);
  const bySection = generateSectionSummaries(diff);
  const byLayer = generateLayerSummaries(diff);
  const detailed = generateDetailedChanges(diff);
  const technical = generateTechnicalReport(diff);
  
  return {
    oneLine,
    bySection,
    byLayer,
    detailed,
    technical,
  };
}

/**
 * Generate one-line summary of entire diff.
 */
function generateOneLine(diff: CanonicalDiff): string {
  const summary = diff.summary;
  
  if (summary.totalChanges === 0) {
    return 'No changes';
  }
  
  const parts: string[] = [];
  
  // Entity counts
  const entityParts: string[] = [];
  if (summary.affectedEntities.events > 0) {
    entityParts.push(`${summary.affectedEntities.events} event${summary.affectedEntities.events !== 1 ? 's' : ''}`);
  }
  if (summary.affectedEntities.tracks > 0) {
    entityParts.push(`${summary.affectedEntities.tracks} track${summary.affectedEntities.tracks !== 1 ? 's' : ''}`);
  }
  if (summary.affectedEntities.cards > 0) {
    entityParts.push(`${summary.affectedEntities.cards} card${summary.affectedEntities.cards !== 1 ? 's' : ''}`);
  }
  if (summary.affectedEntities.sections > 0) {
    entityParts.push(`${summary.affectedEntities.sections} section${summary.affectedEntities.sections !== 1 ? 's' : ''}`);
  }
  
  if (entityParts.length > 0) {
    parts.push(`Modified ${entityParts.join(', ')}`);
  }
  
  // Change types
  if (summary.additions > 0) {
    parts.push(`${summary.additions} added`);
  }
  if (summary.removals > 0) {
    parts.push(`${summary.removals} removed`);
  }
  if (summary.modifications > 0) {
    parts.push(`${summary.modifications} modified`);
  }
  
  // If we have section info, add it
  const sectionNames = extractAffectedSectionNames(diff);
  if (sectionNames.length > 0 && sectionNames.length <= 3) {
    parts.push(`in ${sectionNames.join(', ')}`);
  } else if (sectionNames.length > 3) {
    parts.push(`across ${sectionNames.length} sections`);
  }
  
  return parts.join('; ');
}

/**
 * Extract names of affected sections from diff.
 */
function extractAffectedSectionNames(diff: CanonicalDiff): string[] {
  const names = new Set<string>();
  
  // Get section names from section changes
  for (const section of diff.sections.modified) {
    names.add(section.name || section.id);
  }
  
  // Get section names from event changes (if events have section info)
  // This would require reverse lookup from events to sections
  // For now, just use direct section changes
  
  return Array.from(names).sort();
}

/**
 * Generate section-level summaries.
 */
function generateSectionSummaries(diff: CanonicalDiff): readonly SectionSummary[] {
  const summaries: SectionSummary[] = [];
  
  // Group changes by section
  const changesBySection = groupChangesBySection(diff);
  
  for (const [sectionId, changes] of changesBySection.entries()) {
    const section = findSection(diff, sectionId);
    if (!section) continue;
    
    const sectionChanges = changes.map(change => describeChange(change));
    const summary = summarizeChangesForSection(sectionChanges);
    
    summaries.push({
      sectionId,
      sectionName: section.name || sectionId,
      barRange: calculateBarRange(section),
      summary,
      changes: sectionChanges,
      changeCount: changes.length,
    });
  }
  
  return summaries.sort((a, b) => a.barRange.start - b.barRange.start);
}

/**
 * Group changes by section.
 */
function groupChangesBySection(diff: CanonicalDiff): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  
  // Events belong to sections based on timing
  for (const event of diff.events.modified) {
    const sectionId = inferSectionForEvent(event, diff);
    if (!groups.has(sectionId)) {
      groups.set(sectionId, []);
    }
    groups.get(sectionId)!.push({ type: 'event', data: event });
  }
  
  // Direct section changes
  for (const section of diff.sections.modified) {
    if (!groups.has(section.id)) {
      groups.set(section.id, []);
    }
    groups.get(section.id)!.push({ type: 'section', data: section });
  }
  
  return groups;
}

/**
 * Find section in diff snapshots.
 */
function findSection(diff: CanonicalDiff, sectionId: string): any {
  const after = diff.after.sections.find(s => s.id === sectionId);
  if (after) return after;
  
  const before = diff.before.sections.find(s => s.id === sectionId);
  return before;
}

/**
 * Infer which section an event belongs to.
 */
function inferSectionForEvent(event: any, diff: CanonicalDiff): string {
  // Look at event start time and match to sections
  const startTick = event.startTick || 0;
  
  for (const section of diff.after.sections) {
    if (startTick >= section.startTick && startTick < section.endTick) {
      return section.id;
    }
  }
  
  return 'unknown';
}

/**
 * Calculate bar range for a section.
 */
function calculateBarRange(section: any): { start: number; end: number } {
  // Convert ticks to bars (assuming 480 ticks per quarter, 4 quarters per bar)
  const ticksPerBar = 480 * 4;
  
  const startBar = Math.floor(section.startTick / ticksPerBar);
  const endBar = Math.ceil(section.endTick / ticksPerBar);
  
  return { start: startBar, end: endBar };
}

/**
 * Describe a single change in natural language.
 */
function describeChange(change: any): string {
  if (change.type === 'event') {
    return describeEventChange(change.data);
  }
  if (change.type === 'section') {
    return describeSectionChange(change.data);
  }
  if (change.type === 'track') {
    return describeTrackChange(change.data);
  }
  if (change.type === 'card') {
    return describeCardChange(change.data);
  }
  
  return 'Unknown change';
}

/**
 * Describe an event change.
 */
function describeEventChange(event: any): string {
  // Analyze what changed about the event
  const parts: string[] = [];
  
  // Pitch changes
  if (event.pitchDelta) {
    const semitones = event.pitchDelta;
    const direction = semitones > 0 ? 'up' : 'down';
    parts.push(`pitch shifted ${direction} ${Math.abs(semitones)} semitones`);
  }
  
  // Timing changes
  if (event.timingDelta) {
    const ticks = event.timingDelta;
    parts.push(`timing adjusted ${ticks > 0 ? '+' : ''}${ticks} ticks`);
  }
  
  // Velocity changes
  if (event.velocityDelta) {
    const delta = event.velocityDelta;
    parts.push(`velocity ${delta > 0 ? '+' : ''}${delta}`);
  }
  
  // Duration changes
  if (event.durationDelta) {
    const delta = event.durationDelta;
    parts.push(`duration ${delta > 0 ? 'extended' : 'shortened'} by ${Math.abs(delta)} ticks`);
  }
  
  if (parts.length === 0) {
    return 'modified';
  }
  
  return parts.join(', ');
}

/**
 * Describe a section change.
 */
function describeSectionChange(section: any): string {
  const parts: string[] = [];
  
  if (section.nameDelta) {
    parts.push(`renamed to "${section.nameDelta.after}"`);
  }
  
  if (section.lengthDelta) {
    const bars = Math.round(section.lengthDelta / (480 * 4));
    parts.push(`${bars > 0 ? 'extended' : 'shortened'} by ${Math.abs(bars)} bars`);
  }
  
  if (parts.length === 0) {
    return 'modified';
  }
  
  return parts.join(', ');
}

/**
 * Describe a track change.
 */
function describeTrackChange(track: any): string {
  const parts: string[] = [];
  
  if (track.gainDelta) {
    const db = Math.round(track.gainDelta * 10) / 10;
    parts.push(`gain ${db > 0 ? '+' : ''}${db}dB`);
  }
  
  if (track.panDelta) {
    const pan = Math.round(track.panDelta * 100);
    const direction = pan > 0 ? 'right' : 'left';
    parts.push(`pan ${Math.abs(pan)}% ${direction}`);
  }
  
  if (track.mutedDelta !== undefined) {
    parts.push(track.mutedDelta.after ? 'muted' : 'unmuted');
  }
  
  if (parts.length === 0) {
    return 'modified';
  }
  
  return parts.join(', ');
}

/**
 * Describe a card change.
 */
function describeCardChange(card: any): string {
  const parts: string[] = [];
  
  if (card.parameterChanges) {
    for (const [param, delta] of Object.entries(card.parameterChanges)) {
      parts.push(describeParameterChange(param, delta));
    }
  }
  
  if (card.bypassedDelta !== undefined) {
    parts.push(card.bypassedDelta.after ? 'bypassed' : 'enabled');
  }
  
  if (parts.length === 0) {
    return 'modified';
  }
  
  return parts.join(', ');
}

/**
 * Describe a parameter change.
 */
function describeParameterChange(param: string, delta: any): string {
  const before = delta.before;
  const after = delta.after;
  
  // Format based on parameter type
  if (typeof after === 'number' && typeof before === 'number') {
    const change = after - before;
    const percent = Math.round((change / before) * 100);
    
    if (Math.abs(percent) < 5) {
      return `${param} adjusted`;
    }
    
    return `${param} ${change > 0 ? '+' : ''}${percent}%`;
  }
  
  if (typeof after === 'boolean') {
    return `${param} ${after ? 'enabled' : 'disabled'}`;
  }
  
  return `${param} changed to ${after}`;
}

/**
 * Summarize multiple changes for a section.
 */
function summarizeChangesForSection(changes: readonly string[]): string {
  if (changes.length === 0) {
    return 'No changes';
  }
  
  if (changes.length === 1) {
    return changes[0];
  }
  
  if (changes.length <= 3) {
    return changes.join('; ');
  }
  
  // Group similar changes
  const groups = groupSimilarChanges(changes);
  return groups.join('; ');
}

/**
 * Group similar changes together.
 */
function groupSimilarChanges(changes: readonly string[]): string[] {
  // Simple heuristic: group by keyword
  const groups = new Map<string, number>();
  
  for (const change of changes) {
    const keyword = extractKeyword(change);
    groups.set(keyword, (groups.get(keyword) || 0) + 1);
  }
  
  const result: string[] = [];
  for (const [keyword, count] of groups.entries()) {
    if (count === 1) {
      // Find the full change text
      const full = changes.find(c => extractKeyword(c) === keyword);
      if (full) result.push(full);
    } else {
      result.push(`${count} ${keyword} changes`);
    }
  }
  
  return result;
}

/**
 * Extract keyword from change description.
 */
function extractKeyword(change: string): string {
  const words = change.split(' ');
  return words[0] || 'unknown';
}

/**
 * Generate layer-level summaries.
 */
function generateLayerSummaries(diff: CanonicalDiff): readonly LayerSummary[] {
  const summaries: LayerSummary[] = [];
  
  // Group changes by track
  const changesByTrack = groupChangesByTrack(diff);
  
  for (const [trackId, changes] of changesByTrack.entries()) {
    const track = findTrack(diff, trackId);
    if (!track) continue;
    
    const trackChanges = changes.map(change => describeChange(change));
    const summary = summarizeChangesForLayer(trackChanges);
    
    summaries.push({
      trackId,
      trackName: track.name || trackId,
      role: inferTrackRole(track),
      summary,
      changes: trackChanges,
      changeCount: changes.length,
    });
  }
  
  return summaries;
}

/**
 * Group changes by track.
 */
function groupChangesByTrack(diff: CanonicalDiff): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  
  // Events belong to tracks
  for (const event of diff.events.modified) {
    const trackId = event.trackId || 'unknown';
    if (!groups.has(trackId)) {
      groups.set(trackId, []);
    }
    groups.get(trackId)!.push({ type: 'event', data: event });
  }
  
  // Track changes
  for (const track of diff.tracks.modified) {
    if (!groups.has(track.id)) {
      groups.set(track.id, []);
    }
    groups.get(track.id)!.push({ type: 'track', data: track });
  }
  
  // Card changes (belong to tracks)
  for (const card of diff.cards.modified) {
    const trackId = card.trackId || 'unknown';
    if (!groups.has(trackId)) {
      groups.set(trackId, []);
    }
    groups.get(trackId)!.push({ type: 'card', data: card });
  }
  
  return groups;
}

/**
 * Find track in diff snapshots.
 */
function findTrack(diff: CanonicalDiff, trackId: string): any {
  const after = diff.after.tracks.find(t => t.id === trackId);
  if (after) return after;
  
  const before = diff.before.tracks.find(t => t.id === trackId);
  return before;
}

/**
 * Infer musical role of a track.
 */
function inferTrackRole(track: any): string | undefined {
  const name = (track.name || '').toLowerCase();
  
  if (name.includes('kick') || name.includes('bass drum')) return 'drums';
  if (name.includes('snare')) return 'drums';
  if (name.includes('hat')) return 'drums';
  if (name.includes('drum')) return 'drums';
  
  if (name.includes('bass')) return 'bass';
  
  if (name.includes('lead') || name.includes('melody')) return 'melody';
  
  if (name.includes('chord') || name.includes('harmony')) return 'harmony';
  
  if (name.includes('pad')) return 'pad';
  
  if (name.includes('fx') || name.includes('effect')) return 'fx';
  
  return undefined;
}

/**
 * Summarize changes for a layer.
 */
function summarizeChangesForLayer(changes: readonly string[]): string {
  return summarizeChangesForSection(changes);
}

/**
 * Generate detailed change descriptions.
 */
function generateDetailedChanges(diff: CanonicalDiff): readonly DetailedChange[] {
  const details: DetailedChange[] = [];
  
  // Event changes
  for (const event of diff.events.modified) {
    details.push(generateDetailedEventChange(event, diff));
  }
  
  // Track changes
  for (const track of diff.tracks.modified) {
    details.push(generateDetailedTrackChange(track, diff));
  }
  
  // Card changes
  for (const card of diff.cards.modified) {
    details.push(generateDetailedCardChange(card, diff));
  }
  
  return details;
}

/**
 * Generate detailed description of an event change.
 */
function generateDetailedEventChange(event: any, diff: CanonicalDiff): DetailedChange {
  const track = findTrack(diff, event.trackId);
  const section = inferSectionForEvent(event, diff);
  
  const location = formatLocation(section, track, event);
  const what = 'Event';
  const how = describeEventChange(event);
  
  return {
    location,
    what,
    how,
    technicalRef: event.id,
  };
}

/**
 * Generate detailed description of a track change.
 */
function generateDetailedTrackChange(track: any, diff: CanonicalDiff): DetailedChange {
  const location = `Track "${track.name || track.id}"`;
  const what = 'Track properties';
  const how = describeTrackChange(track);
  
  return {
    location,
    what,
    how,
    technicalRef: track.id,
  };
}

/**
 * Generate detailed description of a card change.
 */
function generateDetailedCardChange(card: any, diff: CanonicalDiff): DetailedChange {
  const track = findTrack(diff, card.trackId);
  const location = `Card on "${track?.name || card.trackId}"`;
  const what = card.type || 'Card';
  const how = describeCardChange(card);
  
  return {
    location,
    what,
    how,
    technicalRef: card.id,
  };
}

/**
 * Format a location description.
 */
function formatLocation(section: any, track: any, event: any): string {
  const parts: string[] = [];
  
  if (section && section !== 'unknown') {
    const sectionObj = typeof section === 'string' ? { name: section } : section;
    parts.push(sectionObj.name || sectionObj.id || section);
  }
  
  if (track) {
    parts.push(track.name || track.id);
  }
  
  if (event.startTick !== undefined) {
    const bar = Math.floor(event.startTick / (480 * 4));
    parts.push(`bar ${bar}`);
  }
  
  return parts.join(', ');
}

/**
 * Generate technical report.
 */
function generateTechnicalReport(diff: CanonicalDiff): string {
  const lines: string[] = [
    'Technical Diff Report',
    '='.repeat(50),
    '',
    `Total changes: ${diff.summary.totalChanges}`,
    `Additions: ${diff.summary.additions}`,
    `Modifications: ${diff.summary.modifications}`,
    `Removals: ${diff.summary.removals}`,
    '',
    'Affected Entities:',
    `  Events: ${diff.summary.affectedEntities.events}`,
    `  Tracks: ${diff.summary.affectedEntities.tracks}`,
    `  Cards: ${diff.summary.affectedEntities.cards}`,
    `  Sections: ${diff.summary.affectedEntities.sections}`,
    `  Routing: ${diff.summary.affectedEntities.routing}`,
    '',
  ];
  
  // Event details
  if (diff.events.modified.length > 0) {
    lines.push('Event Changes:');
    for (const event of diff.events.modified) {
      lines.push(`  ${event.id}: ${describeEventChange(event)}`);
    }
    lines.push('');
  }
  
  // Track details
  if (diff.tracks.modified.length > 0) {
    lines.push('Track Changes:');
    for (const track of diff.tracks.modified) {
      lines.push(`  ${track.id}: ${describeTrackChange(track)}`);
    }
    lines.push('');
  }
  
  // Card details
  if (diff.cards.modified.length > 0) {
    lines.push('Card Changes:');
    for (const card of diff.cards.modified) {
      lines.push(`  ${card.id}: ${describeCardChange(card)}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

// ============================================================================
// Exports
// ============================================================================

export type {
  DiffRendering,
  SectionSummary,
  LayerSummary,
  DetailedChange,
};

export {
  renderDiff,
};
