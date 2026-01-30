/**
 * @fileoverview Card Visuals, Behavior, and UI Configuration System.
 * 
 * This module provides the complete visual identity, runtime behavior metadata,
 * and UI rendering configuration for all cards. It enables:
 * - Emoji + CSS visual representation for every card
 * - Runtime behavior declarations (latency, CPU, memory, side effects)
 * - UI layout definitions (panels, controls, themes)
 * - User-injectable card templates
 * - Curried preset system for partial application
 * 
 * @module @cardplay/core/cards/card-visuals
 */

// ============================================================================
// CARD VISUALS (Visual Identity)
// ============================================================================

/**
 * CSS animation definition for cards.
 */
export interface CardAnimation {
  /** CSS animation name */
  readonly name: string;
  /** Duration (e.g., "0.5s") */
  readonly duration: string;
  /** Timing function (e.g., "ease-in-out") */
  readonly timing: string;
  /** Iteration count (e.g., "infinite") */
  readonly iterationCount: string | number;
  /** CSS keyframes definition */
  readonly keyframes: string;
}

/**
 * Card visual identity and styling.
 */
export interface CardVisuals {
  /** Primary emoji icon: 🥁, 🎹, 🎸, 🎺, 🎻, 🎤, 🔊 */
  readonly emoji: string;
  /** Secondary emoji for genre/style */
  readonly emojiSecondary?: string;
  /** Primary color (hex) */
  readonly color: string;
  /** Secondary/gradient end color */
  readonly colorSecondary?: string;
  /** Gradient type */
  readonly gradient?: 'linear' | 'radial' | 'conic';
  /** Gradient angle (degrees) */
  readonly gradientAngle?: number;
  /** Glow color when active */
  readonly glow?: string;
  /** Glow intensity (0-1) */
  readonly glowIntensity?: number;
  /** Animation definition */
  readonly animation?: CardAnimation;
  /** Badge position for status indicators */
  readonly badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Card icon SVG path (optional, emoji used if not provided) */
  readonly iconPath?: string;
  /** Frame variant */
  readonly frame?: CardFrame;
}

// ============================================================================
// CARD BADGE (Status Indicators)
// ============================================================================

/**
 * Badge type for status indicators.
 */
export type CardBadgeType = 
  | 'recording'
  | 'bypassed'
  | 'soloed'
  | 'muted'
  | 'automation'
  | 'sidechain'
  | 'linked'
  | 'locked'
  | 'error'
  | 'warning'
  | 'midi-learn'
  | 'cpu-high'
  | 'custom';

/**
 * Card badge definition.
 */
export interface CardBadge {
  /** Badge type */
  readonly type: CardBadgeType;
  /** Display label (for custom badges) */
  readonly label?: string;
  /** Badge icon (emoji or SVG path) */
  readonly icon?: string;
  /** Badge color */
  readonly color: string;
  /** Pulsing animation */
  readonly pulse?: boolean;
  /** Tooltip text */
  readonly tooltip?: string;
  /** Is badge currently active */
  readonly active: boolean;
}

/**
 * Predefined badge configurations.
 */
export const CARD_BADGES: Record<CardBadgeType, Omit<CardBadge, 'active'>> = {
  recording: { type: 'recording', icon: '⏺️', color: '#f44336', pulse: true, tooltip: 'Recording' },
  bypassed: { type: 'bypassed', icon: '⏸️', color: '#9e9e9e', tooltip: 'Bypassed' },
  soloed: { type: 'soloed', icon: '🔆', color: '#ffc107', tooltip: 'Soloed' },
  muted: { type: 'muted', icon: '🔇', color: '#757575', tooltip: 'Muted' },
  automation: { type: 'automation', icon: '📈', color: '#4caf50', tooltip: 'Automation active' },
  sidechain: { type: 'sidechain', icon: '⛓️', color: '#00bcd4', tooltip: 'Sidechain linked' },
  linked: { type: 'linked', icon: '🔗', color: '#2196f3', tooltip: 'Parameter linked' },
  locked: { type: 'locked', icon: '🔒', color: '#ff9800', tooltip: 'Locked' },
  error: { type: 'error', icon: '⚠️', color: '#f44336', pulse: true, tooltip: 'Error' },
  warning: { type: 'warning', icon: '⚡', color: '#ff9800', tooltip: 'Warning' },
  'midi-learn': { type: 'midi-learn', icon: '🎹', color: '#9c27b0', pulse: true, tooltip: 'MIDI Learn active' },
  'cpu-high': { type: 'cpu-high', icon: '🔥', color: '#ff5722', tooltip: 'High CPU usage' },
  custom: { type: 'custom', color: '#607d8b' },
};

/**
 * Create a badge.
 */
export function createBadge(type: CardBadgeType, active: boolean = true, options: Partial<CardBadge> = {}): CardBadge {
  return { ...CARD_BADGES[type], active, ...options };
}

// ============================================================================
// CARD FRAME (Display Variants)
// ============================================================================

/**
 * Card frame variant.
 */
export type CardFrameVariant = 'minimal' | 'standard' | 'expanded' | 'fullscreen' | 'floating';

/**
 * Card frame definition.
 */
export interface CardFrame {
  /** Frame variant */
  readonly variant: CardFrameVariant;
  /** Show header */
  readonly showHeader: boolean;
  /** Show footer */
  readonly showFooter: boolean;
  /** Show ports */
  readonly showPorts: boolean;
  /** Show resize handles */
  readonly showResizeHandles: boolean;
  /** Header height in pixels */
  readonly headerHeight: number;
  /** Footer height in pixels */
  readonly footerHeight: number;
  /** Border width */
  readonly borderWidth: number;
  /** Corner radius */
  readonly cornerRadius: number;
}

/**
 * Predefined frame configurations.
 */
export const CARD_FRAMES: Record<CardFrameVariant, CardFrame> = {
  minimal: {
    variant: 'minimal',
    showHeader: false,
    showFooter: false,
    showPorts: true,
    showResizeHandles: false,
    headerHeight: 0,
    footerHeight: 0,
    borderWidth: 1,
    cornerRadius: 4,
  },
  standard: {
    variant: 'standard',
    showHeader: true,
    showFooter: true,
    showPorts: true,
    showResizeHandles: true,
    headerHeight: 32,
    footerHeight: 24,
    borderWidth: 1,
    cornerRadius: 8,
  },
  expanded: {
    variant: 'expanded',
    showHeader: true,
    showFooter: true,
    showPorts: true,
    showResizeHandles: true,
    headerHeight: 40,
    footerHeight: 32,
    borderWidth: 2,
    cornerRadius: 12,
  },
  fullscreen: {
    variant: 'fullscreen',
    showHeader: true,
    showFooter: true,
    showPorts: false,
    showResizeHandles: false,
    headerHeight: 48,
    footerHeight: 40,
    borderWidth: 0,
    cornerRadius: 0,
  },
  floating: {
    variant: 'floating',
    showHeader: true,
    showFooter: false,
    showPorts: false,
    showResizeHandles: true,
    headerHeight: 28,
    footerHeight: 0,
    borderWidth: 1,
    cornerRadius: 16,
  },
};

/**
 * Create a frame configuration.
 */
export function createFrame(variant: CardFrameVariant = 'standard', overrides: Partial<CardFrame> = {}): CardFrame {
  return { ...CARD_FRAMES[variant], ...overrides };
}

// ============================================================================
// CARD GLOW EFFECTS (State-Based Visual Feedback)
// ============================================================================

/**
 * Card glow state.
 */
export type CardGlowState = 
  | 'idle'
  | 'focused'
  | 'active'
  | 'modulated'
  | 'recording'
  | 'error'
  | 'bypassed'
  | 'selected'
  | 'drag-over';

/**
 * Card glow configuration.
 */
export interface CardGlowConfig {
  /** Glow color */
  readonly color: string;
  /** Glow intensity (0-1) */
  readonly intensity: number;
  /** Glow blur radius in pixels */
  readonly blur: number;
  /** Glow spread in pixels */
  readonly spread: number;
  /** Animation (pulse, breathe, flicker) */
  readonly animation?: 'pulse' | 'breathe' | 'flicker' | 'none';
  /** Animation duration in ms */
  readonly animationDuration?: number;
}

/**
 * Predefined glow configurations by state.
 */
export const CARD_GLOW_STATES: Record<CardGlowState, CardGlowConfig> = {
  idle: { color: 'transparent', intensity: 0, blur: 0, spread: 0, animation: 'none' },
  focused: { color: '#ffffff', intensity: 0.3, blur: 8, spread: 0, animation: 'none' },
  active: { color: '#ffffff', intensity: 0.5, blur: 12, spread: 2, animation: 'none' },
  modulated: { color: '#ff9800', intensity: 0.6, blur: 15, spread: 3, animation: 'pulse', animationDuration: 1000 },
  recording: { color: '#f44336', intensity: 0.8, blur: 20, spread: 5, animation: 'pulse', animationDuration: 800 },
  error: { color: '#f44336', intensity: 0.9, blur: 25, spread: 5, animation: 'flicker', animationDuration: 200 },
  bypassed: { color: '#9e9e9e', intensity: 0.1, blur: 5, spread: 0, animation: 'none' },
  selected: { color: '#2196f3', intensity: 0.6, blur: 15, spread: 3, animation: 'none' },
  'drag-over': { color: '#4caf50', intensity: 0.7, blur: 20, spread: 5, animation: 'breathe', animationDuration: 500 },
};

/**
 * Get glow CSS for a state.
 */
export function getGlowCSS(state: CardGlowState): string {
  const glow = CARD_GLOW_STATES[state];
  if (glow.intensity === 0) return 'box-shadow: none;';
  
  const shadow = `0 0 ${glow.blur}px ${glow.spread}px ${glow.color}`;
  let css = `box-shadow: ${shadow};`;
  
  if (glow.animation && glow.animation !== 'none') {
    css += ` animation: glow-${glow.animation} ${glow.animationDuration}ms ease-in-out infinite;`;
  }
  
  return css;
}

/**
 * Generate glow keyframes CSS.
 */
export function generateGlowKeyframes(): string {
  return `
@keyframes glow-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes glow-breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.8; }
}

@keyframes glow-flicker {
  0%, 100% { opacity: 1; }
  25% { opacity: 0.4; }
  50% { opacity: 0.9; }
  75% { opacity: 0.3; }
}
`;
}

/**
 * Emoji mapping by card category/type.
 */
export const CARD_EMOJI_MAP = {
  // Generators (instruments)
  'drum-machine': '🥁',
  'drum-kit': '🥁',
  'synth': '🎹',
  'synthesizer': '🎹',
  'bass': '🎸',
  'bass-synth': '🎸',
  'guitar': '🎸',
  'electric-guitar': '🎸',
  'acoustic-guitar': '🪕',
  'piano': '🎹',
  'electric-piano': '🎹',
  'rhodes': '🎹',
  'wurlitzer': '🎹',
  'strings': '🎻',
  'violin': '🎻',
  'cello': '🎻',
  'orchestra': '🎻',
  'brass': '🎺',
  'trumpet': '🎺',
  'trombone': '🎺',
  'horn': '📯',
  'woodwinds': '🎷',
  'saxophone': '🎷',
  'flute': '🪈',
  'clarinet': '🎷',
  'choir': '🎤',
  'vocals': '🎤',
  'voice': '🎤',
  'organ': '⛪',
  'hammond': '⛪',
  'sampler': '📦',
  'loop-player': '🔁',
  'looper': '🔁',
  'arranger': '🎼',
  'arpeggiator': '🎼',
  'sequencer': '📊',
  'melody': '🎵',
  'chord': '🎶',
  'bassline': '🔊',
  'pad': '☁️',
  'lead': '⚡',
  
  // Effects
  'reverb': '🏛️',
  'delay': '🔄',
  'echo': '🔄',
  'chorus': '👥',
  'flanger': '🌊',
  'phaser': '🌀',
  'filter': '🎚️',
  'eq': '📈',
  'equalizer': '📈',
  'distortion': '⚡',
  'overdrive': '🔥',
  'fuzz': '💥',
  'saturation': '☀️',
  'compressor': '📊',
  'limiter': '🛑',
  'gate': '🚪',
  'expander': '↔️',
  'bitcrusher': '👾',
  'granular': '✨',
  'spectral': '🌈',
  'vocoder': '🤖',
  'convolution': '🏛️',
  'waveshaper': '〰️',
  'multiband': '📶',
  
  // Transforms
  'transpose': '⬆️',
  'pitch': '🎯',
  'quantize': '📐',
  'humanize': '🧑',
  'swing': '🎭',
  'velocity': '💨',
  'gate-effect': '🚪',
  'echo-notes': '📣',
  'chordify': '🎹',
  'harmonize': '🎶',
  'invert': '🔃',
  'retrograde': '⏪',
  'stretch': '↔️',
  
  // Routing/Utility
  'mixer': '🎛️',
  'splitter': '🔀',
  'merger': '🔗',
  'router': '🛤️',
  'macro': '🎯',
  'snapshot': '📸',
  'recorder': '⏺️',
  'meter': '📊',
  'oscilloscope': '📉',
  'spectrum': '🌈',
  'tuner': '🎯',
  
  // Genre-specific modifiers
  'reggae': '🌴',
  'country': '🤠',
  'jazz': '🎭',
  'electronic': '⚡',
  'classical': '🎩',
  'hiphop': '🎧',
  'rock': '🤘',
  'metal': '🤘',
  'latin': '💃',
  'african': '🌍',
  'asian': '🎎',
  'indian': '🪷',
  'ambient': '🌙',
  'lofi': '📻',
  'trap': '🔥',
  'edm': '💫',
} as const;

