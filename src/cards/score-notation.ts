/**
 * @fileoverview ScoreNotationCard - Unified Notation Display Card
 * 
 * The ScoreNotationCard is the single card responsible for all notation display.
 * It receives events from phrase/generator/transform cards and renders professional
 * notation using the existing notation engine.
 * 
 * Key features:
 * - Receives note events from upstream cards (phrase, generator, transform)
 * - Integrates with arranger sections for score structure
 * - Renders using the notation/svg-professional pipeline
 * - Provides bidirectional sync: notation edits update source cards
 * - All notation features are parameters, not separate cards
 * 
 * @module @cardplay/core/cards/score-notation
 */

import type { Tick, TickDuration } from '../types/primitives';
import type { Event } from '../types/event';
import { createEvent } from '../types/event';
import { EventKinds } from '../types/event-kind';
import type { 
  FloatParameter, 
  IntParameter, 
  EnumParameter, 
  BoolParameter 
} from './parameters';
import {
  createIntParameter,
  createEnumParameter,
  createBoolParameter,
} from './parameters';
import type { SongPart } from './arranger';

// Import notation types
import type {
  ClefType,
  KeySignature,
  TimeSignature,
  ArticulationType,
} from '../notation/types';
import {
  KEY_SIGNATURES,
  COMMON_TIME_SIGNATURES,
  DURATION_VALUES,
  findClosestDuration,
} from '../notation/types';

// ============================================================================
// INTERNAL NOTATION TYPES (simplified for card processing)
// ============================================================================

/**
 * Internal notation event representation (simpler than notation/types.ts).
 * This is converted to the full NotationEvent when rendering.
 */
export interface InternalNotationEvent {
  readonly id: string;
  readonly tick: number;
  readonly pitch: number;
  readonly duration: {
    base: string;  // NoteDurationType
    dots: number;
    tuplet?: { ratio: number; actual: number };
  };
  readonly voice: number;
  readonly accidental?: 'sharp' | 'flat' | 'natural';
  readonly tiedFrom?: string;
  readonly tiedTo?: string;
  readonly articulations?: ArticulationType[];
  readonly sourceCardId?: string;
  readonly sourceEventId?: string;
}

/**
 * Internal measure representation (simpler than notation/types.ts).
 */
export interface InternalNotationMeasure {
  readonly number: number;
  readonly startTick: number;
  readonly events: InternalNotationEvent[];
  readonly timeSignature: TimeSignature;
  readonly keySignature: KeySignature;
  readonly clef?: ClefType;
  readonly barlineType?: 'single' | 'double' | 'final' | 'repeat-start' | 'repeat-end';
  readonly rehearsalMark?: string;
  readonly tempoMarking?: { bpm: number; text: string };
  readonly chordSymbols?: Array<{
    tick: number;
    symbol: string;
    root: string;
    type: string;
    bass?: string;
  }>;
}

// ============================================================================
// SCORENOTATIONCARD TYPES
// ============================================================================

/**
 * Input note event for the ScoreNotationCard.
 * Normalized from various source formats (phrase cards, generators, etc.)
 */
export interface ScoreNoteInput {
  /** Unique ID */
  readonly id: string;
  /** Start tick */
  readonly startTick: Tick;
  /** Duration in ticks */
  readonly durationTick: TickDuration;
  /** MIDI pitch (0-127) */
  readonly pitch: number;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Voice/channel assignment */
  readonly voice: number;
  /** Source card ID (for bidirectional sync) */
  readonly sourceCardId?: string;
  /** Source event ID (for bidirectional sync) */
  readonly sourceEventId?: string;
  /** Articulation hint */
  readonly articulation?: ArticulationType;
  /** Tied from previous note */
  readonly tiedFrom?: string;
  /** Tied to next note */
  readonly tiedTo?: string;
}

/**
 * Arranger section input for score structure.
 */
export interface ArrangerSectionInput {
  /** Section ID */
  readonly id: string;
  /** Section name (becomes rehearsal mark) */
  readonly name: string;
  /** Section type (verse, chorus, etc.) */
  readonly type: string;
  /** Start bar */
  readonly startBar: number;
  /** Length in bars */
  readonly lengthBars: number;
  /** Tempo for this section */
  readonly tempo?: number;
  /** Key for this section */
  readonly key?: string;
  /** Time signature for this section */
  readonly timeSignature?: { numerator: number; denominator: number };
  /** Energy level (affects dynamics) */
  readonly energy?: number;
}

/**
 * Chord symbol input for lead sheet display.
 */
