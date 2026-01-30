/**
 * GOFAI Layer Vocabulary — Track and Instrument Role Terminology
 *
 * This module defines the canonical vocabulary for musical layers, tracks,
 * and instrument roles that users can reference in natural language.
 *
 * @module gofai/canon/layer-vocabulary
 */

import {
  type LayerType,
  type LayerTypeId,
  type LayerRole,
  type VocabularyTable,
  createLayerTypeId,
  createVocabularyTable,
} from './types';

// =============================================================================
// Rhythm Layers
// =============================================================================

const LAYER_DRUMS: LayerType = {
  id: createLayerTypeId('drums'),
  name: 'Drums',
  variants: ['drum', 'percussion', 'perc', 'rhythm section', 'beat'],
  role: 'rhythm',
  description: 'Full drum kit or drum machine pattern.',
  tags: ['drums', 'percussion', 'rhythm'],
};

const LAYER_KICK: LayerType = {
  id: createLayerTypeId('kick'),
  name: 'Kick',
  variants: ['kick drum', 'bass drum', 'bd'],
  role: 'rhythm',
  description: 'Kick drum / bass drum.',
  frequencyRange: [20, 200],
  tags: ['kick', 'drums', 'low'],
};

const LAYER_SNARE: LayerType = {
  id: createLayerTypeId('snare'),
  name: 'Snare',
  variants: ['snare drum', 'sd', 'clap', 'rim'],
  role: 'rhythm',
  description: 'Snare drum and related backbeat elements.',
  frequencyRange: [150, 5000],
  tags: ['snare', 'drums', 'backbeat'],
};

const LAYER_HATS: LayerType = {
  id: createLayerTypeId('hats'),
  name: 'Hi-Hats',
  variants: ['hi-hats', 'hi hats', 'hihat', 'hh', 'hats'],
  role: 'rhythm',
  description: 'Hi-hat cymbals.',
  frequencyRange: [3000, 15000],
  tags: ['hats', 'cymbals', 'high'],
};

const LAYER_CYMBALS: LayerType = {
  id: createLayerTypeId('cymbals'),
  name: 'Cymbals',
  variants: ['rides', 'crashes', 'cymbal', 'ride', 'crash'],
  role: 'rhythm',
  description: 'Ride, crash, and other cymbals.',
  frequencyRange: [2000, 15000],
  tags: ['cymbals', 'high'],
};

const LAYER_TOMS: LayerType = {
  id: createLayerTypeId('toms'),
  name: 'Toms',
  variants: ['tom', 'floor tom', 'rack tom'],
  role: 'rhythm',
  description: 'Tom drums.',
  frequencyRange: [80, 500],
  tags: ['toms', 'drums'],
};

const LAYER_PERCUSSION: LayerType = {
  id: createLayerTypeId('percussion'),
  name: 'Percussion',
  variants: ['perc', 'shaker', 'tambourine', 'congas', 'bongos', 'auxiliary'],
  role: 'rhythm',
  description: 'Auxiliary percussion instruments.',
  tags: ['percussion', 'auxiliary'],
};

// =============================================================================
// Bass Layers
// =============================================================================

const LAYER_BASS: LayerType = {
  id: createLayerTypeId('bass'),
  name: 'Bass',
  variants: ['bassline', 'low end', 'sub', 'bass line'],
  role: 'bass',
  description: 'Bass instrument (synth bass, electric bass, etc.).',
  frequencyRange: [30, 300],
  tags: ['bass', 'low'],
};

const LAYER_SUB: LayerType = {
  id: createLayerTypeId('sub'),
  name: 'Sub Bass',
  variants: ['sub-bass', 'subbass', 'sub'],
  role: 'bass',
  description: 'Sub-bass frequencies, often sine waves.',
  frequencyRange: [20, 80],
  tags: ['sub', 'bass', 'low'],
};

// =============================================================================
// Harmony Layers
// =============================================================================

const LAYER_CHORDS: LayerType = {
  id: createLayerTypeId('chords'),
  name: 'Chords',
  variants: ['harmony', 'chord', 'harmonic', 'accompaniment'],
  role: 'harmony',
  description: 'Chord-playing instruments.',
  tags: ['chords', 'harmony'],
};

const LAYER_PAD: LayerType = {
  id: createLayerTypeId('pad'),
  name: 'Pad',
  variants: ['pads', 'synth pad', 'string pad', 'atmosphere', 'atmo'],
  role: 'harmony',
  description: 'Sustained harmonic pads.',
  tags: ['pad', 'harmony', 'sustained'],
};

const LAYER_KEYS: LayerType = {
  id: createLayerTypeId('keys'),
  name: 'Keys',
  variants: ['piano', 'keyboard', 'rhodes', 'wurli', 'organ', 'ep'],
  role: 'harmony',
  description: 'Keyboard instruments.',
  tags: ['keys', 'piano', 'harmony'],
};

