/**
 * @fileoverview Basic Tracker Board (Manual) - F031-F060
 * 
 * Pure manual tracker board with no AI assistance.
 * Provides a classic tracker interface with pattern editor,
 * instrument browser, and properties panels.
 * 
 * @module @cardplay/boards/builtins/basic-tracker-board
 */

import type { Board } from '../types';

export const basicTrackerBoard: Board = {
  id: 'basic-tracker',
  name: 'Basic Tracker',
  description: 'Pure manual tracker workflow with no AI assistance. Classic pattern-based composition.',
  icon: '🎹',
  category: 'Manual',
  difficulty: 'intermediate',
  tags: ['tracker', 'manual', 'pattern', 'renoise', 'fasttracker'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'full-manual',
  philosophy: 'You control everything - pure tracker',
  
  primaryView: 'tracker',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  },
  
  layout: {
    type: 'dock',
    panels: [
      {
        id: 'sidebar',
        role: 'browser',
        position: 'left',
        defaultWidth: 280
      },
      {
        id: 'main',
        role: 'composition',
        position: 'center'
      },
      {
        id: 'inspector',
        role: 'properties',
        position: 'right',
        defaultWidth: 300
      }
    ]
  },
  
  panels: [
    {
      id: 'sidebar',
      role: 'browser',
      position: 'left',
      defaultWidth: 280
    },
    {
      id: 'main',
      role: 'composition',
      position: 'center'
    },
    {
      id: 'inspector',
      role: 'properties',
      position: 'right',
      defaultWidth: 300
    }
  ],
  
  decks: [
    {
      id: 'pattern-editor-main',
      type: 'pattern-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'instrument-browser-sidebar',
      type: 'instruments-deck',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: true
    },
    {
      id: 'dsp-chain-sidebar',
      type: 'dsp-chain',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false
    },
    {
      id: 'properties-inspector',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    }
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#4a9eff',
      secondary: '#94d82d',
      accent: '#ff6b6b',
      background: '#1a1a1a'
    },
    typography: {
      fontFamily: '"Fira Code", "Consolas", monospace',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: false
    }
  },
  
  shortcuts: {
    'pattern-next': 'Cmd+Down',
    'pattern-prev': 'Cmd+Up',
    'pattern-clone': 'Cmd+D',
    'toggle-follow': 'F',
    'toggle-loop': 'L',
    'octave-up': 'Ctrl+Up',
    'octave-down': 'Ctrl+Down',
    'note-off': 'Backslash',
    'cut': 'Cmd+X',
    'copy': 'Cmd+C',
    'paste': 'Cmd+V',
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z'
  },
  
  onActivate: () => {
    console.log('Basic Tracker board activated');
  },
  
  onDeactivate: () => {
    console.log('Basic Tracker board deactivated');
  }
};
