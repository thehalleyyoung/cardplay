/**
 * @fileoverview Producer Board (Hybrid Production) - I026-I050
 *
 * Hybrid production board with timeline-focused arrangement, mixing, and optional generation.
 * Full production workflow combining manual editing with optional AI assistance.
 * Emphasizes timeline arrangement, mixer, and device chains for complete track production.
 *
 * @module @cardplay/boards/builtins/producer-board
 */

import type { Board } from '../types';

/**
 * Producer board definition (Phase I: I026-I050).
 * 
 * Control philosophy: "Full production with optional generation"
 * - Timeline-focused arrangement view
 * - Full mixer with per-track strips
 * - DSP chain per track
 * - Instrument/effect browser
 * - Session view available as tab
 * - Optional generators (on-demand)
 */
export const producerBoard: Board = {
  // I026-I027: Board metadata
  id: 'producer',
  name: 'Producer',
  description: 'Full production workflow: arrangement, mixing, mastering. Timeline + mixer focused.',
  icon: '🎚',
  category: 'Hybrid',
  difficulty: 'advanced',
  tags: ['producer', 'arrangement', 'mixing', 'mastering', 'timeline', 'production', 'hybrid'],
  author: 'CardPlay',
  version: '1.0.0',

  // I028: Control level and philosophy
  controlLevel: 'collaborative',
  philosophy: 'Full production with optional generation - arrange, mix, and deliver',

  // I031: Primary view is timeline
  primaryView: 'arranger',

  // I029-I030: Enable tools (generators on-demand, arranger manual-trigger, phrase browse-only)
  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'browse-only' },      // I029: Browse for inspiration
    harmonyExplorer: { enabled: true, mode: 'display-only' },    // Show key/chord context
    phraseGenerators: { enabled: true, mode: 'on-demand' },      // I029: Generate on request
    arrangerCard: { enabled: true, mode: 'manual-trigger' },     // I029: Manual arrangement control
    aiComposer: { enabled: false, mode: 'hidden' }               // I030: Hidden for MVP
  },

  // I032: Layout - timeline center, mixer bottom, browser left, dsp-chain right, session tab
  layout: {
    type: 'dock',
    panels: [
      // I033: Timeline as primary deck (center)
      {
        id: 'timeline',
        role: 'timeline',
        position: 'center',
      },
      // I035: Instrument browser (left)
      {
        id: 'browser',
        role: 'browser',
        position: 'left',
        defaultWidth: 260,
      },
      // I034: Mixer (bottom)
      {
        id: 'mixer-panel',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 240,
      },
      // I036-I038: DSP chain + properties (right, tabs)
      {
        id: 'inspector',
        role: 'properties',
        position: 'right',
        defaultWidth: 280,
      },
    ],
  },

  panels: [
    // I033: Timeline panel
    {
      id: 'timeline',
      role: 'timeline',
      position: 'center',
      resizable: true,
    },
    // I035: Browser panel
    {
      id: 'browser',
      role: 'browser',
      position: 'left',
      defaultWidth: 260,
      collapsible: true,
      resizable: true,
    },
    // I034: Mixer panel
    {
      id: 'mixer-panel',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 240,
      collapsible: true,
      resizable: true,
    },
    // I036-I038: Inspector panel
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
    // I033: Timeline / arrangement view (center)
    {
      id: 'arrangement-timeline',
      type: 'arrangement-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    // I035: Instrument browser (left)
    {
      id: 'instrument-browser',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
    },
    // Sample browser tab (left)
    {
      id: 'sample-browser',
      type: 'samples-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
    },
    // I034: Mixer (bottom)
    {
      id: 'production-mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    // I036: DSP chain for selected track (right)
    {
      id: 'dsp-chain',
      type: 'dsp-chain',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    // I038: Properties inspector (right tab)
    {
      id: 'clip-properties',
      type: 'properties-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
    },
    // I037: Session view (tab)
    {
      id: 'session-tab',
      type: 'session-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
    },
    // Transport deck
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

  // I045: Shortcuts for producer workflow
  shortcuts: {
    // Transport
    'play-pause': 'Space',
    'stop': 'Cmd+.',
    'record': 'R',
    'loop': 'L',

    // I045: Timeline operations
    'split-clip': 'S',
    'duplicate': 'Cmd+D',
    'consolidate': 'Cmd+J',
    'quantize': 'Q',
    'trim-start': '[',
    'trim-end': ']',
    'fade-in': 'Cmd+[',
    'fade-out': 'Cmd+]',
    'bounce-selection': 'Cmd+Shift+B',

    // I045: Mixer shortcuts
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
