/**
 * @fileoverview Tracker Panel - Renoise-inspired sequencer view.
 * 
 * Provides a row/column grid interface for event editing.
 * Rows represent ticks, columns represent event fields (note, velocity, etc.).
 * 
 * @module @cardplay/ui/components/tracker-panel
 * @see cardplay2.md Part VI Section 6.2 - Tracker
 */

import type { Event } from '../../types/event';
import { createEvent, createNoteEvent, updateEvent, updateEventPayload } from '../../types/event';
import type { Tick, TickDuration } from '../../types/primitives';
import { asTick, asTickDuration } from '../../types/primitives';
import type { Stream } from '../../streams';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Track column types in the tracker.
 */
export type ColumnType = 
  | 'note'         // Pitch and octave
  | 'instrument'   // Sample/instrument ID
  | 'volume'       // Velocity or gain (0-127)
  | 'delay'        // Microtiming offset
  | 'effect1'      // First effect column
  | 'effect2'      // Second effect column
  | 'effect3'      // Third effect column
  | 'effect4';     // Fourth effect column

/**
 * Column configuration for a track.
 */
export interface TrackColumn {
  /** Column type */
  readonly type: ColumnType;
  /** Display width in pixels */
  readonly width: number;
  /** Whether column is visible */
  readonly visible: boolean;
  /** Column label */
  readonly label: string;
}

/**
 * Track configuration in the tracker.
 */
export interface TrackerTrack {
  /** Track ID */
  readonly id: string;
  /** Track name */
  readonly name: string;
  /** Track columns */
  readonly columns: readonly TrackColumn[];
  /** Total track width (sum of column widths) */
  readonly width: number;
  /** Whether track is muted */
  readonly muted: boolean;
  /** Whether track is soloed */
  readonly soloed: boolean;
  /** Track color */
  readonly color: string;
}

/**
 * Row in the tracker (represents a tick position).
 */
export interface TrackerRow {
  /** Row index (0-based) */
  readonly index: number;
  /** Tick position this row represents */
  readonly tick: Tick;
  /** Whether this row is on a beat */
  readonly onBeat: boolean;
  /** Whether this row is on a bar */
  readonly onBar: boolean;
  /** Row height in pixels */
  readonly height: number;
}

/**
 * Cell in the tracker (intersection of track column and row).
 */
export interface TrackerCell {
  /** Track ID */
  readonly trackId: string;
  /** Column type */
  readonly column: ColumnType;
  /** Row index */
  readonly row: number;
  /** Event data at this cell (if any) */
  readonly event?: Event<unknown>;
  /** Display value for this cell */
  readonly value: string;
  /** Whether cell is empty */
  readonly empty: boolean;
}

/**
 * Selection in the tracker.
 */
export interface TrackerSelection {
  /** Start row */
  readonly startRow: number;
  /** End row (inclusive) */
  readonly endRow: number;
  /** Start track ID */
  readonly startTrack: string;
  /** End track ID */
  readonly endTrack: string;
  /** Start column */
  readonly startColumn: ColumnType;
  /** End column */
  readonly endColumn: ColumnType;
  /** Whether this is a block selection (multiple cells) */
  readonly isBlock: boolean;
}

/**
 * Cursor position in the tracker.
 */
export interface TrackerCursor {
  /** Current row */
  readonly row: number;
  /** Current track ID */
  readonly trackId: string;
  /** Current column */
  readonly column: ColumnType;
}

/**
 * Display format for velocity values.
 */
export type VelocityDisplayFormat = 'hex' | 'decimal' | 'percentage';

/**
 * Display format for duration values.
 */
export type DurationDisplayFormat = 'ticks' | 'note-length' | 'ms';

/**
 * Color scheme for velocity visualization.
 */
export interface VelocityColorScheme {
  /** Low velocity color (0-42) */
  readonly low: string;
  /** Medium velocity color (43-84) */
  readonly medium: string;
  /** High velocity color (85-127) */
  readonly high: string;
}

/**
 * Color scheme for pitch visualization.
 */
export interface PitchColorScheme {
  /** Low pitch color (C0-B2) */
  readonly low: string;
  /** Mid pitch color (C3-B5) */
  readonly mid: string;
  /** High pitch color (C6+) */
  readonly high: string;
}

/**
 * Custom note color mapping for special event types.
 * Allows override of default colors for specific notes or events.
 */
export interface CustomNoteColor {
  /** Event ID or note pitch to colorize */
  readonly key: string | number;
  /** CSS color value */
  readonly color: string;
  /** Opacity (0-1) */
  readonly opacity?: number;
}

/**
 * Articulation marker symbols for tracker display.
 */
export type ArticulationSymbol = 
  | 'legato'     // ~ or ═
  | 'staccato'   // · or .
  | 'accent'     // > or ^
  | 'glide'      // ↗ or /
  | 'tie'        // — or _
  | 'cut'        // ✂ or x
  | 'fade'       // ◐ or f
  | 'off'        // ◯ or o;

/**
 * Tracker panel configuration.
 */
export interface TrackerPanelConfig {
  /** Number of rows visible */
  readonly visibleRows: number;
  /** Default row height in pixels */
  readonly rowHeight: number;
  /** Pattern length in rows */
  readonly patternLength: number;
  /** Rows per beat */
  readonly rowsPerBeat: number;
  /** Beats per bar */
  readonly beatsPerBar: number;
  /** Tracks in this tracker */
  readonly tracks: readonly TrackerTrack[];
  /** Grid style */
  readonly gridStyle: 'minimal' | 'standard' | 'detailed';
  /** Font size */
  readonly fontSize: number;
  /** Show row numbers */
  readonly showRowNumbers: boolean;
  /** Show beat markers */
  readonly showBeatMarkers: boolean;
  /** Show bar markers */
  readonly showBarMarkers: boolean;
  /** Velocity display format */
  readonly velocityFormat: VelocityDisplayFormat;
  /** Duration display format */
  readonly durationFormat: DurationDisplayFormat;
  /** Color-code velocity */
  readonly colorCodeVelocity: boolean;
  /** Color-code pitch */
  readonly colorCodePitch: boolean;
  /** Velocity color scheme */
  readonly velocityColors: VelocityColorScheme;
  /** Pitch color scheme */
  readonly pitchColors: PitchColorScheme;
  /** Show ghost notes */
  readonly showGhostNotes: boolean;
  /** Show articulation symbols */
  readonly showArticulations: boolean;
  /** Custom note colors (overrides default coloring) */
  readonly customNoteColors: readonly CustomNoteColor[];
  /** Show tied note visualization */
  readonly showTiedNotes: boolean;
  /** Show off-note markers (note-off events) */
  readonly showOffNotes: boolean;
  /** Show cut/fade markers */
  readonly showCutFadeMarkers: boolean;
  /** Show legato indicators */
  readonly showLegato: boolean;
  /** Show glide indicators */
  readonly showGlide: boolean;
  /** Show accent markers */
  readonly showAccents: boolean;
  /** Show expression lane mini-display */
  readonly showExpressionLanes: boolean;
}

/**
 * Tracker panel state.
 */
export interface TrackerPanelState {
  /** Configuration */
  readonly config: TrackerPanelConfig;
  /** Current cursor position */
  readonly cursor: TrackerCursor;
  /** Current selection (if any) */
  readonly selection?: TrackerSelection;
  /** Scroll position (top row) */
  readonly scrollRow: number;
  /** Scroll position (left pixel) */
  readonly scrollX: number;
  /** Playhead position (row index) */
  readonly playheadRow: number;
  /** Event data source */
  readonly stream: Stream<Event<unknown>>;
}

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Creates default column configuration for a track.
 */
export function createDefaultColumns(): readonly TrackColumn[] {
  return [
    { type: 'note', width: 60, visible: true, label: 'Note' },
    { type: 'instrument', width: 40, visible: true, label: 'Inst' },
    { type: 'volume', width: 40, visible: true, label: 'Vol' },
    { type: 'delay', width: 30, visible: false, label: 'Dly' },
    { type: 'effect1', width: 50, visible: false, label: 'FX1' },
    { type: 'effect2', width: 50, visible: false, label: 'FX2' },
  ];
}

/**
 * Creates a tracker track.
 */
export function createTrackerTrack(
  id: string,
  name: string,
  options: {
    columns?: readonly TrackColumn[];
    color?: string;
  } = {}
): TrackerTrack {
  const columns = options.columns ?? createDefaultColumns();
  const width = columns.reduce((sum, col) => sum + (col.visible ? col.width : 0), 0);

  return Object.freeze({
    id,
    name,
    columns,
    width,
    muted: false,
    soloed: false,
    color: options.color ?? '#4A90E2',
  });
}

/**
 * Creates a tracker row.
 */
export function createTrackerRow(
  index: number,
  tick: Tick,
  config: Pick<TrackerPanelConfig, 'rowsPerBeat' | 'beatsPerBar' | 'rowHeight'>
): TrackerRow {
  const onBeat = index % config.rowsPerBeat === 0;
  const onBar = index % (config.rowsPerBeat * config.beatsPerBar) === 0;

  return Object.freeze({
    index,
    tick,
    onBeat,
    onBar,
    height: config.rowHeight,
  });
}

/**
 * Creates default tracker panel configuration.
 */
export function createTrackerPanelConfig(
  options: Partial<TrackerPanelConfig> = {}
): TrackerPanelConfig {
  return Object.freeze({
    visibleRows: options.visibleRows ?? 64,
    rowHeight: options.rowHeight ?? 20,
    patternLength: options.patternLength ?? 64,
    rowsPerBeat: options.rowsPerBeat ?? 4,
    beatsPerBar: options.beatsPerBar ?? 4,
    tracks: options.tracks ?? [
      createTrackerTrack('track-1', 'Track 1'),
      createTrackerTrack('track-2', 'Track 2'),
    ],
    gridStyle: options.gridStyle ?? 'standard',
    fontSize: options.fontSize ?? 12,
    showRowNumbers: options.showRowNumbers ?? true,
    showBeatMarkers: options.showBeatMarkers ?? true,
    showBarMarkers: options.showBarMarkers ?? true,
    velocityFormat: options.velocityFormat ?? 'hex',
    durationFormat: options.durationFormat ?? 'ticks',
    colorCodeVelocity: options.colorCodeVelocity ?? false,
    colorCodePitch: options.colorCodePitch ?? false,
    velocityColors: options.velocityColors ?? {
      low: '#6A89CC',
      medium: '#F8C291',
      high: '#E55039',
    },
    pitchColors: options.pitchColors ?? {
      low: '#4A69BD',
      mid: '#78E08F',
      high: '#F19066',
    },
    showGhostNotes: options.showGhostNotes ?? true,
    showArticulations: options.showArticulations ?? true,
    customNoteColors: options.customNoteColors ?? [],
    showTiedNotes: options.showTiedNotes ?? true,
    showOffNotes: options.showOffNotes ?? false,
    showCutFadeMarkers: options.showCutFadeMarkers ?? true,
    showLegato: options.showLegato ?? true,
    showGlide: options.showGlide ?? true,
    showAccents: options.showAccents ?? true,
    showExpressionLanes: options.showExpressionLanes ?? false,
  });
}

/**
 * Creates initial tracker panel state.
 */
export function createTrackerPanelState(
  stream: Stream<Event<unknown>>,
  config?: Partial<TrackerPanelConfig>
): TrackerPanelState {
  const fullConfig = createTrackerPanelConfig(config);
  const firstTrack = fullConfig.tracks[0];

  return Object.freeze({
    config: fullConfig,
    cursor: {
      row: 0,
      trackId: firstTrack?.id ?? 'track-1',
      column: 'note' as ColumnType,
    },
    scrollRow: 0,
    scrollX: 0,
    playheadRow: 0,
    stream,
  });
}

// ============================================================================
// ROW/COLUMN GRID WITH FIXED HEADERS
// ============================================================================

/**
 * Layout information for the tracker grid.
 */
export interface TrackerGridLayout {
  /** Total width of all tracks */
  readonly totalWidth: number;
  /** Total height of visible rows */
  readonly totalHeight: number;
  /** Width of row number column */
  readonly rowNumberWidth: number;
  /** Height of header row */
  readonly headerHeight: number;
  /** Track positions (left offset for each track) */
  readonly trackPositions: ReadonlyMap<string, number>;
}

/**
 * Calculates grid layout from configuration.
 */
export function calculateGridLayout(config: TrackerPanelConfig): TrackerGridLayout {
  const rowNumberWidth = config.showRowNumbers ? 50 : 0;
  const headerHeight = 30;

  // Calculate track positions
  const trackPositions = new Map<string, number>();
  let x = 0;
  for (const track of config.tracks) {
    trackPositions.set(track.id, x);
    x += track.width;
  }

  return Object.freeze({
    totalWidth: x,
    totalHeight: config.visibleRows * config.rowHeight,
    rowNumberWidth,
    headerHeight,
    trackPositions,
  });
}

// ============================================================================
// TRACK COLUMNS WITH CONFIGURABLE WIDTH
// ============================================================================

/**
 * Toggles column visibility.
 */
export function toggleColumnVisibility(
  track: TrackerTrack,
  columnType: ColumnType
): TrackerTrack {
  const columns = track.columns.map(col =>
    col.type === columnType
      ? { ...col, visible: !col.visible }
      : col
  );

  const width = columns.reduce((sum, col) => sum + (col.visible ? col.width : 0), 0);

  return Object.freeze({
    ...track,
    columns,
    width,
  });
}

/**
 * Sets column width.
 */
export function setColumnWidth(
  track: TrackerTrack,
  columnType: ColumnType,
  width: number
): TrackerTrack {
  const columns = track.columns.map(col =>
    col.type === columnType
      ? { ...col, width }
      : col
  );

  const totalWidth = columns.reduce((sum, col) => sum + (col.visible ? col.width : 0), 0);

  return Object.freeze({
    ...track,
    columns,
    width: totalWidth,
  });
}

// ============================================================================
// STEP ROWS WITH NOTE/VELOCITY/DURATION
// ============================================================================

/**
 * Gets the event at a specific row for a track.
 */
