/**
 * @fileoverview Deck Layout System
 * 
 * Provides flexible deck arrangements for different workflows:
 * - Stack layouts (instruments, effects, MIDI)
 * - Grid layouts for visual arrangement
 * - Tracker-style orchestration
 * - Radial/circular layouts for live performance
 * - User personas with preset configurations
 * 
 * @module @cardplay/core/ui/deck-layouts
 */

import { 
  AudioModuleCategory,
} from '../audio/instrument-cards';

// ============================================================================
// LAYOUT TYPES
// ============================================================================

/** Layout orientation */
export type LayoutOrientation = 'horizontal' | 'vertical' | 'grid' | 'radial' | 'freeform';

/** Stack type for organized groupings */
export type StackType = 
  | 'instrument'   // Sampler, Wavetable, Hybrid instruments
  | 'midi'         // MIDI processors (arp, chord, sequencer)
  | 'effect'       // Audio effects
  | 'routing'      // Routing/mixing cards
  | 'generator'    // Algorithmic generators
  | 'analysis'     // Meters, visualizers
  | 'utility'      // Utilities (clock, transport)
  | 'custom';      // User-defined

/** Stack configuration */
export interface StackConfig {
  id: string;
  name: string;
  type: StackType;
  orientation: 'horizontal' | 'vertical';
  maxCards: number;
  collapsible: boolean;
  defaultCollapsed: boolean;
  acceptsTypes: AudioModuleCategory[];
  color: string;
  icon: string;
}

/** Card position in layout */
export interface CardPosition {
  cardId: string;
  stackId: string | null;  // null = freeform
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  scale: number;
  pinned: boolean;
}

/**
 * Port reference in a connection (Change 206: direction + type model).
 */
export interface ConnectionPortRef {
  direction: 'in' | 'out';
  type: 'audio' | 'midi' | 'notes' | 'control' | 'trigger' | 'gate' | 'clock' | 'transport' | 'modulation';
}

/**
 * Connection between cards.
 *
 * Change 206: sourcePort/targetPort now accept both the legacy string format
 * ('midi_out') and the new { direction, type } model. Prefer the new model
 * for new code.
 */
export interface CardConnection {
  id: string;
  sourceCardId: string;
  sourcePort: string | ConnectionPortRef;
  targetCardId: string;
  targetPort: string | ConnectionPortRef;
  connectionType: 'midi' | 'audio' | 'modulation' | 'trigger';
  color: string;
  visible: boolean;
}

/**
 * Change 206: Normalize a port reference to the new model.
 */
export function normalizeConnectionPort(port: string | ConnectionPortRef): ConnectionPortRef {
  if (typeof port !== 'string') return port;
  const parts = port.split('_');
  if (parts.length === 2 && parts[0] && parts[1] && (parts[1] === 'in' || parts[1] === 'out')) {
    const typeMap: Record<string, ConnectionPortRef['type']> = {
      'audio': 'audio',
      'midi': 'midi',
      'mod': 'modulation',
      'trigger': 'trigger',
    };
    return {
      direction: parts[1] as 'in' | 'out',
      type: typeMap[parts[0]] ?? 'control',
    };
  }
  return { direction: 'in', type: 'control' };
}

/** Zone definition for drag-drop */
export interface LayoutZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  acceptsTypes: AudioModuleCategory[];
  maxCards: number;
  stackId: string | null;
}

/** Complete layout configuration */
export interface DeckLayout {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  orientation: LayoutOrientation;
  
  // Dimensions
  width: number;
  height: number;
  padding: number;
  
  // Stacks
  stacks: StackConfig[];
  
  // Zones
  zones: LayoutZone[];
  
  // Connections
  defaultConnections: Omit<CardConnection, 'id'>[];
  
  // Visual
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showConnections: boolean;
  connectionStyle: 'straight' | 'curved' | 'stepped';
  
  // Behavior
  allowFreeform: boolean;
  autoArrange: boolean;
  lockPositions: boolean;
}

// ============================================================================
// LAYOUT PRESETS
// ============================================================================

/** User persona for targeted presets */
export type UserPersona =
  | 'beginner'
  | 'traditional_composer'
  | 'live_coder'
  | 'hip_hop_producer'
  | 'edm_producer'
  | 'xenharmonicist'
  | 'sound_designer'
  | 'film_composer'
  | 'jazz_musician'
  | 'world_music'
  | 'ambient_artist'
  | 'game_audio'
  | 'educator'
  | 'dj_performer'
  | 'renoise_user'
  | 'ableton_user'
  | 'cubase_user'
  | 'dorico_user';

/** Layout preset with persona */
export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  persona: UserPersona;
  tags: string[];
  layout: DeckLayout;
  defaultCards: CardTemplate[];
  quickActions: QuickAction[];
  tutorialId?: string;
}

/** Card template for presets */
export interface CardTemplate {
  type: AudioModuleCategory;
  subtype?: string;
  name: string;
  stackId: string;
  position?: number;
  presetId?: string;
  connections?: { targetIndex: number; type: 'midi' | 'audio' }[];
}

/** Quick action for layout */
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: 'add_card' | 'toggle_stack' | 'reset_layout' | 'save_snapshot' | 'custom';
  params?: Record<string, unknown>;
}

// ============================================================================
// PREDEFINED STACKS
// ============================================================================

/** Standard instrument stack */
export const INSTRUMENT_STACK: StackConfig = {
  id: 'instruments',
  name: 'Instruments',
  type: 'instrument',
  orientation: 'vertical',
  maxCards: 8,
  collapsible: true,
  defaultCollapsed: false,
  acceptsTypes: ['sampler', 'wavetable', 'hybrid'],
  color: '#6366f1',
  icon: 'piano',
};

/** Standard MIDI stack */
export const MIDI_STACK: StackConfig = {
  id: 'midi',
  name: 'MIDI',
  type: 'midi',
  orientation: 'vertical',
  maxCards: 8,
  collapsible: true,
  defaultCollapsed: false,
  acceptsTypes: ['midi'],
  color: '#22c55e',
  icon: 'music-note',
};

/** Standard effects stack */
export const EFFECTS_STACK: StackConfig = {
  id: 'effects',
  name: 'Effects',
  type: 'effect',
  orientation: 'horizontal',
  maxCards: 12,
  collapsible: true,
  defaultCollapsed: false,
  acceptsTypes: ['effect'],
  color: '#f59e0b',
  icon: 'sparkles',
};

/** Routing/mixer stack */
export const ROUTING_STACK: StackConfig = {
  id: 'routing',
  name: 'Routing',
  type: 'routing',
  orientation: 'vertical',
  maxCards: 4,
  collapsible: true,
  defaultCollapsed: true,
  acceptsTypes: ['utility'],
  color: '#ec4899',
  icon: 'arrows-split',
};

/** Analysis stack */
export const ANALYSIS_STACK: StackConfig = {
  id: 'analysis',
  name: 'Analysis',
  type: 'analysis',
  orientation: 'horizontal',
  maxCards: 4,
  collapsible: true,
  defaultCollapsed: true,
  acceptsTypes: ['utility'],
  color: '#06b6d4',
  icon: 'chart-bar',
};

// ============================================================================
// LAYOUT PRESETS BY PERSONA
// ============================================================================

/**
 * BEGINNER LAYOUT
 * Simple, clear layout with minimal options
 */
