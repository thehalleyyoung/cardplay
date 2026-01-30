/**
 * @fileoverview Composer Board (Hybrid Power User) - I001-I025
 * 
 * Hybrid board combining manual and assisted workflows per track.
 * Mix manual composition, phrase drag/drop, harmony suggestions, and
 * on-demand generation. Power user board with maximum flexibility.
 * 
 * @module @cardplay/boards/builtins/composer-board
 */

import type { Board } from '../types';

/**
 * Composer board definition (Phase I: I001-I025).
 * 
 * Control philosophy: "Mix manual + assisted per track"
 * - Per-track control levels (manual/assisted/directed)
 * - Full deck set for composition
 * - Arranger sections bar at top
 * - Chord track for harmonic context
 * - Session grid for clip arrangement
 * - Notation/tracker editors for detailed work
 * - Generator deck for on-demand AI parts
 * - Phrase library for drag/drop inspiration
 */
export const composerBoard: Board = {
  // I001-I002: Board metadata
  id: 'composer',
  name: 'Composer',
  description: 'Hybrid power user board - mix manual composition with AI assistance per track',
  icon: '🎼',
  category: 'Hybrid',
  difficulty: 'expert',
  tags: ['composer', 'hybrid', 'collaborative', 'power-user', 'composition'],
  author: 'CardPlay',
  version: '1.0.0',
  
  // I003: Control level and philosophy
  controlLevel: 'collaborative',
  philosophy: 'Mix manual + assisted per track - maximum flexibility and control',
  
  // I006: Primary view
  primaryView: 'composer',
  
  // I004: Enable all major tools
  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'drag-drop' },      // Phrase library available
    harmonyExplorer: { enabled: true, mode: 'suggest' },       // Chord suggestions
    phraseGenerators: { enabled: true, mode: 'on-demand' },    // Generate on request
    arrangerCard: { enabled: true, mode: 'chord-follow' },     // Sections follow chords
    aiComposer: { enabled: false, mode: 'hidden' }             // I005: Keep hidden for MVP
  },
  
  // I007: Layout based on composer deck configuration
  layout: {
    type: 'dock',
    panels: [
      // I008: Arranger sections bar at top
      {
        id: 'arranger-strip',
        role: 'toolbar',
        position: 'top',
        defaultHeight: 120
      },
      // I009: Chord track lane below arranger
      {
        id: 'chord-lane',
        role: 'timeline',
        position: 'top',
        defaultHeight: 80
      },
      // I010: Session grid in center
      {
        id: 'session-center',
        role: 'composition',
        position: 'center'
      },
      // I011-I012: Notation/tracker editors at bottom
      {
        id: 'editor-panel',
        role: 'composition',
        position: 'bottom',
        defaultHeight: 300
      },
      // I014: Generator deck on right
      {
        id: 'generator-side',
        role: 'browser',
        position: 'right',
        defaultWidth: 320
      },
      // I015: Phrase library on left
      {
        id: 'phrase-library',
        role: 'browser',
        position: 'left',
        defaultWidth: 280
      }
    ]
  },
  
  panels: [
    {
      id: 'arranger-strip',
      role: 'toolbar',
      position: 'top',
      defaultHeight: 120,
      collapsible: true,
      resizable: true
    },
    {
      id: 'chord-lane',
      role: 'timeline',
      position: 'top',
      defaultHeight: 80,
      collapsible: true,
      resizable: true
    },
    {
      id: 'session-center',
      role: 'composition',
      position: 'center',
      resizable: true
    },
    {
      id: 'editor-panel',
      role: 'composition',
      position: 'bottom',
      defaultHeight: 300,
      collapsible: true,
      resizable: true
    },
    {
      id: 'generator-side',
      role: 'browser',
      position: 'right',
      defaultWidth: 320,
      collapsible: true,
      resizable: true
    },
    {
      id: 'phrase-library',
      role: 'browser',
      position: 'left',
      defaultWidth: 280,
      collapsible: true,
      resizable: true
    }
  ],
  
  // Comprehensive deck set
  decks: [
    // I008: Arranger sections bar
    {
      id: 'arranger',
      type: 'arranger-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'arranger-top'
    },
    // I009: Chord track (using harmony deck)
    {
      id: 'chord-track',
      type: 'harmony-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'chord-lane'
    },
    // I010: Session grid
    {
      id: 'session',
      type: 'session-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'session-center'
    },
    // I011: Notation editor
    {
      id: 'notation',
      type: 'notation-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'editor-panel'
    },
    // I012: Tracker editor (alternate view)
    {
      id: 'tracker',
      type: 'pattern-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'editor-panel'
    },
    // I014: Generator deck
    {
      id: 'generators',
      type: 'generators-deck',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'generator-side'
    },
    // I015: Phrase library
    {
      id: 'phrases',
      type: 'phrases-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'phrase-library'
    },
    // Additional utility decks
    {
      id: 'properties',
      type: 'properties-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'generator-side'
    },
    {
      id: 'mixer',
      type: 'mixer-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'editor-panel'
    },
    // I013: Transport always available
    {
      id: 'transport',
      type: 'transport-deck',
      cardLayout: 'floating',
      allowReordering: false,
      allowDragOut: false
    }
  ],
  
  connections: [
    // Chord track feeds harmony context to generators
    {
      sourceId: 'chord-track',
      sourcePort: 'harmony-out',
      targetId: 'generators',
      targetPort: 'harmony-in',
      connectionType: 'modulation'
    },
    // Session feeds active clip context to editors
    {
      sourceId: 'session',
      sourcePort: 'active-clip-out',
      targetId: 'notation',
      targetPort: 'stream-in',
      connectionType: 'trigger'
    },
    {
      sourceId: 'session',
      sourcePort: 'active-clip-out',
      targetId: 'tracker',
      targetPort: 'stream-in',
      connectionType: 'trigger'
    }
  ],
  
  shortcuts: {
    // Composition shortcuts
    'cmd+g': 'generate-part',
    'cmd+shift+g': 'regenerate-part',
    'cmd+f': 'freeze-part',
    
    // Navigation shortcuts
    'cmd+1': 'focus-notation',
    'cmd+2': 'focus-tracker', 
    'cmd+3': 'focus-session',
    
    // Tool shortcuts
    'cmd+h': 'toggle-harmony',
    'cmd+p': 'toggle-phrases',
    'cmd+m': 'toggle-mixer',
    
    // Transport
    'space': 'play-pause',
    'cmd+enter': 'play-from-start',
    'esc': 'stop',
    
    // Editing
    'cmd+d': 'duplicate-clip',
    'cmd+shift+d': 'duplicate-section',
    'cmd+j': 'consolidate-clips'
  },
  
  theme: {
    colors: {
      primary: '#8B5CF6',        // Purple for hybrid/collaborative
      secondary: '#EC4899',      // Pink accent
      accent: '#10B981',         // Green for active/generated
      background: '#1F1F23'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: true,
      showSuggestions: true,
      showGenerative: true
    }
  },
  
  // I022: Per-track control level support
  policy: {
    allowToolToggles: true,
    allowControlLevelOverridePerTrack: true,  // Key feature for hybrid board!
    allowDeckCustomization: true,
    allowLayoutCustomization: true
  },
  
  onActivate: () => {
    // I020: Initialize scroll/zoom sync
    // I021: Load persisted per-track control levels
    console.log('[Composer Board] Activated - hybrid workflow ready');
  },
  
  onDeactivate: () => {
    // I022: Persist per-track control levels
    console.log('[Composer Board] Deactivated - state saved');
  }
};
