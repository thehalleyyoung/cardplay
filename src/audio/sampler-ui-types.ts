/**
 * @fileoverview Sampler UI Types - TypeScript Definitions for Sampler Interface
 * 
 * Defines comprehensive types for the sampler user interface including:
 * - Keyboard/zone mapping display
 * - Waveform visualization
 * - Modulation matrix UI
 * - Envelope displays
 * - Browser and library views
 * - Real-time metering
 * 
 * @module @cardplay/core/audio/sampler-ui-types
 */

// ============================================================================
// KEYBOARD & ZONE MAPPING TYPES
// ============================================================================

/** Keyboard display configuration */
export interface KeyboardDisplayConfig {
  /** Starting MIDI note (0-127) */
  startNote: number;
  /** Ending MIDI note (0-127) */
  endNote: number;
  /** Width of white keys in pixels */
  whiteKeyWidth: number;
  /** Height of white keys in pixels */
  whiteKeyHeight: number;
  /** Height ratio for black keys (0.6 typical) */
  blackKeyRatio: number;
  /** Show note names on keys */
  showNoteNames: boolean;
  /** Show octave numbers */
  showOctaveNumbers: boolean;
  /** Highlight mode */
  highlightMode: 'zone' | 'velocity' | 'layer' | 'none';
  /** Color scheme */
  colorScheme: 'dark' | 'light' | 'custom';
  /** Custom colors */
  customColors?: KeyboardColors;
}

/** Keyboard color scheme */
export interface KeyboardColors {
  whiteKey: string;
  whiteKeyPressed: string;
  whiteKeyHover: string;
  blackKey: string;
  blackKeyPressed: string;
  blackKeyHover: string;
  zoneHighlight: string;
  selectedZone: string;
  rootKey: string;
  background: string;
  border: string;
}

/** Default keyboard colors */
export const DEFAULT_KEYBOARD_COLORS: KeyboardColors = {
  whiteKey: '#f0f0f0',
  whiteKeyPressed: '#a0c0ff',
  whiteKeyHover: '#e0e0e0',
  blackKey: '#303030',
  blackKeyPressed: '#5080c0',
  blackKeyHover: '#404040',
  zoneHighlight: 'rgba(100, 150, 255, 0.3)',
  selectedZone: 'rgba(255, 200, 100, 0.5)',
  rootKey: '#ff6060',
  background: '#1a1a1a',
  border: '#404040',
};

/** Zone display for keyboard mapping */
export interface ZoneDisplayInfo {
  id: string;
  name: string;
  keyLow: number;
  keyHigh: number;
  velocityLow: number;
  velocityHigh: number;
  rootKey: number;
  color: string;
  selected: boolean;
  muted: boolean;
  soloed: boolean;
  /** Sample preview waveform data (downsampled) */
  waveformPreview?: Float32Array;
  /** Layer index for stacked zones */
  layerIndex: number;
}

/** Keyboard note state */
export interface KeyboardNoteState {
  note: number;
  velocity: number;
  pressed: boolean;
  zones: string[]; // Zone IDs that cover this note
  activeVoices: number;
}

/** Zone drag operation */
export interface ZoneDragOperation {
  type: 'move' | 'resize-left' | 'resize-right' | 'velocity-top' | 'velocity-bottom';
  zoneId: string;
  startKey: number;
  startVelocity: number;
  originalKeyLow: number;
  originalKeyHigh: number;
  originalVelocityLow: number;
  originalVelocityHigh: number;
}

// ============================================================================
// WAVEFORM DISPLAY TYPES
// ============================================================================

/** Waveform display mode */
export type WaveformDisplayMode = 'waveform' | 'spectrum' | 'spectrogram' | 'phase';

