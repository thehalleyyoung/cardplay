/**
 * @fileoverview Notation Board (Manual)
 * 
 * Traditional notation-first composition board.
 * For composers who think in scores and staves.
 * 
 * @module @cardplay/boards/builtins/stub-notation
 */

import type { Board } from '../types';

/**
 * Notation Manual board definition.
 * 
 * Phase F board - pure manual notation composition.
 */
export const notationManualBoard: Board = {
  id: 'notation-manual',
  name: 'Notation (Manual)',
  description: 'Traditional score editing with full manual control',
  icon: '🎼',
  category: 'Manual',
  controlLevel: 'full-manual',
  difficulty: 'intermediate',
  tags: ['notation', 'manual', 'score', 'classical'],
  
  primaryView: 'notation',
  
  philosophy: 'Traditional composition - you write every note on the staff',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
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
        defaultWidth: 250,
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
    panels: [],
  },
  
  decks: [
    {
      id: 'notation-score-main',
      type: 'notation-deck',
      cardLayout: 'tabs',
      allowReordering: false,
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
  
  shortcuts: {
    'notation:add-staff': 'Cmd+Shift+N',
    'notation:change-clef': 'Cmd+K',
    'notation:transpose': 'Cmd+T',
    'notation:check-score': 'Cmd+Shift+C',
    'notation:export-pdf': 'Cmd+E',
  },
  
  author: 'CardPlay Team',
  version: '1.0.0',
};
