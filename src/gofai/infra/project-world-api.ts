/**
 * GOFAI Infrastructure — Project World API
 *
 * Step 010 from gofai_goalB.md: "Identify the minimal 'project world API'
 * needed by GOFAI (section markers, tracks/layers, card registry, selected
 * range, undo stack)."
 *
 * This module defines the abstract interface to CardPlay's project world state
 * that GOFAI needs to access for compilation, planning, and execution. It is
 * intentionally minimal to decouple GOFAI from internal implementation details.
 *
 * ## Design Principles
 *
 * 1. **Read-only by default**: Most GOFAI stages (NL, semantics, pragmatics,
 *    planning) only READ world state. Only execution writes.
 * 2. **Stable abstractions**: These interfaces should not change when internal
 *    CardPlay implementation changes.
 * 3. **Explicit dependencies**: GOFAI explicitly declares what it needs,
 *    making testing and mocking easier.
 * 4. **Deterministic**: All queries return deterministic results (stable
 *    ordering, no side effects).
 *
 * @module gofai/infra/project-world-api
 */

import type { Event } from '../../types/event';
import type { TrackId } from '../../tracker/types';

// Placeholder types for CardId and ContainerId until proper exports exist
export type CardId = string & { readonly __brand: 'CardId' };
export type ContainerId = string & { readonly __brand: 'ContainerId' };

// =============================================================================
// Core Project World API
// =============================================================================

/**
 * The minimal project world API that GOFAI needs.
 *
 * This is the abstract interface GOFAI uses to query project state.
 * Different implementations can be provided (real project, test fixture, etc.).
 */
export interface ProjectWorldAPI {
  // ===== Section and Structure =====
  
  /**
   * Get all section markers in the project.
   * Returns markers in chronological order.
   */
  getSectionMarkers(): readonly SectionMarker[];
  
  /**
   * Get section marker by name (e.g., "Verse 1", "Chorus").
   * Returns undefined if not found.
   */
  getSectionMarkerByName(name: string): SectionMarker | undefined;
  
  /**
   * Get section marker at a specific time position.
   * Returns the section that contains this position.
   */
  getSectionMarkerAtPosition(positionTicks: number): SectionMarker | undefined;
  
  /**
   * Get all section names in chronological order.
   */
  getSectionNames(): readonly string[];
  
  // ===== Tracks and Layers =====
  
  /**
   * Get all tracks in the project.
   * Returns tracks in display order.
   */
  getTracks(): readonly Track[];
  
  /**
   * Get track by ID.
   * Returns undefined if not found.
   */
  getTrackById(id: TrackId): Track | undefined;
  
  /**
   * Get track by name.
   * Returns undefined if not found.
   */
  getTrackByName(name: string): Track | undefined;
  
  /**
   * Get tracks matching a role (e.g., "drums", "bass", "pad").
   * Returns all tracks with that role tag.
   */
  getTracksByRole(role: string): readonly Track[];
  
  /**
   * Get tracks matching a tag.
   */
  getTracksByTag(tag: string): readonly Track[];
  
  // ===== Events =====
  
  /**
   * Get all events in the project.
   * Returns events in chronological order.
   */
  getEvents(): readonly Event<unknown>[];
  
  /**
   * Get events in a specific time range.
   */
  getEventsInRange(startTicks: number, endTicks: number): readonly Event<unknown>[];
  
  /**
   * Get events on a specific track.
   */
  getEventsOnTrack(trackId: TrackId): readonly Event<unknown>[];
  
  /**
   * Get events matching a selector.
   */
  getEventsMatchingSelector(selector: EventSelector): readonly Event<unknown>[];
  
  // ===== Cards and Routing =====
  
  /**
   * Get all cards in the project.
   * Returns cards in topology order.
   */
  getCards(): readonly CardInstance[];
  
  /**
   * Get card by ID.
   */
  getCardById(cardId: CardId): CardInstance | undefined;
  
  /**
   * Get cards of a specific type.
   */
  getCardsByType(cardTypeId: string): readonly CardInstance[];
  
  /**
   * Get cards on a specific track.
   */
  getCardsOnTrack(trackId: TrackId): readonly CardInstance[];
  
  /**
   * Get card parameter value.
   */
  getCardParam(cardId: CardId, paramName: string): unknown;
  
  // ===== Selection and Focus =====
  
  /**
   * Get current selection (time range).
   */
  getSelection(): TimeSelection | undefined;
  
  /**
   * Get current focused deck (if any).
   */
  getFocusedDeck(): string | undefined;
  
  /**
   * Get current focused track (if any).
   */
  getFocusedTrack(): TrackId | undefined;
  
  // ===== Project Metadata =====
  
  /**
   * Get project tempo (BPM).
   */
  getTempo(): number;
  
