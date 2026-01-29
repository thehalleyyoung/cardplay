/**
 * @fileoverview Generative Ambient Board UI (Phase H: H062-H069)
 * 
 * UI for the Generative Ambient board (continuous generation):
 * - H062: Continuous generation loop proposing candidates
 * - H063: Accept action to commit candidate
 * - H064: Reject action to discard candidate
 * - H065: Capture live action (record time window)
 * - H066: Freeze layer action (stop updates, keep editable)
 * - H067: Regenerate layer action (with seed control)
 * - H068: Mood presets (drone, shimmer, granular, minimalist)
 * - H069: Visual generated badges and density meters
 * - H070: CPU guardrails and warnings
 * 
 * @module @cardplay/boards/builtins/generative-ambient-ui
 */

import type { EventStreamId } from '../../state/types';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { EventKinds } from '../../types/event-kind';

// ============================================================================
// H068: MOOD PRESETS
// ============================================================================

/**
 * Mood preset for generative ambient music.
 */
export interface MoodPreset {
  /** Preset name */
  name: string;
  
  /** Preset type */
  type: 'drone' | 'shimmer' | 'granular' | 'minimalist' | 'custom';
  
  /** Note density (notes per minute) */
  density: {
    min: number;
    max: number;
  };
  
  /** Pitch range */
  pitchRange: {
    low: number;  // MIDI note
    high: number; // MIDI note
  };
  
  /** Note duration range (in ticks) */
  durationRange: {
    min: number;
    max: number;
  };
  
  /** Velocity range */
  velocityRange: {
    min: number;
    max: number;
  };
  
  /** Harmonic density (0-1) */
  harmonicDensity: number;
  
  /** Randomness factor (0-1) */
  randomness: number;
  
  /** Tempo range (BPM) */
  tempoRange: [number, number];
}

/**
 * H068: Built-in mood presets.
 */
export const MOOD_PRESETS: MoodPreset[] = [
  {
    name: 'Drone',
    type: 'drone',
    density: { min: 1, max: 3 },
    pitchRange: { low: 24, high: 48 }, // C1 to C3
    durationRange: { min: 7680, max: 15360 }, // Very long notes (16-32 bars)
    velocityRange: { min: 40, max: 70 },
    harmonicDensity: 0.9,
    randomness: 0.1,
    tempoRange: [40, 60]
  },
  {
    name: 'Shimmer',
    type: 'shimmer',
    density: { min: 10, max: 30 },
    pitchRange: { low: 72, high: 96 }, // C5 to C7
    durationRange: { min: 240, max: 960 }, // Short notes (quarter to whole)
    velocityRange: { min: 50, max: 90 },
    harmonicDensity: 0.7,
    randomness: 0.5,
    tempoRange: [60, 80]
  },
  {
    name: 'Granular',
    type: 'granular',
    density: { min: 30, max: 60 },
    pitchRange: { low: 48, high: 84 }, // C3 to C6
    durationRange: { min: 60, max: 240 }, // Very short notes (16th to quarter)
    velocityRange: { min: 30, max: 80 },
    harmonicDensity: 0.4,
    randomness: 0.8,
    tempoRange: [80, 100]
  },
  {
    name: 'Minimalist',
    type: 'minimalist',
    density: { min: 2, max: 8 },
    pitchRange: { low: 48, high: 72 }, // C3 to C5
    durationRange: { min: 480, max: 1920 }, // Medium to long notes
    velocityRange: { min: 60, max: 80 },
    harmonicDensity: 0.6,
    randomness: 0.2,
    tempoRange: [60, 80]
  }
];

// ============================================================================
// GENERATIVE LAYER
// ============================================================================

/**
 * A continuously generating layer.
 */
export interface GenerativeLayer {
  /** Layer ID */
  id: string;
  
  /** Layer name */
  name: string;
  
  /** Stream ID for this layer */
  streamId: EventStreamId;
  
  /** Mood preset */
  mood: MoodPreset;
  