/**
 * Get emoji for a card type.
 */
export function getCardEmoji(cardType: string): string {
  const normalized = cardType.toLowerCase().replace(/[_\s]+/g, '-');
  return (CARD_EMOJI_MAP as Record<string, string>)[normalized] ?? '🎵';
}

/**
 * Color palette for card categories.
 */
export const CARD_CATEGORY_COLORS = {
  generators: { primary: '#2196F3', secondary: '#1976D2', glow: '#64B5F6' },
  effects: { primary: '#9C27B0', secondary: '#7B1FA2', glow: '#BA68C8' },
  transforms: { primary: '#4CAF50', secondary: '#388E3C', glow: '#81C784' },
  routing: { primary: '#FF9800', secondary: '#F57C00', glow: '#FFB74D' },
  analysis: { primary: '#00BCD4', secondary: '#0097A7', glow: '#4DD0E1' },
  utilities: { primary: '#607D8B', secondary: '#455A64', glow: '#90A4AE' },
  custom: { primary: '#795548', secondary: '#5D4037', glow: '#A1887F' },
  filters: { primary: '#E91E63', secondary: '#C2185B', glow: '#F06292' },
} as const;

/**
 * Create default visuals for a card.
 */
export function createDefaultCardVisuals(
  cardType: string,
  category: keyof typeof CARD_CATEGORY_COLORS = 'generators'
): CardVisuals {
  const colors = CARD_CATEGORY_COLORS[category];
  return {
    emoji: getCardEmoji(cardType),
    color: colors.primary,
    colorSecondary: colors.secondary,
    gradient: 'linear',
    gradientAngle: 135,
    glow: colors.glow,
    glowIntensity: 0.3,
    badgePosition: 'top-right',
  };
}

// ============================================================================
// CARD BEHAVIOR (Runtime Semantics)
// ============================================================================

/**
 * Card execution mode.
 */
export type CardMode = 'event' | 'audio' | 'hybrid' | 'view';

/**
 * Card CPU intensity level.
 */
export type CpuIntensity = 'light' | 'medium' | 'heavy' | 'extreme';

/**
 * Card thread safety level.
 */
export type ThreadSafety = 'main-only' | 'audio-safe' | 'parallel-safe';

/**
 * Card side effect types.
 */
export type CardSideEffect =
  | 'none'
  | 'audio-output'
  | 'midi-output'
  | 'file-read'
  | 'file-write'
  | 'network'
  | 'clipboard'
  | 'notification';

/**
 * Card latency information.
 */
export interface CardLatency {
  /** Processing latency in samples */
  readonly samples: number;
  /** Latency in milliseconds */
  readonly ms: number;
  /** Required lookahead (samples) */
  readonly lookahead: number;
  /** Whether latency is reported to host for compensation */
  readonly reportedToHost: boolean;
}

/**
 * Card memory footprint.
 */
export interface CardMemory {
  /** Total estimated memory in MB */
  readonly estimatedMB: number;
  /** Sample buffer data in MB */
  readonly sampleBufferMB: number;
  /** Wavetable data in MB */
  readonly wavetablesMB: number;
  /** Internal state in KB */
  readonly stateKB: number;
  /** Whether card allocates at runtime */
  readonly dynamicAllocation: boolean;
}

/**
 * Card runtime behavior metadata.
 */
export interface CardBehavior {
  /** Execution mode */
  readonly mode: CardMode;
  /** Whether card is pure (no side effects) */
  readonly pure: boolean;
  /** Whether card has internal state */
  readonly stateful: boolean;
  /** Whether output is stochastic (random) */
  readonly stochastic: boolean;
  /** Whether must run in audio thread */
  readonly realtime: boolean;
  /** Whether output can be cached */
  readonly cacheable: boolean;
  /** Latency information */
  readonly latency: CardLatency;
  /** CPU intensity */
  readonly cpuIntensity: CpuIntensity;
  /** Memory footprint */
  readonly memoryFootprint: CardMemory;
  /** Side effects */
  readonly sideEffects: readonly CardSideEffect[];
  /** Thread safety level */
  readonly threadSafety: ThreadSafety;
  /** Whether card can be hot-reloaded */
  readonly hotReloadable: boolean;
  /** Whether state can be serialized */
  readonly stateSerializable: boolean;
}

/**
 * Create default latency info.
 */
export function createDefaultLatency(samples: number = 0): CardLatency {
  return {
    samples,
    ms: samples / 44100 * 1000,
    lookahead: 0,
    reportedToHost: samples > 0,
  };
}

/**
 * Create default memory footprint.
 */
export function createDefaultMemory(estimatedMB: number = 1): CardMemory {
  return {
    estimatedMB,
    sampleBufferMB: 0,
    wavetablesMB: 0,
    stateKB: 10,
    dynamicAllocation: false,
  };
}

/**
 * Create default behavior for an event-mode card.
 */
export function createEventCardBehavior(): CardBehavior {
  return {
    mode: 'event',
    pure: true,
    stateful: false,
    stochastic: false,
    realtime: false,
    cacheable: true,
    latency: createDefaultLatency(0),
    cpuIntensity: 'light',
    memoryFootprint: createDefaultMemory(0.1),
    sideEffects: ['none'],
    threadSafety: 'parallel-safe',
    hotReloadable: true,
    stateSerializable: true,
  };
}

/**
 * Create default behavior for an audio-mode card.
 */
export function createAudioCardBehavior(
  latencySamples: number = 128,
  memoryMB: number = 5
): CardBehavior {
  return {
    mode: 'audio',
    pure: false,
    stateful: true,
    stochastic: false,
    realtime: true,
    cacheable: false,
    latency: createDefaultLatency(latencySamples),
    cpuIntensity: 'medium',
    memoryFootprint: createDefaultMemory(memoryMB),
    sideEffects: ['audio-output'],
    threadSafety: 'audio-safe',
    hotReloadable: false,
    stateSerializable: true,
  };
}

/**
 * Create behavior for a generator/instrument card.
 */
export function createInstrumentBehavior(
  sampleMemoryMB: number = 50
): CardBehavior {
  return {
    mode: 'hybrid',
    pure: false,
    stateful: true,
    stochastic: false,
    realtime: true,
    cacheable: false,
    latency: createDefaultLatency(64),
    cpuIntensity: 'medium',
    memoryFootprint: {
      estimatedMB: sampleMemoryMB + 5,
      sampleBufferMB: sampleMemoryMB,
      wavetablesMB: 0,
      stateKB: 100,
      dynamicAllocation: true,
    },
    sideEffects: ['audio-output', 'midi-output'],
    threadSafety: 'audio-safe',
    hotReloadable: false,
    stateSerializable: true,
  };
}

// ============================================================================
// CARD UI CONFIGURATION
// ============================================================================

/**
 * Card editor type.
 */
export type CardEditorType =
  | 'knobs'
  | 'grid'
  | 'graph'
  | 'notation'
  | 'waveform'
  | 'keyboard'
  | 'pads'
  | 'mixer'
  | 'custom';

/**
 * Card view mode.
 */
export type CardViewMode = 'compact' | 'standard' | 'expanded' | 'fullscreen';

/**
 * Card control type.
 */
export type CardControlType =
  | 'knob'
  | 'slider'
  | 'button'
  | 'toggle'
  | 'dropdown'
  | 'xy-pad'
  | 'meter'
  | 'waveform'
  | 'keyboard'
  | 'pads'
  | 'grid'
  | 'label'
  | 'group'
  | 'divider'
  | 'led'
  | 'scope'
  | 'spectrum'
  | 'graph'
  | 'piano-roll';

/**
 * Control size.
 */
export type ControlSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Control style definition.
 */
export interface CardControlStyle {
  /** Control size */
  readonly size: ControlSize;
  /** Style variant name */
  readonly variant: string;
  /** Override color */
  readonly color?: string;
  /** Accent color for active state */
  readonly accentColor?: string;
  /** Track/background color */
  readonly trackColor?: string;
  /** Label position */
  readonly labelPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  /** CSS class names */
  readonly className?: string;
}

/**
 * Context menu item.
 */
export interface CardContextMenuItem {
  /** Menu item ID */
  readonly id: string;
  /** Display label */
  readonly label: string;
  /** Keyboard shortcut */
  readonly shortcut?: string;
  /** Icon emoji */
  readonly icon?: string;
  /** Handler action name */
  readonly action: string;
  /** Is separator */
  readonly separator?: boolean;
  /** Submenu items */
  readonly submenu?: readonly CardContextMenuItem[];
}

/**
 * Control definition.
 */
export interface CardControl {
  /** Control ID */
  readonly id: string;
  /** Control type */
  readonly type: CardControlType;
  /** Bound parameter ID */
  readonly paramId?: string;
  /** Style configuration */
  readonly style: CardControlStyle;
  /** Display label */
  readonly label?: string;
  /** Tooltip text */
  readonly tooltip?: string;
  /** Context menu items */
  readonly contextMenu?: readonly CardContextMenuItem[];
  /** Grid position (row) */
  readonly row?: number;
  /** Grid position (column) */
  readonly col?: number;
  /** Grid span (columns) */
  readonly colSpan?: number;
  /** Grid span (rows) */
  readonly rowSpan?: number;
  /** Whether control is hidden */
  readonly hidden?: boolean;
  /** Whether control is disabled */
  readonly disabled?: boolean;
}

/**
 * Control layout type.
 */
export type LayoutType = 'grid' | 'flex' | 'absolute';

/**
 * Control layout configuration.
 */
export interface CardControlLayout {
  /** Layout type */
  readonly type: LayoutType;
  /** Grid columns */
  readonly columns?: number;
  /** Grid rows */
  readonly rows?: number;
  /** Gap between items */
  readonly gap?: string;
  /** Padding */
  readonly padding?: string;
  /** Justify content (flex) */
  readonly justifyContent?: string;
  /** Align items (flex) */
  readonly alignItems?: string;
}

/**
 * Panel position.
 */
export type PanelPosition = 'main' | 'sidebar' | 'footer' | 'header' | 'overlay' | 'drawer';

/**
 * Panel definition.
 */
export interface CardPanel {
  /** Panel ID */
  readonly id: string;
  /** Display label */
  readonly label: string;
  /** Position in card */
  readonly position: PanelPosition;
  /** Controls in this panel */
  readonly controls: readonly CardControl[];
  /** Layout configuration */
  readonly layout: CardControlLayout;
  /** Whether panel is collapsible */
  readonly collapsible: boolean;
  /** Default collapsed state */
  readonly defaultCollapsed: boolean;
  /** Panel icon (emoji) */
  readonly icon?: string;
  /** Panel background color */
  readonly backgroundColor?: string;
}

/**
 * Card theme definition.
 */
export interface CardTheme {
  /** Theme name */
  readonly name: string;
  /** Background color */
  readonly background: string;
  /** Foreground/text color */
  readonly foreground: string;
  /** Accent color */
  readonly accent: string;
  /** Border color */
  readonly border: string;
  /** Box shadow */
  readonly shadow: string;
  /** Font family */
  readonly fontFamily: string;
  /** Base font size */
  readonly fontSize: string;
  /** Border radius */
  readonly borderRadius: string;
}

/**
 * Complete UI configuration.
 */
export interface CardUIConfig {
  /** Panel definitions */
  readonly panels: readonly CardPanel[];
  /** Primary editor type */
  readonly editorType: CardEditorType;
  /** Default view mode */
  readonly defaultView: CardViewMode;
  /** Whether card is resizable */
  readonly resizable: boolean;
  /** Minimum width */
  readonly minWidth: number;
  /** Minimum height */
  readonly minHeight: number;
  /** Maximum width */
  readonly maxWidth?: number;
  /** Maximum height */
  readonly maxHeight?: number;
  /** Theme configuration */
  readonly theme: CardTheme;
  /** Keyboard shortcuts */
  readonly shortcuts?: Record<string, string>;
}

/**
 * Default dark theme.
 */
export const DEFAULT_DARK_THEME: CardTheme = {
  name: 'dark',
  background: '#1e1e1e',
  foreground: '#ffffff',
  accent: '#2196F3',
  border: '#333333',
  shadow: '0 4px 12px rgba(0,0,0,0.3)',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: '12px',
  borderRadius: '8px',
};

/**
 * Default light theme.
 */
export const DEFAULT_LIGHT_THEME: CardTheme = {
  name: 'light',
  background: '#ffffff',
  foreground: '#1e1e1e',
  accent: '#1976D2',
  border: '#e0e0e0',
  shadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: '12px',
  borderRadius: '8px',
};

/**
 * Create a knob control.
 */
export function createKnobControl(
  id: string,
  paramId: string,
  label: string,
  options: Partial<CardControl> = {}
): CardControl {
  return {
    id,
    type: 'knob',
    paramId,
    label,
    style: {
      size: 'md',
      variant: 'default',
      labelPosition: 'bottom',
    },
    ...options,
  };
}

/**
 * Create a slider control.
 */
export function createSliderControl(
  id: string,
  paramId: string,
  label: string,
  options: Partial<CardControl> = {}
): CardControl {
  return {
    id,
    type: 'slider',
    paramId,
    label,
    style: {
      size: 'md',
      variant: 'horizontal',
      labelPosition: 'left',
    },
    ...options,
  };
}

/**
 * Create a toggle control.
 */
export function createToggleControl(
  id: string,
  paramId: string,
  label: string,
  options: Partial<CardControl> = {}
): CardControl {
  return {
    id,
    type: 'toggle',
    paramId,
    label,
    style: {
      size: 'sm',
      variant: 'switch',
      labelPosition: 'right',
    },
    ...options,
  };
}

