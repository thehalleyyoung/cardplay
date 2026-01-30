/**
 * @fileoverview Basic Session Board (Manual)
 * 
 * Session-based clip launching board (Ableton Live-style).
 * Manual clip creation and launching without generators.
 * 
 * @module @cardplay/boards/builtins/stub-session
 */

import type { Board } from '../types';

/**
 * Basic Session board definition.
 * 
 * Phase F board - manual session/clip workflow.
 */
export const basicSessionBoard: Board = {
  id: 'basic-session',
  name: 'Basic Session',
  description: 'Manual clip launching - create, arrange, and perform',
  icon: '🎛️',
  category: 'Manual',
  controlLevel: 'full-manual',
  difficulty: 'beginner',
  tags: ['session', 'manual', 'clips', 'performance'],
  
  primaryView: 'session',
  
  philosophy: 'Manual clip launching and arrangement - you create every part',
  
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
        id: 'mixer',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 200,
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
      id: 'clip-session-main',
      type: 'session-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'main',
    },
    {
      id: 'instrument-browser-sidebar',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'sidebar',
    },
    {
      id: 'mixer-main',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'mixer',
    },
    {
      id: 'properties-main',
      type: 'properties-deck',
      cardLayout: 'tabs',
      allowReordering: false,
      allowDragOut: false,
      panelId: 'properties',
    },
  ],
  
  connections: [],
  
  shortcuts: {
    'session:launch-clip': 'Enter',
    'session:launch-scene': 'Shift+Enter',
    'session:stop': 'Cmd+.',
    'session:arm-track': 'Cmd+R',
    'session:duplicate-slot': 'Cmd+D',
  },
  
  author: 'CardPlay Team',
  version: '1.0.0',
};
