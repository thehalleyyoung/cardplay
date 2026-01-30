/**
 * @fileoverview Tracker + Phrases Board (Assisted) - G031-G060
 * 
 * Tracker workflow with phrase library drag/drop assistance.
 * Manual editing with phrase database for faster composition.
 * 
 * @module @cardplay/boards/builtins/tracker-phrases-board
 */

import type { Board } from '../types';

/**
 * Tracker + Phrases board definition.
 * 
 * Phase G board (G031-G060) - assisted tracker with phrase library.
 * 
 * Control philosophy: "Drag phrases, then edit"
 * - User writes patterns manually
 * - Phrases can be dragged into patterns
 * - Phrase adaptation respects harmony context
 * - All edits are manual after drop
 */
export const trackerPhrasesBoard: Board = {
  id: 'tracker-phrases',
  name: 'Tracker + Phrases',
  description: 'Tracker with phrase library - drag phrases for speed, then edit manually for precision',
  icon: '📝',
  category: 'Assisted',
  difficulty: 'intermediate',
  tags: ['tracker', 'phrases', 'assisted', 'fast-workflow', 'drag-drop'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'assisted',
  philosophy: 'Drag phrases, then edit - fast controlled tracker workflow',
  
  primaryView: 'tracker',
  
  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'drag-drop' },      // G034: drag-drop mode
    harmonyExplorer: { enabled: false, mode: 'hidden' },       // Optional, can enable for chord-aware phrases
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  },
  
  layout: {
    type: 'dock',
    panels: [
      {
        id: 'library',
        role: 'browser',
        position: 'left',
        defaultWidth: 320
      },
      {
        id: 'pattern',
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
      id: 'library',
      role: 'browser',
      position: 'left',
      defaultWidth: 320,
      collapsible: true,
      resizable: true
    },
    {
      id: 'pattern',
      role: 'composition',
      position: 'center',
      resizable: true
    },
    {
      id: 'inspector',
      role: 'properties',
      position: 'right',
      defaultWidth: 300,
      collapsible: true,
      resizable: true
    }
  ],
  
  decks: [
    // G037: Phrase library (left panel)
    {
      id: 'phrase-library',
      type: 'phrases-deck',
      panelId: 'library',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false
    },
    // G039: Optional instrument browser (tab in left panel)
    {
      id: 'instruments',
      type: 'instruments-deck',
      panelId: 'library',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true
    },
    // G038: Pattern editor (center)
    {
      id: 'pattern-editor',
      type: 'pattern-deck',
      panelId: 'pattern',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false
    },
    // G040: Properties (right panel)
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
      primary: '#8e44ad',      // Purple for phrases
      secondary: '#9b59b6',
      accent: '#e74c3c',        // Red accent for manual edits
      background: '#2c3e50'
    },
    typography: {
      fontFamily: '"Fira Code", "Consolas", monospace',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: true,    // G052: Phrase library accent distinct from hints
      showGenerative: false
    }
  },
  
  shortcuts: {
    // G051: Phrase shortcuts
    'phrase:search': 'Cmd+P',
    'phrase:preview': 'Space',
    'phrase:commit-selection': 'Cmd+Shift+S',
    
    // Tracker navigation
    'pattern-next': 'Cmd+Down',
    'pattern-prev': 'Cmd+Up',
    'pattern-clone': 'Cmd+D',
    'toggle-follow': 'F',
    'toggle-loop': 'L',
    
    // Phrase adaptation settings (G046-G047)
    'phrase:transpose': 'Cmd+T',
    'phrase:adapt-chord': 'Cmd+Shift+T',
    
    // Note entry
    'octave-up': 'Ctrl+Up',
    'octave-down': 'Ctrl+Down',
    'note-off': 'Backslash',
    
    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'cut': 'Cmd+X',
    'copy': 'Cmd+C',
    'paste': 'Cmd+V'
  },
  
  policy: {
    allowToolToggles: true,                      // User can toggle phrase library
    allowControlLevelOverridePerTrack: false,    // Tracker stays assisted
    allowDeckCustomization: false,               // Fixed deck layout
    allowLayoutCustomization: true               // Can resize/collapse panels
  },
  
  onActivate: () => {
    console.log('Tracker + Phrases board activated');
    // TODO G042: Initialize phrase library (search, tags, categories, favorites)
    // TODO G045: Initialize harmony context for chord-aware adaptation
    // TODO G047: Load phrase adaptation settings from persisted state
  },
  
  onDeactivate: () => {
    console.log('Tracker + Phrases board deactivated');
    // TODO G047: Persist phrase adaptation settings per board
  }
};