/**
 * Create a button control.
 */
export function createButtonControl(
  id: string,
  label: string,
  options: Partial<CardControl> = {}
): CardControl {
  return {
    id,
    type: 'button',
    label,
    style: {
      size: 'md',
      variant: 'primary',
      labelPosition: 'none',
    },
    ...options,
  };
}

/**
 * Create a dropdown control.
 */
export function createDropdownControl(
  id: string,
  paramId: string,
  label: string,
  options: Partial<CardControl> = {}
): CardControl {
  return {
    id,
    type: 'dropdown',
    paramId,
    label,
    style: {
      size: 'md',
      variant: 'default',
      labelPosition: 'top',
    },
    ...options,
  };
}

/**
 * Create a panel.
 */
export function createPanel(
  id: string,
  label: string,
  position: PanelPosition,
  controls: readonly CardControl[],
  layout: Partial<CardControlLayout> = {}
): CardPanel {
  return {
    id,
    label,
    position,
    controls,
    layout: {
      type: 'grid',
      columns: 4,
      gap: '8px',
      padding: '12px',
      ...layout,
    },
    collapsible: position !== 'main',
    defaultCollapsed: false,
  };
}

/**
 * Create default UI config.
 */
export function createDefaultUIConfig(
  editorType: CardEditorType = 'knobs',
  panels: readonly CardPanel[] = []
): CardUIConfig {
  return {
    panels,
    editorType,
    defaultView: 'standard',
    resizable: true,
    minWidth: 200,
    minHeight: 150,
    theme: DEFAULT_DARK_THEME,
  };
}

// ============================================================================
// CSS GENERATION
// ============================================================================

/**
 * Generate CSS for a card.
 */
export function generateCardCSS(
  cardId: string,
  visuals: CardVisuals,
  theme: CardTheme
): string {
  const gradientBg = visuals.gradient
    ? `${visuals.gradient}-gradient(${visuals.gradientAngle || 135}deg, ${visuals.color}, ${visuals.colorSecondary || visuals.color})`
    : visuals.color;

  return `
.card-${cardId} {
  --card-primary: ${visuals.color};
  --card-secondary: ${visuals.colorSecondary || visuals.color};
  --card-glow: ${visuals.glow || 'transparent'};
  --card-glow-intensity: ${visuals.glowIntensity || 0};
  --card-bg: ${theme.background};
  --card-fg: ${theme.foreground};
  --card-accent: ${theme.accent};
  --card-border: ${theme.border};
  
  background: ${gradientBg};
  border: 1px solid var(--card-border);
  border-radius: ${theme.borderRadius};
  box-shadow: ${theme.shadow}, 0 0 calc(20px * var(--card-glow-intensity)) var(--card-glow);
  font-family: ${theme.fontFamily};
  font-size: ${theme.fontSize};
  color: var(--card-fg);
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
}

.card-${cardId}:hover {
  transform: translateY(-1px);
  box-shadow: ${theme.shadow}, 0 0 calc(25px * var(--card-glow-intensity)) var(--card-glow);
}

.card-${cardId}.active {
  --card-glow-intensity: 1;
}

.card-${cardId}.bypassed {
  opacity: 0.5;
  filter: grayscale(0.8);
}

.card-${cardId}.soloed {
  --card-glow: gold;
  --card-glow-intensity: 0.8;
}

.card-${cardId}.muted {
  opacity: 0.3;
}

.card-${cardId}.recording {
  --card-glow: #f44336;
  animation: recording-pulse 1s ease-in-out infinite;
}

.card-${cardId}.modulated {
  --card-glow: orange;
  animation: modulation-pulse 1s ease-in-out infinite;
}

.card-${cardId} .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid var(--card-border);
}

.card-${cardId} .card-emoji {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 4px var(--card-glow));
}

.card-${cardId} .card-title {
  font-weight: 600;
  font-size: 0.875rem;
  flex: 1;
}

.card-${cardId} .card-body {
  padding: 12px;
}

.card-${cardId} .card-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.1);
  border-top: 1px solid var(--card-border);
}

@keyframes recording-pulse {
  0%, 100% { box-shadow: 0 0 10px #f44336; }
  50% { box-shadow: 0 0 25px #f44336; }
}

@keyframes modulation-pulse {
  0%, 100% { box-shadow: 0 0 10px orange; }
  50% { box-shadow: 0 0 25px orange; }
}

${visuals.animation ? `
@keyframes ${visuals.animation.name} {
  ${visuals.animation.keyframes}
}

.card-${cardId}.animated {
  animation: ${visuals.animation.name} ${visuals.animation.duration} ${visuals.animation.timing} ${visuals.animation.iterationCount};
}
` : ''}
`;
}

/**
 * Generate mini card view HTML.
 */
export function renderMiniCard(
  cardId: string,
  name: string,
  visuals: CardVisuals
): string {
  return `
<div class="mini-card card-${cardId}" style="
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, ${visuals.color}, ${visuals.colorSecondary || visuals.color});
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.1s;
">
  <span class="card-emoji" style="font-size: 1.5rem;">${visuals.emoji}</span>
  <span class="card-name" style="font-size: 0.625rem; margin-top: 4px; opacity: 0.8;">${name}</span>
</div>
`;
}

/**
 * Generate ASCII representation of a card (for terminal/logging).
 */
export function renderAsciiCard(
  name: string,
  visuals: CardVisuals,
  width: number = 30
): string {
  const emoji = visuals.emoji;
  const border = '─'.repeat(width - 2);
  const title = ` ${emoji} ${name} `.padEnd(width - 2).slice(0, width - 2);
  
  return `
┌${border}┐
│${title}│
└${border}┘
`.trim();
}

// ============================================================================
// COMPLETE CARD DEFINITION
// ============================================================================

/**
 * Complete card definition with all metadata.
 */
export interface CardDefinition {
  /** Card metadata */
  readonly meta: {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    readonly description: string;
    readonly version: string;
    readonly author: string;
    readonly tags: readonly string[];
  };
  /** Visual identity */
  readonly visuals: CardVisuals;
  /** Runtime behavior */
  readonly behavior: CardBehavior;
  /** UI configuration */
  readonly ui: CardUIConfig;
  /** Port definitions */
  readonly ports: {
    readonly inputs: readonly PortDefinition[];
    readonly outputs: readonly PortDefinition[];
  };
  /** Parameter definitions */
  readonly parameters: readonly ParameterDefinition[];
  /** Factory presets */
  readonly presets: readonly PresetDefinition[];
}

/**
 * Port types for card I/O.
 * 
 * Signal types:
 * - audio: Audio signal (mono or stereo channel)
 * - control: Control signals (CV-like continuous values, LFO, envelope)
 * - trigger: Single trigger/gate signals
 * 
 * Event stream types (schedulable events with payload):
 * - Event<Note>: Note events with pitch, velocity, duration
 * - Event<CC>: Control change events
 * - Event<any>: Generic typed event stream
 * 
 * External protocol (for hardware I/O only):
 * - midi: Raw MIDI protocol data
 * 
 * The event stream types allow cards to output/input typed schedulables
 * that are independent of any specific protocol.
 * 
 * Change 203: Renamed from PortType to VisualPortType to avoid conflict with canonical PortType.
 */
export type VisualPortType = 
  | 'audio' 
  | 'control' 
  | 'trigger'
  | 'Event<Note>'      // Note on/off with pitch, velocity, channel, duration
  | 'Event<CC>'        // Control change events
  | 'Event<PitchBend>' // Pitch bend events
  | 'Event<Pressure>'  // Aftertouch/pressure
  | 'Event<Program>'   // Program change
  | 'Event<Clock>'     // Transport/clock events
  | 'Event<any>'       // Generic typed event stream
  | 'midi';            // Raw MIDI (external hardware only)

/**
 * Port definition.
 */
export interface PortDefinition {
  readonly name: string;
  readonly type: VisualPortType;
  readonly label?: string;
  readonly description?: string;
  readonly optional?: boolean;
}

/**
 * Parameter definition (for card templates).
 */
export interface ParameterDefinition {
  readonly id: string;
  readonly type: 'float' | 'int' | 'enum' | 'string' | 'bool';
  readonly label: string;
  readonly default: number | string | boolean;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly string[];
  readonly unit?: string;
  readonly group?: string;
  readonly automatable?: boolean;
  readonly modulatable?: boolean;
}

/**
 * Preset definition.
 */
export interface PresetDefinition {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly params: Record<string, number | string | boolean>;
}

/**
 * Build a complete card definition from a template.
 */
export function buildCardDefinition(
  meta: CardDefinition['meta'],
  options: {
    visuals?: Partial<CardVisuals>;
    behavior?: Partial<CardBehavior>;
    ui?: Partial<CardUIConfig>;
    ports?: CardDefinition['ports'];
    parameters?: readonly ParameterDefinition[];
    presets?: readonly PresetDefinition[];
  } = {}
): CardDefinition {
  const categoryColors = CARD_CATEGORY_COLORS[meta.category as keyof typeof CARD_CATEGORY_COLORS] 
    || CARD_CATEGORY_COLORS.generators;
  
  return {
    meta,
    visuals: {
      emoji: getCardEmoji(meta.id),
      color: categoryColors.primary,
      colorSecondary: categoryColors.secondary,
      gradient: 'linear',
      glow: categoryColors.glow,
      glowIntensity: 0.3,
      ...options.visuals,
    },
    behavior: {
      mode: 'event',
      pure: true,
      stateful: false,
      stochastic: false,
      realtime: false,
      cacheable: true,
      latency: createDefaultLatency(0),
      cpuIntensity: 'light',
      memoryFootprint: createDefaultMemory(0.1),
      sideEffects: ['none'],
      threadSafety: 'parallel-safe',
      hotReloadable: true,
      stateSerializable: true,
      ...options.behavior,
    },
    ui: {
      panels: [],
      editorType: 'knobs',
      defaultView: 'standard',
      resizable: true,
      minWidth: 200,
      minHeight: 150,
      theme: DEFAULT_DARK_THEME,
      ...options.ui,
    },
    ports: options.ports ?? { inputs: [], outputs: [] },
    parameters: options.parameters ?? [],
    presets: options.presets ?? [],
  };
}

// ============================================================================
// USER-INJECTABLE CARD SYSTEM
// ============================================================================

/**
 * Minimal card template for user/LLM card creation.
 * This is the simplest schema a user can provide to create a working card.
 */
export interface UserCardTemplate {
  /** Card identifier (kebab-case) */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Card category */
  readonly category?: 'generators' | 'effects' | 'transforms' | 'routing' | 'utilities';
  /** Description */
  readonly description?: string;
  /** Tags for searchability */
  readonly tags?: readonly string[];
  /** Primary emoji icon */
  readonly emoji?: string;
  /** Primary color (hex) */
  readonly color?: string;
  /** Parameters (simplified) */
  readonly params?: readonly UserParameterTemplate[];
  /** Presets (simplified) */
  readonly presets?: readonly UserPresetTemplate[];
  /** Base card to inherit from */
  readonly extendsCard?: string;
}

/**
 * Simplified parameter template for user cards.
 */
export interface UserParameterTemplate {
  readonly id: string;
  readonly label: string;
  readonly type: 'number' | 'bool' | 'choice';
  readonly default?: number | string | boolean;
  readonly min?: number;
  readonly max?: number;
  readonly choices?: readonly string[];
  readonly unit?: string;
}

/**
 * Simplified preset template for user cards.
 */
export interface UserPresetTemplate {
  readonly name: string;
  readonly params: Record<string, number | string | boolean>;
}

/**
 * Validation result for user cards.
 */
export interface CardValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validate a user card template.
 */
export function validateUserCardTemplate(template: UserCardTemplate): CardValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!template.id) errors.push('Card id is required');
  if (!template.name) errors.push('Card name is required');
  
  // ID format
  if (template.id && !/^[a-z][a-z0-9-]*$/.test(template.id)) {
    errors.push('Card id must be kebab-case (lowercase letters, numbers, hyphens)');
  }
  
  // Color format
  if (template.color && !/^#[0-9A-Fa-f]{6}$/.test(template.color)) {
    errors.push('Color must be a 6-digit hex code (e.g., #FF5500)');
  }
  
  // Validate parameters
  if (template.params) {
    const paramIds = new Set<string>();
    for (const param of template.params) {
      if (!param.id) errors.push('Parameter id is required');
      if (!param.label) errors.push(`Parameter ${param.id} needs a label`);
      if (paramIds.has(param.id)) errors.push(`Duplicate parameter id: ${param.id}`);
      paramIds.add(param.id);
      
      if (param.type === 'number') {
        if (param.min !== undefined && param.max !== undefined && param.min > param.max) {
          errors.push(`Parameter ${param.id}: min cannot be greater than max`);
        }
      }
      if (param.type === 'choice' && (!param.choices || param.choices.length === 0)) {
        errors.push(`Parameter ${param.id}: choice type requires choices array`);
      }
    }
  }
  
  // Validate presets
  if (template.presets) {
    const presetNames = new Set<string>();
    for (const preset of template.presets) {
      if (!preset.name) errors.push('Preset name is required');
      if (presetNames.has(preset.name)) warnings.push(`Duplicate preset name: ${preset.name}`);
      presetNames.add(preset.name);
      
      // Check preset params reference valid parameters
      if (template.params) {
        const validParamIds = new Set(template.params.map(p => p.id));
        for (const paramId of Object.keys(preset.params)) {
          if (!validParamIds.has(paramId)) {
            warnings.push(`Preset "${preset.name}" references unknown parameter: ${paramId}`);
          }
        }
      }
    }
  }
  
  // Warnings for missing optional fields
  if (!template.description) warnings.push('Description is recommended');
  if (!template.emoji) warnings.push('Emoji will be auto-assigned based on category');
  if (!template.presets || template.presets.length === 0) warnings.push('No presets defined');
  if (!template.params || template.params.length === 0) warnings.push('No parameters defined');
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Convert user parameter template to full ParameterDefinition.
 */