  /**
   * Get project time signature.
   */
  getTimeSignature(): TimeSignature;
  
  /**
   * Get project key (if set).
   */
  getKey(): string | undefined;
  
  /**
   * Get project duration (in ticks).
   */
  getDuration(): number;
  
  // ===== Undo/Redo Stack =====
  
  /**
   * Get undo stack depth.
   */
  getUndoStackDepth(): number;
  
  /**
   * Get redo stack depth.
   */
  getRedoStackDepth(): number;
  
  /**
   * Get description of last undo entry.
   */
  getLastUndoDescription(): string | undefined;
  
  /**
   * Get description of next redo entry.
   */
  getNextRedoDescription(): string | undefined;
  
  // ===== Board and Capabilities =====
  
  /**
   * Get current board ID.
   */
  getCurrentBoardId(): string;
  
  /**
   * Get board capabilities.
   */
  getBoardCapabilities(): BoardCapabilities;
  
  /**
   * Check if a specific capability is allowed.
   */
  hasCapability(capability: string): boolean;
}

// =============================================================================
// Section Markers
// =============================================================================

/**
 * A section marker in the project.
 */
export interface SectionMarker {
  /** Unique ID */
  readonly id: string;
  
  /** Section name (e.g., "Verse 1", "Chorus") */
  readonly name: string;
  
  /** Start position in ticks */
  readonly startTicks: number;
  
  /** End position in ticks (or undefined if last section) */
  readonly endTicks?: number;
  
  /** Section type (e.g., "verse", "chorus", "bridge") */
  readonly type?: string;
  
  /** Section color (for UI) */
  readonly color?: string;
  
  /** Custom metadata */
  readonly metadata?: Record<string, unknown>;
}

// =============================================================================
// Tracks
// =============================================================================

/**
 * A track in the project.
 */
export interface Track {
  /** Unique ID */
  readonly id: TrackId;
  
  /** Track name */
  readonly name: string;
  
  /** Track role (e.g., "drums", "bass", "melody") */
  readonly role?: string;
  
  /** Track tags */
  readonly tags: readonly string[];
  
  /** Track color (for UI) */
  readonly color?: string;
  
  /** Whether track is muted */
  readonly muted: boolean;
  
  /** Whether track is soloed */
  readonly soloed: boolean;
  
  /** Track volume (0-1) */
  readonly volume: number;
  
  /** Track pan (-1 to 1) */
  readonly pan: number;
  
  /** Output container ID */
  readonly outputId?: ContainerId;
  
  /** Custom metadata */
  readonly metadata?: Record<string, unknown>;
}

// =============================================================================
// Event Selectors
// =============================================================================

/**
 * Selector for matching events.
 */
export interface EventSelector {
  /** Match events on specific tracks */
  readonly trackIds?: readonly TrackId[];
  
  /** Match events with specific roles */
  readonly roles?: readonly string[];
  
  /** Match events with specific tags */
  readonly tags?: readonly string[];
  
  /** Match events of specific kinds */
  readonly kinds?: readonly string[];
  
  /** Match events in time range */
  readonly timeRange?: { startTicks: number; endTicks: number };
  
  /** Match events in sections */
  readonly sections?: readonly string[];
  
  /** Match events with specific pitch range (for note events) */
  readonly pitchRange?: { min: number; max: number };
  
  /** Match events with specific velocity range */
  readonly velocityRange?: { min: number; max: number };
}

// =============================================================================
// Card Instances
// =============================================================================

/**
 * A card instance in the project.
 */
export interface CardInstance {
  /** Unique instance ID */
  readonly id: CardId;
  
  /** Card type ID */
  readonly typeId: string;
  
  /** Card display name */
  readonly name: string;
  
  /** Track this card is on (if any) */
  readonly trackId?: TrackId;
  
  /** Current parameter values */
  readonly params: Readonly<Record<string, unknown>>;
  
  /** Whether card is bypassed */
  readonly bypassed: boolean;
  
  /** Input container ID */
  readonly inputId?: ContainerId;
  
  /** Output container ID */
  readonly outputId?: ContainerId;
  
  /** Custom metadata */
  readonly metadata?: Record<string, unknown>;
}

// =============================================================================
// Selection
// =============================================================================

/**
 * Time selection in the project.
 */
export interface TimeSelection {
  /** Start position in ticks */
  readonly startTicks: number;
  
  /** End position in ticks */
  readonly endTicks: number;
  
  /** Whether selection is active */
  readonly active: boolean;
  
  /** Selected tracks (if any) */
  readonly trackIds?: readonly TrackId[];
}

// =============================================================================
// Time Signature
// =============================================================================

/**
 * Time signature.
 */
export interface TimeSignature {
  /** Numerator (beats per bar) */
  readonly numerator: number;
  