export function getEventAtRow(
  stream: Stream<Event<unknown>>,
  row: number,
  ticksPerRow: number
): Event<unknown> | undefined {
  const tick = (row * ticksPerRow) as Tick;
  
  // Find event that starts at or before this tick and extends into it
  return stream.events.find(evt => {
    const eventEnd = evt.start + evt.duration;
    return evt.start <= tick && eventEnd > tick;
  });
}

/**
 * Converts an event to cell display value for a specific column.
 */
export function eventToCellValue(
  event: Event<unknown> | undefined,
  column: ColumnType,
  config?: Pick<TrackerPanelConfig, 'velocityFormat' | 'durationFormat'>
): string {
  if (!event) {
    return '...';
  }

  switch (column) {
    case 'note':
      // Assuming payload has pitch property (MIDI note number)
      if (typeof (event.payload as any)?.pitch === 'number') {
        const pitch = (event.payload as any).pitch;
        return formatNoteDisplay(pitch);
      }
      return '---';
    
    case 'instrument':
      return formatInstrumentDisplay(event);
    
    case 'volume':
      return formatVelocityDisplay(event, config?.velocityFormat ?? 'hex');
    
    case 'delay':
      return formatDelayDisplay(event);
    
    case 'effect1':
    case 'effect2':
    case 'effect3':
    case 'effect4':
      return formatEffectDisplay(event, column);
    
    default:
      return '...';
  }
}

/**
 * Formats note name display (C#4, D5, etc.) - Item 2329.
 */
export function formatNoteDisplay(pitch: number): string {
  return formatMIDINote(pitch);
}

/**
 * Formats velocity display (00-7F or percentage) - Item 2330.
 */
export function formatVelocityDisplay(
  event: Event<unknown>,
  format: VelocityDisplayFormat = 'hex'
): string {
  if (typeof (event.payload as any)?.velocity !== 'number') {
    return '--';
  }
  
  const vel = Math.max(0, Math.min(127, (event.payload as any).velocity));
  
  switch (format) {
    case 'hex':
      return vel.toString(16).toUpperCase().padStart(2, '0');
    case 'decimal':
      return vel.toString().padStart(3, ' ');
    case 'percentage':
      return Math.round((vel / 127) * 100).toString().padStart(3, ' ') + '%';
    default:
      return '--';
  }
}

/**
 * Formats duration display (ticks or note length) - Item 2331.
 */
export function formatDurationDisplay(
  event: Event<unknown>,
  format: DurationDisplayFormat = 'ticks',
  ticksPerBeat = 96
): string {
  const duration = event.duration;
  
  switch (format) {
    case 'ticks':
      return duration.toString().padStart(4, ' ');
    case 'note-length': {
      // Convert ticks to note length (1/4, 1/8, 1/16, etc.)
      const wholeTicks = ticksPerBeat * 4;
      if (duration >= wholeTicks) return '1/1';
      if (duration >= wholeTicks / 2) return '1/2';
      if (duration >= wholeTicks / 4) return '1/4';
      if (duration >= wholeTicks / 8) return '1/8';
      if (duration >= wholeTicks / 16) return '1/16';
      if (duration >= wholeTicks / 32) return '1/32';
      return '1/64';
    }
    case 'ms': {
      // Assuming 120 BPM for estimation (500ms per beat)
      const ms = Math.round((duration / ticksPerBeat) * 500);
      return ms.toString().padStart(4, ' ') + 'ms';
    }
    default:
      return '----';
  }
}

/**
 * Formats instrument column display - Item 2332.
 */
export function formatInstrumentDisplay(event: Event<unknown>): string {
  if (typeof (event.payload as any)?.instrument === 'string') {
    const inst = (event.payload as any).instrument as string;
    // Take first 2 characters as abbreviation
    return inst.slice(0, 2).toUpperCase().padEnd(2, '.');
  }
  if (typeof (event.payload as any)?.program === 'number') {
    // MIDI program number
    const prog = (event.payload as any).program;
    return prog.toString(16).toUpperCase().padStart(2, '0');
  }
  return '..';
}

/**
 * Formats effect column display - Item 2333.
 */
export function formatEffectDisplay(
  event: Event<unknown>,
  column: ColumnType
): string {
  const effects = (event.payload as any)?.effects as unknown[];
  if (!Array.isArray(effects)) {
    return '...';
  }
  
  const effectIndex = parseInt(column.slice(-1)) - 1;
  const effect = effects[effectIndex];
  if (!effect) {
    return '...';
  }
  
  // Format: EffectTypeValue (e.g., "V40" for volume 0x40)
  if (typeof effect === 'object' && effect !== null) {
    const type = (effect as any).type as string;
    const value = (effect as any).value as number;
    if (typeof type === 'string' && typeof value === 'number') {
      const typeCode = type.charAt(0).toUpperCase();
      const hexValue = value.toString(16).toUpperCase().padStart(2, '0');
      return `${typeCode}${hexValue}`;
    }
  }
  
  return '...';
}

/**
 * Formats panning column display - Item 2334.
 */
export function formatPanningDisplay(event: Event<unknown>): string {
  if (typeof (event.payload as any)?.pan === 'number') {
    const pan = (event.payload as any).pan;
    // Pan range: -1.0 (left) to 1.0 (right), display as 00-7F (center=40)
    const panValue = Math.round(((pan + 1) / 2) * 127);
    return panValue.toString(16).toUpperCase().padStart(2, '0');
  }
  return '--';
}

/**
 * Formats delay column display - Item 2335.
 */
export function formatDelayDisplay(event: Event<unknown>): string {
  if (typeof (event.payload as any)?.delay === 'number') {
    const delay = (event.payload as any).delay;
    // Microtiming offset in ticks (-128 to +127)
    return Math.abs(delay).toString(16).toUpperCase().padStart(2, '0');
  }
  return '00';
}

/**
 * Formats probability column display - Item 2336.
 */
export function formatProbabilityDisplay(event: Event<unknown>): string {
  if (typeof (event.payload as any)?.probability === 'number') {
    const prob = (event.payload as any).probability;
    // Probability as percentage (0-100)
    return Math.round(prob * 100).toString().padStart(3, ' ') + '%';
  }
  return '100%';
}

/**
 * Formats MIDI note number to tracker notation (C-4, D#3, etc.).
 */
function formatMIDINote(pitch: number): string {
  const notes = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
  const octave = Math.floor(pitch / 12) - 1;
  const note = notes[pitch % 12];
  return `${note}${octave}`;
}


// ============================================================================
// CELL RENDERING WITH EVENT DATA
// ============================================================================

/**
 * Renders a cell's display value.
 */
export function renderCell(
  state: TrackerPanelState,
  trackId: string,
  column: ColumnType,
  row: number
): TrackerCell {
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const event = getEventAtRow(state.stream, row, ticksPerRow);
  const value = eventToCellValue(event, column, state.config);

  const cell: TrackerCell = {
    trackId,
    column,
    row,
    value,
    empty: !event,
  };

  if (event !== undefined) {
    (cell as { event: Event<unknown> }).event = event;
  }

  return cell;
}

// ============================================================================
// COLOR-CODING SUPPORT
// ============================================================================

/**
 * Gets velocity color based on value - Item 2337.
 */
export function getVelocityColor(
  velocity: number,
  colorScheme: VelocityColorScheme
): string {
  if (velocity < 43) return colorScheme.low;
  if (velocity < 85) return colorScheme.medium;
  return colorScheme.high;
}

/**
 * Gets pitch color based on value - Item 2338.
 */
export function getPitchColor(
  pitch: number,
  colorScheme: PitchColorScheme
): string {
  if (pitch < 36) return colorScheme.low;  // C0-B2
  if (pitch < 72) return colorScheme.mid;  // C3-B5
  return colorScheme.high;  // C6+
}

/**
 * Gets custom note color if specified - Item 2339.
 */
export function getCustomNoteColor(event: Event<unknown>): string | undefined {
  return (event.payload as any)?.color as string | undefined;
}

/**
 * Gets cell color based on configuration and event data.
 */
export function getCellColor(
  event: Event<unknown> | undefined,
  column: ColumnType,
  config: TrackerPanelConfig
): string | undefined {
  if (!event) return undefined;
  
  // Check for custom note color first
  const customColor = getCustomNoteColor(event);
  if (customColor) return customColor;
  
  // Apply color-coding based on column and configuration
  if (column === 'note' && config.colorCodePitch) {
    if (typeof (event.payload as any)?.pitch === 'number') {
      return getPitchColor((event.payload as any).pitch, config.pitchColors);
    }
  }
  
  if (column === 'volume' && config.colorCodeVelocity) {
    if (typeof (event.payload as any)?.velocity === 'number') {
      return getVelocityColor((event.payload as any).velocity, config.velocityColors);
    }
  }
  
  return undefined;
}

// ============================================================================
// NOTE STATE VISUALIZATION
// ============================================================================

/**
 * Checks if event is a ghost note - Item 2340.
 */
export function isGhostNote(event: Event<unknown>): boolean {
  return (event.payload as any)?.ghost === true;
}

/**
 * Checks if event is tied to previous note - Item 2341.
 */
export function isTiedNote(event: Event<unknown>): boolean {
  return (event.payload as any)?.tied === true;
}

/**
 * Checks if event is an off-note marker - Item 2342.
 */
export function isOffNote(event: Event<unknown>): boolean {
  return event.kind === 'note-off' || (event.payload as any)?.noteOff === true;
}

/**
 * Checks if event has cut marker - Item 2343.
 */
export function hasCutMarker(event: Event<unknown>): boolean {
  return (event.payload as any)?.cut === true;
}

/**
 * Checks if event has fade marker - Item 2343.
 */
export function hasFadeMarker(event: Event<unknown>): boolean {
  return (event.payload as any)?.fade === true;
}

/**
 * Checks if event has legato indicator - Item 2344.
 */
export function hasLegatoIndicator(event: Event<unknown>): boolean {
  return (event.payload as any)?.legato === true ||
         (event.payload as any)?.articulation === 'legato';
}

/**
 * Checks if event has glide indicator - Item 2345.
 */
export function hasGlideIndicator(event: Event<unknown>): boolean {
  return (event.payload as any)?.glide === true ||
         (event.payload as any)?.portamento === true;
}

/**
 * Checks if event has accent marker - Item 2346.
 */
export function hasAccentMarker(event: Event<unknown>): boolean {
  return (event.payload as any)?.accent === true ||
         (event.payload as any)?.articulation === 'accent';
}

/**
 * Gets articulation symbol for event - Item 2347.
 */
export function getArticulationSymbol(event: Event<unknown>): string | undefined {
  const articulation = (event.payload as any)?.articulation as string;
  if (!articulation) return undefined;
  
  const symbols: Record<string, string> = {
    'staccato': '.',
    'accent': '>',
    'tenuto': '-',
    'legato': '~',
    'marcato': '^',
    'portamento': '/',
    'glissando': '\\',
    'trill': 'tr',
    'mordent': 'm',
    'turn': 't',
    'fermata': 'U',
  };
  
  return symbols[articulation];
}

/**
 * Gets expression lane mini-display value - Item 2348.
 */
export function getExpressionDisplay(
  event: Event<unknown>,
  expressionType: 'velocity' | 'pressure' | 'timbre' | 'slide'
): string {
  const expression = (event.payload as any)?.[expressionType] as number;
  if (typeof expression !== 'number') return '';
  
  // Display as mini bar graph (0-7 level)
  const level = Math.floor((expression / 127) * 7);
  return '▁▂▃▄▅▆▇█'.charAt(level);
}

// ============================================================================
// EMPTY CELL PLACEHOLDER DISPLAY
// ============================================================================

/**
 * Gets placeholder text for an empty cell.
 */
export function getEmptyCellPlaceholder(column: ColumnType): string {
  switch (column) {
    case 'note':
      return '...';
    case 'instrument':
      return '..';
    case 'volume':
      return '..';
    case 'delay':
      return '..';
    case 'effect1':
    case 'effect2':
    case 'effect3':
    case 'effect4':
      return '...';
    default:
      return '';
  }
}

// ============================================================================
// CSS STYLING
// ============================================================================

/**
 * Generates CSS for tracker panel.
 */
export function generateTrackerCSS(config: TrackerPanelConfig): string {
  return `
    .tracker-panel {
      display: grid;
      grid-template-columns: ${config.showRowNumbers ? '50px' : '0'} 1fr;
      grid-template-rows: 30px 1fr;
      font-family: 'Courier New', monospace;
      font-size: ${config.fontSize}px;
      color: var(--text-primary, #E0E0E0);
      background: var(--bg-secondary, #1E1E1E);
      overflow: hidden;
    }

    .tracker-header {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      background: var(--bg-tertiary, #2A2A2A);
      border-bottom: 1px solid var(--border, #3A3A3A);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .tracker-row-numbers {
      grid-column: 1;
      grid-row: 2;
      background: var(--bg-tertiary, #2A2A2A);
      border-right: 1px solid var(--border, #3A3A3A);
      overflow: hidden;
      position: sticky;
      left: 0;
      z-index: 5;
    }

    .tracker-grid {
      grid-column: 2;
      grid-row: 2;
      overflow: auto;
      position: relative;
    }

    .tracker-row {
      display: flex;
      height: ${config.rowHeight}px;
      border-bottom: 1px solid var(--grid-line, #2A2A2A);
    }

    .tracker-row.on-beat {
      border-bottom-color: var(--grid-beat, #3A3A3A);
    }

    .tracker-row.on-bar {
      border-bottom-color: var(--grid-bar, #4A4A4A);
    }

    .tracker-cell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border-right: 1px solid var(--grid-line, #2A2A2A);
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    .tracker-cell:hover {
      background: var(--cell-hover, #2A2A3A);
    }

    .tracker-cell.selected {
      background: var(--cell-selected, #3A4A5A);
    }

    .tracker-cell.empty {
      color: var(--text-disabled, #606060);
    }

    .tracker-cell.current {
      outline: 2px solid var(--cursor, #4A90E2);
      outline-offset: -2px;
    }

    /* Ghost note styling */
    .tracker-cell.ghost-note {
      opacity: 0.5;
      font-style: italic;
    }

    /* Tied note styling */
    .tracker-cell.tied-note::before {
      content: '~';
      position: absolute;
      left: 2px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.7em;
      opacity: 0.7;
    }

    /* Off-note marker styling */
    .tracker-cell.off-note {
      text-decoration: line-through;
      opacity: 0.7;
    }

    /* Cut marker styling */
    .tracker-cell.has-cut::after {
      content: '×';
      position: absolute;
      right: 2px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.7em;
      color: var(--error, #E74C3C);
    }

    /* Fade marker styling */
    .tracker-cell.has-fade::after {
      content: '↓';
      position: absolute;
      right: 2px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.7em;
      opacity: 0.7;
    }

    /* Legato indicator */
    .tracker-cell.legato::after {
      content: '~';
      position: absolute;
      right: 2px;
      bottom: 2px;
      font-size: 0.6em;
      color: var(--accent, #4A90E2);
    }

    /* Glide indicator */
    .tracker-cell.glide::after {
      content: '/';
      position: absolute;
      right: 2px;
      bottom: 2px;
      font-size: 0.6em;
      color: var(--accent, #4A90E2);
    }

    /* Accent marker */
    .tracker-cell.accent {
      font-weight: bold;
      text-shadow: 0 0 2px currentColor;
    }

    /* Articulation symbol overlay */
    .tracker-cell .articulation-symbol {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.6em;
      opacity: 0.8;
    }

    /* Expression lane mini-display */
    .tracker-cell .expression-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      opacity: 0.5;
    }

    .tracker-playhead {
      position: absolute;
      left: 0;
      right: 0;
      height: ${config.rowHeight}px;
      background: var(--playhead-bg, rgba(74, 144, 226, 0.1));
      border-top: 2px solid var(--playhead, #4A90E2);
      pointer-events: none;
      z-index: 2;
    }

    /* Velocity color-coding */
    .tracker-cell.velocity-low {
      color: ${config.velocityColors.low};
    }

    .tracker-cell.velocity-medium {
      color: ${config.velocityColors.medium};
    }

    .tracker-cell.velocity-high {
      color: ${config.velocityColors.high};
    }

    /* Pitch color-coding */
    .tracker-cell.pitch-low {
      color: ${config.pitchColors.low};
    }

    .tracker-cell.pitch-mid {
      color: ${config.pitchColors.mid};
    }

    .tracker-cell.pitch-high {
      color: ${config.pitchColors.high};
    }
  `;
}