function userParamToDefinition(param: UserParameterTemplate): ParameterDefinition {
  const type = param.type === 'number' 
    ? (param.min !== undefined && param.max !== undefined && Number.isInteger(param.min) && Number.isInteger(param.max) && (param.max - param.min) < 200 ? 'int' : 'float')
    : param.type === 'bool' ? 'bool' 
    : 'enum';
    
  return {
    id: param.id,
    type,
    label: param.label,
    default: param.default ?? (type === 'bool' ? false : type === 'enum' ? param.choices?.[0] ?? '' : param.min ?? 0),
    automatable: type !== 'enum',
    modulatable: type === 'float',
    ...(param.min !== undefined && { min: param.min }),
    ...(param.max !== undefined && { max: param.max }),
    ...(param.choices !== undefined && { options: param.choices }),
    ...(param.unit !== undefined && { unit: param.unit }),
  } as ParameterDefinition;
}

/**
 * Convert user preset template to full PresetDefinition.
 */
function userPresetToDefinition(preset: UserPresetTemplate, _index: number): PresetDefinition {
  return {
    id: preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: preset.name,
    category: 'User',
    params: preset.params,
  };
}

/**
 * Build a full CardDefinition from a user template.
 * This is the main entry point for user-defined cards.
 */
export function buildCardFromUserTemplate(template: UserCardTemplate): CardDefinition {
  const validation = validateUserCardTemplate(template);
  if (!validation.valid) {
    throw new Error(`Invalid card template: ${validation.errors.join(', ')}`);
  }
  
  const category = template.category ?? 'generators';
  const categoryColors = CARD_CATEGORY_COLORS[category] ?? CARD_CATEGORY_COLORS.custom;
  
  const parameters = template.params?.map(userParamToDefinition) ?? [];
  const presets = template.presets?.map(userPresetToDefinition) ?? [];
  
  return {
    meta: {
      id: template.id,
      name: template.name,
      category,
      description: template.description ?? `User-defined ${template.name} card`,
      version: '1.0.0',
      author: 'User',
      tags: template.tags ?? [category],
    },
    visuals: {
      emoji: template.emoji ?? getCardEmoji(template.id),
      color: template.color ?? categoryColors.primary,
      colorSecondary: categoryColors.secondary,
      gradient: 'linear',
      gradientAngle: 135,
      glow: categoryColors.glow,
      glowIntensity: 0.3,
    },
    behavior: {
      mode: category === 'generators' ? 'hybrid' : 'event',
      pure: true,
      stateful: false,
      stochastic: false,
      realtime: category === 'generators',
      cacheable: category !== 'generators',
      latency: createDefaultLatency(0),
      cpuIntensity: 'light',
      memoryFootprint: createDefaultMemory(1),
      sideEffects: category === 'generators' ? ['audio-output'] : ['none'],
      threadSafety: 'parallel-safe',
      hotReloadable: true,
      stateSerializable: true,
    },
    ui: createDefaultUIConfig('knobs', [
      createPanel('main', 'Parameters', 'main', 
        parameters.map((p) => createKnobControl(`ctrl-${p.id}`, p.id, p.label))
      ),
    ]),
    ports: {
      inputs: category === 'generators' 
        ? [{ name: 'notes', type: 'Event<Note>' as const, label: 'Notes In' }]
        : [{ name: 'input', type: 'audio' as const, label: 'Input' }],
      outputs: category === 'generators' || category === 'effects'
        ? [
            { name: 'audio-l', type: 'audio' as const, label: 'Audio L' },
            { name: 'audio-r', type: 'audio' as const, label: 'Audio R' },
          ]
        : [{ name: 'output', type: 'Event<any>' as const, label: 'Output' }],
    },
    parameters,
    presets,
  };
}

/**
 * Clone a card definition with overrides.
 */
export function cloneCardWithOverrides(
  source: CardDefinition,
  overrides: {
    id: string;
    name?: string;
    visuals?: Partial<CardVisuals>;
    parameters?: readonly ParameterDefinition[];
    presets?: readonly PresetDefinition[];
  }
): CardDefinition {
  return {
    ...source,
    meta: {
      ...source.meta,
      id: overrides.id,
      name: overrides.name ?? `${source.meta.name} (Clone)`,
      version: '1.0.0',
      author: 'User',
    },
    visuals: { ...source.visuals, ...overrides.visuals },
    parameters: overrides.parameters ?? source.parameters,
    presets: overrides.presets ?? source.presets,
  };
}

// ============================================================================
// CURRIED PRESET SYSTEM
// ============================================================================

/**
 * Curried preset - a partial preset that can be combined with others.
 */
export interface CurriedPreset {
  /** Unique ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Description of what this curry does */
  readonly description?: string;
  /** Locked parameters (cannot be overridden) */
  readonly lockedParams: Record<string, number | string | boolean>;
  /** Default parameters (can be overridden) */
  readonly defaultParams: Record<string, number | string | boolean>;
  /** Parameters to randomize */
  readonly randomizableParams?: readonly string[];
  /** Randomization ranges */
  readonly randomRanges?: Record<string, { min: number; max: number }>;
  /** Parent preset ID for inheritance */
  readonly parentPresetId?: string;
  /** Category for organization */
  readonly category?: string;
  /** Tags */
  readonly tags?: readonly string[];
}

/**
 * Preset scene - groups multiple card presets together.
 */
export interface PresetScene {
  /** Scene ID */
  readonly id: string;
  /** Scene name */
  readonly name: string;
  /** Description */
  readonly description?: string;
  /** Preset assignments by card ID */
  readonly cardPresets: Record<string, string>; // cardId -> presetId
  /** Category */
  readonly category?: string;
  /** Tags */
  readonly tags?: readonly string[];
}

/**
 * Curry a preset with locked parameters.
 * Returns a function that creates new presets with those params locked.
 */
export function curryPreset(
  basePreset: PresetDefinition,
  lockedParams: Record<string, number | string | boolean>
): (overrides?: Record<string, number | string | boolean>) => PresetDefinition {
  return (overrides = {}) => ({
    ...basePreset,
    id: `${basePreset.id}-curried`,
    name: `${basePreset.name} (Curried)`,
    params: {
      ...basePreset.params,
      ...overrides,
      ...lockedParams, // Locked params always win
    },
  });
}

/**
 * Compose multiple presets together.
 * Later presets override earlier ones.
 */
export function composePresets(
  presets: readonly PresetDefinition[],
  name: string
): PresetDefinition {
  if (presets.length === 0) {
    throw new Error('Cannot compose empty preset array');
  }
  
  const combined = presets.reduce<Record<string, number | string | boolean>>(
    (acc, preset) => ({ ...acc, ...preset.params }),
    {}
  );
  
  return {
    id: `composed-${presets.map(p => p.id).join('-')}`,
    name,
    category: 'Composed',
    tags: Array.from(new Set(presets.flatMap(p => p.tags ?? []))),
    params: combined,
  };
}

/**
 * Create a curried preset.
 */
export function createCurriedPreset(
  id: string,
  name: string,
  lockedParams: Record<string, number | string | boolean>,
  options: Partial<CurriedPreset> = {}
): CurriedPreset {
  return {
    id,
    name,
    lockedParams,
    defaultParams: {},
    ...options,
  };
}

/**
 * Apply a curried preset to a base preset.
 */
export function applyCurriedPreset(
  curried: CurriedPreset,
  base: PresetDefinition
): PresetDefinition {
  return {
    ...base,
    id: `${base.id}-with-${curried.id}`,
    name: `${base.name} + ${curried.name}`,
    params: {
      ...base.params,
      ...curried.defaultParams,
      ...curried.lockedParams,
    },
  };
}

/**
 * Morph between two presets.
 * @param from Starting preset
 * @param to Target preset
 * @param t Interpolation factor (0-1)
 * @returns Interpolated preset
 */
export function morphPresets(
  from: PresetDefinition,
  to: PresetDefinition,
  t: number
): PresetDefinition {
  const clampedT = Math.max(0, Math.min(1, t));
  const params: Record<string, number | string | boolean> = { ...from.params };
  
  for (const [key, toValue] of Object.entries(to.params)) {
    const fromValue = from.params[key];
    
    if (typeof toValue === 'number' && typeof fromValue === 'number') {
      // Interpolate numeric values
      params[key] = fromValue + (toValue - fromValue) * clampedT;
    } else if (clampedT >= 0.5) {
      // Snap non-numeric values at midpoint
      params[key] = toValue;
    }
  }
  
  return {
    id: `morph-${from.id}-${to.id}-${Math.round(t * 100)}`,
    name: `${from.name} → ${to.name} (${Math.round(t * 100)}%)`,
    category: 'Morphed',
    params,
  };
}

/**
 * Randomize preset parameters within ranges.
 */
export function randomizePreset(
  preset: PresetDefinition,
  randomizableParams: readonly string[],
  ranges: Record<string, { min: number; max: number }>,
  seed?: number
): PresetDefinition {
  // Simple seeded random for reproducibility
  const seededRandom = seed !== undefined
    ? () => {
        seed = (seed! * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      }
    : Math.random;

  const params = { ...preset.params };
  
  for (const paramId of randomizableParams) {
    const range = ranges[paramId];
    if (range && typeof params[paramId] === 'number') {
      params[paramId] = range.min + seededRandom() * (range.max - range.min);
    }
  }
  
  return {
    ...preset,
    id: `${preset.id}-random-${seed ?? Date.now()}`,
    name: `${preset.name} (Randomized)`,
    category: 'Randomized',
    params,
  };
}

/**
 * Mutate a preset with small random changes.
 */
export function mutatePreset(
  preset: PresetDefinition,
  mutationAmount: number = 0.1,
  seed?: number
): PresetDefinition {
  const seededRandom = seed !== undefined
    ? () => {
        seed = (seed! * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      }
    : Math.random;

  const params = { ...preset.params };
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'number') {
      // Random mutation within ±mutationAmount range
      const mutation = (seededRandom() - 0.5) * 2 * mutationAmount;
      params[key] = value * (1 + mutation);
    }
  }
  
  return {
    ...preset,
    id: `${preset.id}-mutated-${seed ?? Date.now()}`,
    name: `${preset.name} (Mutated)`,
    category: 'Mutated',
    params,
  };
}

/**
 * Create a preset scene.
 */
export function createPresetScene(
  id: string,
  name: string,
  cardPresets: Record<string, string>,
  options: Partial<PresetScene> = {}
): PresetScene {
  return {
    id,
    name,
    cardPresets,
    ...options,
  };
}

// ============================================================================
// SVG / CANVAS GENERATION
// ============================================================================

/**
 * Generate an SVG icon for a card type.
 */
