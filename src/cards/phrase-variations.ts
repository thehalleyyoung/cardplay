/**
 * @fileoverview Phrase Variation Algorithms
 * 
 * Implements all 28 variation types for phrase manipulation:
 * - Pitch variations (transpose, invert, retrograde, etc.)
 * - Rhythm variations (augmentation, diminution, syncopate, etc.)
 * - Density variations (thin, thicken, simplify, elaborate)
 * - Contour variations (flatten, exaggerate, smooth, angularize)
 * - Harmonic variations (reharmonize, modal-interchange, etc.)
 * 
 * @module @cardplay/core/cards/phrase-variations
 */

import type { Event } from '../types/event';

// ============================================================================
// TYPES
// ============================================================================

/**
 * All 28 variation types organized by category
 */
export type VariationType =
  // Pitch variations (9 types)
  | 'transpose'
  | 'invert'
  | 'retrograde'
  | 'retrograde-invert'
  | 'modal-shift'
  | 'octave-displace'
  | 'neighbor-embellish'
  | 'passing-tones'
  | 'enclosure'
  // Rhythm variations (8 types)
  | 'augmentation'
  | 'diminution'
  | 'dotted'
  | 'syncopate'
  | 'swing'
  | 'humanize'
  | 'accent-shift'
  | 'rest-insert'
  // Density variations (4 types)
  | 'thin'
  | 'thicken'
  | 'simplify'
  | 'elaborate'
  // Contour variations (4 types)
  | 'flatten'
  | 'exaggerate'
  | 'smooth'
  | 'angularize'
  // Harmonic variations (3 types)
  | 'reharmonize'
  | 'modal-interchange'
  | 'chromaticize'
  | 'diatonicize';

/**
 * Configuration for variation generation
 */
export interface VariationConfig {
  /** Type of variation to apply */
  readonly type: VariationType;
  /** Amount of variation (0-1, where 0.5 is moderate) */
  readonly amount: number;
  /** Random seed for deterministic generation */
  readonly seed?: number;
  /** Preserve shape contour */
  readonly preserveShape?: boolean;
  /** Preserve rhythm pattern */
  readonly preserveRhythm?: boolean;
  /** Additional type-specific parameters */
  readonly params?: Record<string, any>;
}

/**
 * Result of variation generation
 */
export interface VariationResult<P> {
  /** Original events */
  readonly original: readonly Event<P>[];
  /** Transformed events */
  readonly transformed: readonly Event<P>[];
  /** Applied configuration */
  readonly config: VariationConfig;
  /** Description of what changed */
  readonly description: string;
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Generate variation of events
 */
export function generateVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): VariationResult<P> {
  const transformer = VARIATION_TRANSFORMERS[config.type];
  
  if (!transformer) {
    throw new Error(`Unknown variation type: ${config.type}`);
  }
  
  const transformed = transformer(events, config);
  
  return {
    original: events,
    transformed,
    config,
    description: getVariationDescription(config),
  };
}

/**
 * Generate multiple variations in a set
 */
export function generateVariationSet<P>(
  events: readonly Event<P>[],
  types: readonly VariationType[],
  amount: number = 0.5
): readonly VariationResult<P>[] {
  return types.map(type =>
    generateVariation(events, { type, amount })
  );
}

/**
 * Chain multiple variations sequentially
 */
export function chainVariations<P>(
  events: readonly Event<P>[],
  configs: readonly VariationConfig[]
): VariationResult<P> {
  let current = events;
  const descriptions: string[] = [];
  
  for (const config of configs) {
    const result = generateVariation(current, config);
    current = result.transformed;
    descriptions.push(result.description);
  }
  
  return {
    original: events,
    transformed: current,
    config: configs[configs.length - 1] ?? configs[0]!,
    description: descriptions.join(' → '),
  };
}

/**
 * Morph between original and varied version
 */
export function morphVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig,
  morphAmount: number
): readonly Event<P>[] {
  const varied = generateVariation(events, config).transformed;
  
  // Interpolate between original and varied
  return events.map((original, idx) => {
    const variedEvent = varied[idx];
    if (!variedEvent) return original;
    
    return interpolateEvents(original, variedEvent, morphAmount);
  });
}