  /** Denominator (note value) */
  readonly denominator: number;
}

// =============================================================================
// Board Capabilities
// =============================================================================

/**
 * Capabilities of the current board.
 */
export interface BoardCapabilities {
  /** Whether production layer can be edited */
  readonly productionEditable: boolean;
  
  /** Whether routing can be edited */
  readonly routingEditable: boolean;
  
  /** Whether AI features are enabled */
  readonly aiEnabled: boolean;
  
  /** Whether structure can be edited */
  readonly structureEditable: boolean;
  
  /** Whether events can be edited */
  readonly eventsEditable: boolean;
  
  /** Board persona */
  readonly persona: 'full-manual' | 'assisted' | 'full-ai';
  
  /** Custom capability flags */
  readonly custom?: Readonly<Record<string, boolean>>;
}

// =============================================================================
// Query Helpers
// =============================================================================

/**
 * Helper functions for common queries.
 */
export class ProjectWorldQueries {
  constructor(private world: ProjectWorldAPI) {}
  
  /**
   * Find section containing a time position.
   */
  findSectionContaining(ticks: number): SectionMarker | undefined {
    return this.world.getSectionMarkerAtPosition(ticks);
  }
  
  /**
   * Get events in a section.
   */
  getEventsInSection(sectionName: string): readonly Event<unknown>[] {
    const section = this.world.getSectionMarkerByName(sectionName);
    if (!section) return [];
    
    const startTicks = section.startTicks;
    const endTicks = section.endTicks ?? this.world.getDuration();
    
    return this.world.getEventsInRange(startTicks, endTicks);
  }
  
  /**
   * Get tracks with a specific role.
   */
  getTracksWithRole(role: string): readonly Track[] {
    return this.world.getTracksByRole(role);
  }
  
  /**
   * Check if a track has a role.
   */
  trackHasRole(trackId: TrackId, role: string): boolean {
    const track = this.world.getTrackById(trackId);
    return track?.role === role || track?.tags.includes(role) || false;
  }
  
  /**
   * Get all drums tracks.
   */
  getDrumsTracks(): readonly Track[] {
    return this.getTracksWithRole('drums');
  }
  
  /**
   * Get all bass tracks.
   */
  getBassTracks(): readonly Track[] {
    return this.getTracksWithRole('bass');
  }
  
  /**
   * Get all melody tracks.
   */
  getMelodyTracks(): readonly Track[] {
    return this.getTracksWithRole('melody');
  }
  
  /**
   * Get all pad tracks.
   */
  getPadTracks(): readonly Track[] {
    return this.getTracksWithRole('pad');
  }
  
  /**
   * Get current section (based on selection or playhead).
   */
  getCurrentSection(): SectionMarker | undefined {
    const selection = this.world.getSelection();
    if (selection) {
      return this.findSectionContaining(selection.startTicks);
    }
    // If no selection, return first section
    const sections = this.world.getSectionMarkers();
    return sections[0];
  }
  
  /**
   * Get section by type (e.g., first verse, last chorus).
   */
  getSectionByType(type: string, index: number = 0): SectionMarker | undefined {
    const sections = this.world.getSectionMarkers();
    const matchingSections = sections.filter(s => s.type === type);
    return matchingSections[index];
  }
  
  /**
   * Count sections of a type.
   */
  countSectionsOfType(type: string): number {
    const sections = this.world.getSectionMarkers();
    return sections.filter(s => s.type === type).length;
  }
  
  /**
   * Get all unique track roles.
   */
  getAllTrackRoles(): readonly string[] {
    const roles = new Set<string>();
    for (const track of this.world.getTracks()) {
      if (track.role) roles.add(track.role);
      for (const tag of track.tags) {
        roles.add(tag);
      }
    }
    return Array.from(roles).sort();
  }
  
  /**
   * Get all unique event kinds.
   */
  getAllEventKinds(): readonly string[] {
    const kinds = new Set<string>();
    for (const event of this.world.getEvents()) {
      kinds.add(event.kind);
    }
    return Array.from(kinds).sort();
  }
  
  /**
   * Check if project has any events.
   */
  hasEvents(): boolean {
    return this.world.getEvents().length > 0;
  }
  
  /**
   * Check if project has any tracks.
   */
  hasTracks(): boolean {
    return this.world.getTracks().length > 0;
  }
  
  /**
   * Check if project has sections.
   */
  hasSections(): boolean {
    return this.world.getSectionMarkers().length > 0;
  }
  
  /**
   * Get project statistics.
   */
  getProjectStats(): ProjectStats {
    return {
      trackCount: this.world.getTracks().length,
      eventCount: this.world.getEvents().length,
      sectionCount: this.world.getSectionMarkers().length,
      cardCount: this.world.getCards().length,
      durationTicks: this.world.getDuration(),
      tempo: this.world.getTempo(),
      timeSignature: this.world.getTimeSignature(),
    };
  }
}

