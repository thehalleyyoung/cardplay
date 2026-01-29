/**
 * @fileoverview Tracker Grid Renderer
 * 
 * Renders tracker pattern data to various output formats:
 * - ANSI terminal output (for debugging/CLI)
 * - Virtual DOM nodes (for Canvas/WebGL)
 * - Structured data (for React/declarative UIs)
 * 
 * Design Philosophy:
 * - Pure rendering functions - no state mutation
 * - Configurable display options (hex/decimal, colors, column visibility)
 * - Performance optimized with dirty region tracking
 * - Accessibility via semantic output data
 */

import {
  TrackerRow,
  Pattern,
  TrackConfig,
  CursorPosition,
  TrackerSelection,
  DisplayConfig,
  DisplayBase,
  NoteCell,
  EffectCommand,
  SpecialNote,
  defaultDisplayConfig,
  TrackId,
  asTrackId,
} from './types';
import { getEffectName, EFFECT_META } from './effects';

// =============================================================================
// LEGACY COMPATIBILITY TYPES
// =============================================================================

/**
 * A multi-track row view for rendering.
 * This bridges the new track-first layout to the row-first layout expected by the renderer.
 */
export interface MultiTrackRow {
  readonly tracks: ReadonlyArray<TrackerRow>;
}

/**
 * Convert a Pattern to a row-first view for rendering.
 */
export function getPatternRowView(pattern: Pattern, rowIndex: number): MultiTrackRow {
  const tracks: TrackerRow[] = [];
  const sortedTrackIds = Array.from(pattern.tracks.keys()).sort();
  for (const trackId of sortedTrackIds) {
    const trackData = pattern.tracks.get(trackId);
    if (trackData && trackData.rows[rowIndex]) {
      tracks.push(trackData.rows[rowIndex]!);
    }
  }
  return { tracks };
}

/**
 * Get pattern length from config.
 */
export function getPatternLength(pattern: Pattern): number {
  return pattern.config.length;
}

/**
 * Get track configs from pattern.
 */
export function getTrackConfigs(pattern: Pattern): TrackConfig[] {
  const configs: TrackConfig[] = [];
  const sortedTrackIds = Array.from(pattern.tracks.keys()).sort();
  for (const trackId of sortedTrackIds) {
    const trackData = pattern.tracks.get(trackId);
    if (trackData) {
      configs.push(trackData.config);
    }
  }
  return configs;
}

/**
 * Get sorted track IDs from pattern.
 */
export function getSortedTrackIds(pattern: Pattern): TrackId[] {
  return Array.from(pattern.tracks.keys()).sort();
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Note names in chromatic order */
const NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];

/** ANSI color codes for terminal output */
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Bright foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

/** Column widths for display */
const COLUMN_WIDTHS = {
  rowNumber: 4,
  note: 3,
  instrument: 2,
  volume: 2,
  pan: 2,
  delay: 2,
  effect: 4, // Command + 2 params
  trackSeparator: 1,
} as const;

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Format note value to display string (e.g., "C-4", "OFF", "---")
 */
export function formatNote(note: NoteCell): string {
  if (note.note === SpecialNote.Empty) {
    return '---';
  }
  if (note.note === SpecialNote.NoteOff) {
    return 'OFF';
  }
  if (note.note === SpecialNote.NoteCut) {
    return '^^^';
  }
  if (note.note === SpecialNote.NoteFade) {
    return '===';
  }
  
  // Normal note: convert MIDI note number to name+octave
  const octave = Math.floor(note.note / 12) - 1; // MIDI octave
  const semitone = note.note % 12;
  return `${NOTE_NAMES[semitone]}${octave}`;
}

/**
 * Format hex value with configurable base and padding
 */
export function formatHex(value: number, digits: number, base: DisplayBase): string {
  if (base === DisplayBase.Decimal) {
    return value.toString().padStart(digits, '0');
  }
  return value.toString(16).toUpperCase().padStart(digits, '0');
}

/**
 * Format instrument slot (00-FF or --)
 */