export function cardToSVG(
  cardType: string,
  visuals: CardVisuals,
  size: number = 48
): string {
  const emoji = visuals.emoji;
  const halfSize = size / 2;
  
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad-${cardType}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${visuals.color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${visuals.colorSecondary || visuals.color};stop-opacity:1" />
    </linearGradient>
    <filter id="glow-${cardType}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="8" ry="8" 
        fill="url(#grad-${cardType})" filter="url(#glow-${cardType})"/>
  <text x="${halfSize}" y="${halfSize + 6}" text-anchor="middle" font-size="${size * 0.5}px">
    ${emoji}
  </text>
</svg>
`.trim();
}

/**
 * Render card preview to HTML5 canvas.
 * Returns the drawing function to call with a canvas context.
 */
export function createCardCanvasRenderer(
  _cardType: string,
  visuals: CardVisuals
): (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => void {
  return (ctx, x, y, width, height) => {
    // Background gradient
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, visuals.color);
    gradient.addColorStop(1, visuals.colorSecondary || visuals.color);
    
    // Draw rounded rect
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Glow effect
    if (visuals.glow && visuals.glowIntensity) {
      ctx.shadowColor = visuals.glow;
      ctx.shadowBlur = 10 * visuals.glowIntensity;
    }
    
    // Draw emoji
    ctx.font = `${Math.min(width, height) * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(visuals.emoji, x + width / 2, y + height / 2);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };
}

/**
 * Connection types and their visual styles.
 */
export const CONNECTION_STYLES: Record<VisualPortType, { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' }> = {
  'audio': { color: '#4CAF50', width: 3, style: 'solid' },
  'Event<Note>': { color: '#2196F3', width: 2, style: 'solid' },
  'Event<CC>': { color: '#9C27B0', width: 2, style: 'solid' },
  'Event<PitchBend>': { color: '#9C27B0', width: 2, style: 'solid' },
  'Event<Pressure>': { color: '#9C27B0', width: 2, style: 'solid' },
  'Event<Program>': { color: '#9C27B0', width: 2, style: 'solid' },
  'Event<Clock>': { color: '#FF9800', width: 2, style: 'dashed' },
  'Event<any>': { color: '#607D8B', width: 2, style: 'solid' },
  'control': { color: '#FF9800', width: 1.5, style: 'dotted' },
  'trigger': { color: '#F44336', width: 1.5, style: 'dashed' },
  'midi': { color: '#795548', width: 2, style: 'solid' },
};

/**
 * Generate CSS for connection cables.
 */
export function generateConnectionCSS(): string {
  let css = '';
  for (const [type, style] of Object.entries(CONNECTION_STYLES)) {
    const className = type.replace(/[<>]/g, '-').toLowerCase();
    css += `
.connection-${className} {
  stroke: ${style.color};
  stroke-width: ${style.width}px;
  stroke-dasharray: ${style.style === 'dashed' ? '8,4' : style.style === 'dotted' ? '2,2' : 'none'};
  fill: none;
  transition: stroke-width 0.2s;
}
.connection-${className}:hover {
  stroke-width: ${style.width + 1}px;
}
`;
  }
  return css;
}

// ============================================================================
// CARD RESOURCE CLEANUP (5.0.5.2)
// ============================================================================

/**
 * Resource type that a card can hold.
 */
export type CardResourceType = 
  | 'audio-buffer'
  | 'wavetable'
  | 'sample-data'
  | 'web-audio-node'
  | 'worker'
  | 'websocket'
  | 'animation-frame'
  | 'timer'
  | 'event-listener'
  | 'midi-port'
  | 'file-handle';

/**
 * Tracked resource for cleanup.
 */
export interface TrackedResource {
  /** Unique resource ID */
  readonly id: string;
  /** Resource type */
  readonly type: CardResourceType;
  /** Human-readable description */
  readonly description?: string;
  /** Cleanup function */
  readonly cleanup: () => void | Promise<void>;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Whether cleanup has been called */
  disposed: boolean;
}

/**
 * Card resource cleanup manager.
 * Tracks all resources allocated by a card and ensures proper cleanup.
 */
export interface CardResourceCleanup {
  /** Card ID this manager belongs to */
  readonly cardId: string;
  /** All tracked resources */
  readonly resources: Map<string, TrackedResource>;
  /** Whether the card has been disposed */
  disposed: boolean;
  
  /** Track a new resource */
  track<T>(type: CardResourceType, resource: T, cleanup: (r: T) => void | Promise<void>, description?: string): string;
  /** Untrack and cleanup a specific resource */
  release(resourceId: string): Promise<void>;
  /** Cleanup all resources */
  disposeAll(): Promise<void>;
  /** Get resource count by type */
  getResourceCount(type?: CardResourceType): number;
  /** Check if a resource is tracked */
  has(resourceId: string): boolean;
}

/**
 * Create a resource cleanup manager for a card.
 */
export function createCardResourceCleanup(cardId: string): CardResourceCleanup {
  const resources = new Map<string, TrackedResource>();
  let disposed = false;
  let nextId = 0;
  
  return {
    cardId,
    resources,
    get disposed() { return disposed; },
    set disposed(v) { disposed = v; },
    
    track<T>(type: CardResourceType, resource: T, cleanup: (r: T) => void | Promise<void>, description?: string): string {
      if (disposed) throw new Error(`Cannot track resource on disposed card ${cardId}`);
      const id = `${cardId}-res-${nextId++}`;
      resources.set(id, {
        id,
        type,
        cleanup: () => cleanup(resource),
        createdAt: Date.now(),
        disposed: false,
        ...(description !== undefined && { description }),
      } as TrackedResource);
      return id;
    },
    
    async release(resourceId: string): Promise<void> {
      const resource = resources.get(resourceId);
      if (!resource) return;
      if (!resource.disposed) {
        resource.disposed = true;
        await resource.cleanup();
      }
      resources.delete(resourceId);
    },
    
    async disposeAll(): Promise<void> {
      if (disposed) return;
      disposed = true;
      const cleanupPromises: Promise<void>[] = [];
      for (const resource of Array.from(resources.values())) {
        if (!resource.disposed) {
          resource.disposed = true;
          cleanupPromises.push(Promise.resolve(resource.cleanup()));
        }
      }
      await Promise.all(cleanupPromises);
      resources.clear();
    },
    
    getResourceCount(type?: CardResourceType): number {
      if (!type) return resources.size;
      return Array.from(resources.values()).filter(r => r.type === type).length;
    },
    
    has(resourceId: string): boolean {
      return resources.has(resourceId);
    },
  };
}

// ============================================================================
// CARD TOUCH GESTURES (5.0.5.3)
// ============================================================================

/**
 * Touch gesture types for mobile/tablet interaction.
 */
export type TouchGestureType =
  | 'tap'
  | 'double-tap'
  | 'long-press'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'pinch-in'
  | 'pinch-out'
  | 'rotate'
  | 'two-finger-tap'
  | 'three-finger-tap'
  | 'pan';

/**
 * Touch gesture event data.
 */
export interface TouchGestureEvent {
  /** Gesture type */
  readonly gesture: TouchGestureType;
  /** Center X position */
  readonly centerX: number;
  /** Center Y position */
  readonly centerY: number;
  /** Delta X (for swipe/pan) */
  readonly deltaX: number;
  /** Delta Y (for swipe/pan) */
  readonly deltaY: number;
  /** Scale factor (for pinch) */
  readonly scale: number;
  /** Rotation angle in degrees (for rotate) */
  readonly rotation: number;
  /** Velocity (pixels/second for swipe) */
  readonly velocity: number;
  /** Number of touch points */
  readonly touchCount: number;
  /** Duration of gesture in ms */
  readonly duration: number;
  /** Original touch event */
  readonly originalEvent?: TouchEvent;
}

/**
 * Touch gesture handler.
 */
export type TouchGestureHandler = (event: TouchGestureEvent) => void;

/**
 * Touch gesture action mapping.
 */
export interface CardTouchGestureAction {
  /** Gesture that triggers this action */
  readonly gesture: TouchGestureType;
  /** Action to perform */
  readonly action: string;
  /** Optional modifier (e.g., on which element) */
  readonly target?: 'card' | 'knob' | 'slider' | 'button' | 'pad';
  /** Optional condition */
  readonly condition?: string;
}

/**
 * Card touch gesture configuration.
 */
export interface CardTouchGestures {
  /** Whether touch input is enabled */
  readonly enabled: boolean;
  /** Gesture-to-action mappings */
  readonly gestures: readonly CardTouchGestureAction[];
  /** Long press duration in ms */
  readonly longPressDuration: number;
  /** Swipe threshold in pixels */
  readonly swipeThreshold: number;
  /** Pinch threshold (scale factor delta) */
  readonly pinchThreshold: number;
  /** Haptic feedback enabled */
  readonly hapticFeedback: boolean;
}

/**
 * Default touch gestures for cards.
 */
export const DEFAULT_CARD_TOUCH_GESTURES: CardTouchGestures = {
  enabled: true,
  gestures: [
    { gesture: 'tap', action: 'select', target: 'card' },
    { gesture: 'double-tap', action: 'edit', target: 'card' },
    { gesture: 'long-press', action: 'context-menu', target: 'card' },
    { gesture: 'swipe-left', action: 'bypass', target: 'card' },
    { gesture: 'swipe-right', action: 'solo', target: 'card' },
    { gesture: 'swipe-up', action: 'expand', target: 'card' },
    { gesture: 'swipe-down', action: 'minimize', target: 'card' },
    { gesture: 'pinch-in', action: 'zoom-out', target: 'card' },
    { gesture: 'pinch-out', action: 'zoom-in', target: 'card' },
    { gesture: 'two-finger-tap', action: 'mute', target: 'card' },
    { gesture: 'pan', action: 'adjust-value', target: 'knob' },
    { gesture: 'pan', action: 'adjust-value', target: 'slider' },
    { gesture: 'tap', action: 'trigger', target: 'pad' },
  ],
  longPressDuration: 500,
  swipeThreshold: 50,
  pinchThreshold: 0.1,
  hapticFeedback: true,
};

/**
 * Touch gesture recognizer state.
 */
interface GestureRecognizerState {
  startTouches: { x: number; y: number; id: number }[];
  startTime: number;
  startDistance: number;
  startAngle: number;
  lastX: number;
  lastY: number;
  recognized: boolean;
}

/**
 * Create a touch gesture recognizer.
 */
export function createTouchGestureRecognizer(
  config: CardTouchGestures,
  onGesture: TouchGestureHandler
): {
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: (e: TouchEvent) => void;
  destroy: () => void;
} {
  let state: GestureRecognizerState | null = null;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  
  function getDistance(t1: Touch, t2: Touch): number {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }
  
  function getAngle(t1: Touch, t2: Touch): number {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
  }
  
  function emitGesture(gesture: TouchGestureType, extras: Partial<TouchGestureEvent> = {}, originalEvent?: TouchEvent) {
    onGesture({
      gesture,
      centerX: state?.lastX ?? 0,
      centerY: state?.lastY ?? 0,
      deltaX: 0,
      deltaY: 0,
      scale: 1,
      rotation: 0,
      velocity: 0,
      touchCount: state?.startTouches.length ?? 0,
      duration: state ? Date.now() - state.startTime : 0,
      ...(originalEvent !== undefined && { originalEvent }),
      ...extras,
    } as TouchGestureEvent);
  }
  
  function handleTouchStart(e: TouchEvent) {
    if (!config.enabled) return;
    
    const touches = Array.from(e.touches);
    state = {
      startTouches: touches.map(t => ({ x: t.clientX, y: t.clientY, id: t.identifier })),
      startTime: Date.now(),
      startDistance: touches.length >= 2 && touches[0] && touches[1] ? getDistance(touches[0], touches[1]) : 0,
      startAngle: touches.length >= 2 && touches[0] && touches[1] ? getAngle(touches[0], touches[1]) : 0,
      lastX: touches.reduce((sum, t) => sum + t.clientX, 0) / touches.length,
      lastY: touches.reduce((sum, t) => sum + t.clientY, 0) / touches.length,
      recognized: false,
    };
    
    // Start long press timer
    if (touches.length === 1) {
      longPressTimer = setTimeout(() => {
        if (state && !state.recognized) {
          state.recognized = true;
          emitGesture('long-press', {}, e);
        }
      }, config.longPressDuration);
    }
  }
  
  function handleTouchMove(e: TouchEvent) {
    if (!config.enabled || !state) return;
    
    const touches = Array.from(e.touches);
    const centerX = touches.reduce((sum, t) => sum + t.clientX, 0) / touches.length;
    const centerY = touches.reduce((sum, t) => sum + t.clientY, 0) / touches.length;
    const deltaX = centerX - state.lastX;
    const deltaY = centerY - state.lastY;
    
    // Cancel long press on move
    if (longPressTimer && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    // Pinch/rotate detection
    if (touches.length >= 2 && touches[0] && touches[1]) {
      const currentDistance = getDistance(touches[0], touches[1]);
      const currentAngle = getAngle(touches[0], touches[1]);
      const scale = currentDistance / state.startDistance;
      const rotation = currentAngle - state.startAngle;
      
      if (Math.abs(scale - 1) > config.pinchThreshold && !state.recognized) {
        state.recognized = true;
        emitGesture(scale < 1 ? 'pinch-in' : 'pinch-out', { scale, centerX, centerY }, e);
      }
      if (Math.abs(rotation) > 15 && !state.recognized) {
        state.recognized = true;
        emitGesture('rotate', { rotation, centerX, centerY }, e);
      }
    }
    
    // Pan detection
    if (touches.length === 1 && state.startTouches[0]) {
      const totalDeltaX = centerX - state.startTouches[0].x;
      const totalDeltaY = centerY - state.startTouches[0].y;
      
      if ((Math.abs(totalDeltaX) > 5 || Math.abs(totalDeltaY) > 5) && !state.recognized) {
        emitGesture('pan', { deltaX: totalDeltaX, deltaY: totalDeltaY, centerX, centerY }, e);
      }
    }
    
    state.lastX = centerX;
    state.lastY = centerY;
  }
  
  function handleTouchEnd(e: TouchEvent) {
    if (!config.enabled || !state) return;
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    const duration = Date.now() - state.startTime;
    const startTouch = state.startTouches[0];
    if (!startTouch) return;
    const deltaX = state.lastX - startTouch.x;
    const deltaY = state.lastY - startTouch.y;
    const distance = Math.hypot(deltaX, deltaY);
    const velocity = distance / duration * 1000;
    
    if (!state.recognized) {
      // Swipe detection
      if (distance > config.swipeThreshold && duration < 300) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        let gesture: TouchGestureType = 'swipe-right';
        if (angle > -45 && angle <= 45) gesture = 'swipe-right';
        else if (angle > 45 && angle <= 135) gesture = 'swipe-down';
        else if (angle > 135 || angle <= -135) gesture = 'swipe-left';
        else gesture = 'swipe-up';
        emitGesture(gesture, { deltaX, deltaY, velocity }, e);
      }
      // Tap detection
      else if (distance < 10) {
        const touchCount = state.startTouches.length;
        if (touchCount === 1 && duration < 300) {
          emitGesture('tap', {}, e);
        } else if (touchCount === 2) {
          emitGesture('two-finger-tap', {}, e);
        } else if (touchCount === 3) {
          emitGesture('three-finger-tap', {}, e);
        }
      }
    }
    
    state = null;
  }
  
  function destroy() {
    if (longPressTimer) clearTimeout(longPressTimer);
    state = null;
  }
  
  return { handleTouchStart, handleTouchMove, handleTouchEnd, destroy };
}

// ============================================================================
// CARD SANDBOX ISOLATION (5.0.5.4)
// ============================================================================

/**
 * Sandbox permission level.
 */
export type SandboxPermission =
  | 'audio-output'
  | 'midi-output'
  | 'file-read'
  | 'file-write'
  | 'network'
  | 'clipboard'
  | 'notification'
  | 'storage'
  | 'worker'
  | 'wasm';

/**
 * Sandbox violation record.
 */
export interface SandboxViolation {
  /** Violation timestamp */
  readonly timestamp: number;
  /** Card ID that caused violation */
  readonly cardId: string;
  /** Permission that was violated */
  readonly permission: SandboxPermission;
  /** Description of the violation */
  readonly description: string;
  /** Stack trace if available */
  readonly stack?: string;
}

/**
 * Card sandbox configuration.
 */
export interface CardSandboxConfig {
  /** Sandbox ID */
  readonly id: string;
  /** Card ID being sandboxed */
  readonly cardId: string;
  /** Allowed permissions */
  readonly permissions: readonly SandboxPermission[];
  /** Maximum memory usage in MB */
  readonly maxMemoryMB: number;
  /** Maximum CPU time per frame in ms */
  readonly maxCpuTimeMs: number;
  /** Whether to log violations */
  readonly logViolations: boolean;
  /** Violation callback */
  readonly onViolation?: (violation: SandboxViolation) => void;
}

/**
 * Card sandbox state.
 */
export interface CardSandbox {
  /** Sandbox configuration */
  readonly config: CardSandboxConfig;
  /** Violation history */
  readonly violations: SandboxViolation[];
  /** Whether sandbox is active */
  active: boolean;
  
  /** Check if a permission is granted */
  hasPermission(permission: SandboxPermission): boolean;
  /** Request a permission (may prompt user) */
  requestPermission(permission: SandboxPermission): Promise<boolean>;
  /** Record a violation */
  recordViolation(permission: SandboxPermission, description: string): void;
  /** Get proxy for global objects */
  createGlobalProxy(): Record<string, unknown>;
  /** Dispose sandbox */
  dispose(): void;
}

/**
 * Create a sandbox for a user-defined card.
 */
export function createCardSandbox(config: CardSandboxConfig): CardSandbox {
  const violations: SandboxViolation[] = [];
  let active = true;
  
  function hasPermission(permission: SandboxPermission): boolean {
    return config.permissions.includes(permission);
  }
  
  function recordViolation(permission: SandboxPermission, description: string): void {
    const errorStack = new Error().stack;
    const violation: SandboxViolation = {
      timestamp: Date.now(),
      cardId: config.cardId,
      permission,
      description,
      ...(errorStack !== undefined && { stack: errorStack }),
    } as SandboxViolation;
    violations.push(violation);
    if (config.logViolations) {
      console.warn(`[Sandbox Violation] Card ${config.cardId}: ${permission} - ${description}`);
    }
    config.onViolation?.(violation);
  }
  
  async function requestPermission(permission: SandboxPermission): Promise<boolean> {
    // In a real implementation, this would prompt the user
    // For now, only grant if already permitted
    return hasPermission(permission);
  }
  
  function createGlobalProxy(): Record<string, unknown> {
    // Create a sandboxed global object with restricted access
    const proxy: Record<string, unknown> = {
      console: {
        log: (...args: unknown[]) => console.log(`[Card ${config.cardId}]`, ...args),
        warn: (...args: unknown[]) => console.warn(`[Card ${config.cardId}]`, ...args),
        error: (...args: unknown[]) => console.error(`[Card ${config.cardId}]`, ...args),
      },
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Date,
      Map,
      Set,
      Promise,
      setTimeout: hasPermission('worker') ? setTimeout : () => {
        recordViolation('worker', 'setTimeout blocked');
        return 0;
      },
      clearTimeout: hasPermission('worker') ? clearTimeout : () => {},
      // Block dangerous APIs
      fetch: hasPermission('network') 
        ? fetch.bind(globalThis)
        : () => {
            recordViolation('network', 'fetch blocked');
            return Promise.reject(new Error('Network access denied'));
          },
      localStorage: hasPermission('storage')
        ? localStorage
        : new Proxy({}, {
            get: () => { recordViolation('storage', 'localStorage read blocked'); return null; },
            set: () => { recordViolation('storage', 'localStorage write blocked'); return false; },
          }),
    };
    return proxy;
  }
  
  function dispose(): void {
    active = false;
  }
  
  return {
    config,
    violations,
    get active() { return active; },
    set active(v) { active = v; },
    hasPermission,
    requestPermission,
    recordViolation,
    createGlobalProxy,
    dispose,
  };
}

// ============================================================================
// CARD HOT SWAP (5.0.5.4)
// ============================================================================

/**
 * Hot swap state preservation strategy.
 */
export type HotSwapStrategy = 
  | 'preserve-state'    // Keep all state
  | 'preserve-params'   // Keep only parameter values
  | 'reset'             // Full reset
  | 'migrate';          // Use migration function

/**
 * Hot swap event.
 */
export interface HotSwapEvent {
  /** Card ID being swapped */
  readonly cardId: string;
  /** Old card definition version */
  readonly oldVersion: string;
  /** New card definition version */
  readonly newVersion: string;
  /** Strategy used */
  readonly strategy: HotSwapStrategy;
  /** Timestamp */
  readonly timestamp: number;
  /** Whether swap was successful */
  readonly success: boolean;
  /** Error message if failed */
  readonly error?: string;
}

/**
 * Card hot swap configuration.
 */
export interface CardHotSwapConfig {
  /** Default strategy */
  readonly defaultStrategy: HotSwapStrategy;
  /** Whether to validate new definition before swap */
  readonly validateBeforeSwap: boolean;
  /** Whether to keep undo history */
  readonly preserveUndoHistory: boolean;
  /** Maximum state size to preserve (bytes) */
  readonly maxStateSize: number;
  /** Swap timeout in ms */
  readonly timeoutMs: number;
}

/**
 * Default hot swap config.
 */
export const DEFAULT_HOT_SWAP_CONFIG: CardHotSwapConfig = {
  defaultStrategy: 'preserve-params',
  validateBeforeSwap: true,
  preserveUndoHistory: true,
  maxStateSize: 1024 * 1024, // 1MB
  timeoutMs: 5000,
};

/**
 * Hot swap manager.
 */
export interface CardHotSwap {
  /** Configuration */
  readonly config: CardHotSwapConfig;
  /** Swap history */
  readonly history: readonly HotSwapEvent[];
  
  /** Perform a hot swap */
  swap(
    cardId: string,
    oldDef: CardDefinition,
    newDef: CardDefinition,
    currentState: Record<string, unknown>,
    strategy?: HotSwapStrategy
  ): Promise<{ state: Record<string, unknown>; event: HotSwapEvent }>;
  
  /** Check if swap is possible */
  canSwap(oldDef: CardDefinition, newDef: CardDefinition): { possible: boolean; reason?: string };
  
  /** Rollback last swap for a card */
  rollback(cardId: string): Promise<boolean>;
}

/**
 * Create a hot swap manager.
 */
export function createCardHotSwap(config: CardHotSwapConfig = DEFAULT_HOT_SWAP_CONFIG): CardHotSwap {
  const history: HotSwapEvent[] = [];
  const rollbackData = new Map<string, { def: CardDefinition; state: Record<string, unknown> }>();
  
  function canSwap(oldDef: CardDefinition, newDef: CardDefinition): { possible: boolean; reason?: string } {
    // Check basic compatibility
    if (oldDef.meta.id !== newDef.meta.id) {
      return { possible: false, reason: 'Card IDs must match' };
    }
    
    // Check port compatibility
    // Note: Port compatibility checks reserved for future use
    
    // New definition can have fewer inputs (removed), but existing connections may break
    // This is allowed with warning
    
    return { possible: true };
  }
  
  async function swap(
    cardId: string,
    oldDef: CardDefinition,
    newDef: CardDefinition,
    currentState: Record<string, unknown>,
    strategy: HotSwapStrategy = config.defaultStrategy
  ): Promise<{ state: Record<string, unknown>; event: HotSwapEvent }> {
    const canSwapResult = canSwap(oldDef, newDef);
    if (config.validateBeforeSwap && !canSwapResult.possible) {
      const event: HotSwapEvent = {
        cardId,
        oldVersion: oldDef.meta.version,
        newVersion: newDef.meta.version,
        strategy,
        timestamp: Date.now(),
        success: false,
        ...(canSwapResult.reason !== undefined && { error: canSwapResult.reason }),
      } as HotSwapEvent;
      history.push(event);
      throw new Error(canSwapResult.reason);
    }
    
    // Save rollback data
    rollbackData.set(cardId, { def: oldDef, state: { ...currentState } });
    
    let newState: Record<string, unknown>;
    
    switch (strategy) {
      case 'reset':
        newState = {};
        break;
        
      case 'preserve-params':
        // Only preserve parameter values that exist in new definition
        const validParams = new Set(newDef.parameters.map(p => p.id));
        newState = {};
        for (const [key, value] of Object.entries(currentState)) {
          if (validParams.has(key)) {
            newState[key] = value;
          }
        }
        break;
        
      case 'preserve-state':
        newState = { ...currentState };
        break;
        
      case 'migrate':
        // Would call a migration function here
        newState = { ...currentState };
        break;
        
      default:
        newState = {};
    }
    
    const event: HotSwapEvent = {
      cardId,
      oldVersion: oldDef.meta.version,
      newVersion: newDef.meta.version,
      strategy,
      timestamp: Date.now(),
      success: true,
    };
    history.push(event);
    
    return { state: newState, event };
  }
  
  async function rollback(cardId: string): Promise<boolean> {
    const data = rollbackData.get(cardId);
    if (!data) return false;
    rollbackData.delete(cardId);
    return true;
  }
  
  return {
    config,
    get history() { return history; },
    swap,
    canSwap,
    rollback,
  };
}

// ============================================================================
// CARD VERSION MIGRATION (5.0.5.4)
// ============================================================================

/**
 * Migration step.
 */
export interface MigrationStep {
  /** Source version */
  readonly from: string;
  /** Target version */
  readonly to: string;
  /** Migration function */
  readonly migrate: (state: Record<string, unknown>) => Record<string, unknown>;
  /** Description of changes */
  readonly description: string;
}

/**
 * Card version migration registry.
 */
export interface CardVersionMigration {
  /** Card ID */
  readonly cardId: string;
  /** Registered migration steps */
  readonly steps: readonly MigrationStep[];
  
  /** Register a migration step */
  registerStep(step: MigrationStep): void;
  /** Migrate state from one version to another */
  migrate(state: Record<string, unknown>, fromVersion: string, toVersion: string): Record<string, unknown>;
  /** Get migration path */
  getMigrationPath(fromVersion: string, toVersion: string): readonly MigrationStep[] | null;
  /** Check if migration is possible */
  canMigrate(fromVersion: string, toVersion: string): boolean;
}

/**
 * Parse semantic version.
 */
function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/**
 * Compare versions.
 */
function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);
  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