  /** Generation seed for reproducibility */
  seed: number;
  
  /** Whether layer is frozen (no more generation) */
  frozen: boolean;
  
  /** Whether layer is muted */
  muted: boolean;
  
  /** Current generation rate (events per second) */
  generationRate: number;
  
  /** Total events generated */
  totalEventsGenerated: number;
  
  /** Last generation timestamp */
  lastGenerationTime: number;
}

// ============================================================================
// CANDIDATE PROPOSAL
// ============================================================================

/**
 * A candidate phrase/clip proposal from continuous generation.
 */
export interface CandidateProposal {
  /** Candidate ID */
  id: string;
  
  /** Layer that generated this */
  layerId: string;
  
  /** Proposed events (will be cast to Event when accepted) */
  events: Array<{
    kind: string;
    start: number;
    duration: number;
    payload: any;
  }>;
  
  /** Time window (start/end in ticks) */
  timeWindow: {
    start: number;
    end: number;
  };
  
  /** Generation timestamp */
  timestamp: number;
  
  /** Quality score (0-1) */
  qualityScore: number;
}

// ============================================================================
// H062: CONTINUOUS GENERATION LOOP
// ============================================================================

/**
 * Generative ambient state.
 */
export interface GenerativeAmbientState {
  /** All layers */
  layers: GenerativeLayer[];
  
  /** Current candidates */
  candidates: CandidateProposal[];
  
  /** Whether generation is active */
  isGenerating: boolean;
  
  /** Global constraints */
  constraints: {
    maxLayers: number;
    maxEventsPerSecond: number;
    maxTotalEvents: number;
  };
  
  /** CPU usage estimate (0-1) */
  cpuUsage: number;
}

/**
 * Default generative state.
 */
export function createDefaultGenerativeState(): GenerativeAmbientState {
  return {
    layers: [],
    candidates: [],
    isGenerating: false,
    constraints: {
      maxLayers: 8,
      maxEventsPerSecond: 10,
      maxTotalEvents: 10000
    },
    cpuUsage: 0
  };
}

/**
 * H062: Start continuous generation for a layer.
 */
export function startLayerGeneration(layer: GenerativeLayer): void {
  if (layer.frozen) {
    console.warn('Layer is frozen, cannot generate:', layer.name);
    return;
  }
  
  console.info('Start layer generation:', {
    layer: layer.name,
    mood: layer.mood.name,
    seed: layer.seed
  });
  
  // In a real implementation, this would start a background timer/worker
  // For MVP, we log the start
}

/**
 * H062: Stop continuous generation for a layer.
 */
export function stopLayerGeneration(layer: GenerativeLayer): void {
  console.info('Stop layer generation:', layer.name);
  
  // Would stop the background generation timer/worker
}

/**
 * H062: Generate next candidate for a layer.
 */