export function formatInstrument(inst: number | null, base: DisplayBase): string {
  if (inst === null) {
    return '..';
  }
  return formatHex(inst, 2, base);
}

/**
 * Format effect command (e.g., "G50" for portamento, ".00" for empty)
 */
export function formatEffectCommand(fx: EffectCommand | null, base: DisplayBase): string {
  if (!fx || fx.code === 0 && fx.param === 0) {
    return '...';
  }
  
  // Get effect letter (00=0, 01=1, ..., 0F=F, 10=G, etc.)
  const cmdChar = fx.code.toString(16).toUpperCase().padStart(2, '0').slice(-1);
  const param = formatHex(fx.param, 2, base);
  return `${cmdChar}${param}`;
}

/**
 * Format row number with configurable base
 */
export function formatRowNumber(row: number, base: DisplayBase, digits: number = 3): string {
  return formatHex(row, digits, base);
}

// =============================================================================
// CELL RENDERERS
// =============================================================================

/** Rendered cell with value and optional styling */
export interface RenderedCell {
  text: string;
  color?: string;
  background?: string;
  bold?: boolean;
  dim?: boolean;
  cursor?: boolean;
  selected?: boolean;
}

/** Complete rendered row */
export interface RenderedRow {
  rowNumber: RenderedCell;
  tracks: RenderedTrackCells[];
  isCurrentRow?: boolean;
  isPatternHighlight?: boolean;
}

/** Rendered cells for a single track */
export interface RenderedTrackCells {
  note: RenderedCell;
  instrument: RenderedCell;
  volume: RenderedCell;
  pan: RenderedCell;
  delay: RenderedCell;
  effects: RenderedCell[];
}

/**
 * Render a single multi-track row to structured data.
 * Takes a MultiTrackRow (row-first view of pattern data).
 */
export function renderRow(
  row: MultiTrackRow,
  rowIndex: number,
  trackConfigs: TrackConfig[],
  config: DisplayConfig,
  cursor?: CursorPosition,
  _selection?: TrackerSelection,
): RenderedRow {
  const sortedTrackIds = trackConfigs.map((_, i) => asTrackId(`track-${i}`));
  const isCursorRow = cursor?.row === rowIndex;
  const isHighlight = rowIndex % config.highlightInterval === 0;
  
  const result: RenderedRow = {
    rowNumber: {
      text: formatRowNumber(rowIndex, config.base, 3),
      color: isHighlight ? 'highlight' : 'dim',
    },
    tracks: [],
    isCurrentRow: isCursorRow,
    isPatternHighlight: isHighlight,
  };
  
  // Render each track
  for (let t = 0; t < row.tracks.length; t++) {
    const trackCells = row.tracks[t]!;
    const trackConfig = trackConfigs[t];
    const trackId = sortedTrackIds[t];
    const isCursorTrack = cursor?.trackId === trackId;
    
    // Note cell
    const noteCell: RenderedCell = {
      text: formatNote(trackCells.note),
      cursor: isCursorRow && isCursorTrack && cursor?.column === 0,
    };
    setNoteColor(noteCell, trackCells.note);
    
    // Instrument
    const instCell: RenderedCell = {
      text: formatInstrument(trackCells.note.instrument ?? null, config.base),
      cursor: isCursorRow && isCursorTrack && cursor?.column === 1,
      dim: trackCells.note.instrument === undefined,
    };
    
    // Volume
    const volCell: RenderedCell = {
      text: trackCells.note.volume !== undefined 
        ? formatHex(trackCells.note.volume, 2, config.base)
        : '..',
      cursor: isCursorRow && isCursorTrack && cursor?.column === 2,
      dim: trackCells.note.volume === undefined,
    };
    
    // Pan
    const panCell: RenderedCell = {
      text: trackCells.note.pan !== undefined
        ? formatHex(trackCells.note.pan, 2, config.base)
        : '..',
      cursor: isCursorRow && isCursorTrack && cursor?.column === 3,
      dim: trackCells.note.pan === undefined,
    };
    
    // Delay
    const delayCell: RenderedCell = {
      text: trackCells.note.delay !== undefined
        ? formatHex(trackCells.note.delay, 2, config.base)
        : '..',
      cursor: isCursorRow && isCursorTrack && cursor?.column === 4,
      dim: trackCells.note.delay === undefined,
    };
    
    // Effects
    const effectCells: RenderedCell[] = [];
    const numEffects = trackConfig?.effectColumns ?? 1;
    
    for (let e = 0; e < numEffects; e++) {
      // EffectCell has an effects array - get first effect from that cell
      const effectCell = trackCells.effects[e];
      const fx = effectCell?.effects?.[0] ?? null;
      const fxCell: RenderedCell = {
        text: formatEffectCommand(fx, config.base),
        cursor: isCursorRow && isCursorTrack && cursor?.column === 5 + e,
        dim: !fx || (fx.code === 0 && fx.param === 0),
      };
      setEffectColor(fxCell, fx);
      effectCells.push(fxCell);
    }
    
    result.tracks.push({
      note: noteCell,
      instrument: instCell,
      volume: volCell,
      pan: panCell,
      delay: delayCell,
      effects: effectCells,
    });
  }
  
  return result;
}