export interface ChordSymbolInput {
  /** Start tick */
  readonly startTick: Tick;
  /** Chord root */
  readonly root: string;
  /** Chord type (major, minor, 7, etc.) */
  readonly type: string;
  /** Bass note if different */
  readonly bass?: string;
  /** Full symbol string */
  readonly symbol: string;
}

/**
 * Display mode for the ScoreNotationCard.
 */
export type ScoreDisplayMode = 
  | 'score'       // Full score with all staves
  | 'leadSheet'   // Lead sheet with melody + chords
  | 'parts'       // Individual parts
  | 'pianoReduction'  // Two-staff piano reduction
  | 'rhythmSlash'     // Rhythm slash notation
  | 'tablature';      // Tablature (for guitar)

/**
 * Staff configuration within the score.
 */
export interface StaffConfiguration {
  /** Staff ID */
  readonly id: string;
  /** Staff name */
  readonly name: string;
  /** Clef type */
  readonly clef: ClefType;
  /** Transposition in semitones */
  readonly transposition: number;
  /** Voice numbers assigned to this staff */
  readonly voices: readonly number[];
  /** Whether to show this staff */
  readonly visible: boolean;
  /** Staff size ratio (1.0 = normal) */
  readonly sizeRatio: number;
}

/**
 * Engraving options for the ScoreNotationCard.
 */
export interface EngravingOptions {
  /** Staff space in pixels */
  readonly staffSpace: number;
  /** Note spacing mode */
  readonly spacingMode: 'proportional' | 'fixed';
  /** Minimum note spacing */
  readonly minNoteSpacing: number;
  /** Whether to use SMuFL font */
  readonly useSMuFL: boolean;
  /** Stem direction preference */
  readonly stemDirection: 'auto' | 'up' | 'down';
  /** Beam grouping style */
  readonly beamGrouping: 'beat' | 'bar' | 'none';
  /** Whether to show courtesy accidentals */
  readonly courtesyAccidentals: boolean;
  /** Whether to show cautionary accidentals */
  readonly cautionaryAccidentals: boolean;
}

/**
 * Page layout options.
 */
export interface PageLayoutOptions {
  /** Page width in mm */
  readonly pageWidth: number;
  /** Page height in mm */
  readonly pageHeight: number;
  /** Top margin in mm */
  readonly marginTop: number;
  /** Bottom margin in mm */
  readonly marginBottom: number;
  /** Left margin in mm */
  readonly marginLeft: number;
  /** Right margin in mm */
  readonly marginRight: number;
  /** Systems per page (0 = auto) */
  readonly systemsPerPage: number;
  /** Bars per system (0 = auto) */
  readonly barsPerSystem: number;
}

/**
 * Output from notation edit (for bidirectional sync).
 */
export interface NotationEditOutput {
  /** Type of edit */
  readonly editType: 'pitch' | 'duration' | 'delete' | 'add' | 'split' | 'merge';
  /** Source event ID that was edited */
  readonly sourceEventId: string;
  /** Source card ID */
  readonly sourceCardId: string;
  /** New values (depends on edit type) */
  readonly newValues: {
    pitch?: number;
    duration?: TickDuration;
    startTick?: Tick;
    velocity?: number;
  };
}

/**
 * Extracted phrase output (for phrase database).
 */
export interface ExtractedPhraseOutput {
  /** Phrase name */
  readonly name: string;
  /** Notes in the phrase */
  readonly notes: readonly ScoreNoteInput[];
  /** Bar range */
  readonly barRange: { start: number; end: number };
  /** Key */
  readonly key: string;
  /** Meter */
  readonly meter: TimeSignature;
}

// ============================================================================
// SCORENOTATIONCARD STATE
// ============================================================================

/**
 * Internal state of the ScoreNotationCard.
 */