// ============================================================================
// SELECTION CURSOR (SINGLE CELL)
// ============================================================================

/**
 * Creates a single-cell selection at cursor position.
 */
export function createSingleCellSelection(cursor: TrackerCursor): TrackerSelection {
  return Object.freeze({
    startRow: cursor.row,
    endRow: cursor.row,
    startTrack: cursor.trackId,
    endTrack: cursor.trackId,
    startColumn: cursor.column,
    endColumn: cursor.column,
    isBlock: false,
  });
}

/**
 * Checks if a cell is the current cursor position.
 */
export function isCursorCell(
  cell: TrackerCell,
  cursor: TrackerCursor
): boolean {
  return cell.row === cursor.row &&
         cell.trackId === cursor.trackId &&
         cell.column === cursor.column;
}

/**
 * Moves cursor to a specific cell.
 */
export function moveCursorTo(
  state: TrackerPanelState,
  row: number,
  trackId: string,
  column: ColumnType
): TrackerPanelState {
  // Clamp row to valid range
  const clampedRow = Math.max(0, Math.min(row, state.config.patternLength - 1));
  
  return Object.freeze({
    ...state,
    cursor: {
      row: clampedRow,
      trackId,
      column,
    },
  });
}

// ============================================================================
// MULTI-CELL SELECTION (SHIFT+ARROW)
// ============================================================================

/**
 * Extends selection in a direction.
 */
export function extendSelection(
  state: TrackerPanelState,
  direction: 'up' | 'down' | 'left' | 'right'
): TrackerPanelState {
  const { cursor, selection, config } = state;
  
  // Start selection from cursor if none exists
  const baseSelection = selection ?? createSingleCellSelection(cursor);
  
  let newEndRow = baseSelection.endRow;
  let newEndTrack = baseSelection.endTrack;
  let newEndColumn = baseSelection.endColumn;
  
  switch (direction) {
    case 'up':
      newEndRow = Math.max(0, baseSelection.endRow - 1);
      break;
    case 'down':
      newEndRow = Math.min(config.patternLength - 1, baseSelection.endRow + 1);
      break;
    case 'left':
      // Move to previous column in same track, or previous track
      {
        const trackIndex = config.tracks.findIndex(t => t.id === baseSelection.endTrack);
        const track = config.tracks[trackIndex];
        if (track) {
          const colIndex = track.columns.findIndex(c => c.type === baseSelection.endColumn);
          if (colIndex > 0) {
            const prevCol = track.columns[colIndex - 1];
            if (prevCol) {
              newEndColumn = prevCol.type;
            }
          } else if (trackIndex > 0) {
            const prevTrack = config.tracks[trackIndex - 1];
            if (prevTrack && prevTrack.columns.length > 0) {
              newEndTrack = prevTrack.id;
              const lastCol = prevTrack.columns[prevTrack.columns.length - 1];
              if (lastCol) {
                newEndColumn = lastCol.type;
              }
            }
          }
        }
      }
      break;
    case 'right':
      {
        const tIndex = config.tracks.findIndex(t => t.id === baseSelection.endTrack);
        const t = config.tracks[tIndex];
        if (t) {
          const cIndex = t.columns.findIndex(c => c.type === baseSelection.endColumn);
          if (cIndex >= 0 && cIndex < t.columns.length - 1) {
            const nextCol = t.columns[cIndex + 1];
            if (nextCol) {
              newEndColumn = nextCol.type;
            }
          } else if (tIndex < config.tracks.length - 1) {
            const nextTrack = config.tracks[tIndex + 1];
            if (nextTrack && nextTrack.columns.length > 0) {
              newEndTrack = nextTrack.id;
              const firstCol = nextTrack.columns[0];
              if (firstCol) {
                newEndColumn = firstCol.type;
              }
            }
          }
        }
      }
      break;
  }
  
  return Object.freeze({
    ...state,
    selection: {
      ...baseSelection,
      endRow: newEndRow,
      endTrack: newEndTrack,
      endColumn: newEndColumn,
      isBlock: true,
    },
  });
}

// ============================================================================
// BLOCK SELECTION (CTRL+DRAG)
// ============================================================================

/**
 * Creates a block selection from two corners.
 */
export function createBlockSelection(
  startRow: number,
  startTrack: string,
  startColumn: ColumnType,
  endRow: number,
  endTrack: string,
  endColumn: ColumnType
): TrackerSelection {
  return Object.freeze({
    startRow: Math.min(startRow, endRow),
    endRow: Math.max(startRow, endRow),
    startTrack,
    endTrack,
    startColumn,
    endColumn,
    isBlock: true,
  });
}

/**
 * Checks if a cell is within the current selection.
 */
export function isCellSelected(
  cell: TrackerCell,
  selection: TrackerSelection,
  trackOrder: readonly TrackerTrack[]
): boolean {
  // Check row range
  if (cell.row < selection.startRow || cell.row > selection.endRow) {
    return false;
  }
  
  // Check track range
  const startTrackIndex = trackOrder.findIndex(t => t.id === selection.startTrack);
  const endTrackIndex = trackOrder.findIndex(t => t.id === selection.endTrack);
  const cellTrackIndex = trackOrder.findIndex(t => t.id === cell.trackId);
  
  if (startTrackIndex === -1 || endTrackIndex === -1 || cellTrackIndex === -1) {
    return false;
  }
  
  const minTrackIndex = Math.min(startTrackIndex, endTrackIndex);
  const maxTrackIndex = Math.max(startTrackIndex, endTrackIndex);
  
  if (cellTrackIndex < minTrackIndex || cellTrackIndex > maxTrackIndex) {
    return false;
  }
  
  // For single-track selection, check column range
  if (startTrackIndex === endTrackIndex && cellTrackIndex === startTrackIndex) {
    const track = trackOrder[cellTrackIndex];
    if (!track) {
      return false;
    }
    const startColIndex = track.columns.findIndex(c => c.type === selection.startColumn);
    const endColIndex = track.columns.findIndex(c => c.type === selection.endColumn);
    const cellColIndex = track.columns.findIndex(c => c.type === cell.column);
    
    if (startColIndex === -1 || endColIndex === -1 || cellColIndex === -1) {
      return false;
    }
    
    const minColIndex = Math.min(startColIndex, endColIndex);
    const maxColIndex = Math.max(startColIndex, endColIndex);
    
    return cellColIndex >= minColIndex && cellColIndex <= maxColIndex;
  }
  
  return true;
}

// ============================================================================
// COLUMN SELECTION (CLICK HEADER)
// ============================================================================

/**
 * Selects an entire column (all rows in a track/column).
 */
export function selectColumn(
  state: TrackerPanelState,
  trackId: string,
  column: ColumnType
): TrackerPanelState {
  return Object.freeze({
    ...state,
    selection: {
      startRow: 0,
      endRow: state.config.patternLength - 1,
      startTrack: trackId,
      endTrack: trackId,
      startColumn: column,
      endColumn: column,
      isBlock: true,
    },
  });
}

// ============================================================================
// ROW SELECTION (CLICK ROW NUMBER)
// ============================================================================

/**
 * Selects an entire row (all tracks/columns at a row).
 */
export function selectRow(
  state: TrackerPanelState,
  row: number
): TrackerPanelState {
  const firstTrack = state.config.tracks[0];
  const lastTrack = state.config.tracks[state.config.tracks.length - 1];
  
  if (!firstTrack || !lastTrack || firstTrack.columns.length === 0 || lastTrack.columns.length === 0) {
    return state;
  }
  
  const firstCol = firstTrack.columns[0];
  const lastCol = lastTrack.columns[lastTrack.columns.length - 1];
  
  if (!firstCol || !lastCol) {
    return state;
  }
  
  return Object.freeze({
    ...state,
    selection: {
      startRow: row,
      endRow: row,
      startTrack: firstTrack.id,
      endTrack: lastTrack.id,
      startColumn: firstCol.type,
      endColumn: lastCol.type,
      isBlock: true,
    },
  });
}

// ============================================================================
// SCROLL TO PLAYHEAD
// ============================================================================

/**
 * Scrolls the view to keep playhead visible.
 */
export function scrollToPlayhead(
  state: TrackerPanelState,
  centerOnPlayhead = false
): TrackerPanelState {
  const { playheadRow, scrollRow, config } = state;
  
  let newScrollRow = scrollRow;
  
  if (centerOnPlayhead) {
    // Center playhead in view
    newScrollRow = Math.max(0, playheadRow - Math.floor(config.visibleRows / 2));
  } else {
    // Keep playhead in view with minimal scrolling
    if (playheadRow < scrollRow) {
      newScrollRow = playheadRow;
    } else if (playheadRow >= scrollRow + config.visibleRows) {
      newScrollRow = playheadRow - config.visibleRows + 1;
    }
  }
  
  // Clamp to valid range
  const maxScroll = Math.max(0, config.patternLength - config.visibleRows);
  newScrollRow = Math.max(0, Math.min(newScrollRow, maxScroll));
  
  return Object.freeze({
    ...state,
    scrollRow: newScrollRow,
  });
}

// ============================================================================
// ZOOM IN/OUT (ROWS PER PAGE)
// ============================================================================

/**
 * Zooms in (shows fewer rows, larger).
 */
export function zoomIn(state: TrackerPanelState): TrackerPanelState {
  const newRowHeight = Math.min(40, state.config.rowHeight + 2);
  const newVisibleRows = Math.max(16, Math.floor(state.config.visibleRows * 0.8));
  
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      rowHeight: newRowHeight,
      visibleRows: newVisibleRows,
    },
  });
}

/**
 * Zooms out (shows more rows, smaller).
 */
export function zoomOut(state: TrackerPanelState): TrackerPanelState {
  const newRowHeight = Math.max(12, state.config.rowHeight - 2);
  const newVisibleRows = Math.min(256, Math.floor(state.config.visibleRows * 1.25));
  
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      rowHeight: newRowHeight,
      visibleRows: newVisibleRows,
    },
  });
}

/**
 * Sets zoom to a specific row height.
 */
export function setZoom(state: TrackerPanelState, rowHeight: number): TrackerPanelState {
  const clampedHeight = Math.max(12, Math.min(40, rowHeight));
  
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      rowHeight: clampedHeight,
    },
  });
}

// ============================================================================
// HORIZONTAL SCROLL FOR MANY TRACKS
// ============================================================================

/**
 * Scrolls horizontally by pixel amount.
 */
export function scrollHorizontal(
  state: TrackerPanelState,
  deltaX: number
): TrackerPanelState {
  const layout = calculateGridLayout(state.config);
  const maxScrollX = Math.max(0, layout.totalWidth - 800); // Assuming viewport width
  
  const newScrollX = Math.max(0, Math.min(state.scrollX + deltaX, maxScrollX));
  
  return Object.freeze({
    ...state,
    scrollX: newScrollX,
  });
}

/**
 * Scrolls to make a specific track visible.
 */
export function scrollToTrack(
  state: TrackerPanelState,
  trackId: string
): TrackerPanelState {
  const layout = calculateGridLayout(state.config);
  const trackX = layout.trackPositions.get(trackId);
  
  if (trackX === undefined) {
    return state;
  }
  
  const track = state.config.tracks.find(t => t.id === trackId);
  if (!track) {
    return state;
  }
  
  // Scroll to show the track
  const viewportWidth = 800; // Assuming viewport width
  let newScrollX = state.scrollX;
  
  if (trackX < state.scrollX) {
    newScrollX = trackX;
  } else if (trackX + track.width > state.scrollX + viewportWidth) {
    newScrollX = trackX + track.width - viewportWidth;
  }
  
  return Object.freeze({
    ...state,
    scrollX: Math.max(0, newScrollX),
  });
}

// ============================================================================
// VERTICAL SCROLL VIRTUALIZATION
// ============================================================================

/**
 * Gets the visible row range for current scroll position.
 */
export function getVisibleRowRange(state: TrackerPanelState): {
  startRow: number;
  endRow: number;
} {
  const startRow = state.scrollRow;
  const endRow = Math.min(
    state.config.patternLength - 1,
    startRow + state.config.visibleRows - 1
  );
  
  return { startRow, endRow };
}

/**
 * Scrolls vertically by row count.
 */