/**
 * Project statistics.
 */
export interface ProjectStats {
  readonly trackCount: number;
  readonly eventCount: number;
  readonly sectionCount: number;
  readonly cardCount: number;
  readonly durationTicks: number;
  readonly tempo: number;
  readonly timeSignature: TimeSignature;
}

// =============================================================================
// Mock Implementation for Testing
// =============================================================================

/**
 * Mock project world implementation for testing.
 *
 * This provides a minimal in-memory implementation for unit tests.
 */
export class MockProjectWorld implements ProjectWorldAPI {
  private sections: SectionMarker[] = [];
  private tracks: Track[] = [];
  private events: Event<unknown>[] = [];
  private cards: CardInstance[] = [];
  private selection: TimeSelection | undefined;
  private tempo = 120;
  private timeSignature: TimeSignature = { numerator: 4, denominator: 4 };
  private boardId = 'test:board';
  private capabilities: BoardCapabilities = {
    productionEditable: true,
    routingEditable: true,
    aiEnabled: true,
    structureEditable: true,
    eventsEditable: true,
    persona: 'assisted',
  };
  
  // ===== Setters for Test Setup =====
  
  setSections(sections: SectionMarker[]): void {
    this.sections = [...sections];
  }
  
  setTracks(tracks: Track[]): void {
    this.tracks = [...tracks];
  }
  
  setEvents(events: Event<unknown>[]): void {
    this.events = [...events];
  }
  
  setCards(cards: CardInstance[]): void {
    this.cards = [...cards];
  }
  
  setSelection(selection: TimeSelection | undefined): void {
    this.selection = selection;
  }
  
  setTempo(tempo: number): void {
    this.tempo = tempo;
  }
  
  setTimeSignature(timeSignature: TimeSignature): void {
    this.timeSignature = timeSignature;
  }
  
  setCapabilities(capabilities: Partial<BoardCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...capabilities };
  }
  
  // ===== API Implementation =====
  
  getSectionMarkers(): readonly SectionMarker[] {
    return this.sections;
  }
  
  getSectionMarkerByName(name: string): SectionMarker | undefined {
    return this.sections.find(s => s.name === name);
  }
  
  getSectionMarkerAtPosition(positionTicks: number): SectionMarker | undefined {
    return this.sections.find(s => {
      const startTicks = s.startTicks;
      const endTicks = s.endTicks ?? Infinity;
      return positionTicks >= startTicks && positionTicks < endTicks;
    });
  }
  
  getSectionNames(): readonly string[] {
    return this.sections.map(s => s.name);
  }
  
  getTracks(): readonly Track[] {
    return this.tracks;
  }
  
  getTrackById(id: TrackId): Track | undefined {
    return this.tracks.find(t => t.id === id);
  }
  
  getTrackByName(name: string): Track | undefined {
    return this.tracks.find(t => t.name === name);
  }
  
  getTracksByRole(role: string): readonly Track[] {
    return this.tracks.filter(t => t.role === role || t.tags.includes(role));
  }
  
  getTracksByTag(tag: string): readonly Track[] {
    return this.tracks.filter(t => t.tags.includes(tag));
  }
  
  getEvents(): readonly Event<unknown>[] {
    return this.events;
  }
  
  getEventsInRange(startTicks: number, endTicks: number): readonly Event<unknown>[] {
    return this.events.filter(e => {
      const eventTicks = e.start;
      return eventTicks >= startTicks && eventTicks < endTicks;
    });
  }
  
  getEventsOnTrack(trackId: TrackId): readonly Event<unknown>[] {
    // Note: Event doesn't have container property in current impl
    // This would need to be tracked separately in real implementation
    return this.events.filter(e => e.tags?.has(`track:${trackId}`));
  }
  
  getEventsMatchingSelector(_selector: EventSelector): readonly Event<unknown>[] {
    // Simplified implementation for mock
    return this.events;
  }
  
  getCards(): readonly CardInstance[] {
    return this.cards;
  }
  
  getCardById(cardId: CardId): CardInstance | undefined {
    return this.cards.find(c => c.id === cardId);
  }
  
  getCardsByType(cardTypeId: string): readonly CardInstance[] {
    return this.cards.filter(c => c.typeId === cardTypeId);
  }
  
  getCardsOnTrack(trackId: TrackId): readonly CardInstance[] {
    return this.cards.filter(c => c.trackId === trackId);
  }
  
  getCardParam(cardId: CardId, paramName: string): unknown {
    const card = this.getCardById(cardId);
    return card?.params[paramName];
  }
  
  getSelection(): TimeSelection | undefined {
    return this.selection;
  }
  
  getFocusedDeck(): string | undefined {
    return undefined;
  }
  
  getFocusedTrack(): TrackId | undefined {
    return undefined;
  }
  
  getTempo(): number {
    return this.tempo;
  }
  
  getTimeSignature(): TimeSignature {
    return this.timeSignature;
  }
  
  getKey(): string | undefined {
    return undefined;
  }
  
  getDuration(): number {
    if (this.sections.length === 0) return 0;
    const lastSection = this.sections[this.sections.length - 1];
    return lastSection?.endTicks ?? 960 * 16; // Default to 16 bars
  }
  
  getUndoStackDepth(): number {
    return 0;
  }
  
  getRedoStackDepth(): number {
    return 0;
  }
  
  getLastUndoDescription(): string | undefined {
    return undefined;
  }
  
  getNextRedoDescription(): string | undefined {
    return undefined;
  }
  
  getCurrentBoardId(): string {
    return this.boardId;
  }
  
  getBoardCapabilities(): BoardCapabilities {
    return this.capabilities;
  }
  
  hasCapability(capability: string): boolean {
    switch (capability) {
      case 'production-editable':
        return this.capabilities.productionEditable;
      case 'routing-editable':
        return this.capabilities.routingEditable;
      case 'ai-enabled':
        return this.capabilities.aiEnabled;
      case 'structure-editable':
        return this.capabilities.structureEditable;
      case 'events-editable':
        return this.capabilities.eventsEditable;
      default:
        return this.capabilities.custom?.[capability] ?? false;
    }
  }
}