/**
 * Set color based on note type
 */
function setNoteColor(cell: RenderedCell, note: NoteCell): void {
  if (note.note === SpecialNote.Empty) {
    cell.dim = true;
    return;
  }
  if (note.note === SpecialNote.NoteOff) {
    cell.color = 'noteOff';
    return;
  }
  if (note.note === SpecialNote.NoteCut || note.note === SpecialNote.NoteFade) {
    cell.color = 'noteCut';
    return;
  }
  // Color by octave
  const octave = Math.floor(note.note / 12);
  cell.color = `octave${octave % 8}`;
}

/**
 * Set color based on effect category
 */
function setEffectColor(cell: RenderedCell, fx: EffectCommand | null): void {
  if (!fx) return;
  
  const meta = EFFECT_META.get(fx.code);
  if (!meta) return;
  
  // Import EffectCategory from effects.ts would create circular dep
  // Match on the string values of the enum directly
  const category = meta.category as string;
  switch (category) {
    case 'pitch':
      cell.color = 'effectPitch';
      break;
    case 'volume':
      cell.color = 'effectVolume';
      break;
    case 'modulation':
      cell.color = 'effectModulation';
      break;
    case 'timing':
    case 'pattern':
      cell.color = 'effectTiming';
      break;
    case 'card':
    case 'generator':
    case 'session':
    case 'event':
      cell.color = 'effectCardPlay';
      cell.bold = true;
      break;
    case 'sample':
      cell.color = 'effectSample';
      break;
    case 'phrase':
      cell.color = 'effectPhrase';
      break;
    default:
      cell.color = 'effectDefault';
      break;
  }
}

// =============================================================================
// ANSI TERMINAL RENDERER
// =============================================================================

/**
 * Render pattern to ANSI-colored terminal string
 */
export function renderPatternToANSI(
  pattern: Pattern,
  config: DisplayConfig = defaultDisplayConfig(),
  cursor?: CursorPosition,
  visibleRows?: { start: number; end: number },
): string {
  const lines: string[] = [];
  const trackConfigs = getTrackConfigs(pattern);
  
  // Header with track names
  const headerLine = buildHeaderLine(trackConfigs, config);
  lines.push(headerLine);
  
  // Separator
  lines.push(buildSeparatorLine(trackConfigs, config));
  
  // Rows
  const startRow = visibleRows?.start ?? 0;
  const endRow = visibleRows?.end ?? getPatternLength(pattern);
  
  for (let r = startRow; r < endRow; r++) {
    const row = getPatternRowView(pattern, r);
    if (row.tracks.length === 0) continue;
    
    const rowLine = buildRowLine(row, r, trackConfigs, config, cursor);
    lines.push(rowLine);
  }
  
  return lines.join('\n');
}

/**
 * Build header line with track names
 */
