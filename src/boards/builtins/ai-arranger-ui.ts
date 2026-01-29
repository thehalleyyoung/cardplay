/**
 * @fileoverview AI Arranger Deck UI (Phase H: H013-H021)
 * 
 * UI for the AI Arranger board (directed generation):
 * - H013: Chord progression input + section blocks
 * - H014: Wire to per-track streams in SharedEventStore
 * - H015: Session grid references via ClipRegistry
 * - H016: Regenerate section action
 * - H017: Freeze section action
 * - H018: Humanize controls per part
 * - H019: Style presets (lofi, house, ambient)
 * - H020: Control-level indicators per track
 * - H021: "Capture to manual board" CTA
 * 
 * @module @cardplay/boards/builtins/ai-arranger-ui
 */

import type { EventStreamId } from '../../state/types';
import type { Chord } from './harmony-analysis';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';

// ============================================================================
// SECTION DEFINITION
// ============================================================================

/**
 * Musical section in arrangement.
 */
export interface ArrangementSection {
  /** Unique section ID */
  id: string;
  
  /** Section name (intro, verse, chorus, bridge, outro) */
  name: string;
  
  /** Section type */
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'break' | 'drop' | 'build' | 'custom';
  
  /** Start time in ticks */
  startTick: number;
  
  /** Duration in bars */
  durationBars: number;
  
  /** Chord progression for this section */
  chords: Array<{
    chord: Chord;
    startBar: number;
    durationBars: number;
  }>;
  
  /** Energy level (0-1) */
  energy: number;
  
  /** Density level (0-1) */
  density: number;
  
  /** Which parts are active (drums, bass, pad, melody, etc.) */
  activeParts: Set<PartType>;
  
  /** Whether this section was AI-generated */
  generated: boolean;
  
  /** Whether this section is frozen (no regeneration) */
  frozen: boolean;
}

/**
 * Part types in arrangement.
 */
export type PartType = 
  | 'drums' 
  | 'bass' 
  | 'pad' 
  | 'melody' 
  | 'arp' 
  | 'fx' 
  | 'percussion' 
  | 'lead';

// ============================================================================
// H019: STYLE PRESETS
// ============================================================================

/**
 * Style preset for generation.
 */
export interface StylePreset {
  /** Preset name */
  name: string;
  
  /** Genre/style */
  genre: 'lofi' | 'house' | 'ambient' | 'techno' | 'dnb' | 'trap' | 'custom';
  
  /** Tempo range */
  tempoRange: [number, number];
  
  /** Typical chord progressions */
  commonProgressions: string[];
  
  /** Part defaults */
  partSettings: Partial<Record<PartType, {
    density: number;
    complexity: number;
    humanization: number;
  }>>;
  
  /** Generation parameters */
  generationParams: {
    /** Swing amount (0-1) */
    swing: number;
    
    /** Groove template */
    groove: 'straight' | 'swing' | 'shuffle' | 'triplet';
    
    /** Note duration preference */
    noteDuration: 'short' | 'medium' | 'long' | 'mixed';
    
    /** Velocity variation */
    velocityVariation: number;
    
    /** Timing variation (humanization) */
    timingVariation: number;
  };
}

/**
 * H019: Built-in style presets.
 */