export interface ScoreNotationState {
  /** Current display mode */
  displayMode: ScoreDisplayMode;
  /** Staff configurations */
  staves: StaffConfiguration[];
  /** Engraving options */
  engraving: EngravingOptions;
  /** Page layout options */
  pageLayout: PageLayoutOptions;
  /** Current key signature */
  keySignature: KeySignature;
  /** Current time signature */
  timeSignature: TimeSignature;
  /** Tempo in BPM */
  tempo: number;
  /** Ticks per quarter note (PPQ) */
  ticksPerQuarter: number;
  /** Cached notation measures */
  measures: InternalNotationMeasure[];
  /** Selection state */
  selection: {
    noteIds: string[];
    barRange: { start: number; end: number } | null;
  };
  /** Playhead position in ticks */
  playheadTick: Tick | null;
  /** Dirty flag for re-render */
  dirty: boolean;
  /** Version for change tracking */
  version: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_ENGRAVING: EngravingOptions = {
  staffSpace: 10,
  spacingMode: 'proportional',
  minNoteSpacing: 30,
  useSMuFL: true,
  stemDirection: 'auto',
  beamGrouping: 'beat',
  courtesyAccidentals: true,
  cautionaryAccidentals: true,
};

const DEFAULT_PAGE_LAYOUT: PageLayoutOptions = {
  pageWidth: 210,  // A4
  pageHeight: 297,
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 15,
  marginRight: 15,
  systemsPerPage: 0,
  barsPerSystem: 0,
};

const DEFAULT_STAFF_CONFIG: StaffConfiguration = {
  id: 'treble',
  name: 'Treble',
  clef: 'treble',
  transposition: 0,
  voices: [0, 1],
  visible: true,
  sizeRatio: 1.0,
};

// ============================================================================
// SCORENOTATIONCARD CLASS
// ============================================================================

/**
 * ScoreNotationCard - The unified notation display card.
 * 
 * All notation functionality lives in this single card:
 * - Receives phrase/generator/transform card outputs as input
 * - Renders professional-quality notation
 * - Provides bidirectional sync
 * - Integrates with arranger sections
 * - All features are parameters, not separate cards
 */
export class ScoreNotationCard {
  /** Card ID */
  readonly id: string;
  
  /** Card name */
  readonly name = 'ScoreNotation';
  
  /** Card category */
  readonly category = 'notation';
  
  /** Internal state */
  private state: ScoreNotationState;
  
  /** Input notes */
  private inputNotes: ScoreNoteInput[] = [];
  
  /** Input arranger sections */
  private inputSections: ArrangerSectionInput[] = [];
  
  /** Input chord symbols */
  private inputChords: ChordSymbolInput[] = [];
  
  /** Listeners for edit events */
  private editListeners: ((edit: NotationEditOutput) => void)[] = [];
  
  /** Listeners for phrase extraction */
  private extractListeners: ((phrase: ExtractedPhraseOutput) => void)[] = [];
  
  constructor(id: string, initialState?: Partial<ScoreNotationState>) {
    this.id = id;
    this.state = {
      displayMode: 'score',
      staves: [{ ...DEFAULT_STAFF_CONFIG }],
      engraving: { ...DEFAULT_ENGRAVING },
      pageLayout: { ...DEFAULT_PAGE_LAYOUT },
      keySignature: KEY_SIGNATURES['C']!,
      timeSignature: COMMON_TIME_SIGNATURES['4/4']!,
      tempo: 120,
      ticksPerQuarter: 480,
      measures: [],
      selection: { noteIds: [], barRange: null },
      playheadTick: null,
      dirty: true,
      version: 0,
      ...initialState,
    };
  }
  
  // ==========================================================================
  // INPUT PORTS
  // ==========================================================================
  
  /**
   * Set input notes from phrase/generator/transform cards.
   */
  setInputNotes(notes: ScoreNoteInput[]): void {
    this.inputNotes = [...notes];
    this.markDirty();
  }
  
  /**
   * Set arranger sections for score structure.
   */
  setArrangerSections(sections: ArrangerSectionInput[]): void {
    this.inputSections = [...sections];
    this.markDirty();
  }
  
  /**
   * Set chord symbols for lead sheet display.
   */
  setChordSymbols(chords: ChordSymbolInput[]): void {
    this.inputChords = [...chords];
    this.markDirty();
  }
  
  /**
   * Add a single note input.
   */
  addNote(note: ScoreNoteInput): void {
    this.inputNotes.push(note);
    this.markDirty();
  }
  
  /**
   * Remove a note by ID.
   */
  removeNote(noteId: string): void {
    const index = this.inputNotes.findIndex(n => n.id === noteId);
    if (index >= 0) {
      this.inputNotes.splice(index, 1);
      this.markDirty();
    }
  }
  
  // ==========================================================================
  // PARAMETERS
  // ==========================================================================
  
  /**
   * Parameter union type for ScoreNotationCard.
   */
  