function buildHeaderLine(trackConfigs: TrackConfig[], _config: DisplayConfig): string {
  let line = ANSI.dim + '    ' + ANSI.reset; // Row number column
  
  for (let t = 0; t < trackConfigs.length; t++) {
    const track = trackConfigs[t]!;
    const name = track.name.slice(0, 8).padEnd(8);
    line += ANSI.bold + ANSI.cyan + ' ' + name;
    
    // Pad for effect columns
    const effectWidth = (track.effectColumns - 1) * 4;
    if (effectWidth > 0) {
      line += ' '.repeat(effectWidth);
    }
    line += ANSI.reset + ' │';
  }
  
  return line;
}

/**
 * Build separator line
 */
function buildSeparatorLine(trackConfigs: TrackConfig[], _config: DisplayConfig): string {
  let line = '────';
  
  for (let t = 0; t < trackConfigs.length; t++) {
    const track = trackConfigs[t]!;
    const width = 3 + 2 + 2 + 2 + 2 + track.effectColumns * 4 + 5; // note+inst+vol+pan+delay+fx+spaces
    line += '─'.repeat(width) + '┼';
  }
  
  return ANSI.dim + line + ANSI.reset;
}

/**
 * Build a single row line
 */
function buildRowLine(
  row: MultiTrackRow,
  rowIndex: number,
  trackConfigs: TrackConfig[],
  config: DisplayConfig,
  _cursor?: CursorPosition,
): string {
  const isCursorRow = _cursor?.row === rowIndex;
  const isHighlight = rowIndex % config.highlightInterval === 0;
  
  // Row number
  let line = '';
  if (isHighlight) {
    line += ANSI.brightWhite;
  } else {
    line += ANSI.dim;
  }
  line += formatRowNumber(rowIndex, config.base) + ANSI.reset + ' ';
  
  // Each track
  for (let t = 0; t < row.tracks.length; t++) {
    const trackCells = row.tracks[t]!;
    const trackConfig = trackConfigs[t];
    // Note: isCursorTrack could be used for cursor highlighting in future
    // const trackId = sortedTrackIds[t];
    // const isCursorTrack = cursor?.trackId === trackId;
    
    // Note
    const noteText = formatNote(trackCells.note);
    if (trackCells.note.note === SpecialNote.Empty) {
      line += ANSI.dim + noteText + ANSI.reset;
    } else if (trackCells.note.note === SpecialNote.NoteOff) {
      line += ANSI.red + noteText + ANSI.reset;
    } else if (trackCells.note.note === SpecialNote.NoteCut) {
      line += ANSI.yellow + noteText + ANSI.reset;
    } else {
      line += ANSI.brightWhite + noteText + ANSI.reset;
    }
    line += ' ';
    
    // Instrument
    const instText = formatInstrument(trackCells.note.instrument ?? null, config.base);
    if (trackCells.note.instrument === undefined) {
      line += ANSI.dim + instText + ANSI.reset;
    } else {
      line += ANSI.brightYellow + instText + ANSI.reset;
    }
    line += ' ';
    
    // Volume
    const volText = trackCells.note.volume !== undefined
      ? formatHex(trackCells.note.volume, 2, config.base)
      : '..';
    if (trackCells.note.volume === undefined) {
      line += ANSI.dim + volText + ANSI.reset;
    } else {
      line += ANSI.green + volText + ANSI.reset;
    }
    line += ' ';
    
    // Pan  
    const panText = trackCells.note.pan !== undefined
      ? formatHex(trackCells.note.pan, 2, config.base)
      : '..';
    if (trackCells.note.pan === undefined) {
      line += ANSI.dim + panText + ANSI.reset;
    } else {
      line += ANSI.blue + panText + ANSI.reset;
    }
    line += ' ';
    
    // Delay
    const delayText = trackCells.note.delay !== undefined
      ? formatHex(trackCells.note.delay, 2, config.base)
      : '..';
    if (trackCells.note.delay === undefined) {
      line += ANSI.dim + delayText + ANSI.reset;
    } else {
      line += ANSI.magenta + delayText + ANSI.reset;
    }
    line += ' ';
    
    // Effects
    const numEffectCols = trackConfig?.effectColumns ?? 1;
    for (let e = 0; e < numEffectCols; e++) {
      const effectCell = trackCells.effects[e];
      const fx = effectCell?.effects?.[0] ?? null;
      const fxText = formatEffectCommand(fx, config.base);
      
      if (!fx || (fx.code === 0 && fx.param === 0)) {
        line += ANSI.dim + fxText + ANSI.reset;
      } else {
        const meta = EFFECT_META.get(fx.code);
        const category = meta?.category as string;
        if (category === 'card' || category === 'generator' || category === 'session') {
          line += ANSI.brightMagenta + ANSI.bold + fxText + ANSI.reset;
        } else if (category === 'pitch') {
          line += ANSI.cyan + fxText + ANSI.reset;
        } else if (category === 'volume') {
          line += ANSI.green + fxText + ANSI.reset;
        } else {
          line += ANSI.white + fxText + ANSI.reset;
        }
      }
      line += ' ';
    }
    
    line += '│';
  }
  
  // Cursor highlight (simple inversion for now)
  if (isCursorRow) {
    // In a real implementation, we'd highlight the specific cell
  }
  
  return line;
}

