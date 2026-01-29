/**
 * @fileoverview Tracker + Phrases Board (Assisted)
 * 
 * Tracker board with phrase library drag/drop assistance.
 * Manual editing with phrase database for faster composition.
 * 
 * @module @cardplay/boards/builtins/stub-tracker-phrases
 */

import type { Board } from '../types';

/**
 * Tracker + Phrases board definition.
 * 
 * Phase G board - assisted tracker with phrase library.
 */
export const trackerPhrasesBoard: Board = {
  id: 'tracker-phrases',
  name: 'Tracker + Phrases',
  description: 'Tracker with phrase library - drag phrases, then edit',
  icon: '📝',
  category: 'Assisted',
  controlLevel: 'assisted',
  difficulty: 'intermediate',
  tags: ['tracker', 'assisted', 'phrases', 'fast-workflow'],
  
  primaryView: 'tracker',
  
  philosophy: 'Drag phrases for speed, edit manually for precision',
  
  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'drag-drop' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' },
  },
  
  panels: [
      {
        id: 'sidebar',
        role: 'browser',
        position: 'left',
        defaultWidth: 300,
      },
      {
        id: 'main',
        role: 'composition',
        position: 'center',
      },
      {
        id: 'properties',
        role: 'properties',
        position: 'right',
        defaultWidth: 300,
      },
    ],
  
  layout: {
    type: 'dock',
    panels: [
      {
        id: 'sidebar',
        role: 'browser',
        position: 'left',
        defaultWidth: 300,
      },
      {
        id: 'main',
        role: 'composition',
        position: 'center',
      },
      {
        id: 'properties',
        role: 'properties',
        position: 'right',
        defaultWidth: 300,
      },
    ],
  },
  
  decks: [
    {
      id: 'pattern-editor-main',
      type: 'pattern-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
    },
    {
      id: 'phrase-library-sidebar',
      type: 'phrases-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
    },
    {
      id: 'instrument-browser-sidebar',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
    },
    {
      id: 'properties-main',
      type: 'properties-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
    },
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#8e44ad',
      secondary: '#9b59b6',
      accent: '#e74c3c',
      background: '#2c3e50',
    },
    typography: {
      fontFamily: '"Fira Code", "Consolas", monospace',
      fontSize: 14,
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: true,
      showGenerative: false,
    },
  },
  
  shortcuts: {
    'pattern:clone': 'Cmd+D',
    'phrase:search': 'Cmd+P',
    'phrase:preview': 'Space',
    'phrase:commit-selection': 'Cmd+Shift+S',
    'tracker:follow-playback': 'ScrollLock',
  },
  
  author: 'CardPlay Team',
  version: '1.0.0',
};
