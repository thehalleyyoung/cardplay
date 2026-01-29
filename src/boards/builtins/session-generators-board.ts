/**
 * @fileoverview Session + Generators Board (Assisted) - G061-G090
 * 
 * Session board with on-demand phrase generators. Manual clip launching
 * with generator assistance for faster sketching and exploration.
 * 
 * @module @cardplay/boards/builtins/session-generators-board
 */

import type { Board } from '../types';

/**
 * Session + Generators board definition.
 * 
 * Phase G board (G061-G090) - assisted session with generators.
 * 
 * Control philosophy: "Trigger generation, then curate"
 * - User launches clips manually
 * - Generators fill clips on-demand
 * - Generated content is editable
 * - Clear "generated" vs "manual" indicators
 */
export const sessionGeneratorsBoard: Board = {
  id: 'session-generators',
  name: 'Session + Generators',
  description: 'Session board with on-demand generators - trigger generation, then curate and perform',
  icon: '🎹',
  category: 'Assisted',
  difficulty: 'intermediate',
  tags: ['session', 'generators', 'assisted', 'sketching', 'live'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'assisted',
  philosophy: 'Trigger generation, then curate - fast sketching with full control',
  
  primaryView: 'session',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },         // Optional, can enable later
    harmonyExplorer: { enabled: false, mode: 'hidden' },        // Optional chord track support
    phraseGenerators: { enabled: true, mode: 'on-demand' },     // G064: on-demand generators
    arrangerCard: { enabled: false, mode: 'hidden' },           // Keep AI composer hidden initially
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
        id: 'session',
        role: 'composition',
        position: 'center'
      },
      {
        id: 'generator',
        role: 'toolbar',
        position: 'right',
        defaultWidth: 320
      },
      {
        id: 'mixer',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 200
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
      id: 'session',
      role: 'composition',
      position: 'center',
      resizable: true
    },
    {
      id: 'generator',
      role: 'toolbar',
      position: 'right',
      defaultWidth: 320,
      collapsible: true,
      resizable: true
    },
    {
      id: 'mixer',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 200,
      collapsible: true,
      resizable: true
    }
  ],
  
  decks: [
    // G067: Clip session (center panel)
    {
      id: 'clip-session',
      type: 'session-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // G068: Generator deck (right panel)
    {
      id: 'generators',
      type: 'generators-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // G069: Mixer (bottom panel)
    {
      id: 'mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // G070: Instrument browser (left panel)
    {
      id: 'instruments',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true
    },
    // G071: Properties (right panel tab)
    {
      id: 'properties',
      type: 'properties-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false
    }
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#8b5cf6',      // Purple for generators
      secondary: '#3b82f6',
      accent: '#10b981',        // Green for generated content
      background: '#1a1a1a'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: true,
      showGenerative: true     // G083: Clear "generated" badges
    }
  },
  
  shortcuts: {
    // G082: Generator shortcuts
    'generate': 'Cmd+G',
    'regenerate': 'Cmd+Shift+G',
    'freeze': 'Cmd+F',
    
    // Session navigation
    'next-slot': 'Down',
    'prev-slot': 'Up',
    'next-track': 'Right',
    'prev-track': 'Left',
    
    // Clip launching (G082)
    'launch-clip': 'Enter',
    'stop-clip': 'Backspace',
    'launch-scene': 'Shift+Enter',
    
    // Post-processing (G078)
    'humanize': 'Cmd+Shift+H',
    'quantize': 'Cmd+Q',
    
    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z'
  },
  
  policy: {
    allowToolToggles: true,                      // User can enable/disable generators
    allowControlLevelOverridePerTrack: false,    // Session stays assisted (no per-track override)
    allowDeckCustomization: false,               // Fixed deck layout
    allowLayoutCustomization: true               // Can resize/collapse panels
  },
  
  onActivate: () => {
    console.log('Session + Generators board activated');
    // TODO G072: Initialize generator deck UI
    // TODO G075: Set up "Generate into new clip" action
    // TODO G080: Initialize generator settings from persisted state
  },
  
  onDeactivate: () => {
    console.log('Session + Generators board deactivated');
    // TODO G080: Persist generator settings per track/slot
  }
};