export function scrollVertical(
  state: TrackerPanelState,
  deltaRows: number
): TrackerPanelState {
  const maxScroll = Math.max(0, state.config.patternLength - state.config.visibleRows);
  const newScrollRow = Math.max(0, Math.min(state.scrollRow + deltaRows, maxScroll));
  
  return Object.freeze({
    ...state,
    scrollRow: newScrollRow,
  });
}

/**
 * Gets rows that should be rendered (virtualized).
 */
export function getVirtualizedRows(
  state: TrackerPanelState,
  overscan = 5
): readonly TrackerRow[] {
  const { startRow, endRow } = getVisibleRowRange(state);
  const actualStart = Math.max(0, startRow - overscan);
  const actualEnd = Math.min(state.config.patternLength - 1, endRow + overscan);
  
  const rows: TrackerRow[] = [];
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  
  for (let i = actualStart; i <= actualEnd; i++) {
    rows.push(createTrackerRow(i, (i * ticksPerRow) as Tick, state.config));
  }
  
  return Object.freeze(rows);
}

// ============================================================================
// ROW HEIGHT CUSTOMIZATION
// ============================================================================

/**
 * Sets a custom row height.
 */
export function setRowHeight(
  state: TrackerPanelState,
  height: number
): TrackerPanelState {
  const clampedHeight = Math.max(12, Math.min(60, height));
  
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      rowHeight: clampedHeight,
    },
  });
}

/**
 * Resets row height to default.
 */
export function resetRowHeight(state: TrackerPanelState): TrackerPanelState {
  return setRowHeight(state, 20);
}

// ============================================================================
// COLUMN WIDTH DRAG RESIZE
// ============================================================================

/**
 * Resizes a column by dragging.
 */
export function resizeColumn(
  state: TrackerPanelState,
  trackId: string,
  columnType: ColumnType,
  newWidth: number
): TrackerPanelState {
  const clampedWidth = Math.max(20, Math.min(200, newWidth));
  
  const updatedTracks = state.config.tracks.map(track =>
    track.id === trackId
      ? setColumnWidth(track, columnType, clampedWidth)
      : track
  );
  
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      tracks: updatedTracks,
    },
  });
}

// ============================================================================
// GRID LINE STYLING OPTIONS
// ============================================================================

/**
 * Sets grid style option.
 */
export function setGridStyle(
  state: TrackerPanelState,
  style: 'minimal' | 'standard' | 'detailed'
): TrackerPanelState {
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      gridStyle: style,
    },
  });
}

/**
 * Toggles beat markers visibility.
 */
export function toggleBeatMarkers(state: TrackerPanelState): TrackerPanelState {
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      showBeatMarkers: !state.config.showBeatMarkers,
    },
  });
}

/**
 * Toggles bar markers visibility.
 */
export function toggleBarMarkers(state: TrackerPanelState): TrackerPanelState {
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      showBarMarkers: !state.config.showBarMarkers,
    },
  });
}

/**
 * Toggles row numbers visibility.
 */
export function toggleRowNumbers(state: TrackerPanelState): TrackerPanelState {
  return Object.freeze({
    ...state,
    config: {
      ...state.config,
      showRowNumbers: !state.config.showRowNumbers,
    },
  });
}

// ============================================================================
// REAL-TIME EVENT STREAMING FROM DECKS
// ============================================================================

/**
 * Event listener callback for real-time deck events.
 */
export type EventStreamCallback = (events: readonly Event<unknown>[]) => void;

/**
 * Subscription handle for event stream.
 */
export interface EventStreamSubscription {
  /** Unsubscribe from event stream */
  unsubscribe: () => void;
  /** Deck ID this subscription is for */
  readonly deckId: string;
}

/**
 * Real-time event stream manager for tracker integration.
 * Connects deck card outputs to tracker display.
 */
export class TrackerEventStreamManager {
  private subscriptions = new Map<string, Set<EventStreamCallback>>();
  private eventBuffer = new Map<string, Event<unknown>[]>();
  private bufferFlushInterval: number | null = null;
  private readonly flushIntervalMs = 50; // 20fps for UI updates

  /**
   * Subscribes to events from a specific deck.
   * @param deckId - Deck identifier to listen to
   * @param callback - Function called when new events arrive
   * @returns Subscription handle
   */
  subscribe(deckId: string, callback: EventStreamCallback): EventStreamSubscription {
    if (!this.subscriptions.has(deckId)) {
      this.subscriptions.set(deckId, new Set());
      this.eventBuffer.set(deckId, []);
    }

    this.subscriptions.get(deckId)!.add(callback);

    // Start flush interval if not running
    if (this.bufferFlushInterval === null) {
      // Use globalThis.setInterval for Node compatibility
      const setIntervalFn = typeof globalThis.setInterval === 'function' 
        ? globalThis.setInterval 
        : (typeof window !== 'undefined' ? window.setInterval : null);
      
      if (setIntervalFn) {
        this.bufferFlushInterval = setIntervalFn(() => {
          this.flushBuffers();
        }, this.flushIntervalMs) as unknown as number;
      }
    }

    return {
      unsubscribe: () => {
        const callbacks = this.subscriptions.get(deckId);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.subscriptions.delete(deckId);
            this.eventBuffer.delete(deckId);
          }
        }

        // Stop flush interval if no more subscriptions
        if (this.subscriptions.size === 0 && this.bufferFlushInterval !== null) {
          const clearIntervalFn = typeof globalThis.clearInterval === 'function'
            ? globalThis.clearInterval
            : (typeof window !== 'undefined' ? window.clearInterval : null);
          
          if (clearIntervalFn) {
            clearIntervalFn(this.bufferFlushInterval);
          }
          this.bufferFlushInterval = null;
        }
      },
      deckId,
    };
  }

  /**
   * Emits an event from a deck (called by deck/card processing).
   * @param deckId - Deck that generated the event
   * @param event - Event to emit
   */
  emitEvent(deckId: string, event: Event<unknown>): void {
    const buffer = this.eventBuffer.get(deckId);
    if (buffer) {
      buffer.push(event);
    }
  }

  /**
   * Emits multiple events from a deck.
   * @param deckId - Deck that generated the events
   * @param events - Events to emit
   */
  emitEvents(deckId: string, events: readonly Event<unknown>[]): void {
    const buffer = this.eventBuffer.get(deckId);
    if (buffer) {
      buffer.push(...events);
    }
  }

  /**
   * Flushes buffered events to subscribers.
   */
  private flushBuffers(): void {
    for (const [deckId, buffer] of this.eventBuffer.entries()) {
      if (buffer.length > 0) {
        const callbacks = this.subscriptions.get(deckId);
        if (callbacks) {
          const eventsCopy = [...buffer];
          buffer.length = 0; // Clear buffer
          callbacks.forEach(callback => callback(eventsCopy));
        }
      }
    }
  }

  /**
   * Clears all subscriptions and stops the flush interval.
   */
  destroy(): void {
    if (this.bufferFlushInterval !== null) {
      const clearIntervalFn = typeof globalThis.clearInterval === 'function'
        ? globalThis.clearInterval
        : (typeof window !== 'undefined' ? window.clearInterval : null);
      
      if (clearIntervalFn) {
        clearIntervalFn(this.bufferFlushInterval);
      }
      this.bufferFlushInterval = null;
    }
    this.subscriptions.clear();
    this.eventBuffer.clear();
  }
}

/**
 * Updates tracker state with newly received events from deck.
 * Merges new events into existing stream.
 * @param state - Current tracker state
 * @param newEvents - Events received from deck
 * @returns Updated tracker state
 */
export function mergeRealtimeEvents(
  state: TrackerPanelState,
  newEvents: readonly Event<unknown>[]
): TrackerPanelState {
  if (newEvents.length === 0) {
    return state;
  }

  // Merge new events into stream, maintaining temporal order
  const mergedEvents = [...state.stream.events, ...newEvents].sort((a, b) => a.start - b.start);

  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

// ============================================================================
// EVENT EDITING
// ============================================================================

/**
 * Enters a note at the current cursor position.
 * Creates a new note event or modifies existing one.
 * @param state - Current tracker state
 * @param pitch - MIDI pitch (0-127)
 * @param velocity - Optional velocity (defaults to 100)
 * @param duration - Optional duration in ticks (defaults to 1 row)
 * @returns Updated state with new/modified note
 */
export function enterNote(
  state: TrackerPanelState,
  pitch: number,
  velocity: number = 100,
  duration?: TickDuration
): TrackerPanelState {
  const { cursor, config } = state;
  const rowTick = asTick(cursor.row);
  const noteDuration = duration ?? asTickDuration(config.rowsPerBeat);
  
  // Remove any existing event at this position
  const filteredEvents = state.stream.events.filter(
    e => e.start !== rowTick
  );
  
  // Create new note event
  const newEvent = createNoteEvent(rowTick, noteDuration, pitch, velocity);
  const mergedEvents = [...filteredEvents, newEvent].sort((a, b) => a.start - b.start);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

/**
 * Enters note from MIDI input at cursor position.
 * @param state - Current tracker state
 * @param midiNote - MIDI note number (0-127)
 * @param midiVelocity - MIDI velocity (0-127)
 * @returns Updated state with new note
 */
export function enterNoteFromMIDI(
  state: TrackerPanelState,
  midiNote: number,
  midiVelocity: number
): TrackerPanelState {
  return enterNote(state, midiNote, midiVelocity);
}

/**
 * Sets velocity for event at cursor.
 * @param state - Current tracker state
 * @param velocity - Velocity value (0-127)
 * @returns Updated state with modified velocity
 */
export function setVelocity(
  state: TrackerPanelState,
  velocity: number
): TrackerPanelState {
  const { cursor } = state;
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const event = getEventAtRow(state.stream, cursor.row, ticksPerRow);
  
  if (!event) {
    return state;
  }
  
  // Update event with new velocity
  const payload = event.payload as Record<string, unknown>;
  const updatedEvent = updateEvent(event, {
    payload: { ...payload, velocity },
  });
  
  const filteredEvents = state.stream.events.filter(e => e.id !== event.id);
  const mergedEvents = [...filteredEvents, updatedEvent].sort((a, b) => a.start - b.start);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

/**
 * Sets duration for event at cursor.
 * @param state - Current tracker state
 * @param duration - Duration in ticks
 * @returns Updated state with modified duration
 */
export function setDuration(
  state: TrackerPanelState,
  duration: TickDuration | number
): TrackerPanelState {
  const { cursor } = state;
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const event = getEventAtRow(state.stream, cursor.row, ticksPerRow);
  
  if (!event) {
    return state;
  }
  
  const newDuration = typeof duration === 'number' ? asTickDuration(duration) : duration;
  const updatedEvent = updateEvent(event, {
    duration: newDuration,
  });
  
  const filteredEvents = state.stream.events.filter(e => e.id !== event.id);
  const mergedEvents = [...filteredEvents, updatedEvent].sort((a, b) => a.start - b.start);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

/**
 * Transposes note at cursor by octave.
 * @param state - Current tracker state
 * @param octaveOffset - Number of octaves to transpose (+/- 1, 2, etc.)
 * @returns Updated state with transposed note
 */
export function transposeOctave(
  state: TrackerPanelState,
  octaveOffset: number
): TrackerPanelState {
  const { cursor } = state;
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const event = getEventAtRow(state.stream, cursor.row, ticksPerRow);
  
  if (!event || !('pitch' in (event.payload as object))) {
    return state;
  }
  
  const payload = event.payload as Record<string, unknown> & { pitch: number };
  const currentPitch = payload.pitch;
  const newPitch = Math.max(0, Math.min(127, currentPitch + (octaveOffset * 12)));
  
  const updatedEvent = updateEvent(event, {
    payload: { ...payload, pitch: newPitch },
  });
  
  const filteredEvents = state.stream.events.filter(e => e.id !== event.id);
  const mergedEvents = [...filteredEvents, updatedEvent].sort((a, b) => a.start - b.start);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

/**
 * Transposes selection by semitones.
 * @param state - Current tracker state
 * @param semitones - Number of semitones to transpose
 * @returns Updated state with transposed notes
 */
export function transposeSelection(
  state: TrackerPanelState,
  semitones: number
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  
  const updatedEvents = state.stream.events.map(event => {
    // Check if event is in selection range
    if (event.start >= startTick && event.start < endTick) {
      const payload = event.payload as Record<string, unknown>;
      if ('pitch' in payload) {
        const currentPitch = payload.pitch as number;
        const newPitch = Math.max(0, Math.min(127, currentPitch + semitones));
        return updateEvent(event, {
          payload: { ...payload, pitch: newPitch },
        });
      }
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents,
    },
  });
}

/**
 * Deletes event at cursor position.
 * @param state - Current tracker state
 * @returns Updated state with event removed
 */
export function deleteNote(
  state: TrackerPanelState
): TrackerPanelState {
  const { cursor } = state;
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const event = getEventAtRow(state.stream, cursor.row, ticksPerRow);
  
  if (!event) {
    return state;
  }
  
  const filteredEvents = state.stream.events.filter(e => e.id !== event.id);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: filteredEvents,
    },
  });
}

/**
 * Clipboard storage for cut/copy/paste operations.
 */
let clipboard: readonly Event<unknown>[] = [];

/**
 * Cuts selected events to clipboard.
 * @param state - Current tracker state
 * @returns Updated state with events removed
 */
export function cutEvents(
  state: TrackerPanelState
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  
  // Copy to clipboard
  clipboard = state.stream.events.filter(
    event => event.start >= startTick && event.start < endTick
  );
  
  // Remove from stream
  const filteredEvents = state.stream.events.filter(
    event => event.start < startTick || event.start >= endTick
  );
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: filteredEvents,
    },
  });
}

/**
 * Copies selected events to clipboard.
 * @param state - Current tracker state
 * @returns Unchanged state (clipboard updated)
 */
export function copyEvents(
  state: TrackerPanelState
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  
  clipboard = state.stream.events.filter(
    event => event.start >= startTick && event.start < endTick
  );
  
  return state;
}

/**
 * Pastes events from clipboard at cursor position.
 * @param state - Current tracker state
 * @returns Updated state with pasted events
 */