// =============================================================================
// VIRTUAL DOM RENDERER
// =============================================================================

/** Virtual node for canvas/WebGL rendering */
export interface VNode {
  type: 'text' | 'rect' | 'group';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  background?: string;
  children?: VNode[];
  id?: string;
}

/** Render configuration for virtual DOM */
export interface VRenderConfig {
  cellWidth: number;
  cellHeight: number;
  fontFamily: string;
  fontSize: number;
  colors: {
    background: string;
    foreground: string;
    dim: string;
    highlight: string;
    cursor: string;
    selection: string;
    noteOff: string;
    noteCut: string;
    octave: string[];
    effectPitch: string;
    effectVolume: string;
    effectPan: string;
    effectFlow: string;
    effectCardPlay: string;
  };
}

/** Default render configuration */
export const DEFAULT_VRENDER_CONFIG: VRenderConfig = {
  cellWidth: 8,
  cellHeight: 16,
  fontFamily: 'Fira Code, Monaco, monospace',
  fontSize: 12,
  colors: {
    background: '#1a1a2e',
    foreground: '#eef0f2',
    dim: '#4a4a5a',
    highlight: '#2a2a4e',
    cursor: '#ff6b6b',
    selection: '#3a5a8a',
    noteOff: '#ff4757',
    noteCut: '#ffa502',
    octave: ['#a29bfe', '#74b9ff', '#81ecec', '#55efc4', '#ffeaa7', '#fab1a0', '#fd79a8', '#e056fd'],
    effectPitch: '#74b9ff',
    effectVolume: '#55efc4',
    effectPan: '#a29bfe',
    effectFlow: '#ffeaa7',
    effectCardPlay: '#fd79a8',
  },
};

/**
 * Render pattern to virtual DOM nodes
 */
export function renderPatternToVDOM(
  pattern: Pattern,
  config: VRenderConfig = DEFAULT_VRENDER_CONFIG,
  displayConfig: DisplayConfig = defaultDisplayConfig(),
  cursor?: CursorPosition,
  selection?: TrackerSelection,
  visibleRows?: { start: number; end: number },
): VNode {
  const nodes: VNode[] = [];
  const patternLength = getPatternLength(pattern);
  const trackConfigs = getTrackConfigs(pattern);
  const startRow = visibleRows?.start ?? 0;
  const endRow = visibleRows?.end ?? Math.min(patternLength, startRow + 32);
  
  let y = 0;
  
  for (let r = startRow; r < endRow; r++) {
    const row = getPatternRowView(pattern, r);
    if (row.tracks.length === 0) continue;
    
    const rendered = renderRow(
      row,
      r,
      trackConfigs,
      displayConfig,
      cursor,
      selection,
    );
    
    const rowNode = renderRowToVNode(rendered, y, config, displayConfig);
    nodes.push(rowNode);
    y += config.cellHeight;
  }
  
  return {
    type: 'group',
    x: 0,
    y: 0,
    children: nodes,
    id: `pattern-${pattern.config.id}`,
  };
}