// =============================================================================
// Advanced Query Helpers
// =============================================================================

/**
 * Helper functions for common project world queries.
 */
export class ProjectWorldHelpers {
  constructor(private readonly world: ProjectWorldAPI) {}
  
  /**
   * Get all section names matching a pattern.
   */
  getSectionNamesMatching(pattern: RegExp): readonly string[] {
    return this.world.getSectionNames().filter(name => pattern.test(name));
  }
  
  /**
   * Get all verse sections.
   */
  getVerseSections(): readonly SectionMarker[] {
    return this.world.getSectionMarkers().filter(
      s => s.type === 'verse' || /verse/i.test(s.name)
    );
  }
  
  /**
   * Get all chorus sections.
   */
  getChorusSections(): readonly SectionMarker[] {
    return this.world.getSectionMarkers().filter(
      s => s.type === 'chorus' || /chorus/i.test(s.name)
    );
  }
  
  /**
   * Get bridge sections.
   */
  getBridgeSections(): readonly SectionMarker[] {
    return this.world.getSectionMarkers().filter(
      s => s.type === 'bridge' || /bridge/i.test(s.name)
    );
  }
  
  /**
   * Get intro/outro sections.
   */
  getIntroOutroSections(): readonly SectionMarker[] {
    return this.world.getSectionMarkers().filter(
      s => /^(intro|outro)/i.test(s.name)
    );
  }
  
  /**
   * Get section duration in ticks.
   */
  getSectionDuration(section: SectionMarker): number {
    if (section.endTicks !== undefined) {
      return section.endTicks - section.startTicks;
    }
    // Last section - use project duration
    const duration = this.world.getDuration();
    return Math.max(0, duration - section.startTicks);
  }
  
  /**
   * Get section duration in bars.
   */
  getSectionDurationBars(section: SectionMarker): number {
    const durationTicks = this.getSectionDuration(section);
    const ticksPerBar = this.getTicksPerBar();
    return durationTicks / ticksPerBar;
  }
  
  /**
   * Get ticks per bar based on time signature.
   */
  getTicksPerBar(): number {
    const ts = this.world.getTimeSignature();
    // Assuming 960 ticks per quarter note (common MIDI resolution)
    return 960 * (4 / ts.denominator) * ts.numerator;
  }
  
  /**
   * Convert bar/beat to ticks.
   */
  barBeatToTicks(bar: number, beat: number = 0): number {
    const ticksPerBar = this.getTicksPerBar();
    const ts = this.world.getTimeSignature();
    const ticksPerBeat = ticksPerBar / ts.numerator;
    return bar * ticksPerBar + beat * ticksPerBeat;
  }
  
  /**
   * Convert ticks to bar/beat.
   */
  ticksToBarBeat(ticks: number): { bar: number; beat: number; tick: number } {
    const ticksPerBar = this.getTicksPerBar();
    const ts = this.world.getTimeSignature();
    const ticksPerBeat = ticksPerBar / ts.numerator;
    
    const bar = Math.floor(ticks / ticksPerBar);
    const remainingTicks = ticks % ticksPerBar;
    const beat = Math.floor(remainingTicks / ticksPerBeat);
    const tick = Math.floor(remainingTicks % ticksPerBeat);
    
    return { bar, beat, tick };
  }
  
