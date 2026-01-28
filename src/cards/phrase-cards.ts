/**
 * @fileoverview Phrase Card Implementations
 * 
 * Implements the four phrase-related cards:
 * - PhraseGeneratorCard: Generate new phrases with parameters
 * - PhraseBrowserCard: Browse and search phrase database
 * - PhraseVariationCard: Create variations of existing phrases
 * - GhostCopyCard: Manage ghost copies with visual links
 * 
 * @module @cardplay/core/cards/phrase-cards
 */

import type { CardDefinition } from './card-visuals';

// Note: These are simplified card definitions that would need to be fully integrated
// with the actual card system. They provide the metadata and UI configuration needed.

// ============================================================================
// PHRASE GENERATOR CARD
// ============================================================================

/**
 * Phrase Generator Card Definition
 */
export const PHRASE_GENERATOR_CARD: CardDefinition = {
  meta: {
    id: 'phrase-generator',
    name: 'Phrase Generator',
    category: 'generator',
    description: 'Generate new musical phrases with style and complexity controls',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['phrase', 'generator', 'composition', 'rapidcomposer'],
  },
  
  visuals: {
    emoji: '🎼',
    color: '#8B5CF6',
    colorSecondary: '#A78BFA',
    gradient: 'linear',
    gradientAngle: 135,
    glow: 'rgba(139, 92, 246, 0.5)',
    animation: {
      name: 'pulse',
      duration: '1s',
      timing: 'ease-in-out',
      iterationCount: 'infinite',
      keyframes: '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }',
    },
  },
  
  behavior: {
    mode: 'event',
    pure: false,
    stateful: true,
    stochastic: true,
    realtime: false,
    cacheable: true,
    latency: { samples: 0, ms: 0, lookahead: 0, reportedToHost: false },
    cpuIntensity: 'medium',
    memoryFootprint: {
      estimatedMB: 1,
      sampleBufferMB: 0,
      wavetablesMB: 0,
      stateKB: 10,
      dynamicAllocation: false,
    },
    sideEffects: [],
    threadSafety: 'main-only',
    hotReloadable: true,
    stateSerializable: true,
  },
  
  ui: {
    panels: [],
    editorType: 'knobs',
    defaultView: 'expanded',
    resizable: true,
    minWidth: 300,
    maxWidth: 600,
    minHeight: 400,
    maxHeight: 800,
    theme: {
      name: 'dark',
      background: '#1e1e1e',
      foreground: '#ffffff',
      accent: '#8B5CF6',
      border: '#333333',
      shadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: '12px',
      borderRadius: '8px',
    },
  },
  
  ports: {
    inputs: [],
    outputs: [
      {
        name: 'events',
        type: 'Event<any>',
        description: 'Generated phrase events',
      },
    ],
  },
  
  parameters: [
    {
      id: 'lineType',
      type: 'enum',
      label: 'Line Type',
      default: 'melody',
      options: ['melody', 'bass', 'drums', 'chords', 'pad', 'arpeggio'],
      group: 'Basic',
    },
  ],

  presets: [],
};

// ============================================================================
// PHRASE BROWSER CARD
// ============================================================================

/**
 * Phrase Browser Card Definition
 */
export const PHRASE_BROWSER_CARD: CardDefinition = {
  meta: {
    id: 'phrase-browser',
    name: 'Phrase Browser',
    category: 'utility',
    description: 'Search and browse phrase database with filters and preview',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['phrase', 'browser', 'search', 'database'],
  },
  
  visuals: {
    emoji: '📚',
    color: '#3B82F6',
    colorSecondary: '#60A5FA',
    gradient: 'linear',
    gradientAngle: 135,
    glow: 'rgba(59, 130, 246, 0.5)',
  },
  
  behavior: {
    mode: 'event',
    pure: false,
    stateful: true,
    stochastic: false,
    realtime: false,
    cacheable: true,
    latency: { samples: 0, ms: 0, lookahead: 0, reportedToHost: false },
    cpuIntensity: 'light',
    memoryFootprint: {
      estimatedMB: 5,
      sampleBufferMB: 0,
      wavetablesMB: 0,
      stateKB: 50,
      dynamicAllocation: false,
    },
    sideEffects: [],
    threadSafety: 'main-only',
    hotReloadable: true,
    stateSerializable: true,
  },
  
  ui: {
    panels: [],
    editorType: 'custom',
    defaultView: 'expanded',
    resizable: true,
    minWidth: 400,
    maxWidth: 800,
    minHeight: 500,
    maxHeight: 1000,
    theme: {
      name: 'dark',
      background: '#1e1e1e',
      foreground: '#ffffff',
      accent: '#3B82F6',
      border: '#333333',
      shadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: '12px',
      borderRadius: '8px',
    },
  },
  
  ports: {
    inputs: [],
    outputs: [
      {
        name: 'phrase',
        type: 'Event<any>',
        description: 'Selected phrase',
      },
    ],
  },
  
  parameters: [
    {
      id: 'query',
      type: 'string',
      label: 'Search Query',
      default: '',
      group: 'Search',
    },
  ],

  presets: [],
};

