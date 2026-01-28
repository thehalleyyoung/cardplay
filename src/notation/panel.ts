/**
 * @fileoverview Notation Panel Component.
 * 
 * The main panel for rendering and interacting with musical notation.
 * Integrates all notation rendering subsystems.
 * 
 * @module @cardplay/core/notation/panel
 */

import {
  NotationMeasure,
  NotationEvent,
  NoteDuration,
  ClefType,
  StaffConfig,
  PageConfig,
  DEFAULT_PAGE_CONFIG,
  NoteTie,
  NoteSlur,
  Tuplet,
  AccidentalType,
} from './types';
import {
  StaffDimensions,
  DEFAULT_STAFF_DIMENSIONS,
  RenderedStaff,
  renderClef,
  renderKeySignature,
  renderTimeSignature,
  createDefaultStaffConfig,
} from './staff';
import {
  RenderedNoteHead,
  RenderedStem,
  RenderedRest,
  RenderedDot,
  RenderedBeamGroup,
  renderNoteHead,
  renderStem,
  renderChordStem,
  renderRest,
  renderDots,
  createBeamGroups,
  renderBeamGroup,
  resolveAccidentalPositions,
  renderArticulations,
  RenderedArticulation,
} from './notes';
import {
  RenderedBarLine,
  renderBarLine,
} from './barlines';
import {
  RenderedTie,
  RenderedSlur,
  renderTie,
  renderSlur,
} from './curves';
import {
  RenderedTuplet,
  renderTuplet,
} from './tuplets';
import {
  SpacingConfig,
  DEFAULT_SPACING_CONFIG,
  MeasureLayout,
  PageLayout,
  layoutScore,
} from './layout';

// ============================================================================
// PANEL STATE
// ============================================================================

/**
 * Notation panel zoom level.
 */
export interface ZoomState {
  readonly level: number;
  readonly minLevel: number;
  readonly maxLevel: number;
}

/**
 * Default zoom state.
 */
export const DEFAULT_ZOOM_STATE: ZoomState = {
  level: 1.0,
  minLevel: 0.25,
  maxLevel: 4.0,
};

/**
 * Scroll position.
 */
export interface ScrollPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Selection state.
 */
export interface SelectionState {
  readonly selectedNoteIds: Set<string>;
  readonly selectedMeasures: Set<number>;
  readonly selectionRange: { startTick: number; endTick: number } | null;
}

/**
 * Default selection state.
 */
export const DEFAULT_SELECTION_STATE: SelectionState = {
  selectedNoteIds: new Set(),
  selectedMeasures: new Set(),
  selectionRange: null,
};

/**
 * Notation panel state.
 */
export interface NotationPanelState {
  readonly zoom: ZoomState;
  readonly scroll: ScrollPosition;
  readonly selection: SelectionState;
  readonly playheadTick: number | null;
  readonly isPlaying: boolean;
  readonly editMode: EditMode;
  readonly inputDuration: NoteDuration;
  readonly inputVoice: number;
}

/**
 * Edit mode for the notation panel.
 */
export type EditMode = 'select' | 'note' | 'rest' | 'erase';

/**
 * Default panel state.
 */
export const DEFAULT_PANEL_STATE: NotationPanelState = {
  zoom: DEFAULT_ZOOM_STATE,
  scroll: { x: 0, y: 0 },
  selection: DEFAULT_SELECTION_STATE,
  playheadTick: null,
  isPlaying: false,
  editMode: 'select',
  inputDuration: { base: 'quarter', dots: 0 },
  inputVoice: 1,
};

// ============================================================================
// PANEL CONFIGURATION
// ============================================================================

/**
 * Notation panel configuration.
 */
export interface NotationPanelConfig {
  readonly pageConfig: PageConfig;
  readonly staffDimensions: StaffDimensions;
  readonly spacingConfig: SpacingConfig;
  readonly showMeasureNumbers: boolean;
  readonly showPageNumbers: boolean;
  readonly highlightPlayingNotes: boolean;
  readonly scrollFollowsPlayhead: boolean;
  readonly theme: NotationTheme;
}

/**
 * Theme colors for notation.
 */
export interface NotationTheme {
  readonly staffLineColor: string;
  readonly noteColor: string;
  readonly selectedNoteColor: string;
  readonly playingNoteColor: string;
  readonly barLineColor: string;
  readonly textColor: string;
  readonly backgroundColor: string;
  readonly playheadColor: string;
}