/** Waveform display configuration */
export interface WaveformDisplayConfig {
  mode: WaveformDisplayMode;
  width: number;
  height: number;
  /** Zoom level (1 = fit, >1 = zoomed in) */
  zoom: number;
  /** Scroll position (0-1) */
  scrollPosition: number;
  /** Show loop points */
  showLoopPoints: boolean;
  /** Show markers */
  showMarkers: boolean;
  /** Show grid */
  showGrid: boolean;
  /** Grid snap mode */
  gridSnap: 'off' | 'beat' | 'zero-cross' | 'transient';
  /** Selection start (samples) */
  selectionStart: number | null;
  /** Selection end (samples) */
  selectionEnd: number | null;
  /** Waveform colors */
  colors: WaveformColors;
}

/** Waveform color scheme */
export interface WaveformColors {
  background: string;
  waveformPositive: string;
  waveformNegative: string;
  waveformRms: string;
  playhead: string;
  loopStart: string;
  loopEnd: string;
  selection: string;
  selectionBorder: string;
  grid: string;
  centerLine: string;
  marker: string;
}

/** Default waveform colors */
export const DEFAULT_WAVEFORM_COLORS: WaveformColors = {
  background: '#1a1a1a',
  waveformPositive: '#4080ff',
  waveformNegative: '#3060c0',
  waveformRms: '#6090ff',
  playhead: '#ff4040',
  loopStart: '#40ff40',
  loopEnd: '#ff8040',
  selection: 'rgba(255, 255, 100, 0.2)',
  selectionBorder: '#ffff60',
  grid: 'rgba(255, 255, 255, 0.1)',
  centerLine: 'rgba(255, 255, 255, 0.3)',
  marker: '#ff80ff',
};

/** Waveform marker */
export interface WaveformMarker {
  id: string;
  position: number;
  name: string;
  color: string;
  type: 'cue' | 'slice' | 'loop' | 'custom';
}

/** Waveform render data */
export interface WaveformRenderData {
  /** Peak values per pixel column (min, max) */
  peaks: Array<[number, number]>;
  /** RMS values per pixel column */
  rms: Float32Array;
  /** Start sample index */
  startSample: number;
  /** Samples per pixel */
  samplesPerPixel: number;
  /** Total sample count */
  totalSamples: number;
  /** Sample rate */
  sampleRate: number;
}

// ============================================================================
// ENVELOPE DISPLAY TYPES
// ============================================================================

/** Envelope display point */
export interface EnvelopeDisplayPoint {
  time: number;
  level: number;
  curve: number; // -1 to 1 (exponential curve)
  draggable: boolean;
  type: 'attack' | 'hold' | 'decay' | 'sustain' | 'release' | 'custom';
}

/** Envelope display configuration */
export interface EnvelopeDisplayConfig {
  width: number;
  height: number;
  /** Max time in seconds for full display */
  maxTime: number;
  /** Show time grid */
  showGrid: boolean;
  /** Show level labels */
  showLevels: boolean;
  /** Interactive editing */
  interactive: boolean;
  /** Colors */
  colors: EnvelopeColors;
}

/** Envelope color scheme */
export interface EnvelopeColors {
  background: string;
  line: string;
  fill: string;
  point: string;
  pointHover: string;
  pointDrag: string;
  grid: string;
  label: string;
  sustainLine: string;
}

/** Default envelope colors */
export const DEFAULT_ENVELOPE_COLORS: EnvelopeColors = {
  background: '#1a1a1a',
  line: '#80ff80',
  fill: 'rgba(80, 255, 80, 0.2)',
  point: '#ffffff',
  pointHover: '#ffff80',
  pointDrag: '#ff8080',
  grid: 'rgba(255, 255, 255, 0.1)',
  label: '#808080',
  sustainLine: 'rgba(80, 255, 80, 0.5)',
};

// ============================================================================
// MODULATION MATRIX UI TYPES
// ============================================================================

/** Modulation source display */
export interface ModSourceDisplay {
  id: string;
  name: string;
  shortName: string;
  category: 'envelope' | 'lfo' | 'midi' | 'macro' | 'random' | 'special';
  color: string;
  icon?: string;
  bipolar: boolean;
  currentValue: number;
}

