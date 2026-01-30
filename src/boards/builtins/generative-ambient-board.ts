/**
 * @fileoverview Generative Ambient Board (Generative) - H051-H075
 * 
 * Fully generative board for ambient music. System generates continuously,
 * user curates by accepting/rejecting generated material and setting constraints.
 * 
 * @module @cardplay/boards/builtins/generative-ambient-board
 */

import type { Board } from '../types';

/**
 * Generative Ambient board definition.
 * 
 * Phase H board (H051-H075) - continuous generation with curation.
 * 
 * Control philosophy: "System generates, you curate"
 * - System runs continuous generation loop
 * - Proposes candidate clips/phrases over time
 * - User accepts (commit to store) or rejects (discard)
 * - User can capture "best moments" as arranged clips
 * - User sets global constraints (tempo, density, harmony, mood)
 */
export const generativeAmbientBoard: Board = {
  id: 'generative-ambient',
  name: 'Generative Ambient',
  description: 'Continuous generative ambient - system evolves soundscapes, you curate and capture moments',
  icon: '🌊',
  category: 'Generative',
  difficulty: 'beginner',      // Easiest generative board - just listen and curate
  tags: ['generative', 'ambient', 'continuous', 'curation', 'exploration'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'generative',
  philosophy: 'System generates, you curate - ambient soundscape exploration',
  
  primaryView: 'composer',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },         // Optional harmony constraints
    phraseGenerators: { enabled: true, mode: 'continuous' },     // H054: Continuous mode
    arrangerCard: { enabled: false, mode: 'hidden' },            // H055: Optional autonomous mode
    aiComposer: { enabled: false, mode: 'hidden' }
  },
  
  layout: {
    type: 'dock',
    panels: [
      {
        id: 'generator',
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
        id: 'timeline',
        role: 'timeline',
        position: 'right',
        defaultWidth: 350
      },
      {
        id: 'properties',
        role: 'properties',
        position: 'left',
        defaultWidth: 300
      }
    ]
  },
  
  panels: [
    {
      id: 'generator',
      role: 'composition',
      position: 'center',
      resizable: true
    },
    {
      id: 'mixer',
      role: 'mixer',
      position: 'bottom',
      defaultHeight: 200,
      collapsible: true,
      resizable: true
    },
    {
      id: 'timeline',
      role: 'timeline',
      position: 'right',
      defaultWidth: 350,
      collapsible: true,
      resizable: true
    },
    {
      id: 'properties',
      role: 'properties',
      position: 'left',
      defaultWidth: 300,
      collapsible: true,
      resizable: true
    }
  ],
  
  decks: [
    // H058: Generator stream (center - continuous output view)
    {
      id: 'generator-stream',
      type: 'generators-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'generator'
    },
    // H059: Mixer (bottom - balance evolving layers)
    {
      id: 'mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'mixer'
    },
    // H060: Timeline (right - capture best moments)
    {
      id: 'timeline',
      type: 'arrangement-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'timeline'
    },
    // H061: Properties (left - global constraints)
    {
      id: 'properties',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'properties'
    }
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#6366f1',      // Indigo for generative
      secondary: '#8b5cf6',
      accent: '#10b981',        // Green for accepted/captured
      background: '#0f172a'    // Darker for ambient mood
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: true     // H069: Clear generated badges and density meters
    }
  },
  
  shortcuts: {
    // H063-H064: Curation actions
    'accept-candidate': 'Enter',
    'reject-candidate': 'Backspace',
    'capture-live': 'Cmd+R',           // H065: Record time window
    
    // H066-H067: Layer controls
    'freeze-layer': 'Cmd+F',
    'regenerate-layer': 'Cmd+Shift+R',
    
    // H068: Mood presets
    'mood-drone': '1',
    'mood-shimmer': '2',
    'mood-granular': '3',
    'mood-minimalist': '4',
    
    // Playback
    'play': 'Space',
    'stop': 'Escape',
    
    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z'
  },
  
  policy: {
    allowToolToggles: true,                      // Can adjust generation parameters
    allowControlLevelOverridePerTrack: true,     // H066: Per-layer freeze/manual override
    allowDeckCustomization: false,
    allowLayoutCustomization: true
  },
  
  onActivate: () => {
    console.log('Generative Ambient board activated');
    // TODO H062: Initialize continuous generation loop
    // TODO H068: Load mood presets (drone, shimmer, granular, minimalist)
    // TODO H070: Set up CPU guardrails (max events/sec, max layers)
  },
  
  onDeactivate: () => {
    console.log('Generative Ambient board deactivated');
    // TODO H062: Stop continuous generation loop
    // TODO: Persist accepted clips and constraints
  }
};