/**
 * Default notation theme.
 */
export const DEFAULT_NOTATION_THEME: NotationTheme = {
  staffLineColor: '#333333',
  noteColor: '#000000',
  selectedNoteColor: '#2196F3',
  playingNoteColor: '#4CAF50',
  barLineColor: '#333333',
  textColor: '#000000',
  backgroundColor: '#FFFFFF',
  playheadColor: '#F44336',
};

/**
 * Default panel configuration.
 */
export const DEFAULT_PANEL_CONFIG: NotationPanelConfig = {
  pageConfig: DEFAULT_PAGE_CONFIG,
  staffDimensions: DEFAULT_STAFF_DIMENSIONS,
  spacingConfig: DEFAULT_SPACING_CONFIG,
  showMeasureNumbers: true,
  showPageNumbers: true,
  highlightPlayingNotes: true,
  scrollFollowsPlayhead: true,
  theme: DEFAULT_NOTATION_THEME,
};

// ============================================================================
// RENDERED PANEL
// ============================================================================

/**
 * Fully rendered notation element.
 */
export interface RenderedNotation {
  readonly pages: PageLayout[];
  readonly staves: RenderedStaff[];
  readonly noteHeads: RenderedNoteHead[];
  readonly stems: RenderedStem[];
  readonly beamGroups: RenderedBeamGroup[];
  readonly rests: RenderedRest[];
  readonly dots: RenderedDot[];
  readonly ties: RenderedTie[];
  readonly slurs: RenderedSlur[];
  readonly tuplets: RenderedTuplet[];
  readonly barLines: RenderedBarLine[];
  readonly articulations: RenderedArticulation[];
  readonly clefs: ReturnType<typeof renderClef>[];
  readonly keySignatures: ReturnType<typeof renderKeySignature>[];
  readonly timeSignatures: ReturnType<typeof renderTimeSignature>[];
}

// ============================================================================
// NOTATION PANEL CLASS
// ============================================================================

/**
 * Notation Panel manages rendering and interaction.
 */
export class NotationPanel {
  private state: NotationPanelState;
  private config: NotationPanelConfig;
  private staffConfigs: StaffConfig[];
  private measures: NotationMeasure[];
  private ties: NoteTie[];
  private slurs: NoteSlur[];
  private tuplets: Tuplet[];
  private renderedNotation: RenderedNotation | null;
  private noteIdToPosition: Map<string, { x: number; y: number }>;
  private listeners: Map<string, Set<(data: any) => void>>;
  
  constructor(
    staffConfigs: StaffConfig[] = [createDefaultStaffConfig('staff-1')],
    config: Partial<NotationPanelConfig> = {}
  ) {
    this.state = { ...DEFAULT_PANEL_STATE };
    this.config = { ...DEFAULT_PANEL_CONFIG, ...config };
    this.staffConfigs = staffConfigs;
    this.measures = [];
    this.ties = [];
    this.slurs = [];
    this.tuplets = [];
    this.renderedNotation = null;
    this.noteIdToPosition = new Map();
    this.listeners = new Map();
  }
  
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  
  /**
   * Get current state.
   */
  getState(): NotationPanelState {
    return this.state;
  }
  
  /**
   * Update state.
   */
  setState(partial: Partial<NotationPanelState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('stateChange', this.state);
  }
  
  /**
   * Set zoom level.
   */
  setZoom(level: number): void {
    const { minLevel, maxLevel } = this.state.zoom;
    const clampedLevel = Math.max(minLevel, Math.min(maxLevel, level));
    this.setState({
      zoom: { ...this.state.zoom, level: clampedLevel },
    });
    this.render();
  }
  
  /**
   * Zoom in.
   */
  zoomIn(factor: number = 1.2): void {
    this.setZoom(this.state.zoom.level * factor);
  }
  
  /**
   * Zoom out.
   */
  zoomOut(factor: number = 1.2): void {
    this.setZoom(this.state.zoom.level / factor);
  }
  
  /**
   * Set scroll position.
   */
  setScroll(position: Partial<ScrollPosition>): void {
    this.setState({
      scroll: { ...this.state.scroll, ...position },
    });
    this.emit('scroll', this.state.scroll);
  }
  
  /**
   * Set edit mode.
   */
  setEditMode(mode: EditMode): void {
    this.setState({ editMode: mode });
    this.emit('editModeChange', mode);
  }
  