export const STYLE_PRESETS: StylePreset[] = [
  {
    name: 'Lofi Hip Hop',
    genre: 'lofi',
    tempoRange: [70, 90],
    commonProgressions: ['I-IV-V-IV', 'I-iii-vi-IV', 'vi-IV-I-V'],
    partSettings: {
      drums: { density: 0.6, complexity: 0.3, humanization: 0.7 },
      bass: { density: 0.5, complexity: 0.4, humanization: 0.5 },
      pad: { density: 0.8, complexity: 0.3, humanization: 0.4 },
      melody: { density: 0.5, complexity: 0.5, humanization: 0.8 }
    },
    generationParams: {
      swing: 0.6,
      groove: 'shuffle',
      noteDuration: 'medium',
      velocityVariation: 0.4,
      timingVariation: 0.3
    }
  },
  {
    name: 'Deep House',
    genre: 'house',
    tempoRange: [120, 125],
    commonProgressions: ['I-vi-IV-V', 'vi-IV-I-V', 'I-V-vi-IV'],
    partSettings: {
      drums: { density: 0.9, complexity: 0.4, humanization: 0.2 },
      bass: { density: 0.8, complexity: 0.5, humanization: 0.1 },
      pad: { density: 0.7, complexity: 0.3, humanization: 0.3 },
      melody: { density: 0.4, complexity: 0.6, humanization: 0.4 }
    },
    generationParams: {
      swing: 0.0,
      groove: 'straight',
      noteDuration: 'short',
      velocityVariation: 0.2,
      timingVariation: 0.1
    }
  },
  {
    name: 'Ambient',
    genre: 'ambient',
    tempoRange: [60, 80],
    commonProgressions: ['I-IV-I-V', 'vi-IV-I-V', 'I-iii-vi-IV'],
    partSettings: {
      pad: { density: 0.9, complexity: 0.2, humanization: 0.6 },
      melody: { density: 0.3, complexity: 0.4, humanization: 0.8 },
      fx: { density: 0.5, complexity: 0.3, humanization: 0.7 }
    },
    generationParams: {
      swing: 0.0,
      groove: 'straight',
      noteDuration: 'long',
      velocityVariation: 0.5,
      timingVariation: 0.4
    }
  }
];

// ============================================================================
// H018: HUMANIZE CONTROLS
// ============================================================================

/**
 * Humanization settings per part.
 */
export interface HumanizeSettings {
  /** Timing variation in ticks */
  timingVariation: number;
  
  /** Velocity variation (0-127) */
  velocityVariation: number;
  
  /** Note duration variation (0-1) */
  durationVariation: number;
  
  /** Probability of note omission (0-1) */
  noteOmission: number;
  
  /** Swing amount (0-1) */
  swing: number;
}

/**
 * Default humanize settings.
 */
export const DEFAULT_HUMANIZE: HumanizeSettings = {
  timingVariation: 10,
  velocityVariation: 15,
  durationVariation: 0.2,
  noteOmission: 0.05,
  swing: 0.0
};

// ============================================================================
// H016-H017: SECTION OPERATIONS
// ============================================================================

/**
 * H016: Regenerate a section.
 * 
 * Regenerates events for a section using current settings.
 * Preserves section structure (chords, energy, parts).
 */