/** Modulation destination display */
export interface ModDestinationDisplay {
  id: string;
  name: string;
  shortName: string;
  category: 'pitch' | 'amplitude' | 'filter' | 'pan' | 'effect' | 'lfo' | 'other';
  color: string;
  minValue: number;
  maxValue: number;
  currentValue: number;
  unit: string;
}

/** Modulation connection display */
export interface ModConnectionDisplay {
  sourceId: string;
  destinationId: string;
  amount: number;
  curve: number;
  enabled: boolean;
}

/** Modulation matrix configuration */
export interface ModMatrixConfig {
  sources: ModSourceDisplay[];
  destinations: ModDestinationDisplay[];
  connections: ModConnectionDisplay[];
  maxConnections: number;
  selectedSource: string | null;
  selectedDestination: string | null;
}

// ============================================================================
// FILTER DISPLAY TYPES
// ============================================================================

/** Filter frequency response point */
export interface FilterResponsePoint {
  frequency: number;
  magnitude: number; // dB
  phase: number;     // radians
}

/** Filter display configuration */
export interface FilterDisplayConfig {
  width: number;
  height: number;
  /** Frequency range */
  minFreq: number;
  maxFreq: number;
  /** Magnitude range in dB */
  minDb: number;
  maxDb: number;
  /** Show phase response */
  showPhase: boolean;
  /** Interactive editing */
  interactive: boolean;
  /** Number of frequency points to calculate */
  resolution: number;
  /** Colors */
  colors: FilterDisplayColors;
}

/** Filter display colors */
export interface FilterDisplayColors {
  background: string;
  grid: string;
  magnitude: string;
  phase: string;
  cutoffLine: string;
  resonancePeak: string;
  fill: string;
}

/** Default filter display colors */
export const DEFAULT_FILTER_COLORS: FilterDisplayColors = {
  background: '#1a1a1a',
  grid: 'rgba(255, 255, 255, 0.1)',
  magnitude: '#ff8040',
  phase: '#4080ff',
  cutoffLine: 'rgba(255, 128, 64, 0.5)',
  resonancePeak: '#ff4040',
  fill: 'rgba(255, 128, 64, 0.2)',
};

// ============================================================================
// BROWSER & LIBRARY UI TYPES
// ============================================================================

/** Browser view mode */
export type BrowserViewMode = 'list' | 'grid' | 'tree';

/** Browser sort options */
export type BrowserSortField = 'name' | 'date' | 'size' | 'type' | 'rating' | 'author';
export type BrowserSortOrder = 'asc' | 'desc';

/** Browser filter options */
export interface BrowserFilters {
  search: string;
  types: string[];
  tags: string[];
  categories: string[];
  favorites: boolean;
  dateRange?: [Date, Date];
  sizeRange?: [number, number];
  rating?: number;
}

/** Browser item */
export interface BrowserItem {
  id: string;
  name: string;
  path: string;
  type: 'sample' | 'preset' | 'instrument' | 'folder' | 'multisample';
  size?: number;
  dateCreated?: Date;
  dateModified?: Date;
  rating?: number;
  tags: string[];
  category?: string;
  author?: string;
  favorite: boolean;
  thumbnail?: string;
  preview?: {
    waveform?: Float32Array;
    duration?: number;
    sampleRate?: number;
  };
  metadata?: Record<string, unknown>;
}

/** Browser state */
export interface BrowserState {
  viewMode: BrowserViewMode;
  currentPath: string;
  selectedItems: string[];
  expandedFolders: string[];
  sortField: BrowserSortField;
  sortOrder: BrowserSortOrder;
  filters: BrowserFilters;
  items: BrowserItem[];
  loading: boolean;
  error?: string;
}

/** Browser configuration */
export interface BrowserConfig {
  rootPaths: string[];
  favoritesPaths: string[];
  recentPaths: string[];
  showHidden: boolean;
  previewOnSelect: boolean;
  previewVolume: number;
  thumbnailSize: 'small' | 'medium' | 'large';
  columns: string[];
}

