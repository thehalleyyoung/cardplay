/**
 * @fileoverview Basic Sampler Board (Manual) - F061-F090
 * 
 * Manual sampler board for sample-based composition and arrangement.
 * Provides sample browser, timeline arrangement, waveform editing,
 * and DSP chain with no AI assistance.
 * 
 * @module @cardplay/boards/builtins/basic-sampler-board
 */

import type { Board } from '../types';

export const basicSamplerBoard: Board = {
  id: 'basic-sampler',
  name: 'Basic Sampler',
  description: 'Manual sample-based composition. You chop, you arrange, you create.',
  icon: '🎛️',
  category: 'Manual',
  difficulty: 'intermediate',
  tags: ['sampler', 'manual', 'samples', 'arrangement', 'sp404'],
  author: 'CardPlay',
  version: '1.0.0',
  
  controlLevel: 'full-manual',
  philosophy: 'You chop, you arrange - pure manual sampling',
  
  primaryView: 'sampler',
  
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
        id: 'sample-pool',
        role: 'browser',
        position: 'left',
        defaultWidth: 320
      },
      {
        id: 'arrangement',
        role: 'timeline',
        position: 'center'
      },
      {
        id: 'waveform',
        role: 'composition',
        position: 'bottom',
        defaultHeight: 250
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
      id: 'sample-pool',
      role: 'browser',
      position: 'left',
      defaultWidth: 320
    },
    {
      id: 'arrangement',
      role: 'timeline',
      position: 'center'
    },
    {
      id: 'waveform',
      role: 'composition',
      position: 'bottom',
      defaultHeight: 250
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
      id: 'sample-browser-pool',
      type: 'samples-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true
    },
    {
      id: 'timeline-arrangement',
      type: 'arrangement-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'dsp-chain-effects',
      type: 'dsp-chain',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false
    },
    {
      id: 'properties-panel',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    }
  ],
  
  connections: [],
  
  theme: {
    colors: {
      primary: '#ff9f1c',
      secondary: '#2ec4b6',
      accent: '#e71d36',
      background: '#011627'
    },
    typography: {
      fontFamily: '"Inter", -apple-system, sans-serif',
      fontSize: 14
    },
    controlIndicators: {
      showHints: false,
      showSuggestions: false,
      showGenerative: false
    }
  },
  
  shortcuts: {
    'import-sample': 'Cmd+I',
    'chop-grid': 'Cmd+K',
    'chop-manual': 'Cmd+Shift+K',
    'zoom-waveform-in': 'Cmd+Plus',
    'zoom-waveform-out': 'Cmd+Minus',
    'audition-sample': 'Space',
    'toggle-snap': 'N',
    'time-stretch': 'Cmd+T',
    'pitch-shift': 'Cmd+P',
    'normalize': 'Cmd+N',
    'reverse': 'Cmd+R',
    'fade-in': 'Shift+I',
    'fade-out': 'Shift+O',
    'duplicate-clip': 'Cmd+D',
    'split-clip': 'Cmd+E',
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z'
  },
  
  onActivate: () => {
    console.log('Basic Sampler board activated');
  },
  
  onDeactivate: () => {
    console.log('Basic Sampler board deactivated');
  }
};