export function generateNextCandidate(
  layer: GenerativeLayer,
  currentTick: number
): CandidateProposal {
  const { mood } = layer;
  
  // Simple generation based on mood
  const events = [];
  const windowDuration = 1920; // 4 bars
  const numNotes = Math.floor(
    mood.density.min + Math.random() * (mood.density.max - mood.density.min)
  );
  
  for (let i = 0; i < numNotes; i++) {
    const tickInWindow = Math.random() * windowDuration;
    const duration = Math.floor(
      mood.durationRange.min + Math.random() * (mood.durationRange.max - mood.durationRange.min)
    );
    const note = Math.floor(
      mood.pitchRange.low + Math.random() * (mood.pitchRange.high - mood.pitchRange.low)
    );
    const velocity = Math.floor(
      mood.velocityRange.min + Math.random() * (mood.velocityRange.max - mood.velocityRange.min)
    );
    
    events.push({
      kind: EventKinds.NOTE,
      start: currentTick + Math.floor(tickInWindow),
      duration,
      payload: { note, velocity }
    });
  }
  
  // Compute quality score (random for MVP)
  const qualityScore = 0.5 + Math.random() * 0.5;
  
  const candidate: CandidateProposal = {
    id: `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    layerId: layer.id,
    events,
    timeWindow: {
      start: currentTick,
      end: currentTick + windowDuration
    },
    timestamp: Date.now(),
    qualityScore
  };
  
  console.info('Generated candidate:', {
    layer: layer.name,
    eventCount: events.length,
    quality: qualityScore
  });
  
  return candidate;
}

// ============================================================================
// H063-H064: ACCEPT/REJECT CANDIDATE
// ============================================================================

/**
 * H063: Accept candidate and commit to layer stream.
 */
export function acceptCandidate(
  candidate: CandidateProposal,
  layer: GenerativeLayer
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(layer.streamId);
  
  if (!stream) {
    console.error('Layer stream not found:', layer.streamId);
    return;
  }
  
  // Add candidate events to stream
  store.addEvents(layer.streamId, candidate.events as any);
  
  layer.totalEventsGenerated += candidate.events.length;
  layer.lastGenerationTime = Date.now();
  
  console.info('Accepted candidate:', {
    candidateId: candidate.id,
    layer: layer.name,
    eventsAdded: candidate.events.length
  });
  
  // Wrap in undo
  const eventIds = stream.events.slice(-candidate.events.length).map(e => e.id);
  
  getUndoStack().push({
    type: 'batch',
    description: `Accept generated candidate`,
    undo: () => {
      store.removeEvents(layer.streamId, eventIds);
      layer.totalEventsGenerated -= candidate.events.length;
      console.info('Undo accept candidate');
    },
    redo: () => {
      store.addEvents(layer.streamId, candidate.events as any);
      layer.totalEventsGenerated += candidate.events.length;
      console.info('Redo accept candidate');
    }
  });
}

/**
 * H064: Reject candidate (discard without committing).
 */
export function rejectCandidate(candidate: CandidateProposal): void {
  console.info('Rejected candidate:', {
    candidateId: candidate.id,
    eventCount: candidate.events.length,
    quality: candidate.qualityScore
  });
  
  // Candidate is discarded, no state changes
}

// ============================================================================
// H065: CAPTURE LIVE
// ============================================================================

/**
 * H065: Capture a time window of generated output into a clip.
 */
export function captureLiveWindow(
  layer: GenerativeLayer,
  startTick: number,
  endTick: number
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(layer.streamId);
  
  if (!stream) {
    console.error('Layer stream not found:', layer.streamId);
    return;
  }
  
  // Get events in time window
  const capturedEvents = stream.events.filter(
    e => e.start >= startTick && e.start < endTick
  );
  
  console.info('Captured live window:', {
    layer: layer.name,
    startTick,
    endTick,
    eventsCaptured: capturedEvents.length
  });
  
  // Create clip in ClipRegistry referencing these events
  const { getClipRegistry } = require('../../state/clip-registry');
  const registry = getClipRegistry();
  
  const clipId = registry.createClip({
    name: `${layer.name} Live Capture`,
    streamId: layer.streamId,
    duration: endTick - startTick,
    loop: false
  });
  
  console.info('Created clip from capture:', clipId);
  
  // Add undo support
  getUndoStack().push({
    type: 'batch',
    description: `Capture live window: ${layer.name}`,
    undo: () => {
      registry.deleteClip(clipId);
      console.info('Undo capture live window');
    },
    redo: () => {
      // Note: We can't easily redo clip creation with same ID
      // In practice, undo/redo for clip creation needs clip ID preservation
      console.info('Redo capture live window (new clip would be created)');
    }
  });
}

// ============================================================================
// H066-H067: FREEZE/REGENERATE LAYER
// ============================================================================

/**
 * H066: Freeze layer (stop generation, keep events editable).
 */
export function freezeLayer(layer: GenerativeLayer): void {
  const wasFrozen = layer.frozen;
  
  layer.frozen = true;
  stopLayerGeneration(layer);
  
  console.info('Froze layer:', {
    layer: layer.name,
    totalEvents: layer.totalEventsGenerated
  });
  
  getUndoStack().push({
    type: 'batch',
    description: `Freeze layer ${layer.name}`,
    undo: () => {
      layer.frozen = wasFrozen;
      if (!wasFrozen) {
        startLayerGeneration(layer);
      }
      console.info('Undo freeze layer');
    },
    redo: () => {
      layer.frozen = true;
      stopLayerGeneration(layer);
      console.info('Redo freeze layer');
    }
  });
}

/**
 * H067: Regenerate layer with new seed.
 */
export function regenerateLayer(
  layer: GenerativeLayer,
  newSeed?: number
): void {
  if (layer.frozen) {
    console.warn('Layer is frozen, cannot regenerate:', layer.name);
    return;
  }
  
  const store = getSharedEventStore();
  const stream = store.getStream(layer.streamId);
  
  if (!stream) {
    console.error('Layer stream not found:', layer.streamId);
    return;
  }
  
  const oldSeed = layer.seed;
  const oldEvents = [...stream.events];
  
  // Update seed
  layer.seed = newSeed ?? Math.floor(Math.random() * 1000000);
  
  // Clear existing events
  if (stream.events.length > 0) {
    store.removeEvents(layer.streamId, stream.events.map(e => e.id));
  }
  
  layer.totalEventsGenerated = 0;
  
  console.info('Regenerated layer:', {
    layer: layer.name,
    oldSeed,
    newSeed: layer.seed
  });
  
  getUndoStack().push({
    type: 'batch',
    description: `Regenerate layer ${layer.name}`,
    undo: () => {
      layer.seed = oldSeed;
      const currentStream = store.getStream(layer.streamId);
      if (currentStream && currentStream.events.length > 0) {
        store.removeEvents(layer.streamId, currentStream.events.map(e => e.id));
      }
      if (oldEvents.length > 0) {
        store.addEvents(layer.streamId, oldEvents);
      }
      layer.totalEventsGenerated = oldEvents.length;
      console.info('Undo regenerate layer');
    },
    redo: () => {
      regenerateLayer(layer, layer.seed);
      console.info('Redo regenerate layer');
    }
  });
}

// ============================================================================
// H069: VISUAL INDICATORS
// ============================================================================

/**
 * Get visual indicator for layer state.
 */
export function getLayerIndicator(layer: GenerativeLayer): {
  badge: string;
  color: string;
  densityMeter: number; // 0-1
} {
  const badge = layer.frozen ? '❄️ Frozen' : 
                layer.muted ? '🔇 Muted' : 
                '✨ Generating';
  
  const color = layer.frozen ? '#607D8B' :
                layer.muted ? '#9E9E9E' :
                '#9C27B0';
  
  const densityMeter = Math.min(1, layer.generationRate / 10); // Normalize to 0-1
  
  return { badge, color, densityMeter };
}

// ============================================================================
// H070: CPU GUARDRAILS
// ============================================================================

/**
 * Check if generation should be throttled.
 */
export function checkCPUGuardrails(state: GenerativeAmbientState): {
  shouldThrottle: boolean;
  reason?: string;
} {
  const totalEvents = state.layers.reduce((sum, layer) => sum + layer.totalEventsGenerated, 0);
  const totalRate = state.layers.reduce((sum, layer) => sum + layer.generationRate, 0);
  
  if (totalEvents >= state.constraints.maxTotalEvents) {
    return {
      shouldThrottle: true,
      reason: `Max total events reached (${state.constraints.maxTotalEvents})`
    };
  }
  
  if (totalRate >= state.constraints.maxEventsPerSecond) {
    return {
      shouldThrottle: true,
      reason: `Max generation rate reached (${state.constraints.maxEventsPerSecond} events/sec)`
    };
  }
  
  if (state.cpuUsage > 0.8) {
    return {
      shouldThrottle: true,
      reason: 'High CPU usage detected'
    };
  }
  
  return { shouldThrottle: false };
}

// ============================================================================
// EXPORTS
// ============================================================================
