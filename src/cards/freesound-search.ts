/**
 * @fileoverview Freesound Search Card
 * 
 * A card that searches for samples on Freesound.org, downloads them,
 * auto-detects pitch, and creates sampler instruments mapped to the keyboard.
 * 
 * Features:
 * - Search by instrument name or tags
 * - Filter by Creative Commons 0 license
 * - Auto-detect MIDI pitch and fine tuning
 * - Create multi-sample keyboard mappings
 * - Generate sampler presets
 * 
 * @module @cardplay/core/cards/freesound-search
 */

import {
  searchFreesound,
  // searchInstrumentSamples, // Reserved for instrument-specific searches
  // getSample, // Reserved for individual sample retrieval
  organizeSamples,
  generateKeyboardMapping,
  downloadSamplePack,
  // buildInstrumentFromFreesound, // Reserved for direct instrument creation
  INSTRUMENT_SEARCH_TERMS,
  type FreesoundSample,
  type FreesoundSearchFilters,
  type SamplePack,
  type OrganizedSample,
} from '../audio/freesound';
import {
  // buildInstrumentFromBuffers, // Reserved for buffer-based instrument creation
  // standardFilenameParser, // Reserved for filename parsing
  // type AnalyzedSample, // Reserved for sample analysis
  // type MappingResult, // Reserved for mapping results
  CATEGORY_ENVELOPES,
} from '../audio/sample-mapper';
import type {
  SamplerPreset,
  SampleZone,
  InstrumentCategory,
} from './sampler';
import {
  createPort,
  createParam,
  createSignature,
  PortTypes,
  type Port,
  type CardParam,
  type CardSignature,
} from './card';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Search state
 */
export type SearchState = 'idle' | 'searching' | 'downloading' | 'analyzing' | 'complete' | 'error';

/**
 * Freesound search parameters
 */
export interface FreesoundSearchParams {
  /** Search query (instrument name or keywords) */
  readonly query: string;
  /** Maximum number of samples to fetch */
  readonly maxSamples: number;
  /** Maximum sample duration in seconds */
  readonly maxDuration: number;
  /** Require pitch analysis from Freesound */
  readonly requirePitchAnalysis: boolean;
  /** Instrument category for envelope defaults */
  readonly category: InstrumentCategory;
  /** Low note of keyboard range */
  readonly lowNote: number;
  /** High note of keyboard range */
  readonly highNote: number;
  /** Maximum pitch shift up in semitones */
  readonly maxPitchShiftUp: number;
  /** Maximum pitch shift down in semitones */
  readonly maxPitchShiftDown: number;
  /** Sort order */
  readonly sortBy: 'score' | 'downloads_desc' | 'rating_desc' | 'duration_asc';
}

/**
 * Search result state
 */
export interface FreesoundSearchState {
  /** Current search parameters */
  readonly params: FreesoundSearchParams;
  /** Current state */
  readonly state: SearchState;
  /** Search results */
  readonly results: readonly FreesoundSample[];
  /** Organized sample pack */
  readonly pack: SamplePack | null;
  /** Generated zones */
  readonly zones: readonly SampleZone[];
  /** Generated preset */
  readonly preset: SamplerPreset | null;
  /** Error message */
  readonly error: string | null;
  /** Progress (0-1) */
  readonly progress: number;
  /** Current stage message */
  readonly progressMessage: string;
}

/**
 * Search card inputs
 */
export type FreesoundSearchInput =
  | { type: 'setQuery'; query: string }
  | { type: 'setMaxSamples'; count: number }
  | { type: 'setMaxDuration'; seconds: number }
  | { type: 'setCategory'; category: InstrumentCategory }
  | { type: 'setKeyRange'; lowNote: number; highNote: number }
  | { type: 'setPitchShift'; up: number; down: number }
  | { type: 'search' }
  | { type: 'cancel' }
  | { type: 'createPreset'; name: string }
  | { type: 'preview'; sampleIndex: number }
  | { type: 'stopPreview' };

/**
 * Search card outputs
 */