  /**
   * Set input duration.
   */
  setInputDuration(duration: NoteDuration): void {
    this.setState({ inputDuration: duration });
  }
  
  /**
   * Set input voice.
   */
  setInputVoice(voice: number): void {
    this.setState({ inputVoice: voice });
  }
  
  // ==========================================================================
  // DATA MANAGEMENT
  // ==========================================================================
  
  /**
   * Set measures to display.
   */
  setMeasures(measures: NotationMeasure[]): void {
    this.measures = measures;
    this.render();
    this.emit('measuresChange', measures);
  }
  
  /**
   * Add a measure.
   */
  addMeasure(measure: NotationMeasure): void {
    this.measures.push(measure);
    this.render();
    this.emit('measureAdd', measure);
  }
  
  /**
   * Remove a measure.
   */
  removeMeasure(measureNumber: number): void {
    const index = this.measures.findIndex(m => m.number === measureNumber);
    if (index >= 0) {
      const removed = this.measures.splice(index, 1)[0];
      // Re-number subsequent measures
      for (let i = index; i < this.measures.length; i++) {
        (this.measures[i] as any).number = i + 1;
      }
      this.render();
      this.emit('measureRemove', removed);
    }
  }
  
  /**
   * Update a measure.
   */
  updateMeasure(measureNumber: number, updates: Partial<NotationMeasure>): void {
    const measure = this.measures.find(m => m.number === measureNumber);
    if (measure) {
      Object.assign(measure, updates);
      this.render();
      this.emit('measureUpdate', measure);
    }
  }
  
  /**
   * Set staff configurations.
   */
  setStaffConfigs(configs: StaffConfig[]): void {
    this.staffConfigs = configs;
    this.render();
    this.emit('staffConfigsChange', configs);
  }
  
  /**
   * Set ties.
   */
  setTies(ties: NoteTie[]): void {
    this.ties = ties;
    this.render();
  }
  
  /**
   * Set slurs.
   */
  setSlurs(slurs: NoteSlur[]): void {
    this.slurs = slurs;
    this.render();
  }
  
  /**
   * Set tuplets.
   */
  setTuplets(tuplets: Tuplet[]): void {
    this.tuplets = tuplets;
    this.render();
  }
  
  // ==========================================================================
  // SELECTION
  // ==========================================================================
  
  /**
   * Select notes.
   */
  selectNotes(noteIds: string[], addToSelection: boolean = false): void {
    const existingIds = Array.from(this.state.selection.selectedNoteIds);
    const selectedNoteIds = addToSelection
      ? new Set([...existingIds, ...noteIds])
      : new Set(noteIds);
    
    this.setState({
      selection: { ...this.state.selection, selectedNoteIds },
    });
    this.render();
    this.emit('selectionChange', selectedNoteIds);
  }
  
  /**
   * Clear selection.
   */
  clearSelection(): void {
    this.setState({
      selection: DEFAULT_SELECTION_STATE,
    });
    this.render();
    this.emit('selectionChange', new Set());
  }
  
  /**
   * Select all notes in a measure.
   */
  selectMeasure(measureNumber: number, addToSelection: boolean = false): void {
    const measure = this.measures.find(m => m.number === measureNumber);
    if (!measure) return;
    
    const noteIds: string[] = [];
    const measureEventArrays = Array.from(measure.events.values());
    for (const events of measureEventArrays) {
      for (const event of events) {
        for (const note of event.notes) {
          noteIds.push(note.id);
        }
      }
    }
    
    this.selectNotes(noteIds, addToSelection);
    
    const existingMeasures = Array.from(this.state.selection.selectedMeasures);
    const selectedMeasures = addToSelection
      ? new Set([...existingMeasures, measureNumber])
      : new Set([measureNumber]);
    
    this.setState({
      selection: { ...this.state.selection, selectedMeasures },
    });
  }
  
  // ==========================================================================
  // PLAYBACK
  // ==========================================================================
  
  /**
   * Set playhead position.
   */
  setPlayheadTick(tick: number | null): void {
    this.setState({ playheadTick: tick });
    
    if (tick !== null && this.config.scrollFollowsPlayhead) {
      this.scrollToTick(tick);
    }
    
    this.emit('playheadMove', tick);
  }
  
  /**
   * Set playing state.
   */
  setPlaying(isPlaying: boolean): void {
    this.setState({ isPlaying });
    this.emit('playStateChange', isPlaying);
  }
  
