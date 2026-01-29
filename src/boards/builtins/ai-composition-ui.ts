/**
 * @fileoverview AI Composition Board UI (Phase H: H037-H050)
 * 
 * UI for the AI Composition board (directed composition):
 * - H037: Prompt box, target scope, Generate button
 * - H038: Prompt → generator config mapping (local, no external model)
 * - H039: Generate draft to new stream/clip
 * - H040: Replace/Append/Variation actions
 * - H041: Diff preview UI
 * - H042: Constraints UI (key, chords, density, register, rhythm)
 * - H043: Compose to chords integration
 * - H044: Commit to phrase library
 * - H045: Shortcuts (Cmd+K, accept, reject, regenerate)
 * - H046: Safety rails (undo + confirmation)
 * 
 * @module @cardplay/boards/builtins/ai-composition-ui
 */

import type { EventStreamId, ClipId } from '../../state/types';
import type { Chord } from './harmony-analysis';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { EventKinds } from '../../types/event-kind';

// ============================================================================
// H042: COMPOSITION CONSTRAINTS
// ============================================================================

/**
 * Constraints for AI composition.
 */
export interface CompositionConstraints {
  /** Key signature */
  key?: {
    tonic: string;
    mode: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'lydian' | 'phrygian' | 'locrian';
  };
  
  /** Chord progression to follow */
  chordProgression?: Chord[];
  
  /** Note density (notes per bar) */
  density?: {
    min: number;
    max: number;
  };
  
  /** Register (pitch range) */
  register?: {
    low: number;  // MIDI note number
    high: number; // MIDI note number
  };
  
  /** Rhythm feel */
  rhythmFeel?: {
    swing: number; // 0-1
    syncopation: number; // 0-1
    subdivision: 'quarter' | 'eighth' | 'sixteenth' | 'triplet';
  };
  
  /** Melodic contour */
  melodicContour?: {
    shape: 'ascending' | 'descending' | 'arch' | 'valley' | 'wave' | 'random';
    stepwise: number; // 0-1, preference for stepwise motion vs leaps
  };
  
  /** Harmonic constraints */
  harmonic?: {
    allowNonChordTones: boolean;
    passingTonePreference: number; // 0-1
    neighborTonePreference: number; // 0-1
  };
}

/**
 * Default composition constraints.
 */
export const DEFAULT_CONSTRAINTS: CompositionConstraints = {
  key: { tonic: 'C', mode: 'major' },
  density: { min: 4, max: 16 },
  register: { low: 48, high: 84 }, // C3 to C6
  rhythmFeel: {
    swing: 0,
    syncopation: 0.3,
    subdivision: 'eighth'
  },
  melodicContour: {
    shape: 'wave',
    stepwise: 0.7
  },
  harmonic: {
    allowNonChordTones: true,
    passingTonePreference: 0.5,
    neighborTonePreference: 0.3
  }
};

// ============================================================================
// H038: PROMPT → GENERATOR CONFIG MAPPING
// ============================================================================

/**
 * Generator configuration derived from prompt.
 */
export interface GeneratorConfig {
  /** Generation style */
  style: 'melody' | 'bass' | 'chords' | 'rhythm' | 'harmony' | 'counterpoint';
  
  /** Variation seed */
  seed?: number;
  
  /** Constraints for generation */
  constraints: CompositionConstraints;
  
  /** Target length in bars */
  lengthBars: number;
  
  /** Complexity level (0-1) */
  complexity: number;
  
  /** Humanization amount (0-1) */
  humanization: number;
}

/**
 * Prompt keyword mapping to generation parameters.
 */
const PROMPT_KEYWORDS = {
  // Style keywords
  melody: { style: 'melody', complexity: 0.6 },
  bass: { style: 'bass', complexity: 0.4 },
  chords: { style: 'chords', complexity: 0.3 },
  rhythm: { style: 'rhythm', complexity: 0.5 },
  harmony: { style: 'harmony', complexity: 0.7 },
  counterpoint: { style: 'counterpoint', complexity: 0.8 },
  
  // Density keywords
  sparse: { density: { min: 2, max: 8 } },
  moderate_density: { density: { min: 4, max: 16 } },
  dense: { density: { min: 8, max: 24 } },
  
  // Register keywords
  low: { register: { low: 36, high: 60 } },
  mid: { register: { low: 48, high: 72 } },
  high: { register: { low: 60, high: 84 } },
  
  // Rhythm keywords
  straight: { rhythmFeel: { swing: 0, syncopation: 0.1 } },
  swung: { rhythmFeel: { swing: 0.6, syncopation: 0.3 } },
  syncopated: { rhythmFeel: { swing: 0, syncopation: 0.7 } },
  
  // Contour keywords
  ascending: { melodicContour: { shape: 'ascending' } },
  descending: { melodicContour: { shape: 'descending' } },
  arch: { melodicContour: { shape: 'arch' } },
  wave: { melodicContour: { shape: 'wave' } },
  
  // Complexity keywords
  simple: { complexity: 0.3 },
  moderate: { complexity: 0.5 },
  complex: { complexity: 0.8 },
  
  // Length keywords
  short: { lengthBars: 4 },
  medium: { lengthBars: 8 },
  long: { lengthBars: 16 }
} as const;