export function pasteEvents(
  state: TrackerPanelState
): TrackerPanelState {
  if (clipboard.length === 0) {
    return state;
  }
  
  const { cursor } = state;
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const cursorTick = cursor.row * ticksPerRow;
  
  // Find earliest event in clipboard
  const minStart = Math.min(...clipboard.map(e => e.start));
  const offset = cursorTick - minStart;
  
  // Shift clipboard events to cursor position
  const pastedEvents = clipboard.map(event =>
    createEvent({
      ...event,
      start: asTick(event.start + offset),
    })
  );
  
  const mergedEvents = [...state.stream.events, ...pastedEvents].sort((a, b) => a.start - b.start);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

/**
 * Duplicates selected rows/events.
 * @param state - Current tracker state
 * @returns Updated state with duplicated events
 */
export function duplicateSelection(
  state: TrackerPanelState
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  const selectionLength = endTick - startTick;
  
  // Copy selected events
  const selectedEvents = state.stream.events.filter(
    event => event.start >= startTick && event.start < endTick
  );
  
  // Duplicate after selection
  const duplicatedEvents = selectedEvents.map(event =>
    createEvent({
      ...event,
      start: asTick(event.start + selectionLength),
    })
  );
  
  const mergedEvents = [...state.stream.events, ...duplicatedEvents].sort((a, b) => a.start - b.start);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

/**
 * Inserts a blank row at the cursor position, shifting subsequent events down.
 * @param state - Current tracker state
 * @returns Updated state with blank row inserted
 */
export function insertBlankRow(
  state: TrackerPanelState
): TrackerPanelState {
  const { cursor } = state;
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const insertTick = cursor.row * ticksPerRow;
  
  // Shift all events at or after the cursor down by one row
  const shiftedEvents = state.stream.events.map(event => {
    if (event.start >= insertTick) {
      return createEvent({
        ...event,
        start: asTick(event.start + ticksPerRow),
      });
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: shiftedEvents,
    },
  });
}

/**
 * Deletes a row at the cursor position, shifting subsequent events up.
 * @param state - Current tracker state
 * @returns Updated state with row deleted
 */
export function deleteRow(
  state: TrackerPanelState
): TrackerPanelState {
  const { cursor } = state;
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const deleteTick = cursor.row * ticksPerRow;
  
  // Remove events at cursor row and shift subsequent events up
  const updatedEvents = state.stream.events
    .filter(event => event.start < deleteTick || event.start >= deleteTick + ticksPerRow)
    .map(event => {
      if (event.start > deleteTick) {
        return createEvent({
          ...event,
          start: asTick(event.start - ticksPerRow),
        });
      }
      return event;
    });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents,
    },
  });
}

/**
 * Fills the selection with a specified value pattern.
 * @param state - Current tracker state
 * @param value - The value to fill (e.g., note pitch, velocity)
 * @param column - The column to fill ('note', 'volume', etc.)
 * @returns Updated state with selection filled
 */
export function fillSelection(
  state: TrackerPanelState,
  value: number | string,
  column: ColumnType = 'note'
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  
  // Update existing events in selection
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      if (column === 'volume' && typeof value === 'number') {
        return updateEventPayload(event as Event<object>, { velocity: value } as any);
      }
      // Add more column types as needed
      return event;
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents,
    },
  });
}

/**
 * Interpolates values across the selection (linear interpolation).
 * @param state - Current tracker state
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param column - The column to interpolate
 * @returns Updated state with interpolated values
 */
export function interpolateSelection(
  state: TrackerPanelState,
  startValue: number,
  endValue: number,
  column: ColumnType = 'volume'
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  const selectionLength = endTick - startTick;
  
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      const progress = (event.start - startTick) / selectionLength;
      const interpolatedValue = Math.round(startValue + (endValue - startValue) * progress);
      
      if (column === 'volume') {
        return updateEventPayload(event as Event<object>, { velocity: Math.max(0, Math.min(127, interpolatedValue)) } as any);
      }
      return event;
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents,
    },
  });
}

/**
 * Randomizes values in the selection.
 * @param state - Current tracker state
 * @param minValue - Minimum random value
 * @param maxValue - Maximum random value
 * @param column - The column to randomize
 * @returns Updated state with randomized values
 */
export function randomizeSelection(
  state: TrackerPanelState,
  minValue: number,
  maxValue: number,
  column: ColumnType = 'volume'
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      
      if (column === 'volume') {
        return updateEventPayload(event as Event<object>, { velocity: Math.max(0, Math.min(127, randomValue)) } as any);
      }
      return event;
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents,
    },
  });
}

/**
 * Humanizes the selection by adding subtle timing and velocity variations.
 * @param state - Current tracker state
 * @param timingAmount - Amount of timing variation (0-1)
 * @param velocityAmount - Amount of velocity variation (0-1)
 * @returns Updated state with humanized events
 */
export function humanizeSelection(
  state: TrackerPanelState,
  timingAmount: number = 0.1,
  velocityAmount: number = 0.1
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  const maxTimingOffset = timingAmount * ticksPerRow;
  const maxVelocityOffset = Math.floor(velocityAmount * 20); // Max ±20 velocity units
  
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      const timingOffset = (Math.random() - 0.5) * 2 * maxTimingOffset;
      const velocityOffset = Math.floor((Math.random() - 0.5) * 2 * maxVelocityOffset);
      
      const newStart = Math.round(Math.max(0, event.start + timingOffset));
      const currentVelocity = (event.payload as any).velocity || 64;
      const newVelocity = Math.max(1, Math.min(127, currentVelocity + velocityOffset));
      
      let updated = updateEvent(event, {
        start: asTick(newStart),
      });
      
      return updateEventPayload(updated as Event<object>, { velocity: newVelocity } as any);
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents.sort((a, b) => a.start - b.start),
    },
  });
}

/**
 * Quantizes events in the selection to the grid.
 * @param state - Current tracker state
 * @param gridSize - Grid size in ticks (1 = every row, 4 = every 4 rows, etc.)
 * @returns Updated state with quantized events
 */
export function quantizeSelection(
  state: TrackerPanelState,
  gridSize: number = 1
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  const quantizeTicks = gridSize * ticksPerRow;
  
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      const quantizedStart = Math.round(event.start / quantizeTicks) * quantizeTicks;
      return updateEvent(event, {
        start: asTick(Math.max(0, quantizedStart)),
      });
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents.sort((a, b) => a.start - b.start),
    },
  });
}

/**
 * Applies swing to the selection.
 * @param state - Current tracker state
 * @param swingAmount - Swing amount (0-1, where 0.5 is 50% swing)
 * @returns Updated state with swing applied
 */
export function swingSelection(
  state: TrackerPanelState,
  swingAmount: number = 0.5
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  const swingTicks = Math.round(swingAmount * ticksPerRow);
  
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      // Apply swing to off-beat notes (odd row positions)
      const rowPosition = Math.floor(event.start / ticksPerRow);
      if (rowPosition % 2 === 1) {
        return updateEvent(event, {
          start: asTick(event.start + swingTicks),
        });
      }
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents.sort((a, b) => a.start - b.start),
    },
  });
}

/**
 * Applies a velocity curve to the selection.
 * @param state - Current tracker state
 * @param curve - Curve type ('linear', 'exponential', 'logarithmic', 'sine')
 * @param startVelocity - Starting velocity
 * @param endVelocity - Ending velocity
 * @returns Updated state with velocity curve applied
 */
export function velocityCurveSelection(
  state: TrackerPanelState,
  curve: 'linear' | 'exponential' | 'logarithmic' | 'sine' = 'linear',
  startVelocity: number = 127,
  endVelocity: number = 64
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  const selectionLength = endTick - startTick;
  
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      const progress = (event.start - startTick) / selectionLength;
      let curveProgress = progress;
      
      switch (curve) {
        case 'exponential':
          curveProgress = Math.pow(progress, 2);
          break;
        case 'logarithmic':
          curveProgress = Math.sqrt(progress);
          break;
        case 'sine':
          curveProgress = (Math.sin((progress - 0.5) * Math.PI) + 1) / 2;
          break;
        default: // linear
          curveProgress = progress;
      }
      
      const velocity = Math.round(startVelocity + (endVelocity - startVelocity) * curveProgress);
      return updateEventPayload(event as Event<object>, { velocity: Math.max(1, Math.min(127, velocity)) } as any);
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents,
    },
  });
}

/**
 * Reverses the temporal order of events in the selection.
 * @param state - Current tracker state
 * @returns Updated state with reversed events
 */
export function reverseSelection(
  state: TrackerPanelState
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1; // TODO: Calculate from tempo/resolution
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  
  // Get events in selection
  const selectedEvents = state.stream.events.filter(
    event => event.start >= startTick && event.start < endTick
  );
  
  // Reverse their positions
  const reversedEvents = selectedEvents.map(event => {
    const distanceFromStart = event.start - startTick;
    const newStart = endTick - ticksPerRow - distanceFromStart;
    return updateEvent(event, {
      start: asTick(newStart),
    });
  });
  
  // Merge with non-selected events
  const otherEvents = state.stream.events.filter(
    event => event.start < startTick || event.start >= endTick
  );
  
  const mergedEvents = [...otherEvents, ...reversedEvents].sort((a, b) => a.start - b.start);
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: mergedEvents,
    },
  });
}

/**
 * Applies pitch retrograde (inversion) to the selection around an axis pitch.
 * Reverses pitch contour around a central pitch (mirror pitches).
 * @param state - Current tracker state
 * @param axisPitch - Pitch around which to invert (default: 60/middle C)
 * @returns Updated state with inverted pitches
 */
export function retrogradeSelection(
  state: TrackerPanelState,
  axisPitch: number = 60
): TrackerPanelState {
  const { selection } = state;
  
  if (!selection) {
    return state;
  }
  
  const ticksPerRow = 1;
  const startTick = selection.startRow * ticksPerRow;
  const endTick = (selection.endRow + 1) * ticksPerRow;
  
  const updatedEvents = state.stream.events.map(event => {
    if (event.start >= startTick && event.start < endTick) {
      const payload = event.payload as Record<string, unknown>;
      if ('pitch' in payload && typeof payload.pitch === 'number') {
        const currentPitch = payload.pitch;
        const distanceFromAxis = currentPitch - axisPitch;
        const invertedPitch = axisPitch - distanceFromAxis;
        const clampedPitch = Math.max(0, Math.min(127, invertedPitch));
        return updateEventPayload(event as Event<object>, { 
          ...payload, 
          pitch: clampedPitch 
        } as any);
      }
    }
    return event;
  });
  
  return Object.freeze({
    ...state,
    stream: {
      ...state.stream,
      events: updatedEvents,
    },
  });
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Moves cursor up by one row.
 * @param state - Current tracker state
 * @returns Updated state with moved cursor
 */
export function moveCursorUp(state: TrackerPanelState): TrackerPanelState {
  const newRow = Math.max(0, state.cursor.row - 1);
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: newRow,
    },
  });
}

/**
 * Moves cursor down by one row.
 * @param state - Current tracker state
 * @returns Updated state with moved cursor
 */
export function moveCursorDown(state: TrackerPanelState): TrackerPanelState {
  const maxRow = state.config.patternLength - 1;
  const newRow = Math.min(maxRow, state.cursor.row + 1);
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: newRow,
    },
  });
}

/**
 * Moves cursor left to previous column.
 * @param state - Current tracker state
 * @returns Updated state with moved cursor
 */
export function moveCursorLeft(state: TrackerPanelState): TrackerPanelState {
  const currentTrack = state.config.tracks.find(t => t.id === state.cursor.trackId);
  if (!currentTrack) return state;
  
  const currentColumnIndex = currentTrack.columns.findIndex(c => c.type === state.cursor.column);
  const visibleColumns = currentTrack.columns.filter(c => c.visible);
  
  if (currentColumnIndex > 0) {
    const prevColumn = visibleColumns[visibleColumns.findIndex(c => c.type === state.cursor.column) - 1];
    if (prevColumn) {
      return Object.freeze({
        ...state,
        cursor: {
          ...state.cursor,
          column: prevColumn.type,
        },
      });
    }
  }
  
  const currentTrackIndex = state.config.tracks.findIndex(t => t.id === state.cursor.trackId);
  if (currentTrackIndex > 0) {
    const prevTrack = state.config.tracks[currentTrackIndex - 1];
    if (prevTrack) {
      const lastVisibleColumn = prevTrack.columns.filter(c => c.visible).slice(-1)[0];
      if (lastVisibleColumn) {
        return Object.freeze({
          ...state,
          cursor: {
            ...state.cursor,
            trackId: prevTrack.id,
            column: lastVisibleColumn.type,
          },
        });
      }
    }
  }
  
  return state;
}

/**
 * Moves cursor right to next column.
 * @param state - Current tracker state
 * @returns Updated state with moved cursor
 */
export function moveCursorRight(state: TrackerPanelState): TrackerPanelState {
  const currentTrack = state.config.tracks.find(t => t.id === state.cursor.trackId);
  if (!currentTrack) return state;
  
  const visibleColumns = currentTrack.columns.filter(c => c.visible);
  const currentColumnIndex = visibleColumns.findIndex(c => c.type === state.cursor.column);
  
  if (currentColumnIndex < visibleColumns.length - 1) {
    const nextColumn = visibleColumns[currentColumnIndex + 1];
    if (nextColumn) {
      return Object.freeze({
        ...state,
        cursor: {
          ...state.cursor,
          column: nextColumn.type,
        },
      });
    }
  }
  
  const currentTrackIndex = state.config.tracks.findIndex(t => t.id === state.cursor.trackId);
  if (currentTrackIndex < state.config.tracks.length - 1) {
    const nextTrack = state.config.tracks[currentTrackIndex + 1];
    if (nextTrack) {
      const firstVisibleColumn = nextTrack.columns.filter(c => c.visible)[0];
      if (firstVisibleColumn) {
        return Object.freeze({
          ...state,
          cursor: {
            ...state.cursor,
            trackId: nextTrack.id,
            column: firstVisibleColumn.type,
          },
        });
      }
    }
  }
  
  return state;
}

/**
 * Moves cursor to previous track (Tab with Shift).
 * @param state - Current tracker state
 * @returns Updated state with moved cursor
 */