/**
 * Render a single row to VNode
 */
function renderRowToVNode(
  row: RenderedRow,
  y: number,
  config: VRenderConfig,
  _displayConfig: DisplayConfig,
): VNode {
  const children: VNode[] = [];
  let x = 0;
  
  // Background highlight
  if (row.isPatternHighlight) {
    children.push({
      type: 'rect',
      x: 0,
      y,
      width: 1000, // Will be clipped
      height: config.cellHeight,
      background: config.colors.highlight,
    });
  }
  
  // Row number
  children.push({
    type: 'text',
    x,
    y,
    text: row.rowNumber.text,
    color: row.rowNumber.dim ? config.colors.dim : config.colors.foreground,
  });
  x += COLUMN_WIDTHS.rowNumber * config.cellWidth;
  
  // Track cells
  for (const track of row.tracks) {
    x += config.cellWidth; // Separator
    
    // Note
    children.push(cellToVNode(track.note, x, y, config));
    x += COLUMN_WIDTHS.note * config.cellWidth;
    
    // Instrument
    children.push(cellToVNode(track.instrument, x, y, config));
    x += COLUMN_WIDTHS.instrument * config.cellWidth;
    
    // Volume
    children.push(cellToVNode(track.volume, x, y, config));
    x += COLUMN_WIDTHS.volume * config.cellWidth;
    
    // Pan
    children.push(cellToVNode(track.pan, x, y, config));
    x += COLUMN_WIDTHS.pan * config.cellWidth;
    
    // Delay
    children.push(cellToVNode(track.delay, x, y, config));
    x += COLUMN_WIDTHS.delay * config.cellWidth;
    
    // Effects
    for (const fx of track.effects) {
      children.push(cellToVNode(fx, x, y, config));
      x += COLUMN_WIDTHS.effect * config.cellWidth;
    }
  }
  
  return {
    type: 'group',
    x: 0,
    y,
    children,
    id: `row-${row.rowNumber.text}`,
  };
}

/**
 * Convert RenderedCell to VNode
 */
function cellToVNode(cell: RenderedCell, x: number, y: number, config: VRenderConfig): VNode {
  let color = config.colors.foreground;
  
  if (cell.dim) {
    color = config.colors.dim;
  } else if (cell.color) {
    color = resolveColor(cell.color, config);
  }
  
  const node: VNode = {
    type: 'text',
    x,
    y,
    text: cell.text,
    color,
  };
  
  // Cursor highlight
  if (cell.cursor) {
    return {
      type: 'group',
      x,
      y,
      children: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          width: cell.text.length * config.cellWidth,
          height: config.cellHeight,
          background: config.colors.cursor,
        },
        { ...node, x: 0, y: 0, color: config.colors.background },
      ],
    };
  }
  
  // Selection highlight
  if (cell.selected) {
    return {
      type: 'group',
      x,
      y,
      children: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          width: cell.text.length * config.cellWidth,
          height: config.cellHeight,
          background: config.colors.selection,
        },
        { ...node, x: 0, y: 0 },
      ],
    };
  }
  
  return node;
}

/**
 * Resolve color name to hex value
 */
function resolveColor(colorName: string | undefined, config: VRenderConfig): string {
  if (!colorName) {
    return config.colors.foreground;
  }
  
  if (colorName.startsWith('#')) {
    return colorName;
  }
  
  if (colorName.startsWith('octave')) {
    const index = parseInt(colorName.slice(6), 10);
    return config.colors.octave[index % config.colors.octave.length]!;
  }
  
  const colorMap: Record<string, string> = {
    noteOff: config.colors.noteOff,
    noteCut: config.colors.noteCut,
    effectPitch: config.colors.effectPitch,
    effectVolume: config.colors.effectVolume,
    effectPan: config.colors.effectPan,
    effectFlow: config.colors.effectFlow,
    effectCardPlay: config.colors.effectCardPlay,
    highlight: config.colors.highlight,
    dim: config.colors.dim,
    effectDefault: config.colors.foreground,
    effectModulation: config.colors.effectPitch,
    effectTiming: config.colors.effectFlow,
    effectSample: config.colors.effectPan,
    effectPhrase: config.colors.effectCardPlay,
  };
  
  return colorMap[colorName] ?? config.colors.foreground;
}