  /**
   * Scroll to a specific tick.
   */
  scrollToTick(tick: number): void {
    // Find the X position for this tick
    // This would require looking up the tick in the rendered notation
    // For now, we'll emit an event
    this.emit('scrollToTick', tick);
  }
  
  // ==========================================================================
  // EDITING OPERATIONS (Phase 11.3)
  // ==========================================================================
  
  /**
   * Add a note at the specified staff position and tick.
   * 
   * Task 2625: Implement click to add note
   */
  addNoteAtPosition(
    staffIndex: number,
    staffPosition: number,
    tick: number,
    duration?: NoteDuration,
    voice?: number
  ): string | null {
    const usedDuration = duration || this.state.inputDuration;
    const usedVoice = voice ?? this.state.inputVoice;
    
    // Find the appropriate measure
    const measure = this.findMeasureForTick(tick);
    if (!measure) return null;
    
    // Calculate MIDI pitch from staff position
    const staffConfig = this.staffConfigs[staffIndex];
    if (!staffConfig) return null;
    
    const pitch = this.staffPositionToMIDI(staffPosition, staffConfig);
    
    // Create new note
    const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const note = {
      id: noteId,
      pitch,
      velocity: 100,
    };
    
    // Create event or add to existing event
    const events = measure.events.get(usedVoice) || [];
    const newEvent: NotationEvent = {
      id: `event-${noteId}`,
      tick,
      duration: usedDuration,
      notes: [note],
      voice: usedVoice,
      staff: staffIndex,
      isRest: false,
    };
    
    events.push(newEvent);
    measure.events.set(usedVoice, events);
    
    this.render();
    this.emit('noteAdd', { noteId, event: newEvent });
    
    return noteId;
  }
  
  /**
   * Select a note by clicking on it.
   * 
   * Task 2626: Create click to select note
   */
  selectNoteAt(screenX: number, screenY: number, addToSelection: boolean = false): string | null {
    const hitTest = this.hitTestNote(screenX, screenY);
    
    if (hitTest) {
      this.selectNotes([hitTest.noteId], addToSelection);
      return hitTest.noteId;
    }
    
    if (!addToSelection) {
      this.clearSelection();
    }
    
    return null;
  }
  
  /**
   * Hit test to find a note at screen coordinates.
   */
  private hitTestNote(screenX: number, screenY: number): { noteId: string; noteHead: RenderedNoteHead } | null {
    if (!this.renderedNotation) return null;
    
    const zoom = this.state.zoom.level;
    const scroll = this.state.scroll;
    
    // Adjust for zoom and scroll
    const x = (screenX + scroll.x) / zoom;
    const y = (screenY + scroll.y) / zoom;
    
    // Check each note head for hit
    for (const noteHead of this.renderedNotation.noteHeads) {
      const hitRadius = 10; // pixels
      const dx = x - noteHead.x;
      const dy = y - noteHead.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= hitRadius) {
        return { noteId: noteHead.id, noteHead };
      }
    }
    
