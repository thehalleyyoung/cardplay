/**
 * @fileoverview Modular Routing Board (M177)
 *
 * A board variant emphasizing the routing graph as the primary composition
 * surface. Inspired by modular synthesis / Max-MSP / Pure Data paradigms.
 * Audio, MIDI, and modulation connections are first-class citizens.
 *
 * @module @cardplay/boards/builtins/modular-routing-board
 */

import type { Board } from '../types';

export const modularRoutingBoard: Board = {
  id: 'modular-routing',
  name: 'Modular Routing',
  description: 'Routing graph as primary surface. Patch audio, MIDI, and modulation connections visually.',
  icon: '🔌',
  category: 'Manual',
  difficulty: 'advanced',
  tags: ['modular', 'routing', 'patching', 'dsp', 'sound-design', 'advanced'],
  author: 'CardPlay',
  version: '1.0.0',

  controlLevel: 'full-manual',
  philosophy: 'Everything is a node; everything is a connection',

  primaryView: 'composer',

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
        id: 'routing-main',
        role: 'composition',
        position: 'center',
      },
      {
        id: 'node-browser',
        role: 'browser',
        position: 'left',
        defaultWidth: 240,
      },
      {
        id: 'node-inspector',
        role: 'properties',
        position: 'right',
        defaultWidth: 280,
      },
      {
        id: 'dsp-monitor',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 160,
      },
    ],
  },

  panels: [
    {
      id: 'routing-main',
      role: 'composition',
      position: 'center',
      resizable: true,
    },
    {
      id: 'node-browser',
      role: 'browser',
      position: 'left',
      defaultWidth: 240,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'node-inspector',
      role: 'properties',
      position: 'right',
      defaultWidth: 280,
      collapsible: true,
      resizable: true,
    },
    {
      id: 'dsp-monitor',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 160,
      collapsible: true,
      resizable: true,
    },
  ],

  decks: [
    // Routing graph canvas (center — primary)
    {
      id: 'routing-graph',
      type: 'routing-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'routing-main',
    },
    // Instrument / effect node browser (left)
    {
      id: 'node-browser',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
      panelId: 'node-browser',
    },
    // DSP chain for selected node (right)
    {
      id: 'node-dsp-chain',
      type: 'dsp-chain',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'node-inspector',
    },
    // Properties of selected node/connection (right tab)
    {
      id: 'node-properties',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'node-inspector',
    },
    // Mixer / meter bridge (bottom)
    {
      id: 'output-mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'dsp-monitor',
    },
  ],

  connections: [],

  theme: {
    colors: {
      primary: '#8b5cf6',   // Purple for modular aesthetic
      secondary: '#06b6d4', // Cyan for connections
      accent: '#f59e0b',    // Amber for active signals
      background: '#111827', // Dark for node contrast
    },
    typography: {
      fontFamily: '"Fira Code", "Consolas", monospace',
      fontSize: 13,
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: false,
    },
  },

  shortcuts: {
    // Node operations
    'add-node': 'N',
    'delete-node': 'Delete',
    'duplicate-node': 'Cmd+D',
    'connect-nodes': 'C',
    'disconnect': 'X',

    // Navigation
    'zoom-in': 'Cmd+=',
    'zoom-out': 'Cmd+-',
    'zoom-fit': 'Cmd+0',
    'pan-graph': 'Space',

    // Selection
    'select-all': 'Cmd+A',
    'deselect': 'Escape',

    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'cut': 'Cmd+X',
    'copy': 'Cmd+C',
    'paste': 'Cmd+V',
  },

  policy: {
    allowToolToggles: false,
    allowControlLevelOverridePerTrack: false,
    allowDeckCustomization: true,
    allowLayoutCustomization: true,
  },

  onActivate: () => {
    console.log('Modular Routing board activated');
  },

  onDeactivate: () => {
    console.log('Modular Routing board deactivated');
  },
};