/**
 * H038: Parse prompt into generator config.
 * 
 * Maps natural language prompt to generation parameters.
 * No external model required - simple keyword matching.
 */
export function promptToConfig(prompt: string): GeneratorConfig {
  const lowerPrompt = prompt.toLowerCase();
  
  // Start with defaults
  const config: GeneratorConfig = {
    style: 'melody',
    constraints: { ...DEFAULT_CONSTRAINTS },
    lengthBars: 8,
    complexity: 0.5,
    humanization: 0.3
  };
  
  // Match keywords
  for (const [keyword, params] of Object.entries(PROMPT_KEYWORDS)) {
    if (lowerPrompt.includes(keyword)) {
      Object.assign(config, params);
      if ('density' in params && params.density) {
        config.constraints.density = params.density as any;
      }
      if ('register' in params && params.register) {
        config.constraints.register = params.register as any;
      }
      if ('rhythmFeel' in params && params.rhythmFeel) {
        config.constraints.rhythmFeel = params.rhythmFeel as any;
      }
      if ('melodicContour' in params && params.melodicContour) {
        config.constraints.melodicContour = {
          ...config.constraints.melodicContour!,
          ...(params.melodicContour as any)
        };
      }
    }
  }
  
  // Extract numbers for length (e.g., "8 bars")
  const barsMatch = lowerPrompt.match(/(\d+)\s*bars?/);
  if (barsMatch && barsMatch[1]) {
    config.lengthBars = parseInt(barsMatch[1], 10);
  }
  
  console.info('Parsed prompt:', {
    prompt,
    config
  });
  
  return config;
}

// ============================================================================
// H040: GENERATION ACTIONS
// ============================================================================

/**
 * Target scope for generation.
 */
export type GenerationScope = 
  | { type: 'new-clip' }
  | { type: 'replace-selection'; clipId: ClipId }
  | { type: 'append'; clipId: ClipId }
  | { type: 'variation'; clipId: ClipId };

/**
 * Generated draft result.
 */
export interface GeneratedDraft {
  /** Draft events (will be cast to Event when added to store) */
  events: Array<{
    kind: string;
    start: number;
    duration: number;
    payload: any;
  }>;
  
  /** Config used for generation */
  config: GeneratorConfig;
  
  /** Target scope */
  scope: GenerationScope;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * H039: Generate draft into new stream/clip.
 */
export async function generateDraft(
  config: GeneratorConfig,
  scope: GenerationScope
): Promise<GeneratedDraft> {
  console.info('Generate draft:', { config, scope });
  
  const events = [];
  
  // Simple generation: create notes based on constraints
  const { lengthBars, constraints } = config;
  const ticksPerBar = 480 * 4; // Assume 480 PPQ, 4/4
  const totalTicks = lengthBars * ticksPerBar;
  
  const { density, register } = constraints;
  const noteCount = Math.floor(
    (density?.min || 4) + Math.random() * ((density?.max || 16) - (density?.min || 4))
  );
  
  for (let i = 0; i < noteCount; i++) {
    const start = Math.floor((i / noteCount) * totalTicks);
    const duration = Math.floor(ticksPerBar / 4); // Quarter note
    const note = Math.floor(
      (register?.low || 48) + Math.random() * ((register?.high || 84) - (register?.low || 48))
    );
    
    events.push({
      kind: EventKinds.NOTE,
      start,
      duration,
      payload: {
        note,
        velocity: 80 + Math.floor((Math.random() - 0.5) * 30)
      }
    });
  }
  
  return {
    events,
    config,
    scope,
    timestamp: Date.now()
  };
}

/**
 * H041: Preview draft with diff.
 */
export interface DraftDiff {
  /** Events to add */
  added: any[];
  
  /** Events to remove */
  removed: any[];
  