  /**
   * Get all melodic tracks (tracks likely to contain melody).
   */
  getMelodicTracks(): readonly Track[] {
    const melodicRoles = ['melody', 'lead', 'vocal', 'synth-lead'];
    return this.world.getTracks().filter(
      t => melodicRoles.some(role => t.role === role || t.tags.includes(role))
    );
  }
  
  /**
   * Get all harmonic tracks (tracks providing harmony).
   */
  getHarmonicTracks(): readonly Track[] {
    const harmonicRoles = ['pad', 'keys', 'piano', 'guitar', 'strings'];
    return this.world.getTracks().filter(
      t => harmonicRoles.some(role => t.role === role || t.tags.includes(role))
    );
  }
  
  /**
   * Get all rhythmic tracks (drums, percussion).
   */
  getRhythmicTracks(): readonly Track[] {
    const rhythmicRoles = ['drums', 'percussion', 'perc', 'hats', 'kick', 'snare'];
    return this.world.getTracks().filter(
      t => rhythmicRoles.some(role => t.role === role || t.tags.includes(role))
    );
  }
  
  /**
   * Get bass tracks.
   */
  getBassTracks(): readonly Track[] {
    return this.world.getTracksByRole('bass');
  }
  
  /**
   * Check if selection spans multiple sections.
   */
  selectionSpansMultipleSections(): boolean {
    const selection = this.world.getSelection();
    if (!selection) return false;
    
    const sections = this.world.getSectionMarkers();
    let sectionCount = 0;
    
    for (const section of sections) {
      const sectionEnd = section.endTicks ?? this.world.getDuration();
      // Check if section overlaps with selection
      if (selection.startTicks < sectionEnd && selection.endTicks > section.startTicks) {
        sectionCount++;
      }
    }
    
    return sectionCount > 1;
  }
  
  /**
   * Get sections overlapping with selection.
   */
  getSelectedSections(): readonly SectionMarker[] {
    const selection = this.world.getSelection();
    if (!selection) return [];
    
    const sections = this.world.getSectionMarkers();
    return sections.filter(section => {
      const sectionEnd = section.endTicks ?? this.world.getDuration();
      return selection.startTicks < sectionEnd && selection.endTicks > section.startTicks;
    });
  }
  
  /**
   * Get tracks in selection.
   */
  getSelectedTracks(): readonly Track[] {
    const selection = this.world.getSelection();
    if (!selection || !selection.trackIds) {
      return this.world.getTracks();
    }
    
    return selection.trackIds
      .map(id => this.world.getTrackById(id))
      .filter((t): t is Track => t !== undefined);
  }
  
  /**
   * Get event count in selection.
   */
  getEventCountInSelection(): number {
    const selection = this.world.getSelection();
    if (!selection) return 0;
    
    const events = this.world.getEventsInRange(
      selection.startTicks,
      selection.endTicks,
      selection.trackIds
    );
    return events.length;
  }
  
  /**
   * Get average event density (events per bar) in selection.
   */
  getEventDensityInSelection(): number {
    const eventCount = this.getEventCountInSelection();
    const selection = this.world.getSelection();
    if (!selection) return 0;
    
    const durationTicks = selection.endTicks - selection.startTicks;
    const ticksPerBar = this.getTicksPerBar();
    const bars = durationTicks / ticksPerBar;
    
    return bars > 0 ? eventCount / bars : 0;
  }
  
  /**
   * Check if any tracks are muted.
   */
  hasAnyMutedTracks(): boolean {
    return this.world.getTracks().some(t => t.muted);
  }
  
  /**
   * Check if any tracks are soloed.
   */
  hasAnySoloedTracks(): boolean {
    return this.world.getTracks().some(t => t.soloed);
  }
  
  /**
   * Get audible tracks (not muted, or soloed when others are soloed).
   */
  getAudibleTracks(): readonly Track[] {
    const tracks = this.world.getTracks();
    const anySoloed = tracks.some(t => t.soloed);
    
    if (anySoloed) {
      // Only soloed tracks are audible
      return tracks.filter(t => t.soloed);
    }
    
    // All non-muted tracks are audible
    return tracks.filter(t => !t.muted);
  }
  
  /**
   * Get project duration in bars.
   */
  getDurationBars(): number {
    const durationTicks = this.world.getDuration();
    const ticksPerBar = this.getTicksPerBar();
    return durationTicks / ticksPerBar;
  }
  
  /**
   * Get project duration in seconds (approximate).
   */
  getDurationSeconds(): number {
    const durationTicks = this.world.getDuration();
    const tempo = this.world.getTempo();
    // 960 ticks per quarter note, tempo in BPM
    const secondsPerTick = 60 / (tempo * 960);
    return durationTicks * secondsPerTick;
  }
  