// =============================================================================
// DIRTY REGION TRACKING
// =============================================================================

/** Dirty region for incremental rendering */
export interface DirtyRegion {
  rows: Set<number>;
  tracks: Set<number>;
  full: boolean;
}

/**
 * Create empty dirty region
 */
export function createDirtyRegion(): DirtyRegion {
  return {
    rows: new Set(),
    tracks: new Set(),
    full: false,
  };
}

/**
 * Mark specific cells as dirty
 */
export function markDirty(region: DirtyRegion, row: number, track?: number): void {
  region.rows.add(row);
  if (track !== undefined) {
    region.tracks.add(track);
  }
}

/**
 * Mark entire pattern as dirty
 */
export function markFullDirty(region: DirtyRegion): void {
  region.full = true;
}

/**
 * Clear dirty region
 */
export function clearDirty(region: DirtyRegion): void {
  region.rows.clear();
  region.tracks.clear();
  region.full = false;
}

/**
 * Check if region is dirty
 */
export function isDirty(region: DirtyRegion): boolean {
  return region.full || region.rows.size > 0;
}

// =============================================================================
// ACCESSIBILITY OUTPUT
// =============================================================================

/** Accessible description of a row */
export interface AccessibleRow {
  rowNumber: number;
  description: string;
  tracks: AccessibleTrack[];
}

/** Accessible description of track content */
export interface AccessibleTrack {
  trackName: string;
  note?: string;
  instrument?: string;
  effects: string[];
}

/**
 * Generate accessible description of a row
 */
export function generateAccessibleRow(
  row: MultiTrackRow,
  rowIndex: number,
  trackConfigs: TrackConfig[],
): AccessibleRow {
  const trackDescs: AccessibleTrack[] = [];
  
  for (let t = 0; t < row.tracks.length; t++) {
    const trackCells = row.tracks[t]!;
    const config = trackConfigs[t];
    
    const trackDesc: AccessibleTrack = {
      trackName: config?.name ?? `Track ${t + 1}`,
      effects: [],
    };
    
    // Describe note
    if (trackCells.note.note !== SpecialNote.Empty) {
      if (trackCells.note.note === SpecialNote.NoteOff) {
        trackDesc.note = 'note off';
      } else if (trackCells.note.note === SpecialNote.NoteCut) {
        trackDesc.note = 'note cut';
      } else {
        const noteText = formatNote(trackCells.note);
        trackDesc.note = `${noteText}`;
        if (trackCells.note.volume !== undefined) {
          trackDesc.note += ` velocity ${trackCells.note.volume}`;
        }
      }
    }
    
    // Describe instrument
    if (trackCells.note.instrument !== undefined) {
      trackDesc.instrument = `instrument ${trackCells.note.instrument}`;
    }
    
    // Describe effects
    for (const fxCell of trackCells.effects) {
      const fx = fxCell.effects[0];
      if (fx && (fx.code !== 0 || fx.param !== 0)) {
        const name = getEffectName(fx.code);
        trackDesc.effects.push(`${name} ${fx.param}`);
      }
    }
    
    // Only include if there's content
    if (trackDesc.note || trackDesc.instrument || trackDesc.effects.length > 0) {
      trackDescs.push(trackDesc);
    }
  }
  
  // Build description
  let description = `Row ${rowIndex}`;
  if (trackDescs.length === 0) {
    description += ': empty';
  } else {
    description += ': ' + trackDescs.map(t => {
      const parts = [t.trackName];
      if (t.note) parts.push(t.note);
      if (t.instrument) parts.push(t.instrument);
      parts.push(...t.effects);
      return parts.join(' ');
    }).join(', ');
  }
  
  return {
    rowNumber: rowIndex,
    description,
    tracks: trackDescs,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  NOTE_NAMES,
  ANSI,
  COLUMN_WIDTHS,
};
