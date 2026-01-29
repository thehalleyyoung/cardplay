/**
 * @fileoverview Producer Board (M257)
 *
 * A board variant emphasizing timeline arrangement and mixer for
 * full-track production workflows. Combines clip-based editing,
 * mixing, and mastering in a single layout.
 *
 * @module @cardplay/boards/builtins/producer-board
 */

import type { Board } from '../types';

export const producerBoard: Board = {
  id: 'producer',
  name: 'Producer',
  description: 'Full production workflow: arrangement, mixing, and mastering. Timeline + mixer focused.',
  icon: '🎚',
  category: 'Assisted',
  difficulty: 'intermediate',
  tags: ['producer', 'arrangement', 'mixing', 'mastering', 'timeline', 'production'],
  author: 'CardPlay',
  version: '1.0.0',

  controlLevel: 'manual-with-hints',
  philosophy: 'See the big picture — arrange, mix, and deliver',

  primaryView: 'arranger',

  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'browse-only' },
    harmonyExplorer: { enabled: true, mode: 'display-only' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: true, mode: 'manual-trigger' },
    aiComposer: { enabled: false, mode: 'hidden' },
  },

  layout: {
    type: 'dock',
    panels: [
      {
        id: 'timeline',
        role: 'timeline',
        position: 'center',
      },
      {
        id: 'browser',
        role: 'browser',
        position: 'left',
        defaultWidth: 260,
      },
      {
        id: 'mixer-panel',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 240,
      },
      {
        id: 'inspector',
        role: 'properties',
        position: 'right',
        defaultWidth: 280,
      },
    ],
  },

  panels: [
    {
      id: 'timeline',
      role: 'timeline',
      position: 'center',
      resizable: true,
    },
    {
      id: 'browser',
      role: 'browser',
      position: 'left',
      defaultWidth: 260,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'mixer-panel',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 240,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'inspector',
      role: 'properties',
      position: 'right',
      defaultWidth: 280,
      collapsible: true,
      resizable: true,
    },
  ],

  decks: [
    // Timeline / arrangement view (center)
    {
      id: 'arrangement-timeline',
      type: 'arrangement-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    // Sample / phrase browser (left)
    {
      id: 'sample-browser',
      type: 'samples-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
    },
    // Phrase library tab (left)
    {
      id: 'phrase-browser',
      type: 'phrases-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
    },
    // Mixer (bottom)
    {
      id: 'production-mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    // Automation lanes (bottom tab)
    {
      id: 'automation-lanes',
      type: 'automation-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
    },
    // Properties inspector (right)
    {
      id: 'clip-properties',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    // Transport (top-level)
    {
      id: 'production-transport',
      type: 'transport-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
  ],

  connections: [],

  theme: {
    colors: {
      primary: '#3b82f6',   // Blue for production clarity
      secondary: '#8b5cf6', // Purple for creative tools
      accent: '#f59e0b',    // Amber for active clips
      background: '#1e1e1e',
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      fontSize: 13,
    },
    controlIndicators: {
      showHints: true,
      showSuggestions: false,
      showGenerative: false,
    },
  },

  shortcuts: {
    // Transport
    'play-pause': 'Space',
    'stop': 'Cmd+.',
    'record': 'R',
    'loop': 'L',

    // Timeline
    'split-clip': 'S',
    'trim-start': '[',
    'trim-end': ']',
    'fade-in': 'Cmd+[',
    'fade-out': 'Cmd+]',
    'bounce-selection': 'Cmd+B',

    // Mixer
    'toggle-mixer': 'Cmd+M',
    'toggle-automation': 'A',

    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'cut': 'Cmd+X',
    'copy': 'Cmd+C',
    'paste': 'Cmd+V',
    'select-all': 'Cmd+A',
  },

  policy: {
    allowToolToggles: true,
    allowControlLevelOverridePerTrack: false,
    allowDeckCustomization: true,
    allowLayoutCustomization: true,
  },

  onActivate: () => {
    console.log('Producer board activated');
  },

  onDeactivate: () => {
    console.log('Producer board deactivated');
  },
};