export function moveCursorToPrevTrack(state: TrackerPanelState): TrackerPanelState {
  const currentTrackIndex = state.config.tracks.findIndex(t => t.id === state.cursor.trackId);
  if (currentTrackIndex > 0) {
    const prevTrack = state.config.tracks[currentTrackIndex - 1];
    if (prevTrack) {
      const firstVisibleColumn = prevTrack.columns.filter(c => c.visible)[0];
      if (firstVisibleColumn) {
        return Object.freeze({
          ...state,
          cursor: {
            ...state.cursor,
            trackId: prevTrack.id,
            column: firstVisibleColumn.type,
          },
        });
      }
    }
  }
  return state;
}

/**
 * Moves cursor to next track (Tab).
 * @param state - Current tracker state
 * @returns Updated state with moved cursor
 */
export function moveCursorToNextTrack(state: TrackerPanelState): TrackerPanelState {
  const currentTrackIndex = state.config.tracks.findIndex(t => t.id === state.cursor.trackId);
  if (currentTrackIndex < state.config.tracks.length - 1) {
    const nextTrack = state.config.tracks[currentTrackIndex + 1];
    if (nextTrack) {
      const firstVisibleColumn = nextTrack.columns.filter(c => c.visible)[0];
      if (firstVisibleColumn) {
        return Object.freeze({
          ...state,
          cursor: {
            ...state.cursor,
            trackId: nextTrack.id,
            column: firstVisibleColumn.type,
          },
        });
      }
    }
  }
  return state;
}

/**
 * Advances cursor to next row (Enter key).
 * @param state - Current tracker state
 * @param step - Number of rows to advance (default: 1)
 * @returns Updated state with advanced cursor
 */
export function advanceCursorRow(
  state: TrackerPanelState,
  step: number = 1
): TrackerPanelState {
  const maxRow = state.config.patternLength - 1;
  const newRow = Math.min(maxRow, state.cursor.row + step);
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: newRow,
    },
  });
}

/**
 * Scrolls view by page up (previous visible rows).
 * @param state - Current tracker state
 * @returns Updated state with updated scroll and cursor
 */
export function pageUp(state: TrackerPanelState): TrackerPanelState {
  const pageSize = Math.floor(state.config.visibleRows * 0.8);
  const newRow = Math.max(0, state.cursor.row - pageSize);
  const newScrollRow = Math.max(0, state.scrollRow - pageSize);
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: newRow,
    },
    scrollRow: newScrollRow,
  });
}

/**
 * Scrolls view by page down (next visible rows).
 * @param state - Current tracker state
 * @returns Updated state with updated scroll and cursor
 */
export function pageDown(state: TrackerPanelState): TrackerPanelState {
  const pageSize = Math.floor(state.config.visibleRows * 0.8);
  const maxRow = state.config.patternLength - 1;
  const newRow = Math.min(maxRow, state.cursor.row + pageSize);
  const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
  const newScrollRow = Math.min(maxScrollRow, state.scrollRow + pageSize);
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: newRow,
    },
    scrollRow: newScrollRow,
  });
}

/**
 * Moves cursor to start of pattern (Home key).
 * @param state - Current tracker state
 * @returns Updated state with cursor at row 0
 */
export function moveCursorToStart(state: TrackerPanelState): TrackerPanelState {
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: 0,
    },
    scrollRow: 0,
  });
}

/**
 * Moves cursor to end of pattern (End key).
 * @param state - Current tracker state
 * @returns Updated state with cursor at last row
 */
export function moveCursorToEnd(state: TrackerPanelState): TrackerPanelState {
  const maxRow = state.config.patternLength - 1;
  const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: maxRow,
    },
    scrollRow: maxScrollRow,
  });
}

/**
 * Moves cursor to absolute start of pattern (Ctrl+Home).
 * @param state - Current tracker state
 * @returns Updated state with cursor and scroll at row 0
 */
export function moveCursorToPatternStart(state: TrackerPanelState): TrackerPanelState {
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: 0,
    },
    scrollRow: 0,
  });
}

/**
 * Moves cursor to absolute end of pattern (Ctrl+End).
 * @param state - Current tracker state
 * @returns Updated state with cursor at last row
 */
export function moveCursorToPatternEnd(state: TrackerPanelState): TrackerPanelState {
  const maxRow = state.config.patternLength - 1;
  const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: maxRow,
    },
    scrollRow: maxScrollRow,
  });
}

/**
 * Jumps cursor to next note (non-empty event) in current track.
 * @param state - Current tracker state
 * @returns Updated state with cursor moved to next note
 */
export function jumpToNextNote(state: TrackerPanelState): TrackerPanelState {
  const ticksPerRow = 1;
  const currentTick = state.cursor.row * ticksPerRow;
  
  // Find next event after current position in current track
  const nextEvent = state.stream.events.find(
    event => event.start > currentTick
  );
  
  if (nextEvent) {
    const nextRow = Math.floor(nextEvent.start / ticksPerRow);
    const maxRow = state.config.patternLength - 1;
    const clampedRow = Math.min(maxRow, nextRow);
    
    // Adjust scroll if needed to keep cursor visible
    let newScrollRow = state.scrollRow;
    if (clampedRow >= state.scrollRow + state.config.visibleRows) {
      newScrollRow = clampedRow - Math.floor(state.config.visibleRows / 2);
    }
    
    return Object.freeze({
      ...state,
      cursor: {
        ...state.cursor,
        row: clampedRow,
      },
      scrollRow: Math.max(0, newScrollRow),
    });
  }
  
  return state;
}

/**
 * Jumps cursor to previous note (non-empty event) in current track.
 * @param state - Current tracker state
 * @returns Updated state with cursor moved to previous note
 */
export function jumpToPreviousNote(state: TrackerPanelState): TrackerPanelState {
  const ticksPerRow = 1;
  const currentTick = state.cursor.row * ticksPerRow;
  
  // Find previous event before current position
  const previousEvents = state.stream.events.filter(
    event => event.start < currentTick
  );
  
  if (previousEvents.length > 0) {
    const prevEvent = previousEvents[previousEvents.length - 1];
    if (prevEvent) {
      const prevRow = Math.floor(prevEvent.start / ticksPerRow);
      
      // Adjust scroll if needed to keep cursor visible
      let newScrollRow = state.scrollRow;
      if (prevRow < state.scrollRow) {
        newScrollRow = prevRow - Math.floor(state.config.visibleRows / 2);
      }
      
      return Object.freeze({
        ...state,
        cursor: {
          ...state.cursor,
          row: prevRow,
        },
        scrollRow: Math.max(0, newScrollRow),
      });
    }
  }
  
  return state;
}

/**
 * Jumps cursor to next empty row (no event) in current track.
 * @param state - Current tracker state
 * @returns Updated state with cursor moved to next empty row
 */
export function jumpToNextEmpty(state: TrackerPanelState): TrackerPanelState {
  const ticksPerRow = 1;
  const maxRow = state.config.patternLength - 1;
  
  // Build set of rows with events for fast lookup
  const occupiedRows = new Set(
    state.stream.events.map(event => Math.floor(event.start / ticksPerRow))
  );
  
  // Find next empty row after cursor
  for (let row = state.cursor.row + 1; row <= maxRow; row++) {
    if (!occupiedRows.has(row)) {
      // Adjust scroll if needed
      let newScrollRow = state.scrollRow;
      if (row >= state.scrollRow + state.config.visibleRows) {
        newScrollRow = row - Math.floor(state.config.visibleRows / 2);
      }
      
      return Object.freeze({
        ...state,
        cursor: {
          ...state.cursor,
          row,
        },
        scrollRow: Math.max(0, Math.min(newScrollRow, maxRow - state.config.visibleRows + 1)),
      });
    }
  }
  
  return state;
}

/**
 * Marker position for bookmarks/cue points in tracker.
 */
export interface TrackerMarker {
  readonly id: string;
  readonly row: number;
  readonly label: string;
  readonly color?: string;
}

/**
 * Jumps cursor to next marker/bookmark in pattern.
 * @param state - Current tracker state
 * @param markers - Array of markers in the pattern
 * @returns Updated state with cursor moved to next marker
 */
export function jumpToNextMarker(
  state: TrackerPanelState,
  markers: readonly TrackerMarker[]
): TrackerPanelState {
  if (markers.length === 0) {
    return state;
  }
  
  // Find next marker after current row
  const sortedMarkers = [...markers].sort((a, b) => a.row - b.row);
  const nextMarker = sortedMarkers.find(marker => marker.row > state.cursor.row);
  
  if (nextMarker) {
    // Adjust scroll if needed
    let newScrollRow = state.scrollRow;
    if (nextMarker.row >= state.scrollRow + state.config.visibleRows) {
      newScrollRow = nextMarker.row - Math.floor(state.config.visibleRows / 2);
    }
    
    const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
    
    return Object.freeze({
      ...state,
      cursor: {
        ...state.cursor,
        row: nextMarker.row,
      },
      scrollRow: Math.max(0, Math.min(newScrollRow, maxScrollRow)),
    });
  } else {
    // Wrap to first marker
    const firstMarker = sortedMarkers[0];
    if (firstMarker) {
      return Object.freeze({
        ...state,
        cursor: {
          ...state.cursor,
          row: firstMarker.row,
        },
        scrollRow: Math.max(0, firstMarker.row - Math.floor(state.config.visibleRows / 2)),
      });
    }
  }
  
  return state;
}

// ============================================================================
// ADDITIONAL NAVIGATION FEATURES (Items 2384-2393)
// ============================================================================

/**
 * Bookmark position for quick navigation in tracker.
 */
export interface TrackerBookmark {
  readonly id: string;
  readonly row: number;
  readonly label: string;
  readonly color?: string;
}

/**
 * Adds a bookmark at the current cursor position - Item 2384.
 * @param state - Current tracker state
 * @param bookmarks - Existing bookmarks
 * @param label - Optional label for the bookmark
 * @returns Updated bookmarks array
 */
export function addBookmark(
  state: TrackerPanelState,
  bookmarks: readonly TrackerBookmark[],
  label?: string
): readonly TrackerBookmark[] {
  const newBookmark: TrackerBookmark = {
    id: `bookmark-${Date.now()}-${Math.random()}`,
    row: state.cursor.row,
    label: label || `Bookmark ${bookmarks.length + 1}`,
  };
  return Object.freeze([...bookmarks, newBookmark]);
}

/**
 * Removes a bookmark by ID.
 * @param bookmarks - Existing bookmarks
 * @param bookmarkId - ID of bookmark to remove
 * @returns Updated bookmarks array
 */
export function removeBookmark(
  bookmarks: readonly TrackerBookmark[],
  bookmarkId: string
): readonly TrackerBookmark[] {
  return Object.freeze(bookmarks.filter(b => b.id !== bookmarkId));
}

/**
 * Jumps cursor to a specific bookmark.
 * @param state - Current tracker state
 * @param bookmarks - Array of bookmarks
 * @param bookmarkId - ID of bookmark to jump to
 * @returns Updated state with cursor at bookmark
 */
export function jumpToBookmark(
  state: TrackerPanelState,
  bookmarks: readonly TrackerBookmark[],
  bookmarkId: string
): TrackerPanelState {
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) {
    return state;
  }
  
  // Center the bookmark in viewport
  const newScrollRow = Math.max(0, bookmark.row - Math.floor(state.config.visibleRows / 2));
  const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: bookmark.row,
    },
    scrollRow: Math.min(newScrollRow, maxScrollRow),
  });
}

/**
 * Opens a dialog to jump to a specific row - Item 2385.
 * This returns the row number to jump to (UI layer will handle the actual dialog).
 * @param state - Current tracker state
 * @param targetRow - Row number to jump to (0-based)
 * @returns Updated state with cursor at target row
 */
export function gotoRow(
  state: TrackerPanelState,
  targetRow: number
): TrackerPanelState {
  // Clamp to valid range
  const clampedRow = Math.max(0, Math.min(targetRow, state.config.patternLength - 1));
  
  // Center the target in viewport
  const newScrollRow = Math.max(0, clampedRow - Math.floor(state.config.visibleRows / 2));
  const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: clampedRow,
    },
    scrollRow: Math.min(newScrollRow, maxScrollRow),
  });
}

/**
 * Opens a dialog to jump to a specific measure - Item 2386.
 * @param state - Current tracker state
 * @param measure - Measure number (1-based)
 * @param rowsPerMeasure - Number of rows per measure
 * @returns Updated state with cursor at target measure
 */
export function gotoMeasure(
  state: TrackerPanelState,
  measure: number,
  rowsPerMeasure: number
): TrackerPanelState {
  // Convert measure (1-based) to row (0-based)
  const targetRow = (measure - 1) * rowsPerMeasure;
  return gotoRow(state, targetRow);
}

/**
 * Configuration for playhead following behavior.
 */
export interface PlayheadFollowConfig {
  /** Whether to follow playhead */
  readonly enabled: boolean;
  /** Mode: 'center' keeps playhead in middle, 'scroll' scrolls when reaching edge */
  readonly mode: 'center' | 'scroll';
  /** Margin for scroll mode (rows from edge before scrolling) */
  readonly scrollMargin: number;
}

/**
 * Toggles playhead following mode - Item 2387.
 * @param config - Current follow config
 * @returns Updated config with toggled state
 */
export function toggleFollowPlayhead(
  config: PlayheadFollowConfig
): PlayheadFollowConfig {
  return Object.freeze({
    ...config,
    enabled: !config.enabled,
  });
}

/**
 * Updates tracker state to follow playhead position - Item 2387.
 * @param state - Current tracker state
 * @param playheadRow - Current playhead row
 * @param followConfig - Follow configuration
 * @returns Updated state with adjusted scroll position
 */
export function followPlayhead(
  state: TrackerPanelState,
  playheadRow: number,
  followConfig: PlayheadFollowConfig
): TrackerPanelState {
  if (!followConfig.enabled) {
    return state;
  }
  
  if (followConfig.mode === 'center') {
    // Keep playhead centered
    const newScrollRow = Math.max(0, playheadRow - Math.floor(state.config.visibleRows / 2));
    const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
    return Object.freeze({
      ...state,
      scrollRow: Math.min(newScrollRow, maxScrollRow),
    });
  } else {
    // Scroll mode: only scroll when playhead approaches edge
    const minRow = state.scrollRow + followConfig.scrollMargin;
    const maxRow = state.scrollRow + state.config.visibleRows - followConfig.scrollMargin;
    
    if (playheadRow < minRow) {
      // Scroll up
      return Object.freeze({
        ...state,
        scrollRow: Math.max(0, playheadRow - followConfig.scrollMargin),
      });
    } else if (playheadRow > maxRow) {
      // Scroll down
      const newScrollRow = playheadRow - state.config.visibleRows + followConfig.scrollMargin;
      const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
      return Object.freeze({
        ...state,
        scrollRow: Math.min(newScrollRow, maxScrollRow),
      });
    }
  }
  
  return state;
}

