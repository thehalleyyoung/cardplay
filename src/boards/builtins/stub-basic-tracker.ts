/**
 * @fileoverview Basic Tracker Board (Manual)
 * 
 * Pure manual tracker board with no AI assistance.
 * For users who want complete control over pattern-based composition.
 * 
 * @module @cardplay/boards/builtins/stub-basic-tracker
 */

import type { Board } from '../types';

/**
 * Basic Tracker board definition.
 * 
 * Phase F board - fully manual tracker workflow.
 */
export const basicTrackerBoard: Board = {
  id: 'basic-tracker',
  name: 'Basic Tracker',
  description: 'Pure manual tracker - you control every note and effect',
  icon: '🎹',
  category: 'Manual',
  controlLevel: 'full-manual',
  difficulty: 'intermediate',
  tags: ['tracker', 'manual', 'patterns', 'classic'],
  
  primaryView: 'tracker',
  
  philosophy: 'Pure tracker workflow - you control every note and effect command',
  
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
      id: 'pattern-editor-main',
      type: 'pattern-deck',
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
      id: 'dsp-chain-sidebar',
      type: 'effects-deck',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false,
      panelId: 'sidebar',
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
    'pattern:clone': 'Cmd+D',
    'pattern:double-length': 'Cmd+Shift+D',
    'pattern:halve-length': 'Cmd+Shift+H',
    'tracker:toggle-hex': 'Cmd+H',
    'tracker:octave-up': 'Num*',
    'tracker:octave-down': 'Num/',
    'tracker:follow-playback': 'ScrollLock',
  },
  
  author: 'CardPlay Team',
  version: '1.0.0',
};