  /**
   * Get all parameters for the card.
   */
  getParameters(): Array<FloatParameter | IntParameter | EnumParameter | BoolParameter> {
    return [
      createEnumParameter({
        id: 'displayMode',
        name: 'Display Mode',
        default: this.state.displayMode,
        options: ['score', 'leadSheet', 'parts', 'pianoReduction', 'rhythmSlash', 'tablature'] as const,
      }),
      createEnumParameter({
        id: 'keySignature',
        name: 'Key',
        default: 'C',
        options: Object.keys(KEY_SIGNATURES) as string[],
      }),
      createIntParameter({
        id: 'tempo',
        name: 'Tempo',
        default: this.state.tempo,
        min: 20,
        max: 400,
        step: 1,
        unit: 'BPM',
      }),
      createIntParameter({
        id: 'staffSpace',
        name: 'Staff Size',
        default: this.state.engraving.staffSpace,
        min: 6,
        max: 20,
        step: 1,
        unit: 'px',
      }),
      createEnumParameter({
        id: 'spacingMode',
        name: 'Spacing',
        default: this.state.engraving.spacingMode,
        options: ['proportional', 'fixed'] as const,
      }),
      createEnumParameter({
        id: 'stemDirection',
        name: 'Stems',
        default: this.state.engraving.stemDirection,
        options: ['auto', 'up', 'down'] as const,
      }),
      createEnumParameter({
        id: 'beamGrouping',
        name: 'Beaming',
        default: this.state.engraving.beamGrouping,
        options: ['beat', 'bar', 'none'] as const,
      }),
      createBoolParameter({
        id: 'courtesyAccidentals',
        name: 'Courtesy Accidentals',
        default: this.state.engraving.courtesyAccidentals,
      }),
      createBoolParameter({
        id: 'cautionaryAccidentals',
        name: 'Cautionary Accidentals',
        default: this.state.engraving.cautionaryAccidentals,
      }),
      createIntParameter({
        id: 'pageWidth',
        name: 'Page Width',
        default: this.state.pageLayout.pageWidth,
        min: 100,
        max: 400,
        step: 1,
        unit: 'mm',
      }),
      createIntParameter({
        id: 'pageHeight',
        name: 'Page Height',
        default: this.state.pageLayout.pageHeight,
        min: 100,
        max: 600,
        step: 1,
        unit: 'mm',
      }),
      createIntParameter({
        id: 'barsPerSystem',
        name: 'Bars/System',
        default: this.state.pageLayout.barsPerSystem,
        min: 0,
        max: 16,
        step: 1,
        description: '0 = auto',
      }),
    ];
  }
  
  /**
   * Set a parameter value.
   */
  setParameter(name: string, value: unknown): void {
    switch (name) {
      case 'displayMode':
        this.state.displayMode = value as ScoreDisplayMode;
        break;
      case 'keySignature':
        const key = KEY_SIGNATURES[value as string];
        if (key) this.state.keySignature = key;
        break;
      case 'tempo':
        this.state.tempo = value as number;
        break;
      case 'staffSpace':
        this.state.engraving = { ...this.state.engraving, staffSpace: value as number };
        break;
      case 'spacingMode':
        this.state.engraving = { ...this.state.engraving, spacingMode: value as 'proportional' | 'fixed' };
        break;
      case 'stemDirection':
        this.state.engraving = { ...this.state.engraving, stemDirection: value as 'auto' | 'up' | 'down' };
        break;
      case 'beamGrouping':
        this.state.engraving = { ...this.state.engraving, beamGrouping: value as 'beat' | 'bar' | 'none' };
        break;
      case 'courtesyAccidentals':
        this.state.engraving = { ...this.state.engraving, courtesyAccidentals: value as boolean };
        break;
      case 'cautionaryAccidentals':
        this.state.engraving = { ...this.state.engraving, cautionaryAccidentals: value as boolean };
        break;
      case 'pageWidth':
        this.state.pageLayout = { ...this.state.pageLayout, pageWidth: value as number };
        break;
      case 'pageHeight':
        this.state.pageLayout = { ...this.state.pageLayout, pageHeight: value as number };
        break;
      case 'barsPerSystem':
        this.state.pageLayout = { ...this.state.pageLayout, barsPerSystem: value as number };
        break;
    }
    this.markDirty();
  }
  
  // ==========================================================================
  // PROCESSING
  // ==========================================================================
  
  /**
   * Process input notes into notation measures.
   * This is the main rendering pipeline.
   */
  process(): InternalNotationMeasure[] {
    if (!this.state.dirty && this.state.measures.length > 0) {
      return this.state.measures;
    }
    
    // Convert input notes to notation events
    const notationEvents = this.convertToNotationEvents(this.inputNotes);
    
    // Group into measures
    const measures = this.groupIntoMeasures(notationEvents);
    
    // Apply arranger section markers
    this.applyArrangerSections(measures);
    
    // Add chord symbols
    this.applyChordSymbols(measures);
    
    // Cache the result
    this.state.measures = measures;
    this.state.dirty = false;
    this.state.version++;
    
    return measures;
  }
  