/**
 * Centers the playhead in the viewport - Item 2388.
 * @param state - Current tracker state
 * @param playheadRow - Current playhead row
 * @returns Updated state with playhead centered
 */
export function centerPlayhead(
  state: TrackerPanelState,
  playheadRow: number
): TrackerPanelState {
  const newScrollRow = Math.max(0, playheadRow - Math.floor(state.config.visibleRows / 2));
  const maxScrollRow = Math.max(0, state.config.patternLength - state.config.visibleRows);
  
  return Object.freeze({
    ...state,
    scrollRow: Math.min(newScrollRow, maxScrollRow),
  });
}

/**
 * Configuration for edit step behavior - Item 2389.
 */
export interface EditStepConfig {
  /** Number of rows to advance after entering a note */
  readonly stepSize: number;
  /** Whether edit step is enabled */
  readonly enabled: boolean;
}

/**
 * Advances cursor by edit step amount after note entry - Item 2389.
 * @param state - Current tracker state
 * @param editStepConfig - Edit step configuration
 * @returns Updated state with cursor advanced
 */
export function advanceEditStep(
  state: TrackerPanelState,
  editStepConfig: EditStepConfig
): TrackerPanelState {
  if (!editStepConfig.enabled) {
    return state;
  }
  
  const newRow = state.cursor.row + editStepConfig.stepSize;
  const clampedRow = Math.min(newRow, state.config.patternLength - 1);
  
  // Adjust scroll if needed
  let newScrollRow = state.scrollRow;
  if (clampedRow >= state.scrollRow + state.config.visibleRows) {
    newScrollRow = clampedRow - state.config.visibleRows + 1;
  }
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: clampedRow,
    },
    scrollRow: Math.max(0, Math.min(newScrollRow, state.config.patternLength - state.config.visibleRows)),
  });
}

/**
 * Custom step pattern for non-linear navigation - Item 2390.
 */
export interface StepPattern {
  readonly id: string;
  readonly name: string;
  /** Array of row offsets to step through (relative to start) */
  readonly steps: readonly number[];
  /** Current position in pattern */
  currentIndex: number;
}

/**
 * Creates a custom step pattern - Item 2390.
 * @param name - Name of the pattern
 * @param steps - Array of step offsets
 * @returns New step pattern
 */
export function createStepPattern(
  name: string,
  steps: readonly number[]
): StepPattern {
  return Object.freeze({
    id: `pattern-${Date.now()}-${Math.random()}`,
    name,
    steps,
    currentIndex: 0,
  });
}

/**
 * Advances cursor using a custom step pattern - Item 2390.
 * @param state - Current tracker state
 * @param pattern - Step pattern to use
 * @returns Updated state with cursor advanced and updated pattern
 */
export function advanceCustomStep(
  state: TrackerPanelState,
  pattern: StepPattern
): { state: TrackerPanelState; pattern: StepPattern } {
  if (pattern.steps.length === 0) {
    return { state, pattern };
  }
  
  // Get next step offset
  const stepOffset = pattern.steps[pattern.currentIndex];
  if (stepOffset === undefined) {
    return { state, pattern };
  }
  
  const newRow = state.cursor.row + stepOffset;
  const clampedRow = Math.max(0, Math.min(newRow, state.config.patternLength - 1));
  
  // Advance pattern index (with wrap)
  const newIndex = (pattern.currentIndex + 1) % pattern.steps.length;
  const newPattern: StepPattern = {
    ...pattern,
    currentIndex: newIndex,
  };
  
  // Adjust scroll if needed
  let newScrollRow = state.scrollRow;
  if (clampedRow >= state.scrollRow + state.config.visibleRows) {
    newScrollRow = clampedRow - state.config.visibleRows + 1;
  } else if (clampedRow < state.scrollRow) {
    newScrollRow = clampedRow;
  }
  
  const newState = Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: clampedRow,
    },
    scrollRow: Math.max(0, Math.min(newScrollRow, state.config.patternLength - state.config.visibleRows)),
  });
  
  return { state: newState, pattern: Object.freeze(newPattern) };
}

/**
 * Pattern loop configuration - Item 2391.
 */
export interface PatternLoopConfig {
  /** Start row of loop (inclusive) */
  readonly startRow: number;
  /** End row of loop (exclusive) */
  readonly endRow: number;
  /** Whether loop is enabled */
  readonly enabled: boolean;
}

/**
 * Navigates within a pattern loop - Item 2391.
 * When cursor moves beyond loop end, wraps to loop start.
 * @param state - Current tracker state
 * @param loopConfig - Loop configuration
 * @returns Updated state respecting loop boundaries
 */
export function navigatePatternLoop(
  state: TrackerPanelState,
  loopConfig: PatternLoopConfig
): TrackerPanelState {
  if (!loopConfig.enabled) {
    return state;
  }
  
  let newRow = state.cursor.row;
  
  // Wrap if beyond loop boundaries
  if (newRow >= loopConfig.endRow) {
    newRow = loopConfig.startRow + (newRow - loopConfig.endRow);
  } else if (newRow < loopConfig.startRow) {
    newRow = loopConfig.endRow - (loopConfig.startRow - newRow);
  }
  
  // Clamp to loop boundaries
  newRow = Math.max(loopConfig.startRow, Math.min(newRow, loopConfig.endRow - 1));
  
  // Adjust scroll if needed
  let newScrollRow = state.scrollRow;
  if (newRow >= state.scrollRow + state.config.visibleRows) {
    newScrollRow = newRow - state.config.visibleRows + 1;
  } else if (newRow < state.scrollRow) {
    newScrollRow = newRow;
  }
  
  return Object.freeze({
    ...state,
    cursor: {
      ...state.cursor,
      row: newRow,
    },
    scrollRow: Math.max(0, Math.min(newScrollRow, state.config.patternLength - state.config.visibleRows)),
  });
}

/**
 * Section marker for song structure navigation - Item 2392.
 */
export interface SectionMarker {
  readonly id: string;
  readonly row: number;
  readonly name: string;
  readonly type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'custom';
  readonly color?: string;
}

/**
 * Navigates to next section marker - Item 2392.
 * @param state - Current tracker state
 * @param sections - Array of section markers
 * @returns Updated state with cursor at next section
 */
export function gotoNextSection(
  state: TrackerPanelState,
  sections: readonly SectionMarker[]
): TrackerPanelState {
  if (sections.length === 0) {
    return state;
  }
  
  // Find next section after current row
  const sortedSections = [...sections].sort((a, b) => a.row - b.row);
  const nextSection = sortedSections.find(section => section.row > state.cursor.row);
  
  if (nextSection) {
    return gotoRow(state, nextSection.row);
  } else {
    // Wrap to first section
    const firstSection = sortedSections[0];
    if (firstSection) {
      return gotoRow(state, firstSection.row);
    }
  }
  
  return state;
}

/**
 * Navigates to previous section marker - Item 2392.
 * @param state - Current tracker state
 * @param sections - Array of section markers
 * @returns Updated state with cursor at previous section
 */
export function gotoPreviousSection(
  state: TrackerPanelState,
  sections: readonly SectionMarker[]
): TrackerPanelState {
  if (sections.length === 0) {
    return state;
  }
  
  // Find previous section before current row
  const sortedSections = [...sections].sort((a, b) => b.row - a.row);
  const prevSection = sortedSections.find(section => section.row < state.cursor.row);
  
  if (prevSection) {
    return gotoRow(state, prevSection.row);
  } else {
    // Wrap to last section
    const lastSection = sortedSections[0];
    if (lastSection) {
      return gotoRow(state, lastSection.row);
    }
  }
  
  return state;
}

/**
 * Searches for a specific note value in the pattern - Item 2393.
 * @param state - Current tracker state
 * @param searchPitch - MIDI pitch number to search for
 * @param searchForward - Whether to search forward (true) or backward (false)
 * @returns Updated state with cursor at found note, or unchanged if not found
 */
export function searchForNote(
  state: TrackerPanelState,
  searchPitch: number,
  searchForward: boolean = true
): TrackerPanelState {
  const ticksPerRow = 1;
  const startRow = searchForward ? state.cursor.row + 1 : state.cursor.row - 1;
  const endRow = searchForward ? state.config.patternLength : -1;
  const step = searchForward ? 1 : -1;
  
  for (let row = startRow; searchForward ? row < endRow : row > endRow; row += step) {
    const event = getEventAtRow(state.stream, row, ticksPerRow);
    if (event && typeof (event.payload as any)?.pitch === 'number') {
      if ((event.payload as any).pitch === searchPitch) {
        return gotoRow(state, row);
      }
    }
  }
  
  // Not found - try wrapping around
  if (searchForward) {
    for (let row = 0; row <= state.cursor.row; row++) {
      const event = getEventAtRow(state.stream, row, ticksPerRow);
      if (event && typeof (event.payload as any)?.pitch === 'number') {
        if ((event.payload as any).pitch === searchPitch) {
          return gotoRow(state, row);
        }
      }
    }
  } else {
    for (let row = state.config.patternLength - 1; row >= state.cursor.row; row--) {
      const event = getEventAtRow(state.stream, row, ticksPerRow);
      if (event && typeof (event.payload as any)?.pitch === 'number') {
        if ((event.payload as any).pitch === searchPitch) {
          return gotoRow(state, row);
        }
      }
    }
  }
  
  // Not found at all
  return state;
}

/**
 * Searches for any value in a specific column - Item 2393.
 * @param state - Current tracker state
 * @param column - Column to search in
 * @param searchValue - Value to search for (as string)
 * @param searchForward - Whether to search forward (true) or backward (false)
 * @returns Updated state with cursor at found value, or unchanged if not found
 */
export function searchForValue(
  state: TrackerPanelState,
  column: ColumnType,
  searchValue: string,
  searchForward: boolean = true
): TrackerPanelState {
  // Get first track from config
  const firstTrack = state.config.tracks[0];
  if (!firstTrack) {
    return state;
  }
  
  const startRow = searchForward ? state.cursor.row + 1 : state.cursor.row - 1;
  const endRow = searchForward ? state.config.patternLength : -1;
  const step = searchForward ? 1 : -1;
  
  for (let row = startRow; searchForward ? row < endRow : row > endRow; row += step) {
    const cell = renderCell(state, firstTrack.id, column, row);
    if (cell.value.toLowerCase().includes(searchValue.toLowerCase())) {
      return gotoRow(state, row);
    }
  }
  
  // Not found - try wrapping around
  if (searchForward) {
    for (let row = 0; row <= state.cursor.row; row++) {
      const cell = renderCell(state, firstTrack.id, column, row);
      if (cell.value.toLowerCase().includes(searchValue.toLowerCase())) {
        return gotoRow(state, row);
      }
    }
  } else {
    for (let row = state.config.patternLength - 1; row >= state.cursor.row; row--) {
      const cell = renderCell(state, firstTrack.id, column, row);
      if (cell.value.toLowerCase().includes(searchValue.toLowerCase())) {
        return gotoRow(state, row);
      }
    }
  }
  
  // Not found at all
  return state;
}

// ============================================================================
// ADVANCED TRACKER FEATURES (Phase 9.6) - Items 2418-2437
// ============================================================================

/**
 * Effect command types available in tracker.
 */
export type EffectCommand =
  | 'volume'      // 0x - Volume (00-7F)
  | 'panning'     // 8x - Panning (00=L, 40=C, 7F=R)
  | 'retrigger'   // Rx - Retrigger note every x ticks
  | 'arpeggio'    // 0xy - Arpeggio (x=semitone1, y=semitone2)
  | 'slide-up'    // 1xx - Pitch slide up
  | 'slide-down'  // 2xx - Pitch slide down
  | 'vibrato'     // 4xy - Vibrato (x=speed, y=depth)
  | 'tremolo'     // 7xy - Tremolo (x=speed, y=depth)
  | 'offset'      // 9xx - Sample offset (00-FF)
  | 'cut'         // ECx - Cut note after x ticks
  | 'delay'       // EDx - Delay note by x ticks
  | 'probability' // Pxx - Probability (00-FF, 80=50%)
  | 'none';       // Empty/no command

/**
 * Effect command data structure.
 */
export interface EffectCommandData {
  /** Command type */
  readonly command: EffectCommand;
  /** Command parameters (0x00-0xFF) */
  readonly param: number;
  /** Display string (e.g., "R04", "0xy") */
  readonly display: string;
}

/**
 * Multi-track view configuration - Item 2418.
 * Displays multiple tracks side by side in columns.
 */
export interface MultiTrackViewConfig {
  /** Number of tracks visible simultaneously */
  readonly visibleTracks: number;
  /** Horizontal scroll position (track index) */
  readonly scrollTrack: number;
  /** Whether to show all tracks or only visible ones */
  readonly showAllTracks: boolean;
}

/**
 * Track group configuration - Item 2419.
 * Groups tracks for collective mute/solo/color.
 */
export interface TrackGroup {
  /** Group ID */
  readonly id: string;
  /** Group name */
  readonly name: string;
  /** Track IDs in this group */
  readonly trackIds: readonly string[];
  /** Group color */
  readonly color: string;
  /** Whether group is collapsed */
  readonly collapsed: boolean;
  /** Group is muted */
  readonly muted: boolean;
  /** Group is soloed */
  readonly soloed: boolean;
}

/**
 * Implements multi-track view (columns) - Item 2418.
 * @param config - Current tracker config
 * @param multiTrackConfig - Multi-track view settings
 * @returns Tracks visible in current view
 */
export function getVisibleTracksInMultiTrackView(
  config: TrackerPanelConfig,
  multiTrackConfig: MultiTrackViewConfig
): readonly TrackerTrack[] {
  if (multiTrackConfig.showAllTracks) {
    return config.tracks;
  }
  
  const startIdx = multiTrackConfig.scrollTrack;
  const endIdx = Math.min(
    startIdx + multiTrackConfig.visibleTracks,
    config.tracks.length
  );
  
  return config.tracks.slice(startIdx, endIdx);
}