/**
 * Create a version migration registry for a card.
 */
export function createCardVersionMigration(cardId: string): CardVersionMigration {
  const steps: MigrationStep[] = [];
  
  function registerStep(step: MigrationStep): void {
    steps.push(step);
    // Sort by version order
    steps.sort((a, b) => compareVersions(a.from, b.from));
  }
  
  function getMigrationPath(fromVersion: string, toVersion: string): readonly MigrationStep[] | null {
    if (compareVersions(fromVersion, toVersion) >= 0) return [];
    
    const path: MigrationStep[] = [];
    let currentVersion = fromVersion;
    
    while (compareVersions(currentVersion, toVersion) < 0) {
      const nextStep = steps.find(s => s.from === currentVersion);
      if (!nextStep) return null; // No path found
      path.push(nextStep);
      currentVersion = nextStep.to;
    }
    
    return path;
  }
  
  function canMigrate(fromVersion: string, toVersion: string): boolean {
    return getMigrationPath(fromVersion, toVersion) !== null;
  }
  
  function migrate(state: Record<string, unknown>, fromVersion: string, toVersion: string): Record<string, unknown> {
    const path = getMigrationPath(fromVersion, toVersion);
    if (!path) {
      throw new Error(`No migration path from ${fromVersion} to ${toVersion} for card ${cardId}`);
    }
    
    let currentState = { ...state };
    for (const step of path) {
      currentState = step.migrate(currentState);
    }
    return currentState;
  }
  
  return {
    cardId,
    get steps() { return steps; },
    registerStep,
    getMigrationPath,
    canMigrate,
    migrate,
  };
}

// ============================================================================
// CARD MARKETPLACE INTEGRATION (5.0.5.4)
// ============================================================================

/**
 * Marketplace card listing.
 */
export interface MarketplaceListing {
  /** Unique listing ID */
  readonly id: string;
  /** Card definition */
  readonly card: CardDefinition;
  /** Publisher info */
  readonly publisher: {
    readonly id: string;
    readonly name: string;
    readonly verified: boolean;
  };
  /** Pricing */
  readonly pricing: {
    readonly type: 'free' | 'paid' | 'subscription';
    readonly price?: number;
    readonly currency?: string;
  };
  /** Statistics */
  readonly stats: {
    readonly downloads: number;
    readonly rating: number;
    readonly ratingCount: number;
    readonly favorites: number;
  };
  /** Publication date */
  readonly publishedAt: number;
  /** Last update date */
  readonly updatedAt: number;
  /** Screenshots/previews */
  readonly previews: readonly string[];
  /** Demo audio URLs */
  readonly demoAudio?: readonly string[];
}

/**
 * Marketplace search filters.
 */