const LAYER_GUITAR: LayerType = {
  id: createLayerTypeId('guitar'),
  name: 'Guitar',
  variants: ['gtr', 'guitars', 'acoustic guitar', 'electric guitar'],
  role: 'harmony',
  description: 'Guitar (acoustic or electric).',
  tags: ['guitar', 'strings'],
};

const LAYER_STRINGS: LayerType = {
  id: createLayerTypeId('strings'),
  name: 'Strings',
  variants: ['string section', 'violins', 'violas', 'cellos', 'orchestra strings'],
  role: 'harmony',
  description: 'String section or string ensemble.',
  tags: ['strings', 'orchestral'],
};

// =============================================================================
// Melody Layers
// =============================================================================

const LAYER_LEAD: LayerType = {
  id: createLayerTypeId('lead'),
  name: 'Lead',
  variants: ['lead synth', 'lead line', 'melody', 'topline'],
  role: 'melody',
  description: 'Lead melodic instrument.',
  tags: ['lead', 'melody'],
};

const LAYER_VOCAL: LayerType = {
  id: createLayerTypeId('vocal'),
  name: 'Vocal',
  variants: ['vocals', 'voice', 'vox', 'singing', 'lead vocal'],
  role: 'melody',
  description: 'Main vocal track.',
  tags: ['vocal', 'voice', 'melody'],
};

const LAYER_BACKING_VOCALS: LayerType = {
  id: createLayerTypeId('backing_vocals'),
  name: 'Backing Vocals',
  variants: ['backing', 'bvs', 'harmonies', 'background vocals', 'choir'],
  role: 'melody',
  description: 'Background and harmony vocals.',
  tags: ['vocal', 'backing', 'harmony'],
};

const LAYER_ARP: LayerType = {
  id: createLayerTypeId('arp'),
  name: 'Arpeggio',
  variants: ['arps', 'arpeggiator', 'arpeggiated', 'seq', 'sequence'],
  role: 'melody',
  description: 'Arpeggiated or sequenced melodic pattern.',
  tags: ['arp', 'sequence', 'melody'],
};

const LAYER_PLUCK: LayerType = {
  id: createLayerTypeId('pluck'),
  name: 'Pluck',
  variants: ['plucks', 'stab', 'stabs', 'pizz', 'pizzicato'],
  role: 'melody',
  description: 'Short, plucked or stabbed melodic sounds.',
  tags: ['pluck', 'stab', 'short'],
};

// =============================================================================
// Texture Layers
// =============================================================================

const LAYER_FX: LayerType = {
  id: createLayerTypeId('fx'),
  name: 'FX',
  variants: ['effects', 'sfx', 'sound effects', 'risers', 'impacts', 'sweeps'],
  role: 'texture',
  description: 'Sound effects, risers, impacts, and transitions.',
  tags: ['fx', 'effects', 'transition'],
};

const LAYER_AMBIENT: LayerType = {
  id: createLayerTypeId('ambient'),
  name: 'Ambient',
  variants: ['ambience', 'atmosphere', 'texture', 'drone', 'soundscape'],
  role: 'texture',
  description: 'Ambient textures and soundscapes.',
  tags: ['ambient', 'texture', 'atmosphere'],
};

const LAYER_NOISE: LayerType = {
  id: createLayerTypeId('noise'),
  name: 'Noise',
  variants: ['white noise', 'pink noise', 'texture noise'],
  role: 'texture',
  description: 'Noise-based textures.',
  tags: ['noise', 'texture'],
};

// =============================================================================
// Layer Table
// =============================================================================

/**
 * All core layer types.
 */
export const CORE_LAYER_TYPES: readonly LayerType[] = [
  // Rhythm
  LAYER_DRUMS,
  LAYER_KICK,
  LAYER_SNARE,
  LAYER_HATS,
  LAYER_CYMBALS,
  LAYER_TOMS,
  LAYER_PERCUSSION,
  // Bass
  LAYER_BASS,
  LAYER_SUB,
  // Harmony
  LAYER_CHORDS,
  LAYER_PAD,
  LAYER_KEYS,
  LAYER_GUITAR,
  LAYER_STRINGS,
  // Melody
  LAYER_LEAD,
  LAYER_VOCAL,
  LAYER_BACKING_VOCALS,
  LAYER_ARP,
  LAYER_PLUCK,
  // Texture
  LAYER_FX,
  LAYER_AMBIENT,
  LAYER_NOISE,
];

/**
 * Layer vocabulary table.
 */
export const LAYER_TYPES_TABLE: VocabularyTable<LayerType> =
  createVocabularyTable(CORE_LAYER_TYPES);

// =============================================================================
// Layer Utilities
// =============================================================================

/**
 * Get a layer type by ID.
 */
export function getLayerTypeById(id: LayerTypeId): LayerType | undefined {
  return LAYER_TYPES_TABLE.byId.get(id);
}

/**
 * Get a layer type by name or variant.
 */