/**
 * Creates a track group - Item 2419.
 */
export function createTrackGroup(
  id: string,
  name: string,
  trackIds: readonly string[],
  color: string = '#888888'
): TrackGroup {
  return Object.freeze({
    id,
    name,
    trackIds,
    color,
    collapsed: false,
    muted: false,
    soloed: false,
  });
}

/**
 * Toggles mute for all tracks in group - Item 2419.
 */
export function toggleGroupMute(
  config: TrackerPanelConfig,
  group: TrackGroup
): TrackerPanelConfig {
  const newMuted = !group.muted;
  const tracks = config.tracks.map(track =>
    group.trackIds.includes(track.id)
      ? { ...track, muted: newMuted }
      : track
  );
  
  return { ...config, tracks };
}

/**
 * Parses effect command string - Item 2420.
 */
export function parseEffectCommand(effectStr: string): EffectCommandData {
  if (!effectStr || effectStr === '...' || effectStr === '---') {
    return { command: 'none', param: 0, display: '...' };
  }
  
  const trimmed = effectStr.trim().toUpperCase();
  const match = trimmed.match(/^([0-9A-Z])([0-9A-F]{2})$/);
  if (!match) {
    return { command: 'none', param: 0, display: '...' };
  }
  
  const [, commandChar, paramStr] = match;
  const param = parseInt(paramStr || '0', 16);
  
  let command: EffectCommand = 'none';
  
  switch (commandChar) {
    case '0':
      command = param === 0 ? 'volume' : 'arpeggio';
      break;
    case '1':
      command = 'slide-up';
      break;
    case '2':
      command = 'slide-down';
      break;
    case '4':
      command = 'vibrato';
      break;
    case '7':
      command = 'tremolo';
      break;
    case '8':
      command = 'panning';
      break;
    case '9':
      command = 'offset';
      break;
    case 'R':
      command = 'retrigger';
      break;
    case 'E':
      const subCmd = (param >> 4) & 0x0F;
      if (subCmd === 0x0C) command = 'cut';
      else if (subCmd === 0x0D) command = 'delay';
      break;
    case 'P':
      command = 'probability';
      break;
  }
  
  return { command, param, display: trimmed };
}

/**
 * Creates retrigger effect command - Item 2421.
 */
export function createRetriggerCommand(ticks: number): EffectCommandData {
  const param = Math.max(0, Math.min(0xFF, ticks));
  return {
    command: 'retrigger',
    param,
    display: `R${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates arpeggio effect command - Item 2422.
 */
export function createArpeggioCommand(semitone1: number, semitone2: number): EffectCommandData {
  const s1 = Math.max(0, Math.min(15, semitone1));
  const s2 = Math.max(0, Math.min(15, semitone2));
  const param = (s1 << 4) | s2;
  return {
    command: 'arpeggio',
    param,
    display: `0${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates pitch slide commands - Item 2423.
 */
export function createPitchSlideUpCommand(speed: number): EffectCommandData {
  const param = Math.max(0, Math.min(0xFF, speed));
  return {
    command: 'slide-up',
    param,
    display: `1${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

export function createPitchSlideDownCommand(speed: number): EffectCommandData {
  const param = Math.max(0, Math.min(0xFF, speed));
  return {
    command: 'slide-down',
    param,
    display: `2${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates vibrato effect command - Item 2424.
 */
export function createVibratoCommand(speed: number, depth: number): EffectCommandData {
  const s = Math.max(0, Math.min(15, speed));
  const d = Math.max(0, Math.min(15, depth));
  const param = (s << 4) | d;
  return {
    command: 'vibrato',
    param,
    display: `4${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates tremolo effect command - Item 2425.
 */
export function createTremoloCommand(speed: number, depth: number): EffectCommandData {
  const s = Math.max(0, Math.min(15, speed));
  const d = Math.max(0, Math.min(15, depth));
  const param = (s << 4) | d;
  return {
    command: 'tremolo',
    param,
    display: `7${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates sample offset command - Item 2426.
 */
export function createSampleOffsetCommand(offset: number): EffectCommandData {
  const param = Math.max(0, Math.min(0xFF, offset));
  return {
    command: 'offset',
    param,
    display: `9${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates cut command - Item 2427.
 */
export function createCutCommand(ticks: number): EffectCommandData {
  const t = Math.max(0, Math.min(15, ticks));
  const param = 0xC0 | t;
  return {
    command: 'cut',
    param,
    display: `E${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates delay command - Item 2428.
 */
export function createDelayCommand(ticks: number): EffectCommandData {
  const t = Math.max(0, Math.min(15, ticks));
  const param = 0xD0 | t;
  return {
    command: 'delay',
    param,
    display: `E${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Creates probability command - Item 2429.
 */
export function createProbabilityCommand(probability: number): EffectCommandData {
  const p = Math.max(0, Math.min(1, probability));
  const param = Math.round(p * 255);
  return {
    command: 'probability',
    param,
    display: `P${param.toString(16).toUpperCase().padStart(2, '0')}`,
  };
}

/**
 * Chord mode configuration - Item 2430.
 */
export interface ChordMode {
  readonly enabled: boolean;
  readonly notes: readonly number[];
  readonly maxNotes: number;
}

export function createChordMode(maxNotes: number = 8): ChordMode {
  return Object.freeze({
    enabled: false,
    notes: [],
    maxNotes,
  });
}

export function addNoteToChord(chordMode: ChordMode, note: number): ChordMode {
  if (chordMode.notes.length >= chordMode.maxNotes || chordMode.notes.includes(note)) {
    return chordMode;
  }
  return {
    ...chordMode,
    notes: [...chordMode.notes, note].sort((a, b) => a - b),
  };
}

/**
 * Scale constraint overlay - Item 2431.
 */
export interface ScaleConstraintOverlay {
  readonly enabled: boolean;
  readonly root: number;
  readonly scale: readonly number[];
  readonly name: string;
  readonly highlightOutOfScale: boolean;
}

export const SCALE_PATTERNS = Object.freeze({
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
});

export function createScaleConstraint(
  root: number,
  scaleName: keyof typeof SCALE_PATTERNS
): ScaleConstraintOverlay {
  return Object.freeze({
    enabled: true,
    root: root % 12,
    scale: SCALE_PATTERNS[scaleName],
    name: scaleName,
    highlightOutOfScale: true,
  });
}

export function isNoteInScale(note: number, constraint: ScaleConstraintOverlay): boolean {
  if (!constraint.enabled) return true;
  const noteClass = note % 12;
  const relativeNote = (noteClass - constraint.root + 12) % 12;
  return constraint.scale.includes(relativeNote);
}

export function quantizeNoteToScale(note: number, constraint: ScaleConstraintOverlay): number {
  if (!constraint.enabled) return note;
  
  const octave = Math.floor(note / 12);
  const noteClass = note % 12;
  const relativeNote = (noteClass - constraint.root + 12) % 12;
  
  let closestDegree = constraint.scale[0] ?? 0;
  let minDistance = Math.abs(relativeNote - closestDegree);
  
  for (const degree of constraint.scale) {
    const distance = Math.abs(relativeNote - degree);
    if (distance < minDistance) {
      minDistance = distance;
      closestDegree = degree;
    }
  }
  
  const quantizedClass = (constraint.root + closestDegree) % 12;
  return octave * 12 + quantizedClass;
}

/**
 * Live record configuration - Item 2432.
 */
export interface LiveRecordConfig {
  readonly active: boolean;
  readonly targetTrackId: string;
  readonly quantize: boolean;
  readonly quantizeResolution: number;
  readonly replaceMode: boolean;
  readonly recordVelocity: boolean;
}

export function createLiveRecordConfig(trackId: string): LiveRecordConfig {
  return Object.freeze({
    active: false,
    targetTrackId: trackId,
    quantize: true,
    quantizeResolution: 4,
    replaceMode: false,
    recordVelocity: true,
  });
}

/**
 * Step recording mode - Item 2433.
 */
export interface StepRecordConfig {
  readonly active: boolean;
  readonly stepSize: number;
  readonly autoAdvance: boolean;
  readonly defaultDuration: number;
}

export function createStepRecordConfig(stepSize: number = 1): StepRecordConfig {
  return Object.freeze({
    active: false,
    stepSize,
    autoAdvance: true,
    defaultDuration: stepSize,
  });
}

/**
 * Phrase/block editor - Item 2434.
 */
export interface PhraseBlock {
  readonly id: string;
  readonly name: string;
  readonly length: number;
  readonly events: Stream<Event<unknown>>;
  readonly color: string;
}

export function createPhraseBlock(
  id: string,
  name: string,
  events: Stream<Event<unknown>>,
  length: number
): PhraseBlock {
  return Object.freeze({
    id,
    name,
    length,
    events,
    color: '#00AA00',
  });
}

/**
 * Macro columns - Item 2435.
 */
export interface MacroColumn {
  readonly id: string;
  readonly name: string;
  readonly targetParameter: string;
  readonly range: readonly [number, number];
  readonly displayFormat: 'hex' | 'decimal' | 'percentage';
}

export function createMacroColumn(
  id: string,
  name: string,
  targetParameter: string
): MacroColumn {
  return Object.freeze({
    id,
    name,
    targetParameter,
    range: [0, 127] as const,
    displayFormat: 'hex',
  });
}

/**
 * Tracker themes - Item 2436.
 */
export interface TrackerTheme {
  readonly name: string;
  readonly background: {
    readonly grid: string;
    readonly row: string;
    readonly beat: string;
    readonly bar: string;
    readonly selection: string;
    readonly cursor: string;
    readonly playhead: string;
  };
  readonly text: {
    readonly normal: string;
    readonly highlight: string;
    readonly ghost: string;
    readonly rowNumber: string;
    readonly header: string;
  };
  readonly grid: {
    readonly line: string;
    readonly beat: string;
    readonly bar: string;
  };
  readonly note: {
    readonly default: string;
    readonly accent: string;
    readonly ghost: string;
    readonly off: string;
  };
}

export const TRACKER_THEMES = Object.freeze({
  classic: {
    name: 'Classic',
    background: {
      grid: '#1a1a1a',
      row: '#202020',
      beat: '#252525',
      bar: '#2a2a2a',
      selection: '#334455',
      cursor: '#445566',
      playhead: '#335533',
    },
    text: {
      normal: '#ffffff',
      highlight: '#ffff00',
      ghost: '#666666',
      rowNumber: '#888888',
      header: '#cccccc',
    },
    grid: {
      line: '#2a2a2a',
      beat: '#333333',
      bar: '#444444',
    },
    note: {
      default: '#ffffff',
      accent: '#ff8844',
      ghost: '#666666',
      off: '#ff4444',
    },
  } as TrackerTheme,
  renoise: {
    name: 'Renoise',
    background: {
      grid: '#161616',
      row: '#1c1c1c',
      beat: '#222222',
      bar: '#282828',
      selection: '#2a4a5a',
      cursor: '#3a5a6a',
      playhead: '#2a5a3a',
    },
    text: {
      normal: '#e0e0e0',
      highlight: '#ffcc00',
      ghost: '#606060',
      rowNumber: '#808080',
      header: '#d0d0d0',
    },
    grid: {
      line: '#282828',
      beat: '#333333',
      bar: '#444444',
    },
    note: {
      default: '#e0e0e0',
      accent: '#ff9944',
      ghost: '#606060',
      off: '#ff5555',
    },
  } as TrackerTheme,
  light: {
    name: 'Light',
    background: {
      grid: '#f5f5f5',
      row: '#ffffff',
      beat: '#eeeeee',
      bar: '#e8e8e8',
      selection: '#cce0ff',
      cursor: '#b3d9ff',
      playhead: '#ccffcc',
    },
    text: {
      normal: '#000000',
      highlight: '#0066cc',
      ghost: '#999999',
      rowNumber: '#666666',
      header: '#333333',
    },
    grid: {
      line: '#e0e0e0',
      beat: '#d0d0d0',
      bar: '#c0c0c0',
    },
    note: {
      default: '#000000',
      accent: '#cc6600',
      ghost: '#999999',
      off: '#cc0000',
    },
  } as TrackerTheme,
});

/**
 * Keyboard map customization - Item 2437.
 */
export interface TrackerKeyboardMap {
  readonly navigation: {
    readonly up: string[];
    readonly down: string[];
    readonly left: string[];
    readonly right: string[];
    readonly pageUp: string[];
    readonly pageDown: string[];
    readonly home: string[];
    readonly end: string[];
  };
  readonly editing: {
    readonly delete: string[];
    readonly backspace: string[];
    readonly insert: string[];
    readonly cut: string[];
    readonly copy: string[];
    readonly paste: string[];
    readonly undo: string[];
    readonly redo: string[];
  };
  readonly playback: {
    readonly play: string[];
    readonly stop: string[];
    readonly record: string[];
    readonly loop: string[];
  };
  readonly noteInput: {
    readonly [key: string]: number;
  };
}

export function createDefaultTrackerKeyboardMap(): TrackerKeyboardMap {
  return Object.freeze({
    navigation: {
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      pageUp: ['PageUp'],
      pageDown: ['PageDown'],
      home: ['Home'],
      end: ['End'],
    },
    editing: {
      delete: ['Delete'],
      backspace: ['Backspace'],
      insert: ['Insert'],
      cut: ['Control+x', 'Meta+x'],
      copy: ['Control+c', 'Meta+c'],
      paste: ['Control+v', 'Meta+v'],
      undo: ['Control+z', 'Meta+z'],
      redo: ['Control+Shift+z', 'Meta+Shift+z'],
    },
    playback: {
      play: ['Space'],
      stop: ['Escape'],
      record: ['Control+r', 'Meta+r'],
      loop: ['Control+l', 'Meta+l'],
    },
    noteInput: {
      'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5, 'g': 6, 'b': 7,
      'h': 8, 'n': 9, 'j': 10, 'm': 11, 'q': 12, '2': 13, 'w': 14, '3': 15,
      'e': 16, 'r': 17, '5': 18, 't': 19, '6': 20, 'y': 21, '7': 22, 'u': 23, 'i': 24,
    },
  });
}