  /**
   * Convert input notes to InternalNotationEvents.
   */
  private convertToNotationEvents(notes: ScoreNoteInput[]): InternalNotationEvent[] {
    const ppq = this.state.ticksPerQuarter;
    
    return notes.map((note, index): InternalNotationEvent => {
      // Calculate duration type from tick duration
      const durationInQuarters = (note.durationTick as number) / ppq;
      const foundDuration = findClosestDuration(durationInQuarters);
      
      const event: InternalNotationEvent = {
        id: note.id || `note-${index}`,
        tick: note.startTick as number,
        pitch: note.pitch,
        duration: {
          base: foundDuration.base,
          dots: foundDuration.dots,
        },
        voice: note.voice,
      };
      
      // Add optional properties
      const accidental = this.calculateAccidental(note.pitch);
      if (accidental !== undefined) {
        (event as any).accidental = accidental;
      }
      if (note.tiedFrom !== undefined) {
        (event as any).tiedFrom = note.tiedFrom;
      }
      if (note.tiedTo !== undefined) {
        (event as any).tiedTo = note.tiedTo;
      }
      if (note.articulation !== undefined) {
        (event as any).articulations = [note.articulation];
      }
      if (note.sourceCardId !== undefined) {
        (event as any).sourceCardId = note.sourceCardId;
      }
      if (note.sourceEventId !== undefined) {
        (event as any).sourceEventId = note.sourceEventId;
      }
      
      return event;
    });
  }
  
  /**
   * Calculate accidental for a pitch given the key signature.
   */
  private calculateAccidental(pitch: number): 'sharp' | 'flat' | 'natural' | undefined {
    const key = this.state.keySignature;
    const noteIndex = pitch % 12;
    
    // Sharp keys: F C G D A E B
    const sharpOrder = [5, 0, 7, 2, 9, 4, 11]; // F# C# G# D# A# E# B#
    // Flat keys: B E A D G C F
    const flatOrder = [11, 4, 9, 2, 7, 0, 5]; // Bb Eb Ab Db Gb Cb Fb
    
    if (key.accidentals > 0) {
      // Sharp key - check if note is in the key
      const sharpsInKey = sharpOrder.slice(0, key.accidentals);
      if (sharpsInKey.includes(noteIndex)) {
        return undefined; // In key signature
      }
      // Check if it needs a natural
      if (sharpsInKey.includes((noteIndex + 1) % 12)) {
        return 'natural';
      }
    } else if (key.accidentals < 0) {
      // Flat key
      const flatsInKey = flatOrder.slice(0, -key.accidentals);
      if (flatsInKey.includes(noteIndex)) {
        return undefined; // In key signature
      }
      if (flatsInKey.includes((noteIndex + 11) % 12)) {
        return 'natural';
      }
    }
    
    // Check for black keys
    const blackKeys = [1, 3, 6, 8, 10]; // C# D# F# G# A#
    if (blackKeys.includes(noteIndex)) {
      return key.accidentals >= 0 ? 'sharp' : 'flat';
    }
    
    return undefined;
  }
  
  /**
   * Group notation events into measures.
   */
  private groupIntoMeasures(events: InternalNotationEvent[]): InternalNotationMeasure[] {
    const { timeSignature, ticksPerQuarter } = this.state;
    const beatsPerMeasure = timeSignature.numerator;
    const beatUnit = timeSignature.denominator;
    const ticksPerBeat = (ticksPerQuarter * 4) / beatUnit;
    const ticksPerMeasure = ticksPerBeat * beatsPerMeasure;
    
    // Find the range of measures needed
    if (events.length === 0) {
      return [this.createEmptyMeasure(0)];
    }
    
    const maxTick = Math.max(...events.map(e => e.tick + ((DURATION_VALUES as Record<string, number>)[e.duration.base] || 1) * ticksPerQuarter));
    const measureCount = Math.ceil(maxTick / ticksPerMeasure) + 1;
    
    // Create measures
    const measures: InternalNotationMeasure[] = [];
    for (let i = 0; i < measureCount; i++) {
      const measureStartTick = i * ticksPerMeasure;
      const measureEndTick = (i + 1) * ticksPerMeasure;
      
      // Find events in this measure
      const measureEvents = events.filter(e => 
        e.tick >= measureStartTick && e.tick < measureEndTick
      );
      
      // Adjust event ticks to be relative to measure start
      const relativeEvents: InternalNotationEvent[] = measureEvents.map(e => ({
        ...e,
        tick: e.tick - measureStartTick,
      }));
      
      const measure: InternalNotationMeasure = {
        number: i + 1,
        startTick: measureStartTick,
        events: relativeEvents,
        timeSignature: this.state.timeSignature,
        keySignature: this.state.keySignature,
        barlineType: i === measureCount - 1 ? 'final' : 'single',
      };
      
      // Add optional properties
      if (i === 0) {
        (measure as any).clef = 'treble';
        (measure as any).tempoMarking = { bpm: this.state.tempo, text: `♩ = ${this.state.tempo}` };
      }
      
      measures.push(measure);
    }
    
    return measures;
  }
  