// ============================================================================
// METERING UI TYPES
// ============================================================================

/** Meter type */
export type MeterType = 'peak' | 'rms' | 'vu' | 'lufs' | 'correlation' | 'spectrum';

/** Meter configuration */
export interface MeterConfig {
  type: MeterType;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
  channels: 1 | 2;
  peakHold: boolean;
  peakHoldTime: number;
  decayRate: number;
  scale: 'linear' | 'logarithmic';
  rangeMin: number;
  rangeMax: number;
  colors: MeterColors;
}

/** Meter color scheme */
export interface MeterColors {
  background: string;
  meterLow: string;
  meterMid: string;
  meterHigh: string;
  meterClip: string;
  peak: string;
  scale: string;
  label: string;
}

/** Default meter colors */
export const DEFAULT_METER_COLORS: MeterColors = {
  background: '#1a1a1a',
  meterLow: '#40ff40',
  meterMid: '#ffff40',
  meterHigh: '#ff8040',
  meterClip: '#ff4040',
  peak: '#ffffff',
  scale: '#808080',
  label: '#a0a0a0',
};

/** Meter state */
export interface MeterState {
  left: number;
  right: number;
  leftPeak: number;
  rightPeak: number;
  leftClip: boolean;
  rightClip: boolean;
  correlation?: number;
  lufs?: {
    momentary: number;
    shortTerm: number;
    integrated: number;
  };
}

// ============================================================================
// SAMPLER MAIN UI TYPES
// ============================================================================

/** Sampler UI view */
export type SamplerUIView = 
  | 'main'
  | 'mapping'
  | 'sample-edit'
  | 'modulation'
  | 'effects'
  | 'browser'
  | 'settings';

/** Sampler panel */
export type SamplerPanel = 
  | 'zones'
  | 'waveform'
  | 'envelope'
  | 'filter'
  | 'lfo'
  | 'modmatrix'
  | 'effects'
  | 'output';

/** Panel layout configuration */
export interface PanelLayoutConfig {
  panels: Array<{
    id: SamplerPanel;
    visible: boolean;
    collapsed: boolean;
    size: number;
  }>;
  layout: 'horizontal' | 'vertical' | 'grid';
  spacing: number;
}

/** Sampler UI state */
export interface SamplerUIState {
  currentView: SamplerUIView;
  selectedZones: string[];
  selectedSample: string | null;
  focusedPanel: SamplerPanel | null;
  panelLayout: PanelLayoutConfig;
  keyboardConfig: KeyboardDisplayConfig;
  waveformConfig: WaveformDisplayConfig;
  browserState: BrowserState;
  meterState: MeterState;
  undoStack: UIAction[];
  redoStack: UIAction[];
  clipboard: ClipboardData | null;
}

/** UI action for undo/redo */
export interface UIAction {
  type: string;
  timestamp: number;
  data: unknown;
  inverse: () => void;
}

/** Clipboard data */
export interface ClipboardData {
  type: 'zone' | 'sample' | 'modulation' | 'effect' | 'preset';
  data: unknown;
  timestamp: number;
}

// ============================================================================
// CONTROL TYPES
// ============================================================================

/** Knob control configuration */
export interface KnobConfig {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  default: number;
  step: number;
  unit: string;
  bipolar: boolean;
  logarithmic: boolean;
  size: 'small' | 'medium' | 'large';
  style: 'default' | 'modern' | 'vintage';
  colors?: {
    track: string;
    fill: string;
    knob: string;
    indicator: string;
    label: string;
    value: string;
  };
}

/** Slider control configuration */
export interface SliderConfig {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  default: number;
  step: number;
  unit: string;
  orientation: 'horizontal' | 'vertical';
  bipolar: boolean;
  logarithmic: boolean;
  showScale: boolean;
  showValue: boolean;
}

