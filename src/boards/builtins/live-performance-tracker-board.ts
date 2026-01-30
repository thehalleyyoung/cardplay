/**
 * @fileoverview Live Performance Tracker Board (M147)
 *
 * A tracker board variant optimized for live performance. Emphasizes
 * pattern launching, scene controls, mixer, and real-time effects.
 * Uses a minimal, glanceable layout with large controls.
 *
 * @module @cardplay/boards/builtins/live-performance-tracker-board
 */

import type { Board } from '../types';

export const livePerformanceTrackerBoard: Board = {
  id: 'live-performance-tracker',
  name: 'Live Performance Tracker',
  description: 'Tracker optimized for live performance. Launch patterns, control scenes, mix on the fly.',
  icon: '🎛',
  category: 'Manual',
  difficulty: 'advanced',
  tags: ['tracker', 'live', 'performance', 'scene', 'launch', 'realtime'],
  author: 'CardPlay',
  version: '1.0.0',

  controlLevel: 'full-manual',
  philosophy: 'Fast, reliable, glanceable — keep the music flowing',

  primaryView: 'tracker',

  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' },
  },

  layout: {
    type: 'dock',
    panels: [
      {
        id: 'launcher',
        role: 'composition',
        position: 'center',
      },
      {
        id: 'mixer',
        role: 'mixer',
        position: 'right',
        defaultWidth: 320,
      },
      {
        id: 'effects',
        role: 'properties',
        position: 'bottom',
        defaultHeight: 180,
      },
      {
        id: 'transport-bar',
        role: 'transport',
        position: 'top',
        defaultHeight: 56,
      },
    ],
  },

  panels: [
    {
      id: 'launcher',
      role: 'composition',
      position: 'center',
      resizable: true,
    },
    {
      id: 'mixer',
      role: 'mixer',
      position: 'right',
      defaultWidth: 320,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'effects',
      role: 'properties',
      position: 'bottom',
      defaultHeight: 180,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'transport-bar',
      role: 'transport',
      position: 'top',
      defaultHeight: 56,
      collapsible: false,
      resizable: false,
    },
  ],

  decks: [
    // Session / pattern launcher (center — primary focus)
    {
      id: 'session-launcher',
      type: 'session-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'launcher',
    },
    // Mixer strip (right — level, mute/solo only)
    {
      id: 'live-mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'mixer',
    },
    // DSP / effects rack (bottom — macro knobs for live tweaking)
    {
      id: 'live-effects',
      type: 'dsp-chain',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'effects',
    },
    // Transport (top — play/stop/tempo/scene buttons)
    {
      id: 'live-transport',
      type: 'transport-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'transport-bar',
    },
  ],

  connections: [],

  theme: {
    colors: {
      primary: '#ef4444',   // Red for performance urgency
      secondary: '#f59e0b', // Amber for active elements
      accent: '#10b981',    // Green for go/play
      background: '#0a0a0a', // Very dark for stage visibility
    },
    typography: {
      fontFamily: '"Fira Code", "Consolas", monospace',
      fontSize: 16, // Larger for stage readability
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: false,
    },
  },

  shortcuts: {
    // Scene / pattern launch
    'launch-scene-1': '1',
    'launch-scene-2': '2',
    'launch-scene-3': '3',
    'launch-scene-4': '4',
    'launch-scene-5': '5',
    'launch-scene-6': '6',
    'launch-scene-7': '7',
    'launch-scene-8': '8',
    'stop-all': 'Escape',
    'stop-scene': 'Backspace',

    // Mixer
    'mute-track-1': 'F1',
    'mute-track-2': 'F2',
    'mute-track-3': 'F3',
    'mute-track-4': 'F4',
    'solo-track-1': 'Shift+F1',
    'solo-track-2': 'Shift+F2',
    'solo-track-3': 'Shift+F3',
    'solo-track-4': 'Shift+F4',

    // Transport
    'play-pause': 'Space',
    'stop': 'Cmd+.',
    'tempo-up': 'Cmd+Up',
    'tempo-down': 'Cmd+Down',
    'tap-tempo': 'T',

    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
  },

  policy: {
    allowToolToggles: false,                      // No tool toggles during performance
    allowControlLevelOverridePerTrack: false,
    allowDeckCustomization: false,                // Locked layout for stability
    allowLayoutCustomization: false,              // No resizing during performance
  },

  onActivate: () => {
    console.log('Live Performance Tracker board activated');
  },

  onDeactivate: () => {
    console.log('Live Performance Tracker board deactivated');
  },
};