export function getLayerTypeByName(name: string): LayerType | undefined {
  return LAYER_TYPES_TABLE.byVariant.get(name.toLowerCase());
}

/**
 * Check if a string refers to a layer type.
 */
export function isLayerType(name: string): boolean {
  return LAYER_TYPES_TABLE.byVariant.has(name.toLowerCase());
}

/**
 * Get all layer types for a role.
 */
export function getLayerTypesByRole(role: LayerRole): readonly LayerType[] {
  return CORE_LAYER_TYPES.filter(l => l.role === role);
}

/**
 * Get all surface forms for a layer type.
 */
export function getAllLayerSurfaceForms(layerType: LayerType): readonly string[] {
  return [layerType.name, ...layerType.variants];
}

/**
 * Normalize a layer name to its canonical form.
 */
export function normalizeLayerName(name: string): string | undefined {
  const layerType = getLayerTypeByName(name);
  return layerType?.name;
}

/**
 * Get layers that match a tag.
 */
export function getLayerTypesByTag(tag: string): readonly LayerType[] {
  const normalizedTag = tag.toLowerCase();
  return CORE_LAYER_TYPES.filter(l => l.tags.some(t => t === normalizedTag));
}

/**
 * Get layers in a frequency range.
 */
export function getLayerTypesInFrequencyRange(
  minHz: number,
  maxHz: number
): readonly LayerType[] {
  return CORE_LAYER_TYPES.filter(l => {
    if (!l.frequencyRange) return false;
    const [low, high] = l.frequencyRange;
    // Check for overlap
    return low <= maxHz && high >= minHz;
  });
}

/**
 * Parse a layer reference from natural language.
 *
 * Examples:
 * - "drums" → { type: drums, modifier: undefined }
 * - "the drums" → { type: drums, modifier: undefined }
 * - "on the drums" → { type: drums, modifier: undefined }
 * - "all the drums" → { type: drums, modifier: 'all' }
 */
export interface ParsedLayerRef {
  /** The layer type */
  readonly type: LayerType;

  /** Modifier (all, some, the, etc.) */
  readonly modifier?: 'all' | 'the' | 'this' | 'these';
}

/**
 * Parse a layer reference string.
 */
export function parseLayerReference(input: string): ParsedLayerRef | undefined {
  let normalized = input.toLowerCase().trim();

  // Extract modifier
  let modifier: ParsedLayerRef['modifier'];

  if (normalized.startsWith('all ') || normalized.startsWith('all the ')) {
    modifier = 'all';
    normalized = normalized.replace(/^all (the )?/, '');
  } else if (normalized.startsWith('the ')) {
    modifier = 'the';
    normalized = normalized.replace(/^the /, '');
  } else if (normalized.startsWith('this ')) {
    modifier = 'this';
    normalized = normalized.replace(/^this /, '');
  } else if (normalized.startsWith('these ')) {
    modifier = 'these';
    normalized = normalized.replace(/^these /, '');
  }

  // Remove scope prepositions
  normalized = normalized.replace(/^(on|in|for) (the )?/, '');

  // Look up layer type
  const layerType = getLayerTypeByName(normalized);
  if (!layerType) {
    return undefined;
  }

  // Build result with only defined properties
  if (modifier !== undefined) {
    return { type: layerType, modifier };
  } else {
    return { type: layerType };
  }
}

// =============================================================================
// Role Hierarchy
// =============================================================================

/**
 * Role hierarchy for layer grouping.
 */
export const LAYER_ROLE_HIERARCHY: Record<LayerRole, readonly LayerTypeId[]> = {
  rhythm: [
    createLayerTypeId('drums'),
    createLayerTypeId('kick'),
    createLayerTypeId('snare'),
    createLayerTypeId('hats'),
    createLayerTypeId('cymbals'),
    createLayerTypeId('toms'),
    createLayerTypeId('percussion'),
  ],
  bass: [
    createLayerTypeId('bass'),
    createLayerTypeId('sub'),
  ],
  harmony: [
    createLayerTypeId('chords'),
    createLayerTypeId('pad'),
    createLayerTypeId('keys'),
    createLayerTypeId('guitar'),
    createLayerTypeId('strings'),
  ],
  melody: [
    createLayerTypeId('lead'),
    createLayerTypeId('vocal'),
    createLayerTypeId('backing_vocals'),
    createLayerTypeId('arp'),
    createLayerTypeId('pluck'),
  ],
  texture: [
    createLayerTypeId('fx'),
    createLayerTypeId('ambient'),
    createLayerTypeId('noise'),
  ],
  structure: [], // Form markers, not audio layers
};

/**
 * Get the parent role for a layer.
 */
export function getLayerRole(layerType: LayerType): LayerRole {
  return layerType.role;
}

/**
 * Check if a layer is in a role category.
 */
export function isLayerInRole(layerId: LayerTypeId, role: LayerRole): boolean {
  return LAYER_ROLE_HIERARCHY[role].includes(layerId);
}