/** Button control configuration */
export interface ButtonConfig {
  id: string;
  label: string;
  type: 'toggle' | 'momentary' | 'radio';
  state: boolean;
  group?: string;
  icon?: string;
  tooltip?: string;
}

/** Dropdown control configuration */
export interface DropdownConfig {
  id: string;
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }>;
  searchable: boolean;
  multiple: boolean;
}

// ============================================================================
// CONTEXT MENU TYPES
// ============================================================================

/** Context menu item */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  submenu?: ContextMenuItem[];
  separator?: boolean;
  action?: () => void;
}

/** Context menu configuration */
export interface ContextMenuConfig {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  target?: unknown;
}

// ============================================================================
// DRAG AND DROP TYPES
// ============================================================================

/** Drag data type */
export type DragDataType = 
  | 'zone'
  | 'sample'
  | 'preset'
  | 'effect'
  | 'modulation'
  | 'file'
  | 'folder';

/** Drag data */
export interface DragData {
  type: DragDataType;
  sourceId: string;
  data: unknown;
  preview?: {
    element?: HTMLElement;
    offset?: { x: number; y: number };
  };
}

/** Drop target */
export interface DropTarget {
  id: string;
  accepts: DragDataType[];
  onDrop: (data: DragData, position: { x: number; y: number }) => void;
  onDragOver?: (data: DragData, position: { x: number; y: number }) => boolean;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/** Keyboard shortcut definition */
export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  category: string;
  customizable: boolean;
}

/** Default sampler keyboard shortcuts */
export const DEFAULT_SAMPLER_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'save', key: 's', ctrl: true, action: 'save', description: 'Save preset', category: 'file', customizable: true },
  { id: 'save-as', key: 's', ctrl: true, shift: true, action: 'save-as', description: 'Save preset as', category: 'file', customizable: true },
  { id: 'open', key: 'o', ctrl: true, action: 'open', description: 'Open preset', category: 'file', customizable: true },
  { id: 'undo', key: 'z', ctrl: true, action: 'undo', description: 'Undo', category: 'edit', customizable: true },
  { id: 'redo', key: 'z', ctrl: true, shift: true, action: 'redo', description: 'Redo', category: 'edit', customizable: true },
  { id: 'copy', key: 'c', ctrl: true, action: 'copy', description: 'Copy', category: 'edit', customizable: true },
  { id: 'paste', key: 'v', ctrl: true, action: 'paste', description: 'Paste', category: 'edit', customizable: true },
  { id: 'delete', key: 'Delete', action: 'delete', description: 'Delete selected', category: 'edit', customizable: true },
  { id: 'select-all', key: 'a', ctrl: true, action: 'select-all', description: 'Select all zones', category: 'selection', customizable: true },
  { id: 'deselect', key: 'Escape', action: 'deselect', description: 'Deselect all', category: 'selection', customizable: true },
  { id: 'zoom-in', key: '+', ctrl: true, action: 'zoom-in', description: 'Zoom in', category: 'view', customizable: true },
  { id: 'zoom-out', key: '-', ctrl: true, action: 'zoom-out', description: 'Zoom out', category: 'view', customizable: true },
  { id: 'zoom-fit', key: '0', ctrl: true, action: 'zoom-fit', description: 'Fit to view', category: 'view', customizable: true },
  { id: 'play-preview', key: ' ', action: 'play-preview', description: 'Play/stop preview', category: 'playback', customizable: true },
];

// ============================================================================
// TOOLTIP & HELP TYPES
// ============================================================================

/** Tooltip configuration */
export interface TooltipConfig {
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay: number;
  maxWidth: number;
  showShortcut?: string;
}