export interface MarketplaceSearchFilters {
  readonly query?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly pricingType?: 'free' | 'paid' | 'subscription';
  readonly minRating?: number;
  readonly sortBy?: 'relevance' | 'downloads' | 'rating' | 'newest' | 'updated';
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Marketplace search result.
 */
export interface MarketplaceSearchResult {
  readonly listings: readonly MarketplaceListing[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * User card rating.
 */
export interface CardRating {
  readonly cardId: string;
  readonly userId: string;
  readonly rating: number; // 1-5
  readonly review?: string;
  readonly timestamp: number;
}

/**
 * Card marketplace client interface.
 */
export interface CardMarketplace {
  /** Search for cards */
  search(filters: MarketplaceSearchFilters): Promise<MarketplaceSearchResult>;
  /** Get card details */
  getCard(listingId: string): Promise<MarketplaceListing | null>;
  /** Download a card */
  download(listingId: string): Promise<CardDefinition>;
  /** Rate a card */
  rate(listingId: string, rating: CardRating): Promise<void>;
  /** Add to favorites */
  favorite(listingId: string): Promise<void>;
  /** Remove from favorites */
  unfavorite(listingId: string): Promise<void>;
  /** Get user's downloaded cards */
  getDownloaded(): Promise<readonly MarketplaceListing[]>;
  /** Get user's favorites */
  getFavorites(): Promise<readonly MarketplaceListing[]>;
  /** Upload a card */
  upload(card: CardDefinition, pricing: MarketplaceListing['pricing']): Promise<string>;
  /** Update uploaded card */
  update(listingId: string, card: CardDefinition): Promise<void>;
}

/**
 * Create a mock marketplace client for local development.
 */
export function createMockMarketplace(): CardMarketplace {
  const listings = new Map<string, MarketplaceListing>();
  const downloaded = new Set<string>();
  const favorites = new Set<string>();
  
  return {
    async search(filters): Promise<MarketplaceSearchResult> {
      let results = Array.from(listings.values());
      
      if (filters.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(l => 
          l.card.meta.name.toLowerCase().includes(q) ||
          l.card.meta.description.toLowerCase().includes(q)
        );
      }
      if (filters.category) {
        results = results.filter(l => l.card.meta.category === filters.category);
      }
      if (filters.pricingType) {
        results = results.filter(l => l.pricing.type === filters.pricingType);
      }
      if (filters.minRating) {
        results = results.filter(l => l.stats.rating >= filters.minRating!);
      }
      
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;
      const paged = results.slice(offset, offset + limit);
      
      return {
        listings: paged,
        total: results.length,
        hasMore: offset + limit < results.length,
      };
    },
    
    async getCard(listingId): Promise<MarketplaceListing | null> {
      return listings.get(listingId) ?? null;
    },
    
    async download(listingId): Promise<CardDefinition> {
      const listing = listings.get(listingId);
      if (!listing) throw new Error('Card not found');
      downloaded.add(listingId);
      return listing.card;
    },
    
    async rate(listingId, _rating): Promise<void> {
      const listing = listings.get(listingId);
      if (!listing) throw new Error('Card not found');
      // In real impl, would update stats
    },
    
    async favorite(listingId): Promise<void> {
      favorites.add(listingId);
    },
    
    async unfavorite(listingId): Promise<void> {
      favorites.delete(listingId);
    },
    
    async getDownloaded(): Promise<readonly MarketplaceListing[]> {
      return Array.from(downloaded).map(id => listings.get(id)!).filter(Boolean);
    },
    
    async getFavorites(): Promise<readonly MarketplaceListing[]> {
      return Array.from(favorites).map(id => listings.get(id)!).filter(Boolean);
    },
    
    async upload(card, pricing): Promise<string> {
      const id = `listing-${Date.now()}`;
      const listing: MarketplaceListing = {
        id,
        card,
        publisher: { id: 'local', name: 'Local User', verified: false },
        pricing,
        stats: { downloads: 0, rating: 0, ratingCount: 0, favorites: 0 },
        publishedAt: Date.now(),
        updatedAt: Date.now(),
        previews: [],
      };
      listings.set(id, listing);
      return id;
    },
    
    async update(listingId, card): Promise<void> {
      const listing = listings.get(listingId);
      if (!listing) throw new Error('Card not found');
      listings.set(listingId, { ...listing, card, updatedAt: Date.now() });
    },
  };
}

// ============================================================================
// CARD FROM AUDIO WIZARD (5.0.5.4)
// ============================================================================

/**
 * Audio analysis result for card suggestion.
 */
export interface AudioAnalysisResult {
  /** Detected tempo (BPM) */
  readonly tempo: number;
  /** Tempo confidence (0-1) */
  readonly tempoConfidence: number;
  /** Detected key */
  readonly key: string;
  /** Key confidence (0-1) */
  readonly keyConfidence: number;
  /** Time signature */
  readonly timeSignature: { numerator: number; denominator: number };
  /** Spectral centroid (brightness) */
  readonly brightness: number;
  /** Detected instrument type */
  readonly instrumentType: 'drums' | 'bass' | 'keys' | 'strings' | 'vocals' | 'synth' | 'guitar' | 'unknown';
  /** Instrument confidence (0-1) */
  readonly instrumentConfidence: number;
  /** Dynamic range (dB) */
  readonly dynamicRange: number;
  /** Transient density (per second) */
  readonly transientDensity: number;
  /** Harmonic content (0-1) */
  readonly harmonicity: number;
  /** Detected note events */
  readonly notes: readonly {
    readonly pitch: number;
    readonly startTime: number;
    readonly duration: number;
    readonly velocity: number;
  }[];
}

/**
 * Card suggestion from audio analysis.
 */
export interface CardSuggestion {
  /** Suggested card type */
  readonly cardType: string;
  /** Confidence (0-1) */
  readonly confidence: number;
  /** Suggested presets */
  readonly presets: readonly string[];
  /** Suggested parameter values */
  readonly suggestedParams: Record<string, number | string | boolean>;
  /** Explanation */
  readonly explanation: string;
}

/**
 * Card from audio wizard state.
 */
export interface CardFromAudioWizard {
  /** Current step */
  step: 'upload' | 'analyzing' | 'review' | 'customize' | 'complete';
  /** Uploaded audio file info */
  audioFile?: {
    readonly name: string;
    readonly size: number;
    readonly duration: number;
    readonly sampleRate: number;
  };
  /** Analysis result */
  analysis?: AudioAnalysisResult;
  /** Card suggestions */
  suggestions?: readonly CardSuggestion[];
  /** Selected suggestion index */
  selectedSuggestion?: number;
  /** Custom overrides */
  customParams?: Record<string, number | string | boolean>;
  /** Generated card */
  generatedCard?: CardDefinition;
}

/**
 * Analyze audio buffer for card suggestion.
 * This is a simplified implementation - real implementation would use ML models.
 */
export async function analyzeAudioForCard(
  audioBuffer: AudioBuffer
): Promise<AudioAnalysisResult> {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const duration = audioBuffer.duration;
  
  // Simple tempo estimation using autocorrelation
  // (Real implementation would use more sophisticated analysis)
  const tempo = estimateTempoSimple(channelData, sampleRate);
  
  // Simple brightness estimation (spectral centroid proxy)
  let brightness = 0;
  let energy = 0;
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.abs(channelData[i] ?? 0);
    energy += sample * sample;
    // High-pass filter proxy
    if (i > 0) {
      brightness += Math.abs((channelData[i] ?? 0) - (channelData[i - 1] ?? 0));
    }
  }
  brightness = brightness / channelData.length;
  
  // Dynamic range estimation
  let maxSample = 0;
  let minNonZero = 1;
  for (let i = 0; i < channelData.length; i++) {
    const abs = Math.abs(channelData[i] ?? 0);
    if (abs > maxSample) maxSample = abs;
    if (abs > 0.001 && abs < minNonZero) minNonZero = abs;
  }
  const dynamicRange = 20 * Math.log10(maxSample / minNonZero);
  
  // Transient detection (simple zero-crossing based)
  let transientCount = 0;
  let prevDerivative = 0;
  for (let i = 2; i < channelData.length; i++) {
    const derivative = (channelData[i] ?? 0) - (channelData[i - 1] ?? 0);
    const secondDerivative = derivative - prevDerivative;
    if (Math.abs(secondDerivative) > 0.1) transientCount++;
    prevDerivative = derivative;
  }
  const transientDensity = transientCount / duration;
  
  // Guess instrument type based on features
  let instrumentType: AudioAnalysisResult['instrumentType'] = 'unknown';
  let instrumentConfidence = 0.3;
  
  if (transientDensity > 10 && brightness > 0.1) {
    instrumentType = 'drums';
    instrumentConfidence = 0.7;
  } else if (brightness < 0.03 && dynamicRange < 20) {
    instrumentType = 'bass';
    instrumentConfidence = 0.6;
  } else if (brightness > 0.05 && transientDensity < 5) {
    instrumentType = 'strings';
    instrumentConfidence = 0.5;
  }
  
  return {
    tempo,
    tempoConfidence: 0.5,
    key: 'C',
    keyConfidence: 0.3,
    timeSignature: { numerator: 4, denominator: 4 },
    brightness,
    instrumentType,
    instrumentConfidence,
    dynamicRange,
    transientDensity,
    harmonicity: 0.5,
    notes: [],
  };
}

/**
 * Simple tempo estimation.
 */
function estimateTempoSimple(samples: Float32Array, sampleRate: number): number {
  // Very basic onset detection
  const hopSize = Math.floor(sampleRate / 100); // 10ms hops
  const onsets: number[] = [];
  let prevEnergy = 0;
  
  for (let i = 0; i < samples.length - hopSize; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < hopSize; j++) {
      const s = samples[i + j] ?? 0;
      energy += s * s;
    }
    if (energy > prevEnergy * 1.5 && energy > 0.001) {
      onsets.push(i / sampleRate);
    }
    prevEnergy = energy;
  }
  
  // Find most common interval
  const intervals: number[] = [];
  for (let i = 1; i < onsets.length; i++) {
    intervals.push((onsets[i] ?? 0) - (onsets[i - 1] ?? 0));
  }
  
  if (intervals.length === 0) return 120; // Default
  
  // Average interval
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = 60 / avgInterval;
  
  // Clamp to reasonable range
  return Math.max(60, Math.min(200, bpm));
}

/**
 * Suggest cards based on audio analysis.
 */
export function suggestCardsFromAnalysis(analysis: AudioAnalysisResult): readonly CardSuggestion[] {
  const suggestions: CardSuggestion[] = [];
  
  // Suggest based on instrument type
  switch (analysis.instrumentType) {
    case 'drums':
      suggestions.push({
        cardType: 'drum-machine',
        confidence: analysis.instrumentConfidence,
        presets: ['acoustic-kit', 'electronic-kit', '808-kit'],
        suggestedParams: {
          swing: analysis.transientDensity > 8 ? 0 : 0.1,
          tempo: analysis.tempo,
        },
        explanation: 'Detected percussive content with high transient density',
      });
      break;
      
    case 'bass':
      suggestions.push({
        cardType: 'bass-synth',
        confidence: analysis.instrumentConfidence,
        presets: ['sub-bass', 'analog-bass', 'fm-bass'],
        suggestedParams: {
          filterCutoff: analysis.brightness * 1000 + 200,
        },
        explanation: 'Detected low-frequency content with sustained notes',
      });
      break;
      
    case 'keys':
      suggestions.push({
        cardType: 'piano',
        confidence: analysis.instrumentConfidence,
        presets: ['grand-piano', 'electric-piano', 'rhodes'],
        suggestedParams: {},
        explanation: 'Detected harmonic keyboard-like content',
      });
      break;
      
    case 'strings':
      suggestions.push({
        cardType: 'strings',
        confidence: analysis.instrumentConfidence,
        presets: ['ensemble', 'solo-violin', 'chamber'],
        suggestedParams: {
          attack: analysis.transientDensity < 2 ? 0.3 : 0.05,
        },
        explanation: 'Detected sustained harmonic content typical of strings',
      });
      break;
      
    default:
      suggestions.push({
        cardType: 'sampler',
        confidence: 0.5,
        presets: ['default'],
        suggestedParams: {},
        explanation: 'Unable to determine specific instrument type, suggesting sampler',
      });
  }
  
  // Add effect suggestions
  if (analysis.dynamicRange > 30) {
    suggestions.push({
      cardType: 'compressor',
      confidence: 0.7,
      presets: ['gentle', 'medium', 'heavy'],
      suggestedParams: {
        threshold: -20,
        ratio: 4,
      },
      explanation: 'High dynamic range detected, compression recommended',
    });
  }
  
  return suggestions;
}

/**
 * Create card from audio wizard.
 */
export function createCardFromAudioWizard(): CardFromAudioWizard {
  return {
    step: 'upload',
  };
}

// ============================================================================
// PRESET SLOTS AND MACROS (5.0.5.5)
// ============================================================================

/**
 * Preset slot definition.
 * A slot accepts sub-presets for complex hierarchical presets.
 */
export interface PresetSlot {
  /** Slot ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Slot type (what kind of presets it accepts) */
  readonly slotType: string;
  /** Default preset ID */
  readonly defaultPresetId?: string;
  /** Current preset ID */
  currentPresetId?: string;
  /** Whether slot is required */
  readonly required: boolean;
  /** Valid preset IDs for this slot */
  readonly validPresets?: readonly string[];
}

/**
 * Preset macro definition.
 * A macro controls multiple parameters with a single value.
 */
export interface PresetMacro {
  /** Macro ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Current value (0-1) */
  value: number;
  /** Default value */
  readonly defaultValue: number;
  /** Parameter mappings */
  readonly mappings: readonly PresetMacroMapping[];
  /** Curve type */
  readonly curve: 'linear' | 'logarithmic' | 'exponential' | 'scurve';
  /** Display style */
  readonly style: 'knob' | 'slider' | 'button';
}

/**
 * Macro to parameter mapping.
 */
export interface PresetMacroMapping {
  /** Target parameter ID */
  readonly paramId: string;
  /** Parameter min value at macro=0 */
  readonly minValue: number;
  /** Parameter max value at macro=1 */
  readonly maxValue: number;
  /** Bipolar (centered at 0.5) */
  readonly bipolar?: boolean;
  /** Invert direction */
  readonly invert?: boolean;
}

/**
 * Preset with slots and macros.
 */
export interface AdvancedPreset extends PresetDefinition {
  /** Sub-preset slots */
  readonly slots?: readonly PresetSlot[];
  /** Macro controls */
  readonly macros?: readonly PresetMacro[];
}

/**
 * Create a preset slot.
 */
export function createPresetSlot(
  id: string,
  name: string,
  slotType: string,
  options: Partial<PresetSlot> = {}
): PresetSlot {
  return {
    id,
    name,
    slotType,
    required: false,
    ...options,
  };
}

/**
 * Create a preset macro.
 */
export function createPresetMacro(
  id: string,
  name: string,
  mappings: readonly PresetMacroMapping[],
  options: Partial<PresetMacro> = {}
): PresetMacro {
  return {
    id,
    name,
    value: options.defaultValue ?? 0.5,
    defaultValue: 0.5,
    mappings,
    curve: 'linear',
    style: 'knob',
    ...options,
  };
}

/**
 * Apply macro value to get parameter values.
 */
export function applyMacro(macro: PresetMacro): Record<string, number> {
  const result: Record<string, number> = {};
  
  for (const mapping of macro.mappings) {
    let t = macro.value;
    
    // Apply curve
    switch (macro.curve) {
      case 'logarithmic':
        t = Math.log10(1 + t * 9) / Math.log10(10);
        break;
      case 'exponential':
        t = (Math.pow(10, t) - 1) / 9;
        break;
      case 'scurve':
        t = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
        break;
    }
    
    // Apply inversion
    if (mapping.invert) t = 1 - t;
    
    // Apply bipolar centering
    if (mapping.bipolar) {
      t = (t - 0.5) * 2; // -1 to 1
      const center = (mapping.minValue + mapping.maxValue) / 2;
      const range = (mapping.maxValue - mapping.minValue) / 2;
      result[mapping.paramId] = center + t * range;
    } else {
      result[mapping.paramId] = mapping.minValue + t * (mapping.maxValue - mapping.minValue);
    }
  }
  
  return result;
}

// ============================================================================
// PRESET FAVORITES AND RECENTLY USED (5.0.5.5)
// ============================================================================

/**
 * Preset usage entry.
 */
export interface PresetUsageEntry {
  /** Preset ID */
  readonly presetId: string;
  /** Card ID */
  readonly cardId: string;
  /** Timestamp of last use */
  lastUsed: number;
  /** Total use count */
  useCount: number;
}

/**
 * Preset favorites and recently used manager.
 */
export interface PresetFavoritesManager {
  /** Favorite preset IDs */
  readonly favorites: Set<string>;
  /** Recently used presets (ordered by recency) */
  readonly recentlyUsed: PresetUsageEntry[];
  /** Maximum recently used entries */
  readonly maxRecentEntries: number;
  
