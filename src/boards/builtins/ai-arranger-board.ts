/**
 * @fileoverview AI Arranger Board (Directed) - H001-H025
 * 
 * Directed board with AI-driven arrangement. User sets direction
 * (chord progressions, style, energy), AI generates musical parts,
 * user curates and refines.
 * 
 * @module @cardplay/boards/builtins/ai-arranger-board
 */

import type { Board } from '../types';

/**
 * AI Arranger board definition.
 * 
 * Phase H board (H001-H025) - directed arrangement with AI generation.
 * 
 * Control philosophy: "You set direction, AI fills in"
 * - User defines chord progression and sections
 * - User sets style and energy parameters
 * - AI generates musical parts (drums, bass, pads, etc.)
 * - User can freeze parts to make them editable
 * - Clear visual distinction between generated and manual content
 */
export const aiArrangerBoard: Board = {
  id: 'ai-arranger',
  name: 'AI Arranger',
  description: 'Directed arrangement - set chord progressions and style, AI generates parts, you curate',
  icon: '🎛️',
  category: 'Generative',
  difficulty: 'advanced',
  tags: ['arranger', 'directed', 'ai', 'generation', 'composition'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'directed',
  philosophy: 'You set direction, AI fills in - fast sketching with stylistic control',
  
  primaryView: 'arranger',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: true, mode: 'display-only' },    // Show chord progression
    phraseGenerators: { enabled: true, mode: 'on-demand' },      // H004: for fills
    arrangerCard: { enabled: true, mode: 'chord-follow' },       // H004: main arranger
    aiComposer: { enabled: false, mode: 'hidden' }               // Keep separate from arranger
  },
  
  layout: {
    type: 'dock',
    panels: [
      {
        id: 'arranger',
        role: 'toolbar',
        position: 'top',
        defaultHeight: 200
      },
      {
        id: 'session',
        role: 'composition',
        position: 'center'
      },
      {
        id: 'generator',
        role: 'browser',
        position: 'right',
        defaultWidth: 300
      },
      {
        id: 'mixer',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 180
      }
    ]
  },
  
  panels: [
    {
      id: 'arranger',
      role: 'toolbar',
      position: 'top',
      defaultHeight: 200,
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
      role: 'browser',
      position: 'right',
      defaultWidth: 300,
      collapsible: true,
      resizable: true
    },
    {
      id: 'mixer',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 180,
      collapsible: true,
      resizable: true
    }
  ],
  
  decks: [
    // H008: Arranger deck (top - sections + style/energy controls)
    {
      id: 'arranger',
      type: 'arranger-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // H009: Clip session (center - launching arranged parts)
    {
      id: 'clip-session',
      type: 'session-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // H010: Generator (right - on-demand variations and fills)
    {
      id: 'generators',
      type: 'generators-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // H011: Mixer (bottom - balancing generated parts)
    {
      id: 'mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // H012: Properties (tab - per-part generation settings)
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
      primary: '#ec4899',      // Pink for AI direction
      secondary: '#8b5cf6',
      accent: '#10b981',        // Green for approved/frozen parts
      background: '#1a1a1a'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: true,
      showGenerative: true     // H020: Clear control-level indicators per track
    }
  },
  
  shortcuts: {
    // H016: Regeneration shortcuts
    'regenerate-section': 'Cmd+R',
    'regenerate-part': 'Cmd+Shift+R',
    'freeze-section': 'Cmd+F',
    'freeze-part': 'Cmd+Shift+F',
    
    // H018: Per-part controls
    'humanize': 'Cmd+H',
    'quantize': 'Cmd+Q',
    
    // Section navigation
    'next-section': 'Right',
    'prev-section': 'Left',
    'add-section': 'Cmd+N',
    'duplicate-section': 'Cmd+D',
    
    // Part toggles (H013)
    'toggle-drums': '1',
    'toggle-bass': '2',
    'toggle-harmony': '3',
    'toggle-melody': '4',
    
    // H021: Capture to manual board
    'capture-to-manual': 'Cmd+Shift+M',
    
    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'play': 'Space',
    'stop': 'Escape'
  },
  
  policy: {
    allowToolToggles: true,                      // Can enable/disable generators
    allowControlLevelOverridePerTrack: true,     // H020: Per-part control levels
    allowDeckCustomization: false,
    allowLayoutCustomization: true
  },
  
  onActivate: () => {
    console.log('AI Arranger board activated');
    // TODO H013: Initialize arranger UI (chord input, section blocks, part toggles)
    // TODO H014: Set up per-track stream creation
    // TODO H019: Load style presets (lofi, house, ambient)
  },
  
  onDeactivate: () => {
    console.log('AI Arranger board deactivated');
    // TODO H018: Persist humanize settings per part
    // TODO: Save current arrangement structure
  }
};
