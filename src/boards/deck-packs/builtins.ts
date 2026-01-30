/**
 * @fileoverview Builtin Deck Packs
 * 
 * Implements O028-O030:
 * - Essential Production pack
 * - Notation Essentials pack
 * - Sound Design Lab pack
 * 
 * @module @cardplay/boards/deck-packs/builtins
 */

import type { DeckPack } from './types';

// --------------------------------------------------------------------------
// Essential Production Pack (O028)
// --------------------------------------------------------------------------

export const essentialProductionPack: DeckPack = {
  id: 'essential-production',
  name: 'Essential Production',
  description: 'Complete production workflow with mixer, transport, and browser',
  category: 'production',
  tags: ['production', 'mixing', 'essential', 'workflow'],
  icon: 'sliders',
  targetPersonas: ['producer', 'sound-designer'],
  difficulty: 'beginner',
  author: 'CardPlay Team',
  version: '1.0.0',
  decks: [
    {
      id: 'mixer',
      type: 'mixer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'transport',
      type: 'transport-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'instrument-browser',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true
    },
    {
      id: 'properties',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    }
  ]
};

// --------------------------------------------------------------------------
// Notation Essentials Pack (O029)
// --------------------------------------------------------------------------

export const notationEssentialsPack: DeckPack = {
  id: 'notation-essentials',
  name: 'Notation Essentials',
  description: 'Essential decks for notation composition: score, properties, and instruments',
  category: 'composition',
  tags: ['notation', 'score', 'composition', 'classical'],
  icon: 'music',
  targetPersonas: ['notation-composer'],
  difficulty: 'beginner',
  author: 'CardPlay Team',
  version: '1.0.0',
  decks: [
    {
      id: 'notation-score',
      type: 'notation-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false
    },
    {
      id: 'properties',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'instrument-browser',
      type: 'instruments-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true
    },
    {
      id: 'dsp-chain',
      type: 'dsp-chain',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: true
    }
  ]
};

// --------------------------------------------------------------------------
// Sound Design Lab Pack (O030)
// --------------------------------------------------------------------------

export const soundDesignLabPack: DeckPack = {
  id: 'sound-design-lab',
  name: 'Sound Design Lab',
  description: 'Advanced sound design tools: modular, spectrum analyzer, and waveform editor',
  category: 'sound-design',
  tags: ['sound-design', 'synthesis', 'modular', 'analysis', 'advanced'],
  icon: 'waveform',
  targetPersonas: ['sound-designer'],
  difficulty: 'advanced',
  author: 'CardPlay Team',
  version: '1.0.0',
  decks: [
    {
      id: 'routing-modular',
      type: 'routing-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'spectrum-analyzer',
      type: 'spectrum-analyzer-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: true
    },
    {
      id: 'waveform-editor',
      type: 'waveform-editor-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    },
    {
      id: 'modulation-matrix',
      type: 'modulation-matrix-deck',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: true
    },
    {
      id: 'properties',
      type: 'properties-deck',
      cardLayout: 'stack',
      allowReordering: false,
      allowDragOut: false
    }
  ]
};

// --------------------------------------------------------------------------
// All Builtin Packs
// --------------------------------------------------------------------------

export const builtinDeckPacks: DeckPack[] = [
  essentialProductionPack,
  notationEssentialsPack,
  soundDesignLabPack
];