  /**
   * Get tempo changes (if supported).
   * For now returns constant tempo.
   */
  getTempoChanges(): readonly TempoChange[] {
    return [
      {
        positionTicks: 0,
        bpm: this.world.getTempo(),
      },
    ];
  }
  
  /**
   * Get time signature changes (if supported).
   * For now returns constant time signature.
   */
  getTimeSignatureChanges(): readonly TimeSignatureChange[] {
    return [
      {
        positionTicks: 0,
        timeSignature: this.world.getTimeSignature(),
      },
    ];
  }
  
  /**
   * Format position as bar:beat:tick string.
   */
  formatPosition(ticks: number): string {
    const { bar, beat, tick } = this.ticksToBarBeat(ticks);
    return `${bar + 1}:${beat + 1}:${tick}`;
  }
  
  /**
   * Get events grouped by track.
   */
  getEventsByTrack(
    startTicks?: number,
    endTicks?: number
  ): ReadonlyMap<TrackId, readonly Event<unknown>[]> {
    const tracks = this.world.getTracks();
    const map = new Map<TrackId, Event<unknown>[]>();
    
    for (const track of tracks) {
      const events = this.world.getEventsOnTrack(
        track.id,
        startTicks,
        endTicks
      );
      map.set(track.id, events);
    }
    
    return map;
  }
  
  /**
   * Get note events in a range.
   */
  getNoteEventsInRange(
    startTicks?: number,
    endTicks?: number,
    trackIds?: readonly TrackId[]
  ): readonly Event<unknown>[] {
    const events = this.world.getEventsInRange(startTicks, endTicks, trackIds);
    // Filter to note events (assuming kind === 'note')
    return events.filter(e => (e as any).kind === 'note');
  }
  
  /**
   * Get unique pitches in a range.
   */
  getUniquePitches(
    startTicks?: number,
    endTicks?: number,
    trackIds?: readonly TrackId[]
  ): readonly number[] {
    const noteEvents = this.getNoteEventsInRange(startTicks, endTicks, trackIds);
    const pitches = new Set<number>();
    
    for (const event of noteEvents) {
      const payload = (event as any).payload;
      if (payload && typeof payload.midi === 'number') {
        pitches.add(payload.midi);
      }
    }
    
    return Array.from(pitches).sort((a, b) => a - b);
  }
  
  /**
   * Get pitch range in a region.
   */
  getPitchRange(
    startTicks?: number,
    endTicks?: number,
    trackIds?: readonly TrackId[]
  ): { min: number; max: number } | undefined {
    const pitches = this.getUniquePitches(startTicks, endTicks, trackIds);
    if (pitches.length === 0) return undefined;
    
    return {
      min: pitches[0]!,
      max: pitches[pitches.length - 1]!,
    };
  }
  
  /**
   * Check if a track has events.
   */
  trackHasEvents(trackId: TrackId): boolean {
    return this.world.getEventsOnTrack(trackId).length > 0;
  }
  
  /**
   * Get empty tracks.
   */
  getEmptyTracks(): readonly Track[] {
    return this.world.getTracks().filter(t => !this.trackHasEvents(t.id));
  }
  
  /**
   * Get non-empty tracks.
   */
  getNonEmptyTracks(): readonly Track[] {
    return this.world.getTracks().filter(t => this.trackHasEvents(t.id));
  }
  
  /**
   * Get card instances on a track.
   */
  getCardInstancesOnTrack(trackId: TrackId): readonly CardInstance[] {
    return this.world.getCardsOnTrack(trackId);
  }
  
  /**
   * Find card instances by type.
   */
  findCardsByType(cardType: string): readonly CardInstance[] {
    return this.world.getCardInstances().filter(c => c.cardType === cardType);
  }
  
  /**
   * Find card instances with a specific parameter.
   */
  findCardsWithParam(paramName: string): readonly CardInstance[] {
    return this.world.getCardInstances().filter(c => paramName in c.params);
  }
  
  /**
   * Check if board supports a feature.
   */
  supportsFeature(feature: string): boolean {
    return this.world.hasCapability(feature);
  }
  
  /**
   * Get all tracks with a specific tag.
   */
  getTracksWithTag(tag: string): readonly Track[] {
    return this.world.getTracksByTag(tag);
  }
  
  /**
   * Get summary of project structure.
   */
  getStructureSummary(): ProjectStructureSummary {
    const sections = this.world.getSectionMarkers();
    const tracks = this.world.getTracks();
    const cards = this.world.getCardInstances();
    const duration = this.world.getDuration();
    
    return {
      sectionCount: sections.length,
      trackCount: tracks.length,
      cardCount: cards.length,
      duration: {
        ticks: duration,
        bars: this.getDurationBars(),
        seconds: this.getDurationSeconds(),
      },
      tempo: this.world.getTempo(),
      timeSignature: this.world.getTimeSignature(),
      key: this.world.getKey(),
      hasSelection: this.world.getSelection() !== undefined,
      capabilities: this.world.getBoardCapabilities(),
    };
  }
}