export type FreesoundSearchOutput =
  | { type: 'searchStarted' }
  | { type: 'searchComplete'; resultCount: number }
  | { type: 'downloadProgress'; loaded: number; total: number }
  | { type: 'presetCreated'; preset: SamplerPreset }
  | { type: 'previewStarted'; sampleId: number }
  | { type: 'previewStopped' }
  | { type: 'error'; message: string };

/**
 * Search result with processing
 */
export interface FreesoundSearchResult {
  state: FreesoundSearchState;
  outputs: FreesoundSearchOutput[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default search parameters
 */
export const DEFAULT_SEARCH_PARAMS: FreesoundSearchParams = {
  query: '',
  maxSamples: 20,
  maxDuration: 5,
  requirePitchAnalysis: true,
  category: 'synth',
  lowNote: 36,  // C2
  highNote: 96, // C7
  maxPitchShiftUp: 7,
  maxPitchShiftDown: 12,
  sortBy: 'downloads_desc',
};

/**
 * Default search state
 */
export const DEFAULT_SEARCH_STATE: FreesoundSearchState = {
  params: DEFAULT_SEARCH_PARAMS,
  state: 'idle',
  results: [],
  pack: null,
  zones: [],
  preset: null,
  error: null,
  progress: 0,
  progressMessage: '',
};

// ============================================================================
// CARD SIGNATURE
// ============================================================================

/**
 * Freesound Search card ports
 */
export const FREESOUND_SEARCH_INPUTS: readonly Port[] = [
  createPort('trigger', PortTypes.TRIGGER, {
    label: 'Search Trigger',
    description: 'Triggers a search',
    optional: true,
  }),
];

export const FREESOUND_SEARCH_OUTPUTS: readonly Port[] = [
  createPort('preset', PortTypes.ANY, {
    label: 'Sampler Preset',
    description: 'Generated sampler preset',
  }),
  createPort('zones', PortTypes.ANY, {
    label: 'Sample Zones',
    description: 'Generated sample zones',
  }),
];

/**
 * Freesound Search card parameters
 */
export const FREESOUND_SEARCH_PARAMS: readonly CardParam[] = [
  createParam('query', 'string', '', {
    label: 'Search Query',
    description: 'Instrument name or keywords',
  }),
  createParam('maxSamples', 'integer', 20, {
    label: 'Max Samples',
    description: 'Maximum number of samples to download',
    min: 1,
    max: 100,
  }),
  createParam('maxDuration', 'number', 5, {
    label: 'Max Duration',
    description: 'Maximum sample duration in seconds',
    min: 0.5,
    max: 30,
    unit: 's',
  }),
  createParam('category', 'enum', 'synth', {
    label: 'Category',
    description: 'Instrument category for envelope defaults',
    options: [
      'piano', 'keys', 'organ', 'guitar', 'bass',
      'strings', 'brass', 'woodwinds', 'synth', 'pads',
      'leads', 'drums', 'percussion', 'ethnic', 'sfx', 'vocal',
    ],
  }),
  createParam('lowNote', 'integer', 36, {
    label: 'Low Note',
    description: 'Lowest MIDI note to map',
    min: 0,
    max: 127,
  }),
  createParam('highNote', 'integer', 96, {
    label: 'High Note',
    description: 'Highest MIDI note to map',
    min: 0,
    max: 127,
  }),
  createParam('maxPitchShiftUp', 'integer', 7, {
    label: 'Max Pitch Up',
    description: 'Maximum semitones to pitch up',
    min: 0,
    max: 24,
    unit: 'st',
  }),
  createParam('maxPitchShiftDown', 'integer', 12, {
    label: 'Max Pitch Down',
    description: 'Maximum semitones to pitch down',
    min: 0,
    max: 24,
    unit: 'st',
  }),
];

/**
 * Freesound Search card signature
 */
export const FREESOUND_SEARCH_SIGNATURE: CardSignature = createSignature(
  FREESOUND_SEARCH_INPUTS,
  FREESOUND_SEARCH_OUTPUTS,
  FREESOUND_SEARCH_PARAMS
);

// ============================================================================
// STATE UPDATES
// ============================================================================

/**
 * Update search parameters
 */
export function updateSearchParams(
  state: FreesoundSearchState,
  updates: Partial<FreesoundSearchParams>
): FreesoundSearchState {
  return {
    ...state,
    params: { ...state.params, ...updates },
  };
}

/**
 * Set search state
 */
export function setSearchState(
  state: FreesoundSearchState,
  searchState: SearchState,
  message?: string
): FreesoundSearchState {
  return {
    ...state,
    state: searchState,
    progressMessage: message ?? state.progressMessage,
  };
}

/**
 * Set progress
 */
export function setProgress(
  state: FreesoundSearchState,
  progress: number,
  message?: string
): FreesoundSearchState {
  return {
    ...state,
    progress,
    progressMessage: message ?? state.progressMessage,
  };
}

/**
 * Set error
 */
export function setError(
  state: FreesoundSearchState,
  error: string
): FreesoundSearchState {
  return {
    ...state,
    state: 'error',
    error,
    progressMessage: error,
  };
}

// ============================================================================
// SEARCH WORKFLOW
// ============================================================================

/**
 * Execute search workflow.
 * This is async and updates state through callbacks.
 */
export async function executeSearch(
  state: FreesoundSearchState,
  audioContext: AudioContext,
  onStateUpdate: (state: FreesoundSearchState) => void
): Promise<FreesoundSearchState> {
  const { params } = state;
  
  if (!params.query.trim()) {
    return setError(state, 'Please enter a search query');
  }

  try {
    // Start searching
    let currentState = setSearchState(state, 'searching', 'Searching Freesound...');
    currentState = setProgress(currentState, 0.05);
    onStateUpdate(currentState);

    // Search Freesound
    const filters: FreesoundSearchFilters = {
      maxDuration: params.maxDuration,
      singleEvent: true,
      hasPitchAnalysis: params.requirePitchAnalysis,
      sort: params.sortBy,
    };

    const searchResult = await searchFreesound(params.query, filters, 1, params.maxSamples * 2);
    
    currentState = {
      ...currentState,
      results: searchResult.results,
      progress: 0.2,
      progressMessage: `Found ${searchResult.results.length} samples`,
    };
    onStateUpdate(currentState);

    if (searchResult.results.length === 0) {
      return setError(currentState, 'No samples found. Try different keywords.');
    }

    // Organize samples
    currentState = setProgress(currentState, 0.25, 'Organizing samples...');
    onStateUpdate(currentState);

    const pack = organizeSamples(searchResult.results, params.query);
    
    if (pack.samples.length === 0) {
      return setError(currentState, 'No pitched samples found. Try disabling pitch analysis requirement.');
    }

    // Limit samples
    const limitedPack: SamplePack = {
      ...pack,
      samples: pack.samples.slice(0, params.maxSamples),
    };

    currentState = {
      ...currentState,
      pack: limitedPack,
      progress: 0.3,
      progressMessage: `Organized ${limitedPack.samples.length} samples`,
    };
    onStateUpdate(currentState);

    // Download samples
    currentState = setSearchState(currentState, 'downloading', 'Downloading samples...');
    onStateUpdate(currentState);

    // const loadedSamples = await downloadSamplePack( // Reserved for future use
    await downloadSamplePack(
      limitedPack,
      audioContext,
      (loaded, total) => {
        const progress = 0.3 + (loaded / total) * 0.5;
        currentState = setProgress(
          currentState,
          progress,
          `Downloading ${loaded}/${total} samples...`
        );
        onStateUpdate(currentState);
      }
    );

    // Analyze and map
    currentState = setSearchState(currentState, 'analyzing', 'Analyzing and mapping...');
    currentState = setProgress(currentState, 0.85);
    onStateUpdate(currentState);

    // Generate keyboard mapping
    const keyboardMapping = generateKeyboardMapping(limitedPack, {
      lowNote: params.lowNote,
      highNote: params.highNote,
      maxPitchShift: Math.max(params.maxPitchShiftUp, params.maxPitchShiftDown),
    });

    // Create zones from mapping (simplified for now)
    const zones = createZonesFromMapping(
      limitedPack,
      keyboardMapping,
      params.category
    );

    // Create preset
    const preset = createPresetFromSearch(
      params.query,
      zones,
      params.category
    );

    currentState = {
      ...currentState,
      state: 'complete',
      zones,
      preset,
      progress: 1,
      progressMessage: `Created instrument with ${zones.length} zones`,
      error: null,
    };
    onStateUpdate(currentState);

    return currentState;

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return setError(state, message);
  }
}

/**
 * Create zones from keyboard mapping.
 */
function createZonesFromMapping(
  _pack: SamplePack, // Intentionally unused - reserved for future features
  mapping: Map<number, { sample: OrganizedSample; pitchShiftSemitones: number }>,
  category: InstrumentCategory
): SampleZone[] {
  const zones: SampleZone[] = [];

  // Group consecutive notes with same source sample
  let currentGroup: {
    sample: OrganizedSample;
    lowKey: number;
    highKey: number;
  } | null = null;

  const sortedEntries = [...mapping.entries()].sort((a, b) => a[0] - b[0]);

  for (const [note, { sample }] of sortedEntries) {
    if (currentGroup && currentGroup.sample.freesoundId === sample.freesoundId) {
      currentGroup.highKey = note;
    } else {
      if (currentGroup) {
        zones.push(createZoneForGroup(currentGroup, zones.length, category));
      }
      currentGroup = {
        sample,
        lowKey: note,
        highKey: note,
      };
    }
  }

  if (currentGroup) {
    zones.push(createZoneForGroup(currentGroup, zones.length, category));
  }

  return zones;
}

/**
 * Create a zone for a sample group.
 */
function createZoneForGroup(
  group: { sample: OrganizedSample; lowKey: number; highKey: number },
  index: number,
  category: InstrumentCategory
): SampleZone {
  const isDrums = category === 'drums' || category === 'percussion';
  
  return {
    id: `zone-${index}`,
    keyLow: group.lowKey,
    keyHigh: group.highKey,
    rootKey: group.sample.midiNote,
    velocityLow: 0,
    velocityHigh: 127,
    sample: {
      id: `fs-${group.sample.freesoundId}`,
      name: group.sample.name,
      sampleRate: 44100,
      length: 0,
      rootNote: group.sample.midiNote,
      startPoint: 0,
      endPoint: 0,
      loopStart: 0,
      loopEnd: 0,
      loopMode: 'noLoop',
      loopCrossfade: 0,
      fineTune: group.sample.fineTuneCents,
      volumeDb: 0,
      pan: 0,
    },
    roundRobinSamples: [],
    roundRobinIndex: 0,
    volume: 1,
    pan: 0,
    transpose: 0,
    fineTune: group.sample.fineTuneCents,
    playbackMode: isDrums ? 'oneShot' : 'sustain',
    fixedPitch: isDrums,
    envelope: null,
    outputBus: 0,
    muted: false,
    solo: false,
    exclusiveGroup: null,
  };
}

/**
 * Create a preset from search results.
 */
function createPresetFromSearch(
  name: string,
  zones: readonly SampleZone[],
  category: InstrumentCategory
): SamplerPreset {
  const envelope = CATEGORY_ENVELOPES[category];
  
  return {
    id: `freesound-${Date.now()}`,
    name: `Freesound: ${name}`,
    category,
    tags: ['freesound', 'auto-mapped'],
    description: `Auto-generated from Freesound samples`,
    articulations: [{
      id: 'main',
      name: 'Main',
      keySwitchNote: -1,
      zones: zones as SampleZone[],
      isDefault: true,
    }],
    ampEnvelope: {
      attack: envelope.attack ?? 0.001,
      decay: envelope.decay ?? 0.3,
      sustain: envelope.sustain ?? 0.5,
      release: envelope.release ?? 0.3,
      attackCurve: 0,
      decayCurve: 0,
      releaseCurve: 0,
    },
    filterEnvelope: {
      attack: 0.05,
      decay: 0.3,
      sustain: 0.3,
      release: 0.5,
      attackCurve: 0,
      decayCurve: 0,
      releaseCurve: 0,
    },
    filter: {
      enabled: false,
      type: 'lowpass',
      frequency: 20000,
      resonance: 0.707,
      envelopeAmount: 0,
      keyTracking: 0,
      velocitySensitivity: 0,
      lfoAmount: 0,
    },
    lfo1: {
      waveform: 'sine',
      rate: 5,
      syncedRate: null,
      depth: 0,
      phase: 0,
      delay: 0,
      fadeIn: 0,
      keyTracking: 0,
    },
    lfo2: {
      waveform: 'sine',
      rate: 3,
      syncedRate: null,
      depth: 0,
      phase: 0,
      delay: 0,
      fadeIn: 0,
      keyTracking: 0,
    },
    pitchBendRange: 2,
    portamentoTime: 0.05,
    portamentoEnabled: false,
    legatoMode: false,
    monoMode: false,
    voiceStealMode: 'oldest',
    maxPolyphony: 32,
    velocityCurve: 0,
    masterVolume: 0,
    masterPan: 0,
    masterTune: 0,
  };
}

// ============================================================================
// CARD PROCESS FUNCTION
// ============================================================================

/**
 * Process input for the Freesound search card.
 */
export function processFreesoundSearch(
  state: FreesoundSearchState,
  input: FreesoundSearchInput
): FreesoundSearchResult {
  const outputs: FreesoundSearchOutput[] = [];

  switch (input.type) {
    case 'setQuery':
      return {
        state: updateSearchParams(state, { query: input.query }),
        outputs,
      };

    case 'setMaxSamples':
      return {
        state: updateSearchParams(state, { maxSamples: input.count }),
        outputs,
      };

    case 'setMaxDuration':
      return {
        state: updateSearchParams(state, { maxDuration: input.seconds }),
        outputs,
      };

    case 'setCategory':
      return {
        state: updateSearchParams(state, { category: input.category }),
        outputs,
      };

    case 'setKeyRange':
      return {
        state: updateSearchParams(state, { lowNote: input.lowNote, highNote: input.highNote }),
        outputs,
      };

    case 'setPitchShift':
      return {
        state: updateSearchParams(state, { 
          maxPitchShiftUp: input.up, 
          maxPitchShiftDown: input.down 
        }),
        outputs,
      };

    case 'search':
      outputs.push({ type: 'searchStarted' });
      return {
        state: setSearchState(state, 'searching', 'Initializing search...'),
        outputs,
      };

    case 'cancel':
      return {
        state: {
          ...DEFAULT_SEARCH_STATE,
          params: state.params,
        },
        outputs,
      };

    case 'createPreset':
      if (state.zones.length > 0) {
        const preset = createPresetFromSearch(
          input.name,
          state.zones,
          state.params.category
        );
        outputs.push({ type: 'presetCreated', preset });
        return {
          state: { ...state, preset },
          outputs,
        };
      }
      return { state, outputs };

    default:
      return { state, outputs };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get suggested instruments for auto-complete.
 */
export function getSuggestedInstruments(): readonly string[] {
  return Object.keys(INSTRUMENT_SEARCH_TERMS);
}

/**
 * Get search terms for an instrument.
 */
export function getInstrumentSearchTerms(instrument: string): readonly string[] {
  return INSTRUMENT_SEARCH_TERMS[instrument] ?? [instrument];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  executeSearch,
  processFreesoundSearch,
  updateSearchParams,
  getSuggestedInstruments,
  getInstrumentSearchTerms,
  DEFAULT_SEARCH_PARAMS,
  DEFAULT_SEARCH_STATE,
  FREESOUND_SEARCH_SIGNATURE,
  FREESOUND_SEARCH_INPUTS,
  FREESOUND_SEARCH_OUTPUTS,
  FREESOUND_SEARCH_PARAMS,
};
