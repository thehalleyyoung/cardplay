/**
 * @fileoverview Live Performance Board (Hybrid Performance) - I051-I075
 *
 * Hybrid performance board optimized for live clip launching and real-time control.
 * Combines session grid with arranger, modular routing, and mixer for live performance.
 * Focus on performance-first workflow with quick access to essential controls.
 *
 * @module @cardplay/boards/builtins/live-performance-board
 */

import type { Board } from '../types';

/**
 * Live Performance board definition (Phase I: I051-I075).
 * 
 * Control philosophy: "Performance-first, mix manual + arranger"
 * - Session grid for clip launching (center)
 * - Arranger for live structure control (top)
 * - Modular routing for live patching (right)
 * - Mixer for quick mute/solo (bottom)
 * - Transport with tempo tap and quantized launch
 * - Performance macros for real-time control
 * - Per-track control levels (some generated, some manual)
 */
export const livePerformanceBoard: Board = {
  // I051-I052: Board metadata
  id: 'live-performance',
  name: 'Live Performance',
  description: 'Performance-optimized session grid with arranger, routing, and mixer for live control',
  icon: '🎪',
  category: 'Hybrid',
  difficulty: 'advanced',
  tags: ['performance', 'live', 'session', 'hybrid', 'collaborative', 'real-time'],
  author: 'CardPlay',
  version: '1.0.0',

  // I053: Control level and philosophy
  controlLevel: 'collaborative',
  philosophy: 'Performance-first, mix manual + arranger - optimized for live control',

  // I055: Primary view is session
  primaryView: 'session',

  // I054: Enable tools (arranger chord-follow, generators on-demand, phrase browse)
  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'browse-only' },      // Browse for live inspiration
    harmonyExplorer: { enabled: true, mode: 'display-only' },    // Show key/chord context
    phraseGenerators: { enabled: true, mode: 'on-demand' },      // Generate on request
    arrangerCard: { enabled: true, mode: 'chord-follow' },       // I054: Arranger follows chords
    aiComposer: { enabled: false, mode: 'hidden' }               // Hidden for performance focus
  },

  // I056: Layout - session center, arranger top, modular right, mixer bottom
  layout: {
    type: 'dock',
    panels: [
      // I058: Arranger at top
      {
        id: 'arranger-strip',
        role: 'toolbar',
        position: 'top',
        defaultHeight: 100
      },
      // I057: Session grid in center
      {
        id: 'session-center',
        role: 'composition',
        position: 'center'
      },
      // I059: Modular routing on right
      {
        id: 'routing-panel',
        role: 'properties',
        position: 'right',
        defaultWidth: 320
      },
      // I060: Mixer at bottom
      {
        id: 'mixer-panel',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 200
      },
    ],
  },

  panels: [
    {
      id: 'arranger-strip',
      role: 'toolbar',
      position: 'top',
      defaultHeight: 100,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'session-center',
      role: 'composition',
      position: 'center',
      resizable: true,
    },
    {
      id: 'routing-panel',
      role: 'properties',
      position: 'right',
      defaultWidth: 320,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'mixer-panel',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 200,
      collapsible: true,
      resizable: true,
    },
  ],

  decks: [
    // I057: Session grid as primary deck (center)
    {
      id: 'performance-session',
      type: 'session-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'session-center',
    },
    // I058: Arranger sections + energy controls (top)
    {
      id: 'live-arranger',
      type: 'arranger-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'arranger-strip',
    },
    // I059: Modular routing + modulation (right)
    {
      id: 'live-routing',
      type: 'routing-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'routing-panel',
    },
    // I060: Mixer with quick mute/solo (bottom)
    {
      id: 'performance-mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'mixer-panel',
    },
    // I061: Transport with tempo tap
    {
      id: 'performance-transport',
      type: 'transport-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    // I062: Performance macros (8 knobs) - optional deck
    {
      id: 'performance-macros',
      type: 'properties-deck',  // Will show macro controls in properties
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'routing-panel',
    },
  ],

  connections: [],

  theme: {
    colors: {
      primary: '#ef4444',   // Red for live/recording energy
      secondary: '#f59e0b', // Amber for active clips
      accent: '#10b981',    // Green for armed tracks
      background: '#0a0a0a', // Very dark for performance mode
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      fontSize: 14,  // Slightly larger for stage visibility
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: true,  // I068: Show per-track control levels
    },
  },

  // I069: Shortcuts for live performance
  shortcuts: {
    // Transport & tempo
    'play-pause': 'Space',
    'stop': 'Cmd+.',
    'tempo-tap': 'T',
    'toggle-metronome': 'M',

    // Scene launching
    'launch-scene-1': '1',
    'launch-scene-2': '2',
    'launch-scene-3': '3',
    'launch-scene-4': '4',
    'launch-scene-5': '5',
    'next-scene': 'Down',
    'prev-scene': 'Up',

    // Track control
    'arm-track': 'Cmd+R',
    'mute-track': 'Cmd+M',
    'solo-track': 'Cmd+S',

    // I065: Panic controls
    'panic-all-off': 'Cmd+Shift+P',
    'stop-all-clips': 'Cmd+Shift+.',

    // I063: Deck reveal
    'toggle-reveal': 'Cmd+E',

    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
  },

  policy: {
    allowToolToggles: false,  // Lock tools during performance
    allowControlLevelOverridePerTrack: true,  // I067: Per-track control levels
    allowDeckCustomization: false,  // Lock layout during performance
    allowLayoutCustomization: false,
  },

  onActivate: () => {
    console.log('Live Performance board activated');
    // I066: Could initialize performance capture system here
  },

  onDeactivate: () => {
    console.log('Live Performance board deactivated');
    // Could stop any active performance recording
  },
};