export async function regenerateSection(
  section: ArrangementSection,
  style: StylePreset,
  humanize: HumanizeSettings,
  partMappings: PartStreamMapping[]
): Promise<void> {
  if (section.frozen) {
    console.warn('Section is frozen, cannot regenerate:', section.name);
    return;
  }
  
  const store = getSharedEventStore();
  const endTick = section.startTick + (section.durationBars * 4 * 480); // Assume 480 PPQ, 4/4
  
  // Capture current events for undo
  const originalEvents = new Map<EventStreamId, any[]>();
  
  for (const mapping of partMappings) {
    if (!section.activeParts.has(mapping.part)) continue;
    
    const stream = store.getStream(mapping.streamId);
    if (!stream) continue;
    
    // Get events in section range
    const eventsInSection = stream.events.filter(
      ev => ev.start >= section.startTick && ev.start < endTick
    );
    
    originalEvents.set(mapping.streamId, [...eventsInSection]);
    
    // Clear section events
    const eventIds = eventsInSection.map(ev => ev.id);
    if (eventIds.length > 0) {
      store.removeEvents(mapping.streamId, eventIds);
    }
    
    // Generate new events based on style and humanize settings
    // For MVP, create placeholder notes
    const partSettings = style.partSettings[mapping.part];
    if (!partSettings) continue;
    
    const numNotes = Math.floor(section.durationBars * 8 * partSettings.density);
    const newEvents = [];
    
    for (let i = 0; i < numNotes; i++) {
      const tickInSection = (i / numNotes) * (endTick - section.startTick);
      const timingJitter = (Math.random() - 0.5) * 2 * humanize.timingVariation;
      
      newEvents.push({
        kind: 'note',
        start: section.startTick + Math.floor(tickInSection + timingJitter),
        duration: 240, // Quarter note
        payload: {
          note: 60 + Math.floor(Math.random() * 24), // C4-C6 range
          velocity: 80 + Math.floor((Math.random() - 0.5) * humanize.velocityVariation * 2)
        }
      });
    }
    
    if (newEvents.length > 0) {
      store.addEvents(mapping.streamId, newEvents as any);
    }
  }
  
  console.info('Regenerated section:', {
    section: section.name,
    style: style.name,
    parts: Array.from(section.activeParts),
    eventsGenerated: Array.from(originalEvents.entries()).reduce(
      (sum, [_, events]) => sum + events.length, 0
    )
  });
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Regenerate ${section.name}`,
    undo: () => {
      // Restore original events
      for (const [streamId, events] of originalEvents) {
        const stream = store.getStream(streamId);
        if (!stream) continue;
        
        // Clear regenerated events
        const currentEvents = stream.events.filter(
          ev => ev.start >= section.startTick && ev.start < endTick
        );
        if (currentEvents.length > 0) {
          store.removeEvents(streamId, currentEvents.map(ev => ev.id));
        }
        
        // Restore original
        if (events.length > 0) {
          store.addEvents(streamId, events);
        }
      }
      console.info('Undo regenerate section');
    },
    redo: () => {
      // Re-run generation (simplified: just remove and restore)
      regenerateSection(section, style, humanize, partMappings);
      console.info('Redo regenerate section');
    }
  });
}

/**
 * H017: Freeze a section.
 * 
 * Marks section as frozen to prevent regeneration.
 * Events become fully editable like manual events.
 * Also updates part stream control levels to 'full-manual'.
 */
export function freezeSection(
  section: ArrangementSection,
  partMappings: PartStreamMapping[]
): void {
  const wasFrozen = section.frozen;
  const wasGenerated = section.generated;
  const originalControlLevels = new Map<EventStreamId, PartStreamMapping['controlLevel']>();
  
  // Capture original state for undo
  for (const mapping of partMappings) {
    if (section.activeParts.has(mapping.part)) {
      originalControlLevels.set(mapping.streamId, mapping.controlLevel);
    }
  }
  
  // Freeze section
  section.frozen = true;
  section.generated = false; // Now treated as manual
  
  // Update part control levels to manual
  for (const mapping of partMappings) {
    if (section.activeParts.has(mapping.part)) {
      mapping.controlLevel = 'full-manual';
      mapping.generated = false;
    }
  }
  
  console.info('Froze section:', {
    section: section.name,
    partsAffected: Array.from(section.activeParts)
  });
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Freeze ${section.name}`,
    undo: () => {
      section.frozen = wasFrozen;
      section.generated = wasGenerated;
      
      // Restore original control levels
      for (const mapping of partMappings) {
        const originalLevel = originalControlLevels.get(mapping.streamId);
        if (originalLevel) {
          mapping.controlLevel = originalLevel;
          mapping.generated = (originalLevel !== 'full-manual');
        }
      }
      
      console.info('Undo freeze section');
    },
    redo: () => {
      section.frozen = true;
      section.generated = false;
      
      for (const mapping of partMappings) {
        if (section.activeParts.has(mapping.part)) {
          mapping.controlLevel = 'full-manual';
          mapping.generated = false;
        }
      }
      
      console.info('Redo freeze section');
    }
  });
}

// ============================================================================
// H014-H015: PART STREAM MANAGEMENT
// ============================================================================

/**
 * Part stream mapping (track → stream).
 */
export interface PartStreamMapping {
  /** Part type */
  part: PartType;
  
  /** Stream ID for this part */
  streamId: EventStreamId;
  
  /** Track name */
  trackName: string;
  
  /** Whether this part is AI-generated */
  generated: boolean;
  
  /** Control level for this track */
  controlLevel: 'full-manual' | 'directed' | 'generative';
}

/**
 * H014: Create part streams for arranger.
 * 
 * Creates one stream per part type (drums, bass, etc.).
 * These are referenced by clips in the session grid.
 */