/**
 * Tempo change event.
 */
export interface TempoChange {
  readonly positionTicks: number;
  readonly bpm: number;
}

/**
 * Time signature change event.
 */
export interface TimeSignatureChange {
  readonly positionTicks: number;
  readonly timeSignature: TimeSignature;
}

/**
 * Project structure summary.
 */
export interface ProjectStructureSummary {
  readonly sectionCount: number;
  readonly trackCount: number;
  readonly cardCount: number;
  readonly duration: {
    readonly ticks: number;
    readonly bars: number;
    readonly seconds: number;
  };
  readonly tempo: number;
  readonly timeSignature: TimeSignature;
  readonly key: string | undefined;
  readonly hasSelection: boolean;
  readonly capabilities: BoardCapabilities;
}

// =============================================================================
// Project World Validation
// =============================================================================

/**
 * Validation rules for project world state.
 */
export class ProjectWorldValidator {
  constructor(private readonly world: ProjectWorldAPI) {}
  
  /**
   * Validate that all sections are properly ordered and non-overlapping.
   */
  validateSections(): readonly string[] {
    const errors: string[] = [];
    const sections = this.world.getSectionMarkers();
    
    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i]!;
      const next = sections[i + 1]!;
      
      if (current.endTicks !== undefined && current.endTicks > next.startTicks) {
        errors.push(
          `Section "${current.name}" (ends at ${current.endTicks}) overlaps with "${next.name}" (starts at ${next.startTicks})`
        );
      }
      
      if (current.startTicks >= next.startTicks) {
        errors.push(
          `Sections out of order: "${current.name}" at ${current.startTicks} should be before "${next.name}" at ${next.startTicks}`
        );
      }
    }
    
    return errors;
  }
  
  /**
   * Validate that all track IDs are unique.
   */
  validateTrackIds(): readonly string[] {
    const errors: string[] = [];
    const tracks = this.world.getTracks();
    const ids = new Set<TrackId>();
    
    for (const track of tracks) {
      if (ids.has(track.id)) {
        errors.push(`Duplicate track ID: ${track.id}`);
      }
      ids.add(track.id);
    }
    
    return errors;
  }
  
  /**
   * Validate that all card IDs are unique.
   */
  validateCardIds(): readonly string[] {
    const errors: string[] = [];
    const cards = this.world.getCardInstances();
    const ids = new Set<CardId>();
    
    for (const card of cards) {
      if (ids.has(card.id)) {
        errors.push(`Duplicate card ID: ${card.id}`);
      }
      ids.add(card.id);
    }
    
    return errors;
  }
  
  /**
   * Validate that all events are within valid time bounds.
   */
  validateEventTiming(): readonly string[] {
    const errors: string[] = [];
    const duration = this.world.getDuration();
    const events = this.world.getEventsInRange();
    
    for (const event of events) {
      if ((event as any).onset < 0) {
        errors.push(`Event has negative onset: ${(event as any).onset}`);
      }
      if ((event as any).onset > duration) {
        errors.push(
          `Event onset ${(event as any).onset} exceeds project duration ${duration}`
        );
      }
    }
    
    return errors;
  }
  
  /**
   * Validate complete project world.
   */
  validateAll(): ValidationReport {
    return {
      sectionErrors: this.validateSections(),
      trackErrors: this.validateTrackIds(),
      cardErrors: this.validateCardIds(),
      eventErrors: this.validateEventTiming(),
    };
  }
  
  /**
   * Check if project world is valid.
   */
  isValid(): boolean {
    const report = this.validateAll();
    return (
      report.sectionErrors.length === 0 &&
      report.trackErrors.length === 0 &&
      report.cardErrors.length === 0 &&
      report.eventErrors.length === 0
    );
  }
}

/**
 * Validation report for project world.
 */
export interface ValidationReport {
  readonly sectionErrors: readonly string[];
  readonly trackErrors: readonly string[];
  readonly cardErrors: readonly string[];
  readonly eventErrors: readonly string[];
}

// =============================================================================
// Export convenience functions
// =============================================================================

/**
 * Create helpers for a project world.
 */
export function createProjectWorldHelpers(
  world: ProjectWorldAPI
): ProjectWorldHelpers {
  return new ProjectWorldHelpers(world);
}

/**
 * Create validator for a project world.
 */
export function createProjectWorldValidator(
  world: ProjectWorldAPI
): ProjectWorldValidator {
  return new ProjectWorldValidator(world);
}
