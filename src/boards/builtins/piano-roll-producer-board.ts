/**
 * @fileoverview Piano Roll Producer Board (Manual)
 * 
 * Manual producer board focused on piano roll editing with mixer,
 * timeline arrangement, and full manual control. No AI assistance.
 * Perfect for DAW-style production workflows.
 * 
 * @module @cardplay/boards/builtins/piano-roll-producer-board
 */

import type { Board } from '../types';

export const pianoRollProducerBoard: Board = {
  id: 'piano-roll-producer',
  name: 'Piano Roll Producer',
  description: 'DAW-style production with piano roll, timeline, and mixer. Full manual control with no AI assistance.',
  icon: '🎛️',
  category: 'Manual',
  difficulty: 'intermediate',
  tags: ['piano-roll', 'producer', 'manual', 'daw', 'arrangement', 'mixing'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'full-manual',
  philosophy: 'Traditional DAW workflow - you control every detail',
  
  primaryView: 'arranger',
  
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
        id: 'arrangement',
        role: 'composition',
        position: 'center'
      },
      {
        id: 'mixer',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 280
      },
      {
        id: 'inspector',
        role: 'properties',
        position: 'right',
        defaultWidth: 320
      }
    ]
  },
  
  panels: [
    {
      id: 'browser',
      role: 'browser',
      position: 'left',
      defaultWidth: 280,
      collapsible: true,
      resizable: true
    },
    {
      id: 'arrangement',
      role: 'composition',
      position: 'center',
      resizable: true
    },
    {
      id: 'mixer',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 280,
      collapsible: true,
      resizable: true
    },
    {
      id: 'inspector',
      role: 'properties',
      position: 'right',
      defaultWidth: 320,
      collapsible: true,
      resizable: true
    }
  ],
  
  decks: [
    // Main arrangement timeline
    {
      id: 'timeline',
      type: 'arrangement-deck',
      panelId: 'arrangement',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false
    },
    // Piano roll editor (opens for selected clip)
    {
      id: 'piano-roll',
      type: 'piano-roll-deck',
      panelId: 'arrangement',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false
    },
    // Instrument browser
    {
      id: 'instruments',
      type: 'instruments-deck',
      panelId: 'browser',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true
    },
    // Sample browser
    {
      id: 'samples',
      type: 'samples-deck',
      panelId: 'browser',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true
    },
    // Mixer with track strips
    {
      id: 'mixer',
      type: 'mixer-deck',
      panelId: 'mixer',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // DSP chain for selected track
    {
      id: 'dsp-chain',
      type: 'dsp-chain',
      panelId: 'inspector',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false
    },
    // Properties inspector
    {
      id: 'properties',
      type: 'properties-deck',
      panelId: 'inspector',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    }
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      background: '#0f172a'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 13
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: false
    }
  },
  
  shortcuts: {
    // Timeline
    'split-clip': 'Cmd+E',
    'duplicate-clip': 'Cmd+D',
    'consolidate': 'Cmd+J',
    'quantize': 'Cmd+U',
    
    // Piano Roll
    'draw-mode': 'B',
    'select-mode': 'V',
    'snap-toggle': 'Cmd+G',
    'velocity-up': 'Alt+Up',
    'velocity-down': 'Alt+Down',
    
    // Mixer
    'toggle-mixer': 'Cmd+M',
    'solo-track': 'S',
    'mute-track': 'M',
    'arm-track': 'R',
    
    // Transport
    'play': 'Space',
    'stop': 'Enter',
    'loop-toggle': 'L',
    'record': 'Cmd+R',
    
    // Global
    'save': 'Cmd+S',
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'cut': 'Cmd+X',
    'copy': 'Cmd+C',
    'paste': 'Cmd+V'
  },
  
  onActivate: () => {
    console.log('Piano Roll Producer board activated');
  },
  
  onDeactivate: () => {
    console.log('Piano Roll Producer board deactivated');
  }
};
