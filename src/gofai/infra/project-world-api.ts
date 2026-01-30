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
