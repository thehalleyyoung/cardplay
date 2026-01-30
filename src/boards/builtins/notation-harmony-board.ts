/**
 * @fileoverview Notation + Harmony Board (Assisted) - G091-G120
 * 
 * Notation board with harmonic guidance. Write notes manually with
 * chord suggestions and harmony analysis to support learning and
 * compositional decision-making.
 * 
 * @module @cardplay/boards/builtins/notation-harmony-board
 */

import type { Board } from '../types';

/**
 * Notation + Harmony board definition.
 * 
 * Phase G board (G091-G120) - assisted notation with harmony guidance.
 * 
 * Control philosophy: "Write notes, get harmonic guidance"
 * - User writes notes manually in notation view
 * - Harmony helper shows current chord and scale context
 * - Suggests next chords based on theory rules
 * - Optional chord tone highlighting overlay
 * - Optional "snap to chord tones" helper action
 */
export const notationHarmonyBoard: Board = {
  id: 'notation-harmony',
  name: 'Notation + Harmony',
  description: 'Notation board with harmonic guidance - write notes, see suggestions, learn harmony',
  icon: '🎼',
  category: 'Assisted',
  difficulty: 'intermediate',
  tags: ['notation', 'harmony', 'assisted', 'learning', 'theory', 'orchestral'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'assisted',
  philosophy: 'Write notes, get harmonic guidance - learn theory through composition',
  
  primaryView: 'notation',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: true, mode: 'suggest' },        // G094: suggest mode with clickable chord suggestions
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  },
  
  layout: {
    type: 'dock',
    panels: [
      {
        id: 'harmony',
        role: 'browser',
        position: 'left',
        defaultWidth: 300
      },
      {
        id: 'score',
        role: 'composition',
        position: 'center'
      },
      {
        id: 'properties',
        role: 'properties',
        position: 'right',
        defaultWidth: 280
      }
    ]
  },
  
  panels: [
    {
      id: 'harmony',
      role: 'browser',
      position: 'left',
      defaultWidth: 300,
      collapsible: true,
      resizable: true
    },
    {
      id: 'score',
      role: 'composition',
      position: 'center',
      resizable: true
    },
    {
      id: 'properties',
      role: 'properties',
      position: 'right',
      defaultWidth: 280,
      collapsible: true,
      resizable: true
    }
  ],
  
  decks: [
    // G097: Notation score (center panel)
    {
      id: 'notation-score',
      type: 'notation-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'score'
    },
    // G098: Harmony display (left panel)
    {
      id: 'harmony-helper',
      type: 'harmony-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'harmony'
    },
    // G099: Optional instrument browser (left panel tab)
    {
      id: 'instruments',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
      panelId: 'harmony'
    },
    // G100: Properties (right panel)
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
      primary: '#2563eb',      // Blue for notation
      secondary: '#10b981',    // Green for harmony suggestions
      accent: '#f59e0b',       // Amber for highlights
      background: '#ffffff'    // Light background for notation readability
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: true,
      showSuggestions: true,   // G101: Clickable chord suggestions
      showGenerative: false
    }
  },
  
  shortcuts: {
    // G108: Harmony shortcuts
    'harmony:open-suggestions': 'Cmd+H',
    'harmony:accept-suggestion': 'Enter',
    'harmony:next-suggestion': 'Down',
    'harmony:prev-suggestion': 'Up',
    'harmony:toggle-highlights': 'Cmd+Shift+H',
    
    // G104: Helper actions
    'harmony:snap-to-chord-tones': 'Cmd+Shift+C',
    'harmony:harmonize-selection': 'Cmd+Shift+V',
    'harmony:reharmonize': 'Cmd+Shift+R',
    
    // Notation editing
    'note:add': 'N',
    'note:delete': 'Delete',
    'note:move-up': 'Up',
    'note:move-down': 'Down',
    'note:duration-increase': 'Cmd+Right',
    'note:duration-decrease': 'Cmd+Left',
    
    // View
    'zoom-in': 'Cmd+=',
    'zoom-out': 'Cmd+-',
    'zoom-reset': 'Cmd+0',
    
    // Global
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'cut': 'Cmd+X',
    'copy': 'Cmd+C',
    'paste': 'Cmd+V',
    'select-all': 'Cmd+A'
  },
  
  policy: {
    allowToolToggles: true,                      // User can toggle harmony suggestions on/off
    allowControlLevelOverridePerTrack: false,    // Notation stays assisted (no per-track override)
    allowDeckCustomization: false,               // Fixed deck layout
    allowLayoutCustomization: true               // Can resize/collapse panels
  },
  
  onActivate: () => {
    console.log('Notation + Harmony board activated');
    // TODO G101: Initialize harmony display with current chord/key
    // TODO G102: Set up clickable chord suggestions
    // TODO G103: Enable chord tones highlight overlay
    // TODO G107: Load persisted key/chord context settings
  },
  
  onDeactivate: () => {
    console.log('Notation + Harmony board deactivated');
    // TODO G107: Persist key/chord context settings per board
  }
};
