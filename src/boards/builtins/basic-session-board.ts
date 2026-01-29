/**
 * @fileoverview Basic Session Board (Manual) - F091-F120
 * 
 * Manual clip launching board for live performance and sketching.
 * Ableton Live-style session grid with no AI generation.
 * 
 * @module @cardplay/boards/builtins/basic-session-board
 */

import type { Board } from '../types';

export const basicSessionBoard: Board = {
  id: 'basic-session',
  name: 'Basic Session',
  description: 'Manual clip launching for live performance and sketching. No AI generation.',
  icon: '🎚️',
  category: 'Manual',
  difficulty: 'beginner',
  tags: ['session', 'live', 'clips', 'manual', 'ableton'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'full-manual',
  philosophy: 'Manual clip launching',
  
  primaryView: 'session',
  
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
        id: 'browser',
        role: 'browser',
        position: 'left',
        defaultWidth: 280
      },
      {
        id: 'session-grid',
        role: 'composition',
        position: 'center'
      },
      {
        id: 'mixer',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 200
      },
      {
        id: 'properties',
        role: 'properties',
        position: 'right',
        defaultWidth: 300
      }
    ]
  },
  
  panels: [
    {
      id: 'browser',
      role: 'browser',
      position: 'left',
      defaultWidth: 280
    },
    {
      id: 'session-grid',
      role: 'composition',
      position: 'center'
    },
    {
      id: 'mixer',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 200
    },
    {
      id: 'properties',
      role: 'properties',
      position: 'right',
      defaultWidth: 300
    }
  ],
  
  decks: [
    {
      id: 'session-grid-main',
      type: 'session-deck',
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
      id: 'mixer-bottom',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'properties-panel',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    }
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      accent: '#ffe66d',
      background: '#2d2d2d'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: false
    }
  },
  
  shortcuts: {
    'launch-clip': 'Space',
    'stop-clip': 'Shift+Space',
    'launch-scene': 'Enter',
    'stop-all': 'Cmd+Period',
    'arm-track': 'A',
    'solo-track': 'S',
    'mute-track': 'M',
    'duplicate-clip': 'Cmd+D',
    'delete-clip': 'Delete',
    'rename-clip': 'Cmd+R',
    'next-slot': 'Down',
    'prev-slot': 'Up',
    'next-track': 'Right',
    'prev-track': 'Left',
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z'
  },
  
  onActivate: () => {
    console.log('Basic Session board activated');
  },
  
  onDeactivate: () => {
    console.log('Basic Session board deactivated');
  }
};