/** Help panel section */
export interface HelpSection {
  id: string;
  title: string;
  content: string;
  icon?: string;
  subsections?: HelpSection[];
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/** Create default keyboard display config */
export function createKeyboardDisplayConfig(
  overrides?: Partial<KeyboardDisplayConfig>
): KeyboardDisplayConfig {
  return {
    startNote: 21,  // A0
    endNote: 108,   // C8
    whiteKeyWidth: 20,
    whiteKeyHeight: 100,
    blackKeyRatio: 0.65,
    showNoteNames: true,
    showOctaveNumbers: true,
    highlightMode: 'zone',
    colorScheme: 'dark',
    ...overrides,
  };
}

/** Create default waveform display config */
export function createWaveformDisplayConfig(
  overrides?: Partial<WaveformDisplayConfig>
): WaveformDisplayConfig {
  return {
    mode: 'waveform',
    width: 800,
    height: 200,
    zoom: 1,
    scrollPosition: 0,
    showLoopPoints: true,
    showMarkers: true,
    showGrid: true,
    gridSnap: 'off',
    selectionStart: null,
    selectionEnd: null,
    colors: { ...DEFAULT_WAVEFORM_COLORS },
    ...overrides,
  };
}

/** Create default envelope display config */
export function createEnvelopeDisplayConfig(
  overrides?: Partial<EnvelopeDisplayConfig>
): EnvelopeDisplayConfig {
  return {
    width: 300,
    height: 150,
    maxTime: 5,
    showGrid: true,
    showLevels: true,
    interactive: true,
    colors: { ...DEFAULT_ENVELOPE_COLORS },
    ...overrides,
  };
}

/** Create default filter display config */
export function createFilterDisplayConfig(
  overrides?: Partial<FilterDisplayConfig>
): FilterDisplayConfig {
  return {
    width: 400,
    height: 200,
    minFreq: 20,
    maxFreq: 20000,
    minDb: -24,
    maxDb: 24,
    showPhase: false,
    interactive: true,
    resolution: 256,
    colors: { ...DEFAULT_FILTER_COLORS },
    ...overrides,
  };
}

/** Create default meter config */
export function createMeterConfig(
  overrides?: Partial<MeterConfig>
): MeterConfig {
  return {
    type: 'peak',
    width: 20,
    height: 200,
    orientation: 'vertical',
    channels: 2,
    peakHold: true,
    peakHoldTime: 2000,
    decayRate: 0.97,
    scale: 'logarithmic',
    rangeMin: -60,
    rangeMax: 6,
    colors: { ...DEFAULT_METER_COLORS },
    ...overrides,
  };
}

/** Create default browser state */
export function createBrowserState(
  overrides?: Partial<BrowserState>
): BrowserState {
  return {
    viewMode: 'list',
    currentPath: '/',
    selectedItems: [],
    expandedFolders: [],
    sortField: 'name',
    sortOrder: 'asc',
    filters: {
      search: '',
      types: [],
      tags: [],
      categories: [],
      favorites: false,
    },
    items: [],
    loading: false,
    ...overrides,
  };
}

/** Create default sampler UI state */
export function createSamplerUIState(
  overrides?: Partial<SamplerUIState>
): SamplerUIState {
  return {
    currentView: 'main',
    selectedZones: [],
    selectedSample: null,
    focusedPanel: null,
    panelLayout: {
      panels: [
        { id: 'zones', visible: true, collapsed: false, size: 200 },
        { id: 'waveform', visible: true, collapsed: false, size: 200 },
        { id: 'envelope', visible: true, collapsed: false, size: 150 },
        { id: 'filter', visible: true, collapsed: false, size: 150 },
        { id: 'lfo', visible: true, collapsed: false, size: 150 },
        { id: 'effects', visible: true, collapsed: false, size: 200 },
        { id: 'output', visible: true, collapsed: false, size: 100 },
      ],
      layout: 'horizontal',
      spacing: 8,
    },
    keyboardConfig: createKeyboardDisplayConfig(),
    waveformConfig: createWaveformDisplayConfig(),
    browserState: createBrowserState(),
    meterState: {
      left: -60,
      right: -60,
      leftPeak: -60,
      rightPeak: -60,
      leftClip: false,
      rightClip: false,
    },
    undoStack: [],
    redoStack: [],
    clipboard: null,
    ...overrides,
  };
}