  /**
   * Create an empty measure.
   */
  private createEmptyMeasure(number: number): InternalNotationMeasure {
    const measure: InternalNotationMeasure = {
      number,
      startTick: 0,
      events: [],
      timeSignature: this.state.timeSignature,
      keySignature: this.state.keySignature,
      barlineType: 'single',
    };
    
    if (number === 0) {
      (measure as any).clef = 'treble';
    }
    
    return measure;
  }
  
  /**
   * Apply arranger section markers to measures.
   */
  private applyArrangerSections(measures: InternalNotationMeasure[]): void {
    for (const section of this.inputSections) {
      const measureIndex = section.startBar - 1;
      if (measureIndex >= 0 && measureIndex < measures.length) {
        const measure = measures[measureIndex]!;
        // Add rehearsal mark
        (measure as any).rehearsalMark = section.name;
        // Add double barline at section boundary (except first measure)
        if (measureIndex > 0) {
          const prevMeasure = measures[measureIndex - 1]!;
          (prevMeasure as any).barlineType = 'double';
        }
        // Apply key/time changes if specified
        if (section.key && KEY_SIGNATURES[section.key]) {
          (measure as any).keySignature = KEY_SIGNATURES[section.key];
        }
        if (section.timeSignature) {
          (measure as any).timeSignature = {
            numerator: section.timeSignature.numerator,
            denominator: section.timeSignature.denominator,
          };
        }
        if (section.tempo) {
          (measure as any).tempoMarking = { 
            bpm: section.tempo, 
            text: `♩ = ${section.tempo}` 
          };
        }
      }
    }
  }
  
  /**
   * Apply chord symbols to measures.
   */
  private applyChordSymbols(measures: InternalNotationMeasure[]): void {
    const ticksPerMeasure = this.getTicksPerMeasure();
    
    for (const chord of this.inputChords) {
      const measureIndex = Math.floor((chord.startTick as number) / ticksPerMeasure);
      if (measureIndex >= 0 && measureIndex < measures.length) {
        const measure = measures[measureIndex]!;
        const tickInMeasure = (chord.startTick as number) % ticksPerMeasure;
        
        // Add chord to measure
        if (!(measure as any).chordSymbols) {
          (measure as any).chordSymbols = [];
        }
        (measure as any).chordSymbols.push({
          tick: tickInMeasure,
          symbol: chord.symbol,
          root: chord.root,
          type: chord.type,
          bass: chord.bass,
        });
      }
    }
  }
  
  /**
   * Get ticks per measure based on current time signature.
   */
  private getTicksPerMeasure(): number {
    const { timeSignature, ticksPerQuarter } = this.state;
    const ticksPerBeat = (ticksPerQuarter * 4) / timeSignature.denominator;
    return ticksPerBeat * timeSignature.numerator;
  }
  
  // ==========================================================================
  // BIDIRECTIONAL SYNC
  // ==========================================================================
  
  /**
   * Edit a note in the notation and emit sync event.
   */
  editNote(noteId: string, changes: { pitch?: number; duration?: TickDuration; velocity?: number }): void {
    const note = this.inputNotes.find(n => n.id === noteId);
    if (!note) return;
    
    // Update local note
    const index = this.inputNotes.indexOf(note);
    this.inputNotes[index] = {
      ...note,
      ...(changes.pitch !== undefined && { pitch: changes.pitch }),
      ...(changes.duration !== undefined && { durationTick: changes.duration }),
      ...(changes.velocity !== undefined && { velocity: changes.velocity }),
    };
    
    // Emit edit event for source card sync
    if (note.sourceCardId && note.sourceEventId) {
      const edit: NotationEditOutput = {
        editType: changes.pitch !== undefined ? 'pitch' : 'duration',
        sourceEventId: note.sourceEventId,
        sourceCardId: note.sourceCardId,
        newValues: changes,
      };
      this.emitEdit(edit);
    }
    
    this.markDirty();
  }
  
  /**
   * Delete a note and emit sync event.
   */
  deleteNote(noteId: string): void {
    const note = this.inputNotes.find(n => n.id === noteId);
    if (!note) return;
    
    // Emit edit event
    if (note.sourceCardId && note.sourceEventId) {
      const edit: NotationEditOutput = {
        editType: 'delete',
        sourceEventId: note.sourceEventId,
        sourceCardId: note.sourceCardId,
        newValues: {},
      };
      this.emitEdit(edit);
    }
    
    this.removeNote(noteId);
  }
  
