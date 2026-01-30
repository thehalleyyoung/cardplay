/**
 * @fileoverview Tracker + Harmony Board (Assisted) - G001-G030
 * 
 * Tracker workflow with harmony hints. Manual control with non-intrusive
 * chord/scale highlighting and suggestions. Perfect for learning harmony
 * while composing in a tracker.
 * 
 * @module @cardplay/boards/builtins/tracker-harmony-board
 */

import type { Board } from '../types';
import { getBoardSettingsStore } from '../settings/store';

export const trackerHarmonyBoard: Board = {
  id: 'tracker-harmony',
  name: 'Tracker + Harmony',
  description: 'Tracker with harmony hints. Write manually, see chord tones highlighted. Learn harmony as you compose.',
  icon: '🎵',
  category: 'Assisted',
  difficulty: 'intermediate',
  tags: ['tracker', 'harmony', 'assisted', 'hints', 'learning', 'theory'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'manual-with-hints',
  philosophy: 'You write, it hints - learn harmony naturally',
  
  primaryView: 'tracker',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: true, mode: 'display-only' },  // Show hints, no auto-apply
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
        defaultWidth: 280
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
      id: 'harmony',
      role: 'browser',
      position: 'left',
      defaultWidth: 280,
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
    // Harmony display (left panel)
    {
      id: 'harmony-display',
      type: 'harmony-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'harmony'
    },
    // Optional instrument browser (tab in left panel)
    {
      id: 'instruments',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
      panelId: 'harmony'
    },
    // Pattern editor (center)
    {
      id: 'pattern-editor',
      type: 'pattern-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'pattern'
    },
    // Properties inspector (right)
    {
      id: 'properties',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'inspector'
    }
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#10b981',  // Green for hints
      secondary: '#3b82f6',
      accent: '#f59e0b',
      background: '#1a1a1a'
    },
    typography: {
      fontFamily: '"Fira Code", "Consolas", monospace',
      fontSize: 14
    },
    controlIndicators: {
      showHints: true,        // Show hint indicators
      showSuggestions: false,
      showGenerative: false
    }
  },
  
  shortcuts: {
    // Tracker navigation
    'pattern-next': 'Cmd+Down',
    'pattern-prev': 'Cmd+Up',
    'pattern-clone': 'Cmd+D',
    'toggle-follow': 'F',
    'toggle-loop': 'L',
    
    // Harmony controls
    'set-chord': 'Cmd+K',
    'set-key': 'Cmd+Shift+K',
    'toggle-harmony-colors': 'Cmd+H',
    'toggle-roman-numerals': 'Cmd+Shift+H',
    'next-chord-suggestion': 'Alt+Right',
    'prev-chord-suggestion': 'Alt+Left',
    
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
    allowToolToggles: true,                      // User can toggle harmony display on/off
    allowControlLevelOverridePerTrack: false,    // Tracker must stay manual (no per-track override)
    allowDeckCustomization: false,                // Fixed deck layout
    allowLayoutCustomization: true                // Can resize/collapse panels
  },
  
  onActivate: () => {
    console.log('Tracker + Harmony board activated');
    
    // G016: Initialize harmony context with default values if not set
    const boardSettings = getBoardSettingsStore();
    const settings = boardSettings.getSettings('tracker-harmony');
    
    if (!settings.harmony?.currentKey) {
      // G015: Set default key to C major
      boardSettings.updateHarmonySettings('tracker-harmony', {
        currentKey: 'C',
        currentChord: 'Cmaj',
        showHarmonyColors: true,
        showRomanNumerals: false
      });
      console.log('Initialized default harmony context: C major');
    } else {
      console.log('Restored harmony context:', settings.harmony);
    }
  },
  
  onDeactivate: () => {
    console.log('Tracker + Harmony board deactivated');
    
    // Harmony context is persisted automatically by BoardSettingsStore
    // No explicit save needed
  }
};