export const BEGINNER_LAYOUT: LayoutPreset = {
  id: 'beginner_simple',
  name: 'Simple Start',
  description: 'A clean, simple layout for learning. One instrument, one pattern, no distractions.',
  persona: 'beginner',
  tags: ['simple', 'learning', 'minimal'],
  layout: {
    id: 'beginner_layout',
    name: 'Beginner Layout',
    description: 'Simple two-column layout',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'horizontal',
    width: 800,
    height: 600,
    padding: 16,
    stacks: [
      { ...INSTRUMENT_STACK, maxCards: 2, name: 'Sound' },
      { ...MIDI_STACK, maxCards: 2, name: 'Pattern' },
    ],
    zones: [
      { id: 'main', name: 'Main', x: 0, y: 0, width: 800, height: 600, acceptsTypes: ['sampler', 'wavetable', 'hybrid', 'midi'], maxCards: 4, stackId: null },
    ],
    defaultConnections: [
      { sourceCardId: 'pattern1', sourcePort: { direction: 'out', type: 'midi' }, targetCardId: 'instrument1', targetPort: { direction: 'in', type: 'midi' }, connectionType: 'midi', color: '#22c55e', visible: true },
    ],
    showGrid: false,
    gridSize: 20,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'curved',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'wavetable', name: 'Synth', stackId: 'instruments', presetId: 'init_saw' },
    { type: 'midi', subtype: 'sequencer', name: 'Pattern', stackId: 'midi', connections: [{ targetIndex: 0, type: 'midi' }] },
  ],
  quickActions: [
    { id: 'play', label: 'Play', icon: 'play', action: 'custom', params: { command: 'transport.play' } },
    { id: 'add_sound', label: 'Add Sound', icon: 'plus', action: 'add_card', params: { type: 'wavetable' } },
  ],
  tutorialId: 'beginner_first_beat',
};

/**
 * TRADITIONAL COMPOSER LAYOUT
 * Score-focused with orchestral instrument stacks
 */