// ============================================================================
// PHRASE VARIATION CARD
// ============================================================================

/**
 * Phrase Variation Card Definition
 */
export const PHRASE_VARIATION_CARD: CardDefinition = {
  meta: {
    id: 'phrase-variation',
    name: 'Phrase Variation',
    category: 'transform',
    description: 'Create variations using 28 transformation algorithms',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['phrase', 'variation', 'transform', 'mutation'],
  },
  
  visuals: {
    emoji: '🔀',
    color: '#10B981',
    colorSecondary: '#34D399',
    gradient: 'linear',
    gradientAngle: 135,
    glow: 'rgba(16, 185, 129, 0.5)',
    animation: {
      name: 'spin',
      duration: '2s',
      timing: 'linear',
      iterationCount: 'infinite',
      keyframes: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
    },
  },
  
  behavior: {
    mode: 'event',
    pure: true,
    stateful: false,
    stochastic: true,
    realtime: true,
    cacheable: true,
    latency: { samples: 0, ms: 0, lookahead: 0, reportedToHost: false },
    cpuIntensity: 'medium',
    memoryFootprint: {
      estimatedMB: 1,
      sampleBufferMB: 0,
      wavetablesMB: 0,
      stateKB: 10,
      dynamicAllocation: false,
    },
    sideEffects: [],
    threadSafety: 'audio-safe',
    hotReloadable: true,
    stateSerializable: false,
  },
  
  ui: {
    panels: [],
    editorType: 'knobs',
    defaultView: 'expanded',
    resizable: true,
    minWidth: 350,
    maxWidth: 700,
    minHeight: 450,
    maxHeight: 900,
    theme: {
      name: 'dark',
      background: '#1e1e1e',
      foreground: '#ffffff',
      accent: '#10B981',
      border: '#333333',
      shadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: '12px',
      borderRadius: '8px',
    },
  },
  
  ports: {
    inputs: [
      {
        name: 'events',
        type: 'Event<any>',
        description: 'Input phrase events',
      },
    ],
    outputs: [
      {
        name: 'events-out',
        type: 'Event<any>',
        description: 'Varied phrase events',
      },
    ],
  },
  
  parameters: [
    {
      id: 'variationType',
      type: 'enum',
      label: 'Variation Type',
      default: 'transpose',
      options: [
        'transpose', 'invert', 'retrograde', 'augmentation', 'diminution',
        'syncopate', 'humanize', 'thin', 'thicken', 'simplify',
      ],
      group: 'Variation',
    },
  ],

  presets: [],
};

// ============================================================================
// GHOST COPY CARD
// ============================================================================

/**
 * Ghost Copy Card Definition
 */
export const GHOST_COPY_CARD: CardDefinition = {
  meta: {
    id: 'ghost-copy',
    name: 'Ghost Copy',
    category: 'utility',
    description: 'Create linked variations with selective dimension updates',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['phrase', 'ghost', 'copy', 'link', 'variation'],
  },
  
  visuals: {
    emoji: '👻',
    color: '#8B5CF6',
    colorSecondary: '#A78BFA',
    gradient: 'linear',
    gradientAngle: 135,
    glow: 'rgba(139, 92, 246, 0.6)',
    animation: {
      name: 'fade',
      duration: '1.5s',
      timing: 'ease-in-out',
      iterationCount: 'infinite',
      keyframes: '@keyframes fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }',
    },
  },
  
  behavior: {
    mode: 'event',
    pure: true,
    stateful: false,
    stochastic: false,
    realtime: true,
    cacheable: true,
    latency: { samples: 0, ms: 0, lookahead: 0, reportedToHost: false },
    cpuIntensity: 'light',
    memoryFootprint: {
      estimatedMB: 1,
      sampleBufferMB: 0,
      wavetablesMB: 0,
      stateKB: 10,
      dynamicAllocation: false,
    },
    sideEffects: [],
    threadSafety: 'audio-safe',
    hotReloadable: true,
    stateSerializable: false,
  },
  
  ui: {
    panels: [],
    editorType: 'custom',
    defaultView: 'expanded',
    resizable: true,
    minWidth: 300,
    maxWidth: 600,
    minHeight: 350,
    maxHeight: 700,
    theme: {
      name: 'dark',
      background: '#1e1e1e',
      foreground: '#ffffff',
      accent: '#8B5CF6',
      border: '#333333',
      shadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: '12px',
      borderRadius: '8px',
    },
  },
  
  ports: {
    inputs: [
      {
        name: 'source',
        type: 'Event<any>',
        description: 'Source phrase events',
      },
    ],
    outputs: [
      {
        name: 'ghost',
        type: 'Event<any>',
        description: 'Ghost copy events',
      },
    ],
  },
  
  parameters: [
    {
      id: 'copyType',
      type: 'enum',
      label: 'Copy Type',
      default: 'linked',
      options: [
        'linked',
        'shape-linked',
        'rhythm-linked',
        'chord-linked',
        'scale-linked',
        'frozen',
      ],
      group: 'Ghost',
    },
  ],

  presets: [],
};