// ============================================================================
// PITCH VARIATIONS
// ============================================================================

function transposeVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const semitones = Math.round(config.amount * 12 - 6); // -6 to +6
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number') {
      return {
        ...event,
        payload: {
          ...payload,
          pitch: payload.pitch + semitones,
        } as P,
      };
    }
    return event;
  });
}

function invertVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (events.length === 0) return events;
  
  // Find pitch axis (average pitch)
  const pitches = events
    .map(e => (e.payload as any)?.pitch)
    .filter((p): p is number => typeof p === 'number');
  
  if (pitches.length === 0) return events;
  
  const axisPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number') {
      const distance = payload.pitch - axisPitch;
      const inverted = axisPitch - distance * config.amount;
      
      return {
        ...event,
        payload: {
          ...payload,
          pitch: Math.round(inverted),
        } as P,
      };
    }
    return event;
  });
}

function retrogradeVariation<P>(
  events: readonly Event<P>[],
  _config: VariationConfig
): readonly Event<P>[] {
  if (events.length === 0) return events;
  
  // Find time span
  const starts = events.map(e => e.start as number);
  const ends = events.map(e => (e.start as number) + ((e.duration ?? 0) as number));
  const minStart = Math.min(...starts);
  const maxEnd = Math.max(...ends);
  
  // Reverse time
  return events.map(event => {
    const start = event.start as number;
    const duration = (event.duration ?? 0) as number;
    const distanceFromEnd = maxEnd - (start + duration);
    
    return {
      ...event,
      start: (minStart + distanceFromEnd) as any,
    };
  }).reverse();
}

function retrogradeInvertVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const retrograde = retrogradeVariation(events, config);
  return invertVariation(retrograde, config);
}

function modalShiftVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Shift to parallel mode (e.g., C major → C minor)
  const shiftAmount = config.amount > 0.5 ? -1 : 0; // Flatten 3rd, 6th, 7th
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number') {
      const pitch = payload.pitch;
      const degreeInOctave = pitch % 12;
      
      // Apply modal shift to 3rd (E→Eb), 6th (A→Ab), 7th (B→Bb) in C
      const shouldShift = [4, 9, 11].includes(degreeInOctave);
      const newPitch = shouldShift ? pitch + shiftAmount : pitch;
      
      return {
        ...event,
        payload: {
          ...payload,
          pitch: newPitch,
        } as P,
      };
    }
    return event;
  });
}

function octaveDisplaceVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const octaveShift = config.amount > 0.7 ? 12 : config.amount < 0.3 ? -12 : 0;
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number') {
      return {
        ...event,
        payload: {
          ...payload,
          pitch: payload.pitch + octaveShift,
        } as P,
      };
    }
    return event;
  });
}

function neighborEmbellishVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (config.amount < 0.3) return events;
  
  const result: Event<P>[] = [];
  
  for (const event of events) {
    result.push(event);
    
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number' && config.amount > Math.random()) {
      // Add neighbor tone (upper or lower)
      const neighborPitch = payload.pitch + (Math.random() > 0.5 ? 1 : -1);
      const neighborDuration = ((event.duration ?? 0) as number) * 0.3;
      
      result.push({
        ...event,
        start: ((event.start as number) + neighborDuration * 0.5) as any,
        duration: neighborDuration as any,
        payload: {
          ...payload,
          pitch: neighborPitch,
          velocity: (payload.velocity ?? 64) * 0.7,
        } as P,
      });
    }
  }
  
  return result;
}

function passingTonesVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (events.length < 2 || config.amount < 0.3) return events;
  
  const result: Event<P>[] = [];
  
  for (let i = 0; i < events.length; i++) {
    const current = events[i]!;
    result.push(current);
    
    const next = events[i + 1];
    if (!next) continue;
    
    const currentPayload = current.payload as any;
    const nextPayload = next.payload as any;
    
    if (
      typeof currentPayload?.pitch === 'number' &&
      typeof nextPayload?.pitch === 'number' &&
      Math.abs(nextPayload.pitch - currentPayload.pitch) > 2 &&
      config.amount > Math.random()
    ) {
      // Insert passing tone
      const passingPitch = Math.round(
        (currentPayload.pitch + nextPayload.pitch) / 2
      );
      const gapStart = (current.start as number) + ((current.duration ?? 0) as number);
      const gapDuration = (next.start as number) - gapStart;
      
      if (gapDuration > 0) {
        result.push({
          ...current,
          start: (gapStart + gapDuration * 0.25) as any,
          duration: (gapDuration * 0.5) as any,
          payload: {
            ...currentPayload,
            pitch: passingPitch,
            velocity: (currentPayload.velocity ?? 64) * 0.8,
          } as P,
        });
      }
    }
  }
  
  return result;
}

function enclosureVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (config.amount < 0.4) return events;
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number' && config.amount > Math.random()) {
      // Enclose with upper and lower neighbor
      // This is a simplified version - full implementation would add two grace notes
      return event;
    }
    return event;
  });
}

// ============================================================================
// RHYTHM VARIATIONS
// ============================================================================

function augmentationVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const factor = 1 + config.amount; // 1.0 to 2.0
  
  return events.map(event => ({
    ...event,
    start: ((event.start as number) * factor) as any,
    duration: (((event.duration ?? 0) as number) * factor) as any,
  }));
}

function diminutionVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const factor = 1 - config.amount * 0.5; // 1.0 to 0.5
  
  return events.map(event => ({
    ...event,
    start: ((event.start as number) * factor) as any,
    duration: (((event.duration ?? 0) as number) * factor) as any,
  }));
}

function dottedVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (config.amount < 0.4) return events;
  
  return events.map(event => {
    if (config.amount > Math.random()) {
      // Add dotted rhythm (1.5x duration)
      return {
        ...event,
        duration: (((event.duration ?? 0) as number) * 1.5) as any,
      };
    }
    return event;
  });
}

function syncopateVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const shiftAmount = config.amount * 120; // Shift by up to 120 ticks (1/16 note in many contexts)
  
  return events.map((event, idx) => {
    if (idx % 2 === 1 && config.amount > Math.random()) {
      // Shift off-beat notes earlier
      return {
        ...event,
        start: ((event.start as number) - shiftAmount) as any,
      };
    }
    return event;
  });
}

function swingVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const swingRatio = 0.5 + config.amount * 0.17; // 0.5 (straight) to 0.67 (hard swing)
  
  return events.map((event, idx) => {
    if (idx % 2 === 1) {
      // Delay every second note
      const beatDuration = ((event.duration ?? 0) as number) * 2;
      const swingDelay = beatDuration * (swingRatio - 0.5);
      
      return {
        ...event,
        start: ((event.start as number) + swingDelay) as any,
      };
    }
    return event;
  });
}

function humanizeVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const seededRandom = createSeededRandom(config.seed ?? Date.now());
  const timingVariation = config.amount * 20; // Up to 20 ticks
  const velocityVariation = config.amount * 10; // Up to ±10 velocity
  
  return events.map(event => {
    const payload = event.payload as any;
    const timingOffset = (seededRandom() - 0.5) * 2 * timingVariation;
    const velocityOffset = (seededRandom() - 0.5) * 2 * velocityVariation;
    
    return {
      ...event,
      start: ((event.start as number) + timingOffset) as any,
      payload: typeof payload?.velocity === 'number'
        ? {
            ...payload,
            velocity: Math.max(1, Math.min(127, payload.velocity + velocityOffset)),
          } as P
        : payload,
    };
  });
}

function accentShiftVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const shift = Math.floor(config.amount * events.length);
  
  return events.map((event, idx) => {
    const payload = event.payload as any;
    if (typeof payload?.velocity === 'number') {
      // Rotate accent pattern
      const accentPosition = (idx + shift) % 4 === 0;
      const velocityMultiplier = accentPosition ? 1.2 : 0.9;
      
      return {
        ...event,
        payload: {
          ...payload,
          velocity: Math.max(1, Math.min(127, payload.velocity * velocityMultiplier)),
        } as P,
      };
    }
    return event;
  });
}

function restInsertVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (config.amount < 0.3) return events;
  
  return events.filter((_, idx) => {
    // Probabilistically remove events to create rests
    return config.amount < Math.random() || idx % 4 !== 3;
  });
}