  /**
   * Register listener for edit events.
   */
  onEdit(listener: (edit: NotationEditOutput) => void): () => void {
    this.editListeners.push(listener);
    return () => {
      const index = this.editListeners.indexOf(listener);
      if (index >= 0) this.editListeners.splice(index, 1);
    };
  }
  
  /**
   * Emit an edit event to all listeners.
   */
  private emitEdit(edit: NotationEditOutput): void {
    for (const listener of this.editListeners) {
      listener(edit);
    }
  }
  
  // ==========================================================================
  // PHRASE EXTRACTION
  // ==========================================================================
  
  /**
   * Extract selected notes as a phrase.
   */
  extractPhrase(name: string): ExtractedPhraseOutput | null {
    const selectedIds = this.state.selection.noteIds;
    if (selectedIds.length === 0) return null;
    
    const selectedNotes = this.inputNotes.filter(n => selectedIds.includes(n.id));
    if (selectedNotes.length === 0) return null;
    
    // Calculate bar range
    const ticksPerMeasure = this.getTicksPerMeasure();
    const minTick = Math.min(...selectedNotes.map(n => n.startTick as number));
    const maxTick = Math.max(...selectedNotes.map(n => (n.startTick as number) + (n.durationTick as number)));
    
    const phrase: ExtractedPhraseOutput = {
      name,
      notes: selectedNotes,
      barRange: {
        start: Math.floor(minTick / ticksPerMeasure) + 1,
        end: Math.ceil(maxTick / ticksPerMeasure),
      },
      key: `${this.state.keySignature.root}${this.state.keySignature.mode === 'minor' ? 'm' : ''}`,
      meter: this.state.timeSignature,
    };
    
    // Emit to listeners
    for (const listener of this.extractListeners) {
      listener(phrase);
    }
    
    return phrase;
  }
  
  /**
   * Register listener for phrase extraction events.
   */
  onExtract(listener: (phrase: ExtractedPhraseOutput) => void): () => void {
    this.extractListeners.push(listener);
    return () => {
      const index = this.extractListeners.indexOf(listener);
      if (index >= 0) this.extractListeners.splice(index, 1);
    };
  }
  
  // ==========================================================================
  // SELECTION
  // ==========================================================================
  
  /**
   * Select notes by ID.
   */
  selectNotes(noteIds: string[]): void {
    this.state.selection.noteIds = [...noteIds];
  }
  
  /**
   * Select notes in a bar range.
   */
  selectBarRange(startBar: number, endBar: number): void {
    const ticksPerMeasure = this.getTicksPerMeasure();
    const startTick = (startBar - 1) * ticksPerMeasure;
    const endTick = endBar * ticksPerMeasure;
    
    const noteIds = this.inputNotes
      .filter(n => (n.startTick as number) >= startTick && (n.startTick as number) < endTick)
      .map(n => n.id);
    
    this.state.selection = {
      noteIds,
      barRange: { start: startBar, end: endBar },
    };
  }
  
  /**
   * Clear selection.
   */
  clearSelection(): void {
    this.state.selection = { noteIds: [], barRange: null };
  }
  
  /**
   * Get current selection.
   */
  getSelection(): { noteIds: string[]; barRange: { start: number; end: number } | null } {
    return { ...this.state.selection };
  }
  
  // ==========================================================================
  // PLAYHEAD
  // ==========================================================================
  
  /**
   * Set playhead position.
   */
  setPlayheadTick(tick: Tick | null): void {
    this.state.playheadTick = tick;
  }
  
  /**
   * Get playhead position.
   */
  getPlayheadTick(): Tick | null {
    return this.state.playheadTick;
  }
  
  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================
  
  /**
   * Get current state.
   */
  getState(): Readonly<ScoreNotationState> {
    return { ...this.state };
  }
  
  /**
   * Get notation measures (triggers process if needed).
   */
  getMeasures(): InternalNotationMeasure[] {
    return this.process();
  }
  
  /**
   * Get input notes.
   */
  getInputNotes(): readonly ScoreNoteInput[] {
    return this.inputNotes;
  }
  
  /**
   * Mark state as dirty (needs re-render).
   */
  private markDirty(): void {
    this.state.dirty = true;
  }
  
  // ==========================================================================
  // STAFF CONFIGURATION
  // ==========================================================================
  
  /**
   * Add a staff configuration.
   */
  addStaff(config: StaffConfiguration): void {
    this.state.staves.push(config);
    this.markDirty();
  }
  
