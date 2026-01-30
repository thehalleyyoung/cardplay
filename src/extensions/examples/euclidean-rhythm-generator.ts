/**
 * @fileoverview Example Extension: Euclidean Rhythm Generator
 * 
 * Demonstrates how to create a custom generator extension that creates
 * Euclidean rhythm patterns.
 * 
 * @module @cardplay/extensions/examples/euclidean-rhythm
 */

import type {
  ExtensionModule,
  ExtensionContext,
  GeneratorExtensionDefinition,
  GeneratorParameter
} from '../types';

// ============================================================================
// EUCLIDEAN RHYTHM GENERATOR
// ============================================================================

/**
 * Generates Euclidean rhythm patterns using Bjorklund's algorithm.
 * 
 * Euclidean rhythms distribute k pulses as evenly as possible among n steps.
 * Examples:
 * - E(3,8) = [x . . x . . x .] (tresillo pattern)
 * - E(5,8) = [x . x x . x x .] (cinquillo pattern)
 */
function generateEuclideanRhythm(pulses: number, steps: number, rotation: number = 0): boolean[] {
  if (pulses >= steps) {
    return new Array(steps).fill(true);
  }

  const pattern: boolean[] = new Array(steps).fill(false);
  const bucket = new Array(steps).fill(0);

  for (let i = 0; i < steps; i++) {
    bucket[i] = Math.floor((i * pulses) / steps);
  }

  for (let i = 0; i < steps; i++) {
    const prev = i > 0 ? bucket[i - 1] : -1;
    if (bucket[i] !== prev) {
      pattern[i] = true;
    }
  }

  // Apply rotation
  if (rotation !== 0) {
    const rotated = new Array(steps).fill(false);
    for (let i = 0; i < steps; i++) {
      const sourceIndex = i;
      const targetIndex = (i + rotation) % steps;
      rotated[targetIndex] = pattern[sourceIndex] ?? false;
    }
    return rotated;
  }

  return pattern;
}

/**
 * Converts boolean rhythm pattern to MIDI events.
 */
function patternToMIDIEvents(
  pattern: boolean[],
  noteNumber: number,
  velocity: number,
  startTick: number,
  ticksPerStep: number
): any[] {
  const events: any[] = [];

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === true) {
      events.push({
        kind: 'note',
        start: startTick + i * ticksPerStep,
        duration: Math.floor(ticksPerStep * 0.8), // 80% of step duration
        payload: {
          note: noteNumber,
          velocity,
          channel: 0
        }
      });
    }
  }

  return events;
}

// ============================================================================
// EXTENSION DEFINITION
// ============================================================================

const parameters: readonly GeneratorParameter[] = [
  {
    id: 'pulses',
    name: 'Pulses',
    type: 'number',
    min: 1,
    max: 32,
    default: 5
  },
  {
    id: 'steps',
    name: 'Steps',
    type: 'number',
    min: 1,
    max: 32,
    default: 8
  },
  {
    id: 'rotation',
    name: 'Rotation',
    type: 'number',
    min: 0,
    max: 31,
    default: 0
  },
  {
    id: 'note',
    name: 'Note',
    type: 'number',
    min: 0,
    max: 127,
    default: 60
  },
  {
    id: 'velocity',
    name: 'Velocity',
    type: 'number',
    min: 1,
    max: 127,
    default: 100
  },
  {
    id: 'ticksPerStep',
    name: 'Ticks Per Step',
    type: 'number',
    min: 1,
    max: 960,
    default: 120
  }
];

const euclideanGenerator: GeneratorExtensionDefinition = {
  id: 'euclidean-rhythm',
  name: 'Euclidean Rhythm Generator',
  description: 'Generates rhythmic patterns using Bjorklund\'s Euclidean algorithm',
  parameters,
  generate: (params: any) => {
    const pattern = generateEuclideanRhythm(
      params.pulses ?? 5,
      params.steps ?? 8,
      params.rotation ?? 0
    );

    return patternToMIDIEvents(
      pattern,
      params.note ?? 60,
      params.velocity ?? 100,
      0, // Start at beginning
      params.ticksPerStep ?? 120
    );
  }
};

// ============================================================================
// EXTENSION MODULE
// ============================================================================

const extension: ExtensionModule = {
  activate(context: ExtensionContext) {
    console.log(`Activating Euclidean Rhythm Generator (${context.extensionId})`);

    // Register generator with CardPlay
    if (context.cardplay.ui) {
      // In a real implementation, this would register the generator
      // with the generator system so it appears in generator decks
      console.log('Generator registered:', euclideanGenerator.id);
    }
  },

  deactivate() {
    console.log('Deactivating Euclidean Rhythm Generator');
    // Clean up: unregister generator, remove UI elements, etc.
  }
};

export default extension;

// ============================================================================
// MANIFEST (typically in extension.json)
// ============================================================================

export const manifest = {
  id: 'com.cardplay.euclidean-rhythm',
  name: 'Euclidean Rhythm Generator',
  version: '1.0.0',
  author: 'CardPlay Team',
  description: 'Generate Euclidean rhythm patterns using Bjorklund\'s algorithm',
  category: 'generator',
  tags: ['rhythm', 'euclidean', 'pattern', 'generator', 'drums'],
  license: 'MIT',
  cardplayVersion: '>=1.0.0',
  permissions: ['ui-extension'],
  entryPoint: 'index.js'
};