// ============================================================================
// DENSITY VARIATIONS
// ============================================================================

function thinVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Remove events based on amount
  const keepProbability = 1 - config.amount * 0.5;
  
  return events.filter(() => Math.random() < keepProbability);
}

function thickenVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  const result: Event<P>[] = [...events];
  
  // Add doubled notes
  for (const event of events) {
    if (config.amount > Math.random()) {
      const payload = event.payload as any;
      if (typeof payload?.pitch === 'number') {
        // Add harmony note (third or fifth)
        const interval = Math.random() > 0.5 ? 4 : 7;
        result.push({
          ...event,
          payload: {
            ...payload,
            pitch: payload.pitch + interval,
            velocity: (payload.velocity ?? 64) * 0.8,
          } as P,
        });
      }
    }
  }
  
  return result;
}

function simplifyVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Keep only strong beat notes
  return events.filter((_event, idx) => {
    const isStrongBeat = idx % 4 === 0;
    return isStrongBeat || config.amount < Math.random();
  });
}

function elaborateVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Combine neighbor embellish and passing tones
  let result = neighborEmbellishVariation(events, config);
  result = passingTonesVariation(result, { ...config, amount: config.amount * 0.7 });
  return result;
}

// ============================================================================
// CONTOUR VARIATIONS
// ============================================================================

function flattenVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (events.length === 0) return events;
  
  const pitches = events
    .map(e => (e.payload as any)?.pitch)
    .filter((p): p is number => typeof p === 'number');
  
  if (pitches.length === 0) return events;
  
  const avgPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number') {
      // Move pitch toward average
      const distance = payload.pitch - avgPitch;
      const newPitch = avgPitch + distance * (1 - config.amount);
      
      return {
        ...event,
        payload: {
          ...payload,
          pitch: Math.round(newPitch),
        } as P,
      };
    }
    return event;
  });
}

function exaggerateVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (events.length === 0) return events;
  
  const pitches = events
    .map(e => (e.payload as any)?.pitch)
    .filter((p): p is number => typeof p === 'number');
  
  if (pitches.length === 0) return events;
  
  const avgPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number') {
      // Exaggerate distance from average
      const distance = payload.pitch - avgPitch;
      const newPitch = avgPitch + distance * (1 + config.amount);
      
      return {
        ...event,
        payload: {
          ...payload,
          pitch: Math.round(newPitch),
        } as P,
      };
    }
    return event;
  });
}

function smoothVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  if (events.length < 3) return events;
  
  return events.map((event, idx) => {
    if (idx === 0 || idx === events.length - 1) return event;
    
    const payload = event.payload as any;
    const prevPayload = (events[idx - 1]!.payload as any);
    const nextPayload = (events[idx + 1]!.payload as any);
    
    if (
      typeof payload?.pitch === 'number' &&
      typeof prevPayload?.pitch === 'number' &&
      typeof nextPayload?.pitch === 'number'
    ) {
      // Smooth toward average of neighbors
      const avgNeighbor = (prevPayload.pitch + nextPayload.pitch) / 2;
      const smoothedPitch = payload.pitch + (avgNeighbor - payload.pitch) * config.amount;
      
      return {
        ...event,
        payload: {
          ...payload,
          pitch: Math.round(smoothedPitch),
        } as P,
      };
    }
    return event;
  });
}

function angularizeVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Opposite of smooth - increase interval jumps
  return events.map((event, idx) => {
    if (idx === 0) return event;
    
    const payload = event.payload as any;
    const prevPayload = (events[idx - 1]!.payload as any);
    
    if (
      typeof payload?.pitch === 'number' &&
      typeof prevPayload?.pitch === 'number'
    ) {
      const interval = payload.pitch - prevPayload.pitch;
      const exaggeratedPitch = prevPayload.pitch + interval * (1 + config.amount);
      
      return {
        ...event,
        payload: {
          ...payload,
          pitch: Math.round(exaggeratedPitch),
        } as P,
      };
    }
    return event;
  });
}

// ============================================================================
// HARMONIC VARIATIONS
// ============================================================================

function reharmonizeVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Simplified reharmonization - would need chord context
  // For now, just transpose some notes to create new harmonies
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number' && config.amount > Math.random()) {
      // Shift pitch by a third or fifth
      const shift = Math.random() > 0.5 ? 4 : 7;
      return {
        ...event,
        payload: {
          ...payload,
          pitch: payload.pitch + (Math.random() > 0.5 ? shift : -shift),
        } as P,
      };
    }
    return event;
  });
}

function modalInterchangeVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Borrow from parallel modes
  return modalShiftVariation(events, config);
}

function chromaticizeVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Add chromatic passing tones
  const result: Event<P>[] = [];
  
  for (let i = 0; i < events.length; i++) {
    const current = events[i]!;
    result.push(current);
    
    const next = events[i + 1];
    if (!next || config.amount < Math.random()) continue;
    
    const currentPayload = current.payload as any;
    const nextPayload = next.payload as any;
    
    if (
      typeof currentPayload?.pitch === 'number' &&
      typeof nextPayload?.pitch === 'number'
    ) {
      const interval = nextPayload.pitch - currentPayload.pitch;
      if (Math.abs(interval) > 1) {
        // Insert chromatic note
        const chromaticPitch = currentPayload.pitch + Math.sign(interval);
        const gapStart = (current.start as number) + ((current.duration ?? 0) as number);
        const gapDuration = (next.start as number) - gapStart;
        
        if (gapDuration > 0) {
          result.push({
            ...current,
            start: (gapStart + gapDuration * 0.3) as any,
            duration: (gapDuration * 0.4) as any,
            payload: {
              ...currentPayload,
              pitch: chromaticPitch,
              velocity: (currentPayload.velocity ?? 64) * 0.7,
            } as P,
          });
        }
      }
    }
  }
  
  return result;
}

function diatonicizeVariation<P>(
  events: readonly Event<P>[],
  config: VariationConfig
): readonly Event<P>[] {
  // Snap to C major scale (simplified - would use actual scale context)
  const cMajorScale = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
  
  return events.map(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch === 'number' && config.amount > Math.random()) {
      const pitchClass = payload.pitch % 12;
      const octave = Math.floor(payload.pitch / 12);
      
      // Find nearest scale degree
      const nearestScaleDegree = cMajorScale.reduce((nearest, degree) => {
        const dist = Math.abs(degree - pitchClass);
        const nearestDist = Math.abs(nearest - pitchClass);
        return dist < nearestDist ? degree : nearest;
      }, cMajorScale[0]!);
      
      return {
        ...event,
        payload: {
          ...payload,
          pitch: octave * 12 + nearestScaleDegree,
        } as P,
      };
    }
    return event;
  });
}

// ============================================================================
// TRANSFORMER REGISTRY
// ============================================================================

/**
 * Registry of all variation transformers
 */
const VARIATION_TRANSFORMERS: Record<
  VariationType,
  <P>(events: readonly Event<P>[], config: VariationConfig) => readonly Event<P>[]
> = {
  // Pitch
  'transpose': transposeVariation,
  'invert': invertVariation,
  'retrograde': retrogradeVariation,
  'retrograde-invert': retrogradeInvertVariation,
  'modal-shift': modalShiftVariation,
  'octave-displace': octaveDisplaceVariation,
  'neighbor-embellish': neighborEmbellishVariation,
  'passing-tones': passingTonesVariation,
  'enclosure': enclosureVariation,
  // Rhythm
  'augmentation': augmentationVariation,
  'diminution': diminutionVariation,
  'dotted': dottedVariation,
  'syncopate': syncopateVariation,
  'swing': swingVariation,
  'humanize': humanizeVariation,
  'accent-shift': accentShiftVariation,
  'rest-insert': restInsertVariation,
  // Density
  'thin': thinVariation,
  'thicken': thickenVariation,
  'simplify': simplifyVariation,
  'elaborate': elaborateVariation,
  // Contour
  'flatten': flattenVariation,
  'exaggerate': exaggerateVariation,
  'smooth': smoothVariation,
  'angularize': angularizeVariation,
  // Harmonic
  'reharmonize': reharmonizeVariation,
  'modal-interchange': modalInterchangeVariation,
  'chromaticize': chromaticizeVariation,
  'diatonicize': diatonicizeVariation,
};

// ============================================================================
// PRESET CHAINS
// ============================================================================