  /**
   * Remove a staff by ID.
   */
  removeStaff(staffId: string): void {
    this.state.staves = this.state.staves.filter(s => s.id !== staffId);
    this.markDirty();
  }
  
  /**
   * Update a staff configuration.
   */
  updateStaff(staffId: string, updates: Partial<StaffConfiguration>): void {
    const index = this.state.staves.findIndex(s => s.id === staffId);
    if (index >= 0) {
      this.state.staves[index] = { ...this.state.staves[index]!, ...updates };
      this.markDirty();
    }
  }
  
  /**
   * Get staff configurations.
   */
  getStaves(): readonly StaffConfiguration[] {
    return this.state.staves;
  }
  
  // ==========================================================================
  // SERIALIZATION
  // ==========================================================================
  
  /**
   * Serialize card state for persistence.
   */
  serialize(): object {
    return {
      id: this.id,
      name: this.name,
      state: {
        displayMode: this.state.displayMode,
        staves: this.state.staves,
        engraving: this.state.engraving,
        pageLayout: this.state.pageLayout,
        keySignature: this.state.keySignature,
        timeSignature: this.state.timeSignature,
        tempo: this.state.tempo,
        ticksPerQuarter: this.state.ticksPerQuarter,
      },
      inputNotes: this.inputNotes,
      inputSections: this.inputSections,
      inputChords: this.inputChords,
    };
  }
  
  /**
   * Deserialize card state from persistence.
   */
  static deserialize(data: any): ScoreNotationCard {
    const card = new ScoreNotationCard(data.id, data.state);
    card.inputNotes = data.inputNotes || [];
    card.inputSections = data.inputSections || [];
    card.inputChords = data.inputChords || [];
    return card;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a ScoreNotationCard with default settings.
 */
export function createScoreNotationCard(id?: string): ScoreNotationCard {
  return new ScoreNotationCard(id || `score-notation-${Date.now()}`);
}

/**
 * Create a lead sheet notation card.
 */
export function createLeadSheetCard(id?: string): ScoreNotationCard {
  return new ScoreNotationCard(id || `lead-sheet-${Date.now()}`, {
    displayMode: 'leadSheet',
    staves: [{
      id: 'melody',
      name: 'Melody',
      clef: 'treble',
      transposition: 0,
      voices: [0],
      visible: true,
      sizeRatio: 1.0,
    }],
  });
}

/**
 * Create a piano score notation card.
 */
export function createPianoScoreCard(id?: string): ScoreNotationCard {
  return new ScoreNotationCard(id || `piano-score-${Date.now()}`, {
    displayMode: 'pianoReduction',
    staves: [
      {
        id: 'right',
        name: 'Right Hand',
        clef: 'treble',
        transposition: 0,
        voices: [0, 1],
        visible: true,
        sizeRatio: 1.0,
      },
      {
        id: 'left',
        name: 'Left Hand',
        clef: 'bass',
        transposition: 0,
        voices: [2, 3],
        visible: true,
        sizeRatio: 1.0,
      },
    ],
  });
}

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Convert Event<P> to ScoreNoteInput.
 */
export function eventToScoreNote(
  event: Event<{ pitch: number; velocity: number }>,
  sourceCardId?: string
): ScoreNoteInput {
  const result: ScoreNoteInput = {
    id: event.id,
    startTick: event.start,
    durationTick: event.duration,
    pitch: event.payload.pitch,
    velocity: event.payload.velocity,
    voice: 0,
  };
  
  // Only add optional properties if they have values
  if (sourceCardId !== undefined) {
    (result as any).sourceCardId = sourceCardId;
    (result as any).sourceEventId = event.id;
  }
  
  return result;
}

/**
 * Convert ScoreNoteInput to Event.
 */
export function scoreNoteToEvent(
  note: ScoreNoteInput
): Event<{ pitch: number; velocity: number }> {
  return createEvent({
    kind: EventKinds.NOTE,
    start: note.startTick,
    duration: note.durationTick,
    payload: {
      pitch: note.pitch,
      velocity: note.velocity,
    },
  });
}

/**
 * Convert SongPart to ArrangerSectionInput.
 */
export function songPartToSectionInput(
  part: SongPart,
  startBar: number
): ArrangerSectionInput {
  const result: ArrangerSectionInput = {
    id: part.id,
    name: part.name,
    type: part.type,
    startBar,
    lengthBars: part.lengthBars,
  };
  
  // Only add optional properties if defined
  if (part.tempoOverride !== null && part.tempoOverride !== undefined) {
    (result as any).tempo = part.tempoOverride;
  }
  if (part.energy !== undefined) {
    (result as any).energy = part.energy;
  }
  
  return result;
}