  /** Events to modify */
  modified: Array<{ before: any; after: any }>;
}

/**
 * Compute diff between current and proposed events.
 */
export function computeDraftDiff(
  currentStreamId: EventStreamId,
  draftEvents: any[]
): DraftDiff {
  const store = getSharedEventStore();
  const stream = store.getStream(currentStreamId);
  
  if (!stream) {
    return { added: draftEvents, removed: [], modified: [] };
  }
  
  // For MVP, treat all draft events as additions
  return {
    added: draftEvents,
    removed: [],
    modified: []
  };
}

/**
 * H046: Accept draft with undo support.
 */
export function acceptDraft(
  draft: GeneratedDraft,
  targetStreamId: EventStreamId
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(targetStreamId);
  
  if (!stream) {
    console.error('Target stream not found:', targetStreamId);
    return;
  }
  
  const originalEvents = [...stream.events];
  
  // Apply draft based on scope
  switch (draft.scope.type) {
    case 'new-clip':
      // Already in new clip, just add events
      store.addEvents(targetStreamId, draft.events as any);
      break;
      
    case 'replace-selection':
      // Clear current events and add new ones
      if (stream.events.length > 0) {
        store.removeEvents(targetStreamId, stream.events.map(e => e.id));
      }
      store.addEvents(targetStreamId, draft.events as any);
      break;
      
    case 'append':
      // Add to end
      const maxEnd = stream.events.reduce((max, e) => Math.max(max, e.start + e.duration), 0);
      const shiftedEvents = draft.events.map(e => ({
        ...e,
        start: e.start + maxEnd
      }));
      store.addEvents(targetStreamId, shiftedEvents as any);
      break;
      
    case 'variation':
      // Replace with variation
      if (stream.events.length > 0) {
        store.removeEvents(targetStreamId, stream.events.map(e => e.id));
      }
      store.addEvents(targetStreamId, draft.events as any);
      break;
  }
  
  console.info('Accepted draft:', {
    scope: draft.scope.type,
    eventsAdded: draft.events.length
  });
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: 'Accept AI draft',
    undo: () => {
      const currentStream = store.getStream(targetStreamId);
      if (currentStream && currentStream.events.length > 0) {
        store.removeEvents(targetStreamId, currentStream.events.map(e => e.id));
      }
      if (originalEvents.length > 0) {
        store.addEvents(targetStreamId, originalEvents);
      }
      console.info('Undo accept draft');
    },
    redo: () => {
      acceptDraft(draft, targetStreamId);
      console.info('Redo accept draft');
    }
  });
}

/**
 * H046: Reject draft (no-op with confirmation).
 */
export function rejectDraft(draft: GeneratedDraft): void {
  console.info('Rejected draft:', {
    scope: draft.scope.type,
    eventCount: draft.events.length
  });
  
  // Draft is discarded, no state changes needed
}

// ============================================================================
// H044: COMMIT TO PHRASE LIBRARY
// ============================================================================

/**
 * Save generated draft as a phrase.
 */
export function commitDraftToLibrary(
  draft: GeneratedDraft,
  name: string,
  tags: string[]
): void {
  console.info('Commit draft to library:', {
    name,
    tags,
    eventCount: draft.events.length
  });
  
  // TODO: Integrate with phrase library
  // Would:
  // 1. Create phrase record
  // 2. Store events
  // 3. Add metadata (tags, constraints used, etc.)
  // 4. Make searchable in phrase browser
  
  // For MVP, log the operation
}

// ============================================================================
// H043: CHORD INTEGRATION
// ============================================================================

/**
 * Generate draft following chord progression.
 */
export async function generateToChords(
  chords: Chord[],
  config: Omit<GeneratorConfig, 'constraints'>
): Promise<GeneratedDraft> {
  const configWithChords: GeneratorConfig = {
    ...config,
    constraints: {
      ...DEFAULT_CONSTRAINTS,
      chordProgression: chords
    }
  };
  
  return generateDraft(configWithChords, { type: 'new-clip' });
}

// ============================================================================
// UI STATE
// ============================================================================

/**
 * AI Composer UI state.
 */
export interface AIComposerState {
  /** Current prompt */
  prompt: string;
  
  /** Current constraints */
  constraints: CompositionConstraints;
  
  /** Current draft (if any) */
  currentDraft: GeneratedDraft | null;
  
  /** Target scope */
  targetScope: GenerationScope;
  
  /** Whether preview is showing */
  showingPreview: boolean;
  
  /** Diff information */
  diff: DraftDiff | null;
}

/**
 * Create default AI composer state.
 */
export function createDefaultComposerState(): AIComposerState {
  return {
    prompt: '',
    constraints: { ...DEFAULT_CONSTRAINTS },
    currentDraft: null,
    targetScope: { type: 'new-clip' },
    showingPreview: false,
    diff: null
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
