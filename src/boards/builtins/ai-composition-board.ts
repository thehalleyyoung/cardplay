/**
 * @fileoverview AI Composition Board (Directed) - H026-H050
 * 
 * Directed board for AI-assisted composition. User describes intent
 * via prompts/constraints, system drafts music, user reviews and refines.
 * 
 * @module @cardplay/boards/builtins/ai-composition-board
 */

import type { Board } from '../types';

/**
 * AI Composition board definition.
 * 
 * Phase H board (H026-H050) - directed composition with AI drafting.
 * 
 * Control philosophy: "Describe intent, system drafts"
 * - User provides compositional intent via prompts
 * - User sets constraints (key, chords, density, register)
 * - System generates draft into new clip/stream
 * - User reviews in notation/tracker and accepts/rejects
 * - Diff preview shows proposed vs existing
 */
export const aiCompositionBoard: Board = {
  id: 'ai-composition',
  name: 'AI Composition',
  description: 'Directed composition - describe intent, system drafts, you refine in notation or tracker',
  icon: '🤖',
  category: 'Generative',
  difficulty: 'advanced',
  tags: ['ai-composer', 'directed', 'prompts', 'drafting', 'collaboration'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'directed',
  philosophy: 'Describe intent, system drafts - collaborative composition workflow',
  
  primaryView: 'composer',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: true, mode: 'display-only' },    // Show chord context
    phraseGenerators: { enabled: true, mode: 'on-demand' },      // H030: For iterative drafts
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: true, mode: 'command-palette' }       // H029: Local prompt templates
  },
  
  layout: {
    type: 'dock',
    panels: [
      {
        id: 'composer',
        role: 'browser',
        position: 'left',
        defaultWidth: 350
      },
      {
        id: 'notation',
        role: 'composition',
        position: 'center'
      },
      {
        id: 'timeline',
        role: 'timeline',
        position: 'bottom',
        defaultHeight: 150
      }
    ]
  },
  
  panels: [
    {
      id: 'composer',
      role: 'browser',
      position: 'left',
      defaultWidth: 350,
      collapsible: true,
      resizable: true
    },
    {
      id: 'notation',
      role: 'composition',
      position: 'center',
      resizable: true
    },
    {
      id: 'timeline',
      role: 'timeline',
      position: 'bottom',
      defaultHeight: 150,
      collapsible: true,
      resizable: true
    }
  ],
  
  decks: [
    // H033: AI advisor deck (left - prompt/command surface)
    // Using ai-advisor-deck as closest match for AI composition interface
    {
      id: 'ai-composer',
      type: 'ai-advisor-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // H034: Notation score (center - edit AI draft)
    {
      id: 'notation-score',
      type: 'notation-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false
    },
    // H035: Pattern editor (tabbed alternative)
    {
      id: 'pattern-editor',
      type: 'pattern-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false
    },
    // H036: Timeline (bottom - arrange generated clips)
    {
      id: 'timeline',
      type: 'arrangement-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    // Properties for constraints
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
      primary: '#06b6d4',      // Cyan for AI composition
      secondary: '#8b5cf6',
      accent: '#f59e0b',        // Amber for draft mode
      background: '#1a1a1a'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: true,
      showGenerative: true     // H046: Clear draft/committed indicators
    }
  },
  
  shortcuts: {
    // H045: AI composer shortcuts
    'open-composer': 'Cmd+K',           // Command palette
    'accept-draft': 'Cmd+Enter',
    'reject-draft': 'Cmd+Backspace',
    'regenerate': 'Cmd+R',
    
    // H040: Generation modes
    'generate-draft': 'Cmd+G',
    'replace-selection': 'Cmd+Shift+G',
    'append': 'Cmd+Option+G',
    'generate-variation': 'Cmd+Shift+V',
    
    // H044: Commit actions
    'commit-to-library': 'Cmd+S',
    'save-as-phrase': 'Cmd+Shift+S',
    
    // Navigation
    'switch-to-notation': 'Cmd+1',
    'switch-to-tracker': 'Cmd+2',
    'switch-to-timeline': 'Cmd+3',
    
    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'play': 'Space',
    'stop': 'Escape'
  },
  
  policy: {
    allowToolToggles: true,
    allowControlLevelOverridePerTrack: false,    // Composition board stays directed
    allowDeckCustomization: false,
    allowLayoutCustomization: true
  },
  
  onActivate: () => {
    console.log('AI Composition board activated');
    // TODO H037: Initialize AI composer UI (prompt box, target scope, Generate button)
    // TODO H038: Load prompt → generator config mapping
    // TODO H042: Initialize constraints UI (key, chords, density, register, rhythm feel)
  },
  
  onDeactivate: () => {
    console.log('AI Composition board deactivated');
    // TODO H043: Persist chord stream if exists
    // TODO: Save draft state and constraints
  }
};