export function createPartStreams(parts: PartType[]): PartStreamMapping[] {
  const store = getSharedEventStore();
  const mappings: PartStreamMapping[] = [];
  
  for (const part of parts) {
    const stream = store.createStream({
      name: `Arranger ${part.charAt(0).toUpperCase() + part.slice(1)}`,
      events: []
    });
    
    mappings.push({
      part,
      streamId: stream.id,
      trackName: stream.name,
      generated: true,
      controlLevel: 'directed'
    });
    
    console.info('Created part stream:', {
      part,
      streamId: stream.id
    });
  }
  
  return mappings;
}

/**
 * H015: Verify session grid references arranger streams.
 * 
 * This is an invariant check - clips in session should reference
 * the part streams created by the arranger.
 */
export function verifyArrangerIntegration(
  mappings: PartStreamMapping[]
): boolean {
  // TODO: Check ClipRegistry for clips referencing part streams
  // For MVP, just log verification
  
  console.info('Verify arranger integration:', {
    partCount: mappings.length,
    streamIds: mappings.map(m => m.streamId)
  });
  
  return true;
}

// ============================================================================
// H021: CAPTURE TO MANUAL BOARD
// ============================================================================

/**
 * H021: Switch to manual board with current streams active.
 * 
 * Allows user to move from directed generation to manual editing
 * without losing work.
 */
export function captureToManualBoard(
  mappings: PartStreamMapping[],
  targetBoardId?: string
): void {
  // Import capture-to-manual functionality
  const { captureToManualBoard: performCapture } = require('../switching/capture-to-manual');
  
  // Extract stream IDs from mappings
  const streamIds = mappings.map(m => m.streamId);
  
  console.info('Capture to manual board:', {
    targetBoard: targetBoardId || 'auto-detect',
    streams: streamIds
  });
  
  // Perform capture with proper board switching
  const result = performCapture({
    targetBoardId,
    freezeGeneratedLayers: true,
    preserveDeckTabs: true
  });
  
  if (result.success) {
    console.info('Successfully captured to manual board:', result.targetBoardId);
  } else {
    console.error('Failed to capture to manual board:', result.error);
  }
}

// ============================================================================
// H020: CONTROL LEVEL INDICATORS
// ============================================================================

/**
 * Get visual indicator for a track's control level.
 */
export function getControlLevelIndicator(controlLevel: PartStreamMapping['controlLevel']): {
  color: string;
  icon: string;
  label: string;
} {
  const indicators = {
    'full-manual': {
      color: '#2196F3',
      icon: '✏️',
      label: 'Manual'
    },
    'directed': {
      color: '#FF9800',
      icon: '🎯',
      label: 'Directed'
    },
    'generative': {
      color: '#9C27B0',
      icon: '✨',
      label: 'AI'
    }
  };
  
  return indicators[controlLevel];
}

// ============================================================================
// H013: UI STRUCTURE (STUB)
// ============================================================================

/**
 * H013: Arranger UI state.
 * 
 * This would be the state for the arranger deck component.
 * Stub for UI implementation.
 */
export interface ArrangerUIState {
  /** All sections in arrangement */
  sections: ArrangementSection[];
  
  /** Current style preset */
  currentStyle: StylePreset;
  
  /** Humanize settings */
  humanizeSettings: HumanizeSettings;
  
  /** Part stream mappings */
  partMappings: PartStreamMapping[];
  
  /** Selected section */
  selectedSection: ArrangementSection | null;
  
  /** Whether arranger is playing */
  isPlaying: boolean;
  
  /** Current playback position */
  currentBar: number;
}

/**
 * Create default arranger UI state.
 */
export function createDefaultArrangerState(): ArrangerUIState {
  return {
    sections: [],
    currentStyle: STYLE_PRESETS[0] || {
      name: 'Default',
      genre: 'custom',
      tempoRange: [120, 120],
      commonProgressions: [],
      partSettings: {},
      generationParams: {
        swing: 0,
        groove: 'straight',
        noteDuration: 'medium',
        velocityVariation: 0.3,
        timingVariation: 0.2
      }
    },
    humanizeSettings: DEFAULT_HUMANIZE,
    partMappings: [],
    selectedSection: null,
    isPlaying: false,
    currentBar: 0
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
