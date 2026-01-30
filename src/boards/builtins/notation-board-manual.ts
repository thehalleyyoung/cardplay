/**
 * @fileoverview Notation Board (Manual) - F001-F030
 * 
 * Manual notation board for traditional score composition.
 * No AI assistance, pure engraving and manual note entry.
 * 
 * @module @cardplay/boards/builtins/notation-board-manual
 */

import type { Board } from '../types';

export const notationBoardManual: Board = {
  id: 'notation-manual',
  name: 'Notation (Manual)',
  description: 'Traditional score composition with no suggestions. Pure manual engraving.',
  icon: '🎼',
  category: 'Manual',
  difficulty: 'intermediate',
  tags: ['notation', 'score', 'manual', 'classical', 'engraving'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'full-manual',
  philosophy: 'Manual notation composition only',
  
  primaryView: 'notation',
  
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
        id: 'players',
        role: 'browser',
        position: 'left',
        defaultWidth: 280
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
        defaultWidth: 300
      }
    ]
  },
  
  panels: [
    {
      id: 'players',
      role: 'browser',
      position: 'left',
      defaultWidth: 280
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
      defaultWidth: 300
    }
  ],
  
  decks: [
    {
      id: 'notation-score-main',
      type: 'notation-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'score'
    },
    {
      id: 'instrument-browser-players',
      type: 'instruments-deck',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: true,
      panelId: 'players'
    },
    {
      id: 'properties-panel',
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
      primary: '#2c3e50',
      secondary: '#34495e',
      accent: '#3498db',
      background: '#ffffff'
    },
    typography: {
      fontFamily: '"Bravura", "Academico", serif',
      fontSize: 16
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: false
    }
  },
  
  shortcuts: {
    'note-c': 'C',
    'note-d': 'D',
    'note-e': 'E',
    'note-f': 'F',
    'note-g': 'G',
    'note-a': 'A',
    'note-b': 'B',
    'accidental-sharp': 'Shift+3',
    'accidental-flat': 'Shift+Minus',
    'accidental-natural': 'Shift+Equal',
    'duration-whole': '1',
    'duration-half': '2',
    'duration-quarter': '4',
    'duration-eighth': '8',
    'duration-sixteenth': '6',
    'toggle-tie': 'T',
    'toggle-dot': 'Period',
    'add-staff': 'Cmd+Shift+S',
    'change-clef': 'K',
    'transpose': 'Cmd+T',
    'export-pdf': 'Cmd+E',
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z'
  },
  
  onActivate: () => {
    console.log('Notation (Manual) board activated');
  },
  
  onDeactivate: () => {
    console.log('Notation (Manual) board deactivated');
  }
};