export const TRADITIONAL_COMPOSER_LAYOUT: LayoutPreset = {
  id: 'traditional_composer',
  name: 'Orchestral Score',
  description: 'Multi-staff arrangement with instrument families grouped by section.',
  persona: 'traditional_composer',
  tags: ['orchestral', 'score', 'notation', 'classical'],
  layout: {
    id: 'orchestral_layout',
    name: 'Orchestral Layout',
    description: 'Instrument families arranged like orchestral score',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'vertical',
    width: 1200,
    height: 900,
    padding: 12,
    stacks: [
      { id: 'woodwinds', name: 'Woodwinds', type: 'instrument', orientation: 'horizontal', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler', 'wavetable'], color: '#84cc16', icon: 'wind' },
      { id: 'brass', name: 'Brass', type: 'instrument', orientation: 'horizontal', maxCards: 6, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler', 'wavetable'], color: '#f59e0b', icon: 'trumpet' },
      { id: 'percussion', name: 'Percussion', type: 'instrument', orientation: 'horizontal', maxCards: 6, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler'], color: '#ef4444', icon: 'drum' },
      { id: 'strings', name: 'Strings', type: 'instrument', orientation: 'horizontal', maxCards: 10, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler', 'wavetable'], color: '#8b5cf6', icon: 'violin' },
      { id: 'score', name: 'Score', type: 'midi', orientation: 'vertical', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#06b6d4', icon: 'music' },
    ],
    zones: [],
    defaultConnections: [],
    showGrid: true,
    gridSize: 16,
    snapToGrid: true,
    showConnections: false,
    connectionStyle: 'straight',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    // Woodwinds
    { type: 'sampler', name: 'Flute', stackId: 'woodwinds' },
    { type: 'sampler', name: 'Oboe', stackId: 'woodwinds' },
    { type: 'sampler', name: 'Clarinet', stackId: 'woodwinds' },
    { type: 'sampler', name: 'Bassoon', stackId: 'woodwinds' },
    // Brass
    { type: 'sampler', name: 'French Horn', stackId: 'brass' },
    { type: 'sampler', name: 'Trumpet', stackId: 'brass' },
    { type: 'sampler', name: 'Trombone', stackId: 'brass' },
    // Strings
    { type: 'sampler', name: 'Violin I', stackId: 'strings' },
    { type: 'sampler', name: 'Violin II', stackId: 'strings' },
    { type: 'sampler', name: 'Viola', stackId: 'strings' },
    { type: 'sampler', name: 'Cello', stackId: 'strings' },
    { type: 'sampler', name: 'Bass', stackId: 'strings' },
    // Percussion
    { type: 'sampler', name: 'Timpani', stackId: 'percussion' },
    // Score
    { type: 'midi', subtype: 'tracker', name: 'Score', stackId: 'score' },
  ],
  quickActions: [
    { id: 'add_staff', label: 'Add Staff', icon: 'plus', action: 'add_card', params: { type: 'sampler' } },
    { id: 'export_midi', label: 'Export MIDI', icon: 'download', action: 'custom', params: { command: 'export.midi' } },
    { id: 'export_pdf', label: 'Export PDF', icon: 'file', action: 'custom', params: { command: 'export.score_pdf' } },
  ],
};

/**
 * LIVE CODER LAYOUT
 * Code-centric with multiple script cards and real-time feedback
 */
export const LIVE_CODER_LAYOUT: LayoutPreset = {
  id: 'live_coder',
  name: 'Live Code',
  description: 'Code editors front and center with instant audio feedback. Perfect for algorithmic composition.',
  persona: 'live_coder',
  tags: ['code', 'algorithmic', 'live', 'supercollider', 'tidal'],
  layout: {
    id: 'livecode_layout',
    name: 'Live Coding Layout',
    description: 'Code-first with visualizers',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1400,
    height: 900,
    padding: 8,
    stacks: [
      { id: 'code', name: 'Code', type: 'generator', orientation: 'vertical', maxCards: 4, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi', 'utility'], color: '#22c55e', icon: 'code' },
      { id: 'synths', name: 'Synths', type: 'instrument', orientation: 'horizontal', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'hybrid'], color: '#6366f1', icon: 'waveform' },
      { id: 'visuals', name: 'Visuals', type: 'analysis', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#f59e0b', icon: 'eye' },
      { id: 'console', name: 'Console', type: 'utility', orientation: 'vertical', maxCards: 2, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#64748b', icon: 'terminal' },
    ],
    zones: [
      { id: 'code_zone', name: 'Code', x: 0, y: 0, width: 700, height: 600, acceptsTypes: ['midi', 'utility'], maxCards: 4, stackId: 'code' },
      { id: 'synth_zone', name: 'Synths', x: 700, y: 0, width: 700, height: 300, acceptsTypes: ['wavetable', 'hybrid'], maxCards: 8, stackId: 'synths' },
      { id: 'visual_zone', name: 'Visuals', x: 700, y: 300, width: 700, height: 300, acceptsTypes: ['utility'], maxCards: 4, stackId: 'visuals' },
    ],
    defaultConnections: [],
    showGrid: true,
    gridSize: 8,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'stepped',
    allowFreeform: true,
    autoArrange: false,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'midi', subtype: 'script', name: 'Pattern 1', stackId: 'code' },
    { type: 'midi', subtype: 'script', name: 'Pattern 2', stackId: 'code' },
    { type: 'wavetable', name: 'Synth A', stackId: 'synths' },
    { type: 'wavetable', name: 'Synth B', stackId: 'synths' },
    { type: 'utility', subtype: 'scope', name: 'Scope', stackId: 'visuals' },
    { type: 'utility', subtype: 'spectrum', name: 'FFT', stackId: 'visuals' },
  ],
  quickActions: [
    { id: 'eval', label: 'Eval (Ctrl+Enter)', icon: 'play', action: 'custom', params: { command: 'code.eval_block' } },
    { id: 'stop', label: 'Hush', icon: 'stop', action: 'custom', params: { command: 'code.hush' } },
    { id: 'new_pattern', label: 'New Pattern', icon: 'plus', action: 'add_card', params: { type: 'midi', subtype: 'script' } },
  ],
};

/**
 * HIP-HOP PRODUCER LAYOUT
 * Drum machine, sampler, and arrangement focused
 */
export const HIP_HOP_LAYOUT: LayoutPreset = {
  id: 'hip_hop_producer',
  name: 'Beat Lab',
  description: 'MPC-style layout with drum pads, sampler, and arrangement view.',
  persona: 'hip_hop_producer',
  tags: ['beats', 'sampling', 'drums', 'mpc', 'lofi'],
  layout: {
    id: 'hiphop_layout',
    name: 'Hip-Hop Layout',
    description: 'Drum-centric with sampler',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1200,
    height: 800,
    padding: 12,
    stacks: [
      { id: 'drums', name: 'Drums', type: 'instrument', orientation: 'horizontal', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['sampler'], color: '#ef4444', icon: 'drum' },
      { id: 'samples', name: 'Samples', type: 'instrument', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler'], color: '#f59e0b', icon: 'vinyl' },
      { id: 'bass', name: 'Bass', type: 'instrument', orientation: 'horizontal', maxCards: 2, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'sampler'], color: '#8b5cf6', icon: 'speaker' },
      { id: 'pattern', name: 'Pattern', type: 'midi', orientation: 'horizontal', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#22c55e', icon: 'grid' },
      { id: 'fx', name: 'FX', type: 'effect', orientation: 'horizontal', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#06b6d4', icon: 'sparkles' },
    ],
    zones: [],
    defaultConnections: [],
    showGrid: true,
    gridSize: 16,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'curved',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'sampler', subtype: 'drum_machine', name: 'Drums', stackId: 'drums', presetId: 'boom_bap_kit' },
    { type: 'sampler', name: 'Chops', stackId: 'samples' },
    { type: 'wavetable', name: '808 Bass', stackId: 'bass', presetId: '808_sub' },
    { type: 'midi', subtype: 'sequencer', name: 'Beat', stackId: 'pattern' },
    { type: 'effect', subtype: 'vinyl', name: 'Lo-Fi', stackId: 'fx' },
    { type: 'effect', subtype: 'compressor', name: 'Glue', stackId: 'fx' },
  ],
  quickActions: [
    { id: 'tap_tempo', label: 'Tap Tempo', icon: 'metronome', action: 'custom', params: { command: 'transport.tap_tempo' } },
    { id: 'chop', label: 'Chop Sample', icon: 'scissors', action: 'custom', params: { command: 'sampler.chop' } },
    { id: 'bounce', label: 'Bounce Stems', icon: 'download', action: 'custom', params: { command: 'export.stems' } },
  ],
};

/**
 * XENHARMONICIST LAYOUT
 * Microtonal scale exploration with specialized tuning controls
 */
export const XENHARMONIC_LAYOUT: LayoutPreset = {
  id: 'xenharmonic',
  name: 'Microtonal Lab',
  description: 'Advanced tuning systems, scala file support, and pitch visualization for xenharmonic exploration.',
  persona: 'xenharmonicist',
  tags: ['microtonal', 'xenharmonic', 'tuning', 'scala', 'just-intonation', '31edo', '19edo'],
  layout: {
    id: 'xen_layout',
    name: 'Xenharmonic Layout',
    description: 'Tuning-focused with pitch visualization',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1400,
    height: 900,
    padding: 10,
    stacks: [
      { id: 'tuning', name: 'Tuning', type: 'utility', orientation: 'vertical', maxCards: 4, collapsible: false, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#f59e0b', icon: 'tuning-fork' },
      { id: 'instruments', name: 'Instruments', type: 'instrument', orientation: 'vertical', maxCards: 6, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'sampler'], color: '#6366f1', icon: 'piano' },
      { id: 'pitch_viz', name: 'Pitch Analysis', type: 'analysis', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#22c55e', icon: 'chart' },
      { id: 'keyboard', name: 'Keyboard', type: 'midi', orientation: 'horizontal', maxCards: 2, collapsible: true, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#ec4899', icon: 'keyboard' },
    ],
    zones: [],
    defaultConnections: [],
    showGrid: true,
    gridSize: 12,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'curved',
    allowFreeform: true,
    autoArrange: false,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'utility', subtype: 'tuning_editor', name: 'Scale Editor', stackId: 'tuning' },
    { type: 'utility', subtype: 'scala_browser', name: 'Scala Browser', stackId: 'tuning' },
    { type: 'wavetable', name: 'Microsynth', stackId: 'instruments', presetId: 'microtonal_pad' },
    { type: 'utility', subtype: 'pitch_constellation', name: 'Pitch Map', stackId: 'pitch_viz' },
    { type: 'utility', subtype: 'cent_deviation', name: 'Cent Display', stackId: 'pitch_viz' },
    { type: 'midi', subtype: 'isomorphic_keyboard', name: 'Lumatone', stackId: 'keyboard' },
  ],
  quickActions: [
    { id: 'load_scala', label: 'Load .scl', icon: 'folder-open', action: 'custom', params: { command: 'tuning.load_scala' } },
    { id: 'edo_gen', label: 'Generate EDO', icon: 'calculator', action: 'custom', params: { command: 'tuning.generate_edo' } },
    { id: 'ji_lattice', label: 'JI Lattice', icon: 'grid', action: 'custom', params: { command: 'tuning.show_lattice' } },
  ],
};

/**
 * EDM PRODUCER LAYOUT
 * Drop-focused with heavy effects and sidechaining
 */
export const EDM_LAYOUT: LayoutPreset = {
  id: 'edm_producer',
  name: 'Drop Factory',
  description: 'High-energy layout with sidechain routing, risers, and drop automation.',
  persona: 'edm_producer',
  tags: ['edm', 'dubstep', 'house', 'drops', 'sidechain'],
  layout: {
    id: 'edm_layout',
    name: 'EDM Layout',
    description: 'Drop and effects focused',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1400,
    height: 900,
    padding: 8,
    stacks: [
      { id: 'leads', name: 'Leads', type: 'instrument', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'hybrid'], color: '#f59e0b', icon: 'bolt' },
      { id: 'bass', name: 'Bass', type: 'instrument', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'hybrid'], color: '#8b5cf6', icon: 'speaker' },
      { id: 'drums', name: 'Drums', type: 'instrument', orientation: 'horizontal', maxCards: 2, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler'], color: '#ef4444', icon: 'drum' },
      { id: 'fx_chain', name: 'FX Chain', type: 'effect', orientation: 'horizontal', maxCards: 12, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#06b6d4', icon: 'sparkles' },
      { id: 'risers', name: 'Risers', type: 'utility', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility', 'effect'], color: '#22c55e', icon: 'arrow-up' },
      { id: 'sidechain', name: 'Sidechain', type: 'routing', orientation: 'vertical', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect', 'utility'], color: '#ec4899', icon: 'link' },
    ],
    zones: [],
    defaultConnections: [],
    showGrid: true,
    gridSize: 16,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'curved',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'wavetable', name: 'Supersaw Lead', stackId: 'leads', presetId: 'supersaw' },
    { type: 'wavetable', name: 'Pluck Lead', stackId: 'leads', presetId: 'pluck' },
    { type: 'hybrid', name: 'Growl Bass', stackId: 'bass', presetId: 'growl' },
    { type: 'hybrid', name: 'Sub Bass', stackId: 'bass', presetId: 'sub' },
    { type: 'sampler', subtype: 'drum_machine', name: 'Drums', stackId: 'drums', presetId: 'edm_kit' },
    { type: 'effect', subtype: 'sidechain', name: 'Pump', stackId: 'sidechain' },
    { type: 'effect', subtype: 'distortion', name: 'Dirt', stackId: 'fx_chain' },
    { type: 'effect', subtype: 'multiband_comp', name: 'OTT', stackId: 'fx_chain' },
  ],
  quickActions: [
    { id: 'add_riser', label: 'Add Riser', icon: 'arrow-up', action: 'add_card', params: { type: 'utility', subtype: 'riser' } },
    { id: 'sidechain_all', label: 'Sidechain All', icon: 'link', action: 'custom', params: { command: 'routing.sidechain_all' } },
    { id: 'bounce_drop', label: 'Bounce Drop', icon: 'download', action: 'custom', params: { command: 'export.selection' } },
  ],
};

/**
 * SOUND DESIGNER LAYOUT
 * Deep synthesis exploration with modulation routing
 */
export const SOUND_DESIGNER_LAYOUT: LayoutPreset = {
  id: 'sound_designer',
  name: 'Synthesis Lab',
  description: 'Deep-dive into synthesis with comprehensive modulation routing and analysis.',
  persona: 'sound_designer',
  tags: ['synthesis', 'sound-design', 'modulation', 'wavetable', 'granular'],
  layout: {
    id: 'sounddesign_layout',
    name: 'Sound Design Layout',
    description: 'Synthesis exploration with routing',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'freeform',
    width: 1600,
    height: 1000,
    padding: 8,
    stacks: [
      { id: 'oscillators', name: 'Oscillators', type: 'instrument', orientation: 'vertical', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'hybrid'], color: '#6366f1', icon: 'sine-wave' },
      { id: 'modulators', name: 'Modulators', type: 'midi', orientation: 'vertical', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['midi', 'utility'], color: '#22c55e', icon: 'wave' },
      { id: 'filters', name: 'Filters', type: 'effect', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#f59e0b', icon: 'filter' },
      { id: 'fx', name: 'Effects', type: 'effect', orientation: 'horizontal', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#ec4899', icon: 'sparkles' },
      { id: 'analysis', name: 'Analysis', type: 'analysis', orientation: 'horizontal', maxCards: 6, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#06b6d4', icon: 'chart' },
      { id: 'routing', name: 'Mod Matrix', type: 'routing', orientation: 'vertical', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#8b5cf6', icon: 'circuit' },
    ],
    zones: [],
    defaultConnections: [],
    showGrid: true,
    gridSize: 8,
    snapToGrid: false,
    showConnections: true,
    connectionStyle: 'curved',
    allowFreeform: true,
    autoArrange: false,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'wavetable', name: 'Osc A', stackId: 'oscillators' },
    { type: 'wavetable', name: 'Osc B', stackId: 'oscillators' },
    { type: 'midi', subtype: 'lfo', name: 'LFO 1', stackId: 'modulators' },
    { type: 'midi', subtype: 'envelope', name: 'Env 1', stackId: 'modulators' },
    { type: 'midi', subtype: 'random', name: 'S&H', stackId: 'modulators' },
    { type: 'effect', subtype: 'filter', name: 'Filter', stackId: 'filters' },
    { type: 'utility', subtype: 'mod_matrix', name: 'Mod Matrix', stackId: 'routing' },
    { type: 'utility', subtype: 'oscilloscope', name: 'Scope', stackId: 'analysis' },
    { type: 'utility', subtype: 'spectrum', name: 'Spectrum', stackId: 'analysis' },
  ],
  quickActions: [
    { id: 'add_lfo', label: 'Add LFO', icon: 'wave', action: 'add_card', params: { type: 'midi', subtype: 'lfo' } },
    { id: 'randomize', label: 'Randomize', icon: 'dice', action: 'custom', params: { command: 'preset.randomize' } },
    { id: 'init', label: 'Init Patch', icon: 'refresh', action: 'custom', params: { command: 'preset.init' } },
  ],
};

/**
 * DJ/PERFORMER LAYOUT
 * Radial layout with performance controls
 */
export const DJ_PERFORMER_LAYOUT: LayoutPreset = {
  id: 'dj_performer',
  name: 'Performance Deck',
  description: 'Radial layout optimized for live performance with instant access to all controls.',
  persona: 'dj_performer',
  tags: ['dj', 'live', 'performance', 'radial', 'touchscreen'],
  layout: {
    id: 'dj_layout',
    name: 'DJ Performance Layout',
    description: 'Radial performance optimized',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'radial',
    width: 1000,
    height: 1000,
    padding: 20,
    stacks: [
      { id: 'deck_a', name: 'Deck A', type: 'instrument', orientation: 'vertical', maxCards: 2, collapsible: false, defaultCollapsed: false, acceptsTypes: ['sampler'], color: '#ef4444', icon: 'disc' },
      { id: 'deck_b', name: 'Deck B', type: 'instrument', orientation: 'vertical', maxCards: 2, collapsible: false, defaultCollapsed: false, acceptsTypes: ['sampler'], color: '#3b82f6', icon: 'disc' },
      { id: 'mixer', name: 'Mixer', type: 'routing', orientation: 'horizontal', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#f59e0b', icon: 'sliders' },
      { id: 'fx', name: 'FX', type: 'effect', orientation: 'horizontal', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#22c55e', icon: 'sparkles' },
      { id: 'pads', name: 'Pads', type: 'midi', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['midi', 'sampler'], color: '#8b5cf6', icon: 'grid' },
    ],
    zones: [],
    defaultConnections: [],
    showGrid: false,
    gridSize: 20,
    snapToGrid: false,
    showConnections: false,
    connectionStyle: 'curved',
    allowFreeform: true,
    autoArrange: false,
    lockPositions: true,
  },
  defaultCards: [
    { type: 'sampler', subtype: 'deck', name: 'Deck A', stackId: 'deck_a' },
    { type: 'sampler', subtype: 'deck', name: 'Deck B', stackId: 'deck_b' },
    { type: 'utility', subtype: 'mixer', name: 'Mixer', stackId: 'mixer' },
    { type: 'effect', subtype: 'filter', name: 'Filter', stackId: 'fx' },
    { type: 'effect', subtype: 'echo', name: 'Echo', stackId: 'fx' },
    { type: 'sampler', subtype: 'pads', name: 'Hot Cues', stackId: 'pads' },
  ],
  quickActions: [
    { id: 'sync', label: 'Sync', icon: 'link', action: 'custom', params: { command: 'dj.sync' } },
    { id: 'cue', label: 'Cue', icon: 'headphones', action: 'custom', params: { command: 'dj.cue' } },
    { id: 'crossfade', label: 'X-Fade', icon: 'arrows-horizontal', action: 'custom', params: { command: 'dj.crossfade_toggle' } },
  ],
};

/**
 * AMBIENT ARTIST LAYOUT
 * Long-form generative with texture layering
 */
export const AMBIENT_LAYOUT: LayoutPreset = {
  id: 'ambient_artist',
  name: 'Texture Canvas',
  description: 'Generative and textural sound design with long-form arrangement tools.',
  persona: 'ambient_artist',
  tags: ['ambient', 'drone', 'texture', 'generative', 'meditation'],
  layout: {
    id: 'ambient_layout',
    name: 'Ambient Layout',
    description: 'Layered textures with generative',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'vertical',
    width: 1200,
    height: 900,
    padding: 16,
    stacks: [
      { id: 'drones', name: 'Drones', type: 'instrument', orientation: 'horizontal', maxCards: 6, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'hybrid'], color: '#6366f1', icon: 'cloud' },
      { id: 'textures', name: 'Textures', type: 'instrument', orientation: 'horizontal', maxCards: 6, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler', 'hybrid'], color: '#22c55e', icon: 'leaf' },
      { id: 'generators', name: 'Generative', type: 'midi', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#f59e0b', icon: 'infinity' },
      { id: 'space', name: 'Space', type: 'effect', orientation: 'horizontal', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#8b5cf6', icon: 'star' },
      { id: 'time', name: 'Time', type: 'effect', orientation: 'horizontal', maxCards: 4, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#06b6d4', icon: 'clock' },
    ],
    zones: [],
    defaultConnections: [],
    showGrid: false,
    gridSize: 20,
    snapToGrid: false,
    showConnections: true,
    connectionStyle: 'curved',
    allowFreeform: true,
    autoArrange: false,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'wavetable', name: 'Pad 1', stackId: 'drones', presetId: 'evolving_pad' },
    { type: 'wavetable', name: 'Pad 2', stackId: 'drones', presetId: 'shimmer_pad' },
    { type: 'hybrid', name: 'Granular', stackId: 'textures', presetId: 'grain_cloud' },
    { type: 'midi', subtype: 'generative', name: 'Eno Machine', stackId: 'generators' },
    { type: 'effect', subtype: 'reverb', name: 'Hall', stackId: 'space', presetId: 'infinite_hall' },
    { type: 'effect', subtype: 'delay', name: 'Tape Echo', stackId: 'time', presetId: 'tape_delay' },
  ],
  quickActions: [
    { id: 'fade_in', label: 'Fade In', icon: 'arrow-up', action: 'custom', params: { command: 'automation.fade_in' } },
    { id: 'freeze', label: 'Freeze', icon: 'snowflake', action: 'custom', params: { command: 'effect.freeze' } },
    { id: 'evolve', label: 'Auto-Evolve', icon: 'infinity', action: 'custom', params: { command: 'generative.evolve' } },
  ],
};

/**
 * TRACKER ORCHESTRATION LAYOUT
 * Single tracker controlling multiple instrument stacks
 */
export const TRACKER_ORCHESTRATION_LAYOUT: LayoutPreset = {
  id: 'tracker_orchestration',
  name: 'Tracker Orchestra',
  description: 'Classic tracker interface controlling multiple instrument and phrase stacks.',
  persona: 'traditional_composer',
  tags: ['tracker', 'orchestration', 'modular', 'pattern'],
  layout: {
    id: 'tracker_layout',
    name: 'Tracker Orchestration Layout',
    description: 'Tracker-centric with instrument stacks',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1600,
    height: 1000,
    padding: 8,
    stacks: [
      { id: 'tracker', name: 'Tracker', type: 'midi', orientation: 'vertical', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#22c55e', icon: 'table' },
      { id: 'phrases', name: 'Phrases', type: 'midi', orientation: 'vertical', maxCards: 16, collapsible: true, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#f59e0b', icon: 'music-note' },
      { id: 'instruments', name: 'Instruments', type: 'instrument', orientation: 'vertical', maxCards: 16, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler', 'wavetable', 'hybrid'], color: '#6366f1', icon: 'piano' },
      { id: 'fx_bus', name: 'FX Bus', type: 'effect', orientation: 'horizontal', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#ec4899', icon: 'sparkles' },
      { id: 'master', name: 'Master', type: 'routing', orientation: 'vertical', maxCards: 2, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility', 'effect'], color: '#64748b', icon: 'sliders' },
    ],
    zones: [
      { id: 'tracker_zone', name: 'Tracker', x: 0, y: 0, width: 600, height: 800, acceptsTypes: ['midi'], maxCards: 1, stackId: 'tracker' },
      { id: 'phrase_zone', name: 'Phrases', x: 600, y: 0, width: 300, height: 800, acceptsTypes: ['midi'], maxCards: 16, stackId: 'phrases' },
      { id: 'inst_zone', name: 'Instruments', x: 900, y: 0, width: 300, height: 800, acceptsTypes: ['sampler', 'wavetable', 'hybrid'], maxCards: 16, stackId: 'instruments' },
      { id: 'fx_zone', name: 'FX', x: 1200, y: 0, width: 400, height: 400, acceptsTypes: ['effect'], maxCards: 8, stackId: 'fx_bus' },
      { id: 'master_zone', name: 'Master', x: 1200, y: 400, width: 400, height: 400, acceptsTypes: ['utility', 'effect'], maxCards: 2, stackId: 'master' },
    ],
    defaultConnections: [],
    showGrid: true,
    gridSize: 8,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'stepped',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'midi', subtype: 'tracker', name: 'Main Tracker', stackId: 'tracker' },
    { type: 'midi', subtype: 'phrase', name: 'Phrase 00', stackId: 'phrases' },
    { type: 'midi', subtype: 'phrase', name: 'Phrase 01', stackId: 'phrases' },
    { type: 'midi', subtype: 'phrase', name: 'Phrase 02', stackId: 'phrases' },
    { type: 'wavetable', name: 'Lead', stackId: 'instruments' },
    { type: 'wavetable', name: 'Bass', stackId: 'instruments' },
    { type: 'sampler', name: 'Drums', stackId: 'instruments' },
    { type: 'effect', subtype: 'reverb', name: 'Reverb', stackId: 'fx_bus' },
    { type: 'effect', subtype: 'compressor', name: 'Master Comp', stackId: 'master' },
  ],
  quickActions: [
    { id: 'new_phrase', label: 'New Phrase', icon: 'plus', action: 'add_card', params: { type: 'midi', subtype: 'phrase', stackId: 'phrases' } },
    { id: 'clone_phrase', label: 'Clone Phrase', icon: 'copy', action: 'custom', params: { command: 'tracker.clone_phrase' } },
    { id: 'export_mod', label: 'Export .MOD', icon: 'download', action: 'custom', params: { command: 'export.mod' } },
  ],
};

// ============================================================================
// DAW-NATIVE LAYOUTS
// ============================================================================

/**
 * RENOISE USER LAYOUT
 * Tracker-centric with pattern matrix, phrase editor, and instrument list
 * Mirrors Renoise workflow: vertical tracks, hex editing, sample-based instruments
 */
export const RENOISE_LAYOUT: LayoutPreset = {
  id: 'renoise_native',
  name: 'Renoise Style',
  description: 'Classic tracker workflow with pattern matrix, phrase editor, and sample instruments. Hex editing, vertical tracks, keyboard-driven.',
  persona: 'renoise_user',
  tags: ['tracker', 'renoise', 'pattern', 'hex', 'keyboard', 'sample'],
  layout: {
    id: 'renoise_layout',
    name: 'Renoise Native Layout',
    description: 'Tracker workflow mirroring Renoise',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1800,
    height: 1000,
    padding: 4,
    stacks: [
      { id: 'pattern_matrix', name: 'Pattern Matrix', type: 'midi', orientation: 'vertical', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#1a1a2e', icon: 'grid' },
      { id: 'pattern_editor', name: 'Pattern Editor', type: 'midi', orientation: 'vertical', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#16213e', icon: 'table' },
      { id: 'phrase_editor', name: 'Phrase Editor', type: 'midi', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: true, acceptsTypes: ['midi'], color: '#0f3460', icon: 'music-note' },
      { id: 'instruments', name: 'Instruments', type: 'instrument', orientation: 'vertical', maxCards: 255, collapsible: true, defaultCollapsed: false, acceptsTypes: ['sampler', 'wavetable', 'hybrid'], color: '#e94560', icon: 'list' },
      { id: 'sample_editor', name: 'Sample Editor', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#533483', icon: 'waveform' },
      { id: 'dsp_chain', name: 'Track DSP', type: 'effect', orientation: 'horizontal', maxCards: 16, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#0f3460', icon: 'sparkles' },
      { id: 'mixer', name: 'Mixer', type: 'routing', orientation: 'horizontal', maxCards: 32, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#1a1a2e', icon: 'sliders' },
    ],
    zones: [
      { id: 'matrix_zone', name: 'Matrix', x: 0, y: 0, width: 200, height: 600, acceptsTypes: ['midi'], maxCards: 1, stackId: 'pattern_matrix' },
      { id: 'editor_zone', name: 'Editor', x: 200, y: 0, width: 1000, height: 600, acceptsTypes: ['midi'], maxCards: 1, stackId: 'pattern_editor' },
      { id: 'instrument_zone', name: 'Instruments', x: 1200, y: 0, width: 300, height: 600, acceptsTypes: ['sampler', 'wavetable', 'hybrid'], maxCards: 255, stackId: 'instruments' },
      { id: 'sample_zone', name: 'Sample', x: 1500, y: 0, width: 300, height: 600, acceptsTypes: ['utility'], maxCards: 1, stackId: 'sample_editor' },
      { id: 'dsp_zone', name: 'DSP', x: 0, y: 600, width: 1800, height: 200, acceptsTypes: ['effect'], maxCards: 16, stackId: 'dsp_chain' },
      { id: 'mixer_zone', name: 'Mixer', x: 0, y: 800, width: 1800, height: 200, acceptsTypes: ['utility'], maxCards: 32, stackId: 'mixer' },
    ],
    defaultConnections: [],
    showGrid: true,
    gridSize: 8,
    snapToGrid: true,
    showConnections: false,
    connectionStyle: 'stepped',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'midi', subtype: 'pattern_matrix', name: 'Pattern Matrix', stackId: 'pattern_matrix' },
    { type: 'midi', subtype: 'tracker', name: 'Pattern Editor', stackId: 'pattern_editor' },
    { type: 'sampler', name: '00 Drums', stackId: 'instruments', presetId: 'drum_kit' },
    { type: 'sampler', name: '01 Bass', stackId: 'instruments', presetId: 'bass_sample' },
    { type: 'wavetable', name: '02 Lead', stackId: 'instruments', presetId: 'lead_saw' },
    { type: 'effect', subtype: 'compressor', name: 'Compressor', stackId: 'dsp_chain' },
    { type: 'effect', subtype: 'eq', name: 'EQ 10', stackId: 'dsp_chain' },
    { type: 'effect', subtype: 'delay', name: 'Delay', stackId: 'dsp_chain' },
  ],
  quickActions: [
    { id: 'new_pattern', label: 'New Pattern', icon: 'plus', action: 'custom', params: { command: 'tracker.new_pattern' } },
    { id: 'clone_pattern', label: 'Clone Pattern', icon: 'copy', action: 'custom', params: { command: 'tracker.clone_pattern' } },
    { id: 'render_selection', label: 'Render Selection', icon: 'download', action: 'custom', params: { command: 'tracker.render_selection' } },
    { id: 'edit_phrase', label: 'Edit Phrase', icon: 'edit', action: 'custom', params: { command: 'tracker.edit_phrase' } },
    { id: 'sample_record', label: 'Record Sample', icon: 'circle', action: 'custom', params: { command: 'sampler.record' } },
  ],
};

/**
 * ABLETON USER LAYOUT
 * Session/Arrangement dual view with clip launching, device racks, and browser
 * Mirrors Live workflow: clips, scenes, devices, sends
 */
export const ABLETON_LAYOUT: LayoutPreset = {
  id: 'ableton_native',
  name: 'Ableton Live Style',
  description: 'Session view with clip grid, arrangement, device racks, and browser. Clip launching, warping, device chains.',
  persona: 'ableton_user',
  tags: ['ableton', 'live', 'session', 'clip', 'warp', 'device'],
  layout: {
    id: 'ableton_layout',
    name: 'Ableton Native Layout',
    description: 'Session/Arrangement workflow mirroring Live',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1920,
    height: 1080,
    padding: 0,
    stacks: [
      { id: 'browser', name: 'Browser', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#1e1e1e', icon: 'folder' },
      { id: 'session_clips', name: 'Session', type: 'midi', orientation: 'horizontal', maxCards: 16, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi', 'sampler'], color: '#2d2d2d', icon: 'grid' },
      { id: 'scenes', name: 'Scenes', type: 'utility', orientation: 'vertical', maxCards: 64, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#3d3d3d', icon: 'play' },
      { id: 'arrangement', name: 'Arrangement', type: 'midi', orientation: 'horizontal', maxCards: 1, collapsible: true, defaultCollapsed: true, acceptsTypes: ['midi'], color: '#2d2d2d', icon: 'timeline' },
      { id: 'device_rack', name: 'Device Rack', type: 'effect', orientation: 'horizontal', maxCards: 24, collapsible: false, defaultCollapsed: false, acceptsTypes: ['effect', 'midi', 'wavetable', 'sampler'], color: '#1a1a1a', icon: 'rack' },
      { id: 'mixer', name: 'Mixer', type: 'routing', orientation: 'horizontal', maxCards: 16, collapsible: false, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#2d2d2d', icon: 'sliders' },
      { id: 'sends', name: 'Sends', type: 'routing', orientation: 'vertical', maxCards: 12, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#4a4a4a', icon: 'send' },
    ],
    zones: [
      { id: 'browser_zone', name: 'Browser', x: 0, y: 0, width: 250, height: 700, acceptsTypes: ['utility'], maxCards: 1, stackId: 'browser' },
      { id: 'session_zone', name: 'Session', x: 250, y: 0, width: 1200, height: 500, acceptsTypes: ['midi', 'sampler'], maxCards: 16, stackId: 'session_clips' },
      { id: 'scene_zone', name: 'Scenes', x: 1450, y: 0, width: 100, height: 500, acceptsTypes: ['utility'], maxCards: 64, stackId: 'scenes' },
      { id: 'sends_zone', name: 'Sends', x: 1550, y: 0, width: 200, height: 500, acceptsTypes: ['effect'], maxCards: 12, stackId: 'sends' },
      { id: 'mixer_zone', name: 'Mixer', x: 1750, y: 0, width: 170, height: 700, acceptsTypes: ['utility'], maxCards: 16, stackId: 'mixer' },
      { id: 'device_zone', name: 'Devices', x: 250, y: 500, width: 1500, height: 300, acceptsTypes: ['effect', 'midi', 'wavetable', 'sampler'], maxCards: 24, stackId: 'device_rack' },
      { id: 'arrangement_zone', name: 'Arrangement', x: 0, y: 800, width: 1920, height: 280, acceptsTypes: ['midi'], maxCards: 1, stackId: 'arrangement' },
    ],
    defaultConnections: [],
    showGrid: false,
    gridSize: 16,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'curved',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'utility', subtype: 'browser', name: 'Browser', stackId: 'browser' },
    { type: 'midi', subtype: 'clip', name: 'Clip 1-1', stackId: 'session_clips' },
    { type: 'midi', subtype: 'clip', name: 'Clip 1-2', stackId: 'session_clips' },
    { type: 'sampler', subtype: 'drum_rack', name: '808 Kit', stackId: 'device_rack', presetId: '808_kit' },
    { type: 'wavetable', name: 'Wavetable', stackId: 'device_rack', presetId: 'init_wavetable' },
    { type: 'effect', subtype: 'auto_filter', name: 'Auto Filter', stackId: 'device_rack' },
    { type: 'effect', subtype: 'reverb', name: 'Reverb', stackId: 'sends', presetId: 'hall' },
    { type: 'effect', subtype: 'delay', name: 'Delay', stackId: 'sends', presetId: 'ping_pong' },
  ],
  quickActions: [
    { id: 'new_clip', label: 'New Clip', icon: 'plus', action: 'add_card', params: { type: 'midi', subtype: 'clip', stackId: 'session_clips' } },
    { id: 'capture', label: 'Capture', icon: 'circle', action: 'custom', params: { command: 'session.capture' } },
    { id: 'consolidate', label: 'Consolidate', icon: 'merge', action: 'custom', params: { command: 'session.consolidate' } },
    { id: 'duplicate_scene', label: 'Dup Scene', icon: 'copy', action: 'custom', params: { command: 'session.duplicate_scene' } },
    { id: 'export_stems', label: 'Export Stems', icon: 'download', action: 'custom', params: { command: 'export.stems' } },
  ],
};

/**
 * CUBASE USER LAYOUT
 * Linear arrangement with track inspector, mixer, and media bay
 * Mirrors Cubase workflow: project window, inspector, channel strip, VST rack
 */
export const CUBASE_LAYOUT: LayoutPreset = {
  id: 'cubase_native',
  name: 'Cubase/Nuendo Style',
  description: 'Linear arrangement with track inspector, MixConsole, MediaBay, and Control Room. Professional recording workflow.',
  persona: 'cubase_user',
  tags: ['cubase', 'nuendo', 'steinberg', 'recording', 'mixing', 'professional'],
  layout: {
    id: 'cubase_layout',
    name: 'Cubase Native Layout',
    description: 'Project window workflow mirroring Cubase',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1920,
    height: 1080,
    padding: 0,
    stacks: [
      { id: 'inspector', name: 'Inspector', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#2c3e50', icon: 'info' },
      { id: 'track_list', name: 'Track List', type: 'routing', orientation: 'vertical', maxCards: 128, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi', 'sampler', 'wavetable', 'hybrid'], color: '#34495e', icon: 'list' },
      { id: 'arrangement', name: 'Project', type: 'midi', orientation: 'horizontal', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#2c3e50', icon: 'timeline' },
      { id: 'vst_instruments', name: 'VST Instruments', type: 'instrument', orientation: 'horizontal', maxCards: 64, collapsible: true, defaultCollapsed: false, acceptsTypes: ['wavetable', 'sampler', 'hybrid'], color: '#8e44ad', icon: 'piano' },
      { id: 'channel_strip', name: 'Channel Strip', type: 'effect', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#16a085', icon: 'sliders' },
      { id: 'inserts', name: 'Inserts', type: 'effect', orientation: 'vertical', maxCards: 16, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#27ae60', icon: 'plug' },
      { id: 'sends_fx', name: 'Sends', type: 'routing', orientation: 'vertical', maxCards: 8, collapsible: true, defaultCollapsed: false, acceptsTypes: ['effect'], color: '#f39c12', icon: 'send' },
      { id: 'mixconsole', name: 'MixConsole', type: 'routing', orientation: 'horizontal', maxCards: 128, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#2c3e50', icon: 'mixer' },
      { id: 'control_room', name: 'Control Room', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#c0392b', icon: 'speaker' },
      { id: 'media_bay', name: 'MediaBay', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#3498db', icon: 'folder' },
    ],
    zones: [
      { id: 'inspector_zone', name: 'Inspector', x: 0, y: 0, width: 300, height: 700, acceptsTypes: ['utility'], maxCards: 1, stackId: 'inspector' },
      { id: 'track_zone', name: 'Tracks', x: 300, y: 0, width: 200, height: 700, acceptsTypes: ['midi', 'sampler', 'wavetable', 'hybrid'], maxCards: 128, stackId: 'track_list' },
      { id: 'project_zone', name: 'Project', x: 500, y: 0, width: 1100, height: 700, acceptsTypes: ['midi'], maxCards: 1, stackId: 'arrangement' },
      { id: 'strip_zone', name: 'Channel', x: 1600, y: 0, width: 160, height: 700, acceptsTypes: ['effect'], maxCards: 1, stackId: 'channel_strip' },
      { id: 'insert_zone', name: 'Inserts', x: 1760, y: 0, width: 160, height: 350, acceptsTypes: ['effect'], maxCards: 16, stackId: 'inserts' },
      { id: 'send_zone', name: 'Sends', x: 1760, y: 350, width: 160, height: 350, acceptsTypes: ['effect'], maxCards: 8, stackId: 'sends_fx' },
      { id: 'vst_zone', name: 'VST', x: 0, y: 700, width: 960, height: 200, acceptsTypes: ['wavetable', 'sampler', 'hybrid'], maxCards: 64, stackId: 'vst_instruments' },
      { id: 'mixer_zone', name: 'Mixer', x: 0, y: 900, width: 1920, height: 180, acceptsTypes: ['utility'], maxCards: 128, stackId: 'mixconsole' },
    ],
    defaultConnections: [],
    showGrid: true,
    gridSize: 16,
    snapToGrid: true,
    showConnections: true,
    connectionStyle: 'straight',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'utility', subtype: 'inspector', name: 'Inspector', stackId: 'inspector' },
    { type: 'midi', subtype: 'arrangement', name: 'Project Window', stackId: 'arrangement' },
    { type: 'wavetable', name: 'HALion Sonic', stackId: 'vst_instruments', presetId: 'halion_init' },
    { type: 'sampler', name: 'Groove Agent', stackId: 'vst_instruments', presetId: 'acoustic_kit' },
    { type: 'effect', subtype: 'channel_strip', name: 'Channel Strip', stackId: 'channel_strip' },
    { type: 'effect', subtype: 'eq', name: 'StudioEQ', stackId: 'inserts' },
    { type: 'effect', subtype: 'compressor', name: 'Compressor', stackId: 'inserts' },
    { type: 'effect', subtype: 'reverb', name: 'REVerence', stackId: 'sends_fx', presetId: 'studio_a' },
  ],
  quickActions: [
    { id: 'add_audio', label: 'Add Audio Track', icon: 'plus', action: 'custom', params: { command: 'project.add_audio_track' } },
    { id: 'add_instrument', label: 'Add Instrument', icon: 'piano', action: 'custom', params: { command: 'project.add_instrument_track' } },
    { id: 'add_group', label: 'Add Group', icon: 'folder', action: 'custom', params: { command: 'project.add_group' } },
    { id: 'export_audio', label: 'Export Audio', icon: 'download', action: 'custom', params: { command: 'export.audio_mixdown' } },
    { id: 'open_mixer', label: 'MixConsole', icon: 'mixer', action: 'toggle_stack', params: { stackId: 'mixconsole' } },
  ],
};

/**
 * DORICO USER LAYOUT
 * Score-centric with notation, flows, players, and engrave mode
 * Mirrors Dorico workflow: Write, Engrave, Play, Print modes
 */
export const DORICO_LAYOUT: LayoutPreset = {
  id: 'dorico_native',
  name: 'Dorico Style',
  description: 'Professional notation with Write/Engrave/Play modes, flows, players, and layouts. Score engraving focused.',
  persona: 'dorico_user',
  tags: ['dorico', 'notation', 'score', 'engrave', 'orchestral', 'publishing'],
  layout: {
    id: 'dorico_layout',
    name: 'Dorico Native Layout',
    description: 'Score-first workflow mirroring Dorico',
    author: 'Cardplay',
    version: '1.0.0',
    orientation: 'grid',
    width: 1920,
    height: 1080,
    padding: 0,
    stacks: [
      { id: 'players', name: 'Players', type: 'utility', orientation: 'vertical', maxCards: 64, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#4a5568', icon: 'users' },
      { id: 'flows', name: 'Flows', type: 'utility', orientation: 'horizontal', maxCards: 128, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#553c9a', icon: 'music' },
      { id: 'score', name: 'Score', type: 'midi', orientation: 'vertical', maxCards: 1, collapsible: false, defaultCollapsed: false, acceptsTypes: ['midi'], color: '#ffffff', icon: 'document' },
      { id: 'properties', name: 'Properties', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#4a5568', icon: 'settings' },
      { id: 'notations', name: 'Notations', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: false, acceptsTypes: ['utility'], color: '#6b46c1', icon: 'notes' },
      { id: 'key_editor', name: 'Key Editor', type: 'midi', orientation: 'horizontal', maxCards: 1, collapsible: true, defaultCollapsed: true, acceptsTypes: ['midi'], color: '#2d3748', icon: 'piano-roll' },
      { id: 'mixer', name: 'Mixer', type: 'routing', orientation: 'horizontal', maxCards: 64, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#2d3748', icon: 'sliders' },
      { id: 'vst_instruments', name: 'VST Instruments', type: 'instrument', orientation: 'horizontal', maxCards: 32, collapsible: true, defaultCollapsed: true, acceptsTypes: ['wavetable', 'sampler'], color: '#744210', icon: 'plugin' },
      { id: 'engrave_tools', name: 'Engrave', type: 'utility', orientation: 'vertical', maxCards: 1, collapsible: true, defaultCollapsed: true, acceptsTypes: ['utility'], color: '#276749', icon: 'pen' },
    ],
    zones: [
      { id: 'players_zone', name: 'Players', x: 0, y: 0, width: 250, height: 800, acceptsTypes: ['utility'], maxCards: 64, stackId: 'players' },
      { id: 'score_zone', name: 'Score', x: 250, y: 0, width: 1400, height: 800, acceptsTypes: ['midi'], maxCards: 1, stackId: 'score' },
      { id: 'properties_zone', name: 'Properties', x: 1650, y: 0, width: 270, height: 400, acceptsTypes: ['utility'], maxCards: 1, stackId: 'properties' },
      { id: 'notations_zone', name: 'Notations', x: 1650, y: 400, width: 270, height: 400, acceptsTypes: ['utility'], maxCards: 1, stackId: 'notations' },
      { id: 'flows_zone', name: 'Flows', x: 0, y: 800, width: 1920, height: 80, acceptsTypes: ['utility'], maxCards: 128, stackId: 'flows' },
      { id: 'key_zone', name: 'Key Editor', x: 0, y: 880, width: 1920, height: 200, acceptsTypes: ['midi'], maxCards: 1, stackId: 'key_editor' },
    ],
    defaultConnections: [],
    showGrid: false,
    gridSize: 16,
    snapToGrid: false,
    showConnections: false,
    connectionStyle: 'straight',
    allowFreeform: false,
    autoArrange: true,
    lockPositions: false,
  },
  defaultCards: [
    { type: 'utility', subtype: 'players_panel', name: 'Players', stackId: 'players' },
    { type: 'midi', subtype: 'notation', name: 'Full Score', stackId: 'score' },
    { type: 'utility', subtype: 'properties_panel', name: 'Properties', stackId: 'properties' },
    { type: 'utility', subtype: 'notations_panel', name: 'Notations', stackId: 'notations' },
    { type: 'utility', subtype: 'flows_panel', name: 'Flows', stackId: 'flows' },
    { type: 'sampler', name: 'NotePerformer', stackId: 'vst_instruments', presetId: 'orchestra' },
    { type: 'sampler', name: 'HALion Symphony', stackId: 'vst_instruments', presetId: 'symphony' },
  ],
  quickActions: [
    { id: 'add_player', label: 'Add Player', icon: 'plus', action: 'custom', params: { command: 'dorico.add_player' } },
    { id: 'add_flow', label: 'Add Flow', icon: 'music', action: 'custom', params: { command: 'dorico.add_flow' } },
    { id: 'write_mode', label: 'Write', icon: 'pencil', action: 'custom', params: { command: 'dorico.write_mode' } },
    { id: 'engrave_mode', label: 'Engrave', icon: 'pen', action: 'custom', params: { command: 'dorico.engrave_mode' } },
    { id: 'play_mode', label: 'Play', icon: 'play', action: 'custom', params: { command: 'dorico.play_mode' } },
    { id: 'export_pdf', label: 'Export PDF', icon: 'download', action: 'custom', params: { command: 'export.pdf' } },
  ],
};

// ============================================================================
// ALL PRESETS
// ============================================================================

export const ALL_LAYOUT_PRESETS: LayoutPreset[] = [
  BEGINNER_LAYOUT,
  TRADITIONAL_COMPOSER_LAYOUT,
  LIVE_CODER_LAYOUT,
  HIP_HOP_LAYOUT,
  XENHARMONIC_LAYOUT,
  EDM_LAYOUT,
  SOUND_DESIGNER_LAYOUT,
  DJ_PERFORMER_LAYOUT,
  AMBIENT_LAYOUT,
  TRACKER_ORCHESTRATION_LAYOUT,
  // DAW-Native Layouts
  RENOISE_LAYOUT,
  ABLETON_LAYOUT,
  CUBASE_LAYOUT,
  DORICO_LAYOUT,
];

export const PRESETS_BY_PERSONA: Map<UserPersona, LayoutPreset[]> = new Map([
  ['beginner', [BEGINNER_LAYOUT]],
  ['traditional_composer', [TRADITIONAL_COMPOSER_LAYOUT, TRACKER_ORCHESTRATION_LAYOUT, DORICO_LAYOUT]],
  ['live_coder', [LIVE_CODER_LAYOUT]],
  ['hip_hop_producer', [HIP_HOP_LAYOUT, ABLETON_LAYOUT]],
  ['xenharmonicist', [XENHARMONIC_LAYOUT]],
  ['edm_producer', [EDM_LAYOUT, ABLETON_LAYOUT]],
  ['sound_designer', [SOUND_DESIGNER_LAYOUT, CUBASE_LAYOUT]],
  ['dj_performer', [DJ_PERFORMER_LAYOUT, ABLETON_LAYOUT]],
  ['ambient_artist', [AMBIENT_LAYOUT, ABLETON_LAYOUT]],
  ['renoise_user', [RENOISE_LAYOUT, TRACKER_ORCHESTRATION_LAYOUT]],
  ['ableton_user', [ABLETON_LAYOUT, DJ_PERFORMER_LAYOUT, EDM_LAYOUT]],
  ['cubase_user', [CUBASE_LAYOUT, SOUND_DESIGNER_LAYOUT, TRADITIONAL_COMPOSER_LAYOUT]],
  ['dorico_user', [DORICO_LAYOUT, TRADITIONAL_COMPOSER_LAYOUT]],
]);

// ============================================================================
// LAYOUT MANAGER
// ============================================================================

/**
 * Layout Manager for deck arrangements
 */
export class LayoutManager {
  private currentLayout: DeckLayout | null = null;
  private cardPositions: Map<string, CardPosition> = new Map();
  private connections: Map<string, CardConnection> = new Map();
  private stacks: Map<string, StackConfig> = new Map();
  
  // Custom layouts
  private customLayouts: Map<string, DeckLayout> = new Map();
  
  constructor() {}
  
  /**
   * Load a preset
   */
  loadPreset(preset: LayoutPreset): void {
    this.currentLayout = preset.layout;
    this.cardPositions.clear();
    this.connections.clear();
    this.stacks.clear();
    
    // Initialize stacks
    for (const stack of preset.layout.stacks) {
      this.stacks.set(stack.id, stack);
    }
  }
  
  /**
   * Get current layout
   */
  getLayout(): DeckLayout | null {
    return this.currentLayout;
  }
  
  /**
   * Get all stacks
   */
  getStacks(): StackConfig[] {
    return Array.from(this.stacks.values());
  }
  
  /**
   * Add card to layout
   */
  addCard(cardId: string, stackId: string, _position?: number): void {
    const stack = this.stacks.get(stackId);
    if (!stack) return;
    
    const existingInStack = Array.from(this.cardPositions.values())
      .filter(p => p.stackId === stackId);
    
    if (existingInStack.length >= stack.maxCards) {
      return; // Stack full
    }
    
    const pos: CardPosition = {
      cardId,
      stackId,
      x: 0,
      y: existingInStack.length * 100,
      width: 80,
      height: 100,
      zIndex: existingInStack.length,
      rotation: 0,
      scale: 1,
      pinned: false,
    };
    
    this.cardPositions.set(cardId, pos);
  }
  
  /**
   * Remove card from layout
   */
  removeCard(cardId: string): void {
    this.cardPositions.delete(cardId);
    
    // Remove connections
    for (const [id, conn] of this.connections) {
      if (conn.sourceCardId === cardId || conn.targetCardId === cardId) {
        this.connections.delete(id);
      }
    }
  }
  
  /**
   * Move card to stack
   */
  moveToStack(cardId: string, stackId: string): void {
    const pos = this.cardPositions.get(cardId);
    if (pos) {
      pos.stackId = stackId;
    }
  }
  
  /**
   * Set card position (freeform)
   */
  setPosition(cardId: string, x: number, y: number): void {
    const pos = this.cardPositions.get(cardId);
    if (pos) {
      pos.x = x;
      pos.y = y;
      if (this.currentLayout?.snapToGrid) {
        const grid = this.currentLayout.gridSize;
        pos.x = Math.round(pos.x / grid) * grid;
        pos.y = Math.round(pos.y / grid) * grid;
      }
    }
  }
  
  /**
   * Add connection
   */
  addConnection(connection: Omit<CardConnection, 'id'>): string {
    const id = `conn_${Date.now()}`;
    this.connections.set(id, { ...connection, id });
    return id;
  }
  
  /**
   * Remove connection
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }
  
  /**
   * Get all connections
   */
  getConnections(): CardConnection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * Auto-arrange cards
   */
  autoArrange(): void {
    if (!this.currentLayout) return;
    
    for (const stack of this.stacks.values()) {
      const cardsInStack = Array.from(this.cardPositions.values())
        .filter(p => p.stackId === stack.id)
        .sort((a, b) => a.zIndex - b.zIndex);
      
      const spacing = 8;
      let offset = 0;
      
      for (const pos of cardsInStack) {
        if (stack.orientation === 'vertical') {
          pos.y = offset;
          offset += pos.height + spacing;
        } else {
          pos.x = offset;
          offset += pos.width + spacing;
        }
      }
    }
  }
  
  /**
   * Save layout as custom
   */
  saveAsCustom(name: string): string {
    if (!this.currentLayout) return '';
    
    const id = `custom_${Date.now()}`;
    const customLayout: DeckLayout = {
      ...this.currentLayout,
      id,
      name,
    };
    
    this.customLayouts.set(id, customLayout);
    return id;
  }
  
  /**
   * Get all presets for persona
   */
  getPresetsForPersona(persona: UserPersona): LayoutPreset[] {
    return PRESETS_BY_PERSONA.get(persona) ?? [BEGINNER_LAYOUT];
  }
  
  /**
   * Export layout as JSON
   */
  exportLayout(): string {
    return JSON.stringify({
      layout: this.currentLayout,
      positions: Array.from(this.cardPositions.entries()),
      connections: Array.from(this.connections.entries()),
    }, null, 2);
  }
  
  /**
   * Import layout from JSON
   */
  importLayout(json: string): void {
    const data = JSON.parse(json);
    this.currentLayout = data.layout;
    this.cardPositions = new Map(data.positions);
    this.connections = new Map(data.connections);
    
    // Rebuild stacks
    this.stacks.clear();
    if (this.currentLayout) {
      for (const stack of this.currentLayout.stacks) {
        this.stacks.set(stack.id, stack);
      }
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createLayoutManager(): LayoutManager {
  return new LayoutManager();
}

export function getLayoutPreset(id: string): LayoutPreset | undefined {
  return ALL_LAYOUT_PRESETS.find(p => p.id === id);
}

export function getLayoutPresetsForPersona(persona: UserPersona): LayoutPreset[] {
  return PRESETS_BY_PERSONA.get(persona) ?? [];
}