    return null;
  }
  
  /**
   * Change the pitch of a note by dragging.
   * 
   * Task 2627: Add drag note to change pitch
   */
  dragNoteToPitch(noteId: string, newStaffPosition: number): void {
    // Find the note in measures
    for (const measure of this.measures) {
      for (const events of measure.events.values()) {
        for (const event of events) {
          const note = event.notes.find(n => n.id === noteId);
          if (note) {
            // Update pitch based on staff position
            const staffConfig = this.staffConfigs[0]; // Use first staff for now
            if (staffConfig) {
              const newPitch = this.staffPositionToMIDI(newStaffPosition, staffConfig);
              (note as any).pitch = newPitch;
              
              this.render();
              this.emit('notePitchChange', { noteId, newPitch });
              return;
            }
          }
        }
      }
    }
  }
  
  /**
   * Change the duration of selected notes.
   * 
   * Task 2628: Implement duration change via context menu
   */
  changeNoteDuration(noteIds: string[], newDuration: NoteDuration): void {
    for (const measure of this.measures) {
      for (const events of measure.events.values()) {
        for (const event of events) {
          const hasTargetNote = event.notes.some(n => noteIds.includes(n.id));
          if (hasTargetNote) {
            (event as any).duration = newDuration;
          }
        }
      }
    }
    
    this.render();
    this.emit('noteDurationChange', { noteIds, newDuration });
  }
  
  /**
   * Set input duration from keyboard shortcuts.
   * 
   * Task 2629: Create keyboard shortcuts for durations
   */
  setDurationFromKey(key: string): void {
    const durationMap: Record<string, NoteDuration> = {
      '1': { base: 'whole', dots: 0 },
      '2': { base: 'half', dots: 0 },
      '4': { base: 'quarter', dots: 0 },
      '8': { base: 'eighth', dots: 0 },
      '6': { base: '16th', dots: 0 },
      '3': { base: '32nd', dots: 0 },
    };
    
    const duration = durationMap[key];
    if (duration) {
      this.setInputDuration(duration);
      this.emit('inputDurationChange', duration);
    }
  }
  
  /**
   * Toggle dot on current input duration.
   * Keyboard shortcut: '.' key
   */
  toggleDot(): void {
    const current = this.state.inputDuration;
    const newDots = (current.dots + 1) % 3; // Cycle through 0, 1, 2
    this.setInputDuration({ ...current, dots: newDots });
  }
  
  /**
   * Add accidental to selected notes.
   * 
   * Task 2630: Add keyboard shortcuts for accidentals
   */
  addAccidentalToNotes(noteIds: string[], accidental: AccidentalType): void {
    for (const measure of this.measures) {
      for (const events of measure.events.values()) {
        for (const event of events) {
          for (const note of event.notes) {
            if (noteIds.includes(note.id)) {
              (note as any).accidental = accidental;
            }
          }
        }
      }
    }
    
    this.render();
    this.emit('accidentalChange', { noteIds, accidental });
  }
  
  /**
   * Handle accidental keyboard shortcuts.
   */
  handleAccidentalKey(key: string): void {
    const selected = Array.from(this.state.selection.selectedNoteIds);
    if (selected.length === 0) return;
    
    const accidentalMap: Record<string, AccidentalType> = {
      '#': 'sharp',
      'b': 'flat',
      'n': 'natural',
      '##': 'double-sharp',
      'bb': 'double-flat',
    };
    
    const accidental = accidentalMap[key];
    if (accidental) {
      this.addAccidentalToNotes(selected, accidental);
    }
  }
  
  /**
   * Delete selected notes.
   * 
   * Task 2631: Implement delete note
   */
  deleteSelectedNotes(): void {
    const selectedIds = Array.from(this.state.selection.selectedNoteIds);
    this.deleteNotes(selectedIds);
  }
  
  /**
   * Delete notes by ID.
   */
  deleteNotes(noteIds: string[]): void {
    const noteIdSet = new Set(noteIds);
    
    for (const measure of this.measures) {
      for (const [voice, events] of measure.events) {
        // Filter out events that contain deleted notes
        const filteredEvents = events.filter(event => {
          // Remove notes from the event
          (event.notes as any) = event.notes.filter(n => !noteIdSet.has(n.id));
          // Keep event only if it still has notes
          return event.notes.length > 0;
        });
        
        measure.events.set(voice, filteredEvents);
      }
    }
    
    this.clearSelection();
    this.render();
    this.emit('notesDelete', noteIds);
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  /**
   * Find measure containing the given tick.
   */
  private findMeasureForTick(tick: number): NotationMeasure | null {
    // Calculate cumulative tick position for each measure
    let currentTick = 0;
    
    for (const measure of this.measures) {
      // Get time signature (use 4/4 as default)
      const timeSig = measure.timeSignature || { numerator: 4, denominator: 4 };
      
      // Calculate measure duration in ticks (assuming 480 ticks per quarter note)
      const quarterNotePerMeasure = (timeSig.numerator * 4) / timeSig.denominator;
      const measureDuration = quarterNotePerMeasure * 480;
      
      const measureEnd = currentTick + measureDuration;
      
      if (tick >= currentTick && tick < measureEnd) {
        return measure;
      }
      
      currentTick = measureEnd;
    }
    
    return null;
  }
  
  /**
   * Convert staff position to MIDI pitch.
   */
  private staffPositionToMIDI(staffPosition: number, staffConfig: StaffConfig): number {
    // This is a simplified implementation
    // staffPosition: 0 = middle line, positive = higher, negative = lower
    
    // Get clef definition to determine reference pitch
    const clef = staffConfig.clef;
    let middleLinePitch = 71; // Default to treble (B4)
    
    if (clef === 'bass') middleLinePitch = 50; // D3
    else if (clef === 'alto') middleLinePitch = 60; // C4
    else if (clef === 'tenor') middleLinePitch = 57; // A3
    
    // Each staff position is a diatonic step (whole or half step)
    // For simplification, we'll use chromatic semitones
    // More accurate would be to consider key signature
    return middleLinePitch + staffPosition;
  }
  
  // ==========================================================================
  // RENDERING
  // ==========================================================================
  
  /**
   * Render the notation.
   */
  render(): RenderedNotation {
    const rendered: RenderedNotation = {
      pages: [],
      staves: [],
      noteHeads: [],
      stems: [],
      beamGroups: [],
      rests: [],
      dots: [],
      ties: [],
      slurs: [],
      tuplets: [],
      barLines: [],
      articulations: [],
      clefs: [],
      keySignatures: [],
      timeSignatures: [],
    };
    
    if (this.measures.length === 0) {
      this.renderedNotation = rendered;
      return rendered;
    }
    
    // Layout pages
    const pages = layoutScore(
      this.measures,
      this.staffConfigs,
      this.config.pageConfig,
      this.config.staffDimensions,
      [],
      [],
      this.config.spacingConfig
    );
    (rendered as any).pages = pages;
    
    // Render each page
    for (const page of pages) {
      for (const system of page.systems) {
        // Render staves
        for (const staffLayout of system.staffLayouts) {
          (rendered.staves as any[]).push(staffLayout.renderedStaff);
          
          // Render clef, key, time for first measure
          if (system.measures.length > 0) {
            const firstLayout = system.measures[0];
            const firstStaffConfig = this.staffConfigs[0];
            
            if (firstLayout && firstStaffConfig && firstLayout.clefX !== null) {
              const clef = renderClef(
                staffLayout.renderedStaff,
                firstStaffConfig.clef,
                firstLayout.clefX
              );
              (rendered.clefs as any[]).push(clef);
            }
            
            if (firstLayout && firstStaffConfig && firstLayout.keyX !== null) {
              const keySig = renderKeySignature(
                staffLayout.renderedStaff,
                firstStaffConfig.keySignature,
                firstLayout.keyX
              );
              (rendered.keySignatures as any[]).push(keySig);
            }
            
            if (firstLayout && firstStaffConfig && firstLayout.timeX !== null) {
              const timeSig = renderTimeSignature(
                staffLayout.renderedStaff,
                firstStaffConfig.timeSignature,
                firstLayout.timeX
              );
              (rendered.timeSignatures as any[]).push(timeSig);
            }
          }
        }
        
        // Render measures
        for (const measureLayout of system.measures) {
          const measure = this.measures[measureLayout.measureNumber - 1];
          if (!measure) continue;
          
          // Render bar lines
          const staff = system.staffLayouts[0]?.renderedStaff;
          if (staff) {
            const endBarLine = renderBarLine(
              measure.endBarLine || 'single',
              staff,
              measureLayout.endBarLineX
            );
            (rendered.barLines as any[]).push(endBarLine);
          }
          
          // Render events
          this.renderMeasureEvents(
            measure,
            measureLayout,
            system.staffLayouts[0]?.renderedStaff,
            rendered
          );
        }
      }
    }
    
    // Render ties
    this.renderTies(rendered);
    
    // Render slurs
    this.renderSlurs(rendered);
    
    // Render tuplets
    this.renderTuplets(rendered);
    
    this.renderedNotation = rendered;
    this.emit('render', rendered);
    
    return rendered;
  }
  
  /**
   * Render events within a measure.
   */
  private renderMeasureEvents(
    measure: NotationMeasure,
    layout: MeasureLayout,
    staff: RenderedStaff | undefined,
    rendered: RenderedNotation
  ): void {
    if (!staff) return;
    
    // Build a map of event ID to position
    const eventPositions = new Map<string, number>();
    for (const pos of layout.notePositions) {
      eventPositions.set(pos.eventId, pos.x);
    }
    
    // Get all events
    const allEvents: NotationEvent[] = [];
    const measureEventArrays = Array.from(measure.events.values());
    for (const events of measureEventArrays) {
      allEvents.push(...events);
    }
    
    // Determine beam groups
    const beamGroups = createBeamGroups(allEvents);
    const beamedEventIds = new Set<string>();
    for (const group of beamGroups) {
      for (const idx of group.noteIndices) {
        const evt = allEvents[idx];
        if (evt) {
          beamedEventIds.add(evt.id);
        }
      }
    }
    
    // Render each event
    const eventNoteHeads = new Map<string, RenderedNoteHead[]>();
    const eventStems = new Map<string, RenderedStem | null>();
    
    for (const event of allEvents) {
      const x = eventPositions.get(event.id) || layout.x + 20;
      
      if (event.isRest) {
        // Render rest
        const rest = renderRest(event.id, event.duration, staff, x, event.voice);
        (rendered.rests as any[]).push(rest);
      } else {
        // Render notes
        const noteHeads: RenderedNoteHead[] = [];
        
        for (const note of event.notes) {
          const noteHead = renderNoteHead(note, event.duration.base, staff, x);
          noteHeads.push(noteHead);
          (rendered.noteHeads as any[]).push(noteHead);
          
          // Store position for ties/slurs
          this.noteIdToPosition.set(note.id, { x: noteHead.x, y: noteHead.y });
          
          // Render dots
          if (event.duration.dots > 0) {
            const dots = renderDots(noteHead, event.duration.dots, staff);
            (rendered.dots as any[]).push(...dots);
          }
        }
        
        // Resolve accidental collisions
        const resolvedNoteHeads = resolveAccidentalPositions(noteHeads, x);
        eventNoteHeads.set(event.id, resolvedNoteHeads);
        
        // Render stem (if not beamed)
        if (!beamedEventIds.has(event.id)) {
          const stemDirection = event.stemDirection || 'auto';
          let stem: RenderedStem | null = null;
          
          if (noteHeads.length === 1 && noteHeads[0]) {
            stem = renderStem(noteHeads[0], event.duration.base, stemDirection, staff);
          } else if (noteHeads.length > 1) {
            stem = renderChordStem(noteHeads, event.duration.base, stemDirection, staff);
          }
          
          if (stem) {
            (rendered.stems as any[]).push(stem);
            eventStems.set(event.id, stem);
          }
        }
        
        // Render articulations
        if (event.articulations && event.articulations.length > 0 && noteHeads[0]) {
          const stem = eventStems.get(event.id);
          const stemDir = stem?.direction || 'up';
          const articulations = renderArticulations(
            noteHeads[0],
            event.articulations,
            stemDir,
            staff
          );
          (rendered.articulations as any[]).push(...articulations);
        }
      }
    }
    
    // Render beam groups
    for (const group of beamGroups) {
      const groupEvents = group.noteIndices
        .map(i => allEvents[i])
        .filter((e): e is NotationEvent => e !== undefined);
      const groupNoteHeads = groupEvents.map(e => eventNoteHeads.get(e.id) || []);
      const xPositions = groupEvents.map(e => eventPositions.get(e.id) || 0);
      
      const beamGroup = renderBeamGroup(
        groupEvents,
        groupNoteHeads,
        group,
        staff,
        xPositions
      );
      
      (rendered.beamGroups as any[]).push(beamGroup);
      (rendered.stems as any[]).push(...beamGroup.stems);
      
      // Store stem directions
      for (let i = 0; i < groupEvents.length; i++) {
        const evt = groupEvents[i];
        const stem = beamGroup.stems[i];
        if (evt && stem) {
          eventStems.set(evt.id, stem);
        }
      }
    }
  }
  
  /**
   * Render ties.
   */
  private renderTies(rendered: RenderedNotation): void {
    for (const tie of this.ties) {
      // Find the note heads for this tie
      const startNoteHead = rendered.noteHeads.find(nh => nh.id === tie.startNoteId);
      const endNoteHead = rendered.noteHeads.find(nh => nh.id === tie.endNoteId);
      
      if (!startNoteHead || !endNoteHead) continue;
      
      const staff = rendered.staves[0];
      if (!staff) continue;
      
      const renderedTie = renderTie(
        tie,
        startNoteHead,
        endNoteHead,
        'auto',
        'auto',
        staff
      );
      (rendered.ties as any[]).push(renderedTie);
    }
  }
  
  /**
   * Render slurs.
   */
  private renderSlurs(rendered: RenderedNotation): void {
    for (const slur of this.slurs) {
      const startNoteHead = rendered.noteHeads.find(nh => nh.id === slur.startNoteId);
      const endNoteHead = rendered.noteHeads.find(nh => nh.id === slur.endNoteId);
      
      if (!startNoteHead || !endNoteHead) continue;
      
      const staff = rendered.staves[0];
      if (!staff) continue;
      
      const renderedSlur = renderSlur(
        slur,
        startNoteHead,
        endNoteHead,
        'auto',
        'auto',
        staff
      );
      (rendered.slurs as any[]).push(renderedSlur);
    }
  }
  
  /**
   * Render tuplets.
   */
  private renderTuplets(rendered: RenderedNotation): void {
    for (const tuplet of this.tuplets) {
      const noteHeads = tuplet.noteIds
        .map(id => rendered.noteHeads.find(nh => nh.id === id))
        .filter((nh): nh is RenderedNoteHead => nh !== undefined);
      
      if (noteHeads.length === 0) continue;
      
      const staff = rendered.staves[0];
      if (!staff) continue;
      
      const stems = noteHeads.map(() => null); // Simplified - would need actual stems
      
      const renderedTuplet = renderTuplet(tuplet, noteHeads, stems, staff);
      (rendered.tuplets as any[]).push(renderedTuplet);
    }
  }
  
  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================
  
  /**
   * Subscribe to events.
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
  
  /**
   * Emit an event.
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const callbackArray = Array.from(callbacks);
      for (const callback of callbackArray) {
        callback(data);
      }
    }
  }
  
  // ==========================================================================
  // COORDINATE CONVERSION
  // ==========================================================================
  
  /**
   * Convert screen coordinates to staff position.
   */
  screenToStaffPosition(
    screenX: number,
    screenY: number
  ): { staff: RenderedStaff; position: number; tick: number } | null {
    if (!this.renderedNotation) return null;
    
    const zoom = this.state.zoom.level;
    const scroll = this.state.scroll;
    
    // Adjust for zoom and scroll
    // Note: x coordinate would be used for tick calculation when implemented
    void ((screenX + scroll.x) / zoom);
    const y = (screenY + scroll.y) / zoom;
    
    // Find which staff
    for (const staff of this.renderedNotation.staves) {
      if (y >= staff.y && y <= staff.y + staff.dimensions.height) {
        // Calculate staff position (line/space)
        const relativeY = y - staff.y;
        const position = Math.round(
          (staff.dimensions.height - relativeY) / (staff.dimensions.lineSpacing / 2)
        ) - 4; // Offset to center on middle line
        
        // Calculate approximate tick (would need measure info)
        const tick = 0; // Placeholder
        
        return { staff, position, tick };
      }
    }
    
    return null;
  }
  
  /**
   * Get rendered notation.
   */
  getRenderedNotation(): RenderedNotation | null {
    return this.renderedNotation;
  }
  
  /**
   * Get note position by ID.
   */
  getNotePosition(noteId: string): { x: number; y: number } | undefined {
    return this.noteIdToPosition.get(noteId);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a simple single-staff notation panel.
 */
export function createSingleStaffPanel(
  clef: ClefType = 'treble',
  key: string = 'C',
  time: string = '4/4'
): NotationPanel {
  const staffConfig = createDefaultStaffConfig('staff-1', {
    clef,
    keySignature: key,
    timeSignature: time,
  });
  
  return new NotationPanel([staffConfig]);
}

/**
 * Create a piano (grand staff) notation panel.
 */
export function createPianoPanel(
  key: string = 'C',
  time: string = '4/4'
): NotationPanel {
  const trebleStaff = createDefaultStaffConfig('treble', {
    clef: 'treble',
    keySignature: key,
    timeSignature: time,
    label: 'Piano',
  });
  
  const bassStaff = createDefaultStaffConfig('bass', {
    clef: 'bass',
    keySignature: key,
    timeSignature: time,
  });
  
  return new NotationPanel([trebleStaff, bassStaff]);
}

/**
 * Create a score panel with multiple instruments.
 */
export function createScorePanel(
  instruments: Array<{
    name: string;
    clef: ClefType;
    transposition?: number;
  }>,
  key: string = 'C',
  time: string = '4/4'
): NotationPanel {
  const staffConfigs = instruments.map((inst, i) => 
    createDefaultStaffConfig(`staff-${i}`, {
      clef: inst.clef,
      keySignature: key,
      timeSignature: time,
      label: inst.name,
      shortLabel: inst.name.substring(0, 3),
    })
  );
  
  return new NotationPanel(staffConfigs);
}