  /** Add to favorites */
  addFavorite(presetId: string, cardId: string): void;
  /** Remove from favorites */
  removeFavorite(presetId: string): void;
  /** Check if favorite */
  isFavorite(presetId: string): boolean;
  /** Record preset usage */
  recordUsage(presetId: string, cardId: string): void;
  /** Get recently used for a card */
  getRecentForCard(cardId: string, limit?: number): readonly PresetUsageEntry[];
  /** Get most used presets */
  getMostUsed(limit?: number): readonly PresetUsageEntry[];
  /** Clear recently used */
  clearRecent(): void;
  /** Export to JSON */
  toJSON(): { favorites: string[]; recentlyUsed: PresetUsageEntry[] };
  /** Import from JSON */
  fromJSON(data: { favorites: string[]; recentlyUsed: PresetUsageEntry[] }): void;
}

/**
 * Create a preset favorites manager.
 */
export function createPresetFavoritesManager(maxRecentEntries: number = 50): PresetFavoritesManager {
  const favorites = new Set<string>();
  const recentlyUsed: PresetUsageEntry[] = [];
  const usageMap = new Map<string, PresetUsageEntry>();
  
  return {
    favorites,
    recentlyUsed,
    maxRecentEntries,
    
    addFavorite(presetId: string, _cardId: string): void {
      favorites.add(presetId);
    },
    
    removeFavorite(presetId: string): void {
      favorites.delete(presetId);
    },
    
    isFavorite(presetId: string): boolean {
      return favorites.has(presetId);
    },
    
    recordUsage(presetId: string, cardId: string): void {
      const key = `${cardId}:${presetId}`;
      let entry = usageMap.get(key);
      
      if (entry) {
        entry.lastUsed = Date.now();
        entry.useCount++;
        // Move to front
        const index = recentlyUsed.indexOf(entry);
        if (index > 0) {
          recentlyUsed.splice(index, 1);
          recentlyUsed.unshift(entry);
        }
      } else {
        entry = {
          presetId,
          cardId,
          lastUsed: Date.now(),
          useCount: 1,
        };
        usageMap.set(key, entry);
        recentlyUsed.unshift(entry);
        
        // Trim to max size
        while (recentlyUsed.length > maxRecentEntries) {
          const removed = recentlyUsed.pop();
          if (removed) usageMap.delete(`${removed.cardId}:${removed.presetId}`);
        }
      }
    },
    
    getRecentForCard(cardId: string, limit: number = 10): readonly PresetUsageEntry[] {
      return recentlyUsed
        .filter(e => e.cardId === cardId)
        .slice(0, limit);
    },
    
    getMostUsed(limit: number = 10): readonly PresetUsageEntry[] {
      return [...recentlyUsed]
        .sort((a, b) => b.useCount - a.useCount)
        .slice(0, limit);
    },
    
    clearRecent(): void {
      recentlyUsed.length = 0;
      usageMap.clear();
    },
    
    toJSON() {
      return {
        favorites: Array.from(favorites),
        recentlyUsed: [...recentlyUsed],
      };
    },
    
    fromJSON(data) {
      favorites.clear();
      data.favorites.forEach(id => favorites.add(id));
      recentlyUsed.length = 0;
      recentlyUsed.push(...data.recentlyUsed);
      usageMap.clear();
      for (const entry of recentlyUsed) {
        usageMap.set(`${entry.cardId}:${entry.presetId}`, entry);
      }
    },
  };
}

// ============================================================================
// CARD STACK VISUALIZATION (5.0.5.7)
// ============================================================================

/**
 * Card stack layout type.
 */
export type CardStackLayout = 'vertical' | 'horizontal' | 'stacked' | 'grid';

/**
 * Card stack item.
 */
export interface CardStackItem {
  /** Card ID */
  readonly cardId: string;
  /** Card visuals */
  readonly visuals: CardVisuals;
  /** Card name */
  readonly name: string;
  /** Position in stack (0-based) */
  readonly index: number;
  /** Whether card is expanded */
  expanded: boolean;
  /** Whether card is selected */
  selected: boolean;
}

/**
 * Card stack configuration.
 */
export interface CardStackConfig {
  /** Layout type */
  readonly layout: CardStackLayout;
  /** Spacing between cards (pixels) */
  readonly spacing: number;
  /** Overlap amount for stacked layout (pixels) */
  readonly overlap: number;
  /** Maximum visible cards (for stacked) */
  readonly maxVisible: number;
  /** Animation duration (ms) */
  readonly animationDuration: number;
  /** Allow reordering via drag */
  readonly allowReorder: boolean;
  /** Show connection indicators */
  readonly showConnections: boolean;
}

/**
 * Default stack config for serial (vertical) layout.
 */
export const SERIAL_STACK_CONFIG: CardStackConfig = {
  layout: 'vertical',
  spacing: 8,
  overlap: 0,
  maxVisible: 10,
  animationDuration: 200,
  allowReorder: true,
  showConnections: true,
};

/**
 * Default stack config for parallel (horizontal) layout.
 */
export const PARALLEL_STACK_CONFIG: CardStackConfig = {
  layout: 'horizontal',
  spacing: 16,
  overlap: 0,
  maxVisible: 8,
  animationDuration: 200,
  allowReorder: true,
  showConnections: true,
};

/**
 * Default stack config for layered (stacked) layout.
 */
export const LAYERED_STACK_CONFIG: CardStackConfig = {
  layout: 'stacked',
  spacing: 0,
  overlap: 40,
  maxVisible: 5,
  animationDuration: 300,
  allowReorder: true,
  showConnections: false,
};

/**
 * Calculate positions for cards in a stack.
 */
export function calculateStackPositions(
  items: readonly CardStackItem[],
  config: CardStackConfig,
  containerWidth: number,
  containerHeight: number,
  cardWidth: number,
  cardHeight: number
): { cardId: string; x: number; y: number; z: number; scale: number; opacity: number }[] {
  const positions: { cardId: string; x: number; y: number; z: number; scale: number; opacity: number }[] = [];
  
  switch (config.layout) {
    case 'vertical':
      // Serial processing: cards stacked vertically
      items.forEach((item, i) => {
        positions.push({
          cardId: item.cardId,
          x: (containerWidth - cardWidth) / 2,
          y: i * (cardHeight + config.spacing),
          z: 0,
          scale: 1,
          opacity: 1,
        });
      });
      break;
      
    case 'horizontal':
      // Parallel processing: cards side by side
      const totalWidth = items.length * cardWidth + (items.length - 1) * config.spacing;
      const startX = Math.max(0, (containerWidth - totalWidth) / 2);
      items.forEach((item, i) => {
        positions.push({
          cardId: item.cardId,
          x: startX + i * (cardWidth + config.spacing),
          y: (containerHeight - cardHeight) / 2,
          z: 0,
          scale: 1,
          opacity: 1,
        });
      });
      break;
      
    case 'stacked':
      // Layered: cards overlapping like a deck
      const visibleItems = items.slice(0, config.maxVisible);
      visibleItems.forEach((item, i) => {
        const reverseIndex = visibleItems.length - 1 - i;
        positions.push({
          cardId: item.cardId,
          x: (containerWidth - cardWidth) / 2 + i * 10,
          y: (containerHeight - cardHeight) / 2 + i * config.overlap,
          z: i,
          scale: 1 - reverseIndex * 0.02,
          opacity: 1 - reverseIndex * 0.1,
        });
      });
      break;
      
    case 'grid':
      // Grid layout
      const cols = Math.ceil(Math.sqrt(items.length));
      items.forEach((item, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions.push({
          cardId: item.cardId,
          x: col * (cardWidth + config.spacing),
          y: row * (cardHeight + config.spacing),
          z: 0,
          scale: 1,
          opacity: 1,
        });
      });
      break;
  }
  
  return positions;
}

/**
 * Generate CSS for card stack.
 */
export function generateCardStackCSS(config: CardStackConfig): string {
  return `
.card-stack {
  position: relative;
  display: flex;
  flex-direction: ${config.layout === 'horizontal' ? 'row' : 'column'};
  gap: ${config.spacing}px;
  ${config.layout === 'stacked' ? 'position: relative;' : ''}
}

.card-stack-item {
  transition: transform ${config.animationDuration}ms ease, 
              opacity ${config.animationDuration}ms ease;
  ${config.layout === 'stacked' ? `
  position: absolute;
  ` : ''}
}

.card-stack-item.dragging {
  opacity: 0.8;
  z-index: 1000;
  cursor: grabbing;
}

.card-stack-connection {
  position: absolute;
  pointer-events: none;
}

.card-stack-connection-line {
  stroke: #4CAF50;
  stroke-width: 2;
  fill: none;
}

.card-stack-connection-arrow {
  fill: #4CAF50;
}
`;
}

/**
 * Render card stack connection lines (SVG paths).
 */
export function renderStackConnections(
  positions: { cardId: string; x: number; y: number }[],
  cardWidth: number,
  cardHeight: number,
  layout: CardStackLayout
): string {
  if (positions.length < 2) return '';
  
  const paths: string[] = [];
  
  for (let i = 0; i < positions.length - 1; i++) {
    const from = positions[i];
    const to = positions[i + 1];
    if (!from || !to) continue;
    
    let x1: number, y1: number, x2: number, y2: number;
    
    if (layout === 'vertical') {
      // Connect bottom of card to top of next
      x1 = from.x + cardWidth / 2;
      y1 = from.y + cardHeight;
      x2 = to.x + cardWidth / 2;
      y2 = to.y;
    } else {
      // Connect right of card to left of next
      x1 = from.x + cardWidth;
      y1 = from.y + cardHeight / 2;
      x2 = to.x;
      y2 = to.y + cardHeight / 2;
    }
    
    // Bezier curve
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    paths.push(`<path class="card-stack-connection-line" d="M${x1},${y1} Q${midX},${y1} ${midX},${midY} Q${midX},${y2} ${x2},${y2}"/>`);
    
    // Arrow at end
    const arrowSize = 6;
    if (layout === 'vertical') {
      paths.push(`<polygon class="card-stack-connection-arrow" points="${x2},${y2} ${x2 - arrowSize},${y2 - arrowSize} ${x2 + arrowSize},${y2 - arrowSize}"/>`);
    } else {
      paths.push(`<polygon class="card-stack-connection-arrow" points="${x2},${y2} ${x2 - arrowSize},${y2 - arrowSize} ${x2 - arrowSize},${y2 + arrowSize}"/>`);
    }
  }
  
  return `<svg class="card-stack-connection" width="100%" height="100%">${paths.join('')}</svg>`;
}