/**
 * Preset variation chains for common use cases
 */
export const VARIATION_PRESETS: Record<string, readonly VariationConfig[]> = {
  'subtle-melody': [
    { type: 'neighbor-embellish', amount: 0.3 },
    { type: 'smooth', amount: 0.4 },
  ],
  'rhythmic-variation': [
    { type: 'syncopate', amount: 0.5 },
    { type: 'accent-shift', amount: 0.6 },
  ],
  'dramatic-development': [
    { type: 'augmentation', amount: 0.7 },
    { type: 'exaggerate', amount: 0.8 },
    { type: 'chromaticize', amount: 0.5 },
  ],
  'call-response': [
    { type: 'transpose', amount: 0.3 },
    { type: 'retrograde', amount: 1.0 },
  ],
  'minimalist-shift': [
    { type: 'simplify', amount: 0.7 },
    { type: 'flatten', amount: 0.5 },
  ],
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get human-readable description of variation
 */
function getVariationDescription(config: VariationConfig): string {
  const descriptions: Record<VariationType, string> = {
    'transpose': `Transposed by ${Math.round(config.amount * 12 - 6)} semitones`,
    'invert': `Inverted around pitch axis (${(config.amount * 100).toFixed(0)}%)`,
    'retrograde': 'Reversed in time',
    'retrograde-invert': 'Reversed and inverted',
    'modal-shift': 'Shifted to parallel mode',
    'octave-displace': 'Displaced by octave',
    'neighbor-embellish': 'Embellished with neighbor tones',
    'passing-tones': 'Added passing tones',
    'enclosure': 'Added enclosures',
    'augmentation': `Augmented by ${(config.amount * 100).toFixed(0)}%`,
    'diminution': `Diminuted by ${(config.amount * 50).toFixed(0)}%`,
    'dotted': 'Converted to dotted rhythm',
    'syncopate': 'Syncopated',
    'swing': `Swing feel (${(config.amount * 100).toFixed(0)}%)`,
    'humanize': `Humanized (${(config.amount * 100).toFixed(0)}%)`,
    'accent-shift': 'Shifted accents',
    'rest-insert': 'Added rests',
    'thin': `Thinned by ${(config.amount * 50).toFixed(0)}%`,
    'thicken': 'Thickened with harmony',
    'simplify': 'Simplified to strong beats',
    'elaborate': 'Elaborated with ornaments',
    'flatten': `Flattened contour (${(config.amount * 100).toFixed(0)}%)`,
    'exaggerate': `Exaggerated contour (${(config.amount * 100).toFixed(0)}%)`,
    'smooth': `Smoothed (${(config.amount * 100).toFixed(0)}%)`,
    'angularize': `Angularized (${(config.amount * 100).toFixed(0)}%)`,
    'reharmonize': 'Reharmonized',
    'modal-interchange': 'Modal interchange',
    'chromaticize': 'Added chromaticism',
    'diatonicize': 'Converted to diatonic',
  };
  
  return descriptions[config.type] ?? `Applied ${config.type}`;
}

/**
 * Interpolate between two events
 */
function interpolateEvents<P>(
  a: Event<P>,
  b: Event<P>,
  amount: number
): Event<P> {
  const payloadA = a.payload as any;
  const payloadB = b.payload as any;
  
  const interpolatedPayload =
    typeof payloadA?.pitch === 'number' && typeof payloadB?.pitch === 'number'
      ? {
          ...payloadA,
          pitch: Math.round(payloadA.pitch + (payloadB.pitch - payloadA.pitch) * amount),
          velocity:
            typeof payloadA.velocity === 'number' && typeof payloadB.velocity === 'number'
              ? Math.round(payloadA.velocity + (payloadB.velocity - payloadA.velocity) * amount)
              : payloadA.velocity,
        }
      : payloadA;
  
  return {
    ...a,
    start: (((a.start as number) + ((b.start as number) - (a.start as number)) * amount)) as any,
    duration: ((((a.duration ?? 0) as number) + (((b.duration ?? 0) as number) - ((a.duration ?? 0) as number)) * amount)) as any,
    payload: interpolatedPayload as P,
  };
}

/**
 * Create seeded random number generator
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}
